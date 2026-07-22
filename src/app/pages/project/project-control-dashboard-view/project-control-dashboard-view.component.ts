import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// NG-ZORRO & PrimeNG imports
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TableModule } from 'primeng/table';

// ECharts imports
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components';

import {
  ProjectControlDashboardMockService,
  ProjectDashboardFilter,
  ProjectDashboardSummary
} from './project-control-dashboard-mock.service';
import { ProjectService } from '../project-service/project.service';
import { AuthService } from '../../../auth/auth.service';

echarts.use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
]);

@Component({
  selector: 'app-project-control-dashboard-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzToolTipModule,
    NzTabsModule,
    TableModule,
    NgxEchartsDirective
  ],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './project-control-dashboard-view.component.html',
  styleUrls: ['./project-control-dashboard-view.component.css']
})
export class ProjectControlDashboardViewComponent implements OnInit {

  isLoading = false;
  currentUser: any = null;
  selectedTabIndex = 0;

  // Filter models
  filter: ProjectDashboardFilter = {
    fromDate: null,
    toDate: null,
    departmentId: null,
    employeeId: null,
    keyword: ''
  };

  // Dropdown options
  departments: any[] = [];
  employees: any[] = [];
  allEmployees: any[] = [];
  statusOptions = [
    { label: 'Chưa thực hiện', value: 'Chưa thực hiện' },
    { label: 'Đang thực hiện', value: 'Đang thực hiện' },
    { label: 'Đã hoàn thành', value: 'Đã hoàn thành' },
    { label: 'Test', value: 'Test' },
    { label: 'Chờ PO', value: 'Chờ PO' },
    { label: 'PO', value: 'PO' },
    { label: 'Đã hủy, dừng', value: 'Đã hủy, dừng' }
  ];

  // Summary Data
  summaryData: ProjectDashboardSummary = {
    totalProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    gateDistributions: [],
    projectTypeDistributions: [],
    departmentDistributions: [],
    onTrackCount: 0,
    delayedCount: 0,
    projectList: [],
    overdueList: []
  };

  // ECharts Options
  gateChartOptions: any;
  projectTypeChartOptions: any;
  departmentChartOptions: any;
  statusChartOptions: any;

  constructor(
    private dashboardMockService: ProjectControlDashboardMockService,
    private projectService: ProjectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadDropdownData();
    this.getCurrentUser();
  }

  // 1. Mặc định từ ngày là 01/01 năm hiện tại, đến ngày là ngày hiện tại
  private initDefaultDates(): void {
    const now = new Date();
    this.filter.fromDate = new Date(now.getFullYear(), 0, 1);
    this.filter.toDate = now;
  }

  // 2. Lấy phòng ban & nhân viên mặc định từ currentUser đăng nhập
  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const user = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUser = user;
          if (user) {
            if (user.DepartmentID || user.departmentId) {
              this.filter.departmentId = user.DepartmentID || user.departmentId;
            }
            const empId = user.EmployeeID ?? user.ID ?? user.id;
            if (empId) {
              this.filter.employeeId = empId;
            }
            this.onDepartmentChange();
          }
        }
        this.loadDashboardData();
      },
      error: (err: any) => {
        console.error('Error fetching current user:', err);
        this.loadDashboardData();
      }
    });
  }

  loadDropdownData(): void {
    // Tải danh sách phòng ban từ Backend ProjectService
    this.projectService.getDepartment().subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          this.departments = data.map((d: any) => ({
            ID: d.ID ?? d.id,
            Name: d.Name || d.name || d.DepartmentName
          }));
          this.onDepartmentChange();
        } else {
          this.fallbackMockDepartments();
        }
      },
      error: () => this.fallbackMockDepartments()
    });

    // Tải danh sách Trạng thái dự án từ Backend ProjectService
    this.projectService.getProjectStatus().subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          this.statusOptions = data.map((s: any) => ({
            label: s.StatusName || s.Name || s.statusName || '',
            value: s.StatusName || s.Name || s.statusName || ''
          })).filter((s: any) => s.label);
        }
      },
      error: (err: any) => console.warn('Could not fetch project status dropdown from API:', err)
    });

    // Tải danh sách nhân viên từ Backend ProjectService - map theo cấu trúc get-users (ID, Code, FullName, DepartmentName, EmployeeID)
    this.projectService.getUsers().subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          this.allEmployees = data.map((u: any) => {
            const empCode = u.Code ?? '';
            const fullName = u.FullName || '';
            const deptName = u.DepartmentName || '';
            const empId = u.EmployeeID ?? u.ID ?? u.id ?? u.UserID;
            return {
              ID: empId,
              EmployeeID: empId,
              Code: empCode,
              FullName: fullName,
              DepartmentName: deptName,
              Label: empCode ? `${empCode} - ${fullName}` : fullName,
              DepartmentID: u.DepartmentID ?? u.departmentId ?? u.DepartmentId ?? null
            };
          });
          this.onDepartmentChange();
        } else {
          this.fallbackMockEmployees();
        }
      },
      error: () => this.fallbackMockEmployees()
    });
  }

  private fallbackMockDepartments(): void {
    this.dashboardMockService.getDepartments().subscribe(depts => {
      this.departments = depts;
    });
  }

  private fallbackMockEmployees(): void {
    this.dashboardMockService.getEmployees().subscribe(emps => {
      this.allEmployees = emps.map((e: any) => ({
        ...e,
        Label: e.Code ? `${e.Code} - ${e.FullName}` : e.FullName
      }));
      this.onDepartmentChange();
    });
  }

  onDepartmentChange(): void {
    if (this.filter.departmentId) {
      const selectedDept = this.departments.find(d => d.ID == this.filter.departmentId);
      const selectedDeptName = selectedDept ? (selectedDept.Name || '').trim().toLowerCase() : '';

      const filtered = this.allEmployees.filter(e => {
        // 1. Khớp theo DepartmentID (nếu có)
        if (e.DepartmentID != null && e.DepartmentID == this.filter.departmentId) {
          return true;
        }
        // 2. Khớp theo DepartmentName (chuỗi tên phòng ban từ get-users)
        if (selectedDeptName && e.DepartmentName && e.DepartmentName.trim().toLowerCase() === selectedDeptName) {
          return true;
        }
        return false;
      });

      // Nếu lọc thấy nhân viên thuộc phòng ban -> lấy danh sách lọc. Nếu chưa -> giữ tất cả danh sách để combobox không rỗng
      this.employees = filtered.length > 0 ? filtered : [...this.allEmployees];

      // Đảm bảo nếu nhân viên hiện tại (VD: currentUser.EmployeeID) được chọn thì luôn nằm trong mảng hiển thị
      if (this.filter.employeeId && !this.employees.some(e => e.ID == this.filter.employeeId || e.EmployeeID == this.filter.employeeId)) {
        const selectedEmp = this.allEmployees.find(e => e.ID == this.filter.employeeId || e.EmployeeID == this.filter.employeeId);
        if (selectedEmp) {
          this.employees = [selectedEmp, ...this.employees];
        } else {
          this.filter.employeeId = null;
        }
      }
    } else {
      this.employees = [...this.allEmployees];
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;

    const reqBody = {
      DateStart: this.filter.fromDate ? new Date(this.filter.fromDate).toISOString() : null,
      DateEnd: this.filter.toDate ? new Date(this.filter.toDate).toISOString() : null,
      DepartmentID: this.filter.departmentId || 0,
      EmployeeID: this.filter.employeeId || 0,
      FilterText: this.filter.keyword || ''
    };

    // Gọi API Backend thật
    this.projectService.getProjectControlDashboard(reqBody).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.summaryData = res.data;
          (this.summaryData.projectList || []).forEach((p: any) => {
            p.ProjectStatusName = p.ProjectStatusName ?? '';
          });
          (this.summaryData.overdueList || []).forEach((p: any) => {
            p.ProjectStatusName = p.ProjectStatusName ?? '';
          });
          this.buildCharts();
          this.isLoading = false;
        } else {
          this.fallbackMockDashboard();
        }
      },
      error: (err: any) => {
        console.warn('Backend API error or procedure pending, using mock fallback:', err);
        this.fallbackMockDashboard();
      }
    });
  }

  private fallbackMockDashboard(): void {
    this.dashboardMockService.getDashboardData(this.filter).subscribe({
      next: (data) => {
        this.summaryData = data;
        (this.summaryData.projectList || []).forEach((p: any) => {
          p.ProjectStatusName = p.ProjectStatusName ?? '';
        });
        (this.summaryData.overdueList || []).forEach((p: any) => {
          p.ProjectStatusName = p.ProjectStatusName ?? '';
        });
        this.buildCharts();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadDashboardData();
  }

  onReset(): void {
    this.initDefaultDates();
    this.filter.keyword = '';
    if (this.currentUser) {
      this.filter.departmentId = this.currentUser.DepartmentID || this.currentUser.departmentId || null;
      const empId = this.currentUser.EmployeeID ?? this.currentUser.ID ?? this.currentUser.id;
      this.filter.employeeId = empId || null;
    } else {
      this.filter.departmentId = null;
      this.filter.employeeId = null;
    }
    this.onDepartmentChange();
    this.loadDashboardData();
  }

  buildCharts(): void {
    this.buildGateBarChart();
    this.buildProjectTypePieChart();
    this.buildDepartmentStackedChart();
    this.buildStatusDonutChart();
  }

  // 1. Biểu đồ cột: Thống kê số lượng dự án theo Gate G0 -> G13
  private buildGateBarChart(): void {
    const xData = (this.summaryData.gateDistributions || []).map((g: any) => g.gate || g.Gate);
    const yData = (this.summaryData.gateDistributions || []).map((g: any) => g.count ?? g.Count ?? 0);

    this.gateChartOptions = {
      title: {
        text: 'Thống kê Dự án theo Gate (G0 - G13)',
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { interval: 0, fontSize: 11, fontWeight: '600', color: '#4b5563' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#6b7280' }
      },
      series: [
        {
          name: 'Số dự án',
          type: 'bar',
          barWidth: '55%',
          data: yData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: '#1e40af',
            fontWeight: 'bold'
          }
        }
      ]
    };
  }

  // 2. Biểu đồ tròn: Thống kê phân loại theo loại dự án (ProjectType)
  private buildProjectTypePieChart(): void {
    const pieData = (this.summaryData.projectTypeDistributions || []).map((pt: any) => ({
      name: pt.name || pt.Name,
      value: pt.count ?? pt.Count ?? 0
    }));

    this.projectTypeChartOptions = {
      title: {
        text: 'Phân loại Dự án theo Loại (ProjectType)',
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : <b>{c}</b> ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 11, color: '#4b5563' }
      },
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
      series: [
        {
          name: 'Loại dự án',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            }
          },
          data: pieData
        }
      ]
    };
  }

  // 3. Biểu đồ cột chồng: Phân bổ dự án theo Phòng ban
  private buildDepartmentStackedChart(): void {
    const depts = (this.summaryData.departmentDistributions || []).map((d: any) => d.departmentName || d.DepartmentName);
    const inProgress = (this.summaryData.departmentDistributions || []).map((d: any) => d.inProgress ?? d.InProgress ?? 0);
    const completed = (this.summaryData.departmentDistributions || []).map((d: any) => d.completed ?? d.Completed ?? 0);

    this.departmentChartOptions = {
      title: {
        text: 'Khối lượng Dự án theo Phòng ban',
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        right: '3%',
        top: '2%',
        textStyle: { fontSize: 11 }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: depts,
        axisLabel: { interval: 0, rotate: 15, fontSize: 10, color: '#4b5563' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1
      },
      series: [
        {
          name: 'Đang thực hiện',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#3b82f6', borderRadius: [0, 0, 0, 0] },
          data: inProgress
        },
        {
          name: 'Đã hoàn thành',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
          data: completed
        }
      ]
    };
  }

  // 4. Biểu đồ Donut: Đúng tiến độ vs Trễ tiến độ
  private buildStatusDonutChart(): void {
    this.statusChartOptions = {
      title: {
        text: 'Tình hình Tiến độ Dự án',
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { fontSize: 11 }
      },
      color: ['#10b981', '#ef4444'],
      series: [
        {
          name: 'Tiến độ',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}\n{c} ({d}%)',
            fontSize: 11,
            fontWeight: '600'
          },
          data: [
            { value: this.summaryData.onTrackCount || 0, name: 'Đúng tiến độ' },
            { value: this.summaryData.delayedCount || 0, name: 'Trễ tiến độ' }
          ]
        }
      ]
    };
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 0: return 'bg-secondary text-white';
      case 1: return 'bg-primary text-white';
      case 2: return 'bg-success text-white';
      case 3: return 'bg-info text-dark';
      case 4: return 'bg-warning text-dark';
      case 5: return 'bg-dark text-white';
      case 6: return 'bg-danger text-white';
      default: return 'bg-light text-dark';
    }
  }
}
