import { inject, Injectable } from '@angular/core';
import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { HogarActualStore } from '../../application/stores/hogar-actual.store';
import { ItemLista, ListaCompra, OrigenLista } from '../../domain/listas/lista.model';
import { ListaRepository } from '../../domain/listas/lista.port';
import { db } from './firebase.providers';
import { leerIncremental } from './lectura-incremental';

function aLista(id: string, data: DocumentData): ListaCompra {
  return {
    id,
    nombre: (data['nombre'] as string) ?? 'Mi lista',
    fechaCompra: (data['fechaCompra'] as string) ?? '',
    origen: (data['origen'] as OrigenLista) ?? 'manual',
    items: (data['items'] as ItemLista[]) ?? [],
    creadaEn: data['creadaEn'] instanceof Timestamp ? data['creadaEn'].toDate() : null,
  };
}

/** hogares/{hogarId}/listas/{id}. */
@Injectable({ providedIn: 'root' })
export class FirestoreListasRepo extends ListaRepository {
  private readonly hogar = inject(HogarActualStore);

  private coleccion(): CollectionReference {
    return collection(db, 'hogares', this.hogar.requerido(), 'listas');
  }

  async obtenerTodas(): Promise<ListaCompra[]> {
    const docs = await leerIncremental(this.coleccion());
    return docs.filter((d) => d.get('eliminada') !== true).map((d) => aLista(d.id, d.data()));
  }

  async guardar(lista: ListaCompra): Promise<void> {
    const { id, creadaEn, ...datos } = lista;
    await setDoc(doc(this.coleccion(), id), {
      ...datos,
      creadaEn: creadaEn ? Timestamp.fromDate(creadaEn) : serverTimestamp(),
      eliminada: false,
      actualizadoEn: serverTimestamp(),
    });
  }

  /** Borrado lógico: así el otro celular del hogar se entera en su próxima lectura de cambios. */
  async eliminar(id: string): Promise<void> {
    await setDoc(doc(this.coleccion(), id), { eliminada: true, actualizadoEn: serverTimestamp() }, { merge: true });
  }
}
