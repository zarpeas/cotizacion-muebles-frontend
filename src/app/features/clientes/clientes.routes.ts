import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lista-clientes/lista-clientes').then(m => m.ListaClientes)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/form-cliente/form-cliente').then(m => m.FormCliente)
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/form-cliente/form-cliente').then(m => m.FormCliente)
  }
];