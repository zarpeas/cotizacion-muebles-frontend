import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common'; // Agregamos DatePipe
import { BaseChartDirective } from 'ng2-charts';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class Reportes implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly stats = signal<any>(null);
  readonly cargando = signal(true);

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
    this.aplicarFiltros();
  }

  cargarDatos(estado?: string, familia?: string, periodo?: string): void {
    this.cargando.set(true);
    this.reporteService.obtenerReporte(estado, familia, periodo).subscribe({
      next: (data) => {
        this.stats.set(data);

        // Gráfico de Barras
        this.barChartData.set({
          labels: data.porMes.map((m: any) => m.mes),
          datasets: [
            {
              data: data.porMes.map((m: any) => m.ganadas),
              label: 'Ganadas',
              backgroundColor: '#c8102e',
              borderRadius: 4,
              barPercentage: 0.6,
            },
            {
              data: data.porMes.map((m: any) => m.rechazadas),
              label: 'Rechazadas',
              backgroundColor: '#ffb8c4',
              borderRadius: 4,
              barPercentage: 0.6,
            },
          ],
        });

        // Gráfico Dona
        this.doughnutChartData.set({
          labels: data.motivosRechazo.map((m: any) => m.motivo),
          datasets: [
            {
              data: data.motivosRechazo.map((m: any) => m.cantidad),
              backgroundColor: ['#c8102e', '#e8506a', '#f08a9b', '#b9b4c9', '#e4e9f6'],
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

  getBadgeClass(estado: string): string {
    const e = estado?.toUpperCase();
    if (e === 'APROBADO' || e === 'ACEPTADA') return 'badge-verde';
    if (e === 'PENDIENTE') return 'badge-naranja';
    if (e === 'RECHAZADA' || e === 'CANCELADA') return 'badge-rojo'; // 👈 Nuevo color
    return 'badge-default';
  }
  aplicarFiltros(): void {
    // Mapear los textos del select a los valores que espera el backend
    let estadoFiltro = '';
    if (this.estadoSeleccionado === 'Aprobado') estadoFiltro = 'APROBADO';
    else if (this.estadoSeleccionado === 'Pendiente') estadoFiltro = 'PENDIENTE';
    else if (this.estadoSeleccionado === 'Rechazada') estadoFiltro = 'RECHAZADA';

    let familiaFiltro = '';
    if (this.familiaSeleccionada !== 'Todas las familias') {
      familiaFiltro = this.familiaSeleccionada;
    }

    let periodoFiltro = '3m';
    if (this.periodoSeleccionado === 'Últimos 6 meses') periodoFiltro = '6m';
    else if (this.periodoSeleccionado === 'Este año') periodoFiltro = 'anio';

    this.cargarDatos(estadoFiltro, familiaFiltro, periodoFiltro);
  }
}
