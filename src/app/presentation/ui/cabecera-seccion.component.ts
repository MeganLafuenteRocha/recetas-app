import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** «C · Cabecera de sección»: título a la izquierda y un enlace o dato a la derecha (proyectado). */
@Component({
  selector: 'app-cabecera-seccion',
  template: `
    <h2 class="t-seccion">
      @if (icono()) { <span class="icono">{{ icono() }}</span> }
      {{ titulo() }}
    </h2>
    <ng-content />
  `,
  styles: `
    :host { display: flex; align-items: center; justify-content: space-between; gap: var(--esp-grupo); }
    h2 { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .icono { font-size: 19px; color: var(--color-acento); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraSeccionComponent {
  readonly titulo = input.required<string>();
  readonly icono = input<string | null>(null);
}
