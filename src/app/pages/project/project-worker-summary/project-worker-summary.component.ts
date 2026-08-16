import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { SplitterModule } from 'primeng/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';

import { ProjectService } from '../project-service/project.service';
import { ProjectWorkerService } from '../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectTypeDepartmentService } from '../project-gate/project-type-department/project-type-department.service';
import { DepartmentServiceService } from '../../hrm/department/department-service/department-service.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ColDef, WORK_REPORT_COLUMNS, PROJECT_WORKER_COLUMNS, applyFilters, refreshMultiselectOptions } from './columns.config';

@Component({
  selector: 'app-project-worker-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenubarModule,
    TableModule,
    MultiSelectModule,
    InputTextModule,
    SplitterModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
  ],
  templateUrl: './project-worker-summary.component.html',
  styleUrls: ['./project-worker-summary.component.css'],
})
export class ProjectWorkerSummaryComponent implements OnInit {
  menuBars: MenuItem[] = [];

  param: any = {
    departmentID: 0,
    projectTypeID: 0,
    projectID: 0,
    keyword: '',
  };

  isAdvandShow = true;
  isLoadingReport = false;
  isLoadingWorker = false;

  // Dữ liệu combobox
  departments: any[] = [];
  projectTypes: any[] = [];
  projects: any[] = [];

  // Tập ProjectID hợp lệ với kiểu dự án đang chọn (qua ProjectTypeLink). null = không lọc.
  allowedProjectIds: Set<number> | null = null;

  // Cột + dữ liệu 2 bảng
  reportColumns: ColDef[] = [];
  workerColumns: ColDef[] = [];
  reportData: any[] = [];
  filteredReportData: any[] = [];
  workerData: any[] = [];
  filteredWorkerData: any[] = [];

  // Cây nhân công (giữ lại để tính tổng theo dòng gốc)
  treeWorkerData: any[] = [];

  // Trạng thái thu gọn của cây nhân công
  private collapsedIds = new Set<number>();
  private workerById = new Map<number, any>();

  // Số liệu tổng hợp phía trên
  summary = {
    reportCount: 0,      // Số báo cáo
    totalDays: 0,        // Tổng số ngày (giờ thực tế / 8)
    totalDaysWithRatio: 0, // Tổng ngày có hệ số (tổng số giờ / 8)
    totalWorkforce: 0,   // Tổng số ngày nhân công (sum cột Tổng nhân công)
  };

  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private projectTypeDepartmentService: ProjectTypeDepartmentService,
    private departmentService: DepartmentServiceService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    @Optional() @Inject('tabData') private tabData?: any
  ) { }

  ngOnInit(): void {
    this.reportColumns = WORK_REPORT_COLUMNS.map(c => ({ ...c }));
    this.workerColumns = PROJECT_WORKER_COLUMNS.map(c => ({ ...c }));

    this.param.departmentID = this.tabData?.departmentID ?? this.appUserService.departmentID ?? 0;
    if (this.tabData?.projectID) this.param.projectID = this.tabData.projectID;

    this.initMenu();
    // loadProjectTypes() tự chọn kiểu dự án đầu tiên rồi mới gọi loadData(),
    // nên không gọi loadData() ở đây để khỏi nạp 2 lần.
    this.loadCombobox();
  }

  initMenu(): void {
    this.menuBars = [
      { label: 'Tải lại', icon: 'fa-solid fa-arrows-rotate fa-lg text-primary', command: () => this.loadData() },
      { label: 'Xuất excel', icon: 'fa-solid fa-file-excel fa-lg text-success', command: () => this.exportExcel() },
    ];
  }

  //#region Combobox
  loadCombobox(): void {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        this.departments = res?.data || [];
        this.loadProjectTypes();
      },
      error: (err) => this.showError(err, 'Không thể tải danh sách phòng ban!'),
    });

    this.projectService.getProjectCombobox().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.projects = res.data || [];
      },
      error: (err) => this.showError(err, 'Không thể tải danh sách dự án!'),
    });
  }

  /** Nạp kiểu dự án theo phòng ban, tự chọn dòng đầu tiên rồi nạp lại dữ liệu 2 bảng */
  loadProjectTypes(): void {
    if (!this.param.departmentID) {
      this.projectTypes = [];
      this.param.projectTypeID = 0;
      this.allowedProjectIds = null;
      this.loadData();
      return;
    }

    this.projectTypeDepartmentService.getByDepartment(this.param.departmentID).subscribe({
      next: (res: any) => {
        this.projectTypes = res?.data || [];
        this.param.projectTypeID = this.projectTypes.length > 0 ? this.projectTypes[0].ID : 0;
        this.loadAllowedProjects(() => this.loadData());
      },
      error: (err) => {
        this.projectTypes = [];
        this.param.projectTypeID = 0;
        this.allowedProjectIds = null;
        this.loadData();
        this.showError(err, 'Không thể tải danh sách kiểu dự án!');
      },
    });
  }

  /**
   * Danh sách dự án đã lọc theo kiểu dự án đang chọn.
   * Một dự án tham gia nhiều kiểu dự án qua bảng ProjectTypeLink nên danh sách
   * dự án hợp lệ phải lấy từ API, không đọc cột nào trên bảng Project.
   */
  get filteredProjects(): any[] {
    if (!this.param.projectTypeID || this.allowedProjectIds === null) return this.projects;
    // Luôn giữ lại dự án đang chọn để nz-select còn option mà hiển thị nhãn
    return this.projects.filter(
      p => this.allowedProjectIds!.has(Number(p.ID)) || Number(p.ID) === Number(this.param.projectID)
    );
  }

  /**
   * Nạp tập dự án hợp lệ với kiểu dự án đang chọn (đi qua ProjectTypeLink.Selected = 1).
   * Không chọn kiểu dự án thì để null = không lọc.
   */
  loadAllowedProjects(afterLoad?: () => void): void {
    if (!this.param.projectTypeID) {
      this.allowedProjectIds = null;
      if (afterLoad) afterLoad();
      return;
    }

    this.projectTypeDepartmentService
      .getProjectsByType(this.param.departmentID || 0, this.param.projectTypeID)
      .subscribe({
        next: (res: any) => {
          const rows = res?.data || [];
          this.allowedProjectIds = new Set<number>(rows.map((r: any) => Number(r.ID)));
          if (afterLoad) afterLoad();
        },
        error: (err) => {
          // Lỗi thì bỏ lọc thay vì lọc sai
          this.allowedProjectIds = null;
          if (afterLoad) afterLoad();
          this.showError(err, 'Không thể tải danh sách dự án theo kiểu dự án!');
        },
      });
  }

  onDepartmentChange(): void {
    this.allowedProjectIds = null;
    // loadProjectTypes() chọn lại kiểu dự án đầu tiên và tự gọi loadData()
    this.loadProjectTypes();
  }

  onProjectTypeChange(): void {
    // Không tự bỏ chọn dự án: kiểu dự án ở ProjectTypeLink (mức dự án) và ở
    // ProjectWorkerVersion (mức phiên bản) là 2 khái niệm khác nhau, dự án vẫn
    // có thể có phiên bản PO thuộc kiểu này dù không khai báo ProjectTypeLink.
    this.loadAllowedProjects(() => this.loadData());
  }

  onProjectChange(): void {
    this.loadData();
  }
  //#endregion

  //#region Load dữ liệu
  loadData(): void {
    this.loadWorkReport();
    this.loadProjectWorker();
  }

  loadWorkReport(): void {
    this.isLoadingReport = true;
    this.projectService.getProjectListWorkReport(
      this.param.projectID || 0,
      this.param.keyword || '',
      1,
      999999,
      this.param.departmentID || 0,
      0
    ).subscribe({
      next: (res: any) => {
        let data: any[] = [];
        if (res?.status === 1 && res.data) {
          data = Array.isArray(res.data) ? res.data : (res.data.dt || []);
        }
        this.reportData = this.filterReportByProjectType(data);
        refreshMultiselectOptions(this.reportData, this.reportColumns);
        this.onReportFilterChange();
        this.calcReportSummary();
        this.isLoadingReport = false;
      },
      error: (err) => {
        this.reportData = [];
        this.filteredReportData = [];
        this.calcReportSummary();
        this.isLoadingReport = false;
        this.showError(err, 'Không thể tải dữ liệu báo cáo công việc!');
      },
    });
  }

  /**
   * spGetProjectWorker lọc cứng theo ProjectWorkerVersionID nên phải nạp
   * giải pháp -> phiên bản PO -> lấy nhân công của từng phiên bản PO đang sử dụng.
   * Chỉ lấy phiên bản PO, không lấy phiên bản giải pháp.
   */
  loadProjectWorker(): void {
    this.isLoadingWorker = true;

    if (!this.param.projectID) {
      // SP yêu cầu ProjectID cụ thể (p.ProjectID = @ProjectID), không hỗ trợ lấy tất cả dự án
      this.setWorkerData([]);
      this.isLoadingWorker = false;
      return;
    }

    this.projectWorkerService.getSolution(this.param.projectID).subscribe({
      next: (res: any) => {
        const solutions = res?.status === 1 ? (res.data || []) : [];
        if (solutions.length === 0) {
          this.setWorkerData([]);
          this.isLoadingWorker = false;
          return;
        }
        this.loadWorkerVersions(solutions);
      },
      error: (err) => {
        this.setWorkerData([]);
        this.isLoadingWorker = false;
        this.showError(err, 'Không thể tải dữ liệu giải pháp!');
      },
    });
  }

  private loadWorkerVersions(solutions: any[]): void {
    const requests = solutions.map((sol: any) =>
      this.projectWorkerService.getPOVersion(sol.ID).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        const versions: any[] = [];
        responses.forEach((res: any) => {
          if (res?.status === 1 && Array.isArray(res.data)) versions.push(...res.data);
        });

        // Chỉ lấy phiên bản PO đang sử dụng để không cộng trùng nhân công giữa các phiên bản
        let activeVersions = versions.filter((v: any) => v.IsActive === true);
        if (this.param.projectTypeID) {
          activeVersions = activeVersions.filter(
            (v: any) => Number(v.ProjectTypeID ?? 0) === Number(this.param.projectTypeID)
          );
        }

        const versionIds = Array.from(new Set(activeVersions.map((v: any) => v.ID).filter((id: any) => id > 0)));
        if (versionIds.length === 0) {
          this.setWorkerData([]);
          this.isLoadingWorker = false;
          return;
        }
        this.loadWorkerByVersions(versionIds);
      },
      error: (err) => {
        this.setWorkerData([]);
        this.isLoadingWorker = false;
        this.showError(err, 'Không thể tải danh sách phiên bản PO!');
      },
    });
  }

  private loadWorkerByVersions(versionIds: number[]): void {
    const requests = versionIds.map((versionID) =>
      this.projectWorkerService.getProjectWorker({
        projectID: this.param.projectID,
        projectWorkerTypeID: 0,
        IsApprovedTBP: -1,
        IsDeleted: 0,
        KeyWord: this.param.keyword || '',
        versionID: versionID,
      }).pipe(
        map((res: any) => (res?.status === 1 ? (res.data || []) : [])),
        catchError(() => of([]))
      )
    );

    forkJoin(requests).subscribe({
      next: (results: any[][]) => {
        const rows: any[] = [];
        const seen = new Set<number>();
        results.forEach((list) => {
          list.forEach((row: any) => {
            if (!seen.has(row.ID)) {
              seen.add(row.ID);
              rows.push(row);
            }
          });
        });
        this.setWorkerData(rows);
        this.isLoadingWorker = false;
      },
      error: (err) => {
        this.setWorkerData([]);
        this.isLoadingWorker = false;
        this.showError(err, 'Không thể tải dữ liệu nhân công dự án!');
      },
    });
  }

  private setWorkerData(rows: any[]): void {
    this.treeWorkerData = this.calculateWorkerTree(rows);
    this.workerData = this.flattenTree(this.treeWorkerData);

    // Mặc định mở hết cây, giống initiallyCollapsed = false của bảng gốc
    this.collapsedIds.clear();
    this.workerById = new Map(this.workerData.map((row: any) => [row.ID, row]));

    refreshMultiselectOptions(this.workerData, this.workerColumns);
    this.onWorkerFilterChange();
    this.calcWorkerSummary();
  }

  /**
   * spGetDailyReportTechnical_New không trả ProjectID/ProjectTypeID,
   * chỉ có ProjectText = ProjectCode + ' - ' + ProjectName nên đối chiếu theo chuỗi này.
   */
  private filterReportByProjectType(data: any[]): any[] {
    // Đã chọn 1 dự án cụ thể thì SP lọc sẵn theo @ProjectID rồi, không lọc thêm
    if (this.param.projectID) return data;
    if (!this.param.projectTypeID || this.allowedProjectIds === null) return data;
    const allowed = new Set(
      this.projects
        .filter((p: any) => this.allowedProjectIds!.has(Number(p.ID)))
        .map((p: any) => `${p.ProjectCode} - ${p.ProjectName}`)
    );
    return data.filter(row => allowed.has(row?.ProjectText));
  }
  //#endregion

  //#region Tính cây nhân công - theo ProjectWokerSlickGridComponent
  calculateWorkerTree(data: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    data.forEach((item) => {
      const node = {
        ...item,
        _children: [],
        IsApprovedTBPText: item.IsApprovedTBP ? 'Đã duyệt' : 'Chưa duyệt',
      };
      map.set(node.ID, node);
    });

    data.forEach((item) => {
      const node = map.get(item.ID)!;
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    const calculateNode = (node: any): void => {
      const numberOfPeople = Number(node.AmountPeople) || 0;
      const numberOfDays = Number(node.NumberOfDay) || 0;
      const laborCostPerDay = Number(node.Price) || 0;

      let totalLaborFromDirectChildren = 0;
      let totalCostFromDirectChildren = 0;

      node._children.forEach((child: any) => {
        calculateNode(child);
        totalLaborFromDirectChildren += Number(child.TotalWorkforce) || 0;
        totalCostFromDirectChildren += Number(child.TotalPrice) || 0;
      });

      if (node._children && node._children.length > 0) {
        node.TotalWorkforce = totalLaborFromDirectChildren;
        node.TotalPrice = totalCostFromDirectChildren;
      } else {
        const totalLabor = numberOfPeople * numberOfDays;
        node.TotalWorkforce = totalLabor;
        node.TotalPrice = totalLabor * laborCostPerDay;
      }
    };

    tree.forEach((root) => calculateNode(root));
    return tree;
  }

  /** Duỗi cây thành danh sách phẳng cho p-table, giữ cấp bậc để thụt lề cột TT */
  flattenTree(tree: any[], level: number = 0): any[] {
    const result: any[] = [];
    tree.forEach((node) => {
      const hasChildren = node._children && node._children.length > 0;
      result.push({
        ...node,
        __treeLevel: level,
        __hasChildren: hasChildren,
      });
      if (hasChildren) {
        result.push(...this.flattenTree(node._children, level + 1));
      }
    });
    return result;
  }
  //#endregion

  //#region Số liệu tổng hợp
  calcReportSummary(): void {
    const sumTimeReality = this.reportData.reduce((sum, row) => sum + (parseFloat(row.TimeReality) || 0), 0);
    const sumTotalHours = this.reportData.reduce((sum, row) => sum + (parseFloat(row.TotalHours) || 0), 0);

    this.summary.reportCount = this.reportData.length;
    this.summary.totalDays = sumTimeReality / 8;
    this.summary.totalDaysWithRatio = sumTotalHours / 8;
  }

  calcWorkerSummary(): void {
    // Chỉ cộng dòng gốc để không tính trùng nhân công của dòng con
    this.summary.totalWorkforce = this.treeWorkerData.reduce(
      (sum, root) => sum + (Number(root.TotalWorkforce) || 0), 0
    );
  }
  //#endregion

  //#region Lọc trên header bảng
  onReportFilterChange(): void {
    this.filteredReportData = applyFilters(this.reportData, this.reportColumns);
  }

  onWorkerFilterChange(): void {
    this.filteredWorkerData = applyFilters(this.workerData, this.workerColumns)
      .filter(row => this.isWorkerRowVisible(row));
  }

  /** Dòng chỉ hiện khi mọi dòng cha phía trên đều đang mở */
  private isWorkerRowVisible(row: any): boolean {
    let parentId = row?.ParentID;
    let guard = 0;
    while (parentId && parentId > 0 && guard++ < 200) {
      if (this.collapsedIds.has(parentId)) return false;
      const parent = this.workerById.get(parentId);
      if (!parent) break;
      parentId = parent.ParentID;
    }
    return true;
  }

  isWorkerRowCollapsed(row: any): boolean {
    return this.collapsedIds.has(row?.ID);
  }

  toggleWorkerRow(row: any): void {
    if (!row?.__hasChildren) return;
    if (this.collapsedIds.has(row.ID)) {
      this.collapsedIds.delete(row.ID);
    } else {
      this.collapsedIds.add(row.ID);
    }
    this.onWorkerFilterChange();
  }

  expandAllWorker(): void {
    this.collapsedIds.clear();
    this.onWorkerFilterChange();
  }

  collapseAllWorker(): void {
    this.collapsedIds = new Set<number>(
      this.workerData.filter((row: any) => row.__hasChildren).map((row: any) => row.ID)
    );
    this.onWorkerFilterChange();
  }

  /** Căn lề ô: số căn phải, ngày căn giữa, còn lại căn trái. Header luôn căn giữa (xử lý ở CSS). */
  cellAlign(col: ColDef): string {
    if (col.type === 'number') return 'right';
    if (col.type === 'date') return 'center';
    return 'left';
  }

  getWorkerRowClass(row: any): string {
    if (row.IsDeleted === true) return 'row-deleted';
    if (row.__hasChildren === true) return 'row-parent';
    return '';
  }

  /** Ẩn giá trị ở dòng cha giống bảng gốc (số người / số ngày / đơn giá) */
  isHiddenOnParent(field: string): boolean {
    return field === 'AmountPeople' || field === 'NumberOfDay' || field === 'Price';
  }
  //#endregion

  //#region Xuất excel
  async exportExcel(): Promise<void> {
    if (this.filteredReportData.length === 0 && this.filteredWorkerData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất excel!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();

      const summarySheet = workbook.addWorksheet('Tổng hợp');
      summarySheet.addRow(['Chỉ tiêu', 'Giá trị']).font = { bold: true };
      summarySheet.addRow(['Số báo cáo', this.summary.reportCount]);
      summarySheet.addRow(['Tổng số ngày', Number(this.summary.totalDays.toFixed(2))]);
      summarySheet.addRow(['Tổng ngày (có hệ số)', Number(this.summary.totalDaysWithRatio.toFixed(2))]);
      summarySheet.addRow(['Tổng số ngày nhân công', Number(this.summary.totalWorkforce.toFixed(2))]);
      summarySheet.getColumn(1).width = 28;
      summarySheet.getColumn(2).width = 18;

      this.addSheet(workbook, 'Báo cáo công việc', this.reportColumns, this.filteredReportData);
      this.addSheet(workbook, 'Nhân công dự án', this.workerColumns, this.filteredWorkerData);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `TongHopNhanCongDuAn_${DateTime.now().toFormat('ddMMyyyy')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất excel thành công!');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất excel! ' + (error?.message || ''));
    }
  }

  private addSheet(workbook: ExcelJS.Workbook, sheetName: string, columns: ColDef[], data: any[]): void {
    const worksheet = workbook.addWorksheet(sheetName);
    const visibleColumns = columns.filter(c => !c.hidden);

    const headerRow = worksheet.addRow(visibleColumns.map(c => c.header));
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach((row) => {
      const excelRow = worksheet.addRow(visibleColumns.map((col) => {
        const value = row[col.field];
        if (col.type === 'date' && value) {
          const dt = DateTime.fromISO(String(value));
          return dt.isValid ? dt.toJSDate() : value;
        }
        return value ?? '';
      }));
      excelRow.eachCell((cell) => {
        if (cell.value instanceof Date) cell.numFmt = 'dd/mm/yyyy';
      });
    });

    visibleColumns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = Math.max(12, Math.min(parseInt(col.width, 10) / 7, 50));
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };
  }
  //#endregion

  private showError(err: any, fallback: string): void {
    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || fallback);
  }
}
