import { describe, expect, it } from 'vitest';
import { recetaDePrueba, espacio } from '../recetas/receta.fixtures';
import { espacioCubierto, evaluarReceta, mejorCompra, sePuedeCocinar, sugerirPorFranja } from './afinidad.service';

const SIN_BASICOS = new Set<string>();

describe('evaluarReceta', () => {
  it('da 100 cuando todo está en la despensa', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_comino')],
    });
    const r = evaluarReceta(receta, new Set(['ing_papa', 'ing_comino']), SIN_BASICOS);
    expect(r.puntaje).toBe(100);
    expect(r.faltantesEsenciales).toEqual([]);
  });

  it('pesa 85 los esenciales y 15 los condimentos', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_comino')],
    });
    const sinEsencial = evaluarReceta(receta, new Set(['ing_comino']), SIN_BASICOS);
    const sinCondimento = evaluarReceta(receta, new Set(['ing_papa']), SIN_BASICOS);
    expect(sinEsencial.puntaje).toBe(15);
    expect(sinCondimento.puntaje).toBe(85);
    expect(sinEsencial.faltantesEsenciales).toEqual(['ing_papa']);
    expect(sinCondimento.faltantesCondimentos).toEqual(['ing_comino']);
  });

  it('faltar 1 esencial de 5 (con condimentos completos) deja 83: visible, más abajo', () => {
    const receta = recetaDePrueba({
      ingredientes: ['a', 'b', 'c', 'd', 'e'].map((x) => espacio('esencial', x)),
    });
    const r = evaluarReceta(receta, new Set(['a', 'b', 'c', 'd']), SIN_BASICOS);
    expect(r.puntaje).toBe(83);
  });

  it('un espacio con alternativas se cubre con CUALQUIERA de ellas (papa o chuño)', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa', 'ing_chuno')],
    });
    const r = evaluarReceta(receta, new Set(['ing_chuno']), SIN_BASICOS);
    expect(r.puntaje).toBe(100);
  });

  it('los básicos (sal, azúcar) cuentan como siempre disponibles', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_arroz'), espacio('condimento', 'ing_sal')],
    });
    const r = evaluarReceta(receta, new Set(['ing_arroz']), new Set(['ing_sal']));
    expect(r.puntaje).toBe(100);
  });

  it('los opcionales no restan, pero suman bonus si están', () => {
    const receta = recetaDePrueba({
      ingredientes: [
        espacio('esencial', 'ing_papa'),
        espacio('condimento', 'ing_comino'),
        espacio('opcional', 'ing_perejil'),
      ],
    });
    const sinOpcional = evaluarReceta(receta, new Set(['ing_papa']), SIN_BASICOS);
    const conOpcional = evaluarReceta(receta, new Set(['ing_papa', 'ing_perejil']), SIN_BASICOS);
    expect(sinOpcional.puntaje).toBe(85);
    expect(conOpcional.puntaje).toBe(90);
    expect(sinOpcional.faltantesOpcionales).toEqual(['ing_perejil']);
  });

  it('nunca pasa de 100', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'a'), espacio('opcional', 'b')],
    });
    expect(evaluarReceta(receta, new Set(['a', 'b']), SIN_BASICOS).puntaje).toBe(100);
  });

  it('sin ningún ingrediente disponible da 0', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_comino')],
    });
    const r = evaluarReceta(receta, new Set(), SIN_BASICOS);
    expect(r.puntaje).toBe(0);
    expect(sePuedeCocinar(r)).toBe(false);
  });
});

describe('sugerirPorFranja', () => {
  it('agrupa por franja, ordena de mejor a peor y no oculta las incompletas', () => {
    const sopaCompleta = recetaDePrueba({
      id: 'r1',
      tipoComida: 'sopa',
      ingredientes: [espacio('esencial', 'ing_papa')],
    });
    const sopaIncompleta = recetaDePrueba({
      id: 'r2',
      tipoComida: 'sopa',
      ingredientes: [espacio('esencial', 'ing_carne')],
    });
    const segundo = recetaDePrueba({
      id: 'r3',
      tipoComida: 'seco',
      ingredientes: [espacio('esencial', 'ing_papa')],
    });
    const inactiva = recetaDePrueba({ id: 'r4', activo: false });

    const porFranja = sugerirPorFranja(
      [sopaIncompleta, sopaCompleta, segundo, inactiva],
      new Set(['ing_papa']),
      SIN_BASICOS,
    );

    expect(porFranja.get('sopa')?.map((r) => r.receta.id)).toEqual(['r1', 'r2']);
    expect(porFranja.get('seco')?.map((r) => r.receta.id)).toEqual(['r3']);
    expect([...porFranja.values()].flat().some((r) => r.receta.id === 'r4')).toBe(false);
  });
});

describe('mejorCompra', () => {
  it('elige el ingrediente que completa más recetas con un solo esencial faltante', () => {
    const recetas = [
      recetaDePrueba({ id: 'a', ingredientes: [espacio('esencial', 'papa'), espacio('esencial', 'zanahoria')] }),
      recetaDePrueba({ id: 'b', ingredientes: [espacio('esencial', 'zanahoria')] }),
      recetaDePrueba({ id: 'c', ingredientes: [espacio('esencial', 'carne')] }),
      recetaDePrueba({ id: 'd', ingredientes: [espacio('esencial', 'carne'), espacio('esencial', 'zanahoria')] }),
    ];
    const r = mejorCompra(recetas, new Set(['papa']), SIN_BASICOS);
    expect(r).toEqual({ ingredienteId: 'zanahoria', recetaIds: ['a', 'b'] });
  });

  it('devuelve null si todo se puede cocinar', () => {
    const recetas = [recetaDePrueba({ ingredientes: [espacio('esencial', 'papa')] })];
    expect(mejorCompra(recetas, new Set(['papa']), SIN_BASICOS)).toBeNull();
  });
});

describe('afinidad: valores límite', () => {
  const evaluar = (ingredientes: ReturnType<typeof espacio>[], hay: string[]) =>
    evaluarReceta(recetaDePrueba({ ingredientes }), new Set(hay), SIN_BASICOS).puntaje;

  it('receta sin ingredientes cuenta como completa (100)', () => {
    expect(evaluar([], [])).toBe(100);
  });

  it.each([
    [0, 15],
    [1, 43], // 28.33 + 15
    [2, 72], // 56.67 + 15
    [3, 100],
  ])('con %i de 3 esenciales (sin condimentos) → %i', (cuantos, puntaje) => {
    const esenciales = ['a', 'b', 'c'].map((x) => espacio('esencial', x));
    expect(evaluar(esenciales, ['a', 'b', 'c'].slice(0, cuantos))).toBe(puntaje);
  });

  it('redondea .5 hacia arriba: 42.5 + 15 = 57.5 → 58', () => {
    expect(evaluar([espacio('esencial', 'a'), espacio('esencial', 'b')], ['a'])).toBe(58);
  });

  it('el bonus de opcionales es proporcional: 15 + 2.5 → 18', () => {
    const r = [espacio('esencial', 'a'), espacio('opcional', 'x'), espacio('opcional', 'y')];
    expect(evaluar(r, ['x'])).toBe(18);
  });

  it('un espacio sin opciones nunca se cubre y no rompe el cálculo', () => {
    const r = evaluarReceta(recetaDePrueba({ ingredientes: [espacio('esencial')] }), new Set(['a']), SIN_BASICOS);
    expect(r.puntaje).toBe(15);
    expect(r.faltantesEsenciales).toEqual(['']);
  });

  it('espacioCubierto: ni disponible ni básico → false; básico → true', () => {
    const e = espacio('condimento', 'sal');
    expect(espacioCubierto(e, new Set(), new Set())).toBe(false);
    expect(espacioCubierto(e, new Set(), new Set(['sal']))).toBe(true);
  });

  it('el faltante que se muestra es la primera alternativa del espacio', () => {
    const r = evaluarReceta(recetaDePrueba({ ingredientes: [espacio('esencial', 'papa', 'chuno')] }), new Set(), SIN_BASICOS);
    expect(r.faltantesEsenciales).toEqual(['papa']);
  });

  it('sugerirPorFranja sin recetas → mapa vacío', () => {
    expect(sugerirPorFranja([], new Set(), SIN_BASICOS).size).toBe(0);
  });

  it('mejorCompra ignora recetas inactivas y las que les faltan 2 o más esenciales', () => {
    const recetas = [
      recetaDePrueba({ id: 'inactiva', activo: false, ingredientes: [espacio('esencial', 'carne')] }),
      recetaDePrueba({ id: 'dos', ingredientes: [espacio('esencial', 'carne'), espacio('esencial', 'arroz')] }),
    ];
    expect(mejorCompra(recetas, new Set(), SIN_BASICOS)).toBeNull();
  });

  it('mejorCompra en empate se queda con el primero encontrado', () => {
    const recetas = [
      recetaDePrueba({ id: 'x', ingredientes: [espacio('esencial', 'a')] }),
      recetaDePrueba({ id: 'y', ingredientes: [espacio('esencial', 'b')] }),
    ];
    expect(mejorCompra(recetas, new Set(), SIN_BASICOS)?.ingredienteId).toBe('a');
  });
});
