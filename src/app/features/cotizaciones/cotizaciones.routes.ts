import { Routes } from '@angular/router';

export const COTIZACIONES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lista-cotizaciones/lista-cotizaciones').then(m => m.ListaCotizaciones)
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/wizard-cotizacion/wizard-cotizacion').then(m => m.WizardCotizacion)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/detalle-cotizacion/detalle-cotizacion').then(m => m.DetalleCotizacion)
  }
];