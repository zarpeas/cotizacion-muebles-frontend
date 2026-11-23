import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que verifica si el usuario está logueado.
 * Si no lo está, lo redirige al login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

/**
 * Guard que verifica si el usuario logueado es ADMINISTRADOR.
 * Si no lo es (es decir, es ASESOR), lo redirige a la vista de cotizaciones.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Verificamos que esté logueado Y que su rol sea ADMINISTRADOR
  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }
  
  // Si no es admin, lo mandamos a donde tiene permiso
  router.navigate(['/cotizaciones']);
  return false;
};

/**
 * Guard que evita que un usuario ya logueado vuelva al login.
 * Si ya está logueado, lo redirige al dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }
  
  router.navigate(['/dashboard']);
  return false;
};