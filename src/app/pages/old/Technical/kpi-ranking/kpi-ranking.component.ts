import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularSlickgridModule, Column, GridOption, AngularGridInstance } from 'angular-slickgrid';
import { ChartModule } from 'primeng/chart';
import { KpiRankingService } from './kpi-ranking-service/kpi-ranking.service';
import { Inject, Optional } from '@angular/core';
import { TabServiceService } from '../../../../layouts/tab-service.service';

@Component({
  selector: 'app-kpi-ranking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzInputNumberModule,
    NzFormModule,
    NzSplitterModule,
    AngularSlickgridModule,
    ChartModule
  ],
  templateUrl: './kpi-ranking.component.html',
  styleUrls: ['./kpi-ranking.component.css']
})
export class KpiRankingComponent implements OnInit {
  // Input từ modal parent
  @Input() inputYear: number = new Date().getFullYear();
  @Input() inputQuarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
  @Input() inputDepartmentId: number = 0;

  // Filter State
  year: number = new Date().getFullYear();
  quarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
  departmentId: any = 2;
  departments: any[] = [];

  // Chart State
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};
  chartPlugins: any[] = [{
    id: 'chartDataLabels',
    afterDatasetsDraw: (chart: any) => {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          if (value > 0) {
            ctx.save();
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const x = bar.x;
            const y = bar.y;
            const base = bar.base;
            ctx.fillText(value.toString(), x, y + (base - y) / 2);
            ctx.restore();
          }
        });
      });
    }
  }];
  rawChartData: any[] = [];
  allEmployees: any[] = [];
  selectedChartTypes: string[] = ['TotalPoinKPI', 'TotalPoinKPILast'];

  get showKPI(): boolean {
    return this.selectedChartTypes.includes('TotalPoinKPI');
  }
  set showKPI(val: boolean) {
    this.toggleChartType('TotalPoinKPI', val);
  }

  get showKPILast(): boolean {
    return this.selectedChartTypes.includes('TotalPoinKPILast');
  }
  set showKPILast(val: boolean) {
    this.toggleChartType('TotalPoinKPILast', val);
  }

  private toggleChartType(tag: string, checked: boolean): void {
    const idx = this.selectedChartTypes.indexOf(tag);
    if (checked && idx === -1) {
      this.selectedChartTypes = [...this.selectedChartTypes, tag];
    } else if (!checked && idx >= 0) {
      this.selectedChartTypes = this.selectedChartTypes.filter(t => t !== tag);
    }
  }

  // Grid State
  grid!: AngularGridInstance;
  dataset: any[] = [];
  colDef: Column[] = [];
  gridId: string = `gridEmployee-${Math.random().toString(36).slice(2, 9)}`;

  gridOptions: GridOption = {
    enableAutoResize: true,
    autoResize: {
      container: '.grid-content',
      rightPadding: 0,
      bottomPadding: 10,
      minHeight: 200
    },
    enableCellNavigation: true,
    enableFiltering: true,
    enableSorting: true,
    enableGrouping: true,
    enableRowSelection: true,
    forceFitColumns: true,
    rowSelectionOptions: {
      selectActiveRow: true,
    },
    rowHeight: 35,
    headerRowHeight: 40,
  };

  // KPI Order for sorting
  private kpiOrder: string[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    private service: KpiRankingService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    @Optional() @Inject('tabData') public tabData: any
  ) { }

  ngOnInit(): void {
    // Apply inputs từ parent hoặc tabData
    let hasPassedData = false;
    if (this.tabData) {
      if (this.tabData.inputYear) this.year = this.tabData.inputYear;
      if (this.tabData.inputQuarter) this.quarter = this.tabData.inputQuarter;
      if (this.tabData.inputDepartmentId) this.departmentId = this.tabData.inputDepartmentId;

      // Ưu tiên sử dụng dữ liệu truyền từ form cha (dataset)
      if (this.tabData.dtData && Array.isArray(this.tabData.dtData)) {
        this.allEmployees = this.tabData.dtData;
        this.processChartData(this.allEmployees);
        hasPassedData = true;
      }
    } else {
      if (this.inputYear) this.year = this.inputYear;
      if (this.inputQuarter) this.quarter = this.inputQuarter;
      if (this.inputDepartmentId) this.departmentId = this.inputDepartmentId;
    }

    this.initColumns();
    this.initChartOptions();
    this.loadDepartments();

    // Chỉ gọi API nếu không có dữ liệu truyền từ cha
    if (!hasPassedData) {
      this.loadData();
    }
  }

  initColumns(): void {
    this.colDef = [
      { id: 'Code', name: 'Mã nhân viên', field: 'Code', sortable: true, filterable: true, minWidth: 100, formatter: this.commonTooltipFormatter },
      { id: 'FullName', name: 'Tên nhân viên', field: 'FullName', sortable: true, filterable: true, minWidth: 150, formatter: this.commonTooltipFormatter },
      { id: 'TotalPercent', name: 'Tổng điểm', field: 'TotalPercent', sortable: true, minWidth: 100 },
      { id: 'TotalPercentActual', name: 'Tổng điểm cuối cùng', field: 'TotalPercentActual', sortable: true, minWidth: 120 },
      { id: 'DepartmentName', name: 'Phòng ban', field: 'DepartmentName', sortable: true, filterable: true, minWidth: 150, formatter: this.commonTooltipFormatter },
    ];
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
          text: 'BIỂU ĐỒ XẾP LOẠI',
          font: { size: 18, weight: 'bold' },
          color: '#333',
          padding: { bottom: 30 }
        },
        legend: {
          display: true,
          labels: { color: textColor },
          position: 'bottom'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColorSecondary, font: { weight: 500 } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: { color: textColorSecondary, stepSize: 1 },
          grid: { color: surfaceBorder }
        }
      }
    };
  }

  loadDepartments(): void {
    this.service.getDepartment().subscribe(res => {
      if (res.status === 1) {
        this.departments = res.data;
      }
    });
  }

  loadData(): void {
    this.service.getData(this.year, this.quarter, this.departmentId || 0, 0).subscribe(res => {
      if (res.status === 1 && res.data) {
        this.allEmployees = res.data;
        this.processChartData(res.data);
        // Clear grid initially
        this.dataset = [];
      }
    });
  }

  processChartData(data: any[]): void {
    const levels = this.kpiOrder;
    const result: any[] = [];

    // Kiểm tra xem dữ liệu truyền vào là dạng Tóm tắt (có KPILevel) hay Chi tiết (có TotalPercentText)
    const isSummarized = data.length > 0 && data[0].KPILevel !== undefined;

    if (isSummarized) {
      // Xử lý dữ liệu tóm tắt từ API
      levels.forEach(level => {
        const items = data.filter(d => (d.KPILevel || '').trim().toUpperCase() === level.toUpperCase());
        const expected = items.reduce((sum, d) => sum + (d.SoLuongExpected || 0), 0);
        const actual = items.reduce((sum, d) => sum + (d.SoLuongActual || 0), 0);
        result.push({
          KPILevel: level,
          SoLuongExpected: expected,
          SoLuongActual: actual
        });
      });
    } else {
      // Xử lý dữ liệu chi tiết từ Parent hoặc API đã sửa
      levels.forEach((level) => {
        const expectedCount = data.filter((item: any) =>
          (item.TotalPercentText || '').trim().toUpperCase() === level.toUpperCase()
        ).length;

        const actualCount = data.filter((item: any) =>
          (item.TotalPercentTextActual || '').trim().toUpperCase() === level.toUpperCase()
        ).length;

        result.push({
          KPILevel: level,
          SoLuongExpected: expectedCount,
          SoLuongActual: actualCount
        });
      });
    }

    this.rawChartData = result;
    this.updateChartVisibility();
  }

  updateChartVisibility(): void {
    const labels = this.rawChartData.map((x: any) => x.KPILevel);
    const datasets = [];
    const selected = this.selectedChartTypes;

    if (selected.includes('TotalPoinKPI')) {
      datasets.push({
        label: 'Tổng điểm KPI',
        data: this.rawChartData.map((x: any) => x.SoLuongExpected),
        backgroundColor: '#60B5CC',
        tag: 'TotalPoinKPI'
      });
    }

    if (selected.includes('TotalPoinKPILast')) {
      datasets.push({
        label: 'Tổng điểm cuối cùng',
        data: this.rawChartData.map((x: any) => x.SoLuongActual),
        backgroundColor: '#E66C7D',
        tag: 'TotalPoinKPILast'
      });
    }

    this.chartData = { labels, datasets };
  }

  onChartTypeChange(): void {
    this.updateChartVisibility();
  }

  onDataSelect(event: any): void {
    if (!event || !event.element) return;
    const selectedDataset = this.chartData.datasets[event.element.datasetIndex];
    const isActual = selectedDataset?.tag === 'TotalPoinKPILast';
    const kpiLevel = this.chartData.labels[event.element.index];
    this.loadEmployeesByKpiLevel(kpiLevel, isActual);
  }

  loadEmployeesByKpiLevel(kpiLevel: string, isActual: boolean): void {
    const filterField = isActual ? 'TotalPercentTextActual' : 'TotalPercentText';

    // Nếu đã có dữ liệu chi tiết (ví dụ từ Form cha truyền vào), thực hiện lọc local
    if (this.allEmployees.length > 0 && this.allEmployees[0].Code !== undefined) {
      const filtered = this.allEmployees.filter((emp: any) =>
        (emp[filterField] || '').trim().toUpperCase() === kpiLevel.toUpperCase()
      );

      this.dataset = filtered.map((x: any, i: number) => ({
        ...x,
        id: i
      }));

      this.updateColumnVisibility(isActual);
      setTimeout(() => this.applyGrouping(), 100);
      return;
    }

    // Nếu chưa có dữ liệu chi tiết, gọi API để lấy theo Level
    const kpiLevelInt = this.kpiOrder.indexOf(kpiLevel) + 1;
    this.service.getData(this.year, this.quarter, this.departmentId || 0, kpiLevelInt).subscribe(res => {
      if (res.status === 1 && res.data) {
        const filtered = res.data.filter((emp: any) =>
          (emp[filterField] || '').trim().toUpperCase() === kpiLevel.toUpperCase()
        );

        const data = filtered.map((x: any, i: number) => ({
          ...x,
          id: i
        }));

        this.dataset = data;
        this.updateColumnVisibility(isActual);
        setTimeout(() => this.applyGrouping(), 100);
      }
    });
  }

  updateColumnVisibility(isActual: boolean): void {
    this.colDef = this.colDef.map(col => {
      if (col.id === 'TotalPercent') {
        return { ...col, hidden: isActual };
      }
      if (col.id === 'TotalPercentActual') {
        return { ...col, hidden: !isActual };
      }
      return col;
    });

    if (this.grid) {
      this.grid.slickGrid?.setColumns(this.colDef);
    }
  }

  applyGrouping(): void {
    if (this.grid && this.grid.dataView) {
      this.grid.dataView.setGrouping([
        {
          getter: 'DepartmentName',
          formatter: (g: any) => `Phòng ban: <strong>${g.value}</strong> <span style="color: #1890ff; font-weight: bold;">(${g.count} nhân viên)</span>`,
          aggregateCollapsed: false,
          lazyTotalsCalculation: true
        }
      ]);
    }
  }

  onGridReady(grid: AngularGridInstance): void {
    this.grid = grid;
    if (this.dataset && this.dataset.length > 0) {
      setTimeout(() => this.applyGrouping(), 100);
    }
  }

  onFilterChange(): void {
    // Optional: auto-reload when filter changes
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
    } else if (this.tabData && this.tabData._tabKey) {
      this.tabService.closeTabByKey(this.tabData._tabKey);
    } else {
      // Fallback close by key based on how it was opened
      const key = 'kpi-ranking';
      this.tabService.closeTabByKey(key);
    }
  }

  // Helper function to escape HTML special characters
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
