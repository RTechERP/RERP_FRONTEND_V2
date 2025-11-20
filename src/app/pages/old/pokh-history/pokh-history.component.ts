import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
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
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { PokhHistoryServiceService } from './pokh-history-service/pokh-history-service.service';
import { ImportExcelComponent } from './import-excel/import-excel.component';

@Component({
  selector: 'app-pokh-history',
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
    CommonModule,
  ],
  templateUrl: './pokh-history.component.html',
  styleUrl: './pokh-history.component.css',
})
export class PokhHistoryComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;
  
  private tb_Table!: Tabulator;

  customers: any[] = [];
  mainData: any[] = [];
  selectedCustomer: any;
  customerId: number = 0;
  filters: any = {
    filterText: '',
    customerId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private customePartService: CustomerPartService,
    private notification: NzNotificationService,
    private POKHHistoryService: PokhHistoryServiceService,
    private modalService: NgbModal
  ) {}
  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 36);
    this.filters.startDate = startDate;
    this.loadCustomers();
    this.loadPOKHHistory(
      this.filters.filterText,
      this.filters.startDate,
      this.filters.endDate,
      this.filters.customerId
    );
  }
  ngAfterViewInit(): void {
    this.initTable();
  }
  searchPOKH() {
    this.loadPOKHHistory(
      this.filters.filterText,
      this.filters.startDate,
      this.filters.endDate,
      this.filters.customerId
    );
  }
  loadCustomers(): void {
    this.customePartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
          console.log(this.customers,'customers');
          if (this.customerId > 0) {
            this.selectedCustomer = this.customers.find(
              (c) => c.ID === this.customerId
            );
            if (this.selectedCustomer) {
            }
          }
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
      }
    );
  }
  loadPOKHHistory(
    keywords: string,
    startDate: Date,
    endDate: Date,
    cusId: number
  ): void {
    let cusCode = "";
    if (cusId && cusId !== 0) {
      const customer = this.customers.find(c => c.ID === cusId);
      if (customer) {
        cusCode = customer.CustomerCode;
      }
    }

    this.POKHHistoryService.loadData(
      keywords,
      startDate,
      endDate,
      cusCode
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = response.data;
          if (this.tb_Table) {
            this.tb_Table.replaceData(this.mainData);
          }
        } else {
          this.notification.error(
            'Lỗi khi tải lịch sử POKH:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải lịch sử POKH:', error);
      }
    );
  }
  importExcel() {
    const modalRef = this.modalService.open(ImportExcelComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });
  }
  async exportDetailTableToExcel() {
    if (!this.tb_Table) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('POKH_History_List');

    // Get column definitions from the table
    const columns = this.tb_Table.getColumns();

    // Define column formats
    const columnFormats: { [key: string]: string } = {
      PODate: 'dd/mm/yyyy',
      DeliverDate: 'dd/mm/yyyy',
      PaymentDate: 'dd/mm/yyyy',
      BillDate: 'dd/mm/yyyy',
      NetPrice: '#,##0',
      UnitPrice: '#,##0',
      TotalPrice: '#,##0',
      VAT: '#,##0',
      TotalPriceVAT: '#,##0',
      Dept: '#,##0',
    };

    // Add headers
    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const allData = this.tb_Table.getData();

    allData.forEach((rowData, rowIndex) => {
      const row = worksheet.addRow(
        columns.map((col) => {
          const field = col.getField();
          let value = rowData[field];

          if (
            columnFormats[field] &&
            columnFormats[field].includes('dd/mm/yyyy')
          ) {
            if (value && value !== '') {
              const dateValue =
                typeof value === 'string' ? new Date(value) : value;
              if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                return dateValue;
              }
            }
          }

          if (columnFormats[field] && columnFormats[field].includes('#,##0')) {
            if (value !== null && value !== undefined && value !== '') {
              const numValue =
                typeof value === 'string'
                  ? parseFloat(value.replace(/[^\d.-]/g, ''))
                  : Number(value);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }

          return value;
        })
      );

      row.eachCell((cell, colNumber) => {
        const column = columns[colNumber - 1];
        const field = column.getField();

        if (columnFormats[field]) {
          if (columnFormats[field].includes('dd/mm/yyyy')) {
            cell.numFmt = columnFormats[field];
          } else if (columnFormats[field].includes('#,##0')) {
            cell.numFmt = columnFormats[field];
          }
        }
      });
    });

    // Add bottom calculations for money columns
    // const bottomCalcRow = worksheet.addRow(
    //   columns.map((col) => {
    //     const column = col.getDefinition();
    //     const field = column.field as string;
    //     if (column.bottomCalc) {
    //       // Calculate total for all data
    //       let total = 0;
    //       allData.forEach((rowData) => {
    //         const value = rowData[field];
    //         if (typeof value === 'number') {
    //           total += value;
    //         } else if (!isNaN(Number(value))) {
    //           total += Number(value);
    //         }
    //       });
    //       return total;
    //     }
    //     return '';
    //   })
    // );

    // // Style the bottom calc row
    // bottomCalcRow.font = { bold: true };
    // bottomCalcRow.fill = {
    //   type: 'pattern',
    //   pattern: 'solid',
    //   fgColor: { argb: 'FFE0E0E0' },
    // };

    // // Add a label for the total row
    // const totalLabelCell = bottomCalcRow.getCell(1);
    // totalLabelCell.value = 'Tổng cộng';
    // totalLabelCell.font = { bold: true };

    // // Apply number formatting to total row for money columns
    // bottomCalcRow.eachCell((cell, colNumber) => {
    //   const column = columns[colNumber - 1];
    //   const field = column.getField();

    //   if (columnFormats[field] && columnFormats[field].includes('#,##0')) {
    //     cell.numFmt = columnFormats[field];
    //   }
    // });

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POKHHistory_List_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  initTable(): void {
    if (!this.tb_TableElement) {
      console.error('tb_Table element not found');
      return;
    }
    this.tb_Table = new Tabulator(this.tb_TableElement.nativeElement, {
      layout: 'fitDataFill',
      data: this.mainData,
      pagination: true,
      paginationSize: 50,
      height: '88.5vh',
      movableColumns: true,
      renderVerticalBuffer: 1000,
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
      columns: [
        {
          title: 'Mã khách',
          field: 'CustomerCode',
          sorter: 'string',
          width: 150,
        },
        { title: 'Loại', field: 'POTypeCode', sorter: 'string', width: 150 },
        { title: 'Index', field: 'IndexCode', sorter: 'string', width: 150 },
        { title: 'Số PO', field: 'PONumber', sorter: 'string', width: 150 },
        {
          title: 'Ngày PO',
          field: 'PODate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Mã hàng',
          field: 'ProductCode',
          sorter: 'string',
          width: 150,
          formatter: 'textarea',
        },
        { title: 'Model', field: 'Model', sorter: 'string', width: 150 },
        { title: 'SL', field: 'Quantity', sorter: 'string', width: 150 },
        {
          title: 'SL giao',
          field: 'QuantityDeliver',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'SL pending',
          field: 'QuantityPending',
          sorter: 'string',
          width: 150,
        },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 150 },
        {
          title: 'Giá net',
          field: 'NetPrice',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Thành tiền',
          field: 'TotalPrice',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'VAT',
          field: 'VAT',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng tiền sau VAT',
          field: 'TotalPriceVAT',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Giao hàng thực tế',
          field: 'DeliverDate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Thanh toán thực tế',
          field: 'PaymentDate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Ngày hóa đơn',
          field: 'BillDate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Số hóa đơn',
          field: 'BillNumber',
          sorter: 'string',
          width: 150,
        },
        { title: 'Công nợ', field: 'Dept', sorter: 'string', width: 150, formatter: 'textarea' },
        { title: 'Sale', field: 'Sale', sorter: 'string', width: 150 },
        { title: 'Pur', field: 'Pur', sorter: 'string', width: 150 },
      ],
    });
  }
}
