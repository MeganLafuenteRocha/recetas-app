import { espacioCubierto } from '../planificacion/afinidad.service';
import { Receta } from '../recetas/receta.model';

export type OrigenLista = 'manual' | 'plan' | 'dia';

export interface ItemLista {
  id: string;
  /** Ingrediente del catálogo, o null si es texto libre ("Detergente"). */
  ingredienteId: string | null;
  textoLibre: string | null;
  cantidad: number | null;
  unidad: string | null;
  comprado: boolean;
  /** Para qué se compra: "Chairo, Sopa de quinua" o null si se agregó a mano. */
  motivo: string | null;
}

/** listas/{id}: siempre editable, sin importar cómo se creó. */
export interface ListaCompra {
  id: string;
  nombre: string;
  /** YYYY-MM-DD. No tiene que coincidir con el día del plan (se cocina el martes, se compra el sábado). */
  fechaCompra: string;
  origen: OrigenLista;
  items: ItemLista[];
  creadaEn: Date | null;
}

export function listaVacia(id: string, nombre: string, fechaCompra: string, origen: OrigenLista = 'manual'): ListaCompra {
  return { id, nombre: nombre.trim() || 'Mi lista', fechaCompra, origen, items: [], creadaEn: null };
}

/**
 * Faltantes (esenciales y condimentos) de varias recetas, juntados por ingrediente.
 * Si un mismo ingrediente se pide con la misma unidad, las cantidades se suman.
 */
export function itemsDesdeRecetas(
  recetas: readonly Receta[],
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
  nuevoId: () => string,
): ItemLista[] {
  const porIngrediente = new Map<string, ItemLista & { recetas: string[] }>();
  for (const receta of recetas) {
    for (const espacio of receta.ingredientes) {
      if (espacio.rol === 'opcional') continue;
      if (espacioCubierto(espacio, disponibles, basicos)) continue;
      const opcion = espacio.opciones[0];
      if (!opcion) continue;
      const previo = porIngrediente.get(opcion.ingredienteId);
      if (!previo) {
        porIngrediente.set(opcion.ingredienteId, {
          id: nuevoId(),
          ingredienteId: opcion.ingredienteId,
          textoLibre: null,
          cantidad: opcion.cantidad,
          unidad: opcion.unidad,
          comprado: false,
          motivo: null,
          recetas: [receta.nombre],
        });
        continue;
      }
      if (!previo.recetas.includes(receta.nombre)) previo.recetas.push(receta.nombre);
      if (previo.unidad === opcion.unidad && previo.cantidad !== null && opcion.cantidad !== null) {
        previo.cantidad += opcion.cantidad;
      }
    }
  }
  return [...porIngrediente.values()].map(({ recetas, ...item }) => ({
    ...item,
    motivo: recetas.join(', '),
  }));
}

export function progresoLista(lista: ListaCompra): { comprados: number; total: number } {
  return { comprados: lista.items.filter((i) => i.comprado).length, total: lista.items.length };
}

export function listaCompletada(lista: ListaCompra): boolean {
  return lista.items.length > 0 && lista.items.every((i) => i.comprado);
}

export function alternarComprado(lista: ListaCompra, itemId: string): ListaCompra {
  return {
    ...lista,
    items: lista.items.map((i) => (i.id === itemId ? { ...i, comprado: !i.comprado } : i)),
  };
}

export function agregarItem(lista: ListaCompra, item: ItemLista): ListaCompra {
  if (item.ingredienteId && lista.items.some((i) => i.ingredienteId === item.ingredienteId)) {
    return lista;
  }
  return { ...lista, items: [...lista.items, item] };
}

export function quitarItem(lista: ListaCompra, itemId: string): ListaCompra {
  return { ...lista, items: lista.items.filter((i) => i.id !== itemId) };
}

/** Une ítems nuevos sin repetir ingredientes que ya están. */
export function combinarItems(lista: ListaCompra, nuevos: readonly ItemLista[]): ListaCompra {
  return nuevos.reduce((acc, item) => agregarItem(acc, item), lista);
}

/** Ingredientes del catálogo ya comprados: los que pasan a la despensa. */
export function ingredientesComprados(lista: ListaCompra): string[] {
  return lista.items.filter((i) => i.comprado && i.ingredienteId).map((i) => i.ingredienteId!);
}
