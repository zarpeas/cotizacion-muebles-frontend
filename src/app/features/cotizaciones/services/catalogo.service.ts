import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

/**
 * El backend devuelve entidades: el id se llama distinto según el catálogo.
 * `getId` del wizard detecta la clave que empieza con "id".
 */
export interface CatalogoItem {
  id?: number;
  idCategoriaProducto?: number;
  idBase?: number;
  idCerradura?: number;
  idTipoPuerta?: number;
  idColor?: number;
  nombre: string;
  milimetros?: number;
}

export interface EspesorCatalogoItem extends CatalogoItem {
  milimetros: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly apiUrl = `${this.apiBase}/api/catalogos`;

  getCategorias(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/categorias`);
  }

  getBases(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/bases`);
  }

  getCerraduras(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/cerraduras`);
  }

  getColor(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/color`);
  }

  getTiposPuerta(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipopuerta`);
  }

  getEspesores(): Observable<EspesorCatalogoItem[]> {
    return this.http.get<EspesorCatalogoItem[]>(`${this.apiUrl}/espesor`);
  }
}
