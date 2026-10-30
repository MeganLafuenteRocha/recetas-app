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
    <div class="contenedor">
      <label class="buscador">
        <span class="icono">search</span>
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
        <ul role="listbox" aria-label="Sugerencias">
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
    .contenedor { position: relative; }
    ul {
      position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 6px);
      list-style: none; margin: 0; padding: 6px; max-height: 280px; overflow-y: auto;
      border-radius: var(--radio-control); background: var(--color-superficie); box-shadow: var(--sombra-flotante);
    }
    button {
      width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px;
      padding: 10px 12px; border: none; border-radius: var(--radio-control); background: none;
      color: var(--color-texto); font-family: var(--fuente-texto); font-size: 13px; text-align: left; cursor: pointer;
    }
    button:hover { background: var(--color-fondo); }
    small { color: var(--color-texto-suave); font-size: 11px; }
    .libre span { color: var(--color-primario); font-weight: 600; }
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
