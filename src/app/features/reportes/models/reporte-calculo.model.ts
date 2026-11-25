/** Tipos compartidos entre el componente de reportes y su servicio de cálculo. */

export type MetricaDelta = 'total' | 'aprobadas' | 'rechazadas' | 'conversion';
export type ClaseDelta = 'up' | 'bad' | 'flat';

export interface VentanaPeriodo {
  hoy: Date;
  inicio: Date;
  inicioAnterior: Date;
  finAnterior: Date;
}

export interface Comparativa {
  actual: number;
  anterior: number;
}

export interface DeltaInfo {
  texto: string;
  clase: ClaseDelta;
}

export interface FiltrosReporte {
  estado: string;
  familia: string;
  periodo: string;
}

/** Paleta de la dona de motivos y de la lista de motivos. */
export const COLORES_MOTIVOS: string[] = ['#c8102e', '#e8506a', '#f08a9b', '#b9b4c9', '#e4e9f6'];

/** Respuesta de `/api/reportes`, alineada con `ReportesDTO` del backend. */
export interface ReportesDTO {
  totalCotizaciones: number;
  totalAprobadas: number;
  totalRechazadas: number;
  tasaConversion: number;
  porMes: MesReporte[];
  motivosRechazo: MotivoRechazo[];
  productosMasPersonalizados: RankingItem[];
  caracteristicasMasSolicitadas: RankingItem[];
  ultimasCotizaciones: CotizacionRecienteReporte[];
}

export interface MesReporte {
  mes: string;
  ganadas: number;
  rechazadas: number;
}

export interface MotivoRechazo {
  motivo: string;
  cantidad: number;
  porcentaje: number;
}

export interface RankingItem {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface CotizacionRecienteReporte {
  idCotizacion: number;
  numeroCotizacion: string;
  fechaCotizacion: string;
  clienteNombre: string;
  estado: string;
  familia: string;
  total: number;
  motivo: string | null;
}
