import { describe, expect, it } from 'vitest';
import { ambitoAlGuardar, combinarConPropios, idParaHogar, validarNombreHogar } from './hogar.model';

describe('hogares', () => {
  it('la copia propia reemplaza a la común con el mismo id', () => {
    const comunes = [
      { id: 'rec_silpancho', nombre: 'Silpancho' },
      { id: 'rec_sopa_mani', nombre: 'Sopa de maní' },
    ];
    const propios = [
      { id: 'rec_silpancho', nombre: 'Silpancho de la abuela' },
      { id: 'rec_tarta', nombre: 'Tarta' },
    ];
    const todos = combinarConPropios(comunes, propios);
    expect(todos.map((r) => r.nombre).sort()).toEqual(['Silpancho de la abuela', 'Sopa de maní', 'Tarta']);
  });

  it('sin propios quedan las comunes tal cual', () => {
    const comunes = [{ id: 'a' }, { id: 'b' }];
    expect(combinarConPropios(comunes, [])).toEqual(comunes);
  });

  it('una cuenta normal siempre guarda en su hogar; la admin, en lo común (modo prueba)', () => {
    expect(ambitoAlGuardar(false)).toBe('hogar');
    expect(ambitoAlGuardar(true)).toBe('comun');
  });

  it('arma ids de hogar sin tildes y sin repetir', () => {
    expect(idParaHogar('Familia Peñaranda', new Set())).toBe('hog_familia_penaranda');
    expect(idParaHogar('Familia Rocha', new Set(['hog_familia_rocha']))).toBe('hog_familia_rocha_2');
  });

  it('pide un nombre de al menos 3 letras', () => {
    expect(validarNombreHogar('  ')).not.toBeNull();
    expect(validarNombreHogar('Casa')).toBeNull();
  });
});
