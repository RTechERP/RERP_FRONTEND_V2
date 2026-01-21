import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, TemplateRef } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { EarlyLateService } from './early-late-service/early-late.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { AuthService } from '../../../auth/auth.service';
import { WFHService } from '../employee-management/employee-wfh/WFH-service/WFH.service';
import { PermissionService } from '../../../services/permission.service';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-early-late',
  templateUrl: './early-late.component.html',
  styleUrls: ['./early-late.component.css'],
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
    NzGridModule,
    NzRadioModule,
    NzTimePickerModule,
    NzSpinModule,
    NgIf,
    HasPermissionDirective,
    NzDropDownModule,
    FormsModule,
    Menubar
  ]
})
export class EarlyLateComponent implements OnInit, AfterViewInit {

  private tabulator!: Tabulator;
  sizeSearch: string = '0';
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  // Menu bars
  menuBars: any[] = [];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  searchForm!: FormGroup;
  earlyLateForm!: FormGroup;
  departmentList: any[] = [];
  earlyLateList: any[] = [];
  employeeList: any[] = [];
  approverList: any[] = [];
  approvers: { department: string, list: any[] }[] = [];

  selectedEarlyLate: any = null;
  currentUser: any;
  currentEmployee: any;


  isLoading = false;

  @ViewChild('reasonTpl') reasonTpl!: TemplateRef<any>;
  reasonText = '';
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private earlyLateService: EarlyLateService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private wfhService: WFHService,
    private permissionService: PermissionService,
  ) { }

  ngOnInit() {
    this.initMenuBar();
    this.initializeForm();
    this.loadDepartment();
    this.loadEarlyLate();
    this.loadApprovers();
    this.loadEmployee();

    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      this.currentEmployee = Array.isArray(this.currentUser)
        ? this.currentUser[0]
        : this.currentUser;
    });
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.openAddModal()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.openEditModal()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.openDeleteModal()
      },
      {
        label: 'TBP xác nhận',
        visible: this.permissionService.hasPermission("N1"),
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        items: [
          {
            label: 'TBP duyệt',
            visible: this.permissionService.hasPermission("N1"),
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.isApproveTBP(true)
          },
          {
            label: 'TBP hủy duyệt',
            visible: this.permissionService.hasPermission("N1"),
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.isApproveTBP(false)
          }
        ]
      },
      {
        label: 'HR xác nhận',
        visible: this.permissionService.hasPermission("N1,N2"),
        icon: 'fa-solid fa-calendar-check fa-lg text-info',
        items: [
          {
            label: 'HR duyệt',
            visible: this.permissionService.hasPermission("N1,N2"),
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.isApproveHR()
          },
          {
            label: 'HR hủy duyệt',
            visible: this.permissionService.hasPermission("N1,N2"),
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.isDisapproveHR()
          }
        ]
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel()
      }
    ];
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

  loadEarlyLate() {
    this.isLoading = true;
    this.earlyLateService.getEmployeeEarlyLate(this.searchForm.value).subscribe({
      next: (data) => {
        this.earlyLateList = data.data;
        this.tabulator.setData(this.earlyLateList);
        this.isLoading = false;
      }
    })
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employeeList = data.data;
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi tải danh sách nhân viên';
        this.notification.error("Lỗi", errorMessage);
      }
    })
  }

  filterOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const label = option.nzLabel?.toLowerCase() || '';
    return label.includes(searchText);
  };
  disabledDate = (current: Date): boolean => {
    // Chếch quyền HR thêm được những ngày khác
    if (this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N2') || this.currentUser.IsAdmin) {
      return false;
    }

    if (!current) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    return currentDate < today;
  };

  loadApprovers(): void {
    this.employeeService.getEmployeeApproved().subscribe({
      next: (res: any) => {
        this.approverList = res.data || [];
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Không thể tải danh sách người duyệt';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
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

    this.earlyLateForm = this.fb.group({
      ID: [0],
      EmployeeID: [null, Validators.required],
      ApprovedTP: [null, Validators.required],
      DateRegister: [new Date(), Validators.required],
      DateStart: [new Date(), Validators.required],
      DateEnd: [new Date(), Validators.required],
      Type: [1, Validators.required],
      Reason: ['', Validators.required],
      ReasonHREdit: [''],
    })

  }

  // Get default times based on Type
  private getDefaultTimesByType(type: number): { start: Date; end: Date } {
    const today = new Date();
    const dateRegister = this.earlyLateForm?.get('DateRegister')?.value || today;
    const registerDate = new Date(dateRegister);

    // Đi muộn: Type 1 (việc cá nhân) hoặc 4 (việc công ty)
    if (type === 1 || type === 4) {
      const start = new Date(registerDate);
      start.setHours(8, 0, 0, 0);
      const end = new Date(registerDate);
      end.setHours(9, 0, 0, 0);
      return { start, end };
    }

    // Về sớm: Type 2 (việc cá nhân) hoặc 3 (việc công ty)
    if (type === 2 || type === 3) {
      const start = new Date(registerDate);
      start.setHours(16, 30, 0, 0);
      const end = new Date(registerDate);
      end.setHours(17, 30, 0, 0);
      return { start, end };
    }

    // Default fallback
    return { start: new Date(), end: new Date() };
  }

  // Setup listener for Type changes
  private typeChangeSubscription: any;
  private dateRegisterChangeSubscription: any;
  private setupTypeChangeListener(): void {
    // Unsubscribe previous subscription if exists
    if (this.typeChangeSubscription) {
      this.typeChangeSubscription.unsubscribe();
    }

    // Subscribe to Type control changes
    this.typeChangeSubscription = this.earlyLateForm.get('Type')?.valueChanges.subscribe((type: number) => {
      if (type) {
        const times = this.getDefaultTimesByType(type);
        this.earlyLateForm.patchValue({
          DateStart: times.start,
          DateEnd: times.end
        }, { emitEvent: false }); // Prevent infinite loop
      }
    });
  }

  //Update theo ngày đăng kí
  private syncDateRangeWithRegister(): void {
    const registerRaw = this.earlyLateForm.get('DateRegister')?.value;
    if (!registerRaw) return;

    const registerDate = new Date(registerRaw);
    if (isNaN(registerDate.getTime())) return;

    const currentStart = this.earlyLateForm.get('DateStart')?.value ? new Date(this.earlyLateForm.get('DateStart')?.value) : null;
    const currentEnd = this.earlyLateForm.get('DateEnd')?.value ? new Date(this.earlyLateForm.get('DateEnd')?.value) : null;

    const buildWithDate = (source: Date | null, fallbackHour: number, fallbackMinute: number) => {
      const date = new Date(registerDate);
      const hour = source ? source.getHours() : fallbackHour;
      const minute = source ? source.getMinutes() : fallbackMinute;
      const second = source ? source.getSeconds() : 0;
      const ms = source ? source.getMilliseconds() : 0;
      date.setHours(hour, minute, second, ms);
      return date;
    };

    const newStart = buildWithDate(currentStart, 0, 0);
    const newEnd = buildWithDate(currentEnd, 0, 0);

    this.earlyLateForm.patchValue({
      DateStart: newStart,
      DateEnd: newEnd
    }, { emitEvent: false });
  }

  // Lắng nghe thay đổi DateRegister để cập nhật DateStart/DateEnd cùng ngày
  private setupDateRegisterChangeListener(): void {
    if (this.dateRegisterChangeSubscription) {
      this.dateRegisterChangeSubscription.unsubscribe();
    }

    this.dateRegisterChangeSubscription = this.earlyLateForm.get('DateRegister')?.valueChanges.subscribe(() => {
      this.syncDateRangeWithRegister();
    });
  }

  private initializeTable(): void {
    const frozenOn = !window.matchMedia('(max-width: 768px)').matches;
    this.tabulator = new Tabulator('#tb_early_late', {
      data: this.earlyLateList,
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      paginationSize: 200,
      layout: 'fitColumns',
      // langs: {
      //   vi: {
      //     pagination: {
      //       first: '<<',
      //       last: '>>',
      //       prev: '<',
      //       next: '>',
      //     },
      //   },
      // },
      // locale: 'vi',
      // rowContextMenu: [
      //   {
      //     label: "TBP hủy duyệt hủy đăng ký",
      //     action: () => {


      //     }
      //   },
      //   {
      //     label: "HR hủy duyệt hủy đăng ký",
      //     action: () => {

      //     }
      //   }


      // ],
      groupBy: 'DepartmentName',
      groupHeader: function (value, count, data, group) {
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " nhân viên)</span>";
      },
      columns: [
        {
          title: "Trạng thái duyệt",
          columns: [
            {
              title: 'Senior', field: 'IsSeniorApproved', hozAlign: 'center', headerHozAlign: 'center', width: 60, frozen: frozenOn, headerSort: false,
              formatter: function (cell: any) {
                const value = cell.getValue();
                const checked = value === true || value === 'true' || value === 1 || value === '1';
                return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
              },
            },
            {
              title: 'TBP', field: 'IsApprovedTP', hozAlign: 'center', headerHozAlign: 'center', width: 60, headerSort: false, headerWordWrap: true, frozen: frozenOn,
              formatter: function (cell: any) {
                const value = cell.getValue();
                const checked = value === true || value === 'true' || value === 1 || value === '1';
                return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
              },
            },
            {
              title: 'HR', field: 'IsApproved', hozAlign: 'center', headerHozAlign: 'center', width: 60, headerSort: false, headerWordWrap: true, frozen: frozenOn,
              formatter: function (cell: any) {
                const value = cell.getValue();
                const checked = value === true || value === 'true' || value === 1 || value === '1';
                return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
              },
            },
          ]
        },

        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 80, headerSort: false, frozen: frozenOn,
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 160, headerSort: false, frozen: frozenOn, bottomCalc: 'count'
        },
        {
          title: 'Người duyệt', field: 'ApprovedName', hozAlign: 'left', headerHozAlign: 'center', width: 160, headerSort: false,
        },
        {
          title: 'Bổ sung', field: 'IsProblem', hozAlign: 'center', headerHozAlign: 'center', width: 80, headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          },
        },
        {
          title: 'Ngày', field: 'DateRegister', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Từ', field: 'DateStart', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat(' dd/MM/yyyy HH:mm') : '';
          }
        },
        {
          title: 'Đến', field: 'DateEnd', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
          }
        },
        {
          title: 'Vân tay',
          columns: [
            {
              title: 'In', field: 'CheckIn', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,
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
              title: 'Out', field: 'CheckOut', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,
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
          ]
        },


        {
          title: 'Số phút', field: 'TimeRegister', hozAlign: 'right', headerHozAlign: 'center', width: 100, headerSort: false,
        },
        {
          title: 'Loại', field: 'TypeText', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, formatter: 'textarea'
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, formatter: 'textarea'
        }
      ],
    });
  }

  openAddModal() {
    const defaultType = 1; // Đi muộn việc cá nhân
    const defaultTimes = this.getDefaultTimesByType(defaultType);

    this.earlyLateForm.reset({
      ID: 0,
      EmployeeID: this.currentEmployee?.EmployeeID || null,
      ApprovedTP: null,
      DateStart: defaultTimes.start,
      DateEnd: defaultTimes.end,
      Type: defaultType,
      DateRegister: new Date(),
      Reason: '',
      ReasonHREdit: ''
    });

    // Chỉ disable EmployeeID nếu không có quyền N1, N2 hoặc IsAdmin
    if (!this.canEditEmployee()) {
      this.earlyLateForm.get('EmployeeID')?.disable();
    } else {
      this.earlyLateForm.get('EmployeeID')?.enable();
    }

    this.earlyLateForm.get('ApprovedTP')?.enable();
    // Reset validation cho ReasonHREdit khi thêm mới
    this.earlyLateForm.get('ReasonHREdit')?.clearValidators();
    this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();

    // Subscribe to Type changes
    this.setupTypeChangeListener();
    // Subscribe to DateRegister changes
    this.setupDateRegisterChangeListener();

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEarlyLateModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký đi muộn - về sớm cần sửa');
      return;
    }

    const selectedData = selectedRows[0].getData();

    // Kiểm tra trạng thái duyệt - cho phép người có quyền sửa bất kể đã duyệt
    if (this.isApproved(selectedData) && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt. Vui lòng hủy duyệt trước!');
      return;
    }

    // Unsubscribe before patching to avoid triggering update
    if (this.typeChangeSubscription) {
      this.typeChangeSubscription.unsubscribe();
      this.typeChangeSubscription = null;
    }

    this.selectedEarlyLate = selectedRows[0].getData();
    this.earlyLateForm.patchValue({
      ID: this.selectedEarlyLate.ID,
      EmployeeID: this.selectedEarlyLate.EmployeeID,
      ApprovedTP: this.selectedEarlyLate.ApprovedTP,
      DateStart: this.selectedEarlyLate.DateStart,
      DateEnd: this.selectedEarlyLate.DateEnd,
      DateRegister: this.selectedEarlyLate.DateRegister,
      Type: this.selectedEarlyLate.Type,
      Reason: this.selectedEarlyLate.Reason,
      ReasonHREdit: this.selectedEarlyLate.ReasonHREdit
    }, { emitEvent: false }); // Prevent triggering valueChanges

    // Chỉ disable EmployeeID nếu không có quyền N1, N2 hoặc IsAdmin
    if (!this.canEditEmployee()) {
      this.earlyLateForm.get('EmployeeID')?.disable();
    } else {
      this.earlyLateForm.get('EmployeeID')?.enable();
    }

    this.earlyLateForm.get('ApprovedTP')?.disable();

    this.earlyLateForm.get('ReasonHREdit')?.setValidators([Validators.required]);
    this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();

    // Subscribe to Type changes for edit mode as well (after patching)
    this.setupTypeChangeListener();
    // Subscribe to DateRegister changes for edit mode
    this.setupDateRegisterChangeListener();

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEarlyLateModal'));
    modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký cần xóa');
      return;
    }

    // Kiểm tra trạng thái duyệt cho tất cả các bản ghi đã chọn - cho phép người có quyền xóa bất kể đã duyệt
    const selectedData = selectedRows.map(row => row.getData());
    const approvedItems = selectedData.filter(item => this.isApproved(item));

    if (approvedItems.length > 0 && !this.checkCanEditApproved()) {
      const fullNames = approvedItems.map(item => item['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi đã duyệt. Bạn không có quyền xóa:\n${fullNames}`
      );
      return;
    }



    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa danh sách ngày đã đăng ký này không?`,
      nzOkText: "Xóa",
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        for (let row of selectedRows) {
          let selectedEarlyLate = row.getData();

          // Kiểm tra lại trạng thái duyệt trước khi xóa - cho phép người có quyền xóa bất kể đã duyệt
          if (this.isApproved(selectedEarlyLate) && !this.checkCanEditApproved()) {
            const fullName = selectedEarlyLate['FullName'] || 'N/A';
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Bản ghi đã duyệt. Bạn không có quyền xóa: ${fullName}`
            );
            continue;
          }

          this.earlyLateService.saveEmployeeEarlyLate({
            ...selectedEarlyLate,
            IsDeleted: true
          }).subscribe({
            next: (response) => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa ngày đã đăng ký thành công');
              this.loadEarlyLate();
            },
            error: (error: any) => {
              const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa ngày đã đăng ký thất bại: ' + errorMessage);
            }
          });
        }
      },
      nzCancelText: 'Hủy'
    });
  }

  async exportToExcel() {

    //Nhóm dữ liệu theo phòng ban
    const grouped = this.earlyLateList.reduce((acc: any, item: any) => {
      const dept = item.DepartmentName || 'Không xác định';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KhaiBaoDiMuonVeSom');

    const columns = [
      { header: '', key: 'TBP duyệt', width: 20 },
      { header: '', key: 'TBP duyệt', width: 20 },
      { header: '', key: 'HR duyệt', width: 20 },
      { header: '', key: 'Mã nhân viên', width: 15 },
      { header: '', key: 'Tên nhân viên', width: 30 },
      { header: '', key: 'Người duyệt', width: 30 },
      { header: '', key: 'Bổ sung', width: 10 },
      { header: '', key: 'Ngày', width: 15 },
      { header: '', key: 'Từ', width: 10 },
      { header: '', key: 'Đến', width: 10 },
      { header: '', key: 'Số phút', width: 10 },
      { header: '', key: 'Loại', width: 15 },
      { header: '', key: 'Lý do', width: 30 },
      { header: '', key: 'Lý do sửa', width: 30 },
      { header: '', key: 'Lý do hủy', width: 30 }
    ]

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
      deptRow.font = { name: 'Tahoma', size: 9, bold: true };
      deptRow.alignment = { horizontal: 'left', vertical: 'middle' };
      deptRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB7DEE8' }
      };
      deptRow.height = 25;
      // worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      // rowIndex++;

      // Thêm dữ liệu nhân viên
      grouped[dept].forEach((item: any) => {
        const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
        const formatDate = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
        const formatHour = (val: any) => val ? DateTime.fromISO(val).toFormat('HH:mm') : '';
        const row = worksheet.addRow({
          'TBP duyệt': safe(item.StatusText),
          'HR  duyệt': safe(item.StatusHRText),
          'Mã nhân viên': safe(item.Code),
          'Tên nhân viên': safe(item.FullName),
          'Người duyệt': safe(item.ApprovedName),
          'Bổ sung': safe(item.IsProblem),
          'Ngày': safe(formatDate(item.DateRegister)),
          'Từ': safe(formatHour(item.DateStart)),
          'Đến': safe(formatHour(item.DateEnd)),
          'Số phút': safe(item.TimeRegister),
          'Loại': safe(item.TypeText),
          'Lý do': safe(item.Reason),
          'Lý do sửa': safe(item.ReasonHREdit),
          'Lý do hủy': safe(item.ReasonCancel),
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
    saveAs(blob, `KhaiBaoDiMuonVeSom.xlsx`);
  }

  closeModal() {
    const modal = document.getElementById('addEarlyLateModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    // Unsubscribe from Type changes
    if (this.typeChangeSubscription) {
      this.typeChangeSubscription.unsubscribe();
      this.typeChangeSubscription = null;
    }
    this.earlyLateForm.reset();
    // Reset validation cho ReasonHREdit
    this.earlyLateForm.get('ReasonHREdit')?.clearValidators();
    this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.earlyLateForm.invalid) {
      Object.values(this.earlyLateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    let formData = { ...this.earlyLateForm.getRawValue() };

    // Validate StartDate and EndDate
    const startDate = new Date(formData.DateStart);
    const endDate = new Date(formData.DateEnd);

    if (isNaN(startDate.getTime())) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Ngày bắt đầu không hợp lệ. Vui lòng kiểm tra lại.');

      this.earlyLateForm.get('StartDate')?.markAsTouched();
      return;
    }
    if (isNaN(endDate.getTime())) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Ngày kết thúc không hợp lệ. Vui lòng kiểm tra lại.');
      this.earlyLateForm.get('EndDate')?.markAsTouched();
      return;
    }
    // Convert to UTC ISO strings
    const startDateObj = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      startDate.getUTCHours() + 7,
      startDate.getUTCMinutes()
    ));
    const endDateObj = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      endDate.getUTCHours() + 7,
      endDate.getUTCMinutes()
    ));

    formData.DateStart = startDateObj.toISOString();
    formData.DateEnd = endDateObj.toISOString();
    // Tính thời gian đăng ký bằng phút (không phải milliseconds)
    const durationInMs = endDateObj.getTime() - startDateObj.getTime();
    formData.TimeRegister = Math.round(durationInMs / (1000 * 60)); // Chuyển từ milliseconds sang phút
    formData.IsDeleted = false;
    if (!formData.ID || formData.ID === 0) {
      formData.ApprovedID = 0;
      formData.IsApproved = false;
    }

    if (formData.ID && formData.ID > 0) {
      formData.IsApproved = false;    // Reset trạng thái duyệt HR
      formData.IsApprovedHR = false;  // Reset trạng thái duyệt HR (backup field)
      formData.IsApprovedTP = false;  // Reset trạng thái duyệt TBP
    }

    if (formData.ID && formData.ID > 0) {
      if (!formData.ReasonHREdit || formData.ReasonHREdit.trim() === '') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Khi sửa thông tin ngày đăng ký, vui lòng nhập lý do sửa');
        this.earlyLateForm.get('ReasonHREdit')?.markAsTouched();
        return;
      }
    }
    this.earlyLateService.saveEmployeeEarlyLate(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu đăng ký thành công');
        this.closeModal();
        this.loadEarlyLate();
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, 'Lưu đăng ký thất bại: ' + errorMessage);
      },
    });
  }
  resetSearch() {
    this.initializeForm();
    this.loadEarlyLate();
  }
  isApproveTBP(status: boolean) {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length == 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn nhân viên để duyệt");
      return;
    }
    if (!status) {
      for (let row of selectedRows) {
        const data = row.getData();
        let id = data['ID'];
        if (id == 0) continue;

        let isApprovedTP = data['IsApprovedTP'];
        if (!isApprovedTP) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'TBP chưa duyệt. Vui lòng kiểm tra lại!');
          return;
        }

      }
    }
    if (status) {
      return this.handleApproveTP(status, selectedRows);
    }

    this.modal.confirm({
      nzTitle: 'Hủy duyệt',
      nzContent: this.reasonTpl,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Đóng',
      nzOnOk: () => {
        if (!this.reasonText.trim()) {
          this.notification.warning("Thông báo", "Vui lòng nhập lý do hủy duyệt");
          return false; // ngăn modal đóng
        }
        this.handleApproveTP(status, selectedRows, this.reasonText);
        return true;
      }
    });
  }

  handleApproveTP(status: boolean, rows: any[], reason: string = '') {
    for (let row of rows) {
      const data = row.getData();
      let id = data['ID'];
      if (id == 0) continue;

      this.earlyLateService.saveEmployeeEarlyLate({
        ...data,
        IsApprovedTP: status,
        ReasonDeciline: reason
      }).subscribe({
        next: () => {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `TBP ${status ? 'duyệt' : 'hủy duyệt'} khai báo thành công`
          );
          this.loadEarlyLate();
          this.reasonText = '';
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
          this.notification.error('Thất bại', 'Lỗi: ' + errorMessage);
          this.reasonText = '';
        }
      });
    }
  }


  // Helper method để kiểm tra bản ghi đã được duyệt chưa
  private isApproved(item: any): boolean {
    // Kiểm tra trạng thái duyệt TBP
    const isTBPApproved =
      item.IsApprovedTP === true ||
      item.IsApprovedTP === 1 ||
      item.IsApprovedTP === '1';

    // Kiểm tra trạng thái duyệt HR
    const isHRApproved =
      item.IsApproved === true ||
      item.IsApproved === 1 ||
      item.IsApproved === '1';

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

  isApproveHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for (let row of selectedRows) {
          const data = row.getData();
          let id = data['ID'];
          if (id == 0) continue;

          let isApprovedTP = data['IsApprovedTP'];
          if (!isApprovedTP) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'TBP chưa duyệt. Vui lòng kiểm tra lại!');
            return;
          }


          this.earlyLateService.saveEmployeeEarlyLate({
            ...data,
            IsApproved: true
          }).subscribe({
            next: (response) => {
              this.notification.success(NOTIFICATION_TITLE.success, 'HR duyệt khai báo thành công');
              this.loadEarlyLate();
            },
            error: (error: any) => {
              const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
              this.notification.error('Thất bại', 'HR duyệt khai báo thất bại: ' + errorMessage);
            }
          })


        }
      }
    });

  }

  isDisapproveHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần hủy duyệt!');
      return;
    }

    for (let row of selectedRows) {
      const data = row.getData();
      let id = data['ID'];
      if (id == 0) continue;

      let isApprovedTP = data['IsApproved'];
      if (!isApprovedTP) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'HR chưa duyệt. Vui lòng kiểm tra lại!');
        return;
      }

    }

    this.modal.confirm({
      nzTitle: 'Hủy duyệt',
      nzContent: this.reasonTpl,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Đóng',
      nzOnOk: () => {
        if (!this.reasonText.trim()) {
          this.notification.warning("Thông báo", "Vui lòng nhập lý do hủy duyệt");
          return false; // ngăn modal đóng
        }

        this.handleApproveHR(false, selectedRows, this.reasonText);
        return true;
      }
    });
  }

  handleApproveHR(status: boolean, rows: any[], reason: string = '') {
    for (let row of rows) {
      const data = row.getData();
      let id = data['ID'];
      if (id == 0) continue;


      this.earlyLateService.saveEmployeeEarlyLate({
        ...data,
        IsApproved: status,
        ReasonDeciline: reason
      }).subscribe({
        next: (response) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'HR hủy duyệt khai báo thành công');
          this.loadEarlyLate();
          this.reasonText = '';
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
          this.notification.error('Thất bại', 'HR hủy duyệt khai báo thất bại: ' + errorMessage);
          this.reasonText = '';
        }
      })

    }
  }
}
