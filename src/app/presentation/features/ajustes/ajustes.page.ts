import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PreferenciasStore } from '../../../application/stores/preferencias.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';
import { CalcularNutricionFaltanteUseCase } from '../../../application/use-cases/calcular-nutricion-faltante.usecase';
import { ExportarRespaldoUseCase } from '../../../application/use-cases/exportar-respaldo.usecase';
import { fechaISO } from '../../../domain/planificacion/plan.model';
import { HojaComponent } from '../../ui/hoja.component';
import { descargarArchivo } from '../../ui/iconos';

/** Pantalla 14: perfil, metas del hogar, administración y respaldo. */
@Component({
  selector: 'app-ajustes',
  imports: [RouterLink, HojaComponent],
  template: `
    <main class="vista">
      <header class="cabecera">
        <a class="icono-btn" routerLink="/inicio" aria-label="Volver"><span class="icono">arrow_back</span></a>
        <h1>Ajustes</h1>
      </header>

      @if (sesion.usuario(); as u) {
        <div class="tarjeta perfil">
          @if (u.foto) {
            <img class="avatar" [src]="u.foto" alt="" referrerpolicy="no-referrer" />
          } @else {
            <span class="avatar">{{ u.nombre.charAt(0).toUpperCase() }}</span>
          }
          <div class="datos"><strong>{{ u.nombre }}</strong><small>{{ u.email }}</small></div>
          <span class="chip dorado rol">{{ sesion.esAdmin() ? 'Admin' : 'Usuaria' }}</span>
        </div>
      }

      <p class="etiqueta-seccion">Mi hogar</p>
      <div class="lista-filas">
        <button type="button" class="fila-btn" (click)="abrirMetas()">
          <span class="icono marca">local_fire_department</span>
          <span class="principal"><strong>Meta diaria de calorías</strong></span>
          <small class="valor">{{ preferencias.metas().kcalMin }}–{{ preferencias.metas().kcalMax }}</small>
          <span class="icono">chevron_right</span>
        </button>
        <button type="button" class="fila-btn" (click)="abrirMetas()">
          <span class="icono marca">fitness_center</span>
          <span class="principal"><strong>Meta de proteína</strong></span>
          <small class="valor">{{ preferencias.metas().proteinaG }} g</small>
          <span class="icono">chevron_right</span>
        </button>
        <a class="fila-btn" routerLink="/ingredientes" [queryParams]="{ basicos: 1 }">
          <span class="icono marca">inventory_2</span>
          <span class="principal"><strong>Ingredientes básicos</strong><small>Los que siempre hay en casa</small></span>
          <small class="valor">{{ basicos() }}</small>
          <span class="icono">chevron_right</span>
        </a>
        <a class="fila-btn" routerLink="/listas">
          <span class="icono marca">shopping_cart</span>
          <span class="principal"><strong>Listas de compras</strong></span>
          <span class="icono">chevron_right</span>
        </a>
      </div>

      @if (sesion.esAdmin()) {
        <p class="etiqueta-seccion">Administración</p>
        <div class="lista-filas">
          <a class="fila-btn" routerLink="/admin/catalogos">
            <span class="icono marca">category</span>
            <span class="principal"><strong>Catálogos</strong><small>Cocinas, categorías, franjas, unidades</small></span>
            <span class="icono">chevron_right</span>
          </a>
          <a class="fila-btn" routerLink="/ingredientes">
            <span class="icono marca">grocery</span>
            <span class="principal"><strong>Ingredientes</strong></span>
            <small class="valor">{{ ingredientes.total() }}</small>
            <span class="icono">chevron_right</span>
          </a>
          <a class="fila-btn" routerLink="/admin/cuentas">
            <span class="icono marca">group_add</span>
            <span class="principal"><strong>Cuentas</strong></span>
            @if (pendientes() > 0) { <span class="badge">{{ pendientes() }}</span> }
            <span class="icono">chevron_right</span>
          </a>
          <button type="button" class="fila-btn" [disabled]="nutricion.faltantes().length === 0 || calculando()" (click)="calcularNutricion()">
            <span class="icono marca">auto_awesome</span>
            <span class="principal">
              <strong>Calcular nutrición faltante</strong>
              <small>
                @if (nutricion.progreso(); as p) {
                  {{ p.hechas }}/{{ p.total }} listas{{ p.fallidas ? ' · ' + p.fallidas + ' sin respuesta' : '' }}
                } @else {
                  {{ nutricion.faltantes().length }} recetas sin nutrición
                }
              </small>
            </span>
            <span class="icono">{{ calculando() ? 'hourglass_top' : 'chevron_right' }}</span>
          </button>
        </div>
      }

      <p class="etiqueta-seccion">Datos</p>
      <div class="lista-filas">
        <button type="button" class="fila-btn" (click)="exportar()">
          <span class="icono marca">download</span>
          <span class="principal"><strong>Exportar respaldo (JSON)</strong></span>
          <span class="icono">chevron_right</span>
        </button>
      </div>

      <button type="button" class="btn btn-peligro" (click)="salir()"><span class="icono">logout</span> Cerrar sesión</button>
    </main>

    @if (editandoMetas()) {
      <app-hoja titulo="Metas del día" (cerrar)="editandoMetas.set(false)">
        <p class="texto-suave">Desayuno + almuerzo (la app no planifica la cena).</p>
        <div class="fila">
          <label class="campo"><span>Calorías mínimas</span><input type="number" min="0" [value]="kcalMin()" (input)="kcalMin.set(+$any($event.target).value)" /></label>
          <label class="campo"><span>Calorías máximas</span><input type="number" min="0" [value]="kcalMax()" (input)="kcalMax.set(+$any($event.target).value)" /></label>
        </div>
        <label class="campo"><span>Proteína (g)</span><input type="number" min="0" [value]="proteina()" (input)="proteina.set(+$any($event.target).value)" /></label>
        @if (errorMetas(); as e) { <p class="aviso error"><span class="icono">error</span> {{ e }}</p> }
        <button type="button" class="btn btn-primario ancho" (click)="guardarMetas()">Guardar</button>
      </app-hoja>
    }
  `,
  styles: `
    .perfil { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--guindo-700); color: #fff; display: grid; place-items: center;
      font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 20px; object-fit: cover; flex-shrink: 0; }
    .datos { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .datos strong { font-size: 14px; color: var(--plomo-900); }
    .datos small { font-size: 10px; color: var(--plomo-500); overflow: hidden; text-overflow: ellipsis; }
    .rol { padding: 3px 9px; font-size: 10px; font-weight: 600; cursor: default; }
    .valor { color: var(--plomo-500); font-size: 12px; }
    .badge { background: var(--guindo-700); color: #fff; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 2px 8px; }
    .fila-btn:disabled { opacity: 0.6; cursor: default; }
    .fila { display: flex; gap: 10px; }
    .fila > * { flex: 1; }
    .btn-peligro { align-self: center; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjustesPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly preferencias = inject(PreferenciasStore);
  protected readonly ingredientes = inject(IngredientesStore);
  protected readonly nutricion = inject(CalcularNutricionFaltanteUseCase);
  private readonly cuentas = inject(AdministrarCuentasUseCase);
  private readonly respaldo = inject(ExportarRespaldoUseCase);
  private readonly router = inject(Router);

  protected readonly basicos = computed(() => this.ingredientes.basicos().size);
  protected readonly pendientes = computed(() => this.cuentas.pendientes()?.length ?? 0);
  protected readonly calculando = signal(false);

  protected readonly editandoMetas = signal(false);
  protected readonly kcalMin = signal(0);
  protected readonly kcalMax = signal(0);
  protected readonly proteina = signal(0);
  protected readonly errorMetas = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.sesion.esAdmin() && this.cuentas.pendientes() === null) void this.cuentas.cargarPendientes();
    });
  }

  protected abrirMetas(): void {
    const m = this.preferencias.metas();
    this.kcalMin.set(m.kcalMin);
    this.kcalMax.set(m.kcalMax);
    this.proteina.set(m.proteinaG);
    this.errorMetas.set(null);
    this.editandoMetas.set(true);
  }

  protected async guardarMetas(): Promise<void> {
    const error = await this.preferencias.guardarMetas({
      kcalMin: this.kcalMin(),
      kcalMax: this.kcalMax(),
      proteinaG: this.proteina(),
    });
    this.errorMetas.set(error);
    if (!error) this.editandoMetas.set(false);
  }

  protected async calcularNutricion(): Promise<void> {
    this.calculando.set(true);
    try {
      await this.nutricion.ejecutar();
    } finally {
      this.calculando.set(false);
    }
  }

  protected exportar(): void {
    descargarArchivo(`recetas-respaldo-${fechaISO(new Date())}.json`, this.respaldo.ejecutar());
  }

  protected async salir(): Promise<void> {
    await this.sesion.salir();
    await this.router.navigateByUrl('/login');
  }
}
