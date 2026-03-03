import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
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
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { EmployeeNightShiftService } from '../employee-night-shift-service/employee-night-shift.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { EmployeeAttendanceService } from '../../employee-attendance/employee-attendance.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { EmployeeNightShiftSummaryComponent } from '../employee-night-shift-summary/employee-night-shift-summary.component';
import { EmployeeNightShiftFormComponent } from '../employee-night-shift-form/employee-night-shift-form.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { PermissionService } from '../../../../../services/permission.service';
import { AuthService } from '../../../../../auth/auth.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Menubar } from 'primeng/menubar';

(window as any).luxon = { DateTime };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NgbModalModule,
    NzModalModule,
    HasPermissionDirective,
    NgbDropdownModule,
    NzDropDownModule,
    NzFormModule,
    NzSpinModule,
    Menubar,
    AngularSlickgridModule
  ],
  selector: 'app-employee-night-shift',
  templateUrl: './employee-night-shift.component.html',
  styleUrls: ['./employee-night-shift.component.css'],
})
export class EmployeeNightShiftComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private notification: NzNotificationService,
    private employeeNightShiftService: EmployeeNightShiftService,
    private modal: NzModalService,
    private employeeAttendanceService: EmployeeAttendanceService,
    private vehicleRepairService: VehicleRepairService,
    private permissionService: PermissionService,
    private authService: AuthService,
  ) { }

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  isLoading = false;
  isSearchVisible: boolean = false;
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

  // Master data
  departments: any[] = [];
  allEmployees: any[] = [];
  employees: any[] = [];

  // Filter params
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number = 0;
  departmentID: number = 0;
  isApproved: number | null = null;
  keyWord: string = '';

  private ngbModal = inject(NgbModal);

  // Current user info
  currentUser: any = null;

  // Debounce subjects
  private keywordSearchSubject = new Subject<string>();
  private filterChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Helper function để convert giá trị sang boolean
  private toBool(v: any): boolean {
    if (v === true || v === false) return v;
    const n = Number(v);
    if (!isNaN(n)) return n > 0;
    const s = String(v ?? '').toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  // Helper function để kiểm tra đã duyệt (giá trị = 1)
  private isApprovedValue(v: any): boolean {
    const n = Number(v);
    return n === 1;
  }

  // Helper function để kiểm tra bản ghi đã được duyệt (TBP hoặc HR)
  private isItemApproved(item: any): boolean {
    const isApprovedTBP = this.isApprovedValue(item.IsApprovedTBP);
    const isApprovedHR = this.isApprovedValue(item.IsApprovedHR);
    return isApprovedTBP || isApprovedHR;
  }

  // Helper function để kiểm tra có quyền admin (N1, N2 hoặc IsAdmin)
  private hasAdminPermission(): boolean {
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN2Permission = this.permissionService.hasPermission('N2');
    const isAdmin = this.currentUser?.IsAdmin === true || this.currentUser?.ISADMIN === true;
    return hasN1Permission || hasN2Permission || isAdmin;
  }

  // Lấy thông tin user hiện tại
  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;
      },
      error: (err: any) => {
        console.error('Lỗi lấy thông tin người dùng:', err);
      }
    });
  }

  ngOnInit() {
    this.initMenuBar();
    this.getCurrentUser();
    // Set đầu tháng và cuối tháng làm mặc định
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();

    this.initGrid();
    this.loadDepartments();
    this.loadEmployees();
    this.getNightShift();

    // Setup debounce cho keyword search
    this.keywordSearchSubject.pipe(
      debounceTime(500), // Đợi 500ms sau khi người dùng ngừng gõ
      distinctUntilChanged(), // Chỉ emit khi giá trị thay đổi
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.getNightShift();
    });

    // Setup debounce cho filter changes
    this.filterChangeSubject.pipe(
      debounceTime(300), // Đợi 300ms cho các filter khác
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.getNightShift();
    });

  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddNightShift()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditNightShift()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteNightShift()
      },
      {
        label: 'TBP xác nhận',
        visible: this.permissionService.hasPermission("N1"),
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        items: [
          {
            visible: this.permissionService.hasPermission("N1"),
            label: 'TBP duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.onTBPApprove()
          },
          {
            visible: this.permissionService.hasPermission("N1"),
            label: 'TBP hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.onTBPCancel()
          }
        ]
      },
      {
        label: 'HR xác nhận',
        visible: this.permissionService.hasPermission("N1,N2"),
        icon: 'fa-solid fa-calendar-check fa-lg text-info',
        items: [
          {
            visible: this.permissionService.hasPermission("N1,N2"),
            label: 'HR duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.onHRApprove()
          },
          {
            visible: this.permissionService.hasPermission("N1,N2"),
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.onHRCancel()
          }
        ]
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel()
      },
      {
        visible: this.permissionService.hasPermission("N1,N2"),
        label: 'Tổng hợp làm đêm',
        icon: 'fa-solid fa-chart-column fa-lg text-primary',
        command: () => this.onOpenSummary()
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Grid initialized in ngOnInit
  }

  loadDepartments(): void {
    this.employeeAttendanceService.getDepartment().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.departments = res.data || [];
        console.log('Departments:', this.departments);
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể tải danh sách phòng ban'),
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0);
        this.allEmployees = all;

        const filtered =
          this.departmentID && this.departmentID > 0
            ? all.filter(
              (x: any) => Number(x.DepartmentID) === Number(this.departmentID)
            )
            : all;

        this.employees = this.employeeAttendanceService.createdDataGroup(filtered, 'DepartmentName');
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error.message || 'Không thể tải danh sách nhân viên'),
    });
  }

  onDepartmentChange(): void {
    this.employeeID = 0;
    this.loadEmployees();
    this.filterChangeSubject.next();
  }

  onEmployeeChange(): void {
    this.filterChangeSubject.next();
  }

  onIsApprovedChange(): void {
    this.filterChangeSubject.next();
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.keywordSearchSubject.next(value);
  }

  onDateRangeChange(): void {
    this.filterChangeSubject.next();
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  resetSearch(): void {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.employeeID = 0;
    this.departmentID = 0;
    this.isApproved = null;
    this.keyWord = '';
    this.loadEmployees();
    this.getNightShift();
  }

  private getFirstDayOfMonth(): string {
    const now = DateTime.local();
    return now.startOf('month').toISODate() || '';
  }

  private getLastDayOfMonth(): string {
    const now = DateTime.local();
    return now.endOf('month').toISODate() || '';
  }

  getNightShift() {
    this.isLoading = true;

    // Convert string date (YYYY-MM-DD) to ISO format
    let dateStartISO: string | null = null;
    let dateEndISO: string | null = null;

    if (this.dateStart) {
      const startDate = typeof this.dateStart === 'string'
        ? DateTime.fromISO(this.dateStart)
        : DateTime.fromJSDate(this.dateStart);
      dateStartISO = startDate.isValid ? startDate.startOf('day').toISO() : null;
    }

    if (this.dateEnd) {
      const endDate = typeof this.dateEnd === 'string'
        ? DateTime.fromISO(this.dateEnd)
        : DateTime.fromJSDate(this.dateEnd);
      dateEndISO = endDate.isValid ? endDate.endOf('day').toISO() : null;
    }

    const request = {
      EmployeeID: this.employeeID || 0,
      DateStart: dateStartISO,
      DateEnd: dateEndISO,
      IsApproved: this.isApproved === null ? -1 : this.isApproved,
      DepartmentID: this.departmentID || 0,
      KeyWord: this.keyWord || '',
      Page: 1,
      Size: 1000000,
    };

    this.employeeNightShiftService.getEmployeeNightShift(request).subscribe({
      next: (res: any) => {
        const data = res.data.nightShiftdata || [];
        this.dataset = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID || index
        }));
        setTimeout(() => this.applyDistinctFilters(), 100);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải dữ liệu làm đêm');
        this.isLoading = false;
      }
    });
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'IsApprovedTBP',
        name: 'TBP duyệt',
        field: 'IsApprovedTBP',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: this.approvalBadgeFormatter,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
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
        formatter: this.approvalBadgeFormatter,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
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
        name: 'Tên nhân viên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        width: 170,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ApprovedTBPName',
        name: 'TBP',
        field: 'ApprovedTBPName',
        sortable: true,
        filterable: true,
        width: 170,
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
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'IsProblem',
        name: 'Bổ sung',
        field: 'IsProblem',
        sortable: true,
        filterable: true,
        width: 90,
        formatter: Formatters.checkmarkMaterial,
        filter: {
          collection: [
            { value: '', label: 'Tất cả' },
            { value: true, label: 'Có' },
            { value: false, label: 'Không' },
          ],
          model: Filters['singleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center'
      },
      {
        id: 'DateRegister',
        name: 'Ngày',
        field: 'DateRegister',
        sortable: true,
        filterable: true,
        width: 110,
        formatter: Formatters.dateEuro,
        params: { dateFormat: 'DD/MM/YYYY' },
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'DateStart',
        name: 'Từ ngày',
        field: 'DateStart',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.dateTimeShortEuro,
        params: { dateFormat: 'DD/MM/YYYY HH:mm' },
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'DateEnd',
        name: 'Đến ngày',
        field: 'DateEnd',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.dateTimeShortEuro,
        params: { dateFormat: 'DD/MM/YYYY HH:mm' },
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'WorkTime',
        name: 'Số giờ làm',
        field: 'WorkTime',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
        formatter: (row, cell, value) => {
          return value ? parseFloat(value).toFixed(2) : '0.00';
        }
      },
      {
        id: 'BreaksTime',
        name: 'Số giờ nghỉ',
        field: 'BreaksTime',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
        formatter: (row, cell, value) => {
          return value ? parseFloat(value).toFixed(2) : '0.00';
        }
      },
      {
        id: 'Location',
        name: 'Địa điểm',
        field: 'Location',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${value}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${value}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true
        },
      },
      {
        id: 'ReasonHREdit',
        name: 'Lý do sửa',
        field: 'ReasonHREdit',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${value}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grvNightShiftContainer',
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
      frozenColumn: this.isMobile() ? -1 : 3,
      showFooterRow: true,
      createFooterRow: true,
      // forceFitColumns: true,
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ','
      },
    };
  }

  // SlickGrid lifecycle methods
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    angularGrid.dataView.onRowsChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    angularGrid.slickGrid.onRendered.subscribe(() => {
      setTimeout(() => this.updateFooterTotals(), 0);
    });

    setTimeout(() => {
      this.applyDistinctFilters();
      this.updateFooterTotals();
    }, 100);
  }

  private updateFooterTotals(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    const totalCount = this.angularGrid.dataView.getLength();

    // Update count for FullName column
    const countElement = this.angularGrid.slickGrid?.getFooterRowColumn('FullName');
    if (countElement) {
      countElement.innerHTML = `<div style="font-weight: bold;">${totalCount}</div>`;
    }

    // Calculate and update sum for TotalHours column
    const filteredItems = this.angularGrid.dataView.getFilteredItems() as any[];
    const totalHours = filteredItems.reduce((sum, item) => {
      const hours = parseFloat(item.TotalHours) || 0;
      return sum + hours;
    }, 0);

    const hoursElement = this.angularGrid.slickGrid?.getFooterRowColumn('TotalHours');
    if (hoursElement) {
      hoursElement.innerHTML = `<div style="text-align: right; padding-right: 8px; font-weight: bold;">${totalHours.toFixed(2)}</div>`;
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
        let value = row?.[field];

        // Handle numeric values for approval columns
        if (field === 'IsApprovedTBP' || field === 'IsApprovedHR') {
          value = (value === null || value === undefined) ? 0 : Number(value);
        }

        if (value === null || value === undefined || value === '') return;

        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          let label = String(value);
          if (field === 'IsApprovedTBP' || field === 'IsApprovedHR') {
            switch (value) {
              case 0: label = 'Chưa duyệt'; break;
              case 1: label = 'Đã duyệt'; break;
              case 2: label = 'Không duyệt'; break;
              default: label = 'Không xác định';
            }
          }
          map.set(key, { value, label });
        }
      });
      return Array.from(map.values());
    };

    const gridColumns = this.angularGrid.slickGrid.getColumns();
    if (gridColumns) {
      gridColumns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          const collection = getUniqueValues(data, field);

          // Sort logic
          if (field === 'IsApprovedTBP' || field === 'IsApprovedHR') {
            collection.sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0));
          } else {
            collection.sort((a, b) => String(a.label).localeCompare(String(b.label)));
          }

          column.filter.collection = collection;
        }
      });
      this.angularGrid.slickGrid.setColumns(gridColumns);
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
          const field = colDef.field;
          if (!field) return;
          const collection = getUniqueValues(data, field);

          if (field === 'IsApprovedTBP' || field === 'IsApprovedHR') {
            collection.sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0));
          } else {
            collection.sort((a, b) => String(a.label).localeCompare(String(b.label)));
          }

          colDef.filter.collection = collection;
        }
      });
    }

    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();
    setTimeout(() => this.updateFooterTotals(), 50);
  }

  handleRowSelection(e: Event, args: OnSelectedRowsChangedEventArgs) { }
  onCellClicked(e: Event, args: OnClickEventArgs) { }

  getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((idx: number) => this.angularGrid.dataView.getItem(idx));
  }

  approvalBadgeFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    let numValue = 0;
    if (value === null || value === undefined) {
      numValue = 0;
    } else if (typeof value === 'number') {
      numValue = value;
    } else if (typeof value === 'string') {
      if (value === 'Đã duyệt') numValue = 1;
      else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
      else numValue = 0;
    }
    return this.formatApprovalBadge(numValue);
  };


  onAddNightShift() {
    const modalRef = this.ngbModal.open(EmployeeNightShiftFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.allEmployees = this.allEmployees;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNightShift();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onEditNightShift() {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa!');
      return;
    }

    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sửa!');
      return;
    }

    const dataInput = selectedRows[0];

    // Kiểm tra trạng thái duyệt (trừ N1, N2)
    if (!this.hasAdminPermission() && this.isItemApproved(dataInput)) {
      const fullName = dataInput.FullName || dataInput.EmployeeName || 'Không xác định';
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Phiếu  đã được duyệt, không thể sửa. Vui lòng hủy duyệt trước.`
      );
      return;
    }
    const modalRef = this.ngbModal.open(EmployeeNightShiftFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = dataInput;
    modalRef.componentInstance.allEmployees = this.allEmployees;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNightShift();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // TBP Duyệt
  onTBPApprove(): void {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateTBPApprove(listID, true);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.toBool(row.IsApprovedTBP);

        if (isApprovedTBP) {
          // Đã được TBP duyệt rồi, có thể duyệt lại hoặc bỏ qua
          listID.push(id);
        } else {
          // Chưa được TBP duyệt, vẫn có thể duyệt
          listID.push(id);
        }
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn (${listID.length} bản ghi) không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateTBPApprove(listID, true);
        }
      });
    }
  }

  // TBP Hủy duyệt
  onTBPCancel(): void {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateTBPApprove(listID, false);
        }
      });
    } else {
      // Nhiều dòng
      for (const row of selectedRows) {
        const id = row.ID;
        listID.push(id);
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn (${listID.length} bản ghi) không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateTBPApprove(listID, false);
        }
      });
    }
  }

  // HR Duyệt
  onHRApprove(): void {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';
      const isApprovedTBP = this.toBool(row.IsApprovedTBP);

      if (isApprovedTBP !== true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên <b>${fullName}</b> chưa được TBP duyệt!`);
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt/huỷ duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateHRApprove(listID, true);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.isApprovedValue(row.IsApprovedTBP);

        if (!isApprovedTBP) {
          isCheck = false;
          invalidNames.push(fullName);
        } else {
          listID.push(id);
        }
      }

      if (!isCheck) {
        const names = invalidNames.join(', ');
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên ${names} chưa được TBP duyệt!`);
        return;
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt/huỷ duyệt danh sách nhân viên đã chọn không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateHRApprove(listID, true);
        }
      });
    }
  }

  // HR Hủy duyệt
  onHRCancel(): void {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';
      const isApprovedTBP = this.toBool(row.IsApprovedTBP);

      if (isApprovedTBP !== true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên <b>${fullName}</b> chưa được TBP duyệt!`);
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateHRApprove(listID, false);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.isApprovedValue(row.IsApprovedTBP);

        if (!isApprovedTBP) {
          isCheck = false;
          invalidNames.push(fullName);
        } else {
          listID.push(id);
        }
      }

      if (!isCheck) {
        const names = invalidNames.join(', ');
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên ${names} chưa được TBP duyệt!`);
        return;
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để hủy duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateHRApprove(listID, false);
        }
      });
    }
  }

  // Update TBP Approve
  private updateTBPApprove(listID: number[], isApprove: boolean): void {
    if (listID.length === 0) return;

    // Lấy dữ liệu từ dataset để build payload
    const payload = listID.map(id => {
      const rowData = this.dataset.find(r => r.ID === id) || {};

      return {
        ID: id,
        EmployeeID: rowData['EmployeeID'],
        ApprovedTBP: rowData['ApprovedTBP'],
        DateRegister: rowData['DateRegister'],
        DateStart: rowData['DateStart'],
        DateEnd: rowData['DateEnd'],
        TotalHours: rowData['TotalHours'],
        BreaksTime: rowData['BreaksTime'] || 0,
        Location: rowData['Location'] || '',
        Note: rowData['Note'] || '',
        IsProblem: rowData['IsProblem'] || false,
        ReasonHREdit: rowData['ReasonHREdit'] || '',
        IsApprovedTBP: isApprove ? 1 : 2,
        IsApprovedHR: rowData['IsApprovedHR'] || 0,
        IsDeleted: false,
      };
    });

    this.employeeNightShiftService.saveApproveTBP(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Cập nhật trạng thái duyệt thành công!');
          this.getNightShift();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể cập nhật trạng thái duyệt!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật duyệt:', err);
        const errorMessage = err?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái duyệt!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  // Update HR Approve
  private updateHRApprove(listID: number[], isApprove: boolean): void {
    if (listID.length === 0) return;

    // Lấy dữ liệu từ dataset để build payload
    const payload = listID.map(id => {
      const rowData = this.dataset.find(r => r.ID === id) || {};

      return {
        ID: id,
        EmployeeID: rowData['EmployeeID'],
        ApprovedTBP: rowData['ApprovedTBP'],
        DateRegister: rowData['DateRegister'],
        DateStart: rowData['DateStart'],
        DateEnd: rowData['DateEnd'],
        TotalHours: rowData['TotalHours'],
        BreaksTime: rowData['BreaksTime'] || 0,
        Location: rowData['Location'] || '',
        Note: rowData['Note'] || '',
        IsProblem: rowData['IsProblem'] || false,
        ReasonHREdit: rowData['ReasonHREdit'] || '',
        IsApprovedTBP: rowData['IsApprovedTBP'] || 0,
        IsApprovedHR: isApprove ? 1 : 2,
        IsDeleted: false,
      };
    });

    this.employeeNightShiftService.saveApproveHR(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Cập nhật trạng thái duyệt thành công!');
          this.getNightShift();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể cập nhật trạng thái duyệt!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật duyệt:', err);
        const errorMessage = err?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái duyệt!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  onDeleteNightShift() {
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một bản ghi để xóa!');
      return;
    }

    // Tách thành 2 nhóm: đã duyệt (TBP hoặc HR) và chưa duyệt
    // Nếu có quyền N1 hoặc N2 thì không chặn
    const hasAdmin = this.hasAdminPermission();
    const lockedRows = hasAdmin
      ? []
      : selectedRows.filter((row: any) => this.isItemApproved(row));
    const deletableRows = hasAdmin
      ? selectedRows
      : selectedRows.filter((row: any) => !this.isItemApproved(row));

    // Nếu tất cả đều đã được duyệt (TBP hoặc HR)
    if (deletableRows.length === 0) {
      const lockedNames = lockedRows
        .map((row: any) => row.FullName || row.EmployeeName || 'Không xác định')
        .join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi đã được duyệt, không thể xóa. Vui lòng hủy duyệt trước.`
      );
      return;
    }

    // Nếu có một số bản ghi đã được duyệt, báo cảnh báo
    if (lockedRows.length > 0) {
      const lockedNames = lockedRows
        .map((row: any) => row.FullName || row.EmployeeName || 'Không xác định')
        .join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi đã được duyệt, không thể xóa. Vui lòng hủy duyệt trước.`
      );
    }

    // Chuẩn bị text hiển thị cho các bản ghi sẽ xóa
    let nameDisplay = '';
    deletableRows.forEach((item: any, index: number) => {
      nameDisplay += item.FullName || item.EmployeeName || 'Không xác định';
      if (index < deletableRows.length - 1) {
        nameDisplay += ', ';
      }
    });

    if (deletableRows.length > 10) {
      if (nameDisplay.length > 50) {
        nameDisplay = nameDisplay.slice(0, 50) + '...';
      }
      nameDisplay += ` và ${deletableRows.length - 1} bản ghi khác`;
    } else {
      if (nameDisplay.length > 100) {
        nameDisplay = nameDisplay.slice(0, 100) + '...';
      }
    }

    const payload = deletableRows.map((row: any) => ({
      ID: row.ID,
      IsDeleted: true,
    }));

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <b>[${nameDisplay}]</b> không?${lockedRows.length > 0 ? '<br/><br/><b>Lưu ý:</b> Các bản ghi đã được duyệt sẽ không bị xóa.' : ''}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeNightShiftService.saveData(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res.message || `Đã xóa ${deletableRows.length} bản ghi thành công!${lockedRows.length > 0 ? ` (${lockedRows.length} bản ghi đã được duyệt không thể xóa)` : ''}`);
              this.getNightShift();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể xóa bản ghi!');
            }
          },
          error: (err: any) => {
            console.error('Lỗi xóa:', err);
            const errorMessage = err?.error?.message || err?.error?.Message || err?.message || 'Có lỗi xảy ra khi xóa bản ghi!';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          },
        });
      },
    });
  }

  onOpenSummary() {
    const modalRef = this.ngbModal.open(EmployeeNightShiftSummaryComponent, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'night-shift-summary-modal',
    });
    modalRef.result.then(
      (result) => {
        // Handle result if needed
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  async exportToExcel() {
    if (!this.angularGrid || !this.dataset || this.dataset.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const filteredData = this.angularGrid.dataView.getFilteredItems();
    if (!filteredData || filteredData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new (ExcelJS as any).default.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách làm đêm');

    const columns = this.columnDefinitions.filter(col => col.id !== 'checkbox-selector' && col.id !== 'STT');

    const headerRow = worksheet.addRow(
      columns.map((col) => col.name || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    filteredData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.field as string;
        const value = row[field];
        switch (field) {
          case 'IsApprovedTBP':
          case 'IsApprovedHR':
            return value === 1 ? 'Đã duyệt' : (value === 2 ? 'Không duyệt' : 'Chưa duyệt');
          case 'IsProblem':
            return value ? 'Có' : 'Không';
          case 'DateRegister':
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((col: any) => {
      col.width = 20;
    });

    worksheet.eachRow((row: any, rowNumber: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-lam-them-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
}
