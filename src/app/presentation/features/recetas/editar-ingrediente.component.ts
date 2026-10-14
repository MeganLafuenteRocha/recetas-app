import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { EspacioIngrediente, ROLES, RolIngrediente } from '../../../domain/recetas/receta.model';
import { BuscadorIngredienteComponent } from '../../ui/buscador-ingrediente.component';
import { HojaComponent } from '../../ui/hoja.component';
import { NOMBRE_ROL } from '../../ui/iconos';

/** Unidades que se muestran primero; el resto aparece con "más". */
const UNIDADES_FRECUENTES = ['g', 'kg', 'taza', 'u', 'cda', 'cdta'];

/**
 * Pantalla 11B: todo lo de un ingrediente en una hoja, para que la lista del editor
 * quede corta. Las alternativas existen pero no estorban (van al final, opcionales).
 */
@Component({
  selector: 'app-editar-ingrediente',
  imports: [HojaComponent, BuscadorIngredienteComponent],
  template: `
    <app-hoja [titulo]="nombre()" (cerrar)="cerrar.emit()">
      <div class="fila-cantidad">
        <label class="campo cantidad">
          <span>Cantidad</span>
          <input
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            placeholder="—"
            [value]="principal().cantidad ?? ''"
            (input)="cambiarCantidad($any($event.target).value)"
          />
        </label>
        <div class="unidades">
          <span class="etiqueta-unidad">Unidad</span>
          <div class="chips envolver">
            <button type="button" class="chip" [class.activo]="principal().cantidad === null" (click)="alGusto()">al gusto</button>
            @for (u of unidadesVisibles(); track u.codigo) {
              <button type="button" class="chip" [class.activo]="principal().unidad === u.codigo && principal().cantidad !== null" (click)="cambiarUnidad(u.codigo)" [title]="u.nombre">
                {{ u.codigo }}
              </button>
            }
            @if (!todasUnidades()) {
              <button type="button" class="chip suave" (click)="todasUnidades.set(true)">más…</button>
            }
          </div>
        </div>
      </div>

      <p class="etiqueta-seccion">Rol</p>
      <div class="segmentado">
        @for (r of roles; track r) {
          <button type="button" [class]="'rol-' + r" [class.activo]="espacio().rol === r" (click)="cambiarRol(r)">
            <span class="punto-rol"></span> {{ nombreRol[r] }}
          </button>
        }
      </div>

      <label class="campo">
        <span>Nota (forma del ingrediente)</span>
        <input type="text" placeholder="ej. en filetes delgados" [value]="principal().nota ?? ''" (input)="cambiarNota($any($event.target).value)" />
      </label>

      <div class="alternativas">
        <p class="etiqueta-seccion"><span class="icono">swap_horiz</span> También sirve (opcional)</p>
        <div class="chips envolver">
          @for (o of espacio().opciones.slice(1); track o.ingredienteId; let i = $index) {
            <span class="chip suave">
              {{ ingredientes.nombre(o.ingredienteId) }}
              <button type="button" class="quitar" (click)="quitarAlternativa(i + 1)" aria-label="Quitar alternativa"><span class="icono">close</span></button>
            </span>
          }
        </div>
        <app-buscador-ingrediente placeholder="Agregar alternativa…" [excluir]="idsActuales()" (elegido)="agregarAlternativa($event)" />
      </div>

      <div class="pie">
        <button type="button" class="btn btn-peligro" (click)="quitar.emit()"><span class="icono">delete</span> Quitar</button>
        <button type="button" class="btn btn-primario crecer" (click)="cerrar.emit()">Listo</button>
      </div>
    </app-hoja>
  `,
  styles: `
    .fila-cantidad { display: flex; gap: 12px; align-items: flex-start; }
    .cantidad { width: 96px; flex-shrink: 0; }
    .cantidad input { font-size: 16px; font-weight: 600; text-align: center; }
    .unidades { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .etiqueta-unidad { font-size: 11px; font-weight: 500; color: var(--plomo-500); }
    .chip { padding: 7px 11px; }
    .segmentado button .punto-rol { width: 7px; height: 7px; }
    .alternativas { display: flex; flex-direction: column; gap: 8px; }
    .alternativas .etiqueta-seccion { display: flex; align-items: center; gap: 4px; text-transform: none; font-size: 12px; }
    .alternativas .etiqueta-seccion .icono { font-size: 16px; }
    .quitar { border: none; background: none; padding: 0; margin-left: 2px; display: grid; cursor: pointer; color: var(--plomo-500); }
    .quitar .icono { font-size: 15px; }
    .pie { display: flex; gap: 10px; align-items: center; }
    .crecer { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarIngredienteComponent {
  private readonly catalogos = inject(CatalogoStore);
  protected readonly ingredientes = inject(IngredientesStore);

  readonly espacio = input.required<EspacioIngrediente>();
  readonly cambio = output<EspacioIngrediente>();
  readonly quitar = output<void>();
  readonly cerrar = output<void>();

  protected readonly roles = ROLES;
  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly todasUnidades = signal(false);

  protected readonly principal = computed(() => this.espacio().opciones[0]!);
  protected readonly nombre = computed(() => this.ingredientes.nombre(this.principal().ingredienteId));
  protected readonly idsActuales = computed(() => new Set(this.espacio().opciones.map((o) => o.ingredienteId)));

  protected readonly unidadesVisibles = computed(() => {
    const todas = this.catalogos.unidades();
    if (this.todasUnidades()) return todas;
    const actual = this.principal().unidad;
    return todas.filter((u) => UNIDADES_FRECUENTES.includes(u.codigo) || u.codigo === actual);
  });

  /** Cambia la opción principal y copia cantidad/unidad a las alternativas (son equivalentes). */
  private conPrincipal(cambios: Partial<EspacioIngrediente['opciones'][number]>): void {
    const [p, ...resto] = this.espacio().opciones;
    const nueva = { ...p!, ...cambios };
    this.cambio.emit({
      ...this.espacio(),
      opciones: [nueva, ...resto.map((o) => ({ ...o, cantidad: nueva.cantidad, unidad: nueva.unidad }))],
    });
  }

  protected cambiarCantidad(valor: string): void {
    const n = valor === '' ? null : Number(valor);
    if (n !== null && (Number.isNaN(n) || n < 0)) return;
    this.conPrincipal({ cantidad: n, unidad: n === null ? null : (this.principal().unidad ?? 'u') });
  }

  protected cambiarUnidad(codigo: string): void {
    this.conPrincipal({ unidad: codigo, cantidad: this.principal().cantidad ?? 1 });
  }

  protected alGusto(): void {
    this.conPrincipal({ cantidad: null, unidad: null });
  }

  protected cambiarNota(nota: string): void {
    this.conPrincipal({ nota: nota.trim() || null });
  }

  protected cambiarRol(rol: RolIngrediente): void {
    this.cambio.emit({ ...this.espacio(), rol });
  }

  protected agregarAlternativa(i: Ingrediente): void {
    const p = this.principal();
    this.cambio.emit({
      ...this.espacio(),
      opciones: [...this.espacio().opciones, { ingredienteId: i.id, cantidad: p.cantidad, unidad: p.unidad, nota: null }],
    });
  }

  protected quitarAlternativa(indice: number): void {
    this.cambio.emit({ ...this.espacio(), opciones: this.espacio().opciones.filter((_, i) => i !== indice) });
  }
}
