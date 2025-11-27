import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit, Optional, Inject } from '@angular/core';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}

import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { InventoryDemoService } from '../inventory-demo-service/inventory-demo.service';
import { filter, last } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BillImportTechnicalFormComponent } from '../../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import { BillExportTechnicalFormComponent } from '../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
@Component({
  standalone: true,
  imports: [
    NzSplitterModule,
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
    NgbModalModule

  ],
  selector: 'app-material-detail-of-product-rtc',
  templateUrl: './material-detail-of-product-rtc.component.html',
  styleUrls: ['./material-detail-of-product-rtc.component.css']
})
export class MaterialDetailOfProductRtcComponent implements OnInit, AfterViewInit {
  @Output() closeModal = new EventEmitter<void>();
  @Input() productRTCID1!: number;
  @Input() warehouseID1!: number;
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
@Input()  warehouseID: number = 0;
 @Input()  productRTCID: number = 0;
@Input()   ProductCode: string = '';
@Input()   ProductName: string = '';
 @Input()  NumberBegin: number = 0;
 @Input()  InventoryLatest: number = 0;
 @Input()  NumberImport: number = 0;
 @Input()  NumberExport: number = 0;
 @Input()  NumberBorrowing: number = 0;
 @Input()  InventoryReal: number = 0;
  // Tabulator instances
  tableBorrow: Tabulator | null = null;
  tableImport: Tabulator | null = null;
  tableExport: Tabulator | null = null;

  constructor(
    private notification: NzNotificationService,
    private inventoryDemoService: InventoryDemoService,
    private ngbModal: NgbModal,
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
    // Lấy dữ liệu từ tabData injector nếu có
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

    this.getBorrowImportExportProductRTC();
    console.log("Received productRTCID:", this.productRTCID1);
    console.log("Received warehouseID:", this.warehouseID1);
    console.log("Received tabData:", this.tabData);
    this.initForm();
  }

  close() {
    this.closeModal.emit();
    this.activeModal?.dismiss('cancel');
  }
  ngAfterViewInit() {

      this.drawTBBorrow();
      this.drawTBExport();
      this.drawTBImport();
    // Không cần gọi getProduct() nữa vì dữ liệu đã được truyền từ parent qua tabData
    // this.getProduct();

  }
  getProduct() {
    const request = {
      productGroupID: 0,
      keyWord: "",
      checkAll: 1,
      warehouseID: this.warehouseID1 || 1,
      productRTCID: this.productRTCID1 || 1,
    };
    console.log("request", request);
    this.inventoryDemoService.getInventoryDemo(request).subscribe((response: any) => {
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
  getBorrowImportExportProductRTC(ProductID?: number, WarehouseID?: number): void {
    this.inventoryDemoService.getBorrowImportExportProductRTC(this.productRTCID1, this.warehouseID1).subscribe((response: any) => {
      this.listImport = response.listImport || [];
      this.listExport = response.listExport || [];
      this.listBorrow = response.listBorrow || [];
      console.log('listImport', this.listImport);
      console.log('listExport', this.listExport);
      console.log('listBorrow', this.listBorrow);
      this.tableImport?.replaceData(this.listImport);
      this.tableExport?.replaceData(this.listExport);
      this.tableBorrow?.replaceData(this.listBorrow);
    });
  }
  drawTBImport() {
    this.tableImport = new Tabulator('#tbImport', {
      data: this.listImport,
      layout: 'fitData',
      height: '100%',
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60
        },
        {
          title: "ID",
          field: "ID",
          visible: false
        },
        {
          title: "Mã phiếu nhập",
          field: "BillCode",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Ngày tạo",
          field: "CreatDate",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso",
            outputFormat: "dd/MM/yyyy HH:mm:ss",
            timezone: "Asia/Ho_Chi_Minh",
            invalidPlaceholder: "-"
          },
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Số lượng",
          field: "Quantity",
          hozAlign: "right",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Người giao",
          field: "Deliver",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        },
        {
          title: "Nhà cung cấp",
          field: "Suplier",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        }
      ]
    });

    // Double click to open Bill Import Detail
    this.tableImport.on("rowDblClick", (_e, row) => {
      const rowData = row.getData();
      const importID = rowData['ID'];
      if (importID && importID > 0) {
        this.openBillImportTechnicalDetail(importID);
      }
    });
  }

  drawTBExport() {
    this.tableExport = new Tabulator('#tbExport', {
      data: this.listExport,
      layout: 'fitData',
      height: '100%',
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60
        },
        {
          title: "ID",
          field: "ID",
          visible: false
        },
        {
          title: "Mã phiếu xuất",
          field: "Code",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Ngày tạo",
          field: "CreatedDate",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso",
            outputFormat: "dd/MM/yyyy HH:mm:ss",
            timezone: "Asia/Ho_Chi_Minh",
            invalidPlaceholder: "-"
          },
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Số lượng",
          field: "Quantity",
          hozAlign: "right",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Người nhận",
          field: "Receiver",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        },
        {
          title: "Nhà cung cấp",
          field: "SupplierName",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        },
        {
          title: "Loại phiếu",
          field: "BillTypeText",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
      ]
    });

    // Double click to open Bill Export Detail
    this.tableExport.on("rowDblClick", (_e, row) => {
      const rowData = row.getData();
      const exportID = rowData['ID'];
      if (exportID && exportID > 0) {
        this.openBillExportTechnicalDetail(exportID);
      }
    });
  }
  drawTBBorrow() {
    this.tableBorrow = new Tabulator('#tbBorrow', {
      data: this.listBorrow,
      layout: 'fitData',
      height: '100%',
      movableColumns: true,
      reactiveData: true,
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60
        },
        {
          title: "ID",
          field: "ID",
          hozAlign: "right",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Ngày mượn",
          field: "DateBorrow",
          hozAlign: "center",
          headerHozAlign: "center",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso",
            outputFormat: "dd/MM/yyyy ",
            timezone: "Asia/Ho_Chi_Minh",
            invalidPlaceholder: "-"
          },
          width: 150
        },
        {
          title: "Ngày trả dự kiến",
          field: "DateReturnExpected",
          hozAlign: "center",
          headerHozAlign: "center",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso",
            outputFormat: "dd/MM/yyyy",
            timezone: "Asia/Ho_Chi_Minh",
            invalidPlaceholder: "-"
          },
          width: 150
        },
        {
          title: "Ngày trả",
          field: "DateReturn",
          hozAlign: "center",
          headerHozAlign: "center",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso",
            outputFormat: "dd/MM/yyyy",
            timezone: "Asia/Ho_Chi_Minh",
            invalidPlaceholder: "-"
          },
          width: 150
        },

        {
          title: "Dự án",
          field: "Project",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        },
        {
          title: "Ghi chú",
          field: "Note",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        },
        {
          title: "Số mượn",
          field: "NumberBorrow",
          hozAlign: "right",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Trạng thái",
          field: "StatusText",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 150
        },
        {
          title: "Người mượn",
          field: "FullName",
          hozAlign: "left",
          headerHozAlign: "center",
          width: 200
        }
      ]
    });
  }

  // Open Bill Import Technical Detail Modal (matching C# grvDataImport_DoubleClick)
  openBillImportTechnicalDetail(importID: number): void {
    if (!importID || importID <= 0) {
      this.notification.warning('Thông báo', 'ID phiếu nhập không hợp lệ!');
      return;
    }

    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.IDDetail = importID;
    modalRef.componentInstance.warehouseID = this.warehouseID1;

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
  }

  // Open Bill Export Technical Detail Modal (matching C# grvDataExport_DoubleClick)
  openBillExportTechnicalDetail(exportID: number): void {
    if (!exportID || exportID <= 0) {
      this.notification.warning('Thông báo', 'ID phiếu xuất không hợp lệ!');
      return;
    }

    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.IDDetail = exportID;
    modalRef.componentInstance.warehouseID = this.warehouseID1;

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
  }
}
