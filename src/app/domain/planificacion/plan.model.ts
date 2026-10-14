import { MetasDiarias } from '../preferencias/preferencias.model';
import { Receta } from '../recetas/receta.model';

/** Una elección dentro del día: qué receta va en qué franja. */
export interface EleccionFranja {
  franja: string; // codigo de tiposComida: desayuno | sopa | seco | postre
  recetaId: string;
}

/**
 * El plan de un día. El id del documento es la fecha (YYYY-MM-DD).
 * Solo guarda el dato real (qué receta en qué franja); totales y afinidad se calculan.
 */
export interface PlanDia {
  fecha: string;
  elecciones: EleccionFranja[];
  creadoEn: Date | null;
}

/** Fecha local en formato YYYY-MM-DD. */
export function fechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-08-24" → Date local a medianoche (sin corrimientos de zona horaria). */
export function desdeISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

/** Los 7 días (lunes a domingo) de la semana que contiene la fecha. */
export function semanaDe(fecha: Date): string[] {
  const dia = fecha.getDay(); // 0 = domingo
  const lunes = sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
  return Array.from({ length: 7 }, (_, i) => fechaISO(sumarDias(lunes, i)));
}

export interface TotalesDia {
  kcal: number;
  proteinaG: number;
  /** Recetas con nutrición calculada / recetas elegidas: si falta alguna, el total es parcial. */
  conDato: number;
  elegidas: number;
}

export function totalesDelDia(
  elecciones: readonly EleccionFranja[],
  obtenerReceta: (id: string) => Receta | undefined,
): TotalesDia {
  let kcal = 0;
  let proteinaG = 0;
  let conDato = 0;
  for (const e of elecciones) {
    const n = obtenerReceta(e.recetaId)?.nutricionPorcion;
    if (!n) continue;
    kcal += n.kcal;
    proteinaG += n.proteinaG;
    conDato++;
  }
  return { kcal: Math.round(kcal), proteinaG: Math.round(proteinaG), conDato, elegidas: elecciones.length };
}

export type EstadoMeta = 'sin-datos' | 'debajo' | 'dentro' | 'encima';

export function evaluarMeta(totales: TotalesDia, metas: MetasDiarias): EstadoMeta {
  if (totales.conDato === 0) return 'sin-datos';
  if (totales.kcal < metas.kcalMin) return 'debajo';
  if (totales.kcal > metas.kcalMax) return 'encima';
  return 'dentro';
}

/** Reemplaza (o quita, con recetaId null) la receta de una franja. */
export function cambiarEleccion(plan: PlanDia, franja: string, recetaId: string | null): PlanDia {
  const resto = plan.elecciones.filter((e) => e.franja !== franja);
  return {
    ...plan,
    elecciones: recetaId ? [...resto, { franja, recetaId }] : resto,
  };
}
