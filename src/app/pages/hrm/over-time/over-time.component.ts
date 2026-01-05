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
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { OverTimeService } from './over-time-service/over-time.service';
import { OverTimeDetailComponent } from "./over-time-detail/over-time-detail.component";
import { OverTimeTypeComponent } from "./over-time-type/over-time-type.component";
import { SummaryOverTimeComponent } from './summary-over-time/summary-over-time.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '../../../auth/auth.service';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';


@Component({
  selector: 'app-over-time',
  templateUrl: './over-time.component.html',
  styleUrls: ['./over-time.component.css'],
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
    NzCardModule,
    NzGridModule,
    OverTimeDetailComponent,
    OverTimeTypeComponent,
    SummaryOverTimeComponent,
    HasPermissionDirective,
    NzDropDownModule,
    Menubar
  ]
})
export class OverTimeComponent implements OnInit, AfterViewInit {

  private tabulator!: Tabulator;
  sizeSearch: string = '0';
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  searchForm!: FormGroup;
  overTimeForm!: FormGroup;
  departmentList: any[] = [];
  overTimeList: any[] = [];
  selectedOverTime: any = null;
  overTimeDetailData: any[] = [];
  isLoading = false;
  currentUser: any = null;

  // Menu bars
  menuBars: any[] = [];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private departmentService: DepartmentServiceService,
    private overTimeService: OverTimeService,
    private authService: AuthService,
    private permissionService: PermissionService,

  ) { }

  ngOnInit() {
    this.initMenuBar();
    this.initializeForm();
    this.loadDepartment();
    this.loadEmployeeOverTime();
    this.loadDepartment();
    this.loadEmployeeOverTime();
    this.getCurrentUser();
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        visible: true,
        command: () => {
          this.openAddModal();
        }
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        visible: true,
        command: () => {
          this.openEditModal();
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: true,
        command: () => {
          this.openDeleteModal();
        }
      },
      {
        label: 'TBP xác nhận',
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        visible: true,
        items: [
          {
            label: 'TBP duyệt',
            visible: this.permissionService.hasPermission("N1"),
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => {
              this.approved(true, true);
            }
          },
          {
            label: 'TBP hủy duyệt',
            visible: this.permissionService.hasPermission("N1"),
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => {
              this.approved(false, true);
            }
          }
        ]
      },
      {
        label: 'HR xác nhận',
        icon: 'fa-solid fa-calendar-check fa-lg text-info',
        visible: true,
        items: [
          {
            label: 'HR duyệt',
            visible: this.permissionService.hasPermission("N2,N1"),
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => {
              this.approved(true, false);
            }
          },
          {
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => {
              this.approved(false, false);
            }
          }
        ]
      },
      {
        label: 'Kiểu làm thêm',
        icon: 'fa-solid fa-info-circle fa-lg text-primary',
        visible: true,
        command: () => {
          this.openOverTimeTypeModal();
        }
      },
      {
        label: 'Báo cáo làm thêm',
        icon: 'fa-solid fa-file-alt fa-lg text-warning',
        visible: true,
        command: () => {
          this.openSummaryOverTimeModal();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: true,
        command: () => {
          this.exportToExcel();
        }
      }
    ];
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        this.currentUser = Array.isArray(res.data) ? res.data[0] : res.data;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  private initializeForm(): void {
    const today = new Date();
    const dateStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

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

  loadEmployeeOverTime() {
    this.isLoading = true;
    this.overTimeService.getEmployeeOverTime(this.searchForm.value).subscribe({
      next: (data) => {
        this.overTimeList = data.data;
        this.tabulator.setData(this.overTimeList);
        this.isLoading = false;
      }
    })
  }


  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_over_time', {
      data: this.overTimeList,
      layout: 'fitColumns',
      columnCalcs: 'both',
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
          title: 'Senior duyệt', field: 'IsSeniorApprovedText', hozAlign: 'center', headerHozAlign: 'center', width: 110,
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
          title: 'TBP duyệt', field: 'StatusText', hozAlign: 'center', headerHozAlign: 'center', width: 110,
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
          title: 'HR duyệt', field: 'StatusHRText', hozAlign: 'center', headerHozAlign: 'center', width: 110,
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
          title: 'BGD duyệt', field: 'IsApprovedBGD', hozAlign: 'center', headerHozAlign: 'center', width: 110,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Tên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200, bottomCalc: 'count'
        },
        {
          title: 'Người duyệt', field: 'NguoiDuyet', hozAlign: 'left', headerHozAlign: 'center', width: 200
        },
        {
          title: 'Bổ sung', field: 'IsProblem', hozAlign: 'center', headerHozAlign: 'center', width: 90,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Ngày', field: 'DateRegister', hozAlign: 'center', headerHozAlign: 'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Từ', field: 'TimeStart', hozAlign: 'center', headerHozAlign: 'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm ') : '';
          }
        },
        {
          title: 'Đến', field: 'EndTime', hozAlign: 'center', headerHozAlign: 'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat(' dd/MM/yyyy HH:mm') : '';
          }
        },
        {
          title: 'CheckIn', field: 'CheckIn', hozAlign: 'center', headerHozAlign: 'center', width: 100,
          formatter: (cell) => {
            const value = cell.getValue();
            const data = cell.getRow().getData();

            if (data['IsNotValid'] === 1) {
              const el = cell.getElement();
              el.style.backgroundColor = '#fff3cd';
              el.style.color = '#dc3545';
              el.style.fontWeight = 'bold';
            }

            return value || '';
          }
        },
        {
          title: 'CheckOut', field: 'CheckOut', hozAlign: 'center', headerHozAlign: 'center', width: 100,
          formatter: (cell) => {
            const value = cell.getValue();
            const data = cell.getRow().getData();

            if (data['IsNotValid'] === 1) {
              const el = cell.getElement();
              el.style.backgroundColor = '#fff3cd';
              el.style.color = '#dc3545';
              el.style.fontWeight = 'bold';
            }

            return value || '';
          }
        },
        {
          title: 'Ăn tối', field: 'Overnight', hozAlign: 'center', headerHozAlign: 'center', width: 80,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Số giờ', field: 'TimeReality', hozAlign: 'right', headerHozAlign: 'center', width: 100
        },
        {
          title: 'Địa điểm', field: 'LocationText', hozAlign: 'left', headerHozAlign: 'center', width: 150
        },
        {
          title: 'Loại', field: 'Type', hozAlign: 'left', headerHozAlign: 'center', width: 150
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 500
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 500
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 500
        },

      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }


  openAddModal() {
    // Reset detail data for add mode
    this.overTimeDetailData = [];
    const modal = new (window as any).bootstrap.Modal(document.getElementById('overTimeModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký làm thêm cần chỉnh sửa');
      return;
    }
    // Kiểm tra trạng thái duyệt - cho phép người có quyền sửa bất kể đã duyệt
    const selectedData = selectedRows[0].getData();
    if (this.isApproved(selectedData) && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
      return;
    }

    const selectedOverTime = selectedRows[0].getData();
    this.selectedOverTime = selectedOverTime;

    // Call API to get detail data
    const dateRegister = new Date(selectedOverTime['DateRegister']);
    const formattedDate = dateRegister.toLocaleDateString('en-CA');

    this.overTimeService.getEmployeeOverTimeDetail(selectedOverTime['EmployeeID'], formattedDate).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          // Store the detail data
          this.overTimeDetailData = response.data;
          // Open modal
          const modal = new (window as any).bootstrap.Modal(document.getElementById('overTimeModal'));
          modal.show();
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
    const selectedRows = this.tabulator.getSelectedRows() || [];

    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký nghỉ cần xóa');
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());

    // Kiểm tra xem có bản ghi nào đã được duyệt không - cho phép người có quyền xóa bất kể đã duyệt
    const approvedRecords = selectedData.filter(data => this.isApproved(data));

    if (approvedRecords.length > 0 && !this.checkCanEditApproved()) {
      this.notification.warning(
        'Cảnh báo',
        `Có ${approvedRecords.length}/${selectedData.length} đăng ký đã được duyệt. Bạn không có quyền xóa!`
      );
      return;
    }

    // Lọc các bản ghi hợp lệ để xóa (ID > 0 và chưa bị xóa)
    const validRows = selectedData.filter(data =>
      data['ID'] > 0 && !data['IsDeleted']
    );

    if (validRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi nào hợp lệ để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa ${validRows.length}/${selectedData.length} đăng ký làm thêm đã chọn không?`,
      nzOkText: "Xóa",
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const formData = {
          EmployeeOvertimes: validRows.map(item => ({
            ID: item['ID'],
            EmployeeID: item['EmployeeID'],
            ApprovedID: item['ApprovedID'],
            DateRegister: item['DateRegister'],
            TimeStart: item['TimeStart'],
            EndTime: item['EndTime'],
            Location: item['Location'],
            Overnight: item['Overnight'],
            TypeID: item['TypeID'],
            Reason: item['Reason'],
            ReasonHREdit: item['ReasonHREdit'],
            IsApproved: item['IsApproved'],
            IsApprovedHR: item['IsApprovedHR'],
            IsDeleted: true,
          }))
        };

        this.overTimeService.saveEmployeeOverTime(formData).subscribe({
          next: (response) => {
            this.notification.success(
              'Thành công',
              `Xóa ${validRows.length} đăng ký làm thêm thành công`
            );
            this.loadEmployeeOverTime();
          },
          error: (error) => {
            console.error('Error deleting overtime:', error);
            this.notification.error(
              'Lỗi',
              `Xóa đăng ký làm thêm thất bại: ${error.message || 'Vui lòng thử lại'}`
            );
          }
        });
      }
    });
  }

  async exportToExcel() {
    // Nhóm dữ liệu theo phòng ban
    const grouped = this.overTimeList.reduce((acc: any, item: any) => {
      const dept = `Phòng ban: ${item.DepartmentName}` || 'Không xác định';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DangKyLamThem');

    const columns = [
      { header: '', key: 'TBP duyệt', width: 20 },
      { header: '', key: 'HR duyệt', width: 20 },
      { header: '', key: 'Tên nhân viên', width: 30 },
      { header: '', key: 'Người duyệt', width: 30 },
      { header: '', key: 'Ngày', width: 15 },
      { header: '', key: 'Từ', width: 20 },
      { header: '', key: 'Đến', width: 20 },
      { header: '', key: 'Số giờ', width: 10 },
      { header: '', key: 'Địa điểm', width: 20 },
      { header: '', key: 'Loại', width: 20 },
      { header: '', key: 'Ăn tối', width: 10 },
      { header: '', key: 'Lý do', width: 30 },
      { header: '', key: 'Lý do sửa', width: 30 },
      { header: '', key: 'Lý do không đồng ý duyệt', width: 30 }
    ];

    worksheet.columns = columns;

    // Thêm header một lần ở đầu file
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

    let rowIndex = 2;
    for (const dept in grouped) {
      // Thêm dòng tiêu đề phòng ban
      const deptRow = worksheet.addRow([dept, '', '', '', '', '', '', '', '', '', '', '', '', '']);
      deptRow.font = { name: 'Tahoma', size: 9, bold: true };
      deptRow.alignment = { horizontal: 'left', vertical: 'middle' };
      deptRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB7DEE8' }
      };
      deptRow.height = 25;

      // Thêm dữ liệu nhân viên
      grouped[dept].forEach((item: any) => {
        const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
        const formatDate = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
        const formatDateTime = (val: any) => val ? DateTime.fromISO(val).toFormat('HH:mm dd/MM/yyyy') : '';
        const row = worksheet.addRow({
          'TBP duyệt': safe(item.StatusText),
          'HR duyệt': safe(item.StatusHRText),
          'Tên nhân viên': safe(item.FullName),
          'Người duyệt': safe(item.NguoiDuyet),
          'Ngày': safe(formatDate(item.DateRegister)),
          'Từ': safe(formatDateTime(item.TimeStart)),
          'Đến': safe(formatDateTime(item.EndTime)),
          'Số giờ': safe(item.TimeReality),
          'Địa điểm': safe(item.LocationText),
          'Loại': safe(item.Type),
          'Ăn tối': safe(item.Overnight ? 'Có' : 'Không'),
          'Lý do': safe(item.Reason),
          'Lý do sửa': safe(item.ReasonHREdit),
          'Lý do không đồng ý duyệt': safe(item.ReasonDeciline),
        });
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
        row.height = 40;
        rowIndex++;
      });
    }

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `DanhSachLamThem.xlsx`);
  }


  openOverTimeTypeModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('overTimeTypeModal'));
    modal.show();
  }

  onEmployeeOverTimeDetail() {
    this.loadEmployeeOverTime();
  }


  approved(isApproved: boolean, isTBP: boolean) {
    const selectedRows = this.tabulator.getSelectedRows() || [];

    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký nghỉ cần duyệt');
      return;
    }

    const selectedData = selectedRows.map(row => row.getData());
    let validRows: any[] = [];
    let message = '';

    // Lọc các dòng hợp lệ theo từng trường hợp
    if (isTBP && isApproved) {
      // TBP duyệt - chỉ lấy các dòng có ID > 0
      validRows = selectedData.filter(data => data['ID'] > 0);
    } else if (isTBP && !isApproved) {
      // TBP hủy duyệt - chỉ lấy các dòng chưa được HR duyệt
      validRows = selectedData.filter(data => data['ID'] > 0 && !data['IsApprovedHR']);
      message = 'Nhân viên đã được HR duyệt sẽ không thể hủy duyệt.\nBạn có muốn tiếp tục?';
    } else if (!isTBP && isApproved) {
      // HR duyệt - chỉ lấy các dòng đã được TBP duyệt
      validRows = selectedData.filter(data => data['ID'] > 0 && data['IsApproved']);
      message = 'Nhân viên chưa được TBP duyệt sẽ không thể duyệt.\nBạn có muốn tiếp tục?';
    } else if (!isTBP && !isApproved) {
      // HR hủy duyệt - lấy tất cả các dòng có ID > 0
      validRows = selectedData.filter(data => data['ID'] > 0);
    }

    // if (validRows.length === 0) {
    //   this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dòng nào phù hợp để thực hiện thao tác');
    //   return;
    // }

    const approveText = isApproved ? 'duyệt' : 'hủy duyệt';
    const roleText = isTBP ? 'TBP' : 'HR';

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${approveText} ${validRows.length}/${selectedData.length} đăng ký làm thêm đã chọn bằng quyền ${roleText}?\n${message}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const formData = {
          EmployeeOvertimes: validRows.map(item => {
            const updateData: any = {
              ID: item.ID,
              EmployeeID: item.EmployeeID,
              ApprovedID: item.ApprovedID,
              DateRegister: item.DateRegister,
              TimeStart: item.TimeStart,
              EndTime: item.EndTime,
              Location: item.Location,
              Overnight: item.Overnight,
              TypeID: item.TypeID,
              Reason: item.Reason,
              ReasonHREdit: item.ReasonHREdit,
              // Giữ nguyên các giá trị hiện tại
              IsApproved: item.IsApproved,
              IsApprovedHR: item.IsApprovedHR,
              IsDeleted: item.IsDeleted
            };

            // Cập nhật trạng thái duyệt theo role
            if (isTBP) {
              updateData.IsApproved = isApproved;
            } else {
              updateData.IsApprovedHR = isApproved;
              if (isApproved) {
                updateData.ApprovedHR = this.currentUser?.EmployeeID;
              }
            }

            return updateData;
          })
        };

        this.overTimeService.saveEmployeeOverTime(formData).subscribe({
          next: (response) => {
            this.loadEmployeeOverTime();
            this.notification.success(
              'Thành công',
              `${approveText.charAt(0).toUpperCase() + approveText.slice(1)} ${validRows.length} đăng ký làm thêm thành công`
            );
          },
          error: (error) => {
            console.error('Error updating overtime:', error);
            this.notification.error(
              'Lỗi',
              `Cập nhật đăng ký làm thêm thất bại: ${error.message || 'Vui lòng thử lại'}`
            );
          }
        });
      }
    });
  }

  openSummaryOverTimeModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('summaryOverTimeModal'));
    modal.show();
  }


  resetSearch() {
    this.initializeForm();
    this.loadEmployeeOverTime();
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

    // Nếu TBP hoặc HR đã duyệt thì không cho sửa
    return isTBPApproved || isHRApproved;
  }

  // Helper method để kiểm tra user có quyền chỉnh sửa nhân viên (N1, N2 hoặc IsAdmin)
  private canEditEmployee(): boolean {
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN2Permission = this.permissionService.hasPermission('N2');
    const isAdmin = this.currentUser?.IsAdmin === true || this.currentUser?.ISADMIN === true;

    return hasN1Permission || hasN2Permission || isAdmin;
  }

  // Kiểm tra user có quyền sửa/xóa bản ghi đã duyệt (N1, N2 hoặc IsAdmin)
  checkCanEditApproved(): boolean {
    return this.canEditEmployee();
  }

}

