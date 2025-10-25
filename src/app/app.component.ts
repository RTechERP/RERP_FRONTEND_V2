import { Component, OnInit, HostListener } from '@angular/core';
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
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuService } from './pages/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthService } from './auth/auth.service';
import { SessionCleanupService } from './services/session-cleanup.service';

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
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private sessionCleanupService: SessionCleanupService
  ) {}

  ngOnInit() {
    // SessionCleanupService sẽ tự động setup cleanup handlers
    console.log('App initialized with session cleanup');
  }

  logout() {
    this.authService.logout();
  }

  /**
   * Xử lý khi user đóng trình duyệt hoặc tab
   */
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    // SessionCleanupService sẽ xử lý cleanup
    this.sessionCleanupService.clearAllSessionData();
  }

  notifItems = [
    {
      icon: 'mail',
      text: 'Mã KhoCC về hàng',
      time: '10:15 AM',
      group: 'today',
    },
    {
      icon: 'calendar',
      text: 'Mã KhoCC về hàng',
      time: '10:15 AM',
      group: 'today',
    },
    {
      icon: 'alert',
      text: 'Mã KhoCC về hàng',
      time: '10:15 AM',
      group: 'today',
    },
  ];
}
