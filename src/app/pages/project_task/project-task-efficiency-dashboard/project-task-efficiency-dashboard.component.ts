import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';

// Ng-Zorro
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

// ECharts
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  PolarComponent
} from 'echarts/components';

// Services
import { ProjectTaskEfficiencyDashboardService, ProjectTaskEfficiencyTotal, ProjectTaskEfficiencyEmployee } from './project-task-efficiency-dashboard.service';
import { ProjectService } from '../../project/project-service/project.service';
import { DepartmentServiceService } from '../../hrm/department/department-service/department-service.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

echarts.use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  PolarComponent
]);

@Component({
  selector: 'app-project-task-efficiency-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzGridModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzTableModule,
    NzCardModule,
    NzToolTipModule,
    NgxEchartsDirective
  ],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './project-task-efficiency-dashboard.component.html',
  styleUrl: './project-task-efficiency-dashboard.component.css'
})
export class ProjectTaskEfficiencyDashboardComponent implements OnInit {
  private efficiencyService = inject(ProjectTaskEfficiencyDashboardService);
  private projectService = inject(ProjectService);
  private notification = inject(NzNotificationService);

  // Filter params
  dateStart: string = '';
  dateEnd: string = '';
  projectId: number | null = null;
  departmentId: number | null = null;

  // Dropdown
  projectList: any[] = [];
  departmentList: any[] = [];

  // Data
  loading = signal(false);
  totalSummary = signal<ProjectTaskEfficiencyTotal | null>(null);
  employeeData = signal<ProjectTaskEfficiencyEmployee[]>([]);

  // Charts
  timeChartOptions: any = {};
  efficiencyChartOptions: any = {};
  stabilityChartOptions: any = {};
  otChartOptions: any = {};
  finalKpiChartOptions: any = {};
  kpiSummaryChartOptions: any = {};

  constructor() {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
  }

  private departmentService = inject(DepartmentServiceService);

  ngOnInit(): void {
    this.loadProjects();
    this.loadDepartments();
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.projectList = Array.isArray(res.data) ? res.data : [];
        }
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && (res.status === 1 || res.status === 200) && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      }
    });
  }

  searchData(): void {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
      return;
    }

    if (!this.projectId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dự án!');
      return;
    }

    const pId = this.projectId;
    const dId = this.departmentId || 0;

    this.loading.set(true);

    // Call Total API
    this.efficiencyService.getProjectTotalEfficiency(this.dateStart, this.dateEnd, pId, dId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data && res.data.length > 0) {
          this.totalSummary.set(res.data[0]);
        } else {
          this.totalSummary.set(null);
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải thống kê tổng!');
        this.totalSummary.set(null);
      }
    });

    // Call Employee API
    this.efficiencyService.getEmployeeEfficiency(this.dateStart, this.dateEnd, pId, dId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data : [];
          this.employeeData.set(data);
          this.buildCharts(data);
        } else {
          this.employeeData.set([]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải thống kê nhân viên!');
        this.employeeData.set([]);
        this.loading.set(false);
      }
    });
  }

  buildCharts(data: ProjectTaskEfficiencyEmployee[]): void {
    if (!data || data.length === 0) return;

    const names = data.map(d => d.EmployeeFullName);

    // === Chart 1: Efficiency theo nhân viên (Vertical Bar, màu xanh dương #174276) ===
    this.timeChartOptions = {
      title: {
        text: 'Efficiency theo nhân viên',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>Efficiency: <b>${p.value}%</b>`;
        }
      },
      legend: {
        bottom: 0,
        data: ['Efficiency'],
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, interval: 0, rotate: names.length > 5 ? 20 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Efficiency (%)',
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: 'Efficiency',
          type: 'bar',
          data: data.map(d => d.Efficiency || 0),
          itemStyle: { color: '#174276' },
          barWidth: '40%',
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1e293b'
          }
        }
      ]
    };

    // === Chart 2: Tỷ lệ đúng hạn theo nhân viên (Vertical Bar, màu xanh lá #10b981) ===
    this.efficiencyChartOptions = {
      title: {
        text: 'Tỷ lệ đúng hạn theo nhân viên',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>${p.seriesName}: <b>${p.value}%</b>`;
        }
      },
      legend: {
        bottom: 0,
        data: ['Tỷ lệ đúng hạn'],
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, interval: 0, rotate: names.length > 5 ? 20 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Deadline Rate (%)',
        max: 100,
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: 'Tỷ lệ đúng hạn',
          type: 'bar',
          data: data.map(d => d.DeadlineRate || 0),
          itemStyle: { color: '#10b981' },
          barWidth: '40%',
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1e293b'
          }
        }
      ]
    };

    // === Chart 3: Độ ổn định công việc theo nhân viên (Vertical Bar, màu tím #8b5cf6) ===
    this.stabilityChartOptions = {
      title: {
        text: 'Độ ổn định công việc theo nhân viên',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>${p.seriesName}: <b>${p.value}%</b>`;
        }
      },
      legend: {
        bottom: 0,
        data: ['Stability CV'],
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, interval: 0, rotate: names.length > 5 ? 20 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Stability CV (%)',
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: 'Stability CV',
          type: 'bar',
          data: data.map(d => d.StabilityCV || 0),
          itemStyle: { color: '#8b5cf6' },
          barWidth: '40%',
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1e293b'
          }
        }
      ]
    };

    // === Chart 4: OT Ratio theo nhân viên (Vertical Bar, màu cam #f97316) ===
    this.otChartOptions = {
      title: {
        text: 'OT Ratio theo nhân viên',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>${p.seriesName}: <b>${p.value}%</b>`;
        }
      },
      legend: {
        bottom: 0,
        data: ['OT Ratio'],
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, interval: 0, rotate: names.length > 5 ? 20 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'OT Ratio (%)',
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: 'OT Ratio',
          type: 'bar',
          data: data.map(d => d.OTRatio || 0),
          itemStyle: { color: '#f97316' },
          barWidth: '40%',
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1e293b'
          }
        }
      ]
    };

    // === Chart 5: Final KPI theo nhân viên (Vertical Bar, màu xanh tím #4f46e5) ===
    this.finalKpiChartOptions = {
      title: {
        text: 'Final KPI theo nhân viên',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>${p.seriesName}: <b>${p.value}%</b>`;
        }
      },
      legend: {
        bottom: 0,
        data: ['Final KPI'],
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, interval: 0, rotate: names.length > 5 ? 20 : 0 }
      },
      yAxis: {
        type: 'value',
        name: 'KPI (%)',
        max: 100,
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: 'Final KPI',
          type: 'bar',
          data: data.map(d => d.FinalKPIScore || 0),
          itemStyle: { color: '#4f46e5' },
          barWidth: '40%',
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1e293b'
          }
        }
      ]
    };

    // === Chart 6: KPI Tổng hợp (Polar Bar Chart - giống ảnh) ===
    const kpiSummaryColors = ['#0f3a5f', '#994d1c', '#004d20', '#0076a3', '#6b0f5c', '#3d7a1f'];

    this.kpiSummaryChartOptions = {
      title: {
        text: 'KPI Tổng hợp',
        left: 'center',
        top: 5,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.seriesName}<br/>KPI: <b>${params.value[0]}%</b>`;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 40,
        bottom: 20,
        textStyle: { fontSize: 11 }
      },
      polar: {
        center: ['40%', '55%'],
        radius: [15, '75%']
      },
      angleAxis: {
        type: 'value',
        min: -180,
        max: 180,
        startAngle: 90,
        clockwise: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      radiusAxis: {
        min: 0,
        max: 100,
        interval: 20,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: '#000000', width: 1, type: 'solid' }
        }
      },
      series: data.map((d, i) => {
        const angle = (i - (data.length - 1) / 2) * 3.5; // spread angle
        return {
          name: d.EmployeeFullName || `Nhân viên ${i + 1}`,
          type: 'bar',
          coordinateSystem: 'polar',
          data: [[d.FinalKPIScore || 0, angle]],
          barWidth: 6, // thin spokes
          roundCap: true,
          itemStyle: {
            color: kpiSummaryColors[i % kpiSummaryColors.length]
          },
          emphasis: { disabled: true }
        };
      })
    };
  }

  formatPercent(val: number | null | undefined): string {
    if (val === null || val === undefined) return '-';
    const rounded = Math.round(val * 100) / 100;
    return rounded + '%';
  }

  trackByRow(index: number, item: any): any {
    return item.ID || item.UserID || index;
  }
}
