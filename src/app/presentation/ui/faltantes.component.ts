import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { UiStore } from '../../application/stores/ui.store';
import { ResultadoAfinidad } from '../../domain/planificacion/afinidad.service';

/**
 * "Te falta: papa, cebolla" con el color del rol de cada faltante
 * (esencial rojo, condimento dorado, opcional naranja). Tocar uno abre su ficha.
 */
@Component({
  selector: 'app-faltantes',
  template: `
    @if (items().length > 0) {
      <div class="faltantes">
        <small>Te falta:</small>
        @for (item of items(); track item.id) {
          @if (interactivo()) {
            <button type="button" [class]="'pastilla-rol rol-' + item.rol" (click)="abrir($event, item.id)">{{ item.nombre }}</button>
          } @else {
            <span [class]="'pastilla-rol rol-' + item.rol">{{ item.nombre }}</span>
          }
        }
      </div>
    } @else if (mostrarCompleto()) {
      <small class="completo"><span class="icono">check_circle</span> Tienes todo</small>
    }
  `,
  styles: `
    .faltantes { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    small { color: var(--plomo-500); font-size: 11px; }
    button { border: none; cursor: pointer; font-family: inherit; }
    .completo { color: var(--ok); display: inline-flex; align-items: center; gap: 3px; }
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
