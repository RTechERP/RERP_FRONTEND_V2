import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HolidayServiceService } from '../holiday-service/holiday-service.service';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { filter } from 'rxjs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';


@Component({
  selector: 'app-employee-schedule-work',
  templateUrl: './employee-schedule-work.component.html',
  styleUrls: ['./employee-schedule-work.component.css'],
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
    NzTabsModule,
    NgIf,
    NzSpinModule
  ],
})
export class EmployeeScheduleWorkComponent implements OnInit {

  private scheduleWorkTabulator!: Tabulator;
  searchForm!: FormGroup;
  scheduleWorkForm!: FormGroup;
  scheduleWorks: any[] = [];
  originalScheduleWorks: any[] = []; // Lưu trữ dữ liệu gốc
  selectedScheduleWork: any = null;
  departmentList: any[] = [];

  // Properties for register work
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  selectedDepartmentId: number = 0;
  filterText: string = '';

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private holidayService: HolidayServiceService,
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadScheduleWork();

     // Subscribe to month and year changes
     this.searchForm.get('month')?.valueChanges.subscribe(() => {
        this.loadScheduleWork();
    });

    this.searchForm.get('year')?.valueChanges.subscribe(() => {
        this.loadScheduleWork();
    });
  }


  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]]
    });

    this.scheduleWorkForm = this.fb.group({
      ID: [0],
      DateValue: [''],
      Status: [false],
      WorkYear: [0],
      WorkMonth: [0],
      WorkDay: [0],
      IsApproved: [false],
      Approver: [0]
    })
  }

  private initializeTable(): void {
    this.scheduleWorkTabulator = new Tabulator('#tb_schedule-work', {
      data: this.scheduleWorks,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      height: '70vh',
      columns: [
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
          cellClick: (e: any, cell: any) => {
            // Xử lý sự kiện click vào checkbox
            const target = e.target as HTMLInputElement;
            if (target.tagName === 'INPUT' && target.type === 'checkbox') {
              const currentValue = cell.getValue();
              const newValue = !(currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1');
              cell.setValue(newValue);

              // Cập nhật dữ liệu trong scheduleWorks
              const rowData = cell.getRow().getData();
              const index = this.scheduleWorks.findIndex((item: any) => item.ID === rowData.ID);
              if (index !== -1) {
                this.scheduleWorks[index].Status = newValue;
              }
            }
          }
        },
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
          cellClick: (e: any, cell: any) => {
            // Xử lý sự kiện click vào checkbox
            const target = e.target as HTMLInputElement;
            if (target.tagName === 'INPUT' && target.type === 'checkbox') {
              const currentValue = cell.getValue();
              const newValue = !(currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1');
              cell.setValue(newValue);

              // Cập nhật dữ liệu trong scheduleWorks
              const rowData = cell.getRow().getData();
              const index = this.scheduleWorks.findIndex((item: any) => item.ID === rowData.ID);
              if (index !== -1) {
                this.scheduleWorks[index].IsApproved = newValue;
              }
            }
          }
        },
        { title: 'Người duyệt', field: 'FullName', hozAlign: 'center', headerHozAlign: 'center',},
        { title: 'Thời gian', field: 'DateValue', hozAlign: 'center', headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        { title: 'Trạng thái làm việc', field: 'StatusWork', hozAlign: 'center', headerHozAlign: 'center'},
      ]
    });
  }



  loadScheduleWork() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;

    this.isLoading = true;

    this.holidayService.getEmployeeScheduleWork(month, year).subscribe({
      next: (data) => {
        this.scheduleWorks = data.data;
        this.originalScheduleWorks = JSON.parse(JSON.stringify(data.data)); // Lưu trữ dữ liệu gốc
        this.initializeTable();
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu lịch làm việc');
        console.error('Error loading holidays:', error);
      }
    });
  }

  saveEmployeeScheduleWork() {
    // Lấy dữ liệu gốc ban đầu để so sánh
    const originalData = [...this.originalScheduleWorks];

    // Lọc ra những dòng có thay đổi trạng thái
    const updatedData = this.scheduleWorks.filter((row: any) => {
      // So sánh với dữ liệu gốc để tìm những dòng có thay đổi
      const originalRow = originalData.find((item: any) => item.ID === row.ID);

      if (!originalRow) {
        return false;
      }

      // Chuẩn hóa giá trị boolean để so sánh
      const originalStatus = Boolean(originalRow.Status);
      const currentStatus = Boolean(row.Status);
      const originalIsApproved = Boolean(originalRow.IsApproved);
      const currentIsApproved = Boolean(row.IsApproved);

      return originalStatus !== currentStatus || originalIsApproved !== currentIsApproved;
    });

    if (updatedData.length === 0) {
      this.notification.warning('Thông báo', 'Không có thay đổi nào để lưu');
      return;
    }

    // Lưu từng dòng có thay đổi
    const savePromises = updatedData.map((row: any) => {
      const formData = {
        ID: row.ID,
        DateValue: row.DateValue,
        WorkYear: row.WorkYear,
        WorkMonth: row.WorkMonth,
        WorkDay: row.WorkDay,
        Status: Boolean(row.Status),
        IsApproved: Boolean(row.IsApproved),
        Approver: row.Approver
      };

      return this.holidayService.saveEmployeeScheduleWork(formData).toPromise();
    });

    // Thực hiện lưu tất cả
    Promise.all(savePromises)
      .then(() => {
        this.notification.success('Thành công', 'Cập nhật lịch làm việc thành công');
        this.loadScheduleWork(); // Tải lại dữ liệu
      })
      .catch((response) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật lịch làm việc thất bại: ' + response.error.message);
      });
  }


  approvedSW(isApproved: boolean) {
    const approvedText = isApproved ? 'duyệt' : 'hủy duyệt';
    const month = this.searchForm.get('month')?.value;
    const listID: number[] = [];

    // Kiểm tra trạng thái từng dòng
    for (const row of this.scheduleWorks) {
      const isRowApproved = !!row.IsApproved;
      const approverID = row.Approver || 0;

      if (approverID === 0) continue;

      if (!isRowApproved && !isApproved) {
        this.notification.warning(
          'Thông báo',
          `Bạn không thể hủy duyệt vì: Lịch làm việc tháng [${month}] chưa được duyệt.\nVui lòng kiểm tra lại!`
        );
        return;
      }
      if (isRowApproved && isApproved) {
        this.notification.warning(
          'Thông báo',
          `Bạn không thể duyệt vì: Lịch làm việc tháng [${month}] đã được duyệt.\nVui lòng kiểm tra lại!`
        );
        return;
      }
    }

    // Xác nhận trước khi thực hiện
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${approvedText} lịch làm việc tháng [${month}] không?`,
      nzOnOk: () => {
        const updatePromises = [];

        for (const row of this.scheduleWorks) {
          const id = row.ID;
          listID.push(id);

          // Cập nhật trạng thái và người duyệt
          row.IsApproved = isApproved;
          // row.Approver = isApproved ? 368 : 0;

          // Gọi API cập nhật từng dòng
          updatePromises.push(
            this.holidayService.saveEmployeeScheduleWork(row).toPromise()
          );
        }

        Promise.all(updatePromises)
          .then(() => {
            this.notification.success('Thành công', `${approvedText.charAt(0).toUpperCase() + approvedText.slice(1)} lịch làm việc thành công!`);
            this.loadScheduleWork();
          })
          .catch((error) => {
            this.notification.error(NOTIFICATION_TITLE.error, `Cập nhật lịch làm việc thất bại: ${error.message}`);
          });
      }
    });
  }


  async exportToExcel() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    const exportData = this.scheduleWorks
      .filter(scheduleWork => Object.keys(scheduleWork).length > 0)
      .map((scheduleWork, idx) => {
        const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
        return {
          'Trạng thái': scheduleWork.Status ? '✓' : '',
          'Duyệt': scheduleWork.IsApproved ? 'Đã duyệt' : 'Chưa duyệt',
          'Người duyệt': safe(scheduleWork.FullName),
          'Thời gian': safe(DateTime.fromISO(scheduleWork.DateValue).toFormat('dd/MM/yyyy')),
          'Trạng thái làm việc': safe(scheduleWork.StatusWork),
        };
      });
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('LichLamViec');

      worksheet.columns = [
        { header: 'Trạng thái', key: 'Trạng thái', width: 20, style: { alignment: { horizontal: 'center', vertical: 'middle' } }},
        { header: 'Duyệt', key: 'Duyệt', width: 20 },
        { header: 'Người duyệt', key: 'Người duyệt', width: 40},
        { header: 'Thời gian', key: 'Thời gian', width: 20},
        { header: 'Trạng thái làm việc', key: 'Trạng thái làm việc', width: 20},
      ]
      // Thêm dữ liệu
    exportData.forEach(row => worksheet.addRow(row));

    // Định dạng header
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    worksheet.getRow(1).height = 30;

    // Định dạng các dòng dữ liệu
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber !== 1) {
        row.height = 40;
        row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle' };
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          if (colNumber !== 1) {
            cell.font = { name: 'Tahoma', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          }
        });
      }
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `LichLamViec_T${month}_${year}.xlsx`);
  }

}
