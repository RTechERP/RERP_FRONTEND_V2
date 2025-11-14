import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MaterialDetailOfProductRtcComponent } from '../material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { InventoryDemoService } from '../inventory-demo-service/inventory-demo.service';
import { BillImportTechnicalFormComponent } from '../../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import { BillExportTechnicalFormComponent } from '../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
import { BillExportTechnicalService } from '../../bill-export-technical/bill-export-technical-service/bill-export-technical.service';
@Component({
  standalone: true,
  imports: [
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
  ],
  selector: 'app-inventory-borrow-supplier-demo',
  templateUrl: './inventory-borrow-supplier-demo.component.html',
  styleUrls: ['./inventory-borrow-supplier-demo.component.css']
})
export class InventoryBorrowSupplierDemoComponent implements OnInit, AfterViewInit {
  @Output() closeModal = new EventEmitter<void>();
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  // bảng danh sách sản phẩm
  productTable: Tabulator | null = null;
  // data sản phẩm
  productData: any[] = [];

  supplierFilter: string = "";
  // request gửi store
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  SupplierDemoID: number | null = null;
  WarehouseID: number | null = null;
  FilterText: string = '';
  Page: number = 1;
  Size: number = 1000000;
  billImportCode: string = '';
  billExportCode: string = '';
  // danh sách nhà cung cấp
  ListNCC: any[] = [];
  nccList: any[] = [];
  constructor(private inventoryDemoService: InventoryDemoService,
    private billImportTechnicalService: BillImportTechnicalService,
    private notification: NzNotificationService,
    private billExportTechnicalService: BillExportTechnicalService
  ) { }
  ngAfterViewInit(): void {
    //Get danh sách NCC
    this.getNCC();
  }
  ngOnInit() {
    this.drawTable();
    const now = DateTime.now();
    //gán dateStart và dateEnd mặc định là ngày đầu tháng và cuối tháng hiện tại
    this.dateStart = now.startOf('month').toJSDate();
    this.dateEnd = now.endOf('month').toJSDate();
  }
  //lấy ds ncc
  getNCC() {
    this.billImportTechnicalService.getNCC().subscribe((res: any) => {
      this.nccList = res.data;
    });
  }
  // Đóng modal
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  drawTable() {
    //Menu khi click chuột phải vào dòng
    const rowMenu = [
      {
        label: "Chi tiết",
        action: (e: any, row: any) => {
          const rowData = row.getData();
          const productRTCID = rowData.ProductRTCID;
          const warehouseID = rowData.WarehouseID;
          const modalRef = this.ngbModal.open(MaterialDetailOfProductRtcComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
          });
          modalRef.componentInstance.productRTCID1 = productRTCID;
          modalRef.componentInstance.warehouseID1 = warehouseID;
          modalRef.result.then(
            (result) => {
              console.log('Modal closed with result:', result);
            },
            (dismissed) => {
              console.log('Modal dismissed');
            }
          );
        },
      },
      {
        label: "Chi tiết phiếu nhập",
        action: (e: any, row: any) => {
          this.billImportCode = row.getData().ImportCode;
          this.billImportTechnicalService.getBillImportByCode(this.billImportCode).subscribe((response: any) => {
            const selectedRow = response.master?.[0]; // Dữ liệu master từ API

            if (!selectedRow) {
              this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy biên bản trong hệ thống!');
              return;
            }
            const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
              centered: true,
              backdrop: 'static',
              keyboard: false,
              windowClass: 'full-screen-modal',
            });
            modalRef.componentInstance.masterId = selectedRow.ID;
            modalRef.componentInstance.dataEdit = selectedRow;
          });
        },
      },
      {
        label: "Chi tiết phiếu xuất",
        action: (e: any, row: any) => {
          this.billExportCode = row.getData().ExportCode;
          this.billExportTechnicalService.getBillExportByCode(this.billExportCode).subscribe((response: any) => {
            const selectedRow = response.master?.[0];

            if (!selectedRow) {
              this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy biên bản trong hệ thống!');
              return;
            }
            const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
              centered: true,
              backdrop: 'static',
              keyboard: false,
              windowClass: 'full-screen-modal',
            });
            modalRef.componentInstance.masterId = selectedRow.ID;
            modalRef.componentInstance.dataEdit = selectedRow;
          });
        },
      },
      {
        label: "Chi tiết phiếu mượn",
        action: (e: any, row: any) => {
          const rowData = row.getData(); ``
          const productID = rowData.ProductID;
          const warehouseID = rowData.WarehouseID;

        },
      },
    ];
    const headerMenu = function (this: any) {
      const menu = [];
      const columns = this.getColumns();
      for (let column of columns) {
        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square");
        let label = document.createElement("span");
        let title = document.createElement("span");
        title.textContent = " " + column.getDefinition().title;
        label.appendChild(icon);
        label.appendChild(title);
        menu.push({
          label: label,
          action: function (e: any) {
            e.stopPropagation();
            column.toggle();
            icon.classList.toggle("fa-check-square", column.isVisible());
            icon.classList.toggle("fa-square", !column.isVisible());
          },
        });
      }
      return menu;
    };
    this.productTable = new Tabulator('#dataTableProductInventoryDemo', {
      layout: "fitDataStretch",
      pagination: true,
      selectableRows: 5,
      rowContextMenu: rowMenu,
      height: '86vh',
      ajaxURL: this.inventoryDemoService.getInventoryNCCAjax(),
      ajaxConfig: "POST",
      paginationMode: 'remote',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      movableColumns: true,
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      ajaxRequestFunc: (url, config, params) => {
        // lấy ngày đầu tháng và cuối tháng
        const now = DateTime.now();
        const firstDayOfMonth = now.startOf('month').toFormat('yyyy-MM-dd');
        const lastDayOfMonth = now.endOf('month').toFormat('yyyy-MM-dd');
        const request = {
          SupplierDemoID: this.SupplierDemoID || 0,
          WarehouseID: this.WarehouseID || 1,
          dateStart: this.dateStart ? DateTime.fromJSDate(this.dateStart).toFormat('yyyy-MM-dd') : firstDayOfMonth,
          dateEnd: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).toFormat('yyyy-MM-dd') : lastDayOfMonth,
          filterText: this.FilterText || "",
          page: params.page || 1,
          size: params.size || 30,
        };

        return this.inventoryDemoService.getInventoryBorrowSupplier(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.products || [],
          last_page: response.TotalPage?.[0]?.TotalPage || 1,
        };
      },
      placeholder: 'Không có dữ liệu',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      dataTree: true,
      addRowPos: "bottom",
      history: true,
      columns: [
        { title: "ProductRTCID", field: "ProductRTCID", visible: false },
        { title: "WarehouseID", field: "WarehouseID", visible: false },
        { title: "STT", field: "RowNum", hozAlign: "center", headerHozAlign: "center", width: 60 },
        { title: "Mã phiếu nhập", field: "ImportCode", headerHozAlign: "center", hozAlign: "left" },
        { title: "Mã phiếu xuất", field: "ExportCode", headerHozAlign: "center", hozAlign: "left" },
        { title: "Mã SP", field: "ProductCode", headerHozAlign: "center", hozAlign: "left" },
        { title: "Tên SP", field: "ProductName", headerHozAlign: "center", hozAlign: "left" },
        { title: "Mã SP RTC", field: "ProductCodeRTC", headerHozAlign: "center", hozAlign: "left" },
        { title: "Nhóm SP", field: "ProductGroupName", headerHozAlign: "center", hozAlign: "left" },
        { title: "SL nhập", field: "NumberImport", headerHozAlign: "center", hozAlign: "right" },
        { title: "SL xuất", field: "NumberExport", headerHozAlign: "center", hozAlign: "right" },
        { title: "SL mượn", field: "NumberBorrowing", headerHozAlign: "center", hozAlign: "right" },
        { title: "Tồn thực tế", field: "InventoryReal", headerHozAlign: "center", hozAlign: "right" },
        { title: "Tồn chậm", field: "InventoryLate", headerHozAlign: "center", hozAlign: "right" },
        { title: "SL trả NCC", field: "TotalQuantityReturnNCC", headerHozAlign: "center", hozAlign: "right" },
        { title: "Người giao nhập", field: "DeliverImport", headerHozAlign: "center", hozAlign: "left" },
        { title: "Người nhận nhập", field: "ReceiverImport", headerHozAlign: "center", hozAlign: "left" },
        { title: "Người nhận xuất", field: "ReceiverExport", headerHozAlign: "center", hozAlign: "left" },
        { title: "Nhà cung cấp", field: "SuplierSaleName", headerHozAlign: "center", hozAlign: "left" },
        { title: "Ngày tạo nhập", field: "ImportCreateDate", headerHozAlign: "center", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
        { title: "Ngày tạo xuất", field: "ExportCreateDate", headerHozAlign: "center", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
        { title: "Người tạo", field: "CreatedBy", headerHozAlign: "center", hozAlign: "left" },
        { title: "Ngày tạo", field: "CreatedDate", headerHozAlign: "center", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
        { title: "Người cập nhật", field: "UpdatedBy", headerHozAlign: "center", hozAlign: "left" },
        { title: "Ngày cập nhật", field: "UpdatedDate", headerHozAlign: "center", hozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" } },
      ]
    });
  }
  //Hàm tìm kiếm
  onSearch() {
    this.productTable?.setData();
  }
  //Hàm xuất excel
  async exportToExcelProduct() {
    if (!this.productTable) return;
    const selectedData = [...this.productData];
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thiết bị');

    const columns = this.productTable.getColumnDefinitions().filter((col: any) =>
      col.visible !== false && col.field && col.field.trim() !== ''
    );
    const headerRow = worksheet.addRow(columns.map(col => col.title || col.field));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        switch (col.field) {
          case 'BorrowCustomer':
            return value ? 'Có' : 'Không';
          case 'CreateDate':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSachMuonNCC-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
