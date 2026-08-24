import { EspacioIngrediente, Receta } from '../recetas/receta.model';

/** Qué tan bien se puede cocinar una receta con lo que hay disponible. */
export interface ResultadoAfinidad {
  receta: Receta;
  /** 0 a 100: cobertura de esenciales (70%) + condimentos (30%). */
  puntaje: number;
  /** Un ingrediente representativo por espacio esencial sin cubrir. */
  faltantesEsenciales: string[];
  faltantesCondimentos: string[];
}

const PESO_ESENCIALES = 0.7;
const PESO_CONDIMENTOS = 0.3;

/** Un espacio está cubierto si ALGUNA de sus alternativas está disponible o es básica (sal, azúcar…). */
function espacioCubierto(
  espacio: EspacioIngrediente,
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): boolean {
  return espacio.opciones.some(
    (o) => disponibles.has(o.ingredienteId) || basicos.has(o.ingredienteId),
  );
}

export function evaluarReceta(
  receta: Receta,
  disponibles: ReadonlySet<string>,
  basicos: ReadonlySet<string>,
): ResultadoAfinidad {
  const esenciales = receta.ingredientes.filter((e) => e.rol === 'esencial');
  const condimentos = receta.ingredientes.filter((e) => e.rol === 'condimento');
  // Los opcionales nunca penalizan.

  const faltantesEsenciales: string[] = [];
  const faltantesCondimentos: string[] = [];

  let esencialesCubiertos = 0;
  for (const espacio of esenciales) {
    if (espacioCubierto(espacio, disponibles, basicos)) {
      esencialesCubiertos++;
    } else {
      faltantesEsenciales.push(espacio.opciones[0]?.ingredienteId ?? '');
    }
  }

  let condimentosCubiertos = 0;
  for (const espacio of condimentos) {
    if (espacioCubierto(espacio, disponibles, basicos)) {
      condimentosCubiertos++;
    } else {
      faltantesCondimentos.push(espacio.opciones[0]?.ingredienteId ?? '');
    }
  }

  const fraccionEsenciales =
    esenciales.length === 0 ? 1 : esencialesCubiertos / esenciales.length;
  const fraccionCondimentos =
    condimentos.length === 0 ? 1 : condimentosCubiertos / condimentos.length;

  const puntaje = Math.round(
    (fraccionEsenciales * PESO_ESENCIALES + fraccionCondimentos * PESO_CONDIMENTOS) * 100,
  );

  return { receta, puntaje, faltantesEsenciales, faltantesCondimentos };
}

/** Evalúa todas las recetas y las agrupa por franja, mejores primero. */
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
