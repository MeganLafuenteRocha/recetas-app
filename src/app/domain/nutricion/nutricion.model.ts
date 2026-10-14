/** Estimación por porción que calcula la IA al guardar una receta. */
export interface NutricionPorcion {
  kcal: number;
  proteinaG: number;
  carbohidratosG: number;
  grasaG: number;
}

export interface ValorReferencia {
  valor: number;
  unidad: string;
  nombre: string;
}

export interface RangoFranja {
  kcalMin: number;
  kcalMax: number;
  proteinaMinG?: number;
  proteinaMaxG?: number;
}

/** config/referencias: metas diarias "normales" para las cards y el planificador. */
export interface ReferenciasNutricionales {
  diario: Record<string, ValorReferencia>;
  porFranja: Record<string, RangoFranja>;
  nota: string;
}

/** Límites de cordura por porción: lo que no cumpla esto se descarta como respuesta inválida. */
const LIMITES: Record<keyof NutricionPorcion, number> = {
  kcal: 3000,
  proteinaG: 250,
  carbohidratosG: 400,
  grasaG: 250,
};

export function nutricionValida(valor: unknown): valor is NutricionPorcion {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (Object.keys(LIMITES) as (keyof NutricionPorcion)[]).every((k) => {
    const n = v[k];
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= LIMITES[k];
  });
}

export function redondearNutricion(n: NutricionPorcion): NutricionPorcion {
  return {
    kcal: Math.round(n.kcal),
    proteinaG: Math.round(n.proteinaG),
    carbohidratosG: Math.round(n.carbohidratosG),
    grasaG: Math.round(n.grasaG),
  };
}
