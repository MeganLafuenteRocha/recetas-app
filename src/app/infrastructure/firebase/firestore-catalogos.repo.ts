import { Injectable } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { Catalogos } from '../../domain/catalogos/catalogo.model';
import { CatalogoRepository } from '../../domain/catalogos/catalogo.port';
import { ReferenciasNutricionales } from '../../domain/nutricion/nutricion.model';
import { db } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class FirestoreCatalogosRepo extends CatalogoRepository {
  async obtenerCatalogos(): Promise<Catalogos> {
    const snap = await getDoc(doc(db, 'catalogos', 'base'));
    if (!snap.exists()) throw new Error('Falta el documento catalogos/base (seed).');
    return snap.data() as Catalogos;
  }

  async obtenerReferencias(): Promise<ReferenciasNutricionales> {
    const snap = await getDoc(doc(db, 'config', 'referencias'));
    if (!snap.exists()) throw new Error('Falta el documento config/referencias (seed).');
    return snap.data() as ReferenciasNutricionales;
  }
}
