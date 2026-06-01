import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ContextMenuModule } from 'primeng/contextmenu';

import { CustomTable } from '../../../shared/components/custom-table/custom-table';
import { ColumnDef } from '../../../shared/components/custom-table/column-def.model';
import { ProjectTaskEfficiencyByProjectService } from './project-task-efficiency-by-project.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { ProjectService } from '../../project/project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';
import * as ExcelJS from 'exceljs';

interface ExtendedColumnDef extends ColumnDef {
  cellTooltip?: (row: any) => string;
}

@Component({
  selector: 'app-project-task-efficiency-by-project',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSelectModule,
    NzFormModule, NzSpinModule,
    CustomTable, Menubar, ContextMenuModule
  ],
  templateUrl: './project-task-efficiency-by-project.component.html',
  styleUrls: ['./project-task-efficiency-by-project.component.css']
})
export class ProjectTaskEfficiencyByProjectComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('stickyScrollbar') stickyScrollbarRef!: ElementRef<HTMLDivElement>;
  @ViewChild('stickyScrollbarInner') stickyScrollbarInnerRef!: ElementRef<HTMLDivElement>;
  private tableScrollEl: HTMLElement | null = null;
  private syncingScroll = false;
  private resizeObserver: ResizeObserver | null = null;

  menuItems: MenuItem[] = [];
  isLoading = false;
  tableData: any[] = [];
  selectedRow: any = null;

  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  departmentId: number = 0;
  teamId: number = 0;
  employeeId: number = 0;
  projectId: number = 0;
  selectedStatuses: number[] = [0, 1, 2];

  departmentList: any[] = [];
  teamList: any[] = [];
  employeeList: any[] = [];
  projectList: any[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Pending', value: 3 },
    { label: 'Hủy', value: 4 }
  ];

  contextMenuItems: MenuItem[] = [];
  @ViewChild('cm') cm!: any;

  // ═══ Columns ═══
  // Chỉ FinalKPIScore và RatingLabel có màu. Các cột khác chỉ có tooltip = giá trị hiển thị.
  columns: ExtendedColumnDef[] = [
    { field: 'STT', header: 'STT', width: '55px', sortable: false, cssClass: 'text-center', frozen: true },
    {
      field: 'EmployeeFullName', header: 'Employee', width: '180px', sortable: true, frozen: true,
      cellTooltip: (row) => row.EmployeeFullName || ''
    },
    {
      field: 'ProjectDisplay', header: 'Project', width: '200px', sortable: true, frozen: true,
      cellTooltip: (row) => row.ProjectName || ''
    },
    {
      field: 'TaskCount', header: 'Task Count', width: '85px', sortable: true, cssClass: 'text-center',
      cellTooltip: (row) => row.TaskCount != null ? String(row.TaskCount) : ''
    },
    {
      field: 'DoneTasks', header: 'Done Tasks', width: '90px', sortable: true, cssClass: 'text-center',
      cellTooltip: (row) => row.DoneTasks != null ? String(row.DoneTasks) : ''
    },
    {
      field: 'TotalEstimate', header: 'Total Estimate', width: '120px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : '',
      cellTooltip: (row) => row.TotalEstimate != null ? Number(row.TotalEstimate).toFixed(1) : ''
    },
    {
      field: 'TotalActual', header: 'Total Actual', width: '110px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : '',
      cellTooltip: (row) => row.TotalActual != null ? Number(row.TotalActual).toFixed(1) : ''
    },
    {
      field: 'TotalOT', header: 'Total OT', width: '90px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : '',
      cellTooltip: (row) => row.TotalOT != null ? Number(row.TotalOT).toFixed(1) : ''
    },
    {
      field: 'Efficiency', header: 'Efficiency', width: '110px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.Efficiency != null ? Number(row.Efficiency).toFixed(1) + '%' : ''
    },
    {
      field: 'AdjustedEfficiency', header: 'Adjusted Efficiency', width: '145px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.AdjustedEfficiency != null ? Number(row.AdjustedEfficiency).toFixed(1) + '%' : ''
    },
    {
      field: 'DeadlineRate', header: 'Deadline Rate', width: '115px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.DeadlineRate != null ? Number(row.DeadlineRate).toFixed(1) + '%' : ''
    },
    {
      field: 'OTRatio', header: 'OT Ratio', width: '90px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.OTRatio != null ? Number(row.OTRatio).toFixed(1) + '%' : ''
    },
    {
      field: 'AverageEfficiency', header: 'Average Efficiency', width: '145px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.AverageEfficiency != null ? Number(row.AverageEfficiency).toFixed(1) + '%' : ''
    },
    {
      field: 'StdDevEfficiency', header: 'StdDev Efficiency', width: '140px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.StdDevEfficiency != null ? Number(row.StdDevEfficiency).toFixed(1) + '%' : ''
    },
    {
      field: 'StabilityCV', header: 'Stability CV', width: '110px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.StabilityCV != null ? Number(row.StabilityCV).toFixed(1) + '%' : ''
    },
    {
      field: 'StabilityScore', header: 'Stability Score', width: '125px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.StabilityScore != null ? Number(row.StabilityScore).toFixed(1) + '%' : ''
    },
    {
      field: 'OTScore', header: 'OT Score', width: '90px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellTooltip: (row) => row.OTScore != null ? Number(row.OTScore).toFixed(1) + '%' : ''
    },
    {
      field: 'FinalKPIScore', header: 'Final KPI Score', width: '125px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) + '%' : '',
      cellStyle: (row) => {
        if (row.FinalKPIScore == null) return null;
        const g = this.getKPIGrade(row.FinalKPIScore);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '700' };
      },
      cellTooltip: (row) => row.FinalKPIScore != null ? this.getKPIGrade(row.FinalKPIScore).label : ''
    },
    {
      field: 'RatingLabel', header: 'Xếp loại', width: '130px', sortable: true, cssClass: 'text-center',
      cellStyle: (row) => {
        if (row.FinalKPIScore == null) return null;
        const g = this.getKPIGrade(row.FinalKPIScore);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => row.FinalKPIScore != null ? this.getKPIGrade(row.FinalKPIScore).label : ''
    },
  ];

  constructor(
    private efficiencyService: ProjectTaskEfficiencyByProjectService,
    private workplanService: WorkplanService,
    private employeeService: EmployeeService,
    private projectService: ProjectService,
    private appUserService: AppUserService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    // Tooltip wrapper: chỉ xử lý cột có cellTooltip
    this.columns.forEach(col => {
      const tooltipFn = (col as ExtendedColumnDef).cellTooltip;
      if (tooltipFn) {
        const origFormat = col.format;
        col.format = (val, row) => {
          const display = origFormat ? origFormat(val, row) : (val != null ? String(val) : '');
          const tip = tooltipFn(row);
          if (tip && tip.trim()) {
            return `<span title="${tip.replace(/"/g, '&quot;')}" style="display:block;width:100%;height:100%;">${display}</span>`;
          }
          return display;
        };
      }
    });

    this.departmentId = this.appUserService.departmentID || 0;
    this.loadDepartments();
    this.loadEmployees();
    this.loadProjects();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.initMenu();
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initStickyScrollbar(), 500);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private initStickyScrollbar(): void {
    const host = (this.stickyScrollbarRef?.nativeElement as HTMLElement)?.closest('app-project-task-efficiency-by-project');
    if (!host) return;
    this.tableScrollEl = host.querySelector('.p-datatable-wrapper') as HTMLElement;
    if (!this.tableScrollEl) return;
    this.syncScrollbarWidth();
    this.tableScrollEl.addEventListener('scroll', () => {
      if (this.syncingScroll) return;
      this.syncingScroll = true;
      const bar = this.stickyScrollbarRef?.nativeElement;
      if (bar) bar.scrollLeft = this.tableScrollEl!.scrollLeft;
      this.syncingScroll = false;
    });
    this.resizeObserver = new ResizeObserver(() => this.syncScrollbarWidth());
    this.resizeObserver.observe(this.tableScrollEl);
  }

  private syncScrollbarWidth(): void {
    if (!this.tableScrollEl || !this.stickyScrollbarInnerRef) return;
    this.stickyScrollbarInnerRef.nativeElement.style.width = this.tableScrollEl.scrollWidth + 'px';
  }

  onStickyScroll(_event: Event): void {
    if (this.syncingScroll) return;
    this.syncingScroll = true;
    const bar = this.stickyScrollbarRef?.nativeElement;
    if (bar && this.tableScrollEl) {
      this.tableScrollEl.scrollLeft = bar.scrollLeft;
    }
    this.syncingScroll = false;
  }

  onCellContextMenu(event: any): void {
    if (!event || !event.col) return;
    const col = event.col;
    const rowData = event.rowData;
    const rawValue = rowData[col.field];
    let textToCopy = col.format ? col.format(rawValue, rowData) : rawValue;
    if (typeof textToCopy === 'string') {
      textToCopy = textToCopy.replace(/<[^>]*>?/gm, '');
    }
    if (textToCopy != null && String(textToCopy).trim()) {
      this.contextMenuItems = [{
        label: 'Copy nội dung',
        icon: 'pi pi-copy',
        command: () => {
          navigator.clipboard.writeText(String(textToCopy)).then(() => {
            this.notification.success('Thành công', 'Đã copy vào bộ nhớ đệm', { nzDuration: 2000 });
          });
        }
      }];
      this.cm.show(event.event || event);
    }
  }

  // ═══ Grade helpers ═══

  getKPIGrade(score: number): { label: string; color: string; bgColor: string } {
    if (score >= 95) return { label: 'Xuất sắc', color: '#389e0d', bgColor: '#f6ffed' };
    if (score >= 85) return { label: 'Rất tốt', color: '#389e0d', bgColor: '#d9f7be' };
    if (score >= 75) return { label: 'Tốt', color: '#096dd9', bgColor: '#e6f7ff' };
    if (score >= 65) return { label: 'Đạt yêu cầu', color: '#d48806', bgColor: '#fffbe6' };
    if (score >= 50) return { label: 'Cần cải thiện', color: '#d46b08', bgColor: '#fff7e6' };
    return { label: 'Hiệu suất thấp', color: '#cf1322', bgColor: '#fff1f0' };
  }

  // ═══ Data ═══

  loadData(): void {
    this.isLoading = true;
    const params = {
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      departmentID: this.departmentId,
      teamID: this.teamId,
      employeeID: this.employeeId,
      projectID: this.projectId,
      status: this.selectedStatuses.length > 0 ? this.selectedStatuses.join(',') : '0,1,2'
    };

    this.efficiencyService.getEfficiencyByProject(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        // Sort by EmployeeFullName
        let data = res || [];
        data.sort((a: any, b: any) => (a.EmployeeFullName || '').localeCompare(b.EmployeeFullName || ''));

        this.tableData = data.map((item: any, i: number) => {
          const rating = this.getKPIGrade(item.FinalKPIScore);
          return {
            ...item,
            STT: i + 1,
            ProjectDisplay: (item.ProjectCode || '') + (item.ProjectStatusName ? ` (${item.ProjectStatusName})` : ''),
            RatingLabel: rating.label
          };
        });
        this.selectedRow = null;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải dữ liệu hiệu suất');
        console.error(err);
      }
    });
  }

  // ═══ Menu ═══

  initMenu(): void {
    this.menuItems = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExport()
      }
    ];
  }

  // ═══ Dropdowns ═══

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) this.departmentList = Array.isArray(res.data) ? res.data : [];
      }
    });
  }

  loadTeamsByDepartment(deptId: number): void {
    this.workplanService.getTeamByDepartmentId(deptId).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) {
          this.teamList = (Array.isArray(res.data) ? res.data : []).filter((x: any) => !x.IsDeleted);
        } else { this.teamList = []; }
      },
      error: () => { this.teamList = []; }
    });
  }

  loadEmployees(): void {
    this.employeeService.filterEmployee(0, this.departmentId, '').subscribe({
      next: (res: any) => {
        if (res?.data) this.employeeList = Array.isArray(res.data) ? res.data : [];
        else this.employeeList = [];
      },
      error: () => { this.employeeList = []; }
    });
  }

  loadEmployeesByTeam(teamId: number): void {
    this.projectService.getEmployeeByUserTeam(teamId).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) this.employeeList = Array.isArray(res.data) ? res.data : [];
        else this.employeeList = [];
      },
      error: () => { this.employeeList = []; }
    });
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) this.projectList = Array.isArray(res.data) ? res.data : [];
      }
    });
  }

  // ═══ Filter events ═══

  onDepartmentChange(): void {
    this.teamId = 0; this.employeeId = 0; this.teamList = [];
    this.loadEmployees();
    if (this.departmentId > 0) this.loadTeamsByDepartment(this.departmentId);
    this.loadData();
  }

  onTeamChange(): void {
    this.employeeId = 0;
    if (this.teamId > 0) this.loadEmployeesByTeam(this.teamId);
    else this.loadEmployees();
    this.loadData();
  }

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0; this.employeeId = 0; this.projectId = 0;
    this.selectedStatuses = [0, 1, 2];
    this.teamList = []; this.employeeList = [];
    this.loadEmployees();
    if (this.departmentId > 0) this.loadTeamsByDepartment(this.departmentId);
    this.loadData();
  }

  getTotalRows(): number {
    return this.tableData?.length || 0;
  }

  // ═══ Date helpers ═══

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  // ═══ Export Excel ═══

  async onExport(): Promise<void> {
    if (!this.tableData?.length) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Hiệu suất theo Dự án');
    const visibleCols = this.columns.filter(c => c.field);
    ws.addRow(visibleCols.map(c => c.header));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E4FA' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 22;

    this.tableData.forEach((row, i) => {
      // Đảm bảo STT có giá trị cho dòng hiện tại nếu chưa được gán
      if (!row.STT) row.STT = i + 1;
      
      const rowData = visibleCols.map(col => {
        let value = row[col.field];
        if (col.format) {
          const formatted = col.format(value, row);
          value = typeof formatted === 'string' ? formatted.replace(/<[^>]*>?/gm, '') : formatted;
        }
        return value;
      });
      ws.addRow(rowData);
    });

    ws.columns.forEach((column: any, index: number) => {
      let maxLength = 10;
      const colDef = visibleCols[index];
      const isCenter = colDef?.cssClass?.includes('text-center');
      const isRight = colDef?.cssClass?.includes('text-right');
      const hAlign = isCenter ? 'center' : (isRight ? 'right' : 'left');

      column.eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        
        if (rowNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: hAlign, wrapText: true };
        }
      });
      column.width = Math.min(maxLength, 30);
    });

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: visibleCols.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HieuSuatTheoDuAn_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
