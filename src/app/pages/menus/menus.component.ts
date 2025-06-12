import { Component, OnInit } from '@angular/core';
import { MenuService } from './menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-menus',
  imports: [],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css',
})
export class MenusComponent implements OnInit {
  //#region Khai báo biến
  menus: any[] = [];
  //#endregion

  constructor(
    private menuService: MenuService,
    private notifi: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.getMenus();
  }
  getMenus(): void {
    this.menuService.getMenus().subscribe({
      next: (response: any) => {
        this.menus = response.data;
      },
      error: (err) => {
        this.notifi.error('Thông báo', err.message);
      },
    });
  }
}
