import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// Import Service
import { WFHService, WFHDto } from '../WFH-service/WFH.service';

// Interfaces
export interface EmployeeDto {
  ID: number;
  Code: string;
  FullName: string;
  DepartmentName?: string;
  Position?: string;
}

export interface ApproverDto {
  ID: number;
  Code: string;
  FullName: string;
  Role?: string;
  DepartmentName?: string;
}

export interface WFHDetailDto {
  ID?: number;
  EmployeeID: number;
  EmployeeName?: string;
  ApprovedID: number;
  ApprovedName?: string;
  DateWFH: Date;
  TimeWFH: number;
  TimeWFHText?: string;
  Reason: string;
  ContentWork: string;
  ReasonEdit?: string;
  EvaluateResults?: string;
  ReasonDecline?: string;
  Status?: number;
  StatusText?: string;
  StatusHR?: number;
  StatusHRText?: string;
  IsApprovedBGD?: boolean;
  CreatedDate?: Date;
  CreatedBy?: number;
  ModifiedDate?: Date;
  ModifiedBy?: number;
  ApprovedHR?: boolean;
  IsDelete?: boolean;
  Note?: string;
  TotalDay?: number;
  IsProblem?: boolean;
  DeclineApprove?: boolean;
  DateApprovedBGD?: Date;
  ApprovedBGDID?: number;
  ReasonDeciline?: string;
  DecilineApprove?: boolean;
  ReasonHREdit?: string;
}

@Component({
  selector: 'app-wfh-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
  ],
  templateUrl: './WFH-detail.component.html',
  styleUrls: ['./WFH-detail.component.css'],
})
export class WFHDetailComponent implements OnInit {
  // Input data
  @Input() wfhData: WFHDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'approve' | 'view' = 'add';
  @Input() userRole: 'employee' | 'tbp' | 'hr' | 'bgd' = 'employee';

  // Form fields
  selectedEmployeeId: number | null = null;
  selectedApprovedId: number | null = null;
  dateWFH: Date | null = null;
  selectedTimeWFH: number | null = null;
  reason: string = '';
  contentWork: string = '';
  reasonEdit: string = '';
  evaluateResults: string = '';
  reasonDecline: string = '';
  note: string = '';

  // Add missing property for ApprovedHR
  approvedHR: number = 0;

  // Add missing property for DecilineApprove
  decilineApprove: number = 0;

  // Add missing property for ApprovedBGDID
  approvedBGDID: number = 0;

  // Add missing property for isProblem
  isProblem: boolean = false;

  // Data lists - Format giống employee-purchase-detail
  employees: any[] = [];
  approvers: any[] = [];

  // Thêm 2 biến mảng đơn giản cho dropdown
  employeeList: EmployeeDto[] = [];
  approverList: ApproverDto[] = [];

  employeeGroups: { label: string; options: EmployeeDto[] }[] = [];
  approverGroups: { label: string; options: ApproverDto[] }[] = [];

  timeWFHOptions = [
    { value: 0, label: 'Chọn thời gian' },
    { value: 1, label: 'Buổi sáng' },
    { value: 2, label: 'Buổi chiều' },
    { value: 3, label: 'Cả ngày' },
  ];

  // Form state
  saving = false;
  loading = false;

  // Computed properties
  get modalTitle(): string {
    switch (this.mode) {
      case 'add':
        return 'Thêm mới WFH';
      case 'edit':
        return 'Sửa WFH';
      case 'approve':
        return 'Duyệt WFH';
      case 'view':
        return 'Xem chi tiết WFH';
      default:
        return 'WFH';
    }
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isApproveMode(): boolean {
    return this.mode === 'approve';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  get showEvaluateResults(): boolean {
    return this.isApproveMode && this.userRole === 'tbp';
  }

  get showReasonDecline(): boolean {
    return this.isApproveMode;
  }

  get canApprove(): boolean {
    return (
      this.isApproveMode &&
      (this.userRole === 'tbp' ||
        this.userRole === 'hr' ||
        this.userRole === 'bgd')
    );
  }

  get canDecline(): boolean {
    return (
      this.isApproveMode &&
      (this.userRole === 'tbp' ||
        this.userRole === 'hr' ||
        this.userRole === 'bgd')
    );
  }

  get isFormDisabled(): boolean {
    return this.isViewMode || this.saving;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private wfhService: WFHService
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadEmployeesAndApprovers();
    this.setupFormData();
  }

  // Initialize component data
  initializeData(): void {
    console.log('WFH Detail Mode:', this.mode);
    console.log('User Role:', this.userRole);
    console.log('WFH Data:', this.wfhData);
  }

  // Load employees and approvers from API
  loadEmployeesAndApprovers(): void {
    this.loading = true;
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.status === 1 && res.data) {
          // Group employees by DepartmentName
          const empGroups: { [key: string]: EmployeeDto[] } = {};
          (res.data.employees || []).forEach((emp: any) => {
            const dept = emp.DepartmentName || 'Không xác định';
            if (!empGroups[dept]) empGroups[dept] = [];
            empGroups[dept].push(emp);
          });
          this.employeeGroups = Object.keys(empGroups).map((dept) => ({
            label: dept,
            options: empGroups[dept],
          }));

          // Group approvers by DepartmentName
          const apprGroups: { [key: string]: ApproverDto[] } = {};
          (res.data.approvers || []).forEach((appr: any) => {
            const dept = appr.DepartmentName || 'Không xác định';
            if (!apprGroups[dept]) apprGroups[dept] = [];
            apprGroups[dept].push({
              ID: appr.EmployeeID,
              FullName: appr.FullName,
              DepartmentName: appr.DepartmentName,
              Code: appr.Code,
            });
          });
          this.approverGroups = Object.keys(apprGroups).map((dept) => ({
            label: dept,
            options: apprGroups[dept],
          }));
        } else {
          this.message.error(res?.message || 'Không thể tải dữ liệu');
          this.employeeGroups = [];
          this.approverGroups = [];
        }
      },
      error: () => {
        this.loading = false;
        this.message.error('Lỗi khi tải dữ liệu nhân viên và người duyệt');
        this.employeeGroups = [];
        this.approverGroups = [];
      },
    });
  }

  // Format employees data với debug logs

  // Setup form data based on mode and input data
  setupFormData(): void {
    if (this.wfhData) {
      this.selectedEmployeeId = this.wfhData.EmployeeID;
      this.selectedApprovedId = this.wfhData.ApprovedID;
      this.dateWFH = this.wfhData.DateWFH
        ? new Date(this.wfhData.DateWFH)
        : null;
      this.selectedTimeWFH = this.wfhData.TimeWFH;
      this.reason = this.wfhData.Reason || '';
      this.contentWork = this.wfhData.ContentWork || '';
      this.reasonEdit = this.wfhData.ReasonEdit || '';
      this.evaluateResults = this.wfhData.EvaluateResults || '';
      this.reasonDecline = this.wfhData.ReasonDecline || '';
    } else {
      // Set default values for new WFH
      this.dateWFH = new Date();
      this.selectedTimeWFH = 0;
    }
  }

  // Filter functions for dropdowns
  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!option.nzLabel) return false;
    return option.nzLabel.toLowerCase().includes(input.toLowerCase());
  };

  filterApproverOption = (input: string, option: any): boolean => {
    if (!option.nzLabel) return false;
    return option.nzLabel.toLowerCase().includes(input.toLowerCase());
  };

  // Event handlers
  onEmployeeChange(): void {
    console.log('Employee changed:', this.selectedEmployeeId);
  }

  onApprovedChange(): void {
    console.log('Approver changed:', this.selectedApprovedId);
  }

  onDateChange(): void {
    console.log('Date changed:', this.dateWFH);
  }

  onTimeWFHChange(): void {
    console.log('Time WFH changed:', this.selectedTimeWFH);
  }

  // Form validation
  isFormValid(): boolean {
    const isBasicValid = !!(
      this.selectedEmployeeId &&
      this.selectedApprovedId &&
      this.dateWFH &&
      this.selectedTimeWFH &&
      this.reason?.trim() &&
      this.contentWork?.trim()
    );

    // Additional validation for approve mode
    if (this.isApproveMode && this.canDecline) {
      if (this.reasonDecline?.trim()) {
        return true; // Valid if has decline reason
      }
      return isBasicValid;
    }

    return isBasicValid;
  }

  // Get validation error messages
  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.selectedEmployeeId) errors.push('Vui lòng chọn người đăng ký');
    if (!this.selectedApprovedId) errors.push('Vui lòng chọn người duyệt');
    if (!this.dateWFH) errors.push('Vui lòng chọn ngày WFH');
    if (!this.selectedTimeWFH) errors.push('Vui lòng chọn thời gian');
    if (!this.reason?.trim()) errors.push('Vui lòng nhập lý do');
    if (!this.contentWork?.trim())
      errors.push('Vui lòng nhập nội dung/kế hoạch công việc');

    return errors;
  }

  getFormData(): any {
    return {
      ID: this.wfhData?.ID || 0,
      EmployeeID: this.selectedEmployeeId
        ? Number(this.selectedEmployeeId)
        : null,
      ApprovedID: this.selectedApprovedId
        ? Number(this.selectedApprovedId)
        : null,
      IsApproved: false,
      Reason: this.reason?.trim() || '',
      DateWFH: this.dateWFH ? this.dateWFH.toISOString() : null, // ISO string
      TimeWFH: this.selectedTimeWFH ? Number(this.selectedTimeWFH) : null,
      Note: this.wfhData?.Note ?? '',
      CreatedDate: this.wfhData?.CreatedDate
        ? new Date(this.wfhData.CreatedDate).toISOString()
        : new Date().toISOString(),
      CreatedBy: this.wfhData?.CreatedBy ?? this.wfhService.LoginName,
      UpdatedDate: new Date().toISOString(),
      UpdatedBy: this.wfhService.LoginName,
      TotalDay:
        this.wfhData?.TotalDay !== undefined
          ? Number(this.wfhData.TotalDay)
          : 0,
      ApprovedHR:
        this.wfhData?.ApprovedHR !== undefined
          ? Number(this.wfhData.ApprovedHR)
          : 0,
      IsApprovedHR: false,
      DecilineApprove:
        this.wfhData?.DecilineApprove !== undefined
          ? Number(this.wfhData.DecilineApprove)
          : 0,
      ReasonDeciline: this.wfhData?.ReasonDeciline ?? '',
      ReasonHREdit: this.wfhData?.ReasonEdit ?? '',
      IsProblem:
        this.wfhData?.IsProblem !== undefined
          ? Boolean(this.wfhData.IsProblem)
          : false,
      ContentWork: this.contentWork?.trim() || '',
      IsApprovedBGD: false,
      ApprovedBGDID:
        this.wfhData?.ApprovedBGDID !== undefined
          ? Number(this.wfhData.ApprovedBGDID)
          : 0,
      DateApprovedBGD: null,
      EvaluateResults: '',
      IsDelete: false,
    };
  }
  // Save WFH
  async saveWFH(): Promise<void> {
    if (!this.isFormValid()) {
      this.message.warning(this.getValidationErrors().join(', '));
      return;
    }

    // Check duplicate trước khi lưu
    const id = this.wfhData?.ID || 0;
    const employeeId = this.selectedEmployeeId!;
    const dateStr = this.dateWFH
      ? this.dateWFH.toISOString().split('T')[0]
      : '';
    const timeWFH = this.selectedTimeWFH!;

    const isDuplicate = await this.wfhService
      .checkDuplicateWFH(id, employeeId, dateStr, timeWFH)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);

    if (isDuplicate) {
      this.notification.error(
        'Trùng lặp dữ liệu',
        'Đã tồn tại bản ghi WFH cùng nhân viên, ngày và thời gian!'
      );
      return;
    }

    // ...phần lưu dữ liệu như cũ...
    const isEdit = this.mode === 'edit';
    const formData = {
      ID: isEdit ? this.wfhData?.ID || 0 : 0,
      EmployeeID: Number(this.selectedEmployeeId) || null,
      ApprovedID: Number(this.selectedApprovedId) || null,
      IsApproved: false,
      Reason: this.reason?.trim() || '',
      DateWFH: this.dateWFH ? new Date(this.dateWFH) : null,
      TimeWFH: Number(this.selectedTimeWFH) || null,
      Note: this.note?.trim() || '',
      CreatedDate: isEdit
        ? this.wfhData?.CreatedDate
          ? new Date(this.wfhData.CreatedDate)
          : new Date()
        : new Date(),
      CreatedBy: isEdit
        ? this.wfhData?.CreatedBy ?? this.wfhService.LoginName
        : this.wfhService.LoginName,
      UpdatedDate: new Date(),
      UpdatedBy: this.wfhService.LoginName,
      TotalDay: Number(this.wfhData?.TotalDay) || 0,
      ApprovedHR: Number(this.approvedHR) || 0,
      IsApprovedHR: false,
      DecilineApprove: Number(this.decilineApprove) || 0,
      ReasonDeciline: this.reasonDecline?.trim() || '',
      ReasonHREdit: this.reasonEdit?.trim() || '',
      IsProblem: Boolean(this.isProblem) || false,
      ContentWork: this.contentWork?.trim() || '',
      IsApprovedBGD: false,
      ApprovedBGDID: Number(this.approvedBGDID) || 0,
      DateApprovedBGD: null,
      EvaluateResults: '',
      IsDelete: false,
    };

    this.wfhService.saveData(formData).subscribe({
      next: (response: any) => {
        if (response && (response.status === 1 || response.Success)) {
          this.message.success(
            isEdit ? 'Sửa WFH thành công!' : 'Thêm WFH thành công!'
          );
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
        } else {
          this.message.error(response?.message || 'Có lỗi xảy ra khi lưu!');
        }
      },
      error: (error) => {
        console.error('Error saving WFH:', error);
        this.message.error('Có lỗi xảy ra khi lưu dữ liệu!');
      },
    });
  }

  // Approve WFH
  async approveWFH(): Promise<void> {
    if (this.showEvaluateResults && !this.evaluateResults?.trim()) {
      this.notification.warning(
        'Thiếu đánh giá',
        'Vui lòng nhập kết quả đánh giá trước khi duyệt WFH.'
      );
      return;
    }

    try {
      this.saving = true;

      const approveData = {
        ID: this.wfhData?.ID,
        EvaluateResults: this.evaluateResults.trim(),
        ApprovedBy: this.userRole,
      };

      console.log('Approving WFH:', approveData);

      // Mock API call - replace with actual service
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.message.success('Duyệt WFH thành công');
      this.activeModal.close({
        action: 'approve',
        data: approveData,
      });
    } catch (error) {
      console.error('Error approving WFH:', error);
      this.message.error('Lỗi khi duyệt WFH. Vui lòng thử lại!');
    } finally {
      this.saving = false;
    }
  }

  // Decline WFH
  async declineWFH(): Promise<void> {
    if (!this.reasonDecline?.trim()) {
      this.message.warning('Vui lòng nhập lý do không duyệt');
      return;
    }

    try {
      this.saving = true;

      const declineData = {
        ID: this.wfhData?.ID,
        ReasonDecline: this.reasonDecline.trim(),
        DeclinedBy: this.userRole,
      };

      console.log('Declining WFH:', declineData);

      // Mock API call - replace with actual service
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.message.success('Đã từ chối WFH');
      this.activeModal.close({
        action: 'decline',
        data: declineData,
      });
    } catch (error) {
      console.error('Error declining WFH:', error);
      this.message.error('Lỗi khi từ chối WFH. Vui lòng thử lại!');
    } finally {
      this.saving = false;
    }
  }

  // Close modal
  closeModal(): void {
    this.activeModal.dismiss();
  }

  private async checkDuplicateWFH(): Promise<boolean> {
    const id = this.wfhData?.ID || 0;
    const employeeId = this.selectedEmployeeId;
    const date = this.dateWFH ? this.dateWFH.toISOString().split('T')[0] : '';
    const timeWFH = this.selectedTimeWFH;

    // Gọi API check duplicate
    return this.wfhService
      .checkDuplicateWFH(id, employeeId, date, timeWFH)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);
  }
}
