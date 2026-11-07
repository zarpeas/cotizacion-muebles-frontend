import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService } from '../dashboard/service/dashboard.service';
import { DashboardStats } from '../dashboard/models/dashboard.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly nombreAsesor = computed(() => {
    const u = this.authService.user();
    return u?.nombres || u?.username || 'Asesor';
  });

  // ============ CHART: Evolución mensual ============
  readonly barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      { data: [], label: 'Cotizaciones', backgroundColor: '#c8102e', borderRadius: 8, barPercentage: 0.7 },
      { data: [], label: 'Aceptadas',    backgroundColor: '#ffb8c4', borderRadius: 8, barPercentage: 0.7 },
    ],
  });

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, font: { size: 11 } } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  // ============ CHART: Distribución por familia ============
  readonly doughnutData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#c8102e', '#4a5fd5', '#c67700', '#1a7f4b', '#a0a0a8', '#8b5cf6', '#f59e0b'],
      borderWidth: 0,
    }],
  });

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
    },
  };

  ngOnInit(): void {
    this.dashboardService.stats().subscribe({
      next: (data) => {
        this.stats.set(data);

        // Alimentar gráfico de barras
        this.barChartData.set({
          labels: data.porMes.map(m => m.mes),
          datasets: [
            { data: data.porMes.map(m => m.cotizaciones), label: 'Cotizaciones', backgroundColor: '#c8102e', borderRadius: 8, barPercentage: 0.7 },
            { data: data.porMes.map(m => m.aceptadas), label: 'Aceptadas', backgroundColor: '#ffb8c4', borderRadius: 8, barPercentage: 0.7 },
          ],
        });

        // Alimentar doughnut
        this.doughnutData.set({
          labels: data.porFamilia.map(f => f.familia),
          datasets: [{
            data: data.porFamilia.map(f => f.cantidad),
            backgroundColor: ['#c8102e', '#4a5fd5', '#c67700', '#1a7f4b', '#a0a0a8', '#8b5cf6', '#f59e0b'],
            borderWidth: 0,
          }],
        });

        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar estadísticas: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  colorEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'badge-pendiente';
      case 'aceptada':  return 'badge-aceptada';
      case 'rechazada': return 'badge-rechazada';
      default:          return 'badge-default';
    }
  }
}