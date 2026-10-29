import { Hogar } from './hogar.model';

/** Solo admin (reglas de Firestore): crear hogares y listarlos para asignar cuentas. */
export abstract class HogarRepository {
  abstract obtenerTodos(): Promise<Hogar[]>;
  abstract crear(hogar: Hogar): Promise<void>;
}
