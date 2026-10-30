import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { UiStore } from '../../application/stores/ui.store';
import { ResultadoAfinidad } from '../../domain/planificacion/afinidad.service';

/**
 * «Te falta: papa, cebolla» en pastillas blancas con el punto del rol de cada faltante
 * (esencial guindo, condimento dorado, opcional tenue). Tocar uno abre su ficha.
 */
@Component({
  selector: 'app-faltantes',
  template: `
    @if (items().length > 0) {
      <div class="faltantes">
        <span class="etiqueta">Te falta:</span>
        @for (item of items(); track item.id) {
          @if (interactivo()) {
            <button type="button" [class]="'faltante rol-' + item.rol" (click)="abrir($event, item.id)" [attr.aria-label]="'Ver ' + item.nombre">
              <span class="punto"></span>{{ item.nombre }}
            </button>
          } @else {
            <span [class]="'faltante rol-' + item.rol"><span class="punto"></span>{{ item.nombre }}</span>
          }
        }
      </div>
    } @else if (mostrarCompleto()) {
      <span class="completo"><span class="icono lleno">check_circle</span> Tienes todo</span>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .faltantes { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .etiqueta { font-size: 11px; color: var(--color-texto-suave); }
    .faltante {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border: none;
      border-radius: var(--radio-pill);
      background: var(--color-superficie);
      color: var(--color-texto);
      font-family: var(--fuente-texto);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    button.faltante { cursor: pointer; }
    .faltante .punto { width: 6px; height: 6px; background: var(--rol); }
    .completo { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-ok); }
    .completo .icono { font-size: 14px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaltantesComponent {
  private readonly ingredientes = inject(IngredientesStore);
  private readonly ui = inject(UiStore);

  readonly resultado = input.required<ResultadoAfinidad>();
  readonly incluirOpcionales = input(true);
  readonly mostrarCompleto = input(true);
  /** false cuando va dentro de otro botón (una card seleccionable): no se anidan botones. */
  readonly interactivo = input(true);

  protected readonly items = computed(() => {
    const r = this.resultado();
    const de = (ids: string[], rol: string) =>
      ids.map((id) => ({ id, rol, nombre: this.ingredientes.nombre(id).toLowerCase() }));
    return [
      ...de(r.faltantesEsenciales, 'esencial'),
      ...de(r.faltantesCondimentos, 'condimento'),
      ...(this.incluirOpcionales() ? de(r.faltantesOpcionales, 'opcional') : []),
    ];
  });

  protected abrir(evento: Event, id: string): void {
    evento.stopPropagation();
    this.ui.abrirFicha(id, this.resultado().receta.id);
  }
}
