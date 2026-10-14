import { EspacioIngrediente, Receta, RolIngrediente } from './receta.model';

/** Datos de prueba compartidos por los tests del dominio. */
export function recetaDePrueba(parcial: Partial<Receta> = {}): Receta {
  return {
    id: 'rec_test',
    activo: true,
    nombre: 'Receta de prueba',
    descripcion: '',
    tipoComida: 'sopa',
    tipoCocina: 'boliviana',
    porciones: 4,
    dificultad: 2,
    imagen: null,
    tiempo: { preparacionMin: 10, coccionMin: 20, totalMin: 30 },
    ingredientes: [],
    preparacion: { descripcion: null, pasos: [] },
    nutricionPorcion: null,
    nutricionConOpcionales: null,
    nutricionCalculadaEn: null,
    ...parcial,
  };
}

export function espacio(rol: RolIngrediente, ...ids: string[]): EspacioIngrediente {
  return {
    orden: 1,
    rol,
    opciones: ids.map((id) => ({ ingredienteId: id, cantidad: 1, unidad: 'u', nota: null })),
  };
}
