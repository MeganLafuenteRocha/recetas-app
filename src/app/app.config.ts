import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
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
import { AuthAdapter } from './infrastructure/firebase/auth.adapter';
import { FirestoreCatalogosRepo } from './infrastructure/firebase/firestore-catalogos.repo';
import { FirestoreDespensaRepo } from './infrastructure/firebase/firestore-despensa.repo';
import { FirestoreGruposRepo } from './infrastructure/firebase/firestore-grupos.repo';
import { FirestoreIngredientesRepo } from './infrastructure/firebase/firestore-ingredientes.repo';
import { FirestoreListasRepo } from './infrastructure/firebase/firestore-listas.repo';
import { FirestorePlanesRepo } from './infrastructure/firebase/firestore-planes.repo';
import { FirestorePreferenciasRepo } from './infrastructure/firebase/firestore-preferencias.repo';
import { FirestoreRecetasRepo } from './infrastructure/firebase/firestore-recetas.repo';
import { FirestoreUsuariosRepo } from './infrastructure/firebase/firestore-usuarios.repo';
import { GeminiEstimadorAdapter } from './infrastructure/firebase/gemini-estimador.adapter';
import { ImagenesIndexedDbAdapter } from './infrastructure/local/imagenes-indexeddb.adapter';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // Puertos del dominio → adaptadores de infraestructura (hexagonal)
    { provide: SesionPort, useExisting: AuthAdapter },
    { provide: UsuarioRepository, useExisting: FirestoreUsuariosRepo },
    { provide: CatalogoRepository, useExisting: FirestoreCatalogosRepo },
    { provide: IngredienteRepository, useExisting: FirestoreIngredientesRepo },
    { provide: RecetaRepository, useExisting: FirestoreRecetasRepo },
    { provide: DespensaRepository, useExisting: FirestoreDespensaRepo },
    { provide: PlanRepository, useExisting: FirestorePlanesRepo },
    { provide: PreferenciasRepository, useExisting: FirestorePreferenciasRepo },
    { provide: GrupoRepository, useExisting: FirestoreGruposRepo },
    { provide: ListaRepository, useExisting: FirestoreListasRepo },
    { provide: EstimadorNutricional, useExisting: GeminiEstimadorAdapter },
    { provide: ImagenRepository, useExisting: ImagenesIndexedDbAdapter },

    // Antes de pintar nada: restaurar la sesión guardada (los guards la necesitan)
    provideAppInitializer(() => inject(SesionStore).restaurar()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
