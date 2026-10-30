import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { desdeISO, fechaISO, sumarDias, totalesDelDia } from '../../../domain/planificacion/plan.model';
import { Receta } from '../../../domain/recetas/receta.model';
import { CabeceraSeccionComponent } from '../../ui/cabecera-seccion.component';
import { emojiFranja } from '../../ui/emojis';
import { EstadoRecetaComponent } from '../../ui/estado-receta.component';
import { FotoComponent } from '../../ui/foto.component';
import { NumeroPipe } from '../../ui/numero.pipe';

/** Días que se muestran después de hoy en "Próximos días". */
const DIAS_SIGUIENTES = 6;
/** Recetas del carrusel de sugerencias. */
const MAX_SUGERENCIAS = 8;

/** Qué franja se sugiere según la hora: desayuno temprano, el almuerzo (segundo) el resto del día. */
function momentoDelDia(hora: number): { franja: string; titulo: string; saludo: string } {
  if (hora < 11) return { franja: 'desayuno', titulo: 'Para tu desayuno', saludo: 'Buenos días' };
  if (hora < 12) return { franja: 'seco', titulo: 'Para tu almuerzo', saludo: 'Buenos días' };
  if (hora < 16) return { franja: 'seco', titulo: 'Para tu almuerzo', saludo: 'Buenas tardes' };
  // La app planifica desayuno y almuerzo (sin cena): por la tarde se piensa en el de mañana.
  if (hora < 19) return { franja: 'seco', titulo: 'Para el almuerzo de mañana', saludo: 'Buenas tardes' };
  return { franja: 'seco', titulo: 'Para el almuerzo de mañana', saludo: 'Buenas noches' };
}

/** Pantalla 04A (GxJ90): saludo, buscador, cocinas, sugerencias con la despensa y el día de hoy. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, CabeceraSeccionComponent, EstadoRecetaComponent, FotoComponent, NumeroPipe],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly ui = inject(UiStore);
  protected readonly plan = inject(PlanStore);
  protected readonly recetas = inject(RecetasStore);
  protected readonly catalogos = inject(CatalogoStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);

  /** Se fija al abrir la pantalla: no hace falta que el saludo cambie mientras se mira. */
  private readonly momento = momentoDelDia(new Date().getHours());
  protected readonly saludo = this.momento.saludo;
  protected readonly tituloSugerencias = this.momento.titulo;

  protected readonly primerNombre = computed(() => this.sesion.usuario()?.nombre.split(' ')[0] ?? '');
  protected readonly inicial = computed(() => this.primerNombre().charAt(0).toUpperCase() || '?');

  /** "jueves 29" para la cabecera de «Tu día». */
  protected readonly fechaDeHoy = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric' });

  /** Cocinas con al menos una receta; la foto es la de una de sus recetas (si alguna tiene). */
  protected readonly cocinas = computed(() => {
    const porCocina = new Map<string, Receta[]>();
    for (const r of this.recetas.todas()) {
      porCocina.set(r.tipoCocina, [...(porCocina.get(r.tipoCocina) ?? []), r]);
    }
    return this.catalogos
      .tiposCocina()
      .filter((c) => porCocina.has(c.codigo))
      .map((c) => {
        const recetas = porCocina.get(c.codigo)!;
        const conFoto = recetas.find((r) => !!r.imagen) ?? recetas[0]!;
        return { codigo: c.codigo, nombre: c.nombre, imagen: conFoto.imagen, emoji: emojiFranja(conFoto.tipoComida) };
      });
  });

  /** Las recetas de la franja del momento, mejor cubiertas por la despensa primero. */
  protected readonly sugerencias = computed(() => {
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    const deLaFranja = this.recetas.porFranja().get(this.momento.franja) ?? this.recetas.todas();
    return deLaFranja
      .map((r) => evaluarReceta(r, disponibles, basicos))
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_SUGERENCIAS);
  });

  /** Lo que ya está elegido para hoy, en el orden de las franjas. */
  protected readonly hoyArmado = computed(() => {
    const plan = this.plan.hoy();
    if (!plan || plan.elecciones.length === 0) return [];
    const orden = this.catalogos.tiposComida().map((t) => t.codigo);
    return [...plan.elecciones]
      .sort((a, b) => orden.indexOf(a.franja) - orden.indexOf(b.franja))
      .map((e) => ({ franja: this.catalogos.nombreFranja(e.franja), receta: this.recetas.obtener(e.recetaId) }))
      .filter((d): d is { franja: string; receta: Receta } => !!d.receta);
  });

  protected readonly kcalHoy = computed(() => {
    const plan = this.plan.hoy();
    if (!plan) return null;
    const t = totalesDelDia(plan.elecciones, (id) => this.recetas.obtener(id));
    return t.conDato > 0 ? t.kcal : null;
  });

  /** Próximos días que ya tienen algo planificado. */
  protected readonly proximosDias = computed(() =>
    Array.from({ length: DIAS_SIGUIENTES }, (_, i) => fechaISO(sumarDias(new Date(), i + 1)))
      .map((iso) => ({
        iso,
        etiqueta: desdeISO(iso).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }).replace('.', ''),
        recetas: (this.plan.planDe(iso)?.elecciones ?? [])
          .map((e) => this.recetas.obtener(e.recetaId)?.nombre)
          .filter((n): n is string => !!n),
      }))
      .filter((d) => d.recetas.length > 0),
  );

  constructor() {
    // Esta semana y la que viene (los próximos 6 días pueden cruzar el domingo).
    effect(() => {
      void this.plan.cargarSemana(new Date());
      void this.plan.cargarSemana(sumarDias(new Date(), DIAS_SIGUIENTES));
    });
  }

  protected emoji(receta: Receta): string {
    return emojiFranja(receta.tipoComida);
  }
}
