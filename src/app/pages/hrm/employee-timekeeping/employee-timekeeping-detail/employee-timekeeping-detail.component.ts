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
import { EmployeeTimekeepingService } from '../employee-timekeeping-service/employee-timekeeping.service';

export interface ETDetailDto {
  ID?: number;
  Name?: string;
  _Month?: number;
  _Year?: number;
  isApproved?: boolean;
  TimeType?: number;
  Note?: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  IsDelete?: boolean;
}

@Component({
  selector: 'app-employee-timekeeping-detail',
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
  templateUrl: './employee-timekeeping-detail.component.html',
  styleUrls: ['./employee-timekeeping-detail.component.css'],
})
export class EmployeeTimekeepingDetailComponent implements OnInit {
  @Input() etData: ETDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() userRole: 'employee' | 'tbp' | 'hr' = 'employee';

  // Form fields
  month: number = 0;
  year: Date = new Date(new Date().getFullYear(), 0, 1);
  note: string = '';
  toDate: Date | null = null;
  fromDate: Date | null = null;
  Name: string = '';

  saving = false;
  loading = false;

  get modalTitle(): string {
    switch (this.mode) {
      case 'add':
        return 'Thêm bảng chấm công';
      case 'edit':
        return 'Sửa bảng chấm công';
      default:
        return 'Chi tiết bảng chấm công';
    }
  }

  get isFormDisabled(): boolean {
    return this.isViewMode || this.saving;
  }
  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private etService: EmployeeTimekeepingService
  ) {}

  ngOnInit(): void {
    this.setupFormData();
  }

  setupFormData(): void {
    // Nếu có dữ liệu truyền vào thì gán lại các trường
    if (this.etData) {
      this.month = this.etData._Month || 0;
      this.year = this.etData._Year
        ? new Date(this.etData._Year, 0, 1)
        : new Date();
      this.note = this.etData.Note || '';
      this.Name = this.etData.Name || '';
      // this.fromDate = this.etData.fromDate
      //   ? new Date(this.etData.fromDate)
      //   : null;
      // this.toDate = this.etData.toDate ? new Date(this.etData.toDate) : null;
    }
    // Nếu tạo mới thì cập nhật tên bảng và ngày theo tháng/năm hiện tại
    this.onMonthOrYearChange();
  }

  onMonthOrYearChange(): void {
    if (this.month && this.year) {
      const mm = this.month.toString().padStart(2, '0');
      const yyyy =
        this.year instanceof Date ? this.year.getFullYear() : this.year;
      this.Name = `Bảng chấm công tháng ${mm}/${yyyy}`;
      this.fromDate = new Date(yyyy, this.month - 1, 1);
      this.toDate = new Date(yyyy, this.month, 0);
    }
  }

  onYearChange(year: Date): void {
    this.year = year;
    this.onMonthOrYearChange();
  }
  onMonthChange(month: number): void {
    if (!month || !this.year) return;
    const yearNum =
      this.year instanceof Date ? this.year.getFullYear() : this.year;

    this.fromDate = new Date(yearNum, month - 1, 1);
    this.toDate = new Date(yearNum, month, 0);
  }
  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (!this.month) errors.push('Chưa chọn tháng');
    if (!this.year) errors.push('Chưa chọn năm');
    if (!this.Name || !this.Name.trim())
      errors.push('Chưa nhập tên bảng chấm công');
    // Ghi chú không bắt buộc, không cần kiểm tra
    return errors;
  }

  isFormValid(): boolean {
    return this.getValidationErrors().length === 0;
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  async saveET(): Promise<void> {
    if (!this.isFormValid()) {
      this.notification.warning(
        'Thông tin không hợp lệ',
        this.getValidationErrors().join(', ')
      );
      return;
    }

    const id = this.etData?.ID || 0;
    const month = this.month;
    const year =
      this.year instanceof Date ? this.year.getFullYear() : this.year;

    // Nếu là sửa và tháng/năm không đổi thì bỏ qua check duplicate
    const isEdit = this.mode === 'edit';
    const isMonthChanged = isEdit && this.etData?._Month !== month;
    const isYearChanged = isEdit && this.etData?._Year !== year;

    if (isEdit && !isMonthChanged && !isYearChanged) {
      // Không cần check duplicate, gọi lưu luôn
      this.doSaveET(id, month, year);
      return;
    }

    // Nếu thêm mới hoặc sửa đổi tháng/năm thì check duplicate
    this.saving = true;
    this.etService
      .checkEmployeeTimekeepingDuplicate(id, month, year)
      .subscribe({
        next: (res) => {
          if (res && res.isDuplicate) {
            this.notification.error('Lỗi', 'Bảng chấm công này đã tồn tại!');
            this.saving = false;
            return;
          }
          this.doSaveET(id, month, year);
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể kiểm tra trùng!');
          this.saving = false;
        },
      });
  }

  private doSaveET(id: number, month: number, year: number): void {
    let formData: ETDetailDto = {
      ID: id,
      _Month: month,
      _Year: year,
      TimeType: 0,
      isApproved: false,
      Name: this.Name,
      Note: this.note?.trim() || '',
      CreatedBy: this.etService.LoginName,
      CreatedDate: new Date(),
      UpdatedBy: this.etService.LoginName,
      UpdatedDate: new Date(),
      IsDelete: false,
    };

    this.etService.saveData(formData).subscribe({
      next: (response: any) => {
        if (response && (response.status === 1 || response.Success)) {
          this.notification.success('Thành công', 'Đã lưu dữ liệu thành công!');
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
        } else {
          this.notification.error('Lỗi', 'Không thể lưu dữ liệu!');
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
