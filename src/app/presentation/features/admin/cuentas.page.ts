import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';
import { EstadoUsuario, Usuario } from '../../../domain/usuarios/usuario.model';

const PESTANAS: { estado: EstadoUsuario; nombre: string }[] = [
  { estado: 'pendiente', nombre: 'Pendientes' },
  { estado: 'activo', nombre: 'Activas' },
  { estado: 'bloqueado', nombre: 'Bloqueadas' },
];

/** Pantalla 17 (solo admin): activar, rechazar o reactivar cuentas. */
@Component({
  selector: 'app-cuentas',
  imports: [RouterLink],
  template: `
    <main class="vista">
      <header class="cabecera">
        <a class="icono-btn" routerLink="/ajustes" aria-label="Volver"><span class="icono">arrow_back</span></a>
        <h1>Cuentas</h1>
        <button type="button" class="icono-btn" (click)="refrescar()" [disabled]="cargando()" aria-label="Actualizar">
          <span class="icono">refresh</span>
        </button>
      </header>

      <div class="segmentado">
        @for (p of pestanas; track p.estado) {
          <button type="button" [class.activo]="pestana() === p.estado" (click)="pestana.set(p.estado)">
            {{ p.nombre }}
            @if (cuentas.cuentas(p.estado); as lista) { <small>{{ lista.length }}</small> }
          </button>
        }
      </div>

      @if (lista() === null) {
        <p class="texto-suave">Cargando…</p>
      } @else {
        @for (u of lista(); track u.uid) {
          <article class="tarjeta cuenta">
            <div class="fila">
              @if (u.foto) {
                <img class="avatar" [src]="u.foto" alt="" referrerpolicy="no-referrer" />
              } @else {
                <span class="avatar">{{ u.nombre.charAt(0).toUpperCase() }}</span>
              }
              <div class="datos">
                <strong>{{ u.nombre }}</strong>
                <small>{{ u.email }}</small>
              </div>
              <span class="cuando">{{ hace(u) }}</span>
            </div>
            <div class="acciones">
              @switch (pestana()) {
                @case ('pendiente') {
                  <button type="button" class="btn btn-borde-plomo" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'bloqueado')">
                    <span class="icono">block</span> Rechazar
                  </button>
                  <button type="button" class="btn btn-primario" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'activo')">
                    <span class="icono">check</span> Activar
                  </button>
                }
                @case ('activo') {
                  @if (u.rol !== 'admin') {
                    <button type="button" class="btn btn-borde-plomo" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'bloqueado')">
                      <span class="icono">block</span> Bloquear
                    </button>
                  } @else {
                    <span class="chip dorado">Administradora</span>
                  }
                }
                @case ('bloqueado') {
                  <button type="button" class="btn btn-primario" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'activo')">
                    <span class="icono">lock_open</span> Reactivar
                  </button>
                }
              }
            </div>
          </article>
        } @empty {
          <div class="vacio-estado">
            <span class="icono">how_to_reg</span>
            <p>{{ pestana() === 'pendiente' ? 'No hay cuentas esperando activación.' : 'No hay cuentas aquí.' }}</p>
          </div>
        }
      }

      <p class="aviso"><span class="icono">info</span> Las cuentas nuevas entran como pendientes. Solo tú puedes activarlas.</p>
    </main>
  `,
  styles: `
    .segmentado small { font-size: 11px; opacity: 0.8; }
    .cuenta { display: flex; flex-direction: column; gap: 12px; }
    .fila { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--plomo-100); color: var(--plomo-700);
      font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 17px; display: grid; place-items: center; object-fit: cover; flex-shrink: 0; }
    .datos { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .datos strong { font-size: 14px; color: var(--plomo-900); }
    .datos small { color: var(--plomo-500); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
    .cuando { font-size: 10px; font-weight: 500; color: var(--alerta); background: #b7791f1a; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
    .acciones { display: flex; gap: 8px; }
    .acciones .btn { flex: 1; padding: 9px; }
    .btn-borde-plomo { background: #fff; border: 1px solid #e4e4e7; color: var(--plomo-700); font-weight: 500; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuentasPage {
  protected readonly cuentas = inject(AdministrarCuentasUseCase);
  protected readonly pestanas = PESTANAS;
  protected readonly pestana = signal<EstadoUsuario>('pendiente');
  protected readonly cargando = signal(false);
  protected readonly ocupado = signal<string | null>(null);

  protected readonly lista = computed(() => this.cuentas.cuentas(this.pestana()));

  constructor() {
    // Cada pestaña consulta la primera vez que se abre.
    effect(() => {
      const estado = this.pestana();
      void this.cuentas.cargar(estado, estado === 'pendiente');
    });
  }

  protected async refrescar(): Promise<void> {
    this.cargando.set(true);
    try {
      await this.cuentas.cargar(this.pestana(), true);
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiar(u: Usuario, estado: EstadoUsuario): Promise<void> {
    this.ocupado.set(u.uid);
    try {
      await this.cuentas.cambiarEstado(u, estado);
    } finally {
      this.ocupado.set(null);
    }
  }

  protected hace(u: Usuario): string {
    const dias = Math.floor((Date.now() - u.creadoEn.getTime()) / 86_400_000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'ayer';
    return `hace ${dias} días`;
  }
}
