import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SplitterModule } from 'primeng/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MenuItem, PrimeIcons, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
// import { BillImportServiceService } from '../bill-import-service/bill-import-service.service';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { ActivatedRoute } from '@angular/router';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
// import { BillImportDetailComponent } from '../Modal/bill-import-detail/bill-import-detail.component';
// import { HistoryDeleteBillComponent } from '../BillExport/Modal/history-delete-bill/history-delete-bill.component';
// import { ScanBillImportComponent } from '../Modal/scan-bill-import/scan-bill-import.component';
import { environment } from '../../../../../environments/environment';
import { BillImportTechnicalProtectiveGear } from '../model/bill-import-technical-protective-gear';
import { BillImportTechnicalProtectiveGearDetailComponent } from '../bill-import-technical-protective-gear-detail/bill-import-technical-protective-gear-detail.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    SplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
    NzSpinModule,
    NzTabsModule,
    AngularSlickgridModule,
    Menubar,
  ],
  selector: 'app-bill-import-technical-protective-gear',
  templateUrl: './bill-import-technical-protective-gear.component.html',
  styleUrls: ['./bill-import-technical-protective-gear.component.css'],
})
export class BillImportTechnicalProtectiveGearComponent implements OnInit {
  // Angular SlickGrid instances
  angularGridMaster!: AngularGridInstance;
  angularGridDetail!: AngularGridInstance;

  // Column definitions
  columnDefinitionsMaster: Column[] = [];
  columnDefinitionsDetail: Column[] = [];

  // Grid options
  gridOptionsMaster: GridOption = {};
  gridOptionsDetail: GridOption = {};

  // Datasets
  datasetMaster: any[] = [];
  datasetDetail: any[] = [];

  // Component state
  wareHouseID = 5;
  isLoadTable: boolean = false;
  isDetailLoad: boolean = false;
  sizeTbDetail: any = '0';
  selectedRow: any = null;
  tabDetailTitle: string = 'Thông tin phiếu nhập';
  dataProductGroup: any[] = [];
  sizeSearch: string = '0';
  selectedKhoTypes: number[] = [];
  isCheckmode: boolean = false;
  id: number = 0;
  private shouldClearFilters: boolean = false;
  selectBillImport: any[] = [];
  menuBars: MenuItem[] = [];

  // Search parameters as individ
  // properties
  DateStart: string = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();
  DateEnd: string = (() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  })();
  Status: number = -1;
  FilterText: string = '';
  Keyword: string = '';

  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' },
  ];

  newBillImport: BillImportTechnicalProtectiveGear = {
    ID: 0,
    BillCode: '',
    CreatDate: null,

    Deliver: '',
    Receiver: '',
    Status: false,

    Suplier: '',
    BillType: false,
    WarehouseType: '',

    DeliverID: null,
    ReceiverID: null,
    SuplierID: null,
    GroupTypeID: null,

    CreatedBy: null,
    CreatedDate: null,
    UpdatedBy: null,
    UpdatedDate: null,

    Image: '',
    WarehouseID: null,
    SupplierSaleID: null,
    BillTypeNew: null,

    IsBorrowSupplier: null,
    CustomerID: null,
    BillDocumentImportType: null,
    DateRequestImport: null,
    RulePayID: null,
    IsNormalize: false,
    ApproverID: null,
    IsDeleted: false,
  };

  constructor(
    private ProductProtectiveGearService: ProductProtectiveGearService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrids();
  }
  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.openModalBillImportDetail(false);
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.openModalBillImportDetail(true);
        },
      },

      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.deleteBillImport();
        },
      },
    ];
  }
  onCreate() {
    const modalRef = this.modalService.open(
      BillImportTechnicalProtectiveGearDetailComponent,
      {
        size: 'xl',
        backdrop: 'static',
        centered: true,
      },
    );

    // modalRef.componentInstance.warehouseID = this.warehouseID,
    // modalRef.componentInstance.warehouseType = this.warehouseType,
    modalRef.componentInstance.isEdit = false;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh grid after save
          // this.getProductLocation();
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Thêm mới thành công',
          );
        }
      },
      (reason) => {
        // Modal dismissed
      },
    );
  }

  onEdit() {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí cần sửa',
      );
      return;
    }

    const modalRef = this.modalService.open(
      BillImportTechnicalProtectiveGearDetailComponent,
      {
        size: 'xl',
        backdrop: 'static',
        centered: true,
      },
    );
    modalRef.componentInstance.productLocationTech = { ...this.selectedRow };
    // modalRef.componentInstance.warehouseID = this.warehouseID,
    // modalRef.componentInstance.warehouseType = this.warehouseType,
    modalRef.componentInstance.isEdit = true;
    modalRef.result.then(
      (result) => {
        if (result) {
          // this.getProductLocation();
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Cập nhật thành công',
          );
        }
      },
      (reason) => {
        // Modal dismissed
      },
    );
  }

  onDelete() {
    // if (!this.selectedRows || this.selectedRows.length === 0) {
    //   this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một vị trí cần xóa');
    //   return;
    // }
    // const count = this.selectedRows.length;
    // const productNames = this.selectedRows
    //   .map(row => `Mã vị trí : ${row.LocationCode}`)
    //   .slice(0, 3)
    //   .join(', ');
    // const moreText = count > 3 ? ` và ${count - 3} vị trí khác khác` : '';
    // this.nzModalService.confirm({
    //   nzTitle: 'Xác nhận xóa',
    //   nzContent: `Bạn có chắc chắn muốn xóa ${count} vị trí đã chọn?<br><strong>${productNames}${moreText}</strong>`,
    //   nzOkText: 'Xóa',
    //   nzOkDanger: true,
    //   nzCancelText: 'Hủy',
    //   nzOnOk: () => {
    //     this.deleteSelectedProducts();
    //   }
    // });
  }

  // =================================================================
  // GRID INITIALIZATION
  // =================================================================

  initGrids(): void {
    this.initMasterGrid();
    this.initDetailGrid();
  }

  initMasterGrid(): void {
    this.columnDefinitionsMaster = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'Status',
        name: 'Nhận chứng từ',
        field: 'Status',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: Formatters.checkmarkMaterial,
        filter: {
          model: Filters['singleSelect'],
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Đã nhận' },
            { value: false, label: 'Chưa nhận' },
          ],
        },
        cssClass: 'text-center',
      },
      {
        id: 'DateStatus',
        name: 'Ngày nhận',
        field: 'DateStatus',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        cssClass: 'text-center',
      },
      {
        id: 'BillTypeNewText',
        name: 'Loại phiếu',
        field: 'BillTypeNewText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'BillCode',
        name: 'Mã phiếu nhập',
        field: 'BillCode',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },

      {
        id: 'NCC',
        name: 'Nhà cung cấp',
        field: 'NCC',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Deliver',
        name: 'Người giao',
        field: 'Deliver',
        sortable: true,
        filterable: true,
        width: 250,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Reciver',
        name: 'Người nhận',
        field: 'Reciver',
        sortable: true,
        filterable: true,
        width: 250,
        filter: { model: Filters['compoundInputText'] },
      },

      {
        id: 'CreatDate',
        name: 'Ngày tạo',
        field: 'CreatDate',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        cssClass: 'text-center',
      },
      {
        id: 'WarehouseType',
        name: 'Loại kho',
        field: 'WarehouseType',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-master-import',
        calculateAvailableSizeBy: 'container',
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enablePagination: false,

      frozenColumn: 5,
    };
  }

  initDetailGrid(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductCode',
        name: 'Serial',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Quantity',
        name: 'Số lượng sản phẩm',
        field: 'Quantity',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'UnitName',
        name: 'ĐVT',
        field: 'UnitName',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center',
      },
      {
        id: 'WarehouseType',
        name: 'Tình trạng hàng',
        field: 'WarehouseType',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        field: 'ProductCodeRTC',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
      },
      {
        id: 'BillCodePO',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        filterable: true,
        width: 130,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center',
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center',
      },
    ];

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail-import',
        calculateAvailableSizeBy: 'container',
        // maxHeight: 300, // Limit detail grid height
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      frozenColumn: 2,
    };
  }

  // =================================================================
  // GRID EVENTS
  // =================================================================

  angularGridMasterReady(angularGrid: AngularGridInstance): void {
    this.angularGridMaster = angularGrid;
    // Load data on init
    setTimeout(() => {
      this.loadDataBillImport();
    }, 100);
  }

  angularGridDetailReady(angularGrid: AngularGridInstance): void {
    this.angularGridDetail = angularGrid;
  }

  onMasterRowSelectionChanged(
    event: Event,
    args: OnSelectedRowsChangedEventArgs,
  ): void {
    if (!args || !args.rows || !this.angularGridMaster) return;

    const selectedIndexes = args.rows;
    if (selectedIndexes.length > 0) {
      const firstRowIndex = selectedIndexes[0];
      const rowData = this.angularGridMaster.dataView.getItem(firstRowIndex);

      this.id = rowData?.ID || 0;
      this.selectedRow = rowData;
      this.sizeTbDetail = null;
      this.updateTabDetailTitle();

      if (this.id > 0) {
        this.getBillImportDetail(this.id);
        this.getBillImportByID(this.id);
      }
    } else {
      this.id = 0;
      this.selectedRow = null;
      this.updateTabDetailTitle();
      this.datasetDetail = [];
      this.selectBillImport = [];
    }
  }

  onMasterCellClicked(event: Event, args: OnClickEventArgs): void {
    // Handle cell click if needed
  }

  // =================================================================
  // DATA LOADING
  // =================================================================

  loadMasterData(query: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.isLoadTable = true;

      this.ProductProtectiveGearService.getBillImport(
        this.DateStart,
        this.DateEnd,
        this.Status,
        this.wareHouseID,
        this.FilterText,
      ).subscribe({
        next: (res) => {
          this.isLoadTable = false;
          if (res.status === 1 && res.data) {
            resolve({
              data: res.data,
            });
          } else {
            reject('Failed to load data');
          }
        },
        error: (err) => {
          this.isLoadTable = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Không thể tải dữ liệu phiếu nhập',
          );
          reject(err);
        },
      });
    });
  }

  loadDataBillImport(): void {
    // Validate dates
    if (!this.DateStart) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ngày bắt đầu!',
      );
      return;
    }
    if (!this.DateEnd) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ngày kết thúc!',
      );
      return;
    }
    const dateStart = new Date(this.DateStart);
    const dateEnd = new Date(this.DateEnd);

    if (dateStart > dateEnd) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Ngày bắt đầu không thể lớn hơn ngày kết thúc',
      );
      return;
    }

    this.isLoadTable = true;
    this.ProductProtectiveGearService.getBillImport(
      this.DateStart,
      this.DateEnd,
      this.Status,
      this.wareHouseID,
      this.FilterText,
    ).subscribe({
      next: (res) => {
        this.isLoadTable = false;
        if (res.status === 1 && res.data) {
          console.log(res.data);
          this.datasetMaster = res.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID ?? index,
          }));
          this.applyDistinctFiltersToMaster();

          // Clear filters after data is loaded and columns are updated
          if (this.shouldClearFilters) {
            setTimeout(() => {
              // Clear master grid filters
              if (this.angularGridMaster?.filterService) {
                this.angularGridMaster.filterService.updateFilters([]);
                this.angularGridMaster.filterService.clearFilters();
              }
              // Clear detail grid filters
              if (this.angularGridDetail?.filterService) {
                this.angularGridDetail.filterService.updateFilters([]);
                this.angularGridDetail.filterService.clearFilters();
              }
              this.shouldClearFilters = false;
            }, 100);
          }
        }
      },
      error: (err) => {
        this.isLoadTable = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Không thể tải dữ liệu phiếu nhập',
        );
      },
    });
  }

  getBillImportDetail(id: number): void {
    this.isDetailLoad = true;
    this.ProductProtectiveGearService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.datasetDetail = res.data || [];
        this.datasetDetail = this.datasetDetail.map((item: any) => ({
          ...item,
          id: item.ID,
        }));
        this.isDetailLoad = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Có lỗi xảy ra khi lấy chi tiết',
        );
        this.isDetailLoad = false;
      },
    });
  }

  getBillImportByID(ids: number): void {
    this.ProductProtectiveGearService.getBillImportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillImport = res.data;
          console.log(this.selectBillImport);
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Lỗi',
          );
        }
      },
    });
  }

  searchData(): void {
    // Set flag to clear filters after data is loaded
    this.shouldClearFilters = true;
    this.loadDataBillImport();
  }

  openModalBillImportDetail(ischeckmode: boolean): void {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.selectBillImport.length == 0) {
      this.notification.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 phiếu nhập để sửa',
      );
      return;
    }
    const modalRef = this.modalService.open(
      BillImportTechnicalProtectiveGearDetailComponent,
      {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      },
    );

    // Truyền đúng object - lấy phần tử đầu tiên nếu là array
    if (this.isCheckmode && this.selectBillImport.length > 0) {
      modalRef.componentInstance.newBillImport = Array.isArray(
        this.selectBillImport,
      )
        ? this.selectBillImport[0]
        : this.selectBillImport;
    }
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.warehouseID = this.wareHouseID;

    modalRef.result.finally(() => {
      // Reload cả master và detail grid
      this.loadDataBillImport();
      if (this.id > 0) {
        this.getBillImportDetail(this.id);
      }
    });
  }
  // =================================================================
  // HELPER METHODS
  // =================================================================

  private getSelectedRows(): any[] {
    if (!this.angularGridMaster) return [];

    const selectedIndexes =
      this.angularGridMaster.slickGrid?.getSelectedRows() || [];
    return selectedIndexes
      .map((index: number) => this.angularGridMaster.dataView.getItem(index))
      .filter((item: any) => item);
  }

  // =================================================================
  // ADDITIONAL UI AND DATA METHODS
  // =================================================================

  dateFormat = 'dd/MM/yyyy';
  checked: any = false;

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onDateStartChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      this.DateStart = d.toISOString();
    }
  }

  onDateEndChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      this.DateEnd = d.toISOString();
    }
  }

  resetform(): void {
    this.selectedKhoTypes = [];
    const dateStart = new Date();
    dateStart.setMonth(dateStart.getMonth() - 1);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    this.DateStart = dateStart.toISOString();
    this.DateEnd = dateEnd.toISOString();
    this.Status = -1;
    this.FilterText = '';
    this.Keyword = '';
    this.loadDataBillImport();
  }

  onSearch() {
    this.loadDataBillImport();
  }

  closePanel() {
    this.sizeTbDetail = '0';
  }

  updateTabDetailTitle(): void {
    if (this.selectedRow?.BillCode) {
      this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillCode}`;
    } else {
      this.tabDetailTitle = 'Thông tin phiếu nhập';
    }
  }

  // =================================================================
  // MODAL AND ACTION METHODS
  // =================================================================

  deleteBillImport() {
    // Chỉ cho phép chọn và xóa 1 phiếu
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn phiếu muốn xóa!',
      );
      return;
    }

    // Kiểm tra phiếu có được duyệt không
    if (this.selectedRow.Status == true) {
      this.notification.warning(
        'Thông báo',
        `Phiếu đã được duyệt không thể xóa: ${this.selectedRow.BillCode}`,
      );
      return;
    }

    const billCode = this.selectedRow.BillCode;
    const billId = this.selectedRow.ID;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phiếu: ${billCode} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.ProductProtectiveGearService.deleteBillImport(billId).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa thành công phiếu: ${billCode}!`,
              );
              // Reset selection và reload data
              this.id = 0;
              this.selectedRow = null;
              this.selectBillImport = [];
              this.datasetDetail = [];
              this.loadDataBillImport();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                res.message || 'Xóa thất bại!',
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err.error?.message || 'Có lỗi xảy ra khi xóa dữ liệu!',
            );
          },
        });
      },
    });
  }

  // =================================================================
  // DISTINCT FILTERS
  // =================================================================

  private applyDistinctFiltersToMaster(): void {
    if (!this.angularGridMaster?.slickGrid || !this.angularGridMaster?.dataView)
      return;

    const data = this.angularGridMaster.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (
      dataArray: any[],
      field: string,
    ): Array<{ value: string; label: string }> => {
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

    const fieldsToFilter = [
      'Status',
      'DateStatus',
      'BillTypeNewText',
      'BillCode',
      'NCC',
      'CustomerName',
      'DepartmentName',
      'Deliver',
      'Reciver',
      'CreatDate',
      'CreatedBy',
      'WarehouseType',
    ];

    const columns = this.angularGridMaster.slickGrid.getColumns();
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
    this.columnDefinitionsMaster.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    this.angularGridMaster.slickGrid.setColumns(
      this.angularGridMaster.slickGrid.getColumns(),
    );
  }
}
