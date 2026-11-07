import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion';
import { ToastService } from '../../../../shared/services/toast.service';
import { CotizacionResumen } from '../../models/cotizacion.models';

type EstadoFiltro = 'todos' | 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';

@Component({
  selector: 'app-lista-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  styleUrl: './lista-cotizaciones.css',
  templateUrl: './lista-cotizaciones.html',
})
export class ListaCotizaciones implements OnInit {
  private readonly cotizacionService = inject(CotizacionService);
  private readonly toast = inject(ToastService);

  // ============ ESTADO PRINCIPAL ============
  readonly cotizaciones = signal<CotizacionResumen[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  // ============ FILTROS ============
  readonly filtro = signal<string>('');
  readonly estadoFiltro = signal<EstadoFiltro>('todos');
  readonly familiaFiltro = signal<string>('todas');

  // ============ PAGINACIÓN ============
  readonly paginaActual = signal(1);
  readonly tamanoPagina = signal(10);

  // ============ MODAL DE CANCELACIÓN ============
  readonly showCancelModal = signal(false);
  readonly cancelMotivo = signal('');
  readonly cotizacionACancelar = signal<CotizacionResumen | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.cotizacionService.listar().subscribe({
      next: (data) => {
        this.cotizaciones.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar cotizaciones: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  // ============ KPIs ============
  readonly totalCotizaciones = computed(() =>
    this.cotizaciones().filter(c => c.estado?.toLowerCase() !== 'cancelada').length);

  readonly totalAprobadas = computed(() =>
    this.cotizaciones().filter(c => c.estado?.toLowerCase() === 'aceptada').length);

  readonly totalPendientes = computed(() =>
    this.cotizaciones().filter(c => c.estado?.toLowerCase() === 'pendiente').length);

  readonly totalCanceladas = computed(() =>
    this.cotizaciones().filter(c => c.estado?.toLowerCase() === 'cancelada').length);

  // ============ Familias disponibles ============
  readonly familias = computed(() => {
    const set = new Set(
      this.cotizaciones()
        .map(c => c.productoFamilia)
        .filter((f): f is string => !!f)
    );
    return Array.from(set).sort();
  });

  // ============ Filtros ============
  onFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value.toLowerCase().trim());
    this.paginaActual.set(1);
  }

  onEstadoChange(event: Event): void {
    this.estadoFiltro.set((event.target as HTMLSelectElement).value as EstadoFiltro);
    this.paginaActual.set(1);
  }

  onFamiliaChange(event: Event): void {
    this.familiaFiltro.set((event.target as HTMLSelectElement).value);
    this.paginaActual.set(1);
  }

  readonly filtrados = computed(() => {
    let lista = this.cotizaciones();
    const q = this.filtro();
    const ef = this.estadoFiltro();
    const ff = this.familiaFiltro();

    if (ef !== 'todos') {
      lista = lista.filter(c => c.estado?.toLowerCase() === ef);
    }
    if (ff !== 'todas') {
      lista = lista.filter(c => c.productoFamilia === ff);
    }
    if (!q) return lista;

    return lista.filter(c =>
      c.numeroCotizacion?.toLowerCase().includes(q) ||
      c.clienteNombre?.toLowerCase().includes(q) ||
      c.productoFamilia?.toLowerCase().includes(q)
    );
  });

  // ============ Paginación ============
  readonly totalPaginas = computed(() => {
    const total = this.filtrados().length;
    return Math.max(1, Math.ceil(total / this.tamanoPagina()));
  });

  readonly cotizacionesPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina();
    return this.filtrados().slice(inicio, inicio + this.tamanoPagina());
  });

  readonly rangoMostrado = computed(() => {
    const total = this.filtrados().length;
    if (total === 0) return { inicio: 0, fin: 0, total: 0 };
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina() + 1;
    const fin = Math.min(this.paginaActual() * this.tamanoPagina(), total);
    return { inicio, fin, total };
  });

  readonly paginas = computed<(number | string)[]>(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const rango = 2;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const resultado: (number | string)[] = [];
    const inicio = Math.max(2, actual - rango);
    const fin = Math.min(total - 1, actual + rango);

    resultado.push(1);
    if (inicio > 2) resultado.push('...');
    for (let i = inicio; i <= fin; i++) resultado.push(i);
    if (fin < total - 1) resultado.push('...');
    resultado.push(total);

    return resultado;
  });

  irA(p: number | string): void {
    if (p === '...') return;
    const pagina = p as number;
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    if (pagina === this.paginaActual()) return;
    this.paginaActual.set(pagina);
  }

  anterior(): void {
    if (this.paginaActual() > 1) this.paginaActual.set(this.paginaActual() - 1);
  }

  siguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }

  
  iniciales(nombre: string | null | undefined): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(/\s+/).slice(0, 2);
    return palabras.map(p => p.charAt(0).toUpperCase()).join('');
  }

  estadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'badge-pendiente';
      case 'aceptada':  return 'badge-aceptada';
      case 'rechazada': return 'badge-rechazada';
      case 'cancelada': return 'badge-cancelada';
      default:          return 'badge-default';
    }
  }

  // ============ Modal de Cancelación ============
  abrirModalCancelar(c: CotizacionResumen, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.cotizacionACancelar.set(c);
    this.cancelMotivo.set(''); 
    this.showCancelModal.set(true);
  }

  cerrarModalCancelar(): void {
    this.showCancelModal.set(false);
    this.cotizacionACancelar.set(null);
    this.cancelMotivo.set('');
  }

  confirmarCancelacion(): void {
    const c = this.cotizacionACancelar();
    if (!c) return;

    if (!this.cancelMotivo().trim()) {
      this.toast.error('Debes ingresar un motivo para cancelar.');
      return;
    }

    this.cotizacionService.cancelar(c.idCotizacion, this.cancelMotivo()).subscribe({
      next: () => {
        this.toast.success('Cotización cancelada correctamente');
        this.cerrarModalCancelar();
        this.cargar(); 
      },
      error: (err) => {
        this.toast.error('Error al cancelar: ' + (err?.error?.message ?? err.message));
      },
    });
  }
}