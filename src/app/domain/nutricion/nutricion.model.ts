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
