import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common'; // Thêm import này
import { DateTime } from 'luxon';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { LOGIN_NAME } from '../../app.config';
import { EMPLOYEE_ID } from '../../app.config';
import { IS_ADMIN } from '../../app.config';
import * as ExcelJS from 'exceljs';
import { ProjectPartlistPurchaseRequestService } from './service/project-partlist-purchase-request.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';

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
export class ProjectPartlistPurchaseRequestComponent implements OnInit {
  filters: any;
  table: any; // To hold the Tabulator instance
  sizeSearch: string = '0';
  PurchaseRequetsService = inject(ProjectPartlistPurchaseRequestService);

  // Cache dữ liệu cho từng tab (dựa trên logic backend)
  cachedData: { [key: string]: any[] } = {
    purchaseRequests: [], // ProductRTCID == null || ProductRTCID <= 0
    dataRTC: [], // ProductRTCID > 0 && TicketType == 0
    techBought: [], // IsTechBought == true
    productRTCBorrow: [], // TicketType == 1 && (IsApprovedTBP==0 || ApprovedTBP == employeeID)
  };
  dtproject: any[] = [];
  dtPOKH: any[] = [];
  currentDataType: string = 'purchaseRequests';
  isDataLoaded: boolean = false;
  isLoading: boolean = false;

  constructor() {}

  ngOnInit() {
    // Khởi tạo filters với giá trị mặc định như bạn đã cung cấp
    this.filters = {
      DateStart: '2025-01-01T03:34:37.045Z',
      DateEnd: '2025-06-12T03:34:37.045Z',
      StatusRequest: 1,
      ProjectID: 0,
      SupplierSaleID: 0,
      IsApprovedTBP: -1,
      IsApprovedBGD: -1,
      IsCommercialProduct: 0,
      POKHID: 0,
      ProductRTCID: -1,
      IsDeleted: 0,
      IsTechBought: 0,
      IsJobRequirement: 0,
      Page: 1,
      Size: 1000000, // Load tất cả dữ liệu một lần
    };

    // Khởi tạo bảng
    this.DrawTable();

    // Load dữ liệu ban đầu
    this.loadInitialData();
  }

  // Load tất cả dữ liệu một lần
  loadAllData() {
    if (this.isDataLoaded) return;

    this.isLoading = true;

    // Sử dụng filter với Size: 1000000 để load tất cả dữ liệu một lần
    const allDataFilters = {
      DateStart: this.filters.DateStart,
      DateEnd: this.filters.DateEnd,
      StatusRequest: this.filters.StatusRequest,
      ProjectID: this.filters.ProjectID,
      Keyword: this.filters.Keyword,
      SupplierSaleID: this.filters.SupplierSaleID,
      IsApprovedTBP: this.filters.IsApprovedTBP,
      IsApprovedBGD: this.filters.IsApprovedBGD,
      IsCommercialProduct: this.filters.IsCommercialProduct,
      POKHID: this.filters.POKHID,
      ProductRTCID: this.filters.ProductRTCID,
      IsDeleted: this.filters.IsDeleted,
      IsTechBought: this.filters.IsTechBought,
      IsJobRequirement: this.filters.IsJobRequirement,
      Page: 1,
      Size: 10000000, // Load tất cả dữ liệu một lần
    };

    this.PurchaseRequetsService.getAllData(allDataFilters).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === 1) {
          // Backend đã phân loại dữ liệu, chỉ cần lưu vào cache
          this.cachedData['purchaseRequests'] =
            response.data.purchaseRequests || [];
          this.cachedData['dataRTC'] = response.data.dataRTC || [];
          this.cachedData['techBought'] = response.data.techBought || [];
          this.cachedData['productRTCBorrow'] =
            response.data.productRTCBorrow || [];
          this.cachedData['productCommercial'] =
            response.data.productCommercial || [];

          this.isDataLoaded = true;
          this.updateTableWithCachedData();
        } else {
          console.error('API Error:', response.message);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
      },
    });
  }
  loadInitialData() {
    // Load danh sách dự án
    this.loadProjects();
    // Load danh sách PO
    this.loadPOKH();
    // Load dữ liệu chính
    this.loadAllData();
  }

  loadProjects() {
    // Gọi API để lấy danh sách dự án
    this.PurchaseRequetsService.getProjects().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtproject = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
      },
    });
  }

  loadPOKH() {
    // Gọi API để lấy danh sách PO
    this.PurchaseRequetsService.getPOKH().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dtPOKH = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading POKH:', error);
      },
    });
  }

  // Cập nhật table với dữ liệu đã cache
  updateTableWithCachedData() {
    const currentData = this.cachedData[this.currentDataType] || [];
    if (this.table) {
      this.table.setData(currentData);
    }
  }

  // // Thêm vào phần khai báo biến của component
  activeTabId: number = 1;

  public SelectProjectType(typeId: number): void {
    this.activeTabId = typeId;

    // Map tab với loại dữ liệu dựa trên logic backend
    switch (typeId) {
      case 1: // Yêu cầu mua dự án
        this.currentDataType = 'purchaseRequests';
        break;
      case 2: // Kỹ thuật đã mua
        this.currentDataType = 'techBought';
        break;
      case 3: // Yêu cầu mua hàng demo
        this.currentDataType = 'dataRTC';
        break;
      case 4: // Yêu cầu mượn hàng demo
        this.currentDataType = 'productRTCBorrow';
        break;
      case 5: // Thương mại
        this.currentDataType = 'productCommercial';
        break;
      default:
        this.currentDataType = 'purchaseRequests';
    }

    // Cập nhật table với dữ liệu đã cache
    this.updateTableWithCachedData();
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
      IsCommercialProduct: 0,
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

  private DrawTable() {
    // Tạo element trước khi khởi tạo Tabulator
    const tableElement = document.getElementById('table');
    if (!tableElement) {
      console.error('Table element not found');
      setTimeout(() => this.DrawTable(), 100); // Thử lại sau 100ms nếu không tìm thấy element
      return;
    }

    // Khởi tạo Tabulator với cấu hình client-side pagination
    this.table = new Tabulator('#table', {
      layout: 'fitDataStretch',
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        cellClick: function (e: any, cell: any) {
          cell.getRow().toggleSelect();
        },
      },
      height: 720,
      pagination: true,
      paginationMode: 'local', // Sử dụng client-side pagination
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100, true], // true = hiển thị tất cả
      paginationInitialPage: 1,

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
          formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
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
          formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
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
          hozAlign:'center'
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
        },

        {
          title: 'Tỷ giá',
          field: 'CurrencyRate',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
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
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Giá lịch sử',
          field: 'HistoryPrice',
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
          sorter: 'number',
          headerHozAlign: 'center',
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
          field: 'NameNCC',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Lead Time',
          field: 'LeadTime',
          sorter: 'number',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          width: 200,
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú KT',
          field: 'NotePartlist',
          sorter: 'string',
          width: 250,
          headerHozAlign: 'center',
          formatter: "textarea",
            formatterParams: {
              maxHeight: 100
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
          formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
        },
        {
          title: 'Lý do huỷ',
          field: 'ReasonCancel',
          sorter: 'string',
          width: 200,
          headerHozAlign: 'center',
          formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
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
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } disabled />`;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn giá xuất xưởng',
          field: 'UnitFactoryExportPrice',
          sorter: 'number',
          formatter: 'money',
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
          title: 'Nhà cung cấp',
          field: 'SupplierSaleID',
          width: 180,
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
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
          width: 100,
          headerWordWrap: true,
          headerHozAlign: 'center',
        },
        {
          title: 'Tổng tiền nhập khẩu',
          field: 'TotalImportPrice',
          sorter: 'number',
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
      ],
      // Placeholder for data; replace with actual data source (e.g., API call)
      data: [],
      initialSort: [
        { column: 'ID', dir: 'asc' }, // Initial sort by ID
      ],
    });
  }
}
