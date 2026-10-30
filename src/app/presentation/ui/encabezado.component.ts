import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * «C · Encabezado» del sistema de diseño: volver + título + acciones (proyectadas).
 * `principal` es el encabezado de las pestañas: título grande y sin volver.
 */
@Component({
  selector: 'app-encabezado',
  imports: [RouterLink],
  template: `
    @if (volver(); as ruta) {
      <a class="boton-icono" [routerLink]="ruta" aria-label="Volver"><span class="icono">arrow_back</span></a>
    }
    <h1 [class]="principal() ? 't-pantalla' : 'titulo'">{{ titulo() }}</h1>
    <div class="acciones"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--esp-grupo); min-height: var(--lado-boton-icono); }
    h1 { flex: 1; min-width: 0; }
    .titulo { font-size: 22px; }
    .acciones { display: flex; align-items: center; gap: 8px; }
    .acciones:empty { display: none; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncabezadoComponent {
  readonly titulo = input.required<string>();
  /** Ruta del botón volver; null = sin botón. */
  readonly volver = input<string | readonly unknown[] | null>(null);
  readonly principal = input(false);
}
