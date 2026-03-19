import { Component, OnInit, AfterViewInit, Input, OnDestroy, ViewChild } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectChangeComponent } from '../project/project-change/project-change.component';
import { EmployeeService } from '../hrm/employee/employee-service/employee.service';

@Component({
  selector: 'app-project-report-slick-grid',
  templateUrl: './project-report-slick-grid.component.html',
  styleUrl: './project-report-slick-grid.component.css',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzModalModule,
    NzFormModule,
    CommonModule,
    TableModule,
    MultiSelectModule,
    InputTextModule,
  ],
})
export class ProjectReportSlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() projectId: number = 0;
  @Input() teamId: number = 0;

  @ViewChild('dt') dt!: Table;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) { }

  // Table data
  dataset: any[] = [];
  isLoading = false;
  selectedRows: any[] = [];

  // Filter options cho multiselect
  employeeCodeOptions: any[] = [];
  fullNameOptions: any[] = [];
  departmentNameOptions: any[] = [];
  teamNameOptions: any[] = [];

  // Data variables
  dataProject: any[] = [];
  projects: any[] = [];
  teams: any[] = [];
  keyword: string = '';
  totalTime: number = 0;
  projectCode: string = '';

  // Column definitions cho PrimeNG
  columns: any[] = [];
  frozenCols: any[] = [];
  scrollableCols: any[] = [];

  // Biến lưu tổng từ tất cả dữ liệu
  totalAllData: {
    count: number;
    sumTimeReality: number;
    sumTotalHours: number;
    totalDays: number;
  } = {
      count: 0,
      sumTimeReality: 0,
      sumTotalHours: 0,
      totalDays: 0,
    };

  ngOnInit() {
    this.initColumns();
    this.getProject();
    this.getTeam();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadData();
    }, 100);
  }

  ngOnDestroy() { }

  //#region Column Initialization
  initColumns() {
    this.frozenCols = [
      { field: 'EmployeeCode', header: 'Mã nhân viên', width: '100px', type: 'multiselect', align: 'center' },
      { field: 'FullName', header: 'Họ tên', width: '150px', type: 'multiselect', align: 'left' },
      { field: 'DepartmentName', header: 'Phòng ban', width: '120px', type: 'multiselect', align: 'left' },
      { field: 'TeamName', header: 'Team', width: '100px', type: 'multiselect', align: 'left' },
      { field: 'DateReport', header: 'Ngày', width: '100px', type: 'date', align: 'center' },
    ];

    this.scrollableCols = [
      { field: 'Content', header: 'Nội dung', width: '350px', type: 'text', align: 'left', wrap: true },
      { field: 'TimeReality', header: 'Số giờ', width: '80px', type: 'number', align: 'right' },
      { field: 'Ratio', header: 'Hệ số', width: '70px', type: 'numberDefault', align: 'right' },
      { field: 'TotalHours', header: 'Tổng số giờ', width: '100px', type: 'numberDefault', align: 'right' },
      { field: 'Results', header: 'Kết quả', width: '300px', type: 'text', align: 'left', wrap: true },
      { field: 'Problem', header: 'Vấn đề phát sinh', width: '200px', type: 'text', align: 'left', wrap: true },
      { field: 'ProblemSolve', header: 'Giải pháp', width: '200px', type: 'text', align: 'left', wrap: true },
      { field: 'Backlog', header: 'Tồn đọng', width: '200px', type: 'text', align: 'left', wrap: true },
      { field: 'PlanNextDay', header: 'Kế hoạch ngày tiếp theo', width: '250px', type: 'text', align: 'left', wrap: true },
      { field: 'Note', header: 'Ghi chú', width: '200px', type: 'text', align: 'left', wrap: true },
    ];

    this.columns = [...this.frozenCols, ...this.scrollableCols];
  }
  //#endregion

  //#region Formatters (as helper methods)
  formatDate(value: any): string {
    if (!value) return '';
    const dateTime = DateTime.fromISO(value);
    return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  }

  formatNumberDefault(value: any): string {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  linkifyText(text: string): string {
    if (!text || (typeof text === 'string' && text.trim() === '')) return '';
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    urlPattern.lastIndex = 0;

    while ((match = urlPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }
      let url = match[0];
      let href = url;
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }
      parts.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="cell-link">${escapeHtml(url)}</a>`);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }

    return parts.join('');
  }

  getCellValue(row: any, col: any): string {
    const value = row[col.field];
    switch (col.type) {
      case 'date':
        return this.formatDate(value);
      case 'number':
        return this.formatNumber(value);
      case 'numberDefault':
        return this.formatNumberDefault(value);
      default:
        return value != null ? String(value) : '';
    }
  }

  getCellHtml(row: any, col: any): string {
    const value = row[col.field];
    if (col.wrap && value) {
      return this.linkifyText(String(value));
    }
    return this.getCellValue(row, col);
  }
  //#endregion

  //#region Filter Options
  buildFilterOptions() {
    this.employeeCodeOptions = this.getUniqueOptions(this.dataset, 'EmployeeCode');
    this.fullNameOptions = this.getUniqueOptions(this.dataset, 'FullName');
    this.departmentNameOptions = this.getUniqueOptions(this.dataset, 'DepartmentName');
    this.teamNameOptions = this.getUniqueOptions(this.dataset, 'TeamName');
  }

  getFilterOptions(field: string): any[] {
    switch (field) {
      case 'EmployeeCode': return this.employeeCodeOptions;
      case 'FullName': return this.fullNameOptions;
      case 'DepartmentName': return this.departmentNameOptions;
      case 'TeamName': return this.teamNameOptions;
      default: return [];
    }
  }

  private getUniqueOptions(data: any[], field: string): any[] {
    const map = new Map<string, string>();
    data.forEach((row: any) => {
      const value = row?.[field];
      if (value !== null && value !== undefined && value !== '') {
        const key = String(value);
        if (!map.has(key)) {
          map.set(key, key);
        }
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  //#endregion

  //#region Table Events
  onTableFilter(event: any) {
    // Recalculate totals based on filtered data
    if (this.dt) {
      const filteredData = this.dt.filteredValue || this.dataset;
      this.calculateTotals(filteredData);
    }
  }
  //#endregion

  //#region Data Loading
  loadData() {
    this.isLoading = true;
    this.projectService.getProjectListWorkReport(
      this.projectId || 0,
      this.keyword || '',
      1,
      999999, // Lấy tất cả dữ liệu
      this.teamId || 0,
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data.dt && Array.isArray(response.data.dt)) {
            data = response.data.dt;
          }

          // Map data với id
          this.dataset = data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
          }));

          // Build filter options
          this.buildFilterOptions();

          // Tính tổng
          this.calculateTotals(this.dataset);
        } else {
          this.dataset = [];
          this.resetTotals();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
        this.notification.error('Lỗi', error?.message || error?.error?.message || 'Không thể tải dữ liệu danh sách báo cáo công việc!');
        this.dataset = [];
        this.resetTotals();
      },
    });
  }

  calculateTotals(data: any[]) {
    this.totalAllData = {
      count: data.length,
      sumTimeReality: data.reduce((sum: number, row: any) => {
        const value = parseFloat(row.TimeReality) || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0),
      sumTotalHours: data.reduce((sum: number, row: any) => {
        const value = parseFloat(row.TotalHours) || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0),
      totalDays: 0,
    };
    this.totalAllData.totalDays = this.totalAllData.sumTotalHours / 8.0;
    this.totalTime = this.totalAllData.totalDays;
  }

  resetTotals() {
    this.totalAllData = {
      count: 0,
      sumTimeReality: 0,
      sumTotalHours: 0,
      totalDays: 0,
    };
    this.totalTime = 0;
  }

  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          this.projects = response.data;
          if (this.projectId > 0) {
            this.updateProjectCode();
          }
        }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }
  //#endregion


  //#region Search & Actions
  onProjectChange() {
    this.updateProjectCode();
    this.onSearch();
  }

  onTeamChange() {
    this.onSearch();
  }

  getTeam() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.teams = response.data;
        }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách team!');
      },
    });
  }

  updateProjectCode() {
    if (this.projectId > 0) {
      const selectedProject = this.projects.find((p) => p.ID === this.projectId);
      this.projectCode = selectedProject ? selectedProject.ProjectCode : '';
    } else {
      this.projectCode = '';
    }
  }

  onSearch() {
    this.loadData();
  }

  setDefaultSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.projectCode = '';
    this.loadData();
  }

  onClose() {
    this.activeModal.close(true);
  }

  changeProject() {
    if (this.projectId <= 0) {
      this.notification.error('', 'Vui lòng chọn dự án!');
      return;
    }

    // Lấy selected rows từ PrimeNG selection
    let selectedIDs: number[] = [];
    if (this.selectedRows && this.selectedRows.length > 0) {
      selectedIDs = this.selectedRows
        .map((row: any) => row.ID)
        .filter((id: number) => id !== undefined);
    }

    if (selectedIDs.length <= 0) {
      this.notification.error('', 'Vui lòng chọn báo cáo cần chuyển dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectIdOld = this.projectId;
    modalRef.componentInstance.reportIds = selectedIDs;
    modalRef.componentInstance.disable = true;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadData();
      }
    });
  }
  //#endregion

  //#region Export Excel
  async exportExcel() {
    // Lấy dữ liệu đã lọc từ PrimeNG Table
    const exportData: any[] = this.dt?.filteredValue || this.dataset;

    if (!exportData || exportData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo cáo công việc');

      // Headers
      const headers = this.columns.map((col) => col.header);
      worksheet.addRow(headers);

      // Data rows - dùng dữ liệu đã lọc
      exportData.forEach((row: any) => {
        const rowData = this.columns.map((col) => {
          const field = col.field as string;
          let value = row[field];

          // Format date
          if (field === 'DateReport' && value) {
            const dateTime = DateTime.fromISO(value);
            if (dateTime.isValid) {
              value = dateTime.toFormat('dd/MM/yyyy');
            }
          }

          return value;
        });
        worksheet.addRow(rowData);
      });

      // Bottom row với tổng (đã tính theo filter)
      const bottomRow: any[] = this.columns.map((col) => {
        const field = col.field as string;
        if (field === 'Content') {
          return `Số báo cáo = ${this.totalAllData.count}`;
        } else if (field === 'TimeReality') {
          return this.totalAllData.sumTimeReality.toFixed(2);
        } else if (field === 'TotalHours') {
          return this.totalAllData.sumTotalHours.toFixed(2);
        } else if (field === 'Results') {
          return `Tổng số ngày = ${this.totalAllData.totalDays.toFixed(1)}`;
        }
        return '';
      });

      const excelBottomRow = worksheet.addRow(bottomRow);
      excelBottomRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        cell.alignment = {
          wrapText: true,
          vertical: 'middle',
          horizontal: 'left',
        };
      });

      // Auto width
      worksheet.columns.forEach((column: any) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, Math.min(cellValue.length + 2, 50));
        });
        column.width = maxLength;
      });

      // Fixed width cho các cột dài
      const fixedWidths: { [field: string]: number } = {
        Content: 50,
        Results: 50,
        Note: 50,
        Backlog: 40,
        Problem: 40,
        ProblemSolve: 40,
        PlanNextDay: 40,
      };

      this.columns.forEach((col, index) => {
        const field = col.field as string;
        if (fixedWidths[field]) {
          const excelCol = worksheet.getColumn(index + 1);
          excelCol.width = fixedWidths[field];
          excelCol.alignment = {
            wrapText: true,
            vertical: 'top',
          };
        }
      });

      // Wrap all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = {
            ...(cell.alignment || {}),
            wrapText: true,
            vertical: 'middle',
          };
        });
      });

      // Auto filter
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: this.columns.length },
      };

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const today = DateTime.now();
      const dateStr = today.toFormat('ddMMyyyy');
      const projectCodeStr = this.projectCode || 'ALL';
      const fileName = `${projectCodeStr}_${dateStr}.xlsx`;

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success('Thông báo', `Đã xuất Excel thành công với ${exportData.length} bản ghi!`);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel! ' + (error?.message || ''));
    }
  }
  //#endregion
}
