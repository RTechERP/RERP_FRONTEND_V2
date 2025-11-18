import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit, Optional } from '@angular/core';
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
  warehouseID: number = 0;
  productRTCID: number = 0;
  ProductCode: string = '';
  ProductName: string = '';
  NumberBegin: number = 0;
  InventoryLatest: number = 0;
  NumberImport: number = 0;
  NumberExport: number = 0;
  NumberBorrowing: number = 0;
  InventoryReal: number = 0;
  constructor(private notification: NzNotificationService,
    private inventoryDemoService: InventoryDemoService,
    @Optional() public activeModal: NgbActiveModal
  ) { }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      BillCode: ['', Validators.required],
    });
  }
  ngOnInit() {
    console.log("Received productRTCID:", this.productRTCID1);
    console.log("Received warehouseID:", this.warehouseID1);
    this.initForm();
  }

  close() {
    this.closeModal.emit();
    this.activeModal?.dismiss('cancel');
  }
  ngAfterViewInit() {
    this.getBorrowImportExportProductRTC();
    this.getProduct();

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
      this.drawTBBorrow();
      this.drawTBExport();
      this.drawTBImport();
    });
  }
  drawTBImport() {
    const table = new Tabulator('#tbImport', {
      data: this.listImport,
      layout: 'fitColumns',
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60
        },
        {
          title: "Mã phiếu nhập",
          field: "BillCode",
          hozAlign: "left",
          headerHozAlign: "center"
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
          headerHozAlign: "center"
        },
        {
          title: "Số lượng",
          field: "Quantity",
          hozAlign: "right",
          headerHozAlign: "center"
        },
        {
          title: "Người giao",
          field: "Deliver",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Nhà cung cấp",
          field: "Suplier",
          hozAlign: "left",
          headerHozAlign: "center"
        }
      ]

    });
  }
  drawTBExport() {
    const table = new Tabulator('#tbExport', {
      data: this.listExport,
      layout: 'fitColumns',
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60
        },
        {
          title: "Mã phiếu xuất",
          field: "Code",
          hozAlign: "left",
          headerHozAlign: "center"
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
          headerHozAlign: "center"
        },
        {
          title: "Số lượng",
          field: "Quantity",
          hozAlign: "right",
          headerHozAlign: "center"
        },
        {
          title: "Người nhận",
          field: "Receiver",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Nhà cung cấp",
          field: "SupplierName",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Loại phiếu",
          field: "BillTypeText",
          hozAlign: "left",
          headerHozAlign: "center"
        },

      ]
    });
  }
  drawTBBorrow() {
    const table = new Tabulator('#tbBorrow', {
      data: this.listBorrow,
      layout: 'fitDataStretch',
      pagination: true,
      selectableRows: 5,
      height: '79vh',
      movableColumns: true,
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      history: true,
      columns: [
        {
          title: "STT",
          formatter: "rownum",
          hozAlign: "center",
          headerHozAlign: "center",
          width: 60 // hoặc điều chỉnh tùy bạn
        },
        {
          title: "ID",
          field: "ID",
          hozAlign: "right",
          headerHozAlign: "center"
        },
        {
          title: "Ngày mượn",
          field: "DateBorrow",
          hozAlign: "center",
          headerHozAlign: "center",
          formatter: "datetime",
          formatterParams: {
            inputFormat: "iso", // ← đây là quan trọng
            outputFormat: "dd/MM/yyyy ",
            timezone: "Asia/Ho_Chi_Minh", // nếu muốn theo giờ VN
            invalidPlaceholder: "-"
          }
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
          }
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
          }
        },

        {
          title: "Dự án",
          field: "Project",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Ghi chú",
          field: "Note",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Số mượn",
          field: "NumberBorrow",
          hozAlign: "right",
          headerHozAlign: "center"
        },
        {
          title: "Trạng thái",
          field: "StatusText",
          hozAlign: "left",
          headerHozAlign: "center"
        },
        {
          title: "Người mượn",
          field: "FullName",
          hozAlign: "left",
          headerHozAlign: "center"
        }
      ]

    });
  }
}
