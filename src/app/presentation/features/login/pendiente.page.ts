import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SesionStore } from '../../../application/stores/sesion.store';

@Component({
  selector: 'app-pendiente',
  templateUrl: './pendiente.page.html',
  styleUrl: './pendiente.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendientePage {
  protected readonly sesion = inject(SesionStore);
  private readonly router = inject(Router);

  protected readonly verificando = signal(false);
  protected readonly sinCambios = signal(false);

  async verificar(): Promise<void> {
    this.verificando.set(true);
    this.sinCambios.set(false);
    await this.sesion.reverificar();
    this.verificando.set(false);
    if (this.sesion.activo()) {
      await this.router.navigateByUrl('/bienvenida');
    } else {
      this.sinCambios.set(true);
    }
  }

  async salir(): Promise<void> {
    await this.sesion.salir();
    await this.router.navigateByUrl('/login');
  }
}
