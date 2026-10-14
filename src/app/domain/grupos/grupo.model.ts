/** grupos/{id}: colecciones de recetas que arma la administradora ("Para visitas"). */
export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string;
  /** Nombre de un Material Symbol. */
  icono: string;
  recetaIds: string[];
}

export const ICONOS_GRUPO = ['groups', 'favorite', 'celebration', 'eco', 'timer', 'savings', 'child_care', 'local_fire_department'];

export function grupoNuevo(id: string, nombre: string, descripcion = '', icono = 'groups'): Grupo {
  return { id, nombre: nombre.trim(), descripcion: descripcion.trim(), icono, recetaIds: [] };
}

export function alternarReceta(grupo: Grupo, recetaId: string): Grupo {
  const esta = grupo.recetaIds.includes(recetaId);
  return {
    ...grupo,
    recetaIds: esta ? grupo.recetaIds.filter((id) => id !== recetaId) : [...grupo.recetaIds, recetaId],
  };
}

export function validarGrupo(grupo: Grupo): string | null {
  return grupo.nombre.trim().length < 2 ? 'Ponle un nombre al grupo.' : null;
}
