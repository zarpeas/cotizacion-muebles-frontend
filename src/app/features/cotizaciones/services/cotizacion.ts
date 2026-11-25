import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import {
  MuebleInput,
  MuebleConfirmacionInput,
  PrediccionResponse,
  CotizacionConfirmada,
  CotizacionResumen,
  CotizacionDetalle,
  PaginatedResponse,
} from '../models/cotizacion.models';

@Service()
export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly apiUrl = `${this.apiBase}/api/cotizacion`;

  /** Lista todas las cotizaciones guardadas. */
  listar(): Observable<CotizacionResumen[]> {
    // Pedimos una página grande para traer todo y mantener el filtrado local.
    const params = new HttpParams().set('page', '0').set('size', '1000');

    return this.http
      .get<PaginatedResponse<CotizacionResumen>>(`${this.apiUrl}/listar`, { params })
      .pipe(map((response) => response.content));
  }

  /** Solo predice, sin guardar en BD. */
  predecir(input: MuebleInput): Observable<PrediccionResponse> {
    return this.http.post<PrediccionResponse>(`${this.apiUrl}/predecir`, input);
  }

  /** Predice y guarda cotización + features + predicción en BD. */
  confirmar(
    input: MuebleConfirmacionInput,
    idCliente: number,
    idUsuario: number,
  ): Observable<CotizacionConfirmada> {
    const params = new HttpParams().set('idCliente', idCliente).set('idUsuario', idUsuario);
    return this.http.post<CotizacionConfirmada>(`${this.apiUrl}/confirmar`, input, { params });
  }

  obtener(id: number): Observable<CotizacionDetalle> {
    return this.http.get<CotizacionDetalle>(`${this.apiUrl}/${id}`);
  }

  /** Reestima manualmente una cotización pendiente (solo costo de fabricación). */
  reestimar(id: number, costoFabricacion: number): Observable<CotizacionDetalle> {
    return this.http.patch<CotizacionDetalle>(`${this.apiUrl}/${id}/reestimar`, {
      costoFabricacion,
    });
  }

  cancelar(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancelar`, { motivo });
  }

  aceptar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/aceptar`, {});
  }
}
