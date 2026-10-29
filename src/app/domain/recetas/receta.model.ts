import { Ambito } from '../hogares/hogar.model';
import { normalizarTexto } from '../ingredientes/ingrediente.model';
import { NutricionPorcion } from '../nutricion/nutricion.model';

export type RolIngrediente = 'esencial' | 'condimento' | 'opcional';

export const ROLES: readonly RolIngrediente[] = ['esencial', 'condimento', 'opcional'];

/** Una forma concreta de cubrir un espacio: "6 u de cordero" o "6 u de costilla". */
export interface OpcionIngrediente {
  ingredienteId: string;
  /** null = "al gusto" (típico de condimentos). */
  cantidad: number | null;
  unidad: string | null;
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
  /** 'comun': semilla para todos los hogares; 'hogar': propia (o copia editada de una común). */
  ambito: Ambito;
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

/** Id estable a partir del nombre: "Sopa de maní" → "rec_sopa_de_mani". */
export function idParaReceta(nombre: string, existentes: ReadonlySet<string>): string {
  const base = `rec_${normalizarTexto(nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  let id = base;
  let n = 2;
  while (existentes.has(id)) id = `${base}_${n++}`;
  return id;
}

export function recetaNueva(tipoComida: string, tipoCocina: string): Receta {
  return {
    id: '',
    ambito: 'hogar',
    activo: true,
    nombre: '',
    descripcion: '',
    tipoComida,
    tipoCocina,
    porciones: 4,
    dificultad: 2,
    imagen: null,
    tiempo: { preparacionMin: 15, coccionMin: 30, totalMin: 45 },
    ingredientes: [],
    preparacion: { descripcion: null, pasos: [] },
    nutricionPorcion: null,
    nutricionConOpcionales: null,
    nutricionCalculadaEn: null,
  };
}

/** Reglas mínimas para poder guardar. Devuelve los problemas en lenguaje de cocina. */
export function validarReceta(receta: Receta): string[] {
  const errores: string[] = [];
  if (receta.nombre.trim().length < 3) errores.push('Ponle un nombre a la receta.');
  if (!receta.tipoComida) errores.push('Elige la franja (desayuno, sopa…).');
  if (receta.porciones < 1) errores.push('Las porciones deben ser al menos 1.');
  if (!receta.ingredientes.some((e) => e.rol === 'esencial')) {
    errores.push('Agrega al menos un ingrediente esencial.');
  }
  if (receta.ingredientes.some((e) => e.opciones.length === 0)) {
    errores.push('Hay un ingrediente sin elegir.');
  }
  return errores;
}

/** Normaliza orden de espacios, numeración de pasos y tiempo total antes de guardar. */
export function prepararParaGuardar(receta: Receta): Receta {
  const pasos = (receta.preparacion.pasos ?? [])
    .filter((p) => p.instruccion.trim().length > 0)
    .map((p, i) => ({ ...p, numero: i + 1 }));
  return {
    ...receta,
    nombre: receta.nombre.trim(),
    descripcion: receta.descripcion.trim(),
    tiempo: {
      ...receta.tiempo,
      totalMin: receta.tiempo.preparacionMin + receta.tiempo.coccionMin,
    },
    ingredientes: receta.ingredientes.map((e, i) => ({ ...e, orden: i + 1 })),
    preparacion: { ...receta.preparacion, pasos },
  };
}

/** "500 g", "2 tazas", "al gusto". Las unidades se muestran con su código corto. */
export function textoCantidad(opcion: OpcionIngrediente): string {
  if (opcion.cantidad === null || opcion.cantidad === undefined) return 'al gusto';
  return opcion.unidad ? `${opcion.cantidad} ${opcion.unidad}` : String(opcion.cantidad);
}
