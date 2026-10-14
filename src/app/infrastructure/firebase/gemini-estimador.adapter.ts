import { Injectable } from '@angular/core';
import type { GenerativeModel } from 'firebase/ai';
import {
  EstimacionNutricional,
  EstimadorNutricional,
  RecetaParaEstimar,
} from '../../domain/nutricion/estimador.port';
import { nutricionValida, redondearNutricion } from '../../domain/nutricion/nutricion.model';
import { firebaseApp } from './firebase.providers';

/** Modelo de Gemini que usa Firebase AI Logic. Si Google lo retira, se cambia solo aquí. */
const MODELO = 'gemini-3.6-flash';

function armarPrompt(r: RecetaParaEstimar): string {
  const linea = (i: RecetaParaEstimar['ingredientes'][number]) => {
    const cantidad = i.cantidad === null ? 'al gusto' : `${i.cantidad} ${i.unidad ?? ''}`.trim();
    const otros = i.sinonimos.length ? ` (también llamado: ${i.sinonimos.join(', ')})` : '';
    return `- ${i.nombre}${otros}: ${cantidad}${i.opcional ? ' [OPCIONAL]' : ''}`;
  };
  return [
    'Eres nutricionista y conoces la cocina boliviana.',
    `Estima la nutrición POR PORCIÓN de la receta "${r.nombre}", que rinde ${r.porciones} porciones.`,
    'Considera la preparación: frituras, aceite y agua de cocción cuentan.',
    '"porcion": solo con los ingredientes que NO son opcionales.',
    '"conOpcionales": sumando también los marcados [OPCIONAL].',
    'Valores en kcal y gramos, números redondos.',
    '',
    'Ingredientes (para toda la receta):',
    ...r.ingredientes.map(linea),
    '',
    'Preparación:',
    r.preparacion || '(sin detalle)',
  ].join('\n');
}

/**
 * Adaptador de Firebase AI Logic (Gemini Developer API, capa gratuita).
 * La clave de la IA nunca está en la app: Firebase la pone del lado del servidor.
 */
@Injectable({ providedIn: 'root' })
export class GeminiEstimadorAdapter extends EstimadorNutricional {
  private modelo: GenerativeModel | null = null;

  /** El SDK de IA se descarga recién al primer uso: no pesa en la carga inicial de la app. */
  private async obtenerModelo(): Promise<GenerativeModel> {
    if (this.modelo) return this.modelo;
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai');
    const porcion = Schema.object({
      properties: {
        kcal: Schema.number(),
        proteinaG: Schema.number(),
        carbohidratosG: Schema.number(),
        grasaG: Schema.number(),
      },
    });
    // Salida estructurada: Gemini SOLO puede responder este JSON, nada de párrafos.
    const esquema = Schema.object({ properties: { porcion, conOpcionales: porcion } });
    this.modelo = getGenerativeModel(getAI(firebaseApp, { backend: new GoogleAIBackend() }), {
      model: MODELO,
      generationConfig: { responseMimeType: 'application/json', responseSchema: esquema, temperature: 0.2 },
    });
    return this.modelo;
  }

  async estimar(receta: RecetaParaEstimar): Promise<EstimacionNutricional | null> {
    try {
      const modelo = await this.obtenerModelo();
      const resultado = await modelo.generateContent(armarPrompt(receta));
      const datos = JSON.parse(resultado.response.text()) as Record<string, unknown>;
      if (!nutricionValida(datos['porcion']) || !nutricionValida(datos['conOpcionales'])) {
        return null;
      }
      return {
        porcion: redondearNutricion(datos['porcion']),
        conOpcionales: redondearNutricion(datos['conOpcionales']),
      };
    } catch (error) {
      // Sin conexión, sin cuota o AI Logic aún no habilitado: la receta se guarda igual.
      console.warn('[Recetas] No se pudo estimar la nutrición:', error);
      return null;
    }
  }
}
