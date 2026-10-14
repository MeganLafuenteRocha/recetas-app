import { Ingrediente } from './ingrediente.model';

export abstract class IngredienteRepository {
  abstract obtenerTodos(): Promise<Ingrediente[]>;

  /** Alta o edición de varios a la vez, en UNA operación atómica (writeBatch). */
  abstract guardarLote(ingredientes: Ingrediente[]): Promise<void>;
}
