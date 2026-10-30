import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { HogarActualStore } from '../../../application/stores/hogar-actual.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { CargarDatosInicialesUseCase } from '../../../application/use-cases/cargar-datos-iniciales.usecase';

/** Pantalla 02B: bienvenida tras activar la cuenta, antes del menú principal. */
@Component({
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrl: './bienvenida.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienvenidaPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly hogar = inject(HogarActualStore);
  protected readonly datos = inject(CargarDatosInicialesUseCase);
  protected readonly recetas = inject(RecetasStore);
  protected readonly ingredientes = inject(IngredientesStore);
  private readonly router = inject(Router);

  protected primerNombre(): string {
    return this.sesion.usuario()?.nombre.split(' ')[0] ?? '';
  }

  siguiente(): void {
    void this.router.navigateByUrl('/inicio');
  }

  async salir(): Promise<void> {
    await this.sesion.salir();
    // Recarga completa: no queda en memoria nada del hogar anterior.
    window.location.assign('/login');
  }
}
