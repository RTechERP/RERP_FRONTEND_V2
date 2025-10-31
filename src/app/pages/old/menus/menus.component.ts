import { Component, OnInit, Type } from '@angular/core';
import { MenuService } from './menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';


import { menus, MenuItem } from './menus.data';
@Component({
  selector: 'app-menus',
  imports: [],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css',
})
export class MenusComponent implements OnInit {
  //#region Khai báo biến
 menus: MenuItem[] = [];
  //#endregion

  constructor(
    private menuService: MenuService,
    private notifi: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.getMenus(43);
  }
  getMenus(id: number): void {
    this.menuService.getMenus(id).subscribe({
      next: (response: any) => {
        this.menus = response.data;
      },
      error: (err) => {
        this.notifi.error('Thông báo', err.message);
      },
    });
  }
  
}

