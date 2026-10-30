import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { SeleccionDiaStore } from '../../../application/stores/seleccion-dia.store';
import { coincideIngrediente, Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { emojiIngrediente } from '../../ui/emojis';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';

const VISIBLES_POR_CATEGORIA = 4;

/** Pantalla 05A: «¿Qué tienes hoy?», selección de ingredientes disponibles por categoría. */
@Component({
  selector: 'app-seleccionar-dia',
  imports: [RouterLink, EncabezadoComponent, FilaIngredienteComponent],
  templateUrl: './seleccionar.page.html',
  styleUrl: './seleccionar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeleccionarDiaPage {
  protected readonly seleccion = inject(SeleccionDiaStore);
  protected readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly catalogos = inject(CatalogoStore);

  protected readonly consulta = signal('');
  protected readonly mostrarTodos = signal(false);

  protected readonly totalIngredientes = this.ingredientes.total;
  protected readonly emoji = emojiIngrediente;

  /** Chips de lo elegido (se quitan con ×). */
  protected readonly elegidos = computed(() =>
    [...this.seleccion.seleccionados()].map((id) => ({ id, nombre: this.ingredientes.nombre(id) })),
  );

  protected readonly grupos = computed(() => {
    const q = this.consulta().trim();
    const buscando = q.length > 0;
    const lista = buscando
      ? this.ingredientes.todos().filter((i) => coincideIngrediente(i, q))
      : this.ingredientes.todos();
    const seleccionados = this.seleccion.seleccionados();

    return this.catalogos
      .categorias()
      .map((categoria) => {
        const deLaCategoria: Ingrediente[] = lista.filter((i) => i.categoria === categoria.codigo);
        const expandido = this.mostrarTodos() || buscando;
        return {
          nombre: categoria.nombre,
          total: deLaCategoria.length,
          marcados: deLaCategoria.filter((i) => seleccionados.has(i.id)).length,
          visibles: expandido
            ? deLaCategoria
            : deLaCategoria.slice(0, VISIBLES_POR_CATEGORIA),
          ocultos: expandido
            ? 0
            : Math.max(0, deLaCategoria.length - VISIBLES_POR_CATEGORIA),
        };
      })
      .filter((g) => g.visibles.length > 0);
  });

  protected buscar(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }
}
