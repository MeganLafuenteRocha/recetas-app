import { inject, Injectable } from '@angular/core';
import {
  combinarItems,
  ingredientesComprados,
  ItemLista,
  itemsDesdeRecetas,
  ListaCompra,
  listaVacia,
  OrigenLista,
} from '../../domain/listas/lista.model';
import { desdeISO, semanaDe } from '../../domain/planificacion/plan.model';
import { Receta } from '../../domain/recetas/receta.model';
import { DespensaStore } from '../stores/despensa.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { ListasStore } from '../stores/listas.store';
import { PlanStore } from '../stores/plan.store';
import { RecetasStore } from '../stores/recetas.store';

const nuevoId = () => crypto.randomUUID();

/** Las tres formas de crear una lista (de cero, del plan, de un día) y pasar lo comprado a la despensa. */
@Injectable({ providedIn: 'root' })
export class ListasComprasUseCase {
  private readonly listas = inject(ListasStore);
  private readonly planes = inject(PlanStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);

  async crearManual(nombre: string, fechaCompra: string): Promise<ListaCompra> {
    return this.crear(listaVacia(nuevoId(), nombre, fechaCompra, 'manual'));
  }

  /** Faltantes de un día planificado. */
  async crearDesdeDia(fecha: string, fechaCompra: string): Promise<ListaCompra> {
    await this.planes.cargarSemana(desdeISO(fecha));
    const recetas = this.recetasDe([fecha]);
    const nombre = `Para el ${desdeISO(fecha).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric' })}`;
    return this.crearCon(nombre, fechaCompra, 'dia', recetas);
  }

  /** Faltantes de toda la semana que contiene la fecha. */
  async crearDesdeSemana(referencia: string, fechaCompra: string): Promise<ListaCompra> {
    await this.planes.cargarSemana(desdeISO(referencia));
    const dias = semanaDe(desdeISO(referencia));
    const recetas = this.recetasDe(dias);
    const inicio = desdeISO(dias[0]!).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
    return this.crearCon(`Semana del ${inicio}`, fechaCompra, 'plan', recetas);
  }

  /** Agrega los faltantes de recetas sueltas a una lista existente (ej. desde "Tu menú de hoy"). */
  agregarRecetas(lista: ListaCompra, recetas: readonly Receta[]): void {
    this.listas.actualizar(combinarItems(lista, this.faltantes(recetas)));
  }

  /** "Compra 1 y cocina N más": suma el ingrediente a la próxima lista, o crea una para hoy. */
  async agregarALaProxima(ingredienteId: string, motivo: string | null, hoy: string): Promise<ListaCompra> {
    await this.listas.cargar();
    const item: ItemLista = {
      id: nuevoId(),
      ingredienteId,
      textoLibre: null,
      cantidad: null,
      unidad: null,
      comprado: false,
      motivo,
    };
    const proxima = this.listas.proximas()[0];
    if (proxima) {
      const actualizada = combinarItems(proxima, [item]);
      this.listas.actualizar(actualizada);
      return actualizada;
    }
    return this.crear({ ...listaVacia(nuevoId(), 'Compras', hoy, 'manual'), items: [item] });
  }

  itemLibre(texto: string): ItemLista {
    const coincidencia = this.ingredientes.buscar(texto).find(
      (i) => i.nombre.toLowerCase() === texto.trim().toLowerCase(),
    );
    return {
      id: nuevoId(),
      ingredienteId: coincidencia?.id ?? null,
      textoLibre: coincidencia ? null : texto.trim(),
      cantidad: null,
      unidad: null,
      comprado: false,
      motivo: null,
    };
  }

  /** Lo comprado (del catálogo) pasa a la despensa. */
  pasarADespensa(lista: ListaCompra): number {
    const ids = ingredientesComprados(lista);
    this.despensa.agregarVarios(ids);
    return ids.length;
  }

  private async crearCon(nombre: string, fechaCompra: string, origen: OrigenLista, recetas: Receta[]): Promise<ListaCompra> {
    const lista = { ...listaVacia(nuevoId(), nombre, fechaCompra, origen), items: this.faltantes(recetas) };
    return this.crear(lista);
  }

  private async crear(lista: ListaCompra): Promise<ListaCompra> {
    await this.listas.cargar();
    await this.listas.crear(lista);
    return lista;
  }

  private faltantes(recetas: readonly Receta[]): ItemLista[] {
    return itemsDesdeRecetas(recetas, this.despensa.ids(), this.ingredientes.basicos(), nuevoId);
  }

  private recetasDe(fechas: readonly string[]): Receta[] {
    return fechas
      .flatMap((f) => this.planes.planDe(f)?.elecciones ?? [])
      .map((e) => this.recetas.obtener(e.recetaId))
      .filter((r): r is Receta => !!r);
  }
}
