import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';
import { EstadoUsuario, Usuario } from '../../../domain/usuarios/usuario.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
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
  imports: [HojaComponent, EncabezadoComponent, AvisoComponent],
  template: `
    <main class="pantalla">
      <app-encabezado titulo="Cuentas" volver="/ajustes">
        <button type="button" class="boton-icono" (click)="refrescar()" [disabled]="cargando()" aria-label="Actualizar">
          <span class="icono">refresh</span>
        </button>
      </app-encabezado>

      <div class="segmentos" role="tablist" aria-label="Estado de las cuentas">
        @for (p of pestanas; track p.estado) {
          <button type="button" role="tab" [attr.aria-selected]="pestana() === p.estado" [class.activo]="pestana() === p.estado" (click)="pestana.set(p.estado)">
            {{ p.nombre }}
            @if (cuentas.cuentas(p.estado); as lista) { <span>{{ lista.length }}</span> }
          </button>
        }
      </div>

      @if (lista() === null) {
        <p class="t-detalle">Cargando…</p>
      } @else {
        @for (u of lista(); track u.uid) {
          <article class="tarjeta cuenta">
            <div class="fila">
              @if (u.foto) {
                <img class="avatar suave" [src]="u.foto" alt="" referrerpolicy="no-referrer" />
              } @else {
                <span class="avatar suave" aria-hidden="true">{{ u.nombre.charAt(0).toUpperCase() }}</span>
              }
              <div class="datos">
                <strong>{{ u.nombre }}</strong>
                <span class="t-detalle">{{ u.email }}</span>
                @if (u.hogarId) { <span class="t-detalle hogar"><span class="icono">home</span> {{ cuentas.nombreHogar(u.hogarId) }}</span> }
              </div>
              <span class="cuando">{{ hace(u) }}</span>
            </div>
            <div class="acciones">
              @switch (pestana()) {
                @case ('pendiente') {
                  <button type="button" class="btn btn-chico btn-neutro" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'bloqueado')">
                    <span class="icono">block</span> Rechazar
                  </button>
                  <button type="button" class="btn btn-chico btn-primario" [disabled]="ocupado() === u.uid" (click)="abrirActivar(u)">
                    <span class="icono">home</span> Activar en hogar
                  </button>
                }
                @case ('activo') {
                  @if (u.rol !== 'admin') {
                    <button type="button" class="btn btn-chico btn-neutro" [disabled]="ocupado() === u.uid" (click)="cambiar(u, 'bloqueado')">
                      <span class="icono">block</span> Bloquear
                    </button>
                  } @else {
                    <span class="pastilla">Administradora</span>
                  }
                }
                @case ('bloqueado') {
                  <button type="button" class="btn btn-chico btn-primario" [disabled]="ocupado() === u.uid" (click)="reactivar(u)">
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

      <app-aviso icono="info" titulo="Cada hogar ve solo lo suyo">
        Las cuentas nuevas entran como pendientes. Al activarlas eliges su hogar: despensa, planes, listas y recetas propias quedan separados.
      </app-aviso>
    </main>

    @if (activando(); as u) {
      <app-hoja [titulo]="'Activar a ' + u.nombre" (cerrar)="activando.set(null)">
        <p class="t-texto ayuda">Elige el hogar al que va a pertenecer.</p>

        @if (cuentas.hogares().length > 0) {
          <div class="tarjeta lista" role="radiogroup" aria-label="Hogar">
            @for (h of cuentas.hogares(); track h.id) {
              <button type="button" class="opcion-hogar" role="radio" [attr.aria-checked]="hogarElegido() === h.id" (click)="hogarElegido.set(h.id)">
                <span class="circulo-icono"><span class="icono">home</span></span>
                <span class="textos">
                  <strong>{{ h.nombre }}</strong>
                  @if (miembros(h.id); as m) { <span class="t-detalle">{{ m }}</span> }
                </span>
                <span class="radio" [class.marcada]="hogarElegido() === h.id"></span>
              </button>
            }
          </div>
        }

        <button
          type="button"
          class="btn btn-secundario btn-ancho crear"
          role="radio"
          [class.elegido]="hogarElegido() === nuevo"
          [attr.aria-checked]="hogarElegido() === nuevo"
          (click)="hogarElegido.set(nuevo)"
        >
          <span class="icono">add_home</span> Crear un hogar nuevo
        </button>
        @if (hogarElegido() === nuevo) {
          <label class="campo">
            <span>Nombre del hogar nuevo</span>
            <input class="caja" type="text" placeholder="Familia Rocha" [value]="nombreNuevo()" (input)="nombreNuevo.set($any($event.target).value)" />
          </label>
        }
        @if (error(); as e) { <app-aviso icono="error" tono="error" [titulo]="e" /> }
        <button type="button" class="btn btn-primario btn-ancho" [disabled]="ocupado() === u.uid" (click)="confirmarActivar(u)">
          <span class="icono">check</span> {{ textoActivar() }}
        </button>
      </app-hoja>
    }
  `,
  styles: `
    .segmentos span { opacity: 0.85; }
    .cuenta { padding: 20px; gap: 16px; }
    .fila { display: flex; align-items: center; gap: 14px; }
    .datos { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .datos strong { font-family: var(--fuente-titulo); font-size: 17px; }
    .datos .t-detalle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .datos .hogar { display: flex; align-items: center; gap: 4px; }
    .datos .hogar .icono { font-size: 13px; }
    .cuando { align-self: flex-start; margin-top: 6px; font-size: 11px; font-weight: 500; color: var(--color-acento); white-space: nowrap; }
    .acciones { display: flex; gap: 10px; }
    .acciones .btn { flex: 1; min-width: 0; }
    .ayuda { color: var(--color-texto-suave); margin-top: -8px; }
    .opcion-hogar {
      display: flex; align-items: center; gap: var(--esp-grupo); width: 100%; padding: 12px 0;
      border: none; background: none; color: var(--color-texto); font: inherit; text-align: left; cursor: pointer;
    }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .textos strong { font-size: 14px; font-weight: 600; }
    .crear { justify-content: flex-start; border: 2px solid var(--color-primario-suave); }
    .crear.elegido { border-color: var(--color-primario); }
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

  protected readonly textoActivar = computed(() => {
    const elegido = this.hogarElegido();
    const nombre = this.nombreNuevo().trim();
    if (elegido === NUEVO) return nombre ? `Crear «${nombre}» y activar` : 'Crear hogar y activar';
    return `Activar en ${this.cuentas.nombreHogar(elegido)}`;
  });

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

  /** «3 miembros», contando las cuentas activas ya cargadas (si no se cargaron, no se muestra). */
  protected miembros(hogarId: string): string | null {
    const activas = this.cuentas.cuentas('activo');
    if (!activas) return null;
    const n = activas.filter((c) => c.hogarId === hogarId).length;
    return `${n} miembro${n === 1 ? '' : 's'}`;
  }

  protected hace(u: Usuario): string {
    const dias = Math.floor((Date.now() - u.creadoEn.getTime()) / 86_400_000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'ayer';
    return `hace ${dias} días`;
  }
}
