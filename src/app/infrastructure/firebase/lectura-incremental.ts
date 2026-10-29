import {
  CollectionReference,
  DocumentData,
  getDocs,
  getDocsFromCache,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';

/**
 * Lectura incremental de una colección: lo que ya está en la caché del dispositivo no se vuelve
 * a pedir; al servidor solo se le piden los documentos con actualizadoEn posterior a la última vez.
 *
 * - Primera vez en el dispositivo (o caché borrada): lectura completa.
 * - Siguientes: caché (0 lecturas) + consulta de cambios (1 lectura si no hay nada nuevo).
 *
 * Requisitos: cada escritura pone actualizadoEn = serverTimestamp(), y nada se borra de verdad
 * (se archiva con activo:false o eliminada:true), porque un borrado no aparece como "cambio".
 */

const PREFIJO = 'recetas.sync:';

function leerMarca(ruta: string): Timestamp | null {
  try {
    const valor = localStorage.getItem(PREFIJO + ruta);
    return valor === null ? null : Timestamp.fromMillis(Number(valor));
  } catch {
    return null;
  }
}

function guardarMarca(ruta: string, marca: Timestamp): void {
  try {
    localStorage.setItem(PREFIJO + ruta, String(marca.toMillis()));
  } catch {
    // Sin almacenamiento local: la próxima vez será una lectura completa, nada más.
  }
}

/** La marca sale de los datos del servidor (no del reloj del celular, que puede estar mal). */
function marcaMayor(docs: QueryDocumentSnapshot[], desde: Timestamp): Timestamp {
  let mayor = desde;
  for (const d of docs) {
    const t = d.get('actualizadoEn');
    if (t instanceof Timestamp && t.toMillis() > mayor.toMillis()) mayor = t;
  }
  return mayor;
}

export async function leerIncremental(ref: CollectionReference): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const marca = leerMarca(ref.path);
  const cache = marca ? await getDocsFromCache(ref).catch(() => null) : null;

  if (!marca || !cache || cache.empty) {
    const todo = await getDocs(ref);
    if (!todo.metadata.fromCache) guardarMarca(ref.path, marcaMayor(todo.docs, Timestamp.fromMillis(0)));
    return todo.docs;
  }

  const cambios = await getDocs(query(ref, where('actualizadoEn', '>', marca)));
  if (!cambios.metadata.fromCache) guardarMarca(ref.path, marcaMayor(cambios.docs, marca));

  const porId = new Map(cache.docs.map((d) => [d.id, d]));
  for (const d of cambios.docs) porId.set(d.id, d);
  return [...porId.values()];
}
