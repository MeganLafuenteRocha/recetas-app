import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SesionStore } from './application/stores/sesion.store';
import { CatalogoRepository } from './domain/catalogos/catalogo.port';
import { DespensaRepository } from './domain/despensa/despensa.port';
import { IngredienteRepository } from './domain/ingredientes/ingrediente.port';
import { PlanRepository } from './domain/planificacion/plan.port';
import { RecetaRepository } from './domain/recetas/receta.port';
import { SesionPort } from './domain/usuarios/sesion.port';
import { UsuarioRepository } from './domain/usuarios/usuario.port';
import { AuthAdapter } from './infrastructure/firebase/auth.adapter';
import { FirestoreCatalogosRepo } from './infrastructure/firebase/firestore-catalogos.repo';
import { FirestoreDespensaRepo } from './infrastructure/firebase/firestore-despensa.repo';
import { FirestoreIngredientesRepo } from './infrastructure/firebase/firestore-ingredientes.repo';
import { FirestorePlanesRepo } from './infrastructure/firebase/firestore-planes.repo';
import { FirestoreRecetasRepo } from './infrastructure/firebase/firestore-recetas.repo';
import { FirestoreUsuariosRepo } from './infrastructure/firebase/firestore-usuarios.repo';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Puertos del dominio → adaptadores de infraestructura (hexagonal)
    { provide: SesionPort, useExisting: AuthAdapter },
    { provide: UsuarioRepository, useExisting: FirestoreUsuariosRepo },
    { provide: CatalogoRepository, useExisting: FirestoreCatalogosRepo },
    { provide: IngredienteRepository, useExisting: FirestoreIngredientesRepo },
    { provide: RecetaRepository, useExisting: FirestoreRecetasRepo },
    { provide: DespensaRepository, useExisting: FirestoreDespensaRepo },
    { provide: PlanRepository, useExisting: FirestorePlanesRepo },

    // Antes de pintar nada: restaurar la sesión guardada (los guards la necesitan)
    provideAppInitializer(() => inject(SesionStore).restaurar()),
  ],
};
