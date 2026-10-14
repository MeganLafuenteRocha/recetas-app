import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FichaIngredienteComponent } from '../ui/ficha-ingrediente.component';
import { BarraNavComponent } from './barra-nav.component';
import { MenuLateralComponent } from './menu-lateral.component';

/**
 * Marco de la app: contenido + barra inferior fija + menú lateral + ficha de ingrediente.
 * En escritorio el contenido es una columna centrada (ancho máximo de celular grande).
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, BarraNavComponent, MenuLateralComponent, FichaIngredienteComponent],
  template: `
    <div class="contenido">
      <router-outlet />
    </div>
    <app-barra-nav />
    <app-menu-lateral />
    <app-ficha-ingrediente />
  `,
  styles: `
    .contenido {
      min-height: 100dvh;
      padding-bottom: 80px;
      max-width: 560px;
      margin: 0 auto;
      background: var(--plomo-50);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
