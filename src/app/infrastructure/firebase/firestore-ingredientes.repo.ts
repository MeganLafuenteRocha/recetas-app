import { inject, Injectable } from '@angular/core';
import { collection, CollectionReference, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { HogarActualStore } from '../../application/stores/hogar-actual.store';
import { Ambito } from '../../domain/hogares/hogar.model';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { db } from './firebase.providers';
import { leerIncremental } from './lectura-incremental';

/** Límite de Firestore por lote atómico. */
const MAX_POR_LOTE = 500;

/** ingredientes/{id} (comunes) y hogares/{hogarId}/ingredientes/{id} (propios). */
@Injectable({ providedIn: 'root' })
export class FirestoreIngredientesRepo extends IngredienteRepository {
  private readonly hogar = inject(HogarActualStore);

  private coleccion(ambito: Ambito): CollectionReference {
    return ambito === 'comun'
      ? collection(db, 'ingredientes')
      : collection(db, 'hogares', this.hogar.requerido(), 'ingredientes');
  }

  private async leer(ambito: Ambito): Promise<Ingrediente[]> {
    const docs = await leerIncremental(this.coleccion(ambito));
    return docs.map((d) => ({ ...(d.data() as Omit<Ingrediente, 'id' | 'ambito'>), id: d.id, ambito }));
  }

  obtenerComunes(): Promise<Ingrediente[]> {
    return this.leer('comun');
  }

  obtenerPropios(): Promise<Ingrediente[]> {
    return this.leer('hogar');
  }

  async guardarLote(ingredientes: Ingrediente[]): Promise<void> {
    for (let i = 0; i < ingredientes.length; i += MAX_POR_LOTE) {
      const lote = writeBatch(db);
      for (const { id, ambito, ...datos } of ingredientes.slice(i, i + MAX_POR_LOTE)) {
        lote.set(doc(this.coleccion(ambito), id), { ...datos, actualizadoEn: serverTimestamp() });
      }
      await lote.commit();
    }
  }
}
