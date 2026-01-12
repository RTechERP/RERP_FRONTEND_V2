import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  Optional,
  Inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Formatters,
} from 'angular-slickgrid';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { SplitterModule } from 'primeng/splitter';
import { CardModule } from 'primeng/card';
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { InventoryDemoService } from '../inventory-demo-service/inventory-demo.service';
import { filter, last } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BillImportTechnicalFormComponent } from '../../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import { BillExportTechnicalFormComponent } from '../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
import { BillExportTechnicalService } from '../../bill-export-technical/bill-export-technical-service/bill-export-technical.service';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  standalone: true,
  imports: [
    SplitterModule,
    CardModule,
    AngularSlickgridModule,
    NzCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NgbModalModule,
    NzSplitterModule,
    NzCardModule
  ],
  selector: 'app-material-detail-of-product-rtc',
  templateUrl: './material-detail-of-product-rtc.component.html',
  styleUrls: ['./material-detail-of-product-rtc.component.css'],
})
export class MaterialDetailOfProductRtcComponent
  implements OnInit, AfterViewInit {
  @Output() closeModal = new EventEmitter<void>();
  @Input() productRTCID1!: number;
  @Input() warehouseID1!: number;
  @Input() warehouseType: number = 1; // Mặc định là 1 (DEMO), 2 là AGV
  formDeviceInfo!: FormGroup;
  // ds nhập
  listImport: any[] = [];
  //ds xuất
  listExport: any[] = [];
  //ds mượn
  listBorrow: any[] = [];
  //ds sản phẩm
  productData: any[] = [];
  //requet gọi store
  @Input() warehouseID: number = 0;
  @Input() productRTCID: number = 0;
  @Input() ProductCode: string = '';
  @Input() ProductName: string = '';
  @Input() NumberBegin: number = 0;
  @Input() InventoryLatest: number = 0;
  @Input() NumberImport: number = 0;
  @Input() NumberExport: number = 0;
  @Input() NumberBorrowing: number = 0;
  @Input() InventoryReal: number = 0;

  // Angular SlickGrid instances
  angularGridBorrow!: AngularGridInstance;
  angularGridImport!: AngularGridInstance;
  angularGridExport!: AngularGridInstance;

  // Column definitions
  columnDefinitionsBorrow: Column[] = [];
  columnDefinitionsImport: Column[] = [];
  columnDefinitionsExport: Column[] = [];

  // Grid options
  gridOptionsBorrow: GridOption = {};
  gridOptionsImport: GridOption = {};
  gridOptionsExport: GridOption = {};

  // Datasets
  datasetBorrow: any[] = [];
  datasetImport: any[] = [];
  datasetExport: any[] = [];

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private notification: NzNotificationService,
    private inventoryDemoService: InventoryDemoService,
    private billImportTechnicalService: BillImportTechnicalService,
    private billExportTechnicalService: BillExportTechnicalService,
    private ngbModal: NgbModal,
    private route: ActivatedRoute,
    @Optional() public activeModal: NgbActiveModal,
    @Optional() @Inject('tabData') private tabData: any
  ) { }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      BillCode: ['', Validators.required],
    });
  }
  ngOnInit() {
    // Read data from query params (when opened via window.open with route)
    this.route.queryParams.subscribe((params) => {
      if (Object.keys(params).length > 0) {
        this.productRTCID1 = parseInt(params['productRTCID1'] || '0', 10);
        this.warehouseID1 = parseInt(params['warehouseID1'] || '0', 10);
        this.ProductCode = params['ProductCode'] || '';
        this.ProductName = params['ProductName'] || '';
        this.NumberBegin = parseFloat(params['NumberBegin'] || '0');
        this.InventoryLatest = parseFloat(params['InventoryLatest'] || '0');
        this.NumberImport = parseFloat(params['NumberImport'] || '0');
        this.NumberExport = parseFloat(params['NumberExport'] || '0');
        this.NumberBorrowing = parseFloat(params['NumberBorrowing'] || '0');
        this.InventoryReal = parseFloat(params['InventoryReal'] || '0');
      }
    });

    // Lấy dữ liệu từ tabData injector nếu có (override query params)
    if (this.tabData) {
      this.productRTCID1 = this.tabData.productRTCID1 || 0;
      this.warehouseID1 = this.tabData.warehouseID1 || 0;
      this.ProductCode = this.tabData.ProductCode || '';
      this.ProductName = this.tabData.ProductName || '';
      this.NumberBegin = this.tabData.NumberBegin || 0;
      this.InventoryLatest = this.tabData.InventoryLatest || 0;
      this.NumberImport = this.tabData.NumberImport || 0;
      this.NumberExport = this.tabData.NumberExport || 0;
      this.NumberBorrowing = this.tabData.NumberBorrowing || 0;
      this.InventoryReal = this.tabData.InventoryReal || 0;
    }
    this.initForm();
    this.initColumns();
  }

  close() {
    this.closeModal.emit();
    this.activeModal?.dismiss('cancel');
  }
  ngAfterViewInit() {
    this.getBorrowImportExportProductRTC();
    this.getProduct();
  }

  initColumns() {
    // Borrow columns
    this.columnDefinitionsBorrow = [
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 60,
        sortable: false,
        filterable: false,
        formatter: (row, _cell, _value, _column, _dataContext) => {
          return (row + 1).toString();
        },
      },
      {
        id: 'DateBorrow',
        field: 'DateBorrow',
        name: 'Ngày mượn',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người mượn',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'StatusText',
        field: 'StatusText',
        name: 'Trạng thái',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'NumberBorrow',
        field: 'NumberBorrow',
        name: 'Số mượn',
        width: 60,
        sortable: true,
        filterable: true,
        type: 'number',
      },
      {
        id: 'Project',
        field: 'Project',
        name: 'Dự án',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'DateReturnExpected',
        field: 'DateReturnExpected',
        name: 'Ngày trả dự kiến',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
      },
      {
        id: 'DateReturn',
        field: 'DateReturn',
        name: 'Ngày trả',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
      },

    ];

    // Import columns
    this.columnDefinitionsImport = [
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 30,
        sortable: false,
        filterable: false,
        formatter: (row, _cell, _value, _column, _dataContext) => {
          return (row + 1).toString();
        },
      },
      {
        id: 'BillCode',
        field: 'BillCode',
        name: 'Mã phiếu nhập',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'CreatDate',
        field: 'CreatDate',
        name: 'Ngày tạo',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY HH:mm:ss' },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
      },
      {
        id: 'Deliver',
        field: 'Deliver',
        name: 'Người giao',
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Suplier',
        field: 'Suplier',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: true,
        filterable: true,
      },
    ];

    // Export columns
    this.columnDefinitionsExport = [
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 30,
        sortable: false,
        filterable: false,
        formatter: (row, _cell, _value, _column, _dataContext) => {
          return (row + 1).toString();
        },
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã phiếu xuất',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'CreatedDate',
        field: 'CreatedDate',
        name: 'Ngày tạo',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY HH:mm:ss' },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
      },
      {
        id: 'Receiver',
        field: 'Receiver',
        name: 'Người nhận',
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        id: 'SupplierName',
        field: 'SupplierName',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'BillTypeText',
        field: 'BillTypeText',
        name: 'Loại phiếu',
        width: 80,
        sortable: true,
        filterable: true,
      },
    ];

    // Grid options
    this.gridOptionsBorrow = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-borrow',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableEmptyDataWarningMessage: false,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: false,
      datasetIdPropertyName: 'id',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
    };

    this.gridOptionsImport = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-import',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableEmptyDataWarningMessage: false,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: false,
      datasetIdPropertyName: 'id',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
    };

    this.gridOptionsExport = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-export',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableEmptyDataWarningMessage: false,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: false,
      datasetIdPropertyName: 'id',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
    };
  }
  getProduct() {
    const request = {
      productGroupID: 0,
      keyWord: '',
      checkAll: 1,
      warehouseID: this.warehouseID1 || 1,
      productRTCID: this.productRTCID1 || 1,
    };
    console.log('request', request);
    this.inventoryDemoService
      .getInventoryDemo(request)
      .subscribe((response: any) => {
        this.productData = response.products || [];
        this.ProductCode = response.products?.[0]?.ProductCode || '';
        this.ProductName = response.products?.[0]?.ProductName || '';
        this.NumberBegin = response.products?.[0]?.Number || 0;
        this.InventoryLatest = response.products?.[0]?.InventoryLatest || 0;
        this.NumberImport = response.products?.[0]?.NumberImport || 0;
        this.NumberExport = response.products?.[0]?.NumberExport || 0;
        this.NumberBorrowing = response.products?.[0]?.NumberBorrowing || 0;
        this.InventoryReal = response.products?.[0]?.InventoryReal || 0;
      });
  }
  getBorrowImportExportProductRTC(
    ProductID?: number,
    WarehouseID?: number
  ): void {
    this.inventoryDemoService
      .getBorrowImportExportProductRTC(this.productRTCID1, this.warehouseID1)
      .subscribe((response: any) => {
        this.listImport = response.listImport || [];
        this.listExport = response.listExport || [];
        this.listBorrow = response.listBorrow || [];

        // Format date fields and add unique IDs - tạo array mới để Angular detect thay đổi
        this.datasetImport = this.formatDataWithIds(this.listImport);
        this.datasetExport = this.formatDataWithIds(this.listExport);
        this.datasetBorrow = this.formatDataWithIds(this.listBorrow);

        // Force change detection trước
        this.cdr.detectChanges();

        // Refresh grids nếu đã ready - đợi một chút để đảm bảo Angular đã update dataset
        setTimeout(() => {
          this.refreshAllGrids();
        }, 200);
      });
  }

  private refreshAllGrids(): void {
    if (
      this.angularGridBorrow &&
      this.angularGridBorrow.dataView &&
      this.angularGridBorrow.slickGrid
    ) {
      this.angularGridBorrow.dataView.refresh();
      this.angularGridBorrow.slickGrid.invalidate();
      this.angularGridBorrow.slickGrid.render();
      if (this.angularGridBorrow.resizerService) {
        this.angularGridBorrow.resizerService.resizeGrid();
      }
    }
    if (
      this.angularGridImport &&
      this.angularGridImport.dataView &&
      this.angularGridImport.slickGrid
    ) {
      this.angularGridImport.dataView.setItems(this.datasetImport || []);
      this.angularGridImport.dataView.refresh();
      this.angularGridImport.slickGrid.invalidate();
      this.angularGridImport.slickGrid.render();
      if (this.angularGridImport.resizerService) {
        this.angularGridImport.resizerService.resizeGrid();
      }
    }
    if (
      this.angularGridExport &&
      this.angularGridExport.dataView &&
      this.angularGridExport.slickGrid
    ) {
      this.angularGridExport.dataView.setItems(this.datasetExport || []);
      this.angularGridExport.dataView.refresh();
      this.angularGridExport.slickGrid.invalidate();
      this.angularGridExport.slickGrid.render();
      if (this.angularGridExport.resizerService) {
        this.angularGridExport.resizerService.resizeGrid();
      }
    }
    // Force change detection lại sau khi refresh
    this.cdr.detectChanges();
  }

  private formatDataWithIds(data: any[]): any[] {
    return data.map((item: any, index: number) => ({
      ...item,
      id: index++,
    }));
  }
  // Double click handlers
  onImportDblClick(event: any): void {
    const args = event.detail?.args || event.args || event;
    if (args && args.row !== undefined) {
      const item = this.angularGridImport?.dataView?.getItem(args.row);
      const importID = item?.['ID'];
      if (importID && importID > 0) {
        this.openBillImportTechnicalDetail(importID);
      }
    }
  }

  onExportDblClick(event: any): void {
    const args = event.detail?.args || event.args || event;
    if (args && args.row !== undefined) {
      const item = this.angularGridExport?.dataView?.getItem(args.row);
      const exportID = item?.['ID'];
      if (exportID && exportID > 0) {
        this.openBillExportTechnicalDetail(exportID);
      }
    }
  }

  // Angular Grid Ready handlers
  angularGridReadyBorrow(angularGrid: AngularGridInstance): void {
    this.angularGridBorrow = angularGrid;
    // Đợi một chút để đảm bảo grid đã sẵn sàng, sau đó refresh
    setTimeout(() => {
      this.refreshAllGrids();
    }, 150);
  }

  angularGridReadyImport(angularGrid: AngularGridInstance): void {
    this.angularGridImport = angularGrid;
    // Đợi một chút để đảm bảo grid đã sẵn sàng, sau đó refresh
    setTimeout(() => {
      this.refreshAllGrids();
    }, 150);
  }

  angularGridReadyExport(angularGrid: AngularGridInstance): void {
    this.angularGridExport = angularGrid;
    // Đợi một chút để đảm bảo grid đã sẵn sàng, sau đó refresh
    setTimeout(() => {
      this.refreshAllGrids();
    }, 150);
  }

  // Open Bill Import Technical Detail Modal (matching C# grvDataImport_DoubleClick)
  openBillImportTechnicalDetail(importID: number): void {
    if (!importID || importID <= 0) {
      this.notification.warning('Thông báo', 'ID phiếu nhập không hợp lệ!');
      return;
    }

    // Load dữ liệu phiếu nhập từ API để lấy thông tin đầy đủ
    this.billImportTechnicalService.getBillImportDetail(importID).subscribe({
      next: (response: any) => {
        const billMaster = response.billMaster || {};
        const billDetail = response.billDetail || [];

        const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
          centered: true,
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
        });

        // Truyền dữ liệu vào modal
        modalRef.componentInstance.masterId = importID;
        modalRef.componentInstance.warehouseID = this.warehouseID1;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.componentInstance.WarehouseCode =
          billMaster.WarehouseCode || 'HN';
        modalRef.componentInstance.dataEdit = billMaster; // Truyền master data để form tự fill
        modalRef.componentInstance.dtDetails = billDetail; // Truyền detail data

        // Xử lý kết quả khi modal đóng
        modalRef.result.then(
          (result) => {
            if (result === true) {
              // Reload data after save
              this.getBorrowImportExportProductRTC();
              this.getProduct();
            }
          },
          (dismissed) => {
            console.log('Modal dismissed:', dismissed);
          }
        );
      },
      error: (error) => {
        console.error('Error loading bill import detail:', error);
        this.notification.error(
          'Thông báo',
          'Không thể tải thông tin phiếu nhập!'
        );
      },
    });
  }

  // Open Bill Export Technical Detail Modal (matching C# grvDataExport_DoubleClick)
  openBillExportTechnicalDetail(exportID: number): void {
    if (!exportID || exportID <= 0) {
      this.notification.warning('Thông báo', 'ID phiếu xuất không hợp lệ!');
      return;
    }

    // Load dữ liệu phiếu xuất từ API để lấy thông tin đầy đủ
    this.billExportTechnicalService.getBillExportDetail(exportID).subscribe({
      next: (response: any) => {
        const billMaster = response.billMaster || {};
        const billDetail = response.billDetail || [];

        const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
          centered: true,
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
        });

        // Truyền dữ liệu vào modal
        modalRef.componentInstance.masterId = exportID;
        modalRef.componentInstance.IDDetail = exportID;
        modalRef.componentInstance.warehouseID = this.warehouseID1;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.componentInstance.dataEdit = billMaster; // Truyền master data để form tự fill các trường: số phiếu, nhà cung cấp, ngày xuất, người nhận, người duyệt, khách hàng
        modalRef.componentInstance.dataInput = { details: billDetail }; // Truyền detail data

        // Xử lý kết quả khi modal đóng
        modalRef.result.then(
          (result) => {
            if (result === true) {
              // Reload data after save
              this.getBorrowImportExportProductRTC();
              this.getProduct();
            }
          },
          (dismissed) => {
            console.log('Modal dismissed:', dismissed);
          }
        );
      },
      error: (error) => {
        console.error('Error loading bill export detail:', error);
        this.notification.error(
          'Thông báo',
          'Không thể tải thông tin phiếu xuất!'
        );
      },
    });
  }
}
