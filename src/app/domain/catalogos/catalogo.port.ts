import { ReferenciasNutricionales } from '../nutricion/nutricion.model';
import { Catalogos } from './catalogo.model';

export abstract class CatalogoRepository {
  abstract obtenerCatalogos(): Promise<Catalogos>;
  abstract obtenerReferencias(): Promise<ReferenciasNutricionales>;
}
