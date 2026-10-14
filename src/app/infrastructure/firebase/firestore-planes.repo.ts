import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  documentId,
  DocumentData,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { EleccionFranja, PlanDia } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';
import { db } from './firebase.providers';

function aPlan(fecha: string, data: DocumentData): PlanDia {
  return {
    fecha,
    elecciones: (data['elecciones'] as EleccionFranja[]) ?? [],
    creadoEn: data['creadoEn'] instanceof Timestamp ? data['creadoEn'].toDate() : null,
  };
}

@Injectable({ providedIn: 'root' })
export class FirestorePlanesRepo extends PlanRepository {
  async obtenerDia(fecha: string): Promise<PlanDia | null> {
    const snap = await getDoc(doc(db, 'planes', fecha));
    return snap.exists() ? aPlan(fecha, snap.data()) : null;
  }

  async obtenerRango(desde: string, hasta: string): Promise<PlanDia[]> {
    // El id del documento ES la fecha (YYYY-MM-DD), así que se ordena como texto.
    const q = query(
      collection(db, 'planes'),
      where(documentId(), '>=', desde),
      where(documentId(), '<=', hasta),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => aPlan(d.id, d.data()));
  }

  async guardarDia(plan: PlanDia): Promise<void> {
    await setDoc(doc(db, 'planes', plan.fecha), {
      elecciones: plan.elecciones,
      creadoEn: serverTimestamp(),
    });
  }
}
