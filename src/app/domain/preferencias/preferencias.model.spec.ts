import { describe, expect, it } from 'vitest';
import { PREFERENCIAS_POR_DEFECTO, validarMetas } from './preferencias.model';

const metas = { kcalMin: 1050, kcalMax: 1300, proteinaG: 50 };

describe('validarMetas', () => {
  it('las metas por defecto son válidas', () => {
    expect(validarMetas(PREFERENCIAS_POR_DEFECTO.metas)).toBeNull();
  });

  // Límite inferior: 0 no vale, 1 sí.
  it.each(['kcalMin', 'kcalMax', 'proteinaG'] as const)('%s en 0 o negativo es inválido, en 1 no', (campo) => {
    const base = { kcalMin: 1, kcalMax: 1300, proteinaG: 50 };
    expect(validarMetas({ ...base, [campo]: 0 })).toBe('Los valores deben ser mayores que cero.');
    expect(validarMetas({ ...base, [campo]: -10 })).toBe('Los valores deben ser mayores que cero.');
    expect(validarMetas({ ...base, [campo]: 1 })).toBeNull();
  });

  it('mínimo igual al máximo es válido (límite)', () => {
    expect(validarMetas({ ...metas, kcalMin: 1300, kcalMax: 1300 })).toBeNull();
  });

  it('mínimo mayor al máximo por 1 es inválido', () => {
    expect(validarMetas({ ...metas, kcalMin: 1301, kcalMax: 1300 })).toBe('El mínimo no puede ser mayor que el máximo.');
  });
});
