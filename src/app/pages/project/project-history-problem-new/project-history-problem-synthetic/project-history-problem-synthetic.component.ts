import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { ProjectHistoryProblemNewService } from '../project-history-problem-service/project-history-problem-new.service';
import { AppUserService } from '../../../../services/app-user.service';

// PrimeNG & Custom items
import { SharedModule, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { CustomTable } from '../../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../../shared/custom-table/column-def.model';

@Component({
  selector: 'app-project-history-problem-synthetic',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzSpinModule,
    NzTableModule,
    Menubar,
    SharedModule,
    CustomTable
  ],
  templateUrl: './project-history-problem-synthetic.component.html',
  styleUrl: './project-history-problem-synthetic.component.css'
})
export class ProjectHistoryProblemSyntheticComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CustomTable) customTable!: CustomTable;

  // Bộ lọc tìm kiếm
  dateStart: string = DateTime.local()
    .minus({ months: 1 })
    .startOf('month')
    .toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local()
    .endOf('month')
    .toFormat('yyyy-MM-dd');
  selectedEmployeeId: number | null = null;
  keyword: string = '';

  // Dữ liệu bảng
  dataHistory: any[] = [];
  allDataHistory: any[] = [];
  isLoadHistory: boolean = false;
  selectedHistoryRows: any[] = [];

  // Danh sách dropdown
  employeeOptions: { label: string; value: number }[] = [];
  projectOptions: { label: string; value: number }[] = [];
  selectedProjectId: number | null = null;

  // Định nghĩa bảng và menubar
  columns: ColumnDef[] = [];
  menuBars: MenuItem[] = [];

  constructor(
    private notification: NzNotificationService,
    private projectHistoryProblemNewService: ProjectHistoryProblemNewService,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initMenuBar();
    this.initColumns();
    this.loadEmployees();
    this.loadProjects();
    this.loadData();
  }

  ngAfterViewInit(): void {
    if (this.customTable && this.customTable.dt) {
      this.customTable.dt.onFilter.subscribe(() => {
        this.updateFooter();
      });
    }
  }

  ngOnDestroy(): void {}

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel()
      }
    ];
  }

  initColumns(): void {
    this.columns = [
      { field: 'STT', header: 'STT', width: '50px', editable: false, cssClass: 'text-center', frozen: true, footer: 'Tổng:' },
      { field: 'IsApproved_PM', header: 'PM duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '', frozen: true, footer: '0' },
      { field: 'IsApproved_PP', header: 'PP duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '', frozen: true },
      { field: 'IsApproved_TP', header: 'TP duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '', frozen: true },
      { field: 'PMName', header: 'PM', width: '180px', editable: false, filterMode: 'multiselect' },
      { field: 'DateProblem', header: 'Thời điểm phát sinh', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v instanceof Date ? DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') : (v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : ''), filterType: 'date', filterMode: 'datetime' },
      { field: 'CreatorName', header: 'Người phát hiện', width: '180px', editable: false, filterMode: 'multiselect' },
      { field: 'ErrorLocation', header: 'Vị trí lỗi', width: '200px', editable: false, textWrap: true },
      { field: 'ContentError', header: 'Nội dung sự cố', width: '300px', editable: false, textWrap: true },
      { field: 'Reason', header: 'Nguyên nhân', width: '300px', editable: false, textWrap: true },
      { field: 'Impact', header: 'Ảnh hưởng', width: '150px', editable: false, textWrap: true },
      { field: 'PriorityName', header: 'Mức độ nghiêm trọng', width: '100px', editable: false, filterMode: 'multiselect' },
      { field: 'Remedies', header: 'Phương án xử lý', width: '300px', editable: false, textWrap: true },
      { field: 'DateImplementation', header: 'Thời hạn xử lý', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v instanceof Date ? DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') : (v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : ''), filterType: 'date', filterMode: 'datetime' },
      { field: 'PerformerName', header: 'Người chịu trách nhiệm xử lý', width: '180px', editable: false, filterMode: 'multiselect' },
      { field: 'IssueConclusion', header: 'Kết quả sau xử lý', width: '300px', editable: false, textWrap: true },
      { field: 'StatusName', header: 'Trạng thái xử lý', width: '100px', editable: false, filterMode: 'multiselect' },
      { field: 'IssueLogTypeName', header: 'Lý do lỗi', width: '100px', editable: false, filterMode: 'multiselect' },
      { field: 'Note', header: 'Ghi chú', width: '300px', editable: false, textWrap: true }
    ];
  }

  loadEmployees(): void {
    this.projectHistoryProblemNewService.getEmployees().subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data) {
          this.employeeOptions = res.data.map((x: any) => ({
            label: `${x.Code} - ${x.FullName}`,
            value: x.ID
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', err);
      }
    });
  }

  loadProjects(): void {
    this.projectHistoryProblemNewService.getProjects().subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data) {
          this.projectOptions = res.data.map((x: any) => ({
            label: `${x.ProjectCode} - ${x.ProjectName}`,
            value: x.ID
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách dự án:', err);
      }
    });
  }

  loadData(): void {
    this.isLoadHistory = true;
    this.projectHistoryProblemNewService.getDataHistoryProblemSynthetic(
      this.dateStart || undefined,
      this.dateEnd || undefined,
      this.selectedProjectId || undefined,
      this.selectedEmployeeId || undefined,
      this.keyword || undefined
    ).subscribe({
      next: (response: any) => {
        this.isLoadHistory = false;
        if (response.status === 1) {
          const dtMaster = response.data;
          if (Array.isArray(dtMaster)) {
            this.allDataHistory = dtMaster.map((item: any) => this.mapMasterDataToTable(item));
          } else {
            this.allDataHistory = [];
          }
          this.applyFilters();
          this.updateFooter();
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu phát sinh!');
          this.allDataHistory = [];
          this.dataHistory = [];
          this.updateFooter();
        }
      },
      error: (error: any) => {
        this.isLoadHistory = false;
        console.error('Error loading history problem:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu phát sinh!');
        this.allDataHistory = [];
        this.dataHistory = [];
        this.updateFooter();
      }
    });
  }

  mapMasterDataToTable(item: any): any {
    return {
      ID: item.ID || 0,
      STT: item.STT || 1,
      IssueLogType: parseInt(item.IssueLogType, 10) || null,
      ContentError: item.ContentError || '',
      Reason: item.Reason || '',
      Remedies: item.Remedies || '',
      IssueConclusion: item.IssueConclusion || '',
      Image: item.Image || '',
      DateProblem: item.DateProblem ? new Date(item.DateProblem) : null,
      DateImplementation: item.DateImplementation ? new Date(item.DateImplementation) : null,
      PIC: item.PIC || '',
      ProjectID: item.ProjectID || 0,
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
      TeamDepartment: item.TeamDepartment || null,
      CreatorID: item.CreatorID || null,
      PerformerID: item.PerformerID || null,
      ReceiverID: item.ReceiverID || null,
      PriorityLevel: item.PriorityLevel || null,
      StatusProblem: item.StatusProblem || null,
      Impact: item.Impact || '',
      ErrorLocation: item.ErrorLocation || '',
      Note: item.Note || '',
      ProjectManagerID: item.ProjectManagerID || item.PMID || null,
      IssueLogTypeName: item.IssueLogTypeName || '',
      StatusName: item.StatusName || '',
      PriorityName: item.PriorityName || '',
      TeamDepartmentName: item.TeamDepartmentName || '',
      CreatorName: item.CreatorName || '',
      PMName: item.PMName || '',
      PerformerName: item.PerformerName || '',
      ReceiverName: item.ReceiverName || '',
      IsApproved_PM: item.IsApproved_PM || false,
      IsApproved_PP: item.IsApproved_PP || false,
      IsApproved_TP: item.IsApproved_TP || false,
      ProjectCode: item.ProjectCode || '',
      ProjectName: item.ProjectName || '',
      ProjectGroupKey: (item.ProjectCode || item.ProjectName) ? `${item.ProjectCode || ''} - ${item.ProjectName || ''}` : 'Không xác định'
    };
  }

  applyFilters(): void {
    const sorted = [...this.allDataHistory];

    // Sắp xếp theo nhóm dự án để hiển thị group row chính xác
    sorted.sort((a, b) => {
      const valA = a.ProjectGroupKey || '';
      const valB = b.ProjectGroupKey || '';
      return valA.localeCompare(valB);
    });

    // Cập nhật lại STT theo từng nhóm dự án sau khi sắp xếp
    let index = 1;
    let currentGroup = '';
    sorted.forEach(row => {
      const groupKey = row.ProjectGroupKey || '';
      if (groupKey !== currentGroup) {
        currentGroup = groupKey;
        index = 1;
      }
      row.STT = index++;
    });

    this.dataHistory = sorted;
  }

  updateFooter(): void {
    const count = this.customTable?.dt?.filteredValue 
      ? this.customTable.dt.filteredValue.length 
      : this.dataHistory.length;
    
    const pmCol = this.columns.find(c => c.field === 'IsApproved_PM');
    if (pmCol) {
      pmCol.footer = String(count);
    }
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.dateStart = DateTime.local()
      .minus({ months: 1 })
      .startOf('month')
      .toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local()
      .endOf('month')
      .toFormat('yyyy-MM-dd');
    this.selectedEmployeeId = null;
    this.selectedProjectId = null;
    this.keyword = '';
    this.loadData();
  }

  exportExcel(): void {
    const exportData = (this.customTable?.dt?.filteredValue || this.dataHistory) as any[];
    if (!exportData || exportData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const wsHistory = workbook.addWorksheet('Tổng hợp phát sinh');

    const historyColumns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã dự án', key: 'ProjectCode', width: 20 },
      { header: 'Tên dự án', key: 'ProjectName', width: 40 },
      { header: 'PM', key: 'ProjectManagerID', width: 30 },
      { header: 'Thời điểm phát sinh', key: 'DateProblem', width: 15 },
      { header: 'Người tạo', key: 'CreatorID', width: 30 },
      { header: 'Vị trí lỗi', key: 'ErrorLocation', width: 20 },
      { header: 'Nội dung sự cố', key: 'ContentError', width: 40 },
      { header: 'Nguyên nhân', key: 'Reason', width: 40 },
      { header: 'Ảnh hưởng', key: 'Impact', width: 40 },
      { header: 'Mức độ nghiêm trọng', key: 'PriorityLevel', width: 20 },
      { header: 'Phương án xử lý', key: 'Remedies', width: 40 },
      { header: 'Thời hạn xử lý', key: 'DateImplementation', width: 15 },
      { header: 'Người chịu trách nhiệm xử lý', key: 'PerformerID', width: 30 },
      { header: 'Kết quả sau xử lý', key: 'IssueConclusion', width: 40 },
      { header: 'Trạng thái xử lý', key: 'StatusProblem', width: 20 },
      { header: 'Lý do lỗi', key: 'IssueLogType', width: 20 },
      { header: 'Ghi chú', key: 'Note', width: 40 }
    ];

    wsHistory.columns = historyColumns;

    // Header style
    wsHistory.getRow(1).font = { bold: true, color: { argb: '000000' } };
    wsHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CFE2F3' } };
    wsHistory.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Grouping & Data
    let currentGroup = '';
    let sttIndex = 1;

    exportData.forEach((row: any) => {
      const groupKey = row.ProjectGroupKey || 'Không xác định';
      if (groupKey !== currentGroup) {
        currentGroup = groupKey;
        // Chèn dòng group header
        const groupRow = wsHistory.addRow({
          STT: groupKey
        });
        groupRow.font = { bold: true };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
        wsHistory.mergeCells(groupRow.number, 1, groupRow.number, 18);
        sttIndex = 1;
      }

      const wsRow = wsHistory.addRow({
        STT: sttIndex++,
        ProjectCode: row.ProjectCode || '',
        ProjectName: row.ProjectName || '',
        IssueLogType: row.IssueLogTypeName || '',
        StatusProblem: row.StatusName || '',
        PriorityLevel: row.PriorityName || '',
        ContentError: row.ContentError || '',
        Reason: row.Reason || '',
        Remedies: row.Remedies || '',
        IssueConclusion: row.IssueConclusion || '',
        CreatorID: row.CreatorName || '',
        PerformerID: row.PerformerName || '',
        DateProblem: row.DateProblem ? this.formatDateForExcel(row.DateProblem) : '',
        DateImplementation: row.DateImplementation ? this.formatDateForExcel(row.DateImplementation) : '',
        Note: row.Note || '',
        Impact: row.Impact || '',
        ErrorLocation: row.ErrorLocation || '',
        ProjectManagerID: row.PMName || ''
      });

      if (row.DateProblem) {
        wsRow.getCell('DateProblem').numFmt = 'dd/mm/yyyy';
      }
      if (row.DateImplementation) {
        wsRow.getCell('DateImplementation').numFmt = 'dd/mm/yyyy';
      }
    });

    // Thêm dòng Footer
    const footerRow = wsHistory.addRow({
      STT: 'Tổng:',
      ProjectCode: exportData.length
    });
    footerRow.font = { bold: true };
    footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8E8E8' } };

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `TongHopPhatSinh_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.notification.success('Thành công', 'Xuất Excel thành công!');
    }).catch(error => {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel!');
    });
  }

  formatDateForExcel(date: string | Date): Date | null {
    if (!date) return null;
    try {
      const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date as Date);
      if (dt.isValid) {
        return dt.toJSDate();
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    return null;
  }
}
