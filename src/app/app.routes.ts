import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth-guard';
import { Layout } from './core/layout/layout/layout';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'clientes',
        loadChildren: () =>
        import('./features/clientes/clientes.routes').then(m => m.CLIENTES_ROUTES)
      },

      {
        path: 'cotizaciones',
        loadChildren: () =>
          import('./features/cotizaciones/cotizaciones.routes').then(m => m.COTIZACIONES_ROUTES)
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES)
      },
      {
        path: 'reportes',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];