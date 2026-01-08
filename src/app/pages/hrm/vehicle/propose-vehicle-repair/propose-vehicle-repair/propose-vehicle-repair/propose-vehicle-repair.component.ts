import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { VehicleRepairService } from '../../../vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { VehicleManagementService } from '../../../vehicle-management/vehicle-management.service';
import { ProposeVehicleRepairService } from '../propose-vehicle-repair-service/propose-vehicle-repair.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from '../../../../../../auth/auth.service';
import { VehicleRepairHistoryService } from '../../vehicle-repair-history/vehicle-repair-history-service/vehicle-repair-history-service.service';
import { ProposeVehicleRepairFormComponent } from '../propose-vehicle-repair-form/propose-vehicle-repair-form.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../../services/permission.service';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';

@Component({
  standalone: true,
  imports: [
    NzUploadModule,
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule,
    NzModalModule,
    Menubar,
    AngularSlickgridModule,
    NzFormModule,
    NzSpinModule,
  ],
  selector: 'app-propose-vehicle-repair',
  templateUrl: './propose-vehicle-repair.component.html',
  styleUrl: './propose-vehicle-repair.component.css',
})
export class ProposeVehicleRepairComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private proposeVehicleRepairService: ProposeVehicleRepairService,
    private nzModal: NzModalService,
    private vehicleManagementService: VehicleManagementService,
    private authService: AuthService,
    private vehicleRepairHistoryService: VehicleRepairHistoryService,
    private permissionService: PermissionService,
  ) { }

  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridDetail!: AngularGridInstance;
  gridData: any;
  gridDetailData: any;

  // Column definitions
  columnDefinitions: Column[] = [];
  columnDefinitionsDetail: Column[] = [];

  // Grid options
  gridOptions: GridOption = {};
  gridOptionsDetail: GridOption = {};

  // Datasets
  dataset: any[] = [];
  datasetDetail: any[] = [];

  selectedDetailRow: any = null;
  dataInput: any = {};
  proposeVehicleRepairDetailData: any[] = [];
  Size: number = 100000;
  Page: number = 1;
  DateStart: Date = new Date();
  DateEnd: Date = new Date();
  EmployeeID: number = 0;
  TypeID: number = 0;
  FilterText: string = '';
  VehicleID: number = 0;
  selectedRow: any = null;
  repairTypes: any[] = [];
  employeeList: any[] = [];
  vehicleList: any[] = [];
  modalData: any = [];
  currentUser: any = [];
  private ngbModal = inject(NgbModal);
  employeeGroups: Array<{ department: string; items: any[] }> = [];
  isLoading: boolean = false;
  menuBars: any[] = [];

  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

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

  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getLastDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
  }

  formatDateView(date: Date): string {
    return DateTime.fromJSDate(date).toFormat('dd/MM/yy');
  }

  formatCurrency(value: number | null): string {
    if (value == null) return '';
    return value.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  }

  onEmployeeChange(value: any) {
    this.EmployeeID = value ?? 0;
    this.loadData();
  }

  onVehicleChange() {
    this.loadData();
  }

  onDateRangeChange() {
    this.loadData();
  }

  onKeywordChange(value: string): void {
    this.FilterText = value;
  }

  private toIsoStart(d: Date) {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t.toISOString();
  }

  private toIsoEnd(d: Date) {
    const t = new Date(d);
    t.setHours(23, 59, 59, 999);
    return t.toISOString();
  }

  ngOnInit(): void {
    this.DateStart = this.getFirstDayOfMonth();
    this.DateEnd = this.getLastDayOfMonth();
    this.initMenuBar();
    this.initGrid();
    this.initGridDetail();
  }

  ngAfterViewInit(): void {
    this.loadData();
    this.getEmployee();
    this.getVehicle();
    this.getCurrentUser();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.addProposeVehicleRepair(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.editProposeVehicleRepair(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteSelectedProposals(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcelProduct(),
      },
      {
        label: 'Phê duyệt',
        icon: 'fa-solid fa-calendar-check fa-lg text-primary',
        items: [
          {
            label: 'Phê duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.approveSelectedDetail(),
          },
          {
            label: 'Hủy phê duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.unapproveSelectedDetail(),
          },
        ],
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => this.loadData(),
      },
    ];
  }

  initGrid() {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    this.columnDefinitions = [
      { id: 'STT', name: 'STT', field: 'STT', type: 'number', width: 60, sortable: true, cssClass: 'text-center' },
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', width: 60, hidden: true },
      {
        id: 'VehicleName',
        name: 'Tên xe',
        field: 'VehicleName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'LicensePlate',
        name: 'Biển số xe',
        field: 'LicensePlate',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Reason',
        name: 'Lý do sửa chữa',
        field: 'Reason',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Reason}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
      {
        id: 'RepairTypeName',
        name: 'Loại sửa chữa',
        field: 'RepairTypeName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'DriverName',
        name: 'Tên lái xe',
        field: 'DriverName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'EmployeeRepairName',
        name: 'Người sửa chữa',
        field: 'EmployeeRepairName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'TimeStartRepair',
        name: 'Thời gian bắt đầu',
        field: 'TimeStartRepair',
        width: 160,
        sortable: true,
        cssClass: 'text-center',
        formatter: formatDate,
      },
      {
        id: 'TimeEndRepair',
        name: 'Thời gian kết thúc',
        field: 'TimeEndRepair',
        width: 160,
        sortable: true,
        cssClass: 'text-center',
        formatter: formatDate,
      },
      {
        id: 'KmPreviousPeriod',
        name: 'Km kỳ trước',
        field: 'KmPreviousPeriod',
        width: 120,
        sortable: true,
        cssClass: 'text-right',
        type: 'number',
      },
      {
        id: 'KmCurrentPeriod',
        name: 'Km kỳ này',
        field: 'KmCurrentPeriod',
        width: 120,
        sortable: true,
        cssClass: 'text-right',
        type: 'number',
      },
      {
        id: 'KMDifference',
        name: 'Km chênh lệch',
        field: 'KmDifference',
        width: 120,
        sortable: true,
        cssClass: 'text-right',
        type: 'number',
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-propose-vehicle',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      multiSelect: true,
      rowHeight: 35,
      headerRowHeight: 40,
    };
  }

  initGridDetail() {
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const v = Number(value);
      if (v === 1) {
        return `<input type="checkbox" checked onclick="return false;" />`;
      } else if (v === 2) {
        return `<span style="color: #dc3545; font-weight: bold; font-size: 14px;">X</span>`;
      } else {
        return `<input type="checkbox" onclick="return false;" />`;
      }
    };

    const moneyFormatter = (row: number, cell: number, value: any) => {
      if (value == null) return '';
      return Number(value).toLocaleString('vi-VN') + 'đ';
    };

    this.columnDefinitionsDetail = [
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true, cssClass: 'text-center' },
      {
        id: 'IsApprove',
        name: 'Phê duyệt',
        field: 'IsApprove',
        width: 100,
        sortable: true,
        cssClass: 'text-center',
        formatter: checkboxFormatter,
      },
      { id: 'ApproveName', name: 'Người duyệt', field: 'ApproveName', width: 120, sortable: true },
      { id: 'GaraName', name: 'Tên NCC', field: 'GaraName', width: 200, sortable: true },
      { id: 'AddressGara', name: 'Địa chỉ NCC', field: 'AddressGara', width: 250, sortable: true },
      { id: 'SDTGara', name: 'SĐT NCC', field: 'SDTGara', width: 150, sortable: true },
      {
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 100,
        sortable: true,
        cssClass: 'text-right',
      },
      { id: 'Unit', name: 'Đơn vị', field: 'Unit', width: 100, sortable: true },
      {
        id: 'UnitPrice',
        name: 'Đơn giá',
        field: 'UnitPrice',
        width: 120,
        sortable: true,
        cssClass: 'text-right',
        formatter: moneyFormatter,
      },
      {
        id: 'TotalPrice',
        name: 'Thành tiền',
        field: 'TotalPrice',
        width: 120,
        sortable: true,
        cssClass: 'text-right',
        formatter: moneyFormatter,
      },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 250, sortable: true },
    ];

    this.gridOptionsDetail = {
      autoResize: {
        container: '#grid-container-propose-vehicle-detail',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      multiSelect: true,
      rowHeight: 35,
      headerRowHeight: 40,
    };
  }

  // SlickGrid event handlers
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};
  }

  angularGridDetailReady(angularGrid: AngularGridInstance) {
    this.angularGridDetail = angularGrid;
    this.gridDetailData = angularGrid?.slickGrid || {};
  }

  onCellClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.selectedRow = item;
      const id = item['ID'];
      this.proposeVehicleRepairService.getProposeVehicleRepairDetail(id).subscribe((res) => {
        const details = res?.data?.dataList || [];
        this.proposeVehicleRepairDetailData = details;
        this.datasetDetail = details.map((d: any, index: number) => ({
          ...d,
          id: d.ID || index,
          STT: index + 1,
        }));
      });
    }
  }

  onCellDetailClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.selectedDetailRow = item;
    }
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridData.getDataItem(args.rows[0]);
      this.selectedRow = selectedRow;
    }
  }

  loadData(): void {
    const request = {
      size: this.Size,
      page: this.Page,
      dateStart: this.toIsoStart(this.DateStart),
      dateEnd: this.toIsoEnd(this.DateEnd),
      filterText: this.FilterText,
      employeeID: this.EmployeeID,
      vehicleID: this.VehicleID,
      typeID: this.TypeID,
    };

    this.isLoading = true;
    this.proposeVehicleRepairService.getProposeVehicleRepair(request).subscribe({
      next: (response: any) => {
        const data = response?.data?.propose || [];
        this.dataset = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID,
          STT: index + 1,
        }));
        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
      },
    });
  }

  applyDistinctFilters(): void {
    if (!this.angularGrid?.slickGrid) return;

    const fieldsToFilter = ['VehicleName', 'LicensePlate', 'RepairTypeName', 'DriverName', 'EmployeeRepairName'];

    fieldsToFilter.forEach((field) => {
      const colIndex = this.columnDefinitions.findIndex((c) => c.field === field);
      if (colIndex >= 0) {
        const distinctValues = [...new Set(this.dataset.map((item) => item[field]).filter((v) => v))];
        const collection = distinctValues.map((val) => ({ value: val, label: val }));
        this.columnDefinitions[colIndex].filter = {
          model: Filters['multipleSelect'],
          collection: collection,
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        };
      }
    });

    this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
  }

  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {
      var list: any = res.data || [];
      this.vehicleList = list.filter((x: any) => x.VehicleCategoryID === 1);
    });
  }

  getEmployee() {
    const request = { status: 0, departmentid: 0, keyword: '' };

    this.proposeVehicleRepairService.getEmployee(request).subscribe((res) => {
      const list = res?.data ?? [];

      const map = new Map<string, any[]>();
      for (const emp of list) {
        const dept = emp.DepartmentName || 'Khác';
        if (!map.has(dept)) map.set(dept, []);
        map.get(dept)!.push(emp);
      }

      this.employeeGroups = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([department, items]) => ({
          department,
          items: items.sort((x, y) => String(x.Code).localeCompare(String(y.Code))),
        }));
    });
  }

  resetFilters(): void {
    this.DateStart = this.getFirstDayOfMonth();
    this.DateEnd = this.getLastDayOfMonth();
    this.TypeID = 0;
    this.EmployeeID = 0;
    this.VehicleID = 0;
    this.FilterText = '';
    this.loadData();
  }

  addProposeVehicleRepair() {
    const modalRef = this.ngbModal.open(ProposeVehicleRepairFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.result.then(
      (result) => {
        this.loadData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  getSelectedIds(): number[] {
    if (this.angularGrid && this.angularGrid.gridService) {
      const selectedRows = this.angularGrid.gridService.getSelectedRows();
      return selectedRows.map((index: number) => {
        const item = this.gridData.getDataItem(index);
        return item.ID;
      });
    }
    return [];
  }

  deleteSelectedProposals() {
    const ids = this.getSelectedIds();
    if (!ids.length) {
      this.notification.warning('Cảnh báo', 'Chưa chọn dòng để xóa');
      return;
    }
    const detailCalls = ids.map((id) =>
      this.proposeVehicleRepairService.getProposeVehicleRepairDetail(id).pipe(
        map((res: any) => {
          const list = res?.data?.dataList || [];
          const hasApproved = list.some((x: any) => {
            const v = x?.IsApprove;
            return v === 1 || v === true || v === '1' || v === 'true';
          });
          return { id, hasApproved };
        }),
        catchError(() => of({ id, hasApproved: false }))
      )
    );

    forkJoin(detailCalls).subscribe((results) => {
      const blocked = results.filter((r) => r.hasApproved).map((r) => r.id);
      const allowed = results.filter((r) => !r.hasApproved).map((r) => r.id);

      if (blocked.length) {
        this.notification.warning(
          'Cảnh báo',
          `Không thể xóa ${blocked.length} đề xuất đã có chi tiết được duyệt. Chỉ xóa ${allowed.length} đề xuất hợp lệ.`
        );
      }
      if (!allowed.length) {
        this.notification.warning(
          'Cảnh báo',
          'Không có đề xuất nào có thể xóa. Tất cả đề xuất đã chọn đều có nhà cung cấp được duyệt.'
        );
        return;
      }
      this.nzModal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc chắn muốn xóa ${allowed.length} đề xuất${blocked.length > 0 ? ` (${blocked.length} đề xuất có nhà cung cấp được duyệt không thể xóa)` : ''} ?`,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          const calls = allowed.map((id) => {
            const payload = {
              proposeVehicleRepair: { ID: id, IsDeleted: true },
            };
            return this.proposeVehicleRepairService.saveData(payload).pipe(
              map((res: any) => ({
                id,
                ok: res?.status === 1,
                msg: res?.message,
              })),
              catchError((err) => of({ id, ok: false, msg: err?.message || 'Lỗi không xác định' }))
            );
          });

          return forkJoin(calls)
            .toPromise()
            .then((results) => {
              if (!results) return;

              const okCount = results.filter((r) => r.ok).length;
              const fail = results.filter((r) => !r.ok).map((r) => r.id);

              if (okCount) {
                this.notification.success('Thành công', `Đã xóa ${okCount}/${allowed.length} đề xuất.`);
              }
              if (fail.length) {
                this.notification.warning('Cảnh báo', `Không xóa được ID: ${fail.join(', ')}`);
              }

              this.loadData();
            });
        },
      });
    });
  }

  editProposeVehicleRepair() {
    const selectedRows = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedData = selectedRows.map((index: number) => this.gridData.getDataItem(index));

    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Thông báo', 'Chọn một dòng để sửa');
      return;
    }
    const rowData = { ...selectedData[0] };

    const modalRef = this.ngbModal.open(ProposeVehicleRepairFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = rowData;

    modalRef.result.then(
      () => this.loadData(),
      () => { }
    );
  }

  async exportToExcelProduct() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách sửa chữa');
    const columns = this.columnDefinitions.filter((col: any) => col.hidden !== true && col.field && col.field.trim() !== '');
    const headerRow = worksheet.addRow(columns.map((col) => col.name || col.field));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    this.dataset.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        if (col.field === 'TimeStartRepair' || col.field === 'TimeEndRepair') {
          return value ? new Date(value).toLocaleDateString('vi-VN') : '';
        }
        return value !== null && value !== undefined ? value : '';
      });
      worksheet.addRow(rowData);
    });
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
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
    link.download = `danh-sach-sua-chua-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  private hasOtherApproved(detailId: number): boolean {
    return this.proposeVehicleRepairDetailData.some((x) => {
      const ok = x.IsApprove === true || x.IsApprove === 1 || x.IsApprove === '1' || x.IsApprove === 'true';
      return ok && x.ID !== detailId;
    });
  }

  approveSelectedDetail() {
    if (!this.selectedDetailRow) {
      this.notification.warning('Cảnh báo', 'Chọn một dòng chi tiết để phê duyệt');
      return;
    }
    if (!this.currentUser?.EmployeeID) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được thông tin người dùng hiện tại');
      return;
    }

    const detail = this.selectedDetailRow;
    const master = this.selectedRow;
    const detailId = detail.ID;
    const detailNCC = detail.GaraName;
    const alreadyApproved = detail.IsApprove === true || detail.IsApprove === 1;
    if (alreadyApproved) {
      this.notification.info('Thông báo', 'Dòng này đã được phê duyệt');
      return;
    }
    if (this.hasOtherApproved(detailId)) {
      this.notification.warning('Cảnh báo', 'Đã có 1 mục được duyệt. Hãy hủy duyệt mục đó trước');
      return;
    }

    const payloadApprove = [
      {
        ID: detailId,
        IsApprove: 1,
        ApproveID: this.currentUser.EmployeeID,
        DateApprove: new Date().toISOString(),
      },
    ];

    this.nzModal.confirm({
      nzTitle: 'Xác nhận phê duyệt',
      nzContent: `Phê duyệt đề xuất sửa xe nhà cung cấp :${detailNCC}?`,
      nzOkText: 'Phê duyệt',
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        try {
          const res = await this.proposeVehicleRepairService.saveApprove(payloadApprove).toPromise();
          if (res?.status !== 1) {
            this.notification.warning('Cảnh báo', res?.error?.message || 'Không phê duyệt được');
            return;
          }

          if (master?.ID) {
            const r = await this.proposeVehicleRepairService.getProposeVehicleRepairDetail(master.ID).toPromise();
            this.proposeVehicleRepairDetailData = r?.data?.dataList || [];
            this.datasetDetail = this.proposeVehicleRepairDetailData.map((d: any, index: number) => ({
              ...d,
              id: d.ID || index,
              STT: index + 1,
            }));
          }

          const dto = {
            vehicleRepairHistory: {
              ID: 0,
              STT: detail.STT,
              VehicleManagementID: master?.VehicleManagementID ?? 0,
              ProposeVehicleRepairID: master?.ID ?? 0,
              ProposeVehicleRepairDetailID: detail?.ID ?? 0,
              VehicleRepairTypeID: master?.VehicleRepairTypeID ?? null,
              ApproveID: this.currentUser.EmployeeID,
              DateReport: master?.DatePropose || null,
              TimeStartRepair: master?.TimeStartRepair || null,
              TimeEndRepair: master?.TimeEndRepair || null,
              Reason: master?.Reason || '',
              ProposeContent: master?.ProposeContent || '',
              EmployeeID: master?.EmployeeID ?? null,
              GaraName: detail?.GaraName || '',
              SDTGara: detail?.SDTGara || '',
              AddressGara: detail?.AddressGara || '',
              Unit: detail?.Unit || '',
              Quantity: detail?.Quantity ?? 0,
              UnitPrice: detail?.UnitPrice ?? 0,
              DateApprove: detail?.DateApprove || new Date().toISOString(),
              TotalPrice: detail?.TotalPrice ?? (detail?.Quantity ?? 0) * (detail?.UnitPrice ?? 0),
              Note: detail?.Note || '',
              CreatedDate: new Date().toISOString(),
              CreatedBy: this.currentUser?.LoginName || null,
              UpdatedDate: null,
              UpdatedBy: null,
              IsDeleted: false,
            },
            vehicleRepairHistoryFiles: [],
          };
          const saveRes = await this.vehicleRepairHistoryService.saveData(dto).toPromise();
          if (saveRes?.status === 1) {
            this.notification.success('Thành công', 'Đã phê duyệt và lưu theo dõi');
          } else {
            this.notification.warning('Cảnh báo', saveRes?.error.message || 'Lưu theo dõi thất bại');
          }
        } catch (err: any) {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi khi phê duyệt/lưu theo dõi');
        }
      },
    });
  }

  unapproveSelectedDetail() {
    if (!this.selectedDetailRow) {
      this.notification.warning('Cảnh báo', 'Chọn một dòng chi tiết để hủy duyệt');
      return;
    }
    const detailId = this.selectedDetailRow.ID;
    const isApproved = this.selectedDetailRow.IsApprove === true || this.selectedDetailRow.IsApprove === 1;
    if (!isApproved) {
      this.notification.info('Thông báo', 'Dòng này đang ở trạng thái chưa duyệt');
      return;
    }
    const payload = [
      {
        ID: detailId,
        IsApprove: 2,
        ApproveID: this.currentUser?.EmployeeID || 0,
      },
    ];

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt',
      nzContent: `Hủy duyệt mục chi tiết #${detailId}?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Đóng',
      nzOnOk: () =>
        this.proposeVehicleRepairService
          .saveApprove(payload)
          .toPromise()
          .then((res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thành công', 'Đã hủy duyệt');
              const masterId = this.selectedRow?.ID;
              if (masterId) {
                this.proposeVehicleRepairService.getProposeVehicleRepairDetail(masterId).subscribe((r) => {
                  this.proposeVehicleRepairDetailData = r.data.dataList || [];
                  this.datasetDetail = this.proposeVehicleRepairDetailData.map((d: any, index: number) => ({
                    ...d,
                    id: d.ID || index,
                    STT: index + 1,
                  }));
                });
              }
            } else {
              this.notification.warning('Cảnh báo', res?.message || 'Không hủy duyệt được');
            }
          }),
    });
  }
}
