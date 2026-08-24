import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SesionStore } from '../../application/stores/sesion.store';
import { UiStore } from '../../application/stores/ui.store';
import { AdministrarCuentasUseCase } from '../../application/use-cases/administrar-cuentas.usecase';

/** Mockup 06: menú lateral con perfil, grupos y administración. */
@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuLateralComponent {
  protected readonly ui = inject(UiStore);
  protected readonly sesion = inject(SesionStore);
  protected readonly cuentas = inject(AdministrarCuentasUseCase);
  private readonly router = inject(Router);

  constructor() {
    // Al abrir el menú por primera vez (solo admin): una consulta pequeña de pendientes.
    effect(() => {
      if (this.ui.menuLateralAbierto() && this.sesion.esAdmin() && this.cuentas.pendientes() === null) {
        void this.cuentas.cargarPendientes();
      }
    });
  }

  protected readonly inicial = computed(
    () => this.sesion.usuario()?.nombre.charAt(0).toUpperCase() ?? '?',
  );

  protected readonly rotuloPendientes = computed(() => {
    const lista = this.cuentas.pendientes();
    if (lista === null) return '';
    if (lista.length === 0) return 'sin pendientes';
    return `${lista.length} pendiente${lista.length === 1 ? '' : 's'}`;
  });

  protected async ir(ruta: string): Promise<void> {
    this.ui.cerrarMenuLateral();
    await this.router.navigateByUrl(ruta);
  }

  protected async salir(): Promise<void> {
    this.ui.cerrarMenuLateral();
    await this.sesion.salir();
    await this.router.navigateByUrl('/login');
  }
}
