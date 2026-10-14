import { Routes } from '@angular/router';
import {
  soloActivosGuard,
  soloAdminGuard,
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
    // Marco con barra de navegación inferior (4 destinos). Todo exige cuenta activa.
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
          import('./presentation/features/mi-dia/mi-dia.page').then((m) => m.MiDiaPage),
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./presentation/features/buscar/buscar.page').then((m) => m.BuscarPage),
      },

      // Recetas (07A/07B, 08, 11, modo cocina)
      {
        path: 'recetas',
        loadComponent: () =>
          import('./presentation/features/recetas/recetas.page').then((m) => m.RecetasPage),
      },
      {
        path: 'recetas/nueva',
        loadComponent: () =>
          import('./presentation/features/recetas/receta-editor.page').then((m) => m.RecetaEditorPage),
      },
      {
        path: 'recetas/:id',
        loadComponent: () =>
          import('./presentation/features/recetas/receta-detalle.page').then((m) => m.RecetaDetallePage),
      },
      {
        path: 'recetas/:id/editar',
        loadComponent: () =>
          import('./presentation/features/recetas/receta-editor.page').then((m) => m.RecetaEditorPage),
      },
      {
        path: 'recetas/:id/cocinar',
        loadComponent: () =>
          import('./presentation/features/recetas/modo-cocina.page').then((m) => m.ModoCocinaPage),
      },

      // Despensa (10A/10B) e ingredientes (16): los básicos los define cada hogar.
      {
        path: 'despensa',
        loadComponent: () =>
          import('./presentation/features/despensa/despensa.page').then((m) => m.DespensaPage),
      },
      {
        path: 'ingredientes',
        loadComponent: () =>
          import('./presentation/features/admin/ingredientes.page').then((m) => m.IngredientesPage),
      },

      // Flujo del día (05A → 05B → 05C)
      {
        path: 'dia',
        loadComponent: () =>
          import('./presentation/features/dia/seleccionar.page').then((m) => m.SeleccionarDiaPage),
      },
      {
        path: 'dia/opciones',
        loadComponent: () =>
          import('./presentation/features/dia/opciones.page').then((m) => m.OpcionesDiaPage),
      },
      {
        path: 'dia/resumen',
        loadComponent: () =>
          import('./presentation/features/dia/resumen.page').then((m) => m.ResumenDiaPage),
      },

      // Listas de compras (12A/12B)
      {
        path: 'listas',
        loadComponent: () =>
          import('./presentation/features/listas/listas.page').then((m) => m.ListasPage),
      },
      {
        path: 'listas/:id',
        loadComponent: () =>
          import('./presentation/features/listas/lista-detalle.page').then((m) => m.ListaDetallePage),
      },

      // Grupos (13)
      {
        path: 'grupos/nuevo',
        canActivate: [soloAdminGuard],
        loadComponent: () =>
          import('./presentation/features/grupos/grupo.page').then((m) => m.GrupoPage),
      },
      {
        path: 'grupos/:id',
        loadComponent: () =>
          import('./presentation/features/grupos/grupo.page').then((m) => m.GrupoPage),
      },

      // Ajustes (14) y administración (15, 17)
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./presentation/features/ajustes/ajustes.page').then((m) => m.AjustesPage),
      },
      {
        path: 'admin/catalogos',
        canActivate: [soloAdminGuard],
        loadComponent: () =>
          import('./presentation/features/admin/catalogos.page').then((m) => m.CatalogosPage),
      },
      {
        path: 'admin/cuentas',
        canActivate: [soloAdminGuard],
        loadComponent: () =>
          import('./presentation/features/admin/cuentas.page').then((m) => m.CuentasPage),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
