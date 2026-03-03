import { Component, OnInit, inject } from '@angular/core';
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
    Menubar,
    AngularSlickgridModule
  ]
})
export class OverTimeComponent implements OnInit {

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

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // List loại làm thêm cho filter select
  overTimeTypeList: any[] = [
    { value: '', label: 'Tất cả' },
    { value: 'Ngày thường', label: 'Ngày thường' },
    { value: 'Cuối tuần', label: 'Cuối tuần' },
    { value: 'Ngày lễ', label: 'Ngày lễ' },
  ];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private departmentService = inject(DepartmentServiceService);
  private overTimeService = inject(OverTimeService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);

  constructor() { }

  ngOnInit() {
    this.initMenuBar();
    this.initializeForm();
    this.loadDepartment();
    this.initGrid();
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

  private initializeForm(): void {
    const today = new Date();
    const dateStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Convert Date to yyyy-MM-dd format for HTML date input
    const formatDateToString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.searchForm = this.fb.group({
      dateStart: formatDateToString(dateStart),
      dateEnd: formatDateToString(dateEnd),
      departmentId: 0,
      pageNumber: 1,
      pageSize: 100000,
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
    // Convert date strings to Date objects for backend compatibility
    const formValue = { ...this.searchForm.value };
    if (formValue.dateStart) {
      formValue.dateStart = new Date(formValue.dateStart);
    }
    if (formValue.dateEnd) {
      formValue.dateEnd = new Date(formValue.dateEnd);
    }
    this.overTimeService.getEmployeeOverTime(formValue).subscribe({
      next: (data) => {
        this.overTimeList = data.data;
        // Add unique id property for SlickGrid (use index to ensure uniqueness)
        this.dataset = this.overTimeList.map((item, index) => ({
          ...item,
          id: index // Use index as unique id since item.ID can be duplicated
        }));
        this.applyDistinctFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, "Lỗi tải dữ liệu làm thêm");
        this.isLoading = false;
      }
    })
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
        id: 'IsApprovedBGD',
        name: 'BGD duyệt',
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
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
        cssClass: 'text-center'
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
        id: 'NguoiDuyet',
        name: 'Người duyệt',
        field: 'NguoiDuyet',
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
        id: 'TimeStart',
        name: 'Từ',
        field: 'TimeStart',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: this.dateTimeFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'EndTime',
        name: 'Đến',
        field: 'EndTime',
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
        id: 'Overnight',
        name: 'Ăn tối',
        field: 'Overnight',
        sortable: true,
        filterable: true,
        width: 80,
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
        id: 'TimeReality',
        name: 'Số giờ',
        field: 'TimeReality',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'ProjectName',
        name: 'Dự án',
        field: 'ProjectName',
        sortable: true,
        filterable: true,
        width: 250,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'LocationText',
        name: 'Địa điểm',
        field: 'LocationText',
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
        id: 'Type',
        name: 'Loại',
        field: 'Type',
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
        container: '#grvOverTimeContainer',
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
      const hours = parseFloat(item.TimeReality) || 0;
      return sum + hours;
    }, 0);

    const hoursElement = this.angularGrid.slickGrid?.getFooterRowColumn('TimeReality');
    if (hoursElement) {
      hoursElement.innerHTML = `<div style="text-align: right; padding-right: 8px; font-weight: bold;">${totalHours.toFixed(2)}</div>`;
    }
  }

  applyDistinctFilters(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    // Update footer totals
    this.updateFooterTotals();

    // Update filter collections for multipleSelect columns based on actual data
    const data = this.angularGrid.dataView.getItems() as any[];

    if (!data || data.length === 0) return;

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
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
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

    // Re-set column definitions to apply new filter collections
    const updatedColumns = this.angularGrid.slickGrid.getColumns();
    this.angularGrid.slickGrid.setColumns(updatedColumns);

    // Invalidate and render to refresh the grid
    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();

    // Re-update footer totals after render (in case onRendered doesn't catch it)
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

  openAddModal() {
    // Reset detail data for add mode
    this.overTimeDetailData = [];
    const modal = new (window as any).bootstrap.Modal(document.getElementById('overTimeModal'));
    modal.show();
  }

  openEditModal() {
    const selectedData = this.getSelectedRows();
    if (selectedData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký làm thêm cần chỉnh sửa');
      return;
    }
    // Kiểm tra trạng thái duyệt - cho phép người có quyền sửa bất kể đã duyệt
    const firstSelected = selectedData[0];
    if (this.isApproved(firstSelected) && !this.checkCanEditApproved()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đăng ký đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
      return;
    }

    const selectedOverTime = firstSelected;
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
    const selectedData = this.getSelectedRows();

    if (selectedData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký nghỉ cần xóa');
      return;
    }

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
    const selectedData = this.getSelectedRows();

    if (selectedData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đăng ký nghỉ cần duyệt');
      return;
    }

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
              IsDeleted: item.IsDeleted || false
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

        const serviceCall = isTBP
          ? this.overTimeService.saveEmployeeOverTime(formData)
          : this.overTimeService.approveOverTimeHR(formData);

        serviceCall.subscribe({
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
