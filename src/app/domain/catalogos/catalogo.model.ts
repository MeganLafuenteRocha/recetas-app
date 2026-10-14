import { Ingrediente, normalizarTexto } from '../ingredientes/ingrediente.model';
import { Receta } from '../recetas/receta.model';

export interface Unidad {
  codigo: string;
  nombre: string;
  sinonimos: string[];
}

export interface TipoComida {
  codigo: string; // interno: "seco"
  nombre: string; // visible: "Segundo"
  orden: number;
}

export interface TipoCocina {
  codigo: string;
  nombre: string;
}

export interface Categoria {
  codigo: string;
  nombre: string;
  orden: number;
}

/** catalogos/base: un solo documento con todas las listas fijas. */
export interface Catalogos {
  unidades: Unidad[];
  tiposComida: TipoComida[];
  tiposCocina: TipoCocina[];
  categorias: Categoria[];
}

export type TipoCatalogo = keyof Catalogos;

/** Cualquier elemento de catálogo: todos tienen código interno y nombre visible. */
export interface ElementoCatalogo {
  codigo: string;
  nombre: string;
}

/** Dónde se usa un código. Si hay usos, NO se puede eliminar. */
export interface UsoCatalogo {
  total: number;
  /** Nombres de lo que lo usa (recetas o ingredientes), para mostrarlos. */
  nombres: string[];
}

/**
 * Integridad referencial en memoria (cero lecturas):
 * un elemento solo se elimina si su código no aparece en ninguna parte.
 */
export function usosDeCodigo(
  tipo: TipoCatalogo,
  codigo: string,
  recetas: readonly Receta[],
  ingredientes: readonly Ingrediente[],
): UsoCatalogo {
  let nombres: string[];
  switch (tipo) {
    case 'tiposCocina':
      nombres = recetas.filter((r) => r.tipoCocina === codigo).map((r) => r.nombre);
      break;
    case 'tiposComida':
      nombres = recetas.filter((r) => r.tipoComida === codigo).map((r) => r.nombre);
      break;
    case 'categorias':
      nombres = ingredientes.filter((i) => i.categoria === codigo).map((i) => i.nombre);
      break;
    case 'unidades':
      nombres = recetas
        .filter((r) => r.ingredientes.some((e) => e.opciones.some((o) => o.unidad === codigo)))
        .map((r) => r.nombre);
      break;
  }
  return { total: nombres.length, nombres };
}

/** Código interno a partir del nombre visible: "Cocina Peruana" → "cocina_peruana". */
export function codigoDesdeNombre(nombre: string): string {
  return normalizarTexto(nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Agrega un elemento nuevo. El código se deriva del nombre y queda bloqueado para siempre.
 * Devuelve null si el nombre está vacío o el código ya existe.
 */
export function agregarElemento(catalogos: Catalogos, tipo: TipoCatalogo, nombre: string): Catalogos | null {
  const codigo = codigoDesdeNombre(nombre);
  const lista = catalogos[tipo] as ElementoCatalogo[];
  if (!codigo || lista.some((e) => e.codigo === codigo)) return null;
  const limpio = nombre.trim();
  let nuevo: ElementoCatalogo;
  switch (tipo) {
    case 'unidades':
      nuevo = { codigo, nombre: limpio, sinonimos: [] } as Unidad;
      break;
    case 'tiposCocina':
      nuevo = { codigo, nombre: limpio };
      break;
    default:
      nuevo = { codigo, nombre: limpio, orden: lista.length + 1 } as Categoria;
  }
  return { ...catalogos, [tipo]: [...lista, nuevo] };
}

/** Solo cambia el nombre visible; el código interno no se toca (como "seco" → "Segundo"). */
export function renombrarElemento(
  catalogos: Catalogos,
  tipo: TipoCatalogo,
  codigo: string,
  nombre: string,
): Catalogos {
  const lista = (catalogos[tipo] as ElementoCatalogo[]).map((e) =>
    e.codigo === codigo ? { ...e, nombre: nombre.trim() } : e,
  );
  return { ...catalogos, [tipo]: lista };
}

export function eliminarElemento(catalogos: Catalogos, tipo: TipoCatalogo, codigo: string): Catalogos {
  const lista = (catalogos[tipo] as ElementoCatalogo[]).filter((e) => e.codigo !== codigo);
  return { ...catalogos, [tipo]: lista };
}
