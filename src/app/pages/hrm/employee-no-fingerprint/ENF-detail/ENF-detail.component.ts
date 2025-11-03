import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IsDelete?: boolean;
  StatusText?: string;
  StatusHRText?: string;
}

@Component({
  selector: 'app-enf-detail',
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
    NzRadioModule,
  ],
  templateUrl: './ENF-detail.component.html',
  styleUrls: ['./ENF-detail.component.css'],
})
export class ENFDetailComponent implements OnInit {
  @Input() enfData: ENFDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'approve' | 'view' = 'add';
  @Input() userRole: 'employee' | 'tbp' | 'hr' = 'employee';

  // Form fields
  selectedEmployeeId: number | null = null;
  selectedApprovedId: number | null = null;
  dayWork: Date | null = null;
  selectedType: number | null = 1;
  note: string = '';
  reasonHREdit: string = '';
  reasonDeciline: string = '';
  saving = false;
  loading = false;

  employeeGroups: { label: string; options: any[] }[] = [];
  approverGroups: { label: string; options: any[] }[] = [];

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

  constructor(
    public activeModal: NgbActiveModal,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private enfService: EmployeeNofingerprintService
  ) {}

  ngOnInit(): void {
    this.loadEmployeesAndApprovers();
    this.setupFormData();
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

          const apprGroups: { [key: string]: any[] } = {};
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
          this.notification.error(
            'Lỗi',
            res?.message || 'Không thể tải dữ liệu nhân viên và người duyệt'
          );
          this.employeeGroups = [];
          this.approverGroups = [];
        }
      },
      error: () => {
        this.loading = false;
        this.notification.error(
          'Lỗi',
          'Không thể tải dữ liệu nhân viên và người duyệt'
        );
        this.employeeGroups = [];
        this.approverGroups = [];
      },
    });
  }

  setupFormData(): void {
    if (this.enfData) {
      this.selectedEmployeeId = this.enfData.EmployeeID ?? null;
      this.selectedApprovedId = this.enfData.ApprovedTP ?? null;
      this.dayWork = this.enfData.DayWork
        ? new Date(this.enfData.DayWork)
        : null;
      this.selectedType = this.enfData.Type ?? 1;
      this.note = this.enfData.Note || '';
      this.reasonHREdit = this.enfData.ReasonHREdit || '';
      this.reasonDeciline = this.enfData.ReasonDeciline || '';
    } else {
      this.dayWork = new Date();
      this.selectedType = 1;
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
    return !!(
      this.selectedEmployeeId &&
      this.selectedApprovedId &&
      this.dayWork &&
      this.selectedType
    );
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (!this.selectedEmployeeId) errors.push('Vui lòng chọn người đăng ký');
    if (!this.selectedApprovedId) errors.push('Vui lòng chọn người duyệt');
    if (!this.dayWork) errors.push('Vui lòng chọn ngày');
    if (!this.selectedType) errors.push('Vui lòng chọn loại quên chấm công');
    return errors;
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  async checkDuplicateENF(): Promise<boolean> {
    const id = this.enfData?.ID || 0;
    const employeeId = this.selectedEmployeeId!;
    const dayWork = this.dayWork
      ? this.dayWork.toISOString().split('T')[0]
      : '';
    const type = this.selectedType!;
    return this.enfService
      .checkDuplicateENF(id, employeeId, dayWork, type)
      .toPromise()
      .then((res) => res?.status === 1 && res.data === true)
      .catch(() => false);
  }

  async saveENF(): Promise<void> {
    // Combine all validation checks
    const validationErrors: string[] = [];
    
    if (!this.isFormValid()) {
      validationErrors.push(...this.getValidationErrors());
    }
    
    if (this.isEditMode && !this.reasonHREdit?.trim()) {
      validationErrors.push('Vui lòng nhập lý do chỉnh sửa thông tin');
    }
    
    if (validationErrors.length > 0) {
      this.notification.warning('Thông tin không hợp lệ', validationErrors.join(', '));
      return;
    }

    const id = this.enfData?.ID || 0;
    const employeeId = this.selectedEmployeeId!;
    const dayWorkStr =
      this.dayWork instanceof Date
        ? this.dayWork.toISOString().split('T')[0]
        : this.dayWork;
    const type = this.selectedType!;

    // Check duplicate trước khi lưu
    const isDuplicate = await this.enfService
      .checkDuplicateENF(id, employeeId, dayWorkStr || '', type)
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
      ApprovedTP: this.selectedApprovedId!,
      DayWork: this.dayWork!,
      Type: type,
      Note: this.note?.trim() || '',
      ReasonHREdit: this.reasonHREdit?.trim() || '',
      // ... các trường khác nếu cần
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
        if (response && (response.status === 1 || response.Success)) {
          this.notification.success('Thành công', 'Đã lưu dữ liệu thành công!');
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
        } else {
          this.notification.error(
            'Lỗi',
            response?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
          );
        }
        this.saving = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể lưu dữ liệu!');
        this.saving = false;
      },
    });
  }


}
