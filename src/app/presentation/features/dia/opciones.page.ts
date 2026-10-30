import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { PreferenciasStore } from '../../../application/stores/preferencias.store';
import { SeleccionDiaStore } from '../../../application/stores/seleccion-dia.store';
import { ArmarMiDiaUseCase } from '../../../application/use-cases/armar-mi-dia.usecase';
import { ResultadoAfinidad } from '../../../domain/planificacion/afinidad.service';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { CabeceraSeccionComponent } from '../../ui/cabecera-seccion.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { iconoFranja } from '../../ui/iconos';
import { TarjetaPlatoComponent } from '../../ui/tarjeta-plato.component';
import { NumeroPipe } from '../../ui/numero.pipe';

const MAX_POR_FRANJA = 6;

interface OpcionVista {
  resultado: ResultadoAfinidad;
  receta: ResultadoAfinidad['receta'];
  kcal: number | null;
}

/** Pantalla 05B: recetas sugeridas por franja según los ingredientes marcados. */
@Component({
  selector: 'app-opciones-dia',
  imports: [RouterLink, EncabezadoComponent, CabeceraSeccionComponent, TarjetaPlatoComponent, NumeroPipe],
  templateUrl: './opciones.page.html',
  styleUrl: './opciones.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpcionesDiaPage {
  protected readonly seleccion = inject(SeleccionDiaStore);
  private readonly catalogos = inject(CatalogoStore);
  protected readonly preferencias = inject(PreferenciasStore);
  private readonly armarMiDia = inject(ArmarMiDiaUseCase);
  private readonly router = inject(Router);
  private readonly ingredientes = inject(IngredientesStore);

  protected readonly guardando = signal(false);

  protected readonly franjas = computed(() => {
    const sugerencias = this.seleccion.sugerencias();
    return this.catalogos
      .tiposComida()
      .map((tipo) => ({
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        icono: iconoFranja(tipo.codigo),
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

  /** «Papa · Cebolla · Tomate» en la pastilla de arriba (o cuántos hay, si son muchos). */
  protected readonly resumenIngredientes = computed(() => {
    const ids = [...this.seleccion.seleccionados()];
    if (ids.length === 0) return 'Sin ingredientes marcados';
    if (ids.length > 5) return `${ids.length} ingredientes marcados`;
    return ids.map((id) => this.ingredientes.nombre(id)).join(' · ');
  });

  /** Nombres de lo elegido, para la tarjeta oscura ("Sopa de fideo · Chorrellana"). */
  protected readonly nombresElegidos = computed(() =>
    [...this.seleccion.elecciones().values()]
      .map((id) => this.franjas().flatMap((f) => f.opciones).find((o) => o.receta.id === id)?.receta.nombre)
      .filter(Boolean)
      .join(' · '),
  );

  private aVista(resultado: ResultadoAfinidad): OpcionVista {
    return {
      resultado,
      receta: resultado.receta,
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
