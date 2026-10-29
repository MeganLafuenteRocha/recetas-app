import { inject, Injectable } from '@angular/core';
import { doc, DocumentReference, getDoc, setDoc } from 'firebase/firestore';
import { HogarActualStore } from '../../application/stores/hogar-actual.store';
import {
  MetasDiarias,
  Preferencias,
  PREFERENCIAS_POR_DEFECTO,
} from '../../domain/preferencias/preferencias.model';
import { PreferenciasRepository } from '../../domain/preferencias/preferencias.port';
import { db } from './firebase.providers';

/** hogares/{hogarId}/datos/preferencias: metas del hogar. */
@Injectable({ providedIn: 'root' })
export class FirestorePreferenciasRepo extends PreferenciasRepository {
  private readonly hogar = inject(HogarActualStore);

  private ref(): DocumentReference {
    return doc(db, 'hogares', this.hogar.requerido(), 'datos', 'preferencias');
  }

  async obtener(): Promise<Preferencias> {
    const snap = await getDoc(this.ref());
    const metas = snap.exists() ? (snap.data()['metas'] as MetasDiarias | undefined) : undefined;
    return { metas: { ...PREFERENCIAS_POR_DEFECTO.metas, ...metas } };
  }

  async guardar(preferencias: Preferencias): Promise<void> {
    // merge: no pisa otros campos que ya existan en el documento.
    await setDoc(this.ref(), { metas: preferencias.metas }, { merge: true });
  }
}
