import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SummaryEmployeeService, SummaryPersonalRequest } from './summary-employee-service/summary-employee.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { HandoverService } from '../../../hrm/handover/handover-service/handover.service';
import { AuthService } from '../../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';

@Component({
  selector: 'app-summary-employee',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTabsModule,
    NzSpinModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    HasPermissionDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './summary-employee.component.html',
  styleUrl: './summary-employee.component.css',
})
export class SummaryEmployeeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Search params
  DateStart: Date = new Date();
  DateEnd: Date = new Date();
  DepartmentID: number = 0;
  Keyword: string = '';
  IsApproved: number = -1;

  // Data lists
  dataDepartment: any[] = [];
  dataOnLeave: any[] = [];
  dataEarlyLate: any[] = [];
  dataOverTime: any[] = [];
  dataBussiness: any[] = [];
  dataWFH: any[] = [];
  dataENF: any[] = [];
  dataNightShift: any[] = [];

  // Grid instances
  angularGridOnLeave!: AngularGridInstance;
  angularGridEarlyLate!: AngularGridInstance;
  angularGridOverTime!: AngularGridInstance;
  angularGridBussiness!: AngularGridInstance;
  angularGridWFH!: AngularGridInstance;
  angularGridENF!: AngularGridInstance;
  angularGridNightShift!: AngularGridInstance;

  // Column definitions
  columnsOnLeave: Column[] = [];
  columnsEarlyLate: Column[] = [];
  columnsOverTime: Column[] = [];
  columnsBussiness: Column[] = [];
  columnsWFH: Column[] = [];
  columnsENF: Column[] = [];
  columnsNightShift: Column[] = [];

  // Grid options
  gridOptionsOnLeave: GridOption = {};
  gridOptionsEarlyLate: GridOption = {};
  gridOptionsOverTime: GridOption = {};
  gridOptionsBussiness: GridOption = {};
  gridOptionsWFH: GridOption = {};
  gridOptionsENF: GridOption = {};
  gridOptionsNightShift: GridOption = {};

  // Datasets
  datasetOnLeave: any[] = [];
  datasetEarlyLate: any[] = [];
  datasetOverTime: any[] = [];
  datasetBussiness: any[] = [];
  datasetWFH: any[] = [];
  datasetENF: any[] = [];
  datasetNightShift: any[] = [];

  // UI state
  isLoading: boolean = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  currentUser: any = null;
  selectedTabIndex: number = 0;

  statusData = [
    { ID: -1, Name: 'Tất cả' },
    { ID: 0, Name: 'Chờ duyệt' },
    { ID: 1, Name: 'Đã duyệt' },
    { ID: 2, Name: 'Từ chối' }
  ];

  constructor(
    private notification: NzNotificationService,
    private summaryEmployeeService: SummaryEmployeeService,
    private handoverService: HandoverService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.DateStart = this.getYesterday();
    this.DateEnd = this.getToday();
    this.initAllGrids();
    this.getdataDepartment();
    this.getCurrentUser();
  }

  ngAfterViewInit(): void {
    // Load data after a short delay to ensure user info is fetched
    setTimeout(() => {
      this.loadData();
    }, 300);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

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

  private getYesterday(): Date {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private getToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      // Set default DepartmentID from current user
      if (this.currentUser?.DepartmentID) {
        this.DepartmentID = this.currentUser.DepartmentID;
      }
    });
  }

  getdataDepartment(): void {
    this.handoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  loadData(): void {
    const request: SummaryPersonalRequest = {
      DateStart: this.DateStart,
      DateEnd: this.DateEnd,
      DepartmentID: this.DepartmentID || 0,
      EmployeeID: 0,
      IsApproved: this.IsApproved,
      Keyword: this.Keyword?.trim() || ''
    };

    this.isLoading = true;
    this.summaryEmployeeService.getSummaryEmployeePerson(request).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const data = response.data;

          // Parse dataOnLeave - flatten nested arrays
          this.dataOnLeave = this.flattenArray(data.dataOnLeave || []);
          this.datasetOnLeave = this.dataOnLeave.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataEarlyLate
          this.dataEarlyLate = this.flattenArray(data.dataEarlyLate || []);
          this.datasetEarlyLate = this.dataEarlyLate.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataOverTime
          this.dataOverTime = this.flattenArray(data.dataOverTime || []);
          this.datasetOverTime = this.dataOverTime.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataBussiness
          this.dataBussiness = this.flattenArray(data.dataBussiness || []);
          this.datasetBussiness = this.dataBussiness.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataWFH
          this.dataWFH = this.flattenArray(data.dataWFH || []);
          this.datasetWFH = this.dataWFH.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataENF
          this.dataENF = this.flattenArray(data.dataENF || []);
          this.datasetENF = this.dataENF.map((item, index) => ({
            ...item,
            id: index + 1, // Use index as unique id
            STT: index + 1
          }));

          // Parse dataNightShift - filter out pagination objects (TotalPage)
          const nightShiftRaw = this.flattenArray(data.dataNightShift || []);
          // Filter out objects that only have TotalPage (pagination info)
          this.dataNightShift = nightShiftRaw.filter((item: any) => {
            // Exclude empty objects and pagination objects
            return item && Object.keys(item).length > 0 && item.TotalPage === undefined;
          });
          // Use index as unique id to avoid duplicate ID issues
          this.datasetNightShift = this.dataNightShift.map((item, index) => ({
            ...item,
            id: index--, // Use index as unique id
            STT: index + 1
          }));

          // Apply distinct filters after data is loaded
          setTimeout(() => {
            this.applyDistinctFiltersForAllGrids();
            this.updateAllFooterRows();
          }, 100);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi lấy dữ liệu');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
      }
    });
  }

  private flattenArray(arr: any[]): any[] {
    const result: any[] = [];
    for (const item of arr) {
      if (Array.isArray(item)) {
        result.push(...this.flattenArray(item));
      } else if (item && typeof item === 'object') {
        result.push(item);
      }
    }
    return result;
  }

  searchData(): void {
    this.loadData();
  }

  resetSearch(): void {
    this.DateStart = this.getYesterday();
    this.DateEnd = this.getToday();
    this.DepartmentID = this.currentUser?.DepartmentID || 0;
    this.Keyword = '';
    this.IsApproved = -1;
    this.loadData();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Resize grid after tab change to fix display issues
    setTimeout(() => {
      this.resizeCurrentGrid();
    }, 100);
  }

  private resizeCurrentGrid(): void {
    switch (this.selectedTabIndex) {
      case 0:
        this.angularGridOnLeave?.resizerService?.resizeGrid();
        break;
      case 1:
        this.angularGridEarlyLate?.resizerService?.resizeGrid();
        break;
      case 2:
        this.angularGridOverTime?.resizerService?.resizeGrid();
        break;
      case 3:
        this.angularGridBussiness?.resizerService?.resizeGrid();
        break;
      case 4:
        this.angularGridNightShift?.resizerService?.resizeGrid();
        break;
      case 5:
        this.angularGridWFH?.resizerService?.resizeGrid();
        break;
      case 6:
        this.angularGridENF?.resizerService?.resizeGrid();
        break;
    }
  }

  // Apply distinct filters for all grids
  private applyDistinctFiltersForAllGrids(): void {
    this.applyDistinctFilters(this.angularGridOnLeave, this.datasetOnLeave, ['StatusTBPText', 'StatusHRText', 'TypeIsRealText', 'TimeOnLeaveText']);
    this.applyDistinctFilters(this.angularGridEarlyLate, this.datasetEarlyLate, ['IsApprovedTPText', 'IsApprovedText', 'TypeText']);
    this.applyDistinctFilters(this.angularGridOverTime, this.datasetOverTime, ['StatusTBPText', 'StatusHRText', 'TypeName', 'LocationText']);
    this.applyDistinctFilters(this.angularGridBussiness, this.datasetBussiness, ['StatusTBPText', 'StatusHRText', 'TypeName']);
    this.applyDistinctFilters(this.angularGridWFH, this.datasetWFH, ['StatusTBPText', 'StatusHRText', 'TimeWFHText']);
    this.applyDistinctFilters(this.angularGridENF, this.datasetENF, ['IsApprovedTPText', 'IsApprovedHRText', 'TypeText']);
    this.applyDistinctFilters(this.angularGridNightShift, this.datasetNightShift, ['IsApprovedTBPText', 'IsApprovedHRText']);
  }

  private applyDistinctFilters(gridInstance: AngularGridInstance | undefined, dataset: any[], fields: string[]): void {
    if (!gridInstance || !dataset || dataset.length === 0) return;

    const columnDefinitions = gridInstance.slickGrid?.getColumns();
    if (!columnDefinitions) return;

    fields.forEach(field => {
      const column = columnDefinitions.find((col: any) => col.field === field);
      if (column && column.filter) {
        // Get distinct values from dataset
        const distinctValues = [...new Set(dataset.map(item => item[field]).filter(val => val !== null && val !== undefined && val !== ''))];
        // Create collection for multiselect
        const collection = distinctValues.map(val => ({ value: val, label: val }));
        column.filter.collection = collection;
      }
    });

    // Refresh filter row to show updated collections
    gridInstance.slickGrid?.setColumns(columnDefinitions);
  }

  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  // Initialize all grids
  initAllGrids(): void {
    this.initGridOnLeave();
    this.initGridEarlyLate();
    this.initGridOverTime();
    this.initGridBussiness();
    this.initGridWFH();
    this.initGridENF();
    this.initGridNightShift();
  }

  // Date formatter helper
  private formatDate(row: number, cell: number, value: any): string {
    if (!value) return '';
    try {
      const dateValue = DateTime.fromISO(value);
      return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy HH:mm') : value;
    } catch (e) {
      return value;
    }
  }

  private formatDateOnly(row: number, cell: number, value: any): string {
    if (!value) return '';
    try {
      const dateValue = DateTime.fromISO(value);
      return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
    } catch (e) {
      return value;
    }
  }

  // Status formatter helper - chữ đen cho chờ duyệt, chữ xanh cho đã duyệt
  private statusFormatter(row: number, cell: number, value: any): string {
    if (!value) return '';

    let color = '#000'; // Mặc định chữ đen

    if (value === 'Đã duyệt') {
      color = '#52c41a'; // Xanh lá
    } else if (value === 'Không đồng ý duyệt' || value === 'Từ chối' || value === 'Không duyệt') {
      color = '#ff4d4f'; // Đỏ
    }
    // Chờ duyệt và các trạng thái khác: chữ đen (#000)

    return `<span style="color:${color}; font-weight:600;">${value}</span>`;
  }

  private getDefaultGridOptions(containerId: string): GridOption {
    return {
      autoResize: { container: containerId, calculateAvailableSizeBy: 'container' },
      enableAutoResize: true,
      gridWidth: '100%',
      gridHeight: 400,
      forceFitColumns: true,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };
  }

  // Grid 1: Đăng ký nghỉ
  initGridOnLeave(): void {
    this.columnsOnLeave = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'StatusTBPText', name: 'TBP duyệt', field: 'StatusTBPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'StatusHRText', name: 'HR duyệt', field: 'StatusHRText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeLeave', name: 'Người xin nghỉ', field: 'EmployeeLeave', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'EmployeeTP', name: 'Trưởng bộ phận', field: 'EmployeeTP', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'EmployeeHR', name: 'Nhân sự', field: 'EmployeeHR', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'TypeIsRealText', name: 'Loại nghỉ', field: 'TypeIsRealText', width: 120, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'TimeOnLeaveText', name: 'Thời gian nghỉ', field: 'TimeOnLeaveText', width: 120, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'StartDate', name: 'Ngày bắt đầu', field: 'StartDate', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'EndDate', name: 'Ngày kết thúc', field: 'EndDate', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'Reason', name: 'Lý do nghỉ', field: 'Reason', width: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonCancel', name: 'Lý do hủy', field: 'ReasonCancel', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'DateCancel', name: 'Ngày hủy', field: 'DateCancel', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
    ];
    this.gridOptionsOnLeave = this.getDefaultGridOptions('#grid-on-leave');
  }

  // Grid 2: Đi muộn về sớm
  initGridEarlyLate(): void {
    this.columnsEarlyLate = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'IsApprovedTPText', name: 'TBP Duyệt', field: 'IsApprovedTPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'IsApprovedText', name: 'HR duyệt', field: 'IsApprovedText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeEarlyLate', name: 'Họ tên', field: 'EmployeeEarlyLate', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'EmployeeApprovedTP', name: 'Trưởng bộ phận', field: 'EmployeeApprovedTP', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'TypeText', name: 'Loại', field: 'TypeText', width: 150, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'DateRegister', name: 'Ngày', field: 'DateRegister', width: 120, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'DateStart', name: 'Thời gian bắt đầu', field: 'DateStart', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'DateEnd', name: 'Thời gian kết thúc', field: 'DateEnd', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'TimeRegister', name: 'Tổng thời gian (Phút)', field: 'TimeRegister', width: 130, sortable: true, cssClass: 'text-right', filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'Reason', name: 'Lý do', field: 'Reason', width: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsEarlyLate = this.getDefaultGridOptions('#grid-early-late');
  }

  // Grid 3: Làm thêm
  initGridOverTime(): void {
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value ? 'checked' : '';
      return `<input type="checkbox" ${checked} onclick="return false;" />`;
    };

    this.columnsOverTime = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'StatusTBPText', name: 'TBP duyệt', field: 'StatusTBPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'StatusHRText', name: 'HR duyệt', field: 'StatusHRText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeFullName', name: 'Họ tên', field: 'EmployeeFullName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedTBP', name: 'Trưởng phòng', field: 'ApprovedTBP', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedHR', name: 'Nhân sự', field: 'ApprovedHR', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'TypeName', name: 'Loại', field: 'TypeName', width: 120, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'DateRegister', name: 'Ngày', field: 'DateRegister', width: 120, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'TimeStart', name: 'Từ', field: 'TimeStart', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'EndTime', name: 'Đến', field: 'EndTime', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'TotalTime', name: 'Số giờ', field: 'TotalTime', width: 80, sortable: true, cssClass: 'text-right', filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'ProjectName', name: 'Dự án', field: 'ProjectName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'LocationText', name: 'Địa điểm', field: 'LocationText', width: 150, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'Reason', name: 'Lý do', field: 'Reason', width: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Overnight', name: 'Ăn tối', field: 'Overnight', width: 80, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsOverTime = this.getDefaultGridOptions('#grid-over-time');
  }

  // Grid 4: Công tác
  initGridBussiness(): void {
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value ? 'checked' : '';
      return `<input type="checkbox" ${checked} onclick="return false;" />`;
    };

    const currencyFormatter = (row: number, cell: number, value: any) => {
      if (value == null || value === '') return '';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    this.columnsBussiness = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'StatusTBPText', name: 'TBP Duyệt', field: 'StatusTBPText', width: 110, minWidth: 110, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'StatusHRText', name: 'HR Duyệt', field: 'StatusHRText', width: 110, minWidth: 110, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeName', name: 'Họ tên', field: 'EmployeeName', width: 160, minWidth: 160, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedName', name: 'Trưởng phòng', field: 'ApprovedName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedHR', name: 'Nhân sự', field: 'ApprovedHR', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'DayBussiness', name: 'Ngày', field: 'DayBussiness', width: 110, minWidth: 110, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'Location', name: 'Địa điểm', field: 'Location', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      {
        id: 'TypeName', name: 'Loại', field: 'TypeName', width: 130, minWidth: 130, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'CostType', name: 'Phí công tác', field: 'CostType', width: 130, minWidth: 130, sortable: true, cssClass: 'text-right', formatter: currencyFormatter, filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'CostVehicle', name: 'Phương tiện', field: 'CostVehicle', width: 130, minWidth: 130, sortable: true, cssClass: 'text-right', formatter: currencyFormatter, filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'Overnight', name: 'Ăn tối', field: 'Overnight', width: 80, minWidth: 80, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CostWorkEarly', name: 'Phí xuất phát trước 7H15', field: 'CostWorkEarly', width: 180, minWidth: 180, sortable: true, cssClass: 'text-right', formatter: currencyFormatter, filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'TotalMoney', name: 'Tổng chi phí', field: 'TotalMoney', width: 130, minWidth: 130, sortable: true, cssClass: 'text-right', formatter: currencyFormatter, filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'NotChekInText', name: 'Chấm công', field: 'NotChekInText', width: 120, minWidth: 120, sortable: true },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CreatedDate', name: 'Ngày tạo', field: 'CreatedDate', width: 150, minWidth: 150, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
    ];
    // Grid Công tác dùng forceFitColumns: false để cho phép scroll ngang
    this.gridOptionsBussiness = {
      ...this.getDefaultGridOptions('#grid-bussiness'),
      forceFitColumns: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      syncColumnCellResize: true,
    };
  }

  // Grid 5: Làm việc ở nhà (WFH)
  initGridWFH(): void {
    this.columnsWFH = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'StatusTBPText', name: 'TBP Duyệt', field: 'StatusTBPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'StatusHRText', name: 'HR Duyệt', field: 'StatusHRText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeName', name: 'Họ tên', field: 'EmployeeName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedName', name: 'Người duyệt', field: 'ApprovedName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedHR', name: 'Nhân sự', field: 'ApprovedHR', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'DateRegister', name: 'Ngày', field: 'DateRegister', width: 120, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'TimeWFHText', name: 'Khoảng thời gian', field: 'TimeWFHText', width: 130, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'Reason', name: 'Lý do', field: 'Reason', width: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsWFH = this.getDefaultGridOptions('#grid-wfh');
  }

  // Grid 6: Quên chấm công
  initGridENF(): void {
    this.columnsENF = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'IsApprovedTPText', name: 'TBP duyệt', field: 'IsApprovedTPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'IsApprovedHRText', name: 'HR duyệt', field: 'IsApprovedHRText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeName', name: 'Họ tên', field: 'EmployeeName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedTPName', name: 'Trưởng bộ phận', field: 'ApprovedTPName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedHRName', name: 'Nhân sự', field: 'ApprovedHRName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'DayWork', name: 'Ngày', field: 'DayWork', width: 120, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'TypeText', name: 'Loại', field: 'TypeText', width: 120, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsENF = this.getDefaultGridOptions('#grid-enf');
  }

  // Grid 7: Làm đêm
  initGridNightShift(): void {
    this.columnsNightShift = [
      { id: 'STT', name: 'STT', field: 'STT', width: 50, minWidth: 50, maxWidth: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'IsApprovedTBPText', name: 'TBP duyệt', field: 'IsApprovedTBPText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'IsApprovedHRText', name: 'HR duyệt', field: 'IsApprovedHRText', width: 100, sortable: true, filterable: true,
        formatter: this.statusFormatter,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'FullName', name: 'Họ tên', field: 'FullName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ApprovedTBPName', name: 'TBP', field: 'ApprovedTBPName', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'DateRegister', name: 'Ngày', field: 'DateRegister', width: 120, sortable: true, formatter: this.formatDateOnly, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'DateStart', name: 'Từ', field: 'DateStart', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'DateEnd', name: 'Đến', field: 'DateEnd', width: 140, sortable: true, formatter: this.formatDate, filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'TotalHours', name: 'Số giờ', field: 'TotalHours', width: 80, sortable: true, cssClass: 'text-right', filterable: true, filter: { model: Filters['compoundInputNumber'] } },
      { id: 'Location', name: 'Địa điểm', field: 'Location', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReasonDeciline', name: 'Lý do không duyệt', field: 'ReasonDeciline', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsNightShift = this.getDefaultGridOptions('#grid-night-shift');
  }

  // Grid ready handlers
  angularGridOnLeaveReady(angularGrid: AngularGridInstance): void {
    this.angularGridOnLeave = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeLeave', []);
  }

  angularGridEarlyLateReady(angularGrid: AngularGridInstance): void {
    this.angularGridEarlyLate = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeEarlyLate', ['TimeRegister']);
  }

  angularGridOverTimeReady(angularGrid: AngularGridInstance): void {
    this.angularGridOverTime = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeFullName', ['TotalTime']);
  }

  angularGridBussinessReady(angularGrid: AngularGridInstance): void {
    this.angularGridBussiness = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeName', ['TotalMoney']);
  }

  angularGridWFHReady(angularGrid: AngularGridInstance): void {
    this.angularGridWFH = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeName', []);
  }

  angularGridENFReady(angularGrid: AngularGridInstance): void {
    this.angularGridENF = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'EmployeeName', []);
  }

  angularGridNightShiftReady(angularGrid: AngularGridInstance): void {
    this.angularGridNightShift = angularGrid;
    this.setupFooterRowUpdate(angularGrid, 'FullName', ['TotalHours']);
  }

  // Setup footer row update with filter change listener
  private setupFooterRowUpdate(gridInstance: AngularGridInstance, countField: string, sumFields: string[] = []): void {
    if (!gridInstance?.slickGrid) return;

    // Subscribe to filter changes
    gridInstance.dataView?.onRowCountChanged.subscribe(() => {
      this.updateFooterRow(gridInstance, countField, sumFields);
    });

    // Initial footer update
    setTimeout(() => {
      this.updateFooterRow(gridInstance, countField, sumFields);
    }, 100);
  }

  // Update footer row with count and sum
  private updateFooterRow(gridInstance: AngularGridInstance, countField: string, sumFields: string[] = []): void {
    if (!gridInstance?.slickGrid) return;

    // Get filtered items from dataView
    const items = (gridInstance.dataView?.getFilteredItems?.() as any[]) || [];

    // Count items based on countField
    const count = (items || []).filter(item => item[countField]).length;

    gridInstance.slickGrid.setFooterRowVisibility(true);

    // Set footer values for each column
    const columns = gridInstance.slickGrid.getColumns();
    columns.forEach((col: any) => {
      const footerCell = gridInstance.slickGrid.getFooterRowColumn(col.id);
      if (!footerCell) return;

      footerCell.style.textAlign = 'center';
      footerCell.style.verticalAlign = 'middle';
      footerCell.style.fontWeight = 'bold';
      footerCell.style.fontSize = '12px';

      if (col.field === countField) {
        footerCell.innerHTML = `${count}`;
      } else if (sumFields.includes(col.field)) {
        const sum = items.reduce((acc, item) => {
          const val = parseFloat(item[col.field]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        // Display sum, formatted
        const displaySum = Number.isInteger(sum) ? sum : sum.toFixed(1);
        footerCell.innerHTML = `${displaySum}`;
      } else {
        footerCell.innerHTML = '';
      }
    });
  }

  // Update all footer rows after data load
  private updateAllFooterRows(): void {
    this.updateFooterRow(this.angularGridOnLeave, 'EmployeeLeave', []);
    this.updateFooterRow(this.angularGridEarlyLate, 'EmployeeEarlyLate', ['TimeRegister']);
    this.updateFooterRow(this.angularGridOverTime, 'EmployeeFullName', ['TotalTime']);
    this.updateFooterRow(this.angularGridBussiness, 'EmployeeName', ['TotalMoney']);
    this.updateFooterRow(this.angularGridWFH, 'EmployeeName', []);
    this.updateFooterRow(this.angularGridENF, 'EmployeeName', []);
    this.updateFooterRow(this.angularGridNightShift, 'FullName', ['TotalHours']);
  }
}

