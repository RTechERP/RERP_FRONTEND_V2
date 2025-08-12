import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Params, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuService } from '../../pages/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzTabsModule,
    NzDropDownModule,
    ReactiveFormsModule,
  ],
  templateUrl: '../../app.component.html',
  styleUrl: '../../app.component.css',
  standalone: true,
})
export class MainLayoutComponent implements OnInit {
  constructor(
    private auth: AuthService,
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

  menu: any = {};
  //#endregion

  ngOnInit(): void {
    this.getMenus(43);
  }

  newTab(routerLink: string[], title: string): void {
    const { length } = this.dynamicTabs;
    const newTabId = length + 1;
    // const title = `NewTab${newTabId}`;
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

  getMenus(id: number): void {
    this.menuService.getMenus(id).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.menu = response.data;
          console.log(this.menu);
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', err.error.message);
      },
    });
  }

  logout() {
    this.auth.logout();
  }
}
