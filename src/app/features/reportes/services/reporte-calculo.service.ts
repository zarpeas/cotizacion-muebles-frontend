import { Injectable } from '@angular/core';
import { CotizacionResumen } from '../../cotizaciones/models/cotizacion.models';
import {
  Comparativa,
  DeltaInfo,
  FiltrosReporte,
  MetricaDelta,
  VentanaPeriodo,
} from '../models/reporte-calculo.model';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Cálculos del módulo de reportes: ventanas de fecha, filtros, deltas y textos.
 * El componente solo orquesta llamadas y dibuja los gráficos.
 */
@Injectable({ providedIn: 'root' })
export class ReporteCalculoService {
  /** Número de meses del periodo seleccionado. */
  mesesPeriodo(periodo: string): number {
    if (periodo === 'Último año') return 12;
    if (periodo === 'Últimos 6 meses') return 6;
    return 3;
  }

  /** Rango en formato largo que muestra el subtítulo del mockup. */
  rangoTexto(periodo: string): string {
    const meses = this.mesesPeriodo(periodo);
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1);
    const formato = (d: Date) =>
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      MESES[d.getMonth()].toLowerCase() +
      ' ' +
      d.getFullYear();
    return `${formato(inicio)} – ${formato(hoy)}`;
  }

  /** Traduce los textos de los selects a los valores que espera el backend. */
  filtrosBackend(estado: string, familia: string, periodo: string): FiltrosReporte {
    return {
      estado: this.estadoBackend(estado),
      familia: familia === 'Todas las familias' ? '' : familia,
      periodo: this.periodoBackend(periodo),
    };
  }

  /** Filtra el histórico por estado y familia (la fecha se aplica aparte). */
  filtrar(cotizaciones: CotizacionResumen[], estado: string, familia: string): CotizacionResumen[] {
    const estadoDb = this.estadoBackend(estado);
    return cotizaciones.filter((c) => {
      if (estadoDb && (c.estado || '').toUpperCase() !== estadoDb) return false;
      if (familia !== 'Todas las familias' && c.productoFamilia !== familia) return false;
      return true;
    });
  }

  /** Valores actual y del mismo periodo del año anterior para una métrica. */
  comparativa(
    cotizaciones: CotizacionResumen[],
    estado: string,
    familia: string,
    periodo: string,
    tipo: MetricaDelta,
  ): Comparativa {
    const { hoy, inicio, inicioAnterior, finAnterior } = this.ventanas(periodo);
    const datos = this.filtrar(cotizaciones, estado, familia);

    const dentro = (c: CotizacionResumen, desde: Date, hasta: Date) => {
      const f = new Date(c.fechaCotizacion);
      return f >= desde && f <= hasta;
    };

    const conteo = (desde: Date, hasta: Date) => {
      const fila = datos.filter((c) => dentro(c, desde, hasta));
      if (tipo === 'total') return fila.length;
      if (tipo === 'aprobadas')
        return fila.filter((c) => (c.estado || '').toUpperCase() === 'APROBADO').length;
      if (tipo === 'rechazadas')
        return fila.filter((c) => (c.estado || '').toUpperCase() === 'RECHAZADA').length;
      // Misma fórmula que el backend: aprobadas / total de cotizaciones del periodo.
      const aprobadas = fila.filter((c) => (c.estado || '').toUpperCase() === 'APROBADO').length;
      return fila.length ? (aprobadas / fila.length) * 100 : 0;
    };

    return { actual: conteo(inicio, hoy), anterior: conteo(inicioAnterior, finAnterior) };
  }

  /** Texto y color del delta contra el mismo periodo del año anterior. */
  delta(
    cotizaciones: CotizacionResumen[],
    estado: string,
    familia: string,
    periodo: string,
    tipo: MetricaDelta,
  ): DeltaInfo {
    const { actual, anterior } = this.comparativa(cotizaciones, estado, familia, periodo, tipo);
    const esPorcentaje = tipo === 'conversion';
    const diferencia = actual - anterior;

    if (esPorcentaje) {
      if (Math.abs(diferencia) < 0.05) return { texto: '→ 0 p.p.', clase: 'flat' };
      const valor = Math.min(100, Math.abs(diferencia)).toFixed(1);
      return {
        texto: (diferencia > 0 ? '↑ ' : '↓ ') + valor + ' p.p.',
        clase: diferencia < 0 ? 'bad' : 'up',
      };
    }

    if (!anterior) {
      return actual ? { texto: '↑ nuevo', clase: 'up' } : { texto: '→ 0%', clase: 'flat' };
    }
    const porcentaje = ((diferencia / anterior) * 100).toFixed(0);
    if (Math.abs(Number(porcentaje)) < 0.5) return { texto: '→ 0%', clase: 'flat' };
    const esRechazada = tipo === 'rechazadas';
    const esMalo = esRechazada ? Number(porcentaje) > 0 : Number(porcentaje) < 0;
    const valor = Math.min(100, Math.abs(Number(porcentaje)));
    return {
      texto: (diferencia > 0 ? '↑ ' : '↓ ') + valor + '%',
      clase: esMalo ? 'bad' : 'up',
    };
  }

  private estadoBackend(estado: string): string {
    const e = (estado ?? '').trim().toUpperCase();
    return e === 'APROBADO' || e === 'PENDIENTE' || e === 'RECHAZADA' ? e : '';
  }

  private periodoBackend(periodo: string): string {
    if (periodo === 'Últimos 6 meses') return '6m';
    if (periodo === 'Último año') return 'anio';
    return '3m';
  }

  /** Ventana actual y su equivalente del año anterior (mismos meses, un año atrás). */
  private ventanas(periodo: string): VentanaPeriodo {
    const hoy = new Date();
    const inicio = new Date(
      hoy.getFullYear(),
      hoy.getMonth() - (this.mesesPeriodo(periodo) - 1),
      1,
    );
    const inicioAnterior = new Date(inicio);
    inicioAnterior.setFullYear(inicioAnterior.getFullYear() - 1);
    const finAnterior = new Date(hoy);
    finAnterior.setFullYear(finAnterior.getFullYear() - 1);
    return { hoy, inicio, inicioAnterior, finAnterior };
  }
}
