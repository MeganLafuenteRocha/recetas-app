import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavComponent } from './barra-nav.component';

/** Marco de la app: contenido + barra de navegación inferior fija. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, BarraNavComponent],
  template: `
    <div class="contenido">
      <router-outlet />
    </div>
    <app-barra-nav />
  `,
  styles: `
    .contenido {
      min-height: 100dvh;
      padding-bottom: 72px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
