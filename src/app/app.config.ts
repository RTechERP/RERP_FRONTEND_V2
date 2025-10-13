import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { vi_VN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';

registerLocaleData(vi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNzIcons(icons),
    provideNzI18n(vi_VN),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
export const APP_LOGIN_NAME = 'admin';
export const EMPLOYEE_ID = 0;
export const ISADMIN = true;
export const USER_NAME = 'ADMINSW';
// export const HOST = 'https://localhost:44365/';
export const HOST = 'http://10.20.29.65:8088/rerpapi/';
// export const HOST = 'http://192.168.1.2:8088/api/';
export const DEPARTMENTID = 6;
export const IS_ADMIN = true;
export const LOGIN_NAME = 'ADMINSW';
export const SERVER_PATH = 'D:/LeTheAnh/RTC/UPLOADFILE/TrainingRegistration/';
