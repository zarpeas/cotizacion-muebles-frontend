import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { API_BASE_URL } from '../config/api.config';

interface SesionGuardada {
  user: LoginResponse;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly API = `${this.apiBase}/api/auth`;
  private readonly STORAGE_KEY = 'cotizacion_user';
  private readonly DURACION_SESION_MS = 5 * 60 * 60 * 1000; // 5 horas

  private expiresAt = 0;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private _user = signal<LoginResponse | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.rol === 'ADMIN');
  readonly isUsuario = computed(() => this._user()?.rol === 'USUARIO');

  constructor() {
    // Elimina la sesión antigua persistida en localStorage (ya no se usa).
    localStorage.removeItem(this.STORAGE_KEY);

    const sesion = this.leerSesion();
    if (sesion) {
      this.expiresAt = sesion.expiresAt;
      this._user.set(sesion.user);
      this.programarExpiracion();
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, credentials).pipe(
      tap((res) => {
        this.expiresAt = Date.now() + this.DURACION_SESION_MS;
        const sesion: SesionGuardada = { user: res, expiresAt: this.expiresAt };
        // sessionStorage: se borra al cerrar la pestaña o el navegador.
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesion));
        this._user.set(res);
        this.programarExpiracion();
      }),
    );
  }

  logout(): void {
    this.limpiarTemporizador();
    this.expiresAt = 0;
    sessionStorage.removeItem(this.STORAGE_KEY);
    this._user.set(null);
  }

  private leerSesion(): SesionGuardada | null {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;

    try {
      const sesion = JSON.parse(raw) as SesionGuardada;
      if (!sesion?.user || typeof sesion.expiresAt !== 'number') {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      if (sesion.expiresAt <= Date.now()) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  private programarExpiracion(): void {
    this.limpiarTemporizador();
    const restante = this.expiresAt - Date.now();
    if (restante <= 0) {
      this.expirarSesion();
      return;
    }
    this.expiryTimer = setTimeout(() => this.expirarSesion(), restante);
  }

  private expirarSesion(): void {
    this.logout();
    void this.router.navigate(['/login']);
  }

  private limpiarTemporizador(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}
