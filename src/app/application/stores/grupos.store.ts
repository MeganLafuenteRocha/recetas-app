import { computed, inject, Injectable, signal } from '@angular/core';
import { Grupo } from '../../domain/grupos/grupo.model';
import { GrupoRepository } from '../../domain/grupos/grupo.port';

/** Grupos de recetas del menú lateral. Llegan con la carga inicial (son pocos documentos). */
@Injectable({ providedIn: 'root' })
export class GruposStore {
  private readonly repo = inject(GrupoRepository);

  private readonly _grupos = signal<Grupo[]>([]);

  readonly todos = computed(() =>
    [...this._grupos()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );

  cargar(grupos: Grupo[]): void {
    this._grupos.set(grupos);
  }

  obtener(id: string): Grupo | undefined {
    return this._grupos().find((g) => g.id === id);
  }

  async guardar(grupo: Grupo): Promise<void> {
    await this.repo.guardar(grupo);
    this._grupos.set([...this._grupos().filter((g) => g.id !== grupo.id), grupo]);
  }

  async eliminar(id: string): Promise<void> {
    await this.repo.eliminar(id);
    this._grupos.set(this._grupos().filter((g) => g.id !== id));
  }
}
