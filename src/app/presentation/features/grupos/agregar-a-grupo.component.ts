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
        <div class="lista-filas">
          @for (g of grupos.todos(); track g.id) {
            <button type="button" class="fila-btn" [disabled]="ocupado() === g.id" (click)="alternar(g)">
              <span class="icono marca">{{ g.icono }}</span>
              <span class="principal"><strong>{{ g.nombre }}</strong><small>{{ g.recetaIds.length }} recetas</small></span>
              <span class="icono" [class.marca]="g.recetaIds.includes(recetaId())">
                {{ g.recetaIds.includes(recetaId()) ? 'check_box' : 'check_box_outline_blank' }}
              </span>
            </button>
          }
        </div>
      } @else {
        <p class="texto-suave">Aún no hay grupos.</p>
      }
      <a class="btn btn-borde ancho" routerLink="/grupos/nuevo" (click)="cerrar.emit()"><span class="icono">add</span> Crear grupo</a>
    </app-hoja>
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
