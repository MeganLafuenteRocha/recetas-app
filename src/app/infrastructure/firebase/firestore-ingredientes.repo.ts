import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestoreIngredientesRepo extends IngredienteRepository {
  async obtenerTodos(): Promise<Ingrediente[]> {
    const snap = await getDocs(collection(db, 'ingredientes'));
    return snap.docs.map((d) => ({ ...(d.data() as Omit<Ingrediente, 'id'>), id: d.id }));
  }
}
