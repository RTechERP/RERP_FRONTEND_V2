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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { finalize } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { SummaryKpiErrorEmployeeService } from '../summary-kpi-error-employee/summary-kpi-error-employee-service/summary-kpi-error-employee.service';

type KpiColumnType = 'text' | 'number' | 'money' | 'date' | 'totalError' | 'coefficient' | 'week';
type LoadingKey = 'th' | 'file' | 'tk' | 'chart' | 'employee';

interface KpiTableColumn {
    id: string;
    name: string;
    field: string;
    minWidth?: number;
    width?: number;
    hidden?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    type?: KpiColumnType;
    align?: 'left' | 'center' | 'right';
}

@Component({
    selector: 'app-summary-kpi-error-employee-primeng',
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
        NzToolTipModule,
        TableModule,
        ChartModule,
        RouterModule
    ],
    templateUrl: './summary-kpi-error-employee-primeng.component.html',
    styleUrls: ['./summary-kpi-error-employee-primeng.component.css']
})
export class SummaryKpiErrorEmployeePrimengComponent implements OnInit {
    year: number = new Date().getFullYear();
    month: number = new Date().getMonth() + 1;
    departments: any[] = [];
    kpiErrorTypes: any[] = [];
    kpiErrors: any[] = [];
    employees: any[] = [];
    departmentIdFromRoute: number = 0;

    departmentId_T1: any = null;
    employeeId_T1: any = null;
    kpiErrorId_T1: any = null;
    keyword_T1: string = '';

    datasetTH1: any[] = [];
    datasetTH2: any[] = [];
    datasetTH3: any[] = [];
    datasetFile: any[] = [];

    colDefTH1: KpiTableColumn[] = [];
    colDefTH2: KpiTableColumn[] = [];
    colDefTH3: KpiTableColumn[] = [];
    colDefFile: KpiTableColumn[] = [];
    loadingTH: boolean = false;
    loadingFile: boolean = false;

    imageUrl: string = '';
    isImageVisible: boolean = false;
    selectedFileRow: any = null;

    departmentId_T2: any = null;
    kpiErrorTypeId_T2: any = null;
    keyword_T2: string = '';
    datasetTK: any[] = [];
    colDefTK: KpiTableColumn[] = [];
    loadingTK: boolean = false;

    departmentId_T3: any = null;
    kpiErrorTypeId_T3: any = null;

    chartData: any = { labels: [], datasets: [] };
    chartOptions: any = {};
    loadingChart: boolean = false;

    datasetEmployee: any[] = [];
    colDefEmployee: KpiTableColumn[] = [];
    imageUrlEmployee: string = '';
    isImageEmployeeVisible: boolean = false;
    selectedEmployeeRow: any = null;
    loadingEmployee: boolean = false;
    selectedWeekLabel: string = 'Chi tiết';

    private loadingCounts: Record<LoadingKey, number> = {
        th: 0,
        file: 0,
        tk: 0,
        chart: 0,
        employee: 0
    };

    fileMultiSortMeta = [
        { field: 'ErrorName', order: 1 },
        { field: 'Employee', order: 1 }
    ];

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
            this.searchTab1();
        });
    }

    loadMasterData(): void {
        this.service.getDepartment().subscribe(res => { if (res.status === 1) this.departments = res.data; });
        this.service.getKPIErrorType().subscribe(res => { if (res.status === 1) this.kpiErrorTypes = res.data; });
        this.service.getEmployees().subscribe(res => { if (res.status === 1) this.employees = res.data; });
        this.loadKPIErrors();
    }

    loadKPIErrors(): void {
        this.service.getKPIError(0).subscribe(res => { if (res.status === 1) this.kpiErrors = res.data; });
    }

    get loadingTab1(): boolean {
        return this.loadingTH || this.loadingFile;
    }

    initColumns(): void {
        this.colDefTH1 = [
            this.textCol('FullName', 'Nhân viên', 'FullName', 150),
            this.textCol('Code', 'Mã lỗi vi phạm', 'Code', 70),
            this.textCol('Content', 'Nội dung lỗi vi phạm', 'Content', 250),
            this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 150),
            this.numberCol('TotalError', 'Số lần vi phạm', 'TotalError', 80, 'totalError'),
            this.numberCol('Quantity', 'Tỉ lệ', 'Quantity', 80),
            this.numberCol('TotalErrorReal', 'Số lần vi phạm/Tỉ lệ', 'TotalErrorReal', 80),
            this.numberCol('Coefficient', 'Hệ số', 'Coefficient', 70, 'coefficient'),
            this.numberCol('TotalMoney', 'Tiền phạt', 'TotalMoney', 100, 'money'),
            this.textCol('Note', 'Ghi chú', 'Note', 200),
            this.textCol('ErrorDateText', 'Ngày vi phạm', 'ErrorDateText', 150),
        ];

        this.colDefTH2 = [
            this.textCol('FullName', 'Nhân viên', 'FullName', 120),
            this.textCol('Code', 'Mã lỗi vi phạm', 'Code', 70),
            this.textCol('Content', 'Nội dung lỗi vi phạm', 'Content', 250),
            this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 250),
            this.numberCol('TotalError', 'Số lần vi phạm', 'TotalError', 80),
            this.textCol('UnitName', 'Đơn vị', 'UnitName', 80),
            this.textCol('Note', 'Ghi chú', 'Note', 80),
            this.textCol('ErrorDateText', 'Ngày vi phạm', 'ErrorDateText', 80),
        ];

        this.colDefTH3 = [
            this.textCol('FullName', 'Nhân viên', 'FullName', 80),
            this.textCol('Code', 'Mã điểm cộng', 'Code', 70),
            this.textCol('Content', 'Nội dung điểm cộng', 'Content', 250),
            this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 250),
            this.numberCol('TotalErrorReal', 'Số lần', 'TotalErrorReal', 80),
            this.textCol('UnitName', 'Đơn vị', 'UnitName', 80),
            this.textCol('Note', 'Ghi chú', 'Note', 80),
            this.textCol('ErrorDateText', 'Ngày', 'ErrorDateText', 80),
        ];

        this.colDefFile = [
            this.textCol('FileName', 'Tên file', 'FileName', 150),
            { ...this.textCol('ErrorDateText', 'Ngày vi phạm', 'ErrorDate', 100), type: 'date', align: 'center' },
            this.textCol('ErrorName', 'Tên lỗi', 'ErrorName', 150),
            this.textCol('EmployeeName', 'Nhân viên', 'Employee', 150),
        ];

        this.colDefTK = [
            this.textCol('Code', 'Mã', 'Code', 80),
            { ...this.textCol('TypeName', 'Loại lỗi', 'TypeName', 130), hidden: true },
            this.textCol('Content', 'Nội dung', 'Content', 250),
            this.numberCol('Quantity', 'Số vi phạm', 'Quantity', 80),
            this.textCol('Unit', 'Đơn vị', 'Unit', 70),
            this.numberCol('Monney', 'Tiền phạt', 'Monney', 90, 'money'),
            this.numberCol('Week1', 'Tuần 1', 'Week1', 70, 'week'),
            this.numberCol('Week2', 'Tuần 2', 'Week2', 70, 'week'),
            this.numberCol('Week3', 'Tuần 3', 'Week3', 70, 'week'),
            this.numberCol('Week4', 'Tuần 4', 'Week4', 70, 'week'),
            this.numberCol('Week5', 'Tuần 5', 'Week5', 70, 'week'),
            this.numberCol('Week6', 'Tuần 6', 'Week6', 70, 'week'),
            this.numberCol('Month', `Tháng ${this.month}`, 'Month', 80, 'week'),
        ];

        this.colDefEmployee = [
            this.numberCol('ErrorNumber', 'Số lần vi phạm', 'ErrorNumber', 80),
            this.textCol('DayError', 'Ngày vi phạm', 'DayError', 100),
            this.textCol('FileName', 'File ảnh đính kèm', 'FileName', 100),
            this.textCol('EmployeeName', 'Nhân viên', 'EmployeeNameBD', 120),
        ];
    }

    searchTab1(): void {
        this.startLoading('th');
        this.service.getDataTongHop(
            this.month, this.year, this.kpiErrorId_T1 || 0, this.employeeId_T1 || 0,
            this.departmentId_T1 || 0, this.keyword_T1
        ).pipe(finalize(() => this.stopLoading('th'))).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.datasetTH1 = this.prepareRows(res.data.data1 || [], 'FullName');
                this.datasetTH2 = this.prepareRows(res.data.data2 || [], 'FullName');
                this.datasetTH3 = this.prepareRows(res.data.data3 || [], 'FullName');
            }
        });

        this.startLoading('file');
        this.service.getDataFile(
            this.month, this.year, this.kpiErrorId_T1 || 0, this.employeeId_T1 || 0,
            this.departmentId_T1 || 0, 0, this.keyword_T1
        ).pipe(finalize(() => this.stopLoading('file'))).subscribe(res => {
            if (res.status === 1) {
                this.datasetFile = this.prepareRows(res.data || [], 'ErrorName', 'Employee');
                this.selectedFileRow = null;
                this.imageUrl = '';
                this.isImageVisible = false;
            }
        });
    }

    closeImage(): void {
        this.isImageVisible = false;
    }

    closeEmployeeImage(): void {
        this.isImageEmployeeVisible = false;
    }

    getImageUrl(item: any): string {
        if (!item || !item.FileName) return '';

        const d = this.parseImageDate(item.ErrorDate || item.DayError || item.ErrorDateText);
        if (!d) return '';

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const path = `${d.getFullYear()}/T${d.getMonth() + 1}/N${day}.${month}.${d.getFullYear()}`;
        return `http://113.190.234.64:8083/api/kpi/${path}/${item.FileName}`;
    }

    loadImage(item: any): void {
        this.selectedFileRow = item;
        this.imageUrl = this.getImageUrl(item);
        this.isImageVisible = !!this.imageUrl;
    }

    loadImageEmployee(item: any): void {
        this.selectedEmployeeRow = item;
        this.imageUrlEmployee = this.getImageUrl(item);
        this.isImageEmployeeVisible = !!this.imageUrlEmployee;
    }

    onTableRowClick(item: any, imageMode?: 'file' | 'employee'): void {
        if (imageMode === 'file') {
            this.loadImage(item);
        }
        if (imageMode === 'employee') {
            this.loadImageEmployee(item);
        }
    }

    onTableRowDblClick(item: any, imageMode?: 'file' | 'employee'): void {
        if (!imageMode || !item?.FileName) return;
        const url = this.getImageUrl(item);
        if (url) {
            window.open(url, '_blank');
        }
    }

    searchTab2(): void {
        this.startLoading('tk');
        this.service.getDataThongKe(
            this.month, this.year, this.kpiErrorTypeId_T2 || 0, this.departmentId_T2 || 0, this.keyword_T2
        ).pipe(finalize(() => this.stopLoading('tk'))).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.datasetTK = this.prepareRows(res.data, 'TypeName');
                this.refreshMonthColumnHeader();
            }
        });
    }

    initChartOptions(): void {
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

    searchTab3(): void {
        this.startLoading('chart');
        this.service.getDataThongKe(
            this.month, this.year, this.kpiErrorTypeId_T3 || 0, this.departmentId_T3 || 0, ''
        ).pipe(finalize(() => this.stopLoading('chart'))).subscribe(res => {
            if (res.status === 1 && res.data) {
                this.processChartData(res.data);
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

    processChartData(data: any[]): void {
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

    onChartClick(event: any, elements: any[]): void {
        if (!elements || !elements.length) return;
        const el = elements[0];
        const weekIndex = el.datasetIndex + 1;
        const kpiCode = this.chartData.labels[el.index];

        const kpiFromTK = this.datasetTK.find(x => x.Code === kpiCode);
        const kpi = kpiFromTK || this.kpiErrors.find(x => x.Code === kpiCode);
        const content = kpi?.Content || '';
        const kpiErrorId = kpi?.ID || 0;

        this.selectedWeekLabel = `Tuần: ${weekIndex}${content ? ` - ${kpiCode}: ${content}` : ''}`;

        if (kpiErrorId) {
            this.startLoading('employee');
            this.service.getKPIErrorInMonth(this.month, this.year, kpiErrorId, weekIndex, this.departmentId_T3 || 0)
                .pipe(finalize(() => this.stopLoading('employee')))
                .subscribe(res => {
                    if (res.status === 1) {
                        this.datasetEmployee = this.prepareRows(res.data || [], 'EmployeeNameBD');
                        this.selectedEmployeeRow = null;
                        this.imageUrlEmployee = '';
                        this.isImageEmployeeVisible = false;
                    }
                });
        }
    }

    async exportExcel(): Promise<void> {
        await this.exportExcelTab1();
    }

    async exportExcelTab1(): Promise<void> {
        if (!this.datasetTH1.length) { this.notification.warning('Thông báo', 'Không có dữ liệu'); return; }
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('TongHop');

        const sortedData = [...this.datasetTH1].sort((a, b) => (a.FullName || '').localeCompare(b.FullName || ''));
        this.writeSheet(ws, this.colDefTH1, sortedData);

        const buffer = await wb.xlsx.writeBuffer();
        this.saveFile(buffer, `TongHopLoi_${this.month}_${this.year}.xlsx`);
    }

    async exportExcelAllDepartments(): Promise<void> {
        this.service.getDataTongHop(
            this.month, this.year, this.kpiErrorId_T1 || 0, this.employeeId_T1 || 0,
            0,
            this.keyword_T1
        ).subscribe(async (res: any) => {
            if (res.status === 1 && res.data) {
                const datasetAll = this.prepareRows(res.data.data1 || [], 'FullName');

                if (!datasetAll.length) {
                    this.notification.warning('Thông báo', 'Không có dữ liệu cho tất cả phòng ban');
                    return;
                }

                const wb = new ExcelJS.Workbook();
                const ws = wb.addWorksheet('TongHopTatCa');

                datasetAll.sort((a: any, b: any) => (a.FullName || '').localeCompare(b.FullName || ''));
                this.writeSheet(ws, this.colDefTH1, datasetAll);

                const buffer = await wb.xlsx.writeBuffer();
                this.saveFile(buffer, `TongHopLoi_ToanBoPhongBan_${this.month}_${this.year}.xlsx`);
            } else {
                this.notification.warning('Thông báo', 'Không có dữ liệu');
            }
        });
    }

    async exportExcelTab2(): Promise<void> {
        if (!this.datasetTK.length) { this.notification.warning('Thông báo', 'Không có dữ liệu'); return; }
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('ThongKe');

        this.writeSheet(ws, this.colDefTK, this.datasetTK);

        const buffer = await wb.xlsx.writeBuffer();
        this.saveFile(buffer, `ThongKeLoi_${this.month}_${this.year}.xlsx`);
    }

    onTabSelect(event: any): void {
        if (event.index === 1) this.searchTab2();
        if (event.index === 2) this.searchTab3();
    }

    onSubTabSelect(_event: any): void { }

    visibleColumns(columns: KpiTableColumn[]): KpiTableColumn[] {
        return columns.filter(col => !col.hidden);
    }

    getTotalMoneyTH1(): number {
        return this.datasetTH1.reduce((sum, item) => sum + (Number(item.TotalMoney) || 0), 0);
    }

    formatCell(row: any, col: KpiTableColumn): string {
        const value = row?.[col.field];
        if (value === null || value === undefined || value === '') return '';

        if (col.type === 'money') return this.formatMoneyValue(value);
        if (col.type === 'date') return this.formatDateValue(value);

        return String(value);
    }

    getCellTitle(row: any, col: KpiTableColumn): string {
        return this.stripHtml(this.formatCell(row, col));
    }

    getColumnMinWidth(col: KpiTableColumn): number {
        return col.minWidth || col.width || 120;
    }

    getColumnWidth(col: KpiTableColumn): string {
        const width = col.width || col.minWidth || 120;
        return `${width}px`;
    }

    getColumnFilterType(_col: KpiTableColumn): string {
        return 'text';
    }

    getColumnMatchMode(_col: KpiTableColumn): string {
        return 'contains';
    }

    getCellClass(row: any, col: KpiTableColumn): Record<string, boolean> {
        const numericValue = Number(row?.[col.field]);
        const alignRight = col.align === 'right' || ['number', 'money', 'totalError', 'coefficient', 'week'].includes(col.type || '');
        const alignCenter = col.align === 'center' || col.type === 'date';

        return {
            'text-end': alignRight,
            'text-center': alignCenter,
            'cell-warning': col.type === 'totalError' && numericValue >= 2,
            'cell-orange': col.type === 'coefficient' && numericValue >= 2,
            'cell-danger': col.type === 'week' && numericValue >= 10,
            'cell-week-warning': col.type === 'week' && numericValue >= 5 && numericValue < 10,
        };
    }

    isSelectedRow(row: any, imageMode?: 'file' | 'employee'): boolean {
        if (imageMode === 'file') return this.selectedFileRow === row;
        if (imageMode === 'employee') return this.selectedEmployeeRow === row;
        return false;
    }

    getGroupCount(data: any[], field: string, value: any): number {
        return data.filter(item => (item?.[field] ?? '') === (value ?? '')).length;
    }

    getGroupHeaderText(field: string, label: string, rowData: any): string {
        const value = rowData?.[field] || '(Không có)';
        return label ? `${label}: ${value}` : value;
    }

    trackByRowId(_index: number, row: any): any {
        return row?.id ?? row;
    }

    private startLoading(key: LoadingKey): void {
        this.loadingCounts[key] += 1;
        this.applyLoadingState(key);
    }

    private stopLoading(key: LoadingKey): void {
        this.loadingCounts[key] = Math.max(this.loadingCounts[key] - 1, 0);
        this.applyLoadingState(key);
    }

    private applyLoadingState(key: LoadingKey): void {
        const isLoading = this.loadingCounts[key] > 0;
        if (key === 'th') this.loadingTH = isLoading;
        if (key === 'file') this.loadingFile = isLoading;
        if (key === 'tk') this.loadingTK = isLoading;
        if (key === 'chart') this.loadingChart = isLoading;
        if (key === 'employee') this.loadingEmployee = isLoading;
    }

    private writeSheet(ws: ExcelJS.Worksheet, cols: KpiTableColumn[], data: any[]): void {
        const visibleCols = cols.filter(c => !c.hidden);
        const headers = visibleCols.map(c => c.name || '');
        const headerRow = ws.addRow(headers);

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0070C0' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        let previousFullName = data.length > 0 ? (data[0].FullName || '') : '';
        let startRowForMerge = 2;
        const fullNameColIndex = visibleCols.findIndex(c => c.field === 'FullName') + 1;

        data.forEach((item, index) => {
            const rowData = visibleCols.map(c => {
                const val = item[c.field];
                return val !== undefined && val !== null ? val : '';
            });
            const row = ws.addRow(rowData);
            const currentRowIndex = index + 2;

            visibleCols.forEach((col, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.alignment = { wrapText: true, vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                if ((col.field === 'TotalMoney' || col.field === 'Monney') && item[col.field]) {
                    const num = Number(item[col.field]);
                    if (!isNaN(num)) {
                        cell.value = num;
                        cell.numFmt = '#,##0';
                        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'right' };
                    }
                }
            });

            if (fullNameColIndex > 0) {
                const currentFullName = item.FullName || '';
                if (currentFullName !== previousFullName) {
                    if (currentRowIndex - 1 > startRowForMerge) {
                        ws.mergeCells(startRowForMerge, fullNameColIndex, currentRowIndex - 1, fullNameColIndex);
                    }
                    previousFullName = currentFullName;
                    startRowForMerge = currentRowIndex;
                }
            }
        });

        if (fullNameColIndex > 0 && data.length + 1 > startRowForMerge) {
            ws.mergeCells(startRowForMerge, fullNameColIndex, data.length + 1, fullNameColIndex);
        }

        ws.columns.forEach((c, i) => {
            const field = visibleCols[i]?.field;
            if (field === 'Content' || field === 'Note' || field === 'ErrorContent') {
                c.width = 45;
            } else if (field === 'FullName' || field === 'EmployeeName') {
                c.width = 30;
            } else if (field === 'DepartmentName') {
                c.width = 35;
            } else {
                c.width = 18;
            }
        });
    }

    private saveFile(buffer: any, fileName: string): void {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private textCol(id: string, name: string, field: string, minWidth: number): KpiTableColumn {
        return { id, name, field, minWidth, sortable: true, filterable: true, type: 'text' };
    }

    private numberCol(id: string, name: string, field: string, minWidth: number, type: KpiColumnType = 'number'): KpiTableColumn {
        return { id, name, field, minWidth, sortable: true, filterable: true, type, align: 'right' };
    }

    private prepareRows(data: any[], groupField?: string, secondGroupField?: string): any[] {
        return [...data]
            .map((x: any, i: number) => ({ ...x, id: x.ID ?? `${groupField || 'row'}_${i}` }))
            .sort((a, b) => {
                if (groupField) {
                    const first = String(a[groupField] || '').localeCompare(String(b[groupField] || ''));
                    if (first !== 0) return first;
                }
                if (secondGroupField) {
                    return String(a[secondGroupField] || '').localeCompare(String(b[secondGroupField] || ''));
                }
                return 0;
            });
    }

    private refreshMonthColumnHeader(): void {
        const monthColumn = this.colDefTK.find(col => col.id === 'Month');
        if (monthColumn) {
            monthColumn.name = `Tháng ${this.month}`;
        }
    }

    private formatMoneyValue(value: any): string {
        const num = Number(value);
        if (isNaN(num)) return String(value);
        return num.toLocaleString('vi-VN');
    }

    private formatDateValue(value: any): string {
        if (!value) return '';
        const d = this.parseImageDate(value);
        if (!d) return String(value);
        const dd = d.getDate().toString().padStart(2, '0');
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    private parseImageDate(value: any): Date | null {
        if (!value) return null;
        if (value instanceof Date && !isNaN(value.getTime())) return value;

        const raw = String(value);
        const viDateMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (viDateMatch) {
            const [, day, month, year] = viDateMatch;
            const parsed = new Date(Number(year), Number(month) - 1, Number(day));
            return isNaN(parsed.getTime()) ? null : parsed;
        }

        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    }

    private stripHtml(value: string): string {
        return value.replace(/<[^>]*>/g, '');
    }
}
