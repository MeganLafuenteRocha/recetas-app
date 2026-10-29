import { describe, expect, it } from 'vitest';
import { espacio, recetaDePrueba } from './receta.fixtures';
import {
  idParaReceta,
  idsDeIngredientes,
  prepararParaGuardar,
  recetaNueva,
  textoCantidad,
  validarReceta,
} from './receta.model';

const valida = (parcial = {}) =>
  recetaDePrueba({ nombre: 'Silpancho', ingredientes: [espacio('esencial', 'ing_carne')], ...parcial });

describe('validarReceta', () => {
  it('una receta completa no tiene errores', () => {
    expect(validarReceta(valida())).toEqual([]);
  });

  // Límite del nombre: mínimo 3 letras, sin contar espacios de los bordes.
  it.each([
    ['', false],
    ['ab', false],
    ['  ab  ', false],
    ['abc', true],
    ['  abc  ', true],
  ])('nombre "%s" → válido: %s', (nombre, esValido) => {
    const errores = validarReceta(valida({ nombre }));
    expect(errores.includes('Ponle un nombre a la receta.')).toBe(!esValido);
  });

  // Límite de porciones: mínimo 1.
  it.each([
    [-1, false],
    [0, false],
    [1, true],
    [2, true],
  ])('porciones %i → válido: %s', (porciones, esValido) => {
    const errores = validarReceta(valida({ porciones }));
    expect(errores.includes('Las porciones deben ser al menos 1.')).toBe(!esValido);
  });

  it('exige la franja', () => {
    expect(validarReceta(valida({ tipoComida: '' }))).toContain('Elige la franja (desayuno, sopa…).');
  });

  it('exige al menos un esencial (solo condimentos u opcionales no alcanza)', () => {
    const r = valida({ ingredientes: [espacio('condimento', 'ing_sal'), espacio('opcional', 'ing_perejil')] });
    expect(validarReceta(r)).toEqual(['Agrega al menos un ingrediente esencial.']);
  });

  it('detecta un espacio de ingrediente sin ninguna opción elegida', () => {
    const r = valida({ ingredientes: [espacio('esencial', 'ing_carne'), espacio('condimento')] });
    expect(validarReceta(r)).toEqual(['Hay un ingrediente sin elegir.']);
  });

  it('junta todos los errores a la vez (no se detiene en el primero)', () => {
    const r = recetaDePrueba({ nombre: '', tipoComida: '', porciones: 0, ingredientes: [] });
    expect(validarReceta(r)).toHaveLength(4);
  });

  it('una receta nueva en blanco no se puede guardar todavía', () => {
    const errores = validarReceta(recetaNueva('sopa', 'boliviana'));
    expect(errores).toEqual(['Ponle un nombre a la receta.', 'Agrega al menos un ingrediente esencial.']);
  });
});

describe('idParaReceta', () => {
  it.each([
    ['Sopa de maní', 'rec_sopa_de_mani'],
    ['  Ají de Fideo  ', 'rec_aji_de_fideo'],
    ['¡Pique macho!', 'rec_pique_macho'],
    ['Chairo   paceño', 'rec_chairo_paceno'],
  ])('"%s" → %s', (nombre, id) => {
    expect(idParaReceta(nombre, new Set())).toBe(id);
  });

  it('no repite ids existentes: agrega _2, _3…', () => {
    expect(idParaReceta('Chairo', new Set(['rec_chairo']))).toBe('rec_chairo_2');
    expect(idParaReceta('Chairo', new Set(['rec_chairo', 'rec_chairo_2']))).toBe('rec_chairo_3');
  });
});

describe('prepararParaGuardar', () => {
  it('limpia espacios, recalcula el total y renumera ingredientes', () => {
    const r = prepararParaGuardar(
      valida({
        nombre: '  Chairo  ',
        descripcion: ' Sopa paceña ',
        tiempo: { preparacionMin: 20, coccionMin: 40, totalMin: 999 },
        ingredientes: [
          { ...espacio('esencial', 'a'), orden: 7 },
          { ...espacio('condimento', 'b'), orden: 7 },
        ],
      }),
    );
    expect(r.nombre).toBe('Chairo');
    expect(r.descripcion).toBe('Sopa paceña');
    expect(r.tiempo.totalMin).toBe(60);
    expect(r.ingredientes.map((e) => e.orden)).toEqual([1, 2]);
  });

  it('quita los pasos vacíos y renumera los que quedan', () => {
    const r = prepararParaGuardar(
      valida({
        preparacion: {
          descripcion: null,
          pasos: [
            { numero: 1, instruccion: 'Hervir agua', importante: null },
            { numero: 2, instruccion: '   ', importante: null },
            { numero: 3, instruccion: 'Agregar chuño', importante: 'No lavar de más' },
          ],
        },
      }),
    );
    expect(r.preparacion.pasos?.map((p) => [p.numero, p.instruccion])).toEqual([
      [1, 'Hervir agua'],
      [2, 'Agregar chuño'],
    ]);
  });

  it('tolera pasos en null', () => {
    const r = prepararParaGuardar(valida({ preparacion: { descripcion: 'Todo junto', pasos: null } }));
    expect(r.preparacion.pasos).toEqual([]);
  });

  it('con tiempos en 0 el total es 0', () => {
    expect(prepararParaGuardar(valida({ tiempo: { preparacionMin: 0, coccionMin: 0, totalMin: 5 } })).tiempo.totalMin).toBe(0);
  });

  it('no modifica la receta original (inmutable)', () => {
    const original = valida({ nombre: '  Chairo  ' });
    prepararParaGuardar(original);
    expect(original.nombre).toBe('  Chairo  ');
  });
});

describe('textoCantidad', () => {
  it.each([
    [{ cantidad: null, unidad: 'g' }, 'al gusto'],
    [{ cantidad: 0, unidad: 'g' }, '0 g'],
    [{ cantidad: 500, unidad: 'g' }, '500 g'],
    [{ cantidad: 0.5, unidad: 'taza' }, '0.5 taza'],
    [{ cantidad: 3, unidad: null }, '3'],
  ])('%o → "%s"', (parcial, texto) => {
    expect(textoCantidad({ ingredienteId: 'x', nota: null, ...parcial })).toBe(texto);
  });
});

describe('idsDeIngredientes', () => {
  it('incluye todas las alternativas y no repite', () => {
    const r = recetaDePrueba({
      ingredientes: [espacio('esencial', 'papa', 'chuno'), espacio('opcional', 'papa')],
    });
    expect([...idsDeIngredientes(r)]).toEqual(['papa', 'chuno']);
  });

  it('receta sin ingredientes → conjunto vacío', () => {
    expect(idsDeIngredientes(recetaDePrueba()).size).toBe(0);
  });
});
