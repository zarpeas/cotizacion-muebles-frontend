export type Familia = string;
export const FAMILIAS: string[] = [];

export interface EspesorItem {
  id?: number;
  nombre?: string;
  milimetros: number;
}

export const ESPESORES: EspesorItem[] = [];

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
  divisiones?: number;
  idColor?: number;
  codigoFamilia?: string;
  cantidadCasilleros?: number;
  techoInclinado?: boolean;

  // Campos del wizard que aún se reenvían al backend
  idCliente?: number;
  familia?: string;
  espesor?: string | number;
  nPuertas?: number;
  bandeja?: number;
  markupAplicado?: number;
  descuentoAplicado?: number;
  division?: number;
  trasera?: number;
  puertas?: number;
  cabeza?: number;
  base?: string;

  // Acceso dinámico desde los controles del wizard.
  [key: string]: string | number | boolean | undefined;
}

/** Payload enviado a /confirmar: el backend acepta 1/0 para techo inclinado. */
export interface MuebleConfirmacionInput extends Omit<MuebleInput, 'techoInclinado'> {
  techoInclinado: number;
  /** Valores ya mostrados en el wizard; se guardan tal cual en BD. */
  costoFabricacionUnitario: number;
  precioVentaSugerido: number;
}

export interface PrediccionResponse {
  costoFabricacionUnitario: number;
  precioVentaSugerido: number;
  confianzaR2: number;
  modelo: string;
  aplicaDescuento: boolean;
  descuentoSugeridoMin: number;
  descuentoSugeridoMax: number;
  total?: number;
  mape: number;
  mapeEsperadoPct?: number;
  mapeMedianaPct?: number;
  errorPromedioMape: number;
}

/** Respuesta de /confirmar: devuelve los valores efectivamente guardados. */
export interface CotizacionConfirmada {
  costoFabricacionUnitario: number;
  precioVentaSugerido: number;
  confianzaR2: number;
  modelo: string;
  aplicaDescuento: boolean;
  descuentoSugeridoMin: number;
  descuentoSugeridoMax: number;
  mapeEsperadoPct: number;
  mapeMedianaPct: number;
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
  errorPromedioMape: number;
  cantidadCasilleros: number;
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
  pageable: unknown;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
