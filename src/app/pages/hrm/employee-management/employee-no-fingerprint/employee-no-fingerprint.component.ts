import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

// NgBootstrap Modal
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

// Services and Components
import { EmployeeNofingerprintService } from './employee-no-fingerprint-service/employee-no-fingerprint.service';
import { ENFDetailComponent } from './ENF-detail/ENF-detail.component';
import { AuthService } from '../../../../auth/auth.service';
import { PermissionService } from '../../../../services/permission.service';
import { Menubar } from 'primeng/menubar';

// XLSX for Excel export
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

// SlickGrid
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
  selector: 'app-enf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzGridModule,
    NzModalModule,
    NgbModalModule, //
    HasPermissionDirective,
    NzDropDownModule,
    Menubar,
    AngularSlickgridModule
  ],
  templateUrl: './employee-no-fingerprint.component.html',
  styleUrls: ['./employee-no-fingerprint.component.css'],
})
export class EmployeeNoFingerprintComponent
  implements OnInit, AfterViewInit, OnDestroy {
  // #region ViewChild and Properties
  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Loading states
  isLoadTable: boolean = false;

  // UI states
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

  // Search filters
  selectedDepartmentFilter: number | null = null;
  selectedTBPStatusFilter: number | null = null;
  searchValue: string = '';
  // dùng string 'YYYY-MM-DD' để bind tốt với <input type="date">
  dateStart: string = DateTime.local().startOf('month').toISODate()!;
  dateEnd: string = DateTime.local().endOf('month').toISODate()!;

  // Convert Date/string -> ISO khi build params
  private toISODate(d: Date | string | null | undefined): string {
    if (!d) return '';
    if (typeof d === 'string') {
      return d; // đã ở dạng "YYYY-MM-DD"
    }
    return DateTime.fromJSDate(d).toISODate()!; // "YYYY-MM-DD"
  }
  // Data
  departmentList: any[] = [];

  // Selection tracking
  selectedENF: any | null = null;
  selectedRows: any[] = [];
  lastSelectedENF: any | null = null;

  // Current user info
  currentUser: any = null;
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  isAdmin: boolean = false;
  // #endregion

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private enfService: EmployeeNofingerprintService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) { }

  // #region Lifecycle Hooks
  ngOnInit(): void {
    this.initMenuBar();
    this.loadDepartments();
    this.getCurrentUser();
    this.initGrid();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.addenf()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.editenf()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteenf()
      },
      {
        visible: this.permissionService.hasPermission("N1"),
        label: 'TBP xác nhận',
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        command: () => this.approvedTBP()
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
            command: () => this.approvedHR()
          },
          {
            visible: this.permissionService.hasPermission("N1,N2"),
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.cancelApprovedHR()
          }
        ]
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel()
      }
    ];
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.currentEmployeeId = data.EmployeeID || 0;
        this.currentDepartmentId = data?.DepartmentID || 0;
        this.currentDepartmentName = data?.DepartmentName || '';
        this.isAdmin =
          data?.IsAdmin === true || data?.ISADMIN === true || false;
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchenf();
    }, 100);
  }

  ngOnDestroy(): void {
  }
  // #endregion

  // #region Data Loading
  private loadDepartments(): void {
    this.enfService.getDepartments().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.departmentList = response.data || [];
          console.log('Departments loaded:', this.departmentList.length);
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Không thể tải danh sách phòng ban'
          );
          this.departmentList = [];
        }
      },
      error: (error: any) => {
        console.error('Load departments error:', error);
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Không thể tải danh sách phòng ban .';
        this.notification.error(
          'Lỗi',
          errorMessage
        );
        this.departmentList = [];
      },
    });
  }
  // #endregion

  // #region Table Setup
  private initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'StatusText',
        name: 'TBP Duyệt',
        field: 'StatusText',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: this.approvalBadgeFormatter,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'StatusHRText',
        name: 'HR Duyệt',
        field: 'StatusHRText',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: this.approvalBadgeFormatter,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
        cssClass: 'text-center',
      },
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'FullName',
        name: 'Tên nhân viên',
        field: 'FullName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ApprovedName',
        name: 'Người duyệt',
        field: 'ApprovedName',
        width: 140,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DayWork',
        name: 'Ngày',
        field: 'DayWork',
        width: 110,
        sortable: true,
        filterable: true,
        formatter: (row, cell, value) => this.formatDateOnly(value),
        type: 'date',
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'TypeText',
        name: 'Loại',
        field: 'TypeText',
        width: 140,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ReasonHREdit',
        name: 'Lý do sửa',
        field: 'ReasonHREdit',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ReasonDeciline',
        name: 'Lý do không đồng ý',
        field: 'ReasonDeciline',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 420,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grvENFContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
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
      forceFitColumns: true,
    };
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs): void {
    if (args && args.rows) {
      this.selectedRows = args.rows.map((idx: number) => this.angularGrid.dataView.getItem(idx));
      if (this.selectedRows.length > 0) {
        this.selectedENF = this.selectedRows[this.selectedRows.length - 1];
        this.lastSelectedENF = this.selectedENF;
      } else {
        this.selectedENF = null;
        this.lastSelectedENF = null;
      }
    }
  }

  onCellClicked(e: any, args: OnClickEventArgs): void {
    const item = this.angularGrid.dataView.getItem(args.row);
    this.selectedENF = item;
    this.lastSelectedENF = item;
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

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Update footer row count and sum when data changes
    angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    // Also update when filter changes
    angularGrid.dataView.onRowsChanged.subscribe(() => {
      this.updateFooterTotals();
    });

    // Update footer after grid render
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

    // Update count for Code column
    const countElement = this.angularGrid.slickGrid.getFooterRowColumn('Code');
    if (countElement) {
      countElement.innerHTML = `<div style="font-weight: bold; text-align: center;">${totalCount}</div>`;
    }
  }

  applyDistinctFilters(data?: any[]): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid || !this.angularGrid.dataView) return;

    this.updateFooterTotals();

    const gridData = data || this.angularGrid.dataView.getItems() as any[];
    if (!gridData || gridData.length === 0) return;

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

    // Update all columns references
    const gridColumns = this.angularGrid.slickGrid.getColumns();
    if (gridColumns) {
      gridColumns.forEach((column: any) => {
        // Skip null columns (e.g., checkbox selector)
        if (!column) return;
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(gridData, field);
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        // Skip null column definitions
        if (!colDef) return;
        if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = getUniqueValues(gridData, field);
        }
      });
    }

    // Refresh columns in the grid
    const updatedColumns = this.angularGrid.slickGrid.getColumns();
    this.angularGrid.slickGrid.setColumns(updatedColumns);
    this.angularGrid.slickGrid.invalidate();
    this.angularGrid.slickGrid.render();
  }
  // #endregion

  // #region Search and Filter
  searchenf(): void {
    this.isLoadTable = true;
    const requestParams = {
      Page: 1,
      Size: 100000, // Load all data for local filtering
      DateStart: this.toISODate(this.dateStart),
      DateEnd: this.toISODate(this.dateEnd),
      KeyWord: this.searchValue?.trim() || '',
      DepartmentID: this.selectedDepartmentFilter || 0,
      EmployeeID: 0,
      IDApprovedTP: 0,
      Status:
        this.selectedTBPStatusFilter === null ||
          this.selectedTBPStatusFilter === undefined
          ? -1
          : this.selectedTBPStatusFilter,
    };

    this.enfService.getENFListPost(requestParams).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data.data || [];
          this.dataset = data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
          }));
          if (this.angularGrid) {
            this.applyDistinctFilters(this.dataset);
          }
        }
        this.isLoadTable = false;
      },
      error: (error: any) => {
        console.error('ENF Load Error:', error);
        this.isLoadTable = false;
        this.message.error('Lỗi khi tải dữ liệu ENF');
      },
    });
  }

  onDepartmentFilterChange(): void {
    this.searchenf();
  }

  onTBPStatusFilterChange(): void {
    this.searchenf();
  }

  onSearch(): void {
    this.searchenf();
  }

  resetSearch(): void {
    this.selectedDepartmentFilter = null;
    this.selectedTBPStatusFilter = -1;
    this.searchValue = '';
    this.dateStart = DateTime.local().startOf('month').toISODate()!;
    this.dateEnd = DateTime.local().endOf('month').toISODate()!;
    this.searchenf();
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }
  // #endregion

  // #region Selection Management
  // selectAllRows(): void {
  //   if (!this.tb_ENF) return;
  //   // Sử dụng Tabulator API để chọn tất cả rows trên trang hiện tại
  //   const rows = this.tb_ENF.getRows();
  //   if (rows.length > 0) {
  //     this.tb_ENF.selectRow(rows);
  //     const rowCount = rows.length;
  //     this.message.info(`Đã chọn ${rowCount} bản ghi trên trang hiện tại`);
  //   }
  // }

  // deselectAllRows(): void {
  //   if (!this.tb_ENF) return;
  //   // Sử dụng Tabulator API để bỏ chọn tất cả rows
  //   const selectedRows = this.tb_ENF.getSelectedRows();
  //   if (selectedRows.length > 0) {
  //     this.tb_ENF.deselectRow(selectedRows);
  //   }
  // }

  getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((idx: number) => this.angularGrid.dataView.getItem(idx));
  }

  getSelectedRowsCount(): number {
    return this.getSelectedRows().length;
  }

  private getCurrentSelectedenf(): any | null {
    if (this.lastSelectedENF) return this.lastSelectedENF;
    if (this.selectedENF) return this.selectedENF;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }

  private clearSelection(): void {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      this.angularGrid.slickGrid.setSelectedRows([]);
    }
  }
  // #endregion

  // #region CRUD Operations
  addenf(): void {
    const modalRef = this.ngbModal.open(ENFDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.enfData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.userRole = 'employee';
    modalRef.componentInstance.currentEmployeeId = this.currentEmployeeId;

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchenf();
        this.notification.success('Thông báo', 'Lưu dữ liệu thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  editenf(): void {
    const enfToEdit = this.getCurrentSelectedenf();

    if (!enfToEdit) {
      this.notification.error('Thông báo', 'Vui lòng chọn bản ghi cần sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    // Kiểm tra trạng thái duyệt
    if (this.isApproved(enfToEdit)) {
      this.notification.warning('Thông báo', 'Bản ghi đã được duyệt, không thể chỉnh sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.ngbModal.open(ENFDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.enfData = enfToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchenf();
        this.notification.success('Thông báo', 'Lưu dữ liệu thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  deleteenf(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn bản ghi cần xóa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    // Kiểm tra trạng thái duyệt
    const approvedRows = selectedRows.filter((row) => this.isApproved(row));
    if (approvedRows.length > 0) {
      const fullNames = approvedRows.map(row => row['FullName'] || 'N/A').join(', ');
      this.notification.warning(
        'Thông báo',
        `Bản ghi đã được duyệt, không thể xóa:\n${fullNames}`
      );
      return;
    }

    const count = selectedRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa bản ghi của <strong>"${selectedRows[0].FullName}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi  đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteenf(selectedRows),
    });
  }

  private confirmDeleteenf(selectedRows: any[] = []): void {
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Các bản ghi đã duyệt, không thể xóa!'
      );
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const deleteNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.handleDeleteComplete(successCount, failedCount, totalCount);
        return;
      }

      const item = selectedRows[index];
      const deleteData = {
        ...item,
        IsDeleted: true,
        UpdatedBy: this.enfService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.enfService.saveData(deleteData).subscribe({
        next: (res) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          deleteNext(index + 1);
        },
        error: (error: any) => {
          failedCount++;
          deleteNext(index + 1);
        },
      });
    };

    deleteNext(0);
  }

  private handleDeleteComplete(
    successCount: number,
    failedCount: number,
    totalCount: number
  ): void {
    if (successCount > 0) {
      this.notification.success(
        'Thông báo',
        `Đã xóa ${successCount}/${totalCount} bản ghi  thành công!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
      this.searchenf();
      this.clearSelection();
    }

    if (failedCount > 0) {
      this.notification.warning(
        'Thông báo',
        `${failedCount} bản ghi xóa thất bại!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
    }
  }
  // #endregion

  approvedTBP(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn nhân viên để duyệt!');
      return;
    }

    const employeeName = selectedRows.length > 0 ? selectedRows[0]?.FullName : '';

    let confirmMessage = '';
    if (rowCount === 1) {
      confirmMessage = `Bạn có chắc muốn duyệt cho nhân viên ${employeeName} hay không!`;
    } else {
      confirmMessage = `Bạn có chắc muốn duyệt cho những nhân viên này hay không!`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(selectedRows),
    });
  }

  private confirmApproveTBP(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success('Thông báo', `Duyệt thành công!`);
        }
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];
      const departmentId = item.DepartmentID || 0;
      const employeeName = item.FullName || '';
      const approvedTP = item.ApprovedTP || 0;

      // Nếu là admin, bỏ qua tất cả các check phòng ban và người duyệt
      // Nếu không phải admin, kiểm tra quyền
      if (!this.isAdmin) {
        // Bỏ qua nếu departmentId = 0 (chỉ check khi không phải admin)
        if (departmentId === 0) {
          approveNext(index + 1);
          return;
        }

        // Kiểm tra phòng ban
        if (
          departmentId !== this.currentDepartmentId &&
          this.currentDepartmentId !== 1
        ) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên ${employeeName} không thuộc phòng ${this.currentDepartmentName.toUpperCase()}.\nVui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
        // Kiểm tra người duyệt
        if (approvedTP !== this.currentEmployeeId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không thể duyệt cho nhân viên thuộc nhóm khác.\nVui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
      }

      const id = item.ID || 0;
      // Bỏ qua nếu ID = 0
      if (id === 0) {
        approveNext(index + 1);
        return;
      }

      // Kiểm tra đã duyệt chưa
      if (item.StatusText === 'Đã duyệt' || item.IsApprovedTP) {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt TBP
      const approveData = { ...item, Status: 1, IsApprovedTP: true };
      this.enfService.saveData(approveData).subscribe({
        next: (res: any) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          approveNext(index + 1);
        },
        error: (error: any) => {
          failedCount++;
          approveNext(index + 1);
        },
      });
    };

    approveNext(0);
  }

  approvedHR(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn nhân viên để duyệt!');
      return;
    }

    // Lọc ra những bản ghi hợp lệ (đã được TBP duyệt) và không hợp lệ
    const validRows = selectedRows.filter((x) => x.StatusText === 'Đã duyệt');
    const invalidRows = selectedRows.filter((x) => x.StatusText !== 'Đã duyệt');

    // Cảnh báo về những bản ghi không hợp lệ nhưng vẫn tiếp tục duyệt những bản ghi hợp lệ
    if (invalidRows.length > 0) {
      this.notification.warning(
        'Thông báo',
        `Có ${invalidRows.length} bản ghi chưa được TBP duyệt sẽ được bỏ qua. Chỉ duyệt ${validRows.length} bản ghi hợp lệ.`
      );
    }

    // Nếu không có bản ghi hợp lệ nào thì dừng lại
    if (validRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Không có bản ghi nào hợp lệ để duyệt HR! Tất cả bản ghi đã chọn đều chưa được TBP duyệt.'
      );
      return;
    }

    const employeeName = validRows.length > 0 ? validRows[0]?.FullName : '';

    let confirmMessage = '';
    if (validRows.length === 1) {
      confirmMessage = `Bạn có chắc muốn duyệt nhân viên ${employeeName}?`;
    } else {
      confirmMessage = `Bạn có chắc muốn duyệt ${validRows.length} nhân viên hợp lệ không?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt HR',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHR(validRows, true),
    });
  }

  private confirmApproveHR(
    selectedRows: any[],
    isApproved: boolean = true
  ): void {
    let successCount = 0;
    let failedCount = 0;
    const approved = isApproved ? 'duyệt' : 'hủy duyệt';

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            'Thông báo',
            `${approved} ${successCount}/${selectedRows.length} bản ghi thành công!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi ${approved} thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];
      const departmentId = item.DepartmentID || 0;
      const approvedTP = item.ApprovedTP || 0;
      const employeeName = item.FullName || '';

      // Bỏ qua nếu departmentId = 0 và approvedTP = 0
      if (departmentId === 0 && approvedTP === 0) {
        approveNext(index + 1);
        return;
      }

      // HR duyệt không cần check phòng ban, chỉ cần check TBP đã duyệt

      const id = item.ID || 0;
      if (id === 0) {
        approveNext(index + 1);
        return;
      }

      // HR chỉ duyệt nếu TBP đã duyệt
      if (isApproved && item.StatusText !== 'Đã duyệt') {
        approveNext(index + 1);
        return;
      }

      // Khi hủy duyệt HR: chỉ hủy được nếu HR đã duyệt
      // Nếu HR chưa duyệt thì không có gì để hủy
      if (!isApproved) {
        // Kiểm tra HR đã duyệt chưa (có thể check bằng StatusHRText hoặc IsApprovedHR)
        const isHRApproved =
          item.StatusHRText === 'Đã duyệt' ||
          item.IsApprovedHR === true ||
          item.StatusHR === 1;
        if (!isHRApproved) {
          // HR chưa duyệt thì không thể hủy duyệt
          console.log('HR chưa duyệt, không thể hủy:', item);
          approveNext(index + 1);
          return;
        }
        console.log('Hủy duyệt HR cho item:', item, 'approveData sẽ là:', {
          ...item,
          StatusHR: 2,
          IsApprovedHR: false,
        });
      }

      // Gọi API duyệt/hủy duyệt HR
      const approveData = {
        ...item,
        StatusHR: isApproved ? 1 : 2, // 1: Đã duyệt, 2: Không duyệt (hủy duyệt)
        IsApprovedHR: isApproved,
      };
      this.enfService.saveData(approveData).subscribe({
        next: (res: any) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          approveNext(index + 1);
        },
        error: (error: any) => {
          failedCount++;
          approveNext(index + 1);
        },
      });
    };

    approveNext(0);
  }

  cancelApprovedHR(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần hủy duyệt HR!'
      );
      return;
    }
    const confirmMsg =
      selectedRows.length === 1
        ? `Bạn có chắc muốn hủy duyệt HR cho nhân viên ${selectedRows[0].FullName}?`
        : `Bạn có chắc muốn hủy duyệt HR cho ${selectedRows.length} nhân viên đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt HR',
      nzContent: confirmMsg,
      nzOkText: 'Hủy duyệt HR',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmApproveHR(selectedRows, false),
    });
  }

  cancelApproveTBP(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần hủy duyệt TBP!'
      );
      return;
    }
    const confirmMsg =
      selectedRows.length === 1
        ? `Bạn có chắc muốn hủy duyệt TBP cho nhân viên ${selectedRows[0].FullName}?`
        : `Bạn có chắc muốn hủy duyệt TBP cho ${selectedRows.length} nhân viên đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: confirmMsg,
      nzOkText: 'Hủy duyệt TBP',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApproveTBP(selectedRows),
    });
  }

  private confirmCancelApproveTBP(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `TBP đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // Nếu không phải admin, kiểm tra phòng ban và người duyệt
      if (!this.isAdmin) {
        if (
          item.DepartmentID !== this.currentDepartmentId &&
          this.currentDepartmentId !== 1
        ) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên ${item.FullName
            } không thuộc phòng ${this.currentDepartmentName.toUpperCase()}. Vui lòng kiểm tra lại!`
          );
          cancelNext(index + 1);
          return;
        }
        if (item.ApprovedTP !== this.currentEmployeeId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không thể hủy duyệt cho nhân viên thuộc nhóm khác. Vui lòng kiểm tra lại!`
          );
          cancelNext(index + 1);
          return;
        }
      }

      // Nếu chưa duyệt TBP thì bỏ qua
      if (!item.IsApprovedTP) {
        cancelNext(index + 1);
        return;
      }
      // Nếu HR đã duyệt thì không cho hủy TBP
      if (item.IsApprovedHR) {
        this.notification.warning(
          'Thông báo',
          `Nhân viên ${item.FullName} đã được HR duyệt. Vui lòng hủy duyệt HR trước!`
        );
        cancelNext(index + 1);
        return;
      }

      // Hủy duyệt TBP - set Status = 2
      const cancelData = { ...item, IsApprovedTP: false, Status: 2 };
      this.enfService.saveData(cancelData).subscribe({
        next: (res: any) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          cancelNext(index + 1);
        },
        error: (error: any) => {
          failedCount++;
          cancelNext(index + 1);
        },
      });
    };
    cancelNext(0);
  }
  // #endregion

  // #region Export Excel
  exportExcel(): void {
    const allData = this.dataset;

    if (allData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất!');
      return;
    }

    try {
      this.message.loading('Đang xuất file Excel...', { nzDuration: 2000 });

      const exportData = this.prepareExportData(allData);
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = this.getExcelColumnWidths();

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách ENF');

      const filename = this.generateExcelFilename();
      XLSX.writeFile(workbook, filename);

      setTimeout(() => {
        this.notification.success(
          'Thông báo',
          `Đã xuất ${allData.length} bản ghi ra file Excel thành công!`,
          { nzStyle: { fontSize: '0.75rem' } }
        );
      }, 2000);
    } catch (error: any) {
      console.error('Export Excel error:', error);
      const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi không xác định';
      this.notification.error(
        'Thông báo',
        'Lỗi khi xuất file Excel: ' + errorMessage
      );
    }
  }

  private prepareExportData(allData: any[]): any[] {
    return allData.map((item: any, index: number) => ({
      STT: index + 1,
      'Mã nhân viên': item.EmployeeCode || item.Code || '',
      'Tên nhân viên': item.EmployeeName || item.FullName || '',
      'Phòng ban': item.DepartmentName || '',
      'Ngày tạo': this.formatDateForExcel(item.CreatedDate),
      'Ngày làm việc': this.formatDateOnlyForExcel(item.DayWork),
      Loại: item.TypeText || '',
      'Ghi chú': item.Note || '',
      'Trạng thái TBP': item.StatusText || '',
      'Trạng thái HR': item.StatusHRText || '',
      'Người duyệt TBP': item.ApprovedName || '',
      'Lý do sửa đổi': item.ReasonHREdit || '',
      'Lý do từ chối': item.ReasonDeciline || '',
    }));
  }

  private getExcelColumnWidths(): any[] {
    return [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
    ];
  }

  private generateExcelFilename(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `DanhSachDangKyENF_T${currentMonth}_${currentYear}.xlsx`;
  }
  // #endregion

  private formatDateForExcel(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      // Format: dd/MM/yyyy HH:mm cho Excel
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  }

  // Thêm method riêng cho format ngày ENF (chỉ ngày, không giờ)
  private formatDateOnly(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);

      // Format: dd/MM/yyyy (chỉ ngày)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  private formatDateOnlyForExcel(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      // Format: dd/MM/yyyy cho Excel
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  }
  // Helper method để kiểm tra bản ghi đã được duyệt chưa
  private isApproved(item: any): boolean {
    // Kiểm tra trạng thái duyệt TBP
    const statusTBP = item.StatusText;
    const isTBPApproved =
      statusTBP === 'Đã duyệt' ||
      item.IsApprovedTP === true ||
      item.Status === 1;

    // Kiểm tra trạng thái duyệt HR
    const statusHR = item.StatusHRText;
    const isHRApproved =
      statusHR === 'Đã duyệt' ||
      item.IsApprovedHR === true ||
      item.StatusHR === 1;

    // Kiểm tra quyền đặc biệt (Admin, N1, N2)
    const hasPrivilege =
      this.isAdmin ||
      this.permissionService.hasPermission('N1') ||
      this.permissionService.hasPermission('N2');

    // Nếu có quyền đặc biệt, bỏ qua check TBP (trừ khi HR đã duyệt)
    if (hasPrivilege) {
      return isHRApproved;
    }

    // Nếu TBP hoặc HR đã duyệt thì không cho sửa
    return isTBPApproved || isHRApproved;
  }

  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus =
      status === null || status === undefined ? 0 : Number(status);

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
