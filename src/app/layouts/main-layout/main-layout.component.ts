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
// import { MenuService } from '../../pages/old/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDestroyService } from 'ng-zorro-antd/core/services';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NgComponentOutlet } from '@angular/common';
import { Type, Injector } from '@angular/core';
// import { AppNotifycationDropdownComponent, NotifyItem } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
// import { AppNotifycationDropdownComponent } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
// import { AppUserDropdownComponent } from '/pages/old/app/app-user-dropdown/app-user-dropdown.component';
import { Title } from '@angular/platform-browser';
import { ProjectComponent } from '../../pages/old/project/project.component';
// import { EmployeePayrollComponent } from '../../pages/hrm/employee/employee-payroll/employee-payroll/employee-payroll.component';
// import { CustomerComponent } from '../../pages/customer/customer.component';
import { TbProductRtcComponent } from '../../pages/old/tb-product-rtc/tb-product-rtc.component';
import { CustomerComponent } from '../../pages/crm/customers/customer/customer.component';
// import { AppUserDropdownComponent } from '../../pages/systems/app-user/app-user-dropdown.component';


// import { menus } from '../../pages/old/menus/menus.component';
import { GroupItem, LeafItem, MenuItem, MenuService } from '../../pages/systems/menus/menu-service/menu.service';
import { AppUserDropdownComponent } from '../../pages/systems/app-user/app-user-dropdown.component';
import { AppNotifycationDropdownComponent, NotifyItem } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
import { MenusComponent } from '../../pages/old/menus/menus.component';

type TabItem = {
  title: string;
  comp: Type<any>;
  injector?: Injector;
};
// export type BaseItem = {
//   key: string;
//   title: string;
//   isOpen: boolean;
//   icon?: string | null;

// };

// export type LeafItem = BaseItem & {
//   kind: 'leaf';
//   comp: Type<any>;
// };

// export type GroupItem = BaseItem & {
//   kind: 'group';
//   children: MenuItem[]; // cho phép lồng group
// };

// export type MenuItem = LeafItem | GroupItem;

export const isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
export const isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';

const COMPONENT_REGISTRY: Record<string, Type<any>> = {
  customer: CustomerComponent,
  productRTC: TbProductRtcComponent,
  project: ProjectComponent,
};
@Component({
  selector: 'app-main-layout',
  imports: [
    RouterLink,
    NzBadgeModule,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzTabsModule,
    NzDropDownModule,
    ReactiveFormsModule,
    CommonModule,
    AppNotifycationDropdownComponent,
    AppUserDropdownComponent,
    NgComponentOutlet,
  ],
  templateUrl: '../../app.component.html',
  styleUrl: '../../app.component.css',
  standalone: true,
})
export class MainLayoutComponent implements OnInit {
  CustomerComponent = CustomerComponent;
  ProductRtcComponent = TbProductRtcComponent;
  ProjectComponent = ProjectComponent;
  constructor(
    private auth: AuthService,
    private router: Router,
    private menuService: MenuService,
    private notification: NzNotificationService
  ) {this.menus = this.menuService.getMenus()}
  notificationComponent = AppNotifycationDropdownComponent;
  //#region Khai báo biến
  isCollapsed = true;
  isDatcom = false;
  selectedIndex = 0;
  trackKey = (_: number, x: any) => x?.key ?? x?.title ?? _;
  isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
  isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
  menus:MenuItem[]=[];
  dynamicTabs: TabItem[] = [];

  menu: any = {};
  //#endregion
  notifItems: NotifyItem[] = [
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail:
        'Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
  ];
  ngOnInit(): void {
    const saved = localStorage.getItem('openMenuKey') || '';
    console.log(this.menus);
    this.setOpenMenu(saved || null);
    // this.getMenus(43);
  }
  newTab(comp: Type<any>, title: string, injector?: Injector) {
    const idx = this.dynamicTabs.findIndex((t) => t.title === title);
    if (idx >= 0) {
      this.selectedIndex = idx;
      return;
    }

    this.dynamicTabs = [...this.dynamicTabs, { title, comp, injector }];
    setTimeout(() => (this.selectedIndex = this.dynamicTabs.length - 1));
  }

  closeTab({ index }: { index: number }) {
    this.dynamicTabs.splice(index, 1);
    if (this.selectedIndex >= this.dynamicTabs.length)
      this.selectedIndex = this.dynamicTabs.length - 1;
  }
//   getMenus(id: number): void {
//     this.menuService.getMenus(id).subscribe({
//       next: (response: any) => {
//         if (response.status == 1) {
//           this.menu = response.data;
//           //   console.log(this.menu);
//         }
//       },
//       error: (err) => {
//         // console.log(err);
//         // this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
//       },
//     });
//   }

  logout() {
    this.auth.logout();
  }
  onPick(n: NotifyItem) {
    console.log('picked:', n);
    // TODO: điều hướng/đánh dấu đã đọc...
  }
  // toggleMenu(key: string) {
  //   const m = this.menus.find((x) => x.key === key);
  //   if (m) m.isOpen = !m.isOpen;
  // }
  // isMenuOpen(key: string): boolean {
  //   const m = this.menus.find((x) => x.key === key);
  //   return !!m && !!m.isOpen;
  // }
  private setOpenMenu(key: string | null) {
    this.menus.forEach((m) => (m.isOpen = key !== null && m.key === key));
    localStorage.setItem('openMenuKey', key ?? '');
  }

  isMenuOpen = (key: string) => this.menus.some((m) => m.key === key && m.isOpen);
  toggleMenu(key: string) {
    const m = this.menus.find((x) => x.key === key);
    if (m) m.isOpen = !m.isOpen;
  }

  // dùng khi muốn mở thẳng 1 group từ nơi khác
  openOnly(key: string) {
    this.setOpenMenu(key);
  }
}
