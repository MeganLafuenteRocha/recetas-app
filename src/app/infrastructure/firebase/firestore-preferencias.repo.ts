import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  MetasDiarias,
  Preferencias,
  PREFERENCIAS_POR_DEFECTO,
} from '../../domain/preferencias/preferencias.model';
import { PreferenciasRepository } from '../../domain/preferencias/preferencias.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestorePreferenciasRepo extends PreferenciasRepository {
  async obtener(): Promise<Preferencias> {
    const snap = await getDoc(doc(db, 'config', 'usuario'));
    const metas = snap.exists() ? (snap.data()['metas'] as MetasDiarias | undefined) : undefined;
    return { metas: { ...PREFERENCIAS_POR_DEFECTO.metas, ...metas } };
  }

  async guardar(preferencias: Preferencias): Promise<void> {
    // merge: no pisa otros campos que ya existan en config/usuario.
    await setDoc(doc(db, 'config', 'usuario'), { metas: preferencias.metas }, { merge: true });
  }
}
