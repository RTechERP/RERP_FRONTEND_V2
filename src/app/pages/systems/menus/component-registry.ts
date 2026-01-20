import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { routes } from '../../../app.routes'
import { PaymentOrderComponent } from '../../general-category/payment-order/payment-order.component';
import { CustomerComponent } from '../../old/customer/customer.component';
import { WelcomeComponent } from '../../old/welcome/welcome.component';
import { MenuAppComponent } from '../menu-app/menu-app.component';
import { AppComponent } from '../../../app.component';
import { AccountingComponent } from '../../accounting/accounting.component';
import { ApproveComponent } from '../../approve/approve.component';
import { CourseManagementComponent } from '../../Course/course-management/course-management.component';
import { CrmComponent } from '../../crm/crm.component';
import { DailyReportLXCPComponent } from '../../daily-report-lxcp/daily-report-lxcp.component';
import { DailyReportMachineComponent } from '../../daily-report-machine/daily-report-machine.component';
import { DailyReportMarComponent } from '../../daily-report-mar/daily-report-mar.component';
import { DailyReportThrComponent } from '../../daily-report-thr/daily-report-thr.component';
import { DailyReportTechComponent } from '../../DailyReportTech/daily-report-tech/daily-report-tech.component';
import { CurrencyListComponent } from '../../general-category/currency-list/currency-list.component';
import { FirmComponent } from '../../general-category/firm/firm.component';
import { GeneralCategoryComponent } from '../../general-category/general-category.component';
import { ProductLocationComponent } from '../../general-category/product-location/product-location.component';
import { FactoryVisitRegistrationComponent } from '../../general-category/visit-factory-registation/factory-visit-registration.component';
import { WarehouseComponent1 } from '../../general-category/wearhouse/warehouse/warehouse.component';
import { AssetPersonalComponent } from '../../hrm/asset/asset/asset-personal/asset-personal.component';
import { TsAssetAllocationComponent } from '../../hrm/asset/asset/ts-asset-allocation/ts-asset-allocation.component';
import { TsAssetManagementComponent } from '../../hrm/asset/asset/ts-asset-management/ts-asset-management.component';
import { TsAssetRecoveryComponent } from '../../hrm/asset/asset/ts-asset-recovery/ts-asset-recovery.component';
import { TsAssetSourceComponent } from '../../hrm/asset/asset/ts-asset-source/ts-asset-source.component';
import { TsAssetTransferComponent } from '../../hrm/asset/asset/ts-asset-transfer/ts-asset-transfer.component';
import { TsAssetTypeComponent } from '../../hrm/asset/asset/ts-asset-type/ts-asset-type.component';
import { TsAssetRecoveryPersonalNewComponent } from '../../hrm/asset/assetpersonal/ts-asset-recovery-personal-new/ts-asset-recovery-personal-new.component';
import { BookingRoomComponent } from '../../hrm/booking room/booking-room.component';
import { ContractComponent } from '../../hrm/contract/contract.component';
import { DailyReportHrComponent } from '../../hrm/daily-report-hr/daily-report-hr.component';
import { DayOffComponent } from '../../hrm/day-off/day-off.component';
import { PersonDayOffComponent } from '../../hrm/day-off/person-day-off/person-day-off.component';
import { DepartmentComponent } from '../../hrm/department/department.component';
import { DocumentCommonComponent } from '../../hrm/document/document-common/document-common.component';
import { DocumentSaleAdminComponent } from '../../hrm/document/document-sale-admin/document-sale-admin.component';
import { DocumentComponent } from '../../hrm/document/document.component';
import { EarlyLateSummaryComponent } from '../../hrm/early-late/early-late-summary/early-late-summary.component';
import { EarlyLateComponent } from '../../hrm/early-late/early-late.component';
import { EconimicContractTermComponent } from '../../hrm/economic-contract/econimic-contract-term/econimic-contract-term.component';
import { EconomicContractTypeComponent } from '../../hrm/economic-contract/economic-contract-type/economic-contract-type.component';
import { EconomicContractComponent } from '../../hrm/economic-contract/economic-contract.component';
import { EmployeeAttendanceComponent } from '../../hrm/employee-management/employee-attendance/employee-attendance.component';
import { EmployeeBussinessPersonSummaryComponent } from '../../hrm/employee-management/employee-bussiness/employee-bussiness-person-summary/employee-bussiness-person-summary.component';
import { EmployeeBussinessComponent } from '../../hrm/employee-management/employee-bussiness/employee-bussiness.component';
import { EmployeeRegisterBussinessComponent } from '../../hrm/employee-management/employee-bussiness/employee-register-bussiness/employee-register-bussiness.component';
import { EmployeeCurricularComponent } from '../../hrm/employee-management/employee-curriculart/employee-curricular/employee-curricular.component';
import { EmployeeErrorComponent } from '../../hrm/employee-management/employee-error/employee-error.component';
import { EmployeeNightShiftPersonSummaryComponent } from '../../hrm/employee-management/employee-night-shift/employee-night-shift-person-summary/employee-night-shift-person-summary.component';
import { EmployeeNightShiftComponent } from '../../hrm/employee-management/employee-night-shift/employee-night-shift/employee-night-shift.component';
import { EmployeeNoFingerSummaryComponent } from '../../hrm/employee-management/employee-no-fingerprint/employee-no-finger-summary/employee-no-finger-summary.component';
import { EmployeeNoFingerprintComponent } from '../../hrm/employee-management/employee-no-fingerprint/employee-no-fingerprint.component';
import { EmployeeSyntheticPersonalComponent } from '../../hrm/employee-management/employee-synthetic/employee-synthetic-personal/employee-synthetic-personal.component';
import { EmployeeSyntheticComponent } from '../../hrm/employee-management/employee-synthetic/employee-synthetic/employee-synthetic.component';
import { EmployeeTimekeepingComponent } from '../../hrm/employee-management/employee-timekeeping/employee-timekeeping.component';
import { WFHSummaryComponent } from '../../hrm/employee-management/employee-wfh/WFH-summary/wfh-summary.component';
import { WFHComponent } from '../../hrm/employee-management/employee-wfh/WFH.component';
import { EmployeeContactComponent } from '../../hrm/employee/employee-contact/employee-contact.component';
import { EmployeeComponent } from '../../hrm/employee/employee.component';
import { SummaryEmployeeComponent } from '../../hrm/employee/summary-employee/summary-employee.component';
import { FilmManagementComponent } from '../../hrm/film-management/film-management.component';
import { FoodOrderComponent } from '../../hrm/food-order/food-order.component';
import { HandoverComponent } from '../../hrm/handover/handover.component';
import { HolidayComponent } from '../../hrm/holiday/holiday.component';
import { HrPurchaseProposalComponent } from '../../hrm/hr-purchase-proposal/hr-purchase-proposal.component';
import { HrhiringRequestComponent } from '../../hrm/hrhiring-request/hrhiring-request.component';
import { HrmComponent } from '../../hrm/hrm.component';
import { ApproveJobRequirementComponent } from '../../hrm/job-requirement/approve-job-requirement/approve-job-requirement.component';
import { JobRequirementComponent } from '../../hrm/job-requirement/job-requirement.component';
import { OfficeSupplyComponent } from '../../hrm/office-supply/OfficeSupply/office-supply.component';
import { OfficeSupplyRequestsComponent } from '../../hrm/office-supply/OfficeSupplyRequests/office-supply-requests.component';
import { OfficeSupplyRequestSummaryComponent } from '../../hrm/office-supply/OfficeSupplyRequestSummary/office-supply-request-summary.component';
import { OfficeSupplyUnitComponent } from '../../hrm/office-supply/OfficeSupplyUnit/office-supply-unit.component';
import { OrgChartRtcManagementComponent } from '../../hrm/org-chart-rtc/org-chart-rtc-management/org-chart-rtc-management.component';
import { OrgChartRtcComponent } from '../../hrm/org-chart-rtc/org-chart-rtc.component';
import { OverTimePersonComponent } from '../../hrm/over-time/over-time-person/over-time-person.component';
import { OverTimeSummaryPersonComponent } from '../../hrm/over-time/over-time-summary-person/over-time-summary-person.component';
import { OverTimeComponent } from '../../hrm/over-time/over-time.component';
import { PayrollComponent } from '../../hrm/payroll/payroll/payroll.component';
import { PhaseAllocationPersonComponent } from '../../hrm/phase-allocation-person/phase-allocation-person.component';
import { PositionsComponent } from '../../hrm/positions/positions.component';
import { ProtectgearComponent } from '../../hrm/protectgear/protectgear/protectgear.component';
import { RegisterIdeaComponent } from '../../hrm/register-idea/register-idea.component';
import { TeamComponent } from '../../hrm/team/team.component';
import { TrackingMarksComponent } from '../../hrm/tracking-marks/tracking-marks.component';
import { ProposeVehicleRepairComponent } from '../../hrm/vehicle/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair.component';
import { VehicleRepairHistoryComponent } from '../../hrm/vehicle/propose-vehicle-repair/vehicle-repair-history/vehicle-repair-history/vehicle-repair-history.component';
import { VehicleBookingManagementSlickgridComponent } from '../../hrm/vehicle/vehicle-booking-management/vehicle-booking-management-slickgrid/vehicle-booking-management-slickgrid.component';
import { VehicleBookingManagementComponent } from '../../hrm/vehicle/vehicle-booking-management/vehicle-booking-management.component';
import { VehicleManagementComponent } from '../../hrm/vehicle/vehicle-management/vehicle-management.component';
import { VehicleRepairTypeFormComponent } from '../../hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type-form/vehicle-repair-type-form.component';
import { VehicleRepairTypeComponent } from '../../hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { KPIEvaluationEmployeeComponent } from '../../KPITech/kpievaluation-employee/kpievaluation-employee.component';
import { KPIEvaluationFactorScoringComponent } from '../../KPITech/kpievaluation-factor-scoring/kpievaluation-factor-scoring.component';
import { MeetingMinuteSlickGridComponent } from '../../meeting-minute-slick-grid/meeting-minute-slick-grid.component';
import { BillExportTechnicalNewComponent } from '../../old/bill-export-technical/bill-export-technical-new/bill-export-technical-new.component';
import { BillExportTechnicalComponent } from '../../old/bill-export-technical/bill-export-technical.component';
import { BillImportTechnicalNewComponent } from '../../old/bill-import-technical/bill-import-technical-new/bill-import-technical-new.component';
import { BonusCoefficientComponent } from '../../old/bonus-coefficient/bonus-coefficient.component';
import { HistoryProductRtcComponent } from '../../old/inventory-demo/borrow/borrow-product-history/history-product-rtc/history-product-rtc.component';
import { InventoryDemoNewComponent } from '../../old/inventory-demo/inventory-demo-new/inventory-demo-new.component';
import { InventoryDemoComponent } from '../../old/inventory-demo/inventory-demo.component';
import { MaterialDetailOfProductRtcComponent } from '../../old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { UnitCountKtComponent } from '../../old/inventory-demo/unit-count-kt/unit-count-kt.component';
import { AccountingContractTypeMasterComponent } from '../../old/KETOAN/accounting-contract-type-master/accounting-contract-type-master.component';
import { AccountingContractComponent } from '../../old/KETOAN/accounting-contract/accounting-contract.component';
import { BillDocumentImportTypeComponent } from '../../old/KETOAN/bill-document-import-type/bill-document-import-type.component';
import { DocumentImportExportComponent } from '../../old/KETOAN/document-import-export/document-import-export.component';
import { HistoryApprovedBillLogComponent } from '../../old/KETOAN/history-approved-bill-log/history-approved-bill-log.component';
import { HistoryExportAccountantComponent } from '../../old/KETOAN/history-export-accountant/history-export-accountant.component';
import { InventoryByDateComponent } from '../../old/KETOAN/inventory-by-date/inventory-by-date.component';
import { TaxCompanyComponent } from '../../old/KETOAN/tax-company/tax-company.component';
import { DailyReportSaleAdminComponent } from '../../old/KPISale/daily-report-sale-admin/daily-report-sale-admin.component';
import { DailyReportSaleSlickgridComponent } from '../../old/KPISale/daily-report-sale-slickgrid/daily-report-sale-slickgrid.component';
import { EmployeeSaleManagerComponent } from '../../old/KPISale/employee-sale-manager/employee-sale-manager.component';
import { NewsletterFormViewAllComponent } from '../../old/newsletter/newsletter/newsletter-form-view-all/newsletter-form-view-all.component';
import { NewsletterTypeComponent } from '../../old/newsletter/newsletter/newsletter-type/newsletter-type.component';
import { NewsletterComponent } from '../../old/newsletter/newsletter/newsletter.component';
import { PokhHistoryComponent } from '../../old/pokh-history/pokh-history.component';
import { PokhKpiComponent } from '../../old/pokh-kpi/pokh-kpi.component';
import { PokhSlickgridComponent } from '../../old/pokh-slickgrid/pokh-slickgrid.component';
import { PokhComponent } from '../../old/pokh/pokh.component';
import { ProductReportNewComponent } from '../../old/product-report-new/product-report-new.component';
import { ProductRtcQrCodeComponent } from '../../old/product-rtc-qr-code/product-rtc-qr-code/product-rtc-qr-code.component';
import { QuotationKhComponent } from '../../old/quotation-kh/quotation-kh.component';
import { RequestInvoiceSlickgridComponent } from '../../old/request-invoice-slickgrid/request-invoice-slickgrid.component';
import { RequestInvoiceSummarySlickgridComponent } from '../../old/request-invoice-summary-slickgrid/request-invoice-summary-slickgrid.component';
import { RequestInvoiceSummaryComponent } from '../../old/request-invoice-summary/request-invoice-summary.component';
import { RequestInvoiceComponent } from '../../old/request-invoice/request-invoice.component';
import { BillImportQcComponent } from '../../old/Sale/bill-import-qc/bill-import-qc.component';
import { BillExportNewComponent } from '../../old/Sale/BillExport/bill-export-new/bill-export-new.component';
import { BillExportComponent } from '../../old/Sale/BillExport/bill-export.component';
import { BillImportNewComponent } from '../../old/Sale/BillImport/bill-import-new/bill-import-new.component';
import { BillImportComponent } from '../../old/Sale/BillImport/bill-import.component';
import { ChiTietSanPhamSaleComponent } from '../../old/Sale/chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';
import { HistoryBorrowSaleNewComponent } from '../../old/Sale/HistoryBorrowSale/history-borrow-sale-new/history-borrow-sale-new.component';
import { HistoryImportExportNewComponent } from '../../old/Sale/HistoryImportExport/history-import-export-new/history-import-export-new.component';
import { InventoryNewComponent } from '../../old/Sale/Inventory/inventory-new/inventory-new.component';
import { InventoryBorrowNCCComponent } from '../../old/Sale/Inventory/Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';
import { ListProductProjectComponent } from '../../old/Sale/ListProductProject/list-product-project.component';
import { ProductSaleNewComponent } from '../../old/Sale/ProductSale/product-sale-new/product-sale-new.component';
import { UnitCountComponent } from '../../old/Sale/ProductSale/unit-count/unit-count.component';
import { ReportImportExportNewComponent } from '../../old/Sale/ReportImportExport/report-import-export-new/report-import-export-new.component';
import { SearchProductSerialNumberComponent } from '../../old/Sale/SearchProductSerialNumber/search-product-serial-number.component';
import { ProductRtcComponent } from '../../old/tb-product-rtc/product-rtc/product-rtc.component';
import { TbProductRtcComponent } from '../../old/tb-product-rtc/tb-product-rtc.component';
import { BorrowReportComponent } from '../../old/Technical/borrow-report/borrow-report.component';
import { KpiErrorEmployeeSummaryMaxComponent } from '../../old/Technical/kpi-error-employee-summary-max/kpi-error-employee-summary-max.component';
import { KpiErrorEmployeeComponent } from '../../old/Technical/kpi-error-employee/kpi-error-employee.component';
import { KpiErrorComponent } from '../../old/Technical/kpi-error/kpi-error.component';
import { ProductExportAndBorrowComponent } from '../../old/Technical/product-export-and-borrow/product-export-and-borrow.component';
import { ProductLocationTechnicalComponent } from '../../old/Technical/product-location-technical/product-location-technical.component';
import { SearchProductTechSerialComponent } from '../../old/Technical/search-product-tech-serial/search-product-tech-serial.component';
import { SummaryKpiErrorEmployeeMonthComponent } from '../../old/Technical/summary-kpi-error-employee-month/summary-kpi-error-employee-month.component';
import { SummaryKpiErrorEmployeeNewComponent } from '../../old/Technical/summary-kpi-error-employee/summary-kpi-error-employee-new/summary-kpi-error-employee-new.component';
import { TsAssetAllocationPersonalComponent } from '../../old/ts-asset-allocation-personal/ts-asset-allocation-personal.component';
import { TsAssetManagementPersonalTypeComponent } from '../../old/ts-asset-management-personal/ts-asset-management-personal-type/ts-asset-management-personal-type.component';
import { TsAssetManagementPersonalComponent } from '../../old/ts-asset-management-personal/ts-asset-management-personal.component';
import { FollowProjectBaseComponent } from '../../old/VisionBase/kho-base/follow-project-base/follow-project-base.component';
import { PlanWeekComponent } from '../../old/VisionBase/plan-week/plan-week.component';
import { ApproveTpComponent } from '../../person/approve-tp/approve-tp/approve-tp.component';
import { PersonComponent } from '../../person/person.component';
import { RegisterContractComponent } from '../../person/register-contract/register-contract.component';
import { SummaryProjectJoinComponent } from '../../person/summary-project-join/summary-project-join.component';
import { WorkplanSummaryNewComponent } from '../../person/workplan/workplan-summary-new/workplan-summary-new.component';
import { WorkplanSummaryComponent } from '../../person/workplan/workplan-summary/workplan-summary.component';
import { WorkplanComponent } from '../../person/workplan/workplan.component';
import { PriceHistoryPartlistSlickGridComponent } from '../../price-history-partlist-slick-grid/price-history-partlist-slick-grid.component';
import { ProjectAgvSummarySlickGirdComponent } from '../../project-agv-summary-slick-gird/project-agv-summary-slick-gird.component';
import { ProjectDepartmentSummarySlickGridComponent } from '../../project-department-summary-slick-grid/project-department-summary-slick-grid.component';
import { ProjectPartListSlickGridComponent } from '../../project-part-list-slick-grid/project-part-list-slick-grid.component';
import { ProjectSlickGrid2Component } from '../../project-slick-grid2/project-slick-grid2.component';
import { ProjectSurveySlickGridComponent } from '../../project-survey-slick-grid/project-survey-slick-grid.component';
import { LeaderProjectComponent } from '../../project/leader-project/leader-project.component';
import { MeetingMinuteTypeComponent } from '../../project/meeting-minute/meeting-minute-type/meeting-minute-type.component';
import { MeetingMinuteComponent } from '../../project/meeting-minute/meeting-minute.component';
import { PriceHistoryPartlistComponent } from '../../project/price-history-partlist/price-history-partlist.component';
import { ProjectAgvSummaryComponent } from '../../project/project-agv-summary/project-agv-summary.component';
import { ProjectPartListComponent } from '../../project/project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { ProjectDepartmentSummaryComponent } from '../../project/project-department-summary/project-department-summary.component';
import { ProjectFieldComponent } from '../../project/project-field/project-field/project-field.component';
import { ProjectItemLateComponent } from '../../project/project-item-late/project-item-late.component';
import { ProjectItemPersonComponent } from '../../project/project-item-person/project-item-person.component';
import { ProjectLeaderProjectTypeComponent } from '../../project/project-leader-project-type/project-leader-project-type.component';
import { ProjectSurveyComponent } from '../../project/project-survey/project-survey.component';
import { ProjectTypeComponent } from '../../project/project-type/project-type.component';
import { ProjectWorkItemTimelineComponent } from '../../project/project-work-item-timeline/project-work-item-timeline.component';
import { ProjectWorkPropressComponent } from '../../project/project-work-propress/project-work-propress.component';
import { ProjectWorkTimelineComponent } from '../../project/project-work-timeline/project-work-timeline.component';
import { ProjectComponent } from '../../project/project.component';
import { SynthesisOfGeneratedMaterialsComponent } from '../../project/synthesis-of-generated-materials/synthesis-of-generated-materials.component';
import { WorkItemComponent } from '../../project/work-item/work-item.component';
import { AssignWorkComponent } from '../../purchase/assign-work/assign-work.component';
import { EmployeePurchaseComponent } from '../../purchase/employee-purchase/employee-purchase.component';
import { InventoryByProductComponent } from '../../purchase/inventory-by-product/inventory-by-product.component';
import { InventoryProjectProductSaleLinkComponent } from '../../purchase/inventory-project-product-sale-link/inventory-project-product-sale-link.component';
import { InventoryProjectNewComponent } from '../../purchase/inventory-project/inventory-project-new/inventory-project-new.component';
import { InventoryProjectComponent } from '../../purchase/inventory-project/inventory-project/inventory-project.component';
import { PonccNewComponent } from '../../purchase/poncc-new/poncc-new.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { ProjectPartlistPriceRequestOldComponent } from '../../purchase/project-partlist-price-request-old/project-partlist-price-request-old.component';
import { ProjectPartListPurchaseRequestSlickGridComponent } from '../../purchase/project-partlist-purchase-request/project-part-list-purchase-request-slick-grid/project-part-list-purchase-request-slick-grid.component';
import { PurchaseComponent } from '../../purchase/purchase.component';
import { RulePayComponent } from '../../purchase/rulepay/rule-pay.component';
import { SupplierSaleComponent } from '../../purchase/supplier-sale/supplier-sale.component';
import { SalesComponent } from '../../sales/sales.component';
import { SynthesisOfGeneratedMaterialsSlickGridComponent } from '../../synthesis-of-generated-materials-slick-grid/synthesis-of-generated-materials-slick-grid.component';
import { TrainingRegistrationComponent } from '../../training-registration/training-registration.component';
import { WarehouseComponent } from '../../warehouse/warehouse.component';
import { SystemsComponent } from '../systems.component';

// export const COMPONENT_REGISTRY: Record<string, Type<any>> =
//     buildComponentRegistry(routes);

// function buildComponentRegistry(routes: Routes): Record<string, Type<any>> {
//     const map: Record<string, Type<any>> = {};

//     if (!Array.isArray(routes)) {
//         // console.error('Routes is not iterable:', routes);
//         return map;
//     }

//     for (const route of routes) {
//         // ✅ chỉ map route thật sự có component & path
//         if (
//             route.path &&
//             route.component &&
//             route.path !== '' &&
//             route.path !== '**' &&
//             !route.redirectTo &&
//             !route.path.includes(':')
//         ) {
//             map[route.path] = route.component;
//         }

//         // ✅ đệ quy children (layout route)
//         if (route.children?.length) {
//             Object.assign(map, buildComponentRegistry(route.children));
//         }
//     }

//     console.log('map:', map);
//     return map;
// }

export function buildComponentRegistry(routes: Routes): Record<string, Type<any>> {
    const map: Record<string, Type<any>> = {
        // 'welcome': WelcomeComponent,
        // 'menu-app': MenuAppComponent,
        // 'customer': CustomerComponent,
        // 'paymentorder': PaymentOrderComponent,

        // 'approve': ApproveComponent,
        // 'person': PersonComponent,
        // 'category': GeneralCategoryComponent,
        // 'system': SystemsComponent,
        // 'crm': CrmComponent,
        // 'warehouses': WarehouseComponent,
        // 'sale': SalesComponent,
        // 'accounting': AccountingComponent,
        // 'purchase': PurchaseComponent,
        // 'projects': ProjectSlickGrid2Component,
        // 'hrm': HrmComponent,

        // 'inventory': InventoryNewComponent,
        // 'bill-import': BillImportComponent,
        // 'bill-export': BillExportComponent,
        // 'history-import-export': HistoryImportExportNewComponent,
        // 'history-borrow-sale': HistoryBorrowSaleNewComponent,
        // 'report-import-export': ReportImportExportNewComponent,
        // 'list-product-project': ListProductProjectComponent,
        // 'search-product-serial-number': SearchProductSerialNumberComponent,
        // 'inventory-demo': InventoryDemoComponent,
        // 'bill-import-technical': BillImportTechnicalNewComponent,
        // 'bill-export-technical': BillExportTechnicalComponent,
        // 'product-report-new': ProductReportNewComponent,
        // 'product-export-and-borrow': ProductExportAndBorrowComponent,
        // 'borrow-report': BorrowReportComponent,

        // 'product-location-technical': ProductLocationTechnicalComponent,
        // 'product-rtc-qr-code': ProductRtcQrCodeComponent,
        // 'unit-count-kt': UnitCountKtComponent,
        // 'product-location': ProductLocationComponent,
        // 'firm': FirmComponent,
        // 'unit-count': UnitCountComponent,

        // 'tb-product-rtc': TbProductRtcComponent,
        // 'hrhiring-request': HrhiringRequestComponent,
        // 'job-requirement': JobRequirementComponent,
        // 'approve-job-requirement': ApproveJobRequirementComponent,
        // 'job-requirement-bgd': ApproveJobRequirementComponent,
        // 'hr-purchase-proposal': HrPurchaseProposalComponent,
        // 'document': DocumentComponent,
        // 'ts-asset-management': TsAssetManagementComponent,
        // 'ts-asset-type': TsAssetTypeComponent,
        // 'ts-asset-source': TsAssetSourceComponent,
        // 'ts-asset-allocation': TsAssetAllocationComponent,
        // 'ts-asset-recovery': TsAssetRecoveryComponent,
        // 'ts-asset-transfer': TsAssetTransferComponent,
        // 'ts-asset-management-personal': TsAssetManagementPersonalComponent,
        // 'ts-asset-management-personal-type': TsAssetManagementPersonalTypeComponent,
        // 'ts-asset-allocation-personal': TsAssetAllocationPersonalComponent,
        // 'ts-asset-recovery-personal-new': TsAssetRecoveryPersonalNewComponent,
        // 'department': DepartmentComponent,
        // 'vehicle-management': VehicleManagementComponent,
        // 'vehicle-booking-management': VehicleBookingManagementComponent,
        // 'vehicle-repair-type-form': VehicleRepairTypeFormComponent,
        // 'propose-vehicle-repair': ProposeVehicleRepairComponent,
        // 'vehicle-repair-history': VehicleRepairHistoryComponent,
        // 'office-supply': OfficeSupplyComponent,
        // 'office-supply-request-summary': OfficeSupplyRequestSummaryComponent,
        // 'film-management': FilmManagementComponent,
        // 'team': TeamComponent,
        // 'positions': PositionsComponent,
        // 'employee': EmployeeComponent,
        // 'contract': ContractComponent,
        // 'handover': HandoverComponent,
        // 'holiday': HolidayComponent,
        // 'food-order': FoodOrderComponent,
        // 'day-off': DayOffComponent,
        // 'early-late': EarlyLateComponent,
        // 'over-time': OverTimeComponent,
        // 'employee-bussiness': EmployeeBussinessComponent,
        // 'employee-night-shift': EmployeeNightShiftComponent,
        // 'wfh': WFHComponent,
        // 'employee-no-fingerprint': EmployeeNoFingerprintComponent,
        // 'employee-attendance': EmployeeAttendanceComponent,
        // 'employee-error': EmployeeErrorComponent,
        // 'employee-curricular': EmployeeCurricularComponent,
        // 'payroll': PayrollComponent,
        // 'employee-timekeeping': EmployeeTimekeepingComponent,
        // 'employee-synthetic': EmployeeSyntheticComponent,
        // 'daily-report-hr': DailyReportHrComponent,
        // 'protectgear': ProtectgearComponent,
        // 'phase-allocation-person': PhaseAllocationPersonComponent,
        // 'training-registration': TrainingRegistrationComponent,
        // 'factory-visit-registration': FactoryVisitRegistrationComponent,
        // 'app': AppComponent,
        // 'warehouse': WarehouseComponent1,
        // 'inventory-by-product': InventoryByProductComponent,
        // 'employee-purchase': EmployeePurchaseComponent,
        // 'rule-pay': RulePayComponent,
        // 'currency-list': CurrencyListComponent,
        // 'supplier-sale': SupplierSaleComponent,
        // 'project-partlist-price-request-new': ProjectPartlistPriceRequestNewComponent,
        // 'assign-work': AssignWorkComponent,
        // 'poncc-new': PonccNewComponent,
        // 'inventory-project': InventoryProjectNewComponent,
        // 'project-part-list-purchase-request-slick-grid': ProjectPartListPurchaseRequestSlickGridComponent,
        // 'project-work-propress': ProjectWorkPropressComponent,
        // 'project-work-timeline': ProjectWorkTimelineComponent,

        // 'project-item-late': ProjectItemLateComponent,
        // 'project-work-item-timeline': ProjectWorkItemTimelineComponent,

        // 'project-department-summary': ProjectDepartmentSummaryComponent,

        // 'project-type': ProjectTypeComponent,
        // 'project-leader-project-type': ProjectLeaderProjectTypeComponent,
        // 'project-field': ProjectFieldComponent,
        // 'leader-project': LeaderProjectComponent,
        // 'meeting-minute-type': MeetingMinuteTypeComponent,
        // 'pokh': PokhSlickgridComponent,
        // 'quotation-kh': QuotationKhComponent,
        // 'pokh-kpi': PokhKpiComponent,
        // 'pokh-history': PokhHistoryComponent,
        // 'plan-week': PlanWeekComponent,
        // 'follow-project-base': FollowProjectBaseComponent,
        // 'bonus-coefficient': BonusCoefficientComponent,
        // 'employee-sale-manager': EmployeeSaleManagerComponent,
        // 'daily-report-sale': DailyReportSaleSlickgridComponent,
        // 'daily-report-sale-admin': DailyReportSaleAdminComponent,
        // 'request-invoice-old': RequestInvoiceComponent,
        // 'request-invoice': RequestInvoiceSlickgridComponent,
        // 'request-invoice-summary-old': RequestInvoiceSummaryComponent,
        // 'request-invoice-summary': RequestInvoiceSummarySlickgridComponent,
        // 'history-export-accountant': HistoryExportAccountantComponent,
        // 'history-approved-bill-log': HistoryApprovedBillLogComponent,
        // 'inventory-by-date': InventoryByDateComponent,
        // 'accounting-contract-type-master': AccountingContractTypeMasterComponent,
        // 'accounting-contract': AccountingContractComponent,
        // 'payment-order': PaymentOrderComponent,
        // 'person-day-off': PersonDayOffComponent,
        // 'early-late-summary': EarlyLateSummaryComponent,
        // 'wfh-summary': WFHSummaryComponent,
        // 'employee-no-finger-summary': EmployeeNoFingerSummaryComponent,
        // 'employee-bussiness-person-summary': EmployeeBussinessPersonSummaryComponent,
        // 'employee-night-shift-person-summary': EmployeeNightShiftPersonSummaryComponent,
        // 'over-time-person': OverTimePersonComponent,
        // 'employee-register-bussiness': EmployeeRegisterBussinessComponent,
        // 'summary-employee': SummaryEmployeeComponent,
        // 'employee-synthetic-personal': EmployeeSyntheticPersonalComponent,
        // 'booking-room': BookingRoomComponent,
        // 'tracking-marks': TrackingMarksComponent,
        // // 'person': PersonComponent,
        // 'register-idea': RegisterIdeaComponent,
        // 'register-contract': RegisterContractComponent,
        // 'daily-report-tech': DailyReportTechComponent,
        // 'daily-report-thr': DailyReportThrComponent,
        // 'daily-report-lxcp': DailyReportLXCPComponent,
        // 'workplan': WorkplanComponent,
        // 'workplan-summary': WorkplanSummaryComponent,
        // 'workplan-summary-new': WorkplanSummaryNewComponent,
        // 'asset-personal': AssetPersonalComponent,
        // 'approve-tp': ApproveTpComponent,
        // 'office-supply-requests': OfficeSupplyRequestsComponent,
        // 'project-partlist': ProjectPartListComponent,
        // 'org-chart-rtc': OrgChartRtcComponent,
        // 'org-chart-rtc-management': OrgChartRtcManagementComponent,
        // 'economic-contract-term': EconimicContractTermComponent,
        // 'economic-contract-type': EconomicContractTypeComponent,
        // 'economic-contract': EconomicContractComponent,

        // 'tbp-payment-order': PaymentOrderComponent,
        // 'tbp-job-requirement': JobRequirementComponent,
        // 'tbp-project-partlist': ProjectPartListSlickGridComponent,
        // 'tbp-project-partlist-purchase-request': ProjectPartListPurchaseRequestSlickGridComponent,
        // 'project-partlist-purchase-request': ProjectPartListPurchaseRequestSlickGridComponent,

        // 'hr-payment-order': PaymentOrderComponent,
        // 'hr-job-requirement': JobRequirementComponent,

        // 'bgd-payment-order': PaymentOrderComponent,
        // 'bgd-job-requirement': JobRequirementComponent,
        // 'bgd-project-partlist-purchase-request': ProjectPartListPurchaseRequestSlickGridComponent,
        // 'sale-payment-order': PaymentOrderComponent,
        // 'tbp-approve': ApproveTpComponent,
        // 'senior-approve': ApproveTpComponent,

        // 'person-dayoff': PersonDayOffComponent,
        // // 'early-late-summary': EarlyLateSummaryComponent,
        // // 'wfh-summary': WFHSummaryComponent,
        // 'nofinger-summary': EmployeeNoFingerSummaryComponent,
        // 'overtime-summary': OverTimeSummaryPersonComponent,
        // 'bussiness-summary': EmployeeBussinessPersonSummaryComponent,
        // 'nightshift-summary': EmployeeNightShiftPersonSummaryComponent,

        // // 'food-order': FoodOrderComponent,
        // 'dayoff': DayOffComponent,
        // // 'early-late': EarlyLateComponent,
        // 'overtime': OverTimePersonComponent,
        // 'bussiness': EmployeeRegisterBussinessComponent,
        // 'nightshift': EmployeeNightShiftComponent,
        // // 'wfh': WFHComponent,
        // 'nofinger': EmployeeNoFingerprintComponent,
        // 'person-summary': SummaryEmployeeComponent,
        // 'person-summary-payroll': EmployeeSyntheticPersonalComponent,

        // // 'booking-room': BookingRoomComponent,
        // 'tracking-mark': TrackingMarksComponent,
        // 'booking-vehicle': VehicleBookingManagementSlickgridComponent,
        // 'booking-vehicle-backup': VehicleBookingManagementComponent,
        // // 'payment-order': PaymentOrderComponent,
        // 'payment-order-special': PaymentOrderComponent,
        // // 'job-requirement': JobRequirementComponent,
        // // 'register-idea': RegisterIdeaComponent,
        // // 'register-contract': RegisterContractComponent,
        // // 'office-supply-requests': OfficeSupplyRequestsComponent,
        // 'work-item': WorkItemComponent,

        // 'daily-report-machine': DailyReportMachineComponent,
        // // 'daily-report-sale-admin': DailyReportSaleAdminComponent,
        // // 'daily-report-sale': DailyReportSaleSlickgridComponent,
        // // 'daily-report-tech': DailyReportTechComponent,
        // // 'daily-report-thr': DailyReportThrComponent,
        // // 'daily-report-lxcp': DailyReportLXCPComponent,
        // 'daily-report-lr': DailyReportMachineComponent,
        // 'daily-report-mkt': DailyReportMarComponent,

        // 'work-plan': WorkplanComponent,

        // // 'history-export-accountant': HistoryExportAccountantComponent,
        // 'history-approved-bill': HistoryApprovedBillLogComponent,
        // 'accounting-contract-type': AccountingContractTypeMasterComponent,
        // // 'accounting-contract': AccountingContractComponent,
        // 'request-invoice-kt': RequestInvoiceSlickgridComponent,
        // 'payment-order-kt': PaymentOrderComponent,
        // 'document-import-export': DocumentImportExportComponent,
        // 'bill-document-import-type': BillDocumentImportTypeComponent,
        // 'tax-company': TaxCompanyComponent,

        // 'pokh-hn-old': PokhComponent,
        // 'pokh-hn': PokhSlickgridComponent,
        // 'quotationkh-hn': QuotationKhComponent,
        // 'pokh-kpi-hn': PokhKpiComponent,
        // 'pokh-history-hn': PokhHistoryComponent,
        // 'plan-week-hn': PlanWeekComponent,
        // 'follow-project-base-hn': FollowProjectBaseComponent,
        // 'customer-sale-hn': CustomerComponent,

        // 'bonus-coefficient-hn': BonusCoefficientComponent,
        // 'employee-sale-hn': EmployeeSaleManagerComponent,
        // 'daily-report-sale-hn': DailyReportSaleSlickgridComponent,
        // 'daily-report-saleadmin-hn': DailyReportSaleAdminComponent,
        // 'request-invoice-hn': RequestInvoiceSlickgridComponent,

        // 'request-invoice-hcm': RequestInvoiceSlickgridComponent,
        // 'pokh-hcm': PokhSlickgridComponent,
        // 'follow-project-base-hcm': FollowProjectBaseComponent,

        // 'project': ProjectSlickGrid2Component,
        // 'project-slick-grid2': ProjectComponent,
        // 'project-workpropress': ProjectWorkPropressComponent,
        // 'project-worktimeline': ProjectWorkTimelineComponent,
        // 'project-survey': ProjectSurveySlickGridComponent,
        // 'project-survey-slick-grid': ProjectSurveyComponent,
        // 'meeting-minute': MeetingMinuteSlickGridComponent,
        // 'meeting-minute-slick-grid': MeetingMinuteComponent,
        // 'project-itemlate': ProjectItemLateComponent,
        // 'project-workitem-timeline': ProjectWorkItemTimelineComponent,

        // 'project-agv-summary-slick-grid': ProjectAgvSummarySlickGirdComponent,
        // 'project-dept-summary-slick-grid': ProjectDepartmentSummarySlickGridComponent,
        // 'synthesis-of-generated-materials': SynthesisOfGeneratedMaterialsSlickGridComponent,
        // 'synthesis-of-generated-materials-slick-grid': SynthesisOfGeneratedMaterialsComponent,

        // 'project-agv-summary': ProjectAgvSummarySlickGirdComponent,
        // // 'project-agv-summary-slick-grid': ProjectAgvSummaryComponent,
        // 'project-dept-summary': ProjectDepartmentSummarySlickGridComponent,
        // // 'project-dept-summary-slick-grid': ProjectDepartmentSummaryComponent,
        // 'price-history-partlist-slick-grid': PriceHistoryPartlistComponent,
        // 'price-history-partlist': PriceHistoryPartlistSlickGridComponent,
        // // 'project-type': ProjectTypeComponent,
        // // 'project-field': ProjectFieldComponent,
        // // 'meeting-minute-type': MeetingMinuteTypeComponent,
        // // 'leader-project': LeaderProjectComponent,
        // 'project-item-person': ProjectItemPersonComponent,
        // 'summary-project-join': SummaryProjectJoinComponent,
        // 'project-part-list': ProjectPartListSlickGridComponent,
        // 'kpi-tech': KPIEvaluationEmployeeComponent,
        // 'kpi-tech-factor-scoring': KPIEvaluationFactorScoringComponent,

        // // 'employee-purchase': EmployeePurchaseComponent,
        // // 'purchase': PurchaseComponent,
        // 'rulepay': RulePayComponent,
        // 'currency': CurrencyListComponent,
        // 'supplier': SupplierSaleComponent,
        // 'price-request': ProjectPartlistPriceRequestNewComponent,
        // // 'assign-work': AssignWorkComponent,
        // 'poncc': PonccNewComponent,
        // // 'inventory-project': InventoryProjectComponent,
        // 'purchase-request': ProjectPartListPurchaseRequestSlickGridComponent,
        // 'project-partlist-price-request-old': ProjectPartlistPriceRequestOldComponent,
        // 'inventory-project-product-sale-link': InventoryProjectProductSaleLinkComponent,

        // // 'training-registration': TrainingRegistrationComponent,
        // // 'factory-visit-registration': FactoryVisitRegistrationComponent,
        // 'employee-contact': EmployeeContactComponent,
        // // 'warehouse': WarehouseComponent1,
        // // 'inventory-by-product': InventoryByProductComponent,

        // // Kho sale HN
        // 'inventory-hn': InventoryNewComponent,
        // 'bill-import-hn': BillImportNewComponent,
        // 'bill-export-hn': BillExportNewComponent,
        // 'history-import-export-hn': HistoryImportExportNewComponent,
        // 'history-borrow-hn': HistoryBorrowSaleNewComponent,
        // 'report-import-export-hn': ReportImportExportNewComponent,
        // 'product-project-hn': ListProductProjectComponent,
        // 'search-serialnumber-hn': SearchProductSerialNumberComponent,

        // // Kho demo HN
        // 'inventory-demo-hn': InventoryDemoNewComponent,
        // 'bill-import-tech-hn': BillImportTechnicalNewComponent,
        // 'bill-export-tech-hn': BillExportTechnicalNewComponent,
        // 'product-report-hn': ProductReportNewComponent,
        // 'product-export-borrow-hn': ProductExportAndBorrowComponent,
        // 'borrow-report-hn': BorrowReportComponent,
        // 'borrow-product-history-hn': HistoryProductRtcComponent,
        // 'search-serialnumber-tech-hn': SearchProductTechSerialComponent,
        // 'product-location-hn': ProductLocationTechnicalComponent,
        // 'unit-count-hn': UnitCountKtComponent,
        // 'product-qrcode-hn': ProductRtcQrCodeComponent,

        // // Kho AGV HN
        // 'inventory-agv-hn': InventoryDemoNewComponent,
        // 'bill-import-agv-hn': BillImportTechnicalNewComponent,
        // 'bill-export-agv-hn': BillExportTechnicalNewComponent,
        // 'product-report-agv-hn': ProductReportNewComponent,
        // 'borrow-report-agv-hn': BorrowReportComponent,
        // 'borrow-product-history-agv-hn': HistoryProductRtcComponent,
        // 'product-location-agv-hn': ProductLocationTechnicalComponent,

        // // Sale HCM
        // 'inventory-hcm': InventoryNewComponent,
        // 'bill-import-hcm': BillImportNewComponent,
        // 'bill-export-hcm': BillExportNewComponent,
        // 'history-import-export-hcm': HistoryImportExportNewComponent,
        // 'history-borrow-hcm': HistoryBorrowSaleNewComponent,
        // 'report-import-export-hcm': ReportImportExportNewComponent,
        // 'product-project-hcm': ListProductProjectComponent,
        // 'search-serialnumber-hcm': SearchProductSerialNumberComponent,

        // // Sale demo HCM
        // 'inventory-demo-hcm': InventoryDemoNewComponent,
        // 'bill-import-tech-hcm': BillImportTechnicalNewComponent,
        // 'bill-export-tech-hcm': BillExportTechnicalNewComponent,
        // 'product-report-hcm': ProductReportNewComponent,
        // 'product-export-borrow-hcm': ProductExportAndBorrowComponent,
        // 'borrow-report-hcm': BorrowReportComponent,
        // 'search-serialnumber-tech-hcm': SearchProductTechSerialComponent,
        // 'product-qrcode-hcm': ProductRtcQrCodeComponent,

        // // Sale Bắc Ninh
        // 'inventory-bn': InventoryNewComponent,
        // 'bill-import-bn': BillImportNewComponent,
        // 'bill-export-bn': BillExportNewComponent,
        // 'history-import-export-bn': HistoryImportExportNewComponent,
        // 'history-borrow-bn': HistoryBorrowSaleNewComponent,
        // 'report-import-export-bn': ReportImportExportNewComponent,
        // 'product-project-bn': ListProductProjectComponent,
        // 'search-serialnumber-bn': SearchProductSerialNumberComponent,

        // // Demo Bắc Ninh
        // 'inventory-demo-bn': InventoryDemoNewComponent,
        // 'bill-import-tech-bn': BillImportTechnicalNewComponent,
        // 'bill-export-tech-bn': BillExportTechnicalNewComponent,
        // 'product-report-bn': ProductReportNewComponent,
        // 'product-export-borrow-bn': ProductExportAndBorrowComponent,
        // 'borrow-report-bn': BorrowReportComponent,
        // 'search-serialnumber-tech-bn': SearchProductTechSerialComponent,
        // 'product-qrcode-bn': ProductRtcQrCodeComponent,

        // // Sale Đan Phượng
        // 'inventory-dp': InventoryNewComponent,
        // 'bill-import-dp': BillImportNewComponent,
        // 'bill-export-dp': BillExportNewComponent,
        // 'history-import-export-dp': HistoryImportExportNewComponent,
        // 'history-borrow-dp': HistoryBorrowSaleNewComponent,
        // 'report-import-export-dp': ReportImportExportNewComponent,
        // 'product-project-dp': ListProductProjectComponent,
        // 'search-serialnumber-dp': SearchProductSerialNumberComponent,

        // // Demo Đan Phượng
        // 'inventory-demo-dp': InventoryDemoNewComponent,
        // 'bill-import-tech-dp': BillImportTechnicalNewComponent,
        // 'bill-export-tech-dp': BillExportTechnicalNewComponent,
        // 'product-report-dp': ProductReportNewComponent,
        // 'product-export-borrow-dp': ProductExportAndBorrowComponent,
        // 'borrow-report-dp': BorrowReportComponent,
        // 'search-serialnumber-tech-dp': SearchProductTechSerialComponent,
        // 'product-location-dp': ProductLocationTechnicalComponent,
        // 'unit-count-dp': UnitCountKtComponent,
        // 'product-qrcode-dp': ProductRtcQrCodeComponent,

        // // Cài đặt
        // // 'product-location': ProductLocationComponent,
        // // 'firm': FirmComponent,
        // // 'unit-count': UnitCountComponent,
        // 'product-sale': ProductSaleNewComponent,
        // 'product-demo': ProductRtcComponent,
        // 'product-agv': ProductRtcComponent,
        // 'material-detail-of-product-rtc': MaterialDetailOfProductRtcComponent,
        // 'chi-tiet-san-pham-sale': ChiTietSanPhamSaleComponent,

        // // Nhân sự
        // 'hr-hiring-request': HrhiringRequestComponent,
        // 'job-requirement-hr': JobRequirementComponent,
        // 'proposal-hr': HrPurchaseProposalComponent,
        // // 'document': DocumentComponent,
        // 'document-common': DocumentCommonComponent,
        // 'document-common-kt': DocumentCommonComponent,
        // 'document-common-sale': DocumentCommonComponent,
        // 'document-common-agv': DocumentCommonComponent,
        // 'document-common-tkck': DocumentCommonComponent,

        // 'asset-management': TsAssetManagementComponent,
        // 'asset-type': TsAssetTypeComponent,
        // 'asset-source': TsAssetSourceComponent,
        // 'asset-allocation': TsAssetAllocationComponent,
        // 'asset-recovery': TsAssetRecoveryComponent,
        // 'asset-transfer': TsAssetTransferComponent,
        // 'asset-management-person': TsAssetManagementPersonalComponent,
        // 'asset-type-person': TsAssetManagementPersonalTypeComponent,
        // 'asset-allocation-person': TsAssetAllocationPersonalComponent,
        // 'asset-recovery-person': TsAssetRecoveryPersonalNewComponent,

        // // 'vehicle-management': VehicleManagementComponent,
        // 'vehicle-booking': VehicleBookingManagementSlickgridComponent,
        // 'vehicle-repair-type': VehicleRepairTypeComponent,
        // 'vehicle-repair-propose': ProposeVehicleRepairComponent,
        // // 'vehicle-repair-history': VehicleRepairHistoryComponent,

        // // 'office-supply': OfficeSupplyComponent,
        // 'office-supply-unit': OfficeSupplyUnitComponent,
        // 'office-supply-request': OfficeSupplyRequestsComponent,
        // 'office-supply-summary': OfficeSupplyRequestSummaryComponent,

        // // 'film-management': FilmManagementComponent,
        // 'deparment': DepartmentComponent,
        // // 'team': TeamComponent,
        // // 'positions': PositionsComponent,
        // // 'employee': EmployeeComponent,
        // // 'contract': ContractComponent,
        // // 'handover': HandoverComponent,
        // // 'holiday': HolidayComponent,

        // 'food-order-hr': FoodOrderComponent,
        // 'dayoff-hr': DayOffComponent,
        // 'early-late-hr': EarlyLateComponent,
        // 'overtime-hr': OverTimeComponent,
        // 'bussiness-hr': EmployeeBussinessComponent,
        // 'nightshift-hr': EmployeeNightShiftComponent,
        // 'wfh-hr': WFHComponent,
        // 'nofinger-hr': EmployeeNoFingerprintComponent,
        // 'attendance-hr': EmployeeAttendanceComponent,
        // 'curricular-hr': EmployeeCurricularComponent,
        // 'payroll-hr': PayrollComponent,
        // 'timekeeping-hr': EmployeeTimekeepingComponent,
        // 'synthetic-hr': EmployeeSyntheticComponent,
        // 'dailyreport-hr': DailyReportHrComponent,
        // 'protect-gear-hr': ProtectgearComponent,
        // 'phase-allocation-hr': PhaseAllocationPersonComponent,
        // // 'workplan-summary': WorkplanSummaryComponent,

        // 'bill-import-qc': BillImportQcComponent,

        // 'newsletter': NewsletterComponent,
        // 'newsletter-type': NewsletterTypeComponent,
        // 'newsletter-view-all': NewsletterFormViewAllComponent,

        // 'document-sale-admin': DocumentSaleAdminComponent,
        // 'inventory-borrow-ncc': InventoryBorrowNCCComponent,

        // // Course
        // 'course-management': CourseManagementComponent,

        // // 'chi-tiet-san-pham-sale': ChiTietSanPhamSaleComponent,

        // // KPI lỗi kỹ thuật
        // 'kpi-error': KpiErrorComponent,
        // 'kpi-error-employee': KpiErrorEmployeeComponent,
        // 'kpi-error-employee-summary-max': KpiErrorEmployeeSummaryMaxComponent,
        // 'summary-kpi-error-employee-month': SummaryKpiErrorEmployeeMonthComponent,
        // 'summary-kpi-error-employee-new': SummaryKpiErrorEmployeeNewComponent,

        // 'inventoryaa': InventoryNewComponent,
    };

    if (!Array.isArray(routes)) {
        return map;
    }

    for (const route of routes) {
        if (
            route.path &&
            route.component &&
            route.path !== '' &&
            route.path !== '**' &&
            !route.redirectTo &&
            !route.path.includes(':')
        ) {
            map[route.path] = route.component;
        }

        if (route.children?.length) {
            Object.assign(map, buildComponentRegistry(route.children));
        }
    }

    return map;
}