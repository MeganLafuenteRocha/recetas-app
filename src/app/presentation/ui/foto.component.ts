import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ImagenesStore } from '../../application/stores/imagenes.store';

/** Foto de la receta, o el marcador gris del mockup si aún no tiene. */
@Component({
  selector: 'app-foto',
  template: `
    @if (url(); as u) {
      <img [src]="u" [alt]="alt()" loading="lazy" />
    } @else {
      <span class="icono" [style.font-size.px]="tamanoIcono()">image</span>
    }
  `,
  styles: `
    :host { display: grid; place-items: center; background: #e4e4e7; color: var(--plomo-500); overflow: hidden; flex-shrink: 0; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
  `,
  host: { '[style.border-radius.px]': 'radio()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FotoComponent {
  private readonly imagenes = inject(ImagenesStore);

  readonly clave = input<string | null>(null);
  readonly alt = input('');
  readonly radio = input(12);
  readonly tamanoIcono = input(22);

  protected readonly url = computed(() => this.imagenes.url(this.clave()) ?? null);
}
