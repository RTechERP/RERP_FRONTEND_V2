import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    IterableDiffers,
    Optional,
    Inject,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
    NzUploadModule,
    NzUploadFile,
    NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    OnEventArgs,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE, ID_ADMIN_SALE_LIST } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';

import { DailyReportSaleService } from '../daily-report-sale/daily-report-sale-service/daily-report-sale.service';
import { DailyReportSaleDetailComponent } from '../daily-report-sale/daily-report-sale-detail/daily-report-sale-detail.component';
import { ImportExcelDailyReportComponent } from '../daily-report-sale/import-excel/import-excel.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-daily-report-sale-slickgrid',
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
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
        NzTabsModule,
        NzModalModule,
        NzUploadModule,
        NzSwitchModule,
        NzCheckboxModule,
        CommonModule,
        HasPermissionDirective,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './daily-report-sale-slickgrid.component.html',
    styleUrl: './daily-report-sale-slickgrid.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DailyReportSaleSlickgridComponent implements OnInit, AfterViewInit {
    // SlickGrid properties
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // PrimeNG Menubar
    menuBars: any[] = [];

    warehouseId: number = 0;

    projects: any[] = [];
    customers: any[] = [];
    employees: any[] = [];
    groupTypes: any[] = [
        { value: 0, label: 'Telesales' },
        { value: 1, label: 'Visit' },
        { value: 2, label: 'Demo/Test SP' },
    ];
    teamSales: any[] = [];
    filterTextSearch: string = '';
    mainData: any[] = [];
    isAdmin: boolean = false;
    isEmployeeIdDisabled: boolean = false;
    selectedRowId: number = 0;
    selectedRow: any = null;
    isGridReady: boolean = false;
    isTeamLoaded: boolean = false;
    needLoadTeam: boolean = false;
    isMobile: boolean = false;

    // Pagination
    totalPage: number = 1;
    readonly pageSizeOptions: number[] = [10, 30, 50, 100, 200, 300, 500];

    filters: any = {
        dateStart: DateTime.local().minus({ months: 1 }).toFormat('yyyy-MM-dd'),
        dateEnd: DateTime.local().toFormat('yyyy-MM-dd'),
        projectId: 0,
        customerId: 0,
        groupTypeId: -1,
        teamId: 0,
        employeeId: 0,
        pageNumber: 1,
        pageSize: 50,
    };

    initMenuBar(): void {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => this.openModal()
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => this.openEditModal()
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => this.onDeleteDailyReportSale()
            },
            {
                label: 'Nhập Excel',
                icon: 'fa-solid fa-file-import fa-lg text-success',
                command: () => this.openImportExcel()
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportExcel()
            },
        ];
    }

    constructor(
        private dailyReportSaleService: DailyReportSaleService,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private modalService: NgbModal,
        private nzModalService: NzModalService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.initMenuBar();
        this.initGrid();

        this.route.queryParams.subscribe(params => {
            // this.warehouseId = params['warehouseId'] || 1
            this.warehouseId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 1;
        });

        // Kiểm tra quyền admin và set employeeId
        const currentUser = this.appUserService.currentUser;
        const currentUserId = this.appUserService.id || 0;
        this.isAdmin = this.appUserService.isAdmin || (currentUser?.IsAdminSale === 1) || this.appUserService.hasPermission('N1') || ID_ADMIN_SALE_LIST.includes(currentUserId);

        // Gọi load-group-sales để kiểm tra nhóm BLESS
        this.dailyReportSaleService.loadGroupSales(currentUserId).subscribe({
            next: (res) => {
                if (res && res.status === 1) {
                    const groupSales = res.data ?? {};
                    const groupCode = (groupSales.GroupSalesCode || '').toLowerCase();
                    if (groupCode === 'bless') {
                        this.isEmployeeIdDisabled = false;
                    } else {
                        this.isEmployeeIdDisabled = !this.isAdmin;
                        if (!this.isAdmin) {
                            if (currentUserId) {
                                this.filters.employeeId = currentUserId;
                            }
                        } else if (currentUser?.IsAdminSale === 1) {
                            const currentEmployeeId = this.appUserService.employeeID;
                            if (currentEmployeeId) {
                                this.needLoadTeam = true;
                                this.loadTeamSaleByEmployee(currentEmployeeId);
                            }
                        }
                    }
                } else {
                    // API lỗi, fallback về logic cũ
                    this.isEmployeeIdDisabled = !this.isAdmin;
                    if (!this.isAdmin && currentUserId) {
                        this.filters.employeeId = currentUserId;
                    } else if (currentUser?.IsAdminSale === 1) {
                        const currentEmployeeId = this.appUserService.employeeID;
                        if (currentEmployeeId) {
                            this.needLoadTeam = true;
                            this.loadTeamSaleByEmployee(currentEmployeeId);
                        }
                    }
                }
            },
            error: () => {
                // Lỗi kết nối, fallback về logic cũ
                this.isEmployeeIdDisabled = !this.isAdmin;
                if (!this.isAdmin && currentUserId) {
                    this.filters.employeeId = currentUserId;
                } else if (currentUser?.IsAdminSale === 1) {
                    const currentEmployeeId = this.appUserService.employeeID;
                    if (currentEmployeeId) {
                        this.needLoadTeam = true;
                        this.loadTeamSaleByEmployee(currentEmployeeId);
                    }
                }
            }
        });

        this.loadProjects();
        this.loadCustomers();
        this.loadEmployees();
        this.loadEmployeeTeamSale();
    }

    ngAfterViewInit(): void {
    }

    searchData(): void {
        this.filters.pageNumber = 1;
        this.loadData();
    }

    loadProjects(): void {
        this.dailyReportSaleService.getProjects().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.projects = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách dự án');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách dự án');
                console.error('Error loading projects:', error);
            }
        );
    }

    loadCustomers(): void {
        this.dailyReportSaleService.getCustomers().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.customers = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách khách hàng');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách khách hàng');
                console.error('Error loading customers:', error);
            }
        );
    }

    loadEmployees(): void {
        this.dailyReportSaleService.getEmployees().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.employees = (response.data || []).filter((item: any) => {
                        return item.FullName && item.FullName.trim().length > 0;
                    });
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
                console.error('Error loading employees:', error);
            }
        );
    }

    loadEmployeeTeamSale(): void {
        this.dailyReportSaleService.getEmployeeTeamSale().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.teamSales = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách team sale');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách team sale');
                console.error('Error loading employee team sale:', error);
            }
        );
    }

    loadTeamSaleByEmployee(employeeId: number): void {
        this.dailyReportSaleService.getTeamSaleByEmployee(employeeId).subscribe(
            (response) => {
                if (response.status === 1 && response.data) {
                    this.filters.teamId = response.data.TeamSaleID || 0;
                }
                this.isTeamLoaded = true;
                // Nếu grid đã ready thì load data ngay
                if (this.isGridReady) {
                    this.loadData();
                }
            },
            (error) => {
                console.error('Error loading team sale by employee:', error);
                this.isTeamLoaded = true;
                if (this.isGridReady) {
                    this.loadData();
                }
            }
        );
    }

    openModal(editId: number = 0): void {
        const modalRef = this.modalService.open(DailyReportSaleDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });

        modalRef.componentInstance.editId = editId;
        modalRef.componentInstance.warehouseId = this.warehouseId;
        modalRef.result.then(
            (result) => {
                if (result && result.success && result.reloadData) {
                    this.loadData();
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    openEditModal(): void {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa!');
            return;
        }
        this.openModal(this.selectedRowId);
    }

    onDeleteDailyReportSale(): void {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa!');
            return;
        }

        this.nzModalService.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.dailyReportSaleService.delete(this.selectedRowId).subscribe({
                    next: (response) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', 'Đã xóa báo cáo hàng ngày!');
                            this.selectedRowId = 0;
                            this.loadData();
                        } else {
                            this.notification.error('Lỗi', response.message || 'Không thể xóa báo cáo hàng ngày!');
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting daily report sale:', error);
                        this.notification.error('Lỗi', 'Lỗi kết nối khi xóa báo cáo hàng ngày!');
                    }
                });
            }
        });
    }

    exportExcel(): void {
        const currentUser = this.appUserService.currentUser;
        const isAdminOrAdminSale = this.appUserService.isAdmin || (currentUser?.IsAdminSale === 1) || this.appUserService.hasPermission('N1') || ID_ADMIN_SALE_LIST.includes(this.appUserService.id || 0);
        const userId = isAdminOrAdminSale ? (this.filters.employeeId || 0) : (this.appUserService.id || 0);

        const dateStart = DateTime.fromISO(this.filters.dateStart || DateTime.local().toFormat('yyyy-MM-dd')).startOf('day').toJSDate();
        const dateEnd = DateTime.fromISO(this.filters.dateEnd || DateTime.local().toFormat('yyyy-MM-dd')).endOf('day').toJSDate();

        this.notification.info('Thông báo', 'Đang tải dữ liệu để xuất Excel...');

        // Gọi API lấy tất cả dữ liệu (pageSize lớn) thay vì chỉ lấy trang hiện tại
        this.dailyReportSaleService.getDailyReportSale(
            1,
            999999,
            dateStart,
            dateEnd,
            (this.filterTextSearch && this.filterTextSearch.trim()) ? this.filterTextSearch.trim() : '',
            this.filters.customerId || 0,
            userId,
            this.filters.groupTypeId || -1,
            this.filters.projectId || 0,
            this.filters.teamId || 0,
        ).subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    const data = response.data.data || [];
                    if (data.length === 0) {
                        this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
                        return;
                    }
                    this.generateExcelFile(data);
                } else {
                    this.notification.error('Lỗi', 'Không thể tải dữ liệu để xuất Excel!');
                }
            },
            error: (error) => {
                console.error('Error loading data for export:', error);
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải dữ liệu để xuất Excel!');
            }
        });
    }

    private generateExcelFile(data: any[]): void {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo hàng ngày');

        worksheet.columns = [
            { header: 'Ngày thực hiện', key: 'DateStart', width: 15 },
            { header: 'Ngày dự kiến', key: 'DateEnd', width: 15 },
            { header: 'Người phụ trách', key: 'FullName', width: 20 },
            { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
            { header: 'Tên dự án', key: 'ProjectName', width: 30 },
            { header: 'Hãng', key: 'FirmName', width: 15 },
            { header: 'Loại dự án', key: 'ProjectTypeName', width: 15 },
            { header: 'Khách hàng', key: 'CustomerName', width: 30 },
            { header: 'Mã KH', key: 'CustomerCode', width: 15 },
            { header: 'Sản phẩm KH', key: 'ProductOfCustomer', width: 25 },
            { header: 'Người liên hệ', key: 'ContactName', width: 20 },
            { header: 'Loại nhóm', key: 'MainIndex', width: 15 },
            { header: 'Việc đã làm', key: 'Content', width: 30 },
            { header: 'Kết quả', key: 'Result', width: 30 },
            { header: 'Vấn đề tồn đọng', key: 'ProblemBacklog', width: 30 },
            { header: 'Kế hoạch tiếp theo', key: 'PlanNext', width: 30 },
            { header: 'End User', key: 'PartCode', width: 20 },
            { header: 'Big Account', key: 'BigAccount', width: 12 },
            { header: 'Cơ hội bán hàng', key: 'SaleOpportunity', width: 15 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

        data.forEach((row: any) => {
            worksheet.addRow({
                ...row,
                DateStart: row.DateStart ? new Date(row.DateStart).toLocaleDateString('vi-VN') : '',
                DateEnd: row.DateEnd ? new Date(row.DateEnd).toLocaleDateString('vi-VN') : '',
                BigAccount: row.BigAccount ? 'Có' : 'Không',
                SaleOpportunity: row.SaleOpportunity ? 'Có' : 'Không',
            });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BaoCaoHangNgay_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    openImportExcel(): void {
        const modalRef = this.modalService.open(ImportExcelDailyReportComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });

        modalRef.result.then(
            (result) => {
                if (result && result.success && result.reloadData) {
                    this.loadData();
                }
            },
            () => { }
        );
    }

    //#region SlickGrid Methods
    dateFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    checkboxFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        const checked = value ? 'checked' : '';
        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
        </div>`;
    }

    initGrid(): void {
        this.columnDefinitions = [
            { id: 'DateStart', name: 'Ngày thực hiện gần nhất', field: 'DateStart', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', filter: { model: Filters['compoundInputText'] } },
            { id: 'DateEnd', name: 'Ngày dự kiến thực hiện', field: 'DateEnd', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', filter: { model: Filters['compoundInputText'] } },
            { id: 'FullName', name: 'Người phụ trách', field: 'FullName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ProjectName', name: 'Tên dự án', field: 'ProjectName', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'FirmName', name: 'Hãng', field: 'FirmName', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'ProjectTypeName', name: 'Loại dự án', field: 'ProjectTypeName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CustomerCode', name: 'Mã khách hàng', field: 'CustomerCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ProductOfCustomer', name: 'Sản phẩm của KH', field: 'ProductOfCustomer', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ContactName', name: 'Người liên hệ (Tên/Chức vụ)', field: 'ContactName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'MainIndex', name: 'Loại nhóm', field: 'MainIndex', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'Content', name: 'Việc đã làm', field: 'Content', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Result', name: 'Kết quả mong đợi', field: 'Result', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ProblemBacklog', name: 'Vấn đề tồn đọng', field: 'ProblemBacklog', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'PlanNext', name: 'Kế hoạch tiếp theo', field: 'PlanNext', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'PartCode', name: 'End User', field: 'PartCode', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'BigAccount', name: 'Big Account', field: 'BigAccount', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.checkboxFormatter, cssClass: 'text-center', filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] } },
            { id: 'SaleOpportunity', name: 'Cơ hội bán hàng', field: 'SaleOpportunity', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.checkboxFormatter, cssClass: 'text-center', filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] } },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-daily-report',
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
        };
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
        this.isGridReady = true;
        if (!this.needLoadTeam || this.isTeamLoaded) {
            this.loadData();
        }
    }

    onRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedRowId = item['ID'];
            this.selectedRow = item;
        }
    }

    onRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedRowId = item['ID'];
            this.openModal(this.selectedRowId);
        }
    }

    loadData(): void {
        const currentUser = this.appUserService.currentUser;
        const isAdminOrAdminSale = this.appUserService.isAdmin || (currentUser?.IsAdminSale === 1) || this.appUserService.hasPermission('N1') || ID_ADMIN_SALE_LIST.includes(this.appUserService.id || 0);
        const userId = isAdminOrAdminSale ? (this.filters.employeeId || 0) : (this.appUserService.id || 0);

        const dateStart = DateTime.fromISO(this.filters.dateStart || DateTime.local().toFormat('yyyy-MM-dd')).startOf('day').toJSDate();
        const dateEnd = DateTime.fromISO(this.filters.dateEnd || DateTime.local().toFormat('yyyy-MM-dd')).endOf('day').toJSDate();

        this.dailyReportSaleService.getDailyReportSale(
            this.filters.pageNumber || 1,
            this.filters.pageSize || 50,
            dateStart,
            dateEnd,
            (this.filterTextSearch && this.filterTextSearch.trim()) ? this.filterTextSearch.trim() : '',
            this.filters.customerId || 0,
            userId,
            this.filters.groupTypeId || -1,
            this.filters.projectId || 0,
            this.filters.teamId || 0,
        ).subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.dataset = (response.data.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: `${item.ID}_${index}`
                    }));
                    this.totalPage = response.data.totalPage?.[0]?.TotalPage || 1;

                    // Apply distinct filters after data is loaded
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid(
                            this.angularGrid,
                            this.columnDefinitions,
                            ['FirmName', 'ProjectTypeName', 'FullName', 'ContactName', 'MainIndex']
                        );
                    }, 0);
                } else {
                    this.dataset = [];
                    this.totalPage = 1;
                }
            },
            error: (error) => {
                console.error('Error loading daily report sale data:', error);
                this.notification.error('Lỗi', 'Không thể tải dữ liệu báo cáo hàng ngày!');
            }
        });
    }

    // Pagination methods
    prevPage(): void {
        const current = Number(this.filters.pageNumber) || 1;
        if (current <= 1) return;
        this.filters.pageNumber = current - 1;
        this.loadData();
    }

    nextPage(): void {
        const current = Number(this.filters.pageNumber) || 1;
        if (current >= this.totalPage) return;
        this.filters.pageNumber = current + 1;
        this.loadData();
    }

    goToPage(page: number): void {
        const next = Math.min(Math.max(Number(page) || 1, 1), this.totalPage || 1);
        this.filters.pageNumber = next;
        this.loadData();
    }

    onPageSizeChange(size: number): void {
        const nextSize = Number(size) || 50;
        this.filters.pageSize = nextSize;
        this.filters.pageNumber = 1;
        this.loadData();
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
}
