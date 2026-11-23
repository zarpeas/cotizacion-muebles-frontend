import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/reportes';

  obtenerReporte(estado?: string, familia?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (estado && estado !== 'Todos los estados') params.estado = estado.toUpperCase();
    if (familia && familia !== 'Todas las familias') params.familia = familia;
    if (periodo) params.periodo = periodo;

    return this.http.get<any>(this.apiUrl, { params });
  }
}
