import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Barra inferior fija con los 4 destinos confirmados (M3, píldora activa). */
@Component({
  selector: 'app-barra-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav>
      @for (destino of destinos; track destino.ruta) {
        <a [routerLink]="destino.ruta" routerLinkActive="activo">
          <span class="pildora"><span class="icono">{{ destino.icono }}</span></span>
          <small>{{ destino.nombre }}</small>
        </a>
      }
    </nav>
  `,
  styles: `
    nav {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 560px;
      height: 72px;
      padding-bottom: env(safe-area-inset-bottom);
      background: #fff;
      border-top: 1px solid var(--plomo-100);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 10;
    }
    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      color: var(--plomo-500);
      min-width: 64px;
    }
    .pildora {
      display: grid;
      place-items: center;
      width: 56px;
      height: 30px;
      border-radius: var(--radio-pill);
      transition: background 0.15s;
    }
    small {
      font-size: 11px;
      font-family: 'Poppins', sans-serif;
    }
    a.activo {
      color: var(--guindo-700);
      .pildora { background: var(--guindo-100); }
      small { font-weight: 600; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraNavComponent {
  protected readonly destinos = [
    { ruta: '/inicio', nombre: 'Inicio', icono: 'home' },
    { ruta: '/mi-dia', nombre: 'Mi día', icono: 'calendar_month' },
    { ruta: '/recetas', nombre: 'Recetas', icono: 'menu_book' },
    { ruta: '/despensa', nombre: 'Despensa', icono: 'shopping_basket' },
  ];
}
