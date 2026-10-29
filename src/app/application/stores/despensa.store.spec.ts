import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { DespensaStore } from './despensa.store';

/** Cuenta escrituras: la despensa agrupa los toques para no gastar writes de Firestore. */
class RepoFalso extends DespensaRepository {
  escrituras: string[][] = [];
  async obtener() {
    return { ingredienteIds: [], actualizadaEn: null };
  }
  async guardar(ids: string[]) {
    this.escrituras.push(ids);
  }
}

describe('DespensaStore (debounce de escrituras)', () => {
  let repo: RepoFalso;
  let store: DespensaStore;

  beforeEach(() => {
    vi.useFakeTimers();
    repo = new RepoFalso();
    TestBed.configureTestingModule({ providers: [{ provide: DespensaRepository, useValue: repo }] });
    store = TestBed.inject(DespensaStore);
  });

  afterEach(() => vi.useRealTimers());

  it('el cambio se ve al instante en memoria', () => {
    store.alternar('papa');
    expect(store.tiene('papa')).toBe(true);
    expect(store.total()).toBe(1);
  });

  it('muchos toques seguidos = UNA sola escritura con el estado final', () => {
    store.alternar('papa');
    store.alternar('cebolla');
    store.alternar('papa');
    expect(repo.escrituras).toHaveLength(0);
    vi.advanceTimersByTime(800);
    expect(repo.escrituras).toEqual([['cebolla']]);
  });

  it('límite del debounce: a los 799 ms todavía no escribe, a los 800 sí', () => {
    store.marcar('papa', true);
    vi.advanceTimersByTime(799);
    expect(repo.escrituras).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(repo.escrituras).toHaveLength(1);
  });

  it('cada toque reinicia la espera', () => {
    store.marcar('papa', true);
    vi.advanceTimersByTime(700);
    store.marcar('cebolla', true);
    vi.advanceTimersByTime(700);
    expect(repo.escrituras).toHaveLength(0);
    vi.advanceTimersByTime(100);
    expect(repo.escrituras).toHaveLength(1);
  });

  it('marcar lo que ya está (o quitar lo que no está) no duplica ni rompe', () => {
    store.marcar('papa', true);
    store.marcar('papa', true);
    store.marcar('cebolla', false);
    expect([...store.ids()]).toEqual(['papa']);
  });

  it('agregarVarios con lista vacía no programa ninguna escritura', () => {
    store.agregarVarios([]);
    vi.advanceTimersByTime(1000);
    expect(repo.escrituras).toHaveLength(0);
  });

  it('agregarVarios une sin repetir', () => {
    store.cargar(['papa']);
    store.agregarVarios(['papa', 'cebolla']);
    expect([...store.ids()].sort()).toEqual(['cebolla', 'papa']);
  });

  it('cargar (datos que vienen de Firestore) no escribe de vuelta', () => {
    store.cargar(['papa', 'sal']);
    vi.advanceTimersByTime(1000);
    expect(repo.escrituras).toHaveLength(0);
  });
});
