import {
    Component,
    ViewEncapsulation,
    OnInit,
    AfterViewInit,
    CUSTOM_ELEMENTS_SCHEMA,
    Inject,
    Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { ActivatedRoute } from '@angular/router';
import { KpiErrorService } from './kpi-error-service/kpi-error.service';
import { KpiErrorDetailComponent } from './kpi-error-detail/kpi-error-detail.component';
import { KpiErrorFineAmountComponent } from './kpi-error-fine-amount/kpi-error-fine-amount.component';
import { KpiErrorTypeComponent } from './kpi-error-type/kpi-error-type.component';
import { TbProductRtcImportExcelComponent } from '../../tb-product-rtc/tb-product-rtc-import-excel/tb-product-rtc-import-excel.component';

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
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './kpi-error.component.html',
    styleUrl: './kpi-error.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [ExcelExportService],
})
export class KpiErrorComponent implements OnInit, AfterViewInit {
    // SlickGrid properties
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // Menu bar
    menuBars: any[] = [];

    // Filters
    keyword: string = '';
    departmentId: number = 0;
    departments: any[] = [];

    // Selected row
    selectedId: number = 0;
    selectedRow: any = null;

    constructor(
        private kpiErrorService: KpiErrorService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private route: ActivatedRoute,
        private excelExportService: ExcelExportService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {

        this.route.queryParams.subscribe(params => {
            // this.departmentId = params['departmentId'] || 0;
            this.departmentId =
                params['departmentId']
                ?? this.tabData?.departmentId
                ?? 0;
        });
        this.initMenuBar();
        this.initGrid();
        this.loadDepartments();
        this.loadKPIError();
    }

    ngAfterViewInit(): void { }

    initMenuBar(): void {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => {
                    this.onAdd();
                },
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => {
                    this.onEdit();
                },
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => {
                    this.onDelete();
                },
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.exportToExcel();
                },
            },
            {
                label: 'Loại lỗi',
                icon: 'fa-solid fa-list fa-lg text-info',
                command: () => {
                    this.openErrorType();
                },
            },
            // {
            //   label: 'Đánh giá lỗi',
            //   icon: 'fa-solid fa-coins fa-lg text-warning',
            //   command: () => {
            //     this.openKPIErrorFineAmount();
            //   },
            // },
        ];
    }


    loadDepartments(): void {
        this.kpiErrorService.getDepartment().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.departments = response.data;
                }
            },
            error: (error: any) => {
                this.notification.error('Lỗi', 'Không thể tải danh sách phòng ban');
            },
        });
    }

    loadKPIError(): void {
        this.kpiErrorService.getKPIError(this.departmentId, this.keyword).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.dataset = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID,
                        STT: index + 1,
                    }));
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid();
                    }, 100);
                } else {
                    this.notification.error('Lỗi', response.message);
                }
            },
            error: (error: any) => {
                this.notification.error('Lỗi', 'Không thể tải dữ liệu KPI Error');
            },
        });
    }

    search(): void {
        this.loadKPIError();
    }

    onRowClick(e: any, args: any): void {
        if (args && args.row !== undefined) {
            const grid = this.angularGrid.slickGrid;
            const dataItem = grid.getDataItem(args.row);
            if (dataItem) {
                this.selectedId = dataItem.ID;
                this.selectedRow = dataItem;
            }
        }
    }

    onAdd(): void {
        const modalRef = this.modalService.open(KpiErrorDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.mode = 'add';
        modalRef.componentInstance.id = 0;
        modalRef.componentInstance.departmentId = this.departmentId;

        modalRef.result.then(
            () => {
                this.loadKPIError();
            },
            () => { }
        );
    }

    onEdit(): void {
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
            () => {
                this.loadKPIError();
            },
            () => { }
        );
    }

    onDelete(): void {
        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa lỗi này?`,
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
                    error: (error: any) => {
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

            // Filter columns to export (exclude STT, excludeFromExport, include TypeName even if hidden)
            const columnsToExport = this.columnDefinitions.filter(col =>
                !col.excludeFromExport && col.id !== 'STT'
            );

            // Add headers
            const headers = columnsToExport.map((col: any) => col.name);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            // Add data rows from dataset (not grouped)
            this.dataset.forEach((rowData: any) => {
                const row = columnsToExport.map((col: any) => {
                    const value = rowData[col.field];
                    if (typeof value === 'number') {
                        return new Intl.NumberFormat('vi-VN').format(value);
                    }
                    return value ?? '';
                });
                worksheet.addRow(row);
            });

            // Auto-fit columns
            worksheet.columns.forEach((column: any) => { column.width = 20; });

            // Generate and download Excel file
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
        const modalRef = this.modalService.open(KpiErrorTypeComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });

        modalRef.result.then(
            () => {
                this.loadKPIError();
            },
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
            () => {
                this.loadKPIError();
            },
            () => { }
        );
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'ID',
                name: 'ID',
                field: 'ID',
                sortable: true,
                maxWidth: 60,
                excludeFromExport: true,
                hidden: true,
            },
            {
                id: 'STT',
                name: 'STT',
                field: 'STT',
                sortable: true,
                maxWidth: 60,
                hidden: true,
                excludeFromExport: true,
            },
            {
                id: 'Department',
                name: 'Phòng ban',
                field: 'Department',
                sortable: true,
                filterable: true,
                minWidth: 120,
                formatter: this.commonTooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Code',
                name: 'Mã lỗi vi phạm',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 120,
                formatter: this.commonTooltipFormatter,
            },
            {
                id: 'TypeName',
                name: 'Loại lỗi vi phạm',
                field: 'TypeName',
                sortable: true,
                filterable: true,
                minWidth: 150,
                hidden: true,
                formatter: this.commonTooltipFormatter,
            },
            {
                id: 'Content',
                name: 'Nội dung lỗi vi phạm',
                field: 'Content',
                sortable: true,
                filterable: true,
                minWidth: 300,
                formatter: this.commonTooltipFormatter,
            },
            {
                id: 'Quantity',
                name: 'Số vi phạm',
                field: 'Quantity',
                sortable: true,
                filterable: true,
                minWidth: 100,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'UnitText',
                name: 'Đơn vị',
                field: 'UnitText',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: this.commonTooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Monney',
                name: 'Tiền phạt',
                field: 'Monney',
                sortable: true,
                filterable: true,
                minWidth: 120,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                field: 'Note',
                sortable: true,
                filterable: true,
                minWidth: 150,
                formatter: this.commonTooltipFormatter,
            },
            // Column group: Đánh giá
            {
                id: 'TotalMoney_1',
                name: '1',
                field: 'TotalMoney_1',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoney_2',
                name: '2',
                field: 'TotalMoney_2',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoney_3',
                name: '3',
                field: 'TotalMoney_3',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoney_4',
                name: '4',
                field: 'TotalMoney_4',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoney_5',
                name: '5',
                field: 'TotalMoney_5',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoney_6',
                name: '>5',
                field: 'TotalMoney_6',
                columnGroup: 'Đánh giá',
                sortable: true,
                filterable: true,
                minWidth: 80,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container',
                calculateAvailableSizeBy: 'container',
            },
            enableAutoResize: true,
            enableCellNavigation: true,
            enableColumnReorder: true,
            enableSorting: true,
            enableFiltering: true,
            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
            preHeaderPanelHeight: 28,
            rowHeight: 35,
            headerRowHeight: 40,
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideSelectAllCheckbox: false,
            },
            multiSelect: false,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            // Enable grouping
            draggableGrouping: {
                dropPlaceHolderText: 'Kéo cột vào đây để nhóm',
                deleteIconCssClass: 'fa fa-times',
                groupIconCssClass: 'fa fa-object-group',
            },
            // Define the grouping column to exclude from export
            // enableDraggableGrouping: true,
            // Enable Excel Export
            enableExcelExport: true,
            excelExportOptions: {
                exportWithFormatter: true,
                addGroupIndentation: false,
            },
            externalResources: [this.excelExportService],
        };
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;

        // Mark the group column as excludeFromExport
        setTimeout(() => {
            const slickGrid = this.angularGrid?.slickGrid;
            if (slickGrid) {
                const columns = slickGrid.getColumns();
                columns.forEach((col: any) => {
                    // Find the draggable grouping column and exclude it from export
                    if (col.id && col.id.toString().includes('_group')) {
                        col.excludeFromExport = true;
                    }
                });
                slickGrid.setColumns(columns);
            }
        }, 50);

        // Auto group by TypeName
        setTimeout(() => {
            if (this.angularGrid && this.angularGrid.dataView) {
                this.angularGrid.dataView.setGrouping({
                    getter: 'TypeName',
                    formatter: (g: any) => `Loại lỗi: <strong>${g.value}</strong> <span style="color:green">(${g.count} dòng)</span>`,
                    aggregateCollapsed: false,
                    lazyTotalsCalculation: true,
                });
            }
        }, 100);
    }

    private applyDistinctFiltersToGrid(): void {
        if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;

        const data = this.angularGrid.dataView.getItems();
        if (!data || data.length === 0) return;

        const fieldsToFilter = ['Department', 'UnitText'];

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

        const columns = this.angularGrid.slickGrid.getColumns();
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
        this.columnDefinitions.forEach((colDef: any) => {
            if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
                const field = colDef.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                colDef.filter.collection = getUniqueValues(data, field);
            }
        });

        this.angularGrid.slickGrid.setColumns(this.angularGrid.slickGrid.getColumns());
        this.angularGrid.slickGrid.invalidate();
        this.angularGrid.slickGrid.render();
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

    private commonTooltipFormatter = (_row: any, _cell: any, value: any, _column: any, _dataContext: any) => {
        if (!value) return '';
        const escaped = this.escapeHtml(value);
        return `
                <span
                title="${escaped}"
                style="
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.4;
                "
                >
                ${value}
                </span>
            `;
    };
}
