import { computed, inject, Injectable, signal } from '@angular/core';
import { ListaCompra, listaCompletada } from '../../domain/listas/lista.model';
import { ListaRepository } from '../../domain/listas/lista.port';

const DEBOUNCE_MS = 700;

/**
 * Listas de compras. NO van en la carga inicial: se leen la primera vez que se abre la sección.
 * Marcar ítems es instantáneo en pantalla; el write se agrupa por lista (debounce).
 */
@Injectable({ providedIn: 'root' })
export class ListasStore {
  private readonly repo = inject(ListaRepository);

  private readonly _listas = signal<ListaCompra[] | null>(null);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly cargadas = computed(() => this._listas() !== null);

  /** Pendientes por fecha de compra (la más próxima primero). */
  readonly proximas = computed(() =>
    (this._listas() ?? [])
      .filter((l) => !listaCompletada(l))
      .sort((a, b) => a.fechaCompra.localeCompare(b.fechaCompra)),
  );

  readonly compradas = computed(() =>
    (this._listas() ?? [])
      .filter((l) => listaCompletada(l))
      .sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra)),
  );

  async cargar(): Promise<void> {
    if (this._listas() !== null) return;
    this._listas.set(await this.repo.obtenerTodas());
  }

  obtener(id: string): ListaCompra | undefined {
    return this._listas()?.find((l) => l.id === id);
  }

  /** Guarda ya (crear una lista nueva). */
  async crear(lista: ListaCompra): Promise<void> {
    const conFecha = { ...lista, creadaEn: lista.creadaEn ?? new Date() };
    this.ponerEnMemoria(conFecha);
    await this.repo.guardar(conFecha);
  }

  /** Edición: pantalla al instante, Firestore con debounce. */
  actualizar(lista: ListaCompra): void {
    this.ponerEnMemoria(lista);
    const previo = this.timers.get(lista.id);
    if (previo) clearTimeout(previo);
    this.timers.set(
      lista.id,
      setTimeout(() => {
        this.timers.delete(lista.id);
        const actual = this.obtener(lista.id);
        if (actual) void this.repo.guardar(actual);
      }, DEBOUNCE_MS),
    );
  }

  async eliminar(id: string): Promise<void> {
    const previo = this.timers.get(id);
    if (previo) clearTimeout(previo);
    this._listas.set((this._listas() ?? []).filter((l) => l.id !== id));
    await this.repo.eliminar(id);
  }

  private ponerEnMemoria(lista: ListaCompra): void {
    const resto = (this._listas() ?? []).filter((l) => l.id !== lista.id);
    this._listas.set([...resto, lista]);
  }
}
