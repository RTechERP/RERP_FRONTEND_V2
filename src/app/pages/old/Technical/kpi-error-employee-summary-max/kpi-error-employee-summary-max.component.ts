import {
    Component,
    OnInit,
    AfterViewInit,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import {
    Aggregators,
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    GridOption,
    Grouping,
    GroupTotalFormatters,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';
import { KpiErrorEmployeeSummaryMaxService } from './kpi-error-employee-summary-max-service/kpi-error-employee-summary-max.service';

@Component({
    selector: 'app-kpi-error-employee-summary-max',
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
        NzDatePickerModule,
        NzDropDownModule,
        AngularSlickgridModule,
    ],
    templateUrl: './kpi-error-employee-summary-max.component.html',
    styleUrl: './kpi-error-employee-summary-max.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [ExcelExportService],
})
export class KpiErrorEmployeeSummaryMaxComponent implements OnInit, AfterViewInit {
    //Main grid
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];
    dynamicMonthColumns: any[] = [];


    // Filters
    keyword: string = '';
    startDate: Date | null = null;
    endDate: Date | null = null;
    kpiErrorTypeId: number = 0;
    employeeId: number = 0;
    departmentId: number = 0;

    // Dropdown data
    kpiErrorTypes: any[] = [];
    employees: any[] = [];
    departments: any[] = [];

    constructor(
        private service: KpiErrorEmployeeSummaryMaxService,
        private notification: NzNotificationService,
        private excelExportService: ExcelExportService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.departmentId = params['departmentId'] ? Number(params['departmentId']) : 0;
        });

        const today = new Date();
        // WinForm logic: dtpDateStart.Value = dateNow.AddMonths(-2); dtpDateEnd.Value = dateNow.AddMonths(+1).AddDays(-1);
        // Assuming user wants the same as WinForm or similar default.
        // Applying the WinForm logic: Start = 2 months ago, End = End of current month?
        // Let's stick to what was there or adjust if user complains, but user specifically pasted winform logic.
        // "DateTime dateNow = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 01);"
        const dateNow = new Date(today.getFullYear(), today.getMonth(), 1);
        this.startDate = new Date(dateNow.getFullYear(), dateNow.getMonth() - 2, 1);
        this.endDate = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0, 23, 59, 59);

        // this.initMenuBar(); // Removed
        this.initGrid();
        this.loadDepartments();
        this.loadEmployees();
        this.loadKPIErrorTypes();
        this.search();
    }

    ngAfterViewInit(): void { }

    loadDepartments(): void {
        this.service.getDepartment().subscribe({
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
        this.service.getEmployees().subscribe({
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
        this.service.getKPIErrorType().subscribe({
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

    search(): void {
        if (!this.startDate || !this.endDate) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
            return;
        }

        // Generate dynamic columns based on date range
        this.generateDynamicColumns(this.startDate, this.endDate);

        this.service.loadData(
            this.startDate,
            this.endDate,
            this.employeeId,
            this.kpiErrorTypeId,
            this.departmentId
        ).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.dataset = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.EmployeeID ? `${item.EmployeeID}_${index}` : `row_${index}`,
                    }));

                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid();
                    }, 100);
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
                }
            },
            error: (error: any) => {
                this.notification.error('Lỗi', 'Không thể tải dữ liệu');
            }
        });
    }

    generateDynamicColumns(startDate: Date, endDate: Date): void {
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        this.dynamicMonthColumns = [];

        while (current <= end) {
            const m = (current.getMonth() + 1).toString().padStart(2, '0');
            const y = current.getFullYear();
            const fieldName = `${m}${y}`;
            const headerName = `${y} / ${m}`;

            this.dynamicMonthColumns.push({
                id: fieldName,
                name: headerName,
                field: fieldName,
                sortable: true,
                minWidth: 100,
                formatter: (row: number, cell: number, value: any) => value !== null && value !== undefined && value !== 0 ? value : '',
                groupTotalsFormatter: GroupTotalFormatters['sumTotals'],
                params: { groupFormatterPrefix: '' }
            });

            current.setMonth(current.getMonth() + 1);
        }

        // Re-initialize columns: Static columns + Dynamic columns
        this.columnDefinitions = [
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Code',
                name: 'Mã nhân viên',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 100,
                hidden: true,
            },
            {
                id: 'FullName',
                name: 'Tên nhân viên',
                field: 'FullName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Content',
                name: 'Nội dung lỗi',
                field: 'Content',
                sortable: true,
                filterable: true,
                minWidth: 300,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            ...this.dynamicMonthColumns
        ];

        if (this.angularGrid && this.angularGrid.slickGrid) {
            this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
        }
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Code',
                name: 'Mã nhân viên',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 100,
                hidden: true,
            },
            {
                id: 'FullName',
                name: 'Tên nhân viên',
                field: 'FullName',
                sortable: true,
                filterable: true,
                minWidth: 200,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
            {
                id: 'Content',
                name: 'Nội dung lỗi',
                field: 'Content',
                sortable: true,
                filterable: true,
                minWidth: 300,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
                },
            },
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container-main',
                calculateAvailableSizeBy: 'container',
            },
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
            enableGrouping: true,
            draggableGrouping: {
                dropPlaceHolderText: 'Kéo cột vào đây để nhóm',
                deleteIconCssClass: 'fa fa-times',
                groupIconCssClass: 'fa fa-object-group',
            },
            externalResources: [this.excelExportService],
        };
    }

    // Grid events
    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    groupByDepartment(): void {
        if (!this.angularGrid?.dataView) return;

        // Create aggregators for all dynamic columns
        const dynamicAggregators = this.dynamicMonthColumns.map(col => new Aggregators['Sum'](col.field));

        this.angularGrid.dataView.setGrouping([
            {
                getter: 'DepartmentName',
                formatter: (g: any) => {
                    return `Phòng ban: <strong>${g.value || '(Không xác định)'}</strong> <span style="color:green">(${g.count} dòng)</span>`;
                },
                aggregators: [
                    ...dynamicAggregators
                ],
                aggregateCollapsed: false,
                collapsed: false,
                lazyTotalsCalculation: true,
            },
            {
                getter: 'FullName',
                formatter: (g: any) => {
                    return `Nhân viên: <strong>${g.value || '(Không xác định)'}</strong> <span style="color:green">(${g.count} dòng)</span>`;
                },
                aggregators: [
                    ...dynamicAggregators
                ],
                aggregateCollapsed: false,
                collapsed: false,
                lazyTotalsCalculation: true,
            }
        ] as Grouping[]);
    }

    async exportToExcel(): Promise<void> {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('KPI Error Employee Summary Max');

            const columnsToExport = this.columnDefinitions.filter(col =>
                !col.excludeFromExport && !col.hidden
            );

            const headers = columnsToExport.map((col: any) => col.name);
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            this.dataset.forEach((rowData: any) => {
                const row = columnsToExport.map((col: any) => {
                    const value = rowData[col.field];
                    if (typeof value === 'number') {
                        return value;
                    }
                    return value ?? '';
                });
                worksheet.addRow(row);
            });

            worksheet.columns.forEach((column: any) => { column.width = 20; });

            const startStr = this.startDate ? `${String(this.startDate.getDate()).padStart(2, '0')}${String(this.startDate.getMonth() + 1).padStart(2, '0')}${this.startDate.getFullYear()}` : '';
            const endStr = this.endDate ? `${String(this.endDate.getDate()).padStart(2, '0')}${String(this.endDate.getMonth() + 1).padStart(2, '0')}${this.endDate.getFullYear()}` : '';

            // Tên file theo format Winform: TongHopNhanVienNhieuLoi_T{MMyyyy}-T{MMyyyy}.xlsx
            // Start month/year and End month/year
            const startMonthYear = this.startDate ? `${String(this.startDate.getMonth() + 1).padStart(2, '0')}${this.startDate.getFullYear()}` : '';
            const endMonthYear = this.endDate ? `${String(this.endDate.getMonth() + 1).padStart(2, '0')}${this.endDate.getFullYear()}` : '';
            const fileName = `TongHopNhanVienNhieuLoi_T${startMonthYear}-T${endMonthYear}.xlsx`;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);

            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Excel export error:', error);
            this.notification.error('Lỗi', 'Không thể export file Excel');
        }
    }

    private applyDistinctFiltersToGrid(): void {
        if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;

        const data = this.angularGrid.dataView.getItems();
        if (!data || data.length === 0) return;

        const fieldsToFilter = ['DepartmentName', 'Content', 'FullName'];

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

        this.columnDefinitions.forEach((colDef: any) => {
            if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
                const field = colDef.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                colDef.filter.collection = getUniqueValues(data, field);
            }
        });

        this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
        this.angularGrid.slickGrid.invalidate();

        // Re-apply grouping with new dynamic aggregators if they exist
        this.groupByDepartment();
    }
}
