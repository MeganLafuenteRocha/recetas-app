import { Ingrediente } from './ingrediente.model';

export abstract class IngredienteRepository {
  /** Semilla: ingredientes/{id}. */
  abstract obtenerComunes(): Promise<Ingrediente[]>;

  /** Propios del hogar actual: hogares/{hogarId}/ingredientes/{id}. */
  abstract obtenerPropios(): Promise<Ingrediente[]>;

  /** Alta o edición de varios a la vez, en UNA operación atómica (writeBatch). Cada uno va según su ámbito. */
  abstract guardarLote(ingredientes: Ingrediente[]): Promise<void>;
}
