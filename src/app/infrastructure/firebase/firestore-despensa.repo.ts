import { inject, Injectable } from '@angular/core';
import { doc, DocumentReference, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { HogarActualStore } from '../../application/stores/hogar-actual.store';
import { Despensa, despensaVacia } from '../../domain/despensa/despensa.model';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { db } from './firebase.providers';

/** hogares/{hogarId}/datos/despensa: un solo documento por hogar. */
@Injectable({ providedIn: 'root' })
export class FirestoreDespensaRepo extends DespensaRepository {
  private readonly hogar = inject(HogarActualStore);

  private ref(): DocumentReference {
    return doc(db, 'hogares', this.hogar.requerido(), 'datos', 'despensa');
  }

  async obtener(): Promise<Despensa> {
    const snap = await getDoc(this.ref());
    if (!snap.exists()) return despensaVacia();
    const data = snap.data();
    return {
      ingredienteIds: (data['ingredienteIds'] as string[]) ?? [],
      actualizadaEn:
        data['actualizadaEn'] instanceof Timestamp ? data['actualizadaEn'].toDate() : null,
    };
  }

  async guardar(ingredienteIds: string[]): Promise<void> {
    await setDoc(this.ref(), {
      ingredienteIds,
      actualizadaEn: serverTimestamp(),
    });
  }
}
