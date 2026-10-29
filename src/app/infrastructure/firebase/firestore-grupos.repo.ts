import { Injectable } from '@angular/core';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Grupo } from '../../domain/grupos/grupo.model';
import { GrupoRepository } from '../../domain/grupos/grupo.port';
import { db } from './firebase.providers';
import { leerIncremental } from './lectura-incremental';

@Injectable({ providedIn: 'root' })
export class FirestoreGruposRepo extends GrupoRepository {
  async obtenerTodos(): Promise<Grupo[]> {
    const docs = await leerIncremental(collection(db, 'grupos'));
    return docs
      .filter((d) => d.get('eliminado') !== true)
      .map((d) => {
        const { eliminado, actualizadoEn, ...datos } = d.data();
        return { ...(datos as Omit<Grupo, 'id'>), id: d.id };
      });
  }

  async guardar(grupo: Grupo): Promise<void> {
    const { id, ...datos } = grupo;
    await setDoc(doc(db, 'grupos', id), { ...datos, eliminado: false, actualizadoEn: serverTimestamp() });
  }

  /** Borrado lógico: así los demás dispositivos se enteran en su próxima lectura de cambios. */
  async eliminar(id: string): Promise<void> {
    await setDoc(doc(db, 'grupos', id), { eliminado: true, actualizadoEn: serverTimestamp() }, { merge: true });
  }
}
