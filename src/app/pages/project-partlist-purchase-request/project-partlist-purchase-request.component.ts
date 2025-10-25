import {
  ApplicationRef,
  Component,
  createComponent,
  EnvironmentInjector,
  inject,
  OnInit,
  Type,
  ViewEncapsulation,
  AfterViewInit,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, NgModel } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { APP_LOGIN_NAME } from '../../app.config';
import { EMPLOYEE_ID } from '../../app.config';
import { ISADMIN } from '../../app.config';
import { ProjectPartlistPurchaseRequestService } from './service/project-partlist-purchase-request.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NSelectComponent } from '../n-select/n-select.component';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPurchaseRequestFormComponent } from './Project-Partlist-Purchase-Request-Form/Project-Partlist-Purchase-Request-Form.component';

@Component({
  selector: 'app-project-partlist-purchase-request',
  standalone: true,
  imports: [
    CommonModule, // Thêm import này
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzDropDownModule,
    NzModalModule,
    NzSpinModule,
  ],
  templateUrl: './project-partlist-purchase-request.component.html',
  styleUrls: ['./project-partlist-purchase-request.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectPartlistPurchaseRequestComponent
  implements OnInit, AfterViewInit
{
  filters: any;
  table: any;
  sizeSearch: string = '0';
  PurchaseRequetsService = inject(ProjectPartlistPurchaseRequestService);
  private messageService = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private notificationService = inject(NzNotificationService);
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private modal = inject(NzModalService);
  private ngbModal = inject(NgbModal);
  @ViewChildren('tabulatorContainer') containers!: QueryList<ElementRef>;
  dtproject: any[] = [];
  dtPOKH: any[] = [];
  dtSupplierSale: any[] = [];
  dtProductGroup: any[] = [];
  dtCurrency: any[] = [];
  dtEmployeeApprove: any[] = [];
  dtProductHr: any[] = [];

  // Configuration flags
  isSelectedPO: boolean = false;
  supplierSaleId: number = 0;
  poKHID: number = 0;
  listRequestBuySelect: boolean = false;
  isYCMH: boolean = false;
  isApprovedTBP: boolean = false;
  isPurchaseRequestDemo: boolean = false;
  productCode: string = '';

  // Current user info
  currentEmployeeId: number = EMPLOYEE_ID;
  isAdmin: boolean = ISADMIN;
  activeTabIndex = 0;

  tabs = [
    { id: 1, name: 'Yêu cầu mua dự án' },
    { id: 2, name: 'Kỹ thuật đã mua' },
    { id: 3, name: 'Yêu cầu mua hàng demo' },
    { id: 4, name: 'Yêu cầu mượn hàng demo' },
    { id: 5, name: 'Thương mại' },
    { id: 6, name: 'Sản phẩm HR' },
  ];
  tables: { [key: number]: any } = {}; // Lưu trữ các instance Tabulator theo tabId
  cachedData: { [key: string]: any[] } = {
    purchaseRequests: [],
    dataRTC: [],
    techBought: [],
    productRTCBorrow: [],
    productCommercial: [],
    productHr: [],
  };
  currentDataType: string = 'purchaseRequests';
  activeTabId: number = 1;
  isDataLoaded: boolean = false;
  isLoading: boolean = false;

  constructor() {}

  ngOnInit() {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    // Khởi tạo filters với giá trị mặc định như bạn đã cung cấp
    this.filters = {
      DateStart: firstDayOfYear.toISOString(),
      DateEnd: new Date().toISOString(),
      StatusRequest: 1,
      ProjectID: 0,
      SupplierSaleID: 0,
      IsApprovedTBP: -1,
      IsApprovedBGD: -1,
      IsCommercialProduct: -1,
      POKHID: 0,
      ProductRTCID: -1,
      IsDeleted: 0,
      IsTechBought: 0,
      IsJobRequirement: 0,
      Page: 1,
      Size: 100, // Load tất cả dữ liệu một lần
    };

    // Load dữ liệu ban đầu trước khi khởi tạo bảng
    this.loadInitialData();
  }
  ngAfterViewInit() {
    // Lắng nghe khi Angular render xong toàn bộ tab
    this.containers.changes.subscribe(() => {
      this.initAllTables();
    });

    // Nếu ngay lần đầu đã có sẵn containers
    if (this.containers.length > 0) {
      this.initAllTables();
    }
  }
  private initAllTables() {
    this.containers.forEach((el, index) => {
      const tab = this.tabs[index];
      if (!this.tables[tab.id]) {
        this.DrawTable(tab.id);
      }
    });
  }
  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const tab = this.tabs[index];
    this.SelectProjectType(tab.id);
  }
  public SelectProjectType(typeId: number): void {
    this.activeTabId = typeId;

    switch (typeId) {
      case 1:
        this.currentDataType = 'purchaseRequests';
        break;
      case 2:
        this.currentDataType = 'techBought';
        break;
      case 3:
        this.currentDataType = 'dataRTC';
        break;
      case 4:
        this.currentDataType = 'productRTCBorrow';
        break;
      case 5:
        this.currentDataType = 'productCommercial';
        break;
      case 6:
        this.currentDataType = 'productHr';
        break;
      default:
        this.currentDataType = 'purchaseRequests';
    }
    this.updateTableWithCachedData();
  }

  loadAllData() {
    if (this.isDataLoaded) return;

    this.isLoading = true;

    this.PurchaseRequetsService.getAllData({
      DateStart: '2025-01-01',
      DateEnd: new Date().toISOString(),
      Size: 1000,
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === 1) {
          this.cachedData['purchaseRequests'] =
            response.data.purchaseRequests || [];
          this.cachedData['dataRTC'] = response.data.dataRTC || [];
          this.cachedData['techBought'] = response.data.techBought || [];
          this.cachedData['productRTCBorrow'] =
            response.data.productRTCBorrow || [];
          this.cachedData['productCommercial'] =
            response.data.productCommercial || [];
          this.cachedData['productHr'] = response.data.productHr || [];

          this.isDataLoaded = true;
          this.updateTableWithCachedData();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Lỗi:', err);
        this.messageService.error('Lỗi khi tải dữ liệu: ' + err.message);
      },
    });
  }
  // Load additional data sources
  loadSupplierSale(callback?: () => void) {
    this.PurchaseRequetsService.getSupplierSale().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtSupplierSale = response.data || [];
          console.log('data', this.dtSupplierSale);

          this.createLabels('supplierSale', response.data, 'ID', 'NameNCC');
          if (this.table) this.table.redraw(true);
        }
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('Lỗi khi tải Nhà cung cấp:', error);
        if (callback) callback();
      },
    });
  }

  loadProductGroup() {
    this.PurchaseRequetsService.getProductGroup().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtProductGroup = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi tải Loại dự án:', error);
      },
    });
  }

  loadCurrency(callback?: () => void) {
    this.PurchaseRequetsService.getCurrency().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtCurrency = response.data || [];
          this.createLabels('currency', this.dtCurrency, 'ID', 'Code');
        }
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('Lỗi khi tải Tiền tệ:', error);
        if (callback) callback();
      },
    });
  }

  loadEmployeeApprove(callback?: () => void) {
    this.PurchaseRequetsService.getEmployeeApprove().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtEmployeeApprove = response.data || [];
        }
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('Lỗi khi tải Nhân viên:', error);
        if (callback) callback();
      },
    });
  }
  loadInitialData() {
    // Đếm số lượng API cần load
    let loadedCount = 0;
    const totalApis = 5; // currency, supplierSale, projects, POKH, employeeApprove

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalApis) {
        this.loadAllData();
      }
    };

    // Load danh sách dự án
    this.loadProjects(checkAllLoaded);
    // Load danh sách PO
    this.loadPOKH(checkAllLoaded);
    // Load additional data
    this.loadSupplierSale(checkAllLoaded);
    this.loadCurrency(checkAllLoaded);
    this.loadEmployeeApprove(checkAllLoaded);
    // ProductGroup không cần thiết cho select nên load riêng
    this.loadProductGroup();
  }

  loadProjects(callback?: () => void) {
    // Gọi API để lấy danh sách dự án
    this.PurchaseRequetsService.getProjects().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtproject = response.data || [];
        }
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('Lỗi khi tải Dự án:', error);
        if (callback) callback();
      },
    });
  }

  loadPOKH(callback?: () => void) {
    // Gọi API để lấy danh sách PO
    this.PurchaseRequetsService.getPOKH().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtPOKH = response.data || [];
        }
        if (callback) callback();
      },
      error: (error: any) => {
        console.error('lỗi khi tải POKH:', error);
        if (callback) callback();
      },
    });
  }

  // Cập nhật table với dữ liệu đã cache
  updateTableWithCachedData() {
    const currentData = this.cachedData[this.currentDataType] || [];
    const tableId = this.activeTabId;
    if (this.tables[tableId]) {
      this.tables[tableId].setData(currentData);
    } else {
      console.warn(`bảng của tab ${tableId} not initialized`);
      this.DrawTable(tableId);
      this.tables[tableId].setData(currentData);
    }
  }

  ResetFilters() {
    const currentMonth = DateTime.now().month; // Tháng hiện tại (1 - 12)
    const currentYear = DateTime.now().year;
    this.filters = {
      DateStart: DateTime.local(currentYear, currentMonth, 1).toFormat(
        'yyyy-MM-dd'
      ),
      DateEnd: DateTime.fromJSDate(new Date()).toFormat('yyyy-MM-dd'),
      StatusRequest: 1,
      ProjectID: 0,
      Keyword: '',
      SupplierSaleID: 0,
      IsApprovedTBP: 0,
      IsApprovedBGD: 0,
      IsCommercialProduct: -1,
      POKHID: 0,
      ProductRTCID: 0,
      IsDeleted: 0,
      IsTechBought: 0,
      IsJobRequirement: 0,
      Size: 25,
      Page: 1,
    };

    // Reset cache và load lại dữ liệu
    this.isDataLoaded = false;
    this.cachedData = {
      purchaseRequests: [],
      dataRTC: [],
      techBought: [],
      productRTCBorrow: [],
      productCommercial: [],
    };
    this.loadAllData();
  }

  ApplyFilters() {
    // Reset cache và load lại dữ liệu với filter mới
    this.isDataLoaded = false;
    this.cachedData = {
      purchaseRequests: [],
      dataRTC: [],
      techBought: [],
      productRTCBorrow: [],
      productCommercial: [],
    };
    this.loadAllData();
  }

  ToggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  onCellEdited(cell: any) {
    const row = cell.getRow();
    const data = row.getData();

    const quantity = +data.Quantity || 0;
    const unitPrice = +data.UnitPrice || 0;
    const unitImportPrice = +data.UnitImportPrice || 0;
    const currencyRate = +data.CurrencyRate || 0;
    const vat = +data.VAT || 0;

    const totalPrice = quantity * unitPrice;
    const totalPriceExchange = totalPrice * currencyRate;
    const totalImportPrice = unitImportPrice * quantity;
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    row.update({
      TotalPrice: totalPrice,
      TotalPriceExchange: totalPriceExchange,
      TotalImportPrice: totalImportPrice,
      TotaMoneyVAT: totalMoneyVAT,
    });

    // Cập nhật cachedData với dữ liệu đã chỉnh sửa
    const rowIndex = this.cachedData[this.currentDataType].findIndex(
      (item) => item.ID === data.ID
    );
    if (rowIndex !== -1) {
      this.cachedData[this.currentDataType][rowIndex] = { ...data };
    }
  }

  private DrawTable(tabId: number) {
    const tableElement = `#table-${tabId}`;
    if (this.tables[tabId]) {
      this.tables[tabId].destroy();
    }
    this.tables[tabId] = new Tabulator(tableElement, {
      layout: 'fitDataStretch',
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        cellClick: (e: any, cell: any) => {
          cell.getRow().toggleSelect();
        },
      },
      height: '80vh',
      pagination: true,
      paginationMode: 'local', // remote pagination
      paginationSize: this.filters.Size, // mặc định từ filters
      paginationSizeSelector: [10, 25, 50, 100],
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
            page_size: 'Số dòng:',
          },
        },
      },
      locale: 'vi',
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Yêu cầu duyệt mua',
          field: 'IsRequestApproved',
          width: 100,
          headerWordWrap: true,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } disabled />`;
          },
        },
        {
          title: 'BGD duyệt',
          field: 'IsApprovedBGD',
          hozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } disabled />`;
          },
          sorter: 'string',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'TT',
          field: 'TT',
          sorter: 'number',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Dự án',
          field: 'ProjectFullName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },

        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 180,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },
        {
          title: 'Hãng',
          field: 'Manufacturer',
          sorter: 'string',
          width: 180,
          headerHozAlign: 'center',
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          sorter: 'number',
          width: 100,
          headerHozAlign: 'center',
          cellEdited: (cell) => this.onCellEdited(cell),
          editor: 'number',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn vị',
          field: 'UnitName',
          sorter: 'string',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại kho',
          field: 'ProductGroupID',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Trạng thái',
          field: 'StatusRequestText',
          sorter: 'string',
          width: 120,
          headerHozAlign: 'center',
        },
        {
          title: 'Người yêu cầu',
          field: 'FullName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'NV mua',
          field: 'UpdatedName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày yêu cầu',
          field: 'DateRequest',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Deadline',
          field: 'DateReturnExpected',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Loại tiền',
          field: 'UnitMoney',
          width: 100,
          headerHozAlign: 'center',
          visible: false,
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyID',
          width: 100,
          headerHozAlign: 'center',
          editor: this.createdControl(
            NSelectComponent,
            this.injector,
            this.appRef,
            this.dtCurrency,
            'Code',
            'Code',
            'ID'
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            return `<div class="d-flex justify-content-between align-items-center h-100">
                         <p class="w-100 m-0">${
                           val
                             ? this.getLabelValue('currency', val)
                             : 'Chọn loại tiền'
                         }</p>
                         <i class="fas fa-angle-down"></i>
                       </div>`;
          },
          cellEdited: (cell: any) => {
            const selectedId = cell.getValue(); // Lấy ID từ giá trị đã chọn
            const currecy = this.dtCurrency.find(
              (p: { ID: any }) => p.ID === selectedId
            ); // Tìm sản phẩm theo ID

            if (currecy) {
              cell.getRow().update({
                CurrencyRate: currecy.CurrencyRate,
              });
              this.onCellValueChanged(cell);
            }
          },
        },

        {
          title: 'Tỷ giá',
          field: 'CurrencyRate',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
          cellEdited: (cell) => this.onCellValueChanged(cell),
        },
        {
          title: 'Đơn giá bán (Sale Admin up)',
          field: 'UnitPricePOKH',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          sorter: 'number',
          editor: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
          cellEdited: (cell) => this.onCellValueChanged(cell),
        },
        {
          title: 'Giá lịch sử',
          field: 'HistoryPrice',
          editor: 'number',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Thành tiền lịch sử',
          field: 'TotalPriceHistory',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Thành tiền chưa VAT',
          field: 'TotalPrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Thành tiền quy đổi (VND)',
          field: 'TotalPriceExchange',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: '% VAT',
          field: 'VAT',
          editor: 'number',
          sorter: 'number',
          headerHozAlign: 'center',
          cellEdited: (cell: any) => {
            this.onCellValueChanged(cell);
          },
        },
        {
          title: 'Thành tiền có VAT',
          field: 'TotaMoneyVAT',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Nhà cung cấp',
          field: 'SupplierSaleID',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
          editor: this.createdControl(
            NSelectComponent,
            this.injector,
            this.appRef,
            this.dtSupplierSale,
            'NameNCC',
            'NameNCC',
            'ID'
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            return `<div class="d-flex justify-content-between align-items-center h-100">
                         <p class="w-100 m-0">${
                           val
                             ? this.getLabelValue('supplierSale', val)
                             : 'Chọn nhà cung cấp'
                         }</p>
                         <i class="fas fa-angle-down"></i>
                       </div>`;
          },
          cellEdited: (cell: any) => {
            const selectedId = cell.getValue(); // Lấy ID từ giá trị đã chọn
            const supplier = this.dtSupplierSale.find(
              (p: { ID: any }) => p.ID === selectedId
            ); // Tìm nhà cung cấp theo ID

            if (supplier) {
              cell.getRow().update({
                CodeNCC: supplier.CodeNCC,
              });
              this.onCellValueChanged(cell);
            }
          },
        },
        {
          title: 'Lead Time',
          field: 'LeadTime',
          sorter: 'number',
          editor: 'number',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          width: 200,
          editor: 'textarea',
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú KT',
          field: 'NotePartlist',
          sorter: 'string',
          width: 250,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          // cssClass: "content-cell"
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Model',
          sorter: 'string',
          width: 150,
          headerWordWrap: true,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },
        {
          title: 'Lý do huỷ',
          field: 'ReasonCancel',
          sorter: 'string',
          width: 200,
          headerHozAlign: 'center',
          editor: 'textarea',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
        },
        {
          title: 'Ngày đặt hàng',
          field: 'RequestDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày về dự kiến',
          field: 'DeadlineDelivery',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày về thực tế',
          field: 'DateReturnActual',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày nhận',
          field: 'DateReceive',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },

        {
          title: 'Hàng nhập khẩu',
          field: 'IsImport',
          width: 100,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''}/>`;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn giá xuất xưởng',
          field: 'UnitFactoryExportPrice',
          sorter: 'number',
          formatter: 'money',
          editor: 'number',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Project Part List ID',
          field: 'ProjectPartListID',
          sorter: 'number',
          visible: false,
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Status Request',
          field: 'StatusRequest',
          visible: false,
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'TBP duyệt',
          field: 'IsApprovedTBP',
          hozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } disabled />`;
          },
          width: 100,
          headerHozAlign: 'center',
        },

        {
          title: 'Trưởng bộ phận',
          field: 'ApprovedTBPName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'BGĐ',
          field: 'ApprovedBGD',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày TBP duyệt',
          field: 'DateApprovedTBP',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày BGĐ duyệt',
          field: 'DateApprovedBGD',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
          width: 150,
          headerHozAlign: 'center',
        },

        {
          title: 'Product Sale ID',
          field: 'ProductSaleID',
          sorter: 'string',
          visible: false,
          width: 100,
          headerHozAlign: 'center',
        },

        {
          title: 'Giá nhập khẩu',
          field: 'UnitImportPrice',
          sorter: 'number',
          editor: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
          cellEdited: (cell) => this.onCellEdited(cell),
        },
        {
          title: 'Tổng tiền nhập khẩu',
          field: 'TotalImportPrice',
          sorter: 'number',
          editor: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn mua hàng',
          field: 'BillCode',
          sorter: 'string',
          width: 130,
          headerHozAlign: 'center',
        },

        {
          title: 'Project ID',
          field: 'ProjectID',
          sorter: 'number',
          headerHozAlign: 'center',
        },
        {
          title: 'PONCCID',
          field: 'PONCCID',
          sorter: 'string',
          headerHozAlign: 'center',
        },

        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          width: 180,
          headerHozAlign: 'center',
        },
        {
          title: 'Is Commercial Product',
          field: 'IsCommercialProduct',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Huỷ yêu cầu',
          field: 'IsDeleted',
          visible: false,
          headerHozAlign: 'center',
        },

        {
          title: 'Job Requirement ID',
          field: 'JobRequirementID',
          headerHozAlign: 'center',
        },
        {
          title: 'Customer ID',
          field: 'CustomerID',
          sorter: 'string',
          headerHozAlign: 'center',
        },
        {
          title: 'Danh mục',
          field: 'ProjectTypeName',
          sorter: 'string',
          headerHozAlign: 'center',
        },
        {
          title: 'PONumber',
          field: 'poNumber',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Mã theo khách',
          field: 'GuestCode',
          sorter: 'string',
          width: 140,
          headerHozAlign: 'center',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          sorter: 'string',
          width: 140,
          headerHozAlign: 'center',
        },
        {
          title: 'Mã POKH',
          field: 'POKHCode',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Trạng thái đặt hàng',
          field: 'StatusPOKHText',
          sorter: 'string',
          width: 150,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Mã đặc biệt',
          field: 'SpecialCode',
          sorter: 'string',
          width: 150,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },

        {
          title: 'Inventory Project ID',
          field: 'InventoryProjectID',
          visible: false,
          headerHozAlign: 'center',
        },

        // {
        //   title: 'Approved TBP',
        //   field: 'approvedTbp',
        //   sorter: 'string',
        // },
        // {
        //   title: 'Ngày dự kiến trả',
        //   field: 'expectedReturnDate',
        //   sorter: 'date',
        //   formatter: 'datetime',
        //   formatterParams: { outputFormat: 'dd/MM/yyyy' },
        // },
        {
          title: '',
          field: 'DateReturnEstimated',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: '',
          field: 'IsStock',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nhóm sản phẩm',
          field: 'ProductGroupNo',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Tổng tiền nhập',
          field: 'TotalBillImport',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Số lần nhập tổng',
          field: 'TotalBillImportCount',
          sorter: 'number',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại phiếu',
          field: 'TicketTypeText',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại phiếu (ID)',
          field: 'TicketType',
          sorter: 'number',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại yêu cầu mua hàng',
          field: 'ProjectPartlistPurchaseRequestTypeID',
          sorter: 'number',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn vị đếm',
          field: 'UnitCountID',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú Marketing',
          field: 'NoteMarketing',
          sorter: 'string',
          width: 200,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn vị mới',
          field: 'UnitNameNew',
          sorter: 'string',
          width: 120,
          headerHozAlign: 'center',
        },
        {
          title: 'Người tạo giá',
          field: 'FullNamePriceRequest',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
      ],
      rowContextMenu: [
        {
          label: 'Giữ hàng',
          action: (e, row) => {
            this.keepSelectedProducts(true); // Gọi hàm xử lý giữ hàng
          },
        },
        {
          label: 'Hủy giữ hàng',
          action: (e, row) => this.keepSelectedProducts(false), // Gọi hàm xử lý hủy giữ hàng
        },
        {
          separator: true, // ngăn cách menu
        },
        {
          label: 'Xóa',
          action: (e, row) => {
            const rowData = row.getData();
          },
        },
      ],
      initialSort: [{ column: 'ID', dir: 'asc' }],
    });
  }
  async checkOrder(isCheckOrder: boolean): Promise<void> {
    let isCheckOrderText = isCheckOrder ? 'check' : 'hủy check';
    const selectedRows = this.table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.messageService.warning(
        `Vui lòng chọn ít nhất một sản phẩm muốn ${isCheckOrderText}!`
      );
      return;
    }
    const data = selectedRows.map((row: any) => {
      return {
        ID: row.getData().ID,
      };
    });
    if (data.length === 0) {
      this.messageService.warning('Không có sản phẩm nào được chọn!');
      return;
    }
    const confirmed = await this.modalService.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${isCheckOrderText} danh sách đang chọn không?\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!`,
      nzOnOk: () => true,
      nzOnCancel: () => false,
    });
    if (!confirmed) return;
  }

  async onApprove(isApproved: boolean, isTBP: boolean): Promise<void> {
    const selectedRows = this.table.getSelectedRows();
    const actionText = isApproved ? 'duyệt' : 'huỷ duyệt';
    const levelText = isTBP ? 'TBP' : 'BGĐ';

    if (selectedRows.length === 0) {
      this.messageService.warning(`Vui lòng chọn sản phẩm muốn ${actionText}!`);
      return;
    }

    const confirmed = await this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${actionText} danh sách sản phẩm đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Huỷ',
      nzOnOk: () => true,
      nzOnCancel: () => false,
    });
    if (!confirmed) return;

    const payload = selectedRows.map((row: any) => {
      const rowData = row.getData();
      const data: any = {
        ID: rowData.ID,
        IsApprovedTBP: rowData.IsApprovedTBP,
        IsApprovedBGD: rowData.IsApprovedBGD,
        ApprovedBGD: rowData.ApprovedBGD,
      };
      if (isTBP) {
        data.IsApprovedTBP = isApproved;
      } else {
        data.IsApprovedBGD = isApproved;
        // data.ApprovedBGD = this.currentEmployeeId;
      }
      return data;
    });

    this.PurchaseRequetsService.saveData(payload).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.messageService.success(
            `${
              actionText.charAt(0).toUpperCase() + actionText.slice(1)
            } ${levelText} thành công!`
          );
          this.loadAllData();
        } else {
          this.messageService.error(`Không thể ${actionText}: ${res.message}`);
        }
      },
      error: (err) => {
        this.messageService.error(`Lỗi khi gửi duyệt: ${err.message}`);
      },
    });
  }

  private labelMaps: Map<string, { [key: number]: string }> = new Map();

  // Hàm tạo label chung
  createLabels(
    labelName: string,
    data: any[],
    keyField: string = 'ID',
    valueField: string = 'Name'
  ): { [key: number]: string } {
    // Tạo object labels mới
    const labels: { [key: number]: string } = {};

    data.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!labels[item[keyField]]) {
        labels[item[keyField]] = item[valueField];
      }
    });
    // Lưu vào Map với tên label
    this.labelMaps.set(labelName, labels);
    console.log(`Labels ${labelName}:`, labels);
    return labels;
  }
  // Hàm lấy label theo tên
  getLabels(labelName: string): { [key: number]: string } {
    return this.labelMaps.get(labelName) || {};
  }

  // Hàm lấy giá trị label theo key
  getLabelValue(labelName: string, key: number): string {
    const labels = this.labelMaps.get(labelName);
    return labels ? labels[key] || '' : '';
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any,
    displayField: string,
    labelField: string = 'Code',
    valueField: string = 'ID'
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Lấy giá trị từ cell
      const cellValue = cell.getValue();

      // Các tham số truyền vào component
      componentRef.instance.dataSource = data;
      componentRef.instance.value = cellValue;

      // Nếu component là NSelectComponent, truyền thêm các trường tùy chỉnh
      if (component === NSelectComponent) {
        componentRef.instance.displayField = displayField;
        componentRef.instance.labelField = labelField;
        componentRef.instance.valueField = valueField;
      } else {
        // Tương thích ngược với SelectEditorComponent
        componentRef.instance.label = displayField;
      }

      // Các tham số trả ra
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }

  // //#endregion
  // private validateSelectedItemsForApproval(
  //   selectedRows: any[],
  //   isApproved: boolean,
  //   type: 'TBP' | 'BGD'
  // ): any[] {
  //   const validItems: any[] = [];

  //   selectedRows.forEach((row) => {
  //     const data = row.getData();
  //     const id = data.ID;
  //     const productSaleId = data.ProductSaleID;
  //     const productCode = data.ProductCode;
  //     const productNewCode = data.ProductNewCode;
  //     const isApprovedTBP = data.IsApprovedTBP;
  //     const isApprovedBGD = data.IsApprovedBGD;

  //     if (id <= 0) return;

  //     // Validate product code for approval
  //     if (productSaleId <= 0 && isApproved && !productNewCode) {
  //       this.messageService.error(
  //         `Vui lòng tạo Mã nội bộ cho sản phẩm [${productCode}].\nChọn Loại kho sau đó chọn Lưu thay đổi để tạo Mã nội bộ!`
  //       );
  //       return;
  //     }

  //     // Validate approval flow
  //     if (type === 'TBP') {
  //       // TBP can approve/unapprove regardless of BGD status
  //       validItems.push(data);
  //     } else if (type === 'BGD') {
  //       // BGD can only approve if TBP has approved
  //       if (isApproved && !isApprovedTBP) {
  //         // Skip items not approved by TBP
  //         return;
  //       }
  //       validItems.push(data);
  //     }
  //   });

  //   return validItems;
  // }

  // Button click handlers
  onCheckOrder(isCheck: boolean) {
    const selectedRows = this.table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.messageService.warning(
        'Vui lòng chọn ít nhất một dòng để kiểm tra!'
      );
      return;
    }

    const selectedData = selectedRows.map((row: any) => row.getData());
    const data = selectedData.map((item: any) => ({
      ID: item.ID,
      EmployeeIDRequestApproved: isCheck ? this.currentEmployeeId : 0,
    }));

    const confirmText = isCheck
      ? 'Bạn có chắc muốn CHECK các dòng đã chọn không?'
      : 'Bạn có chắc muốn HỦY CHECK các dòng đã chọn không?';

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: confirmText,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {},
    });
  }

  async onSaveData() {
    const saved = await this.saveData();
    if (saved) {
      this.messageService.success('Lưu dữ liệu thành công!');
      this.updateTableWithCachedData();
    }
  }

  // Phương thức lấy dữ liệu đã thay đổi
  getChangedData(): any[] {
    // Get all edited rows from the table
    const editedRows = this.table.getEditedCells();
    const changedData: any[] = [];

    editedRows.forEach((cell: any) => {
      const rowData = cell.getRow().getData();
      const field = cell.getField();
      const value = cell.getValue();

      // Find existing entry or create new one
      let existingEntry = changedData.find((item) => item.ID === rowData.ID);
      if (!existingEntry) {
        existingEntry = {
          ID: rowData.ID,
          changes: {},
        };
        changedData.push(existingEntry);
      }

      existingEntry.changes[field] = value;
    });

    return changedData;
  }

  // onEdit() {

  //   const selectedRows = this.table.getSelectedRows();
  //   let isCommercial = selectedRows[0].getData().IsCommercialProduct;

  //   if (selectedRows.length === 0) {
  //     this.messageService.info('Vui lòng chọn ít nhất một dòng để chỉnh sửa.');
  //     return;
  //   }

  //   // Kiểm tra cùng EmployeeID
  //   const empID = selectedRows[0].getData().EmployeeID;
  //   const allSameEmp = selectedRows.every((row:any) => row.getData().EmployeeID === empID);

  //   if (!allSameEmp) {
  //     this.messageService.info(
  //       'Vui lòng chọn các yêu cầu mua hàng có cùng Người yêu cầu!'
  //     );
  //     return;
  //   }
  //   let Id = selectedRows[0].getData().ID;
  //   let customerID = selectedRows[0].getData().CustomerID;
  //   this.PurchaseRequetsService.getPurchaseRequestByIDs(Id).subscribe({
  //     next: (response: any) => {
  //       if (response.status === 1) {
  //         let data = response.data;
  //         data.CustomerID = customerID;

  //         const modalRef = this.ngbModal.open(ProjectPartlistPurchaseRequestFormComponent, {
  //           size: 'xl',
  //           backdrop: 'static',
  //           keyboard: false
  //         });

  //         modalRef.componentInstance.dataInput = data;

  //         modalRef.result.then(
  //           (result) => {
  //             // Modal đóng với kết quả
  //             this.loadAllData();
  //             this.messageService.success('Cập nhật thành công!');
  //           },
  //           (dismissed) => {
  //             // Modal bị dismiss
  //             console.log('Modal dismissed');
  //           }
  //         );
  //       } else {
  //         this.messageService.error('Không tìm thấy yêu cầu mua hàng!');
  //       }
  //     },
  //     error: (err: any) => {
  //       this.messageService.error('Có lỗi khi lấy dữ liệu: ' + err.message);
  //     }
  //   });
  // }
  onEdit() {
    const selectedRows = this.table.getSelectedRows();

    if (selectedRows.length === 0) {
      this.messageService.info('Vui lòng chọn ít nhất một dòng để chỉnh sửa.');
      return;
    }

    //Chặn nếu không phải hàng thương mại
    const allCommercial = selectedRows.every(
      (row: any) => !!row.getData().IsCommercialProduct
    );
    if (!allCommercial) {
      this.messageService.warning(
        'Chỉ được phép sửa các dòng là hàng thương mại!'
      );
      return;
    }

    // Kiểm tra cùng EmployeeID
    const empID = selectedRows[0].getData().EmployeeID;
    const allSameEmp = selectedRows.every(
      (row: any) => row.getData().EmployeeID === empID
    );
    if (!allSameEmp) {
      this.messageService.info(
        'Vui lòng chọn các yêu cầu mua hàng có cùng Người yêu cầu!'
      );
      return;
    }

    let Id = selectedRows[0].getData().ID;
    let customerID = selectedRows[0].getData().CustomerID;
    let unitName = selectedRows[0].getData().UnitName || '';
    this.PurchaseRequetsService.getPurchaseRequestByIDs(Id).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let data = response.data;
          data.CustomerID = customerID;
          data.UnitName = unitName;

          const modalRef = this.ngbModal.open(
            ProjectPartlistPurchaseRequestFormComponent,
            {
              size: 'xl',
              backdrop: 'static',
              keyboard: false,
            }
          );

          modalRef.componentInstance.dataInput = data;

          modalRef.result.then(
            (result) => {
              this.loadAllData();
              this.messageService.success('Cập nhật thành công!');
            },
            (dismissed) => {
              console.log('Modal dismissed');
            }
          );
        } else {
          this.messageService.error('Không tìm thấy yêu cầu mua hàng!');
        }
      },
      error: (err: any) => {
        this.messageService.error('Có lỗi khi lấy dữ liệu: ' + err.message);
      },
    });
  }

  onAdd() {
    const modalRef = this.ngbModal.open(
      ProjectPartlistPurchaseRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    );

    modalRef.componentInstance.dataInput = [];

    modalRef.result.then(
      (result) => {
        // Modal đóng với kết quả
        this.loadAllData();
        this.messageService.success('Thêm mới thành công!');
      },
      (dismissed) => {
        // Modal bị dismiss
        console.log('Modal dismissed');
      }
    );
  }

  async onCancelRequest(): Promise<void> {
    const selectedRows = this.table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.messageService.warning('Vui lòng chọn sản phẩm muốn xoá!');
      return;
    }

    const dataToDelete: {
      ID: number;
      IsDeleted: boolean;
      InventoryProjectID: number;
    }[] = [];

    for (const row of selectedRows) {
      const rowData = row.getData();
      const id = rowData.ID;
      const productCode = rowData.ProductCode;
      const inventoryProjectID = rowData.InventoryProjectID || 0;
      if (id <= 0) continue;

      // Admin được phép bỏ qua validate
      if (!this.isAdmin) {
        const isCommercial = !!rowData.IsCommercialProduct;
        const poNCC = rowData.PONCCID || 0;

        if (!isCommercial) {
          this.messageService.error(
            `Sản phẩm mã [${productCode}] không phải hàng thương mại. Bạn không thể xoá!`
          );
          return;
        }

        if (poNCC > 0) {
          this.messageService.error(
            `Sản phẩm mã [${productCode}] đã có PO Nhà cung cấp. Bạn không thể xoá!`
          );
          return;
        }

        if (this.isPurchaseRequestDemo) {
          const updateName = rowData.UpdatedName || '';
          const requestStatus = rowData.StatusRequest || 0;
          const isApprovedTBP = !!rowData.IsApprovedTBP;
          const isApprovedBGD = !!rowData.IsApprovedBGD;

          if (updateName !== '' && requestStatus !== 1) {
            this.messageService.error(
              `Sản phẩm mã [${productCode}] đã có nhân viên mua. Bạn không thể huỷ yêu cầu!`
            );
            return;
          }

          if (isApprovedTBP) {
            this.messageService.error(
              `Sản phẩm mã [${productCode}] đã được TBP duyệt. Bạn không thể huỷ yêu cầu!`
            );
            return;
          }

          if (isApprovedBGD) {
            this.messageService.error(
              `Sản phẩm mã [${productCode}] đã được BGD duyệt. Bạn không thể huỷ yêu cầu!`
            );
            return;
          }
        }
      }

      dataToDelete.push({
        ID: id,
        IsDeleted: true,
        InventoryProjectID: inventoryProjectID,
      });
    }

    if (dataToDelete.length === 0) return;

    const confirmed = await this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn xoá ${dataToDelete.length} sản phẩm đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => true,
      nzOnCancel: () => false,
    });

    if (!confirmed) return;
  }

  onAddSupplier(): void {
    const selectedRows = this.table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.messageService.warning(
        'Vui lòng chọn ít nhất một dòng để thêm nhà cung cấp!'
      );
      return;
    }

    // Open supplier selection modal or form
    const selectedData = selectedRows.map((row: any) => row.getData());
    this.PurchaseRequetsService.addSupplier(selectedData).subscribe({
      next: () => {
        this.messageService.success('Thêm nhà cung cấp thành công!');
        this.loadAllData();
      },
      error: (error) => {
        console.error('Error adding supplier:', error);
        this.messageService.error('Có lỗi xảy ra khi thêm nhà cung cấp!');
      },
    });
  }
  updateValue(row: any): void {
    const rowData = row.getData();

    const quantity = Number(rowData.Quantity || 0);
    const unitPrice = Number(rowData.UnitPrice || 0);
    const currencyRate = Number(rowData.CurrencyRate || 1); // Mặc định 1 nếu không có

    const totalPrice = quantity * unitPrice;
    const totalPriceExchange = totalPrice * currencyRate;

    const unitImportPrice = Number(rowData.UnitImportPrice || 0);
    const totalImportPrice = unitImportPrice * quantity;

    const vat = Number(rowData.VAT || 0);
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    row.update({
      TotalPrice: totalPrice,
      TotalPriceExchange: totalPriceExchange,
      TotalImportPrice: totalImportPrice,
      TotalMoneyVAT: totalMoneyVAT,
    });
  }
  isRecallCellValueChanged = false;

  cellEdited(cell: any): void {
    if (this.isRecallCellValueChanged) return;

    const column = cell.getColumn().getField();
    const newValue = cell.getValue();
    const selectedRows = this.table.getSelectedRows();

    if (
      ['ProductSaleID', 'ProductNewCode', 'InventoryProjectID'].includes(column)
    ) {
      return; // Bỏ qua những cột không cần xử lý
    }

    try {
      this.isRecallCellValueChanged = true;

      if (selectedRows.length > 0) {
        for (const row of selectedRows) {
          const rowData = row.getData();

          // Gán giá trị mới cho các dòng đã chọn
          row.update({ [column]: newValue });

          // Nếu là cột ảnh hưởng đến tính toán thì cập nhật lại giá trị liên quan
          if (['UnitPrice', 'UnitImportPrice', 'VAT'].includes(column)) {
            this.updateValue(row);
          }
        }
      } else {
        const row = cell.getRow();
        if (['UnitPrice', 'UnitImportPrice', 'VAT'].includes(column)) {
          this.updateValue(row);
        }
      }
    } finally {
      this.isRecallCellValueChanged = false;
    }
  }

  async onRequestApproved(isRequestApproved: boolean): Promise<void> {
    const selectedRows = this.table.getSelectedRows();

    if (selectedRows.length === 0) {
      this.messageService.warning(
        `Vui lòng chọn sản phẩm muốn duyệt hoặc huỷ duyệt!`
      );
      return;
    }
    const idsToUpdate: number[] = [];

    for (const row of selectedRows) {
      const rowData = row.getData();
      const id = rowData.ID;
      const productCode = rowData.ProductCode || '[không rõ]';
      const productRTCId = rowData.ProductRTCID || 0;
      const productSaleId = rowData.ProductSaleID || 0;
      const supplierSaleId = rowData.SupplierSaleID || 0;
      const unitPrice = rowData.UnitPrice || 0;
      const currencyIDRequest = rowData.CurrencyID || 0;

      if (productRTCId <= 0) {
        if (supplierSaleId <= 0) {
          this.messageService.error(
            `Vui lòng nhập Nhà cung cấp cho sản phẩm [${productCode}].`
          );
          return;
        }
        if (unitPrice <= 0) {
          this.messageService.error(
            `Vui lòng nhập Đơn giá cho sản phẩm [${productCode}].`
          );
          return;
        }
        if (productSaleId <= 0 && productRTCId <= 0) {
          this.messageService.error(
            `Vui lòng tạo Mã nội bộ cho sản phẩm [${productCode}].`
          );
          return;
        }
        if (currencyIDRequest <= 0) {
          this.messageService.error(
            `Vui lòng chọn loại tiền tệ cho sản phẩm [${productCode}].`
          );
          return;
        }
      }

      const approvedEmployeeId = rowData.EmployeeIDRequestApproved || 0;
      if (id <= 0) continue;
      if (!this.isAdmin && approvedEmployeeId !== this.currentEmployeeId)
        continue;
      idsToUpdate.push(id);
    }

    if (idsToUpdate.length === 0) {
      this.messageService.warning('Không có sản phẩm nào hợp lệ để cập nhật!');
      return;
    }

    const confirmed = await this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật yêu cầu duyệt hoặc huỷ duyệt danh sách sản phẩm đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Huỷ',
      nzOnOk: () => {
        const payload = idsToUpdate.map((id) => ({
          ID: id,
          IsRequestApproved: isRequestApproved,
          EmployeeIDRequestApproved: this.currentEmployeeId,
        }));
      },
      nzOnCancel: () => false,
    });
  }
  async onCompleteRequestBuy(status: number): Promise<void> {
    const selectedRows = this.table.getSelectedRows();
    const statusText = status === 7 ? 'hoàn thành' : 'hủy hoàn thành';

    if (selectedRows.length === 0) {
      this.messageService.warning(
        `Vui lòng chọn sản phẩm muốn ${statusText} yêu cầu mua!`
      );
      return;
    }

    await this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Huỷ',
      nzOnOk: () => {
        const idsToUpdate: number[] = [];

        for (const row of selectedRows) {
          const rowData = row.getData();
          const id = rowData.ID;
          const approvedEmployeeId = rowData.EmployeeIDRequestApproved || 0;

          if (id <= 0) continue;
          if (!this.isAdmin && approvedEmployeeId !== this.currentEmployeeId)
            continue;

          idsToUpdate.push(id);
        }

        if (idsToUpdate.length === 0) {
          this.messageService.warning(
            'Không có sản phẩm nào hợp lệ để cập nhật!'
          );
          return;
        }

        const payload = idsToUpdate.map((id) => ({
          ID: id,
          StatusRequest: status,
          EmployeeIDRequestApproved: this.currentEmployeeId,
        }));
        this.PurchaseRequetsService.saveData(payload).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              this.messageService.success(
                `${
                  statusText.charAt(0).toUpperCase() + statusText.slice(1)
                } thành công!`
              );
              this.loadAllData();
            } else {
              this.messageService.error(
                `Không thể ${statusText}: ${res.message}`
              );
            }
          },
          error: (err) => {
            this.messageService.error(`Lỗi khi cập nhật: ${err.message}`);
          },
        });
      },
      nzOnCancel: () => false,
    });
    // if (!confirmed) return;
  }

  async onBGDApprove() {
    this.onApprove(true, false);
  }

  async onBGDUnapprove() {
    // await this.approveSelected(false, 'BGD');
    this.onApprove(false, false);
  }

  async onTBPApprove() {
    // Duyệt TBP
    this.onApprove(true, true);
  }

  async onTBPUnapprove() {
    this.onApprove(false, true);
  }

  // Phương thức validate trước khi gửi duyệt
  private validateForApproval(selectedRows: any[]): {
    isValid: boolean;
    message: string;
  } {
    for (const row of selectedRows) {
      const data = row.getData();

      // Kiểm tra sản phẩm phải có mã
      if (!data.ProductCode || data.ProductCode.trim() === '') {
        return {
          isValid: false,
          message: 'Có sản phẩm chưa có mã sản phẩm. Vui lòng kiểm tra lại!',
        };
      }

      // Kiểm tra số lượng phải > 0
      if (!data.Quantity || parseFloat(data.Quantity) <= 0) {
        return {
          isValid: false,
          message: `Sản phẩm [${data.ProductCode}] có số lượng không hợp lệ. Vui lòng kiểm tra lại!`,
        };
      }

      // Kiểm tra đơn giá phải > 0
      if (!data.UnitPrice || parseFloat(data.UnitPrice) <= 0) {
        return {
          isValid: false,
          message: `Sản phẩm [${data.ProductCode}] chưa có đơn giá. Vui lòng kiểm tra lại!`,
        };
      }

      // Kiểm tra nhà cung cấp
      if (!data.SupplierID || data.SupplierID <= 0) {
        return {
          isValid: false,
          message: `Sản phẩm [${data.ProductCode}] chưa có nhà cung cấp. Vui lòng kiểm tra lại!`,
        };
      }

      // Kiểm tra trạng thái yêu cầu
      if (data.StatusRequest && data.StatusRequest >= 2) {
        return {
          isValid: false,
          message: `Sản phẩm [${data.ProductCode}] đã được gửi duyệt hoặc đã được duyệt. Không thể gửi duyệt lại!`,
        };
      }
    }

    return { isValid: true, message: '' };
  }

  // Phương thức tính toán giá trị
  updateCalculatedValues(rowData: any): void {
    const quantity = parseFloat(rowData.Quantity) || 0;
    const unitPrice = parseFloat(rowData.UnitPrice) || 0;
    const currencyRate = parseFloat(rowData.CurrencyRate) || 1;
    const vat = parseFloat(rowData.VAT) || 0;
    const unitImportPrice = parseFloat(rowData.UnitImportPrice) || 0;

    // Tính thành tiền
    const totalPrice = quantity * unitPrice;
    rowData.TotalPrice = totalPrice;

    // Tính thành tiền quy đổi
    const totalPriceExchange = totalPrice * currencyRate;
    rowData.TotalPriceExchange = totalPriceExchange;

    // Tính thành tiền nhập khẩu
    const totalImportPrice = unitImportPrice * quantity;
    rowData.TotalImportPrice = totalImportPrice;

    // Tính thành tiền có VAT
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;
    rowData.TotaMoneyVAT = totalMoneyVAT;
  }

  // Phương thức xử lý thay đổi giá trị ô
  onCellValueChanged(cell: any): void {
    const rowData = cell.getRow().getData();
    const field = cell.getField();

    // Các trường cần tính toán lại
    const calculationFields = [
      'Quantity',
      'UnitPrice',
      'CurrencyRate',
      'VAT',
      'UnitImportPrice',
    ];

    if (calculationFields.includes(field)) {
      this.updateCalculatedValues(rowData);
      cell.getRow().reformat();
    }
  }

  // Phương thức tạo sản phẩm mới
  createProduct(): void {}

  // Phương thức duplicate yêu cầu
  duplicateRequest(): void {}

  async onUpdateProductImport(isImport: boolean): Promise<void> {
    const isImportText = isImport ? 'hàng nhập khẩu' : 'hàng nội địa';
    const selectedRows = this.table.getSelectedRows();

    if (selectedRows.length === 0) {
      this.messageService.warning(
        `Vui lòng chọn sản phẩm muốn chuyển thành ${isImportText}!`
      );
      return;
    }

    const confirmed = await this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn chuyển sản phẩm đã chọn thành ${isImportText} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Huỷ',
      nzOnOk: () => true,
      nzOnCancel: () => false,
    });

    if (!confirmed) return;

    const dataToUpdate = selectedRows
      .map((row: any) => {
        const rowData = row.getData();
        const id = rowData.ID;
        if (id > 0) {
          return {
            ID: id,
            IsImport: isImport,
          };
        }
        return null;
      })
      .filter((item: any) => item !== null);

    if (dataToUpdate.length === 0) {
      this.messageService.warning('Không có sản phẩm hợp lệ để cập nhật!');
      return;
    }
  }

  async saveData(showConfirm: boolean = false): Promise<boolean> {
    const editedCells = this.tables[this.activeTabId].getEditedCells();
    if (editedCells.length === 0) return true;

    const modifiedRows: { [id: number]: any } = {};

    editedCells.forEach((cell: any) => {
      const row = cell.getRow();
      const rowData = row.getData();
      const field = cell.getField();

      if (!modifiedRows[rowData.ID]) {
        modifiedRows[rowData.ID] = { ID: rowData.ID };
      }

      modifiedRows[rowData.ID][field] = rowData[field];
    });

    const finalPayload = Object.values(modifiedRows);

    if (showConfirm) {
      const confirmed = await this.modal.confirm({
        nzTitle: 'Thông báo',
        nzContent: `Bạn có muốn lưu những thay đổi này không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Huỷ',
        nzOnOk: () => true,
        nzOnCancel: () => false,
      });

      if (!confirmed) return false;
    }

    return new Promise((resolve) => {
      this.PurchaseRequetsService.saveData(finalPayload).subscribe({
        next: () => {
          this.messageService.success('Lưu dữ liệu thành công!');
          // Cập nhật cachedData với dữ liệu đã lưu
          finalPayload.forEach((item) => {
            const rowIndex = this.cachedData[this.currentDataType].findIndex(
              (row) => row.ID === item.ID
            );
            if (rowIndex !== -1) {
              this.cachedData[this.currentDataType][rowIndex] = {
                ...this.cachedData[this.currentDataType][rowIndex],
                ...item,
              };
            }
          });
          resolve(true);
        },
        error: (err) => {
          this.messageService.error('Lỗi khi lưu: ' + err.message);
          resolve(false);
        },
      });
    });
  }

  calculateTotalMoneyExchange(row: any): number {
    const totalPrice = +row.TotalPrice || 0;
    const currencyRate = +row.CurrencyRate || 0;
    return totalPrice * currencyRate;
  }
  keepSelectedProducts(isKeep: boolean) {
    const selectedRows = this.table.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.messageService.warning(
        `Vui lòng chọn sản phẩm để ${isKeep ? 'giữ hàng' : 'hủy giữ hàng'}!`
      );
      return;
    }

    const confirmMsg = `Bạn có chắc muốn ${
      isKeep ? 'giữ hàng' : 'hủy giữ hàng'
    } cho các sản phẩm đã chọn không?`;
    if (!confirm(confirmMsg)) return;
    if (
      (selectedRows.EmployeeIDRequestApproved &&
        selectedRows.EmployeeIDRequestApproved !== this.currentEmployeeId) ||
      !this.isAdmin
    ) {
      this.messageService.error(
        'Bạn không thể giữ hàng cho sản phẩm đã được duyệt bởi nhân viên khác!'
      );
      return;
    }
    const payload = selectedRows.map((row: any) => ({
      ID: row.InventoryProjectID || 0,
      ProductSaleID: row.ProductSaleID,
      ProjectID: row.ProjectID,
      Quantity: row.Quantity,
      EmployeeID: row.EmployeeIDRequestApproved,
      ProjectParlistPurchaseRequestID: [row.ID],
    }));

    this.PurchaseRequetsService.keepProduct(payload).subscribe({
      next: (res) => {
        this.messageService.success(
          res['message'] || 'Cập nhật giữ hàng thành công'
        );
        this.loadInitialData(); // hàm reload lại bảng
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400) {
          const message =
            error.error?.message || 'Lỗi không xác định từ server';
          this.messageService.error(`Lỗi : ${message}`);
          console.error('Lỗi 400:', message);
        } else {
          console.error('Lỗi khác:', error);
        }
      },
    });
  }
  updateRowValues(row: any): void {
    const quantity = Number(row.Quantity) || 0;
    const unitPrice = Number(row.UnitPrice) || 0;
    const currencyRate = Number(row.CurrencyRate) || 1;
    const unitImportPrice = Number(row.UnitImportPrice) || 0;
    const vat = Number(row.VAT) || 0;

    const totalPrice = quantity * unitPrice;
    const totalPriceExchange = totalPrice * currencyRate;
    const totalImportPrice = unitImportPrice * quantity;
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    row.TotalPrice = totalPrice;
    row.TotalPriceExchange = totalPriceExchange;
    row.TotalImportPrice = totalImportPrice;
    row.TotaMoneyVAT = totalMoneyVAT;
  }
}
