import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FichaIngredienteComponent } from '../ui/ficha-ingrediente.component';
import { BarraPestanasComponent } from './barra-pestanas.component';
import { MenuLateralComponent } from './menu-lateral.component';

/**
 * Marco de la app: contenido + barra de pestañas flotante + menú lateral + ficha de ingrediente.
 * En escritorio el contenido es una columna centrada (ancho máximo de celular grande).
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, BarraPestanasComponent, MenuLateralComponent, FichaIngredienteComponent],
  template: `
    <div class="contenido">
      <router-outlet />
    </div>
    <app-barra-pestanas />
    <app-menu-lateral />
    <app-ficha-ingrediente />
  `,
  styles: `
    .contenido {
      min-height: 100dvh;
      max-width: 560px;
      margin: 0 auto;
      padding-bottom: var(--alto-barra-pestanas);
      background: var(--color-fondo);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
