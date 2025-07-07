import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
<<<<<<< HEAD
import { provideHttpClient } from '@angular/common/http';
=======
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
>>>>>>> a2ce3dc3bf568ad0b7f6b7d305d04986ef8dfe70

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
<<<<<<< HEAD
    provideHttpClient(),
  ],
};
=======
    provideHttpClient(withInterceptorsFromDi())
  ]
};
>>>>>>> a2ce3dc3bf568ad0b7f6b7d305d04986ef8dfe70
