import { Routes } from '@angular/router';
import {
  soloActivosGuard,
  soloAnonimosGuard,
  soloPendientesGuard,
} from './presentation/guards/sesion.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'login',
    canActivate: [soloAnonimosGuard],
    loadComponent: () =>
      import('./presentation/features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'pendiente',
    canActivate: [soloPendientesGuard],
    loadComponent: () =>
      import('./presentation/features/login/pendiente.page').then((m) => m.PendientePage),
  },
  {
    path: 'inicio',
    canActivate: [soloActivosGuard],
    loadComponent: () =>
      import('./presentation/features/inicio/inicio.page').then((m) => m.InicioPage),
  },
  { path: '**', redirectTo: 'inicio' },
];
