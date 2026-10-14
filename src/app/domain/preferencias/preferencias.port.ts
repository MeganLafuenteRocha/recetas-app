import { Preferencias } from './preferencias.model';

export abstract class PreferenciasRepository {
  /** Devuelve las preferencias guardadas, o las por defecto si aún no hay. */
  abstract obtener(): Promise<Preferencias>;
  abstract guardar(preferencias: Preferencias): Promise<void>;
}
