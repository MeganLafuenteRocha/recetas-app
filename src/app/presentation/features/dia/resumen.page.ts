import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PlanStore } from '../../../application/stores/plan.store';
import { PreferenciasStore } from '../../../application/stores/preferencias.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { espacioCubierto, evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { evaluarMeta, fechaISO, totalesDelDia } from '../../../domain/planificacion/plan.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { capitalizar, duracion, fechaLarga } from '../../ui/iconos';
import { TarjetaRecetaComponent } from '../../ui/tarjeta-receta.component';
import { ElegirRecetaComponent } from '../mi-dia/elegir-receta.component';
import { NumeroPipe } from '../../ui/numero.pipe';

/** Pantalla 05C: el menú de hoy armado, con totales vs meta y lo que falta comprar. */
@Component({
  selector: 'app-resumen-dia',
  imports: [RouterLink, EncabezadoComponent, AvisoComponent, TarjetaRecetaComponent, ElegirRecetaComponent, NumeroPipe],
  templateUrl: './resumen.page.html',
  styleUrl: './resumen.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenDiaPage {
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly preferencias = inject(PreferenciasStore);
  private readonly plan = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly listas = inject(ListasComprasUseCase);
  private readonly router = inject(Router);

  protected readonly hoy = fechaISO(new Date());
  protected readonly fecha = fechaLarga(new Date());
  protected readonly duracion = duracion;
  protected readonly cambiando = signal<string | null>(null);
  protected readonly creandoLista = signal(false);

  protected readonly elecciones = computed(() => {
    const plan = this.plan.hoy();
    if (!plan) return [];
    const orden = new Map(this.catalogos.tiposComida().map((t, i) => [t.codigo, i]));
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    return [...plan.elecciones]
      .sort((a, b) => (orden.get(a.franja) ?? 9) - (orden.get(b.franja) ?? 9))
      .map((e) => {
        const receta = this.recetas.obtener(e.recetaId);
        return {
          franja: e.franja,
          nombreFranja: e.franja === 'desayuno' ? 'Desayuno' : `Almuerzo · ${this.catalogos.nombreFranja(e.franja)}`,
          receta,
          resultado: receta ? evaluarReceta(receta, disponibles, basicos) : null,
        };
      });
  });

  protected readonly totales = computed(() =>
    totalesDelDia(this.plan.hoy()?.elecciones ?? [], (id) => this.recetas.obtener(id)),
  );
  protected readonly estado = computed(() => evaluarMeta(this.totales(), this.preferencias.metas()));

  /** Ancho de las barras (tope 100%). */
  protected readonly barraKcal = computed(() => Math.min(100, (this.totales().kcal / this.preferencias.metas().kcalMax) * 100));
  protected readonly barraProteina = computed(() => Math.min(100, (this.totales().proteinaG / this.preferencias.metas().proteinaG) * 100));

  /** Faltantes de todo el día (esenciales en rojo, condimentos en dorado). */
  protected readonly faltantes = computed(() => {
    const vistos = new Map<string, string>();
    for (const e of this.elecciones()) {
      for (const espacio of e.receta?.ingredientes ?? []) {
        if (espacio.rol === 'opcional') continue;
        if (espacioCubierto(espacio, this.despensa.ids(), this.ingredientes.basicos())) continue;
        const id = espacio.opciones[0]?.ingredienteId;
        if (id && !vistos.has(id)) vistos.set(id, espacio.rol);
      }
    }
    return [...vistos].map(([id, rol]) => ({ id, rol, nombre: this.ingredientes.nombre(id).toLowerCase() }));
  });

  /** «Pan molido y locoto» para el aviso de lo que falta. */
  protected readonly textoFaltantes = computed(() => {
    const nombres = this.faltantes().map((f) => f.nombre);
    const texto = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : (nombres[0] ?? '');
    return capitalizar(texto);
  });

  protected async llevarALista(): Promise<void> {
    this.creandoLista.set(true);
    try {
      const lista = await this.listas.crearDesdeDia(this.hoy, this.hoy);
      await this.router.navigate(['/listas', lista.id]);
    } finally {
      this.creandoLista.set(false);
    }
  }
}
