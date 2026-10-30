import { Injectable } from '@angular/core';
import { collection, doc, DocumentData, getDoc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Hogar } from '../../domain/hogares/hogar.model';
import { HogarRepository } from '../../domain/hogares/hogar.port';
import { db } from './firebase.providers';

function aHogar(id: string, data: DocumentData): Hogar {
  return {
    id,
    nombre: (data['nombre'] as string) ?? id,
    creadoEn: data['creadoEn'] instanceof Timestamp ? data['creadoEn'].toDate() : null,
  };
}

@Injectable({ providedIn: 'root' })
export class FirestoreHogaresRepo extends HogarRepository {
  async obtener(id: string): Promise<Hogar | null> {
    const snap = await getDoc(doc(db, 'hogares', id));
    return snap.exists() ? aHogar(snap.id, snap.data()) : null;
  }

  async obtenerTodos(): Promise<Hogar[]> {
    const snap = await getDocs(collection(db, 'hogares'));
    return snap.docs.map((d) => aHogar(d.id, d.data()));
  }

  async crear(hogar: Hogar): Promise<void> {
    await setDoc(doc(db, 'hogares', hogar.id), { nombre: hogar.nombre, creadoEn: serverTimestamp() });
  }
}
