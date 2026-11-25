import { ApplicationConfig, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { API_BASE_URL } from './core/config/api.config';

import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables()),
    { provide: LOCALE_ID, useValue: 'es-CL' },
    { provide: API_BASE_URL, useValue: '' },
  ],
};
