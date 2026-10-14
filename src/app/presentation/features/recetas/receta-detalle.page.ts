import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { DespensaStore } from '../../../application/stores/despensa.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { UiStore } from '../../../application/stores/ui.store';
import { GuardarRecetaUseCase } from '../../../application/use-cases/guardar-receta.usecase';
import { espacioCubierto, evaluarReceta } from '../../../domain/planificacion/afinidad.service';
import { fechaISO } from '../../../domain/planificacion/plan.model';
import { ROLES, textoCantidad } from '../../../domain/recetas/receta.model';
import { FaltantesComponent } from '../../ui/faltantes.component';
import { FotoComponent } from '../../ui/foto.component';
import { duracion, NOMBRE_ROL_PLURAL } from '../../ui/iconos';
import { AgregarAGrupoComponent } from '../grupos/agregar-a-grupo.component';
import { AgregarADiaComponent } from './agregar-a-dia.component';

const DIFICULTAD = ['', 'Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil'];

/** Pantalla 08: detalle de la receta con afinidad, nutrición, ingredientes por rol y preparación. */
@Component({
  selector: 'app-receta-detalle',
  imports: [RouterLink, FaltantesComponent, FotoComponent, AgregarADiaComponent, AgregarAGrupoComponent],
  templateUrl: './receta-detalle.page.html',
  styleUrl: './receta-detalle.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecetaDetallePage {
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly sesion = inject(SesionStore);
  protected readonly ui = inject(UiStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly guardarReceta = inject(GuardarRecetaUseCase);
  private readonly location = inject(Location);

  /** Viene de la ruta /recetas/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly pestana = signal<'ingredientes' | 'preparacion'>('ingredientes');
  protected readonly hoja = signal<'dia' | 'grupo' | null>(null);
  protected readonly calculando = signal(false);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly receta = computed(() => this.recetas.obtener(this.id()) ?? null);

  protected readonly afinidad = computed(() => {
    const r = this.receta();
    return r ? evaluarReceta(r, this.despensa.ids(), this.ingredientes.basicos()) : null;
  });

  /** Arco del aro de afinidad (conic-gradient). */
  protected readonly colorAfinidad = computed(() => {
    const p = this.afinidad()?.puntaje ?? 0;
    return p >= 85 ? 'var(--ok)' : p >= 60 ? 'var(--alerta)' : 'var(--error)';
  });

  protected readonly tituloAfinidad = computed(() => {
    const a = this.afinidad();
    if (!a) return '';
    if (a.faltantesEsenciales.length === 0 && a.faltantesCondimentos.length === 0) return 'Tienes todo para cocinarla';
    if (a.faltantesEsenciales.length === 0) return 'Casi todo en tu despensa';
    return a.faltantesEsenciales.length === 1 ? 'Te falta un ingrediente clave' : 'Te faltan algunos ingredientes';
  });

  protected readonly grupos = computed(() => {
    const r = this.receta();
    if (!r) return [];
    const disponibles = this.despensa.ids();
    const basicos = this.ingredientes.basicos();
    return ROLES.map((rol) => ({
      rol,
      nombre: NOMBRE_ROL_PLURAL[rol],
      filas: r.ingredientes
        .filter((e) => e.rol === rol)
        .map((e) => {
          const principal = e.opciones[0]!;
          return {
            id: principal.ingredienteId,
            nombre: this.ingredientes.nombre(principal.ingredienteId),
            alternativas: e.opciones.slice(1).map((o) => this.ingredientes.nombre(o.ingredienteId).toLowerCase()),
            nota: principal.nota,
            cantidad: textoCantidad(principal),
            basico: basicos.has(principal.ingredienteId),
            tiene: espacioCubierto(e, disponibles, basicos),
          };
        }),
    })).filter((g) => g.filas.length > 0);
  });

  protected readonly pasos = computed(() => this.receta()?.preparacion.pasos ?? []);

  protected dificultad(n: number): string {
    return DIFICULTAD[n] ?? 'Media';
  }

  protected duracion = duracion;

  protected volver(): void {
    this.location.back();
  }

  /** Para las recetas del seed o si la IA falló al guardar. */
  protected async calcularNutricion(): Promise<void> {
    const r = this.receta();
    if (!r) return;
    this.calculando.set(true);
    this.mensaje.set(null);
    try {
      const res = await this.guardarReceta.ejecutar(r, true);
      if (res.nutricionPendiente) this.mensaje.set('La IA no respondió. Revisa que AI Logic esté habilitado e intenta de nuevo.');
    } finally {
      this.calculando.set(false);
    }
  }

  protected alAgregar(fecha: string): void {
    this.hoja.set(null);
    this.mensaje.set(fecha === fechaISO(new Date()) ? 'Agregada a tu día de hoy.' : 'Agregada a tu plan.');
  }
}
