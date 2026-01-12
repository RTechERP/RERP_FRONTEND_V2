import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AngularSlickgridModule, Column, GridOption, AngularGridInstance, Aggregators, GroupTotalFormatters, Formatters } from 'angular-slickgrid';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { SummaryKpiErrorEmployeeMonthService } from './summary-kpi-error-employee-month-service/summary-kpi-error-employee-month.service';
import { ChartModule } from 'primeng/chart';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-summary-kpi-error-employee-month',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzGridModule,
    NzCardModule,
    AngularSlickgridModule,
    NzSplitterModule,
    ChartModule
  ],
  templateUrl: './summary-kpi-error-employee-month.component.html',
  styleUrls: ['./summary-kpi-error-employee-month.component.css']
})
export class SummaryKpiErrorEmployeeMonthComponent implements OnInit {
  // Chart Tab Variables (Tab 2)
  startDate_BD: Date | null = null;
  endDate_BD: Date | null = null;
  kpiErrorTypeId_BD: any = null;
  departmentId_BD: any = null;

  // Chart Data
  data: any;
  options: any;

  // Statistics Tab Variables (Tab 1)
  startDate_TK: Date | null = null;
  endDate_TK: Date | null = null;
  kpiErrorTypeId_TK: any = null;
  departmentId_TK: any = null;
  keyword_TK: string = '';

  // Data Sources
  kpiErrorTypes: any[] = [];
  departments: any[] = [];
  departmentIdFromRoute: number = 0;

  // Grid 1 (Chart Tab - Right side)
  angularGrid_BD!: AngularGridInstance;
  columnDefinitions_BD: Column[] = [];
  gridOptions_BD: GridOption = {};
  dataset_BD: any[] = [];

  // Grid 2 (Statistics Tab)
  angularGrid_TK!: AngularGridInstance;
  columnDefinitions_TK: Column[] = [];
  gridOptions_TK: GridOption = {};
  dataset_TK: any[] = [];
  dynamicMonthColumns: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private service: SummaryKpiErrorEmployeeMonthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.departmentIdFromRoute = params['departmentId'] ? Number(params['departmentId']) : 0;
      this.departmentId_TK = this.departmentIdFromRoute;
      this.departmentId_BD = this.departmentIdFromRoute;
    });

    const today = new Date();
    // Default dates: Start of year to Next month 1st (as per WinForm)
    // WinForm: dtpStartDate_TK.Value = new DateTime(DateTime.Now.Year, 1, 1);
    this.startDate_TK = new Date(today.getFullYear(), 0, 1);
    // WinForm: dtpEndDate_TK.Value = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(1).AddSeconds(-1);
    this.endDate_TK = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    this.startDate_BD = new Date(today.getFullYear(), 0, 1);
    this.endDate_BD = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    this.initGrid_BD();
    this.initGrid_TK();
    this.initChartOptions();

    this.loadDepartments();
    this.loadKPIErrorTypes();

    // Initial Load
    this.search_TK();
    this.search_BD();
  }

  loadDepartments(): void {
    this.service.getDepartment().subscribe({
      next: (res: any) => {
        if (res.status === 1) this.departments = res.data;
      },
      error: (err) => console.error(err)
    });
  }

  loadKPIErrorTypes(): void {
    this.service.getKPIErrorType().subscribe({
      next: (res: any) => {
        if (res.status === 1) this.kpiErrorTypes = res.data;
      },
      error: (err) => console.error(err)
    });
  }

  // --- Chart Tab Logic (Tab 2) ---
  initGrid_BD(): void {
    this.columnDefinitions_BD = [
      { id: 'Code', name: 'Mã lỗi', field: 'Code', sortable: true, filterable: true, minWidth: 30 },
      { id: 'TypeName', name: 'Loại lỗi', field: 'TypeName', sortable: true, filterable: true, minWidth: 150, hidden: true },
      { id: 'Content', name: 'Nội dung', field: 'Content', sortable: true, filterable: true, minWidth: 200 },
    ];

    this.gridOptions_BD = {
      // autoResize: {
      //   container: '.grid-container',
      //   calculateAvailableSizeBy: 'container',
      // },
      gridWidth: '100%',
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enableGrouping: true,
      rowHeight: 35,
      headerRowHeight: 40,
    };
  }

  angularGridReady_BD(angularGrid: AngularGridInstance) {
    this.angularGrid_BD = angularGrid;
    this.angularGrid_BD.dataView.setGrouping({
      getter: 'TypeName',
      formatter: (g) => `Loại lỗi: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
      aggregators: [],
      aggregateCollapsed: false,
      collapsed: false
    });
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          },
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + ' lỗi';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            stepSize: 1
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };
  }

  processChartData(data: any[], startMonth: number, endMonth: number) {
    if (!data || data.length === 0) {
      this.data = { labels: [], datasets: [] };
      return;
    }

    const labels = data.map(x => x.Code);
    const datasets = [];
    const colors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#7E57C2', '#5C6BC0', '#26A69A', '#9CCC65', '#D4E157', '#FFCA28', '#FF7043'
    ];

    let colorIdx = 0;
    for (let i = startMonth; i <= endMonth; i++) {
      const fieldName = `Month${i}`;
      const datasetData = data.map(item => item[fieldName] || 0);

      datasets.push({
        label: `Tháng ${i}`,
        backgroundColor: colors[colorIdx % colors.length],
        data: datasetData
      });
      colorIdx++;
    }

    this.data = {
      labels: labels,
      datasets: datasets
    };
  }

  search_BD(): void {
    // 1. Load Grid Data (Existing)
    this.service.getKPIError(this.departmentId_BD || 0).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.dataset_BD = res.data.map((item: any, index: number) => ({ ...item, id: index }));
        }
      },
      error: (err) => this.notification.error('Lỗi', 'Không thể tải dữ liệu lưới biểu đồ')
    });

    // 2. Load Chart Data
    if (!this.startDate_BD || !this.endDate_BD) return;

    if (this.startDate_BD.getFullYear() !== this.endDate_BD.getFullYear()) {
      this.notification.warning('Thông báo', 'Ngày bắt đầu và ngày kết thúc phải trong cùng 1 năm!');
      return;
    }

    this.service.getSummaryKPIErrorMonth(
      this.departmentId_BD || 0,
      this.kpiErrorTypeId_BD || 0,
      this.startDate_BD,
      this.endDate_BD,
      ''
    ).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.processChartData(res.data, this.startDate_BD!.getMonth() + 1, this.endDate_BD!.getMonth() + 1);
        }
      },
      error: (err) => console.error('Chart Data Error', err)
    });
  }

  // --- Statistics Tab Logic (Tab 1) ---
  initGrid_TK(): void {
    this.columnDefinitions_TK = [
      {
        id: 'Code', name: 'Mã', field: 'Code', sortable: true, filterable: true, minWidth: 80, grouping: {
          getter: 'Code',
          formatter: (g) => `Mã: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
          aggregators: [],
          aggregateCollapsed: false,
          collapsed: false
        }
      },
      {
        id: 'TypeName', name: 'Loại lỗi', field: 'TypeName', sortable: true, filterable: true, minWidth: 150,
        grouping: {
          getter: 'TypeName',
          formatter: (g) => `Loại lỗi: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
          aggregators: [],
          aggregateCollapsed: false,
          collapsed: false
        }
      },
      { id: 'Content', name: 'Nội dung', field: 'Content', sortable: true, filterable: true, minWidth: 250 },
      { id: 'Unit', name: 'Đơn vị', field: 'Unit', sortable: true, filterable: true, minWidth: 80 },
      // Dynamic Month columns will be added here
    ];

    this.gridOptions_TK = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enableGrouping: true,
      autoEdit: false,
      autoCommitEdit: false,
      rowHeight: 35,
      headerRowHeight: 40,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
    };
  }

  async exportExcel_TK() {
    if (!this.dataset_TK || this.dataset_TK.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ThongKeLoiViPham');

    // Add headers
    const headers = this.columnDefinitions_TK.map(col => col.name || '');
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Add data
    this.dataset_TK.forEach((rowData: any) => {
      const row = this.columnDefinitions_TK.map((col: any) => {
        const value = rowData[col.field];
        return value ?? '';
      });
      worksheet.addRow(row);
    });

    // Add totals row
    const monthFields = this.columnDefinitions_TK
      .filter(c => c.field.startsWith('Month'))
      .map(c => c.field);

    const totalsRow = this.columnDefinitions_TK.map((col: any) => {
      if (col.field === 'Content') {
        return 'Tổng cộng:';
      } else if (monthFields.includes(col.field)) {
        // Calculate sum for this month column
        const sum = this.dataset_TK.reduce((acc, row) => {
          return acc + (Number(row[col.field]) || 0);
        }, 0);
        return sum;
      }
      return '';
    });

    const totalRowExcel = worksheet.addRow(totalsRow);
    totalRowExcel.font = { bold: true };
    totalRowExcel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };

    // Auto-width
    worksheet.columns.forEach((column: any) => { column.width = 15; });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ThongKeLoiViPham_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  angularGridReady_TK(angularGrid: AngularGridInstance) {
    this.angularGrid_TK = angularGrid;
    // Apply default grouping by TypeName with dynamic aggregators
    this.applyGroupingWithAggregators();
  }

  applyGroupingWithAggregators(): void {
    // Get dynamic month column fields
    const monthFields = this.columnDefinitions_TK
      .filter(c => c.field.startsWith('Month'))
      .map(c => c.field);

    // Create aggregators for each month column
    const aggregators = monthFields.map(field => new Aggregators['Sum'](field));

    this.angularGrid_TK.dataView.setGrouping({
      getter: 'TypeName',
      formatter: (g) => {
        let groupHtml = `Loại lỗi: ${g.value}  <span style="color:green">(${g.count} items)</span>`;
        // Append sum for each month column
        monthFields.forEach(field => {
          const total = (g as any).totals?.sum?.[field] ?? 0;
          if (total > 0) {
            const colName = this.columnDefinitions_TK.find(c => c.field === field)?.name || field;
            groupHtml += ` | <span style="color:blue">${colName}: ${total}</span>`;
          }
        });
        return groupHtml;
      },
      aggregators: aggregators,
      aggregateCollapsed: true,
      collapsed: false
    });
  }

  search_TK(): void {
    if (!this.startDate_TK || !this.endDate_TK) return;

    if (this.startDate_TK.getFullYear() !== this.endDate_TK.getFullYear()) {
      this.notification.warning('Thông báo', 'Ngày bắt đầu và ngày kết thúc phải trong cùng 1 năm!');
      return;
    }

    // Generate Dynamic Columns for Months
    this.generateDynamicColumns(this.startDate_TK, this.endDate_TK);

    this.service.getSummaryKPIErrorMonth(
      this.departmentId_TK || 0,
      this.kpiErrorTypeId_TK || 0,
      this.startDate_TK,
      this.endDate_TK,
      this.keyword_TK
    ).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.dataset_TK = res.data.map((item: any, index: number) => ({ ...item, id: index }));
          // Re-apply grouping after data load
          setTimeout(() => {
            this.applyGroupingWithAggregators();
          }, 100);
        } else {
          this.notification.error('Lỗi', res.message);
        }
      },
      error: (err) => this.notification.error('Lỗi', 'Không thể tải dữ liệu thống kê')
    });
  }

  generateDynamicColumns(startDate: Date, endDate: Date): void {
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    // Filter out previous dynamic columns (assuming format MonthX)
    const staticCols = this.columnDefinitions_TK.filter(c => !c.field.startsWith('Month'));
    const newCols: Column[] = [];

    while (current <= end) {
      const m = current.getMonth() + 1;
      const y = current.getFullYear();
      const fieldName = `Month${m}`; // Matches C# "Month{i}"
      const headerName = `Tháng ${m}`;

      newCols.push({
        id: fieldName,
        name: headerName,
        field: fieldName,
        sortable: true,
        minWidth: 70,
        type: 'number',
        formatter: this.highlightFormatter, // Customs formatter for color
        groupTotalsFormatter: GroupTotalFormatters["sumTotals"],
        params: { groupFormatterPrefix: '' }
      });
      current.setMonth(current.getMonth() + 1);
    }

    this.columnDefinitions_TK = [...staticCols, ...newCols];

    // Update Grid Columns
    if (this.angularGrid_TK && this.angularGrid_TK.slickGrid) {
      this.angularGrid_TK.slickGrid.setColumns(this.columnDefinitions_TK);
      // Re-apply grouping with new aggregators
      this.applyGroupingWithAggregators();
    }
  }

  // Custom Formatter for coloring
  highlightFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any) {
    if (value === null || value === undefined) return '';

    const val = Number(value);
    if (val >= 10) {
      return `<div style="background-color: #EF1F3E; color: white; width: 100%; height: 100%; display: flex; align-items: center; padding-left: 4px;">${val}</div>`;
    } else if (val >= 5) {
      return `<div style="background-color: #FFFF4A; color: black; width: 100%; height: 100%; display: flex; align-items: center; padding-left: 4px;">${val}</div>`;
    }
    return String(val);
  }

  // Handle Tab Change to Resize Grid
  onTabSelect(event: any): void {
    if (event.index === 1) { // Index 1 is the Chart/Grid Tab
      setTimeout(() => {
        if (this.angularGrid_BD && this.angularGrid_BD.resizerService) {
          this.angularGrid_BD.resizerService.resizeGrid();
        }
      }, 200);
    }
  }
}
