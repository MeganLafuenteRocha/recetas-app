export interface Unidad {
  codigo: string;
  nombre: string;
  sinonimos: string[];
}

export interface TipoComida {
  codigo: string; // interno: "seco"
  nombre: string; // visible: "Segundo"
  orden: number;
}

export interface TipoCocina {
  codigo: string;
  nombre: string;
}

export interface Categoria {
  codigo: string;
  nombre: string;
  orden: number;
}

/** catalogos/base: un solo documento con todas las listas fijas. */
export interface Catalogos {
  unidades: Unidad[];
  tiposComida: TipoComida[];
  tiposCocina: TipoCocina[];
  categorias: Categoria[];
}
