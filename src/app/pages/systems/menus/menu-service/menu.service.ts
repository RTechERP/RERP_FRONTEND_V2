import { Injectable, Type } from '@angular/core';
// import { HOST } from '../../../../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FactoryVisitRegistrationComponent } from '../../../general-category/visit-factory-registation/factory-visit-registration.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { HandoverComponent } from '../../../hrm/handover/handover.component';
import { HrhiringRequestComponent } from '../../../hrm/hrhiring-request/hrhiring-request.component';
import { VehicleManagementComponent } from '../../../hrm/vehicle-management/vehicle-management.component';
import { VehicleRepairTypeComponent } from '../../../hrm/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { VehicleRepairComponent } from '../../../hrm/vehicle-repair/vehicle-repair.component';
import { TrainingRegistrationComponent } from '../../../training-registration/training-registration.component';
import { ContractComponent } from '../../../old/contract/contract.component';
// import { CustomerComponent } from '../../../old/customer/customer.component';
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
import { PositionsComponent } from '../../../old/positions/positions.component';
import { ProjectItemLateComponent } from '../../../old/project/project-item-late/project-item-late.component';
import { ProjectSurveyComponent } from '../../../old/project/project-survey/project-survey.component';
import { ProjectWorkItemTimelineComponent } from '../../../old/project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../../../old/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../../../old/project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../../../old/project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../../../old/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProductSaleComponent } from '../../../old/Sale/ProductSale/product-sale.component';
import { TbProductRtcComponent } from '../../../old/tb-product-rtc/tb-product-rtc.component';
import { TeamComponent } from '../../../old/team/team.component';
import { TsAssetAllocationPersonalComponent } from '../../../old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetAllocationComponent } from '../../../hrm/asset/asset/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetManagementPersonalTypeComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetManagementComponent } from '../../../hrm/asset/asset/ts-asset-management/ts-asset-management.component';
import { TsAssetRecoveryComponent } from '../../../hrm/asset/asset/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from '../../../hrm/asset/asset/ts-asset-transfer/ts-asset-transfer.component';
import { PermissionService } from '../../../../services/permission.service';
// import { OfficeSupplyComponent } from '../../../old/OfficeSuppliesManagement/OfficeSupply/office-supply.component';
import { ProjectLeaderProjectTypeComponent } from '../../../old/project/project-leader-project-type/project-leader-project-type.component';
import { MeetingMinuteComponent } from '../../../old/project/meeting-minute/meeting-minute.component';
import { ProjectNewComponent } from '../../../old/project/project-new/project-new.component';
import { TsAssetTypeComponent } from '../../../hrm/asset/asset/ts-asset-type/ts-asset-type.component';
import { TsAssetSourceComponent } from '../../../hrm/asset/asset/ts-asset-source/ts-asset-source.component';
import { OfficeSupplyUnitComponent } from '../../../hrm/office-supply/OfficeSupplyUnit/office-supply-unit.component';
import { OfficeSupplyComponent } from '../../../hrm/office-supply/OfficeSupply/office-supply.component';
import { OfficeSupplyRequestsComponent } from '../../../hrm/office-supply/OfficeSupplyRequests/office-supply-requests.component';
import { OfficeSupplyRequestSummaryComponent } from '../../../hrm/office-supply/OfficeSupplyRequestSummary/office-supply-request-summary.component';
import { VehicleRepairHistoryComponent } from '../../../hrm/propose-vehicle-repair/vehicle-repair-history/vehicle-repair-history/vehicle-repair-history.component';
import { ProposeVehicleRepairComponent } from '../../../hrm/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair.component';
import { DailyReportHrComponent } from '../../../hrm/daily-report-hr/daily-report-hr.component';

import { EmployeePurchaseComponent } from '../../../purchase/employee-purchase/employee-purchase.component';
import { RulePayComponent } from '../../../purchase/rulepay/rule-pay.component';
import { CurrencyListComponent } from '../../../general-category/currency-list/currency-list.component';
import { UnitCountComponent } from '../../../old/Sale/ProductSale/unit-count/unit-count.component';
import { ProductLocationComponent } from '../../../general-category/product-location/product-location.component';
import { FirmComponent } from '../../../general-category/firm/firm.component';
import { CustomerComponent } from '../../../old/customer/customer.component';
import { InventoryComponent } from '../../../old/Sale/Inventory/inventory.component';
import { InventoryBorrowNCCComponent } from '../../../old/Sale/Inventory/Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';
import { BillImportComponent } from '../../../old/Sale/BillImport/bill-import.component';
import { BillExportComponent } from '../../../old/Sale/BillExport/bill-export.component';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = environment.host + 'api/menu/';
  //   private apiUrl = HOST + 'api/menu/';
  constructor(
    private http: HttpClient,
    private permissionService: PermissionService
  ) {}

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
        stt: 1,
        title: 'CRM',
        isOpen: true,
        isPermission: true,
        icon: 'assets/icon/menu_crm_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'CustomerComponent',
            title: 'Khách hàng',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N1,N27,N53,N31,N69'),
            comp: CustomerComponent,
          },
        ],
      },
      //#region menu KHO
      {
        kind: 'group',
        key: 'warehouse',
        stt: 3,
        title: 'KHO',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_warehouse_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'ProductSaleComponent',
            title: 'SẢN PHẨM KHO SALE',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
            comp: ProductSaleComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'TbProductRtcComponent',
            title: 'SẢN PHẨM KHO DEMO',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
            comp: TbProductRtcComponent /* không icon */,
          },
          {
            kind: 'group',
            key: 'Sale',
            title: 'Phòng Sale',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
              icon: 'assets/icon/menu_sale_24.png',
            children: [
              {
                kind: 'leaf',
                key: 'InventoryComponent',
                title: 'TỒN KHO',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission(''),
                comp: InventoryComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'BillImportComponent',
                title: 'PHIẾU NHẬP',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission(''),
                comp: BillImportComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'BillExportComponent',
                title: 'PHIẾU XUẤT',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission(''),
                comp: BillExportComponent,
                //   icon: 'assets/icon/layers.png',
              },
            ]
          }
        ],
      },
      //#endregion
      //#region menu Nhân sự
      {
        kind: 'group',
        key: 'hrm',
        stt: 2,
        title: 'HRM',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_hrm_24.png',

        children: [
          {
            kind: 'leaf',
            key: 'HrhiringRequestComponent',
            title: 'TUYỂN DỤNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: HrhiringRequestComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'group',
            key: 'DanhSachTaiSan',
            title: 'Tài sản',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'TsAssetManagementComponent',
                title: 'Danh sách tài sản',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
                comp: TsAssetManagementComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetTypeComponent',
                title: 'Loại tài sản',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N23,N1'),
                comp: TsAssetTypeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetSourceComponent',
                title: 'Nguồn gốc tài sản',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N23,N1'),
                comp: TsAssetSourceComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'TsAssetAllocationComponent',
                title: 'Cấp phát',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: TsAssetAllocationComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'TsAssetRecoveryComponent',
                title: 'Thu hồi',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: TsAssetRecoveryComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetTransferComponent',
                title: 'Điều chuyển',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: TsAssetTransferComponent,
                //   icon: 'assets/icon/layers.png',
              },
            ],
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'group',
            key: 'TsAssetManagementPersonalComponent1',
            title: 'Tài sản cá nhân',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
            children: [
              {
                kind: 'leaf',
                key: 'TsAssetManagementPersonalComponent',
                title: 'Tài sản cá nhân',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
                comp: TsAssetManagementPersonalComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetManagementPersonalTypeComponent',
                title: 'Loại tài sản cá nhân',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
                comp: TsAssetManagementPersonalTypeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetAllocationPersonalComponent',
                title: 'Cấp phát tài sản cá nhân',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N67,N36'),
                comp: TsAssetAllocationPersonalComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetRecoveryPersonalComponent',
                title: 'Thu hồi tài sản cá nhân',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N67,N36'),
                comp: TsAssetRecoveryPersonalNewComponent,
                //   icon: 'assets/icon/layers.png',
              },
            ],
          },

          {
            kind: 'group',
            key: 'VehicleRepairComponent121',
            title: 'Quản lí xe',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'VehicleManagementComponent',
                title: 'Danh sách xe',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: VehicleManagementComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'VehicleRepairComponent',
                title: 'Danh sách xe sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: VehicleRepairComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'VehicleRepairTypeComponent',
                title: 'Danh sách loại sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: VehicleRepairTypeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'VehicleRepairHistory',
                title: 'Danh sách lịch sử sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: VehicleRepairHistoryComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'ProposeVehicleRepair',
                title: 'Danh sách  đề xuất sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: ProposeVehicleRepairComponent,
                //   icon: 'assets/icon/layers.png',
              },
            ],
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'group',
            key: 'OfficeSupply',
            title: 'Văn phòng phẩm',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'OfficeSupplyComponent',
                title: 'Danh sách VPP',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: OfficeSupplyComponent,
              },
              {
                kind: 'leaf',
                key: 'OfficeSupplyUnitComponent',
                title: 'Đơn vị tính',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: OfficeSupplyUnitComponent,
              },
              {
                kind: 'leaf',
                key: 'OfficeSupplyRequestsComponent',
                title: 'Đăng kí VPP',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                  'N2,N34,N1,N54,N72,N70'
                ),
                comp: OfficeSupplyRequestsComponent,
              },
              {
                kind: 'leaf',
                key: 'OfficeSupplyRequestSummaryComponent',
                title: 'Tổng hợp VPP',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N2,N34,N1,N72'),
                comp: OfficeSupplyRequestSummaryComponent,
              },
            ],
          },
          {
            kind: 'group',
            key: 'Employee',
            title: 'Quản lí nhân viên',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N2,N1'),
            children: [
              {
                kind: 'leaf',
                key: 'DepartmentComponent',
                title: 'Phòng ban',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: DepartmentComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'TeamComponent',
                title: 'Team',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: TeamComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'PositionsComponent',
                title: 'Chức vụ',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: PositionsComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'EmployeeComponent',
                title: 'Nhân viên',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N60,N1'),
                comp: EmployeeComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'ContractComponent',
                title: 'Hợp đồng',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
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
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: HolidayComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'FoodOrderComponent',
                title: 'Cơm ca',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                  'N2,N23,N34,N1,N52,N80'
                ),
                comp: FoodOrderComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'DayOffComponent',
                title: 'Quản lý nghỉ',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: DayOffComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'EarlyLateComponent',
                title: 'Đi muộn - về sớm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: EarlyLateComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'OverTimeComponent',
                title: 'Làm thêm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: OverTimeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'EmployeeBussinessComponent',
                title: 'Công tác',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
                comp: EmployeeBussinessComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'NightShiftComponent',
                title: 'Làm đêm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1'),
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
                isPermission: this.permissionService.hasPermission('N2,N1'),
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
                key: 'HandoverComponent',
                title: 'Biên bản bàn giao',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: HandoverComponent,
                //   icon: 'assets/icon/layers.png',
              },

              //#region QUẢN LÝ VPP
              {
                kind: 'leaf',
                key: 'OfficeSupplyComponent',
                title: 'Danh sách VPP',
                isOpen: true,
                isPermission: false,
                comp: OfficeSupplyComponent,
                //   icon: 'assets/icon/layers.png',
              },
              //#endregion
            ],
          },

          {
            kind: 'leaf',
            key: 'DailyReportHrComponent',
            title: 'Báo cáo công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: DailyReportHrComponent,
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
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_categories_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'TrainingRegistrationComponent',
            title: 'ĐÀO TẠO',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: TrainingRegistrationComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'FactoryVisitRegistrationComponent',
            title: 'THAM QUAN NHÀ MÁY',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: FactoryVisitRegistrationComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'UnitCountComponent',
            title: 'ĐƠN VỊ TÍNH',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: UnitCountComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'ProductLocationComponent',
            title: 'VỊ TRÍ THIẾT BỊ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProductLocationComponent,
            //   icon: 'assets/icon/layers.png',
          },
        ],
      },

      //#endregion
      //#region menu Mua hàng
      {
        kind: 'group',
        key: 'purchase',
        title: 'MUA HÀNG',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_categories_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'EmployeePurchaseComponent',
            title: 'NHÂN VIÊN MUA HÀNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: EmployeePurchaseComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'RulePayComponent',
            title: 'ĐIỀU KHOẢN THANH TOÁN',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: RulePayComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'CurrencyListComponent',
            title: 'TIỀN TỆ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: CurrencyListComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'UnitCountComponent',
            title: 'ĐƠN VỊ TÍNH',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: UnitCountComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'FirmComponent',
            title: 'HÃNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: FirmComponent,
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
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_project_24.png',
        children: [
          {
            kind: 'leaf',
            key: 'ProjectComponent',
            title: 'Danh sách dự án',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(
              'N28,N13,N27,N31,N33,N1,N69,N36'
            ),
            comp: ProjectComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkPropressComponent',
            title: 'Tiến độ công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectWorkPropressComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkTimelineComponent',
            title: 'Timeline công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectWorkTimelineComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectSurveyComponent',
            title: 'Khảo sát dự án',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),

            comp: ProjectSurveyComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectItemLateComponent',
            title: 'Hạng mục công việc chậm tiến độ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),

            comp: ProjectItemLateComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectWorkItemTimelineComponent',
            title: 'Timeline hạng mục công việc',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectWorkItemTimelineComponent,
          },
          {
            kind: 'leaf',
            key: 'SynthesisOfGeneratedMaterialsComponent',
            title: 'Báo cáo vật tư phát sinh',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: SynthesisOfGeneratedMaterialsComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectNewComponent',
            title: 'Tổng hợp dự án phòng ban',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectNewComponent,
          },
          {
            kind: 'leaf',
            key: 'MeetingMinuteComponent',
            title: 'Biên bản cuộc họp',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: MeetingMinuteComponent,
          },
          {
            kind: 'group',
            key: 'SettingLeader',
            title: 'Cài đặt',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'ProjectLeaderProjectTypeComponent',
                title: 'Leader kiểu dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: ProjectLeaderProjectTypeComponent,
              },
            ],
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
  stt?: number;
  title: string;
  isOpen: boolean;
  icon?: string | null; // tùy chọn
  isPermission: boolean;
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
