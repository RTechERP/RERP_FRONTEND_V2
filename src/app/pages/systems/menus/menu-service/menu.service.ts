import { Injectable, Type } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { FactoryVisitRegistrationComponent } from '../../../general-category/visit-factory-registation/factory-visit-registration.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { HandoverComponent } from '../../../hrm/handover/handover.component';
import { HrhiringRequestComponent } from '../../../hrm/hrhiring-request/hrhiring-request.component';
import { VehicleManagementComponent } from '../../../hrm/vehicle/vehicle-management/vehicle-management.component';
import { VehicleRepairTypeComponent } from '../../../hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { TrainingRegistrationComponent } from '../../../training-registration/training-registration.component';
import { ContractComponent } from '../../../hrm/contract/contract.component';
import { DayOffComponent } from '../../../hrm/day-off/day-off.component';
import { DepartmentComponent } from '../../../hrm/department/department.component';
import { EarlyLateComponent } from '../../../hrm/early-late/early-late.component';
import { EmployeeAttendanceComponent } from '../../../hrm/employee-management/employee-attendance/employee-attendance.component';
import { EmployeeBussinessComponent } from '../../../hrm/employee-management/employee-bussiness/employee-bussiness.component';
import { EmployeeComponent } from '../../../hrm/employee/employee.component';
import { HolidayComponent } from '../../../hrm/holiday/holiday.component';
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

import { ProjectLeaderProjectTypeComponent } from '../../../project/project-leader-project-type/project-leader-project-type.component';
import { MeetingMinuteComponent } from '../../../project/meeting-minute/meeting-minute.component';
import { ProjectDepartmentSummaryComponent } from '../../../project/project-department-summary/project-department-summary.component';

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
import { CustomerComponent } from '../../../crm/customers/customer/customer.component';
import { PayrollComponent } from '../../../hrm/payroll/payroll/payroll.component';
import { FollowProjectBaseComponent } from '../../../old/VisionBase/kho-base/follow-project-base/follow-project-base.component';
import { InventoryComponent } from '../../../old/Sale/Inventory/inventory.component';
import { BillImportComponent } from '../../../old/Sale/BillImport/bill-import.component';
import { BillExportComponent } from '../../../old/Sale/BillExport/bill-export.component';
import { ProjectFieldComponent } from '../../../project/project-field/project-field/project-field.component';
import { QuotationKhComponent } from '../../../old/quotation-kh/quotation-kh.component';
import { PokhKpiComponent } from '../../../old/pokh-kpi/pokh-kpi.component';
import { PokhHistoryComponent } from '../../../old/pokh-history/pokh-history.component';
import { PokhComponent } from '../../../old/pokh/pokh.component';
import { AppUserService } from '../../../../services/app-user.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { LeaderProjectComponent } from '../../../project/leader-project/leader-project.component';
import { FilmManagementComponent } from '../../../hrm/film-management/film-management.component';
import { HistoryImportExportComponent } from '../../../old/Sale/HistoryImportExport/history-import-export.component';
import { HistoryBorrowSaleComponent } from '../../../old/Sale/HistoryBorrowSale/history-borrow-sale.component';
import { ReportImportExportComponent } from '../../../old/Sale/ReportImportExport/report-import-export.component';
import { InventoryDemoComponent } from '../../../old/inventory-demo/inventory-demo.component';
import { BillImportTechnicalComponent } from '../../../old/bill-import-technical/bill-import-technical.component';
import { ProductReportNewComponent } from '../../../old/product-report-new/product-report-new.component';
import { ProductExportAndBorrowComponent } from '../../../old/Technical/product-export-and-borrow/product-export-and-borrow.component';
import { ListProductProjectComponent } from '../../../old/Sale/ListProductProject/list-product-project.component';
import { SearchProductSerialNumberComponent } from '../../../old/Sale/SearchProductSerialNumber/search-product-serial-number.component';
import { BillExportTechnicalComponent } from '../../../old/bill-export-technical/bill-export-technical.component';
import { BorrowReportComponent } from '../../../old/Technical/borrow-report/borrow-report.component';
import { DocumentComponent } from '../../../hrm/document/document.component';
import { VehicleBookingManagementComponent } from '../../../hrm/vehicle/vehicle-booking-management/vehicle-booking-management.component';
import { ProtectgearComponent } from '../../../hrm/protectgear/protectgear/protectgear.component';
import { EmployeeNightShiftComponent } from '../../../hrm/employee-management/employee-night-shift/employee-night-shift/employee-night-shift.component';
import { WFHComponent } from '../../../hrm/employee-management/employee-wfh/WFH.component';

import { MeetingMinuteTypeComponent } from '../../../project/meeting-minute/meeting-minute-type/meeting-minute-type.component';
import { ProjectAgvSummaryComponent } from '../../../project/project-agv-summary/project-agv-summary.component';
import { FoodOrderComponent } from '../../../hrm/food-order/food-order.component';
// import { ProjectPartlistPurchaseRequestComponent } from '../../../project/project-department-summary/project-department-summary-form/project-part-list/project-part-list-purchase-request/project-part-list-purchase-request.component';
import { SupplierSaleComponent } from '../../../purchase/supplier-sale/supplier-sale.component';
import { EmployeeNoFingerprintComponent } from '../../../hrm/employee-management/employee-no-fingerprint/employee-no-fingerprint.component';

import { BorrowProductHistoryComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history.component';
import { SearchProductTechSerialComponent } from '../../../old/Technical/search-product-tech-serial/search-product-tech-serial.component';
import { EmployeeCurricularComponent } from '../../../hrm/employee-management/employee-curriculart/employee-curricular/employee-curricular.component';
import { EmployeeErrorComponent } from '../../../hrm/employee-management/employee-error/employee-error.component';
import { EmployeeTimekeepingComponent } from '../../../hrm/employee-management/employee-timekeeping/employee-timekeeping.component';
import { EmployeeSyntheticComponent } from '../../../hrm/employee-management/employee-synthetic/employee-synthetic/employee-synthetic.component';

import { AppComponent } from '../../../../app.component';
import { BonusCoefficientComponent } from '../../../old/bonus-coefficient/bonus-coefficient.component';
import { ProductRtcQrCodeComponent } from '../../../old/product-rtc-qr-code/product-rtc-qr-code/product-rtc-qr-code.component';
import { ProjectPartlistPurchaseRequestComponent } from '../../../purchase/project-partlist-purchase-request/project-partlist-purchase-request.component';
import { ProjectPartlistPriceRequestComponent } from '../../../old/project-partlist-price-request/project-partlist-price-request.component';
import { PONCCComponent } from '../../../purchase/poncc/poncc.component';
import { EmployeeSaleManagerComponent } from '../../../old/KPISale/employee-sale-manager/employee-sale-manager.component';
import { RequestInvoiceComponent } from '../../../old/request-invoice/request-invoice.component';
import { AssignWorkComponent } from '../../../purchase/assign-work/assign-work.component';
import { RecommendSupplierComponent } from '../../../hrm/recommend-supplier/recommend-supplier.component';
import { HrPurchaseProposalComponent } from '../../../hrm/hr-purchase-proposal/hr-purchase-proposal.component';
import { PersonComponent } from '../../../person/person.component';
import { InventoryProjectComponent } from '../../../purchase/inventory-project/inventory-project/inventory-project.component';
import { WarehouseComponent } from '../../../warehouse/warehouse.component';
import { WarehouseComponent1 } from '../../../general-category/wearhouse/warehouse/warehouse.component';
import { DailyReportSaleComponent } from '../../../old/KPISale/daily-report-sale/daily-report-sale.component';
import { InventoryByProductComponent } from '../../../purchase/inventory-by-product/inventory-by-product.component';
import { PersonDayOffComponent } from '../../../hrm/day-off/person-day-off/person-day-off.component';
import { ProductLocationTechnicalComponent } from '../../../old/Technical/product-location-technical/product-location-technical.component';
import { ProjectPartListComponent } from '../../../project/project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { CourseManagementComponent } from '../../../Course/course-management/course-management.component';
import { EarlyLateSummaryComponent } from '../../../hrm/early-late/early-late-summary/early-late-summary.component';
import { WFHSummaryComponent } from '../../../hrm/employee-management/employee-wfh/WFH-summary/wfh-summary.component';
import { EmployeeNoFingerSummaryComponent } from '../../../hrm/employee-management/employee-no-fingerprint/employee-no-finger-summary/employee-no-finger-summary.component';
import { EmployeeNightShiftPersonSummaryComponent } from '../../../hrm/employee-management/employee-night-shift/employee-night-shift-person-summary/employee-night-shift-person-summary.component';
import { EmployeeBussinessPersonSummaryComponent } from '../../../hrm/employee-management/employee-bussiness/employee-bussiness-person-summary/employee-bussiness-person-summary.component';
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
    ) { }

    private menuKeySource = new BehaviorSubject<string>('');
    menuKey$ = this.menuKeySource.asObservable();

    departmentTechs: any[] = [2, 11, 12, 13];
    departmentAgvCokhis = [9, 10];
    departmentLapraps = [23];
    departmentSales = [3, 12];
    departmentHRs = [6, 22];
    employeeHRs = [586];

    positinLXs = [6]; //List chức vụ NV lái xe
    positinCPs = [7, 72]; //List chức vụ NV cắt phim
    marketings = [8];

    userAllReportTechs = [
        1, 23, 24, 78, 88, 1221, 1313, 1434, 1431, 53, 51, 1534,
    ];

    getMenus(): MenuItem[] {
        let id = this.appUserService.currentUser?.ID || 0;
        let employeeID = this.appUserService.currentUser?.EmployeeID || 0;
        let departmentID = this.appUserService.currentUser?.DepartmentID || 0;
        let positionID = this.appUserService.currentUser?.PositionID || 0;
        let isHR =
            this.employeeHRs.includes(employeeID) ||
            this.departmentHRs.includes(departmentID);

        const isAdmin =
            this.appUserService.currentUser?.IsAdmin &&
            this.appUserService.currentUser?.EmployeeID <= 0;

        const menus: MenuItem[] = [
            //#region menu CRM
            {
                kind: 'group',
                key: 'crm',
                stt: 1,
                title: 'CRM',
                isOpen: true,
                isPermission: true,
                icon: 'assets/icon/menu_crm.svg',
                children: [
                    {
                        kind: 'leaf',
                        key: 'CustomerComponent',
                        title: 'Khách hàng',
                        isOpen: true,
                        isPermission:
                            this.permissionService.hasPermission('N1,N27,N53,N31,N69'),
                        comp: CustomerComponent,
                        // icon: 'assets/icon/menu_crm.svg',
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
                icon: 'assets/icon/menu_warehouse.svg',
                children: [
                    //#region KHO HN
                    {
                        kind: 'group',
                        key: 'HN',
                        stt: 2,
                        title: 'Hà Nội',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        icon: 'assets/icon/menu_warehouse.svg',
                        children: [
                            //#region Sale
                            {
                                kind: 'group',
                                key: 'Sale',
                                title: 'Phòng Sale',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                // icon: 'assets/icon/menu_sale_24.png',
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryComponent_HN',
                                        title: 'TỒN KHO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N31,N30,N1,N36'
                                        ),
                                        comp: InventoryComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportComponent_HN',
                                        title: 'PHIẾU NHẬP',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillImportComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                            warehouseID: 1,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportComponent_HN',
                                        title: 'PHIẾU XUẤT',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillExportComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryImportExportComponent_HN',
                                        title: 'LỊCH SỬ NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: HistoryImportExportComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryBorrowSaleComponent_HN',
                                        title: 'LỊCH SỬ MƯỢN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: HistoryBorrowSaleComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ReportImportExportComponent_HN',
                                        title: 'BÁO CÁO NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: ReportImportExportComponent,
                                        data: {
                                            warehousecode: 'HN',
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ListProductProjectComponent_HN',
                                        title: 'SẢN PHẨM THEO DỰ ÁN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ListProductProjectComponent,
                                        data: {
                                            warehouseCode: 'HN',
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductSerialNumberComponent_HN',
                                        title: 'TRA CỨU SERIAL NUMBER',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductSerialNumberComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                    },
                                ],
                            },
                            //#endregion

                            //#region Demo
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
                                        key: 'InventoryDemoComponent_HN',
                                        title: 'TỒN KHO DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: InventoryDemoComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },

                                    {
                                        kind: 'leaf',
                                        key: 'BillImportTechnicalComponent_HN',
                                        title: 'PHIẾU NHẬP DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillImportTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportTechnicalComponent_HN',
                                        title: 'PHIẾU XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillExportTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },

                                    {
                                        kind: 'leaf',
                                        key: 'ProductReportNewRtcComponent_HN',
                                        title: 'LỊCH SỬ NHÂP - XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductReportNewComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductExportAndBorrowComponent_HN',
                                        title: 'SẢN PHẨM KHÔNG DÙNG',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductExportAndBorrowComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowReportComponent_HN',
                                        title: 'BÁO CÁO MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowReportComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowProductHistoryComponent_HN',
                                        title: 'LỊCH SỬ MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowProductHistoryComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductTechSerialComponent_HN',
                                        title: 'TRA CỨU SERIALNUMBER DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductTechSerialComponent,
                                        data: {
                                            wearHouseID: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductLocationTechnicalComponent',
                                        title: 'Vị trí',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission('N26'),
                                        comp: ProductLocationTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 1,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductRtcQrCodeComponent_HN',
                                        title: 'QR Code',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductRtcQrCodeComponent,
                                        data: {
                                            warehouseID: 1,
                                        },
                                    },
                                ],
                            },
                            //#endregion

                            //#region  AGV
                            {
                                kind: 'group',
                                key: 'agv',
                                title: 'Phòng AGV',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                //   icon: 'assets/icon/layers.png',
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryDemoComponent_AGV',
                                        title: 'TỒN KHO AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: InventoryDemoComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportTechnicalComponent_AGV',
                                        title: 'PHIẾU NHẬP AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillImportTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportTechnicalComponent_AGV',
                                        title: 'PHIẾU XUẤT AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillExportTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                        //   icon: 'assets/icon/layers.png',
                                    },

                                    {
                                        kind: 'leaf',
                                        key: 'ProductReportNewRtcComponent_AGV',
                                        title: 'LỊCH SỬ NHÂP - XUẤT AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductReportNewComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                    },
                                    //   {
                                    //     kind: 'leaf',
                                    //     key: 'ProductExportAndBorrowComponent_AGV',
                                    //     title: 'SẢN PHẨM KHÔNG DÙNG',
                                    //     isOpen: true,
                                    //     isPermission: this.permissionService.hasPermission(''),
                                    //     comp: ProductExportAndBorrowComponent,
                                    //     data: {
                                    //       warehouseID: 1,
                                    //       warehouseType: 2,
                                    //     },
                                    //   },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowReportComponent_AGV',
                                        title: 'BÁO CÁO MƯỢN AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowReportComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowProductHistoryComponent_AGV',
                                        title: 'LỊCH SỬ MƯỢN AGV',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowProductHistoryComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductLocationTechnicalComponent',
                                        title: 'Vị trí',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission('N26'),
                                        comp: ProductLocationTechnicalComponent,
                                        data: {
                                            warehouseID: 1,
                                            warehouseType: 2,
                                        },
                                    },
                                ],
                            },
                            //#endregion
                        ],
                    },
                    //#endregion

                    //#region KHO HCM
                    {
                        kind: 'group',
                        key: 'HCM',
                        stt: 3,
                        title: 'HỒ CHÍ MINH',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        icon: 'assets/icon/menu_warehouse.svg',
                        children: [
                            //   {
                            //     kind: 'leaf',
                            //     key: 'ProductSaleComponent_HCM',
                            //     title: 'SẢN PHẨM KHO SALE HCM',
                            //     isOpen: true,
                            //     isPermission:
                            //       this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                            //     comp: ProductSaleComponent,
                            //     data: { warehouseCode: 'HCM' },
                            //   },
                            //   {
                            //     kind: 'leaf',
                            //     key: 'TbProductRtcComponent_HCM',
                            //     title: 'SẢN PHẨM KHO DEMO HCM',
                            //     isOpen: true,
                            //     isPermission:
                            //       this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                            //     comp: TbProductRtcComponent,
                            //     data: { warehouseID: 2 },
                            //   },
                            {
                                kind: 'group',
                                key: 'Sale',
                                title: 'Phòng Sale',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryComponent_HCM',
                                        title: 'TỒN KHO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N31,N30,N33,N29,N54,N1,N36'
                                        ),
                                        comp: InventoryComponent,
                                        data: { warehouseCode: 'HCM' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportComponent_HCM',
                                        title: 'PHIẾU NHẬP',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillImportComponent,
                                        data: { warehouseCode: 'HCM', warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportComponent_HCM',
                                        title: 'PHIẾU XUẤT',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N54,N1,N36,N35'
                                        ),
                                        comp: BillExportComponent,
                                        data: { warehouseCode: 'HCM' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryImportExportComponent_HCM',
                                        title: 'LỊCH SỬ NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N54,N1,N36'
                                            ),
                                        comp: HistoryImportExportComponent,
                                        data: { warehouseCode: 'HCM' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryBorrowSaleComponent_HCM',
                                        title: 'LỊCH SỬ MƯỢN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: HistoryBorrowSaleComponent,
                                        data: { warehouseCode: 'HCM' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ReportImportExportComponent_HCM',
                                        title: 'BÁO CÁO NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N54,N1,N36'
                                            ),
                                        comp: ReportImportExportComponent,
                                        data: { warehousecode: 'HCM' }, // giữ nguyên lowercase như HN
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ListProductProjectComponent_HCM',
                                        title: 'SẢN PHẨM THEO DỰ ÁN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ListProductProjectComponent,
                                        data: { warehouseCode: 'HCM' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductSerialNumberComponent_HCM',
                                        title: 'TRA CỨU SERIAL NUMBER',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductSerialNumberComponent,
                                        data: { warehouseID: 2 },
                                    },
                                ],
                            },
                            {
                                kind: 'group',
                                key: 'Demo',
                                title: 'Phòng Kỹ Thuật',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryDemoComponent_HCM',
                                        title: 'TỒN KHO DEMO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N26,N36,N29,N54,N1'
                                            ),
                                        comp: InventoryDemoComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportTechnicalComponent_HCM',
                                        title: 'PHIẾU NHẬP DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N19,N18,N26,N36,N29,N50,N54,N1'
                                        ),
                                        comp: BillImportTechnicalComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportTechnicalComponent_HCM',
                                        title: 'PHIẾU XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N19,N18,N26,N36,N29,N50,N54,N1'
                                        ),
                                        comp: BillExportTechnicalComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductReportNewRtcComponent_HCM',
                                        title: 'LỊCH SỬ NHẬP - XUẤT DEMO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N26,N36,N29,N54,N1'
                                            ),
                                        comp: ProductReportNewComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductExportAndBorrowComponent_HCM',
                                        title: 'SẢN PHẨM KHÔNG DÙNG',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductExportAndBorrowComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowReportComponent_HCM',
                                        title: 'BÁO CÁO MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N26,N36,N29,N54,N1'
                                            ),
                                        comp: BorrowReportComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowProductHistoryComponent_HCM',
                                        title: 'LỊCH SỬ MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N26,N36,N29,N54,N1'
                                            ),
                                        comp: BorrowProductHistoryComponent,
                                        data: { warehouseID: 2 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductTechSerialComponent_HCM',
                                        title: 'TRA CỨU SERIAL NUMBER DEMO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission('N26,N36,N54,N1'),
                                        comp: SearchProductTechSerialComponent,
                                        data: { wearHouseID: 2 }, // giữ nguyên spelling sai
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductRtcQrCodeComponent_HCM',
                                        title: 'QR Code',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission('N26,N54,N1'),
                                        comp: ProductRtcQrCodeComponent,
                                        data: { warehouseID: 2 },
                                    },
                                ],
                            },
                        ],
                    },
                    //#endregion

                    //#region KHO BẮC NINH
                    {
                        kind: 'group',
                        key: 'BN',
                        stt: 4,
                        title: 'BẮC NINH',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        icon: 'assets/icon/menu_warehouse.svg',
                        children: [
                            {
                                kind: 'group',
                                key: 'Sale',
                                title: 'Phòng Sale',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryComponent_BN',
                                        title: 'TỒN KHO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N31,N30,N1,N36'
                                        ),
                                        comp: InventoryComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportComponent_BN',
                                        title: 'PHIẾU NHẬP',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillImportComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportComponent_BN',
                                        title: 'PHIẾU XUẤT',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillExportComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryImportExportComponent_BN',
                                        title: 'LỊCH SỬ NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: HistoryImportExportComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryBorrowSaleComponent_BN',
                                        title: 'LỊCH SỬ MƯỢN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: HistoryBorrowSaleComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ReportImportExportComponent_BN',
                                        title: 'BÁO CÁO NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: ReportImportExportComponent,
                                        data: { warehousecode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ListProductProjectComponent_BN',
                                        title: 'SẢN PHẨM THEO DỰ ÁN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ListProductProjectComponent,
                                        data: { warehouseCode: 'BN' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductSerialNumberComponent_BN',
                                        title: 'TRA CỨU SERIAL NUMBER',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductSerialNumberComponent,
                                        data: { warehouseID: 3 },
                                    },
                                ],
                            },
                            {
                                kind: 'group',
                                key: 'Demo',
                                title: 'Phòng Kỹ Thuật',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryDemoComponent_BN',
                                        title: 'TỒN KHO DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: InventoryDemoComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportTechnicalComponent_BN',
                                        title: 'PHIẾU NHẬP DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillImportTechnicalComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportTechnicalComponent_BN',
                                        title: 'PHIẾU XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillExportTechnicalComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductReportNewRtcComponent_BN',
                                        title: 'LỊCH SỬ NHẬP - XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductReportNewComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductExportAndBorrowComponent_BN',
                                        title: 'SẢN PHẨM KHÔNG DÙNG',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductExportAndBorrowComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowReportComponent_BN',
                                        title: 'BÁO CÁO MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowReportComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowProductHistoryComponent_BN',
                                        title: 'LỊCH SỬ MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowProductHistoryComponent,
                                        data: { warehouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductTechSerialComponent_BN',
                                        title: 'TRA CỨU SERIAL NUMBER DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductTechSerialComponent,
                                        data: { wearHouseID: 3 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductRtcQrCodeComponent_BN',
                                        title: 'QR Code',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductRtcQrCodeComponent,
                                        data: { warehouseID: 3 },
                                    },
                                ],
                            },
                        ],
                    },
                    //#endregion

                    //#region KHO ĐAN PHƯỢNG
                    {
                        kind: 'group',
                        key: 'DP',
                        stt: 3,
                        title: 'ĐAN PHƯỢNG',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        icon: 'assets/icon/menu_warehouse.svg',
                        children: [
                            {
                                kind: 'group',
                                key: 'Sale',
                                title: 'Phòng Sale',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryComponent_DP',
                                        title: 'TỒN KHO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N31,N30,N1,N36'
                                        ),
                                        comp: InventoryComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportComponent_DP',
                                        title: 'PHIẾU NHẬP',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillImportComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportComponent_DP',
                                        title: 'PHIẾU XUẤT',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            'N27,N29,N50,N1,N36,N52,N35,N33,N34,N69'
                                        ),
                                        comp: BillExportComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryImportExportComponent_DP',
                                        title: 'LỊCH SỬ NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: HistoryImportExportComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'HistoryBorrowSaleComponent_DP',
                                        title: 'LỊCH SỬ MƯỢN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: HistoryBorrowSaleComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ReportImportExportComponent_DP',
                                        title: 'BÁO CÁO NHẬP - XUẤT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N27,N29,N1,N36,N35'
                                            ),
                                        comp: ReportImportExportComponent,
                                        data: { warehousecode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ListProductProjectComponent_DP',
                                        title: 'SẢN PHẨM THEO DỰ ÁN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ListProductProjectComponent,
                                        data: { warehouseCode: 'DP' },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductSerialNumberComponent_DP',
                                        title: 'TRA CỨU SERIAL NUMBER',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductSerialNumberComponent,
                                        data: { warehouseID: 6 },
                                    },
                                ],
                            },
                            {
                                kind: 'group',
                                key: 'Demo',
                                title: 'Phòng Kỹ Thuật',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'InventoryDemoComponent_DP',
                                        title: 'TỒN KHO DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: InventoryDemoComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillImportTechnicalComponent_DP',
                                        title: 'PHIẾU NHẬP DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillImportTechnicalComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BillExportTechnicalComponent_DP',
                                        title: 'PHIẾU XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BillExportTechnicalComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductReportNewRtcComponent_DP',
                                        title: 'LỊCH SỬ NHẬP - XUẤT DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductReportNewComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductExportAndBorrowComponent_DP',
                                        title: 'SẢN PHẨM KHÔNG DÙNG',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductExportAndBorrowComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowReportComponent_DP',
                                        title: 'BÁO CÁO MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowReportComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'BorrowProductHistoryComponent_DP',
                                        title: 'LỊCH SỬ MƯỢN DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: BorrowProductHistoryComponent,
                                        data: { warehouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'SearchProductTechSerialComponent_DP',
                                        title: 'TRA CỨU SERIAL NUMBER DEMO',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: SearchProductTechSerialComponent,
                                        data: { wearHouseID: 6 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'ProductRtcQrCodeComponent_DP',
                                        title: 'QR Code',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: ProductRtcQrCodeComponent,
                                        data: { warehouseID: 6 },
                                    },
                                ],
                            },
                        ],
                    },
                    //#region

                    //#region Cài đặt kho
                    {
                        kind: 'group',
                        key: 'Settings',
                        title: 'Cài đặt',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        icon: 'assets/icon/icon_setting.svg',
                        children: [
                            {
                                kind: 'leaf',
                                key: 'ProductLocationComponent',
                                title: 'Vị trí',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: ProductLocationComponent,
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
                                key: 'ProductSaleComponent',
                                title: 'SẢN PHẨM KHO SALE',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                comp: ProductSaleComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'TbProductRtcComponent_HN',
                                title: 'SẢN PHẨM KHO DEMO',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                comp: TbProductRtcComponent,
                                data: {
                                    warehouseType: 1,
                                },
                            },

                            {
                                kind: 'leaf',
                                key: 'TbProductRtcComponent_AGV',
                                title: 'SẢN PHẨM KHO AGV',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N26,N1,N36,N73,N30'),
                                comp: TbProductRtcComponent,
                                data: {
                                    warehouseType: 2,
                                },
                            },
                        ],
                    },

                    //#endregion
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
                icon: 'assets/icon/menu_hrm.svg',

                children: [
                    {
                        kind: 'leaf',
                        key: 'HrhiringRequestComponent',
                        title: 'TUYỂN DỤNG',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                        comp: HrhiringRequestComponent,
                        // icon: 'assets/icon/hr_hiring_24.svg',
                    },
                    {
                        kind: 'leaf',
                        key: 'DocumentComponent',
                        title: 'Quản lí văn bản',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N2,N34,N1'),
                        comp: DocumentComponent,
                        //       icon: 'assets/icon/hr_documentt_24.svg',
                    },
                    {
                        kind: 'group',
                        key: 'DanhSachTaiSan',
                        title: 'Tài sản / CCDC',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        // icon: 'assets/icon/hr_asset_24.svg',
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
                        // icon: 'assets/icon/hr_asset_management_24.svg',
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
                        // icon: 'assets/icon/hr_vehicle_24.svg',
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
                                isPermission: this.permissionService.hasPermission(''),
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
                        isPermission: this.permissionService.hasPermission(''),
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
                                isPermission: this.permissionService.hasPermission('N1,N2,N34'),
                                comp: HandoverComponent,
                                //   icon: 'assets/icon/layers.png',
                            },

                            //#endregion
                        ],
                    },
                    {
                        kind: 'group',
                        key: 'Employee',
                        title: 'Quản lí chấm công-lương',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
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
                                key: 'EmployeeNightShiftComponent',
                                title: 'Làm đêm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: EmployeeNightShiftComponent,
                                //   icon: 'assets/icon/layers.png',
                            },
                            {
                                kind: 'leaf',
                                key: 'WFH',
                                title: 'WFH',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: WFHComponent,
                                // icon: 'assets/icon/hr_wfh_24.svg',
                            },
                            {
                                kind: 'leaf',
                                key: 'EmployeeNoFingerprintComponent',
                                title: 'Quên Vân tay',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: EmployeeNoFingerprintComponent,
                                //   icon: 'assets/icon/layers.png',
                            },
                            {
                                kind: 'leaf',
                                key: 'EmployeeAttendanceComponent',
                                title: 'Vân tay',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: EmployeeAttendanceComponent,
                                //   icon: 'assets/icon/layers.png',
                            },
                            {
                                kind: 'leaf',
                                key: 'EmployeeErrorComponent',
                                title: 'Lỗi 5S',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: EmployeeErrorComponent,
                                //   icon: 'assets/icon/layers.png',
                            },
                            {
                                kind: 'leaf',
                                key: 'EmployeeCurricularComponent',
                                title: 'Ngoại khóa',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1'),
                                comp: EmployeeCurricularComponent,
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
                                key: 'PayrollComponent',
                                title: 'Bảng lương',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1,N52'),
                                comp: PayrollComponent,
                                //   icon: 'assets/icon/layers.png',
                            },

                            {
                                kind: 'leaf',
                                key: 'EmployeeTimekeepingComponent',
                                title: 'Bảng chấm công',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N2,N1,N52'),
                                comp: EmployeeTimekeepingComponent,
                                //   icon: 'assets/icon/layers.png',
                            },
                            {
                                kind: 'leaf',
                                key: 'EmployeeSyntheticComponent',
                                title: 'Tổng hợp',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: EmployeeSyntheticComponent,
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
                icon: 'assets/icon/menu_categories.svg',
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
                    //   {
                    //     kind: 'leaf',
                    //     key: 'UnitCountComponent',
                    //     title: 'ĐƠN VỊ TÍNH',
                    //     isOpen: true,
                    //     isPermission: this.permissionService.hasPermission('N27,N1'),
                    //     comp: UnitCountComponent,
                    //     //   icon: 'assets/icon/layers.png',
                    //   },
                    //   {
                    //     kind: 'leaf',
                    //     key: 'ProductLocationComponent',
                    //     title: 'VỊ TRÍ THIẾT BỊ',
                    //     isOpen: true,
                    //     isPermission: this.permissionService.hasPermission(''),
                    //     comp: ProductLocationComponent,
                    //     //   icon: 'assets/icon/layers.png',
                    //   },

                    {
                        kind: 'leaf',
                        key: '/thongtinlienhe',
                        title: 'Thông tin liên hệ',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: AppComponent,
                        router: '/thongtinlienhe',
                    },

                    {
                        kind: 'leaf',
                        key: '/sodotochuc',
                        title: 'Sơ đồ tổ chức',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: AppComponent,
                        router: '/sodotochuc',
                    },

                    {
                        kind: 'leaf',
                        key: '/vanbanchung',
                        title: 'Quy định / Thông báo',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: AppComponent,
                        router: '/vanbanchung',
                    },
                    {
                        kind: 'leaf',
                        key: 'WearHouseeComponent',
                        title: 'Danh sách kho',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N1'),
                        comp: WarehouseComponent1,
                    },
                    {
                        kind: 'leaf',
                        key: 'InventoryByProductComponent',
                        title: 'Tồn kho theo sản phẩm',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N1'),
                        comp: InventoryByProductComponent,
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
                icon: 'assets/icon/menu_purchase.svg',
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
                        key: 'SupplierSaleComponent',
                        title: 'Nhà cung cấp',
                        isOpen: true,
                        isPermission:
                            this.permissionService.hasPermission('N27,N33,N35,N1,N36'),
                        comp: SupplierSaleComponent,
                        //   icon: 'assets/icon/layers.png',
                    },
                    {
                        kind: 'leaf',
                        key: 'ProjectPartlistPriceRequestNewComponent',
                        title: 'Yêu cầu báo giá',
                        isOpen: true,
                        isPermission:
                            this.permissionService.hasPermission('N33,N35,N1,N36'),
                        comp: ProjectPartlistPriceRequestComponent,
                        // comp: ProjectPartlistPriceRequestNewComponent,

                        //   icon: 'assets/icon/layers.png',
                    },
                    {
                        kind: 'leaf',
                        key: 'AssignWorkComponent',
                        title: 'Phân công công việc',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N33,N1'),
                        comp: AssignWorkComponent,
                        //   icon: 'assets/icon/layers.png',
                    },
                    {
                        kind: 'leaf',
                        key: 'PonccComponent',
                        title: 'PO NCC',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(
                            'N33,N35,N36,N1,N52,N38,N54'
                        ),
                        comp: PONCCComponent,
                        //   icon: 'assets/icon/layers.png',
                    },
                    {
                        kind: 'leaf',
                        key: 'InventoryProjectComponent',
                        title: 'Hàng giữ dự án',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N1'),
                        comp: InventoryProjectComponent,
                    },
                    {
                        kind: 'leaf',
                        key: 'ProjectPartlistPurchaseRequestComponent',
                        title: 'Yêu cầu mua hàng',
                        isOpen: true,
                        isPermission:
                            this.permissionService.hasPermission('N33,N35,N1,N36'),
                        comp: ProjectPartlistPurchaseRequestComponent,
                        //   icon: 'assets/icon/layers.png',
                    },
                    // {
                    //   kind: 'leaf',
                    //   key: 'ProjectPartlistPriceRequestComponent',
                    //   title: 'Yêu cầu báo giá',
                    //   isOpen: true,
                    //   isPermission:
                    //     this.permissionService.hasPermission('N33,N35,N1,N36'),
                    //   comp: ProjectPartlistPriceRequestComponent,
                    //   //   icon: 'assets/icon/layers.png',
                    // },
                    // {
                    //   kind: 'leaf',
                    //   key: 'AssignWorkComponent',
                    //   title: 'Phân công công việc',
                    //   isOpen: true,
                    //   isPermission: this.permissionService.hasPermission('N33,N1'),
                    //   comp: AssignWorkComponent,
                    //   //   icon: 'assets/icon/layers.png',
                    // },
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
                icon: 'assets/icon/menu_project.svg',
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
                            // {
                            //   kind: 'leaf',
                            //   key: 'CourseManagementComponent',
                            //   title: 'Quản lý khóa học',
                            //   isOpen: true,
                            //   isPermission: this.permissionService.hasPermission(''),
                            //   comp: CourseManagementComponent,
                            // }
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
                icon: 'assets/icon/menu_sale.svg',
                children: [
                    {
                        kind: 'group',
                        key: 'SaleComponent_HN',
                        title: 'Văn phòng Hà Nội',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'group',
                                key: 'POKHComponentGroup',
                                title: 'PO KHÁCH HÀNG',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'POKHComponent',
                                        title: 'DANH SÁCH PO',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission('N27,N36,N1,N31'),
                                        comp: PokhComponent,
                                        data: { warehouseId: 1 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'QuotationKhComponent',
                                        title: 'BÁO GIÁ KHÁCH HÀNG',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission('N27,N36,N1'),
                                        comp: QuotationKhComponent,
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'PokhKpiComponent',
                                        title: 'XUẤT PO KHÁCH HÀNG CHI TIẾT',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission('N27,N36,N1'),
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
                                key: 'VisionBase',
                                title: 'VISION BASE',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'PlanWeekComponent',
                                        title: 'KẾ HOẠCH TUẦN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(
                                            "'N1,N27,N53,N31,N69'"
                                        ),
                                        comp: PlanWeekComponent,
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'FollowProjectBaseComponent',
                                        title: 'FOLLOW DỰ ÁN - HN',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: FollowProjectBaseComponent,
                                        data: { warehouseId: 1 },
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'CustomerComponent',
                                        title: 'KHÁCH HÀNG',
                                        isOpen: true,
                                        isPermission:
                                            this.permissionService.hasPermission(
                                                'N1,N27,N53,N31,N69'
                                            ),
                                        comp: CustomerComponent,
                                        // icon: 'assets/icon/menu_crm.svg',
                                    },
                                ],
                            },
                            {
                                kind: 'group',
                                key: 'KPIComponent',
                                title: 'KPI',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(""),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'BonusCoefficientComponent',
                                        title: 'Tổng hợp báo cáo',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(""),
                                        comp: BonusCoefficientComponent,
                                    },
                                    // {
                                    //   kind: 'leaf',
                                    //   key: 'EmployeeSaleManagerComponent',
                                    //   title: 'Nhân viên Sale',
                                    //   isOpen: true,
                                    //   isPermission: this.permissionService.hasPermission("''"),
                                    //   comp: EmployeeSaleManagerComponent,
                                    // },
                                    {
                                        kind: 'leaf',
                                        key: 'DailyReportSaleComponent',
                                        title: 'Báo cáo hàng ngày',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(""),
                                        comp: DailyReportSaleComponent,
                                    },
                                ],
                            },
                            {
                                kind: 'leaf',
                                key: 'RequestInvoiceComponent',
                                title: 'YÊU CẦU XUẤT HÓA ĐƠN - HN',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: RequestInvoiceComponent,
                                data: { warehouseId: 1 },
                            },
                        ],
                    },
                    {
                        kind: 'group',
                        key: 'SaleComponent_HCM',
                        title: 'Văn phòng Hồ Chí Minh',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'RequestInvoiceComponent_HCM',
                                title: 'YÊU CẦU XUẤT HÓA ĐƠN - HCM',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: RequestInvoiceComponent,
                                data: { warehouseId: 2 },
                            },
                            {
                                kind: 'leaf',
                                key: 'POKHComponent_HCM',
                                title: 'PO KHÁCH HÀNG - HCM',
                                isOpen: true,
                                isPermission:
                                    this.permissionService.hasPermission('N54,N1,N36'),
                                comp: PokhComponent,
                                data: { warehouseId: 2 },
                            },
                            {
                                kind: 'leaf',
                                key: 'FollowProjectBaseComponent_HCM',
                                title: 'FOLLOW DỰ ÁN - HCM',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: FollowProjectBaseComponent,
                                data: { warehouseId: 2 },
                            },
                        ]
                    }
                ],
            },
            //#endregion

            //#region Phòng Kế Toán
            {
                kind: 'group',
                key: 'KT',
                title: 'PHÒNG KẾ TOÁN',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                icon: 'assets/icon/menu_ketoan.svg',
                children: [
                    {
                        kind: 'leaf',
                        key: 'RequestInvoiceComponent_KT',
                        title: 'YÊU CẦU XUẤT HÓA ĐƠN - KẾ TOÁN',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: RequestInvoiceComponent,
                        data: { warehouseId: 0 },
                    },
                ],
            },
            //#endregion

            //#region Cá nhân
            {
                kind: 'group',
                key: 'KPIComponent',
                title: 'KPI',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(""),
                children: [
                  {
                    kind: 'leaf',
                    key: 'BonusCoefficientComponent',
                    title: 'Tổng hợp báo cáo',
                    isOpen: true,
                    isPermission: this.permissionService.hasPermission(""),
                    comp: BonusCoefficientComponent,
                  },
                  // {
                  //   kind: 'leaf',
                  //   key: 'EmployeeSaleManagerComponent',
                  //   title: 'Nhân viên Sale',
                  //   isOpen: true,
                  //   isPermission: this.permissionService.hasPermission("''"),
                  //   comp: EmployeeSaleManagerComponent,
                  // },
                  {
                    kind: 'leaf',
                    key: 'DailyReportSaleComponent',
                    title: 'Báo cáo hàng ngày',
                    isOpen: true,
                    isPermission: this.permissionService.hasPermission(""),
                    comp: DailyReportSaleComponent,
                  },
                ],
              },
              {
                kind: 'leaf',
                key: 'RequestInvoiceComponent',
                title: 'YÊU CẦU XUẤT HÓA ĐƠN - HN',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: RequestInvoiceComponent,
                data: { warehouseId: 1 },
              },
            ],
          },
          {
            kind: 'group',
            key: 'SaleComponent_HCM',
            title: 'Văn phòng Hồ Chí Minh',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'RequestInvoiceComponent_HCM',
                title: 'YÊU CẦU XUẤT HÓA ĐƠN - HCM',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: RequestInvoiceComponent,
                data: { warehouseId: 2 },
              },
              {
                kind: 'leaf',
                key: 'POKHComponent_HCM',
                title: 'PO KHÁCH HÀNG - HCM',
                isOpen: true,
                isPermission:
                  this.permissionService.hasPermission('N54,N1,N36'),
                comp: PokhComponent,
                data: { warehouseId: 2 },
              },
              {
                kind: 'leaf',
                key: 'FollowProjectBaseComponent_HCM',
                title: 'FOLLOW DỰ ÁN - HCM',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: FollowProjectBaseComponent,
                data: { warehouseId: 2 },
              },
            ]
          }
        ],
      },
      //#endregion

      //#region Phòng Kế Toán
      {
        kind: 'group',
        key: 'KT',
        title: 'PHÒNG KẾ TOÁN',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_ketoan.svg',
        children: [
          {
            kind: 'leaf',
            key: 'RequestInvoiceComponent_KT',
            title: 'YÊU CẦU XUẤT HÓA ĐƠN - KẾ TOÁN',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            comp: RequestInvoiceComponent,
            data: { warehouseId: 0 },
          },
        ],
      },
      //#endregion

      //#region Cá nhân
      {
        kind: 'group',
        key: 'person',
        title: 'CÁ NHÂN',
        isOpen: true,
        isPermission: this.permissionService.hasPermission(''),
        icon: 'assets/icon/menu_person.svg',
        children: [
          {
            kind: 'group',
            key: 'Tonghopcong',
            title: 'Tổng hợp công',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'PersonDayOffComponent',
                title: 'Tổng hợp đăng ký nghỉ',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonDayOffComponent,
              },
              {
                kind: 'leaf',
                key: 'EarlyLateSummaryComponent',
                title: 'Tổng hợp đi muộn về sớm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: EarlyLateSummaryComponent,
              },
              {
                kind: 'leaf',
                key: 'WFHSummaryComponent',
                title: 'Tổng hợp WFH',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: WFHSummaryComponent,
              },
              {
                kind: 'leaf',
                key: 'EmployeeNoFingerSummaryComponent',
                title: 'Tổng hợp quên vân tay',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: EmployeeNoFingerSummaryComponent,
              },
              {
                kind: 'leaf',
                key: 'EmployeeBussinessPersonSummaryComponent',
                title: 'Tổng hợp công tác',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: EmployeeBussinessPersonSummaryComponent,
              },
              {
                kind: 'leaf',
                key: 'EmployeeNightShiftPersonSummaryComponent',
                title: 'Tổng hợp làm đêm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: EmployeeNightShiftPersonSummaryComponent,
              },
            ],
          },
          //#region Duyệt cá nhân
          //   {
          //     kind: 'group',
          //     key: 'appvovedperson',
          //     title: 'Duyệt cá nhân',
          //     isOpen: true,
          //     isPermission: this.permissionService.hasPermission(
          //       'N57,N34,N56,N59,N55,N61,N58,N83,N32'
          //     ),
          //     children: [
          //       {
          //         kind: 'group',
          //         key: 'tbpapproved',
          //         title: 'Trưởng bộ phận duyệt',
          //         isOpen: true,
          //         isPermission: this.permissionService.hasPermission('N57'),
          //         children: [
          //           {
          //             kind: 'leaf',
          //             key: 'tbpduyetdntt',
          //             title: 'Đề nghị thanh toán',
          //             isOpen: true,
          //             isPermission: this.permissionService.hasPermission('N57'),
          //             comp: AppComponent,
          //             router: '/tbpduyetdntt',
          //           },
          //           {
          //             kind: 'leaf',
          //             key: 'tbpduyetyccv',
          //             title: 'Yêu cầu công việc',
          //             isOpen: true,
          //             isPermission: this.permissionService.hasPermission('N57'),
          //             comp: AppComponent,
          //             router: '/tbpduyetyccv',
          //           },
          //         ],
          //       },

          //       {
          //         kind: 'group',
          //         key: 'hraproved',
          //         title: 'HR duyệt',
          //         isOpen: true,
          //         isPermission:
          //           this.permissionService.hasPermission('N34,N56,N59'),
          //         children: [
          //           {
          //             kind: 'leaf',
          //             key: 'hrduyetdntt',
          //             title: 'Đề nghị thanh toán',
          //             isOpen: true,
          //             isPermission:
          //               this.permissionService.hasPermission('N56,N59'),
          //             comp: AppComponent,
          //             router: '/hrduyetdntt',
          //           },
          //           {
          //             kind: 'leaf',
          //             key: 'hrduyetyccv',
          //             title: 'Yêu cầu công việc',
          //             isOpen: true,
          //             isPermission:
          //               this.permissionService.hasPermission('N34,N56'),
          //             comp: AppComponent,
          //             router: '/hrduyetyccv',
          //           },
          //         ],
          //       },

          //       {
          //         kind: 'leaf',
          //         key: 'ketoanduyetdntt',
          //         title: 'Kế toán duyệt ĐNTT',
          //         isOpen: true,
          //         isPermission: this.permissionService.hasPermission('N55,N61'),
          //         comp: AppComponent,
          //         router: '/ketoanduyetdntt',
          //       },

          //       {
          //         kind: 'group',
          //         key: 'bgdaproved',
          //         title: 'BGĐ duyệt',
          //         isOpen: true,
          //         isPermission: this.permissionService.hasPermission('N58'),
          //         children: [
          //           {
          //             kind: 'leaf',
          //             key: 'bgdduyetdntt',
          //             title: 'Đề nghị thanh toán',
          //             isOpen: true,
          //             isPermission: this.permissionService.hasPermission('N58'),
          //             comp: AppComponent,
          //             router: '/bgdduyetdntt',
          //           },
          //           {
          //             kind: 'leaf',
          //             key: 'bgdduyetyccv',
          //             title: 'Yêu cầu công việc',
          //             isOpen: true,
          //             isPermission: this.permissionService.hasPermission('N58'),
          //             comp: AppComponent,
          //             router: '/bgdduyetyccv',
          //           },
          //           {
          //             kind: 'leaf',
          //             key: 'duyetyeucaumuahang',
          //             title: 'Yêu cầu mua hàng',
          //             isOpen: true,
          //             isPermission: this.permissionService.hasPermission('N58'),
          //             comp: AppComponent,
          //             router: '/duyetyeucaumuahang',
          //           },
          //         ],
          //       },

          //       {
          //         kind: 'leaf',
          //         key: 'saleduyetdenghithanhtoandacbiet',
          //         title: 'Sale duyệt ĐNTT',
          //         isOpen: true,
          //         isPermission: this.permissionService.hasPermission('N83'),
          //         comp: AppComponent,
          //         router: '/saleduyetdenghithanhtoandacbiet',
          //       },

          //       {
          //         kind: 'leaf',
          //         key: 'duyetcanhan',
          //         title: 'Duyệt công',
          //         isOpen: true,
          //         isPermission: this.permissionService.hasPermission('N32'),
          //         comp: AppComponent,
          //         router: '/duyetcanhan',
          //       },
          //     ],
          //   },
          //#endregion

          //#region Đăng ký công
          {
            kind: 'group',
            key: 'registerpayroll',
            title: 'Đăng ký công',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'comca',
                title: 'Đặt cơm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/comca',
              },

              {
                kind: 'leaf',
                key: 'danhsachdangkynghi',
                title: 'Đăng ký nghỉ',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/danhsachdangkynghi',
              },

              {
                kind: 'leaf',
                key: 'dimuonvesom',
                title: 'Đi muộn - về sớm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/dimuonvesom',
              },

              {
                kind: 'leaf',
                key: 'lamthem',
                title: 'Làm thêm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/lamthem',
              },

              {
                kind: 'leaf',
                key: 'congtac',
                title: 'Công tác',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/congtac',
              },

              {
                kind: 'leaf',
                key: 'lamdem',
                title: 'Làm đêm',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/lamdem',
              },

              {
                kind: 'leaf',
                key: 'wfh',
                title: 'WFH',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/wfh',
              },
              {
                kind: 'leaf',
                key: 'quenchamcong',
                title: 'Quên chấm công',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/quenchamcong',
              },
              {
                kind: 'leaf',
                key: 'tonghopcanhan',
                title: 'Tổng hợp cá nhân',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/tonghopcanhan',
              },

              {
                kind: 'leaf',
                key: 'congluong',
                title: 'Tổng hợp công - lương',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/congluong',
              },
            ],
          },
          //#endregion

          //#region Đăng ký chung
          {
            kind: 'group',
            key: 'registercommon',
            title: 'Đăng ký chung',
            isOpen: true,
            isPermission: this.permissionService.hasPermission(''),
            children: [
              {
                kind: 'leaf',
                key: 'phonghop',
                title: 'Phòng họp',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/phonghop',
              },

              {
                kind: 'leaf',
                key: 'dangkydongdau',
                title: 'Đăng ký đóng dấu',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/dangkydongdau',
              },

              {
                kind: 'leaf',
                key: 'datxe',
                title: 'Đặt xe',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/datxe',
              },

              {
                kind: 'leaf',
                key: 'denghithanhtoan',
                title: 'Đề nghị thanh toán',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/denghithanhtoan',
              },

              {
                kind: 'leaf',
                key: 'denghithanhtoandacbiet',
                title: 'Đề nghị thanh toán đặc biệt',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                comp: PersonComponent,
                router: '/denghithanhtoandacbiet',
              },

              {
                kind: 'leaf',
                key: 'yeucaucongviec',
                title: 'Yêu cầu công việc',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(''),
                icon: 'assets/icon/menu_person.svg',
                children: [
                    {
                        kind: 'group',
                        key: 'Tonghopdangkynghi',
                        title: 'Tổng hợp công',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'Tonghopdangkynghi',
                                title: 'Tổng hợp đăng ký nghỉ',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonDayOffComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'Tonghopdimuonvesom',
                                title: 'Tổng hợp đi muộn về sớm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: EarlyLateSummaryComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'Tonghopwfh',
                                title: 'Tổng hợp WFH',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: WFHSummaryComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'Tonghopquenvantay',
                                title: 'Tổng hợp quên vân tay',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: EmployeeNoFingerSummaryComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'Tonghopcongtac',
                                title: 'Tổng hợp công tác',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: EmployeeBussinessPersonSummaryComponent,
                            },
                            {
                                kind: 'leaf',
                                key: 'Tonghoplamdem',
                                title: 'Tổng hợp làm đêm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: EmployeeNightShiftPersonSummaryComponent,
                            },
                        ],
                    },
                    //#region Duyệt cá nhân
                    //   {
                    //     kind: 'group',
                    //     key: 'appvovedperson',
                    //     title: 'Duyệt cá nhân',
                    //     isOpen: true,
                    //     isPermission: this.permissionService.hasPermission(
                    //       'N57,N34,N56,N59,N55,N61,N58,N83,N32'
                    //     ),
                    //     children: [
                    //       {
                    //         kind: 'group',
                    //         key: 'tbpapproved',
                    //         title: 'Trưởng bộ phận duyệt',
                    //         isOpen: true,
                    //         isPermission: this.permissionService.hasPermission('N57'),
                    //         children: [
                    //           {
                    //             kind: 'leaf',
                    //             key: 'tbpduyetdntt',
                    //             title: 'Đề nghị thanh toán',
                    //             isOpen: true,
                    //             isPermission: this.permissionService.hasPermission('N57'),
                    //             comp: AppComponent,
                    //             router: '/tbpduyetdntt',
                    //           },
                    //           {
                    //             kind: 'leaf',
                    //             key: 'tbpduyetyccv',
                    //             title: 'Yêu cầu công việc',
                    //             isOpen: true,
                    //             isPermission: this.permissionService.hasPermission('N57'),
                    //             comp: AppComponent,
                    //             router: '/tbpduyetyccv',
                    //           },
                    //         ],
                    //       },

                    //       {
                    //         kind: 'group',
                    //         key: 'hraproved',
                    //         title: 'HR duyệt',
                    //         isOpen: true,
                    //         isPermission:
                    //           this.permissionService.hasPermission('N34,N56,N59'),
                    //         children: [
                    //           {
                    //             kind: 'leaf',
                    //             key: 'hrduyetdntt',
                    //             title: 'Đề nghị thanh toán',
                    //             isOpen: true,
                    //             isPermission:
                    //               this.permissionService.hasPermission('N56,N59'),
                    //             comp: AppComponent,
                    //             router: '/hrduyetdntt',
                    //           },
                    //           {
                    //             kind: 'leaf',
                    //             key: 'hrduyetyccv',
                    //             title: 'Yêu cầu công việc',
                    //             isOpen: true,
                    //             isPermission:
                    //               this.permissionService.hasPermission('N34,N56'),
                    //             comp: AppComponent,
                    //             router: '/hrduyetyccv',
                    //           },
                    //         ],
                    //       },

                    //       {
                    //         kind: 'leaf',
                    //         key: 'ketoanduyetdntt',
                    //         title: 'Kế toán duyệt ĐNTT',
                    //         isOpen: true,
                    //         isPermission: this.permissionService.hasPermission('N55,N61'),
                    //         comp: AppComponent,
                    //         router: '/ketoanduyetdntt',
                    //       },

                    //       {
                    //         kind: 'group',
                    //         key: 'bgdaproved',
                    //         title: 'BGĐ duyệt',
                    //         isOpen: true,
                    //         isPermission: this.permissionService.hasPermission('N58'),
                    //         children: [
                    //           {
                    //             kind: 'leaf',
                    //             key: 'bgdduyetdntt',
                    //             title: 'Đề nghị thanh toán',
                    //             isOpen: true,
                    //             isPermission: this.permissionService.hasPermission('N58'),
                    //             comp: AppComponent,
                    //             router: '/bgdduyetdntt',
                    //           },
                    //           {
                    //             kind: 'leaf',
                    //             key: 'bgdduyetyccv',
                    //             title: 'Yêu cầu công việc',
                    //             isOpen: true,
                    //             isPermission: this.permissionService.hasPermission('N58'),
                    //             comp: AppComponent,
                    //             router: '/bgdduyetyccv',
                    //           },
                    //           {
                    //             kind: 'leaf',
                    //             key: 'duyetyeucaumuahang',
                    //             title: 'Yêu cầu mua hàng',
                    //             isOpen: true,
                    //             isPermission: this.permissionService.hasPermission('N58'),
                    //             comp: AppComponent,
                    //             router: '/duyetyeucaumuahang',
                    //           },
                    //         ],
                    //       },

                    //       {
                    //         kind: 'leaf',
                    //         key: 'saleduyetdenghithanhtoandacbiet',
                    //         title: 'Sale duyệt ĐNTT',
                    //         isOpen: true,
                    //         isPermission: this.permissionService.hasPermission('N83'),
                    //         comp: AppComponent,
                    //         router: '/saleduyetdenghithanhtoandacbiet',
                    //       },

                    //       {
                    //         kind: 'leaf',
                    //         key: 'duyetcanhan',
                    //         title: 'Duyệt công',
                    //         isOpen: true,
                    //         isPermission: this.permissionService.hasPermission('N32'),
                    //         comp: AppComponent,
                    //         router: '/duyetcanhan',
                    //       },
                    //     ],
                    //   },
                    //#endregion

                    //#region Đăng ký công
                    {
                        kind: 'group',
                        key: 'registerpayroll',
                        title: 'Đăng ký công',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'comca',
                                title: 'Đặt cơm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/comca',
                            },

                            {
                                kind: 'leaf',
                                key: 'danhsachdangkynghi',
                                title: 'Đăng ký nghỉ',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/danhsachdangkynghi',
                            },

                            {
                                kind: 'leaf',
                                key: 'dimuonvesom',
                                title: 'Đi muộn - về sớm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/dimuonvesom',
                            },

                            {
                                kind: 'leaf',
                                key: 'lamthem',
                                title: 'Làm thêm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/lamthem',
                            },

                            {
                                kind: 'leaf',
                                key: 'congtac',
                                title: 'Công tác',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/congtac',
                            },

                            {
                                kind: 'leaf',
                                key: 'lamdem',
                                title: 'Làm đêm',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/lamdem',
                            },

                            {
                                kind: 'leaf',
                                key: 'wfh',
                                title: 'WFH',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/wfh',
                            },
                            {
                                kind: 'leaf',
                                key: 'quenchamcong',
                                title: 'Quên chấm công',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/quenchamcong',
                            },
                            {
                                kind: 'leaf',
                                key: 'tonghopcanhan',
                                title: 'Tổng hợp cá nhân',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/tonghopcanhan',
                            },

                            {
                                kind: 'leaf',
                                key: 'congluong',
                                title: 'Tổng hợp công - lương',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/congluong',
                            },
                        ],
                    },
                    //#endregion

                    //#region Đăng ký chung
                    {
                        kind: 'group',
                        key: 'registercommon',
                        title: 'Đăng ký chung',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'phonghop',
                                title: 'Phòng họp',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/phonghop',
                            },

                            {
                                kind: 'leaf',
                                key: 'dangkydongdau',
                                title: 'Đăng ký đóng dấu',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/dangkydongdau',
                            },

                            {
                                kind: 'leaf',
                                key: 'datxe',
                                title: 'Đặt xe',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/datxe',
                            },

                            {
                                kind: 'leaf',
                                key: 'denghithanhtoan',
                                title: 'Đề nghị thanh toán',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/denghithanhtoan',
                            },

                            {
                                kind: 'leaf',
                                key: 'denghithanhtoandacbiet',
                                title: 'Đề nghị thanh toán đặc biệt',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/denghithanhtoandacbiet',
                            },

                            {
                                kind: 'leaf',
                                key: 'yeucaucongviec',
                                title: 'Yêu cầu công việc',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/yeucaucongviec',
                            },

                            {
                                kind: 'leaf',
                                key: 'dangkyytuong',
                                title: 'Đăng ký ý tưởng',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/dangkyytuong',
                            },
                            {
                                kind: 'leaf',
                                key: 'dangkyhopdong',
                                title: 'Đăng ký hợp đồng',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/dangkyhopdong',
                            },
                            {
                                kind: 'leaf',
                                key: 'tonghopcanhan',
                                title: 'Đăng ký VPP',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/dangkyvpp',
                            },
                        ],
                    },
                    //#endregion

                    {
                        kind: 'leaf',
                        key: '/hangmuccongviec',
                        title: 'Hạng mục công việc',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: PersonComponent,
                        router: '/hangmuccongviec',
                    },
                    {
                        kind: 'leaf',
                        key: '/taisancanhan',
                        title: 'Tài sản cá nhân',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: PersonComponent,
                        // icon: 'assets/icon/menu_person.svg',
                        router: '/taisancanhan',
                    },

                    //#region Báo cáo công việc
                    {
                        kind: 'group',
                        key: 'dailyreport',
                        title: 'Báo cáo công việc',
                        isOpen: true,
                        // icon: 'assets/icon/menu_person.svg',
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'baocaocongviecagv',
                                title: 'Phòng AGV - Cơ khí',
                                isOpen: true,
                                isPermission:
                                    isAdmin ||
                                    this.departmentAgvCokhis.includes(departmentID) ||
                                    this.userAllReportTechs.includes(id),
                                comp: PersonComponent,
                                router: '/baocaocongviec',
                            },
                            {
                                kind: 'group',
                                key: 'dailyreportsale',
                                title: 'Phòng sale',
                                isOpen: true,
                                // icon: 'assets/icon/menu_person.svg',
                                isPermission:
                                    isAdmin || this.departmentSales.includes(departmentID),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'saleadmin',
                                        title: 'Sale Admin',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: PersonComponent,
                                        router: '/saleadmin',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'nhanviensale',
                                        title: 'Nhân viên Sale',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: PersonComponent,
                                        router: '/nhanviensale',
                                    },
                                ],
                            },

                            {
                                kind: 'leaf',
                                key: 'baocaocongviec',
                                title: 'Phòng Kỹ thuật',
                                isOpen: true,
                                isPermission:
                                    isAdmin || this.departmentTechs.includes(departmentID),
                                comp: PersonComponent,
                                router: '/baocaocongviec',
                            },

                            {
                                kind: 'group',
                                key: 'dailyreporthr',
                                title: 'Phòng Hành chính Nhân sự',
                                isOpen: true,
                                isPermission:
                                    isAdmin ||
                                    isHR ||
                                    this.positinCPs.includes(positionID) ||
                                    this.positinLXs.includes(positionID),
                                children: [
                                    {
                                        kind: 'leaf',
                                        key: 'baocaocongviechr',
                                        title: 'Nhân viên hành chính',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: PersonComponent,
                                        router: '/baocaocongviec',
                                    },
                                    {
                                        kind: 'leaf',
                                        key: 'catphimlaixe',
                                        title: 'Cắt phim - Lái xe',
                                        isOpen: true,
                                        isPermission: this.permissionService.hasPermission(''),
                                        comp: PersonComponent,
                                        router: '/catphimlaixe',
                                    },
                                ],
                            },

                            {
                                kind: 'leaf',
                                key: 'baocaocongvieckythuatlr',
                                title: 'Lắp ráp - Triển khai dự án',
                                isOpen: true,
                                isPermission:
                                    isAdmin ||
                                    this.departmentLapraps.includes(departmentID) ||
                                    this.userAllReportTechs.includes(id),
                                comp: PersonComponent,
                                router: '/baocaocongvieckythuat',
                            },

                            {
                                kind: 'leaf',
                                key: 'baocaocongviecmarketing',
                                title: 'Phòng Marketing',
                                isOpen: true,
                                isPermission: isAdmin || this.marketings.includes(departmentID),
                                comp: PersonComponent,
                                router: '/baocaocongviecmarketing',
                            },
                        ],
                    },
                    //#endregion

                    //#region KẾ HOẠCH TUẦN
                    {
                        kind: 'group',
                        key: 'planweek',
                        title: 'Kế hoạch tuần',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'kehoachcongvieccanhan',
                                title: 'Cá nhân',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/kehoachcongvieccanhan',
                            },

                            {
                                kind: 'leaf',
                                key: 'kehoachcongviectonghop',
                                title: 'Tổng hợp',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/kehoachcongviectonghop',
                            },

                            {
                                kind: 'leaf',
                                key: 'kehoachcongviectonghopnew',
                                title: 'Tổng hợp new',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/kehoachcongviectonghopnew',
                            },
                        ],
                    },
                    //#endregion

                    //#region Biểu mẫu văn bản chung
                    {
                        kind: 'group',
                        key: 'document',
                        title: 'Biểu mẫu văn bản chung',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'bieumauvanbanchung3',
                                title: 'Phòng kinh doanh',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/bieumauvanbanchung',
                                data: { departmentID: 3 },
                            },

                            {
                                kind: 'leaf',
                                key: 'bieumauvanbanchung2',
                                title: 'Phòng kỹ thuật',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/bieumauvanbanchung',
                                data: { departmentID: 2 },
                            },

                            {
                                kind: 'leaf',
                                key: 'bieumauvanbanchung9',
                                title: 'Phòng AGV',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/bieumauvanbanchung',
                                data: { departmentID: 9 },
                            },

                            {
                                kind: 'leaf',
                                key: 'bieumauvanbanchung10',
                                title: 'Phòng Thiết kế cơ khí',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission(''),
                                comp: PersonComponent,
                                router: '/bieumauvanbanchung',
                                data: { departmentID: 10 },
                            },
                        ],
                    },
                    //#endregion
                ],
            },
            //#endregion

            //#region Duyệt cá nhân
            {
                kind: 'group',
                key: 'appvovedperson',
                // stt: 1,
                title: 'DUYỆT CÁ NHÂN',
                isOpen: true,
                isPermission: this.permissionService.hasPermission(
                    'N57,N34,N56,N59,N55,N61,N58,N83,N32'
                ),
                icon: 'assets/icon/menu_appvovedperson.svg',
                children: [
                    {
                        kind: 'group',
                        key: 'tbpapproved',
                        title: 'Trưởng bộ phận duyệt',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N57,N1'),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'tbpduyetdntt',
                                title: 'Đề nghị thanh toán',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N57'),
                                comp: PersonComponent,
                                router: '/tbpduyetdntt',
                            },
                            {
                                kind: 'leaf',
                                key: 'tbpduyetyccv',
                                title: 'Yêu cầu công việc',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N57'),
                                comp: PersonComponent,
                                router: '/tbpduyetyccv',
                            },
                        ],
                    },

                    {
                        kind: 'group',
                        key: 'hraproved',
                        title: 'HR duyệt',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N34,N56,N59'),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'hrduyetdntt',
                                title: 'Đề nghị thanh toán',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N56,N59'),
                                comp: PersonComponent,
                                router: '/hrduyetdntt',
                            },
                            {
                                kind: 'leaf',
                                key: 'hrduyetyccv',
                                title: 'Yêu cầu công việc',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N34,N56'),
                                comp: PersonComponent,
                                router: '/hrduyetyccv',
                            },
                        ],
                    },

                    {
                        kind: 'leaf',
                        key: 'ketoanduyetdntt',
                        title: 'Kế toán duyệt ĐNTT',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N55,N61'),
                        comp: PersonComponent,
                        router: '/ketoanduyetdntt',
                    },

                    {
                        kind: 'group',
                        key: 'bgdaproved',
                        title: 'BGĐ duyệt',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N58'),
                        children: [
                            {
                                kind: 'leaf',
                                key: 'bgdduyetdntt',
                                title: 'Đề nghị thanh toán',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N58'),
                                comp: PersonComponent,
                                router: '/bgdduyetdntt',
                            },
                            {
                                kind: 'leaf',
                                key: 'bgdduyetyccv',
                                title: 'Yêu cầu công việc',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N58'),
                                comp: PersonComponent,
                                router: '/bgdduyetyccv',
                            },
                            {
                                kind: 'leaf',
                                key: 'duyetyeucaumuahang',
                                title: 'Yêu cầu mua hàng',
                                isOpen: true,
                                isPermission: this.permissionService.hasPermission('N58'),
                                comp: PersonComponent,
                                router: '/duyetyeucaumuahang',
                            },
                        ],
                    },

                    {
                        kind: 'leaf',
                        key: 'saleduyetdenghithanhtoandacbiet',
                        title: 'Sale duyệt ĐNTT',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N83'),
                        comp: PersonComponent,
                        router: '/saleduyetdenghithanhtoandacbiet',
                    },

                    {
                        kind: 'leaf',
                        key: 'duyetcanhan',
                        title: 'Duyệt công',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N32'),
                        comp: PersonComponent,
                        router: '/duyetcanhan',
                    },
                    {
                        kind: 'leaf',
                        key: 'tbpduyetdangkypp',
                        title: 'TBP duyệt đăng ký VPP',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission('N57,N1'),
                        comp: OfficeSupplyRequestsComponent,
                    },
                    {
                        kind: 'leaf',
                        key: 'duyetpartlist',
                        title: 'Duyệt PartList',
                        isOpen: true,
                        isPermission: this.permissionService.hasPermission(''),
                        comp: ProjectPartListComponent,
                        data: {
                            tbp: true,
                        },
                    },
                ],
            },
            //#endregion
        ];

        return menus;
    }

    goToOldLink(router: string, param: any) {
        let data: any = {
            UserName: this.appUserService.loginName,
            Password: this.appUserService.password,
            Router: router,
        };
        // console.log('window.location:', window.location);

        let params = new URLSearchParams(param).toString();

        let urlTo = `http://localhost:19028${router}`;
        if (params) urlTo = `${urlTo}?${params}`;
        let urlLogin = 'http://localhost:19028/Home/LoginNew';

        const urlOld = 'http://113.190.234.64:8081';
        if (window.location.hostname != 'localhost') {
            urlTo =
                window.location.origin.replace(window.location.port, '8081') + router;
            urlLogin =
                window.location.origin.replace(window.location.port, '8081') +
                '/Home/LoginNew';
        }

        // console.log('url redirect to:', urlTo);
        // console.log('url login:', urlLogin);

        return this.http
            .post<any>(urlLogin, data, { withCredentials: true })
            .subscribe({
                next: (response) => {
                    window.open(urlTo, '_blank');
                },
                error: (err) => {
                    // console.log('err:', err);
                    this.notification.error(NOTIFICATION_TITLE.error, err.message);
                },
            });
    }

    setMenuKey(value: string) {
        this.menuKeySource.next(value);
    }
}

type BaseItem = {
    key: string;
    stt?: number;
    title: string;
    isOpen: boolean;
    icon?: string | ''; // tùy chọn
    isPermission: boolean;
    data?: {};
    router?: string | '';
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
