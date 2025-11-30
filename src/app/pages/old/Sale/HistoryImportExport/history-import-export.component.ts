import { Component, OnInit, AfterViewInit, ViewChild, Inject, Optional } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { DateTime } from 'luxon';
import { HistoryImportExportService } from './history-import-export-service/history-import-export.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  selector: 'app-history-import-export',
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
    NzCheckboxModule,
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './history-import-export.component.html',
  styleUrl: './history-import-export.component.css',
})
export class HistoryImportExportComponent implements OnInit, AfterViewInit {
  constructor(
    private historyImportExportService: HistoryImportExportService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
warehouseCode: string = 'HN';
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập' },
    { ID: 1, Name: 'Phiếu xuất' },
  ];
  dateFormat = 'dd/MM/yyyy';
  disableSplit: boolean = true;
  isLoading: boolean = false;
  table: any;
  dataTable: any[] = [];
  checked: boolean = false;
  sizeSearch: string = '0';
  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
    dateEnd: new Date(),
    keyword: '',
    group: 0,
    status: -1,
    warehouseCode: 'HN',
    pageNumber: 1,
    pageSize: 100000,
  };
  ngOnInit(): void {
    if (this.tabData?.warehouseCode) {
      this.warehouseCode = this.tabData.warehouseCode;
    }
    this.loadData();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetform() {
    this.searchParams = {
      dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
      dateEnd: new Date(),
      keyword: '',
      group: 0,
      status: -1,
      warehouseCode: this.warehouseCode,
      pageNumber: 1,
      pageSize: 100000,
    };
  }
  searchData() {
    this.loadData();
  }
  onCheckboxChange() {
    this.loadData();
  }

  async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo nhập xuất');

    const columns = table.getColumns();
    const filteredColumns = columns.slice(0);
    const headers = [
      'STT',
      ...filteredColumns.map((col: any) => col.getDefinition().title),
    ];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        ...filteredColumns.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          if (field === 'IsApproved') {
            value = value === true ? '✓' : ''; // hoặc '✓' / '✗'
          }

          return value;
        }),
      ];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }, // Freeze hàng đầu tiên
      ];
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Baocaonhapxuat.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //lay du lieu
  loadData() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    this.isLoading = true;
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.historyImportExportService
      .getHistoryImportExport(
        this.searchParams.status || 0,
        dateStart,
        dateEnd,
        this.searchParams.keyword || '',
        this.checked || false,
        this.searchParams.pageNumber,
        this.searchParams.pageSize,
        this.searchParams.warehouseCode
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.dataTable = res.data;
            if (this.table) {
              this.table.replaceData(this.dataTable);
              this.isLoading = false;
            } else {
              console.log(
                '>>> Bảng chưa tồn tại, dữ liệu sẽ được load khi drawTable() được gọi'
              );
              this.isLoading = false;
            }
          }
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu phiếu xuất');
          this.isLoading = false;
        },
      });
  }
  //ve bang
  drawTable() {
    this.table = new Tabulator('#table_HistoryImportExport', {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTable,
      layout: 'fitDataFill',
      reactiveData: true,
      movableColumns: true,
      resizableRows: true,
      height: '89vh',
      pagination: true,
      paginationMode: 'local',
      columns: [
        {
          title: 'Trạng thái',
          field: 'StatusText',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tình trạng chứng từ',
          field: 'ApproveText',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày huỷ/nhận chứng từ',
          field: 'DateStatus',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Số phiếu',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Nhà cung cấp',
          field: 'SupplierName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
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
          field: 'DateStatus',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
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
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Số lượng',
          field: 'Qty',
          hozAlign: 'right',
          headerHozAlign: 'center',
          formatter: 'money',
          formatterParams: { precision: 2 },
        },
        {
          title: 'Vị trí',
          field: 'AddressBox',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Hoá đơn',
          field: 'InvoiceNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn mua hàng',
          field: 'PurchaseOrder',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Dự án',
          field: 'ProjectName',
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
          title: 'Người xuất',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Người nhập',
          field: 'FullName1',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại vật tư',
          field: 'MaterialType',
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
      ],
    });
  }
}
