import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
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
import { AvisoComponent } from '../../ui/aviso.component';
import { emojiIngrediente } from '../../ui/emojis';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';
import { HojaComponent } from '../../ui/hoja.component';

const ORIGEN: Record<OrigenLista, { nombre: string; icono: string }> = {
  manual: { nombre: 'Desde cero', icono: 'edit_note' },
  plan: { nombre: 'Del plan', icono: 'calendar_view_week' },
  dia: { nombre: 'De un día', icono: 'today' },
};

/** Pantalla 12B: lista siempre editable (texto libre o ingredientes), con fecha de compra. */
@Component({
  selector: 'app-lista-detalle',
  imports: [BuscadorIngredienteComponent, HojaComponent, EncabezadoComponent, FilaIngredienteComponent, AvisoComponent],
  template: `
    @if (lista(); as l) {
      <main class="pantalla">
        <app-encabezado [titulo]="l.nombre" volver="/listas">
          <button type="button" class="boton-icono" (click)="opciones.set(true)" aria-label="Opciones de la lista"><span class="icono">more_vert</span></button>
        </app-encabezado>

        <div class="meta">
          <label class="chip fecha">
            <span class="icono">event</span>
            <input type="date" [value]="l.fechaCompra" (change)="cambiar({ fechaCompra: $any($event.target).value })" aria-label="Fecha de compra" />
          </label>
          <span class="chip acento origen"><span class="icono">{{ origen(l.origen).icono }}</span> {{ origen(l.origen).nombre }}</span>
          <span class="t-detalle avance">{{ progreso().comprados }}/{{ progreso().total }}</span>
        </div>

        <app-buscador-ingrediente
          placeholder="Agregar algo (texto libre o ingrediente)"
          [permitirTexto]="true"
          [excluir]="idsEnLista()"
          (elegido)="agregarIngrediente($event)"
          (textoLibre)="agregarTexto($event)"
        />

        @for (g of grupos(); track g.nombre) {
          <section class="tarjeta grupo">
            <h2 class="t-sobretitulo">{{ g.nombre }}</h2>
            <div>
              @for (i of g.items; track i.id) {
                <div class="item">
                  <button type="button" class="toque" (click)="alternar(i)" [attr.aria-label]="(i.comprado ? 'Desmarcar ' : 'Marcar comprado: ') + nombre(i)">
                    <app-fila-ingrediente
                      [emoji]="emoji(i)"
                      [nombre]="nombre(i)"
                      [detalle]="i.motivo || (i.ingredienteId ? null : 'agregado a mano')"
                      [class.hecho]="i.comprado"
                    >
                      @if (i.cantidad !== null) { <span class="cantidad">{{ i.cantidad }} {{ i.unidad ?? '' }}</span> }
                    </app-fila-ingrediente>
                  </button>
                  <button
                    type="button"
                    class="casilla redonda ok"
                    role="checkbox"
                    [class.marcada]="i.comprado"
                    [attr.aria-checked]="i.comprado"
                    (click)="alternar(i)"
                    [attr.aria-label]="'Comprado: ' + nombre(i)"
                  >
                    <span class="icono">check</span>
                  </button>
                  <button type="button" class="boton-icono sin-fondo quitar" (click)="quitar(i)" [attr.aria-label]="'Quitar ' + nombre(i)">
                    <span class="icono">close</span>
                  </button>
                </div>
              }
            </div>
          </section>
        } @empty {
          <div class="vacio-estado"><span class="icono">playlist_add</span><p>La lista está vacía. Agrega lo que necesites.</p></div>
        }

        @if (mensaje(); as m) {
          <app-aviso icono="check_circle" tono="ok" [titulo]="m" />
        }

        <div class="pie-fijo">
          <button type="button" class="boton-icono compartir" (click)="compartir(l)" aria-label="Compartir lista"><span class="icono">share</span></button>
          <button type="button" class="btn btn-primario crecer" [disabled]="progreso().comprados === 0" (click)="pasarADespensa(l)">
            <span class="icono">kitchen</span> Pasar a la despensa
          </button>
        </div>
      </main>

      @if (opciones()) {
        <app-hoja titulo="Lista" (cerrar)="opciones.set(false)">
          <label class="campo"><span>Nombre</span><input class="caja" type="text" [value]="l.nombre" (change)="cambiar({ nombre: $any($event.target).value || l.nombre })" /></label>
          <button type="button" class="btn btn-peligro" (click)="eliminar(l)"><span class="icono">delete</span> Eliminar lista</button>
          <button type="button" class="btn btn-primario btn-ancho" (click)="opciones.set(false)">Listo</button>
        </app-hoja>
      }
    } @else {
      <main class="pantalla">
        <app-encabezado titulo="Lista" volver="/listas" />
        <p class="t-detalle">{{ listas.cargadas() ? 'No encontramos esta lista.' : 'Cargando…' }}</p>
      </main>
    }
  `,
  styles: `
    .meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: -8px; }
    .fecha { cursor: pointer; }
    .fecha input { padding: 0; border: none; background: none; color: var(--color-texto); font-family: var(--fuente-texto); font-size: 12px; font-weight: 500; }
    .origen { cursor: default; color: var(--color-texto); }
    .avance { margin-left: auto; }
    .grupo { gap: 4px; padding: 16px 20px 8px; }
    .item { display: flex; align-items: center; gap: 8px; }
    .item .toque { flex: 1; min-width: 0; }
    .cantidad { font-size: 13px; color: var(--color-texto-suave); white-space: nowrap; }
    .quitar { width: 32px; height: 32px; margin-right: -8px; color: var(--color-texto-tenue); }
    .quitar .icono { font-size: 18px; }
    .compartir { width: var(--alto-boton); height: var(--alto-boton); color: var(--color-primario); box-shadow: var(--sombra-suave); }
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

  protected emoji(i: ItemLista): string {
    return i.ingredienteId ? emojiIngrediente(this.ingredientes.obtener(i.ingredienteId)) : '🛒';
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
