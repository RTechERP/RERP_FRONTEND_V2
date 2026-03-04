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
  selectedChartType: string = 'TotalPoinKPI';
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};
  rawChartData: any[] = [];

  // Grid State
  grid!: AngularGridInstance;
  dataset: any[] = [];
  colDef: Column[] = [];

  gridOptions: GridOption = {
    gridWidth: '100%',
    enableAutoResize: true,
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
    public activeModal: NgbActiveModal,
    private service: KpiRankingService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    // Apply inputs từ parent
    if (this.inputYear) this.year = this.inputYear;
    if (this.inputQuarter) this.quarter = this.inputQuarter;
    if (this.inputDepartmentId) this.departmentId = this.inputDepartmentId;

    this.initColumns();
    this.initChartOptions();
    this.loadDepartments();
    this.loadData();
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
          color: '#333'
        },
        legend: {
          display: true,
          labels: { color: textColor },
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${context.parsed.y}`
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

  loadDepartments(): void {
    this.service.getDepartment().subscribe(res => {
      if (res.status === 1) {
        this.departments = res.data;
      }
    });
  }

  loadData(): void {
    this.service.getData(this.year, this.quarter, this.departmentId || 0).subscribe(res => {
      if (res.status === 1 && res.data) {
        this.processChartData(res.data);
      }
    });
  }

  processChartData(data: any[]): void {
    // Group by KPILevel and sum quantities
    const grouped = data.reduce((acc: any, item: any) => {
      const level = item.KPILevel;
      if (!acc[level]) {
        acc[level] = { KPILevel: level, SoLuongExpected: 0, SoLuongActual: 0 };
      }
      acc[level].SoLuongExpected += item.SoLuongExpected || 0;
      acc[level].SoLuongActual += item.SoLuongActual || 0;
      return acc;
    }, {});

    // Sort by KPI order
    this.rawChartData = Object.values(grouped).sort((a: any, b: any) => {
      return this.kpiOrder.indexOf(a.KPILevel) - this.kpiOrder.indexOf(b.KPILevel);
    });

    this.updateChartVisibility();
  }

  updateChartVisibility(): void {
    const labels = this.rawChartData.map((x: any) => x.KPILevel);
    const datasets = [];

    if (this.selectedChartType === 'TotalPoinKPI') {
      datasets.push({
        label: 'Tổng điểm KPI',
        data: this.rawChartData.map((x: any) => x.SoLuongExpected),
        backgroundColor: '#60B5CC',
        tag: 'TotalPoinKPI'
      });
    } else {
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

  onChartClick(event: any, elements: any[]): void {
    if (!elements || !elements.length) return;

    const el = elements[0];
    const kpiLevel = this.chartData.labels[el.index];
    const isActual = this.selectedChartType === 'TotalPoinKPILast';

    this.loadEmployeesByKpiLevel(kpiLevel, isActual);
  }

  loadEmployeesByKpiLevel(kpiLevel: string, isActual: boolean): void {
    this.service.getData(this.year, this.quarter, this.departmentId || 0, kpiLevel).subscribe(res => {
      if (res.status === 1 && res.data) {
        const data = res.data.map((x: any, i: number) => ({
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
      this.grid.dataView.setGrouping({
        getter: 'DepartmentName',
        formatter: (g) => `${g.value} <span style="color:green">(${g.count})</span>`
      });
    }
  }

  onGridReady(grid: AngularGridInstance): void {
    this.grid = grid;
  }

  onFilterChange(): void {
    // Optional: auto-reload when filter changes
  }

  closeModal(): void {
    this.activeModal.close();
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
