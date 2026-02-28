import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    Optional,
    Inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { EnvironmentInjector } from '@angular/core';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { KhoBaseService } from '../kho-base-service/kho-base.service';
import { FollowProjectBaseDetailComponent } from '../follow-project-base/follow-project-base-detail/follow-project-base-detail.component';
import { ImportExcelComponent } from '../follow-project-base/import-excel/import-excel.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AppUserService } from '../../../../../services/app-user.service';
import { IUser } from '../../../../../models/user.interface';
import { ActivatedRoute } from '@angular/router';
import { Menubar } from 'primeng/menubar';

@Component({
    selector: 'app-follow-project-base-slickgrid',
    imports: [
        NzCardModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzRadioModule,
        NzSpaceModule,
        NzLayoutModule,
        NzFlexModule,
        NzDrawerModule,
        NzDropDownModule,
        NzSplitterModule,
        NzGridModule,
        NzDatePickerModule,
        NzAutocompleteModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule,
        NzTableModule,
        NzSpinModule,
        NzTreeSelectModule,
        NzModalModule,
        CommonModule,
        HasPermissionDirective,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './follow-project-base-slickgrid.component.html',
    styleUrl: './follow-project-base-slickgrid.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FollowProjectBaseSlickgridComponent implements OnInit, AfterViewInit, OnDestroy {

    private static gridInstanceSeq = 0;
    private readonly gridInstanceId = ++FollowProjectBaseSlickgridComponent.gridInstanceSeq;

    // Grid IDs
    gridFollowProjectId: string = 'gridFollowProject';
    gridForSaleId: string = 'gridForSale';
    gridForPMId: string = 'gridForPM';

    // SlickGrid: Main follow project grid
    angularGridFollowProject!: AngularGridInstance;
    columnDefinitionsFollowProject: Column[] = [];
    gridOptionsFollowProject: GridOption = {};
    datasetFollowProject: any[] = [];

    // SlickGrid: Sale detail grid
    angularGridForSale!: AngularGridInstance;
    columnDefinitionsForSale: Column[] = [];
    gridOptionsForSale: GridOption = {};
    datasetForSale: any[] = [];

    // SlickGrid: PM detail grid
    angularGridForPM!: AngularGridInstance;
    columnDefinitionsForPM: Column[] = [];
    gridOptionsForPM: GridOption = {};
    datasetForPM: any[] = [];

    // Menu
    menuBars: any[] = [];

    // Loading states
    isLoadingFollowProject: boolean = false;
    isLoadingForSale: boolean = false;
    isLoadingForPM: boolean = false;

    // Data
    selectedFollowProject = new Set<any>();
    selectedId: number = 0;
    selectedRow: any = null;

    isAdmin: boolean = false;
    isAdminSale: number = 0;
    currentUserId: number = 0;
    getUserSaleResult: number = 0;
    currentUser: IUser | null = null;

    groupSaleUser: any[] = [];
    customers: any[] = [];
    employees: any[] = [];
    users: any[] = [];

    warehouseID: number = 0;

    // Filters
    filters: any = {
        startDate: '',
        endDate: '',
        filterText: '',
        user: 0,
        customerID: 0,
        pm: 0,
        groupSaleID: 0,
        pageNumber: 1,
        pageSize: 20,
    };

    totalPage: number = 1;
    readonly pageSizeOptions: number[] = [20, 50, 100, 200, 500, 1000, 10000];

    private queryParamsSubscription?: Subscription;
    private isInitialized: boolean = false;

    constructor(
        private injector: EnvironmentInjector,
        private appRef: ApplicationRef,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private khoBaseService: KhoBaseService,
        private appUserService: AppUserService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    //#region Menubar
    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => { this.handleAction('create'); }
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => { this.handleAction('update'); }
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => { this.handleAction('delete'); }
            },
            {
                label: 'Nhập Excel',
                icon: 'fa-solid fa-file-import fa-lg text-success',
                command: () => { this.handleAction('importexcel'); }
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => { this.handleAction('exportexcel'); }
            },
        ];
    }
    //#endregion

    //#region Lifecycle
    ngOnInit(): void {
        this.initMenuBar();

        const startDate = DateTime.fromJSDate(new Date(2019, 0, 1));
        const endDate = DateTime.local();

        this.filters.startDate = startDate.toFormat('yyyy-MM-dd');
        this.filters.endDate = endDate.toFormat('yyyy-MM-dd');

        this.isAdmin = this.appUserService.isAdmin;
        this.currentUser = this.appUserService.currentUser;
        this.isAdminSale = this.currentUser?.IsAdminSale || 0;
        this.currentUserId = this.currentUser?.ID || 0;

        if (this.currentUserId > 0) {
            this.getUserSale(this.currentUserId);
        }

        const warehouseId =
            this.tabData?.warehouseID
            ?? this.route.snapshot.queryParams['warehouseId']
            ?? 1;
        const gridSuffix = `${warehouseId}-${this.gridInstanceId}`;
        this.gridFollowProjectId = `gridFollowProject-${gridSuffix}`;
        this.gridForSaleId = `gridForSale-${gridSuffix}`;
        this.gridForPMId = `gridForPM-${gridSuffix}`;

        // Init SlickGrids
        this.initGridFollowProject();
        this.initGridForSale();
        this.initGridForPM();

        // Subscribe to queryParams
        this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
            const wId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 1;

            if (!this.isInitialized && !wId) return;

            const newWarehouseId = wId || 1;

            if (!this.isInitialized || this.warehouseID !== newWarehouseId) {
                this.warehouseID = newWarehouseId;

                if (!this.isInitialized) {
                    this.getGroupSaleUser();
                    this.getUsers();
                    this.getEmployee();
                    this.getCustomerBase();
                    this.isInitialized = true;
                    this.loadFollowProjectData();
                } else {
                    this.loadFollowProjectData();
                }
            }
        });
    }

    ngAfterViewInit(): void { }

    ngOnDestroy(): void {
        this.queryParamsSubscription?.unsubscribe();
    }
    //#endregion

    //#region Data loading
    formatDate(date: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate()) + ' ' +
            pad(date.getHours()) + ':' +
            pad(date.getMinutes()) + ':' +
            pad(date.getSeconds());
    }

    toNzTree(data: any[]): NzTreeNodeOptions[] {
        return data.map(item => ({
            title: `${item.FullName} - ${item.GroupSalesName}  `,
            key: item.ID.toString(),
            value: item.ID,
            expanded: true,
            children: item._children ? this.toNzTree(item._children) : []
        }));
    }

    getGroupSaleUser() {
        this.khoBaseService.getGroupSalesUserByUserId(this.currentUserId).subscribe({
            next: (response: any) => {
                const model = response.data || {};
                let groupID = 0;
                let teamID = 0;

                if (model.ID > 0) {
                    groupID = model.GroupSalesID || 0;
                }

                if (model.ParentID === 0) {
                    teamID = model.ID || 0;
                } else {
                    teamID = model.ParentID || 0;
                }

                if (this.isAdminSale === 1 || this.isAdmin) {
                    groupID = 0;
                    teamID = 0;
                }

                this.khoBaseService.getGroupSaleUser({ groupID, teamID }).subscribe({
                    next: (res: any) => {
                        this.groupSaleUser = this.toNzTree(this.khoBaseService.setDataTree(res.data, "ID"));

                        if (model.ParentID === 0 && model.ID > 0) {
                            this.filters.groupSaleID = model.ID.toString();
                        } else if (model.ParentID > 0) {
                            const found = res.data?.find((x: any) => x.ID === model.ParentID);
                            if (found) {
                                this.filters.groupSaleID = found.ID.toString();
                            }
                        }
                    },
                    error: () => {
                        this.notification.create('error', 'Thông báo', 'Lỗi load nhóm groupSaleUser!');
                    }
                });
            },
            error: () => {
                this.khoBaseService.getGroupSaleUser({ groupID: 0, teamID: 0 }).subscribe({
                    next: (res: any) => {
                        this.groupSaleUser = this.toNzTree(this.khoBaseService.setDataTree(res.data, "ID"));
                    },
                    error: () => {
                        this.notification.create('error', 'Thông báo', 'Lỗi load nhóm groupSaleUser!');
                    }
                });
            }
        });
    }

    getUsers() {
        this.khoBaseService.getUsers().subscribe({
            next: (response: any) => {
                this.users = response.data;
                if (this.getUserSaleResult == 3 || this.getUserSaleResult == 0) {
                    this.filters.user = this.currentUserId;
                }
            },
            error: () => {
                this.notification.create('error', 'Thông báo', 'Lỗi load users!');
            }
        });
    }

    getEmployee() {
        this.khoBaseService.getEmployee(-1).subscribe({
            next: (response: any) => {
                this.employees = this.khoBaseService.createdDataGroup(response.data, "DepartmentName");
                if (this.getUserSaleResult == 2 || this.getUserSaleResult == 0) {
                    this.filters.pm = this.currentUser?.EmployeeID || 0;
                }
            },
            error: () => {
                this.notification.create('error', 'Thông báo', 'Lỗi load getEmployee!');
            }
        });
    }

    getCustomerBase() {
        this.khoBaseService.getCustomerBase().subscribe({
            next: (response: any) => {
                this.customers = response.data;
            },
            error: () => {
                this.notification.create('error', 'Thông báo', 'Lỗi load customers!');
            }
        });
    }

    getUserSale(userId: number) {
        this.khoBaseService.getUserSale(userId, this.isAdmin, this.isAdminSale).subscribe({
            next: (response: any) => {
                this.getUserSaleResult = response.data;
            },
            error: () => {
                this.notification.create('error', 'Thông báo', 'Lỗi load getUserSale!');
            }
        });
    }

    getFollowProjectBaseDetail(followProjectBaseID: number, projectID: number) {
        this.isLoadingForSale = true;
        this.isLoadingForPM = true;
        this.khoBaseService.getFollowProjectBaseDetail(followProjectBaseID, projectID).subscribe({
            next: (response: any) => {
                if (response.status == 1) {
                    this.datasetForSale = (response.dataSale || []).map((item: any, idx: number) => ({
                        ...item,
                        id: `${item.UserID}_${idx}`
                    }));
                    this.datasetForPM = (response.dataPM || []).map((item: any, idx: number) => ({
                        ...item,
                        id: `${item.UserID}_${idx}`
                    }));
                }
                this.isLoadingForSale = false;
                this.isLoadingForPM = false;
            },
            error: () => {
                this.isLoadingForSale = false;
                this.isLoadingForPM = false;
                this.notification.create('error', 'Thông báo', 'Lỗi load chi tiết!');
            }
        });
    }

    loadFollowProjectData(): void {
        this.isLoadingFollowProject = true;

        const formatDateStr = (dateStr: string, isStartDate: boolean = true): string => {
            const dt = DateTime.fromISO(dateStr);
            const adjusted = isStartDate ? dt.startOf('day') : dt.endOf('day');
            return adjusted.toISO() || '';
        };

        const startDate = this.filters.startDate || DateTime.local().toFormat('yyyy-MM-dd');
        const endDate = this.filters.endDate || DateTime.local().toFormat('yyyy-MM-dd');

        if (this.getUserSaleResult == 2 || this.getUserSaleResult == 0) {
            // pm override logic preserved from original
        }

        const params: any = {
            dateStart: formatDateStr(startDate, true),
            dateEnd: formatDateStr(endDate, false),
            filterText: this.filters.filterText || '',
            user: this.filters.user || 0,
            customerID: this.filters.customerID || 0,
            pm: this.filters.pm || 0,
            warehouseID: this.warehouseID || 1,
            groupSaleID: this.filters.groupSaleID || 0,
            page: this.filters.pageNumber || 1,
            size: this.filters.pageSize || 20,
        };

        this.khoBaseService.getFollowProjectBaseData(params).subscribe({
            next: (response: any) => {
                // Update pagination
                const apiTotalPage = Number(response?.totalPage);
                this.totalPage = Number.isFinite(apiTotalPage) && apiTotalPage > 0 ? apiTotalPage : 1;
                const currentPage = Number(this.filters?.pageNumber) || 1;
                if (currentPage > this.totalPage) this.filters.pageNumber = this.totalPage;
                if (currentPage < 1) this.filters.pageNumber = 1;

                if (response.data && Array.isArray(response.data)) {
                    this.datasetFollowProject = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: `${item.ID}_${index}`
                    }));
                } else {
                    this.datasetFollowProject = [];
                }

                this.isLoadingFollowProject = false;
                setTimeout(() => {
                    this.applyDistinctFiltersToGrid(this.angularGridFollowProject, this.columnDefinitionsFollowProject, ['FullName', 'ProjectManager', 'CustomerName', 'EndUser', 'ProjectStatusName', 'ProjectTypeName', 'FirmName', 'FirmPossibilityPOName']);
                }, 0);
            },
            error: (error: any) => {
                this.isLoadingFollowProject = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu follow project: ' + error);
            }
        });
    }
    //#endregion

    //#region Pagination
    searchFollowProject() {
        this.filters.pageNumber = 1;
        this.selectedFollowProject.clear();
        this.selectedId = 0;
        this.selectedRow = null;
        this.datasetForSale = [];
        this.datasetForPM = [];
        this.loadFollowProjectData();
    }

    prevPage(): void {
        const current = Number(this.filters.pageNumber) || 1;
        if (current <= 1) return;
        this.filters.pageNumber = current - 1;
        this.loadFollowProjectData();
    }

    nextPage(): void {
        const current = Number(this.filters.pageNumber) || 1;
        if (current >= this.totalPage) return;
        this.filters.pageNumber = current + 1;
        this.loadFollowProjectData();
    }

    goToPage(page: number): void {
        const next = Math.min(Math.max(Number(page) || 1, 1), this.totalPage || 1);
        this.filters.pageNumber = next;
        this.loadFollowProjectData();
    }

    onPageSizeChange(size: number): void {
        const nextSize = Number(size) || 20;
        this.filters.pageSize = nextSize;
        this.filters.pageNumber = 1;
        this.loadFollowProjectData();
    }

    refresh() {
        this.filters.startDate = DateTime.fromJSDate(new Date(2019, 0, 1)).toFormat('yyyy-MM-dd');
        this.filters.endDate = DateTime.local().toFormat('yyyy-MM-dd');
        this.filters.filterText = '';
        this.filters.user = 0;
        this.filters.customerID = 0;
        this.filters.pm = 0;
        this.filters.groupSaleID = 0;
        this.filters.pageNumber = 1;
        this.selectedFollowProject.clear();
        this.selectedId = 0;
        this.selectedRow = null;
        this.datasetForSale = [];
        this.datasetForPM = [];
        this.loadFollowProjectData();
    }
    //#endregion

    //#region Actions
    handleAction(action: string) {
        if (action == 'create') {
            const modalRef = this.modalService.open(FollowProjectBaseDetailComponent, {
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
            });
            modalRef.componentInstance.warehouseID = this.warehouseID;
            modalRef.result.finally(() => {
                this.selectedFollowProject.clear();
                this.selectedId = 0;
                this.selectedRow = null;
                this.loadFollowProjectData();
            });
            return;
        }
        if (action == 'update') {
            if (!this.selectedRow) {
                this.notification.create('warning', 'Thông báo', 'Vui lòng chọn 1 dự án để xem chi tiết!');
                return;
            }
            const modalRef = this.modalService.open(FollowProjectBaseDetailComponent, {
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
            });
            modalRef.componentInstance.FollowProject = this.selectedRow;
            modalRef.componentInstance.warehouseID = this.warehouseID;
            modalRef.result.finally(() => {
                this.selectedFollowProject.clear();
                this.selectedId = 0;
                this.selectedRow = null;
                this.loadFollowProjectData();
            });
            return;
        }
        if (action == 'delete') {
            if (!this.selectedRow) {
                this.notification.create('warning', 'Thông báo', 'Vui lòng chọn 1 dự án để xóa!');
                return;
            }
            this.modal.confirm({
                nzTitle: 'Xác nhận',
                nzContent: 'Bạn có chắc chắn muốn xóa dự án <b>' + this.selectedRow.ProjectName + '</b> không?',
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzOkDanger: true,
                nzOnOk: () => {
                    let object = {
                        ID: this.selectedRow.ID,
                        IsDeleted: true
                    }
                    this.khoBaseService.postSaveFollowProjectBase(object).subscribe({
                        next: (response: any) => {
                            if (response.status == 1) {
                                this.notification.create('success', 'Thông báo', 'Xóa thành công!');
                                this.selectedFollowProject.clear();
                                this.selectedId = 0;
                                this.selectedRow = null;
                                this.loadFollowProjectData();
                            } else {
                                this.notification.create('error', 'Thông báo', response.message);
                            }
                        },
                        error: () => {
                            this.notification.create('error', 'Thông báo', 'Lỗi xóa dữ liệu!');
                        }
                    });
                },
                nzCancelText: 'Hủy',
            });
            return;
        }
        if (action == 'importexcel') {
            const modalRef = this.modalService.open(ImportExcelComponent, {
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                size: 'xl'
            });
            modalRef.result.finally(() => {
                this.selectedFollowProject.clear();
                this.selectedId = 0;
                this.selectedRow = null;
                this.loadFollowProjectData();
            });
            return;
        }
        if (action == 'exportexcel') {
            this.exportExcelFromAPI();
            return;
        }
    }
    //#endregion

    //#region Export Excel
    exportExcelFromAPI() {
        const selectedRow = this.selectedRow;
        const followProjectBaseID = selectedRow?.ID || 0;
        const projectID = selectedRow?.ProjectID || 0;

        let fileNameElement = '';
        if (this.filters.user && this.filters.user > 0) {
            const userObj = this.users.find(u => u.ID === this.filters.user);
            fileNameElement = userObj?.FullName || '';
        } else if (this.filters.pm && this.filters.pm > 0) {
            const pmObj = this.employees.flatMap(e => e.options).find((o: any) => o.item.ID === this.filters.pm);
            fileNameElement = pmObj?.item?.FullName || '';
        } else if (this.filters.customerID && this.filters.customerID > 0) {
            const customerObj = this.customers.find(c => c.ID === this.filters.customerID);
            fileNameElement = customerObj?.CustomerName || '';
        }

        const params = {
            followProjectBaseID: followProjectBaseID,
            projectID: projectID,
            userID: this.filters.user,
            customerID: this.filters.customerID,
            pm: this.filters.pm,
            warehouseID: this.warehouseID,
            filterText: this.filters.filterText,
            fileNameElement: fileNameElement
        };

        this.notification.info('Thông báo', 'Đang xuất file Excel...', { nzDuration: 2000 });

        this.khoBaseService.exportFollowProjectBaseExcel(params).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const fileName = `FollowProject_${fileNameElement}_${new Date().toISOString().slice(2, 10).split('-').reverse().join('')}.xlsx`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
            },
            error: (err: any) => {
                this.notification.error('Thông báo', 'Lỗi khi xuất Excel: ' + (err.error?.message || err.message || 'Vui lòng thử lại'));
            }
        });
    }
    //#endregion

    //#region SlickGrid formatters
    dateFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        if (!value) return '';
        try {
            return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
        } catch {
            return value;
        }
    }

    commonTooltipFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        const displayVal = value ?? '';
        return `<span title="${displayVal}">${displayVal}</span>`;
    }

    // Helper function to escape HTML special characters for title attributes
    private escapeHtml(text: string | null | undefined): string {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    //#endregion

    //#region SlickGrid init
    initGridFollowProject(): void {
        this.columnDefinitionsFollowProject = [
            // THÔNG TIN DỰ ÁN
            { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'ProjectName', name: 'Tên dự án', field: 'ProjectName', width: 250, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'FullName', name: 'Sale phụ trách', field: 'FullName', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'ProjectManager', name: 'PM', field: 'ProjectManager', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'CustomerName', name: 'Đối tác(KH)', field: 'CustomerName', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'EndUser', name: 'End User', field: 'EndUser', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'ProjectStatusName', name: 'Trạng thái', field: 'ProjectStatusName', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'ProjectStartDate', name: 'Ngày bắt đầu', field: 'ProjectStartDate', width: 120, minWidth: 100, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'ProjectTypeName', name: 'Loại dự án', field: 'ProjectTypeName', width: 120, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'FirmName', name: 'Hãng', field: 'FirmName', width: 120, minWidth: 80, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN' },
            { id: 'FirmPossibilityPOName', name: 'Khả năng có PO', field: 'FirmPossibilityPOName', width: 140, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption }, columnGroup: 'THÔNG TIN DỰ ÁN', cssClass: 'column-group-border-right', headerCssClass: 'column-group-border-right' },
            // DỰ KIẾN
            { id: 'ExpectedPlanDate', name: 'Ngày lên phương án', field: 'ExpectedPlanDate', width: 150, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'DỰ KIẾN' },
            { id: 'ExpectedQuotationDate', name: 'Ngày báo giá', field: 'ExpectedQuotationDate', width: 150, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'DỰ KIẾN' },
            { id: 'ExpectedPODate', name: 'Ngày PO', field: 'ExpectedPODate', width: 130, minWidth: 100, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'DỰ KIẾN' },
            { id: 'ExpectedProjectEndDate', name: 'Ngày kết thúc DA', field: 'ExpectedProjectEndDate', width: 160, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center column-group-border-right', headerCssClass: 'column-group-border-right', columnGroup: 'DỰ KIẾN' },
            // THỰC TẾ
            { id: 'RealityPlanDate', name: 'Ngày lên phương án', field: 'RealityPlanDate', width: 150, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'THỰC TẾ' },
            { id: 'RealityQuotationDate', name: 'Ngày báo giá', field: 'RealityQuotationDate', width: 150, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'THỰC TẾ' },
            { id: 'RealityPODate', name: 'Ngày PO', field: 'RealityPODate', width: 130, minWidth: 100, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'THỰC TẾ' },
            { id: 'RealityProjectEndDate', name: 'Ngày kết thúc DA', field: 'RealityProjectEndDate', width: 160, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center column-group-border-right', headerCssClass: 'column-group-border-right', columnGroup: 'THỰC TẾ' },
            // KHÁC
            { id: 'TotalWithoutVAT', name: 'Tổng báo giá chưa VAT', field: 'TotalWithoutVAT', width: 160, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, columnGroup: 'KHÁC' },
            { id: 'ProjectContactName', name: 'Người phụ trách chính', field: 'ProjectContactName', width: 160, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'KHÁC' },
            { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'KHÁC' },
        ];

        this.gridOptionsFollowProject = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-follow-project',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            multiColumnSort: true,
            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
            preHeaderPanelHeight: 35,
        };
    }

    initGridForSale(): void {
        this.columnDefinitionsForSale = [
            { id: 'FullName', name: 'Họ tên', field: 'FullName', width: 200, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'ImplementationDate', name: 'Ngày thực hiện gần nhất', field: 'ImplementationDate', width: 200, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'ExpectedDate', name: 'Ngày dự kiến thực hiện', field: 'ExpectedDate', width: 200, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'WorkDone', name: 'Việc đã làm', field: 'WorkDone', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'Results', name: 'Kết quả mong đợi', field: 'Results', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'ProblemBacklog', name: 'Vấn đề tồn đọng', field: 'ProblemBacklog', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'WorkWillDo', name: 'Kế hoạch tiếp theo', field: 'WorkWillDo', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
        ];

        this.gridOptionsForSale = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-follow-project-sale',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
        };
    }

    initGridForPM(): void {
        this.columnDefinitionsForPM = [
            { id: 'FullName', name: 'Họ tên', field: 'FullName', width: 200, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'ImplementationDate', name: 'Ngày thực hiện gần nhất', field: 'ImplementationDate', width: 200, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'ExpectedDate', name: 'Ngày dự kiến thực hiện', field: 'ExpectedDate', width: 200, minWidth: 120, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'WorkDone', name: 'Việc đã làm', field: 'WorkDone', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'Results', name: 'Kết quả mong đợi', field: 'Results', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'ProblemBacklog', name: 'Vấn đề tồn đọng', field: 'ProblemBacklog', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
            { id: 'WorkWillDo', name: 'Kế hoạch tiếp theo', field: 'WorkWillDo', width: 350, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
        ];

        this.gridOptionsForPM = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-follow-project-pm',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
        };
    }


    private applyDistinctFiltersToGrid(
        angularGrid: AngularGridInstance,
        columnDefinitions: Column[],
        fieldsToFilter: string[]
    ): void {
        if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

        const data = angularGrid.dataView.getItems();
        if (!data || data.length === 0) return;

        const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            dataArray.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        const columns = angularGrid.slickGrid.getColumns();
        if (!columns) return;

        // Update runtime columns
        columns.forEach((column: any) => {
            if (column?.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                column.filter.collection = getUniqueValues(data, field);
            }
        });

        // Update column definitions
        columnDefinitions.forEach((colDef: any) => {
            if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
                const field = colDef.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                colDef.filter.collection = getUniqueValues(data, field);
            }
        });

        angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
    }
    //#endregion

    //#region SlickGrid events
    angularGridReadyFollowProject(angularGrid: AngularGridInstance): void {
        this.angularGridFollowProject = angularGrid;
    }

    angularGridReadyForSale(angularGrid: AngularGridInstance): void {
        this.angularGridForSale = angularGrid;
    }

    angularGridReadyForPM(angularGrid: AngularGridInstance): void {
        this.angularGridForPM = angularGrid;
    }

    onFollowProjectRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedId = item['ID'];
            this.selectedRow = item;
            this.selectedFollowProject.clear();
            this.selectedFollowProject.add(item);
            this.getFollowProjectBaseDetail(item.ID, item.ProjectID);
        }
    }

    onFollowProjectRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedId = item['ID'];
            this.selectedRow = item;
            this.handleAction('update');
        }
    }
    //#endregion
}
