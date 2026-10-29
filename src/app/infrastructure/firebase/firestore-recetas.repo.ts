import { inject, Injectable } from '@angular/core';
import {
  collection,
  CollectionReference,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { HogarActualStore } from '../../application/stores/hogar-actual.store';
import { Ambito } from '../../domain/hogares/hogar.model';
import { Receta } from '../../domain/recetas/receta.model';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { db } from './firebase.providers';

function aReceta(id: string, ambito: Ambito, data: Record<string, unknown>): Receta {
  const calculadaEn = data['nutricionCalculadaEn'];
  return {
    ...(data as unknown as Receta),
    id,
    ambito,
    nutricionCalculadaEn: calculadaEn instanceof Timestamp ? calculadaEn.toDate() : null,
  };
}

/** recetas/{id} (comunes) y hogares/{hogarId}/recetas/{id} (propias). */
@Injectable({ providedIn: 'root' })
export class FirestoreRecetasRepo extends RecetaRepository {
  private readonly hogar = inject(HogarActualStore);

  private coleccion(ambito: Ambito): CollectionReference {
    return ambito === 'comun'
      ? collection(db, 'recetas')
      : collection(db, 'hogares', this.hogar.requerido(), 'recetas');
  }

  private async leer(ambito: Ambito): Promise<Receta[]> {
    const snap = await getDocs(this.coleccion(ambito));
    return snap.docs.map((d) => aReceta(d.id, ambito, d.data()));
  }

  obtenerComunes(): Promise<Receta[]> {
    return this.leer('comun');
  }

  obtenerPropias(): Promise<Receta[]> {
    return this.leer('hogar');
  }

  async guardar(receta: Receta): Promise<void> {
    // El ámbito no se guarda: lo dice la ruta.
    const { id, ambito, ...datos } = receta;
    await setDoc(doc(this.coleccion(ambito), id), {
      ...datos,
      actualizadoEn: serverTimestamp(),
    });
  }
}
