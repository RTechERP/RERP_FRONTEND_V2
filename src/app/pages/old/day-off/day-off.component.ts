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
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { DayOffService } from './day-off-service/day-off.service';
import { SummaryDayOffComponent } from './summary-day-off/summary-day-off.component';
import { DeclareDayOffComponent } from './declare-day-off/declare-day-off.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from "../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../app.config';


@Component({
  selector: 'app-day-off',
  templateUrl: './day-off.component.html',
  styleUrls: ['./day-off.component.css'],
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
    NzSplitterModule,
    SummaryDayOffComponent,
    DeclareDayOffComponent,
    NgIf,
    NzSpinModule,
    HasPermissionDirective
]
})
export class DayOffComponent implements OnInit, AfterViewInit{

  private tabulator! : Tabulator;
  searchForm! : FormGroup;
  dayOffForm!: FormGroup;
  employeeList: any[] = [];
  approverList: any[] = [];
  departmentList: any[] = [];
  dayOffList: any[] = [];

  sizeSearch: string = '0';
  sizeTbDetail: any ='0';

  isEditModal = false;
  isLoading = false;

  selectedDayOff: any = null;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private departmentService: DepartmentServiceService,
    private dayOffService: DayOffService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadEmployeeOnLeave();
    this.loadDepartments();
    this.loadApprovers();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]],
      departmentId: 0,
      status: -1,
      keyWord: '',
      pageNumber: 1,
      pageSize: 1000000,
      IDApprovedTP: 0
    });

    this.dayOffForm = this.fb.group({
      EmployeeID: [null, Validators.required],
      ApprovedTP: [null, Validators.required],
      StartDate: [new Date(), Validators.required],
      TimeOnLeave: [1, Validators.required],
      TypeIsReal: [1, Validators.required],
      Reason: ['', Validators.required],
      ReasonHREdit: [''],
      EndDate: [null]
    })

  }

  loadEmployeeOnLeave() {
    this.isLoading = true;
    this.dayOffService.getEmployeeOnLeave(this.searchForm.value).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.dayOffList = data.data;
        this.tabulator.setData(this.dayOffList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách ngày nghỉ của nhân viên: ' + error.message);
      }
    })
  }

  loadEmployees() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        // Format employee data for select options
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    })
  }

  loadApprovers() {
    this.employeeService.getEmployeeApprove().subscribe({
      next: (data) => {
        this.approverList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách người duyệt: ' + error.message);
      }
    })
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
        console.log(this.departmentList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_day_off', {
      data: this.dayOffList,
      layout: 'fitColumns',
      selectableRows: true,
      height: '85vh',
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 100,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      rowContextMenu: [
        {
          label: "TBP hủy duyệt hủy đăng ký",
          action: () => {

          }
        },
        {
          label: "HR hủy duyệt hủy đăng ký",
          action: () => {

          }
        }

      ],
      groupBy: 'DepartmentName',
      groupHeader: function(value, count, data, group){
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " nhân viên)</span>";
      },
      columns: [
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'BGĐ duyệt', field: 'IsApprovedBGD', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign:'left',headerHozAlign:'center', width: 140
        },
        {
          title: 'Họ và tên', field: 'FullName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Người duyệt', field: 'ApprovedName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Thời gian nghỉ', field: 'TimeOnLeaveText', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Ngày bắt đầu', field: 'StartDate', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Ngày kết thúc', field: 'EndDate', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Số ngày', field: 'TotalDay', hozAlign:'right',headerHozAlign:'center', width: 100
        },
        {
          title: 'Loại', field: 'TypeHR', hozAlign:'left',headerHozAlign:'center', width: 150
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Lý do hủy', field: 'ReasonCancel', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Ngày hủy', field: 'DateCancel', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'NV hủy đăng ký', field: 'IsCancelRegister', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'TBP duyệt hủy đăng ký', field: 'IsCancelTP', hozAlign:'center',headerHozAlign:'center', width: 200,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'HR duyệt hủy đăng ký', field: 'IsCancelHR', hozAlign:'center',headerHozAlign:'center', width: 200,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }


  resetSearch() {
    this.searchForm.reset();
    this.loadEmployeeOnLeave();
  }

  closeModal() {
    const modal = document.getElementById('addDayOffModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.dayOffForm.reset();
    // Reset validation cho ReasonHREdit
    this.dayOffForm.get('ReasonHREdit')?.clearValidators();
    this.dayOffForm.get('ReasonHREdit')?.updateValueAndValidity();
    this.isEditModal = false;
  }

  openAddModal() {
    this.isEditModal = false;
    this.dayOffForm.reset({
      ID: 0,
      EmployeeID: null,
      ApprovedTP: null,
      StartDate: new Date(),
      TimeOnLeave: 1,
      TypeIsReal: 1,
      Reason: '',
      ReasonHREdit: ''
    });
    // Reset validation cho ReasonHREdit khi thêm mới
    this.dayOffForm.get('ReasonHREdit')?.clearValidators();
    this.dayOffForm.get('ReasonHREdit')?.updateValueAndValidity();
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDayOffModal'));
    modal.show();
  }


  openEditModal() {
    this.isEditModal = true;
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày nghỉ cần sửa');
      return;
    }

    if (
      (selectedRows.length > 0 && selectedRows[0].getData()['IsApprovedTP'] === true && selectedRows[0].getData()['IsApprovedHR'] === true)
    ) {
      this.notification.warning('Cảnh báo', 'Đăng ký nghỉ đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
      return;
    }

    this.selectedDayOff = selectedRows[0].getData();
    this.dayOffForm.patchValue({
      ID: this.selectedDayOff.ID,
      EmployeeID: this.selectedDayOff.EmployeeID,
      ApprovedTP: this.selectedDayOff.ApprovedTP,
      StartDate: this.selectedDayOff.StartDate,
      TimeOnLeave: this.selectedDayOff.TimeOnLeave,
      TypeIsReal: this.selectedDayOff.TypeIsReal,
      Reason: this.selectedDayOff.Reason,
      ReasonHREdit: this.selectedDayOff.ReasonHREdit
    });
    // Đặt validation bắt buộc cho ReasonHREdit khi sửa
    this.dayOffForm.get('ReasonHREdit')?.setValidators([Validators.required]);
    this.dayOffForm.get('ReasonHREdit')?.updateValueAndValidity();

    this.dayOffForm.get('EmployeeID')?.disable();
    this.dayOffForm.get('ApprovedTP')?.disable();

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDayOffModal'));
    modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày nghỉ cần xóa');
      return;
    }

    if (
      (selectedRows.length > 0 && selectedRows[0].getData()['IsApprovedTP'] === true && selectedRows[0].getData()['IsApprovedHR'] === true)
    ) {
      this.notification.warning('Cảnh báo', 'Đăng ký nghỉ đã được duyệt. Vui lòng hủy duyệt trước khi xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa ngày nghỉ đã đăng ký này không?`,
      nzOkText:"Xóa",
      nzOkType:'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        for(let row of selectedRows) {
          let selectedDayOff = row.getData();
          this.dayOffService.saveEmployeeOnLeave({
            ...selectedDayOff,
            IsDeleted: true
          }).subscribe({
            next: (response) => {
              this.notification.success('Thành công', 'Xóa ngày nghỉ đã đăng ký thành công');
              this.loadEmployeeOnLeave();
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa ngày nghỉ đã đăng ký thất bại: ' + error.message);
            }
          });
        }

      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit() {
    if (this.dayOffForm.invalid) {
      Object.values(this.dayOffForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    let formData = { ...this.dayOffForm.value };

    // Kiểm tra nếu là sửa (có ID) thì bắt buộc phải nhập lý do sửa
    if (formData.ID && formData.ID > 0) {
      if (!formData.ReasonHREdit || formData.ReasonHREdit.trim() === '') {
        this.notification.warning('Cảnh báo', 'Khi sửa thông tin ngày nghỉ, vui lòng nhập lý do sửa');
        this.dayOffForm.get('ReasonHREdit')?.markAsTouched();
        return;
      }
    }

    // Xử lý lại StartDate, EndDate, TotalTime, TotalDay dựa vào TimeOnLeave
    const date = new Date(formData.StartDate);
    let startDate: Date, endDate: Date, totalTime: number, totalDay: number;

    if (formData.TimeOnLeave == 1) {
      // Morning leave (8:00 - 12:00)
      startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 8, 0, 0));
      endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
      totalTime = 4;
      totalDay = 0.5;
    } else if (formData.TimeOnLeave == 2) {
      // Afternoon leave (13:30 - 17:30)
      startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 13, 30, 0));
      endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 17, 30, 0));
      totalTime = 4;
      totalDay = 0.5;
    } else {
      // Full day leave (8:00 - 17:30)
      startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 8, 0, 0));
      endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 17, 30, 0));
      totalTime = 8;
      totalDay = 1;
    }

    formData.StartDate = startDate;
    formData.EndDate = endDate;
    formData.TotalTime = totalTime;
    formData.TotalDay = totalDay;

    // Nếu là update (có ID), reset trạng thái duyệt
    if (formData.ID && formData.ID > 0) {
      formData.IsApprovedHR = false;
      formData.IsApprovedTP = false;
    }

    this.dayOffService.saveEmployeeOnLeave(formData).subscribe({
        next: () => {
          this.notification.success('Thành công', 'Lưu ngày nghỉ thành công');
          this.closeModal();
          this.loadEmployeeOnLeave();
        },
        error: (response) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lưu ngày nghỉ thất bại: ' + response.error.message);
        },
      });
  }

  async exportToExcel() {
    // Chuẩn bị dữ liệu xuất từ danh sách ngày nghỉ phép
    const exportData = this.dayOffList
      .filter((item: any) => Object.keys(item).length > 0)
      .map((item: any, idx: number) => {
        // Format ngày tháng
        const formatDate = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
        return {
          'STT': idx + 1,
          'TBP duyệt': item.StatusText || '',
          'HR duyệt': item.StatusHRText || '',
          'BGĐ duyệt': item.IsApprovedBGD != null ? item.IsApprovedBGD : '',
          'Mã nhân viên': item.Code || '',
          'Họ và tên': item.FullName || '',
          'Phòng ban': item.DepartmentName || '',
          'Người duyệt': item.ApprovedName || '',
          'Thời gian nghỉ': item.TimeOnLeaveText || '',
          'Ngày bắt đầu': formatDate(item.StartDate),
          'Ngày kết thúc': formatDate(item.EndDate),
          'Số ngày': item.TotalDay != null ? item.TotalDay : '',
          'Loại': item.TypeHR || '',
          'Lý do': item.Reason || '',
          'Lý do sửa': item.ReasonHREdit || '',
          'Lý do hủy': item.ReasonCancel || '',
          'Lý do không đồng ý duyệt': item.ReasonDeciline || '',
          'Ngày hủy': formatDate(item.DateCancel),
          'NV hủy đăng kí': item.IsCancelRegister,
          'TBP duyệt hủy đăng kí': item.IsCancelTP,
          'HR duyệt hủy đăng kí': item.IsCancelHR
        };
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NgayNghiPhep');

    // Thêm header
    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 5, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: 'TBP duyệt', key: 'TBP duyệt', width: 15 },
      { header: 'HR duyệt', key: 'HR duyệt', width: 15 },
      { header: 'BGĐ duyệt', key: 'BGĐ duyệt', width: 15 },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 25 },
      { header: 'Phòng ban', key: 'Phòng ban', width: 20 },
      { header: 'Người duyệt', key: 'Người duyệt', width: 20 },
      { header: 'Thời gian nghỉ', key: 'Thời gian nghỉ', width: 15 },
      { header: 'Ngày bắt đầu', key: 'Ngày bắt đầu', width: 15 },
      { header: 'Ngày kết thúc', key: 'Ngày kết thúc', width: 15 },
      { header: 'Số ngày', key: 'Số ngày', width: 10 },
      { header: 'Loại', key: 'Loại', width: 15 },
      { header: 'Lý do', key: 'Lý do', width: 25 },
      { header: 'Lý do sửa', key: 'Lý do sửa', width: 25 },
      { header: 'Lý do hủy', key: 'Lý do hủy', width: 25 },
      { header: 'Lý do không đồng ý duyệt', key: 'Lý do không đồng ý duyệt', width: 25 },
      { header: 'Ngày hủy', key: 'Ngày hủy', width: 15 },
      { header: 'NV hủy đăng kí', key: 'NV hủy đăng kí', width: 15 },
      { header: 'TBP duyệt hủy đăng kí', key: 'TBP duyệt hủy đăng kí', width: 15 },
      { header: 'HR duyệt hủy đăng kí', key: 'HR duyệt hủy đăng kí', width: 15 },

    ];

    // Thêm dữ liệu
    exportData.forEach((row: any) => worksheet.addRow(row));

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
        row.height = 30;
        row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle' };
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          if (colNumber !== 1) {
            cell.font = { name: 'Tahoma', size: 10 };
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }
        });
      }
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    saveAs(blob, `DangKyNghi_T${month}_${year}.xlsx`);
  }

  approved(isApproved: boolean, isTBP: boolean) {
    const selectedRows = this.tabulator.getSelectedRows();
    const listID: number[] = [];
    let message = '';

    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đăng ký nghỉ cần duyệt');
      return;
    }

    // Lọc các dòng hợp lệ theo từng trường hợp
    if (isTBP && isApproved) {
      // TBP duyệt
      for (const row of selectedRows) {
        const data = row.getData();
        const id = data['ID'];
        if (id > 0) {
          listID.push(id);
        }
      }
    } else if (isTBP && !isApproved) {
      // TBP hủy duyệt
      message = 'Nhân viên đã được HR duyệt sẽ không thể hủy duyệt.\nBạn có muốn tiếp tục?';
      for (const row of selectedRows) {
        const data = row.getData();
        const id = data['ID'];
        const isApprovedHR = data['IsApprovedHR'];
        if (id > 0 && !isApprovedHR) {
          listID.push(id);
        }
      }
    } else if (!isTBP && isApproved) {
      // HR duyệt
      message = 'Nhân viên chưa được TBP duyệt sẽ không thể duyệt.\nBạn có muốn tiếp tục?';
      for (const row of selectedRows) {
        const data = row.getData();
        const id = data['ID'];
        const isApprovedTP = data['IsApprovedTP'];
        if (id <= 0 || !isApprovedTP) {
          continue;
        }
        listID.push(id);
      }
    } else if (!isTBP && !isApproved) {
      // HR hủy duyệt
      for (const row of selectedRows) {
        const data = row.getData();
        const id = data['ID'];
        if (id <= 0) {
          continue;
        }
        listID.push(id);
      }
    }

    const approveText = isApproved ? 'duyệt' : 'hủy duyệt';

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${approveText} danh sách nhân viên đã chọn.\n${message}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (listID.length > 0) {
          // Tạo dữ liệu cập nhật cho từng ID
          const updatePromises = listID.map(id => {
            const updateData: any = {
              ID: id
            };

            if (isTBP) {
              updateData['IsApprovedTP'] = isApproved;
            } else {
              updateData['IsApprovedHR'] = isApproved;
              // if (isApproved) {
              //   // Thêm ApprovedHR khi HR duyệt
              //   updateData['ApprovedHR'] = this.getCurrentEmployeeId(); // Cần implement hàm này
              // }
            }

            return this.dayOffService.saveEmployeeOnLeave(updateData).toPromise();
          });

          Promise.all(updatePromises)
            .then(() => {
              this.notification.success('Thành công', `${approveText.charAt(0).toUpperCase() + approveText.slice(1)} thành công!`);
              this.loadEmployeeOnLeave();
            })
            .catch((error) => {
              this.notification.error(NOTIFICATION_TITLE.error, `Cập nhật trạng thái duyệt thất bại: ${error.message}`);
            });
        }
      }
    });
  }

  isApproveCancelHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for(let row of selectedRows) {
      const data = row.getData();
      if(data['ID'] <= 0) {
        continue;
      }

      if(!data['IsCancelTP']) {
        this.notification.warning('Thông báo', 'TBP chưa duyệt hủy đăng ký. Vui lòng kiểm tra lại');
        return;
      }

      this.dayOffService.saveEmployeeOnLeave({
        ...data,
        IsCancelHR: true
      }).subscribe({
        next: (response) => {
          this.notification.success('Thành công', 'HR hủy duyệt đăng ký thành công');
          this.loadEmployeeOnLeave();
        },
        error: (error) => {
          this.notification.error('Thất bại', 'HR hủy duyệt đăng ký thất bại' + error.message);
        }
      })
    }
  }

  isApproveCancelTP() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for(let row of selectedRows) {
      const data = row.getData();
      if(data['ID'] <= 0) {
        continue;
      }

      const code = data['Code'];
      const fullName = data['FullName'];

      if(!data['IsCancelTP'] || !data['IsCancelRegister']) {
        this.notification.warning('Thông báo', `Nhân viên ${code} - ${fullName} chưa đăng ký hủy duyệt. Vui lòng kiểm tra lại`);
      } else {
        this.dayOffService.saveEmployeeOnLeave({
          ...data,
          IsCancelTP: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'TBP hủy duyệt đăng ký thành công');
            this.loadEmployeeOnLeave();
          },
          error: (error) => {
            this.notification.error('Thất bại', 'TBP hủy duyệt đăng ký thất bại' + error.message);
          }
        })
      }

    }
  }

  isDisapproveCancelHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for(let row of selectedRows) {
      const data = row.getData();
      if(data['ID'] <= 0) {
        continue;
      }

        this.dayOffService.saveEmployeeOnLeave({
          ...data,
          IsCancelHR: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'HR hủy duyệt hủy đăng ký thành công');
            this.loadEmployeeOnLeave();
          },
          error: (error) => {
            this.notification.error('Thất bại', 'HR hủy duyệt hủy đăng ký thất bại' + error.message);
          }
        })

    }
  }

  isDisapproveCancelTP() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for(let row of selectedRows) {
      const data = row.getData();
      if(data['ID'] <= 0) {
        continue;
      }

      const code = data['Code'];
      const fullName = data['FullName'];

      if(data['IsCancelHR']) {
        this.notification.warning('Thông báo', `HR chưa hủy duyệt nhân viên ${code} - ${fullName}. Vui lòng kiểm tra lại`);
      } else {
        this.dayOffService.saveEmployeeOnLeave({
          ...data,
          IsCancelTP: false
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'TBP hủy duyệt hủy đăng ký thành công');
            this.loadEmployeeOnLeave();
          },
          error: (error) => {
            this.notification.error('Thất bại', 'TBP hủy duyệt hủy đăng ký thất bại' + error.message);
          }
        })
      }

    }
  }


  openSummaryDayOffModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('summaryDayOffModal'));
    modal.show();
  }

  openDeclareDayOffModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('declareDayOffModal'));
    modal.show();
  }
}
