import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { evaluarReceta, ResultadoAfinidad, sePuedeCocinar } from '../../../domain/planificacion/afinidad.service';
import { AfinidadComponent } from '../../ui/afinidad.component';
import { FotoComponent } from '../../ui/foto.component';
import { duracion, iconoFranja } from '../../ui/iconos';

type Orden = 'afinidad' | 'nombre' | 'tiempo';
const ORDENES: Orden[] = ['afinidad', 'nombre', 'tiempo'];
const NOMBRE_ORDEN: Record<Orden, string> = { afinidad: 'Afinidad', nombre: 'A–Z', tiempo: 'Más rápidas' };

/** Pantallas 07A (lista) y 07B (por franjas). El modo de vista se recuerda en el dispositivo. */
@Component({
  selector: 'app-recetas',
  imports: [RouterLink, AfinidadComponent, FotoComponent],
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

  /** ?listas=1 (desde la Despensa): abre ya filtrado por "Con mi despensa". */
  readonly listas = input<string>();

  protected readonly consulta = signal('');
  protected readonly franja = signal<string | null>(null);
  protected readonly cocina = signal<string | null>(null);
  protected readonly soloConDespensa = linkedSignal(() => this.listas() === '1');
  protected readonly orden = signal<Orden>('afinidad');

  protected readonly nombreOrden = computed(() => NOMBRE_ORDEN[this.orden()]);
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

  protected meta(e: ResultadoAfinidad): string {
    const r = e.receta;
    return `${this.catalogos.nombreFranja(r.tipoComida)} · ${duracion(r.tiempo.totalMin)} · ${this.catalogos.nombreCocina(r.tipoCocina)}`;
  }

  protected duracion = duracion;

  protected buscar(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }

  protected elegirCocina(evento: Event): void {
    this.cocina.set((evento.target as HTMLSelectElement).value || null);
  }

  protected siguienteOrden(): void {
    this.orden.set(ORDENES[(ORDENES.indexOf(this.orden()) + 1) % ORDENES.length]!);
  }

  /** "Ver" del hero / "Ver todas" de una franja: pasa a la lista ya filtrada. */
  protected verLista(franja: string | null, soloListas = false): void {
    this.franja.set(franja);
    this.soloConDespensa.set(soloListas);
    this.ui.cambiarVistaRecetas('lista');
  }
}
