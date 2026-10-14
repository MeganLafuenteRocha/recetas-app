import { EstadoUsuario, Usuario } from './usuario.model';

/**
 * Puerto del repositorio de usuarios (colección usuarios/{uid}).
 * Lo implementa infrastructure/firebase/firestore-usuarios.repo.ts.
 */
export abstract class UsuarioRepository {
  abstract obtener(uid: string): Promise<Usuario | null>;

  /** Crea el documento del usuario en estado "pendiente". */
  abstract crearPendiente(usuario: Usuario): Promise<void>;

  /** Solo admin: cuentas en un estado (pendientes, activas o bloqueadas). */
  abstract listarPorEstado(estado: EstadoUsuario): Promise<Usuario[]>;

  /** Solo admin. */
  abstract cambiarEstado(uid: string, estado: EstadoUsuario): Promise<void>;
}
