import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SesionStore } from '../../../application/stores/sesion.store';

// Provisional: el menú principal real (mockup 04A Hero guindo) se construye en la S5.
@Component({
  selector: 'app-inicio',
  template: `
    <main class="pagina">
      <h1>Hola, {{ primerNombre() }} 👋</h1>
      <p>Tu cuenta está activa. El menú principal llega en la próxima sesión.</p>
      @if (sesion.esAdmin()) {
        <p class="admin"><span class="icono">shield_person</span> Administradora</p>
      }
      <button type="button" (click)="salir()">Cerrar sesión</button>
    </main>
  `,
  styles: `
    .pagina {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }
    .admin {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--dorado-700);
      background: var(--dorado-100);
      padding: 6px 14px;
      border-radius: var(--radio-pill);
      font-size: 13px;
      margin: 0;
      .icono { font-size: 18px; }
    }
    button {
      margin-top: 12px;
      padding: 10px 24px;
      border: 1px solid var(--plomo-300);
      border-radius: var(--radio-pill);
      background: #fff;
      color: var(--guindo-700);
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPage {
  protected readonly sesion = inject(SesionStore);
  private readonly router = inject(Router);

  protected primerNombre(): string {
    return this.sesion.usuario()?.nombre.split(' ')[0] ?? '';
  }

  async salir(): Promise<void> {
    await this.sesion.salir();
    await this.router.navigateByUrl('/login');
  }
}
