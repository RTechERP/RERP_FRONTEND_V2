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
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

import { CustomerServiceService } from './customer-service/customer-service.service';
import { group } from '@angular/animations';
import { ViewPokhService } from '../../view-pokh/view-pokh/view-pokh.service';
import { CustomerDetailComponent } from '../customer-detail/customer-detail.component';
import { CustomerMajorComponent } from '../customer-major/customer-major/customer-major.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
@Component({
  selector: 'app-customer',
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
  ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css',
})
export class CustomerComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;
  @ViewChild('tb_ContactTable', { static: false })
  tb_ContactTableElement!: ElementRef;
  @ViewChild('tb_AddressTable', { static: false })
  tb_AddressTableElement!: ElementRef;
  @ViewChild('tb_SaleTable', { static: false })
  tb_SaleTableElement!: ElementRef;

  sizeTbDetail: any = '0';
  sizeTbSaleTable: any = '0';
  activeView: 'contact' | 'address' | 'sale' = 'contact'; // Mặc định hiện Liên hệ

  private tb_MainTable!: Tabulator;
  private tb_ContactTable!: Tabulator;
  private tb_AddressTable!: Tabulator;
  private tb_SaleTable!: Tabulator;

  sizeSearch: string = '0';
  showDetail = false; // ← MẶC ĐỊNH ẨN
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private customerService: CustomerServiceService,
    private viewPokhService: ViewPokhService
  ) {}

  customerContactData: any[] = [];
  addressStockData: any[] = [];
  employeeSaleData: any[] = [];
  selectedRow: any = null;
  selectedId: number = 0;
  isEditMode: boolean = false;
  filterTeamData: any[] = [];
  filterSaleUserData: any[] = [];

  filters: any = {
    teamId: 0,
    userId: 0,
    keyword: '',
  };

  ngOnInit(): void {
    this.getEmployeeData();
    this.getTeamData();
  }
  

  ngAfterViewInit(): void {
    this.initAddressTable();
    this.initContactTable();
    this.initMainTable();
    this.initCustomerSaleTable();
  }

  searchData(): void {
    if (this.tb_MainTable) {
      this.tb_MainTable.setData(null, true);
    }
  }

  getTeamData(): void {
    this.viewPokhService.loadGroupSale().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterTeamData = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // this.notification.error(
        //   'Thông báo',
        //   'Lỗi kết nối khi tải tệp POKH: ' + error
        // );
      },
    });
  }

  getEmployeeData(): void {
    this.customerService.getEmployees(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterSaleUserData = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        // this.notification.error(
        //   'Thông báo',
        //   'Lỗi kết nối khi tải tệp POKH: ' + error
        // );
      },
    });
  }

  getMainDataAjaxParams(): any {
    return (params: any) => {
      //   console.log('Params từ Tabulator:', params);

      return {
        filterText: this.filters.keyword || '',
        groupId: this.filters.teamId || 0,
        employeeId: this.filters.userId || 0,
      };
    };
  }

  getContactAndAddress(customerId: number): void {
    this.customerService.getContactAndAddress(customerId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customerContactData = response.data.contact;
          this.addressStockData = response.data.address;
          this.employeeSaleData = response.data.employee;
          this.tb_ContactTable.setData(this.customerContactData);
          this.tb_AddressTable.setData(this.addressStockData);
          this.tb_SaleTable.setData(this.employeeSaleData);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải dữ liệu: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải dữ liệu: ' + error
        );
      },
    });
  }

  openModal() {
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.EditID = this.selectedId;
    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.selectedRow = [];
          this.selectedId = 0;
          if (this.tb_MainTable) {
            this.tb_MainTable.setData(null, true);
          }
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }
  setDefautSearch(){
    this.filters.keyword = "";
    this.filters.userId = 0;
    this.filters.teamId = 0;

  }

  openMajorModal() {
    const modalRef = this.modalService.open(CustomerMajorComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.result.then(
      (result) => {},
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  onDelete() {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = {
          Customer: {
            ID: this.selectedId ?? 0,
            IsDeleted: true,
            CustomerName: '',
            CustomerCode: '',
          },
          CustomerContacts: [],
          AddressStocks: [],
          CustomerEmployees: [],
          BusinessFieldID: 0,
        };

        this.customerService.save(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công');
            } else {
              this.notification.error(
                'Lỗi',
                res?.message || 'Không thể xóa dữ liệu'
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Lỗi',
              err?.message || 'Không thể xóa dữ liệu'
            );
          },
        });
      },
    });
  }

  onEdit(): void {
    if (this.selectedId > 0) {
      this.isEditMode = true;
      this.openModal();
    } else {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 bản ghi cần sửa!');
    }
  }

  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitDataFill',
      //   height: '90%',
      //   selectableRows: 1,
      //   pagination: true,
      //   paginationSize: 100,
      //   paginationMode: 'remote',
      //   paginationSizeSelector: [10, 30, 50, 100, 200, 300, 500],
      ajaxURL: this.customerService.getMainDataAjax(),
      //ajaxConfig: 'POST',
      ajaxParams: this.getMainDataAjaxParams(),
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          filterText: this.filters.keyword || '',
          groupId: this.filters.teamId || 0,
          employeeId: this.filters.userId || 0,
          page: params.page || 1,
          size: params.size || 50,
        };
        return this.customerService.getMainData2(request).toPromise();
      },

      ajaxResponse: (url, params, res) => {
        // console.log(res.data.data);
        // console.log(res.data.data1.TotalPage);

        return {
          data: res.data.data,
          last_page: res.data.data1[0].TotalPage,
          // data: res?.data?.data?.data ?? [],
          //last_page: res?.data?.data?.data1?.[0]?.TotalPage ?? 1,
        };
      },
      //   langs: {
      //     vi: {
      //       pagination: {
      //         first: '<<',
      //         last: '>>',
      //         prev: '<',
      //         next: '>',
      //       },
      //     },
      //   },
      //   locale: 'vi',
      //   movableColumns: true,
      //   resizableRows: true,
      //   reactiveData: true,
      //   columnDefaults: {
      //     headerWordWrap: true,
      //     headerVertical: false,
      //     headerHozAlign: 'center',
      //     minWidth: 60,
      //     resizable: true,
      //   },
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Mã khách', field: 'CustomerCode', frozen: true },
        { title: 'Tên kí hiệu', field: 'CustomerShortName', frozen: true },
        {
          title: 'Tên khách',
          field: 'CustomerName',
          frozen: true,
          formatter: 'textarea',
        },
        { title: 'Địa chỉ', field: 'Address', formatter: 'textarea' },
        { title: 'Mã số thuế', field: 'TaxCode' },
        { title: 'Loại hình', field: 'TypeName' },
        {
          title: 'Lưu ý giao hàng',
          field: 'NoteDelivery',
          formatter: 'textarea',
        },
        {
          title: 'Lưu ý chứng từ',
          field: 'NoteVoucher',
          formatter: 'textarea',
        },
        { title: 'Đầu mối gửi check chứng từ', field: 'CheckVoucher' },
        { title: 'Đầu mối gửi chứng từ bản cứng', field: 'HardCopyVoucher' },
        { title: 'Ngày chốt công nợ', field: 'ClosingDateDebt' },
        { title: 'Công nợ', field: 'Debt' },
        {
          title: 'Địa chỉ giao hàng',
          field: 'AdressStock',
          formatter: 'textarea',
        },
      ],
    });
    this.tb_MainTable.on('dataLoading',()=>{
      this.tb_MainTable.deselectRow();
      this.sizeTbDetail='0';
    })
    this.tb_MainTable.on('rowClick', (e: any, row: RowComponent) => {
      this.sizeTbDetail = null;

      const rowData = row.getData();
      this.selectedRow = rowData;
      this.selectedId = rowData['ID'];
      // Load dữ liệu phụ
      this.getContactAndAddress(this.selectedId);
    });
  }

  initContactTable(): void {
    this.tb_ContactTable = new Tabulator(
      this.tb_ContactTableElement.nativeElement,
      {
        data: this.customerContactData,
        ...DEFAULT_TABLE_CONFIG,
        // layout: 'fitColumns',
       
        // selectableRows: 1,
        pagination: false,
        // paginationSize: 100,
        // movableColumns: true,
        // resizableRows: true,
        // reactiveData: true,
        // columnDefaults: {
        //   headerWordWrap: true,
        //   headerVertical: false,
        //   headerHozAlign: 'center',
        //   minWidth: 60,
        //   resizable: true,
        // },
        columns: [
          { title: 'ID', field: 'ID', visible: false },
          { title: 'Tên liên hệ', field: 'ContactName' },
          { title: 'Bộ phận', field: 'CustomerPart' },
          { title: 'Chức vụ', field: 'CustomerPosition' },
          { title: 'Team', field: 'CustomerTeam' },
          { title: 'ContactEmail', field: 'ContactEmail', visible: false },
          { title: 'ContactPhone', field: 'ContactPhone', visible: false },
        ],
      }
    );
  }

  initAddressTable(): void {
    this.tb_AddressTable = new Tabulator(
      this.tb_AddressTableElement.nativeElement,
      {
        data: this.addressStockData,
        ...DEFAULT_TABLE_CONFIG,
        // layout: 'fitDataFill',
       
        // selectableRows: 1,
        pagination: true,
        // paginationSize: 100,
        // movableColumns: true,
        // resizableRows: true,
        // reactiveData: true,
        // columnDefaults: {
        //   headerWordWrap: true,
        //   headerVertical: false,
        //   headerHozAlign: 'center',
        //   minWidth: 60,
        //   resizable: true,
        // },
        columns: [
          { title: 'ID', field: 'ID', width: '100%', visible: false },
          { title: 'Địa chỉ giao hàng', field: 'Address', width: '100%' },
        ],
      }
    );
  }

  initCustomerSaleTable(): void {
    this.tb_SaleTable = new Tabulator(this.tb_SaleTableElement.nativeElement, {
      data: this.employeeSaleData,
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitDataFill',
      height: '90%',
      //   selectableRows: 1,
      pagination: false,
      //   paginationSize: 100,
      //   movableColumns: true,
      //   resizableRows: true,
      //   reactiveData: true,
      //   columnDefaults: {
      //     headerWordWrap: true,
      //     headerVertical: false,
      //     headerHozAlign: 'center',
      //     minWidth: 60,
      //     resizable: true,
      //   },
      columns: [
        { title: 'ID', field: 'ID', width: '100%', visible: false },
        { title: 'Nhân viên Sale', field: 'FullName', width: '100%' },
      ],
    });
  }
}
