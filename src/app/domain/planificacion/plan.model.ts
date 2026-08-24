/** Una elección dentro del día: qué receta va en qué franja. */
export interface EleccionFranja {
  franja: string; // codigo de tiposComida: desayuno | sopa | seco | postre
  recetaId: string;
}

/** El plan de un día. El id del documento es la fecha (YYYY-MM-DD). */
export interface PlanDia {
  fecha: string;
  elecciones: EleccionFranja[];
  creadoEn: Date | null;
}

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function fechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
