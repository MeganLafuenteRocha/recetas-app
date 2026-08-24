import { Despensa } from './despensa.model';

export abstract class DespensaRepository {
  abstract obtener(): Promise<Despensa>;
  abstract guardar(ingredienteIds: string[]): Promise<void>;
}
