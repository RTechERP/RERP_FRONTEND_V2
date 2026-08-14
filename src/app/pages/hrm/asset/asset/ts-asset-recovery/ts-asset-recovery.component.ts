import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from '../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetRecoveryFormComponent } from './ts-asset-recovery-form/ts-asset-recovery-form.component';
import { AssetsRecoveryService } from './ts-asset-recovery-service/ts-asset-recovery.service';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../services/permission.service';

@Component({
  standalone: true,
  imports: [
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
    HasPermissionDirective,
    NzDropdownModule,
    NzModalModule,
    AngularSlickgridModule,
    NzSpinModule,
    NzFormModule,
    Menubar
  ],
  selector: 'app-ts-asset-recovery',
  templateUrl: './ts-asset-recovery.component.html',
  styleUrls: ['./ts-asset-recovery.component.css']
})
export class TsAssetRecoveryComponent implements OnInit, AfterViewInit {
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

  emPloyeeLists: any[] = [];
  employeeRecoveryID = 0;
  employeeReturnID = 0;
  dateStart: Date = new Date();
  dateEnd: Date = new Date();
  status: number = -1;
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  selectedRow: any = "";
  public detailTabTitle: string = 'Thông tin biên bản thu hồi:';
  gridId = this.generateUUIDv4();
  gridIdDetail = this.generateUUIDv4();

  generateUUIDv4(): string {
    return 'g-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  private ngbModal = inject(NgbModal);
  isSearchVisible: boolean = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  assetRecoveryData: any[] = [];
  assetRecoveryDetailData: any[] = [];
  modalData: any = [];
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  currentUser: any = null;
  isLoading: boolean = false;
  selectedApproval: number | null = null;
  menuBars: any[] = [];

  constructor(private notification: NzNotificationService,
    private assetsRecoveryService: AssetsRecoveryService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private modal: NzModalService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) { }

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

  ngOnInit() {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.initMenuBar();
    this.initGrid();
    this.initGridDetail();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddRecovery(),
        visible: this.permissionService.hasPermission("N23,N1"),

      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditRecovery(),
        visible: this.permissionService.hasPermission("N23,N1"),

      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteRecovery(),
        visible: this.permissionService.hasPermission("N23,N1"),
      },
      {
        label: 'Cá nhân xác nhận',
        icon: 'fa-solid fa-user-check fa-lg text-primary',
        items: [
          {
            label: 'Cá nhân duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.updateApprove(1)
          },
          {
            label: 'Cá nhân hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.updateApprove(2)
          }
        ]
      },
      {
        label: 'HR xác nhận',
        visible: this.permissionService.hasPermission("N23,N1"),

        icon: 'fa-solid fa-id-card fa-lg text-info',
        items: [
          {
            label: 'HR duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.updateApprove(3)
          },
          {
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.updateApprove(4)
          }
        ]
      },
      {
        label: 'KT xác nhận',
        visible: this.permissionService.hasPermission("N67,N1"),

        icon: 'fa-solid fa-calculator fa-lg text-warning',
        items: [
          {
            label: 'Kế toán duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.updateApprove(5)
          },
          {
            label: 'Kế toán hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.updateApprove(6)
          }
        ]
      },
      {
        label: 'Xuất phiếu',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportRecoveryAssetReport()
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => this.getRecovery()
      }
    ];
  }
  ngAfterViewInit(): void {
    this.getRecovery();
    this.getListEmployee();
    this.getCurrentUser();
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      // Chuẩn hóa: luôn là 1 object
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
  }
  getRecovery(): void {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      dateStart: this.dateStart ? DateTime.fromJSDate(new Date(this.dateStart)).toFormat('yyyy-MM-dd') : '2020-01-01',
      dateEnd: this.dateEnd ? DateTime.fromJSDate(new Date(this.dateEnd)).toFormat('yyyy-MM-dd') : '2035-12-31',
      employeeReturnID: this.employeeReturnID || 0,
      employeeRecoveryID: this.employeeRecoveryID || 0,
      status: statusString,
      filterText: this.filterText || '',
      pageSize: 20000,
      pageNumber: 1
    };

    this.isLoading = true;
    this.assetsRecoveryService.getAssetsRecovery(request).subscribe({
      next: (response: any) => {
        this.assetRecoveryData = response.assetsrecovery || [];
        this.dataset = this.assetRecoveryData.map((item, index) => ({
          ...item,
          id: item.ID,
          STT: index + 1
        }));
        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy dữ liệu thu hồi:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
      }
    });
  }

  resetSearch(): void {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.employeeReturnID = 0;
    this.employeeRecoveryID = 0;
    this.filterText = '';
    this.selectedApproval = null;
    this.getRecovery();
  }

  onDateRangeChange(): void {
    this.getRecovery();
  }

  onEmployeeReturnChange(): void {
    this.getRecovery();
  }

  onEmployeeRecoveryChange(): void {
    this.getRecovery();
  }

  onApprovalChange(): void {
    this.getRecovery();
  }

  onKeywordChange(value: string): void {
    this.filterText = value;
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.TsAssetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      console.log(this.emPloyeeLists);
    });
  }
  // Khởi tạo SlickGrid cho bảng master
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

    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = ['true', true, 1, '1'].includes(value) ? 'checked' : '';
      return `<input type="checkbox" ${checked} onclick="return false;">`;
    };

    this.columnDefinitions = [
      { id: 'STT', name: 'STT', field: 'STT', type: 'number', width: 60, sortable: true, cssClass: 'text-center' },
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', width: 60, hidden: true },
      { id: 'IsApprovedPersonalProperty', name: 'Cá Nhân Duyệt', field: 'IsApprovedPersonalProperty', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      { id: 'Status', name: 'HR Duyệt', field: 'Status', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      { id: 'IsApproveAccountant', name: 'KT Duyệt', field: 'IsApproveAccountant', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      {
        id: 'Code', name: 'Mã thu hồi', field: 'Code', width: 160, sortable: true, filterable: true, cssClass: 'text-center',
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'DateRecovery', name: 'Ngày thu hồi', field: 'DateRecovery', width: 160, sortable: true, cssClass: 'text-center', formatter: formatDate, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { id: 'DateApprovedHR', name: 'Ngày duyệt', field: 'DateApprovedHR', width: 160, sortable: true, cssClass: 'text-center', formatter: formatDate, hidden: true },
      {
        id: 'EmployeeReturnName', name: 'Thu hồi từ', field: 'EmployeeReturnName', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeReturnID', name: 'EmployeeReturnID', field: 'EmployeeReturnID', hidden: true },
      {
        id: 'DepartmentReturn', name: 'Phòng ban', field: 'DepartmentReturn', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'PossitionReturn', name: 'Chức vụ', field: 'PossitionReturn', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'EmployeeRecoveryName', name: 'Người thu hồi', field: 'EmployeeRecoveryName', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'EmployeeRecoveryID', name: 'EmployeeRecoveryID', field: 'EmployeeRecoveryID', hidden: true },
      {
        id: 'DepartmentRecovery', name: 'Phòng ban NTH', field: 'DepartmentRecovery', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'PossitionRecovery', name: 'Chức vụ NTH', field: 'PossitionRecovery', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'Note', name: 'Ghi chú', field: 'Note', width: 360, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] },

        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      }
    ];

    this.gridOptions = {
      autoResize: { container: '#' + this.gridId + '_container', calculateAvailableSizeBy: 'container' },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: false },
      checkboxSelector: { hideInFilterHeaderRow: false, hideInColumnTitleRow: true, applySelectOnAllPages: true },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true
    };
  }

  // Khởi tạo SlickGrid cho bảng detail
  initGridDetail() {
    this.columnDefinitionsDetail = [
      { id: 'ID', name: 'ID', field: 'ID', width: 60, hidden: true },
      { id: 'AssetManagementID', name: 'AssetManagementID', field: 'AssetManagementID', width: 60, hidden: true },
      { id: 'TSAssetRecoveryID', name: 'TSAssetRecoveryID', field: 'TSAssetRecoveryID', hidden: true },
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true, cssClass: 'text-center' },
      {
        id: 'TSCodeNCC', name: 'Mã NCC', field: 'TSCodeNCC', width: 150, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'TSAssetName', name: 'Tên tài sản', field: 'TSAssetName', width: 200, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.TSAssetName}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      },
      { id: 'Quantity', name: 'Số lượng', field: 'Quantity', width: 100, sortable: true, cssClass: 'text-center' },
      { id: 'UnitName', name: 'Đơn vị', field: 'UnitName', width: 100, sortable: true, cssClass: 'text-center' },
      { id: 'Status', name: 'Tình trạng', field: 'Status', width: 100, hidden: true },
      {
        id: 'Note', name: 'Ghi chú', field: 'Note', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      }
    ];

    this.gridOptionsDetail = {
      autoResize: { container: '#' + this.gridIdDetail + '_container', calculateAvailableSizeBy: 'container' },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true
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
      this.detailTabTitle = `Thông tin biên bản thu hồi: ${item['Code']}`;
      const id = item['ID'];
      this.assetsRecoveryService.getAssetsRecoveryDetail(id).subscribe(res => {
        const details = Array.isArray(res.data.assetsRecoveryDetail) ? res.data.assetsRecoveryDetail : [];
        this.assetRecoveryDetailData = details;
        this.datasetDetail = this.assetRecoveryDetailData.map((item, index) => ({
          ...item,
          id: item.ID || index,
          STT: index + 1
        }));
      });
    }
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridData.getDataItem(args.rows[0]);
      this.selectedRow = selectedRow;
    }
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
  onDeleteRecovery() {
    const selectedIndexes = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedRows = selectedIndexes.map((index: number) => this.gridData.getDataItem(index)) as any[];

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những biên bản HR đã duyệt -> không được xóa
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty) // hoặc IsApproveHR, tùy DB
    );

    // Những biên bản được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    // Không có cái nào xóa được
    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    // Vừa có cái xóa được vừa có cái không
    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Một số biên bản không được xóa',
        `Biên bản đã được cá nhân duyệt sẽ không bị xóa: ${lockedCodes}`
      );
    }

    // Chuẩn bị text mã biên bản sẽ xóa
    const codesText = deletable
      .map(x => x.CodeReport ?? x.Code)
      .join(', ');

    // Hỏi xác nhận
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa các biên bản sau: <b>${codesText}</b>?`,
      nzContent: 'Thao tác này sẽ đánh dấu biên bản là đã xóa.',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payloads = deletable.map(row => ({
          tSAssetRecovery: {
            ID: row.ID,
            IsDeleted: true
          }
        }));

        const requests$ = payloads.map(p =>
          this.assetsRecoveryService.saveAssetRecovery(p)
        );

        return forkJoin(requests$).toPromise().then(() => {
          this.notification.success(
            'Thành công',
            `Đã xóa thành công các biên bản: ${codesText}`
          );
          this.getRecovery();
        }).catch(err => {
          console.error('Lỗi khi xóa nhiều:', err);
          this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
        });
      }
    });
  }

  validateApprove(
    action: 1 | 2 | 3 | 4 | 5 | 6,
    row: any
  ): string | null {
    // Rule: chỉ người trả tài sản mới được duyệt / hủy cá nhân
    if (action === 1 || action === 2) {
      const empIdRaw = this.currentUser?.EmployeeID;
      const empId = empIdRaw != null ? Number(empIdRaw) : null;
      const returnId = row.EmployeeReturnID != null ? Number(row.EmployeeReturnID) : null;

      if (!empId || returnId !== empId) {
        // dùng code, gom message ở trên gọi
        return 'NOT_OWNER';
      }
    }

    switch (action) {
      case 2: // Hủy cá nhân
        if (row.Status == 1) {
          return 'PERSONAL_CANNOT_CANCEL_AFTER_HR';
        }
        break;

      case 3: // HR duyệt
        // HR có thể duyệt bất kể cá nhân đã duyệt hay chưa
        break;

      case 4: // Hủy HR
        if (row.IsApproveAccountant == true) {
          return 'HR_CANNOT_CANCEL_AFTER_KT';
        }
        break;

      case 5: // KT duyệt
        if (row.IsApproved != true) {
          return 'KT_NEED_HR';
        }
        if (row.IsApproveAccountant == true) {
          return 'KT_ALREADY_APPROVED';
        }
        break;

      case 6: // KT hủy duyệt
        if (row.IsApproveAccountant != true) {
          return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED';
        }
        break;
    }

    return null; // hợp lệ
  }

  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
    const selectedIndexes = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedRows = selectedIndexes.map((index: number) => this.gridData.getDataItem(index)) as any[];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chọn ít nhất 1 bản ghi để duyệt');
      return;
    }

    const validRows: any[] = [];
    const invalidRows: { row: any; code: string }[] = [];

    // validate từng row -> trả code
    for (const row of selectedRows) {
      const code = this.validateApprove(action, row);
      if (code) {
        invalidRows.push({ row, code });
      } else {
        validRows.push(row);
      }
    }

    // helper gom message theo code
    const buildErrorMessages = (items: { row: any; code: string }[]): string[] => {
      const byCode = new Map<string, any[]>();

      items.forEach(x => {
        if (!byCode.has(x.code)) byCode.set(x.code, []);
        byCode.get(x.code)!.push(x.row);
      });

      const messages: string[] = [];

      byCode.forEach((rows, code) => {
        const codes = rows.map((r: any) => r.Code).join(', ');

        switch (code) {
          case 'NOT_OWNER':
            messages.push(
              `Bạn không được phép duyệt các biên bản ${codes} vì không phải người trả tài sản.`
            );
            break;

          case 'PERSONAL_CANNOT_CANCEL_AFTER_HR':
            messages.push(
              `Các biên bản ${codes} đã được HR duyệt, cá nhân không thể hủy.`
            );
            break;

          case 'HR_NEED_PERSONAL':
            messages.push(
              `Các biên bản ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
            );
            break;

          case 'HR_CANNOT_CANCEL_AFTER_KT':
            messages.push(
              `Các biên bản ${codes} đã được Kế toán duyệt, HR không thể hủy.`
            );
            break;

          case 'KT_NEED_HR':
            messages.push(
              `Các biên bản ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
            );
            break;

          case 'KT_ALREADY_APPROVED':
            messages.push(
              `Các biên bản ${codes} đã được Kế toán duyệt, không thể duyệt lại.`
            );
            break;

          case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED':
            messages.push(
              `Các biên bản ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
            );
            break;

          default:
            // fallback nếu sau này thêm code mới mà quên map
            messages.push(`Lỗi với các biên bản ${codes} (code: ${code}).`);
            break;
        }
      });

      return messages;
    };

    // Nếu TẤT CẢ đều lỗi
    if (validRows.length === 0) {
      if (invalidRows.length > 0) {
        const messages = buildErrorMessages(invalidRows);
        this.notification.warning(
          'Không thể thực hiện',
          messages.join('\n')
        );
      } else {
        this.notification.error(
          'Thất bại',
          'Không có biên bản nào hợp lệ để thực hiện.'
        );
      }
      return;
    }

    // Nếu vừa có đúng vừa có sai -> báo lỗi cho phần sai nhưng vẫn xử lý phần đúng
    if (invalidRows.length > 0) {
      const messages = buildErrorMessages(invalidRows);
      this.notification.warning(
        'Danh sách biên bản không được duyệt:',
        messages.join('\n')
      );
    }
    const currentDate = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date()).replace(' ', 'T') + '+07:00';

    // payload chỉ cho validRows
    const payloads = validRows.map(row => {
      const ID = row.ID;

      const updatePayload: {
        tSAssetRecovery: {
          ID: number;
          Status?: number;
          IsApproveAccountant?: boolean;
          IsApprovedPersonalProperty?: boolean;
          DateApproveAccountant?: string;
          DateApprovedPersonalProperty?: string;
          DateApprovedHR?: string;
        };
      } = { tSAssetRecovery: { ID } };

      switch (action) {
        case 1:
          updatePayload.tSAssetRecovery.IsApprovedPersonalProperty = true;
          updatePayload.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
          break;

        case 2:
          updatePayload.tSAssetRecovery.IsApprovedPersonalProperty = false;
          updatePayload.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
          break;

        case 3:
          updatePayload.tSAssetRecovery.Status = 1;
          updatePayload.tSAssetRecovery.DateApprovedHR = currentDate;
          break;

        case 4:
          updatePayload.tSAssetRecovery.Status = 0;
          updatePayload.tSAssetRecovery.DateApprovedHR = currentDate;
          break;

        case 5:
          updatePayload.tSAssetRecovery.IsApproveAccountant = true;
          updatePayload.tSAssetRecovery.DateApproveAccountant = currentDate;
          break;

        case 6:
          updatePayload.tSAssetRecovery.IsApproveAccountant = false;
          updatePayload.tSAssetRecovery.DateApproveAccountant = currentDate;
          break;
      }

      return updatePayload;
    });

    const requests$ = payloads.map(payload => {
      if (action === 1 || action === 2) {
        return this.assetsRecoveryService.saveDataPersonal(payload);
      } else if (action === 5 || action === 6) {
        return this.assetsRecoveryService.saveDataKT(payload);
      } else {
        return this.assetsRecoveryService.saveAssetRecovery(payload);
      }
    });

    forkJoin(requests$).subscribe({
      next: () => {
        const approvedCodes = validRows
          .map(x => x.CodeReport ?? x.Code)
          .join(', ');

        this.notification.success(
          'Thành công',
          `Đã cập nhật thành công các biên bản: ${approvedCodes}`
        );

        if (action === 3 && validRows.length > 0) {
          this.updateOnApproveMultiple(validRows);
        } else {
          this.getRecovery();
          this.assetRecoveryData = [];
          this.datasetDetail = [];
        }
      },
      error: (err: any) => {
        console.error('Lỗi updateApprove (nhiều)', err);
        const msg = err?.error?.message || 'Duyệt thất bại';
        this.notification.error('Lỗi', msg);
      }
    });
  }

  private updateOnApproveMultiple(masters: any[]) {
    // Lấy detail cho từng biên bản thu hồi
    const detailRequests = masters.map(m =>
      this.assetsRecoveryService.getAssetsRecoveryDetail(m.ID)
    );

    forkJoin(detailRequests).subscribe({
      next: (responses: any[]) => {
        const allAssetManagements: any[] = [];
        const allAllocationEvictions: any[] = [];

        responses.forEach((res, index) => {
          const master = masters[index];

          const details = Array.isArray(res?.data?.assetsRecoveryDetail)
            ? res.data.assetsRecoveryDetail
            : [];

          if (!details || details.length === 0) {
            console.warn(`Biên bản ${master.Code} không có chi tiết, bỏ qua.`);
            return;
          }

          details.forEach((item: any) => {
            const safeAssetId = Number(item.AssetManagementID) || 0;

            allAssetManagements.push({
              ID: safeAssetId,
              StatusID: 1,
              Status: 'Chưa sử dụng',
              DepartmentID: master.DepartmentRecoveryID || 0,
              EmployeeID: master.EmployeeRecoveryID,
            });

            allAllocationEvictions.push({
              ID: 0,
              AssetManagementID: safeAssetId,
              EmployeeID: master.EmployeeReturnID || 0,
              ChucVuID: item.ChucVuHDID,
              DepartmentID: item.DepartmentID,
              Status: 'Đã thu hồi',
              Note: `Đã thu hồi từ ${master.EmployeeReturnName}`
            });
          });
        });

        if (allAssetManagements.length === 0) {
          this.notification.warning('Cảnh báo', 'Không có chi tiết tài sản nào để cập nhật.');
          return;
        }

        const payloadRecovery = {
          tSAssetManagements: allAssetManagements,
          tSAllocationEvictionAssets: allAllocationEvictions
        };

        console.log('payloadRecovery (multi):', payloadRecovery);

        this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
          next: () => {
            const codes = masters.map(x => x.CodeReport ?? x.Code).join(', ');
            // this.notification.success(
            //   'Thành công',
            //   `Đã cập nhật tài sản cho các biên bản: ${codes}`
            // );

            this.getRecovery();
            this.assetRecoveryDetailData = [];
          },
          error: (err) => {
            console.error('Lỗi saveAssetRecovery (multi):', err);
            this.notification.error('Lỗi', err?.error?.message || 'Duyệt tài sản thất bại.');
          }
        });
      },
      error: (err) => {
        console.error('Lỗi load detail khi duyệt nhiều biên bản:', err);
        this.notification.error('Lỗi', 'Không tải được chi tiết biên bản.');
      }
    });
  }
  onAddRecovery() {
    const modalRef = this.ngbModal.open(TsAssetRecoveryFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // ✅ Dữ liệu mặc định cho THÊM MỚI
    modalRef.componentInstance.dataInput = {
      ID: 0,
      Code: '',
      DateRecovery: DateTime.now().toISODate(),
      EmployeeReturnID: null,
      EmployeeRecoveryID: null,
      DepartmentReturn: '',
      PossitionReturn: '',
      DepartmentRecovery: '',
      PossitionRecovery: '',
      Status: 0,
      Note: '',
      IsApproveAccountant: false,
      IsApprovedPersonalProperty: false
    };

    modalRef.result.then(
      () => {
        this.getRecovery();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditRecovery() {
    const selectedIndexes = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selected = selectedIndexes.map((index: number) => this.gridData.getDataItem(index));
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một biên bản để sửa!');
      return;
    }

    const selectedAssets = { ...selected[0] };

    // ✅ CHECK: nếu cá nhân đã duyệt thì không cho sửa
    const isPersonalApproved = ['true', true, 1, '1'].includes(
      selectedAssets.IsApprovedPersonalProperty
    );

    if (isPersonalApproved) {
      this.notification.warning(
        'Thông báo',
        `Biên bản ${selectedAssets.Code} đã được cá nhân duyệt, không thể sửa.`
      );
      return;
    }

    const modalRef = this.ngbModal.open(TsAssetRecoveryFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getRecovery();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  updateOnApprove() {
    const selectedDetail = this.datasetDetail;
    const selectedRecovery = this.selectedRow;
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để duyệt.');
      return;
    }
    const payloadRecovery = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        StatusID: 1,
        Status: "Chưa sử dụng",
        DepartmentID: selectedRecovery.DepartmentRecoveryID || 0,
        EmployeeID: selectedRecovery.EmployeeRecoveryID,
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: selectedRecovery.employeeReturnID || 0,
        ChucVuID: item.ChucVuHDID,
        DepartmentID: item.DepartmentID,
        Status: "Đã thu hồi",
        Note: `Đã thu hồi từ ${selectedRecovery.EmployeeReturnName}`
      }))
    };
    console.log('payload', payloadRecovery);
    this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
      next: () => {
        this.getRecovery();
      },
      error: (err) => {
      }
    });
  }
  //#region xuất excel
  async exportExcel() {
    const data = this.dataset;
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thu hồi tài sản');

    // Lọc ra các cột hiển thị
    const visibleColumns = this.columnDefinitions.filter((col: any) => {
      return col.hidden !== true && col.field && col.name;
    });

    // Thêm tiêu đề
    const headers = visibleColumns.map((col: any) => col.name);
    worksheet.addRow(headers);

    // Thêm dữ liệu
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.field;
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format ngày
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột và wrap text
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      column.width = Math.min(maxLength, 30);
    });

    // Thêm filter hàng đầu
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ThuHoiTaiSan_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  //#endregion

  exportRecoveryAssetReport() {
    const selectedMaster = this.selectedRow;
    const details = this.datasetDetail;

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const payload = {
      Master: {
        ID: selectedMaster.ID,
        Code: selectedMaster.Code,
        DateRecovery: selectedMaster.DateRecovery,
        EmployeeReturnName: selectedMaster.EmployeeReturnName,
        DepartmentReturn: selectedMaster.DepartmentReturn,
        PossitionReturn: selectedMaster.PossitionReturn,
        EmployeeRecoveryName: selectedMaster.EmployeeRecoveryName,
        DepartmentRecovery: selectedMaster.DepartmentRecovery,
        PossitionRecovery: selectedMaster.PossitionRecovery,
        DateApprovedHR: selectedMaster.DateApprovedHR,
        DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty,
        Note: selectedMaster.Note,
      },
      Details: details.map((d: any) => ({
        TSAssetRecoveryID: d.TSAssetRecoveryID,
        AssetManagementID: d.AssetManagementID,
        Quantity: d.Quantity,
        Note: d.Note,
        TSAssetName: d.TSAssetName,
        TSCodeNCC: d.TSCodeNCC,
        UnitName: d.UnitName,
        Status: d.Status,
      }))
    };
    this.assetsRecoveryService.exportRecoveryReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuBanGiao_${selectedMaster.Code}.xlsx`;
        saveAs(blob, fileName); // 🟢 Lưu file Excel
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất file!');
        console.error(err);
      }
    });
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    const fieldsToFilter = ['Code', 'EmployeeReturnName', 'DepartmentReturn', 'PossitionReturn', 'EmployeeRecoveryName', 'DepartmentRecovery'];
    this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, fieldsToFilter);
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    // Update column definitions
    columnDefs.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
}