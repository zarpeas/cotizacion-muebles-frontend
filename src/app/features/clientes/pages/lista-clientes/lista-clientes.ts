import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Cliente } from '../../models/cliente.model';

type EstadoFiltro = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-clientes.html',
  styleUrls: ['./lista-clientes.css'],
})
export class ListaClientes implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly filtro = signal<string>('');
  readonly estadoFiltro = signal<EstadoFiltro>('todos');

  readonly paginaActual = signal(1);
  readonly tamanoPagina = signal(10);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);

    this.clienteService.listar().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Error al cargar clientes: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  // ============ KPIs ============
  readonly totalClientes = computed(() => this.clientes().length);
  readonly totalActivos = computed(() => this.clientes().filter(c => c.estado).length);
  readonly totalInactivos = computed(() => this.clientes().filter(c => !c.estado).length);

  // ============ Filtros ============
  onFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value.toLowerCase().trim());
    this.paginaActual.set(1);
  }

  onEstadoChange(event: Event): void {
    this.estadoFiltro.set((event.target as HTMLSelectElement).value as EstadoFiltro);
    this.paginaActual.set(1);
  }

  readonly filtrados = computed(() => {
    let lista = this.clientes();
    const q = this.filtro();
    const ef = this.estadoFiltro();

    if (ef === 'activos') lista = lista.filter(c => c.estado);
    if (ef === 'inactivos') lista = lista.filter(c => !c.estado);

    if (!q) return lista;

    return lista.filter(c =>
      c.razonSocial?.toLowerCase().includes(q) ||
      c.rut?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q)
    );
  });

  // ============ Paginación ============
  readonly totalPaginas = computed(() => {
    const total = this.filtrados().length;
    return Math.max(1, Math.ceil(total / this.tamanoPagina()));
  });

  readonly clientesPaginados = computed(() => {
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

  // ============ Helpers ============
  iniciales(razonSocial: string): string {
    if (!razonSocial) return '?';
    const palabras = razonSocial.trim().split(/\s+/).slice(0, 2);
    return palabras.map(p => p.charAt(0).toUpperCase()).join('');
  }

  // ============ Eliminar ============
  async eliminar(cliente: Cliente): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar cliente',
      message: `¿Estás seguro de eliminar a "${cliente.razonSocial}"?`,
    });
    if (!ok) return;

    this.clienteService.eliminar(cliente.idCliente).subscribe({
      next: () => {
        this.toast.success('Cliente eliminado correctamente');
        this.cargar();
      },
      error: (err) => {
        this.toast.error('Error al eliminar: ' + (err?.error?.message ?? err.message));
      },
    });
  }
}