import { Component, OnInit, Type } from '@angular/core';
import { MenuService } from './menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FactoryVisitRegistrationComponent } from '../../general-category/visit-factory-registation/factory-visit-registration.component';

import { TsAssetAllocationComponent } from '../ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetRecoveryComponent } from '../ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from '../ts-asset-transfer/ts-asset-transfer.component';
import { HandoverComponent } from '../../hrm/handover/handover.component';
import { PermissionService } from '../../../services/permission.service';


import { menus, MenuItem } from './menus.data';
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
