import { Component, HostListener, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { ProjectHistoryProblemNewService } from './project-history-problem-service/project-history-problem-new.service';

import { ProjectService } from '../project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';

// PrimeNG & Custom items
import { SharedModule, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { TabsModule } from 'primeng/tabs';
import { CustomTable } from '../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../shared/custom-table/column-def.model';
import { ProjectHistoryProblemDetailComponent } from './project-history-problem-detail/project-history-problem-detail.component';

@Component({
  selector: 'app-project-history-problem-new',
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
    TabsModule,
    SharedModule,
    CustomTable
  ],
  templateUrl: './project-history-problem-new.component.html',
  styleUrl: './project-history-problem-new.component.css'
})
export class ProjectHistoryProblemNewComponent implements OnInit {
  @Input() projectId: number = 0;
  @Input() projectCode: string = '';

  // Bảng 1: Lịch sử phát sinh
  dataHistory: any[] = [];
  nextRowIdHistory: number = 0;
  deletedIdsHistory: number[] = [];
  isLoadHistory: boolean = false;
  selectedHistoryRows: any[] = []; // Các row được chọn từ bảng 1

  columns: ColumnDef[] = [];
  menuBars: MenuItem[] = [];

  // Dropdown data
  projectInfo: any = null;

  // Preview state
  previewRow: any = null;
  previewImages: any[] = [];
  selectedPreviewImage: any = null;

  // Context menu state
  contextMenuVisible: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  contextMenuImage: any = null;

  // Linked data preview
  activeLinkTab: string = '0';
  linkedProjectItems: any[] = [];
  linkedWorkerVersions: any[] = [];
  linkedPartListVersions: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private modal: NzModalService,
    private modalService: NgbModal,
    @Optional() private activeModal: NgbActiveModal | null,
    private projectHistoryProblemNewService: ProjectHistoryProblemNewService,
    private projectService: ProjectService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.loadProjectInfo();
    this.initMenuBar();
    this.initColumns();
    this.loadData();
  }

  // Load thông tin project để lấy projectCode và CreatedDate
  get isModalMode(): boolean {
    return !!this.activeModal;
  }

  loadProjectInfo(): void {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          if (response.status === 1 && response.data) {
            this.projectInfo = response.data;
            this.projectCode = this.projectInfo.ProjectCode || this.projectCode;
          }
        },
        error: (error: any) => {
          console.error('Error loading project info:', error);
        }
      });
    }
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-primary',
        command: () => this.addHistoryRow(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-warning',
        command: () => this.editSelectedRow(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteSelectedRow(),
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => this.loadData(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel(),
      },
      {
        label: 'Duyệt',
        icon: 'fa-solid fa-check-double fa-lg text-primary',
        items: [
          {
            label: 'PM Duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approveSelectedRow('PM', true),
          },
          {
            label: 'PM Hủy Duyệt',
            icon: 'fa-solid fa-xmark text-danger',
            command: () => this.approveSelectedRow('PM', false),
          },
          { separator: true },
          {
            label: 'Phó Phòng Duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approveSelectedRow('PP', true),
          },
          {
            label: 'Phó Phòng Hủy Duyệt',
            icon: 'fa-solid fa-xmark text-danger',
            command: () => this.approveSelectedRow('PP', false),
          },
          { separator: true },
          {
            label: 'Trưởng Phòng Duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approveSelectedRow('TP', true),
          },
          {
            label: 'Trưởng Phòng Hủy Duyệt',
            icon: 'fa-solid fa-xmark text-danger',
            command: () => this.approveSelectedRow('TP', false),
          }
        ]
      }
    ];
  }

  initColumns(): void {
    this.columns = [
      { field: 'STT', header: 'STT', width: '50px', editable: false, cssClass: 'text-center' },
      { field: 'IsApproved_PM', header: 'PM duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '' },
      { field: 'IsApproved_PP', header: 'PP duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '' },
      { field: 'IsApproved_TP', header: 'TP duyệt', width: '90px', editable: false, cssClass: 'text-center', format: (v: any) => v === true || v === 1 ? '<i class="fa-solid fa-check fa-lg text-success"></i>' : '' },
      { field: 'DateProblem', header: 'Ngày phát sinh', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v instanceof Date ? DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') : (v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : '') },
      { field: 'DateImplementation', header: 'Ngày thực hiện', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v instanceof Date ? DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') : (v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : '') },
      { field: 'PerformerName', header: 'Người thực hiện', width: '180px', editable: false },
      { field: 'ReceiverName', header: 'Người tiếp nhận', width: '200px', editable: false, textWrap: true },
      { field: 'TeamDepartmentName', header: 'Team/Phòng ban', width: '200px', editable: false, textWrap: true },
      { field: 'ProjectCode', header: 'Mã dự án', width: '120px', editable: false },
      { field: 'ProjectName', header: 'Tên dự án', width: '200px', editable: false, textWrap: true },
      { field: 'IssueLogTypeName', header: 'Loại', width: '100px', editable: false },
      { field: 'StatusName', header: 'Trạng thái xử lý', width: '100px', editable: false },
      { field: 'PriorityName', header: 'Mức độ ưu tiên', width: '100px', editable: false },
      { field: 'ContentError', header: 'Nội dung lỗi', width: '300px', editable: false, textWrap: true },
      { field: 'Reason', header: 'Nguyên nhân', width: '300px', editable: false, textWrap: true },
      { field: 'Remedies', header: 'Biện pháp khắc phục', width: '300px', editable: false, textWrap: true },
      { field: 'IssueConclusion', header: 'Kết luận', width: '300px', editable: false, textWrap: true },
      { field: 'PIC', header: 'PIC', width: '200px', editable: false },
      { field: 'CreatorName', header: 'Người tạo', width: '180px', editable: false },
      { field: 'Image', header: 'Hình ảnh đính kèm', width: '200px', editable: false, textWrap: true }
    ];
  }

  editSelectedRow(): void {
    if (this.selectedHistoryRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để sửa!');
      return;
    }
    if (this.selectedHistoryRows.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ được chọn duy nhất một dòng để sửa!');
      return;
    }
    this.openDetailForm(this.selectedHistoryRows[0]);
  }

  deleteSelectedRow(): void {
    if (this.selectedHistoryRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một dòng để xóa!');
      return;
    }

    // Lọc các dòng chưa bị xóa
    const rowsToDelete = this.selectedHistoryRows.filter(row => !row.IsDeleted);
    if (rowsToDelete.length === 0) return;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <b>${rowsToDelete.length}</b> dòng đã chọn?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const ids = rowsToDelete.map(row => row.ID).filter(id => id > 0);
        if (ids.length > 0) {
          const payload = [{
            projectHistoryProblem: null,
            detail: [],
            deleteIdsMaster: ids,
            deletedIdsDetail: []
          }];
          this.projectHistoryProblemNewService.saveData(payload).subscribe({
            next: (res: any) => {
              this.notification.success('Thành công', `Đã xóa ${ids.length} dòng dữ liệu thành công!`);
              this.selectedHistoryRows = [];
              this.loadData();
            },
            error: (err: any) => {
              this.notification.error('Lỗi', 'Không thể xóa dòng này!');
            }
          });
        }
      }
    });
  }

  approveSelectedRow(role: string, approve: boolean): void {
    if (this.selectedHistoryRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một dòng để thực hiện!');
      return;
    }

    const ids = this.selectedHistoryRows.map(row => row.ID).filter(id => id > 0);
    const roleName = role === 'PM' ? 'PM' : (role === 'PP' ? 'Phó Phòng' : 'Trưởng Phòng');
    const actionName = approve ? 'Duyệt' : 'Hủy duyệt';

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc chắn muốn <b>${actionName}</b> cho <b>${ids.length}</b> dòng đã chọn với vai trò <b>${roleName}</b>?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requests = ids.map(id => this.projectHistoryProblemNewService.approveProblem(id, role, approve));

        forkJoin(requests).subscribe({
          next: (results: any[]) => {
            const successCount = results.filter(res => res.status === 1).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
              this.notification.success('Thành công', `${actionName} thành công ${successCount} dòng!`);
            }
            if (failCount > 0) {
              this.notification.error('Thất bại', `Có ${failCount} dòng không thể ${actionName.toLowerCase()}!`);
            }

            this.selectedHistoryRows = [];
            this.loadData();
          },
          error: (err: any) => {
            console.error(`Error ${actionName}:`, err);
            this.notification.error('Lỗi', 'Có lỗi xảy ra trong quá trình xử lý!');
          }
        });
      }
    });
  }


  loadData(): void {
    const projectID = this.projectId || 0;
    const employeeID = projectID > 0 ? 0 : (this.appUserService.employeeID || 0);

    if (projectID <= 0 && employeeID <= 0) {
      this.dataHistory = [];
      return;
    }

    this.isLoadHistory = true;
    this.projectHistoryProblemNewService.getDataHistoryProblem(projectID, employeeID).subscribe({
      next: (response: any) => {
        this.isLoadHistory = false;
        if (response.status === 1) {
          let responseData = response.data;
          let dtMaster = responseData?.dtMaster;
          if (!dtMaster) {
            this.dataHistory = [];
          } else if (Array.isArray(dtMaster)) {
            this.dataHistory = dtMaster.map((item: any) => this.mapMasterDataToTable(item));
          } else {
            this.dataHistory = [];
          }
        } else {
          this.notification.warning('Thông báo', response.message || 'Không có dữ liệu lịch sử phát sinh!');
          this.dataHistory = [];
        }
      },
      error: (error) => {
        this.isLoadHistory = false;
        console.error('Error loading history problem:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu lịch sử phát sinh!');
        this.dataHistory = [];
      },
    });
  }

  // Map dữ liệu từ API (dtMaster) vào format của bảng
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
      ProjectID: item.ProjectID || this.projectId,
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
      TeamDepartment: item.TeamDepartment || null,
      CreatorID: item.CreatorID || null,
      PerformerID: item.PerformerID || null,
      ReceiverID: item.ReceiverID || null,
      PriorityLevel: item.PriorityLevel || null,
      StatusProblem: item.StatusProblem || null,
      // Fields mapped từ Store Procedure
      IssueLogTypeName: item.IssueLogTypeName || '',
      StatusName: item.StatusName || '',
      PriorityName: item.PriorityName || '',
      TeamDepartmentName: item.TeamDepartmentName || '',
      CreatorName: item.CreatorName || '',
      PerformerName: item.PerformerName || '',
      ReceiverName: item.ReceiverName || '',
      IsApproved_PM: item.IsApproved_PM || false,
      IsApproved_PP: item.IsApproved_PP || false,
      IsApproved_TP: item.IsApproved_TP || false,
      ProjectCode: item.ProjectCode || '',
      ProjectName: item.ProjectName || '',
    };
  }

  // Mở modal form Thêm/Sửa
  openDetailForm(rowData?: any): void {
    const modalRef = this.modal.create({
      nzTitle: rowData ? 'Sửa phát sinh (Issue Log)' : 'Thêm phát sinh (Issue Log)',
      nzContent: ProjectHistoryProblemDetailComponent,
      nzData: { data: rowData || { ProjectID: this.projectId } },
      nzWidth: 1400,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: false,
      nzStyle: { top: '20px' },
      nzBodyStyle: { 'max-height': 'calc(100vh - 120px)', 'display': 'flex', 'flex-direction': 'column', 'padding': '0', 'overflow': 'hidden' }
    });

    modalRef.afterClose.subscribe(result => {
      if (result === true) {
        this.loadData();
      }
    });
  }

  // Thêm dòng vào bảng 1
  addHistoryRow(): void {
    this.openDetailForm();
  }

  // Lấy STT lớn nhất
  getMaxSTT(data: any[]): number {
    if (!data || data.length === 0) return 0;
    const sttValues = data
      .filter((item: any) => !item.IsDeleted)
      .map((item: any) => parseInt(item.STT, 10))
      .filter((stt: number) => !isNaN(stt) && stt > 0);
    return sttValues.length > 0 ? Math.max(...sttValues) : 0;
  }

  // Cập nhật lại STT
  updateSTT(): void {
    if (!this.dataHistory) return;
    let stt = 1;
    this.dataHistory.forEach((row: any) => {
      if (!row.IsDeleted) {
        row.STT = stt++;
      }
    });
    this.dataHistory = [...this.dataHistory];
  }

  // Xuất Excel
  exportExcel(): void {
    const historyData = this.dataHistory;

    if (!historyData || historyData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Lịch sử phát sinh
    const wsHistory = workbook.addWorksheet('Lịch sử phát sinh');

    const historyColumns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã dự án', key: 'ProjectCode', width: 20 },
      { header: 'Tên dự án', key: 'ProjectName', width: 40 },
      { header: 'Loại', key: 'IssueLogType', width: 20 },
      { header: 'Trạng thái xử lý', key: 'StatusProblem', width: 20 },
      { header: 'Mức độ ưu tiên', key: 'PriorityLevel', width: 20 },
      { header: 'Nội dung lỗi', key: 'ContentError', width: 40 },
      { header: 'Nguyên nhân', key: 'Reason', width: 40 },
      { header: 'Biện pháp khắc phục', key: 'Remedies', width: 40 },
      { header: 'Kết luận (Kiểm tra)', key: 'IssueConclusion', width: 40 },
      { header: 'Team/Phòng ban', key: 'TeamDepartment', width: 30 },
      { header: 'Người tạo', key: 'CreatorID', width: 30 },
      { header: 'Người thực hiện', key: 'PerformerID', width: 30 },
      { header: 'Người tiếp nhận', key: 'ReceiverID', width: 30 },
      { header: 'PIC', key: 'PIC', width: 20 },
      { header: 'Hình ảnh', key: 'Image', width: 30 },
      { header: 'PM duyệt', key: 'IsApproved_PM', width: 15 },
      { header: 'PP duyệt', key: 'IsApproved_PP', width: 15 },
      { header: 'TP duyệt', key: 'IsApproved_TP', width: 15 },
      { header: 'Ngày phát sinh', key: 'DateProblem', width: 15 },
      { header: 'Ngày thực hiện', key: 'DateImplementation', width: 15 }
    ];

    wsHistory.columns = historyColumns;

    // Header style
    wsHistory.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    wsHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    wsHistory.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Data
    historyData.forEach((row: any, index: number) => {
      const wsRow = wsHistory.addRow({
        STT: row.STT || index + 1,
        ProjectCode: row.ProjectCode || '',
        ProjectName: row.ProjectName || '',
        IssueLogType: row.IssueLogTypeName || '',
        StatusProblem: row.StatusName || '',
        PriorityLevel: row.PriorityName || '',
        ContentError: row.ContentError || '',
        Reason: row.Reason || '',
        Remedies: row.Remedies || '',
        IssueConclusion: row.IssueConclusion || '',
        TeamDepartment: row.TeamDepartmentName || '',
        CreatorID: row.CreatorName || '',
        PerformerID: row.PerformerName || '',
        ReceiverID: row.ReceiverName || '',
        PIC: row.PIC || '',
        Image: row.Image || '',
        IsApproved_PM: row.IsApproved_PM ? 'Đã duyệt' : '',
        IsApproved_PP: row.IsApproved_PP ? 'Đã duyệt' : '',
        IsApproved_TP: row.IsApproved_TP ? 'Đã duyệt' : '',
        DateProblem: row.DateProblem ? this.formatDateForExcel(row.DateProblem) : '',
        DateImplementation: row.DateImplementation ? this.formatDateForExcel(row.DateImplementation) : ''
      });

      // Format date columns
      if (row.DateProblem) {
        wsRow.getCell('DateProblem').numFmt = 'dd/mm/yyyy';
      }
      if (row.DateImplementation) {
        wsRow.getCell('DateImplementation').numFmt = 'dd/mm/yyyy';
      }
    });

    // Xuất file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LichSuPhatSinh_${this.projectCode || 'DuAn'}_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.notification.success('Thành công', 'Xuất Excel thành công!');
    }).catch((error) => {
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

  onCloseModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
      return;
    }

    window.history.back();
  }

  // Preview: click vào dòng để xem ảnh đính kèm
  onRowClickForPreview(rowData: any): void {
    this.previewRow = rowData;
    this.selectedPreviewImage = null;
    this.previewImages = [];
    this.linkedProjectItems = [];
    this.linkedWorkerVersions = [];
    this.linkedPartListVersions = [];

    if (rowData?.ID > 0) {
      this.projectHistoryProblemNewService.getFiles(rowData.ID).subscribe({
        next: (res: any) => {
          if (res.status === 1 && res.data) {
            this.previewImages = res.data;
          } else {
            this.previewImages = [];
          }
        },
        error: () => {
          this.previewImages = [];
        }
      });

      this.loadLinkedData(rowData.ID);
    }
  }

  loadLinkedData(problemId: number): void {
    this.projectHistoryProblemNewService.getDataHistoryProblemDetail(problemId).subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data) {
          this.linkedProjectItems = Array.isArray(res.data.dtProjectItemLink) ? res.data.dtProjectItemLink : [];
          this.linkedWorkerVersions = Array.isArray(res.data.dtWorkerVersionLink) ? res.data.dtWorkerVersionLink : [];
          this.linkedPartListVersions = Array.isArray(res.data.dtPartlistVersionLink) ? res.data.dtPartlistVersionLink : [];
        } else {
          this.linkedProjectItems = [];
          this.linkedWorkerVersions = [];
          this.linkedPartListVersions = [];
        }
      },
      error: () => {
        this.linkedProjectItems = [];
        this.linkedWorkerVersions = [];
        this.linkedPartListVersions = [];
      }
    });
  }

  // Mở ảnh trong tab mới (double-click hoặc context menu)
  openImageInNewTab(img: any): void {
    const serverPath = (img.ServerPath || img.serverPath || '').toString().trim();
    const fileName = (img.FileName || img.fileName || '').toString().trim();

    if (!serverPath) {
      this.message.warning('Không tìm thấy đường dẫn ảnh!');
      return;
    }

    let fullPath = serverPath;
    if (fileName && !serverPath.toLowerCase().includes(fileName.toLowerCase())) {
      fullPath = serverPath.replace(/[\\\/]+$/, '') + '\\' + fileName;
    }

    this.projectHistoryProblemNewService.downloadFileByPath(fullPath).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: () => {
        this.message.error('Không thể tải ảnh!');
      }
    });
  }

  // Context menu chuột phải trên dòng ảnh
  onImageContextMenu(event: MouseEvent, img: any): void {
    event.preventDefault();
    this.contextMenuImage = img;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.contextMenuVisible = false;
  }
}
