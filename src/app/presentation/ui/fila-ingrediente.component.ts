import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * «C · Fila ingrediente»: emoji + nombre (+ detalle) y, a la derecha, lo proyectado
 * (cantidad, check, interruptor…). Quien la usa decide si es tocable.
 * Clases de estado en el host: `marcado` (negrita), `hecho` (tachado), `apagado` (suave).
 */
@Component({
  selector: 'app-fila-ingrediente',
  template: `
    <span class="emoji" aria-hidden="true">{{ emoji() }}</span>
    <span class="textos">
      <span class="nombre">{{ nombre() }}</span>
      @if (detalle()) {
        <span class="t-detalle">{{ detalle() }}</span>
      }
    </span>
    <ng-content />
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--esp-grupo); min-width: 0; padding: 8px 0; }
    .emoji {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      border-radius: 12px;
      background: var(--color-fondo);
      font-size: 18px;
    }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .nombre { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
    :host(.marcado) .nombre { font-weight: 600; }
    :host(.hecho) .nombre { color: var(--color-texto-tenue); text-decoration: line-through; }
    :host(.apagado) .nombre { color: var(--color-texto-suave); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilaIngredienteComponent {
  readonly emoji = input('🥄');
  readonly nombre = input.required<string>();
  readonly detalle = input<string | null>(null);
}
