import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { ReporteCalculoService } from '../../services/reporte-calculo.service';
import { CotizacionService } from '../../../cotizaciones/services/cotizacion';
import { CotizacionResumen } from '../../../cotizaciones/models/cotizacion.models';
import { COLORES_MOTIVOS, MetricaDelta, ReportesDTO } from '../../models/reporte-calculo.model';
import {
  claseEstado as claseEstadoUtil,
  formatoEstado as formatoEstadoUtil,
} from '../../../../shared/utils/estado.utils';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class Reportes implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly cotizacionService = inject(CotizacionService);
  private readonly calculo = inject(ReporteCalculoService);

  readonly stats = signal<ReportesDTO | null>(null);
  readonly cargando = signal(true);

  /** Todas las cotizaciones (sin filtrar por periodo) para calcular los deltas vs. el año pasado. */
  private readonly todasCotizaciones = signal<CotizacionResumen[]>([]);

  /** Misma paleta para la dona y los puntos de la lista de motivos. */
  readonly coloresMotivos = COLORES_MOTIVOS;

  colorMotivo(indice: number): string {
    return this.coloresMotivos[indice % this.coloresMotivos.length];
  }

  // Datos de gráficos
  public barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  public doughnutChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  };
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false } },
  };

  // Filtros
  periodoSeleccionado = 'Últimos 3 meses';
  estadoSeleccionado = 'Todos los estados';
  familiaSeleccionada = 'Todas las familias';

  ngOnInit(): void {
    // El backend de reportes no expone el histórico completo; lo pedimos al listado
    // de cotizaciones para comparar el periodo actual contra el mismo periodo del año anterior.
    this.cotizacionService.listar().subscribe({
      next: (data) => this.todasCotizaciones.set(data ?? []),
      error: (err) => console.error('Error al cargar histórico para deltas', err),
    });
    this.aplicarFiltros();
  }

  cargarDatos(estado?: string, familia?: string, periodo?: string): void {
    this.cargando.set(true);
    this.reporteService.obtenerReporte(estado, familia, periodo).subscribe({
      next: (data) => {
        this.stats.set(data);

        // Gráfico de Barras
        this.barChartData.set({
          labels: data.porMes.map((m) => m.mes),
          datasets: [
            {
              data: data.porMes.map((m) => m.ganadas),
              label: 'Ganadas',
              backgroundColor: '#c8102e',
              borderRadius: 4,
              barPercentage: 0.6,
            },
            {
              data: data.porMes.map((m) => m.rechazadas),
              label: 'Rechazadas',
              backgroundColor: '#ffb8c4',
              borderRadius: 4,
              barPercentage: 0.6,
            },
          ],
        });

        // Gráfico Dona
        this.doughnutChartData.set({
          labels: data.motivosRechazo.map((m) => m.motivo),
          datasets: [
            {
              data: data.motivosRechazo.map((m) => m.cantidad),
              backgroundColor: this.coloresMotivos,
              borderWidth: 0,
            },
          ],
        });

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reportes', err);
        this.cargando.set(false);
      },
    });
  }

  /** Delega el formato al helper compartido. */
  formatoEstado(estado: string): string {
    return formatoEstadoUtil(estado);
  }

  getBadgeClass(estado: string): string {
    return claseEstadoUtil(estado, 'reporte');
  }

  /** Rango en formato largo que muestra el subtítulo del mockup. */
  rangoTexto(): string {
    return this.calculo.rangoTexto(this.periodoSeleccionado);
  }

  aplicarFiltros(): void {
    const filtros = this.calculo.filtrosBackend(
      this.estadoSeleccionado,
      this.familiaSeleccionada,
      this.periodoSeleccionado,
    );
    this.cargarDatos(filtros.estado, filtros.familia, filtros.periodo);
  }

  /** Texto del delta con flecha arriba/abajo, igual al mockup. */
  delta(tipo: MetricaDelta): string {
    return this.calculo.delta(
      this.todasCotizaciones(),
      this.estadoSeleccionado,
      this.familiaSeleccionada,
      this.periodoSeleccionado,
      tipo,
    ).texto;
  }

  /** Clase de color del delta: verde/rojo según si la variación es buena o mala. */
  deltaClass(tipo: MetricaDelta): string {
    return this.calculo.delta(
      this.todasCotizaciones(),
      this.estadoSeleccionado,
      this.familiaSeleccionada,
      this.periodoSeleccionado,
      tipo,
    ).clase;
  }
}
