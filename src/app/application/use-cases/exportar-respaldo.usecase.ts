import { inject, Injectable } from '@angular/core';
import { CatalogoStore } from '../stores/catalogo.store';
import { DespensaStore } from '../stores/despensa.store';
import { GruposStore } from '../stores/grupos.store';
import { IngredientesStore } from '../stores/ingredientes.store';
import { PreferenciasStore } from '../stores/preferencias.store';
import { RecetasStore } from '../stores/recetas.store';

/** Respaldo manual en JSON de todo lo que está en memoria. Cero lecturas extra. */
@Injectable({ providedIn: 'root' })
export class ExportarRespaldoUseCase {
  private readonly catalogos = inject(CatalogoStore);
  private readonly ingredientes = inject(IngredientesStore);
  private readonly recetas = inject(RecetasStore);
  private readonly despensa = inject(DespensaStore);
  private readonly grupos = inject(GruposStore);
  private readonly preferencias = inject(PreferenciasStore);

  ejecutar(): string {
    return JSON.stringify(
      {
        exportadoEn: new Date().toISOString(),
        catalogos: this.catalogos.catalogos(),
        ingredientes: [...this.ingredientes.porId().values()],
        recetas: [...this.recetas.porId().values()],
        despensa: [...this.despensa.ids()],
        grupos: this.grupos.todos(),
        metas: this.preferencias.metas(),
      },
      null,
      2,
    );
  }
}
