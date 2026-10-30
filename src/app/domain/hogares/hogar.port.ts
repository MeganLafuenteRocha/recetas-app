import { Hogar } from './hogar.model';

/** Listar y crear: solo admin (reglas de Firestore). Leer el propio hogar: sus miembros. */
export abstract class HogarRepository {
  abstract obtener(id: string): Promise<Hogar | null>;
  abstract obtenerTodos(): Promise<Hogar[]>;
  abstract crear(hogar: Hogar): Promise<void>;
}
