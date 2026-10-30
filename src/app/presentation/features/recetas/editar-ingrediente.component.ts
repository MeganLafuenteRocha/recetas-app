import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { EspacioIngrediente, ROLES, RolIngrediente } from '../../../domain/recetas/receta.model';
import { emojiIngrediente } from '../../ui/emojis';
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
      <span inicio class="emoji-hoja" aria-hidden="true">{{ emoji() }}</span>
      <button acciones type="button" class="boton-icono sin-fondo borrar" (click)="quitar.emit()" aria-label="Quitar ingrediente" title="Quitar ingrediente">
        <span class="icono">delete</span>
      </button>

      <div class="fila-cantidad">
        <input
          class="caja cantidad"
          type="number"
          inputmode="decimal"
          min="0"
          step="any"
          placeholder="—"
          aria-label="Cantidad"
          [value]="principal().cantidad ?? ''"
          (input)="cambiarCantidad($any($event.target).value)"
        />
        <div class="chips envolver" role="group" aria-label="Unidad">
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

      <div class="pila">
        <span class="t-sobretitulo">Rol en la receta</span>
        <div class="segmentos" role="group" aria-label="Rol en la receta">
          @for (r of roles; track r) {
            <button type="button" [class.activo]="espacio().rol === r" (click)="cambiarRol(r)">{{ nombreRol[r] }}</button>
          }
        </div>
      </div>

      <input
        class="caja"
        type="text"
        placeholder="Nota (ej. en filetes delgados)"
        aria-label="Nota sobre la forma del ingrediente"
        [value]="principal().nota ?? ''"
        (input)="cambiarNota($any($event.target).value)"
      />

      <div class="pila">
        <span class="t-sobretitulo">También sirve</span>
        @if (espacio().opciones.length > 1) {
          <div class="chips envolver">
            @for (o of espacio().opciones.slice(1); track o.ingredienteId; let i = $index) {
              <span class="chip">
                {{ ingredientes.nombre(o.ingredienteId) }}
                <button type="button" class="quitar" (click)="quitarAlternativa(i + 1)" [attr.aria-label]="'Quitar ' + ingredientes.nombre(o.ingredienteId)">
                  <span class="icono">close</span>
                </button>
              </span>
            }
          </div>
        }
        <app-buscador-ingrediente placeholder="Agregar alternativa…" [excluir]="idsActuales()" (elegido)="agregarAlternativa($event)" />
      </div>

      <button type="button" class="btn btn-primario btn-ancho" (click)="cerrar.emit()"><span class="icono">check</span> Listo</button>
    </app-hoja>
  `,
  styles: `
    .emoji-hoja { display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0; border-radius: var(--radio-control); background: var(--color-superficie); font-size: 22px; }
    .borrar { color: var(--color-error); }
    .fila-cantidad { display: flex; gap: var(--esp-grupo); align-items: center; }
    .cantidad {
      width: 110px;
      flex-shrink: 0;
      min-height: 64px;
      text-align: center;
      font-family: var(--fuente-titulo);
      font-size: 24px;
      font-weight: 700;
    }
    .fila-cantidad .chips { flex: 1; min-width: 0; }
    .quitar { display: grid; padding: 0; margin-left: 2px; border: none; background: none; color: var(--color-texto-suave); cursor: pointer; }
    .quitar .icono { font-size: 15px; }
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
  protected readonly emoji = computed(() => emojiIngrediente(this.ingredientes.obtener(this.principal().ingredienteId)));
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
