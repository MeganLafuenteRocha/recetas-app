import { computed, inject, Injectable, signal } from '@angular/core';
import { EstadoUsuario, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';

/**
 * Solo admin: cuentas por estado, activación y bloqueo.
 * Cada pestaña consulta al abrirse por primera vez (pocas lecturas, pocas veces).
 */
@Injectable({ providedIn: 'root' })
export class AdministrarCuentasUseCase {
  private readonly usuarios = inject(UsuarioRepository);

  private readonly _porEstado = signal<Partial<Record<EstadoUsuario, Usuario[]>>>({});

  readonly pendientes = computed(() => this._porEstado().pendiente ?? null);

  cuentas(estado: EstadoUsuario): Usuario[] | null {
    return this._porEstado()[estado] ?? null;
  }

  async cargar(estado: EstadoUsuario, forzar = false): Promise<void> {
    if (!forzar && this._porEstado()[estado]) return;
    const lista = await this.usuarios.listarPorEstado(estado);
    this._porEstado.update((m) => ({ ...m, [estado]: lista }));
  }

  async cargarPendientes(): Promise<void> {
    await this.cargar('pendiente', true);
  }

  /** Mueve la cuenta de una pestaña a otra sin volver a consultar. */
  async cambiarEstado(usuario: Usuario, estado: EstadoUsuario): Promise<void> {
    await this.usuarios.cambiarEstado(usuario.uid, estado);
    this._porEstado.update((m) => {
      const sin = (lista?: Usuario[]) => lista?.filter((u) => u.uid !== usuario.uid);
      const nuevo: Partial<Record<EstadoUsuario, Usuario[]>> = {
        pendiente: sin(m.pendiente),
        activo: sin(m.activo),
        bloqueado: sin(m.bloqueado),
      };
      const destino = nuevo[estado];
      if (destino) nuevo[estado] = [...destino, { ...usuario, estado }];
      return nuevo;
    });
  }
}
