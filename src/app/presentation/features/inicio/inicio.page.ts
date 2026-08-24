import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { CargarDatosInicialesUseCase } from '../../../application/use-cases/cargar-datos-iniciales.usecase';

// Provisional: el menú principal real (mockup 04A Hero guindo) se construye en la S5.
@Component({
  selector: 'app-inicio',
  template: `
    <main class="pagina">
      <h1>Hola, {{ primerNombre() }} 👋</h1>
      @if (sesion.esAdmin()) {
        <p class="admin"><span class="icono">shield_person</span> Administradora</p>
      }

      @if (datos.listo()) {
        <div class="cards">
          <div class="card">
            <span class="icono">menu_book</span>
            <strong>{{ recetas.total() }}</strong>
            <small>recetas</small>
          </div>
          <div class="card">
            <span class="icono">grocery</span>
            <strong>{{ ingredientes.total() }}</strong>
            <small>ingredientes</small>
          </div>
        </div>
        <p class="nota">Todo cargado en memoria. El menú principal llega en la próxima sesión.</p>
      } @else {
        <p class="nota">Cargando tus datos…</p>
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
    .cards {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    .card {
      background: #fff;
      border-radius: var(--radio-l);
      box-shadow: var(--sombra-1);
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      .icono { color: var(--guindo-700); }
      strong {
        font-family: 'Quicksand', sans-serif;
        font-size: 22px;
        color: var(--plomo-900);
      }
      small { color: var(--plomo-500); }
    }
    .nota {
      color: var(--plomo-500);
      font-size: 13px;
      margin: 0;
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
  protected readonly datos = inject(CargarDatosInicialesUseCase);
  protected readonly recetas = inject(RecetasStore);
  protected readonly ingredientes = inject(IngredientesStore);
  private readonly router = inject(Router);

  protected primerNombre(): string {
    return this.sesion.usuario()?.nombre.split(' ')[0] ?? '';
  }

  async salir(): Promise<void> {
    await this.sesion.salir();
    await this.router.navigateByUrl('/login');
  }
}
