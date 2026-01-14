import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { WFHService } from '../WFH-service/WFH.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { EmployeeService } from '../../../employee/employee-service/employee.service';


export interface EmployeeDto {
  ID: number;
  Code: string;
  FullName: string;
  DepartmentName?: string;
  Position?: string;
}

export interface ApproverDto {
  ID: number;
  EmployeeID: number;
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
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    HasPermissionDirective
  ],
  templateUrl: './WFH-detail.component.html',
  styleUrls: ['./WFH-detail.component.css'],
})
export class WFHDetailComponent implements OnInit {
  // Input data
  @Input() wfhData: WFHDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'approve' | 'view' = 'add';
  @Input() userRole: 'employee' | 'tbp' | 'hr' | 'bgd' = 'employee';
  @Input() currentEmployeeId: number | null = null;
  // Form group
  wfhForm!: FormGroup;

  // Form fields (keep for backward compatibility)
  get selectedEmployeeId(): number | null {
    return this.wfhForm?.get('employeeId')?.value || null;
  }
  get selectedApprovedId(): number | null {
    return this.wfhForm?.get('approvedId')?.value || null;
  }
  get dateWFH(): Date | null {
    return this.wfhForm?.get('dateWFH')?.value || null;
  }
  get selectedTimeWFH(): number | null {
    return this.wfhForm?.get('timeWFH')?.value || null;
  }
  get reason(): string {
    return this.wfhForm?.get('reason')?.value || '';
  }
  get contentWork(): string {
    return this.wfhForm?.get('contentWork')?.value || '';
  }
  get reasonEdit(): string {
    return this.wfhForm?.get('reasonEdit')?.value || '';
  }
  get evaluateResults(): string {
    return this.wfhForm?.get('evaluateResults')?.value || '';
  }
  get reasonDecline(): string {
    return this.wfhForm?.get('reasonDecline')?.value || '';
  }
  get note(): string {
    return this.wfhForm?.get('note')?.value || '';
  }

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
  public activeModal = inject(NgbActiveModal);
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

  ngOnInit(): void {
    this.initializeData();
    this.loadEmployeesAndApprovers();
    this.setupFormData();
  }

  constructor(

    private message: NzMessageService,
    private notification: NzNotificationService,
    private wfhService: WFHService,
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) {
    this.initForm();
  }

  loadApprovers() {
    this.employeeService.getEmployeeApproved().subscribe({
      next: (res: any) => {
        this.approverList = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách người duyệt: ' + error.message);
      }
    });
  }

  // Initialize reactive form
  private initForm(): void {
    this.wfhForm = this.fb.group({
      employeeId: [{ value: null, disabled: true }, [Validators.required, this.positiveNumberValidator],],
      approvedId: [null, [Validators.required, this.positiveNumberValidator]],
      dateWFH: [new Date(), Validators.required],
      timeWFH: [0, [Validators.required, this.positiveNumberValidator]],
      reason: ['', [Validators.required, Validators.minLength(1)]],
      contentWork: ['', [Validators.required, Validators.minLength(10)]],
      reasonEdit: [''],
      evaluateResults: [''],
      reasonDecline: [''],
      note: [''],
    });
  }

  // Custom validator for positive number (> 0)
  private positiveNumberValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (value === null || value === undefined) {
      return { required: true };
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return { positiveNumber: true };
    }
    return null;
  }

  // Initialize component data
  initializeData(): void {

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

          // Sort employees within each group by Code
          Object.keys(empGroups).forEach((dept) => {
            empGroups[dept].sort((a, b) => (a.Code || '').localeCompare(b.Code || ''));
          });

          // Sort groups by department name
          this.employeeGroups = Object.keys(empGroups)
            .sort((a, b) => a.localeCompare(b))
            .map((dept) => ({
              label: `${dept}`,
              options: empGroups[dept],
            }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không thể tải dữ liệu nhân viên');
          this.employeeGroups = [];
        }
      },
      error: () => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu nhân viên');
        this.employeeGroups = [];
      },
    });

    // Load approvers separately using new API
    this.loadApprovers();
  }

  // Format employees data với debug logs

  // Setup form data based on mode and input data
  setupFormData(): void {
    if (this.wfhData) {
      this.wfhForm.patchValue({
        employeeId: this.wfhData.EmployeeID,
        approvedId: this.wfhData.ApprovedID,
        dateWFH: this.wfhData.DateWFH ? new Date(this.wfhData.DateWFH) : new Date(),
        timeWFH: this.wfhData.TimeWFH || 0,
        reason: this.wfhData.Reason || '',
        contentWork: this.wfhData.ContentWork || '',
        reasonEdit: this.wfhData.ReasonEdit || this.wfhData.ReasonHREdit || '',
        evaluateResults: this.wfhData.EvaluateResults || '',
        reasonDecline: this.wfhData.ReasonDecline || '',
        note: this.wfhData.Note || '',
      });
    } else {
      // Set default values for new WFH
      this.wfhForm.patchValue({
        employeeId: this.currentEmployeeId ?? null,
        dateWFH: new Date(),
        timeWFH: 0,
      });
    }

    // Update validators for reasonEdit: chỉ require nếu currentEmployeeId khác với EmployeeID trong bảng
    const reasonEditControl = this.wfhForm.get('reasonEdit');
    if (this.isEditMode && this.wfhData?.ID && this.wfhData.ID > 0) {
      const wfhEmployeeID = this.wfhData?.EmployeeID || 0;
      const currentEmpID = this.currentEmployeeId || 0;

      // Chỉ require nếu currentEmployeeId khác với EmployeeID trong bảng
      if (currentEmpID !== wfhEmployeeID && currentEmpID > 0 && wfhEmployeeID > 0) {
        reasonEditControl?.setValidators([Validators.required, Validators.minLength(1)]);
      } else {
        reasonEditControl?.clearValidators();
      }
      reasonEditControl?.updateValueAndValidity();
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
    console.log('Employee changed:', this.wfhForm.get('employeeId')?.value);
  }

  onApprovedChange(): void {
    console.log('Approver changed:', this.wfhForm.get('approvedId')?.value);
  }

  onDateChange(): void {
    console.log('Date changed:', this.wfhForm.get('dateWFH')?.value);
  }

  onTimeWFHChange(): void {
    console.log('Time WFH changed:', this.wfhForm.get('timeWFH')?.value);
  }

  // Disable dates before today
  disabledDate = (current: Date): boolean => {
    if (!current) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate < today;
  }

  // Form validation - theo rule từ C#
  validateForm(): boolean {
    // Mark all fields as touched and dirty to show validation errors immediately
    Object.keys(this.wfhForm.controls).forEach(key => {
      const control = this.wfhForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    // Check Người đăng ký
    const employeeId = this.wfhForm.get('employeeId')?.value;
    if (!employeeId || Number(employeeId) <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    // Check Người duyệt
    const approvedId = this.wfhForm.get('approvedId')?.value;
    if (!approvedId || Number(approvedId) <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    // Check Thời gian (SelectedIndex > 0, tức là value > 0)
    const timeWFH = this.wfhForm.get('timeWFH')?.value;
    if (!timeWFH || Number(timeWFH) <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    // Check Lý do
    const reason = this.wfhForm.get('reason')?.value;
    if (!reason || !reason.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    const contentWork = this.wfhForm.get('contentWork')?.value;
    if (!contentWork || !contentWork.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    // Check Lý do sửa: chỉ require nếu currentEmployeeId khác với EmployeeID trong bảng
    if (this.wfhData?.ID && this.wfhData.ID > 0) {
      const wfhEmployeeID = this.wfhData?.EmployeeID || 0;
      const currentEmpID = this.currentEmployeeId || 0;

      // Chỉ require nếu currentEmployeeId khác với EmployeeID trong bảng
      if (currentEmpID !== wfhEmployeeID && currentEmpID > 0 && wfhEmployeeID > 0) {
        const reasonEdit = this.wfhForm.get('reasonEdit')?.value;
        if (!reasonEdit || !reasonEdit.trim()) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
          return false;
        }
      }
    }

    return true;
  }


  // Helper method to check if field has error
  hasError(controlName: string): boolean {
    const control = this.wfhForm.get(controlName);
    // Hiển thị error nếu invalid và đã touched (không cần dirty)
    return !!(control && control.invalid && control.touched);
  }

  // Helper method to get error message for field
  getErrorMessage(controlName: string): string {
    const control = this.wfhForm.get(controlName);
    if (!control) return '';

    const errorMessages: { [key: string]: string } = {
      employeeId: 'Vui lòng chọn người đăng ký',
      approvedId: 'Vui lòng chọn người duyệt',
      dateWFH: 'Vui lòng chọn ngày WFH',
      timeWFH: 'Vui lòng chọn thời gian',
      reason: 'Vui lòng nhập lý do',
      contentWork: 'Vui lòng nhập nội dung/kế hoạch công việc',
      reasonEdit: 'Vui lòng nhập lý do sửa',
    };

    if (control.hasError('required') || control.hasError('positiveNumber')) {
      return errorMessages[controlName] || 'Trường này là bắt buộc';
    }
    return '';
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
    // Validate form theo rule
    if (!this.validateForm()) {
      return;
    }

    // Check duplicate trước khi lưu (EmployeeID + DateWFH + TimeWFH, trừ ID hiện tại)
    const id = this.wfhData?.ID || 0;
    const employeeId = Number(this.wfhForm.get('employeeId')?.value);
    const dateWFHValue = this.wfhForm.get('dateWFH')?.value;
    const dateStr = dateWFHValue
      ? new Date(dateWFHValue).toISOString().split('T')[0]
      : '';
    const timeWFHValue = Number(this.wfhForm.get('timeWFH')?.value);
    const selectedEmployee = this.employeeGroups
      .flatMap(g => g.options)
      .find(emp => emp.ID === employeeId);
    const employeeName = selectedEmployee?.FullName || '';

    const isDuplicate = await this.wfhService
      .checkDuplicateWFH(id, employeeId, dateStr, timeWFHValue)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);

    if (isDuplicate) {
      const timeWFHText = this.timeWFHOptions.find(opt => opt.value === timeWFHValue)?.label || '';
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Nhân viên ${employeeName} đã khai báo WFH ngày ${dateStr}!`
      );
      return;
    }
    const isEdit = this.mode === 'edit';
    const timeWFH = Number(this.wfhForm.get('timeWFH')?.value) || null;

    const formData = {
      ID: isEdit ? this.wfhData?.ID || 0 : 0,
      EmployeeID: Number(this.wfhForm.get('employeeId')?.value) || null,
      ApprovedID: Number(this.wfhForm.get('approvedId')?.value) || null,
      IsApproved: false,
      Reason: this.wfhForm.get('reason')?.value?.trim() || '',
      DateWFH: this.wfhForm.get('dateWFH')?.value ? new Date(this.wfhForm.get('dateWFH')?.value) : null,
      TimeWFH: timeWFH,
      Note: this.wfhForm.get('note')?.value?.trim() || '',
      TotalDay: timeWFH === 3 ? 1 : 0.5,
      ApprovedHR: Number(this.approvedHR) || 0,
      IsApprovedHR: false,
      DecilineApprove: Number(this.decilineApprove) || 0,
      ReasonDeciline: this.wfhForm.get('reasonDecline')?.value?.trim() || '',
      ReasonHREdit: this.wfhForm.get('reasonEdit')?.value?.trim() || '',
      IsProblem: Boolean(this.isProblem) || false,
      ContentWork: this.wfhForm.get('contentWork')?.value?.trim() || '',
      IsApprovedBGD: false,
      ApprovedBGDID: Number(this.approvedBGDID) || 0,
      DateApprovedBGD: null,
      EvaluateResults: '',
      IsDelete: false,
    };

    this.wfhService.saveData(formData).subscribe({
      next: (response: any) => {
        if (response && (response.status === 1 || response.Success)) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            isEdit ? 'Sửa WFH thành công!' : 'Thêm WFH thành công!'
          );
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Có lỗi xảy ra khi lưu!');
        }
      },
      error: (error) => {
        console.error('Error saving WFH:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu!');
      },
    });
  }

  // Approve WFH
  async approveWFH(): Promise<void> {
    if (this.showEvaluateResults && !this.evaluateResults?.trim()) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
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

      this.notification.success(NOTIFICATION_TITLE.success, 'Duyệt WFH thành công');
      this.activeModal.close({
        action: 'approve',
        data: approveData,
      });
    } catch (error) {
      console.error('Error approving WFH:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi duyệt WFH. Vui lòng thử lại!');
    } finally {
      this.saving = false;
    }
  }

  // Decline WFH
  async declineWFH(): Promise<void> {
    if (!this.reasonDecline?.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do không duyệt');
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

      this.notification.success(NOTIFICATION_TITLE.success, 'Đã từ chối WFH');
      this.activeModal.close({
        action: 'decline',
        data: declineData,
      });
    } catch (error) {
      console.error('Error declining WFH:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi từ chối WFH. Vui lòng thử lại!');
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
      .checkDuplicateWFH(id, employeeId!, date, timeWFH!)
      .toPromise()
      .then((res: any) => res?.status === 1 && res.data === true)
      .catch(() => false);
  }
}
