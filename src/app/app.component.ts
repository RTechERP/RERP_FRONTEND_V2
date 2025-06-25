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

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
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
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private menuService: MenuService,
    private notification: NzNotificationService
  ) {}

  //#region Khai báo biến
  isCollapsed = true;
  selectedIndex = 0;
  dynamicTabs: Array<{
    title: string;
    content: string;
    queryParams?: Params;
    routerLink: string[];
  }> = [];

  menus: any[] = [];
  //#endregion

  ngOnInit(): void {
    this.getMenus();
  }

  newTab(routerLink: string[]): void {
    const { length } = this.dynamicTabs;
    const newTabId = length + 1;
    const title = `NewTab${newTabId}`;
    this.dynamicTabs = [
      ...this.dynamicTabs,
      {
        title,
        content: title,
        routerLink: routerLink,
        queryParams: {
          tab: newTabId,
        },
      },
    ];

    setTimeout(() => {
      this.selectedIndex = this.dynamicTabs.length - 1;
    });
  }

  closeTab({ index }: { index: number }): void {
    this.dynamicTabs.splice(index, 1);

    if (this.dynamicTabs.length === 0) {
      this.router.navigate(['/welcome']);
    }
  }

  getMenus(): void {
    let date = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      15,
      0,
      0,
      0
    );
    this.menuService.getMenus().subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.menus = response.data;
          console.log(this.menus);
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', err.error.status);
      },
    });
  }
}
