import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportesDTO } from '../models/reporte-calculo.model';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly apiUrl = `${this.apiBase}/api/reportes`;

  obtenerReporte(estado?: string, familia?: string, periodo?: string): Observable<ReportesDTO> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (familia) params = params.set('familia', familia);
    if (periodo) params = params.set('periodo', periodo);

    return this.http.get<ReportesDTO>(this.apiUrl, { params });
  }
}
