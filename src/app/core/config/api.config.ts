import { InjectionToken } from '@angular/core';

/**
 * Base de la API. Por defecto queda vacía para usar las rutas relativas
 * (/api/...) y el proxy de desarrollo. Se puede sobrescribir en app.config.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});
