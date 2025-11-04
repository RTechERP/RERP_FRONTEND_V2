import { Component, OnInit, Type } from '@angular/core';
import { MenuService } from '../../systems/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-menus',
  imports: [],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css',
  standalone:true,
})
export class MenusComponent implements OnInit {
  //#region Khai báo biến
  menus: any[] = [];
  //#endregion

  constructor(
    private menuService: MenuService,
    private notifi: NzNotificationService,
    public permission: PermissionService
  ) {}

  ngOnInit(): void {
    // this.getMenus(43);
  }
  
}
