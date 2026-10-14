import { EspacioIngrediente, Receta } from '../recetas/receta.model';

/**
 * Qué tan bien se puede cocinar una receta con lo que hay disponible.
 * Regla de Andrea: faltar algo NO descalifica la receta, solo la baja en la lista.
 */
export interface ResultadoAfinidad {
  receta: Receta;
  /** 0 a 100: 85 × esenciales + 15 × condimentos + hasta 5 de bonus por opcionales. */
  puntaje: number;
  /** Un ingrediente representativo por espacio sin cubrir, agrupado por rol. */
  faltantesEsenciales: string[];
  faltantesCondimentos: string[];
  faltantesOpcionales: string[];
}

export const PESO_ESENCIALES = 85;
export const PESO_CONDIMENTOS = 15;
export const BONUS_OPCIONALES = 5;

/** Un espacio está cubierto si ALGUNA de sus alternativas está disponible o es básica (sal, azúcar…). */
export function espacioCubierto(
  espacio: EspacioIngrediente,
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): boolean {
  return espacio.opciones.some(
    (o) => disponibles.has(o.ingredienteId) || basicos.has(o.ingredienteId),
  );
}

interface Cobertura {
  cubiertos: number;
  total: number;
  faltantes: string[];
}

function cobertura(
  espacios: EspacioIngrediente[],
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): Cobertura {
  const faltantes: string[] = [];
  let cubiertos = 0;
  for (const espacio of espacios) {
    if (espacioCubierto(espacio, disponibles, basicos)) {
      cubiertos++;
    } else {
      faltantes.push(espacio.opciones[0]?.ingredienteId ?? '');
    }
  }
  return { cubiertos, total: espacios.length, faltantes };
}

/** Sin espacios de un rol, ese rol cuenta como completo. */
function fraccion(c: Cobertura): number {
  return c.total === 0 ? 1 : c.cubiertos / c.total;
}

export function evaluarReceta(
  receta: Receta,
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): ResultadoAfinidad {
  const porRol = (rol: EspacioIngrediente['rol']) =>
    cobertura(
      receta.ingredientes.filter((e) => e.rol === rol),
      disponibles,
      basicos,
    );
  const esenciales = porRol('esencial');
  const condimentos = porRol('condimento');
  const opcionales = porRol('opcional');

  const base = PESO_ESENCIALES * fraccion(esenciales) + PESO_CONDIMENTOS * fraccion(condimentos);
  // Los opcionales solo suman: tenerlos mejora, faltarles no baja.
  const bonus = opcionales.total === 0 ? 0 : BONUS_OPCIONALES * fraccion(opcionales);

  return {
    receta,
    puntaje: Math.min(100, Math.round(base + bonus)),
    faltantesEsenciales: esenciales.faltantes,
    faltantesCondimentos: condimentos.faltantes,
    faltantesOpcionales: opcionales.faltantes,
  };
}

/** Evalúa todas las recetas y las agrupa por franja, mejores primero. Nunca oculta ninguna. */
export function sugerirPorFranja(
  recetas: readonly Receta[],
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): Map<string, ResultadoAfinidad[]> {
  const porFranja = new Map<string, ResultadoAfinidad[]>();
  for (const receta of recetas) {
    if (!receta.activo) continue;
    const resultado = evaluarReceta(receta, disponibles, basicos);
    const lista = porFranja.get(receta.tipoComida) ?? [];
    lista.push(resultado);
    porFranja.set(receta.tipoComida, lista);
  }
  for (const lista of porFranja.values()) {
    lista.sort((a, b) => b.puntaje - a.puntaje);
  }
  return porFranja;
}

/** Una receta "se puede cocinar ya" cuando no le falta ningún esencial. */
export function sePuedeCocinar(resultado: ResultadoAfinidad): boolean {
  return resultado.faltantesEsenciales.length === 0;
}

export interface SugerenciaCompra {
  ingredienteId: string;
  /** Recetas que quedarían sin esenciales faltantes si se compra este ingrediente. */
  recetaIds: string[];
}

/**
 * "Compra 1 y cocina N más": el ingrediente que, por sí solo, completa más recetas.
 * Solo cuenta recetas a las que les falta EXACTAMENTE un esencial.
 */
export function mejorCompra(
  recetas: readonly Receta[],
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): SugerenciaCompra | null {
  const conteo = new Map<string, string[]>();
  for (const receta of recetas) {
    if (!receta.activo) continue;
    const { faltantesEsenciales } = evaluarReceta(receta, disponibles, basicos);
    if (faltantesEsenciales.length !== 1) continue;
    const id = faltantesEsenciales[0]!;
    conteo.set(id, [...(conteo.get(id) ?? []), receta.id]);
  }
  let mejor: SugerenciaCompra | null = null;
  for (const [ingredienteId, recetaIds] of conteo) {
    if (!mejor || recetaIds.length > mejor.recetaIds.length) {
      mejor = { ingredienteId, recetaIds };
    }
  }
  return mejor;
}
