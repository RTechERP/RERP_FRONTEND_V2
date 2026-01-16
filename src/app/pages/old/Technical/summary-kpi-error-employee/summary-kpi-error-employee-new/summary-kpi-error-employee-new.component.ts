import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AngularSlickgridModule, Column, GridOption, AngularGridInstance, Formatters } from 'angular-slickgrid';
import { ChartModule } from 'primeng/chart';
import * as ExcelJS from 'exceljs';
import { SummaryKpiErrorEmployeeService } from '../summary-kpi-error-employee-service/summary-kpi-error-employee.service';

@Component({
    selector: 'app-summary-kpi-error-employee-new',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzTabsModule,
        NzSelectModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzInputNumberModule,
        NzFormModule,
        NzDropDownModule,
        NzSplitterModule,
        AngularSlickgridModule,
        ChartModule,
        RouterModule
    ],
    templateUrl: './summary-kpi-error-employee-new.component.html',
    styleUrls: ['./summary-kpi-error-employee-new.component.css']
})
export class SummaryKpiErrorEmployeeNewComponent implements OnInit {
    // Common State
    year: number = new Date().getFullYear();
    month: number = new Date().getMonth() + 1;
    departments: any[] = [];
    kpiErrorTypes: any[] = [];
    kpiErrors: any[] = [];
    employees: any[] = [];
    departmentIdFromRoute: number = 0;

    // Tab 1 State
    departmentId_T1: any = null;
    employeeId_T1: any = null;
    kpiErrorId_T1: any = null;
    keyword_T1: string = '';

    gridTH1!: AngularGridInstance;
    gridTH2!: AngularGridInstance;
    gridTH3!: AngularGridInstance;
    gridFile!: AngularGridInstance;

    datasetTH1: any[] = [];
    datasetTH2: any[] = [];
    datasetTH3: any[] = [];
    datasetFile: any[] = [];

    colDefTH1: Column[] = [];
    colDefTH2: Column[] = [];
    colDefTH3: Column[] = [];
    colDefFile: Column[] = [];

    gridOptionsCommon: GridOption = {
        gridWidth: '100%',
        enableAutoResize: true,
        enableCellNavigation: true,
        enableFiltering: true,
        enableSorting: true,
        enableGrouping: true,
        rowHeight: 35,
        headerRowHeight: 40,
    };

    imageUrl: string = '';

    // Tab 2 State
    departmentId_T2: any = null;
    kpiErrorTypeId_T2: any = null;
    keyword_T2: string = '';

    gridTK!: AngularGridInstance;
    datasetTK: any[] = [];
    colDefTK: Column[] = [];

    // Tab 3 State
    departmentId_T3: any = null;
    kpiErrorTypeId_T3: any = null;

    chartData: any = { labels: [], datasets: [] };
    chartOptions: any = {};

    gridEmployee!: AngularGridInstance;
    datasetEmployee: any[] = [];
    colDefEmployee: Column[] = [];
    imageUrlEmployee: string = '';
    selectedWeekLabel: string = 'Chi tiết';

    constructor(
        private service: SummaryKpiErrorEmployeeService,
        private notification: NzNotificationService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.departmentIdFromRoute = params['departmentId'] ? Number(params['departmentId']) : 0;
            this.departmentId_T1 = this.departmentIdFromRoute || null;
            this.departmentId_T2 = this.departmentIdFromRoute || null;
            this.departmentId_T3 = this.departmentIdFromRoute || null;

            this.initColumns();
            this.initChartOptions();
            this.loadMasterData();
            // Load initial data
            this.searchTab1();
        });
    }

    loadMasterData() {
        this.service.getDepartment().subscribe(res => { if (res.status === 1) this.departments = res.data; });
        this.service.getKPIErrorType().subscribe(res => { if (res.status === 1) this.kpiErrorTypes = res.data; });
        this.service.getEmployees().subscribe(res => { if (res.status === 1) this.employees = res.data; });
        this.loadKPIErrors();
    }

    loadKPIErrors() {
        this.service.getKPIError(0).subscribe(res => { if (res.status === 1) this.kpiErrors = res.data; });
    }

    // ===== TAB 1 FUNCTIONS =====
    initColumns() {
        // TH1: Lỗi họp phòng KT & KPI
        this.colDefTH1 = [
            { id: 'Code', name: 'Mã lỗi vi phạm', field: 'Code', sortable: true, filterable: true, minWidth: 70 },
            { id: 'Content', name: 'Nội dung lỗi vi phạm', field: 'Content', sortable: true, filterable: true, minWidth: 250 },
            { id: 'DepartmentName', name: 'Phòng ban', field: 'DepartmentName', sortable: true, filterable: true, minWidth: 120 },
            { id: 'TotalError', name: 'Số lần vi phạm', field: 'TotalError', sortable: true, minWidth: 80, formatter: this.totalErrorFormatter },
            { id: 'Quantity', name: 'Tỉ lệ', field: 'Quantity', sortable: true, minWidth: 80 },
            { id: 'TotalErrorReal', name: 'Số lần vi phạm/Tỉ lệ', field: 'TotalErrorReal', sortable: true, minWidth: 80 },
            { id: 'Coefficient', name: 'Hệ số', field: 'Coefficient', sortable: true, minWidth: 70, formatter: this.coefficientFormatter },
            { id: 'TotalMoney', name: 'Tiền phạt', field: 'TotalMoney', sortable: true, minWidth: 100, formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 0 } },
            { id: 'Note', name: 'Ghi chú', field: 'Note', sortable: true, filterable: true, minWidth: 150 },
            { id: 'FullName', name: 'Nhân viên', field: 'FullName', sortable: true, filterable: true, minWidth: 120 },
            { id: 'ErrorDateText', name: 'Ngày vi phạm', field: 'ErrorDateText', sortable: true, minWidth: 100 },
        ];

        // TH2: Lỗi đánh giá riêng KPI
        this.colDefTH2 = [
            { id: 'Code', name: 'Mã lỗi vi phạm', field: 'Code', sortable: true, filterable: true, minWidth: 70 },
            { id: 'Content', name: 'Nội dung lỗi vi phạm', field: 'Content', sortable: true, filterable: true, minWidth: 250 },
            { id: 'DepartmentName', name: 'Phòng ban', field: 'DepartmentName', sortable: true, filterable: true, minWidth: 250 },
            { id: 'TotalError', name: 'Số lần vi phạm', field: 'TotalError', sortable: true, minWidth: 80 },
            { id: 'UnitName', name: 'Đơn vị', field: 'UnitName', sortable: true, minWidth: 80 },
            { id: 'Note', name: 'Ghi chú', field: 'Note', sortable: true, minWidth: 80 },
            { id: 'ErrorDateText', name: 'Ngày vi phạm', field: 'ErrorDateText', sortable: true, minWidth: 80 },
            { id: 'FullName', name: 'Nhân viên', field: 'FullName', sortable: true, filterable: true, minWidth: 120 },
        ];

        // TH3: Điểm cộng
        this.colDefTH3 = [
            { id: 'Code', name: 'Mã điểm cộng', field: 'Code', sortable: true, filterable: true, minWidth: 70 },
            { id: 'Content', name: 'Nội dung điểm cộng', field: 'Content', sortable: true, filterable: true, minWidth: 250 },
            { id: 'DepartmentName', name: 'Phòng ban', field: 'DepartmentName', sortable: true, filterable: true, minWidth: 250 },
            { id: 'TotalErrorReal', name: 'Số lần', field: 'TotalErrorReal', sortable: true, minWidth: 80 },
            { id: 'UnitName', name: 'Đơn vị', field: 'UnitName', sortable: true, minWidth: 80 },
            { id: 'Note', name: 'Ghi chú', field: 'Note', sortable: true, minWidth: 80 },
            { id: 'ErrorDateText', name: 'Ngày', field: 'ErrorDateText', sortable: true, minWidth: 80 },
            { id: 'FullName', name: 'Nhân viên', field: 'FullName', sortable: true, minWidth: 80 },
        ];

        // File Grid 
        this.colDefFile = [
            { id: 'FileName', name: 'Tên file', field: 'FileName', sortable: true, minWidth: 150 },
            { id: 'ErrorDateText', name: 'Ngày vi phạm', field: 'ErrorDate', sortable: true, minWidth: 100, formatter: this.dateFormatter.bind(this) },
            { id: 'ErrorName', name: 'Tên lỗi', field: 'ErrorName', sortable: true, minWidth: 0, width: 10 },
            { id: 'EmployeeName', name: 'Nhân viên', field: 'Employee', sortable: true, minWidth: 0, width: 10 },
        ];

        // TK Grid
        this.colDefTK = [
            { id: 'Code', name: 'Mã', field: 'Code', sortable: true, filterable: true, minWidth: 80 },
            { id: 'TypeName', name: 'Loại lỗi', field: 'TypeName', sortable: true, filterable: true, minWidth: 130, hidden: true },
            { id: 'Content', name: 'Nội dung', field: 'Content', sortable: true, filterable: true, minWidth: 250 },
            { id: 'Quantity', name: 'Số vi phạm', field: 'Quantity', sortable: true, minWidth: 80 },
            { id: 'Unit', name: 'Đơn vị', field: 'Unit', sortable: true, minWidth: 70 },
            { id: 'Monney', name: 'Tiền phạt', field: 'Monney', sortable: true, minWidth: 90, formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 0 } },
            { id: 'Week1', name: 'Tuần 1', field: 'Week1', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Week2', name: 'Tuần 2', field: 'Week2', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Week3', name: 'Tuần 3', field: 'Week3', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Week4', name: 'Tuần 4', field: 'Week4', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Week5', name: 'Tuần 5', field: 'Week5', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Week6', name: 'Tuần 6', field: 'Week6', sortable: true, minWidth: 70, formatter: this.weekHighlightFormatter.bind(this) },
            { id: 'Month', name: `Tháng ${this.month}`, field: 'Month', sortable: true, minWidth: 80, formatter: this.weekHighlightFormatter.bind(this) },
        ];

        // Employee Detail Grid
        this.colDefEmployee = [
            { id: 'ErrorNumber', name: 'Số lần vi phạm', field: 'ErrorNumber', sortable: true, minWidth: 80 },
            { id: 'DayError', name: 'Ngày vi phạm', field: 'DayError', sortable: true, minWidth: 100 },
            { id: 'FileName', name: 'File ảnh đính kèm', field: 'FileName', sortable: true, minWidth: 100 },
            { id: 'EmployeeName', name: 'Nhân viên', field: 'EmployeeNameBD', sortable: true, minWidth: 10, width: 10 },

        ];
    }

    searchTab1() {
        this.service.getDataTongHop(
            this.month, this.year, this.kpiErrorId_T1 || 0, this.employeeId_T1 || 0,
            this.departmentId_T1 || 0, this.keyword_T1
        ).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.datasetTH1 = (res.data.data1 || []).map((x: any, i: number) => ({ ...x, id: i }));
                this.datasetTH2 = (res.data.data2 || []).map((x: any, i: number) => ({ ...x, id: i }));
                this.datasetTH3 = (res.data.data3 || []).map((x: any, i: number) => ({ ...x, id: i }));
                this.applyGrouping(this.gridTH1, 'FullName', 'Nhân viên');
                this.applyGrouping(this.gridTH2, 'FullName', 'Nhân viên');
                this.applyGrouping(this.gridTH3, 'FullName', 'Nhân viên');
            }
        });

        this.service.getDataFile(
            this.month, this.year, this.kpiErrorId_T1 || 0, this.employeeId_T1 || 0,
            this.departmentId_T1 || 0, 0, this.keyword_T1
        ).subscribe(res => {
            if (res.status === 1) {
                this.datasetFile = (res.data || []).map((x: any, i: number) => ({ ...x, id: i }));
                // Apply 2-level grouping: ErrorName -> Employee
                setTimeout(() => this.applyMultiLevelGrouping(this.gridFile), 100);
            }
        });
    }

    // Formatters
    totalErrorFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any) {
        if (value >= 2) return `<div style="background-color: #FFFF4A; padding: 2px;">${value}</div>`;
        return value;
    }

    coefficientFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any) {
        if (value >= 2) return `<div style="background-color: #FFA500; color: white; padding: 2px;">${value}</div>`;
        return value;
    }

    weekHighlightFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any) {
        if (value === null || value === undefined) return '';
        if (value >= 10) return `<div style="background-color: #EF1F3E; color: white; padding: 2px;">${value}</div>`;
        if (value >= 5) return `<div style="background-color: #FFFF4A; padding: 2px;">${value}</div>`;
        return value;
    }

    dateFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any) {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const dd = d.getDate().toString().padStart(2, '0');
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    applyGrouping(grid: AngularGridInstance, field: string, label: string) {
        if (grid && grid.dataView) {
            grid.dataView.setGrouping({
                getter: field,
                formatter: (g) => `${label}: ${g.value} <span style="color:green">(${g.count})</span>`
            });
        }
    }

    applyMultiLevelGrouping(grid: AngularGridInstance) {
        if (grid && grid.dataView) {
            grid.dataView.setGrouping([
                {
                    getter: 'ErrorName',
                    formatter: (g) => `${g.value || '(Không có)'}`,
                    aggregateCollapsed: true,
                    lazyTotalsCalculation: true
                },
                {
                    getter: 'Employee',
                    formatter: (g) => `Nhân viên: ${g.value || '(Không có)'} <span style="color:blue">(${g.count})</span>`,
                    aggregateCollapsed: true,
                    lazyTotalsCalculation: true
                }
            ]);
        }
    }

    // Grid Ready Handlers
    onGridReady_TH1(grid: AngularGridInstance) { this.gridTH1 = grid; }
    onGridReady_TH2(grid: AngularGridInstance) { this.gridTH2 = grid; }
    onGridReady_TH3(grid: AngularGridInstance) { this.gridTH3 = grid; }
    onGridReady_File(grid: AngularGridInstance) {
        this.gridFile = grid;
        grid.slickGrid?.onSelectedRowsChanged.subscribe((e, args) => {
            if (args.rows.length) this.loadImage(this.datasetFile[args.rows[0]]);
        });
    }

    loadImage(item: any) {
        if (!item || !item.FileName) { this.imageUrl = ''; return; }
        const d = new Date(item.ErrorDate);
        const path = `${d.getFullYear()}/T${d.getMonth() + 1}/N${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
        this.imageUrl = `http://113.190.234.64:8083/api/kpi/${path}/${item.FileName}`;
    }

    // ===== TAB 2 FUNCTIONS =====
    searchTab2() {
        this.service.getDataThongKe(
            this.month, this.year, this.kpiErrorTypeId_T2 || 0, this.departmentId_T2 || 0, this.keyword_T2
        ).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.datasetTK = res.data.map((x: any, i: number) => ({ ...x, id: i }));
                this.applyGrouping(this.gridTK, 'TypeName', 'Loại lỗi');
            }
        });
    }
    onGridReady_TK(grid: AngularGridInstance) { this.gridTK = grid; }

    // ===== TAB 3 FUNCTIONS =====
    initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#333';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#666';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#ddd';

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                title: {
                    display: true,
                    text: `THỐNG KÊ LỖI VI PHẠM THÁNG ${this.month} NĂM ${this.year}`,
                    font: { size: 16, weight: 'bold' },
                    color: '#FFA500'
                },
                legend: {
                    labels: { color: textColor },
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => `${context.dataset.label}: ${context.parsed.y} lỗi`
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: textColorSecondary, font: { weight: 500 } },
                    grid: { color: surfaceBorder }
                },
                y: {
                    stacked: true,
                    ticks: { color: textColorSecondary, stepSize: 1 },
                    grid: { color: surfaceBorder }
                }
            },
            onClick: (e: any, elements: any) => this.onChartClick(e, elements)
        };
    }

    searchTab3() {
        this.service.getDataThongKe(
            this.month, this.year, this.kpiErrorTypeId_T3 || 0, this.departmentId_T3 || 0, ''
        ).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.processChartData(res.data);
                // Update chart title
                this.chartOptions = {
                    ...this.chartOptions,
                    plugins: {
                        ...this.chartOptions.plugins,
                        title: {
                            ...this.chartOptions.plugins.title,
                            text: `THỐNG KÊ LỖI VI PHẠM THÁNG ${this.month} NĂM ${this.year}`
                        }
                    }
                };
            }
        });
    }

    processChartData(data: any[]) {
        const labels = data.map(x => x.Code);
        const datasets = [];
        const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#7E57C2'];

        for (let i = 1; i <= 6; i++) {
            datasets.push({
                label: `Tuần ${i}`,
                data: data.map(x => x[`Week${i}`] || 0),
                backgroundColor: colors[i - 1],
                weekIndex: i
            });
        }
        this.chartData = { labels, datasets };
    }

    onChartClick(event: any, elements: any[]) {
        if (!elements || !elements.length) return;
        const el = elements[0];
        const weekIndex = el.datasetIndex + 1;
        const kpiCode = this.chartData.labels[el.index];

        // Try to find KPI info from datasetTK first (if loaded), then from kpiErrors
        const kpiFromTK = this.datasetTK.find(x => x.Code === kpiCode);
        const kpi = kpiFromTK || this.kpiErrors.find(x => x.Code === kpiCode);
        const content = kpi?.Content || '';
        const kpiErrorId = kpi?.ID || 0;

        this.selectedWeekLabel = `Tuần: ${weekIndex}${content ? ` - ${kpiCode}: ${content}` : ''}`;

        // Load employee details
        if (kpiErrorId) {
            this.service.getKPIErrorInMonth(this.month, this.year, kpiErrorId, weekIndex, this.departmentId_T3 || 0)
                .subscribe(res => {
                    if (res.status === 1) {
                        this.datasetEmployee = (res.data || []).map((x: any, i: number) => ({ ...x, id: i }));
                        // Apply grouping by employee name
                        setTimeout(() => this.applyGrouping(this.gridEmployee, 'EmployeeNameBD', 'Nhân viên'), 100);
                    }
                });
        }
    }

    onGridReady_Employee(grid: AngularGridInstance) {
        this.gridEmployee = grid;
        grid.slickGrid?.onSelectedRowsChanged.subscribe((e, args) => {
            if (args.rows.length) this.loadImageEmployee(this.datasetEmployee[args.rows[0]]);
        });
    }

    loadImageEmployee(item: any) {
        if (!item || !item.FileImageName) { this.imageUrlEmployee = ''; return; }
        const d = new Date(item.ErrorDate);
        const path = `${d.getFullYear()}/T${d.getMonth() + 1}/N${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
        this.imageUrlEmployee = `http://113.190.234.64:8083/api/kpi/${path}/${item.FileImageName}`;
    }

    async exportExcel() {
        const activeTab = this.gridTH1 ? 'TH' : 'TK';
    }

    async exportExcelTab1() {
        if (!this.datasetTH1.length) { this.notification.warning('Thông báo', 'Không có dữ liệu'); return; }
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('TongHop');

        this.writeSheet(ws, this.colDefTH1, this.datasetTH1);

        const buffer = await wb.xlsx.writeBuffer();
        this.saveFile(buffer, `TongHopLoi_${this.month}_${this.year}.xlsx`);
    }

    async exportExcelTab2() {
        if (!this.datasetTK.length) { this.notification.warning('Thông báo', 'Không có dữ liệu'); return; }
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('ThongKe');

        this.writeSheet(ws, this.colDefTK, this.datasetTK);

        const buffer = await wb.xlsx.writeBuffer();
        this.saveFile(buffer, `ThongKeLoi_${this.month}_${this.year}.xlsx`);
    }

    private writeSheet(ws: ExcelJS.Worksheet, cols: Column[], data: any[]) {
        const headers = cols.filter(c => !c.hidden).map(c => c.name || '');
        ws.addRow(headers).font = { bold: true };

        data.forEach(item => {
            const row = cols.filter(c => !c.hidden).map(c => item[c.field] || '');
            ws.addRow(row);
        });
        ws.columns.forEach(c => { c.width = 20; });
    }

    private saveFile(buffer: any, fileName: string) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    onTabSelect(event: any) {
        if (event.index === 1) this.searchTab2();
        if (event.index === 2) this.searchTab3();

        setTimeout(() => {
            this.gridTH1?.resizerService?.resizeGrid();
            this.gridTH2?.resizerService?.resizeGrid();
            this.gridTH3?.resizerService?.resizeGrid();
            this.gridFile?.resizerService?.resizeGrid();
            this.gridTK?.resizerService?.resizeGrid();
            this.gridEmployee?.resizerService?.resizeGrid();
        }, 200);
    }

    onSubTabSelect(event: any) {
        // Resize grids when switching between sub-tabs in Tab 1
        setTimeout(() => {
            if (event.index === 0) {
                this.gridTH1?.resizerService?.resizeGrid();
            } else if (event.index === 1) {
                this.gridTH2?.resizerService?.resizeGrid();
            } else if (event.index === 2) {
                this.gridTH3?.resizerService?.resizeGrid();
            }
            this.gridFile?.resizerService?.resizeGrid();
        }, 200);
    }
}
