import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { SesionStore } from './application/stores/sesion.store';
import { CatalogoRepository } from './domain/catalogos/catalogo.port';
import { DespensaRepository } from './domain/despensa/despensa.port';
import { GrupoRepository } from './domain/grupos/grupo.port';
import { IngredienteRepository } from './domain/ingredientes/ingrediente.port';
import { ListaRepository } from './domain/listas/lista.port';
import { EstimadorNutricional } from './domain/nutricion/estimador.port';
import { PlanRepository } from './domain/planificacion/plan.port';
import { PreferenciasRepository } from './domain/preferencias/preferencias.port';
import { ImagenRepository } from './domain/recetas/imagen.port';
import { RecetaRepository } from './domain/recetas/receta.port';
import { SesionPort } from './domain/usuarios/sesion.port';
import { UsuarioRepository } from './domain/usuarios/usuario.port';
import { ImagenesIndexedDbAdapter } from './infrastructure/local/imagenes-indexeddb.adapter';
import * as memoria from './infrastructure/memoria/memoria.adapters';

/**
 * MODO DEMO (`npm run demo`): mismos puertos, adaptadores en memoria.
 * Reemplaza a app.config.ts solo en la configuración "demo" de angular.json.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    { provide: SesionPort, useExisting: memoria.SesionMemoria },
    { provide: UsuarioRepository, useExisting: memoria.UsuariosMemoria },
    { provide: CatalogoRepository, useExisting: memoria.CatalogosMemoria },
    { provide: IngredienteRepository, useExisting: memoria.IngredientesMemoria },
    { provide: RecetaRepository, useExisting: memoria.RecetasMemoria },
    { provide: DespensaRepository, useExisting: memoria.DespensaMemoria },
    { provide: PlanRepository, useExisting: memoria.PlanesMemoria },
    { provide: PreferenciasRepository, useExisting: memoria.PreferenciasMemoria },
    { provide: GrupoRepository, useExisting: memoria.GruposMemoria },
    { provide: ListaRepository, useExisting: memoria.ListasMemoria },
    { provide: EstimadorNutricional, useExisting: memoria.EstimadorMemoria },
    { provide: ImagenRepository, useExisting: ImagenesIndexedDbAdapter },

    provideAppInitializer(() => inject(SesionStore).restaurar()),
  ],
};
