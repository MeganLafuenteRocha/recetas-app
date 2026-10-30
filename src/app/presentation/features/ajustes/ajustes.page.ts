import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { PreferenciasStore } from '../../../application/stores/preferencias.store';
import { HogarActualStore } from '../../../application/stores/hogar-actual.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { AdministrarCuentasUseCase } from '../../../application/use-cases/administrar-cuentas.usecase';
import { CalcularNutricionFaltanteUseCase } from '../../../application/use-cases/calcular-nutricion-faltante.usecase';
import { ExportarRespaldoUseCase } from '../../../application/use-cases/exportar-respaldo.usecase';
import { fechaISO } from '../../../domain/planificacion/plan.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { FilaAjusteComponent } from '../../ui/fila-ajuste.component';
import { HojaComponent } from '../../ui/hoja.component';
import { descargarArchivo } from '../../ui/iconos';

/** Pantalla 14: perfil, metas del hogar, administración y respaldo. */
@Component({
  selector: 'app-ajustes',
  imports: [RouterLink, HojaComponent, EncabezadoComponent, FilaAjusteComponent, AvisoComponent],
  template: `
    <main class="pantalla">
      <app-encabezado titulo="Ajustes" volver="/inicio" />

      @if (sesion.usuario(); as u) {
        <section class="tarjeta perfil">
          @if (u.foto) {
            <img class="avatar grande" [src]="u.foto" alt="" referrerpolicy="no-referrer" />
          } @else {
            <span class="avatar grande" aria-hidden="true">{{ u.nombre.charAt(0).toUpperCase() }}</span>
          }
          <div class="datos"><strong>{{ u.nombre }}</strong><span class="t-detalle">{{ hogar.nombre() ?? u.email }}</span></div>
          <span class="pastilla">{{ sesion.esAdmin() ? 'Admin' : 'Usuaria' }}</span>
        </section>
      }

      <section class="pila">
        <h2 class="t-sobretitulo">Mi hogar</h2>
        <div class="tarjeta lista">
          <button type="button" class="toque" (click)="abrirMetas()">
            <app-fila-ajuste icono="local_fire_department" etiqueta="Meta diaria de calorías" [valor]="preferencias.metas().kcalMin + '–' + preferencias.metas().kcalMax" />
          </button>
          <button type="button" class="toque" (click)="abrirMetas()">
            <app-fila-ajuste icono="fitness_center" etiqueta="Meta de proteína" [valor]="preferencias.metas().proteinaG + ' g'" />
          </button>
          <a class="toque" routerLink="/ingredientes" [queryParams]="{ basicos: 1 }">
            <app-fila-ajuste icono="star" etiqueta="Ingredientes básicos" [valor]="basicos()" />
          </a>
          <a class="toque" routerLink="/listas">
            <app-fila-ajuste icono="shopping_cart" etiqueta="Listas de compras" />
          </a>
        </div>
      </section>

      @if (sesion.esAdmin()) {
        <section class="pila">
          <h2 class="t-sobretitulo">Administración</h2>
          <div class="tarjeta lista">
            <a class="toque" routerLink="/admin/catalogos">
              <app-fila-ajuste icono="category" etiqueta="Catálogos" />
            </a>
            <a class="toque" routerLink="/ingredientes">
              <app-fila-ajuste icono="nutrition" etiqueta="Ingredientes" [valor]="ingredientes.total()" />
            </a>
            <a class="toque" routerLink="/admin/cuentas">
              <app-fila-ajuste
                icono="manage_accounts"
                etiqueta="Cuentas y hogares"
                [valor]="pendientes() > 0 ? pendientes() + (pendientes() === 1 ? ' pendiente' : ' pendientes') : null"
              />
            </a>
            <button type="button" class="toque" [disabled]="nutricion.faltantes().length === 0 || calculando()" (click)="calcularNutricion()">
              <app-fila-ajuste icono="auto_awesome" etiqueta="Calcular nutrición faltante" [valor]="estadoNutricion()" />
            </button>
          </div>
        </section>
      }

      <section class="pila">
        <h2 class="t-sobretitulo">Datos</h2>
        <div class="tarjeta lista">
          <button type="button" class="toque" (click)="exportar()">
            <app-fila-ajuste icono="download" etiqueta="Exportar respaldo (JSON)" />
          </button>
        </div>
      </section>

      <button type="button" class="btn btn-peligro salir" (click)="salir()"><span class="icono">logout</span> Cerrar sesión</button>
    </main>

    @if (editandoMetas()) {
      <app-hoja titulo="Metas del día" (cerrar)="editandoMetas.set(false)">
        <p class="t-detalle">Desayuno + almuerzo (la app no planifica la cena).</p>
        <div class="fila">
          <label class="campo"><span>Calorías mínimas</span><input class="caja" type="number" min="0" [value]="kcalMin()" (input)="kcalMin.set(+$any($event.target).value)" /></label>
          <label class="campo"><span>Calorías máximas</span><input class="caja" type="number" min="0" [value]="kcalMax()" (input)="kcalMax.set(+$any($event.target).value)" /></label>
        </div>
        <label class="campo"><span>Proteína (g)</span><input class="caja" type="number" min="0" [value]="proteina()" (input)="proteina.set(+$any($event.target).value)" /></label>
        @if (errorMetas(); as e) { <app-aviso icono="error" tono="error" [titulo]="e" /> }
        <button type="button" class="btn btn-primario btn-ancho" (click)="guardarMetas()">Guardar</button>
      </app-hoja>
    }
  `,
  styles: `
    .perfil { flex-direction: row; align-items: center; gap: 14px; padding: 18px 20px; }
    .datos { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .datos strong { font-family: var(--fuente-titulo); font-size: 17px; }
    .datos .t-detalle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tarjeta.lista { padding: 6px 20px; }
    .toque:disabled { opacity: 0.6; cursor: default; }
    .fila { display: flex; gap: 10px; }
    .fila > * { flex: 1; }
    .salir { align-self: center; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjustesPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly hogar = inject(HogarActualStore);
  protected readonly preferencias = inject(PreferenciasStore);
  protected readonly ingredientes = inject(IngredientesStore);
  protected readonly nutricion = inject(CalcularNutricionFaltanteUseCase);
  private readonly cuentas = inject(AdministrarCuentasUseCase);
  private readonly respaldo = inject(ExportarRespaldoUseCase);
  private readonly router = inject(Router);

  protected readonly basicos = computed(() => this.ingredientes.basicos().size);
  protected readonly pendientes = computed(() => this.cuentas.pendientes()?.length ?? 0);
  protected readonly calculando = signal(false);
  protected readonly estadoNutricion = computed(() => {
    const p = this.nutricion.progreso();
    if (p) return `${p.hechas}/${p.total} listas${p.fallidas ? ` · ${p.fallidas} sin respuesta` : ''}`;
    return this.calculando() ? 'Calculando…' : `${this.nutricion.faltantes().length} sin nutrición`;
  });

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
    // Recarga completa: no queda en memoria nada del hogar anterior.
    window.location.assign('/login');
  }
}
