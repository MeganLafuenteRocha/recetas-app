import { computed, inject, Injectable, signal } from '@angular/core';
import {
  MetasDiarias,
  Preferencias,
  PREFERENCIAS_POR_DEFECTO,
  validarMetas,
} from '../../domain/preferencias/preferencias.model';
import { PreferenciasRepository } from '../../domain/preferencias/preferencias.port';

@Injectable({ providedIn: 'root' })
export class PreferenciasStore {
  private readonly repo = inject(PreferenciasRepository);

  private readonly _preferencias = signal<Preferencias>(PREFERENCIAS_POR_DEFECTO);

  readonly metas = computed(() => this._preferencias().metas);

  cargar(preferencias: Preferencias): void {
    this._preferencias.set(preferencias);
  }

  /** Devuelve el error de validación, o null si se guardó. */
  async guardarMetas(metas: MetasDiarias): Promise<string | null> {
    const error = validarMetas(metas);
    if (error) return error;
    const nuevas = { ...this._preferencias(), metas };
    await this.repo.guardar(nuevas);
    this._preferencias.set(nuevas);
    return null;
  }
}
