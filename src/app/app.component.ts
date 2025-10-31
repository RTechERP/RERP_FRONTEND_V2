import { Component, OnInit } from '@angular/core';
import {
  Params,
  Route,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { WelcomeComponent } from './pages/old/welcome/welcome.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuService } from './pages/systems/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AppNotifycationDropdownComponent } from './pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
@Component({
  selector: 'app-root',
  imports: [
    // RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzTabsModule,
    NzDropDownModule,
    // NzBadgeModule,
    // NzAvatarModule,
    // BrowserModule,
    ReactiveFormsModule,
    // HttpClient,
  ],
  //   templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {}
