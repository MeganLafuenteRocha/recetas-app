export type RolUsuario = 'admin' | 'usuario';
export type EstadoUsuario = 'pendiente' | 'activo' | 'bloqueado';

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  foto: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  /** Hogar al que pertenece; lo asigna la admin al activar la cuenta. */
  hogarId: string | null;
  creadoEn: Date;
}

export function esAdmin(usuario: Usuario): boolean {
  return usuario.rol === 'admin' && usuario.estado === 'activo';
}

/** Activa y con hogar: sin hogar no hay despensa, planes ni listas donde guardar. */
export function puedeUsarLaApp(usuario: Usuario): boolean {
  return usuario.estado === 'activo' && usuario.hogarId !== null;
}
