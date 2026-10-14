import { describe, expect, it } from 'vitest';
import {
  coincideIngrediente,
  crearIngredientesDesdeTexto,
  idParaIngrediente,
  Ingrediente,
  normalizarTexto,
} from './ingrediente.model';

const arveja: Ingrediente = {
  id: 'ing_arveja',
  nombre: 'Arveja',
  nombreNormalizado: 'arveja',
  sinonimos: ['arverja', 'alverja'],
  categoria: 'legumbres',
  esBasico: false,
  activo: true,
};

describe('ingredientes', () => {
  it('normaliza sin tildes ni mayúsculas', () => {
    expect(normalizarTexto('  Chuño Ñandú ')).toBe('chuno nandu');
  });

  it('encuentra por sinónimo', () => {
    expect(coincideIngrediente(arveja, 'Arverja')).toBe(true);
    expect(coincideIngrediente(arveja, 'papa')).toBe(false);
  });

  it('genera ids únicos', () => {
    expect(idParaIngrediente('Haba verde', new Set())).toBe('ing_haba_verde');
    expect(idParaIngrediente('Haba verde', new Set(['ing_haba_verde']))).toBe('ing_haba_verde_2');
  });

  it('alta rápida: separa por comas, ignora repetidos y los que ya existen por sinónimo', () => {
    const nuevos = crearIngredientesDesdeTexto('haba verde, alverja,  , Haba verde\nquinua', 'verduras', [arveja]);
    expect(nuevos.map((n) => n.nombre)).toEqual(['Haba verde', 'Quinua']);
    expect(nuevos.every((n) => n.categoria === 'verduras' && n.activo)).toBe(true);
  });
});
