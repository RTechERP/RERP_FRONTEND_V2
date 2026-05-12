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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { ActivatedRoute } from '@angular/router';
import { KpiErrorService } from './kpi-error-service/kpi-error.service';
import { KpiErrorDetailComponent } from './kpi-error-detail/kpi-error-detail.component';
import { KpiErrorFineAmountComponent } from './kpi-error-fine-amount/kpi-error-fine-amount.component';
import { KpiErrorTypeComponent } from './kpi-error-type/kpi-error-type.component';
import { PermissionService } from '../../../../services/permission.service';

type KpiColumnType = 'text' | 'number' | 'money';

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
    columnGroup?: string;
    excludeFromExport?: boolean;
}

@Component({
    selector: 'app-kpi-error',
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
        Menubar,
        TableModule,
    ],
    templateUrl: './kpi-error.component.html',
    styleUrl: './kpi-error.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiErrorComponent implements OnInit {
    columnDefinitions: PrimeColumn[] = [];
    dataset: any[] = [];
    menuBars: any[] = [];
    private readonly actionPermissionCodes = 'N26,N38,N1';

    keyword: string = '';
    departmentId: number = 0;
    departments: any[] = [];

    selectedId: number = 0;
    selectedRow: any = null;
    isLoading = false;

    constructor(
        private kpiErrorService: KpiErrorService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private route: ActivatedRoute,
        private permissionService: PermissionService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.departmentId = params['departmentId'] ?? this.tabData?.departmentId ?? 0;
        });

        this.initMenuBar();
        this.initGrid();
        this.loadDepartments();
        this.loadKPIError();
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
                label: 'Loại lỗi',
                icon: 'fa-solid fa-list fa-lg text-info',
                visible: this.canManageActions(),
                command: () => this.openErrorType(),
            },
        ];
    }

    loadDepartments(): void {
        this.kpiErrorService.getDepartment().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.departments = response.data;
                }
            },
            error: () => {
                this.notification.error('Lỗi', 'Không thể tải danh sách phòng ban');
            },
        });
    }

    loadKPIError(): void {
        this.isLoading = true;
        this.kpiErrorService.getKPIError(this.departmentId, this.keyword)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response: any) => {
                    if (response.status === 1) {
                        this.dataset = (response.data || []).map((item: any, index: number) => ({
                            ...item,
                            id: item.ID,
                            STT: index + 1,
                        }));
                        this.selectedId = 0;
                        this.selectedRow = null;
                    } else {
                        this.notification.error('Lỗi', response.message);
                    }
                },
                error: () => {
                    this.notification.error('Lỗi', 'Không thể tải dữ liệu KPI Error');
                },
            });
    }

    search(): void {
        this.loadKPIError();
    }

    onPrimeRowSelect(event: any): void {
        this.onRowClick(event?.data);
    }

    onRowClick(row: any): void {
        if (!row) return;
        this.selectedId = row.ID;
        this.selectedRow = row;
    }

    onAdd(): void {
        if (!this.canManageActions()) return;

        const modalRef = this.modalService.open(KpiErrorDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.mode = 'add';
        modalRef.componentInstance.id = 0;
        modalRef.componentInstance.departmentId = this.departmentId;

        modalRef.result.then(
            () => this.loadKPIError(),
            () => { }
        );
    }

    onEdit(): void {
        if (!this.canManageActions()) return;

        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
            return;
        }

        const modalRef = this.modalService.open(KpiErrorDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.mode = 'edit';
        modalRef.componentInstance.id = this.selectedId;
        modalRef.componentInstance.departmentId = this.departmentId;

        modalRef.result.then(
            () => this.loadKPIError(),
            () => { }
        );
    }

    onDelete(): void {
        if (!this.canManageActions()) return;

        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa lỗi này?',
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.kpiErrorService.deleteKPIError(this.selectedId).subscribe({
                    next: (response: any) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', 'Xóa thành công');
                            this.selectedId = 0;
                            this.selectedRow = null;
                            this.loadKPIError();
                        } else {
                            this.notification.error('Lỗi', response.message);
                        }
                    },
                    error: () => {
                        this.notification.error('Lỗi', 'Không thể xóa dữ liệu');
                    },
                });
            },
        });
    }

    async exportToExcel(): Promise<void> {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('KPI Error');
            const columnsToExport = this.columnDefinitions.filter(col => !col.excludeFromExport && col.id !== 'STT');

            const headers = columnsToExport.map(col => col.name);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            this.dataset.forEach((rowData: any) => {
                const row = columnsToExport.map(col => {
                    const value = rowData[col.field];
                    if (typeof value === 'number') {
                        return new Intl.NumberFormat('vi-VN').format(value);
                    }
                    return value ?? '';
                });
                worksheet.addRow(row);
            });

            worksheet.columns.forEach((column: any) => { column.width = 20; });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `DanhSachLoiViPham_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Excel export error:', error);
            this.notification.error('Lỗi', 'Không thể export file Excel');
        }
    }

    openErrorType(): void {
        if (!this.canManageActions()) return;

        const modalRef = this.modalService.open(KpiErrorTypeComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });

        modalRef.result.then(
            () => this.loadKPIError(),
            () => { }
        );
    }

    openKPIErrorFineAmount(): void {
        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một lỗi để đánh giá');
            return;
        }

        const modalRef = this.modalService.open(KpiErrorFineAmountComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.kpiErrorId = this.selectedId;

        modalRef.result.then(
            () => this.loadKPIError(),
            () => { }
        );
    }

    initGrid(): void {
        this.columnDefinitions = [
            this.textCol('ID', 'ID', 'ID', 60, { hidden: true, excludeFromExport: true }),
            this.textCol('STT', 'STT', 'STT', 60, { hidden: true, excludeFromExport: true }),
            this.textCol('Department', 'Phòng ban', 'Department', 120),
            this.textCol('Code', 'Mã lỗi vi phạm', 'Code', 120),
            this.textCol('TypeName', 'Loại lỗi vi phạm', 'TypeName', 150, { hidden: true }),
            this.textCol('Content', 'Nội dung lỗi vi phạm', 'Content', 300),
            this.numberCol('Quantity', 'Số vi phạm', 'Quantity', 100),
            this.textCol('UnitText', 'Đơn vị', 'UnitText', 80),
            this.moneyCol('Monney', 'Tiền phạt', 'Monney', 120),
            this.textCol('Note', 'Ghi chú', 'Note', 150),
            this.moneyCol('TotalMoney_1', '1', 'TotalMoney_1', 80, 'Đánh giá'),
            this.moneyCol('TotalMoney_2', '2', 'TotalMoney_2', 80, 'Đánh giá'),
            this.moneyCol('TotalMoney_3', '3', 'TotalMoney_3', 80, 'Đánh giá'),
            this.moneyCol('TotalMoney_4', '4', 'TotalMoney_4', 80, 'Đánh giá'),
            this.moneyCol('TotalMoney_5', '5', 'TotalMoney_5', 80, 'Đánh giá'),
            this.moneyCol('TotalMoney_6', '>5', 'TotalMoney_6', 80, 'Đánh giá'),
        ];
    }

    visibleColumns(): PrimeColumn[] {
        return this.columnDefinitions.filter(col => !col.hidden);
    }

    baseColumns(): PrimeColumn[] {
        return this.visibleColumns().filter(col => !col.columnGroup);
    }

    groupedColumns(groupName: string): PrimeColumn[] {
        return this.visibleColumns().filter(col => col.columnGroup === groupName);
    }

    getColumnWidth(col: PrimeColumn): string {
        return `${col.minWidth || 120}px`;
    }

    getColumnFilterType(_col: PrimeColumn): string {
        return 'text';
    }

    getCellClass(col: PrimeColumn): Record<string, boolean> {
        const right = col.align === 'right' || col.type === 'number' || col.type === 'money';
        const center = col.align === 'center';
        return {
            'text-end': right,
            'text-center': center,
        };
    }

    formatCell(row: any, col: PrimeColumn): string {
        const value = row?.[col.field];
        if (value === null || value === undefined || value === '') return '';

        if (col.type === 'number' || col.type === 'money') {
            return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
        }

        return String(value);
    }

    getCellTitle(row: any, col: PrimeColumn): string {
        return this.formatCell(row, col);
    }

    getGroupHeader(rowData: any): string {
        return rowData?.TypeName || '(Không có loại lỗi)';
    }

    trackById(_index: number, row: any): any {
        return row?.ID ?? row?.id ?? row;
    }

    private canManageActions(): boolean {
        return this.permissionService.hasPermission(this.actionPermissionCodes);
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

    private numberCol(id: string, name: string, field: string, minWidth: number, columnGroup?: string): PrimeColumn {
        return {
            id,
            name,
            field,
            minWidth,
            sortable: true,
            filterable: true,
            type: 'number',
            align: 'right',
            columnGroup,
        };
    }

    private moneyCol(id: string, name: string, field: string, minWidth: number, columnGroup?: string): PrimeColumn {
        return {
            ...this.numberCol(id, name, field, minWidth, columnGroup),
            type: 'money',
        };
    }
}
