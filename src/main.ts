import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { warn } from 'ng-zorro-antd/core/logger';

declare const Slick: any;

if (typeof Slick !== 'undefined') {
    Slick.Logger = {
        warn: () => { },
        info: () => { },
        error: console.error
    }
}

registerLocaleData(vi);

bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
);
