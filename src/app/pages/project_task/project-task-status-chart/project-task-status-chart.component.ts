import { Component, OnInit, signal, inject, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

// ECharts
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';

// Services
import { ProjectTaskStatusService, ProjectTaskChartItem } from '../project-task-status/project-task-status.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DateTime } from 'luxon';

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
]);

@Component({
  selector: 'app-project-task-status-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzSelectModule,
    NzGridModule,
    NzInputModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgxEchartsDirective
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './project-task-status-chart.component.html',
  styleUrl: './project-task-status-chart.component.css'
})
export class ProjectTaskStatusChartComponent implements OnInit, OnChanges {
  private statusService = inject(ProjectTaskStatusService);
  private workplanService = inject(WorkplanService);
  private employeeService = inject(EmployeeService);
  private appUserService = inject(AppUserService);
  private projectService = inject(ProjectService);
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);

  // ===== Filter params =====
  @Input() hideSearch: boolean = false;
  @Input() dateStart: string = '';
  @Input() dateEnd: string = '';
  @Input() departmentId: number = 0;
  @Input() teamId: number = 0;
  @Input() userId: number = 0;
  @Input() projectId: number = 0;
  @Input() keyword: string = '';

  // ===== Dropdown data =====
  departmentList: any[] = [];
  teamList: any[] = [];
  userList: any[] = [];
  projectList: any[] = [];

  // ===== Trạng thái =====
  loading = signal(false);
  chartOptions: any = {};
  chartInstance: any;

  // ===== Sidebar Selection =====
  fullData: ProjectTaskChartItem[] = [];
  employeeSelections: { FullName: string, selected: boolean }[] = [];
  limitCount: number = 0;
  searchEmployeeText: string = '';
  showSidebar: boolean = true;

  constructor() {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
  }

  ngOnInit() {
    this.departmentId = this.appUserService.departmentID || 0;
    this.loadDepartments();
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadProjects();
    if (!this.hideSearch) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Khi hideSearch = true, việc gọi tải dữ liệu được quản lý bởi component cha
    // để tránh việc gọi trùng lặp nhiều lần (ví dụ: vừa ngOnInit vừa ngOnChanges)
  }

  // ===== Dropdown loaders =====

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      }
    });
  }

  loadTeamsByDepartment(deptId: number): void {
    this.workplanService.getTeamByDepartmentId(deptId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.teamList = (Array.isArray(res.data) ? res.data : []).filter((x: any) => !x.IsDeleted);
        } else {
          this.teamList = [];
        }
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.filterEmployee(0, this.departmentId, '').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.userList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.userList = [];
        }
      }
    });
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

  // ===== Event handlers =====

  onDepartmentChange(): void {
    this.teamId = 0;
    this.userId = 0;
    this.teamList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
  }

  onTeamChange(): void {
    this.userId = 0;
  }

  // ===== Load data & Update Chart =====

  loadData() {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
      return;
    }

    this.loading.set(true);
    const params = {
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      departmentID: this.departmentId || 0,
      teamID: this.teamId || 0,
      userID: this.userId || 0,
      projectID: this.projectId || 0,
      keyword: this.keyword.trim()
    };

    this.statusService.getChartData(params).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.fullData = (res && res.status === 1 && res.data) ? res.data : [];
        this.limitCount = this.fullData.length;
        this.initEmployeeSelections();
        this.onFilterChange();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu biểu đồ');
      }
    });
  }

  initEmployeeSelections() {
    this.employeeSelections = this.fullData.map(item => ({
      FullName: item.FullName || 'N/A',
      selected: true
    }));
  }

  onFilterChange() {
    // 1. Lấy danh sách những người được chọn
    const selectedNames = this.employeeSelections
      .filter(s => s.selected)
      .map(s => s.FullName);

    // 2. Lọc dữ liệu gốc theo những người được chọn
    let filtered = this.fullData.filter(item => selectedNames.includes(item.FullName || 'N/A'));

    // 3. Giới hạn số lượng hiển thị (lấy người đầu tiên)
    if (this.limitCount && this.limitCount > 0) {
      filtered = filtered.slice(0, this.limitCount);
    }

    this.updateChart(filtered);
  }

  getFilteredSelections() {
    if (!this.searchEmployeeText) return this.employeeSelections;
    const txt = this.searchEmployeeText.toLowerCase();
    return this.employeeSelections.filter(s => s.FullName.toLowerCase().includes(txt));
  }

  toggleAll(selected: boolean) {
    this.employeeSelections.forEach(s => s.selected = selected);
    this.onFilterChange();
  }

  updateChart(data: ProjectTaskChartItem[]) {
    // Sắp xếp theo tổng số công việc giảm dần
    data.sort((a, b) => b.TotalTasks - a.TotalTasks);

    const names = data.map(item => item.FullName || 'N/A');
    const notStarted = data.map(item => item.NotStarted);
    const doing = data.map(item => item.Doing);
    const doingOverdue = data.map(item => item.DoingOverdue);
    const done = data.map(item => item.Done);
    const doneLate = data.map(item => item.DoneLate);
    const pending = data.map(item => item.Pending);
    const total = data.map(item => item.TotalTasks);

    this.chartOptions = {
      title: {
        text: 'THỐNG KÊ TRẠNG THÁI CÔNG VIỆC',
        left: 'center',
        top: 0,
        textStyle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#334155',
          fontFamily: "'Inter', sans-serif"
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any[]) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            if (p.value > 0 || p.seriesType === 'line') {
              html += `${p.marker} ${p.seriesName}: <b>${p.value}</b><br/>`;
            }
          });
          return html;
        }
      },
      legend: {
        data: ['Chưa làm', 'Đang làm', 'Đang làm quá hạn', 'Hoàn thành', 'Hoàn thành trễ', 'Pending', 'Tổng công việc'],
        bottom: 0,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          rotate: 30,
          interval: 0,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: 'Số lượng CV'
      },
      dataZoom: [],
      series: [
        {
          name: 'Chưa làm',
          type: 'bar',
          stack: 'status',
          data: notStarted,
          itemStyle: { color: '#94a3b8' }
        },
        {
          name: 'Đang làm',
          type: 'bar',
          stack: 'status',
          data: doing,
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Đang làm quá hạn',
          type: 'bar',
          stack: 'status',
          data: doingOverdue,
          itemStyle: { color: '#ef4444' }
        },
        {
          name: 'Hoàn thành',
          type: 'bar',
          stack: 'status',
          data: done,
          itemStyle: { color: '#22c55e' }
        },
        {
          name: 'Hoàn thành trễ',
          type: 'bar',
          stack: 'status',
          data: doneLate,
          itemStyle: { color: '#f59e0b' }
        },
        {
          name: 'Pending',
          type: 'bar',
          stack: 'status',
          data: pending,
          itemStyle: { color: '#8b5cf6' }
        },
        {
          name: 'Tổng công việc',
          type: 'line',
          data: total,
          itemStyle: { color: '#005bb7' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    };
  }

  onChartInit(ec: any) {
    this.chartInstance = ec;
  }

  resetSearch() {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0;
    this.userId = 0;
    this.projectId = 0;
    this.keyword = '';
    this.teamList = [];
    this.userList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadData();
  }
}
