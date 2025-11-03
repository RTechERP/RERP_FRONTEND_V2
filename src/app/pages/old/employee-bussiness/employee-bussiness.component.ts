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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, Form } from '@angular/forms';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeBussinessService } from './employee-bussiness-service/employee-bussiness.service';
import { EmployeeBussinessDetailComponent } from './employee-bussiness-detail/employee-bussiness-detail.component';
import { EmployeeBussinessBonusComponent } from "./employee-bussiness-bonus/employee-bussiness-bonus.component";
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-employee-bussiness',
  templateUrl: './employee-bussiness.component.html',
  styleUrls: ['./employee-bussiness.component.css'],
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
    NgIf,
    NzSpinModule,
    EmployeeBussinessDetailComponent,
    EmployeeBussinessBonusComponent,
    HasPermissionDirective
]
})
export class EmployeeBussinessComponent implements OnInit, AfterViewInit{

  private tabulator!: Tabulator;
  sizeSearch: string = '0';
  searchForm!: FormGroup;
  employeeBussinessForm!: FormGroup;
  departmentList: any[] = [];
  employeeBussinessList: any[] = [];
  selectedEmployeeBussiness: any = null;
  employeeBussinessDetailData: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private departmentService: DepartmentServiceService,
    private employeeBussinessService: EmployeeBussinessService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();
    this.loadEmployeeBussiness();
  }

  private initializeForm() : void {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd);

    dateStart.setMonth(dateEnd.getMonth() - 5);
    dateEnd.setMonth(dateStart.getMonth() + 1);
    this.searchForm = this.fb.group({
      dateStart: dateStart,
      dateEnd: dateEnd,
      departmentId: 0,
      pageNumber: 1,
      pageSize: 1000000,
      keyWord: '',
      status: 0,
      IDApprovedTP: 0
    })
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadDepartment() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departmentList = data.data;
      },
      error: (error) => {
        this.notification.error("Lỗi", "Lỗi tải danh sách phòng ban");
      }
    })
  }
  

  loadEmployeeBussiness() {
    this.isLoading = true;
    this.employeeBussinessService.getEmployeeBussiness(this.searchForm.value).subscribe({
      next: (data) => {
        this.employeeBussinessList = data.data;
        this.tabulator.setData(this.employeeBussinessList);
        this.isLoading = false;
      }
    })
  }  

  private initializeTable(): void { 
    this.tabulator = new Tabulator('#tb_employee_bussiness', {
      data: this.employeeBussinessList,
      layout: 'fitColumns',
      selectableRows: true,
      height: '85vh',
      rowHeader: {
        formatter: "rowSelection", 
        titleFormatter: "rowSelection", 
        headerSort: false, 
        width: 60, 
        frozen: true, 
        headerHozAlign: "center", 
        hozAlign: "center"
      },
      groupBy: 'DepartmentName',
      groupHeader: function(value, count, data, group){
        return "<span style='color:black'>Phòng ban: </span>" + value;
      },
      columns: [
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'BGD duyệt', field: 'IsApprovedBGD', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Người duyệt', field: 'ApFullName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Bổ sung', field: 'IsProblem', hozAlign:'center',headerHozAlign:'center', width: 90,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Ngày', field: 'DayBussiness', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Nơi công tác', field: 'Location', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Loại', field: 'TypeName', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Phương tiện', field: 'VehicleName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Check-in', field: 'NotChekInText', hozAlign:'center',headerHozAlign:'center', width: 200,
        },
        {
          title: 'Phụ cấp ắn tối', field: 'CostOvernight', hozAlign:'right',headerHozAlign:'center', width: 200,
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Loại ắn tối', field: 'OvernightTypeText', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Phụ cấp đi làm sớm', field: 'CostWorkEarly', hozAlign:'left',headerHozAlign:'center', width: 200,
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Phụ cấp công tác', field: 'CostBussiness', hozAlign:'right',headerHozAlign:'center', width: 200,
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Phụ cấp phương tiện', field: 'Cost', hozAlign:'right',headerHozAlign:'center', width: 200,
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Tổng chi phí', field: 'Total', hozAlign:'right',headerHozAlign:'center', width: 200,
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign:'left',headerHozAlign:'center', width: 250
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign:'left',headerHozAlign:'center', width: 500
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign:'left',headerHozAlign:'center', width: 500
        },
      
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }
  

  openAddModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeBussinessModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đăng ký làm thêm cần chỉnh sửa');
      return;
    }
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đăng ký làm thêm cần xóa');
      return;
    }
  }

  approved(isApproved: boolean, isTBP: boolean) {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đăng ký làm thêm cần duyệt');
      return;
    }
  }

  onEmployeeBussinessDetail(){
    this.loadEmployeeBussiness();
  }
  
  openEmployeeBussinessBonusModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeBussinessBonusModal'));
    modal.show();
  }
  
}
