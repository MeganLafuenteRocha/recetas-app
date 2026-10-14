import { inject, Injectable, signal } from '@angular/core';
import { CatalogoRepository } from '../../domain/catalogos/catalogo.port';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { GrupoRepository } from '../../domain/grupos/grupo.port';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { fechaISO } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';
import { PreferenciasRepository } from '../../domain/preferencias/preferencias.port';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { CatalogoStore } from '../stores/catalogo.store';
import { DespensaStore } from '../stores/despensa.store';
import { GruposStore } from '../stores/grupos.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { PlanStore } from '../stores/plan.store';
import { PreferenciasStore } from '../stores/preferencias.store';
import { RecetasStore } from '../stores/recetas.store';

/**
 * LA carga de datos: se ejecuta UNA sola vez por sesión, cuando la cuenta está activa.
 * Primera apertura ≈ 80 lecturas; las siguientes salen de la caché offline (0 de cuota).
 * Después de esto, toda la app trabaja en memoria. Listas y semanas se leen al abrirlas.
 */
@Injectable({ providedIn: 'root' })
export class CargarDatosInicialesUseCase {
  private readonly catalogosRepo = inject(CatalogoRepository);
  private readonly ingredientesRepo = inject(IngredienteRepository);
  private readonly recetasRepo = inject(RecetaRepository);
  private readonly despensaRepo = inject(DespensaRepository);
  private readonly planesRepo = inject(PlanRepository);
  private readonly preferenciasRepo = inject(PreferenciasRepository);
  private readonly gruposRepo = inject(GrupoRepository);

  private readonly catalogoStore = inject(CatalogoStore);
  private readonly ingredientesStore = inject(IngredientesStore);
  private readonly recetasStore = inject(RecetasStore);
  private readonly despensaStore = inject(DespensaStore);
  private readonly planStore = inject(PlanStore);
  private readonly preferenciasStore = inject(PreferenciasStore);
  private readonly gruposStore = inject(GruposStore);

  private readonly _listo = signal(false);
  readonly listo = this._listo.asReadonly();

  async ejecutar(): Promise<void> {
    if (this._listo()) return;

    const [catalogos, referencias, ingredientes, recetas, despensa, planHoy, preferencias, grupos] =
      await Promise.all([
        this.catalogosRepo.obtenerCatalogos(),
        this.catalogosRepo.obtenerReferencias(),
        this.ingredientesRepo.obtenerTodos(),
        this.recetasRepo.obtenerTodas(),
        this.despensaRepo.obtener(),
        this.planesRepo.obtenerDia(fechaISO(new Date())),
        this.preferenciasRepo.obtener(),
        this.gruposRepo.obtenerTodos(),
      ]);

    this.catalogoStore.cargar(catalogos, referencias);
    this.ingredientesStore.cargar(ingredientes);
    this.recetasStore.cargar(recetas);
    this.despensaStore.cargar(despensa.ingredienteIds);
    this.planStore.cargar(planHoy);
    this.preferenciasStore.cargar(preferencias);
    this.gruposStore.cargar(grupos);

    this._listo.set(true);
  }
}
