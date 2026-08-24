import { NutricionPorcion } from '../nutricion/nutricion.model';

export type RolIngrediente = 'esencial' | 'condimento' | 'opcional';

/** Una forma concreta de cubrir un espacio: "6 u de cordero" o "6 u de costilla". */
export interface OpcionIngrediente {
  ingredienteId: string;
  cantidad: number;
  unidad: string;
  nota: string | null;
}

/** Un espacio de la receta, con sus alternativas equivalentes (papa o chuño). */
export interface EspacioIngrediente {
  orden: number;
  rol: RolIngrediente;
  opciones: OpcionIngrediente[];
}

export interface PasoPreparacion {
  numero: number;
  instruccion: string;
  importante: string | null;
}

export interface Preparacion {
  descripcion: string | null;
  pasos: PasoPreparacion[] | null;
}

export interface TiempoReceta {
  preparacionMin: number;
  coccionMin: number;
  totalMin: number;
}

export interface Receta {
  id: string;
  activo: boolean;
  nombre: string;
  descripcion: string;
  tipoComida: string;
  tipoCocina: string;
  porciones: number;
  dificultad: number;
  imagen: string | null;
  tiempo: TiempoReceta;
  ingredientes: EspacioIngrediente[];
  preparacion: Preparacion;
  nutricionPorcion: NutricionPorcion | null;
  nutricionConOpcionales: NutricionPorcion | null;
  nutricionCalculadaEn: Date | null;
}

/** Ids de todos los ingredientes que la receta puede usar (todas las opciones). */
export function idsDeIngredientes(receta: Receta): Set<string> {
  const ids = new Set<string>();
  for (const espacio of receta.ingredientes) {
    for (const opcion of espacio.opciones) {
      ids.add(opcion.ingredienteId);
    }
  }
  return ids;
}
