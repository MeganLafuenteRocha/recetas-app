import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CatalogoStore } from '../../application/stores/catalogo.store';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';

const MAX_SUGERENCIAS = 6;

/**
 * Campo con sugerencias en memoria (nombre o sinónimo). Se usa en el editor de recetas
 * y en las listas de compras. Con permitirTexto, Enter agrega lo escrito como texto libre.
 */
@Component({
  selector: 'app-buscador-ingrediente',
  template: `
    <div class="caja">
      <label class="buscador">
        <span class="icono">add</span>
        <input
          type="text"
          [placeholder]="placeholder()"
          [value]="texto()"
          (input)="texto.set($any($event.target).value)"
          (keydown.enter)="alEnter($event)"
          (keydown.escape)="texto.set('')"
          autocomplete="off"
        />
      </label>
      @if (mostrarLista()) {
        <ul role="listbox">
          @for (i of sugerencias(); track i.id) {
            <li>
              <button type="button" (click)="elegir(i)">
                <span>{{ i.nombre }}</span>
                <small>{{ catalogos.nombreCategoria(i.categoria) }}</small>
              </button>
            </li>
          }
          @if (permitirTexto() && texto().trim()) {
            <li>
              <button type="button" class="libre" (click)="enviarTexto()">
                <span>Agregar «{{ texto().trim() }}»</span><small>texto libre</small>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .caja { position: relative; }
    .buscador { border-color: var(--guindo-700); border-width: 1.5px; }
    .buscador .icono { color: var(--guindo-700); }
    ul {
      position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 6px);
      list-style: none; margin: 0; padding: 6px; background: #fff; border-radius: 16px;
      border: 1px solid #e4e4e7; box-shadow: var(--sombra-2); max-height: 280px; overflow-y: auto;
    }
    button {
      width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px;
      border: none; background: none; padding: 10px; border-radius: 10px; cursor: pointer; text-align: left;
      font-size: 14px; color: var(--plomo-900);
    }
    button:hover { background: var(--plomo-100); }
    small { color: var(--plomo-500); font-size: 11px; }
    .libre span { color: var(--guindo-700); font-weight: 500; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorIngredienteComponent {
  protected readonly catalogos = inject(CatalogoStore);
  private readonly ingredientes = inject(IngredientesStore);

  readonly placeholder = input('Agregar ingrediente…');
  /** Ids que ya están (no se vuelven a sugerir). */
  readonly excluir = input<ReadonlySet<string>>(new Set());
  readonly permitirTexto = input(false);
  readonly elegido = output<Ingrediente>();
  readonly textoLibre = output<string>();

  protected readonly texto = signal('');

  protected readonly sugerencias = computed(() => {
    const q = this.texto().trim();
    if (!q) return [];
    return this.ingredientes
      .buscar(q)
      .filter((i) => !this.excluir().has(i.id))
      .slice(0, MAX_SUGERENCIAS);
  });

  protected readonly mostrarLista = computed(
    () => this.sugerencias().length > 0 || (this.permitirTexto() && this.texto().trim().length > 0),
  );

  protected elegir(i: Ingrediente): void {
    this.elegido.emit(i);
    this.texto.set('');
  }

  protected enviarTexto(): void {
    const t = this.texto().trim();
    if (!t) return;
    this.textoLibre.emit(t);
    this.texto.set('');
  }

  protected alEnter(evento: Event): void {
    evento.preventDefault();
    const primera = this.sugerencias()[0];
    if (primera) this.elegir(primera);
    else if (this.permitirTexto()) this.enviarTexto();
  }
}
