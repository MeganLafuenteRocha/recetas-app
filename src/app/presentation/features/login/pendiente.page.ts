import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SesionStore } from '../../../application/stores/sesion.store';
import { AvisoComponent } from '../../ui/aviso.component';

/** Pantalla 02A: la cuenta existe pero la administradora aún no la activa. */
@Component({
  selector: 'app-pendiente',
  imports: [AvisoComponent],
  templateUrl: './pendiente.page.html',
  styleUrl: './pendiente.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendientePage {
  protected readonly sesion = inject(SesionStore);
  private readonly router = inject(Router);

  protected readonly verificando = signal(false);
  protected readonly sinCambios = signal(false);

  protected readonly primerNombre = computed(() => this.sesion.usuario()?.nombre.split(' ')[0] ?? '');

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
    // Recarga completa: no queda en memoria nada del hogar anterior.
    window.location.assign('/login');
  }
}
