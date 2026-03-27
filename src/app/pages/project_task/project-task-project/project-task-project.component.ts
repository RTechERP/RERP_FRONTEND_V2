import { Component, OnInit, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ng-Zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';

// PrimeNG
import { TreeTableModule, TreeTable } from 'primeng/treetable';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { PrimeNG } from 'primeng/config';
import { TreeNode, FilterService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';

// NgbModal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Services
import { ProjectTaskProjectService, ProjectTaskTreeData, ProjectTaskTreeNode } from './project-task-project.service';
import { ProjectService } from '../../project/project-service/project.service';
import { ProjectTaskService } from '../project-task/project-task.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ImportExcelProjectTaskComponent } from '../import-excel-project-task/import-excel-project-task.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-project-task-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzGridModule,
    NzCardModule,
    NzToolTipModule,
    NzModalModule,
    TreeTableModule,
    TableModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    TaskDetailComponent,
    ImportExcelProjectTaskComponent,
    MultiSelectModule
  ],
  providers: [FilterService],
  templateUrl: './project-task-project.component.html',
  styleUrl: './project-task-project.component.css'
})
export class ProjectTaskProjectComponent implements OnInit {
  @ViewChild('tt') treeTable!: TreeTable;

  // ===== Filter data =====
  dateStart: string = '';
  dateEnd: string = '';
  projectId: number = -1;
  keyword: string = '';

  // ===== Dropdown data =====
  projectList: any[] = [];

  // ===== TreeTable data =====
  treeNodes: TreeNode[] = [];
  loading = signal<boolean>(false);
  totalTasks: number = 0;
  totalProjects: number = 0;
  isOpeningDetail: boolean = false; // Guard against spam-click opening multiple modals

  // ===== TreeTable columns =====
  cols: any[] = [
    { field: 'Code', header: 'Mã CV', width: '200px', minWidth: '200px', filterable: true },
    { field: 'Mission', header: 'Tên công việc', width: '300px', filterable: true },
    { field: 'DisplayStatus', header: 'Trạng thái', width: '150px' },
    { field: 'FullName', header: 'Người thực hiện', width: '150px', filterable: true },
    { field: 'IsAdditional', header: 'Phát sinh', width: '100px' },
    { field: 'TaskComplexity', header: 'Phức tạp', width: '100px' },
    { field: 'PercentOverTime', header: '% Quá hạn', width: '150px' },
    { field: 'PlanStartDateObj', header: 'Ngày BĐ dự kiến', width: '150px', isDate: true },
    { field: 'PlanEndDateObj', header: 'Ngày KT dự kiến', width: '150px', isDate: true },
    { field: 'StartDateObj', header: 'Ngày BĐ thực tế', width: '150px', isDate: true },
    { field: 'DueDateObj', header: 'Ngày KT thực tế', width: '150px', isDate: true }
  ];

  statusOptions = [
    { label: 'Chưa làm', value: 1 },
    { label: 'Đang làm', value: 2 },
    { label: 'Đang làm quá hạn', value: 21 },
    { label: 'Hoàn thành', value: 3 },
    { label: 'Hoàn thành quá hạn', value: 31 },
    { label: 'Đã duyệt', value: 32 },
    { label: 'Đã hủy duyệt', value: 33 },
    { label: 'Pending', value: 4 }
  ];

  // ===== Column filters =====
  columnFilters: { [key: string]: string } = {};

  constructor(
    private notification: NzNotificationService,
    private projectTaskProjectService: ProjectTaskProjectService,
    private projectTaskService: ProjectTaskService,
    private projectService: ProjectService,
    private primeNG: PrimeNG,
    private filterService: FilterService,
    private nzModal: NzModalService,
    private ngbModal: NgbModal,
    private el: ElementRef
  ) {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
  }

  ngOnInit(): void {
    this.setVietnameseLocale();
    this.registerCustomFilters();
    this.loadProjects();
    this.loadData();
  }

  registerCustomFilters(): void {
    this.filterService.register('overdue', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }
      if (value === undefined || value === null) {
        return false;
      }

      const numValue = Number(value);
      if (filter === 'ontime') {
        return numValue <= 0;
      }
      if (filter === 'overdue') {
        return numValue > 0;
      }
      return true;
    });

    // Custom date filter: compares Date object with YYYY-MM-DD string from input
    this.filterService.register('dateMatch', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }
      if (value === undefined || value === null) {
        return false;
      }

      // value is a Date object (from convertToTreeNode)
      // filter is a string "YYYY-MM-DD" from <input type="date">
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        return dateStr.includes(filter);
      } catch (e) {
        return false;
      }
    });
  }

  // ===== Load projects cho dropdown =====
  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const rawData = Array.isArray(res.data) ? res.data : [];
          // Chỉ lấy dự án chưa xóa (IsDeleted là false hoặc null)
          this.projectList = rawData.filter((p: any) => p.IsDeleted !== true);
        }
      },
      error: (err: any) => console.error('Error loading projects:', err)
    });
  }

  // ===== Load data từ API =====
  loadData(): void {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
      return;
    }

    this.loading.set(true);
    const params = {
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      projectID: this.projectId ?? -1,
      keyword: this.keyword.trim()
    };

    this.projectTaskProjectService.getProjectTaskTree(params).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res && res.status === 1 && res.data) {
          const apiNodes: ProjectTaskTreeNode[] = Array.isArray(res.data) ? res.data : [];
          this.treeNodes = this.buildTreeNodes(apiNodes);
          this.totalTasks = this.countAllTasks(apiNodes);
          this.totalProjects = this.treeNodes.length;
          this.updateAdaptiveWidth();
        } else {
          this.treeNodes = [];
          this.totalTasks = 0;
          this.totalProjects = 0;
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.error?.Message || err?.message || 'Lỗi khi tải dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
      }
    });
  }

  onFilterChange(value: any, field: string, matchMode: string): void {
    let transformedValue = value;

    if (field === 'IsAdditional') {
      transformedValue = value === 'true' ? true : (value === 'false' ? false : '');
    } else if (field === 'TaskComplexity') {
      transformedValue = value === '' ? '' : +value;
    }

    // Tự động sử dụng dateMatch cho các cột ngày tháng
    let actualMatchMode = matchMode;
    const col = this.cols.find(c => c.field === field);
    if (col && col.isDate) {
      actualMatchMode = 'dateMatch';
    }

    if (this.treeTable) {
      this.treeTable.filter(transformedValue, field, actualMatchMode);
    }
  }

  onFiltered(event: any): void {
    const nodes = event.filteredValue || this.treeNodes;
    let count = 0;
    nodes.forEach((node: any) => {
      if (node.children) {
        count += node.children.length;
      }
    });
    this.totalTasks = count;
    this.totalProjects = nodes.length;
  }

  // ===== Excel Export Helper =====
  private flattenTreeNodes(nodes: TreeNode[], level: number = 0, result: any[] = []): any[] {
    nodes.forEach(node => {
      const data = node.data;
      const row = { ...data, _level: level };

      if (data.isProjectGroup) {
        // Hàng dự án: chỉ giữ tiêu đề, các cột khác để trống
        row.DisplayStatusLabel = '';
        row.IsAdditionalLabel = '';
        row.PercentLabel = '';
      } else {
        // Hàng công việc: map labels
        row.DisplayStatusLabel = this.getDisplayStatus(data).label;
        row.IsAdditionalLabel = data.IsAdditional ? 'Có' : '-';
        row.PercentLabel = data.PercentOverTime !== null ? (data.PercentOverTime * 100) + '%' : '-';
      }

      result.push(row);

      if (node.children && node.children.length > 0) {
        this.flattenTreeNodes(node.children, level + 1, result);
      }
    });
    return result;
  }

  async exportToExcel() {
    // 1. Phẳng hóa dữ liệu từ TreeTable (lấy dữ liệu đang hiển thị sau filter)
    const currentNodes = (this.treeTable as any).filteredValue || this.treeNodes;
    const flatData = this.flattenTreeNodes(currentNodes);

    // 2. Định nghĩa cột cho Excel
    const excelCols = [
      { header: 'Mã CV / Dự án', field: 'Code' },
      { header: 'Tên công việc', field: 'Mission' },
      { header: 'Trạng thái', field: 'DisplayStatusLabel' },
      { header: 'Người thực hiện', field: 'FullName' },
      { header: 'Phát sinh', field: 'IsAdditionalLabel' },
      { header: 'Phức tạp', field: 'TaskComplexity' },
      { header: 'Quá hạn (%)', field: 'PercentLabel' },
      { header: 'BĐ dự kiến', field: 'PlanStartDateObj' },
      { header: 'KT dự kiến', field: 'PlanEndDateObj' },
      { header: 'BĐ thực tế', field: 'StartDateObj' },
      { header: 'KT thực tế', field: 'DueDateObj' },
    ];

    const tempTable: any = {
      value: flatData
    };

    // 3. Gọi hàm xuất chung
    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      excelCols,
      'Tổng hợp công việc theo dự án',
      'TongHopCongViecDuAn',
      (ws) => {
        // Cấu hình Grouping (Outline)
        (ws.properties as any).outlineSummaryBelow = false;

        flatData.forEach((row, index) => {
          const rowIndex = index + 2; // Dòng 1 là header
          const excelRow = ws.getRow(rowIndex);

          // Thiết lập cấp độ phân cấp (outlineLevel) cho Excel
          excelRow.outlineLevel = row._level || 0;

          if (row.isProjectGroup) {
            // Hàng dự án: Merge Title vào cột Mã CV (cột 1-2)
            ws.mergeCells(rowIndex, 1, rowIndex, 2);

            // Format hàng dự án: Bold, Blue, Background light blue
            const projectCell = ws.getCell(rowIndex, 1);
            projectCell.value = row.Mission;
            projectCell.font = { bold: true, color: { argb: 'FF1890FF' } };

            // Tô màu nền cho cả dòng dự án
            for (let col = 1; col <= excelCols.length; col++) {
              const cell = ws.getCell(rowIndex, col);
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F7FF' }
              };
            }
          } else {
            // Hàng công việc: Thụt lề cột 'Tên công việc' theo cấp độ cây
            if (row._level > 0) {
              const titleCell = ws.getCell(rowIndex, 2);
              titleCell.alignment = {
                indent: row._level * 2, // Thụt lề mỗi cấp 2 đơn vị
                vertical: 'middle',
                horizontal: 'left',
                wrapText: true
              };
            }
          }
        });
      }
    );
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
      lt: 'Nhỏ hơn',
      lte: 'Nhỏ hơn hoặc bằng',
      gt: 'Lớn hơn',
      gte: 'Lớn hơn hoặc bằng',
      is: 'Là',
      isNot: 'Không là',
      before: 'Trước',
      after: 'Sau',
      dateIs: 'Ngày là',
      dateIsNot: 'Ngày không là',
      dateBefore: 'Trước ngày',
      dateAfter: 'Sau ngày',
      clear: 'Xóa',
      apply: 'Áp dụng',
      matchAll: 'Khớp tất cả',
      matchAny: 'Khớp bất kỳ',
      addRule: 'Thêm điều kiện',
      removeRule: 'Xóa điều kiện',
      accept: 'Đồng ý',
      reject: 'Từ chối',
      choose: 'Chọn',
      upload: 'Tải lên',
      cancel: 'Hủy',
      emptyMessage: 'Không có dữ liệu',
      emptyFilterMessage: 'Không tìm thấy kết quả',
      today: 'Hôm nay',
      weekHeader: 'Tuần',
      firstDayOfWeek: 1,
      dateFormat: 'dd/mm/yy',
      monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
      dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
      dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    });
  }

  // ===== Transform API response to PrimeNG TreeNode[] grouped by Project =====
  buildTreeNodes(apiNodes: ProjectTaskTreeNode[]): TreeNode[] {
    // Group by ProjectID
    const projectMap = new Map<number, { projectCode: string; projectName: string; tasks: ProjectTaskTreeNode[] }>();

    for (const node of apiNodes) {
      const pid = node.Data.ProjectID;
      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectCode: node.Data.ProjectCode,
          projectName: node.Data.ProjectName,
          tasks: []
        });
      }
      projectMap.get(pid)!.tasks.push(node);
    }

    // Build TreeNode[] — each project is a parent node
    const result: TreeNode[] = [];
    for (const [projectId, group] of projectMap) {
      const childNodes = group.tasks.map(t => this.convertToTreeNode(t));
      result.push({
        data: {
          Mission: `${group.projectCode} - ${group.projectName}`,
          isProjectGroup: true,
          ProjectCode: group.projectCode,
          ProjectName: group.projectName,
          ProjectID: projectId,
          taskCount: this.countTasksInGroup(group.tasks)
        },
        children: childNodes,
        expanded: true,
        leaf: false
      });
    }
    return result;
  }

  // ===== Convert a single API node to PrimeNG TreeNode =====
  private convertToTreeNode(node: ProjectTaskTreeNode): TreeNode {
    const data = node.Data;
    const displayStatus = this.computeDisplayStatus(data);
    return {
      data: {
        ...data,
        DisplayStatus: displayStatus,
        isProjectGroup: false,
        PlanStartDateObj: data.PlanStartDate ? new Date(data.PlanStartDate) : null,
        PlanEndDateObj: data.PlanEndDate ? new Date(data.PlanEndDate) : null,
        StartDateObj: data.ActualStartDate ? new Date(data.ActualStartDate) : null,
        DueDateObj: data.ActualEndDate ? new Date(data.ActualEndDate) : null,
      },
      children: node.Children ? node.Children.map((c: any) => this.convertToTreeNode(c)) : [],
      expanded: node.Expanded,
      leaf: node.Leaf
    };
  }

  // ===== Count tasks =====
  private countTasksInGroup(nodes: ProjectTaskTreeNode[]): number {
    let count = 0;
    for (const n of nodes) {
      count += 1 + this.countTasksInGroup(n.Children);
    }
    return count;
  }

  private countAllTasks(nodes: ProjectTaskTreeNode[]): number {
    let count = 0;
    for (const n of nodes) {
      count += 1 + this.countAllTasks(n.Children);
    }
    return count;
  }

  // ===== Dynamic Column Width for TreeTable expansion =====
  updateAdaptiveWidth(): void {
    // Small delay to ensure node expansion state is fully committed
    setTimeout(() => {
      const maxExpandedLevel = this.getMaxExpandedLevel(this.treeNodes);
      // Level 0 expanded -> Level 1 tasks show (padding 0) -> Width = 200
      // Level 1 tasks expanded -> Level 2 tasks show (padding 20) -> Width = 200
      const newWidth = 200 + (Math.max(0, maxExpandedLevel - 1) * 27);

      if (this.cols && this.cols.length > 0) {
        this.cols[0].width = `${newWidth}px`;
        this.cols[0].minWidth = `${newWidth}px`;
        // Trigger PrimeNG scrollable synchronization by updating reference
        this.cols = [...this.cols];
      }
    }, 0);
  }

  private getMaxExpandedLevel(nodes: TreeNode[], currentLevel: number = 0): number {
    let max = currentLevel;
    for (const node of nodes) {
      if (node.expanded && node.children && node.children.length > 0) {
        const childMax = this.getMaxExpandedLevel(node.children, currentLevel + 1);
        if (childMax > max) max = childMax;
      }
    }
    return max;
  }

  // ===== TRẠNG THÁI GỘP (Status + ReviewStatus + Quá hạn) =====
  computeDisplayStatus(task: any): number {
    const isOverdue = this.isTaskOverdue(task);
    if (task.Status === 3 && task.ReviewStatus === 2) return 32;
    if (task.Status === 3 && task.ReviewStatus === 3) return 33;
    if (task.Status === 3 && isOverdue) return 31;
    if (task.Status === 3) return 3;
    if (task.Status === 2 && isOverdue) return 21;
    if (task.Status === 2) return 2;
    if (task.Status === 4) return 4;
    return 1;
  }

  private isTaskOverdue(task: any): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    const dueDate = task.DueDate ? new Date(task.DueDate) : (task.ActualEndDate ? new Date(task.ActualEndDate) : null);
    if (dueDate && planEnd && dueDate > planEnd) return true;
    if (!dueDate && planEnd && planEnd < now && task.Status !== 4) return true;
    return false;
  }

  getDisplayStatus(task: any): { label: string; severity: 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' | undefined } {
    const ds = task.DisplayStatus ?? task.Status;
    switch (ds) {
      case 1: return { label: 'Chưa làm', severity: 'secondary' };
      case 2: return { label: 'Đang làm', severity: 'info' };
      case 21: return { label: 'Đang làm quá hạn', severity: 'danger' };
      case 3: return { label: 'Hoàn thành', severity: 'success' };
      case 31: return { label: 'Hoàn thành quá hạn', severity: 'warn' };
      case 32: return { label: 'Đã duyệt', severity: 'success' };
      case 33: return { label: 'Đã hủy duyệt', severity: 'danger' };
      case 4: return { label: 'Pending', severity: 'warn' };
      default: return { label: 'Chưa xác định', severity: 'secondary' };
    }
  }

  // ===== Formatting =====
  formatDate(dateVal: string | Date | null): string {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ===== Reset search =====
  resetSearch(): void {
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = now.endOf('month').toFormat('yyyy-MM-dd');
    this.projectId = -1;
    this.keyword = '';
    this.columnFilters = {};
    this.loadData();
  }

  // ===== Import Excel =====
  openImportExcel(): void {
    const modalRef = this.ngbModal.open(ImportExcelProjectTaskComponent, {
      centered: true,
      size: 'xl',
      windowClass: 'excel-import-modal-90',
      container: this.el.nativeElement,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
      }
    }).catch(() => { });
  }

  // ===== Task Detail Modal =====
  openTaskDetail(taskData: any): void {
    if (this.isOpeningDetail) return;
    if (!taskData?.ID) {
      console.error('Task ID not found');
      return;
    }
    this.isOpeningDetail = true;

    this.projectTaskService.getTaskById(taskData.ID).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const fullTaskData = res.data;

          const modalRef = this.nzModal.create({
            nzTitle: 'CHI TIẾT CÔNG VIỆC',
            nzContent: TaskDetailComponent,
            nzData: { task: fullTaskData },
            nzFooter: null,
            nzWidth: '100vw',
            nzBodyStyle: {
              padding: '0',
              height: '80vh',
              overflow: 'hidden'
            },
            nzStyle: {
              borderRadius: '12px',
              top: '5vh'
            },
            nzMaskClosable: false,
            nzClosable: true,
            nzCentered: false
          });

          modalRef.afterClose.subscribe(() => {
            this.isOpeningDetail = false;
          });
        } else {
          this.notification.error('Thất bại', 'Không thể lấy thông tin chi tiết công việc.');
          this.isOpeningDetail = false;
        }
      },
      error: (err) => {
        console.error('Error fetching task info:', err);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lấy thông tin chi tiết công việc.');
        this.isOpeningDetail = false;
      }
    });
  }
}
