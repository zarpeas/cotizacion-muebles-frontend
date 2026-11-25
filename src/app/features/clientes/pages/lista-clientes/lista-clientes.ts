import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ClienteService } from '../../services/cliente';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { iniciales } from '../../../../shared/utils/estado.utils';
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
  private readonly auth = inject(AuthService);

  readonly esAdmin = this.auth.isAdmin;

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly filtro = signal<string>('');
  readonly estadoFiltro = signal<EstadoFiltro>(this.esAdmin() ? 'todos' : 'activos');

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
  readonly totalActivos = computed(() => this.clientes().filter((c) => c.estado).length);
  readonly totalInactivos = computed(() => this.clientes().filter((c) => !c.estado).length);

  // ============ Filtros ============
  onFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value.toLowerCase().trim());
    this.paginaActual.set(1);
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const valor = select.value as EstadoFiltro;
    // El asesor solo ve activos, aunque manipule el select.
    if (!this.esAdmin() && valor !== 'activos') {
      select.value = 'activos';
      this.estadoFiltro.set('activos');
      this.paginaActual.set(1);
      return;
    }
    this.estadoFiltro.set(valor);
    this.paginaActual.set(1);
  }

  readonly filtrados = computed(() => {
    let lista = this.clientes();
    const q = this.filtro();
    // El asesor no tiene selector de estado: siempre se filtra por activos.
    const ef: EstadoFiltro = this.esAdmin() ? this.estadoFiltro() : 'activos';

    if (ef === 'activos') lista = lista.filter((c) => c.estado);
    if (ef === 'inactivos') lista = lista.filter((c) => !c.estado);

    if (!q) return lista;

    return lista.filter(
      (c) =>
        c.razonSocial?.toLowerCase().includes(q) ||
        c.rut?.toLowerCase().includes(q) ||
        c.correo?.toLowerCase().includes(q) ||
        c.ciudad?.toLowerCase().includes(q),
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
  readonly iniciales = iniciales;

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
