import { describe, expect, it } from 'vitest';
import { nutricionValida, redondearNutricion } from './nutricion.model';

const ok = { kcal: 450, proteinaG: 20, carbohidratosG: 60, grasaG: 15 };

describe('nutricionValida (filtro de respuestas de la IA)', () => {
  it('acepta una porción normal', () => {
    expect(nutricionValida(ok)).toBe(true);
  });

  it('acepta todo en 0 (límite inferior)', () => {
    expect(nutricionValida({ kcal: 0, proteinaG: 0, carbohidratosG: 0, grasaG: 0 })).toBe(true);
  });

  // Límite superior de cada campo: el valor exacto pasa, un poquito más no.
  it.each([
    ['kcal', 3000],
    ['proteinaG', 250],
    ['carbohidratosG', 400],
    ['grasaG', 250],
  ])('%s: %i pasa, %i + 0.1 no', (campo, limite) => {
    expect(nutricionValida({ ...ok, [campo]: limite })).toBe(true);
    expect(nutricionValida({ ...ok, [campo]: limite + 0.1 })).toBe(false);
  });

  it.each([
    ['negativo', -1],
    ['NaN', Number.NaN],
    ['infinito', Number.POSITIVE_INFINITY],
    ['texto', '450'],
    ['null', null],
  ])('rechaza kcal %s', (_, valor) => {
    expect(nutricionValida({ ...ok, kcal: valor })).toBe(false);
  });

  it('rechaza si falta un campo', () => {
    const { grasaG: _, ...sinGrasa } = ok;
    expect(nutricionValida(sinGrasa)).toBe(false);
  });

  it.each([null, undefined, 'texto', 42, []])('rechaza algo que no es objeto: %o', (valor) => {
    expect(nutricionValida(valor)).toBe(false);
  });

  it('ignora campos extra', () => {
    expect(nutricionValida({ ...ok, fibraG: 5 })).toBe(true);
  });
});

describe('redondearNutricion', () => {
  it('redondea al entero más cercano (.5 sube)', () => {
    expect(redondearNutricion({ kcal: 449.5, proteinaG: 20.4, carbohidratosG: 0.5, grasaG: 0.49 })).toEqual({
      kcal: 450,
      proteinaG: 20,
      carbohidratosG: 1,
      grasaG: 0,
    });
  });
});
