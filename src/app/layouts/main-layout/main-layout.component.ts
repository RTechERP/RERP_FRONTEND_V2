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
import { MenuService } from '../../pages/old/menus/menu-service/menu.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDestroyService } from 'ng-zorro-antd/core/services';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NgComponentOutlet } from '@angular/common';
import { Type, Injector } from '@angular/core';
import { NotifyItem } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
import { AppNotifycationDropdownComponent } from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
import { AppUserDropdownComponent } from '../../pages/old/app/app-user-dropdown/app-user-dropdown.component';
import { Title } from '@angular/platform-browser';
import { ProjectComponent } from '../../pages/old/project/project.component';
// import { CustomerComponent } from '../../pages/customer/customer.component';
import { TbProductRtcComponent } from '../../pages/old/tb-product-rtc/tb-product-rtc.component';
import { CustomerComponent } from '../../pages/old/VisionBase/customer/customer.component';
import { ProductSaleComponent } from '../../pages/old/Sale/ProductSale/product-sale.component';
import { HrhiringRequestComponent } from '../../pages/hrm/hrhiring-request/hrhiring-request.component';
import { TrainingRegistrationComponent } from '../../pages/training-registration/training-registration.component';
type TabItem = {
  title: string;
  comp: Type<any>;
  injector?: Injector;
};
type BaseItem = {
  key: string;
  title: string;
  isOpen: boolean;
  icon?: string | null; // tùy chọn
};

type LeafItem = BaseItem & {
  kind: 'leaf';
  comp: Type<any>;
};

type GroupItem = BaseItem & {
  kind: 'group';
  children: LeafItem[];
};

type MenuItem = LeafItem | GroupItem;

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
    CustomerComponent,
    TbProductRtcComponent,
    ProjectComponent,
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
  ) {}
  notificationComponent = AppNotifycationDropdownComponent;
  //#region Khai báo biến
  isCollapsed = true;
  isDatcom = false;
  selectedIndex = 0;

  isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
  isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
  menus: MenuItem[] = [
    {
      kind: 'leaf',
      key: 'crm',
      title: 'Khách hàng',
      isOpen: true,
      icon: 'assets/images/icons8-overview-20.png',
      comp: CustomerComponent,
    },
    // {
    //   kind: 'leaf',
    //   key: 'sales',
    //   title: 'Bán hàng',
    //   isOpen: true,
    //   icon: 'assets/icon/layers.png',
    //   comp: CustomerComponent,
    // },
    {
      kind: 'group',
      key: 'product',
      title: 'KHO',
      isOpen: true,
      icon: 'assets/images/icons8-warehouse-modula-20.png',
      children: [
        {
          kind: 'leaf',
          key: 'product1',
          title: 'SẢN PHẨM KHO SALE',
          isOpen: true,
          comp: ProductSaleComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'product2',
          title: 'SẢN PHẨM KHO DEMO',
          isOpen: true,
          comp: TbProductRtcComponent /* không icon */,
        },
      ],
    },
    {
      kind: 'leaf',
      key: 'project',
      title: 'DỰ ÁN',
      isOpen: false,
      icon: null,
      comp: ProjectComponent,
    },
    {
      kind: 'group',
      key: 'hrm',
      title: 'HRM',
      isOpen: true,
      icon: 'assets/images/icons8-warehouse-modula-20.png',
      children: [
        {
          kind: 'leaf',
          key: 'hrhiring',
          title: 'TUYỂN DỤNG',
          isOpen: true,
          comp: HrhiringRequestComponent,
          //   icon: 'assets/icon/layers.png',
        },
        // {
        //   kind: 'leaf',
        //   key: 'product2',
        //   title: 'SẢN PHẨM KHO DEMO',
        //   isOpen: true,
        //   comp: TbProductRtcComponent /* không icon */,
        // },
      ],
    },
    {
      kind: 'group',
      key: 'cate',
      title: 'DANH MỤC CHUNG',
      isOpen: true,
      icon: 'assets/images/icons8-warehouse-modula-20.png',
      children: [
        {
          kind: 'leaf',
          key: 'training-registration',
          title: 'ĐÀO TẠO',
          isOpen: true,
          comp: TrainingRegistrationComponent,
          //   icon: 'assets/icon/layers.png',
        },
        // {
        //   kind: 'leaf',
        //   key: 'product2',
        //   title: 'SẢN PHẨM KHO DEMO',
        //   isOpen: true,
        //   comp: TbProductRtcComponent /* không icon */,
        // },
      ],
    },
  ];
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
    this.getMenus(43);
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
  getMenus(id: number): void {
    this.menuService.getMenus(id).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.menu = response.data;
          //   console.log(this.menu);
        }
      },
      error: (err) => {
        // console.log(err);
        // this.notification.error('Thông báo', err.error.message);
      },
    });
  }

  logout() {
    this.auth.logout();
  }
  onPick(n: NotifyItem) {
    console.log('picked:', n);
    // TODO: điều hướng/đánh dấu đã đọc...
  }
  toggleMenu(key: string) {
    const m = this.menus.find((x) => x.key === key);
    if (m) m.isOpen = !m.isOpen;
  }
  isMenuOpen(key: string): boolean {
    const m = this.menus.find((x) => x.key === key);
    return !!m && !!m.isOpen;
  }
}
