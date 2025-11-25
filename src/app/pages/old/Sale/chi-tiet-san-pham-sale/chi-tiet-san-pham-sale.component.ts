import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  Inject,
  Optional,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
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

import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { environment } from '../../../../../environments/environment';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ChiTieitSanPhamSaleService } from './chi-tieit-san-pham-sale.service';
import { CommonModule } from '@angular/common';
import { BillImportDetailComponent } from '../BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { BillExportDetailComponent } from '../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { MenuEventService } from '../../../systems/menus/menu-service/menu-event.service';
import { NgZone } from '@angular/core';
@Component({
  selector: 'app-chi-tiet-san-pham-sale',
  imports: [
    CommonModule,
    NzSelectModule,
    NzSplitterModule,
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
    NzCardModule,
    FormsModule,
    HasPermissionDirective,
  ],
  templateUrl: './chi-tiet-san-pham-sale.component.html',
  styleUrls: ['./chi-tiet-san-pham-sale.component.css'],
})
export class ChiTietSanPhamSaleComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('tbl_DataImport', { static: true }) tbl_DataImport!: any;
  @ViewChild('tbl_DataExport', { static: true }) tbl_DataExport!: any;
  @ViewChild('tbl_DataRequestImport', { static: true })
  tbl_DataRequestImport!: any;
  @ViewChild('tbl_DataRequestExport', { static: true })
  tbl_DataRequestExport!: any;
  @ViewChild('tbl_Data', { static: true }) tbl_Data!: any;

  @Input() code: string = '';
  @Input() suplier: string = '';
  @Input() productName: string = '';
  @Input() numberDauKy: string = '';
  @Input() numberCuoiKy: string = '';
  @Input() import: string = '';
  @Input() export: string = '';
  @Input() productSaleID: number = 0;
  @Input() wareHouseCode: string = '';
  @Input() oProductSaleModel: any;

  constructor(
    private srv: ChiTieitSanPhamSaleService,
    private notificationService: NzNotificationService,
    private modalService: NgbModal,
    private menuEventService: MenuEventService,
    private zone: NgZone,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    // When opened from inventory via menuEventService, data comes through injector
    if (this.tabData) {
      console.log('tabData received in constructor:', this.tabData);

      this.code = this.tabData.code || '';
      this.suplier = this.tabData.suplier || '';
      this.productName = this.tabData.productName || '';
      this.numberDauKy = this.tabData.numberDauKy || '';
      this.numberCuoiKy = this.tabData.numberCuoiKy || '';
      this.import = this.tabData.import || '';
      this.export = this.tabData.export || '';
      this.productSaleID = this.tabData.productSaleID || 0;
      this.wareHouseCode = this.tabData.wareHouseCode || '';
      this.oProductSaleModel = this.tabData.oProductSaleModel;

      console.log('Properties set from tabData:', {
        productSaleID: this.productSaleID,
        wareHouseCode: this.wareHouseCode,
        code: this.code,
        productName: this.productName
      });
    }
  }
  dtProduct: any[] = [];
  dtImport: any[] = [];
  dtExport: any[] = [];
  dtRequestImport: any[] = [];
  dtRequestExport: any[] = [];
  dtHold: any[] = [];
  dtCbProduct: any[] = [];
  warehouse: any;
  table_DataImport!: Tabulator;
  table_DataExport!: Tabulator;
  table_DataRequestImport!: Tabulator;
  table_DataRequestExport!: Tabulator;
  table_Data!: Tabulator;
  title: string = 'LỊCH SỬ NHẬP XUẤT SẢN PHẨM';

  // Calculated totals
  totalImport: number = 0;
  totalExport: number = 0;
  totalRequestExport: number = 0;
  totalKeep: number = 0;
  totalLast: number = 0;

  ngOnInit() {
    console.log('ngOnInit called');
    console.log('ngOnInit - productSaleID:', this.productSaleID);
    console.log('ngOnInit - wareHouseCode:', this.wareHouseCode);

    // Data will be loaded in ngAfterViewInit after tables are initialized
  }

  ngOnChanges(changes: SimpleChanges) {
    // This is called when @Input values change
    console.log('ngOnChanges called', changes);
    console.log('All inputs:', {
      productSaleID: this.productSaleID,
      wareHouseCode: this.wareHouseCode,
      code: this.code,
      productName: this.productName,
      numberDauKy: this.numberDauKy,
      numberCuoiKy: this.numberCuoiKy,
      import: this.import,
      export: this.export,
      suplier: this.suplier,
      oProductSaleModel: this.oProductSaleModel
    });

    // Update from oProductSaleModel if provided (has priority)
    if (changes['oProductSaleModel'] && this.oProductSaleModel) {
      console.log('oProductSaleModel received:', this.oProductSaleModel);

      // Try to access ProductSaleID (capital P)
      if (this.oProductSaleModel.ProductSaleID !== undefined) {
        this.productSaleID = this.oProductSaleModel.ProductSaleID;
        console.log('Set productSaleID from oProductSaleModel.ProductSaleID:', this.productSaleID);
      }
      // Try productSaleID (lowercase p)
      else if (this.oProductSaleModel.productSaleID !== undefined) {
        this.productSaleID = this.oProductSaleModel.productSaleID;
        console.log('Set productSaleID from oProductSaleModel.productSaleID:', this.productSaleID);
      }
    }

    // Check for direct productSaleID input
    if (changes['productSaleID'] && this.productSaleID) {
      console.log('Direct productSaleID input:', this.productSaleID);
    }

    // Check for wareHouseCode input
    if (changes['wareHouseCode'] && this.wareHouseCode) {
      console.log('Direct wareHouseCode input:', this.wareHouseCode);
    }

    console.log('Final values - productSaleID:', this.productSaleID, 'wareHouseCode:', this.wareHouseCode);

    // Check if productSaleID or wareHouseCode changed and both have values
    if ((changes['productSaleID'] || changes['wareHouseCode'] || changes['oProductSaleModel']) &&
        this.productSaleID && this.wareHouseCode) {
      console.log('Conditions met, will load data');
      // Only load if tables are already initialized
      if (this.table_DataImport) {
        console.log('Tables initialized, calling loaddata()');
        this.loaddata();
      } else {
        console.log('Tables not initialized yet, will load in ngAfterViewInit');
      }
    } else {
      console.log('Conditions not met:', {
        hasChanges: !!(changes['productSaleID'] || changes['wareHouseCode'] || changes['oProductSaleModel']),
        productSaleID: this.productSaleID,
        wareHouseCode: this.wareHouseCode
      });
    }
  }

  ngAfterViewInit() {
    // Initialize tables after view is ready
    this.initializeTables();

    // Load data if inputs are already set
    console.log('ngAfterViewInit - productSaleID:', this.productSaleID);
    console.log('ngAfterViewInit - wareHouseCode:', this.wareHouseCode);

    if (this.productSaleID && this.wareHouseCode) {
      this.loaddata();
    }
  }

  // Load product dropdown and data
  loaddata() {
    this.srv
      .getHistoryImportExportProductSale(this.productSaleID, this.wareHouseCode)
      .subscribe({
        next: (res: any) => {
          if (res.status === 1 && res.data) {
            this.dtProduct = res.data.dtProduct || [];
            this.dtImport = res.data.dtImport || [];
            this.dtExport = res.data.dtExport || [];
            this.dtRequestImport = res.data.dtRequestImport || [];
            this.dtRequestExport = res.data.dtRequestExport || [];
            this.dtHold = res.data.dtHold || [];
            this.dtCbProduct = res.data.dtCbProduct || [];

            // Fill product information from dtProduct
            if (this.dtProduct && this.dtProduct.length > 0) {
              const product = this.dtProduct[0];
              this.productName = product.ProductName || '';
              this.code = product.ProductCode || '';
              this.numberDauKy = product.TotalQuantityFirst?.toString() || '0';
              this.numberCuoiKy = product.TotalQuantityLast?.toString() || '0';
              this.import = product.TotalImport?.toString() || '0';
              this.export = product.TotalExport?.toString() || '0';

              console.log('Product info filled:', {
                productName: this.productName,
                code: this.code,
                numberDauKy: this.numberDauKy,
                numberCuoiKy: this.numberCuoiKy
              });
            }

            console.log('res data', res.data) ;
            console.log('res dtProduct', res.data.dtProduct) ;
            console.log('res dtImport', res.data.dtImport) ;
            console.log('res dtExport', res.data.dtExport) ;
            console.log('res dtRequestImport', res.data.dtRequestImport) ;
            console.log('res dtRequestExport', res.data.dtRequestExport) ;
            console.log('res dtHold', res.data.dtHold) ;

            // Update tables with new data
            this.updateTableData();
          }
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.notificationService.error('Lỗi', err.error.message||'Không thể tải dữ liệu lịch sử nhập xuất sản phẩm.');
        }
      });
  }

  // Update table data after loading
  updateTableData() {
    if (this.table_DataImport) {
      this.table_DataImport.replaceData(this.dtImport);
    }
    if (this.table_DataExport) {
      this.table_DataExport.replaceData(this.dtExport);
    }
    if (this.table_DataRequestExport) {
      this.table_DataRequestExport.replaceData(this.dtRequestExport);
    }
    if (this.table_DataRequestImport) {
      this.table_DataRequestImport.replaceData(this.dtRequestImport);
    }
    if (this.table_Data) {
      this.table_Data.replaceData(this.dtHold);
    }

    // Calculate totals after updating data
    this.calculator();
  }

  // Calculate totals similar to C# Calculator function
  calculator() {
    // Sum Qty from Import table
    this.totalImport = this.dtImport.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);

    // Sum Qty from Export table
    this.totalExport = this.dtExport.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);

    // Sum Qty from Request Export table
    this.totalRequestExport = this.dtRequestExport.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);

    // Sum TotalQuantityRemain from Hold table
    this.totalKeep = this.dtHold.reduce((sum, row) => sum + (parseFloat(row.TotalQuantityRemain) || 0), 0);

    // Calculate final total: NumberDauKy + Import - Export - RequestExport - Keep
    const numberDauKy = parseFloat(this.numberDauKy) || 0;
    this.totalLast = numberDauKy + this.totalImport - this.totalExport - this.totalRequestExport - this.totalKeep;
  }

  // Handle product selection change
  onProductChange(productSaleID: number) {
    if (productSaleID) {
      this.productSaleID = productSaleID;

      // Find selected product in dropdown to get product name
      const selectedProduct = this.dtCbProduct.find(p => p.ProductSaleID === productSaleID);
      if (selectedProduct) {
        this.productName = selectedProduct.ProductName || selectedProduct.productname || '';
        this.code = selectedProduct.ProductCode || selectedProduct.productcode || '';
      }

      this.loaddata();
    }
  }

  // Refresh data
  refreshData() {
    this.loaddata();
  }

  // Open BillImportDetail modal
  openBillImportDetail(rowData: any) {
    console.log('rowdataa',rowData);

    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu giống như BillImportComponent
    modalRef.componentInstance.newBillImport = rowData;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.id = rowData.ID || rowData.id || 0;
    modalRef.componentInstance.wareHouseCode = this.wareHouseCode;

    // Reload data after modal closes
    modalRef.result.finally(() => {
      this.loaddata();
    });
  }

  // Open BillExportDetail modal
  openBillExportDetail(rowData: any) {
        console.log('rowdataa',rowData);
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu giống như BillExportComponent
    modalRef.componentInstance.newBillExport = rowData;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.id = rowData.ID || rowData.id || 0;
    modalRef.componentInstance.warehouseCode = this.wareHouseCode;

    // Reload data after modal closes
    modalRef.result.catch((result) => {
      if (result == true) {
        this.loaddata();
      }
    });
  }
  initializeTables() {
    // Context menu for import tables
    const contextMenuImport = [
      {
        label: '<i class="fa fa-eye"></i> Xem chi tiết',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.openBillImportDetail(rowData);
        }
      }
    ];

    // Context menu for export tables
    const contextMenuExport = [
      {
        label: '<i class="fa fa-eye"></i> Xem chi tiết',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.openBillExportDetail(rowData);
        }
      }
    ];

    // Table 1: Phiếu nhập
    if (!this.table_DataImport) {
      this.table_DataImport = new Tabulator(this.tbl_DataImport.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dtImport,
        height: '100%',
        layout: 'fitDataStretch',
        pagination: false,
        rowHeader: false,
        rowContextMenu: contextMenuImport,
        columns: [
          {
            title: 'Trạng thái',
            field: 'BillTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Số phiếu',
            field: 'BillImportCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Ngày nhập',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Người nhận',
            field: 'Reciver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhà cung cấp',
            field: 'Suplier',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Dự án',
            field: 'Project',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhận chứng từ',
            field: 'Status',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'Ngày nhận CT',
            field: 'DateStatus',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
            },
          },
        ],
      });

      // Add double-click event for import table
      this.table_DataImport.on('rowDblClick', (_e: any, row: RowComponent) => {
        const rowData = row.getData();
        this.openBillImportDetail(rowData);
      });
    }

    // Table 2: Phiếu xuất
    if (!this.table_DataExport) {
      this.table_DataExport = new Tabulator(this.tbl_DataExport.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dtExport,
        height: '100%',
        layout: 'fitDataStretch',
        pagination: false,
        rowHeader: false,
        rowContextMenu: contextMenuExport,
        rowFormatter: (row) => {
          const data = row.getData();
          const remain = parseFloat(data['Remain']) || 0;
          const status = data['Status'] || 0;
            console.log('statuscc',status);
            console.log('remain',remain);

          if (remain > 0 && status == 0) {
            row.getElement().style.backgroundColor = '#FFFF00';
          }
        },
        columns: [
          {
            title: 'Trạng thái',
            field: 'nameStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Số phiếu',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Ngày xuất',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Người nhận',
            field: 'Receiver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Số lượng trả',
            field: 'ReturnAmount',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Số lượng chưa trả',
            field: 'Remain',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Dự án',
            field: 'Project',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhận chứng từ',
            field: 'IsApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'Ngày nhận CT',
            field: 'DateStatusE',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
            },
          },
        ],
      });

      // Add double-click event for export table
      this.table_DataExport.on('rowDblClick', (_e: any, row: RowComponent) => {
        const rowData = row.getData();
        this.openBillExportDetail(rowData);
      });
    }

    // Table 3: Phiếu yêu cầu xuất
    if (!this.table_DataRequestExport) {
      this.table_DataRequestExport = new Tabulator(this.tbl_DataRequestExport.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dtRequestExport,
        height: '100%',
        layout: 'fitDataStretch',
        pagination: false,
        rowHeader: false,
        rowContextMenu: contextMenuExport,
        columns: [
          {
            title: 'Trạng thái',
            field: 'nameStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Số phiếu',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Ngày xuất',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Người nhận',
            field: 'Receiver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Số lượng trả',
            field: 'ReturnAmount',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Số lượng chưa trả',
            field: 'Remain',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Dự án',
            field: 'Project',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhận chứng từ',
            field: 'IsApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'Ngày nhận CT',
            field: 'DateStatusE',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
            },
          },
        ],
      });

      // Add double-click event for request export table
      this.table_DataRequestExport.on('rowDblClick', (_e: any, row: RowComponent) => {
        const rowData = row.getData();
        this.openBillExportDetail(rowData);
      });
    }

    // Table 4: Phiếu yêu cầu nhập
    if (!this.table_DataRequestImport) {
      this.table_DataRequestImport = new Tabulator(this.tbl_DataRequestImport.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dtRequestImport,
        height: '100%',
        layout: 'fitDataStretch',
        pagination: false,
        rowHeader: false,
        rowContextMenu: contextMenuImport,
        columns: [
          {
            title: 'Trạng thái',
            field: 'BillTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Số phiếu',
            field: 'BillImportCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Ngày nhập',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Người nhận',
            field: 'Reciver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhà cung cấp',
            field: 'Suplier',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Dự án',
            field: 'Project',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhận chứng từ',
            field: 'Status',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'Ngày nhận CT',
            field: 'DateStatus',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
            },
          },
        ],
      });

      // Add double-click event for request import table
      this.table_DataRequestImport.on('rowDblClick', (_e: any, row: RowComponent) => {
        const rowData = row.getData();
        this.openBillImportDetail(rowData);
      });
    }

    // Table 5: Hàng giữ
    if (!this.table_Data) {
      this.table_Data = new Tabulator(this.tbl_Data.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dtHold,
        height: '100%',
        layout: 'fitDataStretch',
        pagination: false,
        rowHeader: false,
        columns: [
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
            bottomCalc: 'count',
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            frozen: true,
          },
          {
            title: 'Mã nội bộ',
            field: 'ProductNewCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'ĐVT',
            field: 'Unit',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Vị trí',
            field: 'AddressBox',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'SL giữ',
            field: 'Quantity',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'SL xuất',
            field: 'TotalQuantityExport',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'SL còn lại',
            field: 'TotalQuantityRemain',
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Mã dự án',
            field: 'ProjectCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên dự án',
            field: 'ProjectName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã POKH',
            field: 'POCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Số POKH',
            field: 'PONumber',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã NV',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên NV',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
            },
          },
        ],
      });
    }
  }
}
