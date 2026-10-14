import { Injectable, signal } from '@angular/core';

export type VistaRecetas = 'lista' | 'franjas';
export type VistaDespensa = 'lista' | 'chips';

/** Recuerda el modo de vista elegido en ESTE dispositivo (comodidad, no dato del hogar). */
function leer<T extends string>(clave: string, porDefecto: T, validos: readonly T[]): T {
  try {
    const v = localStorage.getItem(clave) as T | null;
    return v && validos.includes(v) ? v : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* navegación privada: se olvida al cerrar, no pasa nada */
  }
}

/** Estado de interfaz compartido: menú lateral, hoja de ingrediente y modos de vista. */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly _menuLateralAbierto = signal(false);
  private readonly _fichaIngrediente = signal<{ id: string; recetaId: string | null } | null>(null);
  private readonly _vistaRecetas = signal<VistaRecetas>(leer('vista-recetas', 'lista', ['lista', 'franjas']));
  private readonly _vistaDespensa = signal<VistaDespensa>(leer('vista-despensa', 'lista', ['lista', 'chips']));

  readonly menuLateralAbierto = this._menuLateralAbierto.asReadonly();
  readonly fichaIngrediente = this._fichaIngrediente.asReadonly();
  readonly vistaRecetas = this._vistaRecetas.asReadonly();
  readonly vistaDespensa = this._vistaDespensa.asReadonly();

  abrirMenuLateral(): void {
    this._menuLateralAbierto.set(true);
  }

  cerrarMenuLateral(): void {
    this._menuLateralAbierto.set(false);
  }

  /** Hoja inferior con la ficha del ingrediente (en escritorio también se usa al hacer clic). */
  abrirFicha(id: string, recetaId: string | null = null): void {
    this._fichaIngrediente.set({ id, recetaId });
  }

  cerrarFicha(): void {
    this._fichaIngrediente.set(null);
  }

  cambiarVistaRecetas(vista: VistaRecetas): void {
    this._vistaRecetas.set(vista);
    escribir('vista-recetas', vista);
  }

  cambiarVistaDespensa(vista: VistaDespensa): void {
    this._vistaDespensa.set(vista);
    escribir('vista-despensa', vista);
  }
}
