import { Ingrediente } from './ingrediente.model';

export abstract class IngredienteRepository {
  abstract obtenerTodos(): Promise<Ingrediente[]>;
}
