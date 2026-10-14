import { describe, expect, it } from 'vitest';
import { espacio, recetaDePrueba } from '../recetas/receta.fixtures';
import {
  agregarItem,
  alternarComprado,
  ingredientesComprados,
  itemsDesdeRecetas,
  listaCompletada,
  listaVacia,
  progresoLista,
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
