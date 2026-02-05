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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MenuCommandItem,
    MenuCommandItemCallbackArgs,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { ActivatedRoute } from '@angular/router';
import { KpiErrorEmployeeService } from './kpi-error-employee-service/kpi-error-employee.service';
import { KpiErrorEmployeeDetailComponent } from './kpi-error-employee-detail/kpi-error-employee-detail.component';
import { ImportExcelKpiErrorEmployeeComponent } from './import-excel/import-excel.component';

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
        NzDatePickerModule,
        NzSplitterModule,
        NzDropDownModule,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './kpi-error-employee.component.html',
    styleUrl: './kpi-error-employee.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [ExcelExportService],
})
export class KpiErrorEmployeeComponent implements OnInit, AfterViewInit {
    // SlickGrid - Main grid
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // SlickGrid - File grid
    angularGridFile!: AngularGridInstance;
    columnDefinitionsFile: Column[] = [];
    gridOptionsFile: GridOption = {};
    datasetFile: any[] = [];

    // Menu bar
    menuBars: any[] = [];

    // Filters
    keyword: string = '';
    startDate: Date | null = null;
    endDate: Date | null = null;
    kpiErrorTypeId: number = 0;
    kpiErrorId: number = 0;
    employeeId: number = 0;
    departmentId: number = 0;

    // Dropdown data
    kpiErrorTypes: any[] = [];
    kpiErrors: any[] = [];
    employees: any[] = [];
    departments: any[] = [];

    // Selected row
    selectedId: number = 0;
    selectedRow: any = null;

    // Total summary
    totalErrorNumber: number = 0;

    constructor(
        private kpiErrorEmployeeService: KpiErrorEmployeeService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private route: ActivatedRoute,
        private excelExportService: ExcelExportService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        // Get departmentId from route snapshot or tabData synchronously first
        const queryDepartmentId = this.route.snapshot.queryParams['departmentId'];
        this.departmentId = queryDepartmentId
            ? Number(queryDepartmentId)
            : (this.tabData?.departmentId ?? 0);

        // Also subscribe for dynamic changes
        this.route.queryParams.subscribe(params => {
            const newDepartmentId = params['departmentId']
                ? Number(params['departmentId'])
                : (this.tabData?.departmentId ?? 0);
            if (newDepartmentId !== this.departmentId) {
                this.departmentId = newDepartmentId;
                this.search();
            }
        });

        const today = new Date();
        // First day of month at 00:00:00
        this.startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        // Last day of month at 23:59:59
        this.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        this.initMenuBar();
        this.initGrid();
        this.initFileGrid();

        this.loadDepartments();
        this.loadEmployees();
        this.loadKPIErrorTypes();
        this.loadKPIErrors();

        this.search();
    }

    ngAfterViewInit(): void { }

    loadDepartments(): void {
        this.kpiErrorEmployeeService.getDepartment().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.departments = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    loadEmployees(): void {
        this.kpiErrorEmployeeService.getEmployees().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.employees = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    loadKPIErrorTypes(): void {
        this.kpiErrorEmployeeService.getKPIErrorType().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.kpiErrorTypes = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI Error Types:', error);
            }
        });
    }

    loadKPIErrors(): void {
        this.kpiErrorEmployeeService.getKPIError(this.kpiErrorTypeId || 0).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.kpiErrors = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI Errors:', error);
            }
        });
    }

    onTypeChange(): void {
        this.kpiErrorId = 0;
        this.loadKPIErrors();
        this.search();
    }

    loadFileData(kpiErrorEmployeeId: number): void {
        this.kpiErrorEmployeeService.loadDataFile(kpiErrorEmployeeId).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.datasetFile = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `file_${index}`
                    }));
                }
            },
            error: (error: any) => {
                console.error('Error loading file data:', error);
            }
        });
    }


    search(): void {
        if (!this.startDate || !this.endDate) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        this.kpiErrorEmployeeService.loadData(
            this.startDate,
            this.endDate,
            this.kpiErrorId,
            this.employeeId,
            this.kpiErrorTypeId,
            this.departmentId,
            this.keyword
        ).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.dataset = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID,
                        STT: index + 1,
                    }));
                    // Calculate total ErrorNumber
                    this.totalErrorNumber = this.dataset.reduce((sum: number, item: any) => {
                        return sum + (Number(item.ErrorNumber) || 0);
                    }, 0);
                    // Apply distinct filters after data loads
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid();
                    }, 100);
                    // Clear file grid
                    this.datasetFile = [];
                    this.selectedId = 0;
                    this.selectedRow = null;
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
                }
            },
            error: (error: any) => {
                this.notification.error('Lỗi', 'Không thể tải dữ liệu');
            }
        });
    }



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
                label: 'Nhập Excel',
                icon: 'fa-solid fa-file-import fa-lg text-primary',
                command: () => {
                    this.importExcel();
                },
            },
            {
                label: 'Tự động thêm lỗi BCCV',
                icon: 'fa-solid fa-wand-magic-sparkles fa-lg text-warning',
                command: () => {
                    this.autoAddError();
                },
            },
        ];
    }



    onRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem?.(args.row);
        if (item && item.ID) {
            this.selectedId = item.ID;
            this.selectedRow = item;
            // Load file data
            this.loadFileData(this.selectedId);
        }
    }

    // Menu actions
    onAdd(): void {
        const modalRef = this.modalService.open(KpiErrorEmployeeDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
        modalRef.componentInstance.id = 0;
        modalRef.componentInstance.isEditMode = false;
        modalRef.componentInstance.departmentId = this.departmentId;

        modalRef.result.then(
            () => {
                this.search();
            },
            () => { }
        );
    }

    onEdit(): void {
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
        modalRef.componentInstance.departmentId = this.departmentId;

        modalRef.result.then(
            () => {
                this.search();
            },
            () => { }
        );
    }

    onDelete(): void {
        if (!this.selectedId) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
            return;
        }

        // Get selected rows from grid
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để xóa');
            return;
        }

        const idsToDelete: number[] = selectedRows.map((rowIndex: number) => {
            const item = this.angularGrid.dataView.getItem(rowIndex);
            return item?.ID;
        }).filter((id: number) => id);

        if (idsToDelete.length === 0) {
            this.notification.warning('Cảnh báo', 'Không tìm thấy ID để xóa');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ${idsToDelete.length} dòng đã chọn?`,
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.kpiErrorEmployeeService.deleteKPIErrorEmployee(idsToDelete).subscribe({
                    next: (response: any) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', response.message || 'Xóa thành công');
                            this.search();
                        } else {
                            this.notification.error('Lỗi', response.message || 'Xóa thất bại');
                        }
                    },
                    error: (error: any) => {
                        this.notification.error('Lỗi', 'Không thể xóa dữ liệu');
                    }
                });
            }
        });
    }

    autoAddError(): void {
        if (!this.startDate || !this.endDate) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: 'Bạn có chắc chắn muốn tự động thêm lỗi BCCV?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.kpiErrorEmployeeService.autoAdd(this.startDate!, this.endDate!).subscribe({
                    next: (response: any) => {
                        if (response.status === 1) {
                            const inserted = response.data?.Inserted || 0;
                            this.notification.success('Thành công', `Đã thêm ${inserted} lỗi BCCV`);
                            this.search();
                        } else {
                            this.notification.error('Lỗi', response.message || 'Thêm lỗi thất bại');
                        }
                    },
                    error: (error: any) => {
                        this.notification.error('Lỗi', 'Không thể tự động thêm lỗi');
                    }
                });
            }
        });
    }

    private getFileContextMenuOptions(): MenuCommandItem[] {
        return [
            {
                iconCssClass: 'fa fa-eye',
                title: 'Xem ảnh',
                command: 'view',
                positionOrder: 60,
            },
        ];
    }

    handleFileContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
        const command = args.command;
        const dataContext = args.dataContext;

        switch (command) {
            case 'view':
                this.viewFile(dataContext);
                break;
        }
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

        // Construct URL pattern: http://113.190.234.64:8083/api/kpi/{year}/T{month}/N{dd.MM.yyyy}/{fileName}
        const year = errorDate.getFullYear();
        const month = errorDate.getMonth() + 1;
        const day = String(errorDate.getDate()).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const yearStr = String(year);
        const dateFolder = `${day}.${monthStr}.${yearStr}`;

        const baseUrl = 'http://113.190.234.64:8083/api/kpi';
        const url = `${baseUrl}/${year}/T${month}/N${dateFolder}/${file.FileName}`;

        const newWindow = window.open(
            url,
            '_blank',
            'width=1000,height=700'
        );

        if (newWindow) {
            newWindow.onload = () => {
                newWindow.document.title = file.FileName;
            };
        }
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
                id: 'Code',
                name: 'Mã lỗi vi phạm',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 80,
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
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
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
                id: 'Employee',
                name: 'Nhân viên',
                field: 'Employee',
                sortable: true,
                filterable: true,
                minWidth: 170,
                formatter: this.commonTooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'ErrorDate',
                name: 'Ngày vi phạm',
                field: 'ErrorDate',
                sortable: true,
                filterable: true,
                minWidth: 120,
                formatter: Formatters.dateEuro,
                filter: {
                    model: Filters['compoundDate'],
                    filterOptions: {
                        enableTime: false,
                        dateFormat: 'd/m/Y',
                    },
                },
            },
            {
                id: 'ErrorNumber',
                name: 'Số lần vi phạm',
                field: 'ErrorNumber',
                sortable: true,
                filterable: true,
                minWidth: 100,
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-center',
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                field: 'Note',
                sortable: true,
                filterable: true,
                minWidth: 200,
                cssClass: 'cell-wrap',
                formatter: this.commonTooltipFormatter,
            },
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container-main',
                calculateAvailableSizeBy: 'container',
            },
            gridWidth: '100%',
            forceFitColumns: true,
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
            multiSelect: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            // Enable grouping
            draggableGrouping: {
                dropPlaceHolderText: 'Kéo cột vào đây để nhóm',
                deleteIconCssClass: 'fa fa-times',
                groupIconCssClass: 'fa fa-object-group',
            },
            externalResources: [this.excelExportService],
        };
    }

    initFileGrid(): void {
        this.columnDefinitionsFile = [
            {
                id: 'ID',
                name: 'ID',
                field: 'ID',
                sortable: true,
                maxWidth: 60,
                hidden: true,
            },
            {
                id: 'FileName',
                name: 'File ảnh đính kèm',
                field: 'FileName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                formatter: this.commonTooltipFormatter,
            },
        ];

        this.gridOptionsFile = {
            autoResize: {
                container: '.grid-container-file',
                calculateAvailableSizeBy: 'container',
            },
            gridWidth: '100%',
            forceFitColumns: true,
            enableAutoResize: true,
            enableCellNavigation: true,
            enableSorting: true,
            enableFiltering: false,
            rowHeight: 35,
            headerRowHeight: 40,
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideSelectAllCheckbox: false,
            },
            multiSelect: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            enableContextMenu: true,
            contextMenu: {
                commandItems: this.getFileContextMenuOptions(),
                onCommand: (e, args) => this.handleFileContextMenuCommand(e, args),
            },
        };
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
    }

    // Grid events
    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;

        // Auto group by TypeName and Employee
        setTimeout(() => {
            if (this.angularGrid && this.angularGrid.dataView) {
                this.angularGrid.dataView.setGrouping([
                    {
                        getter: 'TypeName',
                        formatter: (g: any) => `Loại lỗi: <strong>${g.value}</strong> <span style="color:red">(${g.count} lỗi)</span>`,
                        aggregateCollapsed: false,
                        lazyTotalsCalculation: true,
                    },
                    {
                        getter: 'Employee',
                        formatter: (g: any) => `Nhân viên: <strong>${g.value}</strong> <span style="color:red">(${g.count} lỗi)</span>`,
                        aggregateCollapsed: false,
                        lazyTotalsCalculation: true,
                    },
                ]);
            }
        }, 100);
    }

    angularGridFileReady(angularGrid: AngularGridInstance): void {
        this.angularGridFile = angularGrid;
    }

    async exportToExcel(): Promise<void> {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('KPI Error Employee');

            const columnsToExport = this.columnDefinitions.filter(col =>
                !col.excludeFromExport && col.id !== 'STT'
            );

            const headers = columnsToExport.map((col: any) => col.name);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            this.dataset.forEach((rowData: any) => {
                const row = columnsToExport.map((col: any) => {
                    const value = rowData[col.field];
                    // Format date column to dd/MM/yyyy
                    if (col.field === 'ErrorDate' && value) {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                        }
                    }
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

    private applyDistinctFiltersToGrid(): void {
        if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;

        const data = this.angularGrid.dataView.getItems();
        if (!data || data.length === 0) return;

        const fieldsToFilter = ['DepartmentName', 'Content', 'Employee'];

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
}
