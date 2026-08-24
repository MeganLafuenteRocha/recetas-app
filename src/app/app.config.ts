import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SesionStore } from './application/stores/sesion.store';
import { SesionPort } from './domain/usuarios/sesion.port';
import { UsuarioRepository } from './domain/usuarios/usuario.port';
import { AuthAdapter } from './infrastructure/firebase/auth.adapter';
import { FirestoreUsuariosRepo } from './infrastructure/firebase/firestore-usuarios.repo';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Puertos del dominio → adaptadores de infraestructura (hexagonal)
    { provide: SesionPort, useExisting: AuthAdapter },
    { provide: UsuarioRepository, useExisting: FirestoreUsuariosRepo },

    // Antes de pintar nada: restaurar la sesión guardada (los guards la necesitan)
    provideAppInitializer(() => inject(SesionStore).restaurar()),
  ],
};
