import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HolidayServiceService } from './holiday-service/holiday-service.service';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import { EmployeeScheduleWorkComponent } from './employee-schedule-work/employee-schedule-work.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    EmployeeScheduleWorkComponent,
    NzSpinModule,
    NgIf,HasPermissionDirective
  ],
  standalone: true,
})
export class HolidayComponent implements OnInit, AfterViewInit {
  private holidayTabulator!: Tabulator;
  holidays: any[] = [];
  selectedHoliday: any = null;
  searchForm!: FormGroup;
  holidayForm!: FormGroup;
  viewAll = new FormControl(false);
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private holidayService: HolidayServiceService
  ) {
    this.viewAll.valueChanges.subscribe((checked) => {
      if (checked) {
        // Load all holidays for the current year
        const year =
          this.searchForm.get('year')?.value || new Date().getFullYear();

        this.holidayService.getHolidays(0, year).subscribe({
          next: (data) => {
            this.holidays = data.data.holidays;
            console.log(this.holidays);
            if (this.holidayTabulator) {
              this.holidayTabulator.setData(this.holidays);
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu ngày lễ');
            console.error('Error loading holidays:', error);
            // Reset checkbox on error
            this.viewAll.setValue(false, { emitEvent: false });
          },
        });
      } else {
        // Reset to normal search with current month and year
        this.loadHolidays();
      }
    });
  }

  ngOnInit() {
    this.initializeForm();
    // this.initializeTable();
    //this.loadHolidays();

    // Subscribe to month and year changes
    this.searchForm.get('month')?.valueChanges.subscribe(() => {
      if (!this.viewAll.value) {
        this.loadHolidays();
      }
    });

    this.searchForm.get('year')?.valueChanges.subscribe(() => {
      if (!this.viewAll.value) {
        this.loadHolidays();
      }
    });
  }
  ngAfterViewInit(): void {
    // this.initializeTable();
    this.loadHolidays();
  }
  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [
        currentMonth,
        [Validators.required, Validators.min(1), Validators.max(12)],
      ],
      year: [
        currentYear,
        [Validators.required, Validators.min(1), Validators.max(3000)],
      ],
    });

    this.holidayForm = this.fb.group({
      ID: [0],
      HolidayDate: [currentDate],
      HolidayName: ['', Validators.required],
      HolidayCode: [''],
      TypeHoliday: [null, Validators.required],
      Note: [''],
      HolidayYear: [0],
      HolidayMonth: [0],
      HolidayDay: [0],
      DayValue: ['H'],
    });
  }

  private initializeTable(datasource: any): void {
    this.holidayTabulator = new Tabulator('#tb_holiday', {
      data: datasource,
      ...DEFAULT_TABLE_CONFIG,

      layout: 'fitDataStretch',
      //   responsiveLayout: true,
      //   selectableRows: 1,
      //   height: '85vh',
      columns: [
        {
          title: 'Ngày',
          field: 'HolidayDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Tên',
          field: 'HolidayName',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại',
          field: 'TypeHolidayText',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
      ],
    });

    this.holidayTabulator.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedHoliday = row.getData();
    });

    this.holidayTabulator.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.selectedHoliday = row.getData();
      // this.openEditModal();
    });
  }

  loadHolidays() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    this.isLoading = true;

    this.holidayService.getHolidays(month, year).subscribe({
      next: (data) => {
        this.holidays = data.data.holidays;
        // console.log('this.holidays', this.holidays);
        this.initializeTable(this.holidays);

        // this.holidayTabulator.setData(this.holidays);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
        console.error('Error loading holidays:', error);
      },
    });
  }

  openAddModal() {
    this.holidayForm.reset({
      ID: 0,
      HolidayDate: new Date(), // Pass Date object directly, not in an array
      HolidayName: '',
      TypeHoliday: null,
      Note: '',
      HolidayYear: 0,
      HolidayMonth: 0,
      HoliayDay: 0,
    });
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addHolidayModal')
    );
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.holidayTabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày nghỉ cần sửa');
      return;
    }

    this.selectedHoliday = selectedRows[0].getData();
    this.holidayForm.patchValue({
      ID: this.selectedHoliday.ID,
      HolidayDate: this.selectedHoliday.HolidayDate,
      HolidayName: this.selectedHoliday.HolidayName,
      TypeHoliday: Number(this.selectedHoliday.TypeHoliday),
      Note: this.selectedHoliday.Note,
      HolidayYear: this.selectedHoliday.HolidayDate.year,
      HolidayMonth: this.selectedHoliday.HolidayDate.month,
      HoliayDay: this.selectedHoliday.HolidayDate.day,
    });
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addHolidayModal')
    );
    modal.show();
  }

  onSubmit() {
    if (this.holidayForm.invalid) {
      Object.values(this.holidayForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
    }

    if (this.holidayForm.valid) {
      const formData = {
        ...this.holidayForm.value,
        HolidayYear: new Date(this.holidayForm.value.HolidayDate).getFullYear(),
        HolidayMonth:
          new Date(this.holidayForm.value.HolidayDate).getMonth() + 1,
        HolidayDay: new Date(this.holidayForm.value.HolidayDate).getDate(),
        DayValue: 'H',
      };

      this.holidayService.saveHoliday(formData).subscribe({
        next: (response) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu ngày nghỉ thành công');
          this.closeModal();
          this.loadHolidays();
        },
        error: (response) => {
          this.notification.error(
            'Lỗi',
            'Lưu ngày nghỉ thất bại: ' + response.error.message
          );
        },
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('addHolidayModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.holidayForm.reset();
  }

  openDeleteModal() {
    const selectedRows = this.holidayTabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày nghỉ cần xóa');
      return;
    }
    this.selectedHoliday = selectedRows[0].getData();
    const formattedDate = DateTime.fromISO(
      this.selectedHoliday.HolidayDate
    ).toFormat('dd/MM/yyyy');
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ngày nghỉ ${formattedDate} không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteHoliday(),
      nzCancelText: 'Hủy',
    });
  }

  deleteHoliday() {
    this.holidayService
      .saveHoliday({
        ...this.selectedHoliday,
        IsDeleted: true,
      })
      .subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xóa ngày nghỉ thành công');
          this.loadHolidays();
          this.selectedHoliday = null;
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Xóa phòng ban thất bại: ' + error.message
          );
        },
      });
  }

  openScheduleWorkModal() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('scheduleWorkModal')
    );
    modal.show();
  }
}
