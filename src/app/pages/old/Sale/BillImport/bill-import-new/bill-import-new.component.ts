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
import { BillImportServiceService } from '../bill-import-service/bill-import-service.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { ActivatedRoute } from '@angular/router';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { BillImportDetailComponent } from '../Modal/bill-import-detail/bill-import-detail.component';
import { HistoryDeleteBillComponent } from '../../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { ScanBillImportComponent } from '../Modal/scan-bill-import/scan-bill-import.component';
import { environment } from '../../../../../../environments/environment';

interface BillImport {
  Id?: number;
  BillImportCode: string;
  ReciverID: number;
  Reciver: string;
  DeliverID: number;
  Deliver: string;
  KhoTypeID: number;
  KhoType: string;
  WarehouseID: number;
  BillTypeNew: number;
  SupplierID: number;
  Supplier: string;
  RulePayID: number;
  CreatDate: Date | string;
  RequestDate: Date | string;
}

@Component({
  selector: 'app-bill-import-new',
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
    HasPermissionDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-import-new.component.html',
  styleUrls: ['./bill-import-new.component.css']
})
export class BillImportNewComponent implements OnInit {
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
  wareHouseCode: string = 'HN';
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
  selectBillImport: any[] = [];

  searchParams = {
    dateStart: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    })(),
    dateEnd: (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    })(),
    listproductgroupID: '',
    status: -1,
    warehousecode: this.wareHouseCode,
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 99999999,
  };

  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];

  newBillImport: BillImport = {
    BillImportCode: '',
    ReciverID: 0,
    Reciver: '',
    DeliverID: 0,
    Deliver: '',
    KhoType: '',
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: '',
    CreatDate: new Date(),
    RequestDate: new Date(),
    RulePayID: 0,
  };

  constructor(
    private billImportService: BillImportServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.wareHouseCode = params['warehouseCode'] || 'HN';
      this.searchParams.warehousecode = this.wareHouseCode;
    });

    this.initGrids();
    this.getProductGroup();
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
        id: 'Status',
        name: 'Nhận chứng từ',
        field: 'Status',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: Formatters.checkmarkMaterial,
        filter: { model: Filters['singleSelect'], collection: [
          { value: '', label: '' },
          { value: true, label: 'Đã nhận' },
          { value: false, label: 'Chưa nhận' }
        ]},
        cssClass: 'text-center'
      },
      {
        id: 'DateStatus',
        name: 'Ngày nhận / Hủy',
        field: 'DateStatus',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'BillTypeText',
        name: 'Loại phiếu',
        field: 'BillTypeText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'DateRequestImport',
        name: 'Ngày Y/c nhập',
        field: 'DateRequestImport',
        sortable: true,
        filterable: true,
            width: 130,
            formatter: Formatters.date,
            exportCustomFormatter: Formatters.date,
            type: 'date',
            params: { dateFormat: 'DD/MM/YYYY' },
            filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'BillImportCode',
        name: 'Số phiếu',
        field: 'BillImportCode',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Suplier',
        name: 'Nhà cung cấp / Bộ phận',
        field: 'Suplier',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Code',
        name: 'Mã NV',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Deliver',
        name: 'Người giao / Người trả',
        field: 'Deliver',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Reciver',
        name: 'Người nhận',
        field: 'Reciver',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'KhoType',
        name: 'Loại vật tư',
        field: 'KhoType',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'WarehouseName',
        name: 'Kho',
        field: 'WarehouseName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'IsSuccessText',
        name: 'Tình trạng hồ sơ',
        field: 'IsSuccessText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        sortable: true,
        filterable: true,
        width: 150,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'DoccumentReceiver',
        name: 'Người nhận / Hủy CT',
        field: 'DoccumentReceiver',
        sortable: true,
        filterable: true,
        width: 180,
        filter: { model: Filters['compoundInputText'] }
      },
    ];

    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-master',
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

      frozenColumn: 2,
    };
  }

  initDetailGrid(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'ProductCode',
        name: 'Mã hàng',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'ProductName',
        name: 'Chi tiết sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] }
      },
            {
        id: 'SerialNumber',
        name: 'Serial Number',
        field: 'SerialNumber',
        sortable: true,
        filterable: true,
        width: 300,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
        cssClass: 'text-center'
      },
      {
        id: 'ProjectCode',
        name: 'Mã theo dự án',
        field: 'ProjectCode',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Qty',
        name: 'SL thực tế',
        field: 'Qty',
        sortable: true,
        filterable: true,
        width: 100,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'SomeBill',
        name: 'Hóa đơn',
        field: 'SomeBill',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        field: 'DateSomeBill',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'ProductGroupName',
        name: 'Loại hàng',
        field: 'ProductGroupName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'ProjectCodeText',
        name: 'Mã dự án',
        field: 'ProjectCodeText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'ProjectNameText',
        name: 'Tên dự án',
        field: 'ProjectNameText',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'CustomerFullName',
        name: 'Khách hàng',
        field: 'CustomerFullName',
        sortable: true,
        filterable: true,
        width: 200,
        filter: { model: Filters['compoundInputText'] }
      },
       {
        id: 'BillCode',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'Note',
        name: 'Ghi chú (PO)',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
            {
        id: 'DealineQC',
        name: 'Hạn QC',
        field: 'DealineQC',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
            {
        id: 'StatusQCText',
        name: 'Trạng thái QC',
        field: 'StatusQCText',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] }
      },
    ];

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
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

  onMasterRowSelectionChanged(event: Event, args: OnSelectedRowsChangedEventArgs): void {
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

      const params = {
        ...this.searchParams,
        pageNumber: query?.pagination?.pageNumber || 1,
        pageSize: query?.pagination?.pageSize || 50,
      };

      this.billImportService.getBillImport(params).subscribe({
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
            err?.error?.message || 'Không thể tải dữ liệu phiếu nhập'
          );
          reject(err);
        },
      });
    });
  }

  loadDataBillImport(): void {
    this.isLoadTable = true;
    this.billImportService.getBillImport(this.searchParams).subscribe({
      next: (res) => {
        this.isLoadTable = false;
        if (res.status === 1 && res.data) {
          this.datasetMaster = res.data.map((item: any) => ({
            ...item,
            id: item.ID
          }));
          this.applyDistinctFiltersToMaster();
        }
      },
      error: (err) => {
        this.isLoadTable = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Không thể tải dữ liệu phiếu nhập'
        );
      },
    });
  }

  getBillImportDetail(id: number): void {
    this.isDetailLoad = true;
    this.billImportService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.datasetDetail = res.data || [];
        this.datasetDetail = this.datasetDetail.map((item: any) => ({
          ...item,
          id: item.ID
        }));    
        this.isDetailLoad = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Có lỗi xảy ra khi lấy chi tiết'
        );
        this.isDetailLoad = false;
      },
    });
  }

  getBillImportByID(ids: number): void {
    this.billImportService.getBillImportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillImport = res.data;
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Lỗi'
          );
        }
      },
    });
  }

  getProductGroup(): void {
    this.billImportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID ?? 0
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            this.selectedKhoTypes = this.dataProductGroup.map((item) => item.ID);
            this.searchParams.listproductgroupID = this.selectedKhoTypes.join(',');
            this.loadDataBillImport();
          } else {
            this.searchParams.listproductgroupID = '';
            this.loadDataBillImport();
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy nhóm vật tư', err);
          this.searchParams.listproductgroupID = '';
          this.loadDataBillImport();
        },
      });
  }

  // =================================================================
  // ACTIONS
  // =================================================================

  searchData(): void {
    this.loadDataBillImport();
  }

  // resetform(): void {
  //   this.selectedKhoTypes = [];
  //   const dateStart = new Date();
  //   dateStart.setMonth(dateStart.getMonth() - 1);
  //   dateStart.setHours(0, 0, 0, 0);

  //   const dateEnd = new Date();
  //   dateEnd.setHours(23, 59, 59, 999);

  //   this.searchParams = {
  //     dateStart: dateStart.toISOString(),
  //     dateEnd: dateEnd.toISOString(),
  //     listproductgroupID: '',
  //     status: -1,
  //     warehousecode: this.wareHouseCode,
  //     keyword: '',
  //     checkAll: false,
  //     pageNumber: 1,
  //     pageSize: 50,
  //   };
  //   this.loadDataBillImport();
  // }

  // toggleSearchPanel(): void {
  //   this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  // }

  // onCheckboxChange(): void {
  //   this.loadDataBillImport();
  // }

  // onDateStartChange(date: any): void {
  //   if (date) {
  //     const d = new Date(date);
  //     d.setHours(0, 0, 0, 0);
  //     this.searchParams.dateStart = d.toISOString();
  //   }
  // }

  // onDateEndChange(date: any): void {
  //   if (date) {
  //     const d = new Date(date);
  //     d.setHours(23, 59, 59, 999);
  //     this.searchParams.dateEnd = d.toISOString();
  //   }
  // }

  // onKhoTypeChange(selected: number[]): void {
  //   this.selectedKhoTypes = selected;
  //   this.searchParams.listproductgroupID = selected.join(',');
  // }

  // updateTabDetailTitle(): void {
  //   if (this.selectedRow) {
  //     this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillImportCode || ''}`;
  //   } else {
  //     this.tabDetailTitle = 'Thông tin phiếu nhập';
  //   }
  // }

  // =================================================================
  // MODAL ACTIONS
  // =================================================================

  openModalBillImportDetail(ischeckmode: boolean): void {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 phiếu nhập để sửa');
      this.id = 0;
      return;
    }
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.WarehouseCode = this.wareHouseCode;

    modalRef.result.finally(() => {
      this.id = 0;
      this.loadDataBillImport();
    });
  }

  // openModalScanBill(): void {
  //   const modalRef = this.modalService.open(ScanBillImportComponent, {
  //     centered: true,
  //     size: 'xl',
  //     backdrop: 'static',
  //     keyboard: false,
  //   });

  //   modalRef.result.catch((result) => {
  //     if (result == true) {
  //       this.id = 0;
  //       this.loadDataBillImport();
  //     }
  //   });
  // }

  openModalHistoryDeleteBill(): void {
    const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.billImportID = this.id;
    modalRef.componentInstance.billType = 1;
    modalRef.result.catch((result) => {
      if (result == true) {
        // Reload if needed
      }
    });
  }

  // convertExport(): void {
  //   const selectedRows = this.getSelectedRows();

  //   if (!selectedRows || selectedRows.length === 0) {
  //     this.notification.info(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng chọn ít nhất một phiếu nhập để chuyển đổi!'
  //     );
  //     return;
  //   }

  //   const lstBillImportID: number[] = selectedRows
  //     .map((row: any) => row.ID)
  //     .filter((id: number) => id > 0);

  //   if (lstBillImportID.length === 0) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Không tìm thấy phiếu nhập hợp lệ để chuyển đổi!'
  //     );
  //     return;
  //   }

  //   const firstBillImport = selectedRows[0];

  //   import('../../BillExport/Modal/bill-export-detail/bill-export-detail.component')
  //     .then((m) => {
  //       const modalRef = this.modalService.open(m.BillExportDetailComponent, {
  //         centered: true,
  //         size: 'xl',
  //         backdrop: 'static',
  //         keyboard: false,
  //       });

  //       modalRef.componentInstance.lstBillImportID = lstBillImportID;
  //       modalRef.componentInstance.wareHouseCode = this.wareHouseCode;
  //       modalRef.componentInstance.billImport = firstBillImport;
  //       modalRef.componentInstance.checkConvert = false;
  //       modalRef.componentInstance.isAddExport = false;

  //       modalRef.result.catch((result) => {
  //         if (result === true) {
  //           this.loadDataBillImport();
  //         }
  //       });
  //     })
  //     .catch((err) => {
  //       console.error('Error loading BillExportDetailComponent:', err);
  //       this.notification.error(
  //         NOTIFICATION_TITLE.error,
  //         err?.error?.message || 'Không thể mở form chuyển đổi phiếu xuất!'
  //       );
  //     });
  // }

  IsApproved(apr: boolean): void {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 phiếu để nhận chứng từ!'
      );
      return;
    }

    for (const bill of selectedRows) {
      if (bill.Approved == false && apr == false) {
        this.notification.info(
          NOTIFICATION_TITLE.warning,
          `Phiếu ${bill.BillImportCode} chưa nhận chứng từ, không thể hủy!`
        );
        return;
      }

      if (bill.BillTypeNew === 4) {
        this.notification.info(
          NOTIFICATION_TITLE.warning,
          `Không thể thao tác với phiếu Yêu cầu nhập kho ${bill.BillImportCode}!`
        );
        return;
      }
    }

    const billsWithDetails = selectedRows.map((bill: any) => ({
      ...bill,
      billImportDetails: this.datasetDetail,
    }));

    this.billImportService.approved(billsWithDetails, apr).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Thành công!'
          );
          this.loadDataBillImport();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Có lỗi xảy ra!');
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      },
    });
  }

  updateDocumentStatus(status: boolean): void {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một phiếu để cập nhật!'
      );
      return;
    }

    const receiverID = this.selectedRow['DoccumentReceiverID'];

    if (receiverID !== this.appUserService.id && !this.appUserService.isAdmin) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bạn không có quyền cập nhật trạng thái hồ sơ chứng từ này!\nChỉ admin hoặc người nhận hồ sơ mới có thể cập nhật.'
      );
      return;
    }

    const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật trạng thái hồ sơ chứng từ thành <strong>"${statusText}"</strong>?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.callApiUpdateDocumentStatus([this.id], status);
      },
    });
  }

  private callApiUpdateDocumentStatus(billIDs: number[], status: boolean): void {
    const payload = billIDs.map((id) => {
      const bill = this.datasetMaster.find((b) => b.ID === id);
      return {
        ID: id,
        DoccumentReceiverID: bill?.DoccumentReceiverID || null,
      };
    });

    this.billImportService.approveDocumentImport(payload, status).subscribe({
      next: (res: any) => {
        if (res?.success) {
          const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || `Cập nhật trạng thái hồ sơ chứng từ thành "${statusText}" thành công!`
          );
          this.loadDataBillImport();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Cập nhật trạng thái thất bại!'
          );
        }
      },
      error: (err: any) => {
        console.error('Error updating document status:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái hồ sơ chứng từ!'
        );
      },
    });
  }

  openFolderPath(): void {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một phiếu để mở thư mục!'
      );
      return;
    }

    const code = this.selectedRow['BillImportCode'];
    const creatDate = this.selectedRow['CreatDate'];

    if (!code) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy mã phiếu nhập!'
      );
      return;
    }

    let year: number;
    if (creatDate) {
      const date = new Date(creatDate);
      year = date.getFullYear();
    } else {
      year = new Date().getFullYear();
    }

    const billtypeText: string = 'PhieuNhapKho';
    const path = `${environment.host}api/share/software/test/VP.${this.wareHouseCode}/${billtypeText}/${year}/${code}`;
    window.open(path, '_blank');
  }

  // =================================================================
  // HELPER METHODS
  // =================================================================

  private getSelectedRows(): any[] {
    if (!this.angularGridMaster) return [];

    const selectedIndexes = this.angularGridMaster.slickGrid?.getSelectedRows() || [];
    return selectedIndexes.map((index: number) =>
      this.angularGridMaster.dataView.getItem(index)
    ).filter((item: any) => item);
  }

  // TODO: Implement export Excel functionality using ExcelJS or SlickGrid export
  async exportExcel(): Promise<void> {
    this.notification.info(NOTIFICATION_TITLE.warning, 'Chức năng đang được phát triển!');
    // Implement ExcelJS export logic here
  }

  // =================================================================
  // ADDITIONAL UI AND DATA METHODS
  // =================================================================

  dateFormat = 'dd/MM/yyyy';
  checked: any = false;

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onCheckboxChange() {
    this.loadDataBillImport();
  }

  onDateStartChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      this.searchParams.dateStart = d.toISOString();
    }
  }

  onDateEndChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      this.searchParams.dateEnd = d.toISOString();
    }
  }

  resetform(): void {
    this.selectedKhoTypes = [];
    const dateStart = new Date();
    dateStart.setMonth(dateStart.getMonth() - 1);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    this.searchParams = {
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      listproductgroupID: '',
      status: -1,
      warehousecode: this.wareHouseCode,
      keyword: '',
      checkAll: false,
      pageNumber: 1,
      pageSize: 99999999,
    };
    this.loadDataBillImport();
  }

  onSearch() {
    this.loadDataBillImport();
  }

  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }

  closePanel() {
    this.sizeTbDetail = '0';
  }

  updateTabDetailTitle(): void {
    if (this.selectedRow?.BillImportCode) {
      this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillImportCode}`;
    } else {
      this.tabDetailTitle = 'Thông tin phiếu nhập';
    }
  }

  // =================================================================
  // MODAL AND ACTION METHODS
  // =================================================================

  openModalScanBill() {
    import('../Modal/scan-bill-import/scan-bill-import.component').then(m => {
      const modalRef = this.modalService.open(m.ScanBillImportComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      });

      modalRef.result.catch((result) => {
        if (result == true) {
          this.id = 0;
          this.loadDataBillImport();
        }
      });
    });
  }

  openModalBillDocumentImport() {
    let importId = this.id;
    let code = '';

    if (!importId || importId === 0) {
      const selectedRows = this.getSelectedRows();
      if (selectedRows.length > 0) {
        importId = selectedRows[0]?.ID || 0;
        code = selectedRows[0]?.BillImportCode || '';
      }
    }

    if (!importId || importId === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }

    if (!code && this.selectedRow) {
      code = this.selectedRow?.BillImportCode || '';
    }

    import('../Modal/bill-document-import/bill-document-import.component').then(m => {
      const modalRef = this.modalService.open(m.BillDocumentImportComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      });
      modalRef.componentInstance.id = importId;
      modalRef.componentInstance.code = code;
      modalRef.result.catch((result) => {
        if (result == true) {
          this.id = 0;
          this.loadDataBillImport();
        }
      });
    });
  }

  openModalBillImportSynthetic() {
    import('../Modal/bill-import-synthetic/bill-import-synthetic.component').then(m => {
      const modalRef = this.modalService.open(m.BillImportSyntheticComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        fullscreen: true,
      });

      modalRef.result.catch((result) => {
        if (result == true) {
          // this.id=0;
          // this.loadDataBillImport();
        }
      });
    });
  }

  deleteBillImport() {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 phiếu muốn xóa!'
      );
      return;
    }

    // Kiểm tra từng phiếu có được duyệt không
    const approvedBills = selectedRows.filter((bill) => bill.Status == true);
    if (approvedBills.length > 0) {
      const approvedBillCodes = approvedBills
        .map((bill) => bill.BillImportCode)
        .join(', ');
      this.notification.warning(
        'Thông báo',
        `Các phiếu đã được duyệt không thể xóa: ${approvedBillCodes}`
      );
      return;
    }

    // Chỉ lấy các phiếu chưa duyệt để xóa
    const billsToDelete = selectedRows.filter((bill) => bill.Status != true);

    if (billsToDelete.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có phiếu nào hợp lệ để xóa!'
      );
      return;
    }

    const payload = billsToDelete.map((bill) => ({
      billImport: {
        ID: bill.ID,
        IsDeleted: true,
      },
      billImportDetail: [],
      DeletedDetailIDs: [],
      billDocumentImports: [],
    }));

    const billCodes = billsToDelete
      .map((bill) => bill.BillImportCode)
      .join(', ');

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${billsToDelete.length} phiếu: ${billCodes} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.billImportService.saveBillImport(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa thành công ${billsToDelete.length} phiếu!`
              );
              this.loadDataBillImport();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Xóa thất bại!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Thông báo',
              err.error.message || 'Có lỗi xảy ra khi xóa dữ liệu!'
            );
          },
        });
      },
    });
  }

  onExportExcel() {
    if (!this.id || this.id === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xuất file'
      );
      return;
    }

    const selectedHandover = this.datasetMaster.find((item) => item.ID === this.id);
    if (!selectedHandover) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy bản ghi được chọn'
      );
      return;
    }

    this.billImportService.export(this.id).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        const now = new Date();
        const dateString = `${now.getDate().toString().padStart(2, '0')}_${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}_${now.getFullYear()}`;
        const fileName = `Phiếu nhập - ${selectedHandover.BillImportCode || 'export'
          }_${dateString}.xlsx`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi xuất file.'
        );
        console.error(err);
      },
    });
  }

  onExportExcelKT() {
    if (!this.id || this.id === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xuất file'
      );
      return;
    }

    const selectedBill = this.datasetMaster.find((item) => item.ID === this.id);
    if (!selectedBill) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy bản ghi được chọn'
      );
      return;
    }

    this.billImportService.exportExcelKT(this.id).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        const now = new Date();
        const dateString =
          now.getDate().toString().padStart(2, '0') +
          '_' +
          (now.getMonth() + 1).toString().padStart(2, '0') +
          '_' +
          now.getFullYear() +
          '_' +
          now.getHours().toString().padStart(2, '0') +
          '_' +
          now.getMinutes().toString().padStart(2, '0') +
          '_' +
          now.getSeconds().toString().padStart(2, '0');
        const fileName = `${selectedBill.BillImportCode || 'PhieuNhap'
          }_${dateString}.xls`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notification.success('Thông báo', 'Xuất file thành công!');
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi xuất file KT. ' + err.error?.message
        );
        console.error(err);
      },
    });
  }

  convertExport() {
    // Get selected rows from the grid
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một phiếu nhập để chuyển đổi!'
      );
      return;
    }

    // Get the list of bill import IDs
    const lstBillImportID: number[] = selectedRows
      .map((row: any) => row.ID)
      .filter((id: number) => id > 0);

    if (lstBillImportID.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không tìm thấy phiếu nhập hợp lệ để chuyển đổi!'
      );
      return;
    }

    // Get the first selected bill import for default values
    const firstBillImport = selectedRows[0];

    // Import BillExportDetailComponent dynamically
    import(
      '../../BillExport/Modal/bill-export-detail/bill-export-detail.component'
    )
      .then((m) => {
        const modalRef = this.modalService.open(m.BillExportDetailComponent, {
          centered: true,
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
        });

        // Pass data to the modal matching the C# form logic
        modalRef.componentInstance.lstBillImportID = lstBillImportID;
        modalRef.componentInstance.wareHouseCode = this.wareHouseCode;
        modalRef.componentInstance.billImport = firstBillImport;
        modalRef.componentInstance.checkConvert = false;
        modalRef.componentInstance.isAddExport = false;

        modalRef.result.catch((result) => {
          if (result === true) {
            this.loadDataBillImport();
          }
        });
      });
  }

  openFolderTree() {
    // Lấy dòng được chọn từ bảng
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }

    const rowData = selectedRows[0];
    const code = rowData.BillImportCode;
    const creatDate = rowData.CreatDate;

    if (!code) {
      this.notification.warning('Thông báo', 'Không tìm thấy mã phiếu!');
      return;
    }

    let year: number;
    if (creatDate) {
      const date = new Date(creatDate);
      year = date.getFullYear();
    } else {
      year = new Date().getFullYear();
    }

    const billtypeText: string = 'PhieuNhapKho';
    const path = `${environment.host}api/share/software/test/VP.${this.wareHouseCode}/${billtypeText}/${year}/${code}`;
    window.open(path, '_blank');
  }

  // =================================================================
  // DISTINCT FILTERS
  // =================================================================

  private applyDistinctFiltersToMaster(): void {
    if (!this.angularGridMaster?.slickGrid || !this.angularGridMaster?.dataView) return;

    const data = this.angularGridMaster.dataView.getItems();
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

    const fieldsToFilter = [
      'BillTypeText', 'BillImportCode', 'Suplier', 'DepartmentName', 'Code',
      'Deliver', 'Reciver', 'KhoType', 'WarehouseName', 'IsSuccessText',
      'CreatedBy', 'DoccumentReceiver'
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

    this.angularGridMaster.slickGrid.setColumns(this.angularGridMaster.slickGrid.getColumns());
  }
}
