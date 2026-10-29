import { Injectable } from '@angular/core';
import { collection, doc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Hogar } from '../../domain/hogares/hogar.model';
import { HogarRepository } from '../../domain/hogares/hogar.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestoreHogaresRepo extends HogarRepository {
  async obtenerTodos(): Promise<Hogar[]> {
    const snap = await getDocs(collection(db, 'hogares'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nombre: (data['nombre'] as string) ?? d.id,
        creadoEn: data['creadoEn'] instanceof Timestamp ? data['creadoEn'].toDate() : null,
      };
    });
  }

  async crear(hogar: Hogar): Promise<void> {
    await setDoc(doc(db, 'hogares', hogar.id), { nombre: hogar.nombre, creadoEn: serverTimestamp() });
  }
}
