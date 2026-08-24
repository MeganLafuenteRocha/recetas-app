import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { Receta } from '../../domain/recetas/receta.model';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { db } from './firebase.providers';

function aReceta(id: string, data: Record<string, unknown>): Receta {
  const calculadaEn = data['nutricionCalculadaEn'];
  return {
    ...(data as unknown as Receta),
    id,
    nutricionCalculadaEn: calculadaEn instanceof Timestamp ? calculadaEn.toDate() : null,
  };
}

@Injectable({ providedIn: 'root' })
export class FirestoreRecetasRepo extends RecetaRepository {
  async obtenerTodas(): Promise<Receta[]> {
    const snap = await getDocs(collection(db, 'recetas'));
    return snap.docs.map((d) => aReceta(d.id, d.data()));
  }

  async guardar(receta: Receta): Promise<void> {
    const { id, ...datos } = receta;
    await setDoc(doc(db, 'recetas', id), {
      ...datos,
      actualizadoEn: serverTimestamp(),
    });
  }
}
