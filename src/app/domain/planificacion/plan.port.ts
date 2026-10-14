import { PlanDia } from './plan.model';

export abstract class PlanRepository {
  abstract obtenerDia(fecha: string): Promise<PlanDia | null>;

  /** Días con plan entre dos fechas (inclusive): a lo sumo 7 lecturas para una semana. */
  abstract obtenerRango(desde: string, hasta: string): Promise<PlanDia[]>;

  abstract guardarDia(plan: PlanDia): Promise<void>;
}
