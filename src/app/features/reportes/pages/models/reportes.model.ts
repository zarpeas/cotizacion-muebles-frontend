export interface KpiData {
  titulo: string;
  valor: string | number;
  variacion: string;
  tendencia: 'up' | 'down';
}

export interface ProductoPersonalizado {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface CaracteristicaSolicitada {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface CotizacionReciente {
  num: string;
  fecha: string;
  cliente: string;
  producto: string;
  monto: number;
  estado: string;
}