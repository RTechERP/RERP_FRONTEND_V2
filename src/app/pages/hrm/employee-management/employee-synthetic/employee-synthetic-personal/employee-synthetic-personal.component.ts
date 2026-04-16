import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { EmployeeSyntheticService } from '../employee-synthetic.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { AuthService } from '../../../../../auth/auth.service';
import { Router } from '@angular/router';
import { PinAuthService } from '../../../../../auth/pin-pass-word/pin-auth.service';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { PinResetTabComponent } from '../../pin-reset-tab/pin-reset-tab.component';

@Component({
  selector: 'app-employee-synthetic-personal',
  templateUrl: './employee-synthetic-personal.component.html',
  styleUrls: ['./employee-synthetic-personal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzTabsModule,
    NzInputNumberModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    NzModalModule,
  ]
})
export class EmployeeSyntheticPersonalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tb_summary', { static: false }) tbSummaryRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_fingerprint', { static: false }) tbFingerprintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_timekeeping', { static: false }) tbTimekeepingRef!: ElementRef<HTMLDivElement>;

  private summaryTabulator!: Tabulator;
  private fingerprintTabulator!: Tabulator;
  private timekeepingTabulator!: Tabulator;

  searchForm!: FormGroup;
  isLoadTable = false;
  selectedTabIndex = 3; // Mặc định ở tab Bảng lương (index 3)

  // Lưu trữ dữ liệu
  summaryData: any[] = [];
  fingerprintData: any = null;
  timekeepingData: any = null;
  timekeepingSummary: any = null;
  payrollData: any[] = [];
  totalWorkdayStandard: number = 0;

  // Trạng thái xác thực lại
  showReAuthModal = false;
  pinMode: 'VERIFY' | 'CREATE' | 'FORGOT' | 'RESET' = 'VERIFY';
  reAuthPin = '';
  reAuthConfirmPin = '';
  errorMessage = '';
  isVerifying = false;
  showErrorPopup = false;
  hasPin = false;
  retryCount = 0;
  private pendingTabIndex = -1;
  private previousTabIndex = 0;
  private dataSavedSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private syntheticService: EmployeeSyntheticService,
    public authService: AuthService,
    public pinAuthService: PinAuthService,
    private router: Router,
    private message: NzMessageService,
    private tabService: TabServiceService
  ) { }

  ngOnInit() {
    this.initializeForm();

    // Check current route to set default tab
    const url = this.router.url;
    if (url.includes('person-summary-payroll')) {
      this.selectedTabIndex = 3;
      this.previousTabIndex = 3;
    } else {
      this.selectedTabIndex = 0;
      this.previousTabIndex = 0;
    }

    // Kích hoạt xác thực lại nếu bắt đầu ở tab bảng lương
    if (this.selectedTabIndex === 3 && !this.pinAuthService.isAuthenticated()) {
      setTimeout(() => this.checkAndOpenPinModal(), 500);
    }

    // Lắng nghe sự kiện reset PIN thành công để hiển thị lại modal
    this.dataSavedSub = this.tabService.dataSaved$.subscribe(key => {
      if (key === 'PIN_RESET_SUCCESS') {
        // Reset retry count khi đã đặt lại PIN thành công
        this.retryCount = 0;
        this.showErrorPopup = false;

        // Nếu đang ở tab Bảng lương thì hiện modal
        if (this.selectedTabIndex === 3) {
          this.checkAndOpenPinModal();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Khởi tạo tất cả các bảng trước (vì chúng ta sử dụng [hidden] thay vì *ngIf)
    setTimeout(() => {
      this.initializeTables();
      // Khởi tạo bảng cho tab mặc định được chọn
      this.initializeTableForTab(this.selectedTabIndex);
      // Tải dữ liệu
      setTimeout(() => {
        this.loadData();
      }, 100);
    }, 100);
  }

  ngOnDestroy(): void {
    // Xóa trạng thái xác thực PIN khi tắt tab để lần sau mở lại phải nhập lại (theo yêu cầu)
    this.pinAuthService.setAuthenticated(false);

    if (this.dataSavedSub) {
      this.dataSavedSub.unsubscribe();
    }
  }

  private initializeForm(): void {
    const now = new Date();
    this.searchForm = this.fb.group({
      year: [now.getFullYear()],
      month: [now.getMonth() + 1]
    });
  }

  private initializeTables(): void {
    this.initializeSummaryTable();
    this.initializeFingerprintTable();
    this.initializeTimekeepingTable();
  }
  private initializeTableForTab(tabIndex: number): void {
    switch (tabIndex) {
      case 0: // TỔNG HỢP
        if (!this.summaryTabulator && this.tbSummaryRef?.nativeElement) {
          this.initializeSummaryTable();
        } else if (this.summaryTabulator) {
          // Vẽ lại bảng nếu đã được khởi tạo
          setTimeout(() => {
            this.summaryTabulator.redraw(true);
          }, 50);
        }
        break;
      case 1: // VÂN TAY
        if (!this.fingerprintTabulator && this.tbFingerprintRef?.nativeElement) {
          this.initializeFingerprintTable();
        } else if (this.fingerprintTabulator) {
          setTimeout(() => {
            this.fingerprintTabulator.redraw(true);
          }, 50);
        }
        break;
      case 2: // CHẤM CÔNG
        if (!this.timekeepingTabulator && this.tbTimekeepingRef?.nativeElement) {
          this.initializeTimekeepingTable();
        } else if (this.timekeepingTabulator) {
          setTimeout(() => {
            this.timekeepingTabulator.redraw(true);
          }, 50);
        }
        break;
      case 3: // BẢNG LƯƠNG
        // Bảng lương là bảng HTML, không cần khởi tạo
        break;
    }
  }
  onTabChange(index: number): void {
    // Chặn tab Bảng lương để kiểm tra xác thực mã PIN
    if (index === 3 && !this.pinAuthService.isAuthenticated()) {
      this.pendingTabIndex = index;

      // Giữ UI ở tab trước đó cho đến khi xác thực thành công
      // Sử dụng setTimeout để cho phép nz-tabset hoàn tất cập nhật trạng thái nội bộ trước khi chúng ta ép nó quay lại
      setTimeout(() => {
        this.selectedTabIndex = this.previousTabIndex;
      }, 0);

      this.checkAndOpenPinModal();
      return;
    }

    this.previousTabIndex = this.selectedTabIndex;
    this.selectedTabIndex = index;
    // Chờ DOM render nội dung tab, sau đó khởi tạo bảng
    setTimeout(() => {
      this.initializeTableForTab(index);
      // Vẽ lại và thay đổi kích thước bảng khi tab được hiển thị
      this.redrawTableForTab(index);
      // Tải lại dữ liệu nếu đã được tải
      if (this.summaryData.length > 0 || this.fingerprintData || this.timekeepingData || this.payrollData) {
        setTimeout(() => {
          this.loadDataForCurrentTab();
        }, 50);
      }
    }, 150);
  }

  private redrawTableForTab(tabIndex: number): void {
    setTimeout(() => {
      switch (tabIndex) {
        case 0: // TỔNG HỢP
          if (this.summaryTabulator) {
            this.summaryTabulator.redraw(true);
            this.summaryTabulator.setHeight('85vh');
          }
          break;
        case 1: // VÂN TAY
          if (this.fingerprintTabulator) {
            this.fingerprintTabulator.redraw(true);
            this.fingerprintTabulator.setHeight('85vh');
          }
          break;
        case 2: // CHẤM CÔNG
          if (this.timekeepingTabulator) {
            this.timekeepingTabulator.redraw(true);
            this.timekeepingTabulator.setHeight('25vh');
          }
          break;
        case 3: // BẢNG LƯƠNG
          // Bảng lương là bảng HTML, không cần vẽ lại
          break;
      }
    }, 100);
  }
  private loadDataForCurrentTab(): void {
    const formValue = this.searchForm.value;
    const year = formValue.year || new Date().getFullYear();
    const month = formValue.month || new Date().getMonth() + 1;

    if (!this.pinAuthService.isAuthenticated()) {
      this.checkAndOpenPinModal();
      return;
    }

    this.syntheticService.getPersonalSyntheticByMonth(year, month).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;

          switch (this.selectedTabIndex) {
            case 0: // TỔNG HỢP
              if (data.listSummary) {
                // Xử lý cả cấu trúc mảng và mảng lồng nhau
                let summaryArray: any[] = [];
                if (Array.isArray(data.listSummary)) {
                  // Kiểm tra nếu là mảng lồng nhau (mảng của các mảng)
                  if (data.listSummary.length > 0 && Array.isArray(data.listSummary[0])) {
                    // Làm phẳng mảng lồng nhau
                    summaryArray = (data.listSummary as any[]).flat();
                  } else {
                    // Mảng thông thường
                    summaryArray = data.listSummary;
                  }
                }
                this.summaryData = summaryArray;
                if (this.summaryTabulator) {
                  this.summaryTabulator.setData(this.summaryData);
                }
              }
              break;
            case 1: // VÂN TAY
              if (data.fingers) {
                this.fingerprintData = data.fingers;
                if (this.fingerprintTabulator && data.fingers.details && Array.isArray(data.fingers.details)) {
                  this.fingerprintTabulator.setData(data.fingers.details);
                }
              }
              break;
            case 2: // CHẤM CÔNG
              if (data.listChamcong) {
                this.timekeepingData = data.listChamcong;
                this.loadTimekeepingTable(data.listChamcong);
              }
              break;
            case 3: // BẢNG LƯƠNG
              if (data.payroll && this.pinAuthService.isAuthenticated()) {
                // Handle both array and object cases
                if (Array.isArray(data.payroll)) {
                  this.payrollData = data.payroll;
                  // Get total workday standard from first item if array
                  if (data.payroll.length > 0 && data.payroll[0].TotalWorkday) {
                    this.totalWorkdayStandard = Number(data.payroll[0].TotalWorkday) || 0;
                  }
                } else {
                  // Payroll is a single object
                  this.payrollData = [data.payroll];
                  // Get total workday standard from payroll
                  if (data.payroll.TotalWorkday) {
                    this.totalWorkdayStandard = Number(data.payroll.TotalWorkday) || 0;
                  }
                }
              } else {
                this.payrollData = [];
                this.totalWorkdayStandard = 0;
              }
              break;
          }
        }
      },
      error: (error) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[error.status] || 'error',
          NOTIFICATION_TITLE_MAP[error.status as RESPONSE_STATUS] || 'Lỗi',
          error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  private initializeSummaryTable(): void {
    if (!this.tbSummaryRef?.nativeElement) {
      return;
    }
    this.summaryTabulator = new Tabulator(this.tbSummaryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '85vh',
      paginationMode: 'local',
      data: [],
      columns: [
        {
          title: 'Hạng mục', field: 'HangMuc', hozAlign: 'left', headerHozAlign: 'center',
          width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true
        },
        {
          title: 'Đơn vị', field: 'Unit', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerWordWrap: true, headerSort: false
        },
        {
          title: 'Giá trị (đăng ký)', field: 'Value', hozAlign: 'right', headerHozAlign: 'center',
          width: 150, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'Giá trị (duyệt)', field: 'ValueReal', hozAlign: 'right', headerHozAlign: 'center',
          width: 150, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'HR duyệt (lần)', field: 'HRApproved', hozAlign: 'center', headerHozAlign: 'center',
          width: 120, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'TBP duyệt (lần)', field: 'TBPApproved', hozAlign: 'center', headerHozAlign: 'center',
          width: 120, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'HR huỷ ĐK nghỉ (lần)', field: 'HRCancel', hozAlign: 'center', headerHozAlign: 'center',
          width: 150, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'TBP huỷ ĐK nghỉ (lần)', field: 'TBPCancel', hozAlign: 'center', headerHozAlign: 'center',
          width: 150, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value == null || value === undefined) return '0';
            return new Intl.NumberFormat('vi-VN').format(Number(value));
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center',
          width: 300, formatter: 'textarea', headerSort: false
        },
        {
          title: 'Loại', field: 'Typetext', hozAlign: 'left', headerHozAlign: 'center',
          width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, visible: false
        },
      ],
      groupBy: 'Typetext',
      groupHeader: (value, count, data) => {
        return `<div style="width: 100%; height: 100%; font-weight: bold;">${value}</div>`;
      }
    });
  }

  private initializeFingerprintTable(): void {
    if (!this.tbFingerprintRef?.nativeElement) {
      return;
    }
    const countTrue = (values: any[], data: any[], calcParams: any) => {
      let calc = 0;
      values.forEach((value) => {
        if (value === true || value === 'true' || value === 1 || value === '1') {
          calc++;
        }
      });
      return calc;
    };

    const checkInFmt = (cell: any) => {
      const d = cell.getRow().getData();
      const v = this.timeDisplay(d?.CheckInDate, d?.CheckIn); // ưu tiên Date, fallback chuỗi

      // Priority 1: Quên chấm công thực tế (IsNoFinger) -> Màu vàng (Hổ trợ cả khi v trống)
      const isNoFingerReal = this.toBool(d?.IsNoFinger);
      if (isNoFingerReal) {
        return `<div class="bg-forgot-finger" style="padding: 4px; border-radius: 4px; width: 100%; text-align: center;">${v || ''}</div>`;
      }

      if (!v) return ''; // không có giờ -> để trống

      // Priority 2: Các cờ đăng ký phát sinh (nghỉ/công tác/quên vân tay/WFH) => không tô
      const isOnLeave = this.toBool(d?.OnLeave);
      const isBusiness = this.toBool(d?.Bussiness);
      const isNoFingerReg = this.toBool(d?.NoFingerprint);
      const isWFH = this.toBool(d?.WFH);
      if (isOnLeave || isBusiness || isNoFingerReg || isWFH) return v;

      // Priority 3: Chỉ tô khi ngày làm việc (không phải ngày lễ/nghỉ)
      const holidayDay = Number(d?.HolidayDay) || 0;
      if (holidayDay !== 0) return v;

      // Priority 4: Đi muộn (vàng nếu > 1h, đỏ nếu muộn thường)
      const isOverLate = this.toBool(d?.IsOverLate);
      const isLate = this.toBool(d?.IsLate);

      const style = isOverLate
        ? 'background-color: yellow; color:#000;'
        : isLate
          ? 'background-color: rgb(255, 0, 0); color:#fff;'
          : '';

      return style ? `<div style="${style} padding: 4px; border-radius: 4px; text-align: center;">${v}</div>` : v;
    };

    const checkOutFmt = (cell: any) => {
      const d = cell.getRow().getData();
      const v = this.timeDisplay(d?.CheckOutDate, d?.CheckOut);

      // Priority 1: Quên chấm công thực tế (IsNoFinger) -> Màu vàng
      const isNoFingerReal = this.toBool(d?.IsNoFinger);
      if (isNoFingerReal) {
        return `<div class="bg-forgot-finger" style="padding: 4px; border-radius: 4px; width: 100%; text-align: center;">${v || ''}</div>`;
      }

      if (!v) return '';

      const isOnLeave = this.toBool(d?.OnLeave);
      const isBusiness = this.toBool(d?.Bussiness);
      const isNoFingerReg = this.toBool(d?.NoFingerprint);
      const isWFH = this.toBool(d?.WFH);
      if (isOnLeave || isBusiness || isNoFingerReg || isWFH) return v;

      const holidayDay = Number(d?.HolidayDay) || 0;
      if (holidayDay !== 0) return v;

      const isOverEarly = this.toBool(d?.IsOverEarly);
      const isEarly = this.toBool(d?.IsEarly);

      const style = isOverEarly
        ? 'background-color: yellow; color:#000;'
        : isEarly
          ? 'background-color: rgb(255, 0, 0); color:#fff;'
          : '';

      return style ? `<div style="${style} padding: 4px; border-radius: 4px; text-align: center;">${v}</div>` : v;
    };

    this.fingerprintTabulator = new Tabulator(this.tbFingerprintRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '85vh',
      paginationMode: 'local',
      data: [],
      rowFormatter: (row) => {
        const data = row.getData();
        if (Number(data['HolidayDay']) > 0) {
          row.getElement().classList.add('bg-holiday');
        }
      },
      columns: [
        {
          title: 'Họ tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center',
          width: 170, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true
        },
        {
          title: 'Ngày', field: 'AttendanceDate', hozAlign: 'center', headerHozAlign: 'center',
          width: 120, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
            } catch {
              const date = new Date(value);
              return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
            }
          }
        },
        {
          title: 'Thứ', field: 'DayWeek', hozAlign: 'center', headerHozAlign: 'center',
          width: 80, headerWordWrap: true, headerSort: false
        },
        {
          title: 'Giờ vào', field: 'CheckInDate', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerWordWrap: true, headerSort: false, formatter: checkInFmt
        },
        {
          title: 'Giờ ra', field: 'CheckOutDate', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerWordWrap: true, headerSort: false, formatter: checkOutFmt
        },
        {
          title: 'Đi muộn', field: 'IsLateRegister', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Về sớm', field: 'IsEarlyRegister', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Làm thêm', field: 'Overtime', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Công tác', field: 'Bussiness', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Khai báo quên chấm công', field: 'NoFingerprint', hozAlign: 'center', headerHozAlign: 'center',
          width: 150, headerWordWrap: true, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Nghỉ', field: 'OnLeave', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'WFH', field: 'WFH', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
        {
          title: 'Quên chấm công', field: 'IsNoFinger', hozAlign: 'center', headerHozAlign: 'center',
          width: 120, headerWordWrap: true, headerSort: false, bottomCalc: countTrue,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }
        },
      ],
    });
  }

  private initializeTimekeepingTable(): void {
    if (!this.tbTimekeepingRef?.nativeElement) {
      return;
    }
    // Bảng chấm công sẽ được tạo động dựa trên số ngày trong tháng
    this.timekeepingTabulator = new Tabulator(this.tbTimekeepingRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '25vh',
      pagination: false,
      rowHeader: false,
      paginationMode: 'local',
      data: [],
      columns: [
        {
          title: 'Họ tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center',
          width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true
        },
      ],
    });
  }

  formatNumber(value: any): string {
    if (value == null || value === undefined || value === '') return '';
    return new Intl.NumberFormat('vi-VN').format(Number(value));
  }

  private toBool(v: any): boolean {
    if (v === true || v === false) return v;
    const n = Number(v);
    if (!isNaN(n)) return n > 0;
    const s = String(v ?? '').toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  private timeDisplay(dateVal: any, timeVal: any): string {
    // Ưu tiên datetime
    if (dateVal) {
      const dt = new Date(dateVal);
      if (!isNaN(dt.getTime())) {
        const hh = dt.getHours();
        const mm = dt.getMinutes();
        const ss = dt.getSeconds?.() ?? 0;
        // Nếu time = 00:00:00 → coi như không có giờ
        if (hh === 0 && mm === 0 && ss === 0) return '';
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }

    // Fallback: chuỗi HH:mm[:ss]
    const s = String(timeVal ?? '').trim();
    if (!s) return '';
    const m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) {
      const hh = +m[1];
      const mm = +m[2];
      const ss = +(m[3] ?? 0);
      // 00:00[:00] → để trống
      if (hh === 0 && mm === 0 && ss === 0) return '';
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    return s;
  }

  onConfirmPayroll() {
    if (!this.payrollData || this.payrollData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu bảng lương.');
      return;
    }

    const payroll = this.payrollData[0];
    if (payroll.Sign) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng lương đã được xác nhận.');
      return;
    }

    if (!payroll.ID) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID bảng lương.');
      return;
    }

    this.syntheticService.confirmPayroll(payroll.ID, true).subscribe({
      next: (res: any) => {
        if (res && res.status === RESPONSE_STATUS.SUCCESS) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận bảng lương thành công');
          this.loadData();
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[res.status] || 'error',
            NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Lỗi',
            res?.message || 'Có lỗi xảy ra',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err: any) => {
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

  onCancelPayroll() {
    if (!this.payrollData || this.payrollData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu bảng lương.');
      return;
    }

    const payroll = this.payrollData[0];
    if (!payroll.Sign) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng lương chưa được xác nhận, không thể hủy.');
      return;
    }

    if (!payroll.ID) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID bảng lương.');
      return;
    }

    this.syntheticService.confirmPayroll(payroll.ID, false).subscribe({
      next: (res: any) => {
        if (res && res.status === RESPONSE_STATUS.SUCCESS) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Hủy xác nhận bảng lương thành công');
          this.loadData();
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[res.status] || 'error',
            NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Lỗi',
            res?.message || 'Có lỗi xảy ra',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err: any) => {
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

  loadData() {
    if (!this.searchForm) {
      return;
    }

    const formValue = this.searchForm.value;
    const year = formValue.year || new Date().getFullYear();
    const month = formValue.month || new Date().getMonth() + 1;

    // Xác thực mã PIN nghiêm ngặt cho BẤT KỲ hoạt động tải dữ liệu nào trong component này
    if (!this.pinAuthService.isAuthenticated()) {
      this.checkAndOpenPinModal();
      return;
    }

    this.isLoadTable = true;

    this.syntheticService.getPersonalSyntheticByMonth(year, month).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          // API trả về: { listSummary, fingers, payroll, listChamcong }
          const data = res.data;

          // Tải dữ liệu tổng hợp
          if (data.listSummary) {
            // Xử lý cả cấu trúc mảng và mảng lồng nhau
            let summaryArray: any[] = [];
            if (Array.isArray(data.listSummary)) {
              // Kiểm tra xem đó có phải là mảng lồng nhau (mảng của các mảng) không
              if (data.listSummary.length > 0 && Array.isArray(data.listSummary[0])) {
                // Làm phẳng mảng lồng nhau
                summaryArray = (data.listSummary as any[]).flat();
              } else {
                // Mảng thông thường
                summaryArray = data.listSummary;
              }
            }
            this.summaryData = summaryArray;
            if (this.summaryTabulator) {
              this.summaryTabulator.setData(this.summaryData);
            }
          }

          // Tải dữ liệu vân tay
          if (data.fingers) {
            this.fingerprintData = data.fingers;
            if (this.fingerprintTabulator && data.fingers.details && Array.isArray(data.fingers.details)) {
              this.fingerprintTabulator.setData(data.fingers.details);
            }
          }

          // Tải dữ liệu chấm công
          if (data.listChamcong) {
            this.timekeepingData = data.listChamcong;
            this.loadTimekeepingTable(data.listChamcong);
          }

          // Tải dữ liệu bảng lương - chỉ khi đã xác thực qua PIN
          if (data.payroll && this.pinAuthService.isAuthenticated()) {
            // Xử lý cả trường hợp mảng và đối tượng
            if (Array.isArray(data.payroll)) {
              this.payrollData = data.payroll;
              // Lấy định mức công chuẩn từ mục đầu tiên nếu là mảng
              if (data.payroll.length > 0 && data.payroll[0].TotalWorkday) {
                this.totalWorkdayStandard = Number(data.payroll[0].TotalWorkday) || 0;
              }
            } else {
              // Bảng lương là một đối tượng đơn lẻ
              this.payrollData = [data.payroll];
              // Lấy định mức công chuẩn từ bảng lương
              if (data.payroll.TotalWorkday) {
                this.totalWorkdayStandard = Number(data.payroll.TotalWorkday) || 0;
              }
            }
          } else {
            this.payrollData = [];
            this.totalWorkdayStandard = 0;
          }
        } else {
          this.clearAllTables();
        }
        this.isLoadTable = false;
      },
      error: (error) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[error.status] || 'error',
          NOTIFICATION_TITLE_MAP[error.status as RESPONSE_STATUS] || 'Lỗi',
          error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.clearAllTables();
        this.isLoadTable = false;
      }
    });
  }

  private loadTimekeepingTable(data: any) {
    if (!this.timekeepingTabulator || !data) {
      return;
    }

    // Xây dựng cột động dựa trên dữ liệu tiêu đề (header)
    const columns: any[] = [
      {
        title: 'Họ tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center',
        width: 120, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true
      }
    ];

    if (data.header && Array.isArray(data.header)) {
      data.header.forEach((headerItem: any) => {
        const isHoliday = headerItem.statuswork == 0;
        columns.push({
          title: headerItem.text || '',
          field: headerItem.fieldname || '',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
          headerWordWrap: true,
          headerSort: false,
          cssClass: isHoliday ? 'bg-holiday-cell' : '',
          titleFormatter: isHoliday ? (cell: any) => `<div class="bg-holiday-header" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${headerItem.text}</div>` : undefined,
          formatter: (cell: any) => {
            const value = cell.getValue();
            let displayValue = '';
            // Tách phần văn bản nếu giá trị chứa dấu phân cách ";" (định dạng: "Văn bản;Trạng thái")
            if (value && typeof value === 'string' && value.includes(';')) {
              displayValue = value.split(';')[0] || '';
            } else {
              displayValue = value || '';
            }

            if (isHoliday) {
              return `<div class="bg-holiday-cell" style="width:100%; height:100%">${displayValue}</div>`;
            } else if (!displayValue || displayValue.trim() === '') {
              return `<div class="bg-forgot-finger" style="width:100%; height:100%">${displayValue}</div>`;
            }

            return displayValue;
          }
        });
      });
    }

    columns.push({
      title: 'Công đi làm thực tế', field: 'TotalDayActual', hozAlign: 'right', headerHozAlign: 'center',
      width: 150, headerWordWrap: true, headerSort: false
    });

    this.timekeepingTabulator.setColumns(columns);

    // Thiết lập dữ liệu sau khi thiết lập cột
    if (data.data) {
      const rowData = Array.isArray(data.data) ? data.data : [data.data];
      this.timekeepingTabulator.setData(rowData);

      // Trích xuất dữ liệu tổng hợp (giả sử đây là bản ghi đầu tiên cho chế độ xem cá nhân)
      if (rowData.length > 0) {
        this.timekeepingSummary = rowData[0];
      } else {
        this.timekeepingSummary = null;
      }
    } else {
      this.timekeepingTabulator.setData([]);
      this.timekeepingSummary = null;
    }
  }

  private clearAllTables() {
    if (this.summaryTabulator) {
      this.summaryTabulator.setData([]);
    }
    if (this.fingerprintTabulator) {
      this.fingerprintTabulator.setData([]);
    }
    if (this.timekeepingTabulator) {
      this.timekeepingTabulator.setData([]);
    }
    this.payrollData = [];
    this.totalWorkdayStandard = 0;
  }

  onSearch() {
    this.loadData();
  }

  resetSearch() {
    const now = new Date();
    this.searchForm.patchValue({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.loadData();
  }

  onYearChange(value: number) {
    if (value) {
      this.loadData();
    }
  }

  onMonthChange(value: number) {
    if (value) {
      this.loadData();
    }
  }

  // --- PIN RE-AUTHENTICATION METHODS ---

  checkAndOpenPinModal(): void {
    if (this.showReAuthModal || this.isVerifying) return;

    this.isVerifying = true;
    this.pinAuthService.checkPinStatus().subscribe({
      next: (res) => {
        this.isVerifying = false;
        this.hasPin = res.status === RESPONSE_STATUS.SUCCESS && res.data?.hasPin;
        this.pinMode = this.hasPin ? 'VERIFY' : 'CREATE';
        this.reAuthPin = '';
        this.reAuthConfirmPin = '';
        this.errorMessage = '';
        this.showReAuthModal = true;
      },
      error: () => {
        this.isVerifying = false;
        this.pinMode = 'VERIFY';
        this.showReAuthModal = true;
      }
    });
  }

  handleReAuth(): void {
    if (this.pinMode === 'VERIFY') {
      if (!this.reAuthPin || this.reAuthPin.length !== 6) {
        this.errorMessage = 'Vui lòng nhập mã PIN 6 số';
        return;
      }

      this.isVerifying = true;
      this.pinAuthService.verifyPin(this.reAuthPin).subscribe({
        next: (res) => {
          this.isVerifying = false;
          if (res.status === RESPONSE_STATUS.SUCCESS && res.data?.verified) {
            this.pinAuthService.setAuthenticated(true);
            this.showReAuthModal = false;
            this.notification.success(NOTIFICATION_TITLE.success, 'Xác thực thành công');

            if (this.pendingTabIndex !== -1) {
              this.selectedTabIndex = this.pendingTabIndex;
              this.pendingTabIndex = -1;
              this.initializeTableForTab(this.selectedTabIndex);
            }
            this.loadData();
          } else {
            this.retryCount++;
            this.reAuthPin = '';
            if (this.retryCount >= 3) {
              this.showReAuthModal = false;
              this.errorMessage = 'Bạn đã nhập sai mã PIN quá 3 lần. Vui lòng liên hệ HR hoặc thử lại sau.';
              this.showErrorPopup = true;
            } else {
              this.errorMessage = `Mã PIN không chính xác. Bạn còn ${3 - this.retryCount} lần thử.`;
            }
          }
        },
        error: (err) => {
          this.isVerifying = false;
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi xác thực';
        }
      });
    } else if (this.pinMode === 'CREATE') {
      if (!this.reAuthPin || this.reAuthPin.length !== 6 || this.reAuthPin !== this.reAuthConfirmPin) {
        this.errorMessage = 'Mã PIN không khớp hoặc không đủ 6 số';
        return;
      }

      this.isVerifying = true;
      this.pinAuthService.setPin(this.reAuthPin, this.reAuthConfirmPin).subscribe({
        next: (res) => {
          this.isVerifying = false;
          if (res.status === RESPONSE_STATUS.SUCCESS) {
            this.pinAuthService.setAuthenticated(true);
            this.showReAuthModal = false;
            this.notification.success(NOTIFICATION_TITLE.success, 'Thiết lập mã PIN thành công');

            if (this.pendingTabIndex !== -1) {
              this.selectedTabIndex = this.pendingTabIndex;
              this.pendingTabIndex = -1;
              this.initializeTableForTab(this.selectedTabIndex);
            }
            this.loadData();
          } else {
            this.errorMessage = res.message || 'Không thể thiết lập mã PIN';
          }
        },
        error: (err) => {
          this.isVerifying = false;
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi thiết lập';
        }
      });
    }
  }

  cancelReAuth(): void {
    this.showReAuthModal = false;
    this.pendingTabIndex = -1;
    this.reAuthPin = '';
    this.reAuthConfirmPin = '';
    this.errorMessage = '';

    // Nếu đang ở tab Bảng lương nhưng đã hủy xác thực lại, hãy quay lại tab trước đó hoặc tab mặc định
    if (this.selectedTabIndex === 3 && !this.pinAuthService.isAuthenticated()) {
      this.selectedTabIndex = this.previousTabIndex === 3 ? 0 : this.previousTabIndex;
      this.previousTabIndex = this.selectedTabIndex;
      this.initializeTableForTab(this.selectedTabIndex);
    }
  }

  switchToForgotMode(): void {
    this.showReAuthModal = false;
    this.tabService.openTabComp({
      comp: PinResetTabComponent,
      title: 'Quên mã PIN',
      key: 'pin-reset-personal',
      data: {}
    });
  }

  closeErrorPopup(): void {
    this.showErrorPopup = false;
    this.retryCount = 0;
    if (this.selectedTabIndex === 3) {
      this.selectedTabIndex = 0;
      this.initializeTableForTab(0);
      this.loadData();
    }
  }

}

