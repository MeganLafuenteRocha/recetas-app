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
    path: 'bienvenida',
    canActivate: [soloActivosGuard],
    loadComponent: () =>
      import('./presentation/features/login/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    // Marco con barra de navegación inferior (4 destinos)
    path: '',
    canActivate: [soloActivosGuard],
    loadComponent: () =>
      import('./presentation/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./presentation/features/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'mi-dia',
        loadComponent: () =>
          import('./presentation/ui/en-construccion.page').then((m) => m.EnConstruccionPage),
        data: { titulo: 'Mi día' },
      },
      {
        path: 'recetas',
        loadComponent: () =>
          import('./presentation/ui/en-construccion.page').then((m) => m.EnConstruccionPage),
        data: { titulo: 'Recetas' },
      },
      {
        path: 'despensa',
        loadComponent: () =>
          import('./presentation/ui/en-construccion.page').then((m) => m.EnConstruccionPage),
        data: { titulo: 'Despensa' },
      },
      {
        path: 'dia',
        loadComponent: () =>
          import('./presentation/ui/en-construccion.page').then((m) => m.EnConstruccionPage),
        data: { titulo: '¿Qué tienes hoy?' },
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./presentation/ui/en-construccion.page').then((m) => m.EnConstruccionPage),
        data: { titulo: 'Buscador' },
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
