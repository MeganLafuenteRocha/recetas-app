import { inject, Injectable, signal } from '@angular/core';
import { ImagenRepository } from '../../domain/recetas/imagen.port';

/** Caché de URLs de fotos: cada foto se busca una sola vez por sesión. */
@Injectable({ providedIn: 'root' })
export class ImagenesStore {
  private readonly repo = inject(ImagenRepository);
  private readonly _urls = signal<ReadonlyMap<string, string | null>>(new Map());
  private readonly pedidas = new Set<string>();

  /** Lectura reactiva: devuelve undefined mientras carga y dispara la carga si hace falta. */
  url(clave: string | null): string | null | undefined {
    if (!clave) return null;
    const conocida = this._urls().get(clave);
    if (conocida !== undefined) return conocida;
    if (!this.pedidas.has(clave)) {
      this.pedidas.add(clave);
      void this.repo.obtenerUrl(clave).then((u) => this.poner(clave, u));
    }
    return undefined;
  }

  async guardar(recetaId: string, archivo: Blob): Promise<string> {
    const clave = await this.repo.guardar(recetaId, archivo);
    this.poner(clave, URL.createObjectURL(archivo));
    return clave;
  }

  private poner(clave: string, url: string | null): void {
    this._urls.update((m) => new Map(m).set(clave, url));
  }
}
