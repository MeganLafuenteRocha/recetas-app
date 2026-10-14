import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { Grupo } from '../../domain/grupos/grupo.model';
import { GrupoRepository } from '../../domain/grupos/grupo.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestoreGruposRepo extends GrupoRepository {
  async obtenerTodos(): Promise<Grupo[]> {
    const snap = await getDocs(collection(db, 'grupos'));
    return snap.docs.map((d) => ({ ...(d.data() as Omit<Grupo, 'id'>), id: d.id }));
  }

  async guardar(grupo: Grupo): Promise<void> {
    const { id, ...datos } = grupo;
    await setDoc(doc(db, 'grupos', id), datos);
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, 'grupos', id));
  }
}
