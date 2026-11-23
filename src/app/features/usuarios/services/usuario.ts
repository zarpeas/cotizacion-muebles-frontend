import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  // 👇 URL completa con el puerto de Spring Boot
  private readonly apiUrl = 'http://localhost:8080/api/usuarios';

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Usuario> {
    // El backend no expone GET /{id}; se obtiene desde el listado existente.
    return this.listar().pipe(
      map((usuarios) => {
        const usuario = usuarios.find((u) => u.idUsuario === id);
        if (!usuario) throw new Error('Usuario no encontrado');
        return usuario;
      }),
    );
  }

  crear(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  cambiarEstado(id: number, activo: boolean): Observable<void> {
    const params = new HttpParams().set('activo', activo.toString());
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, {}, { params });
  }
}
