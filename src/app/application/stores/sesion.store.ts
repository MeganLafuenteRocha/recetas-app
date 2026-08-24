import { computed, inject, Injectable, signal } from '@angular/core';
import { SesionPort } from '../../domain/usuarios/sesion.port';
import { esAdmin, puedeUsarLaApp, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';
import { IniciarSesionUseCase } from '../use-cases/iniciar-sesion.usecase';

export type FaseSesion = 'cargando' | 'anonimo' | 'con-sesion';

@Injectable({ providedIn: 'root' })
export class SesionStore {
  private readonly sesion = inject(SesionPort);
  private readonly usuarios = inject(UsuarioRepository);
  private readonly iniciarSesion = inject(IniciarSesionUseCase);

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
    const usuario = await this.iniciarSesion.ejecutar(cuenta);
    this._usuario.set(usuario);
    this._fase.set('con-sesion');
  }

  async entrarConGoogle(): Promise<void> {
    this._error.set(null);
    try {
      const cuenta = await this.sesion.iniciarConGoogle();
      const usuario = await this.iniciarSesion.ejecutar(cuenta);
      this._usuario.set(usuario);
      this._fase.set('con-sesion');
    } catch {
      this._error.set('No se pudo iniciar sesión. Intenta de nuevo.');
    }
  }

  /** Botón "volver a verificar" de la pantalla de cuenta pendiente. */
  async reverificar(): Promise<void> {
    const actual = this._usuario();
    if (!actual) return;
    const fresco = await this.usuarios.obtener(actual.uid);
    if (fresco) this._usuario.set(fresco);
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    this._usuario.set(null);
    this._fase.set('anonimo');
  }
}
