import { Usuario } from './usuario.model';

/**
 * Puerto del repositorio de usuarios (colección usuarios/{uid}).
 * Lo implementa infrastructure/firebase/firestore-usuarios.repo.ts.
 */
export abstract class UsuarioRepository {
  abstract obtener(uid: string): Promise<Usuario | null>;

  /** Crea el documento del usuario en estado "pendiente". */
  abstract crearPendiente(usuario: Usuario): Promise<void>;

  /** Solo admin (S11): cuentas esperando activación. */
  abstract listarPendientes(): Promise<Usuario[]>;

  /** Solo admin (S11). */
  abstract cambiarEstado(uid: string, estado: Usuario['estado']): Promise<void>;
}
