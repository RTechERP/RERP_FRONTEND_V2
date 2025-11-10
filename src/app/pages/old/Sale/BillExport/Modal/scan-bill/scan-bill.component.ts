import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  input,
  Input,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
// Thêm các import này vào đầu file
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
} from '@angular/core';
import { SelectControlComponent } from '../select-control/select-control.component';
import { ProjectComponent } from '../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';
import { NgZone } from '@angular/core'; // Add this import
import { firstValueFrom } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';

@Component({
  selector: 'app-scan-bill',
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
    SelectControlComponent,
    NzCheckboxModule,
  ],
  templateUrl: './scan-bill.component.html',
  styleUrl: './scan-bill.component.css',
})
export class ScanBillComponent implements OnInit, AfterViewInit {
  @Input() warehouseCode: string = "HN";
  searchParams = {
    keyword: '',
  };
  id: number = 0;
  dataTableBillExport: any[] = [];
  table_billExportDetail: any;
  dataTableBillExportDetail: any[] = [];
  table_BillExport: any;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billExportService: BillExportService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private zone: NgZone
  ) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.drawTable();
  }
  closeModal() {
    this.modalService.dismissAll(true);
  }
  loadBillExportQR() {
    this.table_billExportDetail?.replaceData([]);

    this.billExportService
      .getBillExportQR(1, this.searchParams.keyword)
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            const newRows = res.data;

            if (this.table_BillExport) {
              const existingIDs = this.table_BillExport
                .getData()
                .map((row: any) => row.ID);

              const filteredRows = newRows.filter(
                (row: any) => !existingIDs.includes(row.ID)
              );
              if (filteredRows.length > 0) {
                this.table_BillExport.deselectRow();
                this.table_BillExport.addData(filteredRows, true).then(() => {
                  const newRowID = filteredRows[0].ID;
                  const newRow = this.table_BillExport.getRow(newRowID);
                  if (newRow) {
                    newRow.select();
                    this.table_BillExport.scrollToRow(newRowID, 'top', true);
                  }
                });
              } else {
                this.notification.warning(
                  'Trùng dữ liệu',
                  'Phiếu xuất đã tồn tại trong bảng.'
                );
              }
            } else {
              // Nếu bảng chưa khởi tạo, lưu dữ liệu
              this.dataTableBillExport = [
                ...this.dataTableBillExport,
                ...newRows,
              ];
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy phiếu xuất', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lấy dữ liệu phiếu xuất!');
        },
      });
  }

  getBillExportDetail(id: number) {
    this.billExportService.getBillExportDetail(id).subscribe({
      next: (res) => {
        this.dataTableBillExportDetail = res.data;
        this.table_billExportDetail?.replaceData(
          this.dataTableBillExportDetail
        );
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy chi tiết');
      },
    });
  }
  openModalHistoryDeleteBill() {
    const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.billExportID = this.id;
    modalRef.result.catch((result) => {
      if (result == true) {
        // this.loadDataBillExport();
      }
    });
  }
  deleteData() {
    this.table_BillExport?.replaceData([]);
    this.table_billExportDetail?.replaceData([]);
    this.searchParams.keyword = '';
  }

  async IsApprovedAll(apr: boolean) {
    const allRows: any[] = this.table_BillExport?.getData() || [];

    if (allRows.length === 0) {
      this.notification.info('Thông báo', 'Không tồn tại phiếu xuất!');
      return;
    }

    for (const row of allRows) {
      try {
        // Gọi API lấy đầy đủ thông tin phiếu
        const fullResponse = await firstValueFrom(
          this.billExportService.getBillExportByID(row.ID)
        );
        const fullBillExport = fullResponse?.data;

        if (!fullBillExport || !fullBillExport.ID) {
          this.notification.error(NOTIFICATION_TITLE.error, `Không tìm thấy phiếu ${row.Code}`);
          continue;
        }

        // Gọi API duyệt phiếu
        await firstValueFrom(
          this.billExportService.approved(fullBillExport, apr)
        );

        // ✅ Gọi lại API lấy lại dữ liệu mới nhất của phiếu sau khi duyệt
        const updatedRes = await firstValueFrom(
          this.billExportService.getBillExportByID(row.ID)
        );
        const updatedBill = updatedRes?.data;

        // ✅ Cập nhật lại dữ liệu cho dòng tương ứng trong bảng Tabulator
        const existingRow = this.table_BillExport.getRow(row.ID);
        if (existingRow && updatedBill) {
          existingRow.update(updatedBill); // cập nhật lại dòng trong bảng
        }
      } catch (error) {
        console.error(`Lỗi xử lý phiếu ${row.Code}:`, error);
        this.notification.error(NOTIFICATION_TITLE.error, `Không thể xử lý phiếu ${row.Code}`);
      }
    }

    this.notification.success(
      'Thành công',
      `Đã ${apr ? 'nhận' : 'hủy'} chứng từ cho tất cả phiếu.`
    );
  }

  drawTable() {
    const customDateFormatter = (cell: any) => {
      const value = cell.getValue();
      if (!value) return '';

      const date = new Date(value);
      if (isNaN(date.getTime())) return '';

      const day: string = ('0' + date.getDate()).slice(-2);
      const month: string = ('0' + (date.getMonth() + 1)).slice(-2);
      const year: number = date.getFullYear();

      return `${day}/${month}/${year}`;
    };
    if (this.table_BillExport) {
      this.table_BillExport.replaceData(this.dataTableBillExport);
    } else {
      this.table_BillExport = new Tabulator('#table_billExportQR', {
        index: 'ID',
        data: this.dataTableBillExport,
        layout: 'fitDataFill',
        height: '30vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            headerSort: false,
          },
          {
            title: 'Nhận chứng từ',
            field: 'IsApproved',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${
                value === true ? 'checked' : ''
              } disabled />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày nhận',
            field: 'DateStatus',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: customDateFormatter,
          },
          {
            title: 'Trạng Thái',
            field: 'nameStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày yêu cầu xuất kho',
            field: 'RequestDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: customDateFormatter,
          },
          {
            title: 'Chuẩn bị xong',
            field: 'IsPrepared',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${
                value === true ? 'checked' : ''
              } disabled />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Đã nhận hàng',
            field: 'IsReceived',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${
                value === true ? 'checked' : ''
              } disabled />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Số phiếu',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã NV',
            field: 'EmployeeCode',
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
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Nhà cung cấp',
            field: 'NameNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Địa chỉ',
            field: 'Address',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày xuất',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: customDateFormatter,
          },
          {
            title: 'Loại vật tư',
            field: 'WarehouseType',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Kho',
            field: 'WarehouseName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Loại phiếu',
            field: 'ProductTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao',
            field: 'FullNameSender',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });
      this.table_BillExport.on('rowDblClick', (e: MouseEvent, row: any) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.zone.run(() => {
          this.openModalHistoryDeleteBill();
        });
      });
      this.table_BillExport.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.getBillExportDetail(this.id);
      });
      this.table_BillExport.on('rowDeselected', (row: RowComponent) => {
        // Khi một hàng bị bỏ chọn, kiểm tra xem còn hàng nào được chọn không
        const selectedRows = this.table_BillExport.getSelectedRows();
        if (selectedRows.length === 0) {
          this.id = 0; // Reset id về 0 (hoặc null)
          this.table_billExportDetail?.replaceData([]); // Xóa dữ liệu bảng chi tiết
        }
      });
    }
    //bang detail
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
      this.table_billExportDetail = new Tabulator('#table_billexportdetailQR', {
        data: this.dataTableBillExportDetail,
        layout: 'fitDataFill',
        height: '80vh',
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'Mã nội bộ',
            field: 'ProductNewCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'SL tồn',
            field: 'TotalInventory',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Chi tiết sản phẩm',
            field: 'ProductName',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã sản phẩm theo dự án',
            field: 'ProductFullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'ĐVT',
            field: 'Unit',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 250,
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Dự án (mới)',
            field: 'ProductFullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Loại hàng',
            field: 'ProductGroupName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Hàng xuất',
            field: 'ProductTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú (PO)',
            field: 'Note',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Đơn giá bán',
            field: 'UnitPricePOKH',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Đơn giá múa',
            field: 'UnitPricePurchase',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Đơn mua hàng',
            field: 'BillCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã dự án',
            field: 'ProjectCodeExport',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Dự án',
            field: 'ProjectNameText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }
}
