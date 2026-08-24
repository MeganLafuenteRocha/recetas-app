import { Receta } from './receta.model';

export abstract class RecetaRepository {
  abstract obtenerTodas(): Promise<Receta[]>;

  /** Alta o edición (S9/S10: el editor y la nutrición por IA pasan por aquí). */
  abstract guardar(receta: Receta): Promise<void>;
}
