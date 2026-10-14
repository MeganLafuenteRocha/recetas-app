import { inject, Injectable } from '@angular/core';
import {
  agregarElemento,
  eliminarElemento,
  renombrarElemento,
  TipoCatalogo,
  UsoCatalogo,
  usosDeCodigo,
} from '../../domain/catalogos/catalogo.model';
import { CatalogoRepository } from '../../domain/catalogos/catalogo.port';
import { CatalogoStore } from '../stores/catalogo.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { RecetasStore } from '../stores/recetas.store';

/**
 * CRUD de catálogos (solo admin). Todo se verifica en memoria; cada cambio = 1 escritura.
 * Regla: el código interno nunca se edita y solo se elimina lo que nadie usa.
 */
@Injectable({ providedIn: 'root' })
export class AdministrarCatalogosUseCase {
  private readonly repo = inject(CatalogoRepository);
  private readonly store = inject(CatalogoStore);
  private readonly recetas = inject(RecetasStore);
  private readonly ingredientes = inject(IngredientesStore);

  usos(tipo: TipoCatalogo, codigo: string): UsoCatalogo {
    // Incluye recetas e ingredientes archivados: también son referencias reales.
    return usosDeCodigo(tipo, codigo, [...this.recetas.porId().values()], [...this.ingredientes.porId().values()]);
  }

  /** Devuelve un error legible, o null si se guardó. */
  async agregar(tipo: TipoCatalogo, nombre: string): Promise<string | null> {
    const nuevos = agregarElemento(this.store.catalogos(), tipo, nombre);
    if (!nuevos) return 'Ese nombre está vacío o ya existe.';
    await this.repo.guardarCatalogos(nuevos);
    this.store.actualizar(nuevos);
    return null;
  }

  async renombrar(tipo: TipoCatalogo, codigo: string, nombre: string): Promise<string | null> {
    if (!nombre.trim()) return 'El nombre no puede quedar vacío.';
    const nuevos = renombrarElemento(this.store.catalogos(), tipo, codigo, nombre);
    await this.repo.guardarCatalogos(nuevos);
    this.store.actualizar(nuevos);
    return null;
  }

  async eliminar(tipo: TipoCatalogo, codigo: string): Promise<string | null> {
    const uso = this.usos(tipo, codigo);
    if (uso.total > 0) return `No se puede eliminar: lo usan ${uso.total}.`;
    const nuevos = eliminarElemento(this.store.catalogos(), tipo, codigo);
    await this.repo.guardarCatalogos(nuevos);
    this.store.actualizar(nuevos);
    return null;
  }
}
