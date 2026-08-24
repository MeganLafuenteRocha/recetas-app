import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { SeleccionDiaStore } from '../../../application/stores/seleccion-dia.store';
import { ArmarMiDiaUseCase } from '../../../application/use-cases/armar-mi-dia.usecase';
import { ResultadoAfinidad } from '../../../domain/planificacion/afinidad.service';

const ICONO_FRANJA: Record<string, string> = {
  desayuno: 'coffee',
  sopa: 'soup_kitchen',
  seco: 'dinner_dining',
  postre: 'cake',
};

const MAX_POR_FRANJA = 6;

interface OpcionVista {
  receta: ResultadoAfinidad['receta'];
  puntaje: number;
  faltantes: string;
  kcal: number | null;
}

/** Pantalla 05B: recetas sugeridas por franja según los ingredientes marcados. */
@Component({
  selector: 'app-opciones-dia',
  imports: [RouterLink],
  templateUrl: './opciones.page.html',
  styleUrl: './opciones.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpcionesDiaPage {
  protected readonly seleccion = inject(SeleccionDiaStore);
  private readonly catalogos = inject(CatalogoStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly armarMiDia = inject(ArmarMiDiaUseCase);
  private readonly router = inject(Router);

  protected readonly guardando = signal(false);

  protected readonly franjas = computed(() => {
    const sugerencias = this.seleccion.sugerencias();
    return this.catalogos
      .tiposComida()
      .map((tipo) => ({
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        icono: ICONO_FRANJA[tipo.codigo] ?? 'restaurant',
        opciones: (sugerencias.get(tipo.codigo) ?? [])
          .slice(0, MAX_POR_FRANJA)
          .map((r) => this.aVista(r)),
      }))
      .filter((f) => f.opciones.length > 0);
  });

  protected readonly kcalElegidas = computed(() => {
    let suma = 0;
    let conDato = false;
    for (const [, recetaId] of this.seleccion.elecciones()) {
      const kcal = this.buscarKcal(recetaId);
      if (kcal !== null) {
        suma += kcal;
        conDato = true;
      }
    }
    return conDato ? suma : null;
  });

  private aVista(resultado: ResultadoAfinidad): OpcionVista {
    const nombres = resultado.faltantesEsenciales
      .map((id) => this.ingredientes.obtener(id)?.nombre ?? id)
      .slice(0, 2);
    const extras = resultado.faltantesEsenciales.length - nombres.length;
    return {
      receta: resultado.receta,
      puntaje: resultado.puntaje,
      faltantes:
        nombres.length === 0
          ? ''
          : `Te falta: ${nombres.join(', ')}${extras > 0 ? ` +${extras}` : ''}`,
      kcal: resultado.receta.nutricionPorcion?.kcal ?? null,
    };
  }

  private buscarKcal(recetaId: string): number | null {
    for (const franja of this.franjas()) {
      const opcion = franja.opciones.find((o) => o.receta.id === recetaId);
      if (opcion) return opcion.kcal;
    }
    return null;
  }

  protected async armar(): Promise<void> {
    if (this.seleccion.totalElegidas() === 0 || this.guardando()) return;
    this.guardando.set(true);
    try {
      await this.armarMiDia.ejecutar();
      await this.router.navigateByUrl('/dia/resumen');
    } finally {
      this.guardando.set(false);
    }
  }
}
