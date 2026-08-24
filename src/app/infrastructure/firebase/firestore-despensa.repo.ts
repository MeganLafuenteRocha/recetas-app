import { Injectable } from '@angular/core';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Despensa, despensaVacia } from '../../domain/despensa/despensa.model';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestoreDespensaRepo extends DespensaRepository {
  async obtener(): Promise<Despensa> {
    const snap = await getDoc(doc(db, 'config', 'despensa'));
    if (!snap.exists()) return despensaVacia();
    const data = snap.data();
    return {
      ingredienteIds: (data['ingredienteIds'] as string[]) ?? [],
      actualizadaEn:
        data['actualizadaEn'] instanceof Timestamp ? data['actualizadaEn'].toDate() : null,
    };
  }

  async guardar(ingredienteIds: string[]): Promise<void> {
    await setDoc(doc(db, 'config', 'despensa'), {
      ingredienteIds,
      actualizadaEn: serverTimestamp(),
    });
  }
}
