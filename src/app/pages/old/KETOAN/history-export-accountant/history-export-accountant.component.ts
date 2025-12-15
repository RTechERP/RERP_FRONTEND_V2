import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
  Optional,
  Inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { HistoryExportAccountantService } from './history-export-accountant-service/history-export-accountant.service';

@Component({
  selector: 'app-history-export-accountant',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    NzTreeSelectModule,
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './history-export-accountant.component.html',
  styleUrl: './history-export-accountant.component.css'
})
export class HistoryExportAccountantComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  filters: any = {
    dateStart: new Date(),
    dateEnd: new Date(),
    status: 0,
    filterText: '',
  };

  statuses: any[] = [
    { value: 0, label: 'Chưa xuất hóa đơn' },
    { value: 1, label: 'Đã xuất hóa đơn' },
  ];

  constructor(
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private historyExportAccountantService: HistoryExportAccountantService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}

  ngOnInit(): void {
    
    const dateStart = new Date();
    dateStart.setMonth(dateStart.getMonth() - 1);
    this.filters.dateStart = dateStart;

    if (this.tabData) {
      this.filters.status = this.tabData.status;
    }
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  search(){
    if (this.tb_Master) {
      this.tb_Master.setData([]);
      this.tb_Master.replaceData();
      // Cập nhật visibility của các cột sau khi search
      setTimeout(() => {
        this.updateColumnVisibility();
      }, 100);
    }
  }

  exportTableToExcel(): void {
    const data = this.tb_Master?.getData() || [];
    if (data.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch sử xuất kế toán');

    worksheet.columns = [
      { header: 'Mã khách hàng', key: 'CustomerCode', width: 15 },
      { header: 'Khách hàng', key: 'CustomerName', width: 30 },
      { header: 'Số phiếu', key: 'Code', width: 15 },
      { header: 'Ngày xuất phiếu', key: 'CreatedDate', width: 15 },
      { header: 'Mã vật tư', key: 'ProductNewCode', width: 15 },
      { header: 'Mã sản phẩm', key: 'ProductCode', width: 15 },
      { header: 'Chi tiết sản phẩm', key: 'ProductName', width: 30 },
      { header: 'Mã sản phẩm theo dự án', key: 'ProductFullName', width: 30 },
      { header: 'ĐVT', key: 'Unit', width: 10 },
      { header: 'Số lượng', key: 'QtyAcountant', width: 12 },
      { header: 'Người lập phiếu xuất', key: 'FullName', width: 20 },
      { header: 'Ghi chú (PO)', key: 'Note', width: 25 },
      { header: 'Kho', key: 'ProductGroupName', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    data.forEach((row: any) => {
      worksheet.addRow({
        ...row,
        CreatedDate: row.CreatedDate ? new Date(row.CreatedDate).toLocaleDateString('vi-VN') : '',
      });
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LichSuXuatKeToan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
  
  initTable(): void {
    if (!this.tb_MasterElement) {
      console.error('tb_Master element not found');
      return;
    }
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      rowHeader: false,
      pagination: true,
      paginationMode: 'remote',
      selectableRows: 1,
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 200, 300, 500],
      ajaxURL: 'dummy',
      ajaxRequestFunc: (url, config, params) => {
        // const userId = this.appUserService.isAdmin ? 0 : (this.appUserService.id || 0);
        const page = params.page || 1;
        const size = params.size || 50;

        const dateStart = new Date(this.filters.dateStart || new Date());
        dateStart.setHours(0, 0, 0, 0);

        const dateEnd = new Date(this.filters.dateEnd || new Date());
        dateEnd.setHours(23, 59, 59, 999);

        return this.historyExportAccountantService.loadData(
          page,
          size,
          dateStart,
          dateEnd,
          this.filters.status || 0,
          (this.filters.filterText && this.filters.filterText.trim()) ? this.filters.filterText.trim() : '',
        ).toPromise().then((response) => {
          return response;
        }).catch((error) => {
          console.error('Error loading history export accountant data:', error);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu trạng thái sản phẩm!');
          throw error;
        });
      },
      ajaxResponse: (url, params, res) => {
        if (res && res.status === 1) {
          // Cập nhật visibility của các cột sau khi load data
          setTimeout(() => {
            this.updateColumnVisibility();
          }, 100);
          return {
            data: res.data.data || [],
            last_page: res.data.totalPage?.[0]?.TotalPage || 1,
          };
        }
        return {
          data: [],
          last_page: 1,
        };
      },
      columns: [
        {
          title: 'Mã khách hàng',
          field: 'CustomerCode',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          formatter: "textarea",
          width: 250,
        },
        {
          title: 'Số phiếu',
          field: 'Code',
          sorter: 'string',
          width: 100,
        },
        {
          title: 'Ngày xuất phiếu',
          field: 'CreatedDate',
          sorter: 'string',
          width: 100,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Mã vật tư',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 100,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Chi tiết sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 250,
          formatter: "textarea",
        },
        {
          title: 'Mã sản phẩm theo dự án',
          field: 'ProductFullName',
          sorter: 'string',
          width: 250,
          formatter: "textarea",
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          sorter: 'string',
          width: 100,
        },
        {
          title: 'Số lượng',
          field: 'QtyAcountant',
          sorter: 'number',
          width: 100,
          bottomCalc: 'sum',
          bottomCalcFormatter: (value: any) => {
            return value ? value.toLocaleString('vi-VN') : '0';
          },
        },
        {
          title: 'Người lập phiếu xuất',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Ghi chú (PO)',
          field: 'Note',
          sorter: 'string',
          width: 200,
          formatter: "textarea",
        },
        {
          title: 'Kho',
          field: 'ProductGroupName',
          sorter: 'string',
          width: 100,
        },
        {
          title: 'Số hóa đơn',
          field: 'InvoiceNumberAcountant',
          sorter: 'string',
          width: 150,
          visible: false, // Mặc định ẩn, chỉ hiện khi status = 1
        },
        {
          title: 'Ngày xuất hóa đơn',
          field: 'CreatedDateAcountant',
          sorter: 'string',
          width: 150,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          sorter: 'number',
          width: 120,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Thành tiền chưa thuế',
          field: 'IntoMoneyWithoutVat',
          sorter: 'number',
          width: 150,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Thuế',
          field: 'VAT',
          sorter: 'number',
          width: 120,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toLocaleString('vi-VN') + '%' : '';
          },
        },
        {
          title: 'Tiền thuế',
          field: 'IntoMoney',
          sorter: 'number',
          width: 150,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Thành tiền bao gồm thuế',
          field: 'TotalIntoMoney',
          sorter: 'number',
          width: 150,
          visible: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toLocaleString('vi-VN') : '';
          },
        },
      ]
    });

    // Cập nhật visibility của các cột dựa trên status
    this.updateColumnVisibility();
  }

  updateColumnVisibility(): void {
    if (!this.tb_Master) return;

    const isStatusOne = this.filters.status === 1;
    const invoiceColumns = [
      'InvoiceNumberAcountant',
      'CreatedDateAcountant',
      'UnitPrice',
      'IntoMoneyWithoutVat',
      'VAT',
      'IntoMoney',
      'TotalIntoMoney'
    ];

    invoiceColumns.forEach((field) => {
      const column = this.tb_Master.getColumn(field);
      if (column) {
        if (isStatusOne) {
          column.show();
        } else {
          column.hide();
        }
      }
    });
  }
}
