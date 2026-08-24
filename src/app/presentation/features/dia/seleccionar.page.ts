import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { SeleccionDiaStore } from '../../../application/stores/seleccion-dia.store';
import { coincideIngrediente } from '../../../domain/ingredientes/ingrediente.model';

const ICONO_CATEGORIA: Record<string, string> = {
  verduras: 'eco',
  frutas: 'nutrition',
  legumbres: 'grain',
  carnes: 'kebab_dining',
  lacteos: 'egg',
  cereales: 'bakery_dining',
  condimentos: 'restaurant',
  abarrotes: 'shopping_bag',
};

const VISIBLES_POR_CATEGORIA = 4;

/** Pantalla 05A: selección de ingredientes disponibles hoy (lista estilo Airbnb). */
@Component({
  selector: 'app-seleccionar-dia',
  imports: [RouterLink],
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

  protected readonly grupos = computed(() => {
    const q = this.consulta().trim();
    const buscando = q.length > 0;
    const lista = buscando
      ? this.ingredientes.todos().filter((i) => coincideIngrediente(i, q))
      : this.ingredientes.todos();

    return this.catalogos
      .categorias()
      .map((categoria) => {
        const deLaCategoria = lista.filter((i) => i.categoria === categoria.codigo);
        const expandido = this.mostrarTodos() || buscando;
        return {
          nombre: categoria.nombre,
          icono: ICONO_CATEGORIA[categoria.codigo] ?? 'restaurant',
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
