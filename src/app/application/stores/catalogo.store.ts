import { computed, Injectable, signal } from '@angular/core';
import { Catalogos } from '../../domain/catalogos/catalogo.model';
import { ReferenciasNutricionales } from '../../domain/nutricion/nutricion.model';

const CATALOGOS_VACIOS: Catalogos = {
  unidades: [],
  tiposComida: [],
  tiposCocina: [],
  categorias: [],
};

@Injectable({ providedIn: 'root' })
export class CatalogoStore {
  private readonly _catalogos = signal<Catalogos>(CATALOGOS_VACIOS);
  private readonly _referencias = signal<ReferenciasNutricionales | null>(null);

  readonly catalogos = this._catalogos.asReadonly();
  readonly referencias = this._referencias.asReadonly();

  readonly tiposComida = computed(() =>
    [...this._catalogos().tiposComida].sort((a, b) => a.orden - b.orden),
  );
  readonly categorias = computed(() =>
    [...this._catalogos().categorias].sort((a, b) => a.orden - b.orden),
  );
  readonly tiposCocina = computed(() => this._catalogos().tiposCocina);
  readonly unidades = computed(() => this._catalogos().unidades);

  cargar(catalogos: Catalogos, referencias: ReferenciasNutricionales): void {
    this._catalogos.set(catalogos);
    this._referencias.set(referencias);
  }

  actualizar(catalogos: Catalogos): void {
    this._catalogos.set(catalogos);
  }

  /** Nombre visible de una franja: "seco" → "Segundo". */
  nombreFranja(codigo: string): string {
    return this._catalogos().tiposComida.find((t) => t.codigo === codigo)?.nombre ?? codigo;
  }

  nombreUnidad(codigo: string): string {
    return this._catalogos().unidades.find((u) => u.codigo === codigo)?.nombre ?? codigo;
  }

  nombreCategoria(codigo: string): string {
    return this._catalogos().categorias.find((c) => c.codigo === codigo)?.nombre ?? codigo;
  }

  nombreCocina(codigo: string): string {
    return this._catalogos().tiposCocina.find((c) => c.codigo === codigo)?.nombre ?? codigo;
  }
}
