import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SesionStore } from '../../../application/stores/sesion.store';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly sesion = inject(SesionStore);
  private readonly router = inject(Router);

  constructor() {
    // Cuando el login termina, decide a dónde ir según el estado de la cuenta.
    effect(() => {
      if (this.sesion.fase() !== 'con-sesion') return;
      this.router.navigateByUrl(this.sesion.activo() ? '/bienvenida' : '/pendiente');
    });
  }

  entrar(): void {
    void this.sesion.entrarConGoogle();
  }
}
