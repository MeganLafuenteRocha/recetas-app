import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionStore } from '../../application/stores/sesion.store';

/** Rutas de la app: exigen cuenta activada. */
export const soloActivosGuard: CanActivateFn = () => {
  const sesion = inject(SesionStore);
  const router = inject(Router);
  if (sesion.fase() === 'anonimo') return router.parseUrl('/login');
  if (!sesion.activo()) return router.parseUrl('/pendiente');
  return true;
};

/** Pantalla de login: si ya hay sesión, salta directo. */
export const soloAnonimosGuard: CanActivateFn = () => {
  const sesion = inject(SesionStore);
  const router = inject(Router);
  if (sesion.fase() !== 'con-sesion') return true;
  return router.parseUrl(sesion.activo() ? '/inicio' : '/pendiente');
};

/** Rutas de administración: exigen rol admin activo. */
export const soloAdminGuard: CanActivateFn = () => {
  const sesion = inject(SesionStore);
  const router = inject(Router);
  if (!sesion.esAdmin()) return router.parseUrl('/inicio');
  return true;
};

/** Pantalla de cuenta pendiente: solo para cuentas con sesión sin activar. */
export const soloPendientesGuard: CanActivateFn = () => {
  const sesion = inject(SesionStore);
  const router = inject(Router);
  if (sesion.fase() === 'anonimo') return router.parseUrl('/login');
  if (sesion.activo()) return router.parseUrl('/inicio');
  return true;
};
