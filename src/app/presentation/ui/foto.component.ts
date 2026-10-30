import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ImagenesStore } from '../../application/stores/imagenes.store';

/** Foto de la receta. Si todavía no tiene, fondo crema con el emoji de su franja (regla 5). */
@Component({
  selector: 'app-foto',
  template: `
    @if (url(); as u) {
      <img [src]="u" [alt]="alt()" loading="lazy" decoding="async" />
    } @else {
      <span class="sin-foto" aria-hidden="true">{{ emoji() }}</span>
    }
  `,
  styles: `
    :host { display: grid; place-items: center; overflow: hidden; flex-shrink: 0; background: var(--color-foto); }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .sin-foto { font-size: 30px; line-height: 1; }
  `,
  host: { '[style.border-radius.px]': 'radio()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FotoComponent {
  private readonly imagenes = inject(ImagenesStore);

  readonly clave = input<string | null>(null);
  readonly alt = input('');
  readonly radio = input(16);
  readonly emoji = input('🍽️');

  protected readonly url = computed(() => this.imagenes.url(this.clave()) ?? null);
}
