import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { evaluarReceta, mejorCompra, sePuedeCocinar } from '../../../domain/planificacion/afinidad.service';
import { fechaISO } from '../../../domain/planificacion/plan.model';
import { coincideIngrediente, Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { emojiCategoria, emojiIngrediente } from '../../ui/emojis';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';

/** Pantallas 10A (lista por categorías) y 10B (chips). Cada toque se guarda solo (debounce). */
@Component({
  selector: 'app-despensa',
  imports: [RouterLink, EncabezadoComponent, FilaIngredienteComponent, AvisoComponent],
  templateUrl: './despensa.page.html',
  styleUrl: './despensa.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespensaPage {
  protected readonly ui = inject(UiStore);
  protected readonly despensa = inject(DespensaStore);
  protected readonly sesion = inject(SesionStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly catalogos = inject(CatalogoStore);
  private readonly recetas = inject(RecetasStore);
  private readonly listas = inject(ListasComprasUseCase);

  protected readonly consulta = signal('');
  protected readonly categoria = signal<string | null>(null);
  protected readonly plegadas = signal<ReadonlySet<string>>(new Set());
  protected readonly mensaje = signal<string | null>(null);
  /** El buscador se muestra al tocar la lupa (o mientras haya una consulta escrita). */
  protected readonly buscando = signal(false);

  protected readonly inicial = computed(() => this.sesion.usuario()?.nombre.charAt(0).toUpperCase() ?? '?');
  protected readonly total = this.ingredientes.total;
  protected readonly enCasa = computed(
    () => this.ingredientes.todos().filter((i) => this.despensa.ids().has(i.id)).length,
  );
  protected readonly porcentaje = computed(() => (this.total() ? (this.enCasa() / this.total()) * 100 : 0));

  protected readonly recetasListas = computed(() => {
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    return this.recetas.todas().filter((r) => sePuedeCocinar(evaluarReceta(r, disponibles, basicos))).length;
  });

  /** Tarjeta "Compra 1 y cocina N más" (10B). */
  protected readonly sugerencia = computed(() => {
    const s = mejorCompra(this.recetas.todas(), this.despensa.ids(), this.ingredientes.basicos());
    if (!s) return null;
    const nombres = s.recetaIds.map((id) => this.recetas.obtener(id)?.nombre ?? '');
    const resto = nombres.length - 2;
    return {
      ingredienteId: s.ingredienteId,
      nombre: this.ingredientes.nombre(s.ingredienteId),
      cantidad: s.recetaIds.length,
      detalle: nombres.slice(0, 2).join(', ') + (resto > 0 ? ` y ${resto} más` : ''),
      motivo: nombres.join(', '),
    };
  });

  protected readonly grupos = computed(() => {
    const q = this.consulta().trim();
    const ids = this.despensa.ids();
    return this.catalogos
      .categorias()
      .filter((c) => !this.categoria() || c.codigo === this.categoria())
      .map((c) => {
        const items = this.ingredientes
          .todos()
          .filter((i) => i.categoria === c.codigo && (!q || coincideIngrediente(i, q)));
        return {
          codigo: c.codigo,
          nombre: c.nombre,
          emoji: emojiCategoria(c.codigo),
          items,
          enCasa: items.filter((i) => ids.has(i.id)).length,
        };
      })
      .filter((g) => g.items.length > 0);
  });

  /** Chips de filtro: todas las categorías que tienen ingredientes (no dependen del filtro actual). */
  protected readonly categoriasChips = computed(() => {
    const usadas = new Set(this.ingredientes.todos().map((i) => i.categoria));
    return this.catalogos.categorias().filter((c) => usadas.has(c.codigo));
  });

  protected emojiDe(ingrediente: Ingrediente): string {
    return emojiIngrediente(ingrediente);
  }

  protected emojiDeCategoria(codigo: string): string {
    return emojiCategoria(codigo);
  }

  protected alternarBuscador(): void {
    const abrir = !this.buscando();
    this.buscando.set(abrir);
    if (!abrir) this.consulta.set('');
  }

  protected buscar(evento: Event): void {
    this.consulta.set((evento.target as HTMLInputElement).value);
  }

  protected plegar(codigo: string): void {
    const nuevo = new Set(this.plegadas());
    if (nuevo.has(codigo)) nuevo.delete(codigo);
    else nuevo.add(codigo);
    this.plegadas.set(nuevo);
  }

  protected abrirFicha(evento: Event, id: string): void {
    evento.stopPropagation();
    this.ui.abrirFicha(id);
  }

  protected async comprarSugerido(): Promise<void> {
    const s = this.sugerencia();
    if (!s) return;
    const lista = await this.listas.agregarALaProxima(s.ingredienteId, s.motivo, fechaISO(new Date()));
    this.mensaje.set(`${s.nombre} agregado a «${lista.nombre}».`);
  }
}
