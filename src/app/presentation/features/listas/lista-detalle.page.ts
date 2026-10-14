import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { ListasStore } from '../../../application/stores/listas.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import {
  agregarItem,
  alternarComprado,
  ItemLista,
  ListaCompra,
  OrigenLista,
  progresoLista,
  quitarItem,
} from '../../../domain/listas/lista.model';
import { BuscadorIngredienteComponent } from '../../ui/buscador-ingrediente.component';
import { HojaComponent } from '../../ui/hoja.component';

const ORIGEN: Record<OrigenLista, { nombre: string; icono: string }> = {
  manual: { nombre: 'Desde cero', icono: 'edit_note' },
  plan: { nombre: 'Del plan', icono: 'calendar_view_week' },
  dia: { nombre: 'De un día', icono: 'today' },
};

/** Pantalla 12B: lista siempre editable (texto libre o ingredientes), con fecha de compra. */
@Component({
  selector: 'app-lista-detalle',
  imports: [RouterLink, BuscadorIngredienteComponent, HojaComponent],
  template: `
    @if (lista(); as l) {
      <main class="vista">
        <header class="cabecera">
          <a class="icono-btn" routerLink="/listas" aria-label="Volver"><span class="icono">arrow_back</span></a>
          <h1>{{ l.nombre }}</h1>
          <button type="button" class="icono-btn" (click)="opciones.set(true)" aria-label="Opciones de la lista"><span class="icono">more_vert</span></button>
        </header>

        <div class="meta">
          <label class="chip fecha">
            <span class="icono">event</span>
            <input type="date" [value]="l.fechaCompra" (change)="cambiar({ fechaCompra: $any($event.target).value })" aria-label="Fecha de compra" />
          </label>
          <span class="chip dorado"><span class="icono">{{ origen(l.origen).icono }}</span> {{ origen(l.origen).nombre }}</span>
          <span class="progreso">{{ progreso().comprados }}/{{ progreso().total }}</span>
        </div>

        <app-buscador-ingrediente
          placeholder="Agregar algo (texto libre o ingrediente)"
          [permitirTexto]="true"
          [excluir]="idsEnLista()"
          (elegido)="agregarIngrediente($event)"
          (textoLibre)="agregarTexto($event)"
        />

        @for (g of grupos(); track g.nombre) {
          <section class="grupo">
            <p class="etiqueta-seccion">{{ g.nombre }}</p>
            @for (i of g.items; track i.id) {
              <div class="item" [class.comprado]="i.comprado">
                <button type="button" class="check" role="checkbox" [attr.aria-checked]="i.comprado" (click)="alternar(i)" [attr.aria-label]="'Comprado: ' + nombre(i)">
                  @if (i.comprado) { <span class="icono">check</span> }
                </button>
                <span class="textos" (click)="alternar(i)">
                  <span class="nombre">{{ nombre(i) }}</span>
                  @if (i.motivo) { <small>{{ i.motivo }}</small> }
                </span>
                @if (i.cantidad !== null) { <span class="cantidad">{{ i.cantidad }} {{ i.unidad ?? '' }}</span> }
                <button type="button" class="quitar" (click)="quitar(i)" [attr.aria-label]="'Quitar ' + nombre(i)"><span class="icono">close</span></button>
              </div>
            }
          </section>
        } @empty {
          <div class="vacio-estado"><span class="icono">playlist_add</span><p>La lista está vacía. Agrega lo que necesites.</p></div>
        }

        @if (mensaje(); as m) {
          <p class="aviso ok"><span class="icono">check_circle</span> {{ m }}</p>
        }

        <div class="pie">
          <button type="button" class="btn btn-borde" (click)="compartir(l)" aria-label="Compartir lista"><span class="icono">share</span></button>
          <button type="button" class="btn btn-primario crecer" [disabled]="progreso().comprados === 0" (click)="pasarADespensa(l)">
            <span class="icono">move_to_inbox</span> Pasar comprados a la despensa
          </button>
        </div>
      </main>

      @if (opciones()) {
        <app-hoja titulo="Lista" (cerrar)="opciones.set(false)">
          <label class="campo"><span>Nombre</span><input type="text" [value]="l.nombre" (change)="cambiar({ nombre: $any($event.target).value || l.nombre })" /></label>
          <button type="button" class="btn btn-peligro" (click)="eliminar(l)"><span class="icono">delete</span> Eliminar lista</button>
          <button type="button" class="btn btn-primario ancho" (click)="opciones.set(false)">Listo</button>
        </app-hoja>
      }
    } @else {
      <main class="vista">
        <header class="cabecera">
          <a class="icono-btn" routerLink="/listas" aria-label="Volver"><span class="icono">arrow_back</span></a>
          <h1>Lista</h1>
        </header>
        <p class="texto-suave">{{ listas.cargadas() ? 'No encontramos esta lista.' : 'Cargando…' }}</p>
      </main>
    }
  `,
  styles: `
    .meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .fecha { cursor: pointer; }
    .fecha .icono { color: var(--guindo-700); }
    .fecha input { border: none; background: none; font-family: 'Poppins', sans-serif; font-size: 12px; color: var(--plomo-900); padding: 0; }
    .chip.dorado { cursor: default; }
    .progreso { margin-left: auto; font-size: 12px; color: var(--plomo-500); }
    .grupo { display: flex; flex-direction: column; }
    .item { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #e4e4e7; }
    .check { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--plomo-400); background: #fff; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
    .check .icono { font-size: 16px; color: #fff; }
    .comprado .check { background: var(--guindo-700); border-color: var(--guindo-700); }
    .textos { flex: 1; display: flex; flex-direction: column; min-width: 0; cursor: pointer; }
    .nombre { font-size: 13px; font-weight: 500; color: var(--plomo-900); }
    .textos small { font-size: 10px; color: var(--plomo-500); }
    .comprado .nombre { color: var(--plomo-400); text-decoration: line-through; }
    .cantidad { font-size: 12px; color: var(--plomo-700); white-space: nowrap; }
    .comprado .cantidad { color: var(--plomo-400); }
    .quitar { border: none; background: none; color: var(--plomo-400); cursor: pointer; display: grid; padding: 4px; }
    .quitar .icono { font-size: 18px; }
    .pie { display: flex; gap: 10px; position: sticky; bottom: 88px; padding-top: 6px; }
    .crecer { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaDetallePage {
  protected readonly listas = inject(ListasStore);
  private readonly casos = inject(ListasComprasUseCase);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly catalogos = inject(CatalogoStore);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly opciones = signal(false);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly lista = computed(() => this.listas.obtener(this.id()) ?? null);
  protected readonly progreso = computed(() => {
    const l = this.lista();
    return l ? progresoLista(l) : { comprados: 0, total: 0 };
  });

  protected readonly idsEnLista = computed(
    () => new Set((this.lista()?.items ?? []).map((i) => i.ingredienteId).filter((x): x is string => !!x)),
  );

  /** Agrupado por categoría del ingrediente; el texto libre va a "Otros". */
  protected readonly grupos = computed(() => {
    const items = this.lista()?.items ?? [];
    const grupos = new Map<string, ItemLista[]>();
    for (const item of items) {
      const cat = item.ingredienteId ? this.ingredientes.obtener(item.ingredienteId)?.categoria : undefined;
      const nombre = cat ? this.catalogos.nombreCategoria(cat) : 'Otros';
      grupos.set(nombre, [...(grupos.get(nombre) ?? []), item]);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => (a === 'Otros' ? 1 : b === 'Otros' ? -1 : a.localeCompare(b, 'es')))
      .map(([nombre, lista]) => ({ nombre, items: lista }));
  });

  constructor() {
    void this.listas.cargar();
  }

  protected origen(o: OrigenLista) {
    return ORIGEN[o];
  }

  protected nombre(i: ItemLista): string {
    return i.ingredienteId ? this.ingredientes.nombre(i.ingredienteId) : (i.textoLibre ?? '');
  }

  protected cambiar(cambios: Partial<ListaCompra>): void {
    const l = this.lista();
    if (l) this.listas.actualizar({ ...l, ...cambios });
  }

  protected alternar(item: ItemLista): void {
    const l = this.lista();
    if (l) this.listas.actualizar(alternarComprado(l, item.id));
  }

  protected quitar(item: ItemLista): void {
    const l = this.lista();
    if (l) this.listas.actualizar(quitarItem(l, item.id));
  }

  protected agregarIngrediente(ing: Ingrediente): void {
    const l = this.lista();
    if (!l) return;
    this.listas.actualizar(agregarItem(l, { ...this.casos.itemLibre(ing.nombre), ingredienteId: ing.id, textoLibre: null }));
  }

  protected agregarTexto(texto: string): void {
    const l = this.lista();
    if (l) this.listas.actualizar(agregarItem(l, this.casos.itemLibre(texto)));
  }

  protected pasarADespensa(l: ListaCompra): void {
    const n = this.casos.pasarADespensa(l);
    this.mensaje.set(n > 0 ? `${n} ingrediente${n === 1 ? '' : 's'} en tu despensa.` : 'Lo comprado era texto libre: no va a la despensa.');
  }

  protected async compartir(l: ListaCompra): Promise<void> {
    const texto = [l.nombre, ...l.items.filter((i) => !i.comprado).map((i) => `• ${this.nombre(i)}${i.cantidad !== null ? ` (${i.cantidad} ${i.unidad ?? ''})` : ''}`)].join('\n');
    if (navigator.share) {
      await navigator.share({ title: l.nombre, text: texto }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(texto);
      this.mensaje.set('Lista copiada al portapapeles.');
    }
  }

  protected async eliminar(l: ListaCompra): Promise<void> {
    this.opciones.set(false);
    await this.listas.eliminar(l.id);
    await this.router.navigateByUrl('/listas');
  }
}
