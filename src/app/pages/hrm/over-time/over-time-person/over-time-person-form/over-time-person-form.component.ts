import { Component, OnInit, Input, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { DateTime } from 'luxon';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OverTimeService } from '../../over-time-service/over-time.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AuthService } from '../../../../../auth/auth.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { WFHService } from '../../../employee-management/employee-wfh/WFH-service/WFH.service';
import { ProjectItemSelectModalComponent } from './project-item-select-modal/project-item-select-modal.component';
import { HomeLayoutService } from '../../../../../layouts/home-layout/home-layout-service/home-layout.service';
import flatpickr from 'flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn.js';

@Component({
  selector: 'app-over-time-person-form',
  templateUrl: './over-time-person-form.component.html',
  styleUrls: ['./over-time-person-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzSpinModule,
    NzCheckboxModule,
    NzGridModule,
    NzUploadModule,
    NzMessageModule,
    NzModalModule
  ]
})
export class OverTimePersonFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() data: any = null;
  @Input() isEditMode: boolean = false;

  overTimeForm!: FormGroup;
  commonForm!: FormGroup;
  formTabs: Array<{
    id: number;
    title: string;
    form: FormGroup;
    data: any;
    selectedFile: File | null;
    uploadedFileData: any;
    tempFileRecord: any;
    existingFileRecord: any;
    fileList: any[];
    existingFiles: any[];
    deletedFileIds: number[];
    deletedFiles: any[];
    attachFileName: string;
    flatpickrTimeStart?: flatpickr.Instance;
    flatpickrEndTime?: flatpickr.Instance;
  }> = [];
  activeTabIndex = 0;
  isLoading = false;
  typeList: any[] = [];
  approverList: any[] = [];
  approverGroups: any[] = [];
  currentUser: any = null;
  projectList: any[] = [];
  showProjectField = false;
  departmentId: number = 0;

  selectedFile: File | null = null;
  uploadedFileData: any = null;
  tempFileRecord: any = null;
  existingFileRecord: any = null;
  fileList: any[] = [];
  existingFiles: any[] = [];
  deletedFileIds: number[] = [];
  deletedFiles: any[] = [];
  attachFileName: string = '';
  isProblemValue: boolean = false;
  datePickerKey: number = 0;
  isSupplementaryRegistrationOpen: boolean = false; // Trạng thái mở đăng ký bổ sung

  // Flatpickr instances map
  private flatpickrInstances: Map<string, flatpickr.Instance> = new Map();

  private normalizeToMinute(value: any): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? new Date(value) : new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setSeconds(0, 0);
    return d;
  }

  private attachMinutePrecisionForForm(form: FormGroup): void {
    form.get('TimeStart')?.valueChanges.subscribe((v) => {
      const n = this.normalizeToMinute(v);
      if (!n) return;
      const cur = v instanceof Date ? v : new Date(v);
      if (isNaN(cur.getTime())) return;
      if (cur.getSeconds() !== 0 || cur.getMilliseconds() !== 0) {
        form.patchValue({ TimeStart: n }, { emitEvent: false });
      }
      this.calculateTotalHour(form);
    });

    form.get('EndTime')?.valueChanges.subscribe((v) => {
      const n = this.normalizeToMinute(v);
      if (!n) return;
      const cur = v instanceof Date ? v : new Date(v);
      if (isNaN(cur.getTime())) return;
      if (cur.getSeconds() !== 0 || cur.getMilliseconds() !== 0) {
        form.patchValue({ EndTime: n }, { emitEvent: false });
      }
      this.calculateTotalHour(form);
    });
  }

  private calculateTotalHour(form: FormGroup): void {
    const timeStart = form.get('TimeStart')?.value;
    const endTime = form.get('EndTime')?.value;

    if (timeStart && endTime) {
      const startDate = new Date(timeStart);
      const endDate = new Date(endTime);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0) {
          const totalHours = Math.round(diffHours * 100) / 100;
          form.patchValue({ TotalHour: totalHours }, { emitEvent: false });
        } else {
          form.patchValue({ TotalHour: null }, { emitEvent: false });
        }
      }
    } else {
      form.patchValue({ TotalHour: null }, { emitEvent: false });
    }
    this.cdr.detectChanges();
  }

  locationList = [
    { value: 0, label: '--Chọn địa điểm--' },
    { value: 1, label: 'Văn phòng' },
    { value: 2, label: 'Địa điểm công tác' },
    { value: 3, label: 'Tại nhà' },
    { value: 4, label: 'Nhà máy RTC' },
  ];

  constructor(
    private fb: FormBuilder,
    private overTimeService: OverTimeService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private projectService: ProjectService,
    private wfhService: WFHService,
    private message: NzMessageService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private homeLayoutService: HomeLayoutService
  ) {
    this.initializeForm();
    this.attachMinutePrecisionForForm(this.overTimeForm);
    this.formTabs.push({
      id: 1,
      title: '1',
      form: this.overTimeForm,
      data: null,
      selectedFile: null,
      uploadedFileData: null,
      tempFileRecord: null,
      existingFileRecord: null,
      fileList: [],
      existingFiles: [],
      deletedFileIds: [],
      deletedFiles: [],
      attachFileName: ''
    });
  }

  ngOnInit() {
    this.loadTypes();
    this.loadApprovers();
    this.loadProjects();
    this.getCurrentUser();
    this.loadConfigSystem();
    if (this.isEditMode && this.data && this.data.ID && this.data.ID > 0) {
      this.loadDataByID(this.data.ID);
    } else if (this.data) {
      this.patchFormData(this.data);
    } else {
      this.resetForm();
      this.resetCommonForm();
    }

    if (this.formTabs.length > 0) {
      this.formTabs[0].form = this.overTimeForm;
      this.loadTabState(0);
    }

    this.commonForm.get('IsProblem')?.valueChanges.subscribe((value) => {
      // Kiểm tra nếu đang bật checkbox nhưng chưa mở đăng ký bổ sung
      if (value && !this.isSupplementaryRegistrationOpen) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Nhân sự chưa mở đăng ký bổ sung');
        // Reset lại checkbox về false
        this.commonForm.patchValue({ IsProblem: false }, { emitEvent: false });
        this.isProblemValue = false;
        this.cdr.detectChanges();
        return;
      }

      this.isProblemValue = value || false;

      // Khi bỏ tích đăng ký bổ sung (IsProblem = false)
      if (!value) {
        const dateRegister = this.commonForm.get('DateRegister')?.value;

        if (dateRegister) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const registerDate = new Date(dateRegister);
          registerDate.setHours(0, 0, 0, 0);

          const isToday = registerDate.getTime() === today.getTime();
          const isYesterday = registerDate.getTime() === yesterday.getTime();

          // Nếu ngày đăng ký không phải hôm qua hoặc hôm nay, reset về hôm nay
          if (!isToday && !isYesterday) {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            // Reset DateRegister về hôm nay
            this.commonForm.patchValue({
              DateRegister: todayDate
            }, { emitEvent: false });

            // Reset TimeStart về 18:00 hôm nay
            const defaultTimeStart = new Date(todayDate);
            defaultTimeStart.setHours(18, 0, 0, 0);
            this.overTimeForm.patchValue({
              TimeStart: defaultTimeStart
            }, { emitEvent: false });

            // Reset EndTime nếu có
            const currentEndTime = this.overTimeForm.get('EndTime')?.value;
            if (currentEndTime) {
              const endTimeDate = currentEndTime instanceof Date ? currentEndTime : new Date(currentEndTime);
              const endTimeDateOnly = new Date(endTimeDate.getFullYear(), endTimeDate.getMonth(), endTimeDate.getDate());
              endTimeDateOnly.setHours(0, 0, 0, 0);

              // Nếu EndTime không phải hôm qua, hôm nay hoặc ngày mai, reset về null
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);

              if (endTimeDateOnly.getTime() !== yesterday.getTime() &&
                endTimeDateOnly.getTime() !== today.getTime() &&
                endTimeDateOnly.getTime() !== tomorrow.getTime()) {
                this.overTimeForm.patchValue({
                  EndTime: null
                }, { emitEvent: false });
              }
            }
          }
        }
      }

      this.datePickerKey++;
      this.cdr.detectChanges();

      // Cập nhật min/max dates cho Flatpickr
      this.updateFlatpickrMinMaxDates();
      // Cập nhật giá trị hiển thị trong Flatpickr
      this.formTabs.forEach((tab) => {
        this.setFlatpickrValue(tab);
      });
    });

    // Đăng ký subscriptions cho form đầu tiên
    this.attachFormValidationSubscriptions(this.overTimeForm);

    this.commonForm.get('DateRegister')?.valueChanges.subscribe((dateValue) => {
      if (dateValue) {
        const selectedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth();
        const selectedDay = selectedDate.getDate();

        // Check if selected date is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateOnly = new Date(selectedYear, selectedMonth, selectedDay);
        selectedDateOnly.setHours(0, 0, 0, 0);
        const isToday = selectedDateOnly.getTime() === today.getTime();

        // Cập nhật TimeStart cho TẤT CẢ các tab - CHỈ KHI CHƯA CÓ GIÁ TRỊ
        this.formTabs.forEach((tab) => {
          const tabForm = tab.form;
          const currentTimeStart = tabForm.get('TimeStart')?.value;

          // Chỉ set default nếu chưa có giá trị TimeStart
          if (!currentTimeStart) {
            const defaultTimeStart = new Date(selectedYear, selectedMonth, selectedDay, 18, 0, 0, 0);
            tabForm.patchValue({
              TimeStart: defaultTimeStart
            }, { emitEvent: false });
          } else {
            // Nếu đã có giá trị, chỉ cập nhật ngày, giữ nguyên giờ/phút
            const timeStartDate = currentTimeStart instanceof Date ? currentTimeStart : new Date(currentTimeStart);
            const newTimeStart = new Date(selectedYear, selectedMonth, selectedDay, timeStartDate.getHours(), timeStartDate.getMinutes(), 0, 0);
            tabForm.patchValue({
              TimeStart: newTimeStart
            }, { emitEvent: false });
          }

          const currentEndTime = tabForm.get('EndTime')?.value;
          if (currentEndTime) {
            // Nếu đã có EndTime, chỉ cập nhật ngày, giữ nguyên giờ/phút
            const endTimeDate = currentEndTime instanceof Date ? currentEndTime : new Date(currentEndTime);
            const newEndTime = new Date(selectedYear, selectedMonth, selectedDay, endTimeDate.getHours(), endTimeDate.getMinutes(), 0, 0);
            tabForm.patchValue({
              EndTime: newEndTime
            }, { emitEvent: false });
          }
        });

        // Force update date picker validation
        this.datePickerKey++;
        this.cdr.detectChanges();

        // Cập nhật min/max dates cho Flatpickr khi DateRegister thay đổi
        this.updateFlatpickrMinMaxDates();
      }
    });
  }
  ngAfterViewInit(): void {
    // Khởi tạo Flatpickr cho tất cả các tabs sau khi view đã render
    setTimeout(() => {
      this.initializeFlatpickrForAllTabs();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup tất cả flatpickr instances
    this.flatpickrInstances.forEach((instance) => {
      instance.destroy();
    });
    this.flatpickrInstances.clear();
  }

  // Khởi tạo Flatpickr cho tất cả các tabs
  private initializeFlatpickrForAllTabs(): void {
    this.formTabs.forEach((tab, index) => {
      this.initializeFlatpickrForTab(tab, index);
    });
  }

  // Khởi tạo Flatpickr cho một tab cụ thể
  private initializeFlatpickrForTab(tab: any, tabIndex: number): void {
    const timeStartId = `timestart-${tab.id}`;
    const endTimeId = `endtime-${tab.id}`;

    // Destroy existing instances if any
    if (this.flatpickrInstances.has(timeStartId)) {
      this.flatpickrInstances.get(timeStartId)?.destroy();
    }
    if (this.flatpickrInstances.has(endTimeId)) {
      this.flatpickrInstances.get(endTimeId)?.destroy();
    }

    const timeStartElement = document.getElementById(timeStartId);
    const endTimeElement = document.getElementById(endTimeId);

    if (timeStartElement) {
      const minDate = this.getMinDateForTimeStart();
      const maxDate = this.getMaxDateForTimeStart();

      const fpTimeStart = flatpickr(timeStartElement, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'd/m/Y H:i',
        locale: Vietnamese,
        minDate: minDate,
        maxDate: maxDate,
        defaultDate: tab.form.get('TimeStart')?.value || undefined,
        allowInput: true,
        disableMobile: false,
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const normalized = this.normalizeToMinute(selectedDates[0]);
            if (normalized) {
              tab.form.patchValue(
                { TimeStart: normalized },
                { emitEvent: true }
              );
              this.calculateTotalHour(tab.form);
              this.updateEndTimeFlatpickr(tab);
            }
          }
        },
        onClose: (selectedDates, dateStr, instance) => {
          const hourEl = (instance as any).hourElement;
          const minuteEl = (instance as any).minuteElement;
          if (hourEl && minuteEl) {
            const hour = parseInt(hourEl.value, 10);
            const minute = parseInt(minuteEl.value, 10);
            let baseDate: Date;
            if (selectedDates.length > 0) {
              baseDate = new Date(selectedDates[0]);
            } else {
              const currentValue = tab.form.get('TimeStart')?.value;
              baseDate = currentValue ? new Date(currentValue) : new Date();
            }
            const newDate = new Date(
              baseDate.getFullYear(),
              baseDate.getMonth(),
              baseDate.getDate(),
              hour,
              minute,
              0,
              0
            );
            const normalized = this.normalizeToMinute(newDate);
            if (normalized) {
              tab.form.patchValue(
                { TimeStart: normalized },
                { emitEvent: true }
              );
              // Cập nhật input value để hiển thị đúng
              instance.setDate(normalized, false);
              this.calculateTotalHour(tab.form);
              this.updateEndTimeFlatpickr(tab);
            }
          }
        },
        onReady: (_, __, instance) => {
          let lastValid: string | null = null;
          const updateFromMainInput = () => {
            const val = instance.input.value;
            const parsed = instance.parseDate(val, 'd/m/Y H:i');

            if (parsed) {
              const normalized = this.normalizeToMinute(parsed);
              if (!normalized) return;

              if (lastValid === val) return;
              lastValid = val;

              tab.form.patchValue(
                { TimeStart: normalized },
                { emitEvent: true }
              );

              this.calculateTotalHour(tab.form);
              this.updateEndTimeFlatpickr(tab);
            }
          };
          instance.input.addEventListener('input', updateFromMainInput);
          instance.input.addEventListener('change', updateFromMainInput);
          instance.input.addEventListener('blur', updateFromMainInput);
          const hourEl = (instance as any).hourElement;
          const minuteEl = (instance as any).minuteElement;
          const updateFromTimePicker = () => {
            if (hourEl && minuteEl) {
              const hour = parseInt(hourEl.value, 10);
              const minute = parseInt(minuteEl.value, 10);
              if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                const currentValue = tab.form.get('TimeStart')?.value;
                const baseDate = currentValue ? new Date(currentValue) : new Date();

                const newDate = new Date(
                  baseDate.getFullYear(),
                  baseDate.getMonth(),
                  baseDate.getDate(),
                  hour,
                  minute,
                  0,
                  0
                );
                const normalized = this.normalizeToMinute(newDate);
                if (normalized) {
                  // QUAN TRỌNG: Gọi setDate để commit giá trị vào Flatpickr
                  // Nếu không, Flatpickr sẽ reset về giá trị cũ khi popup đóng
                  instance.setDate(normalized, false);

                  tab.form.patchValue(
                    { TimeStart: normalized },
                    { emitEvent: true }
                  );
                  this.calculateTotalHour(tab.form);
                  this.updateEndTimeFlatpickr(tab);
                }
              }
            }
          };
          let debounceTimer: any = null;

          const debouncedUpdate = () => {
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
              updateFromTimePicker();
            }, 400); // Chờ 400ms sau khi user ngừng gõ
          };
          if (hourEl) {
            hourEl.addEventListener('input', debouncedUpdate);
            hourEl.addEventListener('change', updateFromTimePicker);
            hourEl.addEventListener('blur', updateFromTimePicker);
          }
          if (minuteEl) {
            minuteEl.addEventListener('input', debouncedUpdate);
            minuteEl.addEventListener('change', updateFromTimePicker);
            minuteEl.addEventListener('blur', updateFromTimePicker);
          }
        }
      });
      this.flatpickrInstances.set(timeStartId, fpTimeStart);
      tab.flatpickrTimeStart = fpTimeStart;
    }
    if (endTimeElement) {
      const minDate = this.getMinDateForEndTime(tab.form);
      const maxDate = this.getMaxDateForEndTime();

      const fpEndTime = flatpickr(endTimeElement, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'd/m/Y H:i',
        locale: Vietnamese,
        minDate: minDate,
        maxDate: maxDate,
        defaultDate: tab.form.get('EndTime')?.value || undefined,
        allowInput: true,
        disableMobile: false,
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const normalized = this.normalizeToMinute(selectedDates[0]);
            if (normalized) {
              tab.form.patchValue(
                { EndTime: normalized },
                { emitEvent: true }
              );
              this.calculateTotalHour(tab.form);

              if (normalized.getHours() >= 20) {
                tab.form.patchValue({ Overnight: true }, { emitEvent: false });
              }
            }
          }
        },
        onClose: (selectedDates, dateStr, instance) => {
          // Đọc trực tiếp từ hourElement và minuteElement của Flatpickr
          // vì selectedDates có thể chưa được cập nhật khi user dùng time picker arrows
          const hourEl = (instance as any).hourElement;
          const minuteEl = (instance as any).minuteElement;

          if (hourEl && minuteEl) {
            const hour = parseInt(hourEl.value, 10);
            const minute = parseInt(minuteEl.value, 10);

            // Lấy ngày từ selectedDates hoặc từ form hiện tại
            let baseDate: Date;
            if (selectedDates.length > 0) {
              baseDate = new Date(selectedDates[0]);
            } else {
              const currentValue = tab.form.get('EndTime')?.value;
              baseDate = currentValue ? new Date(currentValue) : new Date();
            }

            // Tạo ngày mới với giờ/phút từ time picker
            const newDate = new Date(
              baseDate.getFullYear(),
              baseDate.getMonth(),
              baseDate.getDate(),
              hour,
              minute,
              0,
              0
            );

            const normalized = this.normalizeToMinute(newDate);
            if (normalized) {
              tab.form.patchValue(
                { EndTime: normalized },
                { emitEvent: true }
              );
              // Cập nhật input value để hiển thị đúng
              instance.setDate(normalized, false);
              this.calculateTotalHour(tab.form);

              if (normalized.getHours() >= 20) {
                tab.form.patchValue({ Overnight: true }, { emitEvent: false });
              }
            }
          }
        },
        onReady: (_, __, instance) => {
          let lastValid: string | null = null;

          // Listener cho main input khi user gõ trực tiếp
          const updateFromMainInput = () => {
            const val = instance.input.value;
            const parsed = instance.parseDate(val, 'd/m/Y H:i');

            if (parsed) {
              const normalized = this.normalizeToMinute(parsed);
              if (!normalized) return;

              if (lastValid === val) return;
              lastValid = val;

              tab.form.patchValue(
                { EndTime: normalized },
                { emitEvent: true }
              );

              this.calculateTotalHour(tab.form);

              if (normalized.getHours() >= 20) {
                tab.form.patchValue({ Overnight: true }, { emitEvent: false });
              }
            }
          };

          // Thêm nhiều event để bắt mọi trường hợp
          instance.input.addEventListener('input', updateFromMainInput);
          instance.input.addEventListener('change', updateFromMainInput);
          instance.input.addEventListener('blur', updateFromMainInput);

          // Listener cho hourElement và minuteElement khi user gõ trực tiếp vào time picker
          const hourEl = (instance as any).hourElement;
          const minuteEl = (instance as any).minuteElement;

          const updateFromTimePicker = () => {
            if (hourEl && minuteEl) {
              const hour = parseInt(hourEl.value, 10);
              const minute = parseInt(minuteEl.value, 10);

              if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                const currentValue = tab.form.get('EndTime')?.value;
                const baseDate = currentValue ? new Date(currentValue) : new Date();

                const newDate = new Date(
                  baseDate.getFullYear(),
                  baseDate.getMonth(),
                  baseDate.getDate(),
                  hour,
                  minute,
                  0,
                  0
                );

                const normalized = this.normalizeToMinute(newDate);
                if (normalized) {
                  // QUAN TRỌNG: Gọi setDate để commit giá trị vào Flatpickr
                  // Nếu không, Flatpickr sẽ reset về giá trị cũ khi popup đóng
                  instance.setDate(normalized, false);

                  tab.form.patchValue(
                    { EndTime: normalized },
                    { emitEvent: true }
                  );
                  this.calculateTotalHour(tab.form);

                  if (normalized.getHours() >= 20) {
                    tab.form.patchValue({ Overnight: true }, { emitEvent: false });
                  }
                }
              }
            }
          };

          // Debounce timer để tránh update liên tục khi user đang gõ
          let debounceTimer: any = null;

          const debouncedUpdate = () => {
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
              updateFromTimePicker();
            }, 400); // Chờ 400ms sau khi user ngừng gõ
          };

          if (hourEl) {
            hourEl.addEventListener('input', debouncedUpdate);
            hourEl.addEventListener('change', updateFromTimePicker);
            hourEl.addEventListener('blur', updateFromTimePicker);
          }
          if (minuteEl) {
            minuteEl.addEventListener('input', debouncedUpdate);
            minuteEl.addEventListener('change', updateFromTimePicker);
            minuteEl.addEventListener('blur', updateFromTimePicker);
          }
        }
      });

      this.flatpickrInstances.set(endTimeId, fpEndTime);
      tab.flatpickrEndTime = fpEndTime;
    }
  }

  // Cập nhật minDate cho EndTime flatpickr khi TimeStart thay đổi
  private updateEndTimeFlatpickr(tab: any): void {
    if (tab.flatpickrEndTime) {
      const timeStart = tab.form.get('TimeStart')?.value;
      if (timeStart) {
        tab.flatpickrEndTime.set('minDate', new Date(timeStart));
      }
    }
  }

  // Cập nhật tất cả Flatpickr instances khi IsProblem thay đổi
  private updateFlatpickrMinMaxDates(): void {
    const minDate = this.getMinDateForTimeStart();
    const maxDate = this.getMaxDateForTimeStart();
    const maxEndDate = this.getMaxDateForEndTime();

    this.formTabs.forEach((tab) => {
      if (tab.flatpickrTimeStart) {
        tab.flatpickrTimeStart.set('minDate', minDate);
        tab.flatpickrTimeStart.set('maxDate', maxDate);
      }
      if (tab.flatpickrEndTime) {
        const minEndDate = this.getMinDateForEndTime(tab.form);
        tab.flatpickrEndTime.set('minDate', minEndDate);
        tab.flatpickrEndTime.set('maxDate', maxEndDate);
      }
    });
  }

  // Set giá trị cho Flatpickr từ form value
  private setFlatpickrValue(tab: any): void {
    const timeStartValue = tab.form.get('TimeStart')?.value;
    const endTimeValue = tab.form.get('EndTime')?.value;

    if (tab.flatpickrTimeStart && timeStartValue) {
      tab.flatpickrTimeStart.setDate(new Date(timeStartValue), false);
    }
    if (tab.flatpickrEndTime && endTimeValue) {
      tab.flatpickrEndTime.setDate(new Date(endTimeValue), false);
    }
  }

  loadDataByID(id: number) {
    this.isLoading = true;
    this.overTimeService.getEmployeeOverTimeByID(id).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          const employeeOverTime = data.employeeOverTime || data;
          const overTimeFile = data.overTimeFile || null;
          const overTimeDetails = data.overTimeDetails || data.details || [];

          // Load main data
          this.patchFormData(employeeOverTime);

          // Load multiple entries if exist
          if (overTimeDetails && overTimeDetails.length > 0) {
            this.loadMultipleEntries(overTimeDetails);
          }

          if (overTimeFile) {
            this.existingFiles = [overTimeFile];
            this.existingFileRecord = {
              ID: overTimeFile.ID || 0,
              EmployeeOvertimeID: overTimeFile.EmployeeOvertimeID || employeeOverTime.ID || 0,
              FileName: overTimeFile.FileName || '',
              OriginPath: overTimeFile.OriginPath || '',
              ServerPath: overTimeFile.ServerPath || ''
            };
            this.attachFileName = overTimeFile.FileName || overTimeFile.OriginPath || '';
          } else if (data.EmployeeOvertimeFile || data.FileName) {
            const fileData = data.EmployeeOvertimeFile || {
              ID: data.FileID || 0,
              EmployeeOvertimeID: data.ID || 0,
              FileName: data.FileName || '',
              OriginPath: data.FileOriginPath || data.FileName || '',
              ServerPath: data.FileServerPath || data.FilePath || ''
            };

            if (fileData.FileName || fileData.ServerPath) {
              this.existingFiles = [fileData];
              this.existingFileRecord = {
                ID: fileData.ID || 0,
                EmployeeOvertimeID: fileData.EmployeeOvertimeID || data.ID || 0,
                FileName: fileData.FileName || '',
                OriginPath: fileData.OriginPath || '',
                ServerPath: fileData.ServerPath || ''
              };
              this.attachFileName = fileData.FileName || fileData.OriginPath || '';
            }
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu');
          this.resetForm();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        const errorMessage = error?.error?.Message || error?.error?.message || error?.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + errorMessage);
        this.resetForm();
        this.isLoading = false;
      }
    });
  }

  patchFormData(data: any) {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const employeeID = (data.EmployeeID && data.EmployeeID > 0) ? data.EmployeeID : defaultEmployeeID;

    const approvedId = data.ApprovedID || data.ApprovedId || null;
    const typeID = data.TypeID || data.Type || null;
    const location = (data.Location || data.LocationID) && (data.Location || data.LocationID) > 0 ? (data.Location || data.LocationID) : null;
    const projectId = (data.ProjectID || data.ProjectId) && (data.ProjectID || data.ProjectId) > 0 ? (data.ProjectID || data.ProjectId) : null;

    const timeStartValueRaw = data.TimeStart
      ? data.TimeStart instanceof Date
        ? data.TimeStart
        : new Date(data.TimeStart)
      : null;
    const endTimeValueRaw = data.EndTime
      ? data.EndTime instanceof Date
        ? data.EndTime
        : new Date(data.EndTime)
      : null;
    const timeStartValue = this.normalizeToMinute(timeStartValueRaw);
    const endTimeValue = this.normalizeToMinute(endTimeValueRaw);

    this.commonForm.patchValue({
      EmployeeID: employeeID,
      DateRegister: data.DateRegister ? new Date(data.DateRegister) : new Date(),
      ApprovedID: approvedId,
      IsProblem: data.IsProblem || false
    }, { emitEvent: false });

    this.overTimeForm.patchValue({
      ID: data.ID !== null && data.ID !== undefined ? data.ID : 0,
      TimeStart: timeStartValue,
      EndTime: endTimeValue,
      TotalHour: data.TimeReality || data.TotalHour || null,
      Location: location,
      TypeID: typeID,
      ProjectID: projectId,
      Overnight: data.Overnight || false,
      Reason: data.Reason || ''
    }, { emitEvent: false });

    if (endTimeValue) {
      const endTime = new Date(endTimeValue);
      const hours = endTime.getHours();
      if (hours >= 20 && !data.Overnight) {
        this.overTimeForm.patchValue({
          Overnight: true
        }, { emitEvent: false });
      }
    }

    this.isProblemValue = data.IsProblem || false;
    this.attachFileName = data.FileName || '';

    this.resizeAllTextareas();

    this.cdr.detectChanges();

    // Cập nhật giá trị Flatpickr cho tab đầu tiên
    setTimeout(() => {
      if (this.formTabs.length > 0) {
        this.setFlatpickrValue(this.formTabs[0]);
      }
    }, 150);
  }

  formatDateTimeLocal(date: any): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Handler cho input datetime-local
  onDateTimeChange(event: Event, form: FormGroup, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        form.patchValue({ [controlName]: date });
        this.calculateTotalHour(form);

        // Auto check Overnight nếu EndTime >= 20:00
        if (controlName === 'EndTime') {
          const hours = date.getHours();
          if (hours >= 20) {
            form.patchValue({ Overnight: true }, { emitEvent: false });
          }
        }
      }
    } else {
      form.patchValue({ [controlName]: null });
    }
  }

  // Lấy min datetime cho TimeStart dựa trên IsProblem
  getMinDateTimeForTimeStart(): string {
    const isProblem = this.commonForm.get('IsProblem')?.value;

    if (isProblem) {
      // Nếu là đăng ký bổ sung, cho phép chọn từ 30 ngày trước
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 30);
      minDate.setHours(0, 0, 0, 0);
      return this.formatDateTimeLocal(minDate);
    } else {
      // Không phải đăng ký bổ sung: chỉ cho chọn từ hôm qua
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return this.formatDateTimeLocal(yesterday);
    }
  }

  // Lấy max datetime cho TimeStart
  getMaxDateTimeForTimeStart(): string {
    // Cho phép chọn đến cuối ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    return this.formatDateTimeLocal(tomorrow);
  }

  // Lấy min datetime cho EndTime (phải >= TimeStart)
  getMinDateTimeForEndTime(form: FormGroup): string {
    const timeStart = form.get('TimeStart')?.value;
    if (timeStart) {
      const startDate = new Date(timeStart);
      if (!isNaN(startDate.getTime())) {
        return this.formatDateTimeLocal(startDate);
      }
    }
    return this.getMinDateTimeForTimeStart();
  }

  // Lấy max datetime cho EndTime
  getMaxDateTimeForEndTime(): string {
    // Cho phép chọn đến cuối ngày kia (2 ngày sau)
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 0, 0);
    return this.formatDateTimeLocal(dayAfterTomorrow);
  }

  // ========== PrimeNG DatePicker Methods ==========

  // Lấy min Date cho TimeStart - dựa vào DateRegister
  getMinDateForTimeStart(): Date {
    const dateRegisterValue = this.commonForm?.get('DateRegister')?.value;

    if (dateRegisterValue) {
      // Nếu có DateRegister, minDate = DateRegister lúc 00:00
      const registerDate = dateRegisterValue instanceof Date
        ? new Date(dateRegisterValue)
        : new Date(dateRegisterValue);
      if (!isNaN(registerDate.getTime())) {
        registerDate.setHours(0, 0, 0, 0);
        return registerDate;
      }
    }

    // Fallback: nếu không có DateRegister
    const isProblem = this.commonForm.get('IsProblem')?.value;
    if (isProblem) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 30);
      minDate.setHours(0, 0, 0, 0);
      return minDate;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    }
  }

  // Lấy max Date cho TimeStart - dựa vào DateRegister
  getMaxDateForTimeStart(): Date {
    const dateRegisterValue = this.commonForm?.get('DateRegister')?.value;

    if (dateRegisterValue) {
      // Nếu có DateRegister, maxDate = DateRegister + 1 ngày lúc 23:59
      const registerDate = dateRegisterValue instanceof Date
        ? new Date(dateRegisterValue)
        : new Date(dateRegisterValue);
      if (!isNaN(registerDate.getTime())) {
        const maxDate = new Date(registerDate);
        maxDate.setDate(maxDate.getDate() + 1);
        maxDate.setHours(23, 59, 0, 0);
        return maxDate;
      }
    }

    // Fallback: nếu không có DateRegister, cho phép đến cuối ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    return tomorrow;
  }

  // Lấy min Date cho EndTime - dựa vào DateRegister và TimeStart
  getMinDateForEndTime(form: FormGroup): Date {
    const timeStart = form.get('TimeStart')?.value;
    if (timeStart) {
      const startDate = new Date(timeStart);
      if (!isNaN(startDate.getTime())) {
        return startDate;
      }
    }
    // Fallback về minDate của TimeStart (dựa vào DateRegister)
    return this.getMinDateForTimeStart();
  }

  // Lấy max Date cho EndTime - dựa vào DateRegister
  getMaxDateForEndTime(): Date {
    const dateRegisterValue = this.commonForm?.get('DateRegister')?.value;

    if (dateRegisterValue) {
      // Nếu có DateRegister, maxDate = DateRegister + 1 ngày lúc 23:59
      const registerDate = dateRegisterValue instanceof Date
        ? new Date(dateRegisterValue)
        : new Date(dateRegisterValue);
      if (!isNaN(registerDate.getTime())) {
        const maxDate = new Date(registerDate);
        maxDate.setDate(maxDate.getDate() + 1);
        maxDate.setHours(23, 59, 0, 0);
        return maxDate;
      }
    }

    // Fallback: cho phép đến cuối ngày kia (2 ngày sau)
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 0, 0);
    return dayAfterTomorrow;
  }

  // Handler khi chọn TimeStart từ PrimeNG DatePicker
  onTimeStartSelect(event: any, form: FormGroup): void {
    const date = event instanceof Date ? event : new Date(event);
    if (!isNaN(date.getTime())) {
      const normalized = this.normalizeToMinute(date);
      if (normalized) {
        form.patchValue({ TimeStart: normalized }, { emitEvent: false });
        this.calculateTotalHour(form);
      }
    }
  }

  // Handler khi chọn EndTime từ PrimeNG DatePicker
  onEndTimeSelect(event: any, form: FormGroup): void {
    const date = event instanceof Date ? event : new Date(event);
    if (!isNaN(date.getTime())) {
      const normalized = this.normalizeToMinute(date);
      if (normalized) {
        form.patchValue({ EndTime: normalized }, { emitEvent: false });
        this.calculateTotalHour(form);

        // Auto check Overnight nếu EndTime >= 20:00
        const hours = date.getHours();
        if (hours >= 20) {
          form.patchValue({ Overnight: true }, { emitEvent: false });
        }
      }
    }
  }

  toLocalISOString(date: Date | string | null): string | null {
    if (!date) return null;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return null;

      const dt = DateTime.fromJSDate(dateObj);
      return dt.toISO({ includeOffset: true });
    } catch {
      return null;
    }
  }

  formatDateDMY(date: Date | string | null): string {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '';

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }

  resetForm() {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const today = new Date();
    const defaultTimeStart = new Date(today);
    defaultTimeStart.setHours(18, 0, 0, 0);

    this.overTimeForm.patchValue({
      ID: 0,
      EmployeeID: defaultEmployeeID,
      DateRegister: today,
      ApprovedID: null,
      TimeStart: defaultTimeStart,
      EndTime: null,
      TotalHour: null,
      Location: 1,
      TypeID: null,
      ProjectID: null,
      Overnight: false,
      Reason: '',
      IsProblem: false
    }, { emitEvent: false });
    this.isProblemValue = false;
    this.attachFileName = '';
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.tempFileRecord = null;
    this.existingFileRecord = null;
    this.fileList = [];
    this.existingFiles = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];
    this.datePickerKey = 0;
  }

  private initializeForm(): void {
    this.commonForm = this.fb.group({
      EmployeeID: [null],
      DateRegister: [null, Validators.required],
      ApprovedID: [null, Validators.required],
      IsProblem: [false]
    });

    this.overTimeForm = this.fb.group({
      ID: [0],
      TimeStart: [null, Validators.required],
      EndTime: [null, Validators.required],
      TotalHour: [null],
      Location: [1, [
        Validators.required,
        (control: any) => {
          const value = control.value;
          if (!value || value === 0 || value === null) {
            return { required: true };
          }
          return null;
        }
      ]],
      TypeID: [null, Validators.required],
      ProjectID: [null],
      Overnight: [false],
      Reason: ['', Validators.required]
    });
  }

  loadTypes() {
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error: any) => {
        const errorMessage = error?.error?.Message || error?.error?.message || error?.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại làm thêm: ' + errorMessage);
      }
    });
  }

  // Load config hệ thống để kiểm tra có mở đăng ký bổ sung không
  loadConfigSystem() {
    this.homeLayoutService.getConfigSystemHR().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data && response.data.data) {
          const configs = response.data.data;
          const overtimeConfig = configs.find((c: any) => c.KeyName === 'EmployeeOvertime');
          if (overtimeConfig && overtimeConfig.KeyValue2 === '1') {
            this.isSupplementaryRegistrationOpen = true;
          } else {
            this.isSupplementaryRegistrationOpen = false;
          }
        }
      },
      error: () => {
        this.isSupplementaryRegistrationOpen = false;
      }
    });
  }

  loadApprovers() {
    this.wfhService.getEmloyeeApprover().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.approverList = res.data.approvers || [];
          this.buildApproverGroups();
        }
      },
      error: (error: any) => {
      }
    });
  }

  private buildApproverGroups(): void {
    // Loại bỏ duplicate dựa trên EmployeeID hoặc ID
    const uniqueApprovers = new Map();
    this.approverList.forEach((approver: any) => {
      const employeeID = approver.EmployeeID || approver.ID;
      if (employeeID && !uniqueApprovers.has(employeeID)) {
        uniqueApprovers.set(employeeID, approver);
      }
    });

    const deduplicatedList = Array.from(uniqueApprovers.values());

    const grouped = deduplicatedList.reduce((acc: any, approver: any) => {
      const deptName = approver.DepartmentName || 'Không xác định';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }

      const employeeID = approver.EmployeeID || approver.ID;
      // Kiểm tra xem đã có trong group chưa để tránh duplicate trong cùng một department
      const existsInGroup = acc[deptName].some((item: any) =>
        (item.EmployeeID || item.ID) === employeeID
      );

      if (!existsInGroup) {
        acc[deptName].push({
          ID: employeeID,
          EmployeeID: employeeID,
          Code: approver.Code,
          FullName: approver.FullName,
          DepartmentName: approver.DepartmentName
        });
      }
      return acc;
    }, {});

    Object.keys(grouped).forEach((dept) => {
      grouped[dept].sort((a: any, b: any) => (a.Code || '').localeCompare(b.Code || ''));
    });

    this.approverGroups = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((deptName) => ({
        label: deptName,
        options: grouped[deptName]
      }));
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;
          this.currentUser = Array.isArray(data) ? data[0] : data;
          this.departmentId = this.currentUser?.DepartmentID || 0;
          this.showProjectField = this.departmentId === 2;

          const employeeID = this.currentUser.EmployeeID || 0;
          if (employeeID > 0) {
            this.commonForm.patchValue({
              EmployeeID: employeeID
            }, { emitEvent: false });
          }

          const projectControl = this.overTimeForm.get('ProjectID');
          if (projectControl) {
            if (this.showProjectField) {
              projectControl.setValidators([
                Validators.required,
                (control) => {
                  const value = control.value;
                  if (this.showProjectField && (!value || value === 0 || value === null)) {
                    return { required: true };
                  }
                  return null;
                }
              ]);
            } else {
              projectControl.clearValidators();
            }
            projectControl.updateValueAndValidity();
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  loadProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        console.log('getProjectModal response:', res);

        if (res && res.status === 0) {
          console.error('Backend error:', res.message || res.error);
          this.projectList = [];
          return;
        }

        if (res && res.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [res.data];

          this.projectList = dataArray.map((item: any) => {
            if (item.id !== undefined && item.text !== undefined) {
              return item;
            }
            if (item.ID !== undefined) {
              const projectText = item.ProjectCode
                ? `${item.ProjectCode} - ${item.ProjectName || ''}`
                : (item.ProjectName || '');

              return {
                id: item.ID,
                text: projectText
              };
            }
            return item;
          });

          console.log('Mapped projectList:', this.projectList);
        } else {
          console.warn('No data in response:', res);
          this.projectList = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        if (error.status !== 200) {
          const errorMessage = error?.error?.Message || error?.error?.message || error?.message || 'Không thể tải danh sách dự án. Vui lòng liên hệ quản trị viên.';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        }
        this.projectList = [];
      }
    });
  }

  onSubmit() {
    // Kiểm tra nếu đang loading thì không cho submit lại
    if (this.isLoading) {
      return;
    }

    if (this.commonForm.invalid) {
      Object.keys(this.commonForm.controls).forEach(key => {
        const control = this.commonForm.get(key);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin chung');
      return;
    }

    const commonFormValue = this.commonForm.value;
    if (!commonFormValue.DateRegister) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký');
      return;
    }
    if (!commonFormValue.ApprovedID || commonFormValue.ApprovedID === null) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn người duyệt');
      return;
    }

    // Không cần gọi saveCurrentTabState() vì mỗi tab đã có form riêng biệt

    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];

      // Đọc trực tiếp từ tab.form.value thay vì sử dụng loadTabState
      const formValue = tab.form.value;


      if (this.departmentId === 2 && (!formValue.ProjectID || formValue.ProjectID === 0 || formValue.ProjectID === null)) {
        const projectControl = tab.form.get('ProjectID');
        if (projectControl) {
          projectControl.markAsTouched();
          projectControl.markAsDirty();
          projectControl.setErrors({ required: true });
          projectControl.updateValueAndValidity();
        }
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Dự án cho ${tab.title}`);
        this.cdr.detectChanges();
        this.isLoading = false; // Reset loading khi validation fail
        return;
      }

      if (!formValue.Location || formValue.Location === 0 || formValue.Location === null) {
        const locationControl = tab.form.get('Location');
        if (locationControl) {
          locationControl.markAsTouched();
          locationControl.markAsDirty();
          locationControl.setErrors({ required: true });
          locationControl.updateValueAndValidity();
        }
      }

      Object.keys(tab.form.controls).forEach(key => {
        const control = tab.form.get(key);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });

      if (tab.form.invalid) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng điền đầy đủ thông tin cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (!formValue.TypeID || formValue.TypeID === null) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn loại làm thêm cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      const timeStartValue = formValue.TimeStart;
      const endTimeValue = formValue.EndTime;

      if (!timeStartValue) {
        const timeStartControl = tab.form.get('TimeStart');
        if (timeStartControl) {
          timeStartControl.markAsTouched();
          timeStartControl.markAsDirty();
        }
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn thời gian bắt đầu cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (!endTimeValue) {
        const endTimeControl = tab.form.get('EndTime');
        if (endTimeControl) {
          endTimeControl.markAsTouched();
          endTimeControl.markAsDirty();
        }
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn thời gian kết thúc cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      const dateRegister = commonFormValue.DateRegister ? this.toLocalISOString(new Date(commonFormValue.DateRegister)) : null;
      const timeStart = this.toLocalISOString(new Date(timeStartValue));
      const endTime = this.toLocalISOString(new Date(endTimeValue));

      if (!timeStart || !endTime) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Thời gian không hợp lệ cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (new Date(timeStart) >= new Date(endTime)) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Thời gian kết thúc phải sau thời gian bắt đầu cho ${tab.title}`);
        this.cdr.detectChanges();
        return;
      }

      if (commonFormValue.DateRegister) {
        const dateRegisterDate = new Date(commonFormValue.DateRegister);
        dateRegisterDate.setHours(0, 0, 0, 0);

        const minDateDetail = new Date(dateRegisterDate);
        const maxDateDetail = new Date(dateRegisterDate);
        maxDateDetail.setDate(maxDateDetail.getDate() + 1);

        const timeStartDate = new Date(timeStartValue);
        const timeStartDateOnly = new Date(timeStartDate.getFullYear(), timeStartDate.getMonth(), timeStartDate.getDate());

        const endTimeDate = new Date(endTimeValue);
        const endTimeDateOnly = new Date(endTimeDate.getFullYear(), endTimeDate.getMonth(), endTimeDate.getDate());

        if (timeStartDateOnly.getTime() < minDateDetail.getTime() || timeStartDateOnly.getTime() > maxDateDetail.getTime()) {
          const formattedMinDate = this.formatDateDMY(minDateDetail);
          const formattedMaxDate = this.formatDateDMY(maxDateDetail);
          this.notification.warning(NOTIFICATION_TITLE.warning,
            `Ngày đăng ký là: ${this.formatDateDMY(dateRegisterDate)}. ` +
            `Nên Thời gian bắt đầu và thời gian kết thúc phải trong khoảng ` +
            `Từ: ${formattedMinDate} 00:00. Đến: ${this.formatDateDMY(maxDateDetail)} 00:00`);
          this.cdr.detectChanges();
          return;
        }

        if (endTimeDateOnly.getTime() < minDateDetail.getTime() || endTimeDateOnly.getTime() > maxDateDetail.getTime()) {
          const formattedMinDate = this.formatDateDMY(minDateDetail);
          const formattedMaxDate = this.formatDateDMY(maxDateDetail);
          this.notification.warning(NOTIFICATION_TITLE.warning,
            `Ngày đăng ký là: ${this.formatDateDMY(dateRegisterDate)}. ` +
            `Nên Thời gian bắt đầu và thời gian kết thúc phải trong khoảng ` +
            `Từ: ${formattedMinDate} 00:00. Đến: ${this.formatDateDMY(maxDateDetail)} 00:00`);
          this.cdr.detectChanges();
          return;
        }
      }
    }

    // Thu thập dữ liệu từ tất cả các tab để kiểm tra trùng thời gian
    const overtimeEntries: Array<{ timeStart: Date; endTime: Date; tabIndex: number }> = [];
    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      const formValue = tab.form.value;

      if (formValue.TimeStart && formValue.EndTime) {
        overtimeEntries.push({
          timeStart: new Date(formValue.TimeStart),
          endTime: new Date(formValue.EndTime),
          tabIndex: i
        });
      }
    }

    for (let i = 0; i < overtimeEntries.length; i++) {
      for (let j = i + 1; j < overtimeEntries.length; j++) {
        const entry1 = overtimeEntries[i];
        const entry2 = overtimeEntries[j];

        if ((entry1.timeStart.getTime() <= entry2.timeStart.getTime() && entry1.endTime.getTime() >= entry2.timeStart.getTime()) ||
          (entry1.timeStart.getTime() <= entry2.endTime.getTime() && entry1.endTime.getTime() >= entry2.endTime.getTime()) ||
          (entry1.timeStart.getTime() >= entry2.timeStart.getTime() && entry1.endTime.getTime() <= entry2.endTime.getTime()) ||
          (entry2.timeStart.getTime() >= entry1.timeStart.getTime() && entry2.endTime.getTime() <= entry1.endTime.getTime())) {
          this.notification.warning(NOTIFICATION_TITLE.warning,
            '2 khoảng thời gian làm thêm không được trùng nhau. Vui lòng kiểm tra lại!');
          this.cdr.detectChanges();
          return;
        }
      }
    }

    let overnightCount = 0;
    let overnightTabIndex = -1;
    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      const formValue = tab.form.value;
      if (formValue.Overnight === true) {
        overnightCount++;
        overnightTabIndex = i;
      }
    }

    if (overnightCount === 1 && overnightTabIndex >= 0) {
      for (let i = 0; i < this.formTabs.length; i++) {
        if (i !== overnightTabIndex) {
          const tab = this.formTabs[i];
          const tabFormValue = tab.form.value;
          if (tabFormValue.Overnight === true) {
            tab.form.patchValue({
              Overnight: false
            }, { emitEvent: false });
          }
        }
      }
    }

    // Validate file khi IsProblem = true
    if (commonFormValue.IsProblem) {
      // Kiểm tra file chung (dùng cho tất cả tab khi IsProblem = true)
      const hasCommonFile = this.selectedFile || this.tempFileRecord || this.existingFileRecord;

      if (!hasCommonFile) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn file đính kèm khi đăng ký bổ sung!'
        );
        this.cdr.detectChanges();
        return;
      }
    } else {
      // Kiểm tra file cho từng tab khi IsProblem = false
      for (let i = 0; i < this.formTabs.length; i++) {
        const tab = this.formTabs[i];
        const hasTabFile = tab.selectedFile || tab.tempFileRecord || tab.existingFileRecord;

        // Nếu không có file, không cần validate (file là optional khi IsProblem = false)
        // Nhưng nếu có file thì phải hợp lệ
      }
    }

    // Set loading trước khi submit để tránh click nhiều lần
    this.isLoading = true;
    this.submitAllTabs();
  }

  submitAllTabs() {
    this.isLoading = true;
    let completedCount = 0;
    const totalTabs = this.formTabs.length;
    const commonFormValue = this.commonForm.value;

    this.formTabs.forEach((tab, index) => {
      const formValue = tab.form.value;

      const dateRegister = commonFormValue.DateRegister ? this.toLocalISOString(new Date(commonFormValue.DateRegister)) : null;
      const timeStart = formValue.TimeStart ? this.toLocalISOString(new Date(formValue.TimeStart)) : null;
      const endTime = formValue.EndTime ? this.toLocalISOString(new Date(formValue.EndTime)) : null;

      // Calculate total hours (TimeReality)
      const startDate = new Date(timeStart!);
      const endDate = new Date(endTime!);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const timeReality = Math.round(diffHours * 100) / 100;

      // Tính CostOvernight: 30000 nếu Overnight = true, 0 nếu false
      const costOvernight = formValue.Overnight === true ? 30000 : 0;

      // Set ApproveHR = 0 khi tạo mới (ID = 0)
      const approveHR = (formValue.ID !== null && formValue.ID !== undefined && formValue.ID > 0)
        ? (formValue.ApproveHR !== null && formValue.ApproveHR !== undefined ? formValue.ApproveHR : null)
        : 0;

      const employeeOvertime = {
        ID: formValue.ID !== null && formValue.ID !== undefined ? formValue.ID : 0,
        EmployeeID: commonFormValue.EmployeeID || 0,
        ApprovedID: commonFormValue.ApprovedID || null,
        DateRegister: dateRegister,
        TimeStart: timeStart,
        EndTime: endTime,
        TimeReality: timeReality,
        Location: formValue.Location || 0,
        ProjectID: formValue.ProjectID || 0,
        Overnight: formValue.Overnight || false,
        CostOvernight: costOvernight,
        TypeID: formValue.TypeID || null,
        Reason: formValue.Reason || '',
        IsProblem: commonFormValue.IsProblem || false,
        IsApproved: false,
        IsApprovedHR: false,
        ApproveHR: approveHR,
        IsDeleted: false
      };

      let tabSelectedFile: File | null = null;
      let tabTempFileRecord: any = null;
      let tabExistingFileRecord: any = null;

      if (commonFormValue.IsProblem) {
        tabSelectedFile = this.selectedFile;
        tabTempFileRecord = this.tempFileRecord;
        tabExistingFileRecord = this.existingFileRecord;
      } else {
        tabSelectedFile = tab.selectedFile;
        tabTempFileRecord = tab.tempFileRecord;
        tabExistingFileRecord = tab.existingFileRecord;
      }

      // Nếu IsProblem = true, bắt buộc phải có file
      if (commonFormValue.IsProblem && !tabSelectedFile && !tabTempFileRecord && !tabExistingFileRecord) {
        this.isLoading = false;
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng chọn file đính kèm cho ${tab.title} khi đăng ký bổ sung!`
        );
        return;
      }

      if (tabSelectedFile || tabTempFileRecord || tabExistingFileRecord) {
        const originalSelectedFile = this.selectedFile;
        const originalTempFileRecord = this.tempFileRecord;
        const originalExistingFileRecord = this.existingFileRecord;

        this.selectedFile = tabSelectedFile;
        this.tempFileRecord = tabTempFileRecord;
        this.existingFileRecord = tabExistingFileRecord;

        this.uploadFileAndSaveForTab(employeeOvertime, tab, () => {
          completedCount++;
          if (completedCount === totalTabs) {
            this.isLoading = false;
            const message = this.isEditMode ? 'Lưu thành công' : 'Thêm thành công';
            this.notification.success(NOTIFICATION_TITLE.success, message);
            this.activeModal.close({ success: true });
          }
        }, (error: any) => {
          completedCount++;
          this.isLoading = false;
          const errorMessage = error?.error?.Message || error?.error?.message || error?.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        });

        this.selectedFile = originalSelectedFile;
        this.tempFileRecord = originalTempFileRecord;
        this.existingFileRecord = originalExistingFileRecord;
      } else {
        // Chỉ cho phép lưu không có file khi IsProblem = false
        this.saveDataEmployeeForTab(employeeOvertime, null, tab, () => {
          completedCount++;
          if (completedCount === totalTabs) {
            this.isLoading = false;
            const message = this.isEditMode ? 'Lưu thành công' : 'Thêm thành công';
            this.notification.success(NOTIFICATION_TITLE.success, message);
            this.activeModal.close({ success: true });
          }
        }, (error: any) => {
          completedCount++;
          this.isLoading = false;
          const errorMessage = error?.error?.Message || error?.error?.message || error?.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        });
      }
    });
  }

  uploadFileAndSaveForTab(employeeOvertime: any, tab: any, onSuccess: () => void, onError: (error: any) => void): void {
    if (tab.selectedFile && !tab.tempFileRecord) {
      const employeeCode = this.currentUser?.Code || 'UNKNOWN';
      const dateRegister = tab.form.get('DateRegister')?.value || this.commonForm.get('DateRegister')?.value;
      const dateRegisterDate = dateRegister ? new Date(dateRegister) : new Date();
      const subPath = this.generateSubPath(dateRegisterDate, employeeCode);
      const uploadKey = 'EmployeeOvertime';

      const loadingMsg = this.message.loading(`Đang tải lên ${tab.selectedFile.name}...`, {
        nzDuration: 0,
      }).messageId;

      this.overTimeService.uploadMultipleFiles([tab.selectedFile], uploadKey, subPath).subscribe({
        next: (res) => {
          this.message.remove(loadingMsg);
          if (res?.status === 1 && res?.data?.length > 0) {
            const uploadedFile = res.data[0];
            const serverPathWithFile = uploadedFile.ServerPath || uploadedFile.FilePath || '';
            const serverPathDirectory = this.getDirectoryPath(serverPathWithFile);

            const fileRecord: any = {
              ID: tab.existingFileRecord?.ID || 0,
              EmployeeOvertimeID: 0,
              FileName: uploadedFile.SavedFileName || uploadedFile.FileName || '',
              OriginPath: uploadedFile.OriginPath || uploadedFile.OriginalFileName || uploadedFile.OriginName || (tab.selectedFile ? tab.selectedFile.name : '') || '',
              ServerPath: serverPathDirectory,
            };

            tab.tempFileRecord = fileRecord;
            this.saveDataEmployeeForTab(employeeOvertime, fileRecord, tab, onSuccess, onError);
          } else {
            this.message.remove(loadingMsg);
            const errorMessage = res?.message || 'Lỗi khi tải file lên';
            onError({ error: { Message: errorMessage } });
          }
        },
        error: (err: any) => {
          this.message.remove(loadingMsg);
          onError(err);
        },
      });
    } else {
      const fileRecord = tab.tempFileRecord || (tab.existingFileRecord ? {
        ID: tab.existingFileRecord.ID || 0,
        EmployeeOvertimeID: tab.existingFileRecord.EmployeeOvertimeID || 0,
        FileName: tab.existingFileRecord.FileName || '',
        OriginPath: tab.existingFileRecord.OriginPath || '',
        ServerPath: tab.existingFileRecord.ServerPath || ''
      } : null);

      this.saveDataEmployeeForTab(employeeOvertime, fileRecord, tab, onSuccess, onError);
    }
  }

  saveDataEmployeeForTab(employeeOvertime: any, employeeOvertimeFile: any, tab: any, onSuccess: () => void, onError: (error: any) => void): void {
    const hasNewFile = employeeOvertimeFile && (employeeOvertimeFile.FileName || employeeOvertimeFile.ServerPath || employeeOvertimeFile.OriginPath);
    const hasDeletedFile = tab.deletedFiles.length > 0 && tab.deletedFiles[0].ID > 0;

    if (hasDeletedFile && hasNewFile) {
      this.deleteFileAndThenSaveForTab(employeeOvertime, employeeOvertimeFile, tab, onSuccess, onError);
      return;
    }

    const dto: any = {
      EmployeeOvertimes: [employeeOvertime]
    };

    if (hasNewFile) {
      if (employeeOvertime.ID <= 0) {
        employeeOvertimeFile.EmployeeOvertimeID = 0;
      } else {
        if (!employeeOvertimeFile.EmployeeOvertimeID || employeeOvertimeFile.EmployeeOvertimeID === 0) {
          employeeOvertimeFile.EmployeeOvertimeID = employeeOvertime.ID;
        }
      }
      dto.employeeOvertimeFile = employeeOvertimeFile;
    } else if (hasDeletedFile) {
      const deletedFile = tab.deletedFiles[0];
      dto.employeeOvertimeFile = {
        ID: deletedFile.ID || 0,
        EmployeeOvertimeID: deletedFile.EmployeeOvertimeID || employeeOvertime.ID || 0,
        FileName: deletedFile.FileName || '',
        OriginPath: deletedFile.OriginPath || '',
        ServerPath: deletedFile.ServerPath || '',
        IsDeleted: true
      };
    } else {
      dto.employeeOvertimeFile = {
        ID: 0,
        EmployeeOvertimeID: 0,
        FileName: null,
        OriginPath: null,
        ServerPath: null
      };
    }

    this.overTimeService.saveDataEmployee(dto).subscribe({
      next: () => {
        onSuccess();
      },
      error: (error: any) => {
        onError(error);
      }
    });
  }

  deleteFileAndThenSaveForTab(employeeOvertime: any, employeeOvertimeFile: any, tab: any, onSuccess: () => void, onError: (error: any) => void): void {
    const deletedFile = tab.deletedFiles[0];
    const deleteDto: any = {
      EmployeeOvertimes: [employeeOvertime],
      employeeOvertimeFile: {
        ID: deletedFile.ID || 0,
        EmployeeOvertimeID: deletedFile.EmployeeOvertimeID || employeeOvertime.ID || 0,
        FileName: deletedFile.FileName || '',
        OriginPath: deletedFile.OriginPath || '',
        ServerPath: deletedFile.ServerPath || '',
        IsDeleted: true
      }
    };

    this.overTimeService.saveDataEmployee(deleteDto).subscribe({
      next: () => {
        if (employeeOvertime.ID <= 0) {
          employeeOvertimeFile.EmployeeOvertimeID = 0;
        } else {
          if (!employeeOvertimeFile.EmployeeOvertimeID || employeeOvertimeFile.EmployeeOvertimeID === 0) {
            employeeOvertimeFile.EmployeeOvertimeID = employeeOvertime.ID;
          }
        }

        const saveDto: any = {
          EmployeeOvertimes: [employeeOvertime],
          employeeOvertimeFile: employeeOvertimeFile
        };

        this.overTimeService.saveDataEmployee(saveDto).subscribe({
          next: () => {
            onSuccess();
          },
          error: (error: any) => {
            onError(error);
          }
        });
      },
      error: (error: any) => {
        onError(error);
      }
    });
  }

  checkOvernightAllowedForCurrentTab(): boolean {
    const commonFormValue = this.commonForm.value;
    const dateRegister = commonFormValue.DateRegister;

    if (!dateRegister) {
      return true;
    }

    const registerDate = new Date(dateRegister);
    const registerDateStr = `${registerDate.getFullYear()}-${String(registerDate.getMonth() + 1).padStart(2, '0')}-${String(registerDate.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < this.formTabs.length; i++) {
      if (i === this.activeTabIndex) {
        continue;
      }

      const tab = this.formTabs[i];
      const tabFormValue = tab.form.value;

      if (tabFormValue.Overnight === true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Trong cùng một ngày chỉ được tích "Ăn tối" một lần');
        return false;
      }
    }

    return true;
  }

  validateOvernight(form: FormGroup): void {
    const formValue = form.value;
    const overnight = formValue.Overnight;

    if (!overnight) {
      return;
    }

    const dateRegister = this.commonForm.get('DateRegister')?.value;
    const timeStart = formValue.TimeStart;
    const endTime = formValue.EndTime;

    if (!dateRegister || !timeStart || !endTime) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đầy đủ ngày đăng ký và thời gian bắt đầu/kết thúc');
      form.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }

    let dateRegisterStr = '';
    if (dateRegister instanceof Date) {
      dateRegisterStr = DateTime.fromJSDate(dateRegister).toFormat('yyyy-MM-dd');
    } else {
      dateRegisterStr = dateRegister;
    }

    const dateCheck = new Date(dateRegisterStr + 'T20:00');
    const endTimeDate = new Date(endTime);

    if (endTimeDate.getTime() < dateCheck.getTime()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không thể chọn phụ cấp ăn tối trước 20h. Vui lòng kiểm tra lại!');
      form.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }

    if (new Date(timeStart) >= new Date(endTime)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thời gian làm thêm không đúng. Vui lòng kiểm tra lại!');
      form.patchValue({ Overnight: false }, { emitEvent: false });
      return;
    }
  }

  disabledDate = (current: Date): boolean => {
    if (!current) {
      return true;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      const isProblem = this.isProblemValue !== undefined ? this.isProblemValue : (this.commonForm?.get('IsProblem')?.value || false);

      const selectedDateValue = this.commonForm?.get('DateRegister')?.value;
      let allowSelectedDate = false;
      if (selectedDateValue) {
        const selected = new Date(selectedDateValue);
        selected.setHours(0, 0, 0, 0);
        allowSelectedDate = selected.getTime() === currentDate.getTime();
      }

      if (isProblem) {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        if (allowSelectedDate) {
          return false;
        }

        const isBeforeFirstDay = currentDate.getTime() < firstDayOfMonth.getTime();
        const isAfterToday = currentDate.getTime() > today.getTime();
        return isBeforeFirstDay || isAfterToday;
      } else {
        if (allowSelectedDate) {
          return false;
        }
        const isYesterday = currentDate.getTime() === yesterday.getTime();
        const isToday = currentDate.getTime() === today.getTime();
        return !isYesterday && !isToday;
      }
    } catch (error) {
      console.error('Error in disabledDate:', error);
      return false;
    }
  };

  disabledDateForTimeStart = (current: Date): boolean => {
    if (!current) return true;
    try {
      const dateRegisterValue = this.commonForm?.get('DateRegister')?.value;
      if (!dateRegisterValue) return false;

      const registerDate = dateRegisterValue instanceof Date
        ? new Date(dateRegisterValue)
        : new Date(dateRegisterValue);
      if (isNaN(registerDate.getTime())) return false;
      registerDate.setHours(0, 0, 0, 0);

      const maxDate = new Date(registerDate);
      maxDate.setDate(maxDate.getDate() + 1);
      maxDate.setHours(0, 0, 0, 0);

      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      // Chỉ cho chọn trong khoảng: DateRegister -> DateRegister + 1 ngày
      return currentDate.getTime() < registerDate.getTime() || currentDate.getTime() > maxDate.getTime();
    } catch (error) {
      console.error('Error in disabledDateForTimeStart:', error);
      return false;
    }
  };

  disabledDateForEndTime = (current: Date): boolean => {
    if (!current) return true;
    try {
      const dateRegisterValue = this.commonForm?.get('DateRegister')?.value;
      if (!dateRegisterValue) return false;

      const registerDate = dateRegisterValue instanceof Date
        ? new Date(dateRegisterValue)
        : new Date(dateRegisterValue);
      if (isNaN(registerDate.getTime())) return false;
      registerDate.setHours(0, 0, 0, 0);

      const maxDate = new Date(registerDate);
      maxDate.setDate(maxDate.getDate() + 1);
      maxDate.setHours(0, 0, 0, 0);

      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      // Chỉ cho chọn trong khoảng: DateRegister -> DateRegister + 1 ngày
      return currentDate.getTime() < registerDate.getTime() || currentDate.getTime() > maxDate.getTime();
    } catch (error) {
      console.error('Error in disabledDateForEndTime:', error);
      return false;
    }
  };

  validateTimeRange(form: FormGroup): void {
    const timeStart = form.get('TimeStart')?.value;
    const endTime = form.get('EndTime')?.value;

    if (timeStart && endTime) {
      const startDate = timeStart instanceof Date ? timeStart : new Date(timeStart);
      const endDate = endTime instanceof Date ? endTime : new Date(endTime);

      if (startDate >= endDate) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }
  }

  private generateSubPath(dateRegister: Date, employeeCode: string): string {
    const date = new Date(dateRegister);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const monthName = `Tháng ${month}`;
    const dayFormatted = `Ngày ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;

    return `Năm ${year}\\${monthName}\\${dayFormatted}\\${employeeCode}`;
  }

  private getDirectoryPath(filePath: string): string {
    if (!filePath) return '';

    const lastSlash = filePath.lastIndexOf('\\');
    const lastForwardSlash = filePath.lastIndexOf('/');
    const lastSeparator = Math.max(lastSlash, lastForwardSlash);

    if (lastSeparator > 0) {
      return filePath.substring(0, lastSeparator);
    }

    return filePath.replace(/[\\/]+$/, '');
  }

  beforeUpload = (file: any): boolean => {
    if (this.existingFiles.length > 0) {
      this.existingFiles.forEach(existingFile => {
        if (existingFile.ID && existingFile.ID > 0 && !this.deletedFileIds.includes(existingFile.ID)) {
          this.deletedFileIds.push(existingFile.ID);
          this.deletedFiles.push({
            ...existingFile,
            IsDeleted: true
          });
        }
      });
      this.existingFiles = [];
      this.existingFileRecord = null;
    }

    this.selectedFile = null;
    this.tempFileRecord = null;
    this.uploadedFileData = null;

    this.fileList = [file];
    this.selectedFile = file;
    this.attachFileName = file.name;
    return false;
  };

  removeFile() {
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.attachFileName = '';
    this.tempFileRecord = null;
    this.fileList = [];
  }

  deleteExistingFile(fileId: number) {
    const fileToDelete = this.existingFiles.find(f => f.ID === fileId);
    if (!fileToDelete) {
      return;
    }

    if (fileId > 0 && !this.deletedFileIds.includes(fileId)) {
      this.deletedFileIds.push(fileId);
      this.deletedFiles.push({
        ...fileToDelete,
        IsDeleted: true
      });
    }

    this.existingFiles = this.existingFiles.filter(f => f.ID !== fileId);

    const remainingFiles = this.existingFiles.filter(f => f.ID && !this.deletedFileIds.includes(f.ID));

    if (remainingFiles.length === 0) {
      this.existingFileRecord = null;
      this.attachFileName = '';
    } else {
      const firstFile = remainingFiles[0];
      this.existingFileRecord = {
        ID: firstFile.ID || 0,
        EmployeeOvertimeID: firstFile.EmployeeOvertimeID || 0,
        FileName: firstFile.FileName || '',
        OriginPath: firstFile.OriginPath || '',
        ServerPath: firstFile.ServerPath || ''
      };
      this.attachFileName = firstFile.FileName || firstFile.OriginPath || '';
    }

    this.cdr.detectChanges();
  }

  openProjectItemSelectModal() {
    if (!this.currentUser || !this.currentUser.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể lấy thông tin người dùng');
      return;
    }

    const modalRef = this.modalService.open(ProjectItemSelectModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.projectID = 0;
    modalRef.componentInstance.userID = this.currentUser.ID;

    modalRef.result.then(
      (missions: string) => {
        if (missions && missions.trim() !== '') {
          const currentReason = this.overTimeForm.get('Reason')?.value || '';

          const newReason = currentReason
            ? `${currentReason}; ${missions}`
            : missions;

          this.overTimeForm.patchValue({
            Reason: newReason
          });

        }
      },
      () => {
      }
    );
  }

  addNewTab() {
    // Lưu trạng thái file của tab hiện tại
    this.saveCurrentTabState();

    const newTabId = this.formTabs.length + 1;
    const newForm = this.createNewForm();
    const newTab = {
      id: newTabId,
      title: ` ${newTabId}`,
      form: newForm,
      data: null,
      selectedFile: null,
      uploadedFileData: null,
      tempFileRecord: null,
      existingFileRecord: null,
      fileList: [],
      existingFiles: [],
      deletedFileIds: [],
      deletedFiles: [],
      attachFileName: ''
    };
    this.formTabs.push(newTab as any);
    this.activeTabIndex = this.formTabs.length - 1;
    // Không cần gán this.overTimeForm = newForm vì HTML đã bind trực tiếp tab.form
    // Reset trạng thái file cho tab mới
    this.selectedFile = null;
    this.uploadedFileData = null;
    this.tempFileRecord = null;
    this.existingFileRecord = null;
    this.fileList = [];
    this.existingFiles = [];
    this.deletedFileIds = [];
    this.deletedFiles = [];
    this.attachFileName = '';
    this.cdr.detectChanges();

    // Khởi tạo Flatpickr cho tab mới sau khi DOM render
    setTimeout(() => {
      this.initializeFlatpickrForTab(newTab, this.formTabs.length - 1);
    }, 50);
  }

  removeTab(event: { index: number }) {
    this.removeTabByIndex(event.index);
  }

  removeTabByIndex(index: number) {
    if (this.formTabs.length <= 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phải có ít nhất một hạng mục');
      return;
    }

    const tab = this.formTabs[index];
    const timeStart = tab.form.get('TimeStart')?.value;
    const endTime = tab.form.get('EndTime')?.value;

    let content = 'Bạn có chắc muốn xóa khai báo làm thêm';
    if (timeStart || endTime) {
      content += '\n';
      if (timeStart) {
        const startStr = timeStart instanceof Date ? this.formatDateTimeLocal(timeStart) : timeStart;
        content += `Từ: ${startStr}`;
      }
      if (endTime) {
        const endStr = endTime instanceof Date ? this.formatDateTimeLocal(endTime) : endTime;
        if (timeStart) {
          content += '\n';
        }
        content += `Đến: ${endStr}`;
      }
    }
    content += ' không?';

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Cleanup Flatpickr instances cho tab bị xóa
        const tabToRemove = this.formTabs[index];
        const timeStartId = `timestart-${tabToRemove.id}`;
        const endTimeId = `endtime-${tabToRemove.id}`;

        if (this.flatpickrInstances.has(timeStartId)) {
          this.flatpickrInstances.get(timeStartId)?.destroy();
          this.flatpickrInstances.delete(timeStartId);
        }
        if (this.flatpickrInstances.has(endTimeId)) {
          this.flatpickrInstances.get(endTimeId)?.destroy();
          this.flatpickrInstances.delete(endTimeId);
        }

        this.formTabs.splice(index, 1);
        // Cập nhật activeTabIndex nếu cần
        if (this.activeTabIndex >= this.formTabs.length) {
          this.activeTabIndex = this.formTabs.length - 1;
        } else if (this.activeTabIndex > index) {
          // Nếu tab bị xóa nằm trước tab đang active, giảm index
          this.activeTabIndex--;
        }
        // KHÔNG gọi loadTabState vì mỗi tab đã có form riêng biệt
        // và được bind trực tiếp trong HTML
        this.cdr.detectChanges();
      }
    });
  }

  saveCurrentTabState() {
    if (this.formTabs.length > 0 && this.formTabs[this.activeTabIndex]) {
      const currentTab = this.formTabs[this.activeTabIndex];
      // KHÔNG ghi đè form vì mỗi tab đã có form riêng biệt
      // Chỉ lưu trạng thái file
      currentTab.selectedFile = this.selectedFile;
      currentTab.uploadedFileData = this.uploadedFileData;
      currentTab.tempFileRecord = this.tempFileRecord;
      currentTab.existingFileRecord = this.existingFileRecord;
      currentTab.fileList = [...this.fileList];
      currentTab.existingFiles = [...this.existingFiles];
      currentTab.deletedFileIds = [...this.deletedFileIds];
      currentTab.deletedFiles = [...this.deletedFiles];
      currentTab.attachFileName = this.attachFileName;
    }
  }

  loadTabState(index: number, skipAutoOvernight: boolean = false) {
    if (this.formTabs.length > 0 && this.formTabs[index]) {
      const tab = this.formTabs[index];
      this.overTimeForm = tab.form;
      this.selectedFile = tab.selectedFile;
      this.uploadedFileData = tab.uploadedFileData;
      this.tempFileRecord = tab.tempFileRecord;
      this.existingFileRecord = tab.existingFileRecord;
      this.fileList = [...tab.fileList];
      this.existingFiles = [...tab.existingFiles];
      this.deletedFileIds = [...tab.deletedFileIds];
      this.deletedFiles = [...tab.deletedFiles];
      this.attachFileName = tab.attachFileName;

      if (!skipAutoOvernight) {
        const endTime = this.overTimeForm.get('EndTime')?.value;
        if (endTime) {
          const endTimeDate = new Date(endTime);
          const dateRegister = this.commonForm.get('DateRegister')?.value;

          let hasOtherOvernight = false;
          for (let i = 0; i < this.formTabs.length; i++) {
            if (i !== index) {
              const otherTab = this.formTabs[i];
              const otherFormValue = otherTab.form.value;
              if (otherFormValue.Overnight === true) {
                hasOtherOvernight = true;
                break;
              }
            }
          }

          if (!hasOtherOvernight) {
            if (dateRegister) {
              const dateRegisterDate = new Date(dateRegister);
              const dateCheck = new Date(dateRegisterDate.getFullYear(), dateRegisterDate.getMonth(), dateRegisterDate.getDate(), 20, 0, 0);
              const currentOvernight = this.overTimeForm.get('Overnight')?.value;

              if (endTimeDate.getTime() >= dateCheck.getTime() && !currentOvernight) {
                this.overTimeForm.patchValue({
                  Overnight: true
                }, { emitEvent: false });
              }
            } else {
              const hours = endTimeDate.getHours();
              const currentOvernight = this.overTimeForm.get('Overnight')?.value;
              if (hours >= 20 && !currentOvernight) {
                this.overTimeForm.patchValue({
                  Overnight: true
                }, { emitEvent: false });
              }
            }
          }
        }
      }

      this.resizeAllTextareas();
    }
  }

  createNewForm(): FormGroup {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if DateRegister is today
    const dateRegister = this.commonForm?.get('DateRegister')?.value;
    let defaultTimeStart: Date;

    if (dateRegister) {
      const registerDate = new Date(dateRegister);
      registerDate.setHours(0, 0, 0, 0);
      const isRegisterToday = registerDate.getTime() === today.getTime();

      if (isRegisterToday) {
        // If DateRegister is today, default to 18:00 of today
        defaultTimeStart = new Date(today);
        defaultTimeStart.setHours(18, 0, 0, 0);
      } else {
        // Otherwise, use the DateRegister date with 18:00
        defaultTimeStart = new Date(registerDate);
        defaultTimeStart.setHours(18, 0, 0, 0);
      }
    } else {
      // Default to 18:00 of today
      defaultTimeStart = new Date(today);
      defaultTimeStart.setHours(18, 0, 0, 0);
    }

    const newForm = this.fb.group({
      ID: [0],
      TimeStart: [defaultTimeStart, Validators.required],
      EndTime: [null, Validators.required],
      TotalHour: [null],
      Location: [1, [
        Validators.required,
        (control: any) => {
          const value = control.value;
          if (!value || value === 0 || value === null) {
            return { required: true };
          }
          return null;
        }
      ]],
      TypeID: [null, Validators.required],
      ProjectID: [null],
      Overnight: [false],
      Reason: ['', Validators.required]
    });

    this.attachMinutePrecisionForForm(newForm);
    this.attachFormValidationSubscriptions(newForm);

    return newForm;
  }

  /**
   * Đăng ký các subscriptions validation riêng biệt cho mỗi form
   * Mỗi form sẽ có các subscriptions độc lập, không ảnh hưởng lẫn nhau
   */
  private attachFormValidationSubscriptions(form: FormGroup): void {
    // Subscription cho Overnight checkbox
    form.get('Overnight')?.valueChanges.subscribe((value) => {
      if (value) {
        if (!this.checkOvernightAllowedForForm(form)) {
          form.patchValue({ Overnight: false }, { emitEvent: false });
          return;
        }
        this.validateOvernight(form);
      }
    });

    // Subscription cho TimeStart
    form.get('TimeStart')?.valueChanges.subscribe(() => {
      this.validateTimeRange(form);

      if (form.get('Overnight')?.value) {
        this.validateOvernight(form);
      }
    });

    // Subscription cho EndTime
    form.get('EndTime')?.valueChanges.subscribe((endTimeValue) => {
      this.validateTimeRange(form);

      if (endTimeValue) {
        const endTime = new Date(endTimeValue);
        const timeStart = form.get('TimeStart')?.value;
        const dateRegister = this.commonForm.get('DateRegister')?.value;

        if (dateRegister && timeStart) {
          const dateRegisterDate = new Date(dateRegister);
          const dateCheck = new Date(dateRegisterDate.getFullYear(), dateRegisterDate.getMonth(), dateRegisterDate.getDate(), 20, 0, 0);

          if (endTime.getTime() >= dateCheck.getTime()) {
            const currentOvernight = form.get('Overnight')?.value;
            if (!currentOvernight) {
              form.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        } else {
          const hours = endTime.getHours();
          if (hours >= 20) {
            const currentOvernight = form.get('Overnight')?.value;
            if (!currentOvernight) {
              form.patchValue({
                Overnight: true
              }, { emitEvent: false });
            }
          }
        }
      }

      if (form.get('Overnight')?.value) {
        const dateRegister = this.commonForm.get('DateRegister')?.value;
        const timeStart = form.get('TimeStart')?.value;
        const endTime = form.get('EndTime')?.value;
        if (dateRegister && timeStart && endTime) {
          this.validateOvernight(form);
        }
      }
    });
  }

  /**
   * Kiểm tra xem form cụ thể có được phép tích Overnight không
   * (trong cùng một ngày chỉ được tích một lần)
   */
  private checkOvernightAllowedForForm(targetForm: FormGroup): boolean {
    const commonFormValue = this.commonForm.value;
    const dateRegister = commonFormValue.DateRegister;

    if (!dateRegister) {
      return true;
    }

    for (let i = 0; i < this.formTabs.length; i++) {
      const tab = this.formTabs[i];
      // Bỏ qua chính form đang xét
      if (tab.form === targetForm) {
        continue;
      }

      const tabFormValue = tab.form.value;

      if (tabFormValue.Overnight === true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Trong cùng một ngày chỉ được tích "Ăn tối" một lần');
        return false;
      }
    }

    return true;
  }

  resetCommonForm() {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : null;
    const today = new Date();

    this.commonForm.patchValue({
      EmployeeID: defaultEmployeeID,
      DateRegister: today,
      ApprovedID: null,
      IsProblem: false
    }, { emitEvent: false });
  }

  private loadMultipleEntries(entries: any[]): void {
    // Clear existing tabs except the first one
    while (this.formTabs.length > 1) {
      this.formTabs.pop();
    }

    // Load data for each entry
    entries.forEach((entry, index) => {
      if (index === 0) {
        // First entry - use existing form
        this.patchFormData(entry);
      } else {
        // Additional entries - create new tabs
        const newTabId = this.formTabs.length + 1;
        const newForm = this.createNewForm();

        // Patch data to new form
        this.patchFormDataToForm(entry, newForm);

        this.formTabs.push({
          id: newTabId,
          title: ` ${newTabId}`,
          form: newForm,
          data: entry,
          selectedFile: null,
          uploadedFileData: null,
          tempFileRecord: null,
          existingFileRecord: null,
          fileList: [],
          existingFiles: [],
          deletedFileIds: [],
          deletedFiles: [],
          attachFileName: ''
        });
      }
    });

    // Load first tab state
    if (this.formTabs.length > 0) {
      this.loadTabState(0);
    }
  }

  private patchFormDataToForm(data: any, form: FormGroup): void {
    const defaultEmployeeID = (this.currentUser && this.currentUser.EmployeeID) ? this.currentUser.EmployeeID : 0;
    const employeeID = (data.EmployeeID && data.EmployeeID > 0) ? data.EmployeeID : defaultEmployeeID;

    const approvedId = data.ApprovedID || data.ApprovedId || null;
    const typeID = data.TypeID || data.Type || null;
    const location = (data.Location || data.LocationID) && (data.Location || data.LocationID) > 0 ? (data.Location || data.LocationID) : null;
    const projectId = (data.ProjectID || data.ProjectId) && (data.ProjectID || data.ProjectId) > 0 ? (data.ProjectID || data.ProjectId) : null;

    const timeStartValueRaw = data.TimeStart
      ? data.TimeStart instanceof Date
        ? data.TimeStart
        : new Date(data.TimeStart)
      : null;
    const endTimeValueRaw = data.EndTime
      ? data.EndTime instanceof Date
        ? data.EndTime
        : new Date(data.EndTime)
      : null;
    const timeStartValue = this.normalizeToMinute(timeStartValueRaw);
    const endTimeValue = this.normalizeToMinute(endTimeValueRaw);

    form.patchValue({
      ID: data.ID !== null && data.ID !== undefined ? data.ID : 0,
      TimeStart: timeStartValue,
      EndTime: endTimeValue,
      TotalHour: data.TimeReality || data.TotalHour || null,
      Location: location,
      TypeID: typeID,
      ProjectID: projectId,
      Overnight: data.Overnight || false,
      Reason: data.Reason || ''
    }, { emitEvent: false });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  autoResizeTextarea(event: any) {
    const textarea = event.target;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  resizeAllTextareas() {
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea[formcontrolname="Reason"]');
      textareas.forEach((textarea: any) => {
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    }, 100);
  }
}

