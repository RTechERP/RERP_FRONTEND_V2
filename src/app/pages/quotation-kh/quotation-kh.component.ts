import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input, IterableDiffers } from '@angular/core';
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
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
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

import { QuotationKhServicesService } from './quotation-kh-services/quotation-kh-services.service';
import { QuotationKhDetailComponent } from '../quotation-kh-detail/quotation-kh-detail.component';
import { QuotationKhDetailServiceService } from '../quotation-kh-detail/quotation-kh-detail-service/quotation-kh-detail-service.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';

@Component({
  selector: 'app-quotation-kh',
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
  templateUrl: './quotation-kh.component.html',
  styleUrl: './quotation-kh.component.css'
})
export class QuotationKhComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false }) tb_MainTableElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;

  private mainTable!: Tabulator;
  private detailTable!: Tabulator;

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private quotationKhServices: QuotationKhServicesService,
    private quotationKhDetailService: QuotationKhDetailServiceService,
    private customerPartService: CustomerPartService,
  ) { }
  filterUserData: any[] = [];
  filterCustomerData: any[] = [];
  dataDetail: any[] = [];
  selectedId: number = 0;
  isEditMode: boolean = false;

  filters: any = {
    filterText: "",
    customerId: 0,
    userId: 0,
    status: -1,
  };

  statusOptions = [
    { value: 0, label: 'Chờ phản hồi' },
    { value: 1, label: 'Fail' },
    { value: 2, label: 'Thành PO' },
  ];

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadCustomer();
  }
  ngAfterViewInit(): void {
    this.initMainTable();
    this.initDetailTable();
  }
  openModal() {
    const modalRef = this.modalService.open(QuotationKhDetailComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  loadUsers(): void {
    this.quotationKhDetailService.getUser().subscribe(
      response => {
        if (response.status === 1) {
          this.filterUserData = response.data;

        } else {
          this.notification.error('Lỗi khi tải dữ liệu User:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải User:', error);
      }
    );
  }

  loadCustomer(): void{
    this.customerPartService.getCustomer().subscribe(
      response => {
        if (response.status === 1) {
          this.filterCustomerData = response.data;

        } else {
          this.notification.error('Lỗi khi tải dữ liệu Customer:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }

  searchData(): void {
    if (this.mainTable) {
      this.mainTable.setData(); 
    }
  }

  loadQuotationKHDetail(id: number): void {
    this.quotationKhServices.getQuotationKHDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataDetail = response.data;
          if (this.detailTable) {
            this.detailTable.setData(this.dataDetail);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  getQuotationKHAjaxParams(): any {
    return (params: any) => {
      console.log("Params từ Tabulator:", params);

      return {
        filterText: this.filters.filterText || "",
        customerId: this.filters.customerId || 0,
        userId: this.filters.userId || 0,
        status: this.filters.status || -1,
      };
    };
  }
  initMainTable(): void {
    this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      layout: 'fitDataFill',
      height: '91vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      paginationMode: 'remote',
      paginationSizeSelector: [10, 30, 50, 100, 300],
      ajaxURL: this.quotationKhServices.getQuotationKHAjax(),
      ajaxParams: this.getQuotationKHAjaxParams(),
      ajaxResponse: (url, params, res) => {
        console.log('total', res.data[0].TotalPage);
        console.log('data', res.data);
        return {
          data: res.data,
          last_page: res.data[0].TotalPage,
        };
      },
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
          title: 'Duyệt', field: 'IsApproved', sorter: 'boolean', width: 80, formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          }
        },
        { title: 'Trạng thái', field: 'StatusText', sorter: 'string', width: 150 },
        { title: 'Mã báo giá', field: 'QuotationCode', sorter: 'string', width: 150 },
        { title: 'PO', field: 'POCode', sorter: 'string', width: 150 },
        { title: 'Dự án', field: 'ProjectCode', sorter: 'string', width: 150 },
        { title: 'Khách hàng', field: 'CustomerName', sorter: 'string', width: 150 },
        { title: 'Người liên hệ', field: 'ContactName', sorter: 'string', width: 150 },
        { title: 'SĐT người liên hệ', field: 'ContactPhone', sorter: 'string', width: 150 },
        {
          title: 'Ngày tạo', field: 'CreateDate', sorter: 'string', width: 150, formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Ngày báo giá', field: 'QuotationDate', sorter: 'string', width: 150, formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Tổng tiền', field: 'TotalPrice', sorter: 'number', width: 200, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.TotalPriceIncludeVAT) {
                total += Number(row.TotalPriceIncludeVAT);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Tiền COM', field: 'ComMoney', sorter: 'string', width: 150 },
        {
          title: 'COM (%)', field: 'VAT', sorter: 'number', width: 150, formatter: function (cell) {
            return cell.getValue() + '%';
          }
        },
        { title: 'Người phụ trách', field: 'FullName', sorter: 'string', width: 150 },
        { title: 'Giải trình Fail', field: 'Explanation', sorter: 'string', width: 150 },
        { title: 'Download File', field: 'AttachFile', sorter: 'string', width: 150 },

      ]
    });
    this.mainTable.on('rowClick', (e: any, row: RowComponent) => {
      const ID = row.getData()['ID'];
      this.selectedId = ID;
      this.loadQuotationKHDetail(ID);
    });
  }

  initDetailTable(): void {
    this.detailTable = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      movableColumns: true,
      height: "88vh",
      resizableRows: true,
      reactiveData: true,
      columns: [
        { title: 'Mã nội bộ', field: 'ProductNewCode', sorter: 'string', width: 150 },
        { title: 'Tên sản phẩm', field: 'ProductName', sorter: 'string', width: 150 },
        { title: 'Mã báo khách', field: 'InternalCode', sorter: 'string', width: 80 },
        { title: 'Hãng', field: 'Maker', sorter: 'string', width: 150 },
        { title: 'Đơn vị', field: 'Unit', sorter: 'string', width: 150 },
        { title: 'Số lượng', field: 'Qty', sorter: 'string', width: 150 },
        { title: 'Đơn giá báo trước VAT', field: 'UnitPrice', sorter: 'string', width: 150 },
        {
          title: 'Thành tiền trước VAT', field: 'IntoMoney', sorter: 'number', width: 200,
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: function (values, data, calcParams) {
            let total = 0;
            const processRow = (row: any) => {
              if (row.TotalPriceIncludeVAT) {
                total += Number(row.TotalPriceIncludeVAT);
              }
              if (row._children) {
                row._children.forEach(processRow);
              }
            };
            data.forEach(processRow);
            return total;
          },
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Loại tiền', field: 'TypeOfPrice', sorter: 'string', width: 150 },
        { title: 'Đơn giá nhập', field: 'UnitPriceImport', sorter: 'string', width: 150 },
        { title: 'Tổng giá nhập', field: 'TotalPriceImport', sorter: 'string', width: 150 },
        { title: 'Giá net', field: 'GiaNet', sorter: 'string', width: 150 },
        { title: 'Nhóm', field: 'GroupQuota', sorter: 'string', width: 150 },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 150 },
      ]
    });
  }
}
