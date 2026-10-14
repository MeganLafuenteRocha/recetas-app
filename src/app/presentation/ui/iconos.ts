/** Íconos Material Symbols por franja y categoría: una sola fuente para toda la app. */
export const ICONO_FRANJA: Record<string, string> = {
  desayuno: 'coffee',
  sopa: 'soup_kitchen',
  seco: 'dinner_dining',
  postre: 'cake',
};

export const ICONO_CATEGORIA: Record<string, string> = {
  verduras: 'eco',
  frutas: 'nutrition',
  legumbres: 'grain',
  carnes: 'kebab_dining',
  lacteos: 'egg',
  cereales: 'bakery_dining',
  condimentos: 'restaurant',
  abarrotes: 'shopping_bag',
};

export function iconoFranja(codigo: string): string {
  return ICONO_FRANJA[codigo] ?? 'restaurant';
}

export function iconoCategoria(codigo: string): string {
  return ICONO_CATEGORIA[codigo] ?? 'grocery';
}

export const NOMBRE_ROL = {
  esencial: 'Esencial',
  condimento: 'Condimento',
  opcional: 'Opcional',
} as const;

export const NOMBRE_ROL_PLURAL = {
  esencial: 'Esenciales',
  condimento: 'Condimentos',
  opcional: 'Opcionales',
} as const;

/** Solo la primera letra en mayúscula: "Martes, 13 de octubre" (no "13 De Octubre"). */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Lunes 24" con la fecha local. */
export function fechaCorta(fecha: Date): string {
  return capitalizar(fecha.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric' }));
}

export function fechaLarga(fecha: Date): string {
  return capitalizar(fecha.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }));
}

/** Descarga un texto como archivo (respaldo JSON). */
export function descargarArchivo(nombre: string, contenido: string, tipo = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/** 45 → "45 min", 70 → "1 h 10", 120 → "2 h". */
export function duracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}
