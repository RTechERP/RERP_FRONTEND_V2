import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input,  } from '@angular/core';
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
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';

import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { RequestInvoiceDetailService } from './request-invoice-detail-service/request-invoice-detail-service.service';

@Component({
  selector: 'app-request-invoice-detail',
  templateUrl: './request-invoice-detail.component.html',
  styleUrls: ['./request-invoice-detail.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzDatePickerModule,
    NzCardModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzAutocompleteModule,
    NzUploadModule,
    NzInputNumberModule,
    NzModalModule,
    NzSwitchModule,
    NzTabsModule,
    NzDropDownModule,
    NzFormModule
  ],
  standalone: true
})
export class RequestInvoiceDetailComponent implements OnInit {
  @ViewChild('tb_InvoiceFile', { static: false }) tb_InvoiceFileElement!: ElementRef;
  @ViewChild('tb_DataTable', {static : false}) tb_DataTableElement!: ElementRef;

  private tb_InvoiceFile!: Tabulator;
  private tb_DataTable!: Tabulator;
  
  //Form data
  formData: any = this.getDefaultFormData();

  //Data arrays

  customers: any[] = [];
  projects: any[] = [];
  employees: any[] = [];
  taxCompanies: any[] = [];
  products: any[] = [];
  files: File[] = [];
  deletedFileIds: number[] = [];
  statuses: any[] = [
    { value: 1, label: 'Yêu cầu xuất hóa đơn' },
    { value: 2, label: 'Đã xuất nháp' },
    { value: 3, label: 'Đã phát hành hóa đơn' },
  ];
  taxCompanyOptions: any[] = [
    { value: 1, label: 'RTC' },
    { value: 2, label: 'APR' },
    { value: 3, label: 'MVI' },
    { value: 4, label: 'Yonko'}
  ];

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private viewPokhService: ViewPokhService,
    private RIDService: RequestInvoiceDetailService
  ) {}

  ngOnInit(): void {
    this.formData = this.getDefaultFormData();
    this.loadCustomer();
    this.loadEmployee();
  }

  ngAfterViewInit(): void {
    this.initInvoiceFile();
    this.initDataTable();
  }
  //#region Load dữ liệu từ API
  loadCustomer(): void {
    this.viewPokhService.loadCustomer().subscribe(
      response => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          console.error('Lỗi khi tải Customer:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }
  loadProject(): void {
    this.RIDService.loadProject().subscribe(
      response => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          console.error('Lỗi khi tải Project:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Project:', error);
      }
    );
  }
  loadProductSale(): void {
    this.RIDService.loadProductSale().subscribe(
      response => {
        if (response.status === 1) {
          this.products = response.data;
        } else {
          console.error('Lỗi khi tải Product:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Product:', error);
      }
    );
  }
  loadEmployee(): void {
    this.RIDService.loadEmployee().subscribe(
      response => {
        if (response.status === 1) {
          this.employees = response.data;
        } else {
          console.error('Lỗi khi tải Employees:', response.message);
        }
      },
      error => {
        console.error('Lỗi kết nối khi tải Employees:', error);
      }
    );
  }
  //#endregion

  onCustomerChange(customerId: number): void {
    const customer = this.customers.find(c => c.ID === customerId);
    if (customer) {
      this.formData.customerCode = customer.Code;
      this.formData.address = customer.Address;
    }
    this.onFormChange();
  }

  onUserChange(userId: number): void {
    this.onFormChange();
  }

  onFormChange(): void {
    // TODO: Implement form change handling
  }

  saveAndClose(): void {
    // TODO: Implement save and close logic
    this.notification.success('Thành công', 'Lưu dữ liệu thành công');
  }

  closeModal(): void {
    this.activeModal.close();
  }
  getDefaultFormData(): any {
    return {
      customerId: null,
      customerCode: '',
      address: '',
      userId: null,
      requestDate: new Date().toISOString().split('T')[0],
      exportDate: new Date().toISOString().split('T')[0],
      taxCompanyId: null,
      status: null,
      note: ''
    };
  }
  //#region Các hàm vẽ bảng
  initInvoiceFile(): void {
    this.tb_InvoiceFile = new Tabulator(this.tb_InvoiceFileElement.nativeElement, {
      data: this.files,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      height:"21vh",
      paginationSize: 5,
      columns: [
        {
          title: 'Hành động',
          field: 'actions',
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: "30%",
          hozAlign: "center",
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              if (confirm('Bạn có chắc chắn muốn xóa file này?')) {
                const row = cell.getRow();
                const rowData = row.getData();

                // thêm id của file đã xóa vào mảng deletedFileIds
                if (rowData['ID']) {
                  this.deletedFileIds.push(rowData['ID']);
                }

                row.delete();
                this.files = this.tb_InvoiceFile.getData();
              }
            }
          }
        },
        { title: 'Tên file', field: 'fileName', sorter: 'string', width: "70%" },
      ]
    })
  }
  initDataTable(): void {
    this.tb_DataTable = new Tabulator(this.tb_DataTableElement.nativeElement, {
      data: this.products, //sai du lieu
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      height:"40vh",
      paginationSize: 5,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false
      },
      columns: [
        { title: 'Mã nội bộ', field: 'ProductNewCode', sorter: 'string', width: "10%" },
        { title: 'Mã sản phẩm', field: 'ProductSaleID', sorter: 'string', width: "15%" },
        { title: 'Mã sản phẩm theo Dự án', field: 'ProductFullName', sorter: 'string', width: "15%" },
        { title: 'Tên sản phẩm', field: 'ProductName', sorter: 'string', width: "15%" },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: "10%" },
        { title: 'Số lượng', field: 'Quantity', sorter: 'string', width: "10%" },
        { title: 'Mã dự án', field: 'ProjectCode', sorter: 'string', width: "15%" },
        { title: 'Dự án', field: 'ProjectID', sorter: 'string', width: "15%" },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: "15%" },
        { title: 'Thông số kỹ thuật', field: 'Specifications', sorter: 'string', width: "15%" },
        { title: 'Số hóa đơn', field: 'InvoiceNumber', sorter: 'string', width: "15%" },
        { title: 'Ngày hóa đơn', field: 'InvoiceDate', sorter: 'string', width: "15%" },
      ]
    })
  }
  //#endregion

}
