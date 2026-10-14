/** Metas del hogar para el día (desayuno + almuerzo, sin cena). */
export interface MetasDiarias {
  kcalMin: number;
  kcalMax: number;
  proteinaG: number;
}

/** config/usuario: preferencias del hogar. */
export interface Preferencias {
  metas: MetasDiarias;
}

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  metas: { kcalMin: 1050, kcalMax: 1300, proteinaG: 50 },
};

export function validarMetas(metas: MetasDiarias): string | null {
  if (metas.kcalMin <= 0 || metas.kcalMax <= 0 || metas.proteinaG <= 0) {
    return 'Los valores deben ser mayores que cero.';
  }
  if (metas.kcalMin > metas.kcalMax) return 'El mínimo no puede ser mayor que el máximo.';
  return null;
}
