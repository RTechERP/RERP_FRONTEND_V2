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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
declare var bootstrap: any;
// @ts-ignore
import { saveAs } from 'file-saver';

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { TsAssetTransferFormComponent } from './ts-asset-transfer-form/ts-asset-transfer-form.component';
import { TsAssetTransferService } from './ts-asset-transfer-service/ts-asset-transfer.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { NzFormModule } from 'ng-zorro-antd/form';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../services/permission.service';

@Component({
  standalone: true,
  selector: 'app-ts-asset-transfer',
  templateUrl: './ts-asset-transfer.component.html',
  styleUrls: ['./ts-asset-transfer.component.css'],
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
    NzDropDownModule,
    NgbModalModule, HasPermissionDirective, NzModalModule,
    AngularSlickgridModule,
    NzSpinModule,
    NzFormModule,
    Menubar
  ]
})
export class TsAssetTransferComponent implements OnInit, AfterViewInit {
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

  constructor(
    private notification: NzNotificationService,
    private tsAssetTransferService: TsAssetTransferService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private authService: AuthService,
    private modal: NzModalService,
    private permissionService: PermissionService,
  ) { }
  public detailTabTitle: string = 'Thông tin biên bản điều chuyển:';
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
  emPloyeeLists: any[] = [];
  deletedDetailIds: number[] = [];
  modalData: any = [];
  selectedRow: any = "";
  DateStart: Date = new Date();
  DateEnd: Date = new Date();
  IsApproved: number | null = null;
  DeliverID: number | null = null;
  ReceiverID: number | null = null;
  TextFilter: string = '';
  PageSize: number = 1000000;
  PageNumber: number = 1;
  assetTranferData: any[] = [];
  assetTranferDetailData: any[] = [];
  isSearchVisible: boolean = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  currentUser: any = null;
  EmployeeID: any;
  isLoading: boolean = false;
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  selectedApproval: number | null = null;
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
  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getLastDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  ngOnInit() {
    this.DateStart = this.getFirstDayOfMonth();
    this.DateEnd = this.getLastDayOfMonth();
    this.initMenuBar();
    this.initGrid();
    this.initGridDetail();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddATranfer(),
        visible: this.permissionService.hasPermission("N23,N1"),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditTranfer(),
        visible: this.permissionService.hasPermission("N23,N1"),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteAssetTranfer(),
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
        icon: 'fa-solid fa-id-card fa-lg text-info',
        visible: this.permissionService.hasPermission("N23,N1"),
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
        icon: 'fa-solid fa-calculator fa-lg text-warning',
        visible: this.permissionService.hasPermission("N67,N1"),
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
        command: () => this.exportTransferAssetReport()
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => this.getTranferAsset()
      }
    ];
  }

  ngAfterViewInit(): void {
    this.getTranferAsset();
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
  getTranferAsset() {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {

      dateStart: this.DateStart ? DateTime.fromJSDate(new Date(this.DateStart)).toFormat('yyyy-MM-dd') : '2020-01-01',
      dateEnd: this.DateEnd ? DateTime.fromJSDate(new Date(this.DateEnd)).toFormat('yyyy-MM-dd') : '2025-12-31',
      IsApproved: statusString,
      DeliverID: this.DeliverID || 0,
      ReceiverID: this.ReceiverID || 0,
      TextFilter: this.TextFilter || '',
      PageSize: 20000,
      PageNumber: 1
    };

    this.isLoading = true;
    this.tsAssetTransferService.getAssetTranfer(request).subscribe({
      next: (data: any) => {
        this.assetTranferData = data.assetTranfer || [];
        console.log("Dữ liệu lấy về:", this.assetTranferData);
        this.dataset = this.assetTranferData.map((item, index) => ({
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
        console.error('Lỗi khi lấy dữ liệu điều chuyển:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
      }
    });
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
  resetSearch(): void {
    this.DateStart = this.getFirstDayOfMonth();
    this.DateEnd = this.getLastDayOfMonth();
    this.IsApproved = null;
    this.DeliverID = null;
    this.ReceiverID = null;
    this.TextFilter = '';
    this.selectedApproval = null;
    this.getTranferAsset();
  }

  onDateRangeChange(): void {
    this.getTranferAsset();
  }

  onDeliverChange(): void {
    this.getTranferAsset();
  }

  onReceiverChange(): void {
    this.getTranferAsset();
  }

  onApprovalChange(): void {
    this.getTranferAsset();
  }

  onKeywordChange(value: string): void {
    this.TextFilter = value;
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
      { id: 'IsApprovedPersonalProperty', name: 'Cá nhân duyệt', field: 'IsApprovedPersonalProperty', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      { id: 'IsApproved', name: 'HR duyệt', field: 'IsApproved', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      { id: 'IsApproveAccountant', name: 'KT duyệt', field: 'IsApproveAccountant', width: 100, sortable: true, cssClass: 'text-center', formatter: checkboxFormatter },
      {
        id: 'CodeReport', name: 'Mã điều chuyển', field: 'CodeReport', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'TranferDate', name: 'Ngày chuyển', field: 'TranferDate', width: 160, sortable: true, cssClass: 'text-center', formatter: formatDate, filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { id: 'DateApprovedHR', name: 'Ngày duyệt', field: 'DateApprovedHR', width: 160, sortable: true, cssClass: 'text-center', formatter: formatDate, hidden: true },
      { id: 'DateApprovedPersonalProperty', name: 'Ngày cá nhân duyệt', field: 'DateApprovedPersonalProperty', width: 160, sortable: true, cssClass: 'text-center', formatter: formatDate, hidden: true },
      {
        id: 'DeliverName', name: 'Người giao', field: 'DeliverName', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'ReceiverName', name: 'Người nhận', field: 'ReceiverName', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'ReceiverID', name: 'ReceiverID', field: 'ReceiverID', hidden: true },
      {
        id: 'DepartmentDeliver', name: 'Phòng giao', field: 'DepartmentDeliver', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      {
        id: 'DepartmentReceiver', name: 'Phòng nhận', field: 'DepartmentReceiver', width: 160, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'PossitionDeliver', name: 'Vị trí giao', field: 'PossitionDeliver', width: 160, sortable: true },
      { id: 'PossitionReceiver', name: 'Vị trí nhận', field: 'PossitionReceiver', width: 160, sortable: true },
      {
        id: 'Reason', name: 'Lý do', field: 'Reason', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Reason}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
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
      { id: 'AssetManagementID', name: 'AssetManagementID', field: 'AssetManagementID', width: 60, hidden: true },
      { id: 'TSTranferAssetID', name: 'TSTranferAssetID', field: 'TSTranferAssetID', width: 60, hidden: true },
      { id: 'ID', name: 'ID', field: 'ID', width: 60, hidden: true },
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true, cssClass: 'text-center' },
      {
        id: 'TSCodeNCC', name: 'Mã tài sản', field: 'TSCodeNCC', width: 150, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption }
      },
      { id: 'Quantity', name: 'Số lượng', field: 'Quantity', width: 100, sortable: true, cssClass: 'text-center' },
      {
        id: 'TSAssetName', name: 'Tên tài sản', field: 'TSAssetName', width: 200, sortable: true, filterable: true,
        filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.TSAssetName}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      },
      { id: 'UnitName', name: 'Đơn vị', field: 'UnitName', width: 100, sortable: true, cssClass: 'text-center' },
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
      this.detailTabTitle = `Thông tin biên bản điều chuyển: ${item['CodeReport']}`;
      const id = item['ID'];
      this.tsAssetTransferService.getAssetTranferDetail(id).subscribe(res => {
        const details = Array.isArray(res.data.assetTransferDetail) ? res.data.assetTransferDetail : [];
        this.assetTranferDetailData = details;
        this.datasetDetail = this.assetTranferDetailData.map((item, index) => ({
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
  onDeleteAssetTranfer() {
    const selectedIndexes = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedRows = selectedIndexes.map((index: number) => this.gridData.getDataItem(index)) as any[];

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những cái HR đã duyệt (không được phép xóa)
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    // Những cái được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Biên bản đã được cá nhân duyệt sẽ không bị xóa: ${lockedCodes}`
      );
    }

    const codesText = deletable
      .map(x => x.CodeReport ?? x.Code)
      .join(', ');

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa các biên bản sau: <b>${codesText}</b>?`,
      nzContent: 'Thao tác này sẽ đánh dấu biên bản là đã xóa.',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payloads = deletable.map(row => ({
          tSTranferAsset: {
            ID: row.ID,
            IsDeleted: true
          }
        }));

        const requests$ = payloads.map(p =>
          this.tsAssetTransferService.saveData(p)
        );

        return forkJoin(requests$).toPromise().then(() => {
          this.notification.success(NOTIFICATION_TITLE.success,
            `Đã xóa thành công các biên bản: ${codesText}`
          );
          this.getTranferAsset();
        }).catch(err => {
          console.error('Lỗi khi xóa nhiều:', err);
          this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
        });
      }
    });
  }


  // validate 1 dòng, nếu lỗi trả về message, nếu ok trả về null
  // validate 1 dòng, nếu lỗi trả về CODE, nếu ok trả về null
  validateApprove(
    action: 1 | 2 | 3 | 4 | 5 | 6,
    row: any
  ): string | null {
    // 1 & 2: chỉ người nhận tài sản mới được duyệt / hủy cá nhân
    if (action === 1 || action === 2) {
      const empIdRaw = this.currentUser?.EmployeeID;
      const empId = empIdRaw != null ? Number(empIdRaw) : null;
      const receiverId = row.ReceiverID != null ? Number(row.ReceiverID) : null;

      if (!empId || receiverId !== empId) {
        return 'NOT_RECEIVER'; // sẽ gom message ở ngoài
      }
    }

    switch (action) {
      case 2: // Hủy cá nhân
        if (row.Status == 1) {
          return 'PERSONAL_CANNOT_CANCEL_AFTER_HR_TRANSFER';
        }
        break;

      case 3: // HR duyệt

        break;

      case 4: // Hủy HR
        if (row.IsApproveAccountant == true) {
          return 'HR_CANNOT_CANCEL_AFTER_KT_TRANSFER';
        }
        break;

      case 5: // KT duyệt
        if (row.IsApproved != true) {
          return 'KT_NEED_HR_TRANSFER';
        }
        if (row.IsApproveAccountant == true) {
          return 'KT_ALREADY_APPROVED_TRANSFER';
        }
        break;

      case 6: // KT hủy duyệt
        if (row.IsApproveAccountant != true) {
          return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED_TRANSFER';
        }
        break;
    }

    return null; // hợp lệ
  }
  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
    const selectedIndexes = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedRows = selectedIndexes.map((index: number) => this.gridData.getDataItem(index)) as any[];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa chọn biên bản để duyệt');
      return;
    }

    const validRows: any[] = [];
    const invalidRows: { row: any; code: string }[] = [];

    // validate từng row -> trả CODE
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
        const codes = rows.map((r: any) => r.CodeReport ?? r.Code).join(', ');

        switch (code) {
          case 'NOT_RECEIVER':
            messages.push(
              `Bạn không được phép duyệt các biên bản điều chuyển ${codes} vì không phải người nhận tài sản.`
            );
            break;

          case 'PERSONAL_CANNOT_CANCEL_AFTER_HR_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} đã được HR duyệt, cá nhân không thể hủy.`
            );
            break;

          case 'HR_NEED_PERSONAL_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
            );
            break;

          case 'HR_CANNOT_CANCEL_AFTER_KT_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} đã được Kế toán duyệt, HR không thể hủy.`
            );
            break;

          case 'KT_NEED_HR_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
            );
            break;

          case 'KT_ALREADY_APPROVED_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} đã được Kế toán duyệt, không thể duyệt lại.`
            );
            break;

          case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED_TRANSFER':
            messages.push(
              `Các biên bản điều chuyển ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
            );
            break;

          default:
            messages.push(`Lỗi với các biên bản điều chuyển ${codes} (code: ${code}).`);
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
          'Không có biên bản nào hợp lệ để duyệt.'
        );
      }
      return;
    }

    // Nếu vừa có đúng vừa có sai -> vẫn duyệt phần đúng, báo list sai
    if (invalidRows.length > 0) {
      const messages = buildErrorMessages(invalidRows);
      this.notification.warning(
        'Biên bản không được duyệt:',
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

    // Chỉ build payload từ validRows
    const payloads = validRows.map(row => {
      const ID = row.ID;

      const updatePayload: {
        tSTranferAsset: {
          ID: number;
          IsApproved?: boolean;
          IsApproveAccountant?: boolean;
          IsApprovedPersonalProperty?: boolean;
          DateApproveAccountant?: string;
          DateApprovedPersonalProperty?: string;
          DateApprovedHR?: string;
        };
      } = { tSTranferAsset: { ID } };

      switch (action) {
        case 1:
          updatePayload.tSTranferAsset.IsApprovedPersonalProperty = true;
          updatePayload.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
          break;

        case 2:
          updatePayload.tSTranferAsset.IsApprovedPersonalProperty = false;
          updatePayload.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
          break;

        case 3:
          updatePayload.tSTranferAsset.IsApproved = true;
          updatePayload.tSTranferAsset.DateApprovedHR = currentDate;
          break;

        case 4:
          updatePayload.tSTranferAsset.IsApproved = false;
          updatePayload.tSTranferAsset.DateApprovedHR = currentDate;
          break;

        case 5:
          updatePayload.tSTranferAsset.IsApproveAccountant = true;
          updatePayload.tSTranferAsset.DateApproveAccountant = currentDate;
          break;

        case 6:
          updatePayload.tSTranferAsset.IsApproveAccountant = false;
          updatePayload.tSTranferAsset.DateApproveAccountant = currentDate;
          break;
      }

      return updatePayload;
    });

    // Chọn service theo action
    const requests$ = payloads.map(payload => {
      if (action === 1 || action === 2) {
        return this.tsAssetTransferService.saveDataPersonal(payload);
      } else if (action === 5 || action === 6) {
        return this.tsAssetTransferService.saveDataKT(payload);
      } else {
        // 3, 4
        return this.tsAssetTransferService.saveData(payload);
      }
    });



    forkJoin(requests$).subscribe({
      next: () => {
        const approvedCodes = validRows
          .map(x => x.CodeReport ?? x.Code)
          .join(', ');

        this.notification.success(
          'Thành công',
          `Đã cập nhật thành công biên bản điều chuyển: ${approvedCodes}`
        );

        // HR duyệt xong header -> cập nhật luôn tài sản cho nhiều biên bản
        if (action === 3 && validRows.length > 0) {
          this.updateOnApproveMultiple(validRows);
        } else {
          this.getTranferAsset();
          this.assetTranferDetailData = [];
          this.datasetDetail = [];
        }
      },
      error: (err: any) => {
        console.error('Lỗi updateApprove (nhiều)', err);
        const msg = err?.error?.message || 'Một số cập nhật thất bại';
        this.notification.error('Lỗi', msg);
      }
    });
  }
  private updateOnApproveMultiple(masters: any[]) {
    // 1. Lấy detail cho từng biên bản điều chuyển
    const detailRequests = masters.map(m =>
      this.tsAssetTransferService.getAssetTranferDetail(m.ID)
    );

    forkJoin(detailRequests).subscribe({
      next: (responses: any[]) => {
        const allAssetManagements: any[] = [];
        const allAllocationEvictions: any[] = [];

        responses.forEach((res, index) => {
          const master = masters[index];

          const details = Array.isArray(res?.data?.assetTransferDetail)
            ? res.data.assetTransferDetail
            : [];

          if (!details || details.length === 0) {
            console.warn(`Biên bản ${master.CodeReport ?? master.Code} không có chi tiết, bỏ qua.`);
            return;
          }

          details.forEach((item: any) => {
            const safeAssetId = Number(item.AssetManagementID) || 0;

            allAssetManagements.push({
              ID: safeAssetId,
              DepartmentID: master.ToDepartmentID || 0,
              EmployeeID: master.ReceiverID,
              Node: `Đã điều chuyển cho ${master.ReceiverName}`,
            });

            allAllocationEvictions.push({
              ID: 0,
              AssetManagementID: safeAssetId,
              EmployeeID: master.ReceiverID || 0,
              DepartmentID: master.ToDepartmentID,
              ChucVuID: master.ToChucVuID,
              DateAllocation: master.TranferDate,
              Status: 'Đang sử dụng',
              Note: `Được điều chuyển từ ${master.DeliverName}`,
            });
          });
        });

        if (allAssetManagements.length === 0) {
          this.notification.warning('Cảnh báo', 'Không có chi tiết tài sản nào để cập nhật.');
          return;
        }

        const payloadTranfer = {
          tSAssetManagements: allAssetManagements,
          tSAllocationEvictionAssets: allAllocationEvictions
        };

        console.log('payload transfer (multi):', payloadTranfer);

        // 2. Gửi 1 request để update tất cả tài sản
        this.tsAssetTransferService.saveDataKT(payloadTranfer).subscribe({
          next: () => {
            const codes = masters.map(x => x.CodeReport ?? x.Code).join(', ');
            // this.notification.success(
            //   'Thành công',
            //   `Đã cập nhật tài sản cho các biên bản điều chuyển: ${codes}`
            // );
            this.getTranferAsset();
            this.assetTranferDetailData = [];
          },
          error: (err) => {
            console.error('Lỗi saveDataKT (multi transfer):', err);
            this.notification.error(
              'Lỗi',
              err?.error?.message || 'Duyệt tài sản điều chuyển thất bại.'
            );
          }
        });
      },
      error: (err) => {
        console.error('Lỗi load detail điều chuyển (multi):', err);
        this.notification.error('Lỗi', 'Không tải được chi tiết biên bản điều chuyển.');
      }
    });
  }

  updateOnApprove() {
    const selectedDetail = this.datasetDetail;
    const selectedTranfer = this.selectedRow;
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để duyệt.');
      return;
    }
    const payloadTranfer = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        StatusID: 1,
        Status: "Đã điều chuyển",
        DepartmentID: selectedTranfer.ToDepartmentID || 0,
        EmployeeID: selectedTranfer.ReceiverID,
        Node: `Đã điều chuyển cho ${selectedTranfer.ReceiverName}`,
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: selectedTranfer.ReceiverID || 0,
        DepartmentID: selectedTranfer.ToDepartmentID,
        ChucVuID: selectedTranfer.ToChucVuID,
        DateAllocation: selectedTranfer.TranferDate,
        Status: "Đang sử dụng",
        Note: `Được điều chuyển từ ${selectedTranfer.DeliverName}`
      }))
    };
    console.log('payload', payloadTranfer);
    this.tsAssetTransferService.saveDataKT(payloadTranfer).subscribe({
      next: () => {
        this.getTranferAsset();
      },
      error: (err) => {
      }
    });
  }
  onAddATranfer() {
    const modalRef = this.ngbModal.open(TsAssetTransferFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // ✅ luôn tạo object mới, không dùng lại this.modalData
    modalRef.componentInstance.dataInput = {
      ID: 0,
      TranferDate: DateTime.now().toISODate(),
      DeliverID: null,
      ReceiverID: null,
      FromDepartmentID: null,
      ToDepartmentID: null,
      FromChucVuID: null,
      ToChucVuID: null,
      Reason: '',
      CodeReport: '',
      // thêm field nào form cần thì liệt kê ở đây
    };

    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getTranferAsset();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditTranfer() {
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
        `Biên bản ${selectedAssets.CodeReport} đã được cá nhân duyệt, không thể sửa.`
      );
      return;
    }

    const modalRef = this.ngbModal.open(TsAssetTransferFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        this.getTranferAsset();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  //#region xuất excel
  async exportExcel() {
    const data = this.dataset;
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách điều chuyển tài sản');

    // Lọc các cột hiển thị
    const visibleColumns = this.columnDefinitions.filter((col: any) => {
      return col.hidden !== true && col.field && col.name;
    });

    // Thêm dòng tiêu đề
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

    // Tự động căn chỉnh độ rộng cột và wrap
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc tiêu đề
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Tạo và tải file Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DieuChuyenTaiSan_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  exportTransferAssetReport() {
    const selectedMaster = this.selectedRow;
    const details = this.datasetDetail;

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const payload = {
      master: {
        ID: selectedMaster.ID,
        CodeReport: selectedMaster.CodeReport,
        TranferDate: selectedMaster.TranferDate,
        DeliverName: selectedMaster.DeliverName,
        PossitionDeliver: selectedMaster.PossitionDeliver,
        DepartmentDeliver: selectedMaster.DepartmentDeliver,
        ReceiverName: selectedMaster.ReceiverName,
        PossitionReceiver: selectedMaster.PossitionReceiver,
        DepartmentReceiver: selectedMaster.DepartmentReceiver,
        Reason: selectedMaster.Reason,
        CreatedDate: selectedMaster.CreatedDate,
        DateApprovedHR: selectedMaster.DateApprovedHR,
        DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty,
      },
      details: details.map((d: any) => ({
        TSCodeNCC: d.TSCodeNCC,
        TSAssetName: d.TSAssetName,
        UnitName: d.UnitName,
        Quantity: d.Quantity,
        Status: d.Status,
        Note: d.Note,
      }))
    };
    this.tsAssetTransferService.exportTransferReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuBanGiao_${selectedMaster.CodeReport}.xlsx`;
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
    const fieldsToFilter = ['CodeReport', 'DeliverName', 'ReceiverName', 'DepartmentDeliver', 'DepartmentReceiver'];
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
