import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';
import { EstadoUsuario, Usuario } from '../../../domain/usuarios/usuario.model';
import { HojaComponent } from '../../ui/hoja.component';

const PESTANAS: { estado: EstadoUsuario; nombre: string }[] = [
  { estado: 'pendiente', nombre: 'Pendientes' },
  { estado: 'activo', nombre: 'Activas' },
  { estado: 'bloqueado', nombre: 'Bloqueadas' },
];

/** Valor del selector para crear un hogar en el momento. */
const NUEVO = '__nuevo__';

/** Pantalla 17 (solo admin): activar en un hogar, rechazar o reactivar cuentas. */
@Component({
  selector: 'app-cuentas',
  imports: [RouterLink, HojaComponent],
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
                @if (u.hogarId) { <small class="hogar"><span class="icono">home</span> {{ cuentas.nombreHogar(u.hogarId) }}</small> }
              </div>
              <span class="cuando">{{ hace(u) }}</span>
            </div>
            <div class="acciones">
              @switch (pestana()) {
                @case ('pendiente') {
                  <button type="button" class="btn btn-borde-plomo" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'bloqueado')">
                    <span class="icono">block</span> Rechazar
                  </button>
                  <button type="button" class="btn btn-primario" [disabled]="ocupado() === u.uid" (click)="abrirActivar(u)">
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
                  <button type="button" class="btn btn-primario" [disabled]="ocupado() === u.uid" (click)="reactivar(u)">
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

      <p class="aviso"><span class="icono">info</span> Las cuentas nuevas entran como pendientes. Al activarlas eliges su hogar: cada hogar ve solo su despensa, planes, listas y recetas propias.</p>
    </main>

    @if (activando(); as u) {
      <app-hoja [titulo]="'Activar a ' + u.nombre" (cerrar)="activando.set(null)">
        <label class="campo">
          <span>Hogar</span>
          <select [value]="hogarElegido()" (change)="hogarElegido.set($any($event.target).value)">
            @for (h of cuentas.hogares(); track h.id) {
              <option [value]="h.id">{{ h.nombre }}</option>
            }
            <option [value]="nuevo">+ Hogar nuevo…</option>
          </select>
        </label>
        @if (hogarElegido() === nuevo) {
          <label class="campo">
            <span>Nombre del hogar nuevo</span>
            <input type="text" placeholder="Familia Rocha" [value]="nombreNuevo()" (input)="nombreNuevo.set($any($event.target).value)" />
          </label>
        }
        @if (error(); as e) { <p class="aviso error"><span class="icono">error</span> {{ e }}</p> }
        <button type="button" class="btn btn-primario ancho" [disabled]="ocupado() === u.uid" (click)="confirmarActivar(u)">Activar</button>
      </app-hoja>
    }
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
    .datos .hogar { display: flex; align-items: center; gap: 3px; color: var(--plomo-700); }
    .datos .hogar .icono { font-size: 13px; }
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

  protected readonly nuevo = NUEVO;
  protected readonly activando = signal<Usuario | null>(null);
  protected readonly hogarElegido = signal<string>(NUEVO);
  protected readonly nombreNuevo = signal('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.cuentas.cargarHogares();
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

  protected abrirActivar(u: Usuario): void {
    this.error.set(null);
    this.nombreNuevo.set('');
    this.hogarElegido.set(this.cuentas.hogares()[0]?.id ?? NUEVO);
    this.activando.set(u);
  }

  protected async confirmarActivar(u: Usuario): Promise<void> {
    this.ocupado.set(u.uid);
    this.error.set(null);
    try {
      let hogarId: string | null = this.hogarElegido();
      if (hogarId === NUEVO) {
        const creado = await this.cuentas.crearHogar(this.nombreNuevo());
        if (creado.error) {
          this.error.set(creado.error);
          return;
        }
        hogarId = creado.id;
      }
      if (!hogarId) return;
      await this.cuentas.activarEnHogar(u, hogarId);
      this.activando.set(null);
    } finally {
      this.ocupado.set(null);
    }
  }

  /** Una cuenta bloqueada vuelve a su hogar; si nunca tuvo uno, se elige al reactivarla. */
  protected reactivar(u: Usuario): void {
    if (u.hogarId) void this.cambiar(u, 'activo');
    else this.abrirActivar(u);
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
