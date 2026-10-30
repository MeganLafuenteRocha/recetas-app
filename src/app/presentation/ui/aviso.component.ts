import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonoAviso = 'acento' | 'ok' | 'error';

/** «C · Aviso»: ícono + título + detalle (proyectado). Tono dorado por defecto. */
@Component({
  selector: 'app-aviso',
  template: `
    <span class="icono">{{ icono() }}</span>
    <div class="textos">
      @if (titulo()) { <strong>{{ titulo() }}</strong> }
      <div class="detalle"><ng-content /></div>
    </div>
    <ng-content select="[accion]" />
  `,
  styles: `
    :host {
      display: flex; align-items: center; gap: var(--esp-grupo); padding: 14px;
      border-radius: 18px; background: var(--color-acento-suave);
      --tono: var(--color-acento);
    }
    :host(.ok) { background: var(--color-ok-suave); --tono: var(--color-ok); }
    :host(.error) { background: var(--color-error-suave); --tono: var(--color-error); }
    .icono { color: var(--tono); }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    strong { font-size: 13px; font-weight: 600; }
    .detalle { font-size: 11px; color: var(--color-texto-suave); }
    .detalle:empty { display: none; }
  `,
  host: { '[class]': 'tono()', role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoComponent {
  readonly icono = input('lightbulb');
  readonly titulo = input<string | null>(null);
  readonly tono = input<TonoAviso>('acento');
}
