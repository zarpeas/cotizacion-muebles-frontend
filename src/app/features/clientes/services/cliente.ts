import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClientePayload } from '../models/cliente.model';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly API = `${this.apiBase}/api/clientes`;

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.API);
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API}/${id}`);
  }

  crear(cliente: ClientePayload): Observable<Cliente> {
    return this.http.post<Cliente>(this.API, cliente);
  }

  actualizar(id: number, cliente: ClientePayload): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API}/${id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
