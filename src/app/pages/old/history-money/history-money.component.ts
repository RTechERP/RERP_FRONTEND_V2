import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
  viewChild,
  input,
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
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../app.config';

import { HistoryMoneyService } from './history-money-service/history-money.service';
@Component({
  selector: 'app-history-money',
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
    NzTreeSelectModule,
    NzCollapseModule,
    NzFormModule,
  ],
  templateUrl: './history-money.component.html',
  styleUrl: './history-money.component.css'
})
export class HistoryMoneyComponent implements OnInit, AfterViewInit {

  @Input() filterText: any;

  @ViewChild('tb_Product', { static: false })
  tb_ProductElement!: ElementRef;

  @ViewChild('tb_Data', { static: false })
  tb_DataElement!: ElementRef;


  tb_Product!: Tabulator;
  tb_Data!: Tabulator;

  rowSelectedTotalPriceIncludeVAT: any;
  rowSelectedPokhDetailId: number = 0;
  rowSelectedPokhId: number = 0;
  bankNames: any[] = [];
  dataProduct: any[] = [];
  mainData: any[] = [];

  listIdsDel: any[] = [];


  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private historyMoneyService: HistoryMoneyService
  ) { }

  ngOnInit(): void {
    this.loadBankNames();
    this.loadProduct(this.filterText);
  }

  ngAfterViewInit(): void {
    this.initDataTable();
    this.initProductTable();
  }

  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
  }

  onSearch() {
    this.loadProduct(this.filterText);
  }

  loadBankNames(): void {
    this.historyMoneyService.getBankNames().subscribe(
      (response) => {
        if (response.status === 1) {
          this.bankNames = response.data;
          console.log(this.bankNames, 'bankNames');
        } else {
          this.notification.error('Lỗi khi tải tên ngân hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải tên ngân hàng:', error);
      }
    );
  }

  loadProduct(text: string): void {
    this.historyMoneyService.getProductData(text).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataProduct = response.data;
          console.log(this.dataProduct, 'dataProduct');
          if (this.tb_Product) {
            this.tb_Product.setData(this.dataProduct);
          }
        } else {
          this.notification.error('Lỗi khi tải sản phẩm:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải sản phẩm:', error);
      }
    );
  }

  loadHistoryMoneyPO(pokhDetailId: number): void {
    this.listIdsDel = [];
    this.historyMoneyService.getHistoryMoneyPO(pokhDetailId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = this.prepareVatForTable(response.data);
          console.log(this.mainData, 'mainData');
          if (this.tb_Data) {
            this.tb_Data.setData(this.mainData);
          }
        } else {
          this.notification.error('Lỗi khi tải PO:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải PO:', error);
      }
    );
  }

  saveAndClose() {

    const normalizedTableData = this.tb_Data
      .getData()
      .map((row) => ({
        ...row,
        VAT: this.convertVatToDecimal(row.VAT),
      }));

    const requestBody = {
      historyMoneyPOs: normalizedTableData,
      pokhDetailId: this.rowSelectedPokhDetailId,
      pokhId: this.rowSelectedPokhId,
      totalMoneyIncludeVAT: this.rowSelectedTotalPriceIncludeVAT,
      listIdsDel: this.listIdsDel,

    }

    this.historyMoneyService.saveHistoryMoney(requestBody).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          // this.activeModal.close({ success: true, reloadData: true });

          //update lại TotalMoneyRemaining cho dòng sau khi lưu xong
          if (response.data && response.data.TotalMoneyRemaining !== undefined) {
            const selectedRow = this.tb_Product.getRows().find(
              (row: any) => row.getData().ID === this.rowSelectedPokhDetailId
            );

            if (selectedRow) {
              selectedRow.update({ TotalMoneyRemaining: response.data.TotalMoneyRemaining });
            }
          }

        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.message || 'Không thể lưu dữ liệu');
      },
    });

  }

  initProductTable(): void {
    this.tb_Product = new Tabulator(this.tb_ProductElement.nativeElement, {
      data: this.dataProduct,
      layout: 'fitColumns',
      pagination: true,
      paginationSize: 15,
      selectableRows: 1,
      height: '100%',
      movableColumns: true,
      resizableRows: true,
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
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          width: 70,
          visible: false,
        },
        {
          title: 'POKHID',
          field: 'POKHID',
          sorter: 'number',
          width: 70,
          visible: false,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Tổng tiền',
          field: 'TotalPriceIncludeVAT',
          sorter: 'number',
          width: 150,
          hozAlign: 'right',
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
          title: 'Số tiền còn lại',
          field: 'TotalMoneyRemaining',
          sorter: 'number',
          width: 150,
          hozAlign: 'right',
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
          title: 'Số lượng',
          field: 'Qty',
          sorter: 'number',
          width: 70,
          hozAlign: 'right',
        },
        {
          title: 'PO',
          field: 'POCode',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Số hóa đơn',
          field: 'BillNumber',
          sorter: 'string',
          width: 150,
        },
      ],
    });

    this.tb_Product.on('rowClick', (e: any, row: RowComponent) => {
      const data = row.getData();
      this.rowSelectedPokhDetailId = data['ID'];
      this.rowSelectedTotalPriceIncludeVAT = data['TotalPriceIncludeVAT']
      this.rowSelectedPokhId = data['POKHID'];
      if (this.rowSelectedPokhDetailId) {
        this.loadHistoryMoneyPO(this.rowSelectedPokhDetailId);
      }
    });
  }

  addNewRow(): void {
    const newRow = {
      ID: 0,
      // POKHID: this.pokhId || 0,
      MoneyDate: null,
      Money: 0,
      Note: '',
      BankName: '',
      InvoiceNo: '',
      VAT: 0,
      MoneyVAT: 0,
      IsFilm: false,
      IsDeleted: false,
    };
    this.tb_Data.addRow(newRow);
  }

  initDataTable(): void {
    this.tb_Data = new Tabulator(this.tb_DataElement.nativeElement, {
      data: this.mainData,
      layout: 'fitColumns',
      pagination: true,
      paginationSize: 15,
      height: '100%',
      movableColumns: true,
      resizableRows: true,
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
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewRow();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fullName = data['FullName']
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa nhân viên sale`,
              nzContent: `${fullName}`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.listIdsDel.includes(id)) this.listIdsDel.push(id);
                  this.tb_Data.deleteRow(cell.getRow());
                  console.log("this: ", this.listIdsDel)
                } else {
                  this.tb_Data.deleteRow(cell.getRow());
                }
              },
            });
            //this.updateSTTColumn();
          },
        },
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          width: 70,
          visible: false,
        },
        {
          title: 'POKHID',
          field: 'POKHID',
          sorter: 'number',
          width: 70,
          visible: false,
        },
        {
          title: 'Ngày tiền về',
          field: 'MoneyDate',
          sorter: 'date',
          editor: 'date',
          width: 150,
          hozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        },
        {
          title: 'Tiền về',
          field: 'Money',
          sorter: 'number',
          width: 150,
          hozAlign: 'right',
          editor: 'input',
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
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          editor: 'textarea',
          width: 150,
        },
        {
          title: 'Tên ngân hàng',
          field: 'BankName',
          sorter: 'string',
          editor: 'list',
          editorParams: () => ({
            values: this.bankNames.map((bank) => ({
              label: `${bank.BankName}`,
              value: bank.BankName,
            })),
            listOnEmpty: true,
            autocomplete: true,
          }),
          width: 250,
        },
        {
          title: 'Số hóa đơn',
          field: 'InvoiceNo',
          sorter: 'number',
          editor: 'input',
          width: 150,
        },
        {
          title: 'VAT',
          field: 'VAT',
          sorter: 'number',
          editor: 'input',
          width: 70,
          hozAlign: 'right',
          formatter: function (cell) {
            return cell.getValue() + '%';
          },
        },
        {
          title: 'Tiền trước VAT',
          field: 'MoneyVAT',
          sorter: 'number',
          width: 150,
          hozAlign: 'right',
          editor: 'input',
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
          title: 'Film',
          field: 'IsFilm',
          sorter: 'boolean',
          width: 70,
          hozAlign: 'center',
          formatter: 'tickCross',
          cellClick: (e: any, cell: any) => {
            const currentValue = cell.getValue();
            cell.setValue(!currentValue);
          },
        },
      ],
    });
  }

  private prepareVatForTable(data: any[]): any[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      VAT: this.convertVatToPercent(item?.VAT),
    }));
  }

  private convertVatToPercent(value: any): number {
    const sanitized = this.sanitizeVatValue(value);
    if (sanitized === null) {
      return 0;
    }
    return sanitized > 1 ? sanitized : sanitized * 100;
  }

  private convertVatToDecimal(value: any): number {
    const sanitized = this.sanitizeVatValue(value);
    if (sanitized === null) {
      return 0;
    }
    // Nếu giá trị > 1, coi như là phần trăm và chia cho 100
    // Ví dụ: 500% -> 5, 10% -> 0.1
    if (sanitized > 1) {
      return sanitized / 100;
    }
    // Nếu <= 1, giữ nguyên (đã là decimal)
    return sanitized;
  }

  private sanitizeVatValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    let processedValue = value;
    if (typeof processedValue === 'string') {
      processedValue = processedValue.replace('%', '').trim();
    }
    const parsed = Number(processedValue);
    return isNaN(parsed) ? null : parsed;
  }
}
