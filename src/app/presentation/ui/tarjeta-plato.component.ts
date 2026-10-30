import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ResultadoAfinidad } from '../../domain/planificacion/afinidad.service';
import { Receta } from '../../domain/recetas/receta.model';
import { emojiFranja } from './emojis';
import { EstadoRecetaComponent } from './estado-receta.component';
import { FotoComponent } from './foto.component';
import { duracion } from './iconos';

/**
 * «C · Tarjeta plato»: foto arriba, nombre en hasta 2 líneas y estado.
 * Para grillas, carruseles y las opciones del día (`elegida` marca la seleccionada).
 * Lo proyectado con el atributo `esquina` va sobre la foto (p. ej. quitar del grupo).
 */
@Component({
  selector: 'app-tarjeta-plato',
  imports: [FotoComponent, EstadoRecetaComponent],
  template: `
    <div class="marco">
      <app-foto class="foto" [clave]="receta().imagen" [alt]="receta().nombre" [emoji]="emoji()" />
      @if (elegida()) {
        <span class="marca"><span class="icono">check</span></span>
      }
      <ng-content select="[esquina]" />
    </div>
    <div class="textos">
      <strong class="t-tarjeta nombre">{{ receta().nombre }}</strong>
      <span class="t-detalle">{{ meta() }}</span>
      @if (resultado(); as r) {
        <app-estado-receta [resultado]="r" />
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      padding: 8px;
      border: 2px solid transparent;
      border-radius: var(--radio-tarjeta);
      background: var(--color-superficie);
    }
    :host(.elegida) { border-color: var(--color-primario); }
    .marco { position: relative; }
    .foto { width: 100%; height: 112px; }
    .marca {
      position: absolute;
      top: 8px;
      right: 8px;
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--color-primario);
      color: var(--color-texto-invertido);
    }
    .marca .icono { font-size: 16px; }
    .textos { display: flex; flex-direction: column; gap: 4px; padding: 0 4px 4px; }
    .nombre { font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `,
  host: { '[class.elegida]': 'elegida()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaPlatoComponent {
  readonly receta = input.required<Receta>();
  readonly resultado = input<ResultadoAfinidad | null>(null);
  readonly elegida = input(false);

  protected readonly meta = computed(() => {
    const r = this.receta();
    const kcal = r.nutricionPorcion ? ` · ${r.nutricionPorcion.kcal} kcal` : '';
    return `${duracion(r.tiempo.totalMin)}${kcal}`;
  });
  protected readonly emoji = computed(() => emojiFranja(this.receta().tipoComida));
}
