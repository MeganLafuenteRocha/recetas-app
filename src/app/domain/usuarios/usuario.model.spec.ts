import { describe, expect, it } from 'vitest';
import { esAdmin, EstadoUsuario, puedeUsarLaApp, RolUsuario, Usuario } from './usuario.model';

const usuario = (rol: RolUsuario, estado: EstadoUsuario): Usuario => ({
  uid: 'u1',
  nombre: 'Prueba',
  email: 'prueba@ejemplo.com',
  foto: null,
  rol,
  estado,
  creadoEn: new Date(2026, 0, 1),
});

describe('permisos de usuario', () => {
  // Tabla completa rol × estado: solo una admin ACTIVA administra.
  it.each([
    ['admin', 'activo', true, true],
    ['admin', 'pendiente', false, false],
    ['admin', 'bloqueado', false, false],
    ['usuario', 'activo', false, true],
    ['usuario', 'pendiente', false, false],
    ['usuario', 'bloqueado', false, false],
  ] as const)('%s %s → admin: %s, usa la app: %s', (rol, estado, admin, usa) => {
    const u = usuario(rol, estado);
    expect(esAdmin(u)).toBe(admin);
    expect(puedeUsarLaApp(u)).toBe(usa);
  });
});
