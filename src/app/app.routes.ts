import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/old/welcome/welcome.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { HomeLayoutNewComponent } from './layouts/home-layout/home-layout-new/home-layout-new.component';
import { FoodOrderComponent } from './pages/hrm/food-order/food-order.component';
import { DayOffComponent } from './pages/hrm/day-off/day-off.component';
import { MenuApp } from './pages/systems/menu-app/model/menu-app';
import { MenuAppComponent } from './pages/systems/menu-app/menu-app.component';
import { InventoryComponent } from './pages/old/Sale/Inventory/inventory.component';
import { CustomerComponent } from './pages/crm/customers/customer/customer.component';
import { PaymentOrder } from './pages/general-category/payment-order/model/payment-order';
import { PaymentOrderComponent } from './pages/general-category/payment-order/payment-order.component';
import { AppComponent } from './app.component';
import { DailyReportLXCPComponent } from './pages/daily-report-lxcp/daily-report-lxcp.component';
import { DailyReportThrComponent } from './pages/daily-report-thr/daily-report-thr.component';
import { DailyReportTechComponent } from './pages/DailyReportTech/daily-report-tech/daily-report-tech.component';
import { CurrencyListComponent } from './pages/general-category/currency-list/currency-list.component';
import { FirmComponent } from './pages/general-category/firm/firm.component';
import { ProductLocationComponent } from './pages/general-category/product-location/product-location.component';
import { FactoryVisitRegistrationComponent } from './pages/general-category/visit-factory-registation/factory-visit-registration.component';
import { WarehouseComponent1 } from './pages/general-category/wearhouse/warehouse/warehouse.component';
import { TsAssetAllocationComponent } from './pages/hrm/asset/asset/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetManagementComponent } from './pages/hrm/asset/asset/ts-asset-management/ts-asset-management.component';
import { TsAssetRecoveryComponent } from './pages/hrm/asset/asset/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetSourceComponent } from './pages/hrm/asset/asset/ts-asset-source/ts-asset-source.component';
import { TsAssetTransferComponent } from './pages/hrm/asset/asset/ts-asset-transfer/ts-asset-transfer.component';
import { TsAssetTypeComponent } from './pages/hrm/asset/asset/ts-asset-type/ts-asset-type.component';
import { TsAssetRecoveryPersonalNewComponent } from './pages/hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { BookingRoomComponent } from './pages/hrm/booking room/booking-room.component';
import { ContractComponent } from './pages/hrm/contract/contract.component';
import { DailyReportHrComponent } from './pages/hrm/daily-report-hr/daily-report-hr.component';
import { PersonDayOffComponent } from './pages/hrm/day-off/person-day-off/person-day-off.component';
import { DepartmentComponent } from './pages/hrm/department/department.component';
import { DocumentComponent } from './pages/hrm/document/document.component';
import { EarlyLateSummaryComponent } from './pages/hrm/early-late/early-late-summary/early-late-summary.component';
import { EarlyLateComponent } from './pages/hrm/early-late/early-late.component';
import { EmployeeAttendanceComponent } from './pages/hrm/employee-management/employee-attendance/employee-attendance.component';
import { EmployeeBussinessPersonSummaryComponent } from './pages/hrm/employee-management/employee-bussiness/employee-bussiness-person-summary/employee-bussiness-person-summary.component';
import { EmployeeBussinessComponent } from './pages/hrm/employee-management/employee-bussiness/employee-bussiness.component';
import { EmployeeRegisterBussinessComponent } from './pages/hrm/employee-management/employee-bussiness/employee-register-bussiness/employee-register-bussiness.component';
import { EmployeeCurricularComponent } from './pages/hrm/employee-management/employee-curriculart/employee-curricular/employee-curricular.component';
import { EmployeeErrorComponent } from './pages/hrm/employee-management/employee-error/employee-error.component';
import { EmployeeNightShiftPersonSummaryComponent } from './pages/hrm/employee-management/employee-night-shift/employee-night-shift-person-summary/employee-night-shift-person-summary.component';
import { EmployeeNightShiftComponent } from './pages/hrm/employee-management/employee-night-shift/employee-night-shift/employee-night-shift.component';
import { EmployeeNoFingerSummaryComponent } from './pages/hrm/employee-management/employee-no-fingerprint/employee-no-finger-summary/employee-no-finger-summary.component';
import { EmployeeNoFingerprintComponent } from './pages/hrm/employee-management/employee-no-fingerprint/employee-no-fingerprint.component';
import { EmployeeSyntheticPersonalComponent } from './pages/hrm/employee-management/employee-synthetic/employee-synthetic-personal/employee-synthetic-personal.component';
import { EmployeeSyntheticComponent } from './pages/hrm/employee-management/employee-synthetic/employee-synthetic/employee-synthetic.component';
import { EmployeeTimekeepingComponent } from './pages/hrm/employee-management/employee-timekeeping/employee-timekeeping.component';
import { WFHSummaryComponent } from './pages/hrm/employee-management/employee-wfh/WFH-summary/wfh-summary.component';
import { WFHComponent } from './pages/hrm/employee-management/employee-wfh/WFH.component';
import { EmployeeComponent } from './pages/hrm/employee/employee.component';
import { SummaryEmployeeComponent } from './pages/hrm/employee/summary-employee/summary-employee.component';
import { FilmManagementComponent } from './pages/hrm/film-management/film-management.component';
import { HandoverComponent } from './pages/hrm/handover/handover.component';
import { HolidayComponent } from './pages/hrm/holiday/holiday.component';
import { HrPurchaseProposalComponent } from './pages/hrm/hr-purchase-proposal/hr-purchase-proposal.component';
import { HrhiringRequestComponent } from './pages/hrm/hrhiring-request/hrhiring-request.component';
import { JobRequirementComponent } from './pages/hrm/job-requirement/job-requirement.component';
import { OfficeSupplyComponent } from './pages/hrm/office-supply/OfficeSupply/office-supply.component';
import { OfficeSupplyRequestsComponent } from './pages/hrm/office-supply/OfficeSupplyRequests/office-supply-requests.component';
import { OfficeSupplyRequestSummaryComponent } from './pages/hrm/office-supply/OfficeSupplyRequestSummary/office-supply-request-summary.component';
import { OverTimePersonComponent } from './pages/hrm/over-time/over-time-person/over-time-person.component';
import { OverTimeComponent } from './pages/hrm/over-time/over-time.component';
import { PayrollComponent } from './pages/hrm/payroll/payroll/payroll.component';
import { PhaseAllocationPersonComponent } from './pages/hrm/phase-allocation-person/phase-allocation-person.component';
import { PositionsComponent } from './pages/hrm/positions/positions.component';
import { ProtectgearComponent } from './pages/hrm/protectgear/protectgear/protectgear.component';
import { RegisterIdeaComponent } from './pages/hrm/register-idea/register-idea.component';
import { TeamComponent } from './pages/hrm/team/team.component';
import { TrackingMarksComponent } from './pages/hrm/tracking-marks/tracking-marks.component';
import { ProposeVehicleRepairComponent } from './pages/hrm/vehicle/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair.component';
import { VehicleRepairHistoryComponent } from './pages/hrm/vehicle/propose-vehicle-repair/vehicle-repair-history/vehicle-repair-history/vehicle-repair-history.component';
import { VehicleBookingManagementComponent } from './pages/hrm/vehicle/vehicle-booking-management/vehicle-booking-management.component';
import { VehicleManagementComponent } from './pages/hrm/vehicle/vehicle-management/vehicle-management.component';
import { VehicleRepairTypeFormComponent } from './pages/hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type-form/vehicle-repair-type-form.component';
import { BillExportTechnicalComponent } from './pages/old/bill-export-technical/bill-export-technical.component';
import { BillImportTechnicalComponent } from './pages/old/bill-import-technical/bill-import-technical.component';
import { BonusCoefficientComponent } from './pages/old/bonus-coefficient/bonus-coefficient.component';
import { BorrowProductHistoryComponent } from './pages/old/inventory-demo/borrow/borrow-product-history/borrow-product-history.component';
import { InventoryDemoComponent } from './pages/old/inventory-demo/inventory-demo.component';
import { UnitCountKtComponent } from './pages/old/inventory-demo/unit-count-kt/unit-count-kt.component';
import { AccountingContractTypeMasterComponent } from './pages/old/KETOAN/accounting-contract-type-master/accounting-contract-type-master.component';
import { AccountingContractComponent } from './pages/old/KETOAN/accounting-contract/accounting-contract.component';
import { HistoryApprovedBillLogComponent } from './pages/old/KETOAN/history-approved-bill-log/history-approved-bill-log.component';
import { HistoryExportAccountantComponent } from './pages/old/KETOAN/history-export-accountant/history-export-accountant.component';
import { InventoryByDateComponent } from './pages/old/KETOAN/inventory-by-date/inventory-by-date.component';
import { DailyReportSaleAdminComponent } from './pages/old/KPISale/daily-report-sale-admin/daily-report-sale-admin.component';
import { DailyReportSaleComponent } from './pages/old/KPISale/daily-report-sale/daily-report-sale.component';
import { EmployeeSaleManagerComponent } from './pages/old/KPISale/employee-sale-manager/employee-sale-manager.component';
import { PokhHistoryComponent } from './pages/old/pokh-history/pokh-history.component';
import { PokhKpiComponent } from './pages/old/pokh-kpi/pokh-kpi.component';
import { PokhComponent } from './pages/old/pokh/pokh.component';
import { ProductReportNewComponent } from './pages/old/product-report-new/product-report-new.component';
import { ProductRtcQrCodeComponent } from './pages/old/product-rtc-qr-code/product-rtc-qr-code/product-rtc-qr-code.component';
import { QuotationKhComponent } from './pages/old/quotation-kh/quotation-kh.component';
import { RequestInvoiceComponent } from './pages/old/request-invoice/request-invoice.component';
import { RequestInvoiceSummaryComponent } from './pages/old/request-invoice-summary/request-invoice-summary.component';
import { BillExportComponent } from './pages/old/Sale/BillExport/bill-export.component';
import { BillImportComponent } from './pages/old/Sale/BillImport/bill-import.component';
import { HistoryBorrowSaleComponent } from './pages/old/Sale/HistoryBorrowSale/history-borrow-sale.component';
import { HistoryImportExportComponent } from './pages/old/Sale/HistoryImportExport/history-import-export.component';
import { ListProductProjectComponent } from './pages/old/Sale/ListProductProject/list-product-project.component';
import { ProductSaleComponent } from './pages/old/Sale/ProductSale/product-sale.component';
import { UnitCountComponent } from './pages/old/Sale/ProductSale/unit-count/unit-count.component';
import { ReportImportExportComponent } from './pages/old/Sale/ReportImportExport/report-import-export.component';
import { SearchProductSerialNumberComponent } from './pages/old/Sale/SearchProductSerialNumber/search-product-serial-number.component';
import { TbProductRtcComponent } from './pages/old/tb-product-rtc/tb-product-rtc.component';
import { BorrowReportComponent } from './pages/old/Technical/borrow-report/borrow-report.component';
import { ProductExportAndBorrowComponent } from './pages/old/Technical/product-export-and-borrow/product-export-and-borrow.component';
import { ProductLocationTechnicalComponent } from './pages/old/Technical/product-location-technical/product-location-technical.component';
import { TsAssetAllocationPersonalComponent } from './pages/old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetManagementPersonalTypeComponent } from './pages/old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from './pages/old/ts-asset-management-personal/ts-asset-management-personal.component';
import { FollowProjectBaseComponent } from './pages/old/VisionBase/kho-base/follow-project-base/follow-project-base.component';
import { PlanWeekComponent } from './pages/old/VisionBase/plan-week/plan-week.component';
import { ApproveTpComponent } from './pages/person/approve-tp/approve-tp/approve-tp.component';
import { PersonComponent } from './pages/person/person.component';
import { RegisterContractComponent } from './pages/person/register-contract/register-contract.component';
import { WorkplanComponent } from './pages/person/workplan/workplan.component';
import { LeaderProjectComponent } from './pages/project/leader-project/leader-project.component';
import { MeetingMinuteTypeComponent } from './pages/project/meeting-minute/meeting-minute-type/meeting-minute-type.component';
import { MeetingMinuteComponent } from './pages/project/meeting-minute/meeting-minute.component';
import { PriceHistoryPartlistComponent } from './pages/project/price-history-partlist/price-history-partlist.component';
import { ProjectAgvSummaryComponent } from './pages/project/project-agv-summary/project-agv-summary.component';
import { ProjectPartListComponent } from './pages/project/project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { ProjectDepartmentSummaryComponent } from './pages/project/project-department-summary/project-department-summary.component';
import { ProjectFieldComponent } from './pages/project/project-field/project-field/project-field.component';
import { ProjectItemLateComponent } from './pages/project/project-item-late/project-item-late.component';
import { ProjectLeaderProjectTypeComponent } from './pages/project/project-leader-project-type/project-leader-project-type.component';
import { ProjectSurveyComponent } from './pages/project/project-survey/project-survey.component';
import { ProjectTypeComponent } from './pages/project/project-type/project-type.component';
import { ProjectWorkItemTimelineComponent } from './pages/project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from './pages/project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from './pages/project/project-work-timeline/project-work-timeline.component';
import { SynthesisOfGeneratedMaterialsComponent } from './pages/project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { AssignWorkComponent } from './pages/purchase/assign-work/assign-work.component';
import { EmployeePurchaseComponent } from './pages/purchase/employee-purchase/employee-purchase.component';
import { InventoryByProductComponent } from './pages/purchase/inventory-by-product/inventory-by-product.component';
import { InventoryProjectComponent } from './pages/purchase/inventory-project/inventory-project/inventory-project.component';
import { PonccNewComponent } from './pages/purchase/poncc-new/poncc-new.component';
import { ProjectPartlistPriceRequestNewComponent } from './pages/purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { ProjectPartListPurchaseRequestSlickGridComponent } from './pages/purchase/project-partlist-purchase-request/project-part-list-purchase-request-slick-grid/project-part-list-purchase-request-slick-grid.component';
import { RulePayComponent } from './pages/purchase/rulepay/rule-pay.component';
import { SupplierSaleComponent } from './pages/purchase/supplier-sale/supplier-sale.component';
import { TrainingRegistrationComponent } from './pages/training-registration/training-registration.component';
import { OverTimeSummaryPersonComponent } from './pages/hrm/over-time/over-time-summary-person/over-time-summary-person.component';
import { WorkItemComponent } from './pages/project/work-item/work-item.component';
import { DailyReportMachineComponent } from './pages/daily-report-machine/daily-report-machine.component';
import { ProjectComponent } from './pages/project/project.component';
import { EmployeeContactComponent } from './pages/hrm/employee/employee-contact/employee-contact.component';
import { SearchProductTechSerialComponent } from './pages/old/Technical/search-product-tech-serial/search-product-tech-serial.component';
import { VehicleRepairTypeComponent } from './pages/hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { OfficeSupplyUnitComponent } from './pages/hrm/office-supply/OfficeSupplyUnit/office-supply-unit.component';
import { DocumentImportExportComponent } from './pages/old/KETOAN/document-import-export/document-import-export.component';
import { DocumentCommonComponent } from './pages/hrm/document/document-common/document-common.component';

export const routes: Routes = [
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            { path: 'login', component: LoginComponent },
            { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
    },

    {
        path: '',
        // component: HomeLayoutComponent,
        component: HomeLayoutNewComponent,
        canActivate: [],
        // children: [{ path: 'home', component: HomeLayoutComponent }],
        children: [{ path: 'home', component: HomeLayoutNewComponent }],
    },

    {
        path: '',
        component: MainLayoutComponent, // layout chứa sidebar, topbar, etc.
        canActivate: [authGuard],
        children: [
            { path: 'welcome', outlet: 'welcome', component: WelcomeComponent, canActivate: [authGuard] },

            //#region hệ thống
            { path: 'menu-app', outlet: 'menu-app', component: MenuAppComponent, canActivate: [authGuard] },
            //#endregion

            //#region crm
            { path: 'customer', outlet: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            //#endregion

            //#region kế toán
            { path: 'paymentorder', outlet: 'paymentorder', component: PaymentOrderComponent, canActivate: [authGuard] },

            //#endregion

            // { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            { path: 'inventory', outlet: 'inventory', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import', outlet: 'bill-import', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export', outlet: 'bill-export', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export', outlet: 'history-import-export', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-sale', outlet: 'history-borrow-sale', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export', outlet: 'report-import-export', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'list-product-project', outlet: 'list-product-project', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-product-serial-number', outlet: 'search-product-serial-number', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },
            { path: 'inventory-demo', outlet: 'inventory-demo', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-technical', outlet: 'bill-import-technical', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-technical', outlet: 'bill-export-technical', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-new', outlet: 'product-report-new', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-and-borrow', outlet: 'product-export-and-borrow', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report', outlet: 'borrow-report', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history', outlet: 'borrow-product-history', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'product-location-technical', outlet: 'product-location-technical', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-rtc-qr-code', outlet: 'product-rtc-qr-code', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },
            { path: 'unit-count-kt', outlet: 'unit-count-kt', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-location', outlet: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            { path: 'firm', outlet: 'firm', component: FirmComponent, canActivate: [authGuard] },
            { path: 'unit-count', outlet: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            { path: 'product-sale', outlet: 'product-sale', component: ProductSaleComponent, canActivate: [authGuard] },
            { path: 'tb-product-rtc', outlet: 'tb-product-rtc', component: TbProductRtcComponent, canActivate: [authGuard] },
            { path: 'hrhiring-request', outlet: 'hrhiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            { path: 'job-requirement', outlet: 'job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'hr-purchase-proposal', outlet: 'hr-purchase-proposal', component: HrPurchaseProposalComponent, canActivate: [authGuard] },
            { path: 'document', outlet: 'document', component: DocumentComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management', outlet: 'ts-asset-management', component: TsAssetManagementComponent, canActivate: [authGuard] },
            { path: 'ts-asset-type', outlet: 'ts-asset-type', component: TsAssetTypeComponent, canActivate: [authGuard] },
            { path: 'ts-asset-source', outlet: 'ts-asset-source', component: TsAssetSourceComponent, canActivate: [authGuard] },
            { path: 'ts-asset-allocation', outlet: 'ts-asset-allocation', component: TsAssetAllocationComponent, canActivate: [authGuard] },
            { path: 'ts-asset-recovery', outlet: 'ts-asset-recovery', component: TsAssetRecoveryComponent, canActivate: [authGuard] },
            { path: 'ts-asset-transfer', outlet: 'ts-asset-transfer', component: TsAssetTransferComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management-personal', outlet: 'ts-asset-management-personal', component: TsAssetManagementPersonalComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management-personal-type', outlet: 'ts-asset-management-personal-type', component: TsAssetManagementPersonalTypeComponent, canActivate: [authGuard] },
            { path: 'ts-asset-allocation-personal', outlet: 'ts-asset-allocation-personal', component: TsAssetAllocationPersonalComponent, canActivate: [authGuard] },
            { path: 'ts-asset-recovery-personal-new', outlet: 'ts-asset-recovery-personal-new', component: TsAssetRecoveryPersonalNewComponent, canActivate: [authGuard] },
            { path: 'department', outlet: 'department', component: DepartmentComponent, canActivate: [authGuard] },
            { path: 'vehicle-management', outlet: 'vehicle-management', component: VehicleManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-booking-management', outlet: 'vehicle-booking-management', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-type-form', outlet: 'vehicle-repair-type-form', component: VehicleRepairTypeFormComponent, canActivate: [authGuard] },
            { path: 'propose-vehicle-repair', outlet: 'propose-vehicle-repair', component: ProposeVehicleRepairComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-history', outlet: 'vehicle-repair-history', component: VehicleRepairHistoryComponent, canActivate: [authGuard] },
            { path: 'office-supply', outlet: 'office-supply', component: OfficeSupplyComponent, canActivate: [authGuard] },
            { path: 'office-supply-request-summary', outlet: 'office-supply-request-summary', component: OfficeSupplyRequestSummaryComponent, canActivate: [authGuard] },
            { path: 'film-management', outlet: 'film-management', component: FilmManagementComponent, canActivate: [authGuard] },
            { path: 'team', outlet: 'team', component: TeamComponent, canActivate: [authGuard] },
            { path: 'positions', outlet: 'positions', component: PositionsComponent, canActivate: [authGuard] },
            { path: 'employee', outlet: 'employee', component: EmployeeComponent, canActivate: [authGuard] },
            { path: 'contract', outlet: 'contract', component: ContractComponent, canActivate: [authGuard] },
            { path: 'handover', outlet: 'handover', component: HandoverComponent, canActivate: [authGuard] },
            { path: 'holiday', outlet: 'holiday', component: HolidayComponent, canActivate: [authGuard] },
            { path: 'food-order', outlet: 'food-order', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'day-off', outlet: 'day-off', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'early-late', outlet: 'early-late', component: EarlyLateComponent, canActivate: [authGuard] },
            { path: 'over-time', outlet: 'over-time', component: OverTimeComponent, canActivate: [authGuard] },
            { path: 'employee-bussiness', outlet: 'employee-bussiness', component: EmployeeBussinessComponent, canActivate: [authGuard] },
            { path: 'employee-night-shift', outlet: 'employee-night-shift', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            { path: 'wfh', outlet: 'wfh', component: WFHComponent, canActivate: [authGuard] },
            { path: 'employee-no-fingerprint', outlet: 'employee-no-fingerprint', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            { path: 'employee-attendance', outlet: 'employee-attendance', component: EmployeeAttendanceComponent, canActivate: [authGuard] },
            { path: 'employee-error', outlet: 'employee-error', component: EmployeeErrorComponent, canActivate: [authGuard] },
            { path: 'employee-curricular', outlet: 'employee-curricular', component: EmployeeCurricularComponent, canActivate: [authGuard] },
            { path: 'payroll', outlet: 'payroll', component: PayrollComponent, canActivate: [authGuard] },
            { path: 'employee-timekeeping', outlet: 'employee-timekeeping', component: EmployeeTimekeepingComponent, canActivate: [authGuard] },
            { path: 'employee-synthetic', outlet: 'employee-synthetic', component: EmployeeSyntheticComponent, canActivate: [authGuard] },
            { path: 'daily-report-hr', outlet: 'daily-report-hr', component: DailyReportHrComponent, canActivate: [authGuard] },
            { path: 'protectgear', outlet: 'protectgear', component: ProtectgearComponent, canActivate: [authGuard] },
            { path: 'phase-allocation-person', outlet: 'phase-allocation-person', component: PhaseAllocationPersonComponent, canActivate: [authGuard] },
            { path: 'training-registration', outlet: 'training-registration', component: TrainingRegistrationComponent, canActivate: [authGuard] },
            { path: 'factory-visit-registration', outlet: 'factory-visit-registration', component: FactoryVisitRegistrationComponent, canActivate: [authGuard] },
            { path: 'app', component: AppComponent, canActivate: [authGuard] },
            { path: 'warehouse', outlet: 'warehouse', component: WarehouseComponent1, canActivate: [authGuard] },
            { path: 'inventory-by-product', outlet: 'inventory-by-product', component: InventoryByProductComponent, canActivate: [authGuard] },
            { path: 'employee-purchase', outlet: 'employee-purchase', component: EmployeePurchaseComponent, canActivate: [authGuard] },
            { path: 'rule-pay', outlet: 'rule-pay', component: RulePayComponent, canActivate: [authGuard] },
            { path: 'currency-list', outlet: 'currency-list', component: CurrencyListComponent, canActivate: [authGuard] },
            { path: 'supplier-sale', outlet: 'supplier-sale', component: SupplierSaleComponent, canActivate: [authGuard] },
            { path: 'project-partlist-price-request-new', outlet: 'project-partlist-price-request-new', component: ProjectPartlistPriceRequestNewComponent, canActivate: [authGuard] },
            { path: 'assign-work', outlet: 'assign-work', component: AssignWorkComponent, canActivate: [authGuard] },
            { path: 'poncc-new', outlet: 'poncc-new', component: PonccNewComponent, canActivate: [authGuard] },
            { path: 'inventory-project', outlet: 'inventory-project', component: InventoryProjectComponent, canActivate: [authGuard] },
            { path: 'project-part-list-purchase-request-slick-grid', outlet: 'project-part-list-purchase-request-slick-grid', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },
            { path: 'project-work-propress', outlet: 'project-work-propress', component: ProjectWorkPropressComponent, canActivate: [authGuard] },
            { path: 'project-work-timeline', outlet: 'project-work-timeline', component: ProjectWorkTimelineComponent, canActivate: [authGuard] },
            { path: 'project-survey', outlet: 'project-survey', component: ProjectSurveyComponent, canActivate: [authGuard] },
            { path: 'meeting-minute', outlet: 'meeting-minute', component: MeetingMinuteComponent, canActivate: [authGuard] },
            { path: 'project-item-late', outlet: 'project-item-late', component: ProjectItemLateComponent, canActivate: [authGuard] },
            { path: 'project-work-item-timeline', outlet: 'project-work-item-timeline', component: ProjectWorkItemTimelineComponent, canActivate: [authGuard] },
            { path: 'synthesis-of-generated-materials', outlet: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard] },
            { path: 'project-agv-summary', outlet: 'project-agv-summary', component: ProjectAgvSummaryComponent, canActivate: [authGuard] },
            { path: 'project-department-summary', outlet: 'project-department-summary', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard] },
            { path: 'price-history-partlist', component: PriceHistoryPartlistComponent, canActivate: [authGuard], outlet: 'price-history-partlist' },
            { path: 'project-type', component: ProjectTypeComponent, canActivate: [authGuard], outlet: 'project-type' },
            { path: 'project-leader-project-type', component: ProjectLeaderProjectTypeComponent, canActivate: [authGuard], outlet: 'project-leader-project-type' },
            { path: 'project-field', component: ProjectFieldComponent, canActivate: [authGuard], outlet: 'project-field' },
            { path: 'leader-project', component: LeaderProjectComponent, canActivate: [authGuard], outlet: 'leader-project' },
            { path: 'meeting-minute-type', component: MeetingMinuteTypeComponent, canActivate: [authGuard], outlet: 'meeting-minute-type' },
            { path: 'pokh', component: PokhComponent, canActivate: [authGuard], outlet: 'pokh' },
            { path: 'quotation-kh', component: QuotationKhComponent, canActivate: [authGuard], outlet: 'quotation-kh' },
            { path: 'pokh-kpi', component: PokhKpiComponent, canActivate: [authGuard], outlet: 'pokh-kpi' },
            { path: 'pokh-history', component: PokhHistoryComponent, canActivate: [authGuard], outlet: 'pokh-history' },
            { path: 'plan-week', component: PlanWeekComponent, canActivate: [authGuard], outlet: 'plan-week' },
            { path: 'follow-project-base', component: FollowProjectBaseComponent, canActivate: [authGuard], outlet: 'follow-project-base' },
            { path: 'bonus-coefficient', component: BonusCoefficientComponent, canActivate: [authGuard], outlet: 'bonus-coefficient' },
            { path: 'employee-sale-manager', component: EmployeeSaleManagerComponent, canActivate: [authGuard], outlet: 'employee-sale-manager' },
            { path: 'daily-report-sale', component: DailyReportSaleComponent, canActivate: [authGuard], outlet: 'daily-report-sale' },
            { path: 'daily-report-sale-admin', component: DailyReportSaleAdminComponent, canActivate: [authGuard], outlet: 'daily-report-sale-admin' },
            { path: 'request-invoice', component: RequestInvoiceComponent, canActivate: [authGuard], outlet: 'request-invoice' },
            { path: 'request-invoice-summary', component: RequestInvoiceSummaryComponent, canActivate: [authGuard], outlet: 'request-invoice-summary' },
            { path: 'history-export-accountant', component: HistoryExportAccountantComponent, canActivate: [authGuard], outlet: 'history-export-accountant' },
            { path: 'history-approved-bill-log', component: HistoryApprovedBillLogComponent, canActivate: [authGuard], outlet: 'history-approved-bill-log' },
            { path: 'inventory-by-date', component: InventoryByDateComponent, canActivate: [authGuard], outlet: 'inventory-by-date' },
            { path: 'accounting-contract-type-master', component: AccountingContractTypeMasterComponent, canActivate: [authGuard], outlet: 'accounting-contract-type-master' },
            { path: 'accounting-contract', component: AccountingContractComponent, canActivate: [authGuard], outlet: 'accounting-contract' },
            { path: 'payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'payment-order' },
            { path: 'person-day-off', component: PersonDayOffComponent, canActivate: [authGuard], outlet: 'person-day-off' },
            { path: 'early-late-summary', component: EarlyLateSummaryComponent, canActivate: [authGuard], outlet: 'early-late-summary' },
            { path: 'wfh-summary', component: WFHSummaryComponent, canActivate: [authGuard], outlet: 'wfh-summary' },
            { path: 'employee-no-finger-summary', component: EmployeeNoFingerSummaryComponent, canActivate: [authGuard], outlet: 'employee-no-finger-summary' },
            { path: 'employee-bussiness-person-summary', component: EmployeeBussinessPersonSummaryComponent, canActivate: [authGuard], outlet: 'employee-bussiness-person-summary' },
            { path: 'employee-night-shift-person-summary', component: EmployeeNightShiftPersonSummaryComponent, canActivate: [authGuard], outlet: 'employee-night-shift-person-summary' },
            { path: 'over-time-person', component: OverTimePersonComponent, canActivate: [authGuard], outlet: 'over-time-person' },
            { path: 'employee-register-bussiness', component: EmployeeRegisterBussinessComponent, canActivate: [authGuard], outlet: 'employee-register-bussiness' },
            { path: 'summary-employee', component: SummaryEmployeeComponent, canActivate: [authGuard], outlet: 'summary-employee' },
            { path: 'employee-synthetic-personal', component: EmployeeSyntheticPersonalComponent, canActivate: [authGuard], outlet: 'employee-synthetic-personal' },
            { path: 'booking-room', component: BookingRoomComponent, canActivate: [authGuard], outlet: 'booking-room' },
            { path: 'tracking-marks', component: TrackingMarksComponent, canActivate: [authGuard], outlet: 'tracking-marks' },
            { path: 'person', component: PersonComponent, canActivate: [authGuard], outlet: 'person' },
            { path: 'register-idea', component: RegisterIdeaComponent, canActivate: [authGuard], outlet: 'register-idea' },
            { path: 'register-contract', component: RegisterContractComponent, canActivate: [authGuard], outlet: 'register-contract' },
            { path: 'daily-report-tech', component: DailyReportTechComponent, canActivate: [authGuard], outlet: 'daily-report-tech' },
            { path: 'daily-report-thr', component: DailyReportThrComponent, canActivate: [authGuard], outlet: 'daily-report-thr' },
            { path: 'daily-report-lxcp', component: DailyReportLXCPComponent, canActivate: [authGuard], outlet: 'daily-report-lxcp' },
            { path: 'workplan', component: WorkplanComponent, canActivate: [authGuard], outlet: 'workplan' },
            { path: 'approve-tp', component: ApproveTpComponent, canActivate: [authGuard], outlet: 'approve-tp' },
            { path: 'office-supply-requests', component: OfficeSupplyRequestsComponent, canActivate: [authGuard], outlet: 'office-supply-requests' },
            { path: 'project-partlist', component: ProjectPartListComponent, canActivate: [authGuard], outlet: 'project-partlist' },


            //TBP duyệt
            { path: 'tbp-payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'tbp-payment-order' },
            { path: 'tbp-job-requirement', component: JobRequirementComponent, canActivate: [authGuard], outlet: 'tbp-job-requirement' },
            { path: 'tbp-project-partlist', component: ProjectPartListComponent, canActivate: [authGuard], outlet: 'tbp-project-partlist' },
            { path: 'tbp-project-partlist-purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard], outlet: 'tbp-project-partlist-purchase-request' },

            //HR duyệt
            { path: 'hr-payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'hr-payment-order' },
            { path: 'hr-job-requirement', component: JobRequirementComponent, canActivate: [authGuard], outlet: 'hr-job-requirement' },


            //BGD duyệt
            { path: 'bgd-payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'bgd-payment-order' },
            { path: 'bgd-job-requirement', component: JobRequirementComponent, canActivate: [authGuard], outlet: 'bgd-job-requirement' },
            { path: 'bgd-project-partlist-purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard], outlet: 'bgd-project-partlist-purchase-request' },

            { path: 'sale-payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'sale-payment-order' },
            { path: 'tbp-approve', component: ApproveTpComponent, canActivate: [authGuard], outlet: 'tbp-approve' },
            { path: 'senior-approve', component: ApproveTpComponent, canActivate: [authGuard], outlet: 'senior-approve' },



            //Tổng hợp công
            { path: 'person-dayoff', component: PersonDayOffComponent, canActivate: [authGuard], outlet: 'person-dayoff' },
            { path: 'early-late-summary', component: EarlyLateSummaryComponent, canActivate: [authGuard], outlet: 'early-late-summary' },
            { path: 'wfh-summary', component: WFHSummaryComponent, canActivate: [authGuard], outlet: 'wfh-summary' },
            { path: 'nofinger-summary', component: EmployeeNoFingerSummaryComponent, canActivate: [authGuard], outlet: 'nofinger-summary' },
            { path: 'overtime-summary', component: OverTimeSummaryPersonComponent, canActivate: [authGuard], outlet: 'overtime-summary' },
            { path: 'bussiness-summary', component: EmployeeBussinessPersonSummaryComponent, canActivate: [authGuard], outlet: 'bussiness-summary' },
            { path: 'nightshift-summary', component: EmployeeNightShiftPersonSummaryComponent, canActivate: [authGuard], outlet: 'nightshift-summary' },


            //đăng ký công
            { path: 'food-order', component: FoodOrderComponent, canActivate: [authGuard], outlet: 'food-order' },
            { path: 'dayoff', component: DayOffComponent, canActivate: [authGuard], outlet: 'dayoff' },
            { path: 'early-late', component: EarlyLateComponent, canActivate: [authGuard], outlet: 'early-late' },
            { path: 'overtime', component: OverTimePersonComponent, canActivate: [authGuard], outlet: 'overtime' },
            { path: 'bussiness', component: EmployeeRegisterBussinessComponent, canActivate: [authGuard], outlet: 'bussiness' },
            { path: 'nightshift', component: EmployeeRegisterBussinessComponent, canActivate: [authGuard], outlet: 'nightshift' },
            { path: 'wfh', component: WFHComponent, canActivate: [authGuard], outlet: 'wfh' },
            { path: 'nofinger', component: EmployeeNoFingerprintComponent, canActivate: [authGuard], outlet: 'nofinger' },
            { path: 'person-summary', component: SummaryEmployeeComponent, canActivate: [authGuard], outlet: 'person-summary' },
            { path: 'person-summary-payroll', component: EmployeeSyntheticPersonalComponent, canActivate: [authGuard], outlet: 'person-summary-payroll' },


            //Đăng ký chung
            { path: 'booking-room', component: BookingRoomComponent, canActivate: [authGuard], outlet: 'booking-room' },
            { path: 'tracking-mark', component: TrackingMarksComponent, canActivate: [authGuard], outlet: 'tracking-mark' },
            { path: 'booking-vehicle', component: VehicleBookingManagementComponent, canActivate: [authGuard], outlet: 'booking-vehicle' },
            { path: 'payment-order', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'payment-order' },
            { path: 'payment-order-special', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'payment-order-special' },
            { path: 'job-requirement', component: JobRequirementComponent, canActivate: [authGuard], outlet: 'job-requirement' },
            { path: 'register-idea', component: RegisterIdeaComponent, canActivate: [authGuard], outlet: 'register-idea' },
            { path: 'register-contract', component: RegisterContractComponent, canActivate: [authGuard], outlet: 'register-contract' },
            { path: 'office-supply-requests', component: OfficeSupplyRequestsComponent, canActivate: [authGuard], outlet: 'office-supply-requests' },

            { path: 'work-item', component: WorkItemComponent, canActivate: [authGuard], outlet: 'work-item' },


            //Báo cáo công việc
            { path: 'daily-report-machine', component: DailyReportMachineComponent, canActivate: [authGuard], outlet: 'daily-report-machine' },
            { path: 'daily-report-sale-admin', component: DailyReportSaleAdminComponent, canActivate: [authGuard], outlet: 'daily-report-sale-admin' },
            { path: 'daily-report-sale', component: DailyReportSaleComponent, canActivate: [authGuard], outlet: 'daily-report-sale' },
            { path: 'daily-report-tech', component: DailyReportTechComponent, canActivate: [authGuard], outlet: 'daily-report-tech' },
            { path: 'daily-report-thr', component: DailyReportThrComponent, canActivate: [authGuard], outlet: 'daily-report-thr' },
            { path: 'daily-report-lxcp', component: DailyReportLXCPComponent, canActivate: [authGuard], outlet: 'daily-report-lxcp' },
            { path: 'daily-report-lr', component: DailyReportMachineComponent, canActivate: [authGuard], outlet: 'daily-report-lr' },


            //Kế hoạch tuần
            { path: 'work-plan', component: WorkplanComponent, canActivate: [authGuard], outlet: 'work-plan' },

            //Kế toán
            { path: 'history-export-accountant', component: HistoryExportAccountantComponent, canActivate: [authGuard], outlet: 'history-export-accountant' },
            { path: 'history-approved-bill', component: HistoryApprovedBillLogComponent, canActivate: [authGuard], outlet: 'history-approved-bill' },
            { path: 'accounting-contract-type', component: AccountingContractTypeMasterComponent, canActivate: [authGuard], outlet: 'accounting-contract-type' },
            { path: 'accounting-contract', component: AccountingContractComponent, canActivate: [authGuard], outlet: 'accounting-contract' },
            { path: 'request-invoice-kt', component: RequestInvoiceComponent, canActivate: [authGuard], outlet: 'request-invoice-kt' },
            { path: 'payment-order-kt', component: PaymentOrderComponent, canActivate: [authGuard], outlet: 'payment-order-kt' },
            { path: 'document-import-export', component: DocumentImportExportComponent, canActivate: [authGuard], outlet: 'document-import-export' },


            //Phòng sale
            //HN
            { path: 'pokh-hn', component: PokhComponent, canActivate: [authGuard], outlet: 'pokh-hn' },
            { path: 'quotationkh-hn', component: QuotationKhComponent, canActivate: [authGuard], outlet: 'quotationkh-hn' },
            { path: 'pokh-kpi-hn', component: PokhKpiComponent, canActivate: [authGuard], outlet: 'pokh-kpi-hn' },
            { path: 'pokh-history-hn', component: PokhHistoryComponent, canActivate: [authGuard], outlet: 'pokh-history-hn' },
            { path: 'plan-week-hn', component: PlanWeekComponent, canActivate: [authGuard], outlet: 'plan-week-hn' },
            { path: 'follow-project-base-hn', component: FollowProjectBaseComponent, canActivate: [authGuard], outlet: 'follow-project-base-hn' },
            { path: 'customer-sale-hn', component: CustomerComponent, canActivate: [authGuard], outlet: 'customer-sale-hn' },


            //KPI
            { path: 'bonus-coefficient-hn', component: BonusCoefficientComponent, canActivate: [authGuard], outlet: 'bonus-coefficient-hn' },
            { path: 'employee-sale-hn', component: EmployeeSaleManagerComponent, canActivate: [authGuard], outlet: 'employee-sale-hn' },
            { path: 'daily-report-sale-hn', component: DailyReportSaleComponent, canActivate: [authGuard], outlet: 'daily-report-sale-hn' },
            { path: 'daily-report-saleadmin-hn', component: DailyReportSaleAdminComponent, canActivate: [authGuard], outlet: 'daily-report-saleadmin-hn' },
            { path: 'request-invoice-hn', component: RequestInvoiceComponent, canActivate: [authGuard], outlet: 'request-invoice-hn' },


            //HCM
            { path: 'request-invoice-hcm', component: RequestInvoiceComponent, canActivate: [authGuard], outlet: 'request-invoice-hcm' },
            { path: 'pokh-hcm', component: PokhComponent, canActivate: [authGuard], outlet: 'pokh-hcm' },
            { path: 'follow-project-base-hcm', component: FollowProjectBaseComponent, canActivate: [authGuard], outlet: 'follow-project-base-hcm' },



            //Dự án
            { path: 'project', component: ProjectComponent, canActivate: [authGuard], outlet: 'project' },
            { path: 'project-workpropress', component: ProjectWorkPropressComponent, canActivate: [authGuard], outlet: 'project-workpropress' },
            { path: 'project-worktimeline', component: ProjectWorkTimelineComponent, canActivate: [authGuard], outlet: 'project-worktimeline' },
            { path: 'project-survey', component: ProjectSurveyComponent, canActivate: [authGuard], outlet: 'project-survey' },
            { path: 'meeting-minute', component: MeetingMinuteComponent, canActivate: [authGuard], outlet: 'meeting-minute' },
            { path: 'project-itemlate', component: ProjectItemLateComponent, canActivate: [authGuard], outlet: 'project-itemlate' },
            { path: 'project-workitem-timeline', component: ProjectWorkItemTimelineComponent, canActivate: [authGuard], outlet: 'project-workitem-timeline' },
            { path: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard], outlet: 'synthesis-of-generated-materials' },
            { path: 'project-agv-summary', component: ProjectAgvSummaryComponent, canActivate: [authGuard], outlet: 'project-agv-summary' },
            { path: 'project-dept-summary', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard], outlet: 'project-dept-summary' },
            { path: 'price-history-partlist', component: PriceHistoryPartlistComponent, canActivate: [authGuard], outlet: 'price-history-partlist' },
            { path: 'project-type', component: ProjectTypeComponent, canActivate: [authGuard], outlet: 'project-type' },
            { path: 'project-field', component: ProjectFieldComponent, canActivate: [authGuard], outlet: 'project-field' },
            { path: 'meeting-minute-type', component: MeetingMinuteTypeComponent, canActivate: [authGuard], outlet: 'meeting-minute-type' },


            //Mua hàng
            { path: 'employee-purchase', component: EmployeePurchaseComponent, canActivate: [authGuard], outlet: 'employee-purchase' },
            { path: 'rulepay', component: RulePayComponent, canActivate: [authGuard], outlet: 'rulepay' },
            { path: 'currency', component: CurrencyListComponent, canActivate: [authGuard], outlet: 'currency' },
            { path: 'supplier', component: SupplierSaleComponent, canActivate: [authGuard], outlet: 'supplier' },
            { path: 'price-request', component: ProjectPartlistPriceRequestNewComponent, canActivate: [authGuard], outlet: 'price-request' },
            { path: 'assign-work', component: AssignWorkComponent, canActivate: [authGuard], outlet: 'assign-work' },
            { path: 'poncc', component: PonccNewComponent, canActivate: [authGuard], outlet: 'poncc' },
            { path: 'inventory-project', component: InventoryProjectComponent, canActivate: [authGuard], outlet: 'inventory-project' },
            { path: 'purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard], outlet: 'purchase-request' },


            //Danh mục chung
            { path: 'training-registration', component: TrainingRegistrationComponent, canActivate: [authGuard], outlet: 'training-registration' },
            { path: 'factory-visit-registration', component: FactoryVisitRegistrationComponent, canActivate: [authGuard], outlet: 'factory-visit-registration' },
            { path: 'employee-contact', component: EmployeeContactComponent, canActivate: [authGuard], outlet: 'employee-contact' },
            { path: 'warehouse', component: WarehouseComponent1, canActivate: [authGuard], outlet: 'warehouse' },
            { path: 'inventory-by-product', component: InventoryByProductComponent, canActivate: [authGuard], outlet: 'inventory-by-product' },



            // //Kho sale hn
            // { path: 'inventory-hn', outlet: 'hn', component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-hn', outlet: 'hn', component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-hn', outlet: 'hn', component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-hn', outlet: 'hn', component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-hn', outlet: 'hn', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-hn', outlet: 'hn', component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-hn', outlet: 'hn', component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-hn', outlet: 'hn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //kho demo hn
            // { path: 'inventory-demo-hn', outlet: 'hn', component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-hn', outlet: 'hn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-hn', outlet: 'hn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-hn', outlet: 'hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hn', outlet: 'hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-hn', outlet: 'hn', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-hn', outlet: 'hn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hn', outlet: 'hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-hn', outlet: 'hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', outlet: 'hn', component: UnitCountKtComponent, canActivate: [authGuard] },

            // //kho agv
            // { path: 'inventory-agv-hn', outlet: 'hn', component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-agv-hn', outlet: 'hn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-agv-hn', outlet: 'hn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-agv-hn', outlet: 'hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            // // { path: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-agv-hn', outlet: 'hn', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-agv-hn', outlet: 'hn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // // { path: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-agv-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },


            // //Sale HCM
            // { path: 'inventory-hcm', outlet: 'hcm', component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-hcm', outlet: 'hcm', component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-hcm', outlet: 'hcm', component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-hcm', outlet: 'hcm', component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-hcm', outlet: 'hcm', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-hcm', outlet: 'hcm', component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-hcm', outlet: 'hcm', component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-hcm', outlet: 'hcm', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },


            // //Sale demo
            // { path: 'inventory-demo-hcm', outlet: 'hcm', component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-hcm', outlet: 'hcm', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-hcm', outlet: 'hcm', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-hcm', outlet: 'hcm', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hcm', outlet: 'hcm', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-hcm', outlet: 'hcm', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-hcm', outlet: 'hcm', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hcm', outlet: 'hcm', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-hcm', outlet: 'hcm', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            // //Sale BẮc ning
            // { path: 'inventory-bn', outlet: 'bn', component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-bn', outlet: 'bn', component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-bn', outlet: 'bn', component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-bn', outlet: 'bn', component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-bn', outlet: 'bn', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-bn', outlet: 'bn', component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-bn', outlet: 'bn', component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-bn', outlet: 'bn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //Demo Băc nign
            // { path: 'inventory-demo-bn', outlet: 'bn', component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-bn', outlet: 'bn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-bn', outlet: 'bn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-bn', outlet: 'bn', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-bn', outlet: 'bn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-bn', outlet: 'bn', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-bn', outlet: 'bn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-bn', outlet: 'bn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-bn', outlet: 'bn', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            // //Sale Đan phương
            // { path: 'inventory-dp', outlet: 'dp', component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-dp', outlet: 'dp', component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-dp', outlet: 'dp', component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-dp', outlet: 'dp', component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-dp', outlet: 'dp', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-dp', outlet: 'dp', component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-dp', outlet: 'dp', component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-dp', outlet: 'dp', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //Demo BĐan phương
            // { path: 'inventory-demo-dp', outlet: 'dp', component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-dp', outlet: 'dp', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-dp', outlet: 'dp', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-dp', outlet: 'dp', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-dp', outlet: 'dp', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-dp', outlet: 'dp', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-dp', outlet: 'dp', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-dp', outlet: 'dp', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-dp', outlet: 'dp', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },


            // //Cài đặt
            // { path: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            // { path: 'firm', component: FirmComponent, canActivate: [authGuard] },
            // { path: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            // { path: 'product-sale', component: ProductSaleComponent, canActivate: [authGuard] },
            // { path: 'product-demo', component: TbProductRtcComponent, canActivate: [authGuard] },
            // { path: 'product-agv', component: TbProductRtcComponent, canActivate: [authGuard] },


            // //Nhân dự
            // { path: 'hr-hiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            // { path: 'job-requirement-hr', component: JobRequirementComponent, canActivate: [authGuard] },
            // { path: 'proposal-hr', component: HrPurchaseProposalComponent, canActivate: [authGuard] },
            // { path: 'document', component: DocumentComponent, canActivate: [authGuard] },
            // { path: 'document-common', component: DocumentCommonComponent, canActivate: [authGuard] },
            // { path: 'asset-management', component: TsAssetManagementComponent, canActivate: [authGuard] },
            // { path: 'asset-type', component: TsAssetTypeComponent, canActivate: [authGuard] },
            // { path: 'asset-source', component: TsAssetSourceComponent, canActivate: [authGuard] },
            // { path: 'asset-allocation', component: TsAssetAllocationComponent, canActivate: [authGuard] },
            // { path: 'asset-recovery', component: TsAssetRecoveryComponent, canActivate: [authGuard] },
            // { path: 'asset-transfer', component: TsAssetTransferComponent, canActivate: [authGuard] },
            // { path: 'asset-management-person', component: TsAssetManagementPersonalComponent, canActivate: [authGuard] },
            // { path: 'asset-type-person', component: TsAssetManagementPersonalTypeComponent, canActivate: [authGuard] },
            // { path: 'asset-allocation-person', component: TsAssetAllocationPersonalComponent, canActivate: [authGuard] },
            // { path: 'asset-recovery-person', component: TsAssetRecoveryPersonalNewComponent, canActivate: [authGuard] },
            // { path: 'vehicle-management', component: VehicleManagementComponent, canActivate: [authGuard] },
            // { path: 'vehicle-booking', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            // { path: 'vehicle-repair-type', component: VehicleRepairTypeComponent, canActivate: [authGuard] },
            // { path: 'vehicle-repair-propose', component: ProposeVehicleRepairComponent, canActivate: [authGuard] },
            // { path: 'vehicle-repair-history', component: VehicleRepairHistoryComponent, canActivate: [authGuard] },
            // { path: 'office-supply', component: OfficeSupplyComponent, canActivate: [authGuard] },
            // { path: 'office-supply-unit', component: OfficeSupplyUnitComponent, canActivate: [authGuard] },
            // { path: 'office-supply-request', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },
            // { path: 'office-supply-summary', component: OfficeSupplyRequestSummaryComponent, canActivate: [authGuard] },
            // { path: 'film-management', component: FilmManagementComponent, canActivate: [authGuard] },
            // { path: 'deparment', component: DepartmentComponent, canActivate: [authGuard] },
            // { path: 'team', component: TeamComponent, canActivate: [authGuard] },
            // { path: 'positions', component: PositionsComponent, canActivate: [authGuard] },
            // { path: 'employee', component: EmployeeComponent, canActivate: [authGuard] },
            // { path: 'contract', component: ContractComponent, canActivate: [authGuard] },
            // { path: 'handover', component: HandoverComponent, canActivate: [authGuard] },
            // { path: 'holiday', component: HolidayComponent, canActivate: [authGuard] },
            // { path: 'food-order-hr', component: FoodOrderComponent, canActivate: [authGuard] },
            // { path: 'dayoff-hr', component: DayOffComponent, canActivate: [authGuard] },
            // { path: 'early-late-hr', component: EarlyLateComponent, canActivate: [authGuard] },
            // { path: 'overtime-hr', component: OverTimeComponent, canActivate: [authGuard] },
            // { path: 'bussiness-hr', component: EmployeeBussinessComponent, canActivate: [authGuard] },
            // { path: 'nightshift-hr', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            // { path: 'wfh-hr', component: WFHComponent, canActivate: [authGuard] },
            // { path: 'nofinger-hr', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            // { path: 'attendance-hr', component: EmployeeAttendanceComponent, canActivate: [authGuard] },
            // { path: 'curricular-hr', component: EmployeeCurricularComponent, canActivate: [authGuard] },
            // { path: 'payroll-hr', component: PayrollComponent, canActivate: [authGuard] },
            // { path: 'timekeeping-hr', component: EmployeeTimekeepingComponent, canActivate: [authGuard] },
            // { path: 'synthetic-hr', component: EmployeeSyntheticComponent, canActivate: [authGuard] },
            // { path: 'dailyreport-hr', component: DailyReportHrComponent, canActivate: [authGuard] },
            // { path: 'protect-gear-hr', component: ProtectgearComponent, canActivate: [authGuard] },
            // { path: 'phase-allocation-hr', component: PhaseAllocationPersonComponent, canActivate: [authGuard] },

            //Kho sale hn
            { path: 'inventory-hn', outlet: 'inventory-hn', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import-hn', outlet: 'bill-import-hn', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export-hn', outlet: 'bill-export-hn', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export-hn', outlet: 'history-import-export-hn', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-hn', outlet: 'history-borrow-hn', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-hn', outlet: 'report-import-export-hn', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'product-project-hn', outlet: 'product-project-hn', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-hn', outlet: 'search-serialnumber-hn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //kho demo hn
            { path: 'inventory-demo-hn', outlet: 'inventory-demo-hn', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-hn', outlet: 'bill-import-tech-hn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-hn', outlet: 'bill-export-tech-hn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-hn', outlet: 'product-report-hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-hn', outlet: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-hn', outlet: 'borrow-report-hn', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-hn', outlet: 'borrow-product-history-hn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-hn', outlet: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-hn', outlet: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'unit-count-hn', outlet: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },

            //kho agv
            { path: 'inventory-agv-hn', outlet: 'inventory-agv-hn', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-agv-hn', outlet: 'bill-import-agv-hn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-agv-hn', outlet: 'bill-export-agv-hn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-agv-hn', outlet: 'product-report-agv-hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-agv-hn', outlet: 'borrow-report-agv-hn', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-agv-hn', outlet: 'borrow-product-history-agv-hn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-agv-hn', outlet: 'product-location-agv-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },


            //Sale HCM
            { path: 'inventory-hcm', outlet: 'inventory-hcm', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import-hcm', outlet: 'bill-import-hcm', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export-hcm', outlet: 'bill-export-hcm', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export-hcm', outlet: 'history-import-export-hcm', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-hcm', outlet: 'history-borrow-hcm', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-hcm', outlet: 'report-import-export-hcm', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'product-project-hcm', outlet: 'product-project-hcm', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-hcm', outlet: 'search-serialnumber-hcm', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },


            //Sale demo
            { path: 'inventory-demo-hcm', outlet: 'inventory-demo-hcm', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-hcm', outlet: 'bill-import-tech-hcm', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-hcm', outlet: 'bill-export-tech-hcm', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-hcm', outlet: 'product-report-hcm', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-hcm', outlet: 'product-export-borrow-hcm', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-hcm', outlet: 'borrow-report-hcm', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-hcm', outlet: 'borrow-product-history-hcm', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-hcm', outlet: 'search-serialnumber-tech-hcm', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-hcm', outlet: 'product-qrcode-hcm', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //Sale BẮc ning
            { path: 'inventory-bn', outlet: 'inventory-bn', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import-bn', outlet: 'bill-import-bn', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export-bn', outlet: 'bill-export-bn', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export-bn', outlet: 'history-import-export-bn', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-bn', outlet: 'history-borrow-bn', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-bn', outlet: 'report-import-export-bn', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'product-project-bn', outlet: 'product-project-bn', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-bn', outlet: 'search-serialnumber-bn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //Demo Băc nign
            { path: 'inventory-demo-bn', outlet: 'inventory-demo-bn', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-bn', outlet: 'bill-import-tech-bn', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-bn', outlet: 'bill-export-tech-bn', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-bn', outlet: 'product-report-bn', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-bn', outlet: 'product-export-borrow-bn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-bn', outlet: 'borrow-report-bn', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-bn', outlet: 'borrow-product-history-bn', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-bn', outlet: 'search-serialnumber-tech-bn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-bn', outlet: 'product-qrcode-bn', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //Sale Đan phương
            { path: 'inventory-dp', outlet: 'inventory-dp', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import-dp', outlet: 'bill-import-dp', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export-dp', outlet: 'bill-export-dp', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export-dp', outlet: 'history-import-export-dp', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-dp', outlet: 'history-borrow-dp', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-dp', outlet: 'report-import-export-dp', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'product-project-dp', outlet: 'product-project-dp', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-dp', outlet: 'search-serialnumber-dp', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //Demo BĐan phương
            { path: 'inventory-demo-dp', outlet: 'inventory-demo-dp', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-dp', outlet: 'bill-import-tech-dp', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-dp', outlet: 'bill-export-tech-dp', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-dp', outlet: 'product-report-dp', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-dp', outlet: 'product-export-borrow-dp', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-dp', outlet: 'borrow-report-dp', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-dp', outlet: 'borrow-product-history-dp', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-dp', outlet: 'search-serialnumber-tech-dp', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-dp', outlet: 'product-qrcode-dp', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },


            //Cài đặt
            { path: 'product-location', outlet: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            { path: 'firm', outlet: 'firm', component: FirmComponent, canActivate: [authGuard] },
            { path: 'unit-count', outlet: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            { path: 'product-sale', outlet: 'product-sale', component: ProductSaleComponent, canActivate: [authGuard] },
            { path: 'product-demo', outlet: 'product-demo', component: TbProductRtcComponent, canActivate: [authGuard] },
            { path: 'product-agv', outlet: 'product-agv', component: TbProductRtcComponent, canActivate: [authGuard] },


            //Nhân dự
            { path: 'hr-hiring-request', outlet: 'hr-hiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            { path: 'job-requirement-hr', outlet: 'job-requirement-hr', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'proposal-hr', outlet: 'proposal-hr', component: HrPurchaseProposalComponent, canActivate: [authGuard] },
            { path: 'document', outlet: 'document', component: DocumentComponent, canActivate: [authGuard] },
            { path: 'document-common', outlet: 'document-common', component: DocumentCommonComponent, canActivate: [authGuard] },
            { path: 'asset-management', outlet: 'asset-management', component: TsAssetManagementComponent, canActivate: [authGuard] },
            { path: 'asset-type', outlet: 'asset-type', component: TsAssetTypeComponent, canActivate: [authGuard] },
            { path: 'asset-source', outlet: 'asset-source', component: TsAssetSourceComponent, canActivate: [authGuard] },
            { path: 'asset-allocation', outlet: 'asset-allocation', component: TsAssetAllocationComponent, canActivate: [authGuard] },
            { path: 'asset-recovery', outlet: 'asset-recovery', component: TsAssetRecoveryComponent, canActivate: [authGuard] },
            { path: 'asset-transfer', outlet: 'asset-transfer', component: TsAssetTransferComponent, canActivate: [authGuard] },
            { path: 'asset-management-person', outlet: 'asset-management-person', component: TsAssetManagementPersonalComponent, canActivate: [authGuard] },
            { path: 'asset-type-person', outlet: 'asset-type-person', component: TsAssetManagementPersonalTypeComponent, canActivate: [authGuard] },
            { path: 'asset-allocation-person', outlet: 'asset-allocation-person', component: TsAssetAllocationPersonalComponent, canActivate: [authGuard] },
            { path: 'asset-recovery-person', outlet: 'asset-recovery-person', component: TsAssetRecoveryPersonalNewComponent, canActivate: [authGuard] },
            { path: 'vehicle-management', outlet: 'vehicle-management', component: VehicleManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-booking', outlet: 'vehicle-booking', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-type', outlet: 'vehicle-repair-type', component: VehicleRepairTypeComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-propose', outlet: 'vehicle-repair-propose', component: ProposeVehicleRepairComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-history', outlet: 'vehicle-repair-history', component: VehicleRepairHistoryComponent, canActivate: [authGuard] },
            { path: 'office-supply', outlet: 'office-supply', component: OfficeSupplyComponent, canActivate: [authGuard] },
            { path: 'office-supply-unit', outlet: 'office-supply-unit', component: OfficeSupplyUnitComponent, canActivate: [authGuard] },
            { path: 'office-supply-request', outlet: 'office-supply-request', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },
            { path: 'office-supply-summary', outlet: 'office-supply-summary', component: OfficeSupplyRequestSummaryComponent, canActivate: [authGuard] },
            { path: 'film-management', outlet: 'film-management', component: FilmManagementComponent, canActivate: [authGuard] },
            { path: 'deparment', outlet: 'deparment', component: DepartmentComponent, canActivate: [authGuard] },
            { path: 'team', outlet: 'team', component: TeamComponent, canActivate: [authGuard] },
            { path: 'positions', outlet: 'positions', component: PositionsComponent, canActivate: [authGuard] },
            { path: 'employee', outlet: 'employee', component: EmployeeComponent, canActivate: [authGuard] },
            { path: 'contract', outlet: 'contract', component: ContractComponent, canActivate: [authGuard] },
            { path: 'handover', outlet: 'handover', component: HandoverComponent, canActivate: [authGuard] },
            { path: 'holiday', outlet: 'holiday', component: HolidayComponent, canActivate: [authGuard] },
            { path: 'food-order-hr', outlet: 'food-order-hr', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'dayoff-hr', outlet: 'dayoff-hr', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'early-late-hr', outlet: 'early-late-hr', component: EarlyLateComponent, canActivate: [authGuard] },
            { path: 'overtime-hr', outlet: 'overtime-hr', component: OverTimeComponent, canActivate: [authGuard] },
            { path: 'bussiness-hr', outlet: 'bussiness-hr', component: EmployeeBussinessComponent, canActivate: [authGuard] },
            { path: 'nightshift-hr', outlet: 'nightshift-hr', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            { path: 'wfh-hr', outlet: 'wfh-hr', component: WFHComponent, canActivate: [authGuard] },
            { path: 'nofinger-hr', outlet: 'nofinger-hr', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            { path: 'attendance-hr', outlet: 'attendance-hr', component: EmployeeAttendanceComponent, canActivate: [authGuard] },
            { path: 'curricular-hr', outlet: 'curricular-hr', component: EmployeeCurricularComponent, canActivate: [authGuard] },
            { path: 'payroll-hr', outlet: 'payroll-hr', component: PayrollComponent, canActivate: [authGuard] },
            { path: 'timekeeping-hr', outlet: 'timekeeping-hr', component: EmployeeTimekeepingComponent, canActivate: [authGuard] },
            { path: 'synthetic-hr', outlet: 'synthetic-hr', component: EmployeeSyntheticComponent, canActivate: [authGuard] },
            { path: 'dailyreport-hr', outlet: 'dailyreport-hr', component: DailyReportHrComponent, canActivate: [authGuard] },
            { path: 'protect-gear-hr', outlet: 'protect-gear-hr', component: ProtectgearComponent, canActivate: [authGuard] },
            { path: 'phase-allocation-hr', outlet: 'phase-allocation-hr', component: PhaseAllocationPersonComponent, canActivate: [authGuard] },



        ],
    },
];
