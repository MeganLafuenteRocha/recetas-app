import { ListaCompra } from './lista.model';

export abstract class ListaRepository {
  /** Se lee al abrir la sección (no en la carga inicial): pocas listas, pocas veces. */
  abstract obtenerTodas(): Promise<ListaCompra[]>;
  abstract guardar(lista: ListaCompra): Promise<void>;
  abstract eliminar(id: string): Promise<void>;
}
