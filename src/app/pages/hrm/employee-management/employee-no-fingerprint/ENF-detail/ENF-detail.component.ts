import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { EmployeeNofingerprintService } from '../employee-no-fingerprint-service/employee-no-fingerprint.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { PermissionService } from '../../../../../services/permission.service';
import { AuthService } from '../../../../../auth/auth.service';
import { EmployeeService } from '../../../employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

export interface ENFDetailDto {
  ID?: number;
  EmployeeID?: number;
  ApprovedTP?: number;
  DayWork?: Date;
  IsApprovedTP?: boolean;
  Note?: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  ApprovedHR?: number;
  IsApprovedHR?: boolean;
  Type?: number; // 1: Quên buổi sáng; 2: Quên buổi chiều; 3: Quên do công tác
  DecilineApprove?: number; // 2: Không đồng ý duyệt; 1: Có đồng ý duyệt
  ReasonDeciline?: string;
  ReasonHREdit?: string;
  IsDeleted?: boolean;
  StatusText?: string;
  StatusHRText?: string;
}

@Component({
  selector: 'app-enf-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzRadioModule,
    HasPermissionDirective
  ],
  templateUrl: './ENF-detail.component.html',
  styleUrls: ['./ENF-detail.component.css'],
})
export class ENFDetailComponent implements OnInit {
  @Input() enfData: ENFDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'approve' | 'view' = 'add';
  @Input() userRole: 'employee' | 'tbp' | 'hr' = 'employee';

  // Reactive Form
  enfForm!: FormGroup;
  
  saving = false;
  loading = false;

  currentUser: any;
  @Input()currentEmployeeId: number | null = null;
  currentEmployee: any;

  employeeGroups: { label: string; options: any[] }[] = [];
  approverGroups: { label: string; options: any[] }[] = [];
  approverList: any[] = [];
  typeOptions = [
    { value: 1, label: 'Quên lúc đến' },
    { value: 2, label: 'Quên lúc về' },
  ];

  get modalTitle(): string {
    switch (this.mode) {
      case 'add':
        return 'Thêm mới Quên chấm công';
      case 'edit':
        return 'Sửa Quên chấm công';
      case 'approve':
        return 'Duyệt Quên chấm công';
      case 'view':
        return 'Xem chi tiết Quên chấm công';
      default:
        return 'Quên chấm công';
    }
  }

  get isEmployeeDisabled(): boolean {
    // Nếu có quyền N1, N2 hoặc IsAdmin thì không disable
    if (this.checkCanEditEmployee()) {
      return false;
    }
    return (
      this.mode === 'edit' || this.mode === 'approve' || this.mode === 'view'
    );
  }
  get isApproverDisabled(): boolean {
    return (
      this.mode === 'edit' || this.mode === 'approve' || this.mode === 'view'
    );
  }
  get isFormDisabled(): boolean {
    return this.isViewMode || this.saving;
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

  // Public getter để template có thể sử dụng
  get canEditEmployee(): boolean {
    return this.checkCanEditEmployee();
  }

  constructor(
    public activeModal: NgbActiveModal,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private enfService: EmployeeNofingerprintService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private authService: AuthService,
    private employeeService: EmployeeService
  ) {}

  private initForm(): void {
    this.enfForm = this.fb.group({
      selectedEmployeeId: [{value:this.currentEmployeeId, disabled: true}, [Validators.required]],
      selectedApprovedId: [null, [Validators.required]],
      dayWork: [null, [Validators.required]],
      selectedType: [1, [Validators.required]],
      note: [''],
      reasonHREdit: [''] // Validation sẽ được thêm động trong updateReasonHREditValidation
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadEmployeesAndApprovers();
    this.getCurrentUser();
    this.setupFormData();
    
    // Update validation for reasonHREdit based on mode
    this.updateReasonHREditValidation();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;
        // Cập nhật lại disable/enable cho EmployeeID sau khi có currentUser
        this.updateEmployeeIdDisabledState();
      },
      error: (err: any) => {
        console.error('Lỗi lấy thông tin người dùng:', err);
      }
    });
  }

  private updateEmployeeIdDisabledState(): void {
    const employeeIdControl = this.enfForm.get('selectedEmployeeId');
    if (employeeIdControl) {
      // Chỉ disable nếu không có quyền N1, N2 hoặc IsAdmin
      if (this.isEmployeeDisabled && !this.checkCanEditEmployee()) {
        employeeIdControl.disable();
      } else if (this.checkCanEditEmployee()) {
        employeeIdControl.enable();
      }
    }
  }

  private updateReasonHREditValidation(): void {
    const reasonHREditControl = this.enfForm.get('reasonHREdit');
    if (reasonHREditControl) {
      if (this.isEditMode) {
        reasonHREditControl.setValidators([Validators.required]);
      } else {
        reasonHREditControl.clearValidators();
      }
      reasonHREditControl.updateValueAndValidity();
    }
  }

  loadApprovers() {
    this.employeeService.getEmployeeApprove().subscribe({
      next: (res: any) => {
        this.approverList = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || 'Lỗi khi tải danh sách phương tiện: ' + error.message);
      }
    });
  }
  loadEmployeesAndApprovers(): void {
    this.loading = true;
    this.enfService.getEmloyeeApprover().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.status === 1 && res.data) {
          const empGroups: { [key: string]: any[] } = {};
          (res.data.employees || []).forEach((emp: any) => {
            const dept = emp.DepartmentName || 'Không xác định';
            if (!empGroups[dept]) empGroups[dept] = [];
            empGroups[dept].push(emp);
          });
          this.employeeGroups = Object.keys(empGroups).map((dept) => ({
            label: dept,
            options: empGroups[dept],
          }));
        } else {
          this.notification.error(
            'Lỗi',
            res?.message || 'Không thể tải dữ liệu nhân viên'
          );
          this.employeeGroups = [];
        }
      },
      error: () => {
        this.loading = false;
        this.notification.error(
          'Lỗi',
          'Không thể tải dữ liệu nhân viên'
        );
        this.employeeGroups = [];
      },
    });
    
    // Load approvers separately using new API
    this.loadApprovers();
  }

  setupFormData(): void {
    if (this.enfData) {
      this.enfForm.patchValue({
        selectedEmployeeId: this.enfData.EmployeeID ?? null,
        selectedApprovedId: this.enfData.ApprovedTP ?? null,
        dayWork: this.enfData.DayWork ? new Date(this.enfData.DayWork) : null,
        selectedType: this.enfData.Type ?? 1,
        note: this.enfData.Note || '',
        reasonHREdit: this.enfData.ReasonHREdit || ''
      });
    } else {
      this.enfForm.patchValue({
        dayWork: new Date(),
        selectedType: 1
      });
    }
    
    // Disable fields based on mode
    // Chỉ disable EmployeeID nếu không có quyền N1, N2 hoặc IsAdmin
    if (this.isEmployeeDisabled && !this.checkCanEditEmployee()) {
      this.enfForm.get('selectedEmployeeId')?.disable();
    } else if (this.checkCanEditEmployee()) {
      this.enfForm.get('selectedEmployeeId')?.enable();
    }
    if (this.isApproverDisabled) {
      this.enfForm.get('selectedApprovedId')?.disable();
    }
    if (this.isFormDisabled) {
      this.enfForm.disable();
    }
  }

  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!option.nzLabel) return false;
    return option.nzLabel.toLowerCase().includes(input.toLowerCase());
  };

  filterApproverOption = (input: string, option: any): boolean => {
    if (!option.nzLabel) return false;
    return option.nzLabel.toLowerCase().includes(input.toLowerCase());
  };

  isFormValid(): boolean {
    if (this.enfForm.disabled) {
      this.enfForm.enable();
      // Chỉ disable EmployeeID nếu không có quyền N1, N2 hoặc IsAdmin
      if (this.isEmployeeDisabled && !this.checkCanEditEmployee()) {
        this.enfForm.get('selectedEmployeeId')?.disable();
      } else if (this.checkCanEditEmployee()) {
        this.enfForm.get('selectedEmployeeId')?.enable();
      }
      if (this.isApproverDisabled) {
        this.enfForm.get('selectedApprovedId')?.disable();
      }
    }
    return this.enfForm.valid;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (this.enfForm.get('selectedEmployeeId')?.hasError('required')) {
      errors.push('Vui lòng chọn người đăng ký');
    }
    if (this.enfForm.get('selectedApprovedId')?.hasError('required')) {
      errors.push('Vui lòng chọn người duyệt');
    }
    if (this.enfForm.get('dayWork')?.hasError('required')) {
      errors.push('Vui lòng chọn ngày');
    }
    if (this.enfForm.get('selectedType')?.hasError('required')) {
      errors.push('Vui lòng chọn loại quên chấm công');
    }
    if (this.isEditMode && this.enfForm.get('reasonHREdit')?.hasError('required')) {
      errors.push('Vui lòng nhập lý do chỉnh sửa');
    }
    return errors;
  }

  // Helper methods for nz-error-tip
  getEmployeeErrorTip(): string | undefined {
    const control = this.enfForm.get('selectedEmployeeId');
    if (control?.hasError('required') && (control?.dirty || control?.touched)) {
      return 'Vui lòng chọn người đăng ký';
    }
    return undefined;
  }

  getApproverErrorTip(): string | undefined {
    const control = this.enfForm.get('selectedApprovedId');
    if (control?.hasError('required') && (control?.dirty || control?.touched)) {
      return 'Vui lòng chọn người duyệt';
    }
    return undefined;
  }

  getDayWorkErrorTip(): string | undefined {
    const control = this.enfForm.get('dayWork');
    if (control?.hasError('required') && (control?.dirty || control?.touched)) {
      return 'Vui lòng chọn ngày';
    }
    return undefined;
  }

  getTypeErrorTip(): string | undefined {
    const control = this.enfForm.get('selectedType');
    if (control?.hasError('required') && (control?.dirty || control?.touched)) {
      return 'Vui lòng chọn loại quên chấm công';
    }
    return undefined;
  }

  getReasonHREditErrorTip(): string | undefined {
    const control = this.enfForm.get('reasonHREdit');
    if (control?.hasError('required') && (control?.dirty || control?.touched)) {
      return 'Vui lòng nhập lý do chỉnh sửa';
    }
    return undefined;
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  async checkDuplicateENF(): Promise<boolean> {
    const id = this.enfData?.ID || 0;
    const employeeId = this.enfForm.get('selectedEmployeeId')?.value;
    const dayWorkValue = this.enfForm.get('dayWork')?.value;
    const dayWork = dayWorkValue
      ? (dayWorkValue instanceof Date ? dayWorkValue : new Date(dayWorkValue)).toISOString().split('T')[0]
      : '';
    const type = this.enfForm.get('selectedType')?.value;
    return this.enfService
      .checkDuplicateENF(id, employeeId, dayWork, type)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);
  }

  async saveENF(): Promise<void> {
    // Mark all fields as touched to show validation errors
    Object.keys(this.enfForm.controls).forEach(key => {
      this.enfForm.get(key)?.markAsTouched();
    });

    if (!this.isFormValid()) {
      this.notification.warning(
        'Thông tin không hợp lệ',
        this.getValidationErrors().join(', ')
      );
      return;
    }

    const formValue = this.enfForm.getRawValue(); // Use getRawValue to get disabled values too
    const id = this.enfData?.ID || 0;
    const employeeId = formValue.selectedEmployeeId;
    const dayWorkValue = formValue.dayWork;
    const dayWorkStr = dayWorkValue instanceof Date
      ? dayWorkValue.toISOString().split('T')[0]
      : (dayWorkValue ? new Date(dayWorkValue).toISOString().split('T')[0] : '');
    const type = formValue.selectedType;

    // Check duplicate trước khi lưu
    const isDuplicate = await this.enfService
      .checkDuplicateENF(id, employeeId, dayWorkStr, type)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);

    if (isDuplicate) {
      this.notification.warning(
        'Trùng lặp',
        'Đã tồn tại bản ghi Quên chấm công cho nhân viên này vào ngày này với loại đã chọn.'
      );
      return;
    }

    // Khai báo formData trước khi dùng
    let formData: ENFDetailDto = {
      ID: id,
      EmployeeID: employeeId,
      ApprovedTP: formValue.selectedApprovedId,
      DayWork: dayWorkValue instanceof Date ? dayWorkValue : new Date(dayWorkValue),
      Type: type,
      Note: formValue.note?.trim() || '',
      ReasonHREdit: formValue.reasonHREdit?.trim() || '',
    };

    // Nếu là sửa thì reset trạng thái duyệt về chưa duyệt
    if (this.isEditMode) {
      formData = {
        ...formData,
        IsApprovedTP: false,
        IsApprovedHR: false,
        StatusText: 'Chưa duyệt',
        StatusHRText: 'Chưa duyệt',
      };
    }

    this.saving = true;
    this.enfService.saveData(formData).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && (response.status === 1 || response.Success)) {
          // Đóng modal trước khi hiển thị notification
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
          // Notification sẽ được hiển thị ở component cha
        } else {
          this.notification.error(
            'Lỗi',
            response?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
          );
        }
      },
      error: () => {
        this.saving = false;
        this.notification.error('Lỗi', 'Không thể lưu dữ liệu!');
      },
    });
  }

  // Helper method để kiểm tra user có quyền chỉnh sửa nhân viên (N1, N2 hoặc IsAdmin)
  private checkCanEditEmployee(): boolean {
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN2Permission = this.permissionService.hasPermission('N2');
    const isAdmin = this.currentUser?.IsAdmin === true || this.currentUser?.ISADMIN === true;
    
    return hasN1Permission || hasN2Permission || isAdmin;
  }

}
