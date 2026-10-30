import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * «C · Barra de pestañas»: cápsula flotante con los 4 destinos y, al centro,
 * el botón principal de la app: armar el día.
 */
@Component({
  selector: 'app-barra-pestanas',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Principal">
      @for (destino of destinos; track destino.ruta; let i = $index) {
        @if (i === 2) {
          <a class="armar" routerLink="/dia" aria-label="Armar mi día" data-testid="btn-armar-centro">
            <span class="icono">skillet</span>
          </a>
        }
        <a class="pestana" [routerLink]="destino.ruta" routerLinkActive="activa" #rla="routerLinkActive">
          <span class="icono" [class.lleno]="rla.isActive">{{ destino.icono }}</span>
          <small>{{ destino.nombre }}</small>
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      position: fixed;
      bottom: 0;
      left: 50%;
      z-index: 10;
      width: 100%;
      max-width: 560px;
      transform: translateX(-50%);
      padding: 4px 16px calc(14px + env(safe-area-inset-bottom));
      pointer-events: none;
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 66px;
      padding: 6px 10px;
      border-radius: var(--radio-pill);
      background: var(--color-superficie-translucida);
      backdrop-filter: blur(14px);
      box-shadow: var(--sombra-flotante);
      pointer-events: auto;
    }
    .pestana {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 60px;
      padding: 6px 10px;
      border-radius: var(--radio-pill);
      color: var(--color-texto-tenue);
      text-decoration: none;
    }
    .pestana small { font-size: 10px; }
    .pestana.activa { background: var(--color-primario-suave); color: var(--color-primario); }
    .pestana.activa small { font-weight: 600; }
    .armar {
      display: grid;
      place-items: center;
      width: 54px;
      height: 54px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-primario);
      color: var(--color-texto-invertido);
      box-shadow: var(--sombra-boton);
    }
    .armar .icono { font-size: 26px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraPestanasComponent {
  protected readonly destinos = [
    { ruta: '/inicio', nombre: 'Inicio', icono: 'home' },
    { ruta: '/mi-dia', nombre: 'Mi día', icono: 'calendar_month' },
    { ruta: '/recetas', nombre: 'Recetas', icono: 'menu_book' },
    { ruta: '/despensa', nombre: 'Despensa', icono: 'kitchen' },
  ];
}
