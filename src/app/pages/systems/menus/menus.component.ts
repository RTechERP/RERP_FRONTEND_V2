import { Component, OnInit, Type } from '@angular/core';
import { MenuService } from './menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FactoryVisitRegistrationComponent } from '../../general-category/visit-factory-registation/factory-visit-registration.component';


import { HandoverComponent } from '../../hrm/handover/handover.component';
import { PermissionService } from '../../../services/permission.service';
import { MenuItem } from './menu-service/menu.service';


@Component({
  selector: 'app-menus',
  imports: [],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css',
  standalone:true,
})
export class MenusComponent implements OnInit {
  //#region Khai báo biến
 menus: MenuItem[] = [];
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
