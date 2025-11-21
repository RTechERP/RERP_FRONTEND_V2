import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
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
import { DepartmentServiceService } from '../../../old/department/department-service/department-service.service';
import { EmployeeService } from '../../../old/employee/employee-service/employee.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeBussinessService } from './employee-bussiness-service/employee-bussiness.service';
import { EmployeeBussinessDetailComponent } from './employee-bussiness-detail/employee-bussiness-detail.component';
import { EmployeeBussinessBonusComponent } from "./employee-bussiness-bonus/employee-bussiness-bonus.component";
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehiceDetailComponent } from './vehice-detail/vehice-detail.component';

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
    EmployeeBussinessBonusComponent,
    HasPermissionDirective
  ]
})
export class EmployeeBussinessComponent implements OnInit, AfterViewInit, OnChanges {

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
    private employeeBussinessService: EmployeeBussinessService,
    private projectService: ProjectService,
    private modalService: NgbModal,
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();
    this.loadEmployeeBussiness();
  }

  private initializeForm(): void {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd);

    dateStart.setMonth(dateEnd.getMonth() - 1);
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

  ngOnChanges(changes: SimpleChanges): void {
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
    this.searchForm.patchValue({
      departmentId: this.searchForm.value.departmentId ?? 0,
    });
    this.employeeBussinessService.getEmployeeBussiness(this.searchForm.value).subscribe({
      next: (data) => {
        this.employeeBussinessList = data.data;
        this.tabulator.setData(this.employeeBussinessList);
        this.isLoading = false;
      }
    })
  }

  resetSearch() {
    this.initializeForm();
    this.loadEmployeeBussiness();
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_employee_bussiness', {
      data: this.employeeBussinessList,
      layout: 'fitColumns',
      selectableRows: true,
      height: '88vh',
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
      groupHeader: function (value, count, data, group) {
        return "<span style='color:black'>Phòng ban: </span>" + value;
      },
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      columns: [
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign: 'center', headerHozAlign: 'center', width: 110, headerSort: false,
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', hozAlign: 'center', headerHozAlign: 'center', width: 110, headerSort: false,
        },
        {
          title: 'BGD duyệt', field: 'IsApprovedBGD', hozAlign: 'center', headerHozAlign: 'center', width: 110, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Người duyệt', field: 'ApFullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Bổ sung', field: 'IsProblem', hozAlign: 'center', headerHozAlign: 'center', width: 90, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Ngày', field: 'DayBussiness', hozAlign: 'center', headerHozAlign: 'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }, headerSort: false,
        },
        {
          title: 'Nơi công tác', field: 'Location', hozAlign: 'left', headerHozAlign: 'center', width: 300, headerSort: false,
        },
        {
          title: 'Loại', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center', width: 300, headerSort: false,
        },
        {
          title: 'Phương tiện', field: 'VehicleName', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Check-in', field: 'NotChekInText', hozAlign: 'center', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Phụ cấp ắn tối', field: 'CostOvernight', hozAlign: 'right', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Loại ắn tối', field: 'OvernightTypeText', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
        },
        {
          title: 'Phụ cấp đi làm sớm', field: 'CostWorkEarly', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Phụ cấp công tác', field: 'CostBussiness', hozAlign: 'right', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Phụ cấp phương tiện', field: 'Cost', hozAlign: 'right', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Tổng chi phí', field: 'Total', hozAlign: 'right', headerHozAlign: 'center', width: 200, headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 250, headerSort: false,
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false,
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false,
        },

      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }

  openAddModal() {

    // this.employeeBussinessDetailData = [];
    // const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeBussinessModal'));
    // modal.show();

    const modalRef = this.modalService.open(EmployeeBussinessDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.detailData = [];

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadEmployeeBussiness();
        }
      },
      (reason) => {
        this.loadEmployeeBussiness();
      }
    );
  }

  openEditModal() {
    
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký công tác cần chỉnh sửa');
      return;
    }

    if (
      (selectedRows.length > 0 && selectedRows[0].getData()['IsApprovedHR'] === true && selectedRows[0].getData()['IsApproved'] === true)
    ) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
      return;
    }

    let employeeId = selectedRows[0].getData()['EmployeeID'];
    const day = selectedRows[0].getData()['DayBussiness'];
    this.employeeBussinessService.getEmployeeBussinessDetail(employeeId, day).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          // Store the detail data
          this.employeeBussinessDetailData = response.data;
          // Open modal
          const modalRef = this.modalService.open(EmployeeBussinessDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
          });
          modalRef.componentInstance.detailData = response.data;

          modalRef.result.then(
            (result) => {
              if (result?.success) {
                this.loadEmployeeBussiness();
              }
            },
            (reason) => {
              this.loadEmployeeBussiness();
            }
          );
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Không tìm thấy dữ liệu chi tiết');
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu chi tiết');
      }
    });
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký công tác cần xóa');
      return;
    }

    const approvedRows = selectedRows.filter(row =>
      row.getData()['IsApprovedHR'] === true && row.getData()['IsApproved'] === true
    );

    if (approvedRows.length > 0) {
      const names = approvedRows.map(row => row.getData()['FullName']).join(', ');

      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Nhân viên ${names} đã được duyệt. Vui lòng hủy duyệt trước khi xóa!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa những nhân viên đã chọn?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lấy list ID của các row đã chọn
        const ids = selectedRows.map(row => row.getData()['ID']);

        // Gọi API xóa
        this.employeeBussinessService.deletedEmployeeBussiness(ids).subscribe(res => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa đăng ký bạn chọn!');
          this.loadEmployeeBussiness();
          this.initializeTable();
        });
      }
    });
  }

  approved(isApproved: boolean, isTBP: boolean) {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký công tác cần duyệt');
      return;
    }
  }

  onEmployeeBussinessDetail() {
    this.loadEmployeeBussiness();
    this.initializeTable();
  }

  openEmployeeBussinessBonusModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeBussinessBonusModal'));
    modal.show();
  }

  exportExcel() {
    let data = this.tabulator.getData();
    if (data == null) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất. Vui lòng kiểm tra lại!');
      return;
    }

    const ds = new Date(this.searchForm.value.dateStart);
    const dateS = ds.getDate().toString().padStart(2, "0") +
      (ds.getMonth() + 1).toString().padStart(2, "0") +
      ds.getFullYear().toString().slice(2);

    const de = new Date(this.searchForm.value.dateEnd);
    const dateE = de.getDate().toString().padStart(2, "0") +
      (de.getMonth() + 1).toString().padStart(2, "0") +
      de.getFullYear().toString().slice(2);
    this.projectService.exportExcelGroup(this.tabulator, data, 'DanhSachCongtac', `DanhSachCongTac_${dateS}_${dateE}`, 'DepartmentName');
  }


}
