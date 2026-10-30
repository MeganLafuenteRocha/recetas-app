import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CatalogoStore } from '../../application/stores/catalogo.store';
import { ResultadoAfinidad } from '../../domain/planificacion/afinidad.service';
import { Receta } from '../../domain/recetas/receta.model';
import { emojiFranja } from './emojis';
import { EstadoRecetaComponent } from './estado-receta.component';
import { FotoComponent } from './foto.component';
import { duracion, nombreDificultad } from './iconos';

/**
 * «C · Tarjeta receta»: foto a la izquierda, nombre en hasta 2 líneas (regla 1),
 * tiempo · dificultad · kcal y el estado. Sin enlace propio: quien la usa la envuelve
 * en un <a class="toque"> o <button class="toque">. Lo proyectado va a la derecha.
 */
@Component({
  selector: 'app-tarjeta-receta',
  imports: [FotoComponent, EstadoRecetaComponent],
  template: `
    <app-foto class="foto" [clave]="receta().imagen" [alt]="receta().nombre" [emoji]="emoji()" />
    <div class="textos">
      <span class="t-sobretitulo">{{ sobretitulo() ?? sobretituloPorDefecto() }}</span>
      <strong class="t-tarjeta nombre">{{ receta().nombre }}</strong>
      <span class="meta">
        <span><span class="icono">schedule</span>{{ tiempo() }}</span>
        <span><span class="icono">signal_cellular_alt</span>{{ dificultad() }}</span>
        @if (kcal(); as k) {
          <span><span class="icono">local_fire_department</span>{{ k }} kcal</span>
        }
      </span>
      @if (resultado(); as r) {
        <app-estado-receta [resultado]="r" />
      }
    </div>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px;
      border: 2px solid transparent;
      border-radius: var(--radio-tarjeta);
      background: var(--color-superficie);
    }
    :host(.elegida) { border-color: var(--color-primario); }
    .foto { width: 92px; height: 92px; }
    .textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .nombre { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 11px; color: var(--color-texto-suave); }
    .meta > span { display: inline-flex; align-items: center; gap: 3px; }
    .meta .icono { font-size: 14px; }
  `,
  host: { '[class.elegida]': 'elegida()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaRecetaComponent {
  private readonly catalogos = inject(CatalogoStore);

  readonly receta = input.required<Receta>();
  readonly resultado = input<ResultadoAfinidad | null>(null);
  /** Por defecto «Franja · Cocina». */
  readonly sobretitulo = input<string | null>(null);
  /** Opción seleccionada en una lista para elegir (borde guindo). */
  readonly elegida = input(false);

  protected readonly sobretituloPorDefecto = computed(() => {
    const r = this.receta();
    return `${this.catalogos.nombreFranja(r.tipoComida)} · ${this.catalogos.nombreCocina(r.tipoCocina)}`;
  });
  protected readonly tiempo = computed(() => duracion(this.receta().tiempo.totalMin));
  protected readonly dificultad = computed(() => nombreDificultad(this.receta().dificultad));
  protected readonly kcal = computed(() => this.receta().nutricionPorcion?.kcal ?? null);
  protected readonly emoji = computed(() => emojiFranja(this.receta().tipoComida));
}
