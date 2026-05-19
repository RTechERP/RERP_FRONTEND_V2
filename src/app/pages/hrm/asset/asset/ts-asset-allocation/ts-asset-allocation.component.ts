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
import { NzFormModule } from 'ng-zorro-antd/form';
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
import * as ExcelJS from 'exceljs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from './ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { TsAssetAllocationFormComponent } from './ts-asset-allocation-form/ts-asset-allocation-form.component';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
import { Observable } from 'rxjs';
// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
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
    NzDropDownModule,
    NgbModalModule, HasPermissionDirective,
    AngularSlickgridModule,
    NzSpinModule,
    NzFormModule,
    Menubar,
    TableModule,
    InputTextModule
  ],
  selector: 'app-ts-asset-allocation',
  templateUrl: './ts-asset-allocation.component.html',
  styleUrls: ['./ts-asset-allocation.component.css']
})
export class TsAssetAllocationComponent implements OnInit, AfterViewInit {
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
  selectedRows: any[] = [];

  public detailTabTitle: string = 'Thông tin biên bản cấp phát:';
  gridId = this.generateUUIDv4();
  gridIdDetail = this.generateUUIDv4();

  generateUUIDv4(): string {
    return 'g-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  constructor(private notification: NzNotificationService,
    private assetAllocationService: AssetAllocationService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) { }
  selectedRow: any = "";
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  assetAllocationData: any[] = [];
  allocationDetailData: any[] = [];
  isSearchVisible: boolean = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  currentUser: any = null;
  isLoading: boolean = false;
  selectedApproval: number | null = null;
  menuBars: any[] = [];

  get shouldShowSearchBar(): boolean {
    return !this.isMobile() || this.showSearchBar;
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

  private getFirstDayOfMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private getLastDayOfMonth(): string {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.initMenuBar();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddAllocation(),
        visible: this.permissionService.hasPermission("N23,N1"),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditAllocation(),
        visible: this.permissionService.hasPermission("N23,N1"),

      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteAllocation(),
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
        command: () => this.exportAllocationAssetReport()
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => this.getAllocation()
      }
    ];
  }

  ngAfterViewInit(): void {
    this.getAllocation();
    this.getListEmployee();
    this.getCurrentUser();
  }
  getAllocation(): void {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      dateStart: this.dateStart || '2020-01-01',
      dateEnd: this.dateEnd || '2035-12-31',
      employeeID: this.employeeID || 0,
      status: statusString,
      filterText: this.filterText || '',
      pageSize: this.pageSize,
      pageNumber: this.pageNumber
    };

    this.isLoading = true;
    this.assetAllocationService.getAssetAllocation(request).subscribe({
      next: (data: any) => {
        this.assetAllocationData = data.assetAllocation || [];
        this.dataset = this.assetAllocationData.map((item, index) => ({
          ...item,
          id: item.ID,
          STT: index + 1
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy dữ liệu cấp phát:', err);
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
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
  }

  resetSearch(): void {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.employeeID = null;
    this.filterText = '';
    this.selectedApproval = null;
    this.getAllocation();
  }

  onDateRangeChange(): void {
    this.getAllocation();
  }

  onEmployeeChange(): void {
    this.getAllocation();
  }

  onApprovalChange(): void {
    this.getAllocation();
  }

  onKeywordChange(value: string): void {
    this.filterText = value;
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
      {
        id: 'IsApprovedPersonalProperty',
        name: 'Cá Nhân Duyệt',
        field: 'IsApprovedPersonalProperty',
        width: 100,
        sortable: true,
        cssClass: 'text-center',
        formatter: checkboxFormatter
      },
      {
        id: 'Status',
        name: 'HR Duyệt',
        field: 'Status',
        width: 100,
        sortable: true,
        cssClass: 'text-center',
        formatter: checkboxFormatter
      },
      {
        id: 'IsApproveAccountant',
        name: 'KT Duyệt',
        field: 'IsApproveAccountant',
        width: 100,
        sortable: true,
        cssClass: 'text-center',
        formatter: checkboxFormatter
      },
      {
        id: 'Code',
        name: 'Mã',
        field: 'Code',
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
          } as MultipleSelectOption
        }
      },
      {
        id: 'DateAllocation',
        name: 'Ngày cấp phát',
        field: 'DateAllocation',
        width: 160,
        sortable: true,
        cssClass: 'text-center',
        formatter: formatDate
      },
      {
        id: 'DateApprovedHR',
        name: 'Ngày HR duyệt',
        field: 'DateApprovedHR',
        width: 160,
        sortable: true,
        cssClass: 'text-center',
        formatter: formatDate,
        hidden: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'EmployeeName',
        name: 'Cấp phát cho',
        field: 'EmployeeName',
        width: 260,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      { id: 'EmployeeID', name: 'EmployeeID', field: 'EmployeeID', hidden: true },
      {
        id: 'Department',
        name: 'Phòng ban',
        field: 'Department',
        width: 160,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'Possition',
        name: 'Vị trí',
        field: 'Possition',
        width: 160,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 460,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.Note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '#' + this.gridId + '_container',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true
      },
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
      { id: 'TSAssetAllocationID', name: 'TSAssetAllocationID', field: 'TSAssetAllocationID', width: 60, hidden: true },
      { id: 'ID', name: 'ID', field: 'ID', width: 60, hidden: true },
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true, cssClass: 'text-center' },
      {
        id: 'TSCodeNCC',
        name: 'Mã tài sản',
        field: 'TSCodeNCC',
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
          } as MultipleSelectOption
        }
      },
      { id: 'Quantity', name: 'Số lượng', field: 'Quantity', width: 100, sortable: true, cssClass: 'text-center' },
      {
        id: 'TSAssetName',
        name: 'Tên tài sản',
        field: 'TSAssetName',
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
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.TSAssetName}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true }
      },
      { id: 'UnitName', name: 'Đơn vị', field: 'UnitName', width: 100, sortable: true, cssClass: 'text-center' },
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
        customTooltip: { useRegularTooltip: true }
      }
    ];

    this.gridOptionsDetail = {
      autoResize: {
        container: '#' + this.gridIdDetail + '_container',
        calculateAvailableSizeBy: 'container'
      },
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
      this.detailTabTitle = `Thông tin biên bản cấp phát: ${item['Code']}`;
      const id = item['ID'];
      this.assetAllocationService.getAssetAllocationDetail(id).subscribe(res => {
        const details = Array.isArray(res.data.assetsAllocationDetail)
          ? res.data.assetsAllocationDetail
          : [];
        this.allocationDetailData = details;
        this.datasetDetail = this.allocationDetailData.map((item, index) => ({
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

  // PrimeNG event handlers
  onMasterRowClick(row: any): void {
    if (row) {
      this.selectedRow = row;
      this.detailTabTitle = `Thông tin biên bản cấp phát: ${row.Code}`;
      const id = row.ID;
      this.assetAllocationService.getAssetAllocationDetail(id).subscribe(res => {
        const details = Array.isArray(res.data.assetsAllocationDetail)
          ? res.data.assetsAllocationDetail
          : [];
        this.allocationDetailData = details;
        this.datasetDetail = this.allocationDetailData.map((item, index) => ({
          ...item,
          id: item.ID || index,
          STT: index + 1
        }));
      });
    }
  }

  onMasterRowSelect(event: any): void {
    if (event?.data) {
      this.onMasterRowClick(event.data);
    }
  }

  isChecked(value: any): boolean {
    return ['true', true, 1, '1'].includes(value);
  }

  formatDateValue(value: any): string {
    if (!value) return '';
    try {
      const dateValue = DateTime.fromISO(value);
      return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
    } catch (e) {
      return value;
    }
  }

  onAddAllocation() {
    const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // ✅ luôn truyền object mới cho form "Thêm mới"
    modalRef.componentInstance.dataInput = {
      ID: 0,
      DateAllocation: DateTime.now().toISODate(),
      EmployeeID: null,
      Note: '',
      // nếu cần thêm field default thì khai báo thêm ở đây
    };

    modalRef.result.then(
      (result) => {
        this.getAllocation();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditAllocation() {
    const selectedData = this.selectedRows || [];

    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một biên bản để sửa!');
      return;
    }

    const selectedAssets = { ...selectedData[0] };

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

    const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = selectedAssets;

    modalRef.result.then(
      () => {
        this.getAllocation();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  getSelectedIds(): number[] {
    return (this.selectedRows || []).map((item: any) => item.ID);
  }
  onDeleteAllocation() {
    const selectedRows = this.selectedRows || [];

    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những cái cá nhân duyêjt
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    // Những cái được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Tất cả các biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    // Nếu có cái không xóa được thì báo trước
    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Một phần không được xóa',
        `Biên bản sau đã được cá nhân duyệt, không thể xóa: ${lockedCodes}, vui lòng hủy duyệt trước khi xóa.`
      );
    }

    const payloads = deletable.map(x => ({
      tSAssetAllocation: {
        ID: x.ID,
        IsDeleted: true
      }
    }));

    const requests = payloads.map(p =>
      this.assetAllocationService.saveData(p)
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa biên bản thành công!');
        this.getAllocation();
      },
      error: (err) => {

        this.notification.warning(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ!');
      }
    });
  }


  // validate 1 dòng, nếu lỗi trả về CODE, nếu ok trả về null
  validateApprove(
    action: 1 | 2 | 3 | 4 | 5 | 6,
    row: any
  ): string | null {
    // 1 & 2: chỉ người được cấp tài sản mới được duyệt / hủy cá nhân
    if (action === 1 || action === 2) {
      const emp = Array.isArray(this.currentUser)
        ? this.currentUser[0]
        : this.currentUser;

      const empIdRaw = emp?.EmployeeID;
      const empId = empIdRaw != null ? Number(empIdRaw) : null;
      const employeeId = row.EmployeeID != null ? Number(row.EmployeeID) : null;

      if (!empId || employeeId !== empId) {
        return 'PERSONAL_NOT_OWNER'; // sẽ gom message ở ngoài
      }
    }

    const isKTApproved = ['true', true, 1, '1'].includes(row.IsApproveAccountant);
    const isHRApproved = ['true', true, 1, '1'].includes(row.Status) || row.Status == 1;

    switch (action) {
      case 2: // Hủy cá nhân
        if (isHRApproved) {
          return 'PERSONAL_CANNOT_CANCEL_AFTER_HR';
        }
        break;

      case 3: // HR duyệt

        break;

      case 4: // Hủy HR
        if (isKTApproved) {
          return 'HR_CANNOT_CANCEL_AFTER_KT';
        }
        if (!isHRApproved) {
          return 'HR_CANNOT_CANCEL_NOT_APPROVED';
        }
        break;

      case 5: // KT duyệt
        if (!isHRApproved) {
          return 'KT_NEED_HR';
        }
        if (isKTApproved) {
          return 'KT_ALREADY_APPROVED';
        }
        break;

      case 6: // KT hủy duyệt
        if (!isKTApproved) {
          return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED';
        }
        break;

      // case 1: duyệt cá nhân, ngoài rule “PERSONAL_NOT_OWNER” thì không check gì thêm
    }

    return null; // hợp lệ
  }

  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
    const selectedRows = (this.selectedRows || []) as any[];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa chọn biên bản để duyệt');
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

    // helper: gom message theo code
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
          case 'PERSONAL_NOT_OWNER':
            messages.push(
              `Bạn không được phép duyệt các biên bản cấp phát ${codes} vì không phải người được cấp tài sản.`
            );
            break;

          case 'PERSONAL_CANNOT_CANCEL_AFTER_HR':
            messages.push(
              `Các biên bản cấp phát ${codes} đã được HR duyệt, cá nhân không thể hủy.`
            );
            break;

          case 'HR_NEED_PERSONAL':
            messages.push(
              `Các biên bản cấp phát ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
            );
            break;

          case 'HR_CANNOT_CANCEL_AFTER_KT':
            messages.push(
              `Các biên bản cấp phát ${codes} đã được Kế toán duyệt, HR không thể hủy.`
            );
            break;

          case 'HR_CANNOT_CANCEL_NOT_APPROVED':
            messages.push(
              `Các biên bản cấp phát ${codes} chưa được HR duyệt, không thể hủy duyệt!`
            );
            break;

          case 'KT_NEED_HR':
            messages.push(
              `Các biên bản cấp phát ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
            );
            break;

          case 'KT_ALREADY_APPROVED':
            messages.push(
              `Các biên bản cấp phát ${codes} đã được Kế toán duyệt, không thể duyệt lại!`
            );
            break;

          case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED':
            messages.push(
              `Các biên bản cấp phát ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
            );
            break;

          default:
            messages.push(
              `Lỗi với các biên bản cấp phát ${codes} (code: ${code}).`
            );
            break;
        }
      });

      return messages;
    };

    // Không có hàng hợp lệ -> show full lỗi rồi dừng
    if (validRows.length === 0) {
      if (invalidRows.length > 0) {
        const msgs = buildErrorMessages(invalidRows);
        this.notification.warning(
          'Không thể thực hiện',
          msgs.join('\n')
        );
      } else {
        this.notification.error(
          'Thất bại',
          'Không có biên bản nào hợp lệ để thực hiện.'
        );
      }
      return;
    }

    // Có cả đúng cả sai -> báo những cái bị bỏ qua
    if (invalidRows.length > 0) {
      const msgs = buildErrorMessages(invalidRows);
      this.notification.warning(
        'Một số biên bản không được xử lý:',
        msgs.join('\n')
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

    const payloads = validRows.map(row => {
      const ID = row.ID;
      const updatePayload: {
        tSAssetAllocation: {
          ID: number;
          Status?: number;
          IsApproveAccountant?: boolean;
          IsApprovedPersonalProperty?: boolean;
          DateApproveAccountant?: string;
          DateApprovedPersonalProperty?: string;
          DateApprovedHR?: string;
        };
      } = { tSAssetAllocation: { ID } };

      switch (action) {
        case 1:
          updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = true;
          updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
          break;
        case 2:
          updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = false;
          updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
          break;
        case 3:
          updatePayload.tSAssetAllocation.Status = 1;
          updatePayload.tSAssetAllocation.DateApprovedHR = currentDate;
          break;
        case 4:
          updatePayload.tSAssetAllocation.Status = 0;
          updatePayload.tSAssetAllocation.DateApprovedHR = currentDate;
          break;
        case 5:
          updatePayload.tSAssetAllocation.IsApproveAccountant = true;
          updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate;
          break;
        case 6:
          updatePayload.tSAssetAllocation.IsApproveAccountant = false;
          updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate;
          break;
      }
      return updatePayload;
    });

    const requests$ = payloads.map(payload => {
      if (action === 1 || action === 2) {
        return this.assetAllocationService.saveAppropvePersonal(payload);
      } else if (action === 5 || action === 6) {
        return this.assetAllocationService.saveAppropveAccountant(payload);
      } else {
        return this.assetAllocationService.saveData(payload);
      }
    });

    forkJoin(requests$).subscribe({
      next: () => {
        const approvedCodes = validRows.map(x => x.Code).join(', ');
        this.notification.success(
          'Thành công',
          `Đã cập nhật thành công các biên bản: ${approvedCodes}`
        );

        // Nếu là HR duyệt thì sau khi cập nhật trạng thái → cập nhật luôn tài sản
        if (action === 3 && validRows.length > 0) {
          this.saveOnApproveMultiple(validRows);
        } else {
          this.getAllocation();
          this.allocationDetailData = [];
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

  saveOnApprove() {
    const selectedDetail = this.datasetDetail;
    console.log(selectedDetail);
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để duyệt.');
      return;
    }

    const payloadOnApprove = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        IsAllocation: true,
        StatusID: 2,
        Status: "Đang sử dụng",
        DepartmentID: item.DepartmentID || 0,
        EmployeeID: this.selectedRow.EmployeeID,
        TSAssetCode: item.TSAssetCode,
        TSAssetName: item.TSAssetName,
        Note: item.Note || '',
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: this.selectedRow.EmployeeID,
        ChucVuID: item.ChucVuHDID,
        DepartmentID: item.DepartmentID,
        DateAllocation: DateTime.now(),
        Status: "Đang sử dụng",
        Note: item.Note
      }))

    };
    console.log("đwqddddđ", payloadOnApprove);
    this.assetAllocationService.saveAppropveAccountant(payloadOnApprove).subscribe({
      next: () => {

        this.getAllocation();
      },
      error: (res: any) => {
        this.notification.success("Thông báo", res.error.message || "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
  private saveOnApproveMultiple(masters: any[]) {
    // 1. Lấy detail cho từng biên bản
    const detailRequests = masters.map(m =>
      this.assetAllocationService.getAssetAllocationDetail(m.ID)
    );

    forkJoin(detailRequests).subscribe({
      next: (responses: any[]) => {
        const allAssetManagements: any[] = [];
        const allAllocationEvictions: any[] = [];

        responses.forEach((res, index) => {
          const master = masters[index];

          const details = Array.isArray(res?.data?.assetsAllocationDetail)
            ? res.data.assetsAllocationDetail
            : [];

          if (!details || details.length === 0) {
            console.warn(`Biên bản ${master.Code} không có chi tiết, bỏ qua.`);
            return;
          }

          details.forEach((item: any) => {
            // Ép AssetManagementID về number, nếu lỗi thì = 0
            const assetIdRaw = item.AssetManagementID;
            const assetId = Number(assetIdRaw);
            const safeAssetId = isNaN(assetId) ? 0 : assetId;

            allAssetManagements.push({
              ID: safeAssetId,
              IsAllocation: true,
              StatusID: 2,
              Status: 'Đang sử dụng',
              DepartmentID: item.DepartmentID || 0,
              EmployeeID: master.EmployeeID,
              TSAssetCode: item.TSAssetCode,
              TSAssetName: item.TSAssetName,
              Note: item.Note || '',
            });

            allAllocationEvictions.push({
              ID: 0,
              AssetManagementID: safeAssetId,
              EmployeeID: master.EmployeeID,
              ChucVuID: item.ChucVuHDID,
              DepartmentID: item.DepartmentID,
              DateAllocation: DateTime.now(),
              Status: 'Đang sử dụng',
              Note: item.Note,
            });
          });
        });

        if (allAssetManagements.length === 0) {
          this.notification.warning(
            'Cảnh báo',
            'Không có chi tiết tài sản nào hợp lệ để cập nhật.'
          );
          return;
        }

        // 🔹 Thêm allocations theo yêu cầu của API
        const allocations = masters.map(m => ({
          ID: m.ID,
          // Nếu backend cần thêm flag thì map thêm
          IsApproveAccountant: true
        }));

        const payloadOnApprove = {
          allocations, // để backend không báo "allocations field is required" nữa
          tSAssetManagements: allAssetManagements,
          tSAllocationEvictionAssets: allAllocationEvictions
        };

        console.log('payloadOnApprove (multi):', payloadOnApprove);

        // 2. Gửi 1 request duy nhất
        this.assetAllocationService.saveAppropveAccountant(payloadOnApprove).subscribe({
          next: () => {
            const codes = masters.map(m => m.Code).join(', ');

            this.getAllocation();
            this.allocationDetailData = [];
          },
          error: (res: any) => {
            console.error('Lỗi khi lưu duyệt tài sản (multi)', res);
            this.notification.error(
              'Lỗi',
              res.error?.message || 'Lỗi khi duyệt tài sản.'
            );
          }
        });
      },
      error: (err: any) => {
        console.error('Lỗi load detail khi KT duyệt nhiều biên bản', err);
        this.notification.error(
          'Lỗi',
          err?.error?.message || 'Không tải được chi tiết cấp phát.'
        );
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
    const worksheet = workbook.addWorksheet('Danh sách cấp phát');

    // Lọc các cột có name, field và không bị ẩn
    const visibleColumns = this.columnDefinitions.filter((col: any) => {
      return col.name && col.field && col.hidden !== true;
    });

    // Lấy tiêu đề cột
    const headers = visibleColumns.map((col: any) => col.name);
    worksheet.addRow(headers);

    // Lấy dữ liệu từng dòng
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.field;
        let value = row[field];

        // Nếu là chuỗi ngày ISO thì parse thành Date để format về sau
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        return value;
      });
      worksheet.addRow(rowData);
    });

    // Format ngày cho cell kiểu Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua dòng tiêu đề
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Căn chỉnh độ rộng cột và wrap text
    worksheet.columns.forEach((col: any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      col.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Tạo và tải file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `CapPhatTaiSan_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  exportAllocationAssetReport() {
    // Dùng row đã click (selectedRow) + data detail đã load từ API
    const selectedMaster = this.selectedRow;
    const details = this.allocationDetailData;

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel! '
      );
      return;
    }

    const masterPayload = {
      ID: selectedMaster.ID,
      Code: selectedMaster.Code,
      AllocationID: selectedMaster.AllocationID,
      EmployeeAllocationName: selectedMaster.EmployeeAllocationName,
      DepartmentAllocation: selectedMaster.DepartmentAllocation,
      PosittionAllocation: selectedMaster.PosittionAllocation,
      DateAllocation: selectedMaster.DateAllocation,
      EmployeeName: selectedMaster.EmployeeName,
      Department: selectedMaster.Department,
      Possition: selectedMaster.Possition,
      Note: selectedMaster.Note,
      CreatedDate: selectedMaster.CreatedDate,
      DateApprovedHR: selectedMaster.DateApprovedHR,
      DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty
    };

    const detailPayload = details.map((d: any) => ({
      ID: d.ID,
      TSAssetAllocationID: d.TSAssetAllocationID,
      AssetManagementID: d.AssetManagementID,
      Quantity: d.Quantity,
      Status: d.Status,
      Note: d.Note,
      TSAssetName: d.TSAssetName,
      TSCodeNCC: d.TSCodeNCC,
      UnitName: d.UnitName || '',
      FullName: d.FullName,
      DepartmentName: d.DepartmentName,
      PositionName: d.PositionName
    }));

    const payload = {
      Master: masterPayload,
      Details: detailPayload
    };

    this.assetAllocationService.exportAllocationReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuCapPhat_${selectedMaster.Code}.xlsx`;
        saveAs(blob, fileName);
      },
      error: (res: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể xuất file!');
        console.error(res);
      }
    });
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    const fieldsToFilter = ['Code', 'EmployeeName', 'Department', 'Possition'];
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
