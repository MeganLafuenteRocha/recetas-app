import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { ItemLista, ListaCompra, OrigenLista } from '../../domain/listas/lista.model';
import { ListaRepository } from '../../domain/listas/lista.port';
import { db } from './firebase.providers';

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

@Injectable({ providedIn: 'root' })
export class FirestoreListasRepo extends ListaRepository {
  async obtenerTodas(): Promise<ListaCompra[]> {
    const snap = await getDocs(collection(db, 'listas'));
    return snap.docs.map((d) => aLista(d.id, d.data()));
  }

  async guardar(lista: ListaCompra): Promise<void> {
    const { id, creadaEn, ...datos } = lista;
    await setDoc(doc(db, 'listas', id), {
      ...datos,
      creadaEn: creadaEn ? Timestamp.fromDate(creadaEn) : serverTimestamp(),
    });
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, 'listas', id));
  }
}
