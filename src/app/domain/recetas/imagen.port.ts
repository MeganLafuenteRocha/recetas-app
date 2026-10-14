/**
 * Fotos de recetas. MVP: se guardan en el dispositivo (no en la nube),
 * y la receta solo guarda la clave "local:<id>". Cambiar a Storage = otro adaptador.
 */
export abstract class ImagenRepository {
  /** Guarda (reducida) y devuelve la clave a poner en receta.imagen. */
  abstract guardar(recetaId: string, archivo: Blob): Promise<string>;
  /** URL lista para <img>, o null si no está en este dispositivo. */
  abstract obtenerUrl(clave: string): Promise<string | null>;
}

export const PREFIJO_LOCAL = 'local:';
