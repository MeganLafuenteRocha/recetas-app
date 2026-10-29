import { describe, expect, it } from 'vitest';
import {
  coincideIngrediente,
  conNombre,
  crearIngredientesDesdeTexto,
  idParaIngrediente,
  Ingrediente,
  normalizarTexto,
} from './ingrediente.model';

const arveja: Ingrediente = {
  id: 'ing_arveja',
  ambito: 'comun',
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

describe('ingredientes: valores límite', () => {
  it.each(['', '   '])('una búsqueda vacía ("%s") no coincide con nada', (q) => {
    expect(coincideIngrediente(arveja, q)).toBe(false);
  });

  it.each(['ARV', 'veja', ' arveja ', 'alverj'])('coincidencia parcial y sin importar mayúsculas: "%s"', (q) => {
    expect(coincideIngrediente(arveja, q)).toBe(true);
  });

  it('busca sin importar tildes', () => {
    const chuno = { ...arveja, nombre: 'Chuño', nombreNormalizado: 'chuno', sinonimos: [] };
    expect(coincideIngrediente(chuno, 'CHUÑO')).toBe(true);
  });

  it.each([
    ['  ¡Ají amarillo!  ', 'ing_aji_amarillo'],
    ['Leche (entera)', 'ing_leche_entera'],
    ['Q', 'ing_q'],
  ])('id de "%s" → %s', (nombre, id) => {
    expect(idParaIngrediente(nombre, new Set())).toBe(id);
  });

  it('salta varios ids ocupados', () => {
    expect(idParaIngrediente('Papa', new Set(['ing_papa', 'ing_papa_2']))).toBe('ing_papa_3');
  });

  it.each(['', '   ', ',,\n,'])('alta rápida con texto vacío (%j) no crea nada', (texto) => {
    expect(crearIngredientesDesdeTexto(texto, 'verduras', [])).toEqual([]);
  });

  it('alta rápida: nombres que dan el mismo id reciben ids distintos', () => {
    const nuevos = crearIngredientesDesdeTexto('Haba-verde, haba verde', 'verduras', []);
    expect(nuevos.map((n) => n.id)).toEqual(['ing_haba_verde', 'ing_haba_verde_2']);
  });

  it('alta rápida: capitaliza y no duplica por tildes ("ají" = "Aji")', () => {
    expect(crearIngredientesDesdeTexto(' ají, Aji', 'condimentos', []).map((n) => n.nombre)).toEqual(['Ají']);
  });

  it('conNombre recalcula el nombre normalizado y no toca lo demás', () => {
    const r = conNombre(arveja, '  Arvejita Verde ');
    expect(r).toEqual({ ...arveja, nombre: 'Arvejita Verde', nombreNormalizado: 'arvejita verde' });
    expect(arveja.nombre).toBe('Arveja');
  });
});
