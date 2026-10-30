import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { FichaIngredienteComponent } from '../ui/ficha-ingrediente.component';
import { BarraPestanasComponent } from './barra-pestanas.component';
import { MenuLateralComponent } from './menu-lateral.component';

/**
 * Marco de la app: contenido + barra de pestañas + menú lateral + ficha de ingrediente.
 * La barra se muestra solo en las rutas con `data.pestanas` (los 4 destinos principales);
 * las demás pantallas llevan su acción principal en `.pie-fijo`.
 * En escritorio el contenido es una columna centrada (ancho máximo de celular grande).
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, BarraPestanasComponent, MenuLateralComponent, FichaIngredienteComponent],
  template: `
    <div class="contenido" [class.con-pestanas]="conPestanas()">
      <router-outlet />
    </div>
    @if (conPestanas()) {
      <app-barra-pestanas />
    }
    <app-menu-lateral />
    <app-ficha-ingrediente />
  `,
  styles: `
    .contenido {
      min-height: 100dvh;
      max-width: 560px;
      margin: 0 auto;
      background: var(--color-fondo);
    }
    .con-pestanas { padding-bottom: var(--alto-barra-pestanas); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly ruta = inject(ActivatedRoute);

  protected readonly conPestanas = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.rutaActualTienePestanas()),
    ),
    { initialValue: this.rutaActualTienePestanas() },
  );

  private rutaActualTienePestanas(): boolean {
    let r = this.ruta.snapshot;
    while (r.firstChild) r = r.firstChild;
    return r.data['pestanas'] === true;
  }
}
