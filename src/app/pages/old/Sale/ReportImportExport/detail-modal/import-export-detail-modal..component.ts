import { Component, OnInit, AfterViewInit, ViewChild, NgZone, Input } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
import { ReportImportExportService } from '../report-import-export-service/report-import-export.service';
import { BillExportDetailComponent } from '../../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { BillImportDetailComponent } from '../../BillImport/Modal/bill-import-detail/bill-import-detail.component';

@Component({
  selector: 'app-history-modal',
  standalone:true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NgbModule,
  ],
  templateUrl: './import-export-detail-modal.component.html',
  styleUrl: './import-export-detail-modal.component.css'
})
export class ImportExportModalComponent implements OnInit, AfterViewInit {
  @Input() productID: number = 0;
  constructor(
    private reportImportExportService : ReportImportExportService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone,
    public activeModal: NgbActiveModal,
  ) { }

  ExportID:number=0;
  ImportID:number=0;
  table_Import:any;
  dataImport:any[]=[];

  table_Export:any;
  dataExport:any=[];
  
  product: any[]=[];
  productSale= {
    productCode:'',
    productName:'',
    tonDauKy:0,
    tonCuoiky:0,
    tongNhap:0,
    tongXuat:0,
    soLuongGiu:0
  }

  ngOnInit(): void {
    this.getHistory();
  }
  ngAfterViewInit(): void {
    this.drawTable_Import();
    this.drawTable_Export();
  }
  
  getHistory() {
    this.reportImportExportService.getHistoryImportExport(this.productID, "HN")
      .subscribe({
        next: (res) => {
          if (res?.data?.length) {
            const row = res.data[0] ?? [];     // Thông tin tổng quan sản phẩm
            const dtI = res.data[1] ?? [];     // Dữ liệu nhập
            const dtE = res.data[2] ?? [];

            this.dataImport = dtI; 
            this.dataExport = dtE;
          
            if (this.table_Import) {
              this.table_Import.replaceData(this.dataImport);
            } else {
              this.drawTable_Import();
            }
            if (this.table_Export) {
              this.table_Export.replaceData(this.dataExport);
            } else {
              this.drawTable_Export();
            }
  
            // Thông tin tổng quan sản phẩm
            if (row.length > 0) {
              this.productSale = {
                productCode: row[0].ProductCode,
                productName: row[0].ProductName,
                tonDauKy: row[0].TotalQuantityFirst ?? 0,
                tonCuoiky: row[0].TotalQuantityLast ?? 0,
                tongNhap: row[0].TotalImport ?? 0,
                tongXuat: row[0].TotalExport ?? 0,
                soLuongGiu: 0,
              };
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy dữ liệu', err);
        }
      });
  }
  
  closeModal() {
    this.activeModal.dismiss(true);
  }
  openModalBillExportDetail(ischeckmode: boolean) {
  
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // modalRef.componentInstance.newBillExport = this.newBillExport;
    modalRef.componentInstance.isCheckmode = ischeckmode;
    modalRef.componentInstance.id = this.ExportID;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.ExportID= 0;
        }
      },
    );
  }
  openModalBillImportDetail(ischeckmode: boolean) {
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // modalRef.componentInstance.newBillExport = this.newBillExport;
    modalRef.componentInstance.isCheckmode = ischeckmode;
    modalRef.componentInstance.id = this.ImportID;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.ImportID= 0;
        }
      },
    );
  }
  drawTable_Import() {
    // if (this.table_Import) {
    //   this.table_Import.replaceData(this.dataImport);
    // } else {
    //   this.drawTable_Import();
    // }
    this.table_Import = new Tabulator("#table_import", {
      data: this.dataImport,
      layout: "fitDataFill",
      height: "60vh",
      reactiveData: true,
      movableColumns: true,
      resizableRows: true,
      columns: [
        { title: 'Nhận chứng từ', field: 'Status', hozAlign: 'center', headerHozAlign: 'center', formatter: (cell) => {
          const value = cell.getValue();
          return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
        }, 
        frozen:true
      },
        { title: 'Ngày nhận', field: 'DateStatus', hozAlign: 'center', headerHozAlign: 'center', formatter: 'datetime', formatterParams: { outputFormat: 'yyyy-MM-dd' },frozen:true },
        { title: 'Số phiếu', field: 'BillImportCode', hozAlign: 'left', headerHozAlign: 'center',frozen:true },
        { title: 'Ngày tạo', field: 'CreatDate', hozAlign: 'center', headerHozAlign: 'center', formatter: 'datetime', formatterParams: { outputFormat: 'yyyy-MM-dd' } },
        { title: 'Người nhận', field: 'Reciver', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Người giao', field: 'Deliver', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Nhà cung cấp', field: 'Suplier', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Số lượng', field: 'Qty', hozAlign: 'right', headerHozAlign: 'center', formatter: 'money', formatterParams: { precision: 2 } },
        { title: 'Dự án', field: 'Project', hozAlign: 'left', headerHozAlign: 'center' },
      ]
    });
    this.table_Import.on("rowDblClick", (e: MouseEvent, row: any) => {
      const rowData = row.getData(); 
      this.ImportID = rowData['ID'];
      this.zone.run(() => {
        this.openModalBillImportDetail(true);
      });
    });
  }

  drawTable_Export() {
    this.table_Export = new Tabulator("#table_export", {
      data: this.dataExport,
      layout: "fitDataFill",
      height: "60vh",
      reactiveData: true,
      movableColumns: true,
      resizableRows: true,
      columns: [
        { title: 'Trạng thái', field: 'IsApproved', hozAlign: 'center', headerHozAlign: 'center', formatter: (cell) => {
          const value = cell.getValue();
          return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
        },frozen:true
       },
        { title: 'Ngày nhận', field: 'DateStatus', hozAlign: 'center', headerHozAlign: 'center', formatter: 'datetime', formatterParams: { outputFormat: 'yyyy-MM-dd' },frozen:true },
        { title: 'Số phiếu', field: 'Code', hozAlign: 'left', headerHozAlign: 'center',frozen:true},
        { title: 'Ngày tạo', field: 'CreatDate', hozAlign: 'center', headerHozAlign: 'center', formatter: 'datetime', formatterParams: { outputFormat: 'yyyy-MM-dd' } },
        { title: 'Người nhận', field: 'Receiver', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Người giao', field: 'Deliver', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Khách Hàng', field: 'CustomerName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Số lượng', field: 'Qty', hozAlign: 'right', headerHozAlign: 'center', formatter: 'money', formatterParams: { precision: 2 } },
        { title: 'Số lượng trả', field: 'ReturnAmount', hozAlign: 'right', headerHozAlign: 'center', formatter: 'money', formatterParams: { precision: 2 } },
        { title: 'Số lượng chưa trả', field: 'Remain', hozAlign: 'right', headerHozAlign: 'center', formatter: 'money', formatterParams: { precision: 2 } },
        { title: 'Dự án', field: 'Project', hozAlign: 'left', headerHozAlign: 'center' },
      ]
    });
    this.table_Export.on("rowDblClick", (e: MouseEvent, row: any) => {
      const rowData = row.getData(); 
      this.ExportID = rowData['ID'];
      this.zone.run(() => {
        this.openModalBillExportDetail(true);
      });
    });
  }
}
