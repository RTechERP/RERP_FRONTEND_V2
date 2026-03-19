import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    HostListener,
    OnInit
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ID_ADMIN_SALE_LIST } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';

import { DailyReportAccountingService } from '../daily-report-accounting-service/daily-report-accounting.service';
import { DailyReportAccountingDetailComponent } from '../daily-report-accounting-detail/daily-report-accounting-detail.component';

@Component({
    selector: 'app-daily-report-accounting-slickgrid',
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzIconModule,
        NzDatePickerModule,
        NzInputModule,
        NzSelectModule,
        NzSpinModule,
        NzModalModule,
        NzFormModule,
        CommonModule,
        HasPermissionDirective,
        AngularSlickgridModule,
        Menubar,
        NzInputNumberModule,
        NzDropDownModule
    ],
    templateUrl: './daily-report-accounting-slickgrid.component.html',
    styleUrl: './daily-report-accounting-slickgrid.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DailyReportAccountingSlickgridComponent implements OnInit {
    // SlickGrid properties
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // PrimeNG Menubar
    menuBars: any[] = [];

    employees: any[] = [];
    filterTextSearch: string = '';
    isAdmin: boolean = false;
    isEmployeeIdDisabled: boolean = false;

    selectedRowId: number = 0;
    selectedRow: any = null;
    isGridReady: boolean = false;
    isLoadingData: boolean = false;
    isShowModal: boolean = false;
    isMobile: boolean = false;

    // Pagination
    totalPage: number = 1;
    readonly pageSizeOptions: number[] = [10, 30, 50, 100, 200, 300, 500];

    filters: any = {
        dateStart: DateTime.local().minus({ months: 1 }).toFormat('yyyy-MM-dd'),
        dateEnd: DateTime.local().toFormat('yyyy-MM-dd'),
        employeeId: null,
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
                command: () => this.onDeleteDailyReportAccounting()
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportExcel()
            },
        ];
    }

    constructor(
        private dailyReportAccountingService: DailyReportAccountingService,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private modalService: NgbModal,
        private nzModalService: NzModalService
    ) { }

    ngOnInit(): void {
        this.checkIfMobile();
        this.initMenuBar();
        this.initGrid();

        // Kiểm tra quyền admin và set employeeId
        const currentUser = this.appUserService.currentUser;
        const currentUserId = this.appUserService.id || 0;
        const hasN1 = this.appUserService.hasPermission('N1') || (currentUser?.Permissions ? currentUser.Permissions.split(',').includes('N1') : false);
        const hasN52 = this.appUserService.hasPermission('N52') || (currentUser?.Permissions ? currentUser.Permissions.split(',').includes('N52') : false);
        this.isAdmin = hasN1 || hasN52 || ID_ADMIN_SALE_LIST.includes(currentUserId) || this.appUserService.isAdmin;

        if (this.isAdmin) {
            this.isEmployeeIdDisabled = false;
            this.filters.employeeId = null;
        } else {
            // User thường: disable cả hai, tự điền employeeId
            this.isEmployeeIdDisabled = true;
            this.filters.employeeId = currentUserId;
        }

        this.loadEmployees();
    }

    @HostListener('window:resize')
    onResize() {
        this.checkIfMobile();
    }

    private checkIfMobile(): void {
        this.isMobile = window.innerWidth <= 768;
    }

    searchData(): void {
        this.filters.pageNumber = 1;
        this.loadData();
    }

    loadEmployees(): void {
        this.dailyReportAccountingService.getEmployees().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.employees = (response.data || []).filter((item: any) => {
                        return item.FullName && item.FullName.trim().length > 0;
                    });
                } else {
                    this.employees = [];
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
                }
            },
            (error) => {
                this.employees = [];
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
                console.error('Error loading employees:', error);
            }
        );
    }

    openModal(editId: number = 0): void {
        const modalRef = this.modalService.open(DailyReportAccountingDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
        });

        modalRef.componentInstance.editId = editId;
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

    onDeleteDailyReportAccounting(): void {
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
                this.dailyReportAccountingService.delete(this.selectedRowId).subscribe({
                    next: (response) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', 'Đã xóa báo cáo!');
                            this.selectedRowId = 0;
                            this.loadData();
                        } else {
                            this.notification.error('Lỗi', response.message || 'Không thể xóa báo cáo!');
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting daily report accounting:', error);
                        this.notification.error('Lỗi', 'Lỗi kết nối khi xóa báo cáo!');
                    }
                });
            }
        });
    }

    exportExcel(): void {
        const employeeId = this.isAdmin ? (this.filters.employeeId || 0) : (this.appUserService.employeeID || 0);

        const dateStart = DateTime.fromISO(this.filters.dateStart || DateTime.local().toFormat('yyyy-MM-dd')).startOf('day').toJSDate();
        const dateEnd = DateTime.fromISO(this.filters.dateEnd || DateTime.local().toFormat('yyyy-MM-dd')).endOf('day').toJSDate();

        this.notification.info('Thông báo', 'Đang tải dữ liệu để xuất Excel...');

        this.dailyReportAccountingService.getDailyReportAccounting(
            1,
            999999,
            employeeId,
            dateStart,
            dateEnd,
            (this.filterTextSearch && this.filterTextSearch.trim()) ? this.filterTextSearch.trim() : ''
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
        const worksheet = workbook.addWorksheet('Báo cáo Kế toán');

        worksheet.columns = [
            { header: 'Họ tên', key: 'FullName', width: 25 },
            { header: 'Chức vụ', key: 'ChucVu', width: 25 },
            { header: 'Ngày báo cáo', key: 'ReportDate', width: 15 },
            { header: 'Việc đã làm', key: 'Content', width: 40 },
            { header: 'Kết quả/Tình trạng', key: 'Result', width: 40 },
            { header: 'Kế hoạch tiếp theo', key: 'NextPlan', width: 40 },
            { header: 'Tồn đọng/Vướng mắc', key: 'PendingIssues', width: 40 },
            { header: 'Phát sinh gấp cần xử lý', key: 'Urgent', width: 30 },
            { header: 'Lỗi/Sai phạm/Bị nhắc nhở', key: 'MistakeOrViolation', width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

        data.forEach((row: any) => {
            worksheet.addRow({
                ...row,
                ReportDate: row.ReportDate ? new Date(row.ReportDate).toLocaleDateString('vi-VN') : '',
            });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BaoCaoKeToan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
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

    initGrid(): void {
        this.columnDefinitions = [
            { id: 'FullName', name: 'Họ tên', field: 'FullName', width: 250, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'ChucVu', name: 'Chức vụ', field: 'ChucVu', width: 250, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ReportDate', name: 'Ngày báo cáo', field: 'ReportDate', width: 150, minWidth: 100, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', filter: { model: Filters['compoundInputText'] } },
            { id: 'Content', name: 'Việc đã làm', field: 'Content', width: 300, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Result', name: 'Kết quả/Tình trạng', field: 'Result', width: 300, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'NextPlan', name: 'Kế hoạch tiếp theo', field: 'NextPlan', width: 300, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'PendingIssues', name: 'Tồn đọng/Vướng mắc', field: 'PendingIssues', width: 300, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Urgent', name: 'Phát sinh gấp cần xử lý', field: 'Urgent', width: 300, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'MistakeOrViolation', name: 'Lỗi/Sai phạm/Bị nhắc nhở', field: 'MistakeOrViolation', width: 300, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            forceFitColumns: false,
            autoResize: {
                container: '.grid-container-daily-report-acc',
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
        this.loadData();
    }

    onRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedRowId = item['Id'] || item['ID'];
            this.selectedRow = item;
        }
    }

    onRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedRowId = item['Id'] || item['ID'];
            this.openModal(this.selectedRowId);
        }
    }

    loadData(): void {
        this.isLoadingData = true;
        const userId = this.isAdmin ? (this.filters.employeeId || 0) : (this.appUserService.id || 0);

        const dateStart = DateTime.fromISO(this.filters.dateStart || DateTime.local().toFormat('yyyy-MM-dd')).startOf('day').toJSDate();
        const dateEnd = DateTime.fromISO(this.filters.dateEnd || DateTime.local().toFormat('yyyy-MM-dd')).endOf('day').toJSDate();

        this.dailyReportAccountingService.getDailyReportAccounting(
            this.filters.pageNumber || 1,
            this.filters.pageSize || 50,
            userId,
            dateStart,
            dateEnd,
            (this.filterTextSearch && this.filterTextSearch.trim()) ? this.filterTextSearch.trim() : ''
        ).subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.dataset = (response.data.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: `${item.Id || item.ID}_${index}`
                    }));
                    this.totalPage = response.data.totalPages?.[0]?.TotalPage || 1;

                    this.applyDistinctFiltersToGrid(
                        this.angularGrid,
                        this.columnDefinitions,
                        ['FullName'],
                        this.dataset
                    );
                } else {
                    this.dataset = [];
                    this.totalPage = 1;
                }
                this.isLoadingData = false;
            },
            error: (error) => {
                this.isLoadingData = false;
                console.error('Error loading daily report accounting data:', error);
                this.notification.error('Lỗi', 'Không thể tải dữ liệu!');
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
        fieldsToFilter: string[],
        freshData?: any[]
    ): void {
        if (!angularGrid?.slickGrid) return;
        const data = freshData || angularGrid?.dataView?.getItems() || [];
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

        columns.forEach((column: any) => {
            if (column?.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                column.filter.collection = getUniqueValues(data, field);
            }
        });

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
}
