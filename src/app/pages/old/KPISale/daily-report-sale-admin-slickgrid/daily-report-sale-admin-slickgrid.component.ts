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
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { DailyReportSaleAdminService } from '../daily-report-sale-admin/daily-report-sale-admin-service/daily-report-sale-admin.service';
import { DailyReportSaleAdminDetailComponent } from '../daily-report-sale-admin/daily-report-sale-admin-detail/daily-report-sale-admin-detail.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-daily-report-sale-admin-slickgrid',
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
    templateUrl: './daily-report-sale-admin-slickgrid.component.html',
    styleUrl: './daily-report-sale-admin-slickgrid.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DailyReportSaleAdminSlickgridComponent implements OnInit, AfterViewInit {
    // SlickGrid properties
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // PrimeNG Menubar
    menuBars: any[] = [];

    warehouseId: number = 0;

    customers: any[] = [];
    employees: any[] = [];
    selectedRowId: number = 0;
    selectedRowEmployeeId: number = 0;
    selectedRow: any = null;
    isGridReady: boolean = false;
    rowSpanMetadata: Record<number, any> = {};

    filters: any = {
        startDate: new Date(),
        endDate: new Date(),
        customerId: 0,
        employeeId: 0,
        filterText: '',
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
                command: () => this.onDeleteDailyReportSaleAdmin()
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportExcel()
            },
        ];
    }

    constructor(
        private dailyReportSaleAdminService: DailyReportSaleAdminService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private nzModalService: NzModalService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.initMenuBar();
        this.initGrid();

        this.route.queryParams.subscribe(params => {
            this.warehouseId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 1;
        });

        this.loadEmployees();
        this.loadCustomers();
    }

    ngAfterViewInit(): void {
    }

    searchData(): void {
        this.loadData();
    }

    loadEmployees(): void {
        this.dailyReportSaleAdminService.getEmployees().subscribe(
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

    loadCustomers(): void {
        this.dailyReportSaleAdminService.getCustomers().subscribe(
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

    openModal(): void {
        const modalRef = this.modalService.open(DailyReportSaleAdminDetailComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            backdrop: 'static',
        });

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
        const modalRef = this.modalService.open(DailyReportSaleAdminDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.selectedRowId = this.selectedRowId;
        modalRef.componentInstance.isEditMode = true;
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

    onDeleteDailyReportSaleAdmin(): void {
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
                this.dailyReportSaleAdminService.delete(this.selectedRowId).subscribe({
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
                        console.error('Error deleting daily report sale admin:', error);
                        this.notification.error('Lỗi', 'Lỗi kết nối khi xóa báo cáo hàng ngày!');
                    }
                });
            }
        });
    }

    exportExcel(): void {
        const data = this.dataset || [];
        if (data.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo hàng ngày');

        worksheet.columns = [
            { header: 'Ngày', key: 'DateReport', width: 15 },
            { header: 'Nhân viên', key: 'EmployeeFullName', width: 20 },
            { header: 'Loại báo cáo', key: 'ReportTypeName', width: 20 },
            { header: 'Nội dung báo cáo', key: 'ReportContent', width: 30 },
            { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
            { header: 'Khách hàng', key: 'CustomerName', width: 30 },
            { header: 'Người yêu cầu', key: 'EmployeeRequestFullName', width: 20 },
            { header: 'Kết quả xử lý', key: 'Result', width: 30 },
            { header: 'Vấn đề tồn đọng', key: 'Problem', width: 30 },
            { header: 'Kế hoạch tiếp theo', key: 'PlanNextDay', width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

        data.forEach((row: any) => {
            worksheet.addRow({
                ...row,
                DateReport: row.DateReport ? new Date(row.DateReport).toLocaleDateString('vi-VN') : '',
            });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BaoCaoHangNgayAdmin_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
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
            { id: 'DateReport', name: 'Ngày', field: 'DateReport', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.dateFormatter, cssClass: 'text-center', filter: { model: Filters['compoundInputText'] } },
            { id: 'EmployeeFullName', name: 'Nhân viên', field: 'EmployeeFullName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'ReportTypeName', name: 'Loại báo cáo', field: 'ReportTypeName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'ReportContent', name: 'Nội dung báo cáo', field: 'ReportContent', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'EmployeeRequestFullName', name: 'Người yêu cầu', field: 'EmployeeRequestFullName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption } },
            { id: 'Result', name: 'Kết quả xử lý', field: 'Result', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Problem', name: 'Vấn đề tồn đọng', field: 'Problem', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'PlanNextDay', name: 'Kế hoạch tiếp theo', field: 'PlanNextDay', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-daily-report-admin',
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
            enableCellRowSpan: true,
            rowTopOffsetRenderType: 'top',
            dataView: {
                globalItemMetadataProvider: {
                    getRowMetadata: (_item: any, row: number) => {
                        return this.rowSpanMetadata[row];
                    },
                },
            },
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
            this.selectedRowId = item['ID'];
            this.selectedRowEmployeeId = item['EmployeeID'];
            this.selectedRow = item;
        }
    }

    onRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedRowId = item['ID'];
            this.openEditModal();
        }
    }

    loadData(): void {
        const dateStart = new Date(this.filters.startDate);
        dateStart.setHours(0, 0, 0, 0);

        const dateEnd = new Date(this.filters.endDate);
        dateEnd.setHours(23, 59, 59, 999);

        const customerId = this.filters.customerId || 0;
        const userId = this.filters.employeeId || 0;
        const keyword = this.filters.filterText || '';

        this.dailyReportSaleAdminService.loadData(
            dateStart,
            dateEnd,
            customerId,
            userId,
            keyword
        ).subscribe({
            next: (response) => {
                if (response && response.status === 1) {
                    this.dataset = (response.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: `${item.ID}_${index}`
                    }));

                    // Tính toán rowspan metadata cho merge cell
                    this.computeRowSpanMetadata(this.dataset);

                    // Apply distinct filters after data is loaded
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid(
                            this.angularGrid,
                            this.columnDefinitions,
                            ['EmployeeFullName', 'ReportTypeName', 'EmployeeRequestFullName']
                        );
                        // Remap rowspan sau khi data loaded
                        if (this.angularGrid?.slickGrid?.remapAllColumnsRowSpan) {
                            this.angularGrid.slickGrid.remapAllColumnsRowSpan();
                            this.angularGrid.slickGrid.invalidate();
                        }
                    }, 0);
                } else {
                    this.dataset = [];
                }
            },
            error: (error) => {
                console.error('Error loading daily report sale admin data:', error);
                this.notification.error('Lỗi', 'Không thể tải dữ liệu báo cáo hàng ngày!');
            }
        });
    }

    /**
     * Tính toán rowspan metadata cho 2 cột đầu (Ngày, Nhân viên)
     * Nhóm các dòng liên tiếp có cùng DateReport + EmployeeFullName để merge
     */
    private computeRowSpanMetadata(data: any[]): void {
        this.rowSpanMetadata = {};
        if (!data || data.length === 0) return;

        let groupStart = 0;
        for (let i = 1; i <= data.length; i++) {
            const cur = data[i];
            const prev = data[i - 1];

            // Kiểm tra nếu dòng hiện tại khác nhóm trước đó (hoặc đã hết data)
            const isSameGroup = cur
                && this.formatDate(cur['DateReport']) === this.formatDate(prev['DateReport'])
                && cur['EmployeeFullName'] === prev['EmployeeFullName'];

            if (!isSameGroup) {
                const rowspan = i - groupStart;
                if (rowspan > 1) {
                    // Chỉ set metadata khi có >= 2 dòng cùng nhóm
                    this.rowSpanMetadata[groupStart] = {
                        columns: {
                            0: { rowspan },  // Cột Ngày (index 0)
                            1: { rowspan },  // Cột Nhân viên (index 1)
                        }
                    };
                }
                groupStart = i;
            }
        }
    }

    private formatDate(value: any): string {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
