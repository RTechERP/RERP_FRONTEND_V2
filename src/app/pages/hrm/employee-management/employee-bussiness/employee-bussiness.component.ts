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
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EmployeeBussinessService } from './employee-bussiness-service/employee-bussiness.service';
import { EmployeeBussinessDetailComponent } from './employee-bussiness-detail/employee-bussiness-detail.component';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehiceDetailComponent } from './vehice-detail/vehice-detail.component';
import { EmployeeBussinessBonusComponent } from './employee-bussiness-bonus/employee-bussiness-bonus.component';
import { EmployeeBussinessSummaryComponent } from './employee-bussiness-summary/employee-bussiness-summary.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '../../../../auth/auth.service';
import { PermissionService } from '../../../../services/permission.service';

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
    NzGridModule,
    HasPermissionDirective,
    NzDropDownModule
  ]
})
export class EmployeeBussinessComponent implements OnInit, AfterViewInit, OnChanges {

  private tabulator!: Tabulator;
  sizeSearch: string = '0';
  showSearchBar: boolean = true;
  searchForm!: FormGroup;
  employeeBussinessForm!: FormGroup;
  departmentList: any[] = [];
  employeeBussinessList: any[] = [];
  selectedEmployeeBussiness: any = null;
  employeeBussinessDetailData: any[] = [];
  isLoading = false;

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  // Current user info
  currentUser: any = null;
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  isAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private departmentService: DepartmentServiceService,
    private employeeBussinessService: EmployeeBussinessService,
    private projectService: ProjectService,
    private modalService: NgbModal,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();
    this.getCurrentUser();
    this.loadEmployeeBussiness();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.currentEmployeeId = data.EmployeeID || 0;
        this.currentDepartmentId = data?.DepartmentID || 0;
        this.currentDepartmentName = data?.DepartmentName || '';
        this.isAdmin = data?.ISADMIN || false;
      }
    });
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

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
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
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      selectableRows: true,
      paginationMode: 'local',

      groupBy: 'DepartmentName',
      groupHeader: function (value, count, data, group) {
        return "<span style='color:black'>Phòng ban: </span>" + value;
      },

      columns: [
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign: 'center', headerHozAlign: 'center', width: 110, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
            let numValue = 0;
            if (value === null || value === undefined) {
              numValue = 0;
            } else if (typeof value === 'number') {
              numValue = value;
            } else if (typeof value === 'string') {
              // Map string sang number
              if (value === 'Đã duyệt') numValue = 1;
              else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
              else numValue = 0; // Chưa duyệt hoặc giá trị khác
            }
            return this.formatApprovalBadge(numValue);
          },
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', hozAlign: 'center', headerHozAlign: 'center', width: 110, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
            let numValue = 0;
            if (value === null || value === undefined) {
              numValue = 0;
            } else if (typeof value === 'number') {
              numValue = value;
            } else if (typeof value === 'string') {
              // Map string sang number
              if (value === 'Đã duyệt') numValue = 1;
              else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
              else numValue = 0; // Chưa duyệt hoặc giá trị khác
            }
            return this.formatApprovalBadge(numValue);
          },
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
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 90, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 140, headerSort: false, bottomCalc: 'count', formatter: 'textarea'
        },
        {
          title: 'Người duyệt', field: 'ApFullName', hozAlign: 'left', headerHozAlign: 'center', width: 140, headerSort: false, formatter: 'textarea'
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
          title: 'Lý do công tác', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 300, headerSort: false,
        },
        {
          title: 'Loại', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center', width: 220, headerSort: false,
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
          title: 'Loại ăn tối', field: 'OvernightTypeText', hozAlign: 'left', headerHozAlign: 'center', width: 200, headerSort: false,
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
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 250, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, formatter: 'textarea'
        },

      ],

    });
  }

  openAddModal() {

    // this.employeeBussinessDetailData = [];
    // const modal = new (window as any).bootstrap.Modal(document.getElementById('employeeBussinessModal'));
    // modal.show();

    const modalRef = this.modalService.open(EmployeeBussinessDetailComponent, {
      centered: false,
      size: 'fullscreen',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-fullscreen',
      modalDialogClass: 'modal-fullscreen'
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

    const selectedData = selectedRows[0].getData();

    // Kiểm tra trạng thái duyệt - cho phép người có quyền sửa bất kể đã duyệt
    if (this.isApproved(selectedData) && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký đã được duyệt. Bạn không có quyền sửa!');
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
            centered: false,
            size: 'fullscreen',
            backdrop: 'static',
            keyboard: false,
            windowClass: 'modal-fullscreen',
            modalDialogClass: 'modal-fullscreen'
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

    // Lọc ra các bản ghi đã duyệt (không cho xóa)
    const approvedRows = selectedRows.filter(row => {
      const data = row.getData();
      return data['IsApprovedHR'] === true && data['IsApproved'] === true;
    });

    // Lọc ra các bản ghi chưa duyệt (cho phép xóa)
    const notApprovedRows = selectedRows.filter(row => {
      const data = row.getData();
      return !(data['IsApprovedHR'] === true && data['IsApproved'] === true);
    });

    // Nếu có bản ghi đã duyệt, cảnh báo nhưng vẫn cho xóa những cái chưa duyệt
    if (approvedRows.length > 0) {
      const names = approvedRows.map(row => row.getData()['FullName']).join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Có ${approvedRows.length} bản ghi đã duyệt sẽ được bỏ qua. Chỉ xóa ${notApprovedRows.length} bản ghi chưa duyệt.`
      );
    }

    // Nếu không có bản ghi nào chưa duyệt thì dừng
    if (notApprovedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Tất cả bản ghi đã chọn đều đã được duyệt. Chỉ có thể xóa bản ghi chưa duyệt!'
      );
      return;
    }

    const count = notApprovedRows.length;
    const confirmMessage = count === 1
      ? `Bạn có chắc chắn muốn xóa đăng ký công tác của <strong>"${notApprovedRows[0].getData()['FullName']}"</strong> không?`
      : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> đăng ký công tác đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lấy toàn bộ dữ liệu của các row chưa duyệt và set IsDeleted = true
        const dataToDelete = notApprovedRows.map(row => {
          const rowData = row.getData();
          return {
            ...rowData,
            IsDeleted: true
          };
        });

        // Gọi API save với IsDeleted = true để xóa mềm
        this.employeeBussinessService.saveEmployeeBussiness(dataToDelete).subscribe({
          next: (res) => {
            if (res?.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa ${count} đăng ký công tác thành công!`
              );
              this.loadEmployeeBussiness();
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                res?.message || 'Xóa đăng ký công tác thất bại!'
              );
            }
          },
          error: (error) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi xóa đăng ký công tác: ' + (error?.message || 'Lỗi không xác định')
            );
          }
        });
      }
    });
  }

  approved(isApproved: boolean, isTBP: boolean) {
    if (isTBP) {
      if (isApproved) {
        this.approvedTBP();
      } else {
        this.cancelApprovedTBP();
      }
    } else {
      if (isApproved) {
        this.approvedHR();
      } else {
        this.cancelApprovedHR();
      }
    }
  }

  approvedTBP(): void {
    const selectedRows = this.tabulator.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn đăng ký công tác để duyệt!'
      );
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());

    // Kiểm tra nghiệp vụ trước khi hiển thị confirm
    for (const item of selectedData) {
      const departmentId = item['DepartmentID'] || 0;
      const employeeId = item['EmployeeID'] || 0;
      const employeeName = item['FullName'] || '';

      if (employeeId === 0) continue;

      // Kiểm tra quyền nếu không phải admin
      if (!this.isAdmin) {
        if (departmentId !== this.currentDepartmentId && this.currentDepartmentId !== 1) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Nhân viên [${employeeName}] không thuộc phòng [${this.currentDepartmentName.toUpperCase()}].\nVui lòng kiểm tra lại!`
          );
          return;
        }
      }

      // Không được duyệt cho chính mình
      if (employeeId === this.currentEmployeeId) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn không được duyệt cho chính mình.\nVui lòng liên hệ cấp cao hơn!`
        );
        return;
      }
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(selectedData),
    });
  }

  private confirmApproveTBP(selectedData: any[]): void {
    // Lọc và chuẩn bị dữ liệu hợp lệ - chỉ lấy ID
    const listID: number[] = [];

    selectedData.forEach(item => {
      const employeeId = item['EmployeeID'] || 0;
      const id = item['ID'] || 0;

      if (employeeId === 0 || id === 0) return;

      // Thêm tất cả ID vào list (theo logic C#: listID.Add cho tất cả khi duyệt TBP)
      listID.push(id);
    });

    if (listID.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có bản ghi hợp lệ để duyệt!'
      );
      return;
    }

    // Gọi API duyệt TBP với danh sách ID
    const approveData = listID.map(id => ({ ID: id, Status: 1, IsApproved: true }));
    this.employeeBussinessService.saveApproveTBP(approveData).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Duyệt TBP thành công ${listID.length} bản ghi!`
          );
          this.loadEmployeeBussiness();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Duyệt TBP thất bại!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi duyệt TBP: ' + (error?.message || 'Lỗi không xác định')
        );
      },
    });
  }

  cancelApprovedTBP(): void {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất 1 đăng ký công tác cần hủy duyệt TBP!'
      );
      return;
    }
    const selectedData = selectedRows.map(row => row.getData());

    this.modal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Hủy duyệt TBP',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApprovedTBP(selectedData),
    });
  }

  private confirmCancelApprovedTBP(selectedData: any[]): void {
    // Lọc và chuẩn bị dữ liệu hợp lệ - chỉ lấy ID nếu HR chưa duyệt
    const listID: number[] = [];

    selectedData.forEach(item => {
      const id = item['ID'] || 0;
      if (id === 0) return;

      // Chỉ thêm ID nếu HR chưa duyệt (theo logic C#: if (!IsApprovedHR))
      if (!item['IsApprovedHR']) {
        listID.push(id);
      }
    });

    if (listID.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có bản ghi hợp lệ để hủy duyệt! (HR đã duyệt)'
      );
      return;
    }

    // Gọi API hủy duyệt TBP với danh sách ID
    const cancelData = listID.map(id => ({ ID: id, IsApproved: false, Status: 2 }));
    this.employeeBussinessService.saveApproveTBP(cancelData).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `TBP đã hủy duyệt ${listID.length} bản ghi thành công!`
          );
          this.loadEmployeeBussiness();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Hủy duyệt TBP thất bại!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi hủy duyệt TBP: ' + (error?.message || 'Lỗi không xác định')
        );
      },
    });
  }

  approvedHR(): void {
    const selectedRows = this.tabulator.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn đăng ký công tác để duyệt!'
      );
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());

    // Kiểm tra nghiệp vụ trước khi hiển thị confirm
    for (const item of selectedData) {
      const employeeId = item['EmployeeID'] || 0;
      const employeeName = item['FullName'] || '';
      const isApprovedTP = item['IsApproved'] || false;

      if (employeeId === 0) continue;

      // Kiểm tra TBP đã duyệt chưa
      if (!isApprovedTP) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn không thể duyệt vì nhân viên [${employeeName}] chưa được TBP duyệt.\nVui lòng kiểm tra lại!`
        );
        return;
      }
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận duyệt HR',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHR(selectedData, true),
    });
  }

  private confirmApproveHR(selectedData: any[], isApproved: boolean = true): void {
    const approved = isApproved ? 'duyệt' : 'hủy duyệt';

    // Lọc và chuẩn bị dữ liệu hợp lệ - chỉ lấy ID
    const listID: number[] = [];
    const itemsToUpdate: any[] = [];

    // Duyệt từ cuối lên đầu (theo logic C#: for (int i = rowIndex.Length - 1; i >= 0; i--))
    for (let i = selectedData.length - 1; i >= 0; i--) {
      const item = selectedData[i];
      const id = item['ID'] || 0;
      const isApprovedTP = item['IsApproved'] || false;

      if (id === 0) continue;

      if (isApproved) {
        // HR duyệt: chỉ thêm ID nếu TBP đã duyệt
        if (isApprovedTP) {
          listID.push(id);
          // Cập nhật ApprovedHR = currentEmployeeId (theo logic C#)
          itemsToUpdate.push({
            ...item,
            ID: id,
            ApprovedHR: this.currentEmployeeId,
            StatusHR: 1,
            IsApprovedHR: true
          });
        }
      } else {
        // HR hủy duyệt: thêm tất cả ID
        listID.push(id);
        itemsToUpdate.push({
          ...item,
          ID: id,
          IsApprovedHR: false,
          StatusHR: 2
        });
      }
    }

    if (listID.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Không có bản ghi hợp lệ để ${approved}!`
      );
      return;
    }

    // Gọi API duyệt/hủy duyệt HR với danh sách items
    this.employeeBussinessService.saveApproveHR(itemsToUpdate).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `HR đã ${approved} ${listID.length} bản ghi thành công!`
          );
          this.loadEmployeeBussiness();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || `${approved} HR thất bại!`
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi ${approved} HR: ` + (error?.message || 'Lỗi không xác định')
        );
      },
    });
  }

  cancelApprovedHR(): void {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất 1 đăng ký công tác cần hủy duyệt HR!'
      );
      return;
    }
    const selectedData = selectedRows.map(row => row.getData());

    // Kiểm tra nghiệp vụ trước khi hiển thị confirm
    for (const item of selectedData) {
      const employeeId = item['EmployeeID'] || 0;
      const employeeName = item['FullName'] || '';
      const isApprovedTP = item['IsApproved'] || false;

      if (employeeId === 0) continue;

      // Kiểm tra TBP đã duyệt chưa
      if (!isApprovedTP) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn không thể hủy duyệt vì nhân viên [${employeeName}] chưa được TBP duyệt.\nVui lòng kiểm tra lại!`
        );
        return;
      }
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận hủy duyệt HR',
      nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Hủy duyệt HR',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApprovedHR(selectedData),
    });
  }

  private confirmCancelApprovedHR(selectedData: any[]): void {
    // Lọc và chuẩn bị dữ liệu hợp lệ - thêm tất cả ID (theo logic C#)
    const itemsToUpdate: any[] = [];

    selectedData.forEach(item => {
      const id = item['ID'] || 0;
      if (id === 0) return;

      // Thêm tất cả ID (theo logic C#: listID.Add cho tất cả khi HR hủy duyệt)
      itemsToUpdate.push({
        ...item,
        ID: id,
        IsApprovedHR: false,
        StatusHR: 2
      });
    });

    if (itemsToUpdate.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có bản ghi hợp lệ để hủy duyệt HR!'
      );
      return;
    }

    // Gọi API hủy duyệt HR với danh sách items
    this.employeeBussinessService.saveApproveHR(itemsToUpdate).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `HR đã hủy duyệt ${itemsToUpdate.length} bản ghi thành công!`
          );
          this.loadEmployeeBussiness();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Hủy duyệt HR thất bại!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi hủy duyệt HR: ' + (error?.message || 'Lỗi không xác định')
        );
      },
    });
  }

  onEmployeeBussinessDetail() {
    this.loadEmployeeBussiness();
    this.initializeTable();
  }

  // openEmployeeBussinessTypeMasterModal() {
  //   const modalRef = this.modalService.open(EmployeeBussinessTypeMasterComponent, {
  //     centered: true,
  //     size: 'xl',
  //     backdrop: 'static',
  //     keyboard: false,
  //     modalDialogClass: 'modal-fullscreen'
  //   });

  //   modalRef.result.then(
  //     (result) => {
  //       console.log('Type Master modal closed:', result);
  //     },
  //     (reason) => {
  //       console.log('Type Master modal dismissed:', reason);
  //     }
  //   );
  // }

  // openEmployeeBussinessVehicleMasterModal() {
  //   const modalRef = this.modalService.open(EmployeeBussinessVehicleMasterComponent, {
  //     centered: true,
  //     size: 'xl',
  //     backdrop: 'static',
  //     keyboard: false,
  //     modalDialogClass: 'modal-fullscreen'
  //   });

  //   modalRef.result.then(
  //     (result) => {
  //       console.log('Vehicle Master modal closed:', result);
  //     },
  //     (reason) => {
  //       console.log('Vehicle Master modal dismissed:', reason);
  //     }
  //   );
  // }

  openEmployeeBussinessBonusModal() {
    const modalRef = this.modalService.open(EmployeeBussinessBonusComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      modalDialogClass: 'modal-fullscreen'
    });

    modalRef.result.then(
      (result) => {
        console.log('Bonus modal closed:', result);
      },
      (reason) => {
        console.log('Bonus modal dismissed:', reason);
      }
    );
  }

  openWorkReportModal() {
    const modalRef = this.modalService.open(EmployeeBussinessSummaryComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      modalDialogClass: 'modal-fullscreen'
    });

    modalRef.result.then(
      (result) => {
        console.log('Work report modal closed:', result);
      },
      (reason) => {
        console.log('Work report modal dismissed:', reason);
      }
    );
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

  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus = status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
    }
  }

  // Helper method để kiểm tra bản ghi đã được duyệt chưa
  private isApproved(item: any): boolean {
    // Kiểm tra trạng thái duyệt TBP
    const isTBPApproved =
      item.IsApproved === true ||
      item.IsApproved === 1 ||
      item.IsApproved === '1';

    // Kiểm tra trạng thái duyệt HR
    const isHRApproved =
      item.IsApprovedHR === true ||
      item.IsApprovedHR === 1 ||
      item.IsApprovedHR === '1';

    // Nếu TBP hoặc HR đã duyệt thì coi như đã duyệt
    return isTBPApproved || isHRApproved;
  }

  // Helper method để kiểm tra user có quyền chỉnh sửa nhân viên (N1, N2 hoặc IsAdmin)
  private canEditEmployee(): boolean {
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN2Permission = this.permissionService.hasPermission('N2');
    const isAdminCheck = this.currentUser?.IsAdmin === true || this.currentUser?.ISADMIN === true || this.isAdmin;

    return hasN1Permission || hasN2Permission || isAdminCheck;
  }

  // Kiểm tra user có quyền sửa/xóa bản ghi đã duyệt (N1, N2 hoặc IsAdmin)
  checkCanEditApproved(): boolean {
    return this.canEditEmployee();
  }

}
