import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { PreferenciasStore } from '../../../application/stores/preferencias.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import {
  desdeISO,
  evaluarMeta,
  fechaISO,
  semanaDe,
  sumarDias,
  totalesDelDia,
} from '../../../domain/planificacion/plan.model';
import { FotoComponent } from '../../ui/foto.component';
import { capitalizar, duracion, iconoFranja } from '../../ui/iconos';
import { ElegirRecetaComponent } from './elegir-receta.component';

/** Franjas que siempre se muestran; las demás (postre) solo si tienen algo planificado. */
const FRANJAS_FIJAS = ['desayuno', 'sopa', 'seco'];

/** Pantallas 03A (compacta), 03B (completa) y 03C (semanal). */
@Component({
  selector: 'app-mi-dia',
  imports: [RouterLink, FotoComponent, ElegirRecetaComponent],
  templateUrl: './mi-dia.page.html',
  styleUrl: './mi-dia.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiDiaPage {
  protected readonly ui = inject(UiStore);
  protected readonly sesion = inject(SesionStore);
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly preferencias = inject(PreferenciasStore);
  private readonly planes = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly listas = inject(ListasComprasUseCase);
  private readonly router = inject(Router);

  protected readonly hoy = fechaISO(new Date());

  /** Toggles del header (estilo TickTick). */
  protected readonly vistaCompleta = signal(false);
  protected readonly semanal = signal(false);

  protected readonly seleccionada = signal(this.hoy);
  protected readonly referencia = signal(new Date());
  protected readonly elegir = signal<{ fecha: string; franja: string } | null>(null);
  protected readonly creandoLista = signal(false);

  protected readonly inicial = computed(() => this.sesion.usuario()?.nombre.charAt(0).toUpperCase() ?? '?');
  protected readonly duracion = duracion;
  protected readonly iconoFranja = iconoFranja;

  protected readonly dias = computed(() =>
    semanaDe(this.referencia()).map((iso) => {
      const d = desdeISO(iso);
      return {
        iso,
        semana: d.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', ''),
        numero: d.getDate(),
        conPlan: (this.planes.planDe(iso)?.elecciones.length ?? 0) > 0,
      };
    }),
  );

  protected readonly rangoSemana = computed(() => {
    const dias = this.dias();
    const fmt = (iso: string) => desdeISO(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
    return `${fmt(dias[0]!.iso)} – ${fmt(dias[6]!.iso)}`;
  });

  protected readonly tituloDia = computed(() => {
    const iso = this.seleccionada();
    const texto = desdeISO(iso).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric' });
    return iso === this.hoy ? `Hoy, ${texto}` : capitalizar(texto);
  });

  /** Franjas visibles: las fijas + las que tengan algo esta semana. */
  protected readonly franjas = computed(() => {
    const usadas = new Set(
      this.dias().flatMap((d) => this.planes.planDe(d.iso)?.elecciones.map((e) => e.franja) ?? []),
    );
    return this.catalogos.tiposComida().filter((t) => FRANJAS_FIJAS.includes(t.codigo) || usadas.has(t.codigo));
  });

  /** Plan del día seleccionado, una fila por franja (vacía o con receta). */
  protected readonly items = computed(() => {
    const plan = this.planes.planDe(this.seleccionada());
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    return this.franjas().map((t) => {
      const recetaId = plan?.elecciones.find((e) => e.franja === t.codigo)?.recetaId;
      const receta = recetaId ? this.recetas.obtener(recetaId) : undefined;
      return {
        franja: t.codigo,
        nombreFranja: t.codigo === 'desayuno' ? t.nombre : `Almuerzo · ${t.nombre}`,
        icono: iconoFranja(t.codigo),
        receta,
        puntaje: receta ? evaluarReceta(receta, disponibles, basicos).puntaje : null,
      };
    });
  });

  protected readonly totales = computed(() =>
    totalesDelDia(this.planes.planDe(this.seleccionada())?.elecciones ?? [], (id) => this.recetas.obtener(id)),
  );
  protected readonly estadoMeta = computed(() => evaluarMeta(this.totales(), this.preferencias.metas()));

  /** Cuadrícula semanal 03C. */
  protected readonly grilla = computed(() =>
    this.dias().map((d) => ({
      ...d,
      celdas: this.franjas().map((t) => {
        const id = this.planes.planDe(d.iso)?.elecciones.find((e) => e.franja === t.codigo)?.recetaId;
        return { franja: t.codigo, receta: id ? this.recetas.obtener(id) : undefined };
      }),
    })),
  );

  protected readonly resumenSemana = computed(() => {
    const conPlan = this.dias().filter((d) => d.conPlan);
    const kcal = conPlan
      .map((d) => totalesDelDia(this.planes.planDe(d.iso)!.elecciones, (id) => this.recetas.obtener(id)))
      .filter((t) => t.conDato > 0)
      .map((t) => t.kcal);
    return {
      planificados: conPlan.length,
      promedio: kcal.length ? Math.round(kcal.reduce((a, b) => a + b, 0) / kcal.length) : null,
    };
  });

  constructor() {
    // Cada semana se lee una sola vez (máx. 7 lecturas) y queda en memoria.
    effect(() => void this.planes.cargarSemana(this.referencia()));
  }

  protected moverSemana(delta: number): void {
    const nueva = sumarDias(this.referencia(), delta * 7);
    this.referencia.set(nueva);
    const dias = semanaDe(nueva);
    this.seleccionada.set(dias.includes(this.hoy) ? this.hoy : dias[0]!);
  }

  protected abrirReceta(id: string): void {
    void this.router.navigate(['/recetas', id]);
  }

  protected async listaSemanal(): Promise<void> {
    this.creandoLista.set(true);
    try {
      const lista = await this.listas.crearDesdeSemana(fechaISO(this.referencia()), this.hoy);
      await this.router.navigate(['/listas', lista.id]);
    } finally {
      this.creandoLista.set(false);
    }
  }
}
