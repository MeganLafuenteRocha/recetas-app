import { describe, expect, it } from 'vitest';
import { espacio, recetaDePrueba } from '../recetas/receta.fixtures';
import {
  agregarItem,
  alternarComprado,
  combinarItems,
  ingredientesComprados,
  ItemLista,
  itemsDesdeRecetas,
  listaCompletada,
  listaVacia,
  progresoLista,
  quitarItem,
} from './lista.model';

let n = 0;
const nuevoId = () => `item${++n}`;

describe('listas de compras', () => {
  it('junta los faltantes de varias recetas y suma cantidades de la misma unidad', () => {
    const chairo = recetaDePrueba({
      nombre: 'Chairo',
      ingredientes: [espacio('esencial', 'zanahoria'), espacio('opcional', 'perejil')],
    });
    const quinua = recetaDePrueba({
      nombre: 'Sopa de quinua',
      ingredientes: [espacio('esencial', 'zanahoria'), espacio('condimento', 'sal')],
    });
    const items = itemsDesdeRecetas([chairo, quinua], new Set(), new Set(['sal']), nuevoId);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      ingredienteId: 'zanahoria',
      cantidad: 2,
      unidad: 'u',
      motivo: 'Chairo, Sopa de quinua',
    });
  });

  it('no incluye lo que ya está en la despensa ni los opcionales', () => {
    const r = recetaDePrueba({
      ingredientes: [espacio('esencial', 'papa'), espacio('opcional', 'locoto')],
    });
    expect(itemsDesdeRecetas([r], new Set(['papa']), new Set(), nuevoId)).toEqual([]);
  });

  it('marca comprados, calcula progreso y sabe qué pasa a la despensa', () => {
    let lista = listaVacia('l1', 'Sábado', '2026-08-29');
    lista = agregarItem(lista, { id: 'a', ingredienteId: 'papa', textoLibre: null, cantidad: 1, unidad: 'kg', comprado: false, motivo: null });
    lista = agregarItem(lista, { id: 'b', ingredienteId: null, textoLibre: 'Detergente', cantidad: null, unidad: null, comprado: false, motivo: null });
    lista = agregarItem(lista, { id: 'c', ingredienteId: 'papa', textoLibre: null, cantidad: 1, unidad: 'kg', comprado: false, motivo: null });
    expect(lista.items).toHaveLength(2);

    lista = alternarComprado(lista, 'a');
    expect(progresoLista(lista)).toEqual({ comprados: 1, total: 2 });
    expect(listaCompletada(lista)).toBe(false);
    expect(ingredientesComprados(lista)).toEqual(['papa']);

    lista = alternarComprado(lista, 'b');
    expect(listaCompletada(lista)).toBe(true);
  });
});

describe('listas de compras: valores límite', () => {
  const item = (id: string, ingredienteId: string | null, extra: Partial<ItemLista> = {}): ItemLista => ({
    id,
    ingredienteId,
    textoLibre: ingredienteId ? null : id,
    cantidad: null,
    unidad: null,
    comprado: false,
    motivo: null,
    ...extra,
  });
  const vacia = () => listaVacia('l1', 'x', '2026-08-29');

  it.each([
    ['', 'Mi lista'],
    ['   ', 'Mi lista'],
    ['  Sábado ', 'Sábado'],
  ])('listaVacia con nombre "%s" → "%s"', (nombre, esperado) => {
    expect(listaVacia('l1', nombre, '2026-08-29').nombre).toBe(esperado);
  });

  it('lista vacía: progreso 0/0 y NO cuenta como completada', () => {
    expect(progresoLista(vacia())).toEqual({ comprados: 0, total: 0 });
    expect(listaCompletada(vacia())).toBe(false);
  });

  it('no suma cantidades con distinta unidad (se queda la primera)', () => {
    const a = recetaDePrueba({ nombre: 'A', ingredientes: [espacio('esencial', 'zanahoria')] });
    const b = recetaDePrueba({
      nombre: 'B',
      ingredientes: [
        { orden: 1, rol: 'esencial', opciones: [{ ingredienteId: 'zanahoria', cantidad: 500, unidad: 'g', nota: null }] },
      ],
    });
    expect(itemsDesdeRecetas([a, b], new Set(), new Set(), nuevoId)[0]).toMatchObject({
      cantidad: 1,
      unidad: 'u',
      motivo: 'A, B',
    });
  });

  it('una cantidad "al gusto" (null) no se convierte en número', () => {
    const alGusto = recetaDePrueba({
      nombre: 'A',
      ingredientes: [
        { orden: 1, rol: 'condimento', opciones: [{ ingredienteId: 'comino', cantidad: null, unidad: null, nota: null }] },
      ],
    });
    const otra = recetaDePrueba({ nombre: 'B', ingredientes: [espacio('condimento', 'comino')] });
    expect(itemsDesdeRecetas([alGusto, otra], new Set(), new Set(), nuevoId)[0]?.cantidad).toBeNull();
  });

  it('la misma receta dos veces en la semana suma cantidades pero no repite el motivo', () => {
    const chairo = recetaDePrueba({ nombre: 'Chairo', ingredientes: [espacio('esencial', 'chuno')] });
    expect(itemsDesdeRecetas([chairo, chairo], new Set(), new Set(), nuevoId)[0]).toMatchObject({
      cantidad: 2,
      motivo: 'Chairo',
    });
  });

  it('un espacio cubierto por una alternativa no va a la lista', () => {
    const r = recetaDePrueba({ ingredientes: [espacio('esencial', 'papa', 'chuno')] });
    expect(itemsDesdeRecetas([r], new Set(['chuno']), new Set(), nuevoId)).toEqual([]);
  });

  it('sin recetas o con espacios vacíos devuelve lista vacía sin romperse', () => {
    expect(itemsDesdeRecetas([], new Set(), new Set(), nuevoId)).toEqual([]);
    const rota = recetaDePrueba({ ingredientes: [espacio('esencial')] });
    expect(itemsDesdeRecetas([rota], new Set(), new Set(), nuevoId)).toEqual([]);
  });

  it('alternar dos veces vuelve al estado inicial; un id inexistente no cambia nada', () => {
    const l = agregarItem(vacia(), item('a', 'papa'));
    expect(alternarComprado(alternarComprado(l, 'a'), 'a').items[0]?.comprado).toBe(false);
    expect(alternarComprado(l, 'no-existe').items).toEqual(l.items);
  });

  it('el texto libre se puede repetir (no tiene ingrediente para comparar)', () => {
    const l = combinarItems(vacia(), [item('Pan', null), item('Pan2', null, { textoLibre: 'Pan' })]);
    expect(l.items).toHaveLength(2);
  });

  it('combinarItems no repite ingredientes, ni los que ya estaban ni entre los nuevos', () => {
    const inicial = agregarItem(vacia(), item('a', 'papa'));
    const l = combinarItems(inicial, [item('b', 'papa'), item('c', 'cebolla'), item('d', 'cebolla')]);
    expect(l.items.map((i) => i.ingredienteId)).toEqual(['papa', 'cebolla']);
    expect(inicial.items).toHaveLength(1); // inmutable
  });

  it('quitarItem quita solo ese ítem; con id inexistente no cambia', () => {
    const l = combinarItems(vacia(), [item('a', 'papa'), item('b', 'cebolla')]);
    expect(quitarItem(l, 'a').items.map((i) => i.id)).toEqual(['b']);
    expect(quitarItem(l, 'zzz').items).toHaveLength(2);
  });

  it('a la despensa pasan solo los comprados del catálogo (no el texto libre)', () => {
    const l = combinarItems(vacia(), [
      item('a', 'papa', { comprado: true }),
      item('b', 'cebolla'),
      item('Detergente', null, { comprado: true }),
    ]);
    expect(ingredientesComprados(l)).toEqual(['papa']);
  });
});
