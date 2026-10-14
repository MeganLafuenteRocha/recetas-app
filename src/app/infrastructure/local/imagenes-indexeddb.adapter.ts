import { Injectable } from '@angular/core';
import { ImagenRepository, PREFIJO_LOCAL } from '../../domain/recetas/imagen.port';

const BASE = 'recetas-imagenes';
const ALMACEN = 'fotos';
const LADO_MAXIMO = 900;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(ALMACEN);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function operar<T>(modo: IDBTransactionMode, fn: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const pedido = fn(db.transaction(ALMACEN, modo).objectStore(ALMACEN));
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

/** Reduce la foto del celular (varios MB) a ~900 px en JPEG antes de guardarla. */
async function reducir(archivo: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext('2d')!.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  return new Promise((resolve) => lienzo.toBlob((b) => resolve(b ?? archivo), 'image/jpeg', 0.82));
}

@Injectable({ providedIn: 'root' })
export class ImagenesIndexedDbAdapter extends ImagenRepository {
  async guardar(recetaId: string, archivo: Blob): Promise<string> {
    const reducida = await reducir(archivo);
    await operar('readwrite', (a) => a.put(reducida, recetaId));
    return `${PREFIJO_LOCAL}${recetaId}`;
  }

  async obtenerUrl(clave: string): Promise<string | null> {
    if (!clave.startsWith(PREFIJO_LOCAL)) return clave; // una URL normal se usa tal cual
    try {
      const blob = await operar<Blob | undefined>('readonly', (a) => a.get(clave.slice(PREFIJO_LOCAL.length)));
      return blob ? URL.createObjectURL(blob) : null;
    } catch {
      return null;
    }
  }
}
