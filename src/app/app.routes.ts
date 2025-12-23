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
            { path: 'welcome', component: WelcomeComponent, canActivate: [authGuard] },

            //#region hệ thống
            { path: 'menuApp', component: MenuAppComponent, canActivate: [authGuard] },
            //#endregion

            //#region crm
            { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            //#endregion

            //#region kế toán
            { path: 'paymentorder', component: PaymentOrderComponent, canActivate: [authGuard] },

            //#endregion

            { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            { path: 'inventory', component: InventoryComponent, canActivate: [authGuard] },
            { path: 'bill-import', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export', component: HistoryImportExportComponent, canActivate: [authGuard] },
            { path: 'history-borrow-sale', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'list-product-project', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-product-serial-number', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },
            { path: 'inventory-demo', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-technical', component: BillImportTechnicalComponent, canActivate: [authGuard] },
            { path: 'bill-export-technical', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-new', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-and-borrow', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'product-location-technical', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-rtc-qr-code', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },
            { path: 'unit-count-kt', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            { path: 'firm', component: FirmComponent, canActivate: [authGuard] },
            { path: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            { path: 'product-sale', component: ProductSaleComponent, canActivate: [authGuard] },
            { path: 'tb-product-rtc', component: TbProductRtcComponent, canActivate: [authGuard] },
            { path: 'hrhiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            { path: 'job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'hr-purchase-proposal', component: HrPurchaseProposalComponent, canActivate: [authGuard] },
            { path: 'document', component: DocumentComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management', component: TsAssetManagementComponent, canActivate: [authGuard] },
            { path: 'ts-asset-type', component: TsAssetTypeComponent, canActivate: [authGuard] },
            { path: 'ts-asset-source', component: TsAssetSourceComponent, canActivate: [authGuard] },
            { path: 'ts-asset-allocation', component: TsAssetAllocationComponent, canActivate: [authGuard] },
            { path: 'ts-asset-recovery', component: TsAssetRecoveryComponent, canActivate: [authGuard] },
            { path: 'ts-asset-transfer', component: TsAssetTransferComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management-personal', component: TsAssetManagementPersonalComponent, canActivate: [authGuard] },
            { path: 'ts-asset-management-personal-type', component: TsAssetManagementPersonalTypeComponent, canActivate: [authGuard] },
            { path: 'ts-asset-allocation-personal', component: TsAssetAllocationPersonalComponent, canActivate: [authGuard] },
            { path: 'ts-asset-recovery-personal-new', component: TsAssetRecoveryPersonalNewComponent, canActivate: [authGuard] },
            { path: 'department', component: DepartmentComponent, canActivate: [authGuard] },
            { path: 'vehicle-management', component: VehicleManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-booking-management', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-type-form', component: VehicleRepairTypeFormComponent, canActivate: [authGuard] },
            { path: 'propose-vehicle-repair', component: ProposeVehicleRepairComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-history', component: VehicleRepairHistoryComponent, canActivate: [authGuard] },
            { path: 'office-supply', component: OfficeSupplyComponent, canActivate: [authGuard] },
            { path: 'office-supply-request-summary', component: OfficeSupplyRequestSummaryComponent, canActivate: [authGuard] },
            { path: 'film-management', component: FilmManagementComponent, canActivate: [authGuard] },
            { path: 'team', component: TeamComponent, canActivate: [authGuard] },
            { path: 'positions', component: PositionsComponent, canActivate: [authGuard] },
            { path: 'employee', component: EmployeeComponent, canActivate: [authGuard] },
            { path: 'contract', component: ContractComponent, canActivate: [authGuard] },
            { path: 'handover', component: HandoverComponent, canActivate: [authGuard] },
            { path: 'holiday', component: HolidayComponent, canActivate: [authGuard] },
            { path: 'food-order', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'day-off', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'early-late', component: EarlyLateComponent, canActivate: [authGuard] },
            { path: 'over-time', component: OverTimeComponent, canActivate: [authGuard] },
            { path: 'employee-bussiness', component: EmployeeBussinessComponent, canActivate: [authGuard] },
            { path: 'employee-night-shift', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            { path: 'wfh', component: WFHComponent, canActivate: [authGuard] },
            { path: 'employee-no-fingerprint', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            { path: 'employee-attendance', component: EmployeeAttendanceComponent, canActivate: [authGuard] },
            { path: 'employee-error', component: EmployeeErrorComponent, canActivate: [authGuard] },
            { path: 'employee-curricular', component: EmployeeCurricularComponent, canActivate: [authGuard] },
            { path: 'payroll', component: PayrollComponent, canActivate: [authGuard] },
            { path: 'employee-timekeeping', component: EmployeeTimekeepingComponent, canActivate: [authGuard] },
            { path: 'employee-synthetic', component: EmployeeSyntheticComponent, canActivate: [authGuard] },
            { path: 'daily-report-hr', component: DailyReportHrComponent, canActivate: [authGuard] },
            { path: 'protectgear', component: ProtectgearComponent, canActivate: [authGuard] },
            { path: 'phase-allocation-person', component: PhaseAllocationPersonComponent, canActivate: [authGuard] },
            { path: 'training-registration', component: TrainingRegistrationComponent, canActivate: [authGuard] },
            { path: 'factory-visit-registration', component: FactoryVisitRegistrationComponent, canActivate: [authGuard] },
            { path: 'app', component: AppComponent, canActivate: [authGuard] },
            { path: 'warehouse', component: WarehouseComponent1, canActivate: [authGuard] },
            { path: 'inventory-by-product', component: InventoryByProductComponent, canActivate: [authGuard] },
            { path: 'employee-purchase', component: EmployeePurchaseComponent, canActivate: [authGuard] },
            { path: 'rule-pay', component: RulePayComponent, canActivate: [authGuard] },
            { path: 'currency-list', component: CurrencyListComponent, canActivate: [authGuard] },
            { path: 'supplier-sale', component: SupplierSaleComponent, canActivate: [authGuard] },
            { path: 'project-partlist-price-request-new', component: ProjectPartlistPriceRequestNewComponent, canActivate: [authGuard] },
            { path: 'assign-work', component: AssignWorkComponent, canActivate: [authGuard] },
            { path: 'poncc-new', component: PonccNewComponent, canActivate: [authGuard] },
            { path: 'inventory-project', component: InventoryProjectComponent, canActivate: [authGuard] },
            { path: 'project-part-list-purchase-request-slick-grid', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },
            { path: 'project-work-propress', component: ProjectWorkPropressComponent, canActivate: [authGuard] },
            { path: 'project-work-timeline', component: ProjectWorkTimelineComponent, canActivate: [authGuard] },
            { path: 'project-survey', component: ProjectSurveyComponent, canActivate: [authGuard] },
            { path: 'meeting-minute', component: MeetingMinuteComponent, canActivate: [authGuard] },
            { path: 'project-item-late', component: ProjectItemLateComponent, canActivate: [authGuard] },
            { path: 'project-work-item-timeline', component: ProjectWorkItemTimelineComponent, canActivate: [authGuard] },
            { path: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard] },
            { path: 'project-agv-summary', component: ProjectAgvSummaryComponent, canActivate: [authGuard] },
            { path: 'project-department-summary', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard] },
            { path: 'price-history-partlist', component: PriceHistoryPartlistComponent, canActivate: [authGuard] },
            { path: 'project-type', component: ProjectTypeComponent, canActivate: [authGuard] },
            { path: 'project-leader-project-type', component: ProjectLeaderProjectTypeComponent, canActivate: [authGuard] },
            { path: 'project-field', component: ProjectFieldComponent, canActivate: [authGuard] },
            { path: 'leader-project', component: LeaderProjectComponent, canActivate: [authGuard] },
            { path: 'meeting-minute-type', component: MeetingMinuteTypeComponent, canActivate: [authGuard] },
            { path: 'pokh', component: PokhComponent, canActivate: [authGuard] },
            { path: 'quotation-kh', component: QuotationKhComponent, canActivate: [authGuard] },
            { path: 'pokh-kpi', component: PokhKpiComponent, canActivate: [authGuard] },
            { path: 'pokh-history', component: PokhHistoryComponent, canActivate: [authGuard] },
            { path: 'plan-week', component: PlanWeekComponent, canActivate: [authGuard] },
            { path: 'follow-project-base', component: FollowProjectBaseComponent, canActivate: [authGuard] },
            { path: 'bonus-coefficient', component: BonusCoefficientComponent, canActivate: [authGuard] },
            { path: 'employee-sale-manager', component: EmployeeSaleManagerComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale', component: DailyReportSaleComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale-admin', component: DailyReportSaleAdminComponent, canActivate: [authGuard] },
            { path: 'request-invoice', component: RequestInvoiceComponent, canActivate: [authGuard] },
            { path: 'history-export-accountant', component: HistoryExportAccountantComponent, canActivate: [authGuard] },
            { path: 'history-approved-bill-log', component: HistoryApprovedBillLogComponent, canActivate: [authGuard] },
            { path: 'inventory-by-date', component: InventoryByDateComponent, canActivate: [authGuard] },
            { path: 'accounting-contract-type-master', component: AccountingContractTypeMasterComponent, canActivate: [authGuard] },
            { path: 'accounting-contract', component: AccountingContractComponent, canActivate: [authGuard] },
            { path: 'payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'person-day-off', component: PersonDayOffComponent, canActivate: [authGuard] },
            { path: 'early-late-summary', component: EarlyLateSummaryComponent, canActivate: [authGuard] },
            { path: 'wfh-summary', component: WFHSummaryComponent, canActivate: [authGuard] },
            { path: 'employee-no-finger-summary', component: EmployeeNoFingerSummaryComponent, canActivate: [authGuard] },
            { path: 'employee-bussiness-person-summary', component: EmployeeBussinessPersonSummaryComponent, canActivate: [authGuard] },
            { path: 'employee-night-shift-person-summary', component: EmployeeNightShiftPersonSummaryComponent, canActivate: [authGuard] },
            { path: 'over-time-person', component: OverTimePersonComponent, canActivate: [authGuard] },
            { path: 'employee-register-bussiness', component: EmployeeRegisterBussinessComponent, canActivate: [authGuard] },
            { path: 'summary-employee', component: SummaryEmployeeComponent, canActivate: [authGuard] },
            { path: 'employee-synthetic-personal', component: EmployeeSyntheticPersonalComponent, canActivate: [authGuard] },
            { path: 'booking-room', component: BookingRoomComponent, canActivate: [authGuard] },
            { path: 'tracking-marks', component: TrackingMarksComponent, canActivate: [authGuard] },
            { path: 'person', component: PersonComponent, canActivate: [authGuard] },
            { path: 'register-idea', component: RegisterIdeaComponent, canActivate: [authGuard] },
            { path: 'register-contract', component: RegisterContractComponent, canActivate: [authGuard] },
            { path: 'daily-report-tech', component: DailyReportTechComponent, canActivate: [authGuard] },
            { path: 'daily-report-thr', component: DailyReportThrComponent, canActivate: [authGuard] },
            { path: 'daily-report-lxcp', component: DailyReportLXCPComponent, canActivate: [authGuard] },
            { path: 'workplan', component: WorkplanComponent, canActivate: [authGuard] },
            { path: 'approve-tp', component: ApproveTpComponent, canActivate: [authGuard] },
            { path: 'office-supply-requests', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },
            { path: 'project-partlist', component: ProjectPartListComponent, canActivate: [authGuard] },

        ],
    },
];
