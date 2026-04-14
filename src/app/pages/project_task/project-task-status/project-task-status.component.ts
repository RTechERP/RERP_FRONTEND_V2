import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ng-Zorro
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { ProjectTaskStatusChartComponent } from '../project-task-status-chart/project-task-status-chart.component';

// PrimeNG
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { PrimeNG } from 'primeng/config';
import { MultiSelectModule } from 'primeng/multiselect';

// Services
import { ProjectTaskStatusService, ProjectTaskViewStatusItem } from './project-task-status.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';
import { ProjectTaskService } from '../project-task/project-task.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DateTime } from 'luxon';

// Enhanced item: bổ sung metadata nhóm để hỗ trợ rowspan
export interface EnhancedItem extends ProjectTaskViewStatusItem {
  _isFirst: boolean;      // True nếu là hàng đầu tiên của nhóm nhân viên
  _rowspan: number;       // Số hàng span (chỉ dùng khi _isFirst = true)
  _groupIdx: number;      // Số thứ tự nhóm (STT hiển thị)
}

@Component({
  selector: 'app-project-task-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzFormModule,
    NzSpinModule,
    TableModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    MultiSelectModule,
    NzRadioModule,
    ProjectTaskStatusChartComponent
  ],
  templateUrl: './project-task-status.component.html',
  styleUrl: './project-task-status.component.css'
})
export class ProjectTaskStatusComponent implements OnInit {
  @ViewChild(ProjectTaskStatusChartComponent) chartComponent?: ProjectTaskStatusChartComponent;

  // ===== View Type =====
  viewType: 'table' | 'chart' = 'table';

  // ===== Filter params (search form) =====
  dateStart: string = '';
  dateEnd: string = '';
  departmentId: number = 0;
  teamId: number = 0;
  userId: number = 0;
  projectId: number = 0;
  keyword: string = '';
  selectedStatuses: number[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm (còn hạn)', value: 1 },
    { label: 'Đang làm (hết hạn)', value: 11 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Hoàn thành (quá hạn)', value: 21 },
    { label: 'Pending', value: 3 }
  ];

  // ===== Column filter (manual) =====
  filterFullName: string = '';
  filterProjectCode: string = '';
  filterProjectName: string = '';

  // ===== Dropdown data =====
  departmentList: any[] = [];
  teamList: any[] = [];
  userList: any[] = [];
  projectList: any[] = [];

  // ===== Data signals =====
  private rawItems: ProjectTaskViewStatusItem[] = [];          // Dữ liệu gốc từ API
  displayItems = signal<EnhancedItem[]>([]);                   // Dữ liệu đã xử lý rowspan
  loading = signal<boolean>(false);

  constructor(
    private notification: NzNotificationService,
    private projectTaskStatusService: ProjectTaskStatusService,
    private workplanService: WorkplanService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private projectTaskService: ProjectTaskService,
    private primeNG: PrimeNG
  ) {
    // Mặc định đầu tháng đến cuối tháng hiện tại
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
  }

  ngOnInit(): void {
    this.setVietnameseLocale();
    this.departmentId = this.appUserService.departmentID || 0;
    this.loadDepartments();
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadProjects();
    this.loadData();
  }

  // ===== Dropdown loaders =====

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading departments:', err)
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
      },
      error: () => { this.teamList = []; }
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
      },
      error: () => { this.userList = []; }
    });
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.projectList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading projects:', err)
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

  // ===== Load data từ API =====
  loadData(): void {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
      return;
    }

    const formatDate = (date: any): string => {
      if (date instanceof Date) return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
      if (typeof date === 'string') return date;
      return DateTime.now().toFormat('yyyy-MM-dd');
    };

    this.loading.set(true);
    const params = {
      dateStart: formatDate(this.dateStart),
      dateEnd: formatDate(this.dateEnd),
      departmentID: this.departmentId || 0,
      teamID: this.teamId || 0,
      userID: this.userId || 0,
      projectID: this.projectId || 0,
      keyword: this.keyword.trim()
    };

    if (this.viewType === 'table') {
      this.projectTaskStatusService.getList(params).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          if (res && res.status === 1 && res.data) {
            this.rawItems = Array.isArray(res.data) ? res.data : [];
          } else if (Array.isArray(res)) {
            this.rawItems = res;
          } else {
            this.rawItems = [];
          }
          // Reset column filter khi search mới
          this.filterFullName = '';
          this.filterProjectCode = '';
          this.filterProjectName = '';
          this.processData();
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg = err?.error?.message || err?.error?.Message || err?.message || 'Lỗi khi tải dữ liệu!';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
        }
      });
    } else {
      this.loading.set(false);
    }

    // Nếu đang ở dạng biểu đồ, gọi loadData của component biểu đồ
    if (this.viewType === 'chart' && this.chartComponent) {
      this.chartComponent.loadData();
    }
  }

  onViewTypeChange(): void {
    // Đợi 1 nhịp để @if (viewType === 'chart') kịp render component chart
    setTimeout(() => {
      this.loadData();
    }, 0);
  }

  // ===== Xử lý dữ liệu: filter + sort + tính rowspan =====
  processData(): void {
    const fnLower = this.filterFullName.trim().toLowerCase();
    const codeLower = this.filterProjectCode.trim().toLowerCase();
    const nameLower = this.filterProjectName.trim().toLowerCase();

    // 1. Filter theo các cột text
    let filtered = this.rawItems.filter(item => {
      if (fnLower && !(item.FullName || '').toLowerCase().includes(fnLower)) return false;
      if (codeLower && !(item.ProjectCode || '').toLowerCase().includes(codeLower)) return false;
      if (nameLower && !(item.ProjectName || '').toLowerCase().includes(nameLower)) return false;
      return true;
    });

    // 1.5 Filter theo status đa chọn
    if (this.selectedStatuses && this.selectedStatuses.length > 0) {
      filtered = filtered.filter(item => {
        return this.selectedStatuses.some(status => {
          switch (status) {
            case 0: return item.NotStarted > 0;
            case 1: return item.Doing > 0;
            case 11: return item.DoingOverdue > 0;
            case 2: return item.Done > 0;
            case 21: return item.DoneLate > 0;
            case 3: return item.Pending > 0;
            default: return false;
          }
        });
      });
    }

    // 2. Sắp xếp: theo FullName tăng dần, trong nhóm theo ProjectCode
    filtered.sort((a, b) => {
      const fn = (a.FullName || '').localeCompare(b.FullName || '', 'vi');
      if (fn !== 0) return fn;
      return (a.ProjectCode || '').localeCompare(b.ProjectCode || '', 'vi');
    });

    // 3. Tính rowspan: đánh dấu hàng đầu tiên của mỗi nhóm FullName
    const enhanced: EnhancedItem[] = filtered.map(item => ({
      ...item,
      _isFirst: false,
      _rowspan: 1,
      _groupIdx: 0
    }));

    let groupIdx = 0;
    for (let i = 0; i < enhanced.length; i++) {
      const isNewGroup = i === 0 || enhanced[i].FullName !== enhanced[i - 1].FullName;
      if (isNewGroup) {
        // Đếm số hàng trong nhóm này
        let count = 1;
        while (
          i + count < enhanced.length &&
          enhanced[i + count].FullName === enhanced[i].FullName
        ) { count++; }

        enhanced[i]._isFirst = true;
        enhanced[i]._rowspan = count;
        enhanced[i]._groupIdx = ++groupIdx;
      }
    }

    this.displayItems.set(enhanced);
  }

  // Được gọi khi user gõ vào bất kỳ column filter input nào
  onColumnFilter(): void {
    this.processData();
  }

  async exportToExcel() {
    const cols = [
      { header: 'STT', field: '_groupIdx' },
      { header: 'Họ và tên', field: 'FullName' },
      { header: 'Mã dự án', field: 'ProjectCode' },
      { header: 'Tên dự án', field: 'ProjectName' },
      { header: 'Chưa làm', field: 'NotStarted' },
      { header: 'Đang làm (còn hạn)', field: 'Doing' },
      { header: 'Đang làm (hết hạn)', field: 'DoingOverdue' },
      { header: 'Hoàn thành', field: 'Done' },
      { header: 'Hoàn thành (quá hạn)', field: 'DoneLate' },
      { header: 'Pending', field: 'Pending' },
      { header: 'Tổng', field: 'TotalTasks' },
    ];

    const tempTable: any = {
      value: this.displayItems()
    };

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Thống kê trạng thái',
      'ThongKeTrangThai',
      (ws) => {
        // Gộp ô cho STT và Họ tên dựa trên _isFirst và _rowspan
        this.displayItems().forEach((item, index) => {
          if (item._isFirst && item._rowspan > 1) {
            const startRow = index + 2; // Dòng 1 là header
            const endRow = startRow + item._rowspan - 1;

            // Merge cột 1 (STT) và cột 2 (Họ và tên)
            ws.mergeCells(startRow, 1, endRow, 1);
            ws.mergeCells(startRow, 2, endRow, 2);

            // Căn giữa dọc
            [1, 2].forEach(col => {
              const cell = ws.getCell(startRow, col);
              cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left', wrapText: true };
            });
          }
        });
      }
    );
  }

  resetSearch(): void {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0;
    this.userId = 0;
    this.projectId = 0;
    this.keyword = '';
    this.selectedStatuses = [];
    this.teamList = [];
    this.userList = [];
    this.filterFullName = '';
    this.filterProjectCode = '';
    this.filterProjectName = '';
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadData();
  }

  setVietnameseLocale(): void {
    this.primeNG.setTranslation({
      startsWith: 'Bắt đầu bằng',
      contains: 'Chứa',
      notContains: 'Không chứa',
      endsWith: 'Kết thúc bằng',
      equals: 'Bằng',
      notEquals: 'Không bằng',
      noFilter: 'Không lọc',
      clear: 'Xóa',
      apply: 'Áp dụng',
      matchAll: 'Khớp tất cả',
      matchAny: 'Khớp bất kỳ',
      addRule: 'Thêm điều kiện',
      removeRule: 'Xóa điều kiện',
      accept: 'Đồng ý',
      reject: 'Từ chối',
      emptyMessage: 'Không có dữ liệu',
      emptyFilterMessage: 'Không tìm thấy kết quả',
      today: 'Hôm nay',
      weekHeader: 'Tuần',
      firstDayOfWeek: 1,
      dateFormat: 'dd/mm/yy',
      monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6',
        'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
      dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
      dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    });
  }
}
