export interface CotizacionReciente {
  idCotizacion: number;
  numeroCotizacion: string;
  familia: string;
  fechaCotizacion: string;
  estado: string;
  clienteNombre: string; 
  total: number | null;
  precioSugerido: number | null;
  versionModelo: string | null;
}

export interface MesData {
  mes: string;
  cotizaciones: number;
  aceptadas: number;
}

export interface FamiliaData {
  familia: string;
  cantidad: number;
}

export interface DashboardStats {
  totalClientes: number;
  totalCotizaciones: number;
  cotizacionesMes: number;
  cotizacionesPendientes: number;
  ingresosProyectados: number;
  precioPromedio: number;
  cotizacionesRecientes: CotizacionReciente[];
  porMes: MesData[];
  porFamilia: FamiliaData[];
}