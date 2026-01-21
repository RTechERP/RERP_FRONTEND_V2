import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DayOffService } from './day-off-service/day-off.service';
import { SummaryDayOffComponent } from './summary-day-off/summary-day-off.component';
import { DeclareDayOffComponent } from './declare-day-off/declare-day-off.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from "../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AuthService } from '../../../auth/auth.service';
import { WFHService } from '../employee-management/employee-wfh/WFH-service/WFH.service';
import { PermissionService } from '../../../services/permission.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';

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
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzSplitterModule,
    NzGridModule,
    SummaryDayOffComponent,
    NgIf,
    NzSpinModule,
    Menubar,
    AngularSlickgridModule
  ]
})
export class DayOffComponent implements OnInit {

  @ViewChild('listSummaryTable') tableRef!: ElementRef;
  searchForm!: FormGroup;
  dayOffForm!: FormGroup;
  employeeList: any[] = [];
  approverList: any[] = [];
  departmentList: any[] = [];
  dayOffList: any[] = [];
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  // Menu bars
  menuBars: any[] = [];

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

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

  isEditModal = false;
  isLoading = false;

  selectedDayOff: any = null;
  currentUser: any;
  currentEmployee: any;
  userPermissions: string = '';
  canEditOthers: boolean = false;
  isEmployeeSelectDisabled: boolean = true;

  // Summary data for employee leave
  isLoadingSummary: boolean = false;
  listSummaryTable: Tabulator | null = null;

  listParams = {
    DepartmentID: 0,
    EmployeeID: 0,
    IsApproved: -1,
    Type: 0,
    Keyword: '',
    DateStart: new Date(),
    DateEnd: new Date(),
  };

  listSummaryData: any;
  private employeeIdSubscription: any;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private departmentService: DepartmentServiceService,
    private dayOffService: DayOffService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private wfhService: WFHService,
    private permissionService: PermissionService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit() {
    this.initMenuBar();
    this.initializeForm();
    this.initGrid();
    this.loadEmployeeOnLeave();
    this.loadDepartments();
    this.loadApprovers();
    this.loadEmployees();

    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      this.currentEmployee = Array.isArray(this.currentUser)
        ? this.currentUser[0]
        : this.currentUser;

      this.userPermissions = this.currentUser?.Permissions || this.currentEmployee?.Permissions || '';
      this.canEditOthers = this.hasPermissionN1OrN2(this.userPermissions) || this.checkIsAdmin();
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
            command: () => this.approved(true, true)
          },
          {
            label: 'TBP hủy duyệt',
            visible: this.permissionService.hasPermission("N1"),
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.approved(false, true)
          },
          {
            visible: this.permissionService.hasPermission("N1"),
            label: 'TBP duyệt hủy đăng ký',
            icon: 'fa-solid fa-circle-check fa-lg text-warning',
            command: () => this.isApproveCancelTP()
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
            command: () => this.approved(true, false)
          },
          {
            visible: this.permissionService.hasPermission("N1,N2"),
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.approved(false, false)
          },
          {
            visible: this.permissionService.hasPermission("N1,N2"),
            label: 'HR duyệt hủy đăng ký',
            icon: 'fa-solid fa-circle-check fa-lg text-warning',
            command: () => this.isApproveCancelHR()
          }
        ]
      },
      {
        label: 'Khai báo ngày phép',
        visible: this.permissionService.hasPermission("N1,N2"),
        icon: 'fa-solid fa-calendar-days fa-lg text-info',
        command: () => this.openDeclareDayOffModal()
      },
      {
        label: 'Báo cáo ngày nghỉ',
        visible: this.permissionService.hasPermission("N1,N2"),
        icon: 'fa-solid fa-chart-column fa-lg text-primary',
        command: () => this.openSummaryDayOffModal()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel()
      }
    ];
  }

  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]],
      departmentId: null,
      status: null,
      keyWord: '',
      pageNumber: 1,
      pageSize: 1000000,
      IDApprovedTP: 0
    });

    this.dayOffForm = this.fb.group({
      ID: [0],
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

  initGrid(): void {
    const frozenOn = !this.isMobile();

    this.columnDefinitions = [
      {
        id: 'IsApprovedTP',
        name: 'TBP duyệt',
        field: 'IsApprovedTP',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: Formatters.checkmarkMaterial,
        filter: {
          collection: [
            { value: '', label: 'Tất cả' },
            { value: true, label: 'Đã duyệt' },
            { value: false, label: 'Chưa duyệt' },
          ],
          model: Filters['singleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
        cssClass: 'text-center'
      },
      {
        id: 'IsApprovedHR',
        name: 'HR duyệt',
        field: 'IsApprovedHR',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: Formatters.checkmarkMaterial,
        filter: {
          collection: [
            { value: '', label: 'Tất cả' },
            { value: true, label: 'Đã duyệt' },
            { value: false, label: 'Chưa duyệt' },
          ],
          model: Filters['singleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
        cssClass: 'text-center'
      },
      {
        id: 'IsApprovedBGD',
        name: 'BGĐ duyệt',
        field: 'IsApprovedBGD',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: Formatters.checkmarkMaterial,
        filter: {
          collection: [
            { value: '', label: 'Tất cả' },
            { value: true, label: 'Đã duyệt' },
            { value: false, label: 'Chưa duyệt' },
          ],
          model: Filters['singleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
        cssClass: 'text-center'
      },
      {
        id: 'Code',
        name: 'Mã NV',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'FullName',
        name: 'Họ và tên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ApprovedName',
        name: 'Người duyệt',
        field: 'ApprovedName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TimeOnLeaveText',
        name: 'Thời gian nghỉ',
        field: 'TimeOnLeaveText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
      {
        id: 'StartDate',
        name: 'Ngày bắt đầu',
        field: 'StartDate',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: this.dateTimeFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'EndDate',
        name: 'Ngày kết thúc',
        field: 'EndDate',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: this.dateTimeFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'TotalDay',
        name: 'Số ngày',
        field: 'TotalDay',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'TypeHR',
        name: 'Loại',
        field: 'TypeHR',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
      {
        id: 'Reason',
        name: 'Lý do',
        field: 'Reason',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonHREdit',
        name: 'Lý do sửa',
        field: 'ReasonHREdit',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonCancel',
        name: 'Lý do hủy',
        field: 'ReasonCancel',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonDeciline',
        name: 'Lý do không đồng ý duyệt',
        field: 'ReasonDeciline',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DateCancel',
        name: 'Ngày hủy',
        field: 'DateCancel',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'IsCancelRegister',
        name: 'NV hủy đăng ký',
        field: 'IsCancelRegister',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center'
      },
      {
        id: 'IsCancelTP',
        name: 'TBP duyệt hủy ĐK',
        field: 'IsCancelTP',
        sortable: true,
        filterable: true,
        width: 140,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center'
      },
      {
        id: 'IsCancelHR',
        name: 'HR duyệt hủy ĐK',
        field: 'IsCancelHR',
        sortable: true,
        filterable: true,
        width: 140,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center'
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grvDayOffContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      checkboxSelector: {
        hideInFilterHeaderRow: true,
        hideInColumnTitleRow: false,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: frozenOn ? 5 : 0,
      showFooterRow: true,
      createFooterRow: true,
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ','
      },
    };
  }

  // Custom formatter for datetime
  dateTimeFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    if (!value) return '';
    try {
      return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
    } catch {
      return '';
    }
  };

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};

    // Update footer row count when data changes
    angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    angularGrid.dataView.onRowsChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    setTimeout(() => {
      this.applyDistinctFilters();
    }, 100);
  }

  private updateFooterTotals(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    const totalCount = this.angularGrid.dataView.getLength();

    const countElement = this.angularGrid.slickGrid?.getFooterRowColumn('FullName');
    if (countElement) {
      countElement.innerHTML = `<div style="font-weight: bold;">${totalCount}</div>`;
    }

    const filteredItems = this.angularGrid.dataView.getFilteredItems() as any[];
    const totalDays = filteredItems.reduce((sum, item) => {
      const days = parseFloat(item.TotalDay) || 0;
      return sum + days;
    }, 0);

    const daysElement = this.angularGrid.slickGrid?.getFooterRowColumn('TotalDay');
    if (daysElement) {
      daysElement.innerHTML = `<div style="text-align: right; padding-right: 8px; font-weight: bold;">${totalDays.toFixed(2)}</div>`;
    }
  }

  applyDistinctFilters(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    this.updateFooterTotals();

    const data = this.angularGrid.dataView.getItems() as any[];
    if (!data || data.length === 0) return;

    const getUniqueValues = (items: any[], field: string): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    };

    const gridColumns = this.angularGrid.slickGrid.getColumns();
    if (gridColumns) {
      gridColumns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = this.angularGrid.slickGrid.getColumns();
    this.angularGrid.slickGrid.setColumns(updatedColumns);
    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();

    // Update footer totals AFTER invalidate/render to avoid being cleared
    setTimeout(() => {
      this.updateFooterTotals();
    }, 50);
  }

  handleRowSelection(e: Event, args: OnSelectedRowsChangedEventArgs) {
    // Handle row selection if needed
  }

  onCellClicked(e: Event, args: OnClickEventArgs) {
    // Handle cell click if needed
  }

  getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((idx: number) => this.angularGrid.dataView.getItem(idx));
  }

  loadEmployeeOnLeave() {
    this.isLoading = true;

    // Prepare data for API - convert null to default values for backend
    const formValue = this.searchForm.value;
    const data = {
      month: formValue.month ?? new Date().getMonth() + 1,
      year: formValue.year ?? new Date().getFullYear(),
      departmentId: formValue.departmentId ?? 0,  // null -> 0 for API
      status: formValue.status ?? -1,  // null -> -1 for API (all statuses)
      IDApprovedTP: formValue.IDApprovedTP ?? 0,
      pageNumber: 1,
      pageSize: 1000000,
      keyWord: formValue.keyWord ?? ""
    };

    this.dayOffService.getEmployeeOnLeave(data).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.dayOffList = response.data || [];
        this.dataset = this.dayOffList.map((item, index) => ({
          ...item,
          id: item.ID  // Sử dụng ID từ database thay vì index
        }));
        this.applyDistinctFilters();
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + (error.error?.message || error.message));
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployee().subscribe({
      next: (data: any) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + (error.error?.message || error.message));
      }
    })
  }

  filterOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const label = option.nzLabel?.toLowerCase() || '';
    return label.includes(searchText);
  };

  hasPermissionN1OrN2(permissions: string): boolean {
    if (!permissions) return false;
    const permissionList = permissions.split(',').map(p => p.trim());
    return permissionList.includes('N1') || permissionList.includes('N2');
  }

  // Kiểm tra quyền để enable select nhân viên (ad, IM, N1, N2)
  hasPermissionToEditEmployeeSelect(): boolean {
    return this.permissionService.hasPermission('ad') ||
      this.permissionService.hasPermission('IM') ||
      this.permissionService.hasPermission('N1') ||
      this.permissionService.hasPermission('N2') ||
      this.checkIsAdmin();
  }

  checkCanEditApproved(): boolean {
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN2Permission = this.permissionService.hasPermission('N2');
    const isAdmin = this.checkIsAdmin();
    return hasN1Permission || hasN2Permission || isAdmin;
  }

  checkIsAdmin(): boolean {
    return this.currentUser?.IsAdmin === true || this.currentUser?.ISADMIN === true;
  }

  isEditingForOthers(): boolean {
    const selectedEmployeeId = this.dayOffForm.get('EmployeeID')?.value;
    const currentEmployeeId = this.currentEmployee?.EmployeeID;
    return selectedEmployeeId && currentEmployeeId && selectedEmployeeId !== currentEmployeeId;
  }

  shouldShowReasonHREdit(): boolean {
    return this.canEditOthers && this.isEditingForOthers();
  }

  disabledDate = (current: Date): boolean => {
    if (this.permissionService.hasPermission('N1,N2')) {
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
      error: (res: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể tải danh sách người duyệt');
      },
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  updateReasonHREditValidation(): void {
    if (this.shouldShowReasonHREdit()) {
      this.dayOffForm.get('ReasonHREdit')?.setValidators([Validators.required]);
    } else {
      this.dayOffForm.get('ReasonHREdit')?.clearValidators();
      this.dayOffForm.get('ReasonHREdit')?.setValue('');
    }
    this.dayOffForm.get('ReasonHREdit')?.updateValueAndValidity();
  }

  openAddModal() {
    this.isEditModal = false;
    // Kiểm tra quyền ad, IM, N1, N2 để enable/disable select nhân viên
    this.isEmployeeSelectDisabled = !this.hasPermissionToEditEmployeeSelect();
    this.listSummaryData = [];
    this.dayOffForm.reset({
      ID: 0,
      EmployeeID: this.currentEmployee?.EmployeeID || null,
      ApprovedTP: null,
      StartDate: new Date(),
      TimeOnLeave: 1,
      TypeIsReal: 1,
      Reason: '',
      ReasonHREdit: '',
      EndDate: null
    });

    // Load summary for current employee
    if (this.currentEmployee?.EmployeeID) {
      this.loadEmployeeSummary(this.currentEmployee.EmployeeID);
    }

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDayOffModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày nghỉ cần chỉnh sửa');
      return;
    }

    const selectedData = selectedRows[0];
    const isApproved = selectedData['IsApprovedTP'] === true && selectedData['IsApprovedHR'] === true;

    if (isApproved && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký nghỉ đã được duyệt. Bạn không có quyền sửa!');
      return;
    }

    this.isEditModal = true;
    this.selectedDayOff = selectedData;
    // Kiểm tra quyền ad, IM, N1, N2 để enable/disable select nhân viên
    this.isEmployeeSelectDisabled = !this.hasPermissionToEditEmployeeSelect();
    this.listSummaryData = [];

    this.dayOffForm.patchValue({
      ID: selectedData['ID'],
      EmployeeID: selectedData['EmployeeID'],
      ApprovedTP: selectedData['ApprovedTP'],
      StartDate: selectedData['StartDate'] ? new Date(selectedData['StartDate']) : new Date(),
      TimeOnLeave: selectedData['TimeOnLeave'],
      TypeIsReal: selectedData['TypeIsReal'] || selectedData['Type'],
      Reason: selectedData['Reason'],
      ReasonHREdit: selectedData['ReasonHREdit'] || '',
      EndDate: selectedData['EndDate'] ? new Date(selectedData['EndDate']) : null
    });

    // Load summary for selected employee
    if (selectedData['EmployeeID']) {
      this.loadEmployeeSummary(selectedData['EmployeeID']);
    }

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addDayOffModal'));
    modal.show();
  }

  closeModal() {
    const modalElement = document.getElementById('addDayOffModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  // Load employee leave summary
  loadEmployeeSummary(employeeId: number): void {
    if (!employeeId) {
      this.listSummaryData = [];
      if (this.listSummaryTable) {
        this.listSummaryTable.clearData();
      }
      return;
    }

    this.isLoadingSummary = true;
    this.dayOffService.getEmployeeOnLeaveSummaryByEmployee(employeeId, new Date()).subscribe({
      next: (response: any) => {
        this.isLoadingSummary = false;
        if (response.status === 1 && response.data) {
          const summaryData = response.data.data || [];
          this.listSummaryData = summaryData.filter((item: any) => item.EmployeeID === employeeId);
          if (this.listSummaryData.length === 0 && summaryData.length > 0) {
            this.listSummaryData = [summaryData[0]];
          }

          // Cập nhật bảng Tabulator
          this.draw_listSummaryTable();
        } else {
          this.listSummaryData = [];
          if (this.listSummaryTable) {
            this.listSummaryTable.clearData();
          }
        }
      },
      error: () => {
        this.isLoadingSummary = false;
        this.listSummaryData = [];
        if (this.listSummaryTable) {
          this.listSummaryTable.clearData();
        }
      }
    });
  }

  // Khởi tạo bảng Tabulator cho summary
  draw_listSummaryTable(): void {
    if (!this.tableRef?.nativeElement) return;

    if (this.listSummaryTable) {
      this.listSummaryTable.replaceData(this.listSummaryData);
    } else {
      this.listSummaryTable = new Tabulator(this.tableRef.nativeElement, {
        data: this.listSummaryData,
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        height: '200px',
        pagination: false,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Họ tên',
            field: 'FullName',
            headerHozAlign: 'center',
          },
          {
            title: 'Tổng số ngày xin nghỉ phép trong tháng',
            field: 'TotalDay',
            headerHozAlign: 'center',
          },
          {
            title: 'Số ngày đã duyệt trong tháng',
            field: 'TotalDayApproved',
            headerHozAlign: 'center',
          },
          {
            title: 'Số ngày chưa duyệt trong tháng',
            field: 'TotalDayUnApproved',
            headerHozAlign: 'center',
          },
          {
            title: 'Số ngày còn lại dự kiến trong tháng',
            field: 'TotalDayRemain',
            headerHozAlign: 'center',
          },
          {
            title: 'Số ngày phép còn lại dự kiến trong năm',
            field: 'TotalDayOnleaveActual',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }

  // Handle employee selection change
  onEmployeeChange(employeeId: number): void {
    this.loadEmployeeSummary(employeeId);
    this.updateReasonHREditValidation();
  }

  openDeleteModal() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày nghỉ cần xóa');
      return;
    }

    const selectedData = selectedRows[0];
    const isApproved = selectedData['IsApprovedTP'] === true && selectedData['IsApprovedHR'] === true;

    if (isApproved && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký nghỉ đã được duyệt. Bạn không có quyền xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa ngày nghỉ đã đăng ký này không?`,
      nzOkText: "Xóa",
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        for (let row of selectedRows) {
          this.dayOffService.saveEmployeeOnLeave({
            ...row,
            DeleteFlag: true
          }).subscribe({
            next: (response) => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa ngày nghỉ đã đăng ký thành công');
              this.loadEmployeeOnLeave();
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa ngày nghỉ đã đăng ký thất bại: ' + (error.error?.message || error.message));
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    let formData = { ...this.dayOffForm.getRawValue() };

    if (this.shouldShowReasonHREdit()) {
      if (!formData.ReasonHREdit || formData.ReasonHREdit.trim() === '') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do sửa');
        this.dayOffForm.get('ReasonHREdit')?.markAsTouched();
        return;
      }
    } else {
      formData.ReasonHREdit = '';
    }

    const dateNow = new Date();
    const dateRegister = new Date(formData.StartDate);
    const employeeId = formData.EmployeeID;

    if (!employeeId || employeeId === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên');
      this.dayOffForm.get('EmployeeID')?.markAsTouched();
      return;
    }

    const loginName = this.currentUser?.LoginName || '';

    formData.EmployeeID = employeeId;
    formData.ApprovedHr = 0;
    formData.IsApprovedTP = false;
    formData.IsApprovedHR = false;
    formData.CreatedDate = dateNow;
    formData.UpdatedDate = dateNow;
    formData.CreatedBy = loginName;
    formData.UpdatedBy = loginName;
    formData.IsCancelRegister = false;
    formData.IsCancelHR = false;
    formData.IsCancelTP = false;
    formData.DecilineApprove = 1;
    formData.Type = formData.TypeIsReal || formData.Type;

    let startDate: Date, endDate: Date, totalTime: number, totalDay: number;

    if (formData.TimeOnLeave == 1) {
      startDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 8, 0, 0);
      endDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 12, 0, 0);
      totalTime = 4;
      totalDay = 0.5;
    } else if (formData.TimeOnLeave == 2) {
      startDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 13, 30, 0);
      endDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 17, 30, 0);
      totalTime = 4;
      totalDay = 0.5;
    } else {
      startDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 8, 0, 0);
      endDate = new Date(dateRegister.getFullYear(), dateRegister.getMonth(), dateRegister.getDate(), 17, 30, 0);
      totalTime = 8;
      totalDay = 1;
    }

    const toLocalISOString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    formData.StartDate = toLocalISOString(startDate);
    formData.EndDate = toLocalISOString(endDate);
    formData.TotalTime = totalTime;
    formData.TotalDay = totalDay;

    if (formData.Type == 2) {
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const dateNowOnly = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());
      const timeSpan = Math.floor((startDateOnly.getTime() - dateNowOnly.getTime()) / (1000 * 60 * 60 * 24));

      // Nếu không có quyền N1/N2, không cho phép đăng ký nghỉ phép cùng ngày hiện tại
      const hasN1N2Permission = this.hasPermissionN1OrN2(this.userPermissions) || this.checkIsAdmin();

      if (timeSpan == 0 && !hasN1N2Permission) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không thể xin nghỉ phép cùng với ngày hiện tại.\nVui lòng chọn Loại khác!');
        return;
      }

      // Nếu không có quyền N1/N2, không cho phép đăng ký nghỉ phép sau 19h của ngày liền trước
      if (timeSpan == 1 && dateNow.getHours() >= 19 && !hasN1N2Permission) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không thể xin nghỉ phép sau 19:00.\nVui lòng chọn Loại khác!');
        return;
      }

      this.dayOffService.getEmployeeOnLeaveSummaryByEmployee(employeeId, dateNow).subscribe({
        next: (response: any) => {
          if (response.status === 1 && response.data) {
            const summaryData = response.data.data || [];
            const employeeSummary = summaryData.find((item: any) => item.EmployeeID === employeeId) || summaryData[0];
            const totalDayRemain = employeeSummary?.TotalDayRemain || employeeSummary?.TotalDayOnleaveActual || 0;

            // Nếu không có quyền N1/N2, không cho phép đăng ký nếu hết phép
            if (totalDayRemain == 0 && !hasN1N2Permission) {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không đủ phép.\nVui lòng chọn Thời gian nghỉ hoặc Loại khác!');
              return;
            }

            // Nếu không có quyền N1/N2, không cho phép đăng ký nếu số ngày nghỉ lớn hơn số phép còn lại
            if (totalDay > totalDayRemain && !hasN1N2Permission) {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không đủ phép.\nVui lòng chọn Thời gian nghỉ hoặc Loại khác!');
              return;
            }

            formData.TypeIsReal = 2;
            this.saveEmployeeOnLeave(formData);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lấy thông tin số ngày phép còn lại');
          }
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi kiểm tra số ngày phép còn lại: ' + (error.error?.message || error.message || ''));
        }
      });
      return;
    } else {
      formData.TypeIsReal = formData.Type;
    }

    if (formData.ID && formData.ID > 0) {
      formData.IsApprovedHR = false;
      formData.IsApprovedTP = false;
    }

    this.saveEmployeeOnLeave(formData);
  }

  private saveEmployeeOnLeave(formData: any): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.dayOffService.saveEmployeeOnLeave(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu ngày nghỉ thành công');
        this.closeModal();
        this.loadEmployeeOnLeave();
      },
      error: (response) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lưu ngày nghỉ thất bại: ' + (response.error?.message || response.message || ''));
      },
    });
  }

  async exportToExcel() {
    let data = this.dataset;
    if (data == null || data.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
      return;
    }

    const exportData = this.dayOffList
      .filter((item: any) => Object.keys(item).length > 0)
      .map((item: any, idx: number) => {
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

    exportData.forEach((row: any) => worksheet.addRow(row));

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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    saveAs(blob, `DangKyNghi_T${month}_${year}.xlsx`);
  }

  approved(isApproved: boolean, isTBP: boolean) {
    const selectedRows = this.getSelectedRows();
    const listID: number[] = [];
    let message = '';

    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký nghỉ cần duyệt');
      return;
    }

    if (isTBP && isApproved) {
      for (const row of selectedRows) {
        const id = row['ID'];
        if (id > 0) {
          listID.push(id);
        }
      }
    } else if (isTBP && !isApproved) {
      message = 'Nhân viên đã được HR duyệt sẽ không thể hủy duyệt.\nBạn có muốn tiếp tục?';
      for (const row of selectedRows) {
        const id = row['ID'];
        const isApprovedHR = row['IsApprovedHR'];
        if (id > 0 && !isApprovedHR) {
          listID.push(id);
        }
      }
    } else if (!isTBP && isApproved) {
      message = 'Nhân viên chưa được TBP duyệt sẽ không thể duyệt.\nBạn có muốn tiếp tục?';
      for (const row of selectedRows) {
        const id = row['ID'];
        const isApprovedTP = row['IsApprovedTP'];
        if (id <= 0 || !isApprovedTP) {
          continue;
        }
        listID.push(id);
      }
    } else if (!isTBP && !isApproved) {
      for (const row of selectedRows) {
        const id = row['ID'];
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
          const updatePromises = listID.map(id => {
            const updateData: any = { ID: id };
            if (isTBP) {
              updateData['IsApprovedTP'] = isApproved;
            } else {
              updateData['IsApprovedHR'] = isApproved;
            }
            return this.dayOffService.saveEmployeeOnLeave(updateData).toPromise();
          });

          Promise.all(updatePromises)
            .then(() => {
              this.notification.success(NOTIFICATION_TITLE.success, `${approveText.charAt(0).toUpperCase() + approveText.slice(1)} thành công!`);
              this.loadEmployeeOnLeave();
            })
            .catch((error) => {
              this.notification.error(NOTIFICATION_TITLE.error, `Cập nhật trạng thái duyệt thất bại: ${error.error?.message || error.message}`);
            });
        }
      }
    });
  }

  isApproveCancelHR() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for (let row of selectedRows) {
      if (row['ID'] <= 0) {
        continue;
      }

      if (!row['IsCancelTP']) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'TBP chưa duyệt hủy đăng ký. Vui lòng kiểm tra lại');
        return;
      }

      this.dayOffService.saveEmployeeOnLeave({
        ...row,
        IsCancelHR: true
      }).subscribe({
        next: (response) => {
          this.notification.success(NOTIFICATION_TITLE.success, 'HR hủy duyệt đăng ký thành công');
          this.loadEmployeeOnLeave();
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'HR hủy duyệt đăng ký thất bại: ' + (error.error?.message || error.message));
        }
      })
    }
  }

  isApproveCancelTP() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn chưa chọn nhân viên. Vui lòng chọn nhân viên');
      return;
    }

    for (let row of selectedRows) {
      if (row['ID'] <= 0) {
        continue;
      }

      const code = row['Code'];
      const fullName = row['FullName'];

      if (!row['IsCancelTP'] || !row['IsCancelRegister']) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên ${code} - ${fullName} chưa đăng ký hủy duyệt. Vui lòng kiểm tra lại`);
      } else {
        this.dayOffService.saveEmployeeOnLeave({
          ...row,
          IsCancelTP: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'TBP hủy duyệt đăng ký thành công');
            this.loadEmployeeOnLeave();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'TBP hủy duyệt đăng ký thất bại: ' + (error.error?.message || error.message));
          }
        })
      }
    }
  }

  @ViewChild(SummaryDayOffComponent) summaryDayOffComponent!: SummaryDayOffComponent;
  openSummaryDayOffModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('summaryDayOffModal'));
    modal.show();
    this.summaryDayOffComponent.ngOnInit();
  }

  openDeclareDayOffModal() {
    const modalRef = this.ngbModal.open(DeclareDayOffComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => { },
      () => { }
    );
  }
}
