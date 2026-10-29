import { computed, inject, Injectable, signal } from '@angular/core';
import { SesionPort } from '../../domain/usuarios/sesion.port';
import { esAdmin, puedeUsarLaApp, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';
import { CargarDatosInicialesUseCase } from '../use-cases/cargar-datos-iniciales.usecase';
import { IniciarSesionUseCase } from '../use-cases/iniciar-sesion.usecase';
import { HogarActualStore } from './hogar-actual.store';

export type FaseSesion = 'cargando' | 'anonimo' | 'con-sesion';

@Injectable({ providedIn: 'root' })
export class SesionStore {
  private readonly sesion = inject(SesionPort);
  private readonly usuarios = inject(UsuarioRepository);
  private readonly iniciarSesion = inject(IniciarSesionUseCase);
  private readonly cargarDatos = inject(CargarDatosInicialesUseCase);
  private readonly hogar = inject(HogarActualStore);

  private readonly _fase = signal<FaseSesion>('cargando');
  private readonly _usuario = signal<Usuario | null>(null);
  private readonly _error = signal<string | null>(null);

  readonly fase = this._fase.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly error = this._error.asReadonly();

  readonly activo = computed(() => {
    const u = this._usuario();
    return u !== null && puedeUsarLaApp(u);
  });
  readonly esAdmin = computed(() => {
    const u = this._usuario();
    return u !== null && esAdmin(u);
  });

  /** Al arrancar la app: restaura la sesión guardada, si la hay. */
  async restaurar(): Promise<void> {
    const cuenta = await this.sesion.cuentaActual();
    if (!cuenta) {
      this._fase.set('anonimo');
      return;
    }
    this.ponerUsuario(await this.iniciarSesion.ejecutar(cuenta));
    this._fase.set('con-sesion');
    await this.cargarSiActiva();
  }

  async entrarConGoogle(): Promise<void> {
    this._error.set(null);
    try {
      const cuenta = await this.sesion.iniciarConGoogle();
      this.ponerUsuario(await this.iniciarSesion.ejecutar(cuenta));
      this._fase.set('con-sesion');
      await this.cargarSiActiva();
    } catch {
      this._error.set('No se pudo iniciar sesión. Intenta de nuevo.');
    }
  }

  /** Botón "volver a verificar" de la pantalla de cuenta pendiente. */
  async reverificar(): Promise<void> {
    const actual = this._usuario();
    if (!actual) return;
    const fresco = await this.usuarios.obtener(actual.uid);
    if (fresco) this.ponerUsuario(fresco);
    await this.cargarSiActiva();
  }

  /** El hogar viaja con el usuario: los adaptadores lo necesitan para armar las rutas. */
  private ponerUsuario(usuario: Usuario | null): void {
    this._usuario.set(usuario);
    this.hogar.fijar(usuario?.hogarId ?? null, usuario !== null && esAdmin(usuario));
  }

  /** La única puerta a los datos: se cargan una vez, solo con cuenta activa. */
  private async cargarSiActiva(): Promise<void> {
    if (this.activo()) {
      await this.cargarDatos.ejecutar();
    }
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    this.ponerUsuario(null);
    this._fase.set('anonimo');
  }
}
