import { inject, Injectable, signal } from '@angular/core';
import { Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';

/**
 * Solo admin: cuentas pendientes y su activación.
 * La consulta se hace al abrir la pantalla (pocas lecturas, pocas veces).
 */
@Injectable({ providedIn: 'root' })
export class AdministrarCuentasUseCase {
  private readonly usuarios = inject(UsuarioRepository);

  private readonly _pendientes = signal<Usuario[] | null>(null);
  readonly pendientes = this._pendientes.asReadonly();

  async cargarPendientes(): Promise<void> {
    this._pendientes.set(await this.usuarios.listarPendientes());
  }

  async activar(uid: string): Promise<void> {
    await this.usuarios.cambiarEstado(uid, 'activo');
    this._pendientes.set((this._pendientes() ?? []).filter((u) => u.uid !== uid));
  }
}
