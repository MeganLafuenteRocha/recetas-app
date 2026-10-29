import { Receta } from './receta.model';

export abstract class RecetaRepository {
  /** Recetario semilla: recetas/{id}. */
  abstract obtenerComunes(): Promise<Receta[]>;

  /** Propias del hogar actual: hogares/{hogarId}/recetas/{id}. */
  abstract obtenerPropias(): Promise<Receta[]>;

  /** Alta o edición: va a lo común o al hogar según receta.ambito. */
  abstract guardar(receta: Receta): Promise<void>;
}
