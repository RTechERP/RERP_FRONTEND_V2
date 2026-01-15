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
import { ApproveJobRequirementComponent } from './pages/hrm/job-requirement/approve-job-requirement/approve-job-requirement.component';
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
import { OrgChartRtcComponent } from './pages/hrm/org-chart-rtc/org-chart-rtc.component';
import { RegisterContractComponent } from './pages/person/register-contract/register-contract.component';
import { WorkplanComponent } from './pages/person/workplan/workplan.component';
import { WorkplanSummaryComponent } from './pages/person/workplan/workplan-summary/workplan-summary.component';
import { WorkplanSummaryNewComponent } from './pages/person/workplan/workplan-summary-new/workplan-summary-new.component';
import { AssetPersonalComponent } from './pages/hrm/asset/asset/asset-personal/asset-personal.component';
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
// import { ProductRtcComponent } from './pages/old/tb-product-rtc/product-rtc/product-rtc.component';
// import { InventoryDemoNewComponent } from './pages/old/inventory-demo/inventory-demo-new/inventory-demo-new.component';
// import { MaterialDetailOfProductRtcComponent } from './pages/old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
// import { BillExportTechnicalNewComponent } from './pages/old/bill-export-technical/bill-export-technical-new/bill-export-technical-new.component';
// import { InventoryBorrowNCCComponent } from './pages/old/Sale/Inventory/Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';
// import { ChiTietSanPhamSaleComponent } from './pages/old/Sale/chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';
// import { InventoryNewComponent } from './pages/old/Sale/Inventory/inventory-new/inventory-new.component';
// import { BillImportTechnicalNewComponent } from './pages/old/bill-import-technical/bill-import-technical-new/bill-import-technical-new.component';
import { VehicleRepairTypeComponent } from './pages/hrm/vehicle/vehicle-repair/vehicle-repair-type/vehicle-repair-type.component';
import { OfficeSupplyUnitComponent } from './pages/hrm/office-supply/OfficeSupplyUnit/office-supply-unit.component';
import { ProjectItemPersonComponent } from './pages/project/project-item-person/project-item-person.component';
import { DailyReportMarComponent } from './pages/daily-report-mar/daily-report-mar.component';
import { DocumentImportExportComponent } from './pages/old/KETOAN/document-import-export/document-import-export.component';
import { DocumentCommonComponent } from './pages/hrm/document/document-common/document-common.component';
// import { ProjectPartlistPurchaseRequestVer2Component } from './pages/purchase/project-partlist-purchase-request/project-partlist-purchase-request-ver2/project-partlist-purchase-request-ver2.component';
import { ProjectPartlistPriceRequestComponent } from './pages/old/project-partlist-price-request/project-partlist-price-request.component';
import { BillDocumentImportTypeComponent } from './pages/old/KETOAN/bill-document-import-type/bill-document-import-type.component';
import { BillImportQcComponent } from './pages/old/Sale/bill-import-qc/bill-import-qc.component';
import { OrgChartRtcManagementComponent } from './pages/hrm/org-chart-rtc/org-chart-rtc-management/org-chart-rtc-management.component';
import { TaxCompanyComponent } from './pages/old/KETOAN/tax-company/tax-company.component';
import { SummaryProjectJoinComponent } from './pages/person/summary-project-join/summary-project-join.component';
import { ProjectSlickGrid2Component } from './pages/project-slick-grid2/project-slick-grid2.component';
import { ProjectPartListSlickGridComponent } from './pages/project-part-list-slick-grid/project-part-list-slick-grid.component';
import { InventoryNewComponent } from './pages/old/Sale/Inventory/inventory-new/inventory-new.component';
import { BillImportTechnicalNewComponent } from './pages/old/bill-import-technical/bill-import-technical-new/bill-import-technical-new.component';
import { InventoryDemoNewComponent } from './pages/old/inventory-demo/inventory-demo-new/inventory-demo-new.component';
import { BillExportTechnicalNewComponent } from './pages/old/bill-export-technical/bill-export-technical-new/bill-export-technical-new.component';
import { HistoryProductRtcComponent } from './pages/old/inventory-demo/borrow/borrow-product-history/history-product-rtc/history-product-rtc.component';
import { ProductRtcComponent } from './pages/old/tb-product-rtc/product-rtc/product-rtc.component';
import { ProductSaleNewComponent } from './pages/old/Sale/ProductSale/product-sale-new/product-sale-new.component';
import { HistoryBorrowSaleNewComponent } from './pages/old/Sale/HistoryBorrowSale/history-borrow-sale-new/history-borrow-sale-new.component';
import { MaterialDetailOfProductRtcComponent } from './pages/old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { ChiTietSanPhamSaleComponent } from './pages/old/Sale/chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';
import { PokhSlickgridComponent } from './pages/old/pokh-slickgrid/pokh-slickgrid.component';
import { BillImportNewComponent } from './pages/old/Sale/BillImport/bill-import-new/bill-import-new.component';
import { BillExportNewComponent } from './pages/old/Sale/BillExport/bill-export-new/bill-export-new.component';
import { ProjectDepartmentSummarySlickGridComponent } from './pages/project-department-summary-slick-grid/project-department-summary-slick-grid.component';
import { ProjectAgvSummarySlickGirdComponent } from './pages/project-agv-summary-slick-gird/project-agv-summary-slick-gird.component'; import { CrmComponent } from './pages/crm/crm.component';
import { GeneralCategoryComponent } from './pages/general-category/general-category.component';
import { SystemsComponent } from './pages/systems/systems.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
import { SalesComponent } from './pages/sales/sales.component';
import { AccountingComponent } from './pages/accounting/accounting.component';
import { PurchaseComponent } from './pages/purchase/purchase.component';
import { HrmComponent } from './pages/hrm/hrm.component';
import { ApproveComponent } from './pages/approve/approve.component';
import { RequestInvoiceSlickgridComponent } from './pages/old/request-invoice-slickgrid/request-invoice-slickgrid.component';
import { PriceHistoryPartlistSlickGridComponent } from './pages/price-history-partlist-slick-grid/price-history-partlist-slick-grid.component';
import { SynthesisOfGeneratedMaterialsSlickGridComponent } from './pages/synthesis-of-generated-materials-slick-grid/synthesis-of-generated-materials-slick-grid.component';
import { ProjectSurveySlickGridComponent } from './pages/project-survey-slick-grid/project-survey-slick-grid.component';
import { RequestInvoiceSummarySlickgridComponent } from './pages/old/request-invoice-summary-slickgrid/request-invoice-summary-slickgrid.component';
import { NewsletterComponent } from './pages/old/newsletter/newsletter/newsletter.component';
import { NewsletterTypeComponent } from './pages/old/newsletter/newsletter/newsletter-type/newsletter-type.component';
import { ProjectPartlistPriceRequestOldComponent } from './pages/purchase/project-partlist-price-request-old/project-partlist-price-request-old.component';
import { MeetingMinuteSlickGridComponent } from './pages/meeting-minute-slick-grid/meeting-minute-slick-grid.component';
import { DocumentSaleAdminComponent } from './pages/hrm/document/document-sale-admin/document-sale-admin.component';
import { InventoryBorrowNCCComponent } from './pages/old/Sale/Inventory/Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';

import { NewsletterFormViewAllComponent } from './pages/old/newsletter/newsletter/newsletter-form-view-all/newsletter-form-view-all.component';
import { CourseManagementComponent } from './pages/Course/course-management/course-management.component';
import { EconimicContractTermComponent } from './pages/hrm/economic-contract/econimic-contract-term/econimic-contract-term.component';
import { EconomicContractTypeComponent } from './pages/hrm/economic-contract/economic-contract-type/economic-contract-type.component';
import { EconomicContractComponent } from './pages/hrm/economic-contract/economic-contract.component';
import { KPIEvaluationEmployeeComponent } from './pages/KPITech/kpievaluation-employee/kpievaluation-employee.component';
import { KPIEvaluationFactorScoringComponent } from './pages/KPITech/kpievaluation-factor-scoring/kpievaluation-factor-scoring.component';
import { SettingHrConfigComponent } from './pages/hrm/setting/setting-hr-config/setting-hr-config.component';
import { KpiErrorComponent } from './pages/old/Technical/kpi-error/kpi-error.component';
import { KpiErrorEmployeeComponent } from './pages/old/Technical/kpi-error-employee/kpi-error-employee.component';
import { KpiErrorEmployeeSummaryMaxComponent } from './pages/old/Technical/kpi-error-employee-summary-max/kpi-error-employee-summary-max.component';
import { SummaryKpiErrorEmployeeMonthComponent } from './pages/old/Technical/summary-kpi-error-employee-month/summary-kpi-error-employee-month.component';
import { InventoryProjectProductSaleLinkComponent } from './pages/purchase/inventory-project-product-sale-link/inventory-project-product-sale-link.component';
import { HistoryImportExportNewComponent } from './pages/old/Sale/HistoryImportExport/history-import-export-new/history-import-export-new.component';
import { ReportImportExportNewComponent } from './pages/old/Sale/ReportImportExport/report-import-export-new/report-import-export-new.component';
// import { ReportImportExportNewComponent } from './pages/old/Sale/ReportImportExport/report-import-export-new/report-import-export-new.component';
// import { HistoryImportExportNewComponent } from './pages/old/Sale/HistoryImportExport/history-import-export-new/history-import-export-new.component';
import { InventoryProjectNewComponent } from './pages/purchase/inventory-project/inventory-project-new/inventory-project-new.component';
// import { SettingHrConfigComponent } from './pages/hrm/setting/setting-hr-config/setting-hr-config.component';
// import { KpiErrorComponent } from './pages/old/Technical/kpi-error/kpi-error.component';
// import { KpiErrorEmployeeComponent } from './pages/old/Technical/kpi-error-employee/kpi-error-employee.component';
// import { KpiErrorEmployeeSummaryMaxComponent } from './pages/old/Technical/kpi-error-employee-summary-max/kpi-error-employee-summary-max.component';
// import { SummaryKpiErrorEmployeeMonthComponent } from './pages/old/Technical/summary-kpi-error-employee-month/summary-kpi-error-employee-month.component';
// import { SummaryKpiErrorEmployeeComponent } from './pages/old/Technical/summary-kpi-error-employee/summary-kpi-error-employee.component';
import { DailyReportSaleSlickgridComponent } from './pages/old/KPISale/daily-report-sale-slickgrid/daily-report-sale-slickgrid.component';

// import { CustomerSlickgridComponent } from './pages/crm/customers/customer-slickgrid/customer-slickgrid.component';
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
            { path: 'menu-app', component: MenuAppComponent, canActivate: [authGuard] },
            //#endregion

            //#region crm
            { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            //#endregion

            //#region kế toán
            { path: 'paymentorder', component: PaymentOrderComponent, canActivate: [authGuard] },

            //#endregion


            //#region  Các phân hệ chính
            { path: 'approve', component: ApproveComponent, canActivate: [authGuard] },
            { path: 'person', component: PersonComponent, canActivate: [authGuard] },
            { path: 'category', component: GeneralCategoryComponent, canActivate: [authGuard] },
            { path: 'system', component: SystemsComponent, canActivate: [authGuard] },
            { path: 'crm', component: CrmComponent, canActivate: [authGuard] },
            { path: 'warehouses', component: WarehouseComponent, canActivate: [authGuard] },
            { path: 'sale', component: SalesComponent, canActivate: [authGuard] },
            { path: 'accounting', component: AccountingComponent, canActivate: [authGuard] },
            { path: 'purchase', component: PurchaseComponent, canActivate: [authGuard] },
            { path: 'projects', component: ProjectSlickGrid2Component, canActivate: [authGuard] },
            { path: 'hrm', component: HrmComponent, canActivate: [authGuard] },
            //#endregion

            // { path: 'customer', component: CustomerComponent, canActivate: [authGuard] },
            { path: 'inventory', component: InventoryNewComponent, canActivate: [authGuard] },
            { path: 'bill-import', component: BillImportComponent, canActivate: [authGuard] },
            { path: 'bill-export', component: BillExportComponent, canActivate: [authGuard] },
            { path: 'history-import-export', component: HistoryImportExportNewComponent, canActivate: [authGuard] },
            { path: 'history-borrow-sale', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export', component: ReportImportExportNewComponent, canActivate: [authGuard] },
            { path: 'list-product-project', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-product-serial-number', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },
            { path: 'inventory-demo', component: InventoryDemoComponent, canActivate: [authGuard] },
            { path: 'bill-import-technical', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-technical', component: BillExportTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-report-new', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-and-borrow', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report', component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history', component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            { path: 'product-location-technical', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'product-rtc-qr-code', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },
            { path: 'unit-count-kt', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            { path: 'firm', component: FirmComponent, canActivate: [authGuard] },
            { path: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            // { path: 'product-sale', component: ProductSaleComponent, canActivate: [authGuard] },
            { path: 'tb-product-rtc', component: TbProductRtcComponent, canActivate: [authGuard] },
            { path: 'hrhiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            { path: 'job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'approve-job-requirement', component: ApproveJobRequirementComponent, canActivate: [authGuard] },
            { path: 'job-requirement-bgd', component: ApproveJobRequirementComponent, canActivate: [authGuard] },
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
            { path: 'inventory-project', component: InventoryProjectNewComponent, canActivate: [authGuard] },
            { path: 'project-part-list-purchase-request-slick-grid', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },
            { path: 'project-work-propress', component: ProjectWorkPropressComponent, canActivate: [authGuard] },
            { path: 'project-work-timeline', component: ProjectWorkTimelineComponent, canActivate: [authGuard] },
            //{ path: 'project-survey', component: ProjectSurveyComponent, canActivate: [authGuard] },
            //{ path: 'meeting-minute', component: MeetingMinuteComponent, canActivate: [authGuard] },
            { path: 'project-item-late', component: ProjectItemLateComponent, canActivate: [authGuard] },
            { path: 'project-work-item-timeline', component: ProjectWorkItemTimelineComponent, canActivate: [authGuard] },
            // { path: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard] },
            // { path: 'project-agv-summary', component: ProjectAgvSummaryComponent, canActivate: [authGuard] },
            { path: 'project-department-summary', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard] },
            // { path: 'price-history-partlist', component: PriceHistoryPartlistComponent, canActivate: [authGuard] },
            { path: 'project-type', component: ProjectTypeComponent, canActivate: [authGuard] },
            { path: 'project-leader-project-type', component: ProjectLeaderProjectTypeComponent, canActivate: [authGuard] },
            { path: 'project-field', component: ProjectFieldComponent, canActivate: [authGuard] },
            { path: 'leader-project', component: LeaderProjectComponent, canActivate: [authGuard] },
            { path: 'meeting-minute-type', component: MeetingMinuteTypeComponent, canActivate: [authGuard] },
            { path: 'pokh', component: PokhSlickgridComponent, canActivate: [authGuard] },
            { path: 'quotation-kh', component: QuotationKhComponent, canActivate: [authGuard] },
            { path: 'pokh-kpi', component: PokhKpiComponent, canActivate: [authGuard] },
            { path: 'pokh-history', component: PokhHistoryComponent, canActivate: [authGuard] },
            { path: 'plan-week', component: PlanWeekComponent, canActivate: [authGuard] },
            { path: 'follow-project-base', component: FollowProjectBaseComponent, canActivate: [authGuard] },
            { path: 'bonus-coefficient', component: BonusCoefficientComponent, canActivate: [authGuard] },
            { path: 'employee-sale-manager', component: EmployeeSaleManagerComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale', component: DailyReportSaleSlickgridComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale-admin', component: DailyReportSaleAdminComponent, canActivate: [authGuard] },
            { path: 'request-invoice-old', component: RequestInvoiceComponent, canActivate: [authGuard] },
            { path: 'request-invoice', component: RequestInvoiceSlickgridComponent, canActivate: [authGuard] },
            { path: 'request-invoice-summary-old', component: RequestInvoiceSummaryComponent, canActivate: [authGuard] },
            { path: 'request-invoice-summary', component: RequestInvoiceSummarySlickgridComponent, canActivate: [authGuard] },
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
            { path: 'workplan-summary', component: WorkplanSummaryComponent, canActivate: [authGuard] },
            { path: 'workplan-summary-new', component: WorkplanSummaryNewComponent, canActivate: [authGuard] },
            { path: 'asset-personal', component: AssetPersonalComponent, canActivate: [authGuard] },
            { path: 'approve-tp', component: ApproveTpComponent, canActivate: [authGuard] },
            { path: 'office-supply-requests', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },
            { path: 'project-partlist', component: ProjectPartListComponent, canActivate: [authGuard] },
            { path: 'org-chart-rtc', component: OrgChartRtcComponent, canActivate: [authGuard] },
            { path: 'org-chart-rtc-management', component: OrgChartRtcManagementComponent, canActivate: [authGuard] },
            { path: 'economic-contract-term', component: EconimicContractTermComponent, canActivate: [authGuard] },
            { path: 'economic-contract-type', component: EconomicContractTypeComponent, canActivate: [authGuard] },
            { path: 'economic-contract', component: EconomicContractComponent, canActivate: [authGuard] },
            // { path: 'setting-hr-config', component: SettingHrConfigComponent, canActivate: [authGuard] },





            //TBP duyệt
            { path: 'tbp-payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'tbp-job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'tbp-project-partlist', component: ProjectPartListSlickGridComponent, canActivate: [authGuard] },
            { path: 'tbp-project-partlist-purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },
            { path: 'project-partlist-purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },

            //HR duyệt
            { path: 'hr-payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'hr-job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },


            //BGD duyệt
            { path: 'bgd-payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'bgd-job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'bgd-project-partlist-purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },

            { path: 'sale-payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'tbp-approve', component: ApproveTpComponent, canActivate: [authGuard] },
            { path: 'senior-approve', component: ApproveTpComponent, canActivate: [authGuard] },



            //Tổng hợp công
            { path: 'person-dayoff', component: PersonDayOffComponent, canActivate: [authGuard] },
            { path: 'early-late-summary', component: EarlyLateSummaryComponent, canActivate: [authGuard] },
            { path: 'wfh-summary', component: WFHSummaryComponent, canActivate: [authGuard] },
            { path: 'nofinger-summary', component: EmployeeNoFingerSummaryComponent, canActivate: [authGuard] },
            { path: 'overtime-summary', component: OverTimeSummaryPersonComponent, canActivate: [authGuard] },
            { path: 'bussiness-summary', component: EmployeeBussinessPersonSummaryComponent, canActivate: [authGuard] },
            { path: 'nightshift-summary', component: EmployeeNightShiftPersonSummaryComponent, canActivate: [authGuard] },


            //đăng ký công
            { path: 'food-order', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'dayoff', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'early-late', component: EarlyLateComponent, canActivate: [authGuard] },
            { path: 'overtime', component: OverTimePersonComponent, canActivate: [authGuard] },
            { path: 'bussiness', component: EmployeeRegisterBussinessComponent, canActivate: [authGuard] },
            { path: 'nightshift', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            { path: 'wfh', component: WFHComponent, canActivate: [authGuard] },
            { path: 'nofinger', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            { path: 'person-summary', component: SummaryEmployeeComponent, canActivate: [authGuard] },
            { path: 'person-summary-payroll', component: EmployeeSyntheticPersonalComponent, canActivate: [authGuard] },


            //Đăng ký chung
            { path: 'booking-room', component: BookingRoomComponent, canActivate: [authGuard] },
            { path: 'tracking-mark', component: TrackingMarksComponent, canActivate: [authGuard] },
            { path: 'booking-vehicle', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            { path: 'payment-order', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'payment-order-special', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'job-requirement', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'register-idea', component: RegisterIdeaComponent, canActivate: [authGuard] },
            { path: 'register-contract', component: RegisterContractComponent, canActivate: [authGuard] },
            { path: 'office-supply-requests', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },

            { path: 'work-item', component: WorkItemComponent, canActivate: [authGuard] },


            //Báo cáo công việc
            { path: 'daily-report-machine', component: DailyReportMachineComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale-admin', component: DailyReportSaleAdminComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale', component: DailyReportSaleSlickgridComponent, canActivate: [authGuard] },
            { path: 'daily-report-tech', component: DailyReportTechComponent, canActivate: [authGuard] },
            { path: 'daily-report-thr', component: DailyReportThrComponent, canActivate: [authGuard] },
            { path: 'daily-report-lxcp', component: DailyReportLXCPComponent, canActivate: [authGuard] },
            { path: 'daily-report-lr', component: DailyReportMachineComponent, canActivate: [authGuard] },
            { path: 'daily-report-mkt', component: DailyReportMarComponent, canActivate: [authGuard] },
            //Kế hoạch tuần
            { path: 'work-plan', component: WorkplanComponent, canActivate: [authGuard] },

            //Kế toán
            { path: 'history-export-accountant', component: HistoryExportAccountantComponent, canActivate: [authGuard] },
            { path: 'history-approved-bill', component: HistoryApprovedBillLogComponent, canActivate: [authGuard] },
            { path: 'accounting-contract-type', component: AccountingContractTypeMasterComponent, canActivate: [authGuard] },
            { path: 'accounting-contract', component: AccountingContractComponent, canActivate: [authGuard] },
            { path: 'request-invoice-kt', component: RequestInvoiceSlickgridComponent, canActivate: [authGuard] },
            { path: 'payment-order-kt', component: PaymentOrderComponent, canActivate: [authGuard] },
            { path: 'document-import-export', component: DocumentImportExportComponent, canActivate: [authGuard] },
            { path: 'bill-document-import-type', component: BillDocumentImportTypeComponent, canActivate: [authGuard] },
            { path: 'tax-company', component: TaxCompanyComponent, canActivate: [authGuard] },


            //Phòng sale
            //HN
            { path: 'pokh-hn-old', component: PokhComponent, canActivate: [authGuard] },
            { path: 'pokh-hn', component: PokhSlickgridComponent, canActivate: [authGuard] },
            { path: 'quotationkh-hn', component: QuotationKhComponent, canActivate: [authGuard] },
            { path: 'pokh-kpi-hn', component: PokhKpiComponent, canActivate: [authGuard] },
            { path: 'pokh-history-hn', component: PokhHistoryComponent, canActivate: [authGuard] },
            { path: 'plan-week-hn', component: PlanWeekComponent, canActivate: [authGuard] },
            { path: 'follow-project-base-hn', component: FollowProjectBaseComponent, canActivate: [authGuard] },
            { path: 'customer-sale-hn', component: CustomerComponent, canActivate: [authGuard] },


            //KPI
            { path: 'bonus-coefficient-hn', component: BonusCoefficientComponent, canActivate: [authGuard] },
            { path: 'employee-sale-hn', component: EmployeeSaleManagerComponent, canActivate: [authGuard] },
            { path: 'daily-report-sale-hn', component: DailyReportSaleSlickgridComponent, canActivate: [authGuard] },
            { path: 'daily-report-saleadmin-hn', component: DailyReportSaleAdminComponent, canActivate: [authGuard] },
            { path: 'request-invoice-hn', component: RequestInvoiceSlickgridComponent, canActivate: [authGuard] },


            //HCM
            { path: 'request-invoice-hcm', component: RequestInvoiceSlickgridComponent, canActivate: [authGuard] },
            { path: 'pokh-hcm', component: PokhSlickgridComponent, canActivate: [authGuard] },
            { path: 'follow-project-base-hcm', component: FollowProjectBaseComponent, canActivate: [authGuard] },



            //Dự án
            { path: 'project', component: ProjectSlickGrid2Component, canActivate: [authGuard] },
            { path: 'project-slick-grid2', component: ProjectComponent, canActivate: [authGuard] },
            { path: 'project-workpropress', component: ProjectWorkPropressComponent, canActivate: [authGuard] },
            { path: 'project-worktimeline', component: ProjectWorkTimelineComponent, canActivate: [authGuard] },
            { path: 'project-survey', component: ProjectSurveySlickGridComponent, canActivate: [authGuard] },
            { path: 'project-survey-slick-grid', component: ProjectSurveyComponent, canActivate: [authGuard] },
            { path: 'meeting-minute', component: MeetingMinuteSlickGridComponent, canActivate: [authGuard] },
            { path: 'meeting-minute-slick-grid', component: MeetingMinuteComponent, canActivate: [authGuard] },
            { path: 'project-itemlate', component: ProjectItemLateComponent, canActivate: [authGuard] },
            { path: 'project-workitem-timeline', component: ProjectWorkItemTimelineComponent, canActivate: [authGuard] },
            // { path: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard] },

            // { path: 'project-agv-summary', component: ProjectAgvSummaryComponent, canActivate: [authGuard] },

            { path: 'project-agv-summary-slick-grid', component: ProjectAgvSummarySlickGirdComponent, canActivate: [authGuard] },
            // { path: 'project-dept-summary', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard] },
            { path: 'project-dept-summary-slick-grid', component: ProjectDepartmentSummarySlickGridComponent, canActivate: [authGuard] },
            // { path: 'price-history-partlist', component: PriceHistoryPartlistComponent, canActivate: [authGuard] },
            { path: 'synthesis-of-generated-materials', component: SynthesisOfGeneratedMaterialsSlickGridComponent, canActivate: [authGuard] },
            { path: 'synthesis-of-generated-materials-slick-grid', component: SynthesisOfGeneratedMaterialsComponent, canActivate: [authGuard] },

            { path: 'project-agv-summary', component: ProjectAgvSummarySlickGirdComponent, canActivate: [authGuard] },
            { path: 'project-agv-summary-slick-grid', component: ProjectAgvSummaryComponent, canActivate: [authGuard] },
            { path: 'project-dept-summary', component: ProjectDepartmentSummarySlickGridComponent, canActivate: [authGuard] },
            { path: 'project-dept-summary-slick-grid', component: ProjectDepartmentSummaryComponent, canActivate: [authGuard] },
            { path: 'price-history-partlist-slick-grid', component: PriceHistoryPartlistComponent, canActivate: [authGuard] },
            { path: 'price-history-partlist', component: PriceHistoryPartlistSlickGridComponent, canActivate: [authGuard] },
            { path: 'project-type', component: ProjectTypeComponent, canActivate: [authGuard] },
            { path: 'project-field', component: ProjectFieldComponent, canActivate: [authGuard] },
            { path: 'meeting-minute-type', component: MeetingMinuteTypeComponent, canActivate: [authGuard] },
            { path: 'leader-project', component: LeaderProjectComponent, canActivate: [authGuard] },
            { path: 'project-item-person', component: ProjectItemPersonComponent, canActivate: [authGuard] },
            { path: 'summary-project-join', component: SummaryProjectJoinComponent, canActivate: [authGuard] },
            { path: 'project-part-list', component: ProjectPartListSlickGridComponent, canActivate: [authGuard] },
            { path: 'kpi-tech', component: KPIEvaluationEmployeeComponent, canActivate: [authGuard] },
            { path: 'kpi-tech-factor-scoring', component: KPIEvaluationFactorScoringComponent, canActivate: [authGuard] },


            //Mua hàng
            { path: 'employee-purchase', component: EmployeePurchaseComponent, canActivate: [authGuard] },
            { path: 'purchase', component: PurchaseComponent, canActivate: [authGuard] },
            { path: 'rulepay', component: RulePayComponent, canActivate: [authGuard] },
            { path: 'currency', component: CurrencyListComponent, canActivate: [authGuard] },
            { path: 'supplier', component: SupplierSaleComponent, canActivate: [authGuard] },
            // { path: 'price-request', component: ProjectPartlistPriceRequestComponent, canActivate: [authGuard] },
            { path: 'price-request', component: ProjectPartlistPriceRequestNewComponent, canActivate: [authGuard] },
            { path: 'assign-work', component: AssignWorkComponent, canActivate: [authGuard] },
            { path: 'poncc', component: PonccNewComponent, canActivate: [authGuard] },
            { path: 'inventory-project', component: InventoryProjectComponent, canActivate: [authGuard] },
            { path: 'purchase-request', component: ProjectPartListPurchaseRequestSlickGridComponent, canActivate: [authGuard] },
            {
                // "N35,N33,N1,N36,N27,N69,N80"
                path: 'project-partlist-price-request-old',
                component: ProjectPartlistPriceRequestOldComponent,
                canActivate: [authGuard],
            },
            {
                path: 'inventory-project-product-sale-link',
                component: InventoryProjectProductSaleLinkComponent,
                canActivate: [authGuard],
            },




            //Danh mục chung
            { path: 'training-registration', component: TrainingRegistrationComponent, canActivate: [authGuard] },
            { path: 'factory-visit-registration', component: FactoryVisitRegistrationComponent, canActivate: [authGuard] },
            { path: 'employee-contact', component: EmployeeContactComponent, canActivate: [authGuard] },
            { path: 'warehouse', component: WarehouseComponent1, canActivate: [authGuard] },
            { path: 'inventory-by-product', component: InventoryByProductComponent, canActivate: [authGuard] },



            // //Kho sale hn
            // { path: 'inventory-hn' , component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-hn' , component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-hn' , component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-hn' , component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-hn' , component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-hn' , component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-hn' , component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-hn' , component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //kho demo hn
            // { path: 'inventory-demo-hn' , component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-hn' , component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-hn' , component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-hn' , component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hn' , component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-hn' , component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-hn' , component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hn' , component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-hn' , component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn' , component: UnitCountKtComponent, canActivate: [authGuard] },

            // //kho agv
            // { path: 'inventory-agv-hn' , component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-agv-hn' , component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-agv-hn' , component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-agv-hn' , component: ProductReportNewComponent, canActivate: [authGuard] },
            // // { path: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-agv-hn' , component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-agv-hn' , component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // // { path: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // { path: 'product-location-agv-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },


            // //Sale HCM
            // { path: 'inventory-hcm' , component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-hcm' , component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-hcm' , component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-hcm' , component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-hcm' , component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-hcm' , component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-hcm' , component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-hcm' , component: SearchProductSerialNumberComponent, canActivate: [authGuard] },


            // //Sale demo
            // { path: 'inventory-demo-hcm' , component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-hcm' , component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-hcm' , component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-hcm' , component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hcm' , component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-hcm' , component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-hcm' , component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hcm' , component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-hcm' , component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            // //Sale BẮc ning
            // { path: 'inventory-bn' , component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-bn' , component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-bn' , component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-bn' , component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-bn' , component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-bn' , component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-bn' , component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-bn' , component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //Demo Băc nign
            // { path: 'inventory-demo-bn' , component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-bn' , component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-bn' , component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-bn' , component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-bn' , component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-bn' , component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-bn' , component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-bn' , component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-bn' , component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            // //Sale Đan phương
            // { path: 'inventory-dp' , component: InventoryComponent, canActivate: [authGuard] },
            // { path: 'bill-import-dp' , component: BillImportComponent, canActivate: [authGuard] },
            // { path: 'bill-export-dp' , component: BillExportComponent, canActivate: [authGuard] },
            // { path: 'history-import-export-dp' , component: HistoryImportExportComponent, canActivate: [authGuard] },
            // { path: 'history-borrow-dp' , component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-dp' , component: ReportImportExportComponent, canActivate: [authGuard] },
            // { path: 'product-project-dp' , component: ListProductProjectComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-dp' , component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            // //Demo BĐan phương
            // { path: 'inventory-demo-dp' , component: InventoryDemoComponent, canActivate: [authGuard] },
            // { path: 'bill-import-tech-dp' , component: BillImportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'bill-export-tech-dp' , component: BillExportTechnicalComponent, canActivate: [authGuard] },
            // { path: 'product-report-dp' , component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-dp' , component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            // { path: 'borrow-report-dp' , component: BorrowReportComponent, canActivate: [authGuard] },
            // { path: 'borrow-product-history-dp' , component: BorrowProductHistoryComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-dp' , component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            // // { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            // { path: 'product-qrcode-dp' , component: ProductRtcQrCodeComponent, canActivate: [authGuard] },


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
            { path: 'inventory-hn', component: InventoryNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-hn', component: BillImportNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-hn', component: BillExportNewComponent, canActivate: [authGuard] },
            { path: 'history-import-export-hn', component: HistoryImportExportNewComponent, canActivate: [authGuard] },
            { path: 'history-borrow-hn', component: HistoryBorrowSaleNewComponent, canActivate: [authGuard] },
            { path: 'report-import-export-hn', component: ReportImportExportNewComponent, canActivate: [authGuard] },
            { path: 'product-project-hn', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-hn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //kho demo hn
            { path: 'inventory-demo-hn', component: InventoryDemoNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-hn', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-hn', component: BillExportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'product-report-hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-hn', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-hn', component: HistoryProductRtcComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-hn', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //kho agv
            { path: 'inventory-agv-hn', component: InventoryDemoNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-agv-hn', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-agv-hn', component: BillExportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'product-report-agv-hn', component: ProductReportNewComponent, canActivate: [authGuard] },
            // { path: 'product-export-borrow-hn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-agv-hn', component: BorrowReportComponent, canActivate: [authGuard] },
            { path: 'borrow-product-history-agv-hn', component: HistoryProductRtcComponent, canActivate: [authGuard] },
            // { path: 'search-serialnumber-tech-hn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-agv-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            // { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },


            //Sale HCM
            { path: 'inventory-hcm', component: InventoryNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-hcm', component: BillImportNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-hcm', component: BillExportNewComponent, canActivate: [authGuard] },
            { path: 'history-import-export-hcm', component: HistoryImportExportNewComponent, canActivate: [authGuard] },
            { path: 'history-borrow-hcm', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-hcm', component: ReportImportExportNewComponent, canActivate: [authGuard] },
            { path: 'product-project-hcm', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-hcm', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },


            //Sale demo
            { path: 'inventory-demo-hcm', component: InventoryDemoNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-hcm', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-hcm', component: BillExportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'product-report-hcm', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-hcm', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-hcm', component: BorrowReportComponent, canActivate: [authGuard] },
            //{ path: 'borrow-product-history-hcm', component: HistoryProductRtcComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-hcm', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-hcm', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //Sale BẮc ning
            { path: 'inventory-bn', component: InventoryNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-bn', component: BillImportNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-bn', component: BillExportNewComponent, canActivate: [authGuard] },
            { path: 'history-import-export-bn', component: HistoryImportExportNewComponent, canActivate: [authGuard] },
            //{ path: 'history-borrow-bn', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            { path: 'report-import-export-bn', component: ReportImportExportNewComponent, canActivate: [authGuard] },
            { path: 'product-project-bn', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-bn', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //Demo Băc nign
            { path: 'inventory-demo-bn', component: InventoryDemoNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-bn', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-bn', component: BillExportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'product-report-bn', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-bn', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-bn', component: BorrowReportComponent, canActivate: [authGuard] },
            //{ path: 'borrow-product-history-bn', component: HistoryProductRtcComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-bn', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-hn', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'unit-count-hn', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-bn', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //Sale Đan phương
            { path: 'inventory-dp', component: InventoryNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-dp', component: BillImportNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-dp', component: BillExportNewComponent, canActivate: [authGuard] },
            { path: 'history-import-export-dp', component: HistoryImportExportNewComponent, canActivate: [authGuard] },
            { path: 'history-borrow-dp', component: HistoryBorrowSaleComponent, canActivate: [authGuard] },
            // { path: 'report-import-export-dp', component: ReportImportExportComponent, canActivate: [authGuard] },
            { path: 'report-import-export-dp', component: ReportImportExportNewComponent, canActivate: [authGuard] },
            { path: 'product-project-dp', component: ListProductProjectComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-dp', component: SearchProductSerialNumberComponent, canActivate: [authGuard] },

            //Demo BĐan phương
            { path: 'inventory-demo-dp', component: InventoryDemoNewComponent, canActivate: [authGuard] },
            { path: 'bill-import-tech-dp', component: BillImportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'bill-export-tech-dp', component: BillExportTechnicalNewComponent, canActivate: [authGuard] },
            { path: 'product-report-dp', component: ProductReportNewComponent, canActivate: [authGuard] },
            { path: 'product-export-borrow-dp', component: ProductExportAndBorrowComponent, canActivate: [authGuard] },
            { path: 'borrow-report-dp', component: BorrowReportComponent, canActivate: [authGuard] },
            //{ path: 'borrow-product-history-dp', component: HistoryProductRtcComponent, canActivate: [authGuard] },
            { path: 'search-serialnumber-tech-dp', component: SearchProductTechSerialComponent, canActivate: [authGuard] },
            { path: 'product-location-dp', component: ProductLocationTechnicalComponent, canActivate: [authGuard] },
            { path: 'unit-count-dp', component: UnitCountKtComponent, canActivate: [authGuard] },
            { path: 'product-qrcode-dp', component: ProductRtcQrCodeComponent, canActivate: [authGuard] },

            //Cài đặt
            { path: 'product-location', component: ProductLocationComponent, canActivate: [authGuard] },
            { path: 'firm', component: FirmComponent, canActivate: [authGuard] },
            { path: 'unit-count', component: UnitCountComponent, canActivate: [authGuard] },
            { path: 'product-sale', component: ProductSaleNewComponent, canActivate: [authGuard] },
            { path: 'product-demo', component: ProductRtcComponent, canActivate: [authGuard] },
            { path: 'product-agv', component: ProductRtcComponent, canActivate: [authGuard] },
            { path: 'material-detail-of-product-rtc', component: MaterialDetailOfProductRtcComponent, canActivate: [authGuard] },
            { path: 'chi-tiet-san-pham-sale', component: ChiTietSanPhamSaleComponent, canActivate: [authGuard] },


            //Nhân dự
            { path: 'hr-hiring-request', component: HrhiringRequestComponent, canActivate: [authGuard] },
            { path: 'job-requirement-hr', component: JobRequirementComponent, canActivate: [authGuard] },
            { path: 'proposal-hr', component: HrPurchaseProposalComponent, canActivate: [authGuard] },
            { path: 'document', component: DocumentComponent, canActivate: [authGuard] },
            { path: 'document-common', component: DocumentCommonComponent, canActivate: [authGuard] },
            { path: 'document-common-kt', component: DocumentCommonComponent, canActivate: [authGuard] },
            { path: 'document-common-sale', component: DocumentCommonComponent, canActivate: [authGuard] },
            { path: 'document-common-agv', component: DocumentCommonComponent, canActivate: [authGuard] },
            { path: 'document-common-tkck', component: DocumentCommonComponent, canActivate: [authGuard] },

            { path: 'asset-management', component: TsAssetManagementComponent, canActivate: [authGuard] },
            { path: 'asset-type', component: TsAssetTypeComponent, canActivate: [authGuard] },
            { path: 'asset-source', component: TsAssetSourceComponent, canActivate: [authGuard] },
            { path: 'asset-allocation', component: TsAssetAllocationComponent, canActivate: [authGuard] },
            { path: 'asset-recovery', component: TsAssetRecoveryComponent, canActivate: [authGuard] },
            { path: 'asset-transfer', component: TsAssetTransferComponent, canActivate: [authGuard] },
            { path: 'asset-management-person', component: TsAssetManagementPersonalComponent, canActivate: [authGuard] },
            { path: 'asset-type-person', component: TsAssetManagementPersonalTypeComponent, canActivate: [authGuard] },
            { path: 'asset-allocation-person', component: TsAssetAllocationPersonalComponent, canActivate: [authGuard] },
            { path: 'asset-recovery-person', component: TsAssetRecoveryPersonalNewComponent, canActivate: [authGuard] },
            { path: 'vehicle-management', component: VehicleManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-booking', component: VehicleBookingManagementComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-type', component: VehicleRepairTypeComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-propose', component: ProposeVehicleRepairComponent, canActivate: [authGuard] },
            { path: 'vehicle-repair-history', component: VehicleRepairHistoryComponent, canActivate: [authGuard] },
            { path: 'office-supply', component: OfficeSupplyComponent, canActivate: [authGuard] },
            { path: 'office-supply-unit', component: OfficeSupplyUnitComponent, canActivate: [authGuard] },
            { path: 'office-supply-request', component: OfficeSupplyRequestsComponent, canActivate: [authGuard] },
            { path: 'office-supply-summary', component: OfficeSupplyRequestSummaryComponent, canActivate: [authGuard] },
            { path: 'film-management', component: FilmManagementComponent, canActivate: [authGuard] },
            { path: 'deparment', component: DepartmentComponent, canActivate: [authGuard] },
            { path: 'team', component: TeamComponent, canActivate: [authGuard] },
            { path: 'positions', component: PositionsComponent, canActivate: [authGuard] },
            { path: 'employee', component: EmployeeComponent, canActivate: [authGuard] },
            { path: 'contract', component: ContractComponent, canActivate: [authGuard] },
            { path: 'handover', component: HandoverComponent, canActivate: [authGuard] },
            { path: 'holiday', component: HolidayComponent, canActivate: [authGuard] },
            { path: 'food-order-hr', component: FoodOrderComponent, canActivate: [authGuard] },
            { path: 'dayoff-hr', component: DayOffComponent, canActivate: [authGuard] },
            { path: 'early-late-hr', component: EarlyLateComponent, canActivate: [authGuard] },
            { path: 'overtime-hr', component: OverTimeComponent, canActivate: [authGuard] },
            { path: 'bussiness-hr', component: EmployeeBussinessComponent, canActivate: [authGuard] },
            { path: 'nightshift-hr', component: EmployeeNightShiftComponent, canActivate: [authGuard] },
            { path: 'wfh-hr', component: WFHComponent, canActivate: [authGuard] },
            { path: 'nofinger-hr', component: EmployeeNoFingerprintComponent, canActivate: [authGuard] },
            { path: 'attendance-hr', component: EmployeeAttendanceComponent, canActivate: [authGuard] },
            { path: 'curricular-hr', component: EmployeeCurricularComponent, canActivate: [authGuard] },
            { path: 'payroll-hr', component: PayrollComponent, canActivate: [authGuard] },
            { path: 'timekeeping-hr', component: EmployeeTimekeepingComponent, canActivate: [authGuard] },
            { path: 'synthetic-hr', component: EmployeeSyntheticComponent, canActivate: [authGuard] },
            { path: 'dailyreport-hr', component: DailyReportHrComponent, canActivate: [authGuard] },
            { path: 'protect-gear-hr', component: ProtectgearComponent, canActivate: [authGuard] },
            { path: 'phase-allocation-hr', component: PhaseAllocationPersonComponent, canActivate: [authGuard] },
            { path: 'workplan-summary', component: WorkplanSummaryComponent, canActivate: [authGuard] },

            { path: 'bill-import-qc', component: BillImportQcComponent, canActivate: [authGuard] },

            { path: 'newsletter', component: NewsletterComponent, canActivate: [authGuard] },
            { path: 'newsletter-type', component: NewsletterTypeComponent, canActivate: [authGuard] },
            { path: 'newsletter-view-all', component: NewsletterFormViewAllComponent, canActivate: [authGuard] },

            { path: 'document-sale-admin', component: DocumentSaleAdminComponent, canActivate: [authGuard] },
            { path: 'inventory-borrow-ncc', component: InventoryBorrowNCCComponent, canActivate: [authGuard] },


            // COURSE
            { path: 'course-management', component: CourseManagementComponent, canActivate: [authGuard] },

            { path: 'chi-tiet-san-pham-sale', component: ChiTietSanPhamSaleComponent, canActivate: [authGuard] },

            // //Quản lý lỗi phòng Kỹ thuật
            { path: 'kpi-error', component: KpiErrorComponent, canActivate: [authGuard] },
            { path: 'kpi-error-employee', component: KpiErrorEmployeeComponent, canActivate: [authGuard] },
            { path: 'kpi-error-employee-summary-max', component: KpiErrorEmployeeSummaryMaxComponent, canActivate: [authGuard] },
            { path: 'summary-kpi-error-employee-month', component: SummaryKpiErrorEmployeeMonthComponent, canActivate: [authGuard] },
            // { path: 'summary-kpi-error-employee', component: SummaryKpiErrorEmployeeComponent, canActivate: [authGuard] },

            { path: 'inventoryaa', component: InventoryComponent, canActivate: [authGuard] },
        ],
    },
];
