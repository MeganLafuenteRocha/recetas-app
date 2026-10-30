import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GruposStore } from '../../../application/stores/grupos.store';
import { alternarReceta, Grupo } from '../../../domain/grupos/grupo.model';
import { HojaComponent } from '../../ui/hoja.component';

/** Hoja (solo admin): marcar en qué grupos está una receta. Cada toque = 1 escritura. */
@Component({
  selector: 'app-agregar-a-grupo',
  imports: [HojaComponent, RouterLink],
  template: `
    <app-hoja titulo="Guardar en un grupo" (cerrar)="cerrar.emit()">
      @if (grupos.todos().length > 0) {
        <div class="tarjeta lista">
          @for (g of grupos.todos(); track g.id) {
            <button
              type="button"
              class="toque fila"
              role="checkbox"
              [attr.aria-checked]="g.recetaIds.includes(recetaId())"
              [disabled]="ocupado() === g.id"
              (click)="alternar(g)"
            >
              <span class="circulo-icono"><span class="icono">{{ g.icono }}</span></span>
              <span class="textos">
                <strong>{{ g.nombre }}</strong>
                <span class="t-detalle">{{ g.recetaIds.length }} receta{{ g.recetaIds.length === 1 ? '' : 's' }}</span>
              </span>
              <span class="casilla redonda" [class.marcada]="g.recetaIds.includes(recetaId())" aria-hidden="true"><span class="icono">check</span></span>
            </button>
          }
        </div>
      } @else {
        <div class="vacio-estado">
          <span class="icono">bookmarks</span>
          <p>Aún no hay grupos.</p>
        </div>
      }
      <a class="btn btn-secundario btn-ancho" routerLink="/grupos/nuevo" (click)="cerrar.emit()"><span class="icono">add</span> Crear grupo</a>
    </app-hoja>
  `,
  styles: `
    .fila { display: flex; align-items: center; gap: var(--esp-grupo); padding: 10px 0; border-radius: 0; }
    .fila + .fila { border-top: 1px solid var(--color-linea); }
    .fila:disabled { opacity: 0.5; cursor: default; }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .textos strong { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarAGrupoComponent {
  protected readonly grupos = inject(GruposStore);
  readonly recetaId = input.required<string>();
  readonly cerrar = output<void>();
  protected readonly ocupado = signal<string | null>(null);

  protected async alternar(grupo: Grupo): Promise<void> {
    this.ocupado.set(grupo.id);
    try {
      await this.grupos.guardar(alternarReceta(grupo, this.recetaId()));
    } finally {
      this.ocupado.set(null);
    }
  }
}
