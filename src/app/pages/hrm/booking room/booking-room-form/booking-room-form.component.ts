import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { BookingRoom, BookingRoomService } from '../booking-room.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-booking-room-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzNotificationModule,
  ],
  templateUrl: './booking-room-form.component.html',
  styleUrls: ['./booking-room-form.component.css'],
})
export class BookingRoomFormComponent implements OnInit {
  @Input() data: BookingRoom | null = null;
  @Input() isEditMode: boolean = false;
  @Input() isViewOnly: boolean = false; // Chế độ chỉ xem (ẩn nút Lưu và disable các field)
  @Input() id: number = 0; // ID để load dữ liệu khi edit

  bookingForm!: FormGroup;
  isLoading = false;
  employees: any[] = [];
  departments: any[] = [];
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;

  meetingRooms = [
    { value: 1, label: 'MEETING ROOM 1 (HỒ TÂY)' },
    { value: 2, label: 'MEETING ROOM 2 (HỒ GƯƠM)' },
    { value: 3, label: 'MEETING ROOM 3 (HỒ TRÚC BẠCH)' },
  ];

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private bookingRoomService: BookingRoomService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal
  ) {
    this.currentEmployeeId = this.appUserService.employeeID || 0;
    this.currentDepartmentId = this.appUserService.departmentID || 0;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();

    if (this.id > 0) {
      this.isEditMode = true;
      this.loadBookingRoom(this.id);
    } else if (this.data) {
      this.populateForm(this.data);
    } else {
      this.resetForm();
    }
  }

  private initializeForm(): void {
    const today = new Date();
    const defaultStartTime = new Date();
    defaultStartTime.setHours(8, 0, 0, 0);
    const defaultEndTime = new Date();
    defaultEndTime.setHours(10, 0, 0, 0);

    this.bookingForm = this.fb.group({
      ID: [0],
      MeetingRoomId: [null, [Validators.required, Validators.min(1)]],
      DateRegister: [today, Validators.required],
      StartTime: [defaultStartTime, Validators.required],
      EndTime: [defaultEndTime, Validators.required],
      Content: ['', [Validators.required, this.trimRequiredValidator]],
      EmployeeId: [this.currentEmployeeId],
      DepartmentId: [this.currentDepartmentId, [Validators.required, Validators.min(1)]],
    });

    this.bookingForm.get('StartTime')?.valueChanges.subscribe((value) => {
      if (value instanceof Date) {
        const endTime = new Date(value);
        endTime.setHours(value.getHours() + 2, value.getMinutes(), 0, 0);
        this.bookingForm.patchValue({ EndTime: endTime }, { emitEvent: false });
      }
    });
  }

  private calculateEndTime(startTime: string): string {
    if (!startTime) {
      return '10:00';
    }
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours + 2, minutes, 0, 0);
    return `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
  }

  trimRequiredValidator = (control: any) => {
    if (!control.value || typeof control.value !== 'string') {
      return { required: true };
    }
    if (control.value.trim().length === 0) {
      return { required: true };
    }
    return null;
  };

  private loadBookingRoom(id: number): void {
    // Load booking room data by ID if needed
    // For now, we'll use the data passed via @Input
    if (this.data) {
      this.populateForm(this.data);
    }
  }

  private populateForm(data: BookingRoom): void {
    const dateStr = data.DateRegister
      ? DateTime.fromISO(data.DateRegister).toFormat('yyyy-MM-dd')
      : DateTime.now().toFormat('yyyy-MM-dd');

    const startTime = new Date();
    if (data.StartTime) {
      const startDT = DateTime.fromISO(data.StartTime);
      startTime.setHours(startDT.hour, startDT.minute, 0, 0);
    } else {
      startTime.setHours(8, 0, 0, 0);
    }

    const endTime = new Date();
    if (data.EndTime) {
      const endDT = DateTime.fromISO(data.EndTime);
      endTime.setHours(endDT.hour, endDT.minute, 0, 0);
    } else {
      endTime.setHours(17, 30, 0, 0);
    }

    this.bookingForm.patchValue({
      ID: data.ID || 0,
      MeetingRoomId: data.MeetingRoomId,
      DateRegister: new Date(dateStr),
      StartTime: startTime,
      EndTime: endTime,
      Content: data.Content || '',
      EmployeeId: data.EmployeeId || this.currentEmployeeId,
      DepartmentId: data.DepartmentId || this.currentDepartmentId,
    });
  }

  private resetForm(): void {
    const today = new Date();
    const defaultStartTime = new Date();
    defaultStartTime.setHours(8, 0, 0, 0);
    const defaultEndTime = new Date();
    defaultEndTime.setHours(10, 0, 0, 0);

    this.bookingForm.patchValue({
      ID: 0,
      MeetingRoomId: null,
      DateRegister: today,
      StartTime: defaultStartTime,
      EndTime: defaultEndTime,
      Content: '',
      EmployeeId: this.currentEmployeeId,
      DepartmentId: this.currentDepartmentId,
    });
    this.bookingForm.markAsUntouched();
    this.bookingForm.markAsPristine();
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (result: any) => {
        const data = result.status === 1 ? result.data : result;
        if (Array.isArray(data)) {
          this.employees = data.map((emp: any) => ({
            value: emp.ID,
            label: `${emp.Code} - ${emp.FullName}`,
          }));
        }
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      },
    });
  }

  private loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (result: any) => {
        const data = result.status === 1 ? result.data : result;
        if (Array.isArray(data)) {
          this.departments = data.map((dept: any) => ({
            value: dept.ID,
            label: dept.Name,
          }));
        }
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      },
    });
  }

  onSave(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.bookingForm.value;
    const dateStr = DateTime.fromJSDate(formValue.DateRegister).toFormat('yyyy-MM-dd');

    const startTime = formValue.StartTime instanceof Date
      ? `${String(formValue.StartTime.getHours()).padStart(2, '0')}:${String(formValue.StartTime.getMinutes()).padStart(2, '0')}`
      : formValue.StartTime;

    const endTime = formValue.EndTime instanceof Date
      ? `${String(formValue.EndTime.getHours()).padStart(2, '0')}:${String(formValue.EndTime.getMinutes()).padStart(2, '0')}`
      : formValue.EndTime;

    const isApprovedValue = (formValue.ID && formValue.ID > 0 && this.data?.IsApproved !== undefined)
      ? this.data.IsApproved
      : 0;

    const bookingRoom: BookingRoom = {
      ID: formValue.ID || 0,
      MeetingRoomId: formValue.MeetingRoomId,
      DateRegister: dateStr,
      Content: formValue.Content.trim(),
      StartTime: `${dateStr}T${startTime}:00`,
      EndTime: `${dateStr}T${endTime}:00`,
      DepartmentId: formValue.DepartmentId || this.currentDepartmentId,
      EmployeeId: formValue.EmployeeId || this.currentEmployeeId,
      IsApproved: isApprovedValue,
    };

    this.bookingRoomService.saveBookingRoom(bookingRoom).subscribe({
      next: (result: any) => {
        this.isLoading = false;
        if (result.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            result.message || 'Cập nhật thành công!'
          );
          this.activeModal.close({ success: true, data: bookingRoom });
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            result.message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Lỗi khi lưu đặt phòng'
        );
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  disabledDate = (current: Date): boolean => {
    if (!current) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    return current < today || current > maxDate;
  };
}

