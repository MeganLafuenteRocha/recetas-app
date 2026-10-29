import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Catalogos } from '../../domain/catalogos/catalogo.model';
import { CatalogoRepository } from '../../domain/catalogos/catalogo.port';
import { espacio, recetaDePrueba } from '../../domain/recetas/receta.fixtures';
import { CatalogoStore } from '../stores/catalogo.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { RecetasStore } from '../stores/recetas.store';
import { AdministrarCatalogosUseCase } from './administrar-catalogos.usecase';

/** Puerto falso: cuenta escrituras para comprobar que lo inválido nunca llega a Firestore. */
class RepoFalso extends CatalogoRepository {
  guardados: Catalogos[] = [];
  async obtenerCatalogos(): Promise<Catalogos> {
    throw new Error('no se usa');
  }
  async obtenerReferencias(): Promise<never> {
    throw new Error('no se usa');
  }
  async guardarCatalogos(c: Catalogos) {
    this.guardados.push(c);
  }
}

const catalogos: Catalogos = {
  unidades: [{ codigo: 'u', nombre: 'unidad', sinonimos: [] }],
  tiposComida: [{ codigo: 'sopa', nombre: 'Sopa', orden: 1 }],
  tiposCocina: [
    { codigo: 'boliviana', nombre: 'Boliviana' },
    { codigo: 'peruana', nombre: 'Peruana' },
  ],
  categorias: [],
};

describe('AdministrarCatalogosUseCase', () => {
  let repo: RepoFalso;
  let casoDeUso: AdministrarCatalogosUseCase;
  let store: CatalogoStore;

  beforeEach(() => {
    repo = new RepoFalso();
    TestBed.configureTestingModule({ providers: [{ provide: CatalogoRepository, useValue: repo }] });
    store = TestBed.inject(CatalogoStore);
    store.actualizar(catalogos);
    // Una receta ARCHIVADA también cuenta como uso: no debe quedar con un código huérfano.
    TestBed.inject(RecetasStore).cargar([
      recetaDePrueba({ nombre: 'Chairo', activo: false, tipoCocina: 'boliviana', ingredientes: [espacio('esencial', 'a')] }),
    ]);
    TestBed.inject(IngredientesStore).cargar([]);
    casoDeUso = TestBed.inject(AdministrarCatalogosUseCase);
  });

  it('agrega, guarda una sola vez y actualiza la memoria', async () => {
    expect(await casoDeUso.agregar('tiposCocina', 'Mexicana')).toBeNull();
    expect(repo.guardados).toHaveLength(1);
    expect(store.tiposCocina().map((c) => c.codigo)).toContain('mexicana');
  });

  it.each(['', '   ', 'Boliviana', 'BOLIVIANA'])('no agrega "%s" (vacío o repetido) y no escribe', async (nombre) => {
    expect(await casoDeUso.agregar('tiposCocina', nombre)).toBe('Ese nombre está vacío o ya existe.');
    expect(repo.guardados).toHaveLength(0);
  });

  it.each(['', '   '])('no permite renombrar a "%s"', async (nombre) => {
    expect(await casoDeUso.renombrar('tiposCocina', 'peruana', nombre)).toBe('El nombre no puede quedar vacío.');
    expect(repo.guardados).toHaveLength(0);
  });

  it('renombra sin cambiar el código', async () => {
    await casoDeUso.renombrar('tiposCocina', 'peruana', 'Cocina peruana');
    expect(store.tiposCocina().find((c) => c.codigo === 'peruana')?.nombre).toBe('Cocina peruana');
  });

  it('bloquea eliminar algo en uso (aunque la receta esté archivada)', async () => {
    expect(await casoDeUso.eliminar('tiposCocina', 'boliviana')).toBe('No se puede eliminar: lo usan 1.');
    expect(repo.guardados).toHaveLength(0);
    expect(store.tiposCocina()).toHaveLength(2);
  });

  it('elimina lo que nadie usa', async () => {
    expect(await casoDeUso.eliminar('tiposCocina', 'peruana')).toBeNull();
    expect(store.tiposCocina().map((c) => c.codigo)).toEqual(['boliviana']);
    expect(repo.guardados).toHaveLength(1);
  });
});
