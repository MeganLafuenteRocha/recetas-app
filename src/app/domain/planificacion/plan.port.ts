import { PlanDia } from './plan.model';

export abstract class PlanRepository {
  abstract obtenerDia(fecha: string): Promise<PlanDia | null>;
  abstract guardarDia(plan: PlanDia): Promise<void>;
}
