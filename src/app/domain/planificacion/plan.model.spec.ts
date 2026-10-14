import { describe, expect, it } from 'vitest';
import { recetaDePrueba } from '../recetas/receta.fixtures';
import { cambiarEleccion, evaluarMeta, PlanDia, semanaDe, totalesDelDia } from './plan.model';

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
