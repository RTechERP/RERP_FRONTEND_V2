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
export const HOST = 'https://localhost:44365/';
// export const HOST = 'http://10.20.29.65:8088/rerpapi/';
export const DEPARTMENTID = 6;

export const SERVER_PATH = 'C:/RTC/UPLOADFILE/TrainingRegistration/';

export const ID = 0;
export const ISADMINSALE = '';
export const FULLNAME = '';
export const LOGINNAME = '';
export const CODE = '';
export const MAINVIEWID = 0;
export const DEPARTMENTNAME = '';
export const HEADOFDEPARTMENT = '';
export const ANHCBNV = '';
export const STATUSEMPLOYEE = '';
export const STATUSUSER = '';
export const POSITIONNAME = '';
export const USERGROUPID = 0;
export const POSITIONID = 0;
export const GIOITINH = 0;
export const POSITIONCODE = '';
export const DEPARTMENTCODE = '';
export const ISBUSSINESSCOST = false;
export const ISLEADER = 0;
export const TEAMOFUSER = 0;
export const PERMISSIONS = '';
export const NAME = '';
