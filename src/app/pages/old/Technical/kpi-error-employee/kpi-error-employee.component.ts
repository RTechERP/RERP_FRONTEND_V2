import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    Inject,
    OnInit,
    Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, firstValueFrom } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { ActivatedRoute } from '@angular/router';
import { KpiErrorEmployeeService } from './kpi-error-employee-service/kpi-error-employee.service';
import { KpiErrorEmployeeDetailComponent } from './kpi-error-employee-detail/kpi-error-employee-detail.component';
import { ImportExcelKpiErrorEmployeeComponent } from './import-excel/import-excel.component';
import { PermissionService } from '../../../../services/permission.service';
import { AppUserService } from '../../../../services/app-user.service';

type KpiColumnType = 'text' | 'number' | 'date' | 'action';

interface PrimeColumn {
    id: string;
    name: string;
    field: string;
    minWidth?: number;
    hidden?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    type?: KpiColumnType;
    align?: 'left' | 'center' | 'right';
    excludeFromExport?: boolean;
}

@Component({
    selector: 'app-kpi-error-employee',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzFormModule,
        NzModalModule,
        NzMessageModule,
        NzSplitterModule,
        NzDropDownModule,
        Menubar,
        TableModule,
    ],
    templateUrl: './kpi-error-employee.component.html',
    styleUrl: './kpi-error-employee.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiErrorEmployeeComponent implements OnInit {
    columnDefinitions: PrimeColumn[] = [];
    dataset: any[] = [];
    selectedRows: any[] = [];

    columnDefinitionsFile: PrimeColumn[] = [];
    datasetFile: any[] = [];
    selectedFileRow: any = null;

    menuBars: any[] = [];
    private readonly actionPermissionCodes = 'N26,N38,N1,N79,N107';
    private readonly autoAddPermissionCodes = 'N26,N38,N1,N79';

    keyword: string = '';
    startDate: string | null = null;
    endDate: string | null = null;
    kpiErrorTypeId: number = 0;
    kpiErrorId: number = 0;
    employeeId: number = 0;
    departmentId: number = 0;
    departmentIds: number[] = [];
    userLoginDepartmentId: number = 0;

    kpiErrorTypes: any[] = [];
    kpiErrors: any[] = [];
    employees: any[] = [];
    departments: any[] = [];

    selectedId: number = 0;
    selectedRow: any = null;

    totalErrorNumber: number = 0;
    isDeleting = false;
    isAutoAdding = false;
    isLoading = false;
    isFileLoading = false;

    constructor(
        private kpiErrorEmployeeService: KpiErrorEmployeeService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private message: NzMessageService,
        private route: ActivatedRoute,
        private permissionService: PermissionService,
        private appUserService: AppUserService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        const today = new Date();
        this.startDate = this.formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1));
        this.endDate = this.formatDateForInput(new Date(today.getFullYear(), today.getMonth() + 1, 0));

        const queryDepartmentId = this.route.snapshot.queryParams['departmentId'];
        this.departmentId = queryDepartmentId ? Number(queryDepartmentId) : (this.tabData?.departmentId ?? 0);
        this.departmentIds = this.departmentId > 0 ? [this.departmentId] : [];

        this.route.queryParams.subscribe(params => {
            const newDepartmentId = params['departmentId']
                ? Number(params['departmentId'])
                : (this.tabData?.departmentId ?? 0);
            if (newDepartmentId !== this.departmentId) {
                this.departmentId = newDepartmentId;
                this.departmentIds = this.departmentId > 0 ? [this.departmentId] : [];
                this.search();
            }
        });

        // NTA B update 13072026: Get user login department ID
        this.userLoginDepartmentId = this.appUserService.departmentID || 0;

        this.initMenuBar();
        this.initGrid();
        this.initFileGrid();
        this.loadDepartments();
        this.loadEmployees();
        this.loadKPIErrorTypes();
        this.loadKPIErrors();
        this.search();
    }

    loadDepartments(): void {
        this.kpiErrorEmployeeService.getDepartment().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.departments = response.data;
                }
            },
            error: (error: any) => console.error('Error loading departments:', error),
        });
    }

    loadEmployees(): void {
        this.kpiErrorEmployeeService.getEmployees().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.employees = response.data;
                }
            },
            error: (error: any) => console.error('Error loading employees:', error),
        });
    }

    loadKPIErrorTypes(): void {
        this.kpiErrorEmployeeService.getKPIErrorType().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.kpiErrorTypes = response.data;
                }
            },
            error: (error: any) => console.error('Error loading KPI Error Types:', error),
        });
    }

    loadKPIErrors(): void {
        this.kpiErrorEmployeeService.getKPIError(this.kpiErrorTypeId || 0).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.kpiErrors = response.data;
                }
            },
            error: (error: any) => console.error('Error loading KPI Errors:', error),
        });
    }

    onTypeChange(): void {
        this.kpiErrorId = 0;
        this.loadKPIErrors();
        this.search();
    }

    loadFileData(kpiErrorEmployeeId: number): void {
        this.isFileLoading = true;
        this.kpiErrorEmployeeService.loadDataFile(kpiErrorEmployeeId)
            .pipe(finalize(() => this.isFileLoading = false))
            .subscribe({
                next: (response: any) => {
                    if (response.status === 1) {
                        this.datasetFile = (response.data || []).map((item: any, index: number) => ({
                            ...item,
                            id: item.ID || `file_${index}`,
                        }));
                    }
                },
                error: (error: any) => console.error('Error loading file data:', error),
            });
    }

    search(): void {
        if (!this.startDate || !this.endDate) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        const startDate = this.parseDateInput(this.startDate);
        const endDate = this.parseDateInput(this.endDate, true);
        if (!startDate || !endDate) {
            this.notification.warning('Cảnh báo', 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ');
            return;
        }

        this.isLoading = true;
        this.kpiErrorEmployeeService.loadData(
            startDate,
            endDate,
            this.kpiErrorId,
            this.employeeId,
            this.kpiErrorTypeId,
            this.departmentIds,
            this.keyword,
            this.userLoginDepartmentId
        ).pipe(finalize(() => this.isLoading = false)).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.dataset = (response.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID,
                        STT: index + 1,
                        GroupKey: this.buildGroupKey(item),
                    }));
                    this.totalErrorNumber = this.dataset.reduce((sum: number, item: any) => {
                        return sum + (Number(item.ErrorNumber) || 0);
                    }, 0);
                    this.datasetFile = [];
                    this.selectedRows = [];
                    this.selectedFileRow = null;
                    this.selectedId = 0;
                    this.selectedRow = null;
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
                }
            },
            error: () => {
                this.notification.error('Lỗi', 'Không thể tải dữ liệu');
            },
        });
    }

    initMenuBar(): void {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                visible: this.canManageActions(),
                command: () => this.onAdd(),
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                visible: this.canManageActions(),
                command: () => this.onEdit(),
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                visible: this.canManageActions(),
                command: () => this.onDelete(),
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportToExcel(),
            },
            {
                label: 'Nhập Excel',
                icon: 'fa-solid fa-file-import fa-lg text-primary',
                visible: this.canManageActions(),
                command: () => this.importExcel(),
            },
            {
                label: 'Tự động thêm lỗi BCCV',
                icon: 'fa-solid fa-wand-magic-sparkles fa-lg text-warning',
                visible: this.canAutoAddError(),
                command: () => this.autoAddError(),
            },
        ];
    }

    onPrimeRowSelect(event: any): void {
        this.onRowClick(event?.data);
    }

    onRowClick(row: any): void {
        if (!row || !row.ID) return;
        this.selectedId = row.ID;
        this.selectedRow = row;
        this.loadFileData(this.selectedId);
    }

    onAdd(): void {
        if (!this.canManageActions()) return;

        const modalRef = this.modalService.open(KpiErrorEmployeeDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.id = 0;
        modalRef.componentInstance.isEditMode = false;
        modalRef.componentInstance.departmentId = this.getCurrentDepartmentId();

        modalRef.result.then(
            () => this.search(),
            () => { }
        );
    }

    onEdit(): void {
        if (!this.canManageActions()) return;

        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
            return;
        }

        const modalRef = this.modalService.open(KpiErrorEmployeeDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.id = this.selectedId;
        modalRef.componentInstance.isEditMode = true;
        modalRef.componentInstance.departmentId = this.getCurrentDepartmentId();

        modalRef.result.then(
            () => this.search(),
            () => { }
        );
    }

    onDelete(): void {
        if (!this.canManageActions()) return;
        if (this.isDeleting) {
            this.notification.info('Thông báo', 'Đang xóa dữ liệu, vui lòng chờ');
            return;
        }

        const idsToDelete: number[] = (this.selectedRows || [])
            .map(row => row?.ID)
            .filter((id: number) => !!id);

        if (idsToDelete.length === 0 && this.selectedId) {
            idsToDelete.push(this.selectedId);
        }

        if (idsToDelete.length === 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để xóa');
            return;
        }

        const uniqueIdsToDelete = [...new Set(idsToDelete)];

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ${uniqueIdsToDelete.length} dòng đã chọn?`,
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: async () => {
                this.isDeleting = true;
                const messageId = this.message.loading(`Đang xóa ${uniqueIdsToDelete.length} dòng, vui lòng chờ...`, { nzDuration: 0 }).messageId;

                try {
                    const response: any = await firstValueFrom(this.kpiErrorEmployeeService.deleteKPIErrorEmployee(uniqueIdsToDelete));
                    if (response.status === 1) {
                        this.notification.success('Thành công', response.message || 'Xóa thành công');
                        this.selectedId = 0;
                        this.selectedRow = null;
                        this.selectedRows = [];
                        this.search();
                    } else {
                        this.notification.error('Lỗi', response.message || 'Xóa thất bại');
                    }
                } catch {
                    this.notification.error('Lỗi', 'Không thể xóa dữ liệu');
                } finally {
                    this.isDeleting = false;
                    this.message.remove(messageId);
                }
            }
        });
    }

    autoAddError(): void {
        if (!this.canAutoAddError()) return;
        if (this.isAutoAdding) {
            this.notification.info('Thông báo', 'Đang tự động thêm lỗi BCCV, vui lòng chờ');
            return;
        }

        if (!this.startDate || !this.endDate) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: 'Bạn có chắc chắn muốn tự động thêm lỗi BCCV?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: async () => {
                const start = this.parseDateInput(this.startDate);
                const end = this.parseDateInput(this.endDate, true);
                if (!start || !end) {
                    this.notification.warning('Cảnh báo', 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ');
                    return;
                }

                this.isAutoAdding = true;
                const messageId = this.message.loading('Đang tự động thêm lỗi BCCV, vui lòng chờ...', { nzDuration: 0 }).messageId;

                try {
                    const response: any = await firstValueFrom(this.kpiErrorEmployeeService.autoAdd(start, end));
                    if (response.status === 1) {
                        const inserted = response.data?.Inserted || 0;
                        this.notification.success('Thành công', `Đã thêm ${inserted} lỗi BCCV`);
                        this.search();
                    } else {
                        this.notification.error('Lỗi', response.message || 'Thêm lỗi thất bại');
                    }
                } catch {
                    this.notification.error('Lỗi', 'Không thể tự động thêm lỗi');
                } finally {
                    this.isAutoAdding = false;
                    this.message.remove(messageId);
                }
            }
        });
    }

    viewFile(file: any): void {
        if (!file || !file.FileName) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để xem!');
            return;
        }

        const errorDate = this.selectedRow?.ErrorDate ? new Date(this.selectedRow.ErrorDate) : null;
        if (!errorDate) {
            this.notification.warning('Thông báo', 'Không tìm thấy ngày vi phạm!');
            return;
        }

        const year = errorDate.getFullYear();
        const month = errorDate.getMonth() + 1;
        const day = String(errorDate.getDate()).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const yearStr = String(year);
        const dateFolder = `${day}.${monthStr}.${yearStr}`;
        const baseUrl = 'http://113.190.234.64:8083/api/kpi';
        const url = `${baseUrl}/${year}/T${month}/N${dateFolder}/${file.FileName}`;

        const newWindow = window.open(url, '_blank', 'width=1000,height=700');
        if (newWindow) {
            newWindow.onload = () => {
                newWindow.document.title = file.FileName;
            };
        }
    }

    initGrid(): void {
        this.columnDefinitions = [
            this.textCol('ID', 'ID', 'ID', 60, { hidden: true, excludeFromExport: true }),
            this.textCol('STT', 'STT', 'STT', 60, { hidden: true, excludeFromExport: true }),
            this.textCol('GroupKey', 'Nhóm', 'GroupKey', 120, { hidden: true, excludeFromExport: true }),
            this.textCol('Code', 'Mã lỗi vi phạm', 'Code', 90),
            this.textCol('TypeName', 'Loại lỗi vi phạm', 'TypeName', 150, { hidden: true }),
            this.textCol('Content', 'Nội dung lỗi vi phạm', 'Content', 300),
            this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 120),
            this.textCol('Employee', 'Nhân viên', 'Employee', 170),
            this.dateCol('ErrorDate', 'Ngày vi phạm', 'ErrorDate', 120),
            this.numberCol('ErrorNumber', 'Số lần vi phạm', 'ErrorNumber', 100),
            this.textCol('Note', 'Ghi chú', 'Note', 200),
        ];
    }

    initFileGrid(): void {
        this.columnDefinitionsFile = [
            this.textCol('ID', 'ID', 'ID', 60, { hidden: true, excludeFromExport: true }),
            this.textCol('FileName', 'File ảnh đính kèm', 'FileName', 200),
            {
                id: 'Action',
                name: '',
                field: 'Action',
                minWidth: 60,
                sortable: false,
                filterable: false,
                type: 'action',
                align: 'center',
                excludeFromExport: true,
            },
        ];
    }

    async exportToExcel(): Promise<void> {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('KPI Error Employee');
            const columnsToExport = this.columnDefinitions.filter(col => !col.excludeFromExport && col.id !== 'STT');

            const headers = columnsToExport.map(col => col.name);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            this.dataset.forEach((rowData: any) => {
                const row = columnsToExport.map(col => this.formatExportValue(rowData, col));
                worksheet.addRow(row);
            });

            worksheet.columns.forEach((column: any) => { column.width = 20; });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `DanhSachNhanVienLoi_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Excel export error:', error);
            this.notification.error('Lỗi', 'Không thể export file Excel');
        }
    }

    importExcel(): void {
        if (!this.canManageActions()) return;

        const modalRef = this.modalService.open(ImportExcelKpiErrorEmployeeComponent, {
            size: 'xl',
            centered: true,
            backdrop: 'static'
        });

        modalRef.result.then(
            (result: any) => {
                if (result?.reloadData) {
                    this.search();
                }
            },
            () => { }
        );
    }

    visibleColumns(columns: PrimeColumn[] = this.columnDefinitions): PrimeColumn[] {
        return columns.filter(col => !col.hidden);
    }

    getColumnWidth(col: PrimeColumn): string {
        return `${col.minWidth || 120}px`;
    }

    getColumnFilterType(_col: PrimeColumn): string {
        return 'text';
    }

    getCellClass(col: PrimeColumn): Record<string, boolean> {
        return {
            'text-end': col.align === 'right' || col.type === 'number',
            'text-center': col.align === 'center' || col.type === 'date' || col.type === 'action',
        };
    }

    formatCell(row: any, col: PrimeColumn): string {
        const value = row?.[col.field];
        if (value === null || value === undefined || value === '') return '';
        if (col.type === 'number') return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
        if (col.type === 'date') return this.formatDateValue(value);
        return String(value);
    }

    getCellTitle(row: any, col: PrimeColumn): string {
        return this.formatCell(row, col);
    }

    getGroupHeader(rowData: any): string {
        const typeName = rowData?.TypeName || '(Không có loại lỗi)';
        const employee = rowData?.Employee || '(Không có nhân viên)';
        return `Loại lỗi: ${typeName} - Nhân viên: ${employee}`;
    }

    getGroupCount(groupKey: string): number {
        return this.dataset.filter(item => item.GroupKey === groupKey).length;
    }

    trackById(_index: number, row: any): any {
        return row?.ID ?? row?.id ?? row;
    }

    private getCurrentDepartmentId(): number {
        const selectedDepartmentId = (this.departmentIds || []).find(id => Number(id) > 0);
        return selectedDepartmentId || this.departmentId || 0;
    }

    private canManageActions(): boolean {
        return this.permissionService.hasPermission(this.actionPermissionCodes);
    }

    private canAutoAddError(): boolean {
        return this.permissionService.hasPermission(this.autoAddPermissionCodes);
    }

    private formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private parseDateInput(value: string | Date | null, endOfDay = false): Date | null {
        if (!value) return null;
        const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
        if (isNaN(date.getTime())) return null;

        if (endOfDay) {
            date.setHours(23, 59, 59, 999);
        } else {
            date.setHours(0, 0, 0, 0);
        }

        return date;
    }

    private formatDateValue(value: any): string {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    private formatExportValue(rowData: any, col: PrimeColumn): any {
        const value = rowData[col.field];
        if (col.type === 'date') return this.formatDateValue(value);
        if (typeof value === 'number') return new Intl.NumberFormat('vi-VN').format(value);
        return value ?? '';
    }

    private buildGroupKey(item: any): string {
        return `${item?.TypeName || ''}|||${item?.Employee || ''}`;
    }

    private textCol(id: string, name: string, field: string, minWidth: number, extra: Partial<PrimeColumn> = {}): PrimeColumn {
        return {
            id,
            name,
            field,
            minWidth,
            sortable: true,
            filterable: true,
            type: 'text',
            ...extra,
        };
    }

    private numberCol(id: string, name: string, field: string, minWidth: number): PrimeColumn {
        return {
            id,
            name,
            field,
            minWidth,
            sortable: true,
            filterable: true,
            type: 'number',
            align: 'right',
        };
    }

    private dateCol(id: string, name: string, field: string, minWidth: number): PrimeColumn {
        return {
            id,
            name,
            field,
            minWidth,
            sortable: true,
            filterable: true,
            type: 'date',
            align: 'center',
        };
    }
}
