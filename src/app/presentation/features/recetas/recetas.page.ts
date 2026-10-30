import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { evaluarReceta, sePuedeCocinar } from '../../../domain/planificacion/afinidad.service';
import { CabeceraSeccionComponent } from '../../ui/cabecera-seccion.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { HojaComponent } from '../../ui/hoja.component';
import { iconoFranja } from '../../ui/iconos';
import { InterruptorComponent } from '../../ui/interruptor.component';
import { TarjetaPlatoComponent } from '../../ui/tarjeta-plato.component';
import { TarjetaRecetaComponent } from '../../ui/tarjeta-receta.component';

type Orden = 'afinidad' | 'nombre' | 'tiempo';
const ORDENES: Orden[] = ['afinidad', 'nombre', 'tiempo'];
const NOMBRE_ORDEN: Record<Orden, string> = { afinidad: 'Afinidad', nombre: 'A–Z', tiempo: 'Más rápidas' };
/** Lo que se lee junto al conteo: «110 recetas · ordenadas por lo que tienes en casa». */
const TEXTO_ORDEN: Record<Orden, string> = {
  afinidad: 'ordenadas por lo que tienes en casa',
  nombre: 'de la A a la Z',
  tiempo: 'las más rápidas primero',
};

/** Pantallas 07A (lista) y 07B (por franjas). El modo de vista se recuerda en el dispositivo. */
@Component({
  selector: 'app-recetas',
  imports: [
    RouterLink,
    EncabezadoComponent,
    CabeceraSeccionComponent,
    TarjetaRecetaComponent,
    TarjetaPlatoComponent,
    HojaComponent,
    InterruptorComponent,
  ],
  templateUrl: './recetas.page.html',
  styleUrl: './recetas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecetasPage {
  protected readonly ui = inject(UiStore);
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly sesion = inject(SesionStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);

  /** ?listas=1 (desde la Despensa o el Inicio): abre ya filtrado por "Con mi despensa". */
  readonly listas = input<string>();
  /** ?cocina=boliviana (desde los círculos de cocinas del Inicio): abre filtrado por esa cocina. */
  readonly cocinaInicial = input<string | undefined>(undefined, { alias: 'cocina' });

  protected readonly consulta = signal('');
  protected readonly franja = signal<string | null>(null);
  protected readonly cocina = linkedSignal<string | null>(() => this.cocinaInicial() ?? null);
  protected readonly soloConDespensa = linkedSignal(() => this.listas() === '1');
  /** Si se llegó con un filtro (?cocina, ?listas) se muestra la lista, que es donde se aplica. */
  private readonly forzarLista = linkedSignal(() => !!this.cocinaInicial() || this.listas() === '1');
  protected readonly vista = computed(() => (this.forzarLista() ? 'lista' : this.ui.vistaRecetas()));
  protected readonly orden = signal<Orden>('afinidad');

  protected readonly ordenes = ORDENES;
  protected readonly nombresOrden = NOMBRE_ORDEN;
  protected readonly textoOrden = computed(() => TEXTO_ORDEN[this.orden()]);
  /** Hoja de filtros (cocina, despensa y orden) que abre el botón junto al buscador. */
  protected readonly filtrosAbiertos = signal(false);
  /** Cuántos filtros de la hoja están cambiados (punto en el botón). */
  protected readonly filtrosActivos = computed(
    () => (this.cocina() ? 1 : 0) + (this.soloConDespensa() ? 1 : 0) + (this.orden() !== 'afinidad' ? 1 : 0),
  );
  protected readonly inicial = computed(() => this.sesion.usuario()?.nombre.charAt(0).toUpperCase() ?? '?');

  /** Afinidad de TODAS las recetas contra la despensa (en memoria, cero lecturas). */
  private readonly evaluadas = computed(() => {
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    return this.recetas.todas().map((r) => evaluarReceta(r, disponibles, basicos));
  });

  protected readonly listasYa = computed(() => this.evaluadas().filter(sePuedeCocinar).length);

  protected readonly filtradas = computed(() => {
    const q = this.consulta().trim();
    const idsBuscados = q ? new Set(this.ingredientes.buscar(q).map((i) => i.id)) : null;
    const coincidentes = q ? new Set(this.recetas.buscar(q, idsBuscados!).map((r) => r.id)) : null;
    const lista = this.evaluadas().filter(
      (e) =>
        (!coincidentes || coincidentes.has(e.receta.id)) &&
        (!this.franja() || e.receta.tipoComida === this.franja()) &&
        (!this.cocina() || e.receta.tipoCocina === this.cocina()) &&
        (!this.soloConDespensa() || sePuedeCocinar(e)),
    );
    const orden = this.orden();
    return [...lista].sort((a, b) => {
      if (orden === 'nombre') return a.receta.nombre.localeCompare(b.receta.nombre, 'es');
      if (orden === 'tiempo') return a.receta.tiempo.totalMin - b.receta.tiempo.totalMin;
      return b.puntaje - a.puntaje;
    });
  });

  /** Vista 07B: carruseles por franja, mejores primero. */
  protected readonly porFranja = computed(() =>
    this.catalogos
      .tiposComida()
      .map((t) => ({
        codigo: t.codigo,
        nombre: t.nombre,
        icono: iconoFranja(t.codigo),
        items: this.filtradas()
          .filter((e) => e.receta.tipoComida === t.codigo)
          .sort((a, b) => b.puntaje - a.puntaje),
      }))
      .filter((f) => f.items.length > 0),
  );

  protected buscar(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }

  protected elegirCocina(evento: Event): void {
    this.cocina.set((evento.target as HTMLSelectElement).value || null);
  }

  protected limpiarFiltros(): void {
    this.cocina.set(null);
    this.soloConDespensa.set(false);
    this.orden.set('afinidad');
  }

  /** "Ver" del hero / "Ver todas" de una franja: pasa a la lista ya filtrada. */
  protected verLista(franja: string | null, soloListas = false): void {
    this.franja.set(franja);
    this.soloConDespensa.set(soloListas);
    this.ui.cambiarVistaRecetas('lista');
  }

  protected cambiarVista(): void {
    const destino = this.vista() === 'lista' ? 'franjas' : 'lista';
    this.forzarLista.set(false);
    this.ui.cambiarVistaRecetas(destino);
  }
}
