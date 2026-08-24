export interface Ingrediente {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  sinonimos: string[];
  categoria: string;
  esBasico: boolean;
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
