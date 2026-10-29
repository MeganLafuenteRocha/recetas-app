import { computed, inject, Injectable, signal } from '@angular/core';
import { Hogar, idParaHogar, validarNombreHogar } from '../../domain/hogares/hogar.model';
import { HogarRepository } from '../../domain/hogares/hogar.port';
import { EstadoUsuario, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';

/**
 * Solo admin: cuentas por estado, activación en un hogar y bloqueo.
 * Cada pestaña consulta al abrirse por primera vez (pocas lecturas, pocas veces).
 */
@Injectable({ providedIn: 'root' })
export class AdministrarCuentasUseCase {
  private readonly usuarios = inject(UsuarioRepository);
  private readonly hogaresRepo = inject(HogarRepository);

  private readonly _porEstado = signal<Partial<Record<EstadoUsuario, Usuario[]>>>({});
  private readonly _hogares = signal<Hogar[] | null>(null);

  readonly pendientes = computed(() => this._porEstado().pendiente ?? null);
  readonly hogares = computed(() =>
    [...(this._hogares() ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );

  cuentas(estado: EstadoUsuario): Usuario[] | null {
    return this._porEstado()[estado] ?? null;
  }

  nombreHogar(id: string | null): string {
    if (!id) return 'Sin hogar';
    return this._hogares()?.find((h) => h.id === id)?.nombre ?? id;
  }

  async cargar(estado: EstadoUsuario, forzar = false): Promise<void> {
    if (!forzar && this._porEstado()[estado]) return;
    const lista = await this.usuarios.listarPorEstado(estado);
    this._porEstado.update((m) => ({ ...m, [estado]: lista }));
  }

  async cargarPendientes(): Promise<void> {
    await this.cargar('pendiente', true);
  }

  async cargarHogares(): Promise<void> {
    if (this._hogares() !== null) return;
    this._hogares.set(await this.hogaresRepo.obtenerTodos());
  }

  /** Crea el hogar y devuelve su id, o el error en lenguaje simple. */
  async crearHogar(nombre: string): Promise<{ id: string | null; error: string | null }> {
    const error = validarNombreHogar(nombre);
    if (error) return { id: null, error };
    const existentes = new Set((this._hogares() ?? []).map((h) => h.id));
    const hogar: Hogar = { id: idParaHogar(nombre, existentes), nombre: nombre.trim(), creadoEn: new Date() };
    await this.hogaresRepo.crear(hogar);
    this._hogares.update((lista) => [...(lista ?? []), hogar]);
    return { id: hogar.id, error: null };
  }

  /** Activar = estado activo + hogar, en una sola escritura. */
  async activarEnHogar(usuario: Usuario, hogarId: string): Promise<void> {
    await this.usuarios.activarEnHogar(usuario.uid, hogarId);
    this.mover(usuario, { ...usuario, estado: 'activo', hogarId });
  }

  /** Bloquear o reactivar (la cuenta conserva su hogar). */
  async cambiarEstado(usuario: Usuario, estado: EstadoUsuario): Promise<void> {
    await this.usuarios.cambiarEstado(usuario.uid, estado);
    this.mover(usuario, { ...usuario, estado });
  }

  /** Mueve la cuenta de una pestaña a otra sin volver a consultar. */
  private mover(antes: Usuario, despues: Usuario): void {
    this._porEstado.update((m) => {
      const sin = (lista?: Usuario[]) => lista?.filter((u) => u.uid !== antes.uid);
      const nuevo: Partial<Record<EstadoUsuario, Usuario[]>> = {
        pendiente: sin(m.pendiente),
        activo: sin(m.activo),
        bloqueado: sin(m.bloqueado),
      };
      const destino = nuevo[despues.estado];
      if (destino) nuevo[despues.estado] = [...destino, despues];
      return nuevo;
    });
  }
}
