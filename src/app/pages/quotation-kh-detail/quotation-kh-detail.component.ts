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

import { QuotationKhDetailServiceService } from './quotation-kh-detail-service/quotation-kh-detail-service.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { PokhService } from '../pokh/pokh-service/pokh.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';

@Component({
  selector: 'app-quotation-kh-detail',
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
  templateUrl: './quotation-kh-detail.component.html',
  styleUrl: './quotation-kh-detail.component.css'
})
export class QuotationKhDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false }) tb_MainTableElement!: ElementRef;

  private mainTable!: Tabulator;

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private quotationKhDetailService: QuotationKhDetailServiceService,
    private customerPartService: CustomerPartService,
    private pokhService: PokhService,
    private RIDService: RequestInvoiceDetailService
  ) { }

  formData: any = this.getDefaultFormData();
  data: any[] = [];
  customers: any[] = [];
  contact: any[] = [];
  projects: any[] = [];
  products: any[] = [];
  Users: any[] = [];
  details: any[] = [];
  deletedQuotationKHDetailIds: number[] = [];
  selectedCustomer: any = null;

  showRTCCode: boolean = false;

  companyOptions = [
    { value: "RTC", label: 'RTC' },
    { value: "MVI", label: 'MVI' },
    { value: "APR", label: 'APR' },
  ];
  statusOptions = [
    { value: 0, label: 'Chờ phản hồi' },
    { value: 1, label: 'Fail' },
    { value: 2, label: 'Thành PO' },
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.loadCustomer();
    this.loadProducts();
    this.loadProject();
  }
  ngAfterViewInit(): void {
  }
  closeModal() {
    this.activeModal.close();
  }
  saveAndClose() {

  }
  onAddCustomer() {
    alert('Thêm khách hàng mới!');
  }
  onAddProject() {
    alert('Thêm dự án mới!');
  }
  //#region Các hàm load dữ liệu
  loadUsers(): void {
    this.quotationKhDetailService.getUser().subscribe(
      response => {
        if (response.status === 1) {
          this.Users = response.data;

        } else {
          this.notification.error('Lỗi khi tải dữ liệu User:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải User:', error);
      }
    );
  }
  loadCustomer(): void {
    this.customerPartService.getCustomer().subscribe(
      response => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải dữ liệu Customer:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }

  loadProject(): void {
    this.pokhService.loadProject().subscribe(
      response => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          this.notification.error('Lỗi khi tải dữ liệu projects:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải projects:', error);
      }
    );
  }

  loadContact(id: number): void {
    this.quotationKhDetailService.getCustomerContact(id).subscribe(
      response => {
        if (response.status === 1) {
          this.contact = response.data;
        } else {
          this.notification.error('Lỗi khi tải dữ liệu contact:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải contact:', error);
      }
    );
  }
  loadCode(customerId: number, createDate: string): void {
    this.quotationKhDetailService.generateCode(customerId, "2025-07-02").subscribe(
      response => {
        if (response.status === 1) {
          this.formData.code = response.data;
        } else {
          this.notification.error('Lỗi khi tải dữ liệu contact:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải contact:', error);
      }
    );
  }
  loadProducts(): void {
    this.RIDService.loadProductSale().subscribe(
      response => {
        if (response.status === 1) {
          this.products = response.data;
          this.initMainTable();

        } else {
          this.notification.error('Lỗi khi tải dữ liệu products:', response.message);
        }
      },
      error => {
        this.notification.error('Lỗi kết nối khi tải products:', error);
      }
    );
  }
  //#endregion
  onCustomerChange(customerId: number, contactId?: number): void {
    this.selectedCustomer = this.customers.find(c => c.ID === customerId);
    this.formData.customerId = customerId;
    this.loadCode(customerId, this.formData.createDate);
    this.loadContact(customerId);
    this.formData.contactId = contactId ?? -1;
  }
  onProjectChange(projectId: number): void {
    if (!projectId) return;
    const project = this.projects.find((p: any) => p.ID === projectId);
    if (project) {
      this.formData.userId = project.UserID;
      this.onCustomerChange(project.CustomerID, project.ContactID);
    }
  }
  onContactChange(contactId: number): void {
    const ITEM = this.contact.find((c: any) => c.ID === contactId);
    if(ITEM == null || ITEM == undefined) {
      return;
    }
    else
    {
      this.formData.customerPhone = ITEM.ContactPhone;
    }

  }
  getDefaultFormData(): any {
    return {
      status: 0,
      code: '',
      poCode: '',
      totalPrice: '',
      createDate: new Date().toISOString().split('T')[0],
      projectId: '',
      comPercent: 0,
      comMoney: '',
      comEnabled: true,
      quotationDate: new Date().toISOString().split('T')[0],
      company: 'RTC',
      explanation: '',
      dateMinutes: new Date().toISOString().split('T')[0],
      contactId: null,
      employeePhone: '',
      departmentName: '',
      customerId: null,
      customerName: null,
      customerContact: '',
      customerPhone: '',
      customerAddress: '',
      receiver: '',
      receiverPhone: '',
      adminWarehouse: null
    };
  }

  addNewRow(): void {
    const newRow = {
      STT: this.details.length + 1,
      IsSelected: false,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      InternalCode: '',
      Maker: '',
      Unit: '',
      Qty: 0,
      UnitPrice: 0,
      IntoMoney: 0,
      TypeOfPrice: '',
      UnitPriceImport: 0,
      TotalPriceImport: 0,
      GiaNet: 0,
      Note: '',
      GroupQuota: ''
    };
    this.mainTable.addRow(newRow);
  }
  initMainTable(): void {
    this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      height: '60vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        {
          title: '', field: 'actions', formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: '5%',
          hozAlign: "center",
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();

                  if (rowData['ID']) {
                    this.deletedQuotationKHDetailIds.push(rowData['ID']);
                  }
                  row.delete();
                  this.details = this.mainTable.getData();
                }
              });
            }
          }
        },
        { title: 'STT', field: 'STT', width: 60, editor: "input" },
        {
          title: 'Select', field: 'IsSelected', sorter: 'boolean', width: 80, formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          }
        },
        { title: 'Mã nội bộ', field: 'ProductNewCode', width: 200, editor: "input" },
        { title: 'Mã RTC', field: 'ProductRTCCode', width: 200, editor: "list", visible: false,
            editorParams: {
              values: this.products.map(item =>({
                label: item.ProductCode + ' - ' + item.ProductName,
                value: item.ProductNewCode,
                id: item.ID
              }))
            }
        },
        { title: 'Mã sản phẩm', field: 'ProductCode', width: 150, editor: "input" },
        { title: 'Tên sản phẩm', field: 'ProductName', width: 150, editor: "input" },
        { title: 'Mã báo khách', field: 'InternalCode', width: 150, editor: "input" },
        { title: 'Hãng', field: 'Maker', width: 120, editor: "input" },
        { title: 'Đơn vị', field: 'Unit', width: 120, editor: "input" },
        { title: 'Số lượng', field: 'Qty', width: 120, editor: "input" },
        { title: 'Đơn giá báo trước VAT', field: 'UnitPrice', width: 150, editor: "input" },
        { title: 'Thành tiền trước VAT', field: 'IntoMoney', width: 150, editor: "input" },
        { title: 'Loại tiền', field: 'TypeOfPrice', width: 120, editor: "input" },
        { title: 'Đơn giá nhập', field: 'UnitPriceImport', width: 150, editor: "input" },
        { title: 'Tổng giá nhập', field: 'TotalPriceImport', width: 150, editor: "input" },
        { title: 'Giá NET', field: 'GiaNet', width: 120, editor: "input" },
        { title: 'Ghi chú', field: 'Note', width: 120, editor: "input" },
        { title: 'Nhóm', field: 'GroupQuota', width: 120, editor: "input" },
      ]
    })
  }

  onRTCCodeToggle(checked: boolean) {
    this.showRTCCode = checked;
    if (this.mainTable) {
      if (checked) {
        this.mainTable.getColumn('ProductNewCode').hide();
        this.mainTable.getColumn('ProductRTCCode').show();
      } else {
        this.mainTable.getColumn('ProductNewCode').show();
        this.mainTable.getColumn('ProductRTCCode').hide();
      }
    }
  }

}
