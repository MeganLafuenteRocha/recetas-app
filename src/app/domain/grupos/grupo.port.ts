import { Grupo } from './grupo.model';

export abstract class GrupoRepository {
  abstract obtenerTodos(): Promise<Grupo[]>;
  /** Solo admin (reglas de Firestore). */
  abstract guardar(grupo: Grupo): Promise<void>;
  abstract eliminar(id: string): Promise<void>;
}
