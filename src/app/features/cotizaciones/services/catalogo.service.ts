import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CatalogoItem {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/catalogos'; // Ajusta si tu ruta es distinta

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

  getEspesores(): Observable<any[]> {
    // Asumiendo que tu backend devuelve id y milimetros/nombre
    return this.http.get<any[]>(`${this.apiUrl}/espesor`); 
  }
}