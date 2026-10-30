import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { AdministrarIngredientesUseCase, CambioLote } from '../../../application/use-cases/administrar-ingredientes.usecase';
import { coincideIngrediente, Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { emojiIngrediente } from '../../ui/emojis';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';
import { HojaComponent } from '../../ui/hoja.component';
import { InterruptorComponent } from '../../ui/interruptor.component';

type Hoja = { tipo: 'alta' } | { tipo: 'editar'; ingrediente: Ingrediente } | { tipo: 'categoria' };

/** Pantalla 16: ingredientes con alta rápida, edición, cambios en lote y archivo (nunca se eliminan). */
@Component({
  selector: 'app-ingredientes',
  imports: [HojaComponent, InterruptorComponent, EncabezadoComponent, FilaIngredienteComponent, AvisoComponent],
  templateUrl: './ingredientes.page.html',
  styleUrl: './ingredientes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientesPage {
  protected readonly catalogos = inject(CatalogoStore);
  private readonly store = inject(IngredientesStore);
  private readonly admin = inject(AdministrarIngredientesUseCase);

  /** ?basicos=1 desde Ajustes: abre filtrado por los básicos del hogar. */
  readonly basicos = input<string>();

  protected readonly consulta = signal('');
  protected readonly soloBasicos = linkedSignal(() => this.basicos() === '1');
  protected readonly verArchivados = signal(false);
  protected readonly seleccion = signal<ReadonlySet<string>>(new Set());
  protected readonly hoja = signal<Hoja | null>(null);
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal<string | null>(null);

  // Formularios de las hojas
  protected readonly textoAlta = signal('');
  protected readonly categoriaAlta = linkedSignal(() => this.catalogos.categorias()[0]?.codigo ?? '');
  protected readonly nombreEdicion = signal('');
  protected readonly sinonimosEdicion = signal('');

  protected readonly lista = computed(() => {
    const q = this.consulta().trim();
    const base = this.verArchivados() ? this.store.archivados() : this.store.todos();
    return base.filter((i) => (!q || coincideIngrediente(i, q)) && (!this.soloBasicos() || i.esBasico));
  });

  protected readonly totalActivos = this.store.total;
  protected readonly enSeleccion = computed(() => this.seleccion().size > 0);
  /** Si todos los seleccionados ya son básicos, el botón los quita; si no, los marca. */
  protected readonly seleccionTodosBasicos = computed(() =>
    [...this.seleccion()].every((id) => this.store.obtener(id)?.esBasico),
  );

  protected emojiDe(i: Ingrediente): string {
    return emojiIngrediente(i);
  }


  protected alternarSeleccion(id: string): void {
    const nueva = new Set(this.seleccion());
    if (nueva.has(id)) nueva.delete(id);
    else nueva.add(id);
    this.seleccion.set(nueva);
  }

  protected limpiarSeleccion(): void {
    this.seleccion.set(new Set());
  }

  protected cambiarArchivados(valor: boolean): void {
    this.verArchivados.set(valor);
    this.limpiarSeleccion();
  }

  protected async enLote(cambio: CambioLote, texto: string): Promise<void> {
    const ids = [...this.seleccion()];
    this.guardando.set(true);
    try {
      await this.admin.aplicarEnLote(ids, cambio);
      this.mensaje.set(`${ids.length} ${texto}.`);
      this.limpiarSeleccion();
      this.hoja.set(null);
    } finally {
      this.guardando.set(false);
    }
  }

  protected abrirEdicion(i: Ingrediente): void {
    this.nombreEdicion.set(i.nombre);
    this.sinonimosEdicion.set(i.sinonimos.join(', '));
    this.hoja.set({ tipo: 'editar', ingrediente: i });
  }

  protected async guardarEdicion(i: Ingrediente): Promise<void> {
    if (!this.nombreEdicion().trim()) return;
    this.guardando.set(true);
    try {
      await this.admin.editar(i, this.nombreEdicion(), this.sinonimosEdicion().split(','));
      this.hoja.set(null);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Cambios de un solo ingrediente desde su hoja (categoría, básico, archivar). */
  protected async cambiarUno(i: Ingrediente, cambio: CambioLote): Promise<void> {
    await this.admin.aplicarEnLote([i.id], cambio);
    const actualizado = this.store.obtener(i.id);
    if (cambio.activo !== undefined || !actualizado) this.hoja.set(null);
    else this.hoja.set({ tipo: 'editar', ingrediente: actualizado });
  }

  protected async altaRapida(): Promise<void> {
    this.guardando.set(true);
    try {
      const n = await this.admin.altaRapida(this.textoAlta(), this.categoriaAlta());
      this.mensaje.set(n > 0 ? `${n} ingrediente${n === 1 ? '' : 's'} nuevo${n === 1 ? '' : 's'}.` : 'Ya existían todos.');
      this.textoAlta.set('');
      this.hoja.set(null);
    } finally {
      this.guardando.set(false);
    }
  }
}
