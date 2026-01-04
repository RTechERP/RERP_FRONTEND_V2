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
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { AppUserService } from '../../../../services/app-user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeclareDayOffDetailComponent } from './declare-day-off-detail/declare-day-off-detail.component';

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
    NgIf,
    HasPermissionDirective
  ],
})
export class DeclareDayOffComponent implements OnInit {

  private tabulator!: Tabulator;

  declareDayOff: any[] = [];
  employeeList: any[] = [];
  selectedDeclare: any = null;
  isLoading = false;

  currentUser: any;
  currentEmployee: any;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private dayOffService: DayOffService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit() {
    this.loadDeclareDayOff();
    this.initializeTable();
    this.loadEmployees();

    this.currentEmployee = this.appUserService.currentUser
    console.log('Current Employee:', this.currentEmployee);
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
        this.isLoading = false;
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

  openAddModal(): void {
    const modalRef = this.ngbModal.open(DeclareDayOffDetailComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.declareDayOffData = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then(
      (result) => {
        if (result?.action === 'save') {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu khai báo ngày phép thành công');
          this.loadDeclareDayOff();
        }
      },
      () => { }
    );
  }

  openEditModal(): void {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khai báo cần sửa');
      return;
    }

    this.selectedDeclare = selectedRows[0].getData();

    const modalRef = this.ngbModal.open(DeclareDayOffDetailComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.declareDayOffData = this.selectedDeclare;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.then(
      (result) => {
        if (result?.action === 'save') {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu khai báo ngày phép thành công');
          this.loadDeclareDayOff();
        }
      },
      () => { }
    );
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
    const modalEl = document.getElementById('importExcelForm');
    const modal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
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
