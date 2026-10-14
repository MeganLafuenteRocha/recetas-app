export interface Ingrediente {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  sinonimos: string[];
  categoria: string;
  esBasico: boolean;
  /** false = archivado: no se elimina nunca porque rompería las recetas que lo usan. */
  activo: boolean;
}

/** minúsculas y sin tildes, igual que nombreNormalizado del seed. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** ¿El ingrediente responde a lo que se busca? (nombre o sinónimos) */
export function coincideIngrediente(ingrediente: Ingrediente, consulta: string): boolean {
  const q = normalizarTexto(consulta);
  if (q.length === 0) return false;
  if (ingrediente.nombreNormalizado.includes(q)) return true;
  return ingrediente.sinonimos.some((s) => normalizarTexto(s).includes(q));
}

/** "Haba verde" → "ing_haba_verde" (sin repetir uno existente). */
export function idParaIngrediente(nombre: string, existentes: ReadonlySet<string>): string {
  const base = `ing_${normalizarTexto(nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  let id = base;
  let n = 2;
  while (existentes.has(id)) id = `${base}_${n++}`;
  return id;
}

/** Primera letra en mayúscula, el resto como se escribió. */
function capitalizar(texto: string): string {
  const t = texto.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Alta rápida: "papa, Cebolla , haba verde" → ingredientes nuevos de una categoría.
 * Ignora vacíos y los que ya existen (por nombre o sinónimo).
 */
export function crearIngredientesDesdeTexto(
  texto: string,
  categoria: string,
  existentes: readonly Ingrediente[],
): Ingrediente[] {
  const ids = new Set(existentes.map((i) => i.id));
  const yaEsta = (nombre: string) => {
    const n = normalizarTexto(nombre);
    return existentes.some(
      (i) => i.nombreNormalizado === n || i.sinonimos.some((s) => normalizarTexto(s) === n),
    );
  };
  const nuevos: Ingrediente[] = [];
  for (const crudo of texto.split(/[,\n]/)) {
    const nombre = capitalizar(crudo);
    if (!nombre || yaEsta(nombre) || nuevos.some((x) => x.nombreNormalizado === normalizarTexto(nombre))) {
      continue;
    }
    const id = idParaIngrediente(nombre, ids);
    ids.add(id);
    nuevos.push({
      id,
      nombre,
      nombreNormalizado: normalizarTexto(nombre),
      sinonimos: [],
      categoria,
      esBasico: false,
      activo: true,
    });
  }
  return nuevos;
}

/** Recalcula nombreNormalizado cuando se edita el nombre visible. */
export function conNombre(ingrediente: Ingrediente, nombre: string): Ingrediente {
  return { ...ingrediente, nombre: nombre.trim(), nombreNormalizado: normalizarTexto(nombre) };
}
