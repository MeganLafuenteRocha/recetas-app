import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IngredientesStore } from '../../application/stores/ingredientes.store';
import { ResultadoAfinidad } from '../../domain/planificacion/afinidad.service';

/**
 * Regla 2 del sistema de diseño: la afinidad es un dato de apoyo, una línea suave.
 * «● Tienes todo» en verde o «● Te falta: pan molido y locoto» en dorado.
 */
@Component({
  selector: 'app-estado-receta',
  template: `<span class="punto"></span>{{ texto() }}`,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; color: var(--color-ok); }
    :host(.falta) { color: var(--color-acento); }
  `,
  host: { '[class.falta]': 'faltan().length > 0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoRecetaComponent {
  private readonly ingredientes = inject(IngredientesStore);

  readonly resultado = input.required<ResultadoAfinidad>();

  /** Lo que de verdad falta para cocinarla: esenciales y condimentos (los opcionales no). */
  protected readonly faltan = computed(() => {
    const r = this.resultado();
    return [...r.faltantesEsenciales, ...r.faltantesCondimentos].map((id) => this.ingredientes.nombre(id).toLowerCase());
  });

  protected readonly texto = computed(() => {
    const f = this.faltan();
    if (f.length === 0) return 'Tienes todo';
    if (f.length === 1) return `Te falta: ${f[0]}`;
    if (f.length === 2) return `Te falta: ${f[0]} y ${f[1]}`;
    return `Te falta: ${f[0]}, ${f[1]} y ${f.length - 2} más`;
  });
}
