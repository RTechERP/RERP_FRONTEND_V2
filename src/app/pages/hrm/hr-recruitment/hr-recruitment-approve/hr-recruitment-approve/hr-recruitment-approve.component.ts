import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { HrRecruitmentApproveService } from '../hr-recruitment-approve.service';
import { HrRecruitmentApproveFormComponent } from '../hr-recruitment-approve-form/hr-recruitment-approve-form.component';
import { DepartmentServiceService } from '../../../department/department-service/department-service.service';
import { CustomTable } from '../../../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../../../shared/custom-table/column-def.model';
import Swal from 'sweetalert2';
import { environment } from '../../../../../../environments/environment';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';

@Component({
  selector: 'app-hr-recruitment-approve',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NgbModalModule,
    Menubar,
    CustomTable,
  ],
  templateUrl: './hr-recruitment-approve.component.html',
  styleUrl: './hr-recruitment-approve.component.css'
})
export class HrRecruitmentApproveComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private hrRecruitmentApproveService: HrRecruitmentApproveService,
    private departmentService: DepartmentServiceService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
  ) { }

  // --- Table ---
  columns: ColumnDef[] = [];
  tableData: any[] = [];
  selectedRows: any[] = [];   // checkbox multi-select
  selectedRow: any = null;    // click single-select (cho viewApproveForm)
  isLoading = false;
  groupRowsBy: string = 'HiringRequestCode';
  // --- Filter ---
  keyword: string = '';
  departmentId: any = -1;
  departmentList: any[] = [];
  employees: any[] = [];
  employeeId: any = -1;
  status: any = -1;
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  hrRecruitmentApproveMenu: MenuItem[] = [];

  ngOnInit(): void {
    this.loadDepartments();
    this.initColumns();
    this.loadMenu();
    this.onSearch();
    this.getEmployees();
  }

  loadMenu() {
    this.hrRecruitmentApproveMenu = [
      {
        label: 'Xem tờ trình',
        icon: 'fa-solid fa-file-lines fa-lg text-info',
        command: () => this.viewApproveForm(),
      },
      {
        label: 'TBP Duyệt',
        icon: 'fa-solid fa-user-check fa-lg text-primary',
        visible: this.permissionService.hasPermission('N1,N93'),
        items: [
          {
            label: 'TBP Duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.handleApprove('TBP'),
          },
          {
            label: 'TBP không duyệt',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.handleUnApprove(0, 'TBP'),
          },

        ],
      },
      {
        label: 'HCNS Duyệt',
        icon: 'fa-solid fa-user-tie fa-lg text-info',
        visible: this.permissionService.hasPermission('N1,N56'),
        items: [
          {
            label: 'HCNS Duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.handleApprove('HCNS'),
            // visible: this.permissionService.hasPermission('N2'),
          },
          {
            label: 'HR không duyệt',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.handleUnApprove(0, 'HCNS'),
            // visible: this.permissionService.hasPermission('N2'),
          },
        ],
      },
      {
        label: 'BGD Duyệt',
        icon: 'fa-solid fa-crown fa-lg text-warning',
        visible: this.permissionService.hasPermission('N1'),
        items: [
          {
            label: 'BGĐ xác nhận',
            icon: 'fa-solid fa-check text-success',
            command: () => this.handleApprove('BGD'),
          },
          {
            label: 'BGĐ không xác nhận',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.handleUnApprove(0, 'BGD'),
          },

        ],
      },
    ];
  }
  getEmployees(): void {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }
  initColumns() {
    this.columns = [
      { field: 'STT', header: 'STT', width: '55px', sortable: false },
      { field: 'HiringRequestCode', header: 'Mã yêu cầu tuyển dụng', width: '160px', sortable: true, filterMode: 'multiselect' },
      { field: 'FullName', header: 'Tên ứng viên', width: '150px', sortable: true, filterMode: 'multiselect' },
      { field: 'Gender', header: 'Giới tính', width: '80px', sortable: true, filterMode: 'multiselect' },
      { field: 'PositionName', header: 'Vị trí', width: '140px', sortable: true },
      { field: 'DepartmentName', header: 'Phòng ban', width: '140px', sortable: true, filterMode: 'multiselect' },
      {
        field: 'FileCVName', header: 'File CV', width: '120px', sortable: true,
        clickable: true, cellClass: () => 'text-primary pointer-link'
      },
      { field: 'LocationOfIssue', header: 'Nơi ban hành', width: '120px', sortable: true },
      {
        field: 'DateStart', header: 'Ngày nhận việc', width: '110px', sortable: true,
        format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '',
      },
      { field: 'ProbationPeriod', header: 'TG thử việc', width: '100px', sortable: true },
      {
        field: 'BasicSalary', header: 'Lương CB', width: '95px', sortable: true,
        filterType: 'numeric', cssClass: 'text-right',
        format: (v) => v ? Number(v).toLocaleString('vi-VN') : '',
      },
      {
        field: 'EmployeeApproverName', header: 'Người lập', width: '130px', sortable: true, filterMode: 'multiselect',
        format: (v) => v || '(Chưa lập)',
        cellClass: (row) => row.EmployeeApproverName ? 'text-success' : 'text-muted',
      },
      {
        field: 'TBPApproverName', header: 'TBP Duyệt', width: '130px', sortable: true, filterMode: 'multiselect',
        format: (v) => v || 'Chờ duyệt',
        cellClass: (row) => row.TBPApproverName ? 'text-success' : 'text-danger',
      },
      {
        field: 'HCNSApproveName', header: 'HCNS Duyệt', width: '130px', sortable: true, filterMode: 'multiselect',
        format: (v) => v || 'Chờ duyệt',
        cellClass: (row) => row.HCNSApproveName ? 'text-success' : 'text-danger',
      },
      {
        field: 'BGDApproverName', header: 'BGD Duyệt', width: '130px', sortable: true, filterMode: 'multiselect',
        format: (v) => v || 'Chờ duyệt',
        cellClass: (row) => row.BGDApproverName ? 'text-success' : 'text-danger',
      },
      {
        field: 'RejectionReason', header: 'Lý do từ chối', width: '200px', sortable: true, filterMode: 'multiselect',
        format: (v) => v || '',
      },
      {
        field: 'CreatedDate', header: 'Ngày tạo', width: '100px', sortable: true,
        format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '',
      },
    ];
  }
  onViewFile(item: any) {
    if (!item) return;
    const filePath = item.ServerPath || '';
    if (filePath) {
      const host = environment.host + 'api/share';
      const url =
        filePath.replace('\\\\192.168.1.190', host) + `/${item.FileCVName}`;
      window.open(url, '_blank');
    }
  }

  onCellAction(event: { field: string; rowData: any }) {
    if (event.field === 'FileCVName') {
      this.onViewFile(event.rowData);
    }
  }

  onSearch() {
    this.isLoading = true;

    let searchEmployeeId = this.employeeId ?? -1;
    const isHCNS_BGD = this.permissionService.hasPermission('N1,N2');
    if (!isHCNS_BGD && searchEmployeeId === -1) {
      searchEmployeeId = this.appUserService.employeeID ?? -1;
    }

    const params = {
      Keyword: this.keyword ?? '',
      DepartmentID: this.departmentId ?? -1,
      EmployeeID: searchEmployeeId,
      StartDate: this.dateStart ? new Date(this.dateStart).toLocaleDateString('en-CA') : '',
      EndDate: this.dateEnd ? new Date(this.dateEnd).toLocaleDateString('en-CA') : '',
    };

    this.hrRecruitmentApproveService.getListHRRecruitmentApprove(params).subscribe({
      next: (res) => {
        const rawData = res.data ?? [];
        // Sắp xếp dữ liệu theo HiringRequestCode để grouping hoạt động chính xác
        this.tableData = rawData.sort((a: any, b: any) => (b.HiringRequestCode || '').localeCompare(a.HiringRequestCode || '')).map((item: any, index: number) => ({
          ...item,
          STT: index + 1
        }));
        this.expandAllGroups();
        this.isLoading = false;
        this.selectedRows = [];
        this.selectedRow = null;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }
  expandedGroups: { [key: string]: boolean } = {};
  expandAllGroups() {
    this.expandedGroups = {};

    this.tableData.forEach((item: any) => {
      const key = item.HiringRequestCode;
      if (key) {
        this.expandedGroups[key] = true;
      }
    });
  }
  handleRowClick(rowData: any) {
    this.selectedRow = rowData;

    if (!this.selectedRows) this.selectedRows = [];

    const index = this.selectedRows.findIndex(item => item.ID === rowData.ID);
    if (index > -1) {
      // Toggle off
      this.selectedRows = this.selectedRows.filter(item => item.ID !== rowData.ID);
    } else {
      // Toggle on
      this.selectedRows = [...this.selectedRows, rowData];
    }
  }

  onDateChange(field: 'dateStart' | 'dateEnd', value: string): void {
    if (value) {
      (this as any)[field] = new Date(value);
    }
  }

  onReset() {
    this.keyword = '';
    this.departmentId = -1;
    this.employeeId = -1;
    this.onSearch();
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe(res => this.departmentList = res.data ?? []);
  }

  /** Gọi từ menu "Xem tờ trình" — dùng selectedRow (click single) */
  viewApproveForm() {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 ứng viên để xem tờ trình!');
      return;
    }
    this.isLoading = true;
    this.hrRecruitmentApproveService.getHRRecruitmentCandidateByIDForm(this.selectedRow.HRRecruitmentApplicationFormID).subscribe({
      next: (res) => {
        this.isLoading = false;
        const modalRef = this.modalService.open(HrRecruitmentApproveFormComponent, {
          backdrop: 'static', keyboard: false, centered: true, size: 'xl', scrollable: true
        });
        modalRef.componentInstance.HRRecruitmentCandidateID = res.data ?? 0;
        modalRef.componentInstance.Status = 7;
        modalRef.result.then(() => this.onSearch(), () => { });
      },
      error: () => this.isLoading = false
    });
  }
  handleUnApprove(isStatus: number, role: 'TBP' | 'HCNS' | 'BGD') {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 dòng (checkbox) để không duyệt!');
      return;
    }

    const currentUserId = this.appUserService.employeeID;
    const isDirector = this.permissionService.hasPermission('N1');

    // Lọc các row hợp lệ để không duyệt (đang chờ duyệt ở đúng bước)
    const validRows = this.selectedRows.filter(item => {
      if (role === 'TBP') return !item.TBPApproverName && (isDirector || item.TBPApprover === currentUserId);
      if (role === 'HCNS') return item.TBPApproverName && !item.HCNSApproveName && !item.RejectionReason;
      if (role === 'BGD') return item.HCNSApproveName && !item.BGDApproverName && !item.RejectionReason;
      return false;
    });

    if (validRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning,
        `Không có tờ trình nào hợp lệ để từ chối!`);
      return;
    }

    const roleLabel = role === 'TBP' ? 'TBP' : role === 'HCNS' ? 'HCNS' : 'BGĐ';

    // Tính số tờ trình bị bỏ qua và lý do
    const omittedCount = this.selectedRows.length - validRows.length;
    let skipNote = '';
    if (omittedCount > 0) {
      const parts: string[] = [];
      if (role === 'TBP' && !isDirector) {
        const notYours = this.selectedRows.filter(item => item.TBPApprover !== currentUserId);
        const wrongStep = this.selectedRows.filter(item =>
          item.TBPApprover === currentUserId && item.TBPApproverName
        );
        if (notYours.length > 0) parts.push(`${notYours.length} không phải TBP của bạn`);
        if (wrongStep.length > 0) parts.push(`${wrongStep.length} đã ở bước cao hơn`);
      } else if (role === 'HCNS') {
        const notReady = this.selectedRows.filter(item => !item.TBPApproverName);
        const alreadyDone = this.selectedRows.filter(item => item.HCNSApproveName);
        const rejected = this.selectedRows.filter(item => item.RejectionReason && item.TBPApproverName && !item.HCNSApproveName);
        if (notReady.length > 0) parts.push(`${notReady.length} TBP chưa duyệt`);
        if (rejected.length > 0) parts.push(`${rejected.length} đã bị từ chối`);
        if (alreadyDone.length > 0) parts.push(`${alreadyDone.length} đã qua bước HCNS`);
      } else if (role === 'BGD') {
        const notReady = this.selectedRows.filter(item => !item.HCNSApproveName);
        const alreadyDone = this.selectedRows.filter(item => item.BGDApproverName);
        const rejected = this.selectedRows.filter(item => item.RejectionReason && item.HCNSApproveName && !item.BGDApproverName);
        if (notReady.length > 0) parts.push(`${notReady.length} HCNS chưa duyệt`);
        if (rejected.length > 0) parts.push(`${rejected.length} đã bị từ chối`);
        if (alreadyDone.length > 0) parts.push(`${alreadyDone.length} BGĐ đã xác nhận`);
      }
      skipNote = ` (Bỏ qua: ${parts.join(', ')})`;
    }

    Swal.fire({
      title: `${roleLabel} không duyệt ${validRows.length} tờ trình${skipNote}`,
      html: '<p style="margin-bottom:6px;font-size:13px;">Vui lòng nhập lý do không duyệt <span style="color:red">*</span></p>',
      input: 'textarea',
      inputPlaceholder: 'Nhập lý do không duyệt...',
      inputAttributes: { rows: '3', style: 'resize:vertical;font-size:13px;' },
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      confirmButtonText: 'Xác nhận không duyệt',
      confirmButtonColor: '#d33',
      preConfirm: (reason) => {
        if (!reason || !reason.trim()) {
          Swal.showValidationMessage('Lý do không duyệt không được để trống!');
          return false;
        }
        return reason.trim();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const ids = validRows.map((item: any) => item.ID);
        this.executeUnApprove(ids, role, result.value);
      }
    });
  }
  handleApprove(role: 'TBP' | 'HCNS' | 'BGD') {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 dòng (checkbox) để duyệt!');
      return;
    }

    const currentUserId = this.appUserService.employeeID;
    const isDirector = this.permissionService.hasPermission('N1');

    // Với TBP: chỉ duyệt được tờ trình mà mình là TBP được chỉ định (hoặc giám đốc N1)
    if (role === 'TBP' && !isDirector) {
      const allowedRows = this.selectedRows.filter(item => item.TBPApprover === currentUserId);
      if (allowedRows.length === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Bạn chỉ có thể duyệt tờ trình mà bạn được chỉ định làm TBP!'
        );
        return;
      }
    }

    const validRows = this.selectedRows.filter(item => {
      if (role === 'TBP') return !item.TBPApproverName && (isDirector || item.TBPApprover === currentUserId);
      if (role === 'HCNS') return item.TBPApproverName && !item.HCNSApproveName && !item.RejectionReason;
      if (role === 'BGD') return item.HCNSApproveName && !item.BGDApproverName && !item.RejectionReason;
      return false;
    });

    if (validRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning,
        `Không có tờ trình nào hợp lệ để duyệt theo vai trò ${role}! (Quy trình: TBP → HCNS → BGD)`);
      return;
    }

    const omittedCount = this.selectedRows.length - validRows.length;
    let message = `Bạn có chắc chắn muốn duyệt ${validRows.length} tờ trình tuyển dụng?`;
    if (omittedCount > 0) {
      if (role === 'TBP' && !isDirector) {
        // Phân loại lý do bỏ qua cho TBP
        const notYourRows = this.selectedRows.filter(item => item.TBPApprover !== currentUserId);
        const alreadyApproved = this.selectedRows.filter(item =>
          item.TBPApprover === currentUserId && item.TBPApproverName
        );
        const parts: string[] = [];
        if (notYourRows.length > 0) parts.push(`${notYourRows.length} không phải TBP của bạn`);
        if (alreadyApproved.length > 0) parts.push(`${alreadyApproved.length} đã được duyệt`);
        message = `Duyệt ${validRows.length} tờ trình? (Bỏ qua: ${parts.join(', ')})`;
      } else {
        message = `Duyệt ${validRows.length} tờ trình? (Bỏ qua ${omittedCount} tờ trình không hợp lệ hoặc sai bước duyệt)`;
      }
    }

    Swal.fire({
      title: message,
      icon: 'question',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      confirmButtonText: 'Đồng ý',
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = validRows.map((item: any) => item.ID);
        this.executeApprove(ids, role);
      }
    });
  }

  executeApprove(ids: number[], role: string) {
    this.isLoading = true;
    this.hrRecruitmentApproveService.approveHRRecruitment(ids, role).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Duyệt thành công!');
          this.onSearch();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Duyệt thất bại!');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi duyệt!');
      }
    });
  }

  executeUnApprove(ids: number[], role: string, reason: string) {
    this.isLoading = true;
    this.hrRecruitmentApproveService.unApproveHRRecruitment(ids, role, reason).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Đã từ chối duyệt!');
          this.onSearch();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Từ chối duyệt thất bại!');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra!');
      }
    });
  }
}
