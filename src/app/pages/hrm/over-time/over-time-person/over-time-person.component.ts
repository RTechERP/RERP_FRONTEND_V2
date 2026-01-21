import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { OverTimeService } from '../over-time-service/over-time.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OverTimePersonFormComponent } from './over-time-person-form/over-time-person-form.component';
import { environment } from '../../../../../environments/environment';
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
  selector: 'app-over-time-person',
  templateUrl: './over-time-person.component.html',
  styleUrls: ['./over-time-person.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzSpinModule,
    NgIf,
    Menubar,
    NzGridModule,
    AngularSlickgridModule,
  ]
})
export class OverTimePersonComponent implements OnInit {
  searchForm!: FormGroup;
  exportingExcel = false;
  isLoading = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  // Dropdown data for search
  typeList: any[] = [];

  // Data
  overTimeList: any[] = [];

  // Menu bars
  menuBars: any[] = [];

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  gridData: any;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private overTimeService: OverTimeService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.initMenuBar();
    this.loadTypes();
    this.initGrid();
    this.loadOverTimeByEmployee();
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => {
          this.openAddModal();
        }
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => {
          this.openEditModal();
        }
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          this.openDeleteModal();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        }
      }
    ];
  }

  private initializeForm(): void {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm = this.fb.group({
      startDate: [this.formatDateForInput(firstDay)],
      endDate: [this.formatDateForInput(lastDay)],
      status: [-1],
      type: [null],
      keyWord: ['']
    });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadTypes() {
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data: any) => {
        this.typeList = data.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại làm thêm: ' + error.message);
      }
    });
  }

  resetSearch() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    this.searchForm.reset({
      startDate: this.formatDateForInput(firstDay),
      endDate: this.formatDateForInput(lastDay),
      status: -1,
      type: null,
      keyWord: ''
    });
    this.loadOverTimeByEmployee();
  }

  loadOverTimeByEmployee() {
    this.isLoading = true;
    const formValue = this.searchForm.value;

    const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : null;
    const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : null;

    const request: any = {
      DateStart: startDate,
      DateEnd: endDate,
      KeyWord: formValue.keyWord || "",
      EmployeeID: 0,
      IsApprove: formValue.status !== -1 ? formValue.status : -1,
      Type: formValue.type || 0
    };

    console.log('[OverTimePersonComponent] Loading data with request:', request);

    this.overTimeService.getOverTimeByEmployee(request).subscribe({
      next: (res: any) => {
        console.log('[OverTimePersonComponent] API response:', res);
        if (res && res.status === 1 && res.data) {
          const data = res.data || [];
          this.overTimeList = data;
          // Add unique id property for SlickGrid
          this.dataset = data.map((item: any, index: number) => ({
            ...item,
            id: index
          }));
          console.log('[OverTimePersonComponent] Dataset loaded:', this.dataset.length, 'items');
          this.applyDistinctFilters();
        } else {
          this.overTimeList = [];
          this.dataset = [];
          console.log('[OverTimePersonComponent] No data or invalid response');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.dataset = [];
        this.isLoading = false;
      }
    });
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'StatusTBPText',
        name: 'TBP duyệt',
        field: 'StatusTBPText',
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
        id: 'EmployeeFullName',
        name: 'Họ tên',
        field: 'EmployeeFullName',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ApprovedTBP',
        name: 'Trưởng phòng',
        field: 'ApprovedTBP',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ApprovedHR',
        name: 'Nhân sự',
        field: 'ApprovedHR',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TypeName',
        name: 'Loại',
        field: 'TypeName',
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
        id: 'ProjectName',
        name: 'Dự án',
        field: 'ProjectName',
        sortable: true,
        filterable: true,
        width: 250,
        filter: { model: Filters['compoundInputText'] },
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
        id: 'Reason',
        name: 'Lý do',
        field: 'Reason',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonDeciline',
        name: 'Lý do không duyệt',
        field: 'ReasonDeciline',
        sortable: true,
        filterable: true,
        width: 250,
        filter: { model: Filters['compoundInputText'] },
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
        id: 'FileName',
        name: 'File bổ sung',
        field: 'FileName',
        sortable: true,
        filterable: true,
        width: 200,
        formatter: this.fileLinkFormatter,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grvOverTimePersonContainer',
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
      frozenColumn: this.isMobile() ? 0 : 3,
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
    try {
      return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
    } catch {
      return '';
    }
  };

  // Custom formatter for file link
  fileLinkFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    if (!value) return '';
    return `<a href="javascript:void(0)" style="color: #1677ff; text-decoration: underline;">${value}</a>`;
  };

  angularGridReady(angularGrid: AngularGridInstance) {
    console.log('[OverTimePersonComponent] Angular Grid Ready');
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

    // Apply distinct filters after grid is ready with a small delay
    setTimeout(() => {
      this.applyDistinctFilters();
    }, 100);
  }

  private updateFooterTotals(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    const totalCount = this.angularGrid.dataView.getLength();

    // Update count for EmployeeFullName column
    const countElement = this.angularGrid.slickGrid?.getFooterRowColumn('EmployeeFullName');
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

    // Update filter collections for multipleSelect columns based on actual data
    const data = this.angularGrid.dataView.getItems() as any[];

    if (!data || data.length === 0) {
      // Still update footer even if no data
      this.updateFooterTotals();
      return;
    }

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

    // Update footer totals AFTER invalidate/render to avoid being cleared
    setTimeout(() => {
      this.updateFooterTotals();
    }, 50);
  }

  handleRowSelection(e: Event, args: OnSelectedRowsChangedEventArgs) {
    // Handle row selection if needed
  }

  onCellClicked(e: Event, args: any) {
    // Handle file download when clicking on FileName column
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;

    const grid = this.angularGrid.slickGrid;
    const cell = args.cell;
    const row = args.row;
    const columns = grid.getColumns();
    const columnDef = columns[cell];

    if (columnDef && columnDef.id === 'FileName') {
      const dataContext = this.angularGrid.dataView.getItem(row);
      if (dataContext && dataContext.FileName) {
        this.downloadFile(dataContext);
      }
    }
  }

  getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((idx: number) => this.angularGrid.dataView.getItem(idx));
  }

  openAddModal() {
    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadOverTimeByEmployee();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  openEditModal() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sửa');
      return;
    }

    const selectedData = selectedRows[0];

    // Kiểm tra trạng thái duyệt
    if (this.isApproved(selectedData)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể chỉnh sửa');
      return;
    }

    const formData = this.mapTableDataToFormData(selectedData);

    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.data = formData;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadOverTimeByEmployee();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  openDeleteModal(id?: number, timeStart?: string, endTime?: string) {
    if (id !== undefined && id > 0) {
      // Xóa từ cellClick - cần tìm row data từ ID
      const allData = this.overTimeList;
      const itemToDelete = allData.find(item => (item.ID || item.Id) === id);

      if (itemToDelete) {
        // Kiểm tra trạng thái duyệt
        if (this.isApproved(itemToDelete)) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Bản ghi đã được duyệt, không thể xóa');
          return;
        }
      }

      let timeStartFormatted = '';
      let endTimeFormatted = '';

      if (timeStart) {
        try {
          const dateValue = DateTime.fromISO(timeStart).isValid ? DateTime.fromISO(timeStart).toJSDate() : new Date(timeStart);
          timeStartFormatted = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
        } catch {
          timeStartFormatted = timeStart;
        }
      }

      if (endTime) {
        try {
          const dateValue = DateTime.fromISO(endTime).isValid ? DateTime.fromISO(endTime).toJSDate() : new Date(endTime);
          endTimeFormatted = DateTime.fromJSDate(dateValue).toFormat('dd/MM/yyyy HH:mm');
        } catch {
          endTimeFormatted = endTime;
        }
      }

      const confirmText = `Bạn có thực sự muốn xóa làm thêm\n${timeStartFormatted ? `từ: ${timeStartFormatted}\n` : ''}${endTimeFormatted ? `đến: ${endTimeFormatted}` : ''}\nkhông?`;

      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: confirmText,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          this.deleteOverTime([id]);
        },
        nzCancelText: 'Hủy'
      });
      return;
    }

    // Xóa từ nút xóa (chọn nhiều row)
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
      return;
    }

    const selectedData = selectedRows;

    // Kiểm tra trạng thái duyệt cho tất cả các bản ghi đã chọn
    const approvedItems = selectedData.filter(item => this.isApproved(item));
    if (approvedItems.length > 0) {
      const fullNames = approvedItems.map(item => item['EmployeeFullName'] || item['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Có ${approvedItems.length} bản ghi đã được duyệt, không thể xóa:\n${fullNames}`
      );
      return;
    }

    const ids = selectedData.map(item => item['ID'] || item['Id']).filter((id: any) => id > 0);

    if (ids.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} bản ghi đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteOverTime(ids);
      },
      nzCancelText: 'Hủy'
    });
  }

  deleteOverTime(ids: number[]) {
    this.isLoading = true;

    // Lấy dữ liệu từ overTimeList hoặc từ selectedRows
    let dataToDelete: any[] = [];

    if (ids.length > 0) {
      // Tìm từ overTimeList
      dataToDelete = this.overTimeList.filter(item => {
        const itemId = item['ID'] || item['Id'];
        return ids.includes(itemId);
      });
    } else {
      // Lấy từ selectedRows
      const selectedRows = this.getSelectedRows();
      dataToDelete = selectedRows;
    }

    if (dataToDelete.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để xóa');
      this.isLoading = false;
      return;
    }

    // Kiểm tra lại trạng thái duyệt trước khi xóa
    const approvedItems = dataToDelete.filter(item => this.isApproved(item));
    if (approvedItems.length > 0) {
      const fullNames = approvedItems.map(item => item['EmployeeFullName'] || item['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi đã được duyệt, không thể xóa:\n${fullNames}`
      );
      this.isLoading = false;
      return;
    }

    // Chỉ gửi ID và IsDeleted
    const dto: any = {
      EmployeeOvertimes: dataToDelete.map(item => ({
        ID: item['ID'] || item['Id'] || 0,
        IsDeleted: true
      })),
      employeeOvertimeFile: null
    };

    this.overTimeService.saveDataEmployee(dto).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, `Xóa ${dataToDelete.length} bản ghi thành công`);
        this.loadOverTimeByEmployee();
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Xóa bản ghi thất bại: ' + error.message);
        this.isLoading = false;
        this.loadOverTimeByEmployee();
      }
    });
  }

  openCopyModal() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sao chép');
      return;
    }
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sao chép');
      return;
    }

    const selectedData = selectedRows[0];
    // Map dữ liệu từ table sang format của form
    const formData = this.mapTableDataToFormData(selectedData);

    // Tạo bản copy với ID = 0 và ngày mới
    const copyData = {
      ...formData,
      ID: 0,
      DateRegister: new Date()
    };

    const modalRef = this.modalService.open(OverTimePersonFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = copyData;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadOverTimeByEmployee();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // Map dữ liệu từ table sang format của form
  private mapTableDataToFormData(tableData: any): any {
    return {
      ID: tableData.ID !== null && tableData.ID !== undefined ? tableData.ID : (tableData.Id !== null && tableData.Id !== undefined ? tableData.Id : 0),
      EmployeeID: tableData.EmployeeID || tableData.EmployeeId || 0,
      DateRegister: tableData.DateRegister || null,
      ApprovedID: tableData.ApprovedID || tableData.ApprovedId || null,
      TimeStart: tableData.TimeStart || null,
      EndTime: tableData.EndTime || null,
      Location: tableData.Location || tableData.LocationID || 0,
      TypeID: tableData.TypeID || tableData.Type || null,
      ProjectID: tableData.ProjectID || tableData.ProjectId || 0,
      Overnight: tableData.Overnight || false,
      Reason: tableData.Reason || '',
      ReasonHREdit: tableData.ReasonHREdit || '',
      IsProblem: tableData.IsProblem || false,
      FileName: tableData.FileName || ''
    };
  }

  async exportToExcel() {
    this.exportingExcel = true;

    try {
      const allData = this.overTimeList;

      if (allData.length === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const exportData = allData.map((item: any, idx: number) => {
        const formatDate = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
          }
        };

        const formatDateTime = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
          }
        };

        return {
          'STT': idx + 1,
          'TBP duyệt': item.StatusTBPText || (item.IsApproved || item.IsApprovedTBP ? 'Đã duyệt' : 'Chưa duyệt'),
          'HR duyệt': item.StatusHRText || (item.IsApprovedHR ? 'Đã duyệt' : 'Chưa duyệt'),
          'Bổ sung': item.IsProblem ? 'Có' : 'Không',
          'Họ tên': item.EmployeeFullName || item.FullName || '',
          'Trưởng phòng': item.ApprovedTBP || '',
          'Nhân sự': item.ApprovedHR || '',
          'Loại': item.TypeName || item.Type || '',
          'Ngày': formatDate(item.DateRegister),
          'Từ': formatDateTime(item.TimeStart),
          'Đến': formatDateTime(item.EndTime),
          'Dự án': item.ProjectName || '',
          'Số giờ': item.TimeReality || '',
          'Địa điểm': item.LocationText || item.Location || '',
          'Lý do': item.Reason || '',
          'Lý do không duyệt': item.ReasonDeciline || '',
          'Ăn tối': item.Overnight ? 'Có' : 'Không',
          'File bổ sung': item.FileName || ''
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DangKyLamThem');

      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 8, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 15 },
        { header: 'HR duyệt', key: 'HR duyệt', width: 15 },
        { header: 'Bổ sung', key: 'Bổ sung', width: 12 },
        { header: 'Họ tên', key: 'Họ tên', width: 25 },
        { header: 'Trưởng phòng', key: 'Trưởng phòng', width: 20 },
        { header: 'Nhân sự', key: 'Nhân sự', width: 20 },
        { header: 'Loại', key: 'Loại', width: 20 },
        { header: 'Ngày', key: 'Ngày', width: 15 },
        { header: 'Từ', key: 'Từ', width: 20 },
        { header: 'Đến', key: 'Đến', width: 20 },
        { header: 'Dự án', key: 'Dự án', width: 25 },
        { header: 'Số giờ', key: 'Số giờ', width: 12 },
        { header: 'Địa điểm', key: 'Địa điểm', width: 20 },
        { header: 'Lý do', key: 'Lý do', width: 30 },
        { header: 'Lý do không duyệt', key: 'Lý do không duyệt', width: 30 },
        { header: 'Ăn tối', key: 'Ăn tối', width: 12 },
        { header: 'File bổ sung', key: 'File bổ sung', width: 25 },
      ];

      exportData.forEach((row: any) => worksheet.addRow(row));

      worksheet.eachRow((row: ExcelJS.Row) => {
        row.eachCell((cell: ExcelJS.Cell) => {
          if (!cell.font) {
            cell.font = { name: 'Times New Roman', size: 10 };
          } else {
            cell.font = { ...cell.font, name: 'Times New Roman', size: 10 };
          }
        });
      });

      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }
        };
      });
      worksheet.getRow(1).height = 30;

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.getCell('STT').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          row.getCell('STT').font = { name: 'Times New Roman', size: 10 };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const startDate = this.searchForm.get('startDate')?.value;
      const endDate = this.searchForm.get('endDate')?.value;
      const startDateStr = startDate ? DateTime.fromJSDate(new Date(startDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = endDate ? DateTime.fromJSDate(new Date(endDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `DangKyLamThem_${startDateStr}_${endDateStr}.xlsx`);

    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }

  private formatApprovalBadge(status: number): string {
    const numStatus = status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chờ duyệt</span>';
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
    let statusTBP = item['IsApproved'] || item['IsApprovedTBP'];
    if (item['StatusTBP'] !== null && item['StatusTBP'] !== undefined) {
      statusTBP = item['StatusTBP'];
    }
    const numStatusTBP = statusTBP === null || statusTBP === undefined ? 0 : (statusTBP === true ? 1 : (statusTBP === false ? 0 : Number(statusTBP)));

    // Kiểm tra trạng thái duyệt HR
    let statusHR = item['IsApprovedHR'];
    if (item['StatusHR'] !== null && item['StatusHR'] !== undefined) {
      statusHR = item['StatusHR'];
    }
    const numStatusHR = statusHR === null || statusHR === undefined ? 0 : (statusHR === true ? 1 : (statusHR === false ? 0 : Number(statusHR)));

    // Nếu TBP hoặc HR đã duyệt (status = 1) thì không cho sửa/xóa
    return numStatusTBP === 1 || numStatusHR === 1;
  }

  downloadFile(rowData: any) {
    const id = rowData.ID || rowData.Id || 0;
    if (!id || id <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID bản ghi');
      return;
    }

    this.isLoading = true;
    this.overTimeService.getEmployeeOverTimeByID(id).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          const overTimeFile = data.overTimeFile || null;

          if (!overTimeFile) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có file đính kèm');
            return;
          }

          let serverPath = overTimeFile.ServerPath || '';
          const fileName = overTimeFile.FileName || '';

          if (!fileName) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có tên file để tải xuống');
            return;
          }

          // Đảm bảo ServerPath không chứa tên file ở cuối
          if (serverPath && fileName) {
            const normalizedServerPath = serverPath.replace(/[\\/]+$/, '');
            const normalizedFileName = fileName.replace(/^[\\/]+/, '');
            if (normalizedServerPath.endsWith(normalizedFileName)) {
              serverPath = normalizedServerPath.substring(0, normalizedServerPath.length - normalizedFileName.length);
              serverPath = serverPath.replace(/[\\/]+$/, '');
            }
          }

          // Ghép serverPath và fileName để tạo URL download
          const downloadUrl = `${environment.host}api/home/download-by-key?key=LamThem&subPath=${encodeURIComponent(serverPath)}&fileName=${encodeURIComponent(fileName)}`;

          // Tạo link download và tự động click để tải file
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lấy thông tin file');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file: ' + errorMessage);
      }
    });
  }
}
