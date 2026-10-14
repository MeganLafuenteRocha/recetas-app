import { describe, expect, it } from 'vitest';
import { Ingrediente } from '../ingredientes/ingrediente.model';
import { espacio, recetaDePrueba } from '../recetas/receta.fixtures';
import {
  agregarElemento,
  Catalogos,
  codigoDesdeNombre,
  eliminarElemento,
  renombrarElemento,
  usosDeCodigo,
} from './catalogo.model';

const base: Catalogos = {
  unidades: [{ codigo: 'u', nombre: 'unidad', sinonimos: [] }],
  tiposComida: [{ codigo: 'seco', nombre: 'Segundo', orden: 1 }],
  tiposCocina: [
    { codigo: 'boliviana', nombre: 'Boliviana' },
    { codigo: 'asiatica', nombre: 'Asiática' },
  ],
  categorias: [{ codigo: 'verduras', nombre: 'Verduras', orden: 1 }],
};

const papa: Ingrediente = {
  id: 'ing_papa',
  nombre: 'Papa',
  nombreNormalizado: 'papa',
  sinonimos: [],
  categoria: 'verduras',
  esBasico: false,
  activo: true,
};

const silpancho = recetaDePrueba({
  nombre: 'Silpancho',
  tipoComida: 'seco',
  tipoCocina: 'boliviana',
  ingredientes: [espacio('esencial', 'ing_papa')],
});

describe('catálogos con integridad referencial', () => {
  it('cuenta los usos de cada tipo de código', () => {
    expect(usosDeCodigo('tiposCocina', 'boliviana', [silpancho], [papa])).toEqual({
      total: 1,
      nombres: ['Silpancho'],
    });
    expect(usosDeCodigo('tiposCocina', 'asiatica', [silpancho], [papa]).total).toBe(0);
    expect(usosDeCodigo('categorias', 'verduras', [silpancho], [papa]).nombres).toEqual(['Papa']);
    expect(usosDeCodigo('unidades', 'u', [silpancho], [papa]).total).toBe(1);
    expect(usosDeCodigo('tiposComida', 'seco', [silpancho], [papa]).total).toBe(1);
  });

  it('deriva el código del nombre y no permite duplicados', () => {
    expect(codigoDesdeNombre('Cocina Peruana')).toBe('cocina_peruana');
    const conPeruana = agregarElemento(base, 'tiposCocina', 'Peruana');
    expect(conPeruana?.tiposCocina.map((c) => c.codigo)).toContain('peruana');
    expect(agregarElemento(base, 'tiposCocina', 'boliviana')).toBeNull();
    expect(agregarElemento(base, 'tiposCocina', '   ')).toBeNull();
  });

  it('renombrar cambia el nombre visible pero nunca el código', () => {
    const r = renombrarElemento(base, 'tiposComida', 'seco', 'Plato fuerte');
    expect(r.tiposComida[0]).toEqual({ codigo: 'seco', nombre: 'Plato fuerte', orden: 1 });
  });

  it('elimina por código', () => {
    expect(eliminarElemento(base, 'tiposCocina', 'asiatica').tiposCocina).toHaveLength(1);
  });
});
