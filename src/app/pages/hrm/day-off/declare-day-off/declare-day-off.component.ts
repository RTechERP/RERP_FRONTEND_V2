import { Component, OnInit, ViewChild } from '@angular/core';
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
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import { DayOffService } from '../day-off-service/day-off.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DayOffImportExcelComponent } from '../day-off-import-excel/day-off-import-excel.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-declare-day-off',
  templateUrl: './declare-day-off.component.html',
  styleUrls: ['./declare-day-off.component.css'],
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
    DayOffImportExcelComponent,
    NzSpinModule,
    NgIf
  ],
})
export class DeclareDayOffComponent implements OnInit {

  private tabulator!: Tabulator;

  declareDayOff: any[] = [];
  employeeList: any[] = [];
  declareDayOffForm!: FormGroup;
  selectedDeclare: any = null;
  isEditMode = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private dayOffService: DayOffService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit() {
    this.loadDeclareDayOff();
    this.initializeTable();
    this.initializeForm();
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employeeList = data.data || data;
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách nhân viên');
      }
    });
  }

  loadDeclareDayOff() {
    this.isLoading = true;
    this.dayOffService.getEmployeeOnLeaveMaster().subscribe({
      next: (data) => {
        this.declareDayOff = data.data;
        this.tabulator.setData(this.declareDayOff);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách khai báo ngày phép');
      }
    })
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_declare_day_off', {
      data: this.declareDayOff,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      height: '80vh',
      groupBy: 'DepartmentName',
      groupHeader: function (value, count, data, group) {
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " nhân viên)</span>";
      },
      columns: [
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', },
        { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Năm', field: 'YearOnleave', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Tổng số ngày phép', field: 'TotalDayInYear', hozAlign: 'right', headerHozAlign: 'center' },
      ]
    });
  }

  private initializeForm(): void {
    this.declareDayOffForm = this.fb.group({
      ID: [0],
      EmployeeID: [null, Validators.required],
      TotalDayInYear: [0, Validators.required],
      TotalDayNoOnLeave: [0, Validators.required],
      TotalDayOnLeave: [0, Validators.required],
      TotalDayRemain: [0, Validators.required],
      YearOnleave: [0, Validators.required]
    })
  }

  openAddModal() {
    this.isEditMode = false;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    this.declareDayOffForm.reset({
      ID: 0,
      EmployeeID: null,
      TotalDayInYear: 1,
      TotalDayNoOnLeave: 0,
      TotalDayOnLeave: 0,
      TotalDayRemain: 0,
      YearOnleave: currentYear,
      IsDeleted: 0
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDeclareDayOffModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khai báo cần sửa');
      return;
    }
    this.isEditMode = true;
    this.selectedDeclare = selectedRows[0].getData();
    this.declareDayOffForm.patchValue({
      ...this.selectedDeclare
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDeclareDayOffModal'));
    modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khai báo cần xóa');
      return;
    }
    this.selectedDeclare = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa khai báo ngày phép của nhân viên ${this.selectedDeclare.FullName} không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteDeclareDayOff(),
      nzCancelText: 'Hủy'
    });
  }

  deleteDeclareDayOff() {
    this.dayOffService.saveEmployeeOnLeaveMaster({
      ...this.selectedDeclare,
      IsDeleted: true
    }).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa khai báo ngày phép thành công');
        this.loadDeclareDayOff();
        this.selectedDeclare = null;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Xóa khai báo ngày phép thất bại: ' + (error?.message || ''));
      }
    });
  }

  onSubmit() {
    if (this.declareDayOffForm.invalid) {
      Object.values(this.declareDayOffForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    const formData = {
      ...this.declareDayOffForm.value
    };
    this.dayOffService.saveEmployeeOnLeaveMaster(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu khai báo ngày phép thành công');
        this.closeModal();
        this.loadDeclareDayOff();
      },
      error: (response) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lưu khai báo ngày phép thất bại: ' + (response.error?.message || ''));
      }
    });
  }

  closeModal() {
    const modal = document.getElementById('addDeclareDayOffModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.declareDayOffForm.reset();
  }


  async exportToExcel() {
    // Nhóm dữ liệu theo phòng ban
    const grouped = this.declareDayOff.reduce((acc: any, item: any) => {
      const dept = item.DepartmentName || 'Không xác định';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KhaiBaoNgayNghiPhep');

    // Định nghĩa cột
    const columns = [
      { header: '', key: 'Mã nhân viên', width: 40 },
      { header: '', key: 'Tên nhân viên', width: 40 },
      { header: '', key: 'Năm', width: 40 },
      { header: '', key: 'Tổng số ngày phép', width: 40 }
    ];
    worksheet.columns = columns;

    //Thêm header một lần ở đầu file
    const headerRow = worksheet.addRow(columns.map(col => col.key));
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    headerRow.height = 30;

    let rowIndex = 2; // Bắt đầu sau header
    for (const dept in grouped) {
      // Thêm dòng tiêu đề phòng ban
      const deptRow = worksheet.addRow([dept, '', '', '']);
      deptRow.font = { name: 'Tahoma', size: 11, bold: true };
      deptRow.alignment = { horizontal: 'left', vertical: 'middle' };
      deptRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      deptRow.height = 25;
      // worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      // rowIndex++;

      // Thêm dữ liệu nhân viên
      grouped[dept].forEach((item: any) => {
        const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
        const row = worksheet.addRow({
          'Mã nhân viên': safe(item.Code),
          'Tên nhân viên': safe(item.FullName),
          'Năm': safe(item.YearOnleave),
          'Tổng số ngày phép': safe(item.TotalDayInYear)
        });
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        });
        row.height = 40;
        rowIndex++;
      });
    }

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `KhaiBaoNgayNghiPhep.xlsx`);
  }

  @ViewChild(DayOffImportExcelComponent) dayOffImportExcelComponent!: DayOffImportExcelComponent;
  openImportExcelForm() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('importExcelForm'));
    modal.show();

    this.dayOffImportExcelComponent.ngOnInit();
  }


  onSearchEmployee(event: any) {
    const keyword = event.target.value.toLowerCase();
    if (keyword != "") {
      this.tabulator.setFilter([
        [
          { field: 'Code', type: 'like', value: keyword },
          { field: 'FullName', type: 'like', value: keyword },
          { field: 'DepartmentName', type: 'like', value: keyword },
          { field: 'YearOnleave', type: 'like', value: keyword },
        ]
      ], 'or');
    } else {
      this.loadDeclareDayOff();
      this.initializeTable();
    }
  }
}
