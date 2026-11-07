
export type Familia = string;
export const FAMILIAS: any[] = []; 
export const ESPESORES: any[] = [];


export interface MuebleInput {
  // Del backend original
  idCategoriaProducto?: number;
  idBase?: number;
  idCerradura?: number;
  idTipoPuerta?: number;
  idEspesor?: number;
  alto?: number;
  ancho?: number;
  fondo?: number;
  cantidad?: number;
  cantidadPuertas?: number;
  cantidadBandejas?: number;
  kgTotal?: number;
  divisiones?: number;
  idColor?: number;
  codigoFamilia?: string;

  // Del wizard
  idCliente?: number;
  familia?: string;
  espesor?: any;
  nPuertas?: number;
  bandeja?: number;
  markupAplicado?: number;
  descuentoAplicado?: number;
  division?: number;
  trasera?: number;
  puertas?: number;
  cabeza?: number;
  base?: any;
  

  techoInclinado?: any; 

 
  [key: string]: any; 
}

export interface PrediccionResponse {
  costoFabricacionUnitario: number;
  precioVentaSugerido: number;
  confianzaR2: number;
  modelo: string;
  aplicaDescuento: boolean;
  descuentoSugeridoMin: number;
  descuentoSugeridoMax: number;
  total?: number; // Usado en el wizard
}

export interface CotizacionConfirmada {
  idCotizacion: number;
  numeroCotizacion: string;
  prediccion?: any; // Usado en el wizard
}


export interface CotizacionDetalle {
  idCotizacion: number;
  numeroCotizacion: string;
  fechaCotizacion: string;
  estado: string;
  observaciones: string | null;
  clienteRazonSocial: string;
  clienteRut: string;
  clienteCorreo: string;
  clienteTelefono: string;
  categoria: string;
  cantidad: number;
  altoCm: number;
  anchoCm: number;
  fondoCm: number;
  espesor: string;
  color: string;
  cerradura: string;
  base: string;
  tipoPuerta: string;
  cantidadPuertas: number;
  cantidadBandejas: number;
  techoInclinado: boolean;
  costoFabricacion: number;
  markupAplicado: number;
  confianzaMl: number;
  precioVentaSugerido: number;
  montoTotal: number;
}


export interface CotizacionResumen {
  idCotizacion: number;
  numeroCotizacion: string;
  fechaCotizacion: string;
  clienteNombre: string;
  productoFamilia: string;
  montoTotal: number;
  estado: string;
  motivo: string | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}