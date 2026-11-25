import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion';
import { ToastService } from '../../../../shared/services/toast.service';
import { CotizacionDetalle } from '../../models/cotizacion.models';
import { mensajeError } from '../../../../shared/utils/error.utils';
import {
  claseEstado,
  formatoEstado as formatoEstadoUtil,
} from '../../../../shared/utils/estado.utils';

// ==========================================
// COMPONENTE
// ==========================================

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './detalle-cotizacion.html',
  styleUrl: './detalle-cotizacion.css',
})
export class DetalleCotizacion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cotizacionService = inject(CotizacionService);
  private readonly toast = inject(ToastService);

  readonly cotizacion = signal<CotizacionDetalle | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly showCancelModal = signal(false);
  readonly cancelMotivo = signal('');

  // Reestimación manual (solo cotizaciones pendientes)
  readonly showEditarModal = signal(false);
  readonly costoEditado = signal<number | null>(null);
  readonly guardandoEstimacion = signal(false);

  readonly puedeEditarEstimacion = computed(
    () => this.cotizacion()?.estado?.toLowerCase() === 'pendiente',
  );

  readonly precioCalculado = computed(() => {
    const costo = this.costoEditado();
    const markup = Number(this.cotizacion()?.markupAplicado ?? 0);
    if (costo === null || !Number.isFinite(costo) || markup <= 0) return null;
    return Math.round(costo * markup);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(Number(id));
    } else {
      this.router.navigate(['/cotizaciones']);
    }
  }

  cargarDetalle(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.cerrarEdicionEstimacion();
    this.cotizacionService.obtener(id).subscribe({
      next: (data) => {
        this.cotizacion.set(data);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set('No se pudo cargar la cotización. ' + mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/cotizaciones']);
  }

  readonly formatoEstado = formatoEstadoUtil;
  readonly estadoClass = (estado: string): string => claseEstado(estado);

  aceptarCotizacion(): void {
    const c = this.cotizacion();
    if (!c) return;
    this.cotizacionService.aceptar(c.idCotizacion).subscribe({
      next: () => {
        this.toast.success('Cotización aceptada correctamente');
        this.cargarDetalle(c.idCotizacion);
      },
      error: (err: unknown) => this.toast.error('Error al aceptar: ' + mensajeError(err)),
    });
  }

  abrirEdicionEstimacion(): void {
    const c = this.cotizacion();
    if (!c || !this.puedeEditarEstimacion()) return;
    this.costoEditado.set(Number(c.costoFabricacion ?? 0));
    this.showEditarModal.set(true);
  }

  cerrarEdicionEstimacion(): void {
    this.showEditarModal.set(false);
    this.costoEditado.set(null);
    this.guardandoEstimacion.set(false);
  }

  onCostoChange(valor: string): void {
    const numero = Number(valor);
    this.costoEditado.set(
      valor.trim() !== '' && Number.isFinite(numero) && numero > 0 ? numero : null,
    );
  }

  guardarEstimacion(): void {
    const c = this.cotizacion();
    const costo = this.costoEditado();
    const precio = this.precioCalculado();

    if (!c || costo === null || precio === null) {
      this.toast.error('Ingresa un costo de fabricación mayor a 0.');
      return;
    }

    this.guardandoEstimacion.set(true);
    this.cotizacionService.reestimar(c.idCotizacion, costo).subscribe({
      next: () => {
        this.toast.success(
          `Estimación actualizada. Nuevo precio sugerido: $${precio.toLocaleString('es-CL')}`,
        );
        this.cargarDetalle(c.idCotizacion);
      },
      error: (err: unknown) => {
        this.guardandoEstimacion.set(false);
        this.toast.error('No se pudo actualizar la estimación: ' + mensajeError(err));
      },
    });
  }

  abrirModalCancelar(): void {
    this.cancelMotivo.set('');
    this.showCancelModal.set(true);
  }
  cerrarModalCancelar(): void {
    this.showCancelModal.set(false);
    this.cancelMotivo.set('');
  }

  confirmarCancelacion(): void {
    const c = this.cotizacion();
    if (!c) return;
    if (!this.cancelMotivo().trim()) {
      this.toast.error('Debes ingresar un motivo para rechazar.');
      return;
    }
    this.cotizacionService.cancelar(c.idCotizacion, this.cancelMotivo()).subscribe({
      next: () => {
        this.toast.success('Cotización rechazada correctamente');
        this.cerrarModalCancelar();
        this.cargarDetalle(c.idCotizacion);
      },
      error: (err: unknown) => this.toast.error('Error al rechazar: ' + mensajeError(err)),
    });
  }
}
