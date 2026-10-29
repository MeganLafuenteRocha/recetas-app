import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';
import { ItemLista, ListaCompra, listaVacia } from '../../domain/listas/lista.model';
import { ListaRepository } from '../../domain/listas/lista.port';
import { PlanRepository } from '../../domain/planificacion/plan.port';
import { espacio, recetaDePrueba } from '../../domain/recetas/receta.fixtures';
import { DespensaStore } from '../stores/despensa.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { ListasStore } from '../stores/listas.store';
import { ListasComprasUseCase } from './listas-compras.usecase';

class ListasFalsas extends ListaRepository {
  constructor(private readonly iniciales: ListaCompra[] = []) {
    super();
  }
  guardadas: ListaCompra[] = [];
  async obtenerTodas() {
    return this.iniciales;
  }
  async guardar(l: ListaCompra) {
    this.guardadas.push(l);
  }
  async eliminar() {}
}

class DespensaFalsa extends DespensaRepository {
  async obtener() {
    return { ingredienteIds: [], actualizadaEn: null };
  }
  async guardar() {}
}

const ingrediente = (id: string, nombre: string, esBasico = false): Ingrediente => ({
  id,
  ambito: 'comun',
  nombre,
  nombreNormalizado: nombre.toLowerCase(),
  sinonimos: [],
  categoria: 'verduras',
  esBasico,
  activo: true,
});

const item = (id: string, ingredienteId: string | null, comprado = false): ItemLista => ({
  id,
  ingredienteId,
  textoLibre: ingredienteId ? null : id,
  cantidad: null,
  unidad: null,
  comprado,
  motivo: null,
});

function configurar(listasIniciales: ListaCompra[] = []) {
  const repo = new ListasFalsas(listasIniciales);
  TestBed.configureTestingModule({
    providers: [
      { provide: ListaRepository, useValue: repo },
      { provide: DespensaRepository, useValue: new DespensaFalsa() },
      { provide: PlanRepository, useValue: {} },
    ],
  });
  TestBed.inject(IngredientesStore).cargar([ingrediente('ing_papa', 'Papa'), ingrediente('ing_sal', 'Sal', true)]);
  return { repo, casoDeUso: TestBed.inject(ListasComprasUseCase) };
}

describe('ListasComprasUseCase', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('crearManual guarda una lista vacía con nombre por defecto si viene en blanco', async () => {
    const { repo, casoDeUso } = configurar();
    const l = await casoDeUso.crearManual('   ', '2026-08-29');
    expect(l).toMatchObject({ nombre: 'Mi lista', origen: 'manual', items: [] });
    expect(repo.guardadas).toHaveLength(1);
  });

  describe('itemLibre', () => {
    it('si el texto es un ingrediente del catálogo, lo enlaza (sin importar mayúsculas)', () => {
      const { casoDeUso } = configurar();
      expect(casoDeUso.itemLibre('  PAPA ')).toMatchObject({ ingredienteId: 'ing_papa', textoLibre: null });
    });

    it('si no existe, queda como texto libre', () => {
      const { casoDeUso } = configurar();
      expect(casoDeUso.itemLibre(' Detergente ')).toMatchObject({ ingredienteId: null, textoLibre: 'Detergente' });
    });

    it('una coincidencia parcial NO se enlaza ("Pap" no es "Papa")', () => {
      const { casoDeUso } = configurar();
      expect(casoDeUso.itemLibre('Pap').ingredienteId).toBeNull();
    });
  });

  describe('agregarALaProxima', () => {
    it('sin listas pendientes crea una nueva para hoy', async () => {
      const { repo, casoDeUso } = configurar();
      const l = await casoDeUso.agregarALaProxima('ing_papa', 'Para el chairo', '2026-08-24');
      expect(l).toMatchObject({ nombre: 'Compras', fechaCompra: '2026-08-24' });
      expect(l.items.map((i) => i.ingredienteId)).toEqual(['ing_papa']);
      expect(repo.guardadas).toHaveLength(1);
    });

    it('con listas pendientes usa la de fecha más próxima y no duplica', async () => {
      const lejana = { ...listaVacia('l2', 'Lejana', '2026-09-10'), items: [item('x', 'ing_cebolla')] };
      const proxima = { ...listaVacia('l1', 'Próxima', '2026-08-29'), items: [item('a', 'ing_papa')] };
      const { casoDeUso } = configurar([lejana, proxima]);
      const l = await casoDeUso.agregarALaProxima('ing_papa', null, '2026-08-24');
      expect(l.id).toBe('l1');
      expect(l.items).toHaveLength(1);
    });

    it('ignora las listas ya completadas', async () => {
      const completa = { ...listaVacia('l1', 'Hecha', '2026-08-20'), items: [item('a', 'ing_cebolla', true)] };
      const { casoDeUso } = configurar([completa]);
      const l = await casoDeUso.agregarALaProxima('ing_papa', null, '2026-08-24');
      expect(l.id).not.toBe('l1');
    });
  });

  it('agregarRecetas suma faltantes sin incluir básicos', async () => {
    const { casoDeUso } = configurar();
    const lista = await casoDeUso.crearManual('Sábado', '2026-08-29');
    const chairo = recetaDePrueba({ ingredientes: [espacio('esencial', 'ing_papa'), espacio('condimento', 'ing_sal')] });
    casoDeUso.agregarRecetas(lista, [chairo]);
    const actual = TestBed.inject(ListasStore).obtener(lista.id);
    expect(actual?.items.map((i) => i.ingredienteId)).toEqual(['ing_papa']);
  });

  it('pasarADespensa mueve solo lo comprado del catálogo y devuelve cuántos', () => {
    const { casoDeUso } = configurar();
    const l = { ...listaVacia('l1', 'x', '2026-08-29'), items: [item('a', 'ing_papa', true), item('b', 'ing_cebolla'), item('Pan', null, true)] };
    expect(casoDeUso.pasarADespensa(l)).toBe(1);
    expect([...TestBed.inject(DespensaStore).ids()]).toEqual(['ing_papa']);
  });

  it('pasarADespensa con nada comprado devuelve 0', () => {
    const { casoDeUso } = configurar();
    expect(casoDeUso.pasarADespensa(listaVacia('l1', 'x', '2026-08-29'))).toBe(0);
  });
});
