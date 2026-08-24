export type RolUsuario = 'admin' | 'usuario';
export type EstadoUsuario = 'pendiente' | 'activo' | 'bloqueado';

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  foto: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  creadoEn: Date;
}

export function esAdmin(usuario: Usuario): boolean {
  return usuario.rol === 'admin' && usuario.estado === 'activo';
}

export function puedeUsarLaApp(usuario: Usuario): boolean {
  return usuario.estado === 'activo';
}
