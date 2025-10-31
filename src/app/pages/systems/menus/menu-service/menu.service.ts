import { Injectable, Type } from '@angular/core';
// import { HOST } from '../../../../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FactoryVisitRegistrationComponent } from '../../../general-category/visit-factory-registation/factory-visit-registration.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { HandoverComponent } from '../../../hrm/handover/handover.component';
import { HrhiringRequestComponent } from '../../../hrm/hrhiring-request/hrhiring-request.component';
import { VehicleManagementComponent } from '../../../hrm/vehicle/vehicle-management/vehicle-management.component';
import { VehicleRepairTypeComponent } from '../../../hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { VehicleRepairComponent } from '../../../hrm/vehicle/vehicle-repair/vehicle-repair.component';
import { TrainingRegistrationComponent } from '../../../training-registration/training-registration.component';
import { ContractComponent } from '../../../old/contract/contract.component';
import { CustomerComponent } from '../../../old/customer/customer.component';
import { DayOffComponent } from '../../../old/day-off/day-off.component';
import { DepartmentComponent } from '../../../old/department/department.component';
import { EarlyLateComponent } from '../../../old/early-late/early-late.component';
import { EmployeeAttendanceComponent } from '../../../old/employee-attendance/employee-attendance.component';
import { EmployeeBussinessComponent } from '../../../old/employee-bussiness/employee-bussiness.component';
import { EmployeeComponent } from '../../../old/employee/employee.component';
import { FoodOrderComponent } from '../../../old/food-order/food-order.component';
import { HolidayComponent } from '../../../old/holiday/holiday.component';
import { NightShiftComponent } from '../../../old/night-shift/night-shift.component';
import { OverTimeComponent } from '../../../old/over-time/over-time.component';
import { PositionsComponent } from '../../../hrm/employee/posittion/positions.component';
import { ProjectItemLateComponent } from '../../../old/project/project-item-late/project-item-late.component';
import { ProjectSurveyComponent } from '../../../old/project/project-survey/project-survey.component';
import { ProjectWorkItemTimelineComponent } from '../../../old/project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../../../old/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../../../old/project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../../../old/project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../../../old/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProductSaleComponent } from '../../../old/Sale/ProductSale/product-sale.component';
import { TbProductRtcComponent } from '../../../old/tb-product-rtc/tb-product-rtc.component';
import { TeamComponent } from '../../../hrm/employee/team/team.component';
import { TsAssetAllocationPersonalComponent } from '../../../old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetAllocationComponent } from '../../../old/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetManagementPersonalTypeComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetManagementComponent } from '../../../old/ts-asset-management/ts-asset-management.component';
import { TsAssetRecoveryComponent } from '../../../old/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from '../../../old/ts-asset-transfer/ts-asset-transfer.component';
import { PermissionService } from '../../../../services/permission.service';

@Injectable({
  providedIn: 'root',
})



export class MenuService {
  private apiUrl = environment.host + 'api/menu/';
  //   private apiUrl = HOST + 'api/menu/';
  constructor(private http: HttpClient, private permissionService: PermissionService) { }


  //   getMenus(id: number): Observable<any> {
  //     return this.http.get<any>(this.apiUrl + `menus/${id}`);
  //   }

  getMenus(): MenuItem[] {
    // this.menuService.getMenus(id).subscribe({
    //   next: (response: any) => {
    //     this.menus = response.data;
    //   },
    //   error: (err) => {
    //     this.notifi.error('Thông báo', err.message);
    //   },
    // });
    const menus: MenuItem[] = [
      //#region menu CRM
      {
        kind: 'group',
        key: 'crm',
        title: 'CRM',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(""),
        icon: 'assets/icon/menu_crm_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'CustomerComponent',
            title: 'Khách hàng',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N1,N27,N53,N31,N69"),
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
        isPermission: this.permissionService.hasPermission(""),
        icon: 'assets/icon/menu_warehouse_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'ProductSaleComponent',
            title: 'SẢN PHẨM KHO SALE',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N26,N1,N36,N73,N30"),
            comp: ProductSaleComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TbProductRtcComponent',
            title: 'SẢN PHẨM KHO DEMO',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N26,N1,N36,N73,N30"),
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
        isPermission: this.permissionService.hasPermission(""),
        icon: 'assets/icon/menu_hrm_24.png',

        children: [
          {
            kind: 'leaf',
            key: 'HrhiringRequestComponent',
            title: 'TUYỂN DỤNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: HrhiringRequestComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'group',
            key: 'TsAssetManagementPersonalComponent1',
            title: 'Tài sản cá nhân',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
            children: [
              {
              kind: 'leaf',
              key: 'TsAssetManagementPersonalComponent',
              title: 'Tài sản cá nhân',
              isOpen: true,
              isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
              comp: TsAssetManagementPersonalComponent,
              //   icon: 'assets/icon/layers.png',
            },
             {
            kind: 'leaf',
            key: 'TsAssetManagementPersonalTypeComponent',
            title: 'Loại tài sản ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
            comp: TsAssetManagementPersonalTypeComponent,
            //   icon: 'assets/icon/layers.png',
          },
          ],
          },
          {
            kind: 'leaf',
            key: 'TsAssetManagementPersonalComponent',
            title: 'Tài sản cá nhân',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
            comp: TsAssetManagementPersonalComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TsAssetManagementPersonalTypeComponent',
            title: 'Loại tài sản cá nhân',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
            comp: TsAssetManagementPersonalTypeComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TsAssetAllocationPersonalComponent',
            title: 'Cấp phát tài sản cá nhân',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N67,N36"),
            comp: TsAssetAllocationPersonalComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TsAssetRecoveryPersonalComponent',
            title: 'Thu hồi tài sản cá nhân',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N67,N36"),
            comp: TsAssetRecoveryPersonalNewComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'VehicleRepairComponent',
            title: 'Danh sách xe sửa chữa',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: VehicleRepairComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'VehicleRepairComponent',
            title: 'Danh sách loại sửa chữa',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: VehicleRepairTypeComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'DepartmentComponent',
            title: 'Phòng ban',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: DepartmentComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'TeamComponent',
            title: 'Team',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N26,N40,N1"),
            comp: TeamComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'PositionsComponent',
            title: 'Chức vụ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: PositionsComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'EmployeeComponent',
            title: 'Nhân viên',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N60,N1"),
            comp: EmployeeComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'ContractComponent',
            title: 'Hợp đồng',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: ContractComponent,
            //   icon: 'assets/icon/layers.png',
          },

          //   {
          //     kind: 'leaf',
          //     key: 'EmployeeScheduleWorkComponent',
          //     title: 'Quá trình công tác',
          //     isOpen: true,
          //     comp: EmployeeScheduleWorkComponent,
          //     //   icon: 'assets/icon/layers.png',
          //   },

          {
            kind: 'leaf',
            key: 'HolidayComponent',
            title: 'Ngày nghỉ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: HolidayComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'FoodOrderComponent',
            title: 'Cơm ca',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N23,N34,N1,N52,N80"),
            comp: FoodOrderComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'DayOffComponent',
            title: 'Quản lý nghỉ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: DayOffComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'EarlyLateComponent',
            title: 'Đi muộn - về sớm',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: EarlyLateComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'OverTimeComponent',
            title: 'Làm thêm',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: OverTimeComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'EmployeeBussinessComponent',
            title: 'Công tác',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: EmployeeBussinessComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'NightShiftComponent',
            title: 'Làm đêm',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: NightShiftComponent,
            //   icon: 'assets/icon/layers.png',
          },
          //   {
          //     kind: 'leaf',
          //     key: 'NightShiftComponent',
          //     title: 'WFH',
          //     isOpen: true,
          //     comp: R,
          //     //   icon: 'assets/icon/layers.png',
          //   },
          {
            kind: 'leaf',
            key: 'EmployeeAttendanceComponent',
            title: 'Vân tay',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N1"),
            comp: EmployeeAttendanceComponent,
            //   icon: 'assets/icon/layers.png',
          },
          //   {
          //     kind: 'leaf',
          //     key: 'EmployeeAttendanceComponent',
          //     title: 'Thu hộ phòng ban',
          //     isOpen: true,
          //     comp:
          //     //   icon: 'assets/icon/layers.png',
          //   },
          //   {
          //     kind: 'leaf',
          //     key: 'EmployeeAttendanceComponent',
          //     title: 'Vân tay',
          //     isOpen: true,
          //     comp: ,
          //     //   icon: 'assets/icon/layers.png',
          //   },
          //   {
          //     kind: 'leaf',
          //     key: 'VehicleCategoryComponent',
          //     title: 'Loại xe',
          //     isOpen: true,
          //     comp: VehicleCategoryComponent,
          //     //   icon: 'assets/icon/layers.png',
          //   },

          {
            kind: 'leaf',
            key: 'VehicleManagementComponent',
            title: 'Danh sách xe',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N2,N34,N1"),
            comp: VehicleManagementComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'TsAssetManagementComponent',
            title: 'Danh sách tài sản',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N36,N34"),
            comp: TsAssetManagementComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'TsAssetAllocationComponent',
            title: 'Cấp phát',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N67,N36"),
            comp: TsAssetAllocationComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'TsAssetRecoveryComponent',
            title: 'Thu hồi',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N67,N36"),
            comp: TsAssetRecoveryComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TsAssetTransferComponent',
            title: 'Điều chuyển',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N23,N52,N1,N67,N36"),
            comp: TsAssetTransferComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'HandoverComponent',
            title: 'Biên bản bàn giao',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: HandoverComponent,
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
        isPermission: this.permissionService.hasPermission(""),
        icon: 'assets/icon/menu_categories_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'TrainingRegistrationComponent',
            title: 'ĐÀO TẠO',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: TrainingRegistrationComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'FactoryVisitRegistrationComponent',
            title: 'THAM QUAN NHÀ MÁY',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: FactoryVisitRegistrationComponent,
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
        isPermission: this.permissionService.hasPermission(""),
        icon: 'assets/icon/menu_project_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'ProjectComponent',
            title: 'Danh sách dự án',
            isOpen: true,
            isPermission: this.permissionService.hasPermission("N28,N13,N27,N31,N33,N1,N69,N36"),
            comp: ProjectComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkPropressComponent',
            title: 'Tiến độ công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: ProjectWorkPropressComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkTimelineComponent',
            title: 'Timeline công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: ProjectWorkTimelineComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectSurveyComponent',
            title: 'Khảo sát dự án',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),

            comp: ProjectSurveyComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectItemLateComponent',
            title: 'Hạng mục công việc chậm tiến độ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),

            comp: ProjectItemLateComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkItemTimelineComponent',
            title: 'Timeline hạng mục công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: ProjectWorkItemTimelineComponent,
          },
          {
            kind: 'leaf',
            key: 'SynthesisOfGeneratedMaterialsComponent',
            title: 'Báo cáo vật tư phát sinh',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(""),
            comp: SynthesisOfGeneratedMaterialsComponent,
          },
        ],
      },
      //#endregion
    ];

    return menus;
  }

}


type BaseItem = {
  key: string;
  title: string;
  isOpen: boolean;
  icon?: string | null; // tùy chọn
  isPermission: boolean
};

export type LeafItem = BaseItem & {
  kind: 'leaf';
  comp: Type<any>;
};

export type GroupItem = BaseItem & {
  kind: 'group';
  children: MenuItem[];
};
export type MenuItem = LeafItem | GroupItem;
// export 
