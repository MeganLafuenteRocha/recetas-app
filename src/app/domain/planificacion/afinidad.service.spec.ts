import { describe, expect, it } from 'vitest';
import { Receta } from '../recetas/receta.model';
import { evaluarReceta, sugerirPorFranja } from './afinidad.service';

function recetaDePrueba(parcial: Partial<Receta>): Receta {
  return {
    id: 'rec_test',
    activo: true,
    nombre: 'Receta de prueba',
    descripcion: '',
    tipoComida: 'sopa',
    tipoCocina: 'boliviana',
    porciones: 4,
    dificultad: 2,
    imagen: null,
    tiempo: { preparacionMin: 10, coccionMin: 20, totalMin: 30 },
    ingredientes: [],
    preparacion: { descripcion: null, pasos: [] },
    nutricionPorcion: null,
    nutricionConOpcionales: null,
    nutricionCalculadaEn: null,
    ...parcial,
  };
}

function espacio(rol: 'esencial' | 'condimento' | 'opcional', ...ids: string[]) {
  return {
    orden: 1,
    rol,
    opciones: ids.map((id) => ({ ingredienteId: id, cantidad: 1, unidad: 'u', nota: null })),
  };
}

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

  it('penaliza más un esencial faltante que un condimento', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_comino')],
    });
    const sinEsencial = evaluarReceta(receta, new Set(['ing_comino']), SIN_BASICOS);
    const sinCondimento = evaluarReceta(receta, new Set(['ing_papa']), SIN_BASICOS);
    expect(sinEsencial.puntaje).toBe(30);
    expect(sinCondimento.puntaje).toBe(70);
    expect(sinEsencial.faltantesEsenciales).toEqual(['ing_papa']);
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

  it('los opcionales no penalizan aunque falten', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('opcional', 'ing_perejil')],
    });
    const r = evaluarReceta(receta, new Set(['ing_papa']), SIN_BASICOS);
    expect(r.puntaje).toBe(100);
  });

  it('sin ningún ingrediente disponible da 0', () => {
    const receta = recetaDePrueba({
      ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_comino')],
    });
    const r = evaluarReceta(receta, new Set(), SIN_BASICOS);
    expect(r.puntaje).toBe(0);
  });
});

describe('sugerirPorFranja', () => {
  it('agrupa por franja y ordena de mejor a peor', () => {
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
