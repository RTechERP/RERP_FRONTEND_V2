import { ProjectPartListPurchaseRequestSlickGridComponent } from './../../../purchase/project-partlist-purchase-request/project-part-list-purchase-request-slick-grid/project-part-list-purchase-request-slick-grid.component';
import { Injectable, Type } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
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
// import { RecommendSupplierComponent } from '../../../hrm/recommend-supplier/recommend-supplier.component';
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
import { SummaryOfExamResultsComponent } from '../../../Course/summary-of-exam-results/summary-of-exam-results.component';
import { EarlyLateSummaryComponent } from '../../../hrm/early-late/early-late-summary/early-late-summary.component';
import { WFHSummaryComponent } from '../../../hrm/employee-management/employee-wfh/WFH-summary/wfh-summary.component';
import { EmployeeNoFingerSummaryComponent } from '../../../hrm/employee-management/employee-no-fingerprint/employee-no-finger-summary/employee-no-finger-summary.component';
import { EmployeeNightShiftPersonSummaryComponent } from '../../../hrm/employee-management/employee-night-shift/employee-night-shift-person-summary/employee-night-shift-person-summary.component';
import { EmployeeBussinessPersonSummaryComponent } from '../../../hrm/employee-management/employee-bussiness/employee-bussiness-person-summary/employee-bussiness-person-summary.component';
import { CourseTypeComponent } from '../../../Course/course-type/course-type.component';
import { JobRequirementComponent } from '../../../hrm/job-requirement/job-requirement.component';
import { SummaryEmployeeComponent } from '../../../hrm/employee/summary-employee/summary-employee.component';
import { WorkplanComponent } from '../../../person/workplan/workplan.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { DailyReportSaleAdminComponent } from '../../../old/KPISale/daily-report-sale-admin/daily-report-sale-admin.component';
import { EmployeeRegisterBussinessComponent } from '../../../hrm/employee-management/employee-bussiness/employee-register-bussiness/employee-register-bussiness.component';
import { DailyReportTechComponent } from '../../../DailyReportTech/daily-report-tech/daily-report-tech.component';
import { PaymentOrderComponent } from '../../../general-category/payment-order/payment-order.component';
import { OverTimePersonComponent } from '../../../hrm/over-time/over-time-person/over-time-person.component';
import { ProjectPartlistPurchaseRequestNewComponent } from '../../../purchase/project-partlist-purchase-request-new/project-partlist-purchase-request-new.component';
import { RegisterIdeaComponent } from '../../../hrm/register-idea/register-idea.component';
import { TrackingMarksComponent } from '../../../hrm/tracking-marks/tracking-marks.component';
import { VehicleBookingManagementComponent } from '../../../hrm/vehicle/vehicle-booking-management/vehicle-booking-management.component';

import { EmployeeSyntheticPersonalComponent } from '../../../hrm/employee-management/employee-synthetic/employee-synthetic-personal/employee-synthetic-personal.component';
import { BookingRoomComponent } from '../../../hrm/booking room/booking-room.component';
import { RegisterContractComponent } from '../../../person/register-contract/register-contract.component';
import { ApproveTpComponent } from '../../../person/approve-tp/approve-tp/approve-tp.component';
import { PhaseAllocationPersonComponent } from '../../../hrm/phase-allocation-person/phase-allocation-person.component';
import { UnitCountKtComponent } from '../../../old/inventory-demo/unit-count-kt/unit-count-kt.component';
import { PonccNewComponent } from '../../../purchase/poncc-new/poncc-new.component';

import { DailyReportThrComponent } from '../../../daily-report-thr/daily-report-thr.component';
import { DailyReportLXCPComponent } from '../../../daily-report-lxcp/daily-report-lxcp.component';
import { DailyReportMachineComponent } from '../../../daily-report-machine/daily-report-machine.component';
import { DailyReportMarComponent } from '../../../daily-report-mar/daily-report-mar.component';
import { EmployeeContactComponent } from '../../../hrm/employee/employee-contact/employee-contact.component';
import { OverTimeSummaryPersonComponent } from '../../../hrm/over-time/over-time-summary-person/over-time-summary-person.component';
import { MenuAppComponent } from '../../menu-app/menu-app.component';
import { HistoryExportAccountantComponent } from '../../../accounting/history-export-accountant/history-export-accountant.component';
import { HistoryApprovedBillLogComponent } from '../../../accounting/history-approved-bill-log/history-approved-bill-log.component';
import { InventoryByDateComponent } from '../../../accounting/inventory-by-date/inventory-by-date.component';
import { AccountingContractTypeMasterComponent } from '../../../accounting/accounting-contract-type-master/accounting-contract-type-master.component';
import { AccountingContractComponent } from '../../../accounting/accounting-contract/accounting-contract.component';
import { MenuAppService } from '../../menu-app/menu-app.service';
import { WelcomeComponent } from '../../../old/welcome/welcome.component';
import { buildComponentRegistry } from '../component-registry';
import { routes } from '../../../../app.routes';

@Injectable({
    providedIn: 'root',
})
export class MenuService {
    private apiUrl = environment.host + 'api/menu/';
    //   private apiUrl = HOST + 'api/menu/';

    private componentRegistry!: Record<string, any>;
    constructor(
        private http: HttpClient,
        private permissionService: PermissionService,
        private appUserService: AppUserService,
        private notification: NzNotificationService,
        public menuAppService: MenuAppService,
    ) {
        this.componentRegistry = buildComponentRegistry(routes);
    }

    private menuKeySource = new BehaviorSubject<string>('');
    menuKey$ = this.menuKeySource.asObservable();

    departmentTechs: any[] = [2, 11, 12, 13];
    departmentAgvCokhis = [9, 10];
    departmentLapraps = [23];
    departmentSales = [3, 12];
    departmentHRs = [6];
    employeeHRs = [586];

    positinLXs = [6]; //List chức vụ NV lái xe
    positinCPs = [7, 72]; //List chức vụ NV cắt phim
    departmentMarketings = [8];

    userAllReportTechs = [
        1, 23, 24, 78, 88, 1221, 1313, 1434, 1431, 53, 51, 1534,
    ];

    employeeSaleHCMs = [
        29, 42, 341, 641
    ];

    departmentBODs = [22];



    setMenuKey(value: string) {
        // console.log(value);
        this.menuKeySource.next(value);
    }


    getCompMenus(menukey: string): Observable<MenuItem[]> {
        let id = this.appUserService.currentUser?.ID || 0;
        let employeeID = this.appUserService.currentUser?.EmployeeID || 0;
        let departmentID = this.appUserService.currentUser?.DepartmentID || 0;
        let positionID = this.appUserService.currentUser?.PositionID || 0;
        let isHR =
            this.employeeHRs.includes(employeeID) ||
            this.departmentHRs.includes(departmentID);

        const permissions: any[] = this.appUserService.currentUser?.Permissions.split(',') || [];

        const isAdmin =
            this.appUserService.currentUser?.IsAdmin ||
            permissions.includes("N1");

        // console.log("this.appUserService.currentUser?.IsAdmin:", this.appUserService.currentUser?.IsAdmin);
        // console.log("this.appUserService.currentUser?.Permissions:", permissions);

        return this.menuAppService.getAll().pipe(
            map((response: any) => {
                const mapMenu = new Map<number, MenuItem>();
                let menus: MenuItem[] = [];

                response.data.menus.forEach((item: any) => {
                    const childrens = response.data.menus.filter((x: any) => x.ParentID == item.ID);

                    let isPermission = item.IsPermission;

                    //Nếu là AGV-Cơ khí
                    if (item.Router == 'daily-report-machine') {
                        isPermission = isAdmin ||
                            this.departmentAgvCokhis.includes(departmentID) ||
                            this.userAllReportTechs.includes(id);
                    }

                    //nếu là sale
                    if (item.Router == 'daily-report-sale-admin' || item.Router == 'daily-report-sale' || item.Code == 'M66') {
                        isPermission = isAdmin || this.departmentSales.includes(departmentID) || this.employeeSaleHCMs.includes(employeeID);
                    }

                    //Nếu là Kỹ thuật
                    if (item.Router == 'daily-report-tech') {
                        isPermission = isAdmin ||
                            this.departmentTechs.includes(departmentID) ||
                            this.userAllReportTechs.includes(id);
                    }

                    //Nếu là HR
                    if (item.Router == 'daily-report-thr' || item.Router == 'daily-report-lxcp' || item.Code == 'M70') {
                        isPermission = isAdmin ||
                            isHR ||
                            this.positinCPs.includes(positionID) ||
                            this.positinLXs.includes(positionID);
                    }

                    //Nếu là lắp rap
                    if (item.Router == 'daily-report-lr') {
                        isPermission = isAdmin ||
                            this.departmentLapraps.includes(departmentID) ||
                            this.userAllReportTechs.includes(id);
                    }

                    //Nếu là MKT
                    if (item.Router == 'daily-report-mkt') {
                        isPermission = isAdmin || this.departmentMarketings.includes(departmentID);
                    }

                    //Nếu là BOD
                    if (item.Router == 'daily-report-bod') {
                        isPermission = isAdmin || this.departmentBODs.includes(departmentID);
                    }

                    // console.log('isAdmin:', isAdmin);
                    // console.log('this.marketings.includes(departmentID):', this.marketings.includes(departmentID));

                    const menu: MenuItem = {
                        id: item.ID,
                        kind: childrens.length > 0 ? 'group' : 'leaf',
                        key: item.Code,
                        stt: item.STT,
                        title: item.Title,
                        isOpen: item.ParentID > 0 || item.Code == menukey,
                        isPermission: isPermission,
                        icon: `${environment.host}api/share/software/icon/${item.Icon}`,
                        children: [],
                        router: item.Router || '#',
                        data: item.QueryParam ? JSON.parse(item.QueryParam) : {},
                        comp: this.componentRegistry[item.Router]
                    };

                    mapMenu.set(item.ID, menu);
                });

                // build tree
                response.data.menus.forEach((item: any) => {
                    const node = mapMenu.get(item.ID)!;

                    if (item.ParentID && mapMenu.has(item.ParentID)) {
                        const parent = mapMenu.get(item.ParentID)!;

                        if (parent.kind === 'group') {
                            parent.children.push(node);
                        }
                    } else {
                        menus.push(node);
                    }

                });

                // sort theo stt
                menus = this.sortBySTTImmutable(menus);
                // console.log('this.sortBySTTImmutable(menus):', this.sortBySTTImmutable(menus));
                // console.log('menus', menus);

                return menus;
            })
        );
    }


    isGroupItem(item: MenuItem): item is GroupItem {
        return item.kind === 'group';
    }

    sortBySTTImmutable(items: MenuItem[]): MenuItem[] {
        if (!Array.isArray(items)) {
            return [];
        }


        // console.log('items sort:', items);
        const menus: MenuItem[] = [...items]
            .sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0))
            .map(item => {
                if (item.kind !== 'group') {
                    return { ...item };
                }

                return {
                    ...item,
                    children: this.sortBySTTImmutable(item.children)
                };
            });

        // const a = [...items]
        //     .sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0))
        //     .map(item => {
        //         if (item.kind !== 'group') {
        //             return { ...item };
        //         }

        //         return {
        //             ...item,
        //             children: this.sortBySTTImmutable(item.children)
        //         };
        //     });

        // console.log('menus a:', a);
        // console.log('menus sort:', menus);
        return menus;
    }

}
type BaseItem = {
    id?: number,
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
