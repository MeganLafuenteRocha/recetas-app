import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** «C · Interruptor» del sistema de diseño. Accesible: es un botón con role="switch". */
@Component({
  selector: 'app-interruptor',
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="valor()"
      [attr.aria-label]="etiqueta()"
      [class.encendido]="valor()"
      [disabled]="deshabilitado()"
      (click)="valor.set(!valor())"
    >
      <span class="perilla"></span>
    </button>
  `,
  styles: `
    button {
      width: 46px; height: 28px; padding: 3px; border: none; border-radius: var(--radio-pill);
      background: var(--color-control-apagado); cursor: pointer; display: flex; transition: background 0.15s; flex-shrink: 0;
    }
    .perilla { width: 22px; height: 22px; border-radius: 50%; background: var(--color-superficie); transition: transform 0.15s; }
    .encendido { background: var(--color-primario); }
    .encendido .perilla { transform: translateX(18px); }
    button:disabled { opacity: 0.5; cursor: default; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterruptorComponent {
  readonly valor = model(false);
  readonly etiqueta = input('');
  readonly deshabilitado = input(false);
}
