import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Pastilla con el % de afinidad: verde ≥85, ámbar ≥60, rojo debajo. */
@Component({
  selector: 'app-afinidad',
  template: `<span class="pastilla" [class]="nivel()">{{ puntaje() }}%</span>`,
  styles: `
    .pastilla {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .alto { color: var(--ok); background: #2e7d5b1a; }
    .medio { color: var(--alerta); background: #b7791f1a; }
    .bajo { color: var(--error); background: #b3261e1a; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfinidadComponent {
  readonly puntaje = input.required<number>();
  protected readonly nivel = computed(() => {
    const p = this.puntaje();
    return p >= 85 ? 'pastilla alto' : p >= 60 ? 'pastilla medio' : 'pastilla bajo';
  });
}
