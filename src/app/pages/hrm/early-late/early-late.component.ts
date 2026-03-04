import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, TemplateRef, OnDestroy } from '@angular/core';
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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
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
    Menubar,
    AngularSlickgridModule
  ]
})
export class EarlyLateComponent implements OnInit, AfterViewInit, OnDestroy {
  //test
  private tabulator!: Tabulator;
  sizeSearch: string = '0';
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

  // Debounce subjects for auto-reload
  private filterChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

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
    this.initGrid();
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

    // Setup auto-reload when filters change
    this.filterChangeSubject.pipe(
      debounceTime(300), // Wait 300ms after filter change
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadEarlyLate();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    // Sanitize form values to handle null/undefined values
    const formValue = this.searchForm.value;
    const request = {
      month: formValue.month ?? new Date().getMonth() + 1,
      year: formValue.year ?? new Date().getFullYear(),
      departmentId: formValue.departmentId ?? 0,
      status: formValue.status ?? -1,
      keyWord: formValue.keyWord ?? '',
      pageNumber: formValue.pageNumber ?? 1,
      pageSize: formValue.pageSize ?? 1000000,
      IDApprovedTP: formValue.IDApprovedTP ?? 0
    };

    this.earlyLateService.getEmployeeEarlyLate(request).subscribe({
      next: (data) => {
        this.earlyLateList = data.data;

        // Helper function to convert approval status to text
        const getApprovalText = (value: any): string => {
          if (value === true || value === 1 || value === '1') return 'Đã duyệt';
          if (value === false || value === 0 || value === '0') return 'Chưa duyệt';
          if (value === 2 || value === '2') return 'Không duyệt';
          return 'Chưa duyệt';
        };

        this.dataset = this.earlyLateList.map((item, index) => ({
          ...item,
          slickGridId: index,
          IsSeniorApprovedText: getApprovalText(item.IsSeniorApproved),
          StatusText: getApprovalText(item.IsApprovedTP),
          StatusHRText: getApprovalText(item.IsApproved),
        }));

        // Apply filters after a small delay to ensure grid is fully rendered
        setTimeout(() => {
          this.applyDistinctFilters();
        }, 200);

        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, "Lỗi tải dữ liệu đi muộn - về sớm");
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

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'IsSeniorApprovedText',
        name: 'Senior duyệt',
        field: 'IsSeniorApprovedText',
        sortable: true,
        filterable: true,
        width: 110,
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
        id: 'StatusText',
        name: 'TBP duyệt',
        field: 'StatusText',
        sortable: true,
        filterable: true,
        width: 110,
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
        id: 'StatusHRText',
        name: 'HR duyệt',
        field: 'StatusHRText',
        sortable: true,
        filterable: true,
        width: 110,
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
        name: 'Tên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ApprovedName',
        name: 'Người duyệt',
        field: 'ApprovedName',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
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
        width: 120,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'DateStart',
        name: 'Từ',
        field: 'DateStart',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: this.dateTimeFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'DateEnd',
        name: 'Đến',
        field: 'DateEnd',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: this.dateTimeFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'CheckIn',
        name: 'CheckIn',
        field: 'CheckIn',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center'
      },
      {
        id: 'CheckOut',
        name: 'CheckOut',
        field: 'CheckOut',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center'
      },
      {
        id: 'TimeRegister',
        name: 'Số phút',
        field: 'TimeRegister',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'TypeText',
        name: 'Loại',
        field: 'TypeText',
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
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonDeciline',
        name: 'Lý do không đồng ý duyệt',
        field: 'ReasonDeciline',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grvEarlyLateContainer',
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
      frozenColumn: this.isMobile() ? 0 : 4,
      showFooterRow: true,
      createFooterRow: true,
      datasetIdPropertyName: 'slickGridId',
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ','
      },
    };
  }

  // Custom formatter for approval badge
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

  // Custom formatter for datetime
  dateTimeFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
  };

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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};

    // Update footer row count and sum when data changes
    angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    // Also update when filter changes
    angularGrid.dataView.onRowsChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    // Update footer after grid render (to prevent footer being cleared)
    angularGrid.slickGrid.onRendered.subscribe(() => {
      setTimeout(() => this.updateFooterTotals(), 0);
    });

    // Apply distinct filters after grid is ready with a small delay
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

    // Calculate and update sum for TimeReality column
    const filteredItems = this.angularGrid.dataView.getFilteredItems() as any[];
    const totalHours = filteredItems.reduce((sum, item) => {
      const hours = parseFloat(item.TimeRegister) || 0;
      return sum + hours;
    }, 0);

    const hoursElement = this.angularGrid.slickGrid?.getFooterRowColumn('TimeRegister');
    if (hoursElement) {
      hoursElement.innerHTML = `<div style="text-align: right; padding-right: 8px; font-weight: bold;">${totalHours.toFixed(2)}</div>`;
    }
  }

  applyDistinctFilters(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) {
      console.log('Grid not ready for filters');
      return;
    }

    // Update footer totals
    this.updateFooterTotals();

    // Update filter collections for multipleSelect columns based on actual data
    const data = this.angularGrid.dataView.getItems() as any[];

    if (!data || data.length === 0) {
      console.log('No data available for filters');
      return;
    }

    console.log('Applying distinct filters to', data.length, 'items');

    // Helper function to get unique values for a field
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
      const result = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
      console.log(`Field '${field}' has ${result.length} unique values:`, result);
      return result;
    };

    // Update columns in the grid
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

    // Update columnDefinitions
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
    setTimeout(() => this.updateFooterTotals(), 50);
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

    // Subscribe to search form value changes to trigger auto-reload
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadEarlyLate();
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
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký đi muộn - về sớm cần sửa');
      return;
    }

    const selectedData = selectedRows[0];

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

    this.selectedEarlyLate = selectedRows[0];
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
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký cần xóa');
      return;
    }

    // Kiểm tra trạng thái duyệt cho tất cả các bản ghi đã chọn - cho phép người có quyền xóa bất kể đã duyệt
    // SlickGrid rows are already data objects, no need to call getData()
    const selectedData = selectedRows;
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
          let selectedEarlyLate = row;

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

  // Filter change handlers - trigger auto reload
  onFilterChange(): void {
    this.filterChangeSubject.next();
  }

  onMonthChange(): void {
    this.filterChangeSubject.next();
  }

  onYearChange(): void {
    this.filterChangeSubject.next();
  }

  onDepartmentChange(): void {
    this.filterChangeSubject.next();
  }

  onStatusChange(): void {
    this.filterChangeSubject.next();
  }

  onApproverChange(): void {
    this.filterChangeSubject.next();
  }

  onKeywordChange(): void {
    this.filterChangeSubject.next();
  }

  isApproveTBP(status: boolean) {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length == 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn nhân viên để duyệt");
      return;
    }
    if (!status) {
      for (let data of selectedRows) {
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
      const data = row;
      const id = data['ID'] || data.ID;
      if (!id || id === 0) {
        this.notification.warning('Cảnh báo', 'Bản ghi không có ID hợp lệ, bỏ qua!');
        continue;
      }

      const payload = {
        ...data,
        ID: id,
        IsApprovedTP: status,
        ReasonDeciline: reason
      };

      this.earlyLateService.saveEmployeeEarlyLate(payload).subscribe({
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
    const selectedRows = this.getSelectedRows();
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
          // SlickGrid rows are already data objects
          const data = row;
          const id = data['ID'] || data.ID;
          let isApprovedTP = data['IsApprovedTP'];
          if (!isApprovedTP) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'TBP chưa duyệt. Vui lòng kiểm tra lại!');
            return;
          }

          const payload = {
            ...data,
            ID: id,
            IsApproved: true
          };

          this.earlyLateService.saveEmployeeEarlyLate(payload).subscribe({
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
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần hủy duyệt!');
      return;
    }

    for (let row of selectedRows) {
      // SlickGrid rows are already data objects
      const data = row;
      let id = data['ID'] || data.ID;
      if (!id || id == 0) continue;

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
      const data = row;
      const id = data['ID'] || data.ID;

      if (!id || id === 0) {
        console.error('Invalid ID detected, skipping row:', data);
        this.notification.warning('Cảnh báo', 'Bản ghi không có ID hợp lệ, bỏ qua!');
        continue;
      }

      const payload = {
        ...data,
        ID: id,
        IsApproved: status,
        ReasonDeciline: reason
      };

      console.log('Sending payload to backend:', payload);

      this.earlyLateService.saveEmployeeEarlyLate(payload).subscribe({
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
      });
    }
  }
}
