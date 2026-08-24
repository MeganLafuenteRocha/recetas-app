import { Injectable } from '@angular/core';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { EleccionFranja, PlanDia } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestorePlanesRepo extends PlanRepository {
  async obtenerDia(fecha: string): Promise<PlanDia | null> {
    const snap = await getDoc(doc(db, 'planes', fecha));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      fecha,
      elecciones: (data['elecciones'] as EleccionFranja[]) ?? [],
      creadoEn: data['creadoEn'] instanceof Timestamp ? data['creadoEn'].toDate() : null,
    };
  }

  async guardarDia(plan: PlanDia): Promise<void> {
    await setDoc(doc(db, 'planes', plan.fecha), {
      elecciones: plan.elecciones,
      creadoEn: serverTimestamp(),
    });
  }
}
