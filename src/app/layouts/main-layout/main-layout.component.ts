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
// import { AppUserDropdownComponent } from '/pages/old/app/app-user-dropdown/app-user-dropdown.component';
import { Title } from '@angular/platform-browser';
import { ProjectComponent } from '../../pages/old/project/project.component';
import { EmployeePayrollComponent } from '../../pages/hrm/employee/employee-payroll/employee-payroll/employee-payroll.component';
// import { CustomerComponent } from '../../pages/customer/customer.component';
import { TbProductRtcComponent } from '../../pages/old/tb-product-rtc/tb-product-rtc.component';
import { CustomerComponent } from '../../pages/old/VisionBase/customer/customer.component';
import { ProductSaleComponent } from '../../pages/old/Sale/ProductSale/product-sale.component';
import { HrhiringRequestComponent } from '../../pages/hrm/hrhiring-request/hrhiring-request.component';
import { TrainingRegistrationComponent } from '../../pages/training-registration/training-registration.component';
import { ProjectWorkPropressComponent } from '../../pages/old/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../../pages/old/project/project-work-timeline/project-work-timeline.component';
import { ProjectSurveyComponent } from '../../pages/old/project/project-survey/project-survey.component';
import { ProjectItemLateComponent } from '../../pages/old/project/project-item-late/project-item-late.component';
import { ProjectWorkItemTimelineComponent } from '../../pages/old/project/project-work-item-timeline/project-work-item-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../../pages/old/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { AppUserDropdownComponent } from '../../pages/systems/app-user/app-user-dropdown.component';

import { TsAssetAllocationPersonalComponent } from '../../pages/old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetManagementPersonalComponent } from '../../pages/old/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetManagementPersonalTypeComponent } from '../../pages/old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetRecoveryPersonalComponent } from '../../pages/old/ts-asset-recovery-personal/ts-asset-recovery-personal.component';
import { VehicleRepairComponent } from '../../pages/hrm/vehicle-repair/vehicle-repair.component';
import { VehicleRepairTypeComponent } from '../../pages/hrm/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../pages/hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { DepartmentComponent } from '../../pages/old/department/department.component';
import { TeamComponent } from '../../pages/old/team/team.component';
import { PositionsComponent } from '../../pages/old/positions/positions.component';
import { EmployeeComponent } from '../../pages/old/employee/employee.component';
import { ContractComponent } from '../../pages/old/contract/contract.component';
import { EmployeeScheduleWorkComponent } from '../../pages/old/holiday/employee-schedule-work/employee-schedule-work.component';

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
    //#region menu CRM
    {
      kind: 'group',
      key: 'crm',
      title: 'CRM',
      isOpen: true,
      icon: 'assets/icon/menu_crm_24.png',
      children: [
        {
          kind: 'leaf',
          key: 'CustomerComponent',
          title: 'Khách hàng',
          isOpen: true,
          //   icon: 'assets/images/icons8-overview-20.png',
          comp: CustomerComponent,
        },
      ],
    },
    //#region menu KHO
    {
      kind: 'group',
      key: 'warehouse',
      title: 'KHO',
      isOpen: true,
      icon: 'assets/icon/menu_warehouse_24.png',
      children: [
        {
          kind: 'leaf',
          key: 'ProductSaleComponent',
          title: 'SẢN PHẨM KHO SALE',
          isOpen: true,
          comp: ProductSaleComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'TbProductRtcComponent',
          title: 'SẢN PHẨM KHO DEMO',
          isOpen: true,
          comp: TbProductRtcComponent /* không icon */,
        },
      ],
    },
    //#endregion

    //#region menu Nhân sự
    {
      kind: 'group',
      key: 'hrm',
      title: 'HRM',
      isOpen: true,
      icon: 'assets/icon/menu_hrm_24.png',
      children: [
        {
          kind: 'leaf',
          key: 'HrhiringRequestComponent',
          title: 'TUYỂN DỤNG',
          isOpen: true,
          comp: HrhiringRequestComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'TsAssetManagementPersonalComponent',
          title: 'Danh sách tài sản cá nhân',
          isOpen: true,
          comp: TsAssetManagementPersonalComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'TsAssetManagementPersonalTypeComponent',
          title: 'Danh sách loại tài sản cá nhân',
          isOpen: true,
          comp: TsAssetManagementPersonalTypeComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'TsAssetAllocationPersonalComponent',
          title: 'Cấp phát tài sản cá nhân',
          isOpen: true,
          comp: TsAssetAllocationPersonalComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'TsAssetRecoveryPersonalNewComponent',
          title: 'Thu hồi tài sản cá nhân',
          isOpen: true,
          comp: TsAssetRecoveryPersonalNewComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'VehicleRepairComponent',
          title: 'Danh sách xe sửa chữa',
          isOpen: true,
          comp: VehicleRepairComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'VehicleRepairComponent',
          title: 'Danh sách loại sửa chữa',
          isOpen: true,
          comp: VehicleRepairTypeComponent,
          //   icon: 'assets/icon/layers.png',
        },
        {
          kind: 'leaf',
          key: 'DepartmentComponent',
          title: 'Phòng ban',
          isOpen: true,
          comp: DepartmentComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'TeamComponent',
          title: 'Team',
          isOpen: true,
          comp: TeamComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'PositionsComponent',
          title: 'Chức vụ',
          isOpen: true,
          comp: PositionsComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'EmployeeComponent',
          title: 'Nhân viên',
          isOpen: true,
          comp: EmployeeComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'ContractComponent',
          title: 'Hợp đồng',
          isOpen: true,
          comp: ContractComponent,
          //   icon: 'assets/icon/layers.png',
        },

        {
          kind: 'leaf',
          key: 'EmployeeScheduleWorkComponent',
          title: 'Quá trình công tác',
          isOpen: true,
          comp: EmployeeScheduleWorkComponent,
          //   icon: 'assets/icon/layers.png',
        },
         {
          kind: 'leaf',
          key: 'EmployeePayrollComponent',
          title: 'Bảng lương',
          isOpen: true,
          comp: EmployeePayrollComponent,
          //   icon: 'assets/icon/layers.png',
        },
      ],
    },
    //#endregion

    //#region menu DANH MỤC DUNG
    {
      kind: 'group',
      key: 'categories',
      title: 'DANH MỤC CHUNG',
      isOpen: true,
      icon: 'assets/icon/menu_categories_24.png',
      children: [
        {
          kind: 'leaf',
          key: 'TrainingRegistrationComponent',
          title: 'ĐÀO TẠO',
          isOpen: true,
          comp: TrainingRegistrationComponent,
          //   icon: 'assets/icon/layers.png',
        },
      
      ],
    },

    //#endregion

    //#region menu dự án
    {
      kind: 'group',
      key: 'project',
      title: 'DỰ ÁN',
      isOpen: true,
      icon: 'assets/icon/menu_project_24.png',
      children: [
        {
          kind: 'leaf',
          key: 'ProjectComponent',
          title: 'Danh sách dự án',
          isOpen: true,
          comp: ProjectComponent,
        },
        {
          kind: 'leaf',
          key: 'ProjectWorkPropressComponent',
          title: 'Tiến độ công việc',
          isOpen: true,
          comp: ProjectWorkPropressComponent,
        },
        {
          kind: 'leaf',
          key: 'ProjectWorkTimelineComponent',
          title: 'Timeline công việc',
          isOpen: true,
          comp: ProjectWorkTimelineComponent,
        },
        {
          kind: 'leaf',
          key: 'ProjectSurveyComponent',
          title: 'Khảo sát dự án',
          isOpen: true,
          comp: ProjectSurveyComponent,
        },
        {
          kind: 'leaf',
          key: 'ProjectItemLateComponent',
          title: 'Hạng mục công việc chậm tiến độ',
          isOpen: true,
          comp: ProjectItemLateComponent,
        },
        {
          kind: 'leaf',
          key: 'ProjectWorkItemTimelineComponent',
          title: 'Timeline hạng mục công việc',
          isOpen: true,
          comp: ProjectWorkItemTimelineComponent,
        },
        {
          kind: 'leaf',
          key: 'SynthesisOfGeneratedMaterialsComponent',
          title: 'Báo cáo vật tư phát sinh',
          isOpen: true,
          comp: SynthesisOfGeneratedMaterialsComponent,
        },
      ],
    },
    //#endregion
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
