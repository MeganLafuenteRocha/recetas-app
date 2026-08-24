import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';

/** Solo admin: activar cuentas que esperan aprobación. */
@Component({
  selector: 'app-cuentas',
  imports: [RouterLink],
  template: `
    <header class="encabezado">
      <a class="volver" routerLink="/inicio"><span class="icono">arrow_back</span></a>
      <h1>Cuentas</h1>
      <button type="button" class="refrescar" (click)="refrescar()" [disabled]="cargando()">
        <span class="icono">refresh</span>
      </button>
    </header>

    <section class="lista">
      @for (usuario of cuentas.pendientes() ?? []; track usuario.uid) {
        <div class="fila">
          <span class="avatar">{{ usuario.nombre.charAt(0).toUpperCase() }}</span>
          <span class="datos">
            <strong>{{ usuario.nombre }}</strong>
            <small>{{ usuario.email }}</small>
          </span>
          <button type="button" class="activar" (click)="activar(usuario.uid)">Activar</button>
        </div>
      } @empty {
        <div class="vacio">
          <span class="icono">how_to_reg</span>
          <p>No hay cuentas esperando activación.</p>
        </div>
      }
    </section>
  `,
  styles: `
    .encabezado {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px 8px;
      h1 { flex: 1; font-size: 22px; margin: 0; }
      .volver { text-decoration: none; color: var(--plomo-900); }
      .refrescar {
        border: 1px solid var(--plomo-300);
        background: #fff;
        border-radius: var(--radio-pill);
        padding: 7px 12px;
        cursor: pointer;
        color: var(--plomo-700);
        .icono { font-size: 19px; display: block; }
      }
    }
    .lista { padding: 8px 16px; display: flex; flex-direction: column; gap: 10px; }
    .fila {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border-radius: var(--radio-m);
      box-shadow: var(--sombra-1);
      padding: 12px 14px;
    }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--plomo-100); color: var(--plomo-700);
      font-family: 'Quicksand', sans-serif; font-weight: 700;
      display: grid; place-items: center;
    }
    .datos {
      flex: 1; display: flex; flex-direction: column; min-width: 0;
      strong { font-size: 14px; color: var(--plomo-900); }
      small { color: var(--plomo-500); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
    }
    .activar {
      border: none;
      background: var(--guindo-700);
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      padding: 9px 18px;
      border-radius: var(--radio-pill);
      cursor: pointer;
    }
    .vacio {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 48px 16px;
      .icono { font-size: 40px; color: var(--plomo-300); }
      p { color: var(--plomo-500); font-size: 13px; margin: 0; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuentasPage implements OnInit {
  protected readonly cuentas = inject(AdministrarCuentasUseCase);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    if (this.cuentas.pendientes() === null) {
      void this.refrescar();
    }
  }

  protected async refrescar(): Promise<void> {
    this.cargando.set(true);
    try {
      await this.cuentas.cargarPendientes();
    } finally {
      this.cargando.set(false);
    }
  }

  protected activar(uid: string): void {
    void this.cuentas.activar(uid);
  }
}
