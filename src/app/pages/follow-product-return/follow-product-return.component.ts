import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
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
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
  CellComponent as TabulatorCell,
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

import { FollowProductReturnService } from './follow-product-return/follow-product-return.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { PokhService } from '../pokh/pokh-service/pokh.service';

@Component({
  selector: 'app-follow-product-return',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
  ],
  templateUrl: './follow-product-return.component.html',
  styleUrl: './follow-product-return.component.css',
})
export class FollowProductReturnComponent implements OnInit, AfterViewInit {
  @ViewChild('dataTable', { static: false }) viewPOKHTableElement!: ElementRef;

  private dataTable!: Tabulator;

  public groups: any[] = [];
  public customers: any[] = [];
  public users: any[] = [];
  sizeSearch: string = '0';
  data: any[] = [];
  filters: any = {
    groupId: 0,
    customerId: 0,
    poType: 0,
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
    keyword: '',
  };
  constructor(
    private FPRService: FollowProductReturnService,
    public activeModal: NgbActiveModal,
    private CustomerService: CustomerPartService,
    private notification: NzNotificationService,
    private viewPokhService: ViewPokhService
  ) {}
  ngOnInit(): void {
    this.loadCustomer();
    this.loadGroupSale();
    this.loadUser();
    this.loadData();
  }
  ngAfterViewInit(): void {
    this.initDataTable();
  }
  closeModal(): void {
    this.activeModal.close();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }
  loadCustomer(): void {
    this.CustomerService.getCustomer().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải Customer:', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi kết nối khi tải Customer:', error);
      },
    });
  }
  loadGroupSale(): void {
    this.viewPokhService.loadGroupSale().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.groups = response.data;
        } else {
          this.notification.error('Lỗi khi tải GroupSale:', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi kết nối khi tải GroupSale:', error);
      },
    });
  }
  loadUser(): void {
    this.FPRService.loadUser().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.users = response.data;
        } else {
          this.notification.error('Lỗi khi tải users:', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi kết nối khi tải users:', error);
      },
    });
  }
  loadData(): void {
    const params = {
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      userId: this.filters.userId || 0,
      poType: this.filters.poType || 0,
      status: this.filters.status || 0,
      customerId: this.filters.customerId || 0,
      keyword: this.filters.keyword || '',
      startDate: this.filters.startDate,
      endDate: this.filters.endDate,
    };

    this.FPRService.loadData(
      params.startDate,
      params.endDate,
      params.keyword,
      params.customerId,
      params.userId,
      params.employeeTeamSaleId
    ).subscribe((response) => {
      this.data = response.data;
      if (this.dataTable) {
        this.dataTable.setData(this.data);
      }
    });
  }
  initDataTable(): void {
    this.dataTable = new Tabulator(this.viewPOKHTableElement.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      paginationSize: 50,
      height: '90vh',
      resizableRows: true,
      reactiveData: true,
      groupBy: 'PONumber',
      selectableRows: true,
      selectableRange: true,
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 80,
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            let bgColor = '';

            switch (value) {
              case 'Chưa giao , chưa thanh toán':
                bgColor = '#F2F5A9'; // Vàng nhạt
                break;
              case 'Chưa giao, đã thanh toán':
                bgColor = '#F5D0A9'; // Cam nhạt
                break;
              case 'Đã giao, nhưng chưa thanh toán':
                bgColor = '#A9F5F2'; // Xanh dương nhạt
                break;
              case 'Đã thanh toán, GH chưa xuất hóa đơn':
                bgColor = '#CEF6CE'; // Xanh lá nhạt
                break;
              default:
                bgColor = '#FFFFFF'; // Trắng
            }

            cell.getElement().style.backgroundColor = bgColor;
            return value || '';
          },
        },
        { title: 'Loại', field: 'MainIndex', sorter: 'number', width: 100 },
        {
          title: 'New Account',
          field: 'New Account',
          sorter: 'number',
          width: 100,
        },
        { title: 'Số POKH', field: 'PONumber', sorter: 'number', width: 100 },
        { title: 'Mã PO', field: 'POCode', sorter: 'number', width: 100 },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          sorter: 'number',
          width: 100,
        },
        { title: 'Dự Án', field: 'ProjectName', sorter: 'number', width: 100 },
        {
          title: 'Ngày nhận PO',
          field: 'ReceivedDatePO',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyCode',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tổng tiền nhận PO',
          field: 'TotalMoneyPO',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tổng tiền trước VAT',
          field: 'TotalMoneyKoVAT',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tiền về',
          field: 'ReceiveMoney',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tình trạng tiến độ giao hàng',
          field: 'DeliveryStatusText',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tình trạng xuất kho',
          field: 'ExportStatusText',
          sorter: 'number',
          width: 100,
        },
        { title: 'End User', field: 'EndUser', sorter: 'number', width: 100 },
        { title: 'Ghi chú', field: 'Note', sorter: 'number', width: 100 },
        { title: 'Công nợ', field: 'Debt', sorter: 'number', width: 100 },
        {
          title: 'Hóa đơn',
          field: 'ImportStatusText',
          sorter: 'number',
          width: 100,
        },
        { title: 'Đặt hàng', field: 'IsOder', sorter: 'number', width: 100 },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Mã theo khách',
          field: 'GuestCode',
          sorter: 'number',
          width: 100,
        },
        { title: 'Hãng', field: 'Maker', sorter: 'number', width: 100 },
        { title: 'Số lượng', field: 'Qty', sorter: 'number', width: 100 },
        {
          title: 'SL đã nhập',
          field: 'QuantityReturn',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'SL đã xuất',
          field: 'QuantityExport',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'SL còn lại',
          field: 'QuantityRemain',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Kích thước phim cắt/Model',
          field: 'FilmSize',
          sorter: 'number',
          width: 100,
        },
        { title: 'ĐVT', field: 'Unit', sorter: 'number', width: 100 },
        {
          title: 'Đơn giá trước VAT',
          field: 'UnitPrice',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Tổng tiền trước VAT',
          field: 'IntoMoney',
          sorter: 'number',
          width: 100,
        },
        { title: 'VAT%', field: 'VAT', sorter: 'number', width: 100 },
        {
          title: 'Tổng tiền sau VAT',
          field: 'TotalPriceIncludeVAT',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Người nhận',
          field: 'UserReceiver',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Ngày yêu cầu giao hàng',
          field: 'DeliveryRequestedDate',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Thanh toán dự kiến',
          field: 'EstimatedPay',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Số hóa đơn',
          field: 'BillNumber',
          sorter: 'number',
          width: 100,
        },
        { title: 'Công nợ', field: 'Debt', sorter: 'number', width: 100 },
        {
          title: 'Ngày yêu cầu thanh toán',
          field: 'PayDate',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Ngày giao hàng',
          field: 'ActualDeliveryDate',
          sorter: 'number',
          width: 100,
        },
        {
          title: 'Ngày tiền về',
          field: 'RecivedMoneyDate',
          sorter: 'number',
          width: 100,
        },
      ],
    });
  }
}
