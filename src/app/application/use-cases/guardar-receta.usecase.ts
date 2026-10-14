import { inject, Injectable } from '@angular/core';
import { EstimadorNutricional, RecetaParaEstimar } from '../../domain/nutricion/estimador.port';
import {
  idParaReceta,
  prepararParaGuardar,
  Receta,
  validarReceta,
} from '../../domain/recetas/receta.model';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { IngredientesStore } from '../stores/ingredientes.store';
import { RecetasStore } from '../stores/recetas.store';

export interface ResultadoGuardado {
  receta: Receta | null;
  errores: string[];
  /** true si se pidió la IA y no respondió: la nutrición queda pendiente. */
  nutricionPendiente: boolean;
}

/**
 * Alta o edición de una receta. ÚNICO lugar donde se llama a la IA (una vez por guardado).
 * La receta se guarda SIEMPRE: si la IA falla, la nutrición queda null para recalcular después.
 */
@Injectable({ providedIn: 'root' })
export class GuardarRecetaUseCase {
  private readonly repo = inject(RecetaRepository);
  private readonly estimador = inject(EstimadorNutricional);
  private readonly recetas = inject(RecetasStore);
  private readonly ingredientes = inject(IngredientesStore);

  async ejecutar(borrador: Receta, recalcularNutricion: boolean): Promise<ResultadoGuardado> {
    const errores = validarReceta(borrador);
    if (errores.length > 0) return { receta: null, errores, nutricionPendiente: false };

    let receta = prepararParaGuardar(borrador);
    if (!receta.id) {
      receta = { ...receta, id: idParaReceta(receta.nombre, new Set(this.recetas.porId().keys())) };
    }

    let nutricionPendiente = false;
    if (recalcularNutricion) {
      const estimacion = await this.estimador.estimar(this.paraEstimar(receta));
      if (estimacion) {
        receta = {
          ...receta,
          nutricionPorcion: estimacion.porcion,
          nutricionConOpcionales: estimacion.conOpcionales,
          nutricionCalculadaEn: new Date(),
        };
      } else {
        nutricionPendiente = true;
      }
    }

    await this.repo.guardar(receta);
    this.recetas.actualizar(receta);
    return { receta, errores: [], nutricionPendiente };
  }

  /** Resuelve ids → nombres y sinónimos para que la IA reconozca "chuño" o "arverja". */
  paraEstimar(receta: Receta): RecetaParaEstimar {
    const pasos = receta.preparacion.pasos ?? [];
    return {
      nombre: receta.nombre,
      porciones: receta.porciones,
      ingredientes: receta.ingredientes.flatMap((espacio) => {
        const principal = espacio.opciones[0];
        if (!principal) return [];
        const ing = this.ingredientes.obtener(principal.ingredienteId);
        return [
          {
            nombre: ing?.nombre ?? principal.ingredienteId,
            sinonimos: ing?.sinonimos ?? [],
            cantidad: principal.cantidad,
            unidad: principal.unidad,
            opcional: espacio.rol === 'opcional',
          },
        ];
      }),
      preparacion: [receta.preparacion.descripcion ?? '', ...pasos.map((p) => `${p.numero}. ${p.instruccion}`)]
        .filter(Boolean)
        .join('\n'),
    };
  }
}
