import { Component, OnInit, AfterViewInit, ViewChild, input, Input, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { HistoryDeleteBillComponent } from '../../../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { IS_ADMIN } from '../../../../../app.config';
import { DEPARTMENTID } from '../../../../../app.config';
import { DateTime } from 'luxon';
// Thêm các import này vào đầu file

import { ProjectComponent } from '../../../../project/project.component';
import { NgZone } from '@angular/core'; // Add this import
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scan-bill-import',
  standalone: true,
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
    NgbModule,
    NzFormModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    NzCheckboxModule
  ],
  templateUrl: './scan-bill-import.component.html',
  styleUrl: './scan-bill-import.component.css'
})
export class ScanBillImportComponent implements OnInit, AfterViewInit {
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billImportService: BillImportServiceService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private zone: NgZone
  ) { }
  searchParams = {
    keyword: '',
  };
  id: number = 0;
  dataTableBillImport: any[] = [];
  table_billImportDetail: any;
  dataTableBillImportDetail: any[] = [];
  table_BillImport: any;
  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  closeModal() {
    this.modalService.dismissAll(true);
  }
  loadBillImportQR() {
    this.table_billImportDetail?.replaceData([]);

    this.billImportService.getBillImportQR(1, this.searchParams.keyword).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          const newRows = res.data;

          if (this.table_BillImport) {
            const existingIDs = this.table_BillImport.getData().map((row: any) => row.ID);

            const filteredRows = newRows.filter((row: any) => !existingIDs.includes(row.ID));
            if (filteredRows.length > 0) {
              this.table_BillImport.deselectRow();
              this.table_BillImport.addData(filteredRows, true).then(() => {
                const newRowID = filteredRows[0].ID;
                const newRow = this.table_BillImport.getRow(newRowID);
                if (newRow) {
                  newRow.select();
                  this.table_BillImport.scrollToRow(newRowID, "top", true);
                }
              });
            } else {
              this.notification.warning('Trùng dữ liệu', 'Phiếu xuất đã tồn tại trong bảng.');
            }
          } else {
            // Nếu bảng chưa khởi tạo, lưu dữ liệu
            this.dataTableBillImport = [...this.dataTableBillImport, ...newRows];
          }
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy phiếu xuất', err);
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu phiếu xuất!');
      }
    });
  }
  deleteData(){
    this.table_BillImport?.replaceData([]);
    this.table_billImportDetail?.replaceData([]);
    this.searchParams.keyword='';
  }
  async IsApprovedAll(apr: boolean) {
    const allRows: any[] = this.table_BillImport?.getData() || [];
  
    if (allRows.length === 0) {
      this.notification.info("Thông báo", "Không tồn tại phiếu xuất!");
      return;
    }
  
    for (const row of allRows) {
      try {
        // Gọi API lấy đầy đủ thông tin phiếu
        const fullResponse = await firstValueFrom(this.billImportService.getBillImportByID(row.ID));
        const fullImport = fullResponse?.data;
  
        if (!fullImport || !fullImport.ID) {
          this.notification.error("Lỗi", `Không tìm thấy phiếu ${row.Code}`);
          continue;
        }
  
        // Gọi API duyệt phiếu
        await firstValueFrom(this.billImportService.approved(fullImport, apr));
  
        // ✅ Gọi lại API lấy lại dữ liệu mới nhất của phiếu sau khi duyệt
        const updatedRes = await firstValueFrom(this.billImportService.getBillImportByID(row.ID));
        const updatedBill = updatedRes?.data;
  
        // ✅ Cập nhật lại dữ liệu cho dòng tương ứng trong bảng Tabulator
        const existingRow = this.table_BillImport.getRow(row.ID);
        if (existingRow && updatedBill) {
          existingRow.update(updatedBill); //sz cập nhật lại dòng trong bảng
        }
  
      } catch (error) {
        console.error(`Lỗi xử lý phiếu ${row.Code}:`, error);
        this.notification.error("Lỗi", `Không thể xử lý phiếu ${row.Code}`);
      }
    }
  
    this.notification.success("Thành công", `Đã ${apr ? "nhận" : "hủy"} chứng từ cho tất cả phiếu.`);
  }
  getBillImportDetail(id: number) {
    this.billImportService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.dataTableBillImportDetail = res.data;
        this.table_billImportDetail?.replaceData(this.dataTableBillImportDetail);
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy chi tiết');
      }
    });
  }
  openModalHistoryDeleteBill() {
    const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.billImportID = this.id;
    modalRef.componentInstance.billType= 1;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          // this.loadDataBillExport();     
        }
      },
    );
  }

  drawTable() {
    const customDateFormatter = (cell: any) => {
      const value = cell.getValue();
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";
      const day: string = ('0' + date.getDate()).slice(-2);
      const month: string = ('0' + (date.getMonth() + 1)).slice(-2);
      const year: number = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
  
    // Bảng master
    if (this.table_BillImport) {
      this.table_BillImport.replaceData(this.dataTableBillImport);
    } else {
      this.table_BillImport = new Tabulator('#table_billImportQR', {
        index: "ID",
        data: this.dataTableBillImport,
        layout: 'fitDataFill',
        height: "30vh",
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          { title: "Nhận chứng từ", field: "Status", hozAlign: "center", headerHozAlign: "center", formatter: (cell) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
          },
         },
          { title: "Ngày nhận/Hủy", field: "DateStatus", hozAlign: "center", headerHozAlign: "center", formatter: customDateFormatter },
          { title: "Loại phiếu", field: "BillTypeText", hozAlign: "left", headerHozAlign: "center" },
          { title: "Ngày Y/c nhập", field: "DateRequestImport", hozAlign: "center", headerHozAlign: "center", formatter: customDateFormatter },
          { title: "Số phiếu", field: "BillImportCode", hozAlign: "left", headerHozAlign: "center" },
          { title: "Nhà cung cấp / Bộ phận", field: "Suplier", hozAlign: "left", headerHozAlign: "center" },
          { title: "Phòng ban", field: "DepartmentName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã NV", field: "Code", hozAlign: "left", headerHozAlign: "center" },
          { title: "Người giao / Người trả", field: "Deliver", hozAlign: "left", headerHozAlign: "center" },
          { title: "Người nhận", field: "Reciver", hozAlign: "left", headerHozAlign: "center" },
          { title: "Ngày tạo", field: "CreatDate", hozAlign: "center", headerHozAlign: "center", formatter: customDateFormatter },
          { title: "Loại vật tư", field: "ProductGroupName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Kho", field: "WarehouseName", hozAlign: "left", headerHozAlign: "center" }
        ],
      });
      this.table_BillImport.on("rowDblClick", (e: MouseEvent, row: any) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.zone.run(() => {
          this.openModalHistoryDeleteBill();
        });
      });
      this.table_BillImport.on("rowSelected", (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.getBillImportDetail(this.id);
      });
  
      this.table_BillImport.on("rowDeselected", () => {
        const selectedRows = this.table_BillImport.getSelectedRows();
        if (selectedRows.length === 0) {
          this.id = 0;
          this.table_billImportDetail?.replaceData([]);
        }
      });
    }
  
    // Bảng detail
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    } else {
      this.table_billImportDetail = new Tabulator('#table_billImportdetailQR', {
        data: this.dataTableBillImportDetail,
        layout: 'fitDataFill',
        height: "80vh",
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          { title: "Mã nội bộ", field: "ProductNewCode", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã hàng", field: "ProductCode", hozAlign: "left", headerHozAlign: "center" },
          { title: "Chi tiết sản phẩm", field: "ProductName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Serial Number", field: "SerialNumber", hozAlign: "left", headerHozAlign: "center" },
          { title: "ĐVT", field: "Unit", hozAlign: "center", headerHozAlign: "center" },
          { title: "Mã theo dự án", field: "ProductFullName", hozAlign: "left", headerHozAlign: "center" },
          { title: "SL thực tế", field: "Qty", hozAlign: "right", headerHozAlign: "center" },
          { title: "Hóa đơn", field: "SomeBill", hozAlign: "left", headerHozAlign: "center" },
          { title: "Loại hàng", field: "ItemType", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã dự án", field: "ProjectCode", hozAlign: "left", headerHozAlign: "center" },
          { title: "Tên dự án", field: "ProjectName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Đơn mua hàng", field: "BillCodePO", hozAlign: "left", headerHozAlign: "center" },
          { title: "Ghi chú (PO)", field: "Note", hozAlign: "left", headerHozAlign: "center" }
        ]
      });
    }
  }
  
}
