import { normalizarTexto } from '../ingredientes/ingrediente.model';

/**
 * hogares/{id}: la unidad que paga y comparte datos (despensa, planes, listas y recetas propias).
 * Cada cuenta pertenece a un solo hogar; la administradora la asigna al activarla.
 */
export interface Hogar {
  id: string;
  nombre: string;
  creadoEn: Date | null;
}

/** Dónde vive un dato: semilla común (solo la admin la edita) o propio del hogar. */
export type Ambito = 'comun' | 'hogar';

/**
 * MODO PRUEBA: lo que guarda la admin va a lo común (así se arma el recetario semilla).
 * Más adelante todo lo que se edite será propio del hogar: se cambia solo aquí.
 */
export const ADMIN_EDITA_COMUNES = true;

/** A qué ámbito va un guardado. Una cuenta normal nunca toca lo común: edita su copia. */
export function ambitoAlGuardar(esAdmin: boolean): Ambito {
  return esAdmin && ADMIN_EDITA_COMUNES ? 'comun' : 'hogar';
}

/**
 * Copia al editar: la versión propia del hogar reemplaza a la común con el mismo id.
 * Así los planes, listas y grupos que apuntan a ese id siguen funcionando.
 */
export function combinarConPropios<T extends { id: string }>(comunes: readonly T[], propios: readonly T[]): T[] {
  const porId = new Map<string, T>();
  for (const c of comunes) porId.set(c.id, c);
  for (const p of propios) porId.set(p.id, p);
  return [...porId.values()];
}

/** "Familia Rocha" → "hog_familia_rocha" (sin repetir uno existente). */
export function idParaHogar(nombre: string, existentes: ReadonlySet<string>): string {
  const base = `hog_${normalizarTexto(nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  let id = base;
  let n = 2;
  while (existentes.has(id)) id = `${base}_${n++}`;
  return id;
}

export function validarNombreHogar(nombre: string): string | null {
  return nombre.trim().length < 3 ? 'Ponle un nombre al hogar (por ejemplo, «Familia Rocha»).' : null;
}
