import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { textoCantidad } from '../../../domain/recetas/receta.model';

/**
 * Modo cocina: un paso a la vez, letra grande, lo importante resaltado.
 * Primero se repasan los ingredientes (paso 0). El temporizador libre queda para más adelante.
 */
@Component({
  selector: 'app-modo-cocina',
  template: `
    @if (receta(); as r) {
      <main class="cocina">
        <header>
          <button type="button" class="icono-btn" (click)="salir()" aria-label="Salir del modo cocina"><span class="icono">close</span></button>
          <div class="tit"><small>Cocinando</small><strong>{{ r.nombre }}</strong></div>
          <span class="contador">{{ paso() }}/{{ total() }}</span>
        </header>
        <div class="barra"><span [style.width.%]="(paso() / total()) * 100"></span></div>

        <section class="contenido">
          @if (paso() === 0) {
            <h2>Antes de empezar, ten a mano:</h2>
            <ul class="mise">
              @for (i of ingredientes(); track i.nombre) {
                <li><span>{{ i.nombre }}</span><small>{{ i.cantidad }}</small></li>
              }
            </ul>
          } @else if (pasoActual(); as p) {
            <span class="numero">Paso {{ p.numero }}</span>
            <p class="instruccion">{{ p.instruccion }}</p>
            @if (p.importante) {
              <p class="importante"><span class="icono">star</span> {{ p.importante }}</p>
            }
          }
        </section>

        <footer>
          <button type="button" class="btn btn-borde" [disabled]="paso() === 0" (click)="paso.set(paso() - 1)">
            <span class="icono">arrow_back</span> Anterior
          </button>
          @if (paso() < total()) {
            <button type="button" class="btn btn-primario crecer" (click)="paso.set(paso() + 1)">
              {{ paso() === 0 ? 'Empezar' : 'Siguiente' }} <span class="icono">arrow_forward</span>
            </button>
          } @else {
            <button type="button" class="btn btn-dorado crecer" (click)="salir()">
              <span class="icono">celebration</span> ¡Listo!
            </button>
          }
        </footer>
      </main>
    }
  `,
  styles: `
    .cocina { min-height: calc(100dvh - 80px); display: flex; flex-direction: column; padding: 16px; gap: 14px; }
    header { display: flex; align-items: center; gap: 10px; }
    .tit { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .tit small { color: var(--plomo-500); font-size: 11px; }
    .tit strong { font-family: 'Quicksand', sans-serif; font-size: 17px; color: var(--plomo-900); }
    .contador { font-size: 13px; color: var(--plomo-500); font-weight: 600; }
    .barra { height: 6px; border-radius: 999px; background: var(--plomo-100); overflow: hidden; }
    .barra span { display: block; height: 100%; background: var(--guindo-700); transition: width 0.2s; }
    .contenido { flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 12px 4px; }
    h2 { margin: 0; font-size: 20px; }
    .mise { list-style: none; margin: 0; padding: 0; }
    .mise li { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #e4e4e7; font-size: 15px; color: var(--plomo-900); }
    .mise small { color: var(--plomo-500); font-size: 14px; }
    .numero { color: var(--dorado-500); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .instruccion { margin: 0; font-size: 22px; line-height: 1.5; color: var(--plomo-900); }
    .importante { margin: 0; display: flex; gap: 8px; padding: 14px; border-radius: 16px; background: var(--dorado-100); color: #5e4718; font-size: 16px; line-height: 1.45; }
    .importante .icono { color: var(--dorado-700); }
    footer { display: flex; gap: 10px; }
    .crecer { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModoCocinaPage {
  private readonly recetas = inject(RecetasStore);
  private readonly ingredientesStore = inject(IngredientesStore);
  private readonly location = inject(Location);

  readonly id = input.required<string>();
  protected readonly paso = signal(0);

  protected readonly receta = computed(() => this.recetas.obtener(this.id()) ?? null);
  private readonly pasos = computed(() => this.receta()?.preparacion.pasos ?? []);
  protected readonly total = computed(() => this.pasos().length);
  protected readonly pasoActual = computed(() => this.pasos()[this.paso() - 1] ?? null);

  protected readonly ingredientes = computed(() =>
    (this.receta()?.ingredientes ?? []).flatMap((e) => {
      const o = e.opciones[0];
      return o ? [{ nombre: this.ingredientesStore.nombre(o.ingredienteId), cantidad: textoCantidad(o) }] : [];
    }),
  );

  protected salir(): void {
    this.location.back();
  }
}
