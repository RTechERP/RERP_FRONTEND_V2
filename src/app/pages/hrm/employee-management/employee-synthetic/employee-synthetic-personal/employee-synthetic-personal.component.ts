import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { EmployeeSyntheticService } from '../employee-synthetic.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

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
  ]
})
export class EmployeeSyntheticPersonalComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_summary', { static: false }) tbSummaryRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_fingerprint', { static: false }) tbFingerprintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tb_timekeeping', { static: false }) tbTimekeepingRef!: ElementRef<HTMLDivElement>;

  private summaryTabulator!: Tabulator;
  private fingerprintTabulator!: Tabulator;
  private timekeepingTabulator!: Tabulator;

  searchForm!: FormGroup;
  isLoadTable = false;
  selectedTabIndex = 3; // Default to Payroll tab (index 3)

  // Data storage
  summaryData: any[] = [];
  fingerprintData: any = null;
  timekeepingData: any = null;
  timekeepingSummary: any = null;
  payrollData: any[] = [];
  totalWorkdayStandard: number = 0;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private syntheticService: EmployeeSyntheticService
  ) { }

  ngOnInit() {
    this.initializeForm();
    // Subscribe to form value changes for auto-loading (optional)
    // this.searchForm.valueChanges.subscribe(() => {
    //   // Auto-load can be enabled here if needed
    // });
  }

  ngAfterViewInit(): void {
    // Initialize all tables first (since we use [hidden] instead of *ngIf)
    setTimeout(() => {
      this.initializeTables();
      // Initialize table for the default selected tab
      this.initializeTableForTab(this.selectedTabIndex);
      // Load data
      setTimeout(() => {
        this.loadData();
      }, 100);
    }, 100);
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
          // Redraw table if already initialized
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
        // Payroll table is HTML table, no initialization needed
        break;
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Wait for DOM to render the tab content, then initialize table
    setTimeout(() => {
      this.initializeTableForTab(index);
      // Redraw and resize table when tab is shown
      this.redrawTableForTab(index);
      // Reload data if already loaded
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
          // Payroll table is HTML table, no redraw needed
          break;
      }
    }, 100);
  }

  private loadDataForCurrentTab(): void {
    const formValue = this.searchForm.value;
    const year = formValue.year || new Date().getFullYear();
    const month = formValue.month || new Date().getMonth() + 1;

    this.syntheticService.getPersonalSyntheticByMonth(year, month).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data;

          switch (this.selectedTabIndex) {
            case 0: // TỔNG HỢP
              if (data.listSummary) {
                // Handle both array and nested array structure
                let summaryArray: any[] = [];
                if (Array.isArray(data.listSummary)) {
                  // Check if it's a nested array (array of arrays)
                  if (data.listSummary.length > 0 && Array.isArray(data.listSummary[0])) {
                    // Flatten nested array
                    summaryArray = (data.listSummary as any[]).flat();
                  } else {
                    // Regular array
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
              if (data.payroll) {
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
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
        return `<strong>${value}</strong>`;
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

    this.fingerprintTabulator = new Tabulator(this.tbFingerprintRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '85vh',
      paginationMode: 'local',
      data: [],
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
          title: 'Giờ vào', field: 'CheckIn', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerWordWrap: true, headerSort: false
        },
        {
          title: 'Giờ ra', field: 'CheckOut', hozAlign: 'center', headerHozAlign: 'center',
          width: 100, headerWordWrap: true, headerSort: false
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
    // Timekeeping table will be dynamically generated based on days in month
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
        if (res && res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận bảng lương thành công');
          this.loadData();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Có lỗi xảy ra');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi: ' + (err?.error?.message || err.message));
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
        if (res && res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Hủy xác nhận bảng lương thành công');
          this.loadData();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Có lỗi xảy ra');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi: ' + (err?.error?.message || err.message));
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

    this.isLoadTable = true;

    this.syntheticService.getPersonalSyntheticByMonth(year, month).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          // API returns: { listSummary, fingers, payroll, listChamcong }
          const data = res.data;

          // Load summary data
          if (data.listSummary) {
            // Handle both array and nested array structure
            let summaryArray: any[] = [];
            if (Array.isArray(data.listSummary)) {
              // Check if it's a nested array (array of arrays)
              if (data.listSummary.length > 0 && Array.isArray(data.listSummary[0])) {
                // Flatten nested array
                summaryArray = (data.listSummary as any[]).flat();
              } else {
                // Regular array
                summaryArray = data.listSummary;
              }
            }
            this.summaryData = summaryArray;
            if (this.summaryTabulator) {
              this.summaryTabulator.setData(this.summaryData);
            }
          }

          // Load fingerprint data
          if (data.fingers) {
            this.fingerprintData = data.fingers;
            if (this.fingerprintTabulator && data.fingers.details && Array.isArray(data.fingers.details)) {
              this.fingerprintTabulator.setData(data.fingers.details);
            }
          }

          // Load timekeeping data
          if (data.listChamcong) {
            this.timekeepingData = data.listChamcong;
            this.loadTimekeepingTable(data.listChamcong);
          }

          // Load payroll data
          if (data.payroll) {
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
        } else {
          this.clearAllTables();
        }
        this.isLoadTable = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.clearAllTables();
        this.isLoadTable = false;
      }
    });
  }

  private loadTimekeepingTable(data: any) {
    if (!this.timekeepingTabulator || !data) {
      return;
    }

    // Build columns dynamically based on header data
    const columns: any[] = [
      {
        title: 'Họ tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center',
        width: 120, headerWordWrap: true, formatter: 'textarea', headerSort: false, frozen: true
      }
    ];

    if (data.header && Array.isArray(data.header)) {
      data.header.forEach((headerItem: any) => {
        columns.push({
          title: headerItem.text || '',
          field: headerItem.fieldname || '',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
          headerWordWrap: true,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            // Extract text part if value contains ";" separator (format: "Text;Status")
            if (value && typeof value === 'string' && value.includes(';')) {
              const parts = value.split(';');
              return parts[0] || '';
            }
            return value || '';
          }
        });
      });
    }

    columns.push({
      title: 'Công đi làm thực tế', field: 'TotalDayActual', hozAlign: 'right', headerHozAlign: 'center',
      width: 150, headerWordWrap: true, headerSort: false
    });

    this.timekeepingTabulator.setColumns(columns);

    // Set data after setting columns
    if (data.data) {
      const rowData = Array.isArray(data.data) ? data.data : [data.data];
      this.timekeepingTabulator.setData(rowData);

      // Extract summary data (assuming it's the first record for personal view)
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
}

