import { Injectable, signal } from '@angular/core';
import { Ambito, ambitoAlGuardar } from '../../domain/hogares/hogar.model';

/**
 * El hogar de la cuenta que inició sesión (y si es la admin). Lo fija SesionStore;
 * los adaptadores lo leen para armar las rutas hogares/{id}/… y los casos de uso para
 * decidir el ámbito al guardar. Store aparte para no crear un ciclo de inyección.
 */
@Injectable({ providedIn: 'root' })
export class HogarActualStore {
  private readonly _id = signal<string | null>(null);
  private readonly _nombre = signal<string | null>(null);
  private readonly _esAdmin = signal(false);

  readonly id = this._id.asReadonly();
  /** «Hogar de Andrea»: llega un instante después que el id (1 lectura al iniciar sesión). */
  readonly nombre = this._nombre.asReadonly();

  fijar(id: string | null, esAdmin: boolean): void {
    if (id !== this._id()) this._nombre.set(null);
    this._id.set(id);
    this._esAdmin.set(esAdmin);
  }

  fijarNombre(nombre: string | null): void {
    this._nombre.set(nombre);
  }

  /** Para los adaptadores: sin hogar no se lee ni se escribe nada del hogar. */
  requerido(): string {
    const id = this._id();
    if (!id) throw new Error('La cuenta no tiene un hogar asignado.');
    return id;
  }

  /** Lo común solo lo edita la admin; las demás cuentas guardan una copia propia. */
  ambitoAlGuardar(): Ambito {
    return ambitoAlGuardar(this._esAdmin());
  }
}
