import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * «C · Encabezado» del sistema de diseño: volver + (sobretítulo) título + acciones proyectadas.
 * - `volver`: ruta fija del botón; `volverAtras`: vuelve por el historial;
 *   `alVolver`: lo decide la pantalla (p. ej. salir del modo edición antes de irse).
 * - `iconoVolver`: `arrow_back` (navegar) o `close` (salir de un flujo, p. ej. el editor).
 * - `principal`: título grande de las pestañas, sin botón volver.
 */
@Component({
  selector: 'app-encabezado',
  imports: [RouterLink],
  template: `
    @if (volver(); as ruta) {
      <a class="boton-icono" [routerLink]="ruta" [attr.aria-label]="etiquetaVolver()">
        <span class="icono">{{ iconoVolver() }}</span>
      </a>
    } @else if (volverAtras() || alVolver()) {
      <button type="button" class="boton-icono" (click)="atras()" [attr.aria-label]="etiquetaVolver()">
        <span class="icono">{{ iconoVolver() }}</span>
      </button>
    }
    <div class="textos">
      @if (sobretitulo()) {
        <span class="t-detalle">{{ sobretitulo() }}</span>
      }
      <h1 [class]="principal() ? 't-pantalla' : 'titulo'">{{ titulo() }}</h1>
    </div>
    <div class="acciones"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: var(--esp-grupo); min-height: var(--lado-boton-icono); }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .titulo { font-size: 22px; }
    .acciones { display: flex; align-items: center; gap: 8px; }
    .acciones:empty { display: none; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncabezadoComponent {
  private readonly location = inject(Location);

  readonly titulo = input.required<string>();
  readonly sobretitulo = input<string | null>(null);
  readonly volver = input<string | readonly unknown[] | null>(null);
  readonly volverAtras = input(false);
  readonly alVolver = input<(() => void) | null>(null);
  readonly iconoVolver = input<'arrow_back' | 'close'>('arrow_back');
  readonly principal = input(false);

  protected etiquetaVolver(): string {
    return this.iconoVolver() === 'close' ? 'Cerrar' : 'Volver';
  }

  protected atras(): void {
    const accion = this.alVolver();
    if (accion) accion();
    else this.location.back();
  }
}
