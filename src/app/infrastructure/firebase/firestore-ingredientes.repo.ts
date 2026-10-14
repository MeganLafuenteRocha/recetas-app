import { Injectable } from '@angular/core';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { db } from './firebase.providers';

/** Límite de Firestore por lote atómico. */
const MAX_POR_LOTE = 500;

@Injectable({ providedIn: 'root' })
export class FirestoreIngredientesRepo extends IngredienteRepository {
  async obtenerTodos(): Promise<Ingrediente[]> {
    const snap = await getDocs(collection(db, 'ingredientes'));
    return snap.docs.map((d) => ({ ...(d.data() as Omit<Ingrediente, 'id'>), id: d.id }));
  }

  async guardarLote(ingredientes: Ingrediente[]): Promise<void> {
    for (let i = 0; i < ingredientes.length; i += MAX_POR_LOTE) {
      const lote = writeBatch(db);
      for (const { id, ...datos } of ingredientes.slice(i, i + MAX_POR_LOTE)) {
        lote.set(doc(db, 'ingredientes', id), datos);
      }
      await lote.commit();
    }
  }
}
