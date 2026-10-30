import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { textoCantidad } from '../../../domain/recetas/receta.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { emojiFranja, emojiIngrediente } from '../../ui/emojis';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaIngredienteComponent } from '../../ui/fila-ingrediente.component';
import { FotoComponent } from '../../ui/foto.component';

/** Circunferencia del anillo del temporizador (r = 54 en un viewBox de 120). */
const CIRCUNFERENCIA = 2 * Math.PI * 54;

/** 158 → "02:38". */
function reloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Modo cocina (S8pkxc): un paso a la vez, letra grande, lo importante en un aviso y un
 * temporizador libre. Primero se repasan los ingredientes (paso 0).
 */
@Component({
  selector: 'app-modo-cocina',
  imports: [EncabezadoComponent, AvisoComponent, FilaIngredienteComponent, FotoComponent],
  template: `
    @if (receta(); as r) {
      <main class="pantalla cocina">
        <app-encabezado [titulo]="r.nombre" sobretitulo="Cocinando" [volver]="['/recetas', r.id]">
          <button type="button" class="boton-icono" [disabled]="paso() === 0" (click)="paso.set(0)" aria-label="Ver ingredientes" title="Ver ingredientes">
            <span class="icono">format_list_bulleted</span>
          </button>
        </app-encabezado>

        <div class="avance">
          <div class="avance-textos">
            <strong class="paso-n">{{ paso() === 0 ? 'Antes de empezar' : 'Paso ' + paso() + ' de ' + total() }}</strong>
            @if (minutosRestantes(); as min) {
              <span class="t-detalle">≈ {{ min }} min restantes</span>
            }
          </div>
          <div class="progreso primario" role="progressbar" aria-label="Avance de la receta" [attr.aria-valuenow]="paso()" aria-valuemin="0" [attr.aria-valuemax]="total()">
            <span [style.width.%]="total() ? (paso() / total()) * 100 : 0"></span>
          </div>
        </div>

        @if (paso() === 0) {
          <section class="pila">
            <h2 class="t-seccion">Ten a mano:</h2>
            <div class="tarjeta lista">
              @for (i of ingredientes(); track i.nombre) {
                <app-fila-ingrediente [emoji]="i.emoji" [nombre]="i.nombre">
                  <span class="cantidad">{{ i.cantidad }}</span>
                </app-fila-ingrediente>
              }
            </div>
          </section>
        } @else if (pasoActual(); as p) {
          <div class="foto-marco foto">
            <app-foto [clave]="r.imagen" [alt]="r.nombre" [emoji]="emoji()" [radio]="0" />
          </div>
          <p class="instruccion">{{ p.instruccion }}</p>
          @if (p.importante) {
            <app-aviso icono="lightbulb">{{ p.importante }}</app-aviso>
          }

          <!-- Temporizador libre: empieza en 0 y «+1 min» lo carga. -->
          <section class="temporizador" [class.terminado]="terminado()" aria-label="Temporizador">
            <div class="reloj">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle class="pista" cx="60" cy="60" r="54" />
                <circle
                  class="arco"
                  cx="60"
                  cy="60"
                  r="54"
                  [attr.stroke-dasharray]="circunferencia"
                  [attr.stroke-dashoffset]="desfase()"
                />
              </svg>
              <div class="reloj-textos" role="timer" aria-live="off">
                <strong>{{ textoRestante() }}</strong>
                <span class="t-detalle">{{ terminado() ? '¡Tiempo!' : 'de ' + textoDuracion() }}</span>
              </div>
            </div>
            <div class="controles">
              <button type="button" class="boton-icono" [disabled]="duracion() === 0" (click)="reiniciar()" aria-label="Reiniciar temporizador" title="Reiniciar">
                <span class="icono">replay</span>
              </button>
              <button
                type="button"
                class="boton-icono reproducir"
                [disabled]="restantes() === 0"
                (click)="alternar()"
                [attr.aria-label]="enMarcha() ? 'Pausar temporizador' : 'Reanudar temporizador'"
              >
                <span class="icono lleno">{{ enMarcha() ? 'pause' : 'play_arrow' }}</span>
              </button>
              <button type="button" class="boton-icono" (click)="sumarMinuto()" aria-label="Sumar un minuto" title="+1 min">
                <span class="mas-uno">+1</span>
              </button>
            </div>
            @if (terminado()) {
              <app-aviso icono="alarm" tono="error" titulo="¡Se acabó el tiempo!">Revisa la olla antes de seguir.</app-aviso>
            }
          </section>
        }

        <div class="pie-fijo">
          <button type="button" class="btn btn-secundario" [disabled]="paso() === 0" (click)="paso.set(paso() - 1)">
            <span class="icono">arrow_back</span> Anterior
          </button>
          @if (paso() < total()) {
            <button type="button" class="btn btn-primario crecer" (click)="paso.set(paso() + 1)">
              {{ paso() === 0 ? 'Empezar' : 'Siguiente paso' }} <span class="icono">arrow_forward</span>
            </button>
          } @else {
            <button type="button" class="btn btn-acento crecer" (click)="salir()">
              <span class="icono">celebration</span> ¡Listo!
            </button>
          }
        </div>
      </main>
    }
  `,
  styles: `
    .cocina { min-height: 100dvh; }
    .avance { display: flex; flex-direction: column; gap: 8px; margin-top: -8px; }
    .avance-textos { display: flex; align-items: baseline; justify-content: space-between; gap: var(--esp-grupo); }
    .paso-n { font-size: 13px; font-weight: 600; color: var(--color-primario); }
    .cantidad { font-size: 12px; color: var(--color-texto-suave); white-space: nowrap; }
    .foto { height: 200px; border-radius: var(--radio-tarjeta); }
    .foto app-foto { width: 100%; height: 100%; }
    .instruccion { font-family: var(--fuente-titulo); font-size: 22px; font-weight: 600; line-height: 1.4; }

    .temporizador { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .reloj { position: relative; width: 220px; height: 220px; }
    svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 8; }
    .pista { stroke: var(--color-linea); }
    .arco { stroke: var(--color-primario); stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.2s; }
    .reloj-textos { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
    .reloj-textos strong { font-family: var(--fuente-titulo); font-size: 40px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .controles { display: flex; align-items: center; gap: 16px; }
    .controles .boton-icono { width: 56px; height: 56px; }
    .controles .reproducir { width: 72px; height: 72px; background: var(--color-oscuro); color: var(--color-texto-invertido); }
    .controles .reproducir .icono { font-size: 32px; }
    .mas-uno { font-size: 15px; font-weight: 600; }
    .terminado .pista { stroke: var(--color-error-suave); }
    .terminado .reloj-textos strong, .terminado .reloj-textos .t-detalle { color: var(--color-error); }
    .terminado .reloj { animation: latido 1s ease-in-out infinite; }
    .terminado app-aviso { align-self: stretch; }
    .pie-fijo { margin-top: auto; }
    .crecer { flex: 1; }
    @keyframes latido { 50% { transform: scale(1.04); } }
    @media (prefers-reduced-motion: reduce) { .terminado .reloj { animation: none; } }
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
  protected readonly emoji = computed(() => emojiFranja(this.receta()?.tipoComida ?? ''));

  /** Estimación: el tiempo total repartido por igual entre los pasos que faltan. */
  protected readonly minutosRestantes = computed(() => {
    const r = this.receta();
    const total = this.total();
    if (!r || total === 0 || this.paso() === 0) return null;
    return Math.max(1, Math.round((r.tiempo.totalMin * (total - this.paso() + 1)) / total));
  });

  protected readonly ingredientes = computed(() =>
    (this.receta()?.ingredientes ?? []).flatMap((e) => {
      const o = e.opciones[0];
      return o
        ? [
            {
              nombre: this.ingredientesStore.nombre(o.ingredienteId),
              cantidad: textoCantidad(o),
              emoji: emojiIngrediente(this.ingredientesStore.obtener(o.ingredienteId)),
            },
          ]
        : [];
    }),
  );

  // ---------- Temporizador ----------
  protected readonly circunferencia = CIRCUNFERENCIA;
  /** Segundos cargados con «+1 min» (el «de 4:00» del anillo). */
  protected readonly duracion = signal(0);
  protected readonly restantes = signal(0);
  protected readonly enMarcha = signal(false);
  protected readonly terminado = signal(false);
  private intervalo: ReturnType<typeof setInterval> | null = null;

  protected readonly textoRestante = computed(() => reloj(this.restantes()));
  protected readonly textoDuracion = computed(() => {
    const d = this.duracion();
    return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`;
  });
  /** Lo que se «borra» del anillo: lleno al cargar, vacío al llegar a 0. */
  protected readonly desfase = computed(() => {
    const d = this.duracion();
    return d === 0 ? CIRCUNFERENCIA : CIRCUNFERENCIA * (1 - this.restantes() / d);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  protected sumarMinuto(): void {
    if (this.restantes() === 0) this.duracion.set(60);
    else this.duracion.update((d) => d + 60);
    this.restantes.update((s) => s + 60);
    this.terminado.set(false);
  }

  protected alternar(): void {
    if (this.enMarcha()) this.detener();
    else this.iniciar();
  }

  protected reiniciar(): void {
    this.detener();
    this.restantes.set(this.duracion());
    this.terminado.set(false);
  }

  private iniciar(): void {
    if (this.restantes() === 0 || this.intervalo !== null) return;
    this.terminado.set(false);
    this.enMarcha.set(true);
    this.intervalo = setInterval(() => this.tic(), 1000);
  }

  private tic(): void {
    const quedan = this.restantes() - 1;
    if (quedan > 0) {
      this.restantes.set(quedan);
      return;
    }
    this.restantes.set(0);
    this.detener();
    this.terminado.set(true);
    navigator.vibrate?.([300, 150, 300]);
  }

  private detener(): void {
    if (this.intervalo !== null) clearInterval(this.intervalo);
    this.intervalo = null;
    this.enMarcha.set(false);
  }

  protected salir(): void {
    this.location.back();
  }
}
