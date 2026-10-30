import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** «C · Fila de ajuste»: ícono en círculo, etiqueta, valor y flecha. Se envuelve en un enlace o botón. */
@Component({
  selector: 'app-fila-ajuste',
  template: `
    <span class="circulo"><span class="icono">{{ icono() }}</span></span>
    <span class="etiqueta">{{ etiqueta() }}</span>
    <ng-content />
    @if (valor() !== null) {
      <span class="valor">{{ valor() }}</span>
    }
    <span class="icono flecha">chevron_right</span>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--esp-grupo); padding: 10px 0; }
    .circulo {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-primario-suave);
      color: var(--color-primario);
    }
    .circulo .icono { font-size: 18px; }
    .etiqueta { flex: 1; min-width: 0; font-size: 13px; font-weight: 500; }
    .valor { font-size: 12px; color: var(--color-texto-suave); }
    .flecha { color: var(--color-texto-tenue); font-size: 20px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilaAjusteComponent {
  readonly icono = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly valor = input<string | number | null>(null);
}
