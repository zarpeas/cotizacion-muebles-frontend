import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  MuebleInput,
  PrediccionResponse,
  CotizacionConfirmada,
  CotizacionResumen,
  CotizacionDetalle,
  PaginatedResponse
} from '../models/cotizacion.models';

@Service()
export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/cotizacion';

  /** Lista todas las cotizaciones guardadas. */
  listar(): Observable<CotizacionResumen[]> {
    // Pedimos una página grande para traer todo y mantener tu filtrado local (client-side)
    const params = new HttpParams().set('page', '0').set('size', '1000');
    
    return this.http.get<PaginatedResponse<CotizacionResumen>>(`${this.apiUrl}/listar`, { params })
      .pipe(
        map(response => response.content) // Extraemos solo el arreglo de datos
      );
  }

  /** Solo predice, sin guardar en BD. */
  predecir(input: MuebleInput): Observable<PrediccionResponse> {
    return this.http.post<PrediccionResponse>(`${this.apiUrl}/predecir`, input);
  }

  /** Predice y guarda cotización + features + predicción en BD. */
  confirmar(input: any, idCliente: number): Observable<any> {
    const params = new HttpParams()
      .set('idCliente', idCliente)
      .set('idUsuario', 1); // Por ahora usamos el usuario 1 por defecto

    return this.http.post<any>(`${this.apiUrl}/confirmar`, input, { params });
  }

  obtener(id: number): Observable<CotizacionDetalle> {
    return this.http.get<CotizacionDetalle>(`${this.apiUrl}/${id}`);
  }

  cancelar(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancelar`, { motivo });
  }
  aceptar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/aceptar`, {});
  }
}