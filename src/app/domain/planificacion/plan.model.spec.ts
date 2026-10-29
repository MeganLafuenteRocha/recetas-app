import { describe, expect, it } from 'vitest';
import { recetaDePrueba } from '../recetas/receta.fixtures';
import {
  cambiarEleccion,
  desdeISO,
  evaluarMeta,
  fechaISO,
  PlanDia,
  semanaDe,
  sumarDias,
  totalesDelDia,
} from './plan.model';

const metas = { kcalMin: 1000, kcalMax: 1300, proteinaG: 50 };

describe('plan del día', () => {
  it('la semana va de lunes a domingo, también si la fecha es domingo', () => {
    expect(semanaDe(new Date(2026, 7, 26))).toEqual([
      '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30',
    ]);
    expect(semanaDe(new Date(2026, 7, 30))[0]).toBe('2026-08-24');
  });

  it('suma la nutrición y avisa si es parcial', () => {
    const conDato = recetaDePrueba({
      id: 'a',
      nutricionPorcion: { kcal: 400.4, proteinaG: 20, carbohidratosG: 0, grasaG: 0 },
    });
    const sinDato = recetaDePrueba({ id: 'b' });
    const recetas = new Map([['a', conDato], ['b', sinDato]]);
    const t = totalesDelDia(
      [{ franja: 'sopa', recetaId: 'a' }, { franja: 'seco', recetaId: 'b' }],
      (id) => recetas.get(id),
    );
    expect(t).toEqual({ kcal: 400, proteinaG: 20, conDato: 1, elegidas: 2 });
    expect(evaluarMeta(t, metas)).toBe('debajo');
  });

  it('evalúa la meta', () => {
    const base = { proteinaG: 0, conDato: 1, elegidas: 1 };
    expect(evaluarMeta({ ...base, kcal: 1200 }, metas)).toBe('dentro');
    expect(evaluarMeta({ ...base, kcal: 1400 }, metas)).toBe('encima');
    expect(evaluarMeta({ ...base, kcal: 0, conDato: 0 }, metas)).toBe('sin-datos');
  });

  it('cambia o quita la receta de una franja', () => {
    const plan: PlanDia = { fecha: '2026-08-24', elecciones: [{ franja: 'sopa', recetaId: 'a' }], creadoEn: null };
    expect(cambiarEleccion(plan, 'sopa', 'b').elecciones).toEqual([{ franja: 'sopa', recetaId: 'b' }]);
    expect(cambiarEleccion(plan, 'sopa', null).elecciones).toEqual([]);
  });
});

describe('fechas: valores límite', () => {
  it('fechaISO rellena con ceros', () => {
    expect(fechaISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('desdeISO y fechaISO son inversas (sin corrimiento de zona horaria)', () => {
    for (const iso of ['2026-01-01', '2026-12-31', '2028-02-29']) {
      expect(fechaISO(desdeISO(iso))).toBe(iso);
    }
  });

  it.each([
    ['2026-01-31', 1, '2026-02-01'], // cambio de mes
    ['2026-12-31', 1, '2027-01-01'], // cambio de año
    ['2028-02-28', 1, '2028-02-29'], // año bisiesto
    ['2026-02-28', 1, '2026-03-01'], // año no bisiesto
    ['2026-03-01', -1, '2026-02-28'], // hacia atrás
    ['2026-08-24', 0, '2026-08-24'],
  ])('%s + %i días = %s', (desde, dias, esperado) => {
    expect(fechaISO(sumarDias(desdeISO(desde), dias))).toBe(esperado);
  });

  it('sumarDias no modifica la fecha original', () => {
    const f = desdeISO('2026-08-24');
    sumarDias(f, 3);
    expect(fechaISO(f)).toBe('2026-08-24');
  });

  it('la semana de un lunes empieza ese mismo lunes', () => {
    expect(semanaDe(desdeISO('2026-08-24'))[0]).toBe('2026-08-24');
  });

  it('una semana puede cruzar de año', () => {
    const s = semanaDe(desdeISO('2027-01-01'));
    expect(s[0]).toBe('2026-12-28');
    expect(s[6]).toBe('2027-01-03');
  });
});

describe('metas y totales: valores límite', () => {
  const t = (kcal: number) => ({ kcal, proteinaG: 0, conDato: 1, elegidas: 1 });

  it.each([
    [999, 'debajo'],
    [1000, 'dentro'], // justo el mínimo
    [1300, 'dentro'], // justo el máximo
    [1301, 'encima'],
  ])('%i kcal → %s', (kcal, estado) => {
    expect(evaluarMeta(t(kcal), metas)).toBe(estado);
  });

  it('día sin elecciones → todo en 0 y sin datos', () => {
    const vacio = totalesDelDia([], () => undefined);
    expect(vacio).toEqual({ kcal: 0, proteinaG: 0, conDato: 0, elegidas: 0 });
    expect(evaluarMeta(vacio, metas)).toBe('sin-datos');
  });

  it('una receta borrada cuenta como elegida pero sin dato', () => {
    expect(totalesDelDia([{ franja: 'sopa', recetaId: 'no-existe' }], () => undefined)).toMatchObject({
      conDato: 0,
      elegidas: 1,
    });
  });

  it('redondea al final, no receta por receta (400.4 + 100.4 = 501)', () => {
    const r = (id: string) =>
      recetaDePrueba({ id, nutricionPorcion: { kcal: id === 'a' ? 400.4 : 100.4, proteinaG: 0, carbohidratosG: 0, grasaG: 0 } });
    const total = totalesDelDia(
      [{ franja: 'sopa', recetaId: 'a' }, { franja: 'seco', recetaId: 'b' }],
      (id) => r(id),
    );
    expect(total.kcal).toBe(501);
  });

  it('cambiarEleccion agrega una franja nueva sin tocar las demás ni el plan original', () => {
    const plan: PlanDia = { fecha: '2026-08-24', elecciones: [{ franja: 'sopa', recetaId: 'a' }], creadoEn: null };
    const nuevo = cambiarEleccion(plan, 'seco', 'b');
    expect(nuevo.elecciones).toEqual([{ franja: 'sopa', recetaId: 'a' }, { franja: 'seco', recetaId: 'b' }]);
    expect(plan.elecciones).toHaveLength(1);
  });

  it('quitar una franja que no existe no cambia nada', () => {
    const plan: PlanDia = { fecha: '2026-08-24', elecciones: [{ franja: 'sopa', recetaId: 'a' }], creadoEn: null };
    expect(cambiarEleccion(plan, 'postre', null).elecciones).toEqual(plan.elecciones);
  });
});
