import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lista-usuarios/lista-usuarios').then(m => m.ListaUsuarios)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/form-usuario/form-usuario').then(m => m.FormUsuario)
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/form-usuario/form-usuario').then(m => m.FormUsuario)
  }
];