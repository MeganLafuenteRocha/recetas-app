import { describe, expect, it } from 'vitest';
import { alternarReceta, grupoNuevo, validarGrupo } from './grupo.model';

describe('grupos', () => {
  it('grupoNuevo limpia espacios y empieza sin recetas', () => {
    expect(grupoNuevo('g1', '  Para visitas ', ' Los domingos ')).toEqual({
      id: 'g1',
      nombre: 'Para visitas',
      descripcion: 'Los domingos',
      icono: 'groups',
      recetaIds: [],
    });
  });

  it('alternarReceta agrega si no está y quita si está', () => {
    const g = grupoNuevo('g1', 'Rápidas');
    const con = alternarReceta(g, 'r1');
    expect(con.recetaIds).toEqual(['r1']);
    expect(alternarReceta(con, 'r1').recetaIds).toEqual([]);
  });

  it('alternarReceta no modifica el grupo original', () => {
    const g = grupoNuevo('g1', 'Rápidas');
    alternarReceta(g, 'r1');
    expect(g.recetaIds).toEqual([]);
  });

  // Límite del nombre: mínimo 2 letras sin contar espacios.
  it.each([
    ['', false],
    ['A', false],
    ['  A  ', false],
    ['Ab', true],
  ])('nombre "%s" → válido: %s', (nombre, esValido) => {
    const g = { ...grupoNuevo('g1', 'x'), nombre };
    expect(validarGrupo(g)).toBe(esValido ? null : 'Ponle un nombre al grupo.');
  });
});
