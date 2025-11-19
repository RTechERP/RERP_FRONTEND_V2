import { MaterialDetailOfProductRtcComponent } from './../../../old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
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
import { TrainingRegistrationComponent } from '../../../training-registration/training-registration.component';
import { ContractComponent } from '../../../hrm/contract/contract.component';
// import { CustomerComponent } from '../../../old/customer/customer.component';
import { DayOffComponent } from '../../../hrm/day-off/day-off.component';
import { DepartmentComponent } from '../../../hrm/department/department.component';
import { EarlyLateComponent } from '../../../hrm/early-late/early-late.component';
import { EmployeeAttendanceComponent } from '../../../old/employee-attendance/employee-attendance.component';
import { EmployeeBussinessComponent } from '../../../hrm/employee-bussiness/employee-bussiness.component';
import { EmployeeComponent } from '../../../hrm/employee/employee.component';
import { HolidayComponent } from '../../../hrm/holiday/holiday.component';
import { NightShiftComponent } from '../../../old/night-shift/night-shift.component';
import { OverTimeComponent } from '../../../hrm/over-time/over-time.component';
import { PositionsComponent } from '../../../hrm/positions/positions.component';
import { ProjectItemLateComponent } from '../../../project/project-item-late/project-item-late.component';
import { ProjectSurveyComponent } from '../../../project/project-survey/project-survey.component';
import { ProjectWorkItemTimelineComponent } from '../../../project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../../../project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../../../project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../../../project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../../../project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { ProductSaleComponent } from '../../../old/Sale/ProductSale/product-sale.component';
import { TbProductRtcComponent } from '../../../old/tb-product-rtc/tb-product-rtc.component';
import { TeamComponent } from '../../../hrm/team/team.component';
import { TsAssetAllocationPersonalComponent } from '../../../old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetAllocationComponent } from '../../../hrm/asset/asset/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetManagementPersonalTypeComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../../../old/ts-asset-management-personal/ts-asset-management-personal.component';
import { TsAssetManagementComponent } from '../../../hrm/asset/asset/ts-asset-management/ts-asset-management.component';
import { TsAssetRecoveryComponent } from '../../../hrm/asset/asset/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetTransferComponent } from '../../../hrm/asset/asset/ts-asset-transfer/ts-asset-transfer.component';
import { PermissionService } from '../../../../services/permission.service';
// import { OfficeSupplyComponent } from '../../../old/OfficeSuppliesManagement/OfficeSupply/office-supply.component';
import { ProjectLeaderProjectTypeComponent } from '../../../project/project-leader-project-type/project-leader-project-type.component';
import { MeetingMinuteComponent } from '../../../project/meeting-minute/meeting-minute.component';
import { ProjectDepartmentSummaryComponent } from '../../../project/project-department-summary/project-department-summary.component';
//import { CustomerComponent } from '../../../crm/customers/customer/customer.component';
import { PlanWeekComponent } from '../../../old/VisionBase/plan-week/plan-week.component';
import { TsAssetTypeComponent } from '../../../hrm/asset/asset/ts-asset-type/ts-asset-type.component';
import { TsAssetSourceComponent } from '../../../hrm/asset/asset/ts-asset-source/ts-asset-source.component';
import { OfficeSupplyUnitComponent } from '../../../hrm/office-supply/OfficeSupplyUnit/office-supply-unit.component';
import { OfficeSupplyComponent } from '../../../hrm/office-supply/OfficeSupply/office-supply.component';
import { OfficeSupplyRequestsComponent } from '../../../hrm/office-supply/OfficeSupplyRequests/office-supply-requests.component';
import { OfficeSupplyRequestSummaryComponent } from '../../../hrm/office-supply/OfficeSupplyRequestSummary/office-supply-request-summary.component';
import { VehicleRepairHistoryComponent } from '../../../hrm/vehicle/propose-vehicle-repair/vehicle-repair-history/vehicle-repair-history/vehicle-repair-history.component';
import { ProposeVehicleRepairComponent } from '../../../hrm/vehicle/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair.component';
import { DailyReportHrComponent } from '../../../hrm/daily-report-hr/daily-report-hr.component';
import { PriceHistoryPartlistComponent } from '../../../project/price-history-partlist/price-history-partlist.component';
import { ProjectTypeComponent } from '../../../project/project-type/project-type.component';

import { EmployeePurchaseComponent } from '../../../purchase/employee-purchase/employee-purchase.component';
import { RulePayComponent } from '../../../purchase/rulepay/rule-pay.component';
import { CurrencyListComponent } from '../../../general-category/currency-list/currency-list.component';
import { UnitCountComponent } from '../../../old/Sale/ProductSale/unit-count/unit-count.component';
import { ProductLocationComponent } from '../../../general-category/product-location/product-location.component';
import { FirmComponent } from '../../../general-category/firm/firm.component';
import { CustomerComponent } from '../../../old/customer/customer.component';
import { PayrollComponent } from '../../../hrm/payroll/payroll/payroll.component';
import { FollowProjectBaseComponent } from '../../../old/VisionBase/kho-base/follow-project-base/follow-project-base.component';
import { InventoryComponent } from '../../../old/Sale/Inventory/inventory.component';
import { InventoryBorrowNCCComponent } from '../../../old/Sale/Inventory/Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';
import { BillImportComponent } from '../../../old/Sale/BillImport/bill-import.component';
import { BillExportComponent } from '../../../old/Sale/BillExport/bill-export.component';
import { ProjectFieldComponent } from '../../../project/project-field/project-field/project-field.component';
import { QuotationKhComponent } from '../../../old/quotation-kh/quotation-kh.component';
import { PokhKpiComponent } from '../../../old/pokh-kpi/pokh-kpi.component';
import { PokhHistoryComponent } from '../../../old/pokh-history/pokh-history.component';
import { PokhComponent } from '../../../old/pokh/pokh.component';

import { SupplierSaleComponentComponent } from '../../../old/supplier-sale-component/supplier-sale-component.component';
import { AppUserService } from '../../../../services/app-user.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { LeaderProjectComponent } from '../../../project/leader-project/leader-project.component';
import { FilmManagementComponent } from '../../../hrm/film-management/film-management.component';
import { AgvProductComponent } from '../../../warehouse/agv/agv-product/agv-product.component';
import { HistoryImportExportComponent } from '../../../old/Sale/HistoryImportExport/history-import-export.component';
import { HistoryBorrowSaleComponent } from '../../../old/Sale/HistoryBorrowSale/history-borrow-sale.component';
import { ReportImportExportComponent } from '../../../old/Sale/ReportImportExport/report-import-export.component';
import { InventoryDemoComponent } from '../../../old/inventory-demo/inventory-demo.component';
import { BillImportTechnicalComponent } from '../../../old/bill-import-technical/bill-import-technical.component';
import { InventoryBorrowSupplierDemoComponent } from '../../../old/inventory-demo/inventory-borrow-supplier-demo/inventory-borrow-supplier-demo.component';
import { ProductReportNewComponent } from '../../../old/product-report-new/product-report-new.component';
import { ProductExportAndBorrowComponent } from '../../../old/Technical/product-export-and-borrow/product-export-and-borrow.component';
import { ListProductProjectComponent } from '../../../old/Sale/ListProductProject/list-product-project.component';
import { SearchProductSerialNumberComponent } from '../../../old/Sale/SearchProductSerialNumber/search-product-serial-number.component';
import { BillExportTechnicalComponent } from '../../../old/bill-export-technical/bill-export-technical.component';
import { BorrowReportComponent } from '../../../old/Technical/borrow-report/borrow-report.component';
import { DocumentComponent } from '../../../hrm/document/document.component';
import { VehicleBookingManagementComponent } from '../../../hrm/vehicle/vehicle-booking-management/vehicle-booking-management.component';
import { ProtectgearComponent } from '../../../hrm/protectgear/protectgear/protectgear.component';

import { MeetingMinuteTypeComponent } from '../../../project/meeting-minute/meeting-minute-type/meeting-minute-type.component';
import { ProjectAgvSummaryComponent } from '../../../project/project-agv-summary/project-agv-summary.component';
import { FoodOrderComponent } from '../../../hrm/food-order/food-order.component';
@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = environment.host + 'api/menu/';
  //   private apiUrl = HOST + 'api/menu/';
  constructor(
    private http: HttpClient,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private notification: NzNotificationService
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
                isPermission: this.permissionService.hasPermission(
                  'N27,N29,N31,N30,N1,N36'
                ),
                comp: InventoryComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'BillImportComponent',
                title: 'PHIẾU NHẬP',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                  'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                ),
                comp: BillImportComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'BillExportComponent',
                title: 'PHIẾU XUẤT',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                  'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                ),
                comp: BillExportComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'HistoryImportExportComponent',
                title: 'LỊCH SỬ NHẬP XUẤT',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N27,N29,N1,N36,N35'),
                comp: HistoryImportExportComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'HistoryBorrowSaleComponent',
                title: 'LỊCH SỬ MƯỢN SẢN PHẨM',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: HistoryBorrowSaleComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'ReportImportExportComponent',
                title: 'BÁO CÁO NHẬP XUẤT',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N27,N29,N1,N36,N35'),
                comp: ReportImportExportComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'ListProductProjectComponent',
                title: 'DANH SÁCH SẢN PHẨM THEO DỰ ÁN',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: ListProductProjectComponent,
              },
              {
                kind: 'leaf',
                key: 'SearchProductSerialNumberComponent',
                title: 'TRA CỨU SERIAL NUMBER',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: SearchProductSerialNumberComponent,
              },
            ],
          },
          {
            kind: 'group',
            key: 'Demo',
            title: 'Phòng Kỹ Thuật',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            //   icon: 'assets/icon/layers.png',
            children: [
              {
                kind: 'leaf',
                key: 'InventoryDemoComponent',
                title: 'TỒN KHO DEMO',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: InventoryDemoComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'BillImportTechnicalComponent',
                title: 'PHIẾU NHẬP KHO DEMO',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: BillImportTechnicalComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'BillExportTechnicalComponent',
                title: 'PHIẾU XUẤT KHO DEMO',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: BillExportTechnicalComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'InventoryBorrowNCCComponent',
                title: 'BÁO CÁO MƯỢN',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: InventoryBorrowNCCComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'ProductReportNewRtcComponent',
                title: 'LỊCH SỬ NHÂP XUẤT',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: ProductReportNewComponent,
              },
              {
                kind: 'leaf',
                key: 'ProductExportAndBorrowComponent',
                title: 'DANH SÁCH SẢN PHẨM KHÔNG DÙNG',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: ProductExportAndBorrowComponent,
              },
              {
                kind: 'leaf',
                key: 'BorrowReportComponent',
                title: 'BÁO CÁO MƯỢN NCC DEMO',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: BorrowReportComponent,
              },
            ],
          },
          {
            kind: 'group',
            key: 'agv',
            title: 'AGV',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            //   icon: 'assets/icon/layers.png',
            children: [
              {
                kind: 'leaf',
                key: 'AgvProductComponent',
                title: 'Sản phẩm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: AgvProductComponent,
                //   icon: 'assets/icon/layers.png',
              },

              {
                kind: 'leaf',
                key: 'AgvProductComponent1',
                title: 'Sản phẩm lọc',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: AgvProductComponent,
                //   icon: 'assets/icon/layers.png',
                data: { isDeleted: true },
              },
            ],
          },
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
            icon: 'assets/icon/hr_hiring_24.svg',
          },
          {
            kind: 'leaf',
            key: 'DocumentComponent',
            title: 'Quản lí văn bản',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: DocumentComponent,
            icon: 'assets/icon/hr_document_24.svg',
          },
          {
            kind: 'group',
            key: 'DanhSachTaiSan',
            title: 'Tài sản/công cụ dụng cụ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            icon: 'assets/icon/hr_asset_management_24.svg',
            children: [
              {
                kind: 'leaf',
                key: 'TsAssetManagementComponent',
                title: 'Tài sản',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
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
            icon: 'assets/icon/hr_asset_management_24.svg',
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
                title: 'Loại tài sản',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N36,N34'),
                comp: TsAssetManagementPersonalTypeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetAllocationPersonalComponent',
                title: 'Cấp phát',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N67,N36'),
                comp: TsAssetAllocationPersonalComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'TsAssetRecoveryPersonalComponent',
                title: 'Thu hồi',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N23,N52,N1,N67,N36'),
                comp: TsAssetRecoveryPersonalNewComponent,
                //   icon: 'assets/icon/layers.png',
              },
            ],
          },

          //   {
          //     kind: 'leaf',
          //     key: 'VehicleRepairComponent',
          //     title: 'Xe sửa chữa',
          //     isOpen: true,
          //     isPermission: this.permissionService.hasPermission(''),
          //     comp: VehicleRepairComponent,
          //     //   icon: 'assets/icon/layers.png',
          //   },
          //   {
          //     kind: 'leaf',
          //     key: 'VehicleRepairTypeComponent',
          //     title: 'Loại sửa chữa',
          //     isOpen: true,
          //     isPermission: this.permissionService.hasPermission(''),
          //     comp: VehicleRepairTypeComponent,
          //     //   icon: 'assets/icon/layers.png',
          //   },
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
            kind: 'group',
            key: 'VehicleManagement',
            title: 'Quản lí xe',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            icon: 'assets/icon/hr_vehicle_24.svg',
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
                key: 'VehicleBookingManagementComponent',
                title: 'Đặt xe',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N2,N34,N1,N68,N71'),
                comp: VehicleBookingManagementComponent,
                //   icon: 'assets/icon/layers.png',
              },
              // {
              //   kind: 'leaf',
              //   key: 'VehicleRepairComponent',
              //   title: 'Danh sách xe sửa chữa',
              //   isOpen: true,
              //   isPermission: this.permissionService.hasPermission(''),
              //   comp: VehicleRepairComponent,
              //   //   icon: 'assets/icon/layers.png',
              // },
              {
                kind: 'leaf',
                key: 'VehicleRepairTypeComponent',
                title: 'Loại sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: VehicleRepairTypeComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'ProposeVehicleRepairComponent',
                title: 'Đề xuất sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: ProposeVehicleRepairComponent,
                //   icon: 'assets/icon/layers.png',
              },
              {
                kind: 'leaf',
                key: 'VehicleRepairHistory',
                title: 'Lịch sử sửa chữa',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                comp: VehicleRepairHistoryComponent,
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
            kind: 'leaf',
            key: 'FilmManagement',
            title: 'Quản lí Film',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N1,N44'),
            comp: FilmManagementComponent,
            //   icon: 'assets/icon/layers.png',
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

              // {
              //   kind: 'leaf',
              //   key: 'EmployeeScheduleWorkComponent',
              //   title: 'Quá trình công tác',
              //   isOpen: true,
              //   isPermission: this.permissionService.hasPermission('N2,N1'),
              //   comp: EmployeeScheduleWorkComponent,
              //   //   icon: 'assets/icon/layers.png',
              // },

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

              {
                kind: 'leaf',
                key: 'PayrollComponent',
                title: 'Bảng lương',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N2,N1,N52'),
                comp: PayrollComponent,
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
            isPermission: this.permissionService.hasPermission('N42,N2,N1'),
            comp: DailyReportHrComponent,
            //   icon: 'assets/icon/layers.png',
          },

          {
            kind: 'leaf',
            key: 'ProtectgearComponent',
            title: 'Tủ đồ bảo hộ phòng sạch',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N42,N2,N1'),
            comp: ProtectgearComponent,
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
            isPermission: this.permissionService.hasPermission('N27,N1'),
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
        icon: 'assets/icon/ic_purchase_100px.svg',
        children: [
          {
            kind: 'leaf',
            key: 'EmployeePurchaseComponent',
            title: 'NHÂN VIÊN MUA HÀNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N33,N1'),
            comp: EmployeePurchaseComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'RulePayComponent',
            title: 'ĐIỀU KHOẢN THANH TOÁN',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N22,N33,N35,N1'),
            comp: RulePayComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'CurrencyListComponent',
            title: 'TIỀN TỆ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N33,N1'),
            comp: CurrencyListComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'UnitCountComponent',
            title: 'ĐƠN VỊ TÍNH',
            isOpen: true,
            isPermission: this.permissionService.hasPermission('N27,N1'),
            comp: UnitCountComponent,
            //   icon: 'assets/icon/layers.png',
          },
          {
            kind: 'leaf',
            key: 'FirmComponent',
            title: 'HÃNG',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N27,N31,N1,N35'),
            comp: FirmComponent,
            //   icon: 'assets/icon/layers.png',
          },
        ],
      },
      //#endregion
      //#region menu dự án
      {
        kind: 'group',
        key: 'generalCategory',
        title: 'DANH MỤC CHUNG',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_project_24.png',
        children: [
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
            key: 'CurrencyListComponent',
            title: 'Tiền tệ',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: CurrencyListComponent,
          },
          {
            kind: 'leaf',
            key: 'ProductLocationComponent',
            title: 'Vị trí thiết bị',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProductLocationComponent,
          },
          {
            kind: 'leaf',
            key: 'SupplierSaleComponent',
            title: 'Nhà cung cấp',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: SupplierSaleComponentComponent,
          },
          {
            kind: 'leaf',
            key: 'FirmComponent',
            title: 'Hãng',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: FirmComponent,
          },
        ],
      },

      //#endregion
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
            key: 'MeetingMinuteComponent',
            title: 'Biên bản cuộc họp',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: MeetingMinuteComponent,
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
            key: 'ProjectAgvSummaryComponent',
            title: 'Tổng hợp dự án cơ khí - agv',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectAgvSummaryComponent,
          },
          {
            kind: 'leaf',
            key: 'ProjectNewComponent',
            title: 'Tổng hợp dự án phòng ban',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: ProjectDepartmentSummaryComponent,
          },
          {
            kind: 'leaf',
            key: 'PriceHistoryPartlistComponent',
            title: 'Lịch sử giá',
            isOpen: true,
            isPermission:
              this.permissionService.hasPermission('N38,N1,N79,N13,N82'),
            comp: PriceHistoryPartlistComponent,
          },
          {
            kind: 'group',
            key: 'SettingProject',
            title: 'Cài đặt',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'ProjectTypeComponent',
                title: 'Kiểu dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N1'),
                comp: ProjectTypeComponent,
              },
              {
                kind: 'leaf',
                key: 'ProjectLeaderProjectTypeComponent',
                title: 'Leader kiểu dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: ProjectLeaderProjectTypeComponent,
              },
              {
                kind: 'leaf',
                key: 'ProjectFieldComponent',
                title: 'Lĩnh vực dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N31,N1'),
                comp: ProjectFieldComponent,
              },
              {
                kind: 'leaf',
                key: 'LeaderProjectComponent',
                title: 'Leader dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N13,N1'),
                comp: LeaderProjectComponent,
              },
              {
                kind: 'leaf',
                key: 'MeetingMinuteTypeComponent',
                title: 'Loại biên bản cuộc họp',
                isOpen: true,
                isPermission: this.permissionService.hasPermission('N13,N1'),
                comp: MeetingMinuteTypeComponent,
              },
            ],
          },
        ],
      },
      //#endregion

      //#region Phòng sale
      {
        kind: 'group',
        key: 'SALE',
        title: 'PHÒNG SALE',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_project_24.png',
        children: [
          {
            kind: 'group',
            key: 'POKHComponent',
            title: 'PO KHÁCH HÀNG',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'POKHComponent',
                title: 'Danh sách PO KHÁCH HÀNG',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PokhComponent,
              },
              {
                kind: 'leaf',
                key: 'QuotationKhComponent',
                title: 'BÁO GIÁ KHÁCH HÀNG',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: QuotationKhComponent,
              },
              {
                kind: 'leaf',
                key: 'PokhKpiComponent',
                title: 'XUẤT PO KHÁCH HÀNG CHI TIẾT',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PokhKpiComponent,
              },
              {
                kind: 'leaf',
                key: 'POKHHistoryComponent',
                title: 'LỊCH SỬ PO KHÁCH HÀNG',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PokhHistoryComponent,
              },
            ],
          },
          {
            kind: 'group',
            key: 'ProjectComponent',
            title: 'Vision Base',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'PlanWeekComponent',
                title: 'Kế hoạch tuần',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                  "'N1,N27,N53,N31,N69'"
                ),
                comp: PlanWeekComponent,
              },
              {
                kind: 'leaf',
                key: 'FollowProjectBaseComponent',
                title: 'Follow dự án',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: FollowProjectBaseComponent,
              },
            ],
          },
        ],
      },
    ];

    return menus;
  }

  goToOldLink(router: String) {
    let data: any = {
      UserName: this.appUserService.loginName,
      Password: this.appUserService.password,
      Router: router,
    };

    const url = `http://113.190.234.64:8081${router}`;

    const urlOld = 'http://113.190.234.64:8081/Home/LoginNew';
    // console.log('gotoOldLink:',url);

    return this.http
      .post<any>(urlOld, data, { withCredentials: true })
      .subscribe({
        next: (response) => {
          window.open(url, '_blank');
        },
        error: (err) => {
          // console.log('err:', err);
          this.notification.error(NOTIFICATION_TITLE.error, err.message);
        },
      });
  }
}

type BaseItem = {
  key: string;
  stt?: number;
  title: string;
  isOpen: boolean;
  icon?: string | null; // tùy chọn
  isPermission: boolean;
  data?: {};
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
