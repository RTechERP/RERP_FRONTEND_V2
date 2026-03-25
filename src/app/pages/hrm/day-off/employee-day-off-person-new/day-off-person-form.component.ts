import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DayOffService } from '../day-off-service/day-off.service';
import { AppUserService } from '../../../../services/app-user.service';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-day-off-person-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzInputNumberModule,
    NzTableModule,
    NzPopconfirmModule,
    NzCardModule,
    NzGridModule,
    TableModule
  ],
  templateUrl: './day-off-person-form.component.html',
  styleUrls: ['./day-off-person-form.component.css']
})
export class DayOffPersonFormComponent implements OnInit {
  @Input() editData: any;
  @Input() employeeList: any[] = [];
  @Input() approverList: any[] = [];
  @Input() dayOffList: any[] = [];

  groupedEmployees: { [key: string]: any[] } = {};
  canChangeEmployee = false;

  form!: FormGroup;
  isLoading = false;
  leaveTypes = [
    { label: 'Nghỉ phép', value: 2 },
    { label: 'Nghỉ không lương', value: 1 },
    { label: 'Nghỉ việc riêng có hưởng lương', value: 3 }
  ];

  timeOptions = [
    { label: 'Buổi sáng', value: 1 },
    { label: 'Buổi chiều', value: 2 },
    { label: 'Cả ngày', value: 3 }
  ];

  summaryData: any[] = [];
  isLoadingSummary = false;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private dayOffService: DayOffService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.appUserService.user$.subscribe(user => {
      this.checkPermissions();
      this.groupEmployees();
      this.loadInitialData();

      // If Edit Mode, Load full Master-Detail
      if (this.editData && this.editData.ID) {
        this.loadDetail(this.editData.ID);
      } else {
        // Load initial summary for new
        const initialEmpId = this.form.get('EmployeeID')?.value;
        if (initialEmpId) {
          this.loadEmployeeSummary(initialEmpId);
        }
        if (this.details.length === 0) {
          this.addDetail();
        }
      }
      this.cdr.markForCheck();
    });

    // Subscribe to employee changes
    this.form.get('EmployeeID')?.valueChanges.subscribe(val => {
      if (val) this.loadEmployeeSummary(val);
    });
  }

  loadDetail(id: number): void {
    this.isLoading = true;
    this.dayOffService.getMultiPhase(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 1 && res.data) {
          const master = res.data.Phase;
          let detailsList = res.data.Details || [];

          // Filter by DetailID if provided (single record edit mode)
          if (this.editData?.DetailID) {
            detailsList = detailsList.filter((d: any) => d.ID === this.editData.DetailID);
          }

          // Patch Master
          this.form.patchValue({
            ID: master.ID,
            Code: master.Code,
            EmployeeID: master.EmployeeID,
            DateRegister: master.DateRegister ? new Date(master.DateRegister) : new Date(),
            ApprovedTP: detailsList.length > 0 ? detailsList[0].ApprovedTP : null,
            Reason: master.Reason
          });

          // Patch Details
          this.details.clear();
          detailsList.forEach((d: any) => {
            const group = this.createDetailGroup();
            group.patchValue({
              ID: d.ID,
              StartDate: d.StartDate ? new Date(d.StartDate) : new Date(),
              TimeOnLeave: d.TimeOnLeave,
              TypeIsReal: d.Type || d.TypeIsReal,
              Reason: d.Reason,
              IsApprovedTP: d.IsApprovedTP,
              IsApprovedHR: d.IsApprovedHR,
              IsCancelTP: d.IsCancelTP
            });
            this.details.push(group);
          });

          this.loadEmployeeSummary(master.EmployeeID);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  checkPermissions(): void {
    const permissions = this.appUserService.currentUser?.Permissions || '';
    const permissionList = permissions.split(',').map(p => p.trim());
    const hasN1N2 = permissionList.includes('N1') || permissionList.includes('N2');

    this.canChangeEmployee = this.appUserService.isAdmin || hasN1N2;

    if (!this.canChangeEmployee) {
      this.form.get('EmployeeID')?.disable();
      this.form.get('DateRegister')?.disable();

      // If not can change, filter list to only current user
      const currentEmpID = this.appUserService.employeeID;
      console.log('DayOff Restricted (Strict):', { canChange: this.canChangeEmployee, isAdmin: this.appUserService.isAdmin, permissionList });
      if (this.employeeList && this.employeeList.length > 0) {
        const found = this.employeeList.find(e => e.EmployeeID === currentEmpID || e.ID === currentEmpID);
        if (found) {
          this.employeeList = [found];
        } else {
          // Fallback if not in list passed from parent
          this.employeeList = [{
            ID: currentEmpID,
            EmployeeID: currentEmpID,
            FullName: this.appUserService.fullName,
            Code: this.appUserService.currentUser?.Code || '',
            DepartmentName: this.appUserService.departmentName || 'Cá nhân'
          }];
        }
        this.groupEmployees();
      }
    }
  }

  departmentNamesList: string[] = [];
  groupEmployees(): void {
    this.groupedEmployees = {};
    this.departmentNamesList = [];

    this.employeeList.forEach(emp => {
      const dept = emp.DepartmentName || 'Khác';
      if (!this.groupedEmployees[dept]) {
        this.groupedEmployees[dept] = [];
        this.departmentNamesList.push(dept);
      }
      this.groupedEmployees[dept].push(emp);
    });

    // Sort employees by code within each group
    Object.keys(this.groupedEmployees).forEach(dept => {
      this.groupedEmployees[dept].sort((a: any, b: any) => (a.Code || '').localeCompare(b.Code || ''));
    });
  }

  get departmentNames(): string[] {
    return this.departmentNamesList;
  }

  disabledDate = (current: Date): boolean => {
    if (this.canChangeEmployee) {
      return false;
    }

    if (!current) {
      return false;
    }

    const today = new Date();
    const todayCopy = new Date(today);
    todayCopy.setHours(0, 0, 0, 0);

    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);

    // Rule: Không được đăng ký trước ngày hôm nay
    if (currentDate < todayCopy) return true;

    // Rule: Sau 19h không được đăng ký cho ngày hôm sau
    const nowHour = today.getHours();
    if (nowHour >= 19) {
      const tomorrow = new Date(todayCopy);
      tomorrow.setDate(todayCopy.getDate() + 1);
      if (currentDate.getTime() === tomorrow.getTime()) {
        return true;
      }
    }

    return false;
  };

  loadEmployeeSummary(employeeId: number): void {
    if (!employeeId) {
      this.summaryData = [];
      return;
    }

    this.isLoadingSummary = true;
    this.dayOffService.getEmployeeOnLeaveSummaryByEmployee(employeeId, new Date()).subscribe({
      next: (response: any) => {
        this.isLoadingSummary = false;
        if (response.status === 1 && response.data) {
          const rawData = response.data.data || [];
          // Filter for the selected employee or just take the first if it's already filtered by backend
          this.summaryData = rawData.filter((item: any) => item.EmployeeID === employeeId);
          if (this.summaryData.length === 0 && rawData.length > 0) {
            this.summaryData = [rawData[0]];
          }
        } else {
          this.summaryData = [];
        }
      },
      error: (err: any) => {
        this.isLoadingSummary = false;
        this.summaryData = [];
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  loadInitialData(): void {
    // Data is now passed via nzData
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      Code: [{ value: '', disabled: true }],
      EmployeeID: [this.appUserService.employeeID, [Validators.required]],
      DateRegister: [new Date(), [Validators.required]],
      ApprovedTP: [null, [Validators.required]],
      Reason: [''], // Master reason
      Details: this.fb.array([])
    });
  }

  get details(): FormArray {
    return this.form.get('Details') as FormArray;
  }

  createDetailGroup(): FormGroup {
    return this.fb.group({
      ID: [0],
      StartDate: [new Date(), [Validators.required]],
      TimeOnLeave: [1, [Validators.required]], // Default All Day
      TypeIsReal: [1, [Validators.required]], // Default Leave
      Reason: ['', [Validators.required]],
      IsApprovedTP: [false],
      IsApprovedHR: [false],
      IsCancelTP: [false]
    });
  }

  addDetail(): void {
    this.details.push(this.createDetailGroup());
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  formatDateLocal(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  validateForm(detailsArr: any[]): boolean {
    if (detailsArr.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng thêm ngày nghỉ');
      return false;
    }

    // 1. Validation for overlapping sessions within the form
    const dateGroups = new Map<string, number[]>();
    for (const d of detailsArr) {
      const dateStr = new Date(d.StartDate).toLocaleDateString('vi-VN');
      if (!dateGroups.has(dateStr)) {
        dateGroups.set(dateStr, []);
      }
      dateGroups.set(dateStr, [...(dateGroups.get(dateStr) || []), parseInt(d.TimeOnLeave)]);
    }

    for (const [date, sessions] of dateGroups.entries()) {
      // Check for All Day (3) overlap with Morning (1) / Afternoon (2)
      if (sessions.includes(3) && sessions.length > 1) {
        this.notification.error(NOTIFICATION_TITLE.error, `Bạn đã đăng ký nghỉ cho ngày ${date} rồi`);
        return false;
      }
      // Check for multiple Morning (1) or multiple Afternoon (2) sessions on same day
      const sessionCounts = sessions.reduce((acc: any, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      if (sessionCounts[1] > 1 || sessionCounts[2] > 1 || sessionCounts[3] > 1) {
        this.notification.error(NOTIFICATION_TITLE.error, `Bạn đã đăng ký nghỉ cho ngày ${date} rồi`);
        return false;
      }
    }

    // 1.1 Validation for overlapping with existing registrations in the grid
    const employeeId = this.form.get('EmployeeID')?.value;
    if (this.dayOffList && this.dayOffList.length > 0) {
      for (const d of detailsArr) {
        if (!d.StartDate) continue;
        const targetDateStr = new Date(d.StartDate).toLocaleDateString('vi-VN');
        const targetSession = parseInt(d.TimeOnLeave);

        const isDuplicate = this.dayOffList.some(item => {
          if (item.EmployeeID !== employeeId) return false;
          // Skip checking against itself if editing
          if (item.ID === d.ID || item.ID === this.editData?.DetailID) return false;

          const itemDateStr = new Date(item.StartDate).toLocaleDateString('vi-VN');
          if (itemDateStr !== targetDateStr) return false;

          const itemSession = parseInt(item.TimeOnLeave);
          // Overlap rules:
          // 1 (Morning) overlaps with 1 or 3 (All Day)
          // 2 (Afternoon) overlaps with 2 or 3
          // 3 (All Day) overlaps with 1, 2, or 3
          if (targetSession === 3 || itemSession === 3) return true;
          return targetSession === itemSession;
        });

        if (isDuplicate) {
          this.notification.error(NOTIFICATION_TITLE.error, `Bạn đã đăng ký nghỉ cho ngày ${targetDateStr} rồi (đã có trong hệ thống)`);
          return false;
        }
      }
    }

    // 2. Validation for remaining leave days
    const mappedDetails = detailsArr.map((d: any) => {
      const dateOnLeave = new Date(d.StartDate);
      let totalDay: number;
      if (d.TimeOnLeave == 1 || d.TimeOnLeave == 2) totalDay = 0.5;
      else totalDay = 1;

      return { ...d, Type: d.TypeIsReal, TotalDay: totalDay };
    });

    const totalDayLeaveRequested = mappedDetails
      .filter((d: any) => d.TypeIsReal == 2) // Only "Nghỉ phép"
      .reduce((sum: number, d: any) => sum + d.TotalDay, 0);

    const dataSummary = this.summaryData[0];
    if (dataSummary && totalDayLeaveRequested > 0 && !this.canChangeEmployee) {
      const totalDayRemain = dataSummary.TotalDayRemain || 0;
      if (totalDayLeaveRequested > totalDayRemain) {
        this.notification.error(NOTIFICATION_TITLE.error, `Tổng số ngày nghỉ phép (${totalDayLeaveRequested}) vượt quá số ngày phép còn lại (${totalDayRemain}).`);
        return false;
      }
    }

    // 3. Validation for registration deadline (After 19:00 for tomorrow)
    const today = new Date();
    const nowHour = today.getHours();
    if (nowHour >= 19 && !this.canChangeEmployee) {
      const tomorrowStr = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toLocaleDateString('vi-VN');

      const hasTomorrow = detailsArr.some(d => {
        const dDateStr = new Date(d.StartDate).toLocaleDateString('vi-VN');
        return dDateStr === tomorrowStr;
      });

      if (hasTomorrow) {
        this.notification.error(NOTIFICATION_TITLE.error, `Đã quá 19h, không thể đăng ký nghỉ cho ngày ${tomorrowStr}. Vui lòng liên hệ HR hoặc quản lý.`);
        return false;
      }
    }

    return true;
  }

  submitForm(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control instanceof FormArray) {
          control.controls.forEach(c => {
            if (c instanceof FormGroup) {
              Object.keys(c.controls).forEach(childKey => {
                c.get(childKey)?.markAsDirty();
                c.get(childKey)?.updateValueAndValidity();
              });
            }
          });
        }
        control?.markAsDirty();
        control?.updateValueAndValidity();
      });
      return;
    }

    const formValue = this.form.getRawValue();
    const detailsArr = formValue.Details;

    if (!this.validateForm(detailsArr)) {
      return;
    }

    const mappedDetails = detailsArr.map((d: any) => {
      const dateOnLeave = new Date(d.StartDate);
      let startDate: Date, endDate: Date, totalTime: number, totalDay: number;

      if (d.TimeOnLeave == 1) { // Buổi sáng
        startDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 8, 0, 0);
        endDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 12, 0, 0);
        totalTime = 4;
        totalDay = 0.5;
      } else if (d.TimeOnLeave == 2) { // Buổi chiều
        startDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 13, 30, 0);
        endDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 17, 30, 0);
        totalTime = 4;
        totalDay = 0.5;
      } else { // Cả ngày
        startDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 8, 0, 0);
        endDate = new Date(dateOnLeave.getFullYear(), dateOnLeave.getMonth(), dateOnLeave.getDate(), 17, 30, 0);
        totalTime = 8;
        totalDay = 1;
      }

      return {
        ...d,
        ID: d.ID || 0,
        Type: +d.TypeIsReal, // Ép kiểu số để đảm bảo đồng bộ với TypeIsReal
        EmployeeID: formValue.EmployeeID,
        ApprovedTP: formValue.ApprovedTP,
        StartDate: this.formatDateLocal(startDate),
        EndDate: this.formatDateLocal(endDate),
        TotalTime: totalTime,
        TotalDay: totalDay,
        IsApprovedTP: false,
        IsApprovedHR: false,
        IsCancelTP: d.IsCancelTP,
        DeleteFlag: false
      };
    });

    this.isLoading = true;

    // Determine Phase min/max dates with times
    let phaseStartDateStr = mappedDetails[0].StartDate;
    let phaseEndDateStr = mappedDetails[mappedDetails.length - 1].EndDate;
    let totalDaySum = 0;

    mappedDetails.forEach((d: any) => {
      if (d.StartDate < phaseStartDateStr) phaseStartDateStr = d.StartDate;
      if (d.EndDate > phaseEndDateStr) phaseEndDateStr = d.EndDate;
      totalDaySum += d.TotalDay;
    });

    const payload = {
      Phase: {
        ID: formValue.ID || 0,
        Code: formValue.Code,
        EmployeeID: formValue.EmployeeID,
        DateRegister: this.formatDateLocal(formValue.DateRegister),
        Reason: formValue.Reason,
        StartDate: phaseStartDateStr,
        EndDate: phaseEndDateStr,
        TotalDay: totalDaySum,
       
        IsDeleted: false
      },
      Details: mappedDetails,
      IsPartialUpdate: !!this.editData?.DetailID
    };

    this.dayOffService.saveMultiPhase(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu đăng ký nghỉ phép thành công');
        this.activeModal.close(true);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }



  cancel(): void {
    this.activeModal.dismiss();
  }
}
