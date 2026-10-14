import { NutricionPorcion } from './nutricion.model';

/** Un ingrediente ya resuelto a texto, listo para que el estimador lo lea. */
export interface IngredienteParaEstimar {
  nombre: string;
  sinonimos: string[];
  cantidad: number | null;
  unidad: string | null;
  opcional: boolean;
}

export interface RecetaParaEstimar {
  nombre: string;
  porciones: number;
  ingredientes: IngredienteParaEstimar[];
  preparacion: string;
}

export interface EstimacionNutricional {
  /** Solo esenciales y condimentos. */
  porcion: NutricionPorcion;
  /** Sumando también los opcionales. */
  conOpcionales: NutricionPorcion;
}

/**
 * "Alguien sabrá estimar la nutrición de una receta".
 * El dominio no sabe que detrás está Gemini: hoy lo implementa gemini-estimador.adapter.ts.
 * Devuelve null si no pudo (sin conexión, cuota, respuesta inválida): la receta se guarda igual.
 */
export abstract class EstimadorNutricional {
  abstract estimar(receta: RecetaParaEstimar): Promise<EstimacionNutricional | null>;
}
