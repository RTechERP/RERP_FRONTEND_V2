import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { EmployeeAttendanceService, UpsertSingleAttendanceRequest } from '../employee-attendance.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-employee-attendance-manual-form',
  standalone: true,
  templateUrl: './employee-attendance-manual-form.component.html',
  styleUrls: ['./employee-attendance-manual-form.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzTimePickerModule
  ]
})
export class EmployeeAttendanceManualFormComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() editData: any = null;
  @Input() allEmployees: any[] = [];

  // Form fields
  selectedEmployeeCode: string = '';
  attendanceDate: string = '';
  checkInDate: Date | null = null;
  checkOutDate: Date | null = null;
  dayWeek: string = '';
  recordId: number = 0;

  // UI state
  saving = false;

  // Grouped employees for dropdown
  employeeGroups: any[] = [];

  constructor(
    public modal: NgbActiveModal,
    private notification: NzNotificationService,
    private svc: EmployeeAttendanceService
  ) { }

  ngOnInit(): void {
    this.buildEmployeeGroups();

    if (this.mode === 'edit' && this.editData) {
      this.populateEditData();
    } else {
      // Default: today
      const today = new Date();
      this.attendanceDate = this.formatDateForInput(today);
      this.computeDayWeek();
    }
  }

  get modalTitle(): string {
    return this.mode === 'edit' ? 'Sửa chấm công thủ công' : 'Thêm chấm công thủ công';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  // ========== Employee Dropdown ==========
  private buildEmployeeGroups(): void {
    if (!this.allEmployees || this.allEmployees.length === 0) {
      this.employeeGroups = [];
      return;
    }

    const map = new Map<string, any[]>();
    for (const emp of this.allEmployees) {
      const dept = emp.DepartmentName || 'Khác';
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    }

    this.employeeGroups = Array.from(map.entries()).map(([deptName, items]) => ({
      DepartmentName: deptName,
      items
    }));
  }

  // ========== Populate Edit Data ==========
  private populateEditData(): void {
    if (!this.editData) return;

    this.recordId = this.editData.ID || 0;
    this.selectedEmployeeCode = this.editData.Code || '';

    // Parse AttendanceDate
    if (this.editData.AttendanceDate) {
      const d = new Date(this.editData.AttendanceDate);
      if (!isNaN(d.getTime())) {
        this.attendanceDate = this.formatDateForInput(d);
      }
    }

    // Parse CheckIn time from CheckInDate or CheckIn string
    this.checkInDate = this.parseTimeToDate(this.editData.CheckInDate, this.editData.CheckIn);

    // Parse CheckOut time from CheckOutDate or CheckOut string
    this.checkOutDate = this.parseTimeToDate(this.editData.CheckOutDate, this.editData.CheckOut);

    this.computeDayWeek();
  }

  private parseTimeToDate(dateVal: any, timeStr: any): Date | null {
    if (dateVal) {
      const dt = new Date(dateVal);
      if (!isNaN(dt.getTime())) {
        const hh = dt.getHours();
        const mm = dt.getMinutes();
        if (hh === 0 && mm === 0) return null;
        const d = new Date();
        d.setHours(hh, mm, 0, 0);
        return d;
      }
    }

    const s = String(timeStr ?? '').trim();
    if (!s) return null;
    const m = s.match(/^(\d{1,2}):(\d{1,2})/);
    if (m) {
      const d = new Date();
      d.setHours(+m[1], +m[2], 0, 0);
      return d;
    }
    return null;
  }

  // ========== Date & Day of Week ==========
  onDateChange(): void {
    this.computeDayWeek();
  }

  private computeDayWeek(): void {
    if (!this.attendanceDate) {
      this.dayWeek = '';
      return;
    }
    const d = new Date(this.attendanceDate);
    if (isNaN(d.getTime())) {
      this.dayWeek = '';
      return;
    }

    const dayNames = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
    this.dayWeek = dayNames[d.getDay()] || '';
  }

  // ========== Helpers ==========
  private formatDateForInput(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private dateToTimeStr(d: Date | null): string {
    if (!d) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ========== Actions ==========
  closeModal(): void {
    this.modal.close('closed');
  }

  save(): void {
    // Validate
    if (!this.selectedEmployeeCode) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên.');
      return;
    }
    if (!this.attendanceDate) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày chấm công.');
      return;
    }

    this.saving = true;

    const request: UpsertSingleAttendanceRequest = {
      ID: this.recordId,
      Code: this.selectedEmployeeCode,
      AttendanceDate: this.attendanceDate,
      DayWeek: this.dayWeek,
      CheckIn: this.dateToTimeStr(this.checkInDate),
      CheckOut: this.dateToTimeStr(this.checkOutDate)
    };

    this.svc.upsertSingleAttendance(request).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Lưu thành công');
          this.modal.close('success');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || err?.message || 'Có lỗi xảy ra'
        );
      },
      complete: () => {
        this.saving = false;
      }
    });
  }
}
