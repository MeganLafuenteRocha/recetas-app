import { Injectable, signal } from '@angular/core';

/** Estado de interfaz compartido (menú lateral). */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly _menuLateralAbierto = signal(false);

  readonly menuLateralAbierto = this._menuLateralAbierto.asReadonly();

  abrirMenuLateral(): void {
    this._menuLateralAbierto.set(true);
  }

  cerrarMenuLateral(): void {
    this._menuLateralAbierto.set(false);
  }
}
