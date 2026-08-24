/** La despensa registra solo disponibilidad (sin stock): qué hay en casa. */
export interface Despensa {
  ingredienteIds: string[];
  actualizadaEn: Date | null;
}

export function despensaVacia(): Despensa {
  return { ingredienteIds: [], actualizadaEn: null };
}
