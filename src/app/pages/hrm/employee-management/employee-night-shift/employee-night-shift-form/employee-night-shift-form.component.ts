import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DateTime } from 'luxon';
import { EmployeeNightShiftService } from '../employee-night-shift-service/employee-night-shift.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { WFHService } from '../../employee-wfh/WFH-service/WFH.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AuthService } from '../../../../../auth/auth.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { OverTimeComponent } from '../../../over-time/over-time.component';
import { OverTimeDetailComponent } from '../../../over-time/over-time-detail/over-time-detail.component';
import { OverTimePersonFormComponent } from '../../../over-time/over-time-person/over-time-person-form/over-time-person-form.component';




@Component({
  selector: 'app-employee-night-shift-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzGridModule,
    NzTabsModule,
    HasPermissionDirective,
  ],
  templateUrl: './employee-night-shift-form.component.html',
  styleUrl: './employee-night-shift-form.component.css'
})
export class EmployeeNightShiftFormComponent implements OnInit {
  @Input() dataInput: any = null; // Dữ liệu khi sửa
  @Input() allEmployees: any[] = []; // Danh sách nhân viên
  @Input() allApprovers: any[] = []; // Danh sách người duyệt (có thể dùng chung với employees)

  formGroup!: FormGroup;
  isEditMode: boolean = false;
  employees: { department: string, list: any[] }[] = [];
  approvers: { department: string, list: any[] }[] = [];
  dateFormat = 'dd/MM/yyyy HH:mm';
  currentUser: any = null;
  isSelfDeclaration: boolean = false; // Người đăng nhập tự khai báo
  datePickerKey: number = 0; // Key để force re-render date picker
  tabs: string[] = [];
  private _selectedIndex = 0;
  tabFormData: { [key: number]: any } = {}; // Lưu dữ liệu form của mỗi tab
  tabDatePickerKeys: { [key: number]: number } = {}; // Key để force re-render date picker cho mỗi tab

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  set selectedIndex(value: number) {
    if (value !== this._selectedIndex && value >= 0 && value < this.tabs.length) {
      // Lưu dữ liệu tab hiện tại trước khi chuyển
      this.saveTabData(this._selectedIndex);

      // Cập nhật selectedIndex
      this._selectedIndex = value;

      // Load dữ liệu tab mới
      this.loadTabData(value);
    }
  }

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private employeeNightShiftService: EmployeeNightShiftService,
    private vehicleRepairService: VehicleRepairService,
    private authService: AuthService,
    private wfhService: WFHService,
    private modalService: NgbModal,
    private modal: NzModalService,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Set lại isEditMode vì dataInput chỉ có sau khi component khởi tạo
    this.isEditMode = this.dataInput && this.dataInput.ID > 0;

    // Khởi tạo tab đầu tiên với ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDateForTab(today);
    this.tabs = [todayStr];

    // Khởi tạo dữ liệu cho tab đầu tiên
    this.tabFormData[0] = {
      DateRegister: new Date(today),
      DateStart: null,
      DateEnd: null,
      BreaksTime: 0,
      TotalHours: 0,
      Location: '',
      Note: '',
      IsProblem: false,
      ReasonHREdit: '',
      ID: 0
    };
    this.tabDatePickerKeys[0] = 0;

    // Nếu là edit mode, thêm validator cho ReasonHREdit
    if (this.isEditMode) {
      this.formGroup.get('ReasonHREdit')?.setValidators([Validators.required]);
      this.formGroup.get('ReasonHREdit')?.updateValueAndValidity();
      this.formGroup.get('ReasonHREdit')?.enable();

      // Disable EmployeeID and ApprovedTBP in edit mode
      this.formGroup.get('EmployeeID')?.disable();
      this.formGroup.get('ApprovedTBP')?.disable();
    } else {
      this.formGroup.get('EmployeeID')?.disable();

    }

    this.loadEmployees();
    this.loadApprovers();

    // Lấy thông tin user trước, sau đó mới populate form
    this.getCurrentUser();

    // Subscribe để tính toán số giờ tự động
    this.setupHourCalculation();

    // Load dữ liệu tab đầu tiên vào form
    this.loadTabData(0);
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;

        if (this.currentUser && this.currentUser.ID) {
          if (!this.isEditMode) {
            // Thêm mới: Tự động set EmployeeID là người đăng nhập nhưng vẫn cho phép thay đổi
            this.isSelfDeclaration = true;
            this.formGroup.patchValue({
              EmployeeID: this.currentUser.EmployeeID
            });
            // Không disable field EmployeeID để người dùng vẫn có thể thay đổi
          } else {
            // Sửa: Populate form sau khi đã có currentUser
            if (this.dataInput) {
              this.populateForm();
            }
          }
        } else {
          // Nếu không lấy được user, vẫn populate form nếu đang sửa
          if (this.isEditMode && this.dataInput) {
            this.populateForm();
          }
        }
      },
      error: (err: any) => {
        console.error('Lỗi lấy thông tin người dùng:', err);
        // Nếu lỗi, vẫn populate form nếu đang sửa
        if (this.isEditMode && this.dataInput) {
          this.populateForm();
        }
      }
    });
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      ID: [0],
      EmployeeID: [null, [Validators.required, this.employeeIdValidator]],
      ApprovedTBP: [null, [Validators.required, this.approverIdValidator]],
      DateRegister: [null, [Validators.required]],
      DateStart: [null, [Validators.required, this.dateStartValidator]],
      DateEnd: [null, [Validators.required, this.dateEndValidator]],
      BreaksTime: [0, [Validators.min(0), Validators.max(24), this.breaksTimeValidator]],
      TotalHours: [{ value: 0, disabled: true }], // Tự động tính
      Location: ['', [Validators.required]],
      Note: [''],
      IsProblem: [false],
      ReasonHREdit: [''], // Chỉ required khi sửa
    });
  }

  employeeIdValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value <= 0) {
      return { required: true, message: 'Vui lòng chọn nhân viên.' };
    }
    return null;
  };

  approverIdValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value <= 0) {
      return { required: true, message: 'Vui lòng chọn Người duyệt.' };
    }
    return null;
  };

  // Validator: Chỉ cho phép khai báo sau 8h tối (20:00) và kiểm tra đăng ký bổ sung
  dateRegisterValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // Required validator sẽ xử lý
    }

    const now = new Date();
    const selectedDate = new Date(value);

    // So sánh ngày (bỏ qua giờ)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    // Kiểm tra IsProblem từ formGroup
    const isProblem = this.formGroup?.get('IsProblem')?.value || false;



    // Nếu chọn ngày hôm nay, phải sau 20:00
    if (selected.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (currentHour < 20) {
        return {
          before8PM: true,
          message: 'Chỉ được khai báo làm đêm sau 20:00 (8h tối).'
        };
      }
    }

    return null;
  };

  // Validator: Thời gian bắt đầu phải sau 20:00, nhỏ hơn thời gian kết thúc và cùng ngày với DateRegister
  dateStartValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // Required validator sẽ xử lý
    }

    const dateStart = new Date(value);
    if (!value) {
      return null;
    }


    const hour = dateStart.getHours();

    if (hour < 20) {
      return {
        before8PM: true,
        message: 'Thời gian bắt đầu làm đêm phải sau 20:00 (8h tối).'
      };
    }

    // Kiểm tra DateStart phải cùng ngày với DateRegister
    const dateRegister = this.formGroup?.get('DateRegister')?.value;
    if (dateRegister) {
      const registerDate = new Date(dateRegister);
      registerDate.setHours(0, 0, 0, 0);
      registerDate.setMinutes(0, 0);
      registerDate.setSeconds(0, 0);
      registerDate.setMilliseconds(0);

      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      startDate.setMinutes(0, 0);
      startDate.setSeconds(0, 0);
      startDate.setMilliseconds(0);

      if (startDate.getTime() !== registerDate.getTime()) {
        return {
          differentDate: true,
          message: 'Thời gian bắt đầu phải cùng ngày với ngày đăng ký.'
        };
      }
    }

    // Kiểm tra DateStart < DateEnd
    const dateEnd = this.formGroup?.get('DateEnd')?.value;
    if (dateEnd) {
      const dateEndObj = new Date(dateEnd);
      if (dateStart.getTime() >= dateEndObj.getTime()) {
        return {
          startAfterEnd: true,
          message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.'
        };
      }
    }

    return null;
  };

  // Validator: Thời gian kết thúc phải lớn hơn thời gian bắt đầu và không vượt quá 24 giờ
  dateEndValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // Required validator sẽ xử lý
    }

    const dateEnd = new Date(value);
    const dateStart = this.formGroup?.get('DateStart')?.value;

    if (dateStart) {
      const dateStartObj = new Date(dateStart);
      if (dateEnd.getTime() <= dateStartObj.getTime()) {
        return {
          endBeforeStart: true,
          message: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'
        };
      }

      // Kiểm tra khoảng thời gian không vượt quá 24 giờ
      const diffMs = dateEnd.getTime() - dateStartObj.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 24) {
        return {
          exceed24Hours: true,
          message: 'Khoảng thời gian làm đêm không được vượt quá 24 giờ.'
        };
      }
    }

    return null;
  };

  // Validator: Giờ nghỉ không được lớn hơn 24
  breaksTimeValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) {
      return null; // Required validator sẽ xử lý nếu cần
    }

    if (value > 24) {
      return {
        exceed24Hours: true,
        message: 'Giờ nghỉ không được lớn hơn 24 giờ.'
      };
    }

    return null;
  };

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const rawEmployees = (res?.data || []).filter((emp: any) => emp.Status === 0);

        // Group by DepartmentName
        const grouped = rawEmployees.reduce((acc: any, curr: any) => {
          const dept = curr.DepartmentName || 'Khác';
          if (!acc[dept]) {
            acc[dept] = [];
          }
          acc[dept].push(curr);
          return acc;
        }, {});

        this.employees = Object.keys(grouped).map(dept => ({
          department: dept,
          list: grouped[dept]
        }));
      },
      error: (res: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, res.error.message || 'Không thể tải danh sách nhân viên');
      },
    });
  }

  loadApprovers(): void {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const rawApprovers = res.data.approvers || [];

          // Group by DepartmentName
          const grouped = rawApprovers.reduce((acc: any, curr: any) => {
            const dept = curr.DepartmentName || 'Khác';
            if (!acc[dept]) {
              acc[dept] = [];
            }
            // Map to match the structure expected by the template if needed, 
            // or just push the object if it has ID, Code, FullName
            acc[dept].push({
              ID: curr.EmployeeID, // WFH service returns EmployeeID for approvers
              Code: curr.Code,
              FullName: curr.FullName
            });
            return acc;
          }, {});

          this.approvers = Object.keys(grouped).map(dept => ({
            department: dept,
            list: grouped[dept]
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không thể tải danh sách người duyệt');
        }
      },
      error: (res: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể tải danh sách người duyệt');
      },
    });
  }

  populateForm(): void {
    if (!this.dataInput) return;

    const data = this.dataInput;

    // Parse DateRegister (chỉ ngày, không có giờ)
    let dateRegister: Date | null = null;
    if (data.DateRegister) {
      const dt = DateTime.fromISO(data.DateRegister);
      if (dt.isValid) {
        dateRegister = dt.startOf('day').toJSDate();
      }
    }

    // Parse DateStart và DateEnd
    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;

    if (data.DateStart) {
      const dt = DateTime.fromISO(data.DateStart);
      if (dt.isValid) {
        dateStart = dt.toJSDate();
      }
    } else if (dateRegister) {
      // Mặc định: 18:00
      dateStart = new Date(dateRegister);
      dateStart.setHours(18, 0, 0, 0);
    }

    if (data.DateEnd) {
      const dt = DateTime.fromISO(data.DateEnd);
      if (dt.isValid) {
        dateEnd = dt.toJSDate();
      }
    } else if (dateRegister && data.TotalHours) {
      // Tính từ TotalHours
      const totalMs = (data.TotalHours + (data.BreaksTime || 0)) * 60 * 60 * 1000;
      dateEnd = new Date(dateStart ? dateStart.getTime() + totalMs : dateRegister.getTime() + totalMs);
    } else if (dateStart) {
      // Mặc định: +8 giờ
      dateEnd = new Date(dateStart.getTime() + 8 * 60 * 60 * 1000);
    }

    // Đảm bảo ReasonHREdit được enable trước khi patchValue
    if (this.isEditMode) {
      this.formGroup.get('ReasonHREdit')?.enable();
      this.formGroup.get('ReasonHREdit')?.setValidators([Validators.required]);
    }

    this.formGroup.patchValue({
      ID: data.ID || 0,
      EmployeeID: data.EmployeeID || null,
      ApprovedTBP: data.ApprovedTBP || null,
      DateRegister: dateRegister,
      DateStart: dateStart,
      DateEnd: dateEnd,
      BreaksTime: data.BreaksTime || 0,
      TotalHours: data.TotalHours || 0,
      Location: data.Location || '',
      Note: data.Note || '',
      IsProblem: data.IsProblem || false,
      ReasonHREdit: data.ReasonHREdit || '',
    }, { emitEvent: false });

    // Kiểm tra nếu EmployeeID khác currentUser thì enable lại field (chỉ khi thêm mới)
    if (!this.isEditMode && this.currentUser && data.EmployeeID !== this.currentUser.ID) {
      this.isSelfDeclaration = false;
      this.formGroup.get('EmployeeID')?.enable();
    }

    // Tính lại TotalHours từ DateStart và DateEnd
    if (dateStart && dateEnd) {
      this.updateTotalHoursWithBreaks();
    }

    // Update validity cho ReasonHREdit sau khi patchValue
    if (this.isEditMode) {
      this.formGroup.get('ReasonHREdit')?.updateValueAndValidity();
    }

    // Lưu dữ liệu vào tab đầu tiên sau khi populate
    this.saveTabData(0);

    // Cập nhật tên tab dựa trên DateRegister
    if (dateRegister) {
      this.updateTabTitle(0, dateRegister);
    }
  }

  setupHourCalculation(): void {
    // Khi IsProblem thay đổi, kiểm tra và clear DateRegister nếu không hợp lệ
    this.formGroup.get('IsProblem')?.valueChanges.subscribe((isProblem: boolean) => {
      // Force re-render date picker để cập nhật disabled dates
      this.datePickerKey++;

      // Validate lại DateRegister khi IsProblem thay đổi
      this.formGroup.get('DateRegister')?.updateValueAndValidity();

      // Đợi một chút để date picker re-render xong
      setTimeout(() => {
        const currentDate = this.formGroup.get('DateRegister')?.value;
        if (currentDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const selectedDate = new Date(currentDate);
          selectedDate.setHours(0, 0, 0, 0);

          // Removed auto-clear logic to allow any date selection
          /*
          let shouldClear = false;
          
          if (!isProblem) {
             if (selectedDate.getTime() < today.getTime()) {
              shouldClear = true;
            }
          } else {
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            if (selectedDate.getTime() < firstDayOfMonth.getTime() || selectedDate.getTime() > today.getTime()) {
              shouldClear = true;
            }
          }
          
          if (shouldClear) {
            this.formGroup.patchValue({ DateRegister: null }, { emitEvent: false });
          }
          */
        }
      }, 100);
    });

    // Khi DateRegister thay đổi, cập nhật DateStart và DateEnd
    this.formGroup.get('DateRegister')?.valueChanges.subscribe((date: Date | null) => {
      if (date) {
        const dateStart = this.formGroup.get('DateStart')?.value;
        const dateEnd = this.formGroup.get('DateEnd')?.value;

        if (dateStart) {
          const newDateStart = new Date(date);
          newDateStart.setHours(dateStart.getHours(), dateStart.getMinutes(), 0, 0);
          this.formGroup.patchValue({ DateStart: newDateStart }, { emitEvent: false });
        }

        if (dateEnd) {
          const newDateEnd = new Date(date);
          newDateEnd.setHours(dateEnd.getHours(), dateEnd.getMinutes(), 0, 0);
          this.formGroup.patchValue({ DateEnd: newDateEnd }, { emitEvent: false });
        }

        // Validate lại DateStart để đảm bảo cùng ngày với DateRegister
        this.formGroup.get('DateStart')?.updateValueAndValidity();
      }
    });

    // Tính tổng giờ khi DateStart hoặc DateEnd thay đổi
    this.formGroup.get('DateStart')?.valueChanges.subscribe(() => {
      // Validate DateEnd khi DateStart thay đổi
      this.formGroup.get('DateEnd')?.updateValueAndValidity();
      this.updateTotalHoursWithBreaks();
    });

    this.formGroup.get('DateEnd')?.valueChanges.subscribe(() => {
      // Validate DateStart khi DateEnd thay đổi
      this.formGroup.get('DateStart')?.updateValueAndValidity();
      this.updateTotalHoursWithBreaks();
    });

    // Cập nhật TotalHours khi BreaksTime thay đổi
    this.formGroup.get('BreaksTime')?.valueChanges.subscribe(() => {
      this.updateTotalHoursWithBreaks();
      // Tự động lưu dữ liệu tab hiện tại khi form thay đổi
      this.saveTabData(this.selectedIndex);
    });

    // Tự động lưu dữ liệu tab hiện tại khi các field thay đổi (trừ EmployeeID và ApprovedTBP là chung)
    this.formGroup.get('DateRegister')?.valueChanges.subscribe((date: Date | null) => {
      this.saveTabData(this.selectedIndex);
      // Cập nhật tên tab khi DateRegister thay đổi
      if (date) {
        this.updateTabTitle(this.selectedIndex, date);
      }
    });
    this.formGroup.get('DateStart')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
    this.formGroup.get('DateEnd')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
    this.formGroup.get('Location')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
    this.formGroup.get('Note')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
    this.formGroup.get('IsProblem')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
    this.formGroup.get('ReasonHREdit')?.valueChanges.subscribe(() => {
      this.saveTabData(this.selectedIndex);
    });
  }

  updateTotalHoursWithBreaks(): void {
    const dateStart = this.formGroup.get('DateStart')?.value;
    const dateEnd = this.formGroup.get('DateEnd')?.value;
    const breaksTime = this.formGroup.get('BreaksTime')?.value || 0;

    if (dateStart && dateEnd) {
      const start = new Date(dateStart);
      const end = new Date(dateEnd);

      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Kiểm tra khoảng thời gian không vượt quá 24 giờ
        if (diffHours > 24) {
          // Set error cho DateEnd
          this.formGroup.get('DateEnd')?.setErrors({
            exceed24Hours: true,
            message: 'Khoảng thời gian làm đêm không được vượt quá 24 giờ.'
          });
          this.formGroup.patchValue({ TotalHours: 0 }, { emitEvent: false });
          return;
        } else {
          // Clear error nếu hợp lệ
          const dateEndErrors = this.formGroup.get('DateEnd')?.errors;
          if (dateEndErrors?.['exceed24Hours']) {
            const newErrors = { ...dateEndErrors };
            delete newErrors['exceed24Hours'];
            this.formGroup.get('DateEnd')?.setErrors(Object.keys(newErrors).length > 0 ? newErrors : null);
          }
        }

        // Tổng số giờ = (DateEnd - DateStart) - BreaksTime
        const finalHours = Math.max(0, diffHours - breaksTime);

        // Kiểm tra TotalHours không được lớn hơn 24
        if (finalHours > 24) {
          // Set error cho DateEnd vì khoảng thời gian quá dài
          const dateEndErrors = this.formGroup.get('DateEnd')?.errors || {};
          this.formGroup.get('DateEnd')?.setErrors({
            ...dateEndErrors,
            exceed24Hours: true,
            message: 'Tổng số giờ làm đêm không được vượt quá 24 giờ.'
          });
        } else {
          // Clear error nếu hợp lệ (chỉ clear error từ TotalHours, giữ lại các error khác)
          const dateEndErrors = this.formGroup.get('DateEnd')?.errors;
          if (dateEndErrors?.['exceed24Hours'] && dateEndErrors?.['message']?.includes('Tổng số giờ')) {
            const newErrors = { ...dateEndErrors };
            delete newErrors['exceed24Hours'];
            delete newErrors['message'];
            this.formGroup.get('DateEnd')?.setErrors(Object.keys(newErrors).length > 0 ? newErrors : null);
          }
        }

        this.formGroup.patchValue({ TotalHours: finalHours }, { emitEvent: false });
      }
    }
  }

  onSave(): void {
    // Lưu dữ liệu tab hiện tại trước khi save
    this.saveTabData(this.selectedIndex);

    // Validate tất cả các tabs
    const commonFormValue = this.formGroup.getRawValue();
    const employeeID = commonFormValue.EmployeeID || this.dataInput?.EmployeeID;
    const approvedTBP = commonFormValue.ApprovedTBP || this.dataInput?.ApprovedTBP;

    if (!employeeID || employeeID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    if (!approvedTBP || approvedTBP <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn người duyệt!');
      return;
    }

    const payload: any[] = [];
    let hasError = false;
    let errorMessage = '';

    // Validate và tạo payload cho từng tab
    for (let i = 0; i < this.tabs.length; i++) {
      const tabData = this.tabFormData[i];
      if (!tabData) continue;

      // Validate tab data
      if (!tabData.DateRegister) {
        hasError = true;
        errorMessage = `Ca ${i + 1}: Vui lòng chọn ngày đăng ký!`;
        break;
      }

      if (!tabData.DateStart) {
        hasError = true;
        errorMessage = `Ca ${i + 1}: Vui lòng chọn thời gian bắt đầu!`;
        break;
      }

      if (!tabData.DateEnd) {
        hasError = true;
        errorMessage = `Ca ${i + 1}: Vui lòng chọn thời gian kết thúc!`;
        break;
      }

      if (!tabData.Location || !tabData.Location.trim()) {
        hasError = true;
        errorMessage = `Ca ${i + 1}: Vui lòng nhập địa điểm/lý do!`;
        break;
      }

      const dateStart = new Date(tabData.DateStart);
      const dateEnd = new Date(tabData.DateEnd);

      if (dateStart >= dateEnd) {
        hasError = true;
        errorMessage = `Ca ${i + 1}: Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!`;
        break;
      }

      // Lấy DateRegister (ngày làm thêm)
      const dateRegisterValue = tabData.DateRegister || dateStart;
      const dateRegisterFinal = DateTime.fromJSDate(dateRegisterValue).startOf('day').toJSDate();

      // Lấy ReasonHREdit - đảm bảo lấy được giá trị
      let reasonHREdit = '';
      if (this.isEditMode && tabData.ReasonHREdit) {
        reasonHREdit = tabData.ReasonHREdit.trim();
      }

      payload.push({
        ID: tabData.ID || 0,
        EmployeeID: employeeID,
        ApprovedTBP: approvedTBP,
        DateRegister: DateTime.fromJSDate(dateRegisterFinal).toISO(),
        DateStart: DateTime.fromJSDate(dateStart).toISO(),
        DateEnd: DateTime.fromJSDate(dateEnd).toISO(),
        TotalHours: tabData.TotalHours || 0,
        BreaksTime: tabData.BreaksTime || 0,
        Location: tabData.Location?.trim() || '',
        Note: tabData.Note?.trim() || '',
        IsProblem: tabData.IsProblem || false,
        ReasonHREdit: reasonHREdit,
        IsDeleted: false,
        IsApprovedTBP: this.isEditMode ? undefined : 0,
        IsApprovedHR: this.isEditMode ? undefined : 0,
        ApprovedHR: this.isEditMode ? undefined : 0,
      });
    }

    if (hasError) {
      this.notification.warning('Thông báo', errorMessage);
      return;
    }

    if (payload.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    this.employeeNightShiftService.saveData(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thành công', res.message || 'Lưu dữ liệu thành công!');
          this.activeModal.close(true);
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể lưu dữ liệu!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi lưu:', err);
        const errorMessage = err?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onAddOverTime(): void {
    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

  }

  getErrorMessage(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) {
      switch (controlName) {
        case 'EmployeeID': return 'Vui lòng chọn nhân viên.';
        case 'ApprovedTBP': return 'Vui lòng chọn Người duyệt.';
        case 'DateRegister':
          if (errors['notTodayWithoutProblem']) {
            return 'Bạn không thể đăng ký những ngày trước khi không đăng ký bổ sung.';
          }
          if (errors['before8PM']) {
            return 'Chỉ được khai báo làm đêm sau 20:00 (8h tối).';
          }
          return 'Vui lòng chọn Ngày đăng ký.';
        case 'DateStart':
          if (errors['differentDate']) {
            return 'Thời gian bắt đầu phải cùng ngày với ngày đăng ký.';
          }
          if (errors['before8PM']) {
            return 'Thời gian bắt đầu làm đêm phải sau 20:00 (8h tối).';
          }
          if (errors['startAfterEnd']) {
            return 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.';
          }
          return 'Vui lòng chọn thời gian bắt đầu.';
        case 'DateEnd':
          if (errors['exceed24Hours']) {
            // Kiểm tra xem lỗi đến từ validator (khoảng thời gian) hay từ TotalHours
            if (errors['message'] && errors['message'].includes('Tổng số giờ')) {
              return 'Tổng số giờ làm đêm không được vượt quá 24 giờ.';
            }
            return 'Khoảng thời gian làm đêm không được vượt quá 24 giờ.';
          }
          if (errors['endBeforeStart']) {
            return 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.';
          }
          return 'Vui lòng chọn thời gian kết thúc.';
        case 'BreaksTime':
          if (errors['exceed24Hours']) {
            return 'Giờ nghỉ không được lớn hơn 24 giờ.';
          }
          if (errors['min']) {
            return 'Giờ nghỉ không được nhỏ hơn 0.';
          }
          if (errors['max']) {
            return 'Giờ nghỉ không được lớn hơn 24 giờ.';
          }
          return '';
        case 'Location': return 'Vui lòng nhập Lý do.';
        case 'ReasonHREdit': return 'Vui lòng nhập Lý do sửa.';
        default: return 'Trường này là bắt buộc.';
      }
    }
    if (errors['message']) {
      return errors['message'];
    }
    return '';
  }

  filterOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const label = option.nzLabel?.toLowerCase() || '';
    return label.includes(searchText);
  };

  formatNumber = (value: number): string => {
    return value ? value.toFixed(2) : '0.00';
  };

  // Disable date dựa vào min/max date
  disabledDate(current: Date): boolean {
    return false;
  };

  // Disable date cho DateStart: chỉ disable ngày, không ảnh hưởng đến việc chọn giờ
  disabledDateForDateStart(current: Date): boolean {
    if (!current) return true;

    try {
      const dateRegister = this.formGroup?.get('DateRegister')?.value;
      const isProblem = this.formGroup?.get('IsProblem')?.value || false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today.setMinutes(0, 0);
      today.setSeconds(0, 0);
      today.setMilliseconds(0);

      const selectedDate = new Date(current);
      selectedDate.setHours(0, 0, 0, 0);
      selectedDate.setMinutes(0, 0);
      selectedDate.setSeconds(0, 0);
      selectedDate.setMilliseconds(0);

      if (dateRegister) {
        // Nếu đã chọn DateRegister, chỉ cho phép chọn ngày giống với DateRegister
        const registerDate = new Date(dateRegister);
        registerDate.setHours(0, 0, 0, 0);
        registerDate.setMinutes(0, 0);
        registerDate.setSeconds(0, 0);
        registerDate.setMilliseconds(0);

        // Disable tất cả các ngày khác với DateRegister
        return selectedDate.getTime() !== registerDate.getTime();
      }

      return false;
    } catch (error) {
      console.error('Error in disabledDateForDateStart:', error);
      return false; // Nếu có lỗi, cho phép chọn để không block hoàn toàn
    }
  };

  // Tabs management methods
  newTab(): void {
    const newTabIndex = this.tabs.length;

    // Tính ngày tiếp theo dựa trên tab cuối cùng hoặc ngày hôm nay nếu không có tab nào
    let nextDate: Date;
    if (newTabIndex > 0 && this.tabFormData[newTabIndex - 1]?.DateRegister) {
      // Lấy ngày của tab cuối cùng và cộng thêm 1 ngày
      const lastDate = new Date(this.tabFormData[newTabIndex - 1].DateRegister);
      nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
    } else {
      // Nếu không có tab nào, lấy ngày mai
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
    }

    const nextDateStr = this.formatDateForTab(nextDate);
    this.tabs.push(nextDateStr);

    // Khởi tạo dữ liệu cho tab mới với ngày tiếp theo
    this.tabFormData[newTabIndex] = {
      DateRegister: new Date(nextDate),
      DateStart: null,
      DateEnd: null,
      BreaksTime: 0,
      TotalHours: 0,
      Location: '',
      Note: '',
      IsProblem: false,
      ReasonHREdit: '',
      ID: 0
    };
    this.tabDatePickerKeys[newTabIndex] = 0;

    // Set selectedIndex sẽ tự động lưu tab cũ và load tab mới
    this._selectedIndex = newTabIndex;
    this.loadTabData(newTabIndex);
  }

  closeTab({ index }: { index: number }): void {
    if (this.tabs.length <= 1) {
      this.notification.warning('Thông báo', 'Phải có ít nhất một ca làm đêm');
      return;
    }

    // Lưu dữ liệu tab hiện tại trước khi xóa (nếu đang ở tab bị xóa)
    if (this._selectedIndex === index) {
      this.saveTabData(this._selectedIndex);
    }

    // Xóa dữ liệu tab
    delete this.tabFormData[index];
    delete this.tabDatePickerKeys[index];

    // Xóa tab khỏi mảng
    this.tabs.splice(index, 1);

    // Điều chỉnh selectedIndex và re-index dữ liệu
    const newTabFormData: { [key: number]: any } = {};
    const newTabDatePickerKeys: { [key: number]: number } = {};

    // Re-index: tất cả các tab sau index bị xóa sẽ dịch lên 1
    Object.keys(this.tabFormData).forEach((key: string) => {
      const oldIndex = parseInt(key);
      if (oldIndex < index) {
        newTabFormData[oldIndex] = this.tabFormData[oldIndex];
        newTabDatePickerKeys[oldIndex] = this.tabDatePickerKeys[oldIndex];
      } else if (oldIndex > index) {
        newTabFormData[oldIndex - 1] = this.tabFormData[oldIndex];
        newTabDatePickerKeys[oldIndex - 1] = this.tabDatePickerKeys[oldIndex];
      }
    });
    this.tabFormData = newTabFormData;
    this.tabDatePickerKeys = newTabDatePickerKeys;

    // Điều chỉnh selectedIndex (sử dụng _selectedIndex để tránh trigger setter)
    if (this._selectedIndex >= index && this._selectedIndex > 0) {
      this._selectedIndex--;
    } else if (this._selectedIndex >= this.tabs.length) {
      this._selectedIndex = this.tabs.length - 1;
    }

    // Cập nhật tên tab dựa trên DateRegister của mỗi tab
    this.updateAllTabTitles();

    // Load dữ liệu tab mới được chọn (không cần trigger setter vì đã lưu ở trên)
    this.loadTabData(this._selectedIndex);
  }


  saveTabData(index: number): void {
    const formValue = this.formGroup.getRawValue();
    this.tabFormData[index] = {
      DateRegister: formValue.DateRegister,
      DateStart: formValue.DateStart,
      DateEnd: formValue.DateEnd,
      BreaksTime: formValue.BreaksTime || 0,
      TotalHours: formValue.TotalHours || 0,
      Location: formValue.Location || '',
      Note: formValue.Note || '',
      IsProblem: formValue.IsProblem || false,
      ReasonHREdit: formValue.ReasonHREdit || '',
      ID: formValue.ID || 0
    };
  }

  loadTabData(index: number): void {
    const tabData = this.tabFormData[index];
    if (tabData) {
      // Tạm thời tắt valueChanges subscription để tránh vòng lặp
      this.formGroup.patchValue({
        DateRegister: tabData.DateRegister,
        DateStart: tabData.DateStart,
        DateEnd: tabData.DateEnd,
        BreaksTime: tabData.BreaksTime || 0,
        TotalHours: tabData.TotalHours || 0,
        Location: tabData.Location || '',
        Note: tabData.Note || '',
        IsProblem: tabData.IsProblem || false,
        ReasonHREdit: tabData.ReasonHREdit || '',
        ID: tabData.ID || 0
      }, { emitEvent: false });

      // Force re-render date picker
      if (!this.tabDatePickerKeys[index]) {
        this.tabDatePickerKeys[index] = 0;
      }
      this.tabDatePickerKeys[index]++;
      this.datePickerKey = this.tabDatePickerKeys[index];

      // Tính lại TotalHours nếu có DateStart và DateEnd
      if (tabData.DateStart && tabData.DateEnd) {
        this.updateTotalHoursWithBreaks();
      }

      // Cập nhật tên tab dựa trên DateRegister
      if (tabData.DateRegister) {
        this.updateTabTitle(index, new Date(tabData.DateRegister));
      }
    } else {
      // Khởi tạo dữ liệu rỗng nếu chưa có
      this.tabFormData[index] = {
        DateRegister: null,
        DateStart: null,
        DateEnd: null,
        BreaksTime: 0,
        TotalHours: 0,
        Location: '',
        Note: '',
        IsProblem: false,
        ReasonHREdit: '',
        ID: 0
      };
      if (!this.tabDatePickerKeys[index]) {
        this.tabDatePickerKeys[index] = 0;
      }
      this.tabDatePickerKeys[index]++;
      this.datePickerKey = this.tabDatePickerKeys[index];
      this.formGroup.patchValue({
        DateRegister: null,
        DateStart: null,
        DateEnd: null,
        BreaksTime: 0,
        TotalHours: 0,
        Location: '',
        Note: '',
        IsProblem: false,
        ReasonHREdit: '',
        ID: 0
      }, { emitEvent: false });
    }
  }

  getTabDatePickerKey(): number {
    return this.tabDatePickerKeys[this.selectedIndex] || 0;
  }

  // Format ngày để hiển thị trên tab (dd/MM/yyyy)
  formatDateForTab(date: Date): string {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Cập nhật tên tab dựa trên DateRegister
  updateTabTitle(index: number, date: Date | null): void {
    if (index >= 0 && index < this.tabs.length) {
      if (date) {
        this.tabs[index] = this.formatDateForTab(date);
      } else {
        // Nếu không có ngày, hiển thị "Chưa chọn ngày"
        this.tabs[index] = 'Chưa chọn ngày';
      }
    }
  }

  // Cập nhật tên tất cả các tabs dựa trên DateRegister
  updateAllTabTitles(): void {
    for (let i = 0; i < this.tabs.length; i++) {
      const tabData = this.tabFormData[i];
      if (tabData?.DateRegister) {
        this.tabs[i] = this.formatDateForTab(new Date(tabData.DateRegister));
      } else {
        this.tabs[i] = 'Chưa chọn ngày';
      }
    }
  }
}
