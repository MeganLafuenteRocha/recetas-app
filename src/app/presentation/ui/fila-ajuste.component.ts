import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * «C · Fila de ajuste»: ícono en círculo, etiqueta (+ detalle), valor y flecha.
 * Para enlaces se envuelve en un `a.toque`; con `[flecha]="false"` y un control proyectado
 * (p. ej. `app-interruptor`) sirve como fila de opción.
 */
@Component({
  selector: 'app-fila-ajuste',
  template: `
    <span class="circulo-icono"><span class="icono">{{ icono() }}</span></span>
    <span class="textos">
      <span class="etiqueta">{{ etiqueta() }}</span>
      @if (detalle()) {
        <span class="t-detalle">{{ detalle() }}</span>
      }
    </span>
    @if (valor() !== null) {
      <span class="valor">{{ valor() }}</span>
    }
    <ng-content />
    @if (flecha()) {
      <span class="icono flecha">chevron_right</span>
    }
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--esp-grupo); padding: 10px 0; }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .etiqueta { font-size: 13px; font-weight: 500; }
    .valor { font-size: 12px; color: var(--color-texto-suave); }
    .flecha { color: var(--color-texto-tenue); font-size: 20px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilaAjusteComponent {
  readonly icono = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly detalle = input<string | null>(null);
  readonly valor = input<string | number | null>(null);
  readonly flecha = input(true);
}
