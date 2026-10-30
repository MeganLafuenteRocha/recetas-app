import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';

/**
 * Emoji de cada ingrediente para las filas del sistema de diseño (despensa, listas, recetas).
 * Se busca por palabra clave en el nombre normalizado; si no hay, el de su categoría.
 * El orden importa: lo más específico primero («ají amarillo» antes que «ají»).
 */
const POR_PALABRA: [string, string][] = [
  ['papa', '🥔'], ['camote', '🍠'], ['yuca', '🥔'], ['oca', '🥔'], ['chuno', '🥔'], ['tunta', '🥔'],
  ['cebolla', '🧅'], ['ajo', '🧄'], ['tomate', '🍅'], ['zanahoria', '🥕'], ['choclo', '🌽'], ['maiz', '🌽'], ['mote', '🌽'],
  ['locoto', '🌶️'], ['aji', '🌶️'], ['rocoto', '🌶️'], ['jalapeno', '🌶️'], ['chile', '🌶️'], ['ulupica', '🌶️'],
  ['pimiento', '🫑'], ['pimenton', '🫑'], ['brocoli', '🥦'], ['lechuga', '🥬'], ['espinaca', '🥬'], ['acelga', '🥬'], ['repollo', '🥬'],
  ['pepino', '🥒'], ['zucchini', '🥒'], ['berenjena', '🍆'], ['champinon', '🍄'], ['hongo', '🍄'], ['palta', '🥑'],
  ['arveja', '🫛'], ['haba', '🫘'], ['vainita', '🫛'], ['frijol', '🫘'], ['lenteja', '🫘'], ['garbanzo', '🫘'], ['soya', '🫘'],
  ['mani', '🥜'], ['nuez', '🌰'], ['nueces', '🌰'], ['almendra', '🌰'], ['castana', '🌰'],
  ['platano', '🍌'], ['banana', '🍌'], ['guineo', '🍌'], ['manzana', '🍎'], ['naranja', '🍊'], ['mandarina', '🍊'], ['limon', '🍋'], ['lima', '🍋'],
  ['frutilla', '🍓'], ['mora', '🫐'], ['arandano', '🫐'], ['uva', '🍇'], ['pasas', '🍇'], ['pina', '🍍'], ['mango', '🥭'], ['durazno', '🍑'],
  ['pera', '🍐'], ['sandia', '🍉'], ['melon', '🍈'], ['coco', '🥥'], ['kiwi', '🥝'], ['cereza', '🍒'],
  ['pollo', '🍗'], ['pavo', '🍗'], ['pato', '🍗'], ['huevo', '🥚'], ['pescado', '🐟'], ['trucha', '🐟'], ['pejerrey', '🐟'], ['surubi', '🐟'],
  ['salmon', '🐟'], ['atun', '🐟'], ['sardina', '🐟'], ['camaron', '🦐'], ['calamar', '🦑'], ['tocino', '🥓'], ['jamon', '🥓'],
  ['salchicha', '🌭'], ['chorizo', '🌭'], ['carne', '🥩'], ['res', '🥩'], ['cerdo', '🥩'], ['cordero', '🥩'], ['charque', '🥩'], ['lomo', '🥩'],
  ['queso', '🧀'], ['leche', '🥛'], ['yogur', '🥛'], ['crema', '🥛'], ['mantequilla', '🧈'],
  ['arroz', '🍚'], ['fideo', '🍝'], ['spaghetti', '🍝'], ['lasana', '🍝'], ['pan', '🍞'], ['tortilla', '🫓'], ['harina', '🌾'], ['avena', '🌾'],
  ['quinua', '🌾'], ['trigo', '🌾'], ['galleta', '🍪'], ['chocolate', '🍫'], ['cacao', '🍫'], ['miel', '🍯'], ['azucar', '🍬'],
  ['sal', '🧂'], ['pimienta', '🧂'], ['aceituna', '🫒'], ['aceite', '🫒'], ['cafe', '☕'], ['vino', '🍷'], ['cerveza', '🍺'],
];

const POR_CATEGORIA: Record<string, string> = {
  verduras: '🥬',
  frutas: '🍎',
  legumbres: '🫘',
  carnes: '🥩',
  pescados: '🐟',
  lacteos: '🧀',
  cereales: '🌾',
  condimentos: '🌿',
  abarrotes: '🛒',
};

const POR_FRANJA: Record<string, string> = {
  desayuno: '☕',
  sopa: '🍲',
  seco: '🍛',
  postre: '🍮',
};

function contienePalabra(texto: string, palabra: string): boolean {
  return new RegExp(`(^|\\s)${palabra}`).test(texto);
}

export function emojiIngrediente(ingrediente: Pick<Ingrediente, 'nombreNormalizado' | 'categoria'> | undefined): string {
  if (!ingrediente) return '🥄';
  const hallado = POR_PALABRA.find(([palabra]) => contienePalabra(ingrediente.nombreNormalizado, palabra));
  return hallado?.[1] ?? POR_CATEGORIA[ingrediente.categoria] ?? '🥄';
}

export function emojiCategoria(codigo: string): string {
  return POR_CATEGORIA[codigo] ?? '🛒';
}

/** Lo que se muestra cuando una receta todavía no tiene foto. */
export function emojiFranja(codigo: string): string {
  return POR_FRANJA[codigo] ?? '🍽️';
}
