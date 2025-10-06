import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
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
import { USER_NAME } from '../../../app.config';
import { EMPLOYEE_ID } from '../../../app.config';
import { ISADMIN } from '../../../app.config';
import * as ExcelJS from 'exceljs';
import { ProjectPartlistPurchaseRequestService } from './service/project-partlist-purchase-request.service';

@Component({
  selector: 'app-project-partlist-purchase-request',
  standalone: true,
  imports: [
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
  constructor() {}

  ngOnInit() {
    this.filters = {
      dateStart: DateTime.local(2025, 1, 1).toFormat('yyyy-MM-dd'),
      dateEnd: DateTime.local(2025, 6, 30).toFormat('yyyy-MM-dd'),
      statusRequest: 1,
      projectID: 0,
      keyword: '',
      supplierSaleID: 0,
      isApprovedTBP: false,
      isApprovedBGD: false,
      isCommercialProduct: false,
      poKHID: 0,
      productRTCID: 0,
      isDeleted: false,
      isTechBought: false,
      isJobRequirement: false,
      size: 20,
      page: 1,
    };

    this.DrawTable();
  }
  // Thêm vào phần khai báo biến của component
  activeTabId: number = 1;
  projectTypes = [
    { ProjectTypeID: 1, ProjectTypeName: 'Yêu cầu mua dự án' },
    { ProjectTypeID: 2, ProjectTypeName: 'Kỹ thuật đã mua' },
    { ProjectTypeID: 3, ProjectTypeName: 'Yêu cầu mua hàng demo' },
    { ProjectTypeID: 4, ProjectTypeName: 'Yêu cầu mượn hàng demo' },
    { ProjectTypeID: 5, ProjectTypeName: 'Thương mại' },
  ];

  // Thêm phương thức này vào component
  public SelectProjectType(typeId: number): void {
    this.activeTabId = typeId;
    this.filters.projectTypeID = typeId;

    // Tạo hoặc cập nhật bảng dữ liệu cho tab được chọn
    const tableId = `datatable-${typeId}`;
    const element = document.getElementById(tableId);

    if (element) {
      // Cập nhật dữ liệu bảng hoặc tạo bảng mới nếu cần
      if (this.table) {
        this.table.setPage(1);
        // Cập nhật tham số AJAX và tải lại dữ liệu
        this.table.setData();
      }
    }
  }
  ResetFilters() {}
  ApplyFilters() {}
  ToggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  private DrawTable() {
    this.table = new Tabulator('#table', {
      layout: 'fitDataStretch', // Fit columns to width of table
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
      ajaxURL: this.PurchaseRequetsService.getAPIUrl(),
      ajaxParams: () => {
        const filters = this.filters;

        let statusRequest = filters.statusRequest;
        if (statusRequest < 0) statusRequest = 0;

        let isCommercialProduct =
          filters.projectTypeID === -1 ? 1 : filters.isCommercialProd;
        let poKHID = filters.projectTypeID >= 0 ? 0 : filters.poKHID;

        return {
          dateStart: DateTime.fromISO(filters.dateStart).toFormat('yyyy-MM-dd'),
          dateEnd: DateTime.fromISO(filters.dateEnd).toFormat('yyyy-MM-dd'),
          statusRequest: statusRequest,
          projectId: filters.projectId,
          keyword: filters.keyword,
          isDeleted: filters.isDeleted,
          projectTypeID: filters.projectTypeID,
          poKHID: poKHID,
          isCommercialProduct: isCommercialProduct,
          page: 1,
          size: 25,
        };
      },
      height: '60vh',
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },

      responsiveLayout: 'hide',
      paginationMode: 'remote',
      pagination: true,
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100],
      paginationInitialPage: 1,

      columns: [
        { title: 'ID', field: 'id', sorter: 'number' },
        {
          title: 'Dự án',
          field: 'projectName',
          sorter: 'string',
        },
        { title: 'TT', field: 'tt', sorter: 'number' },
        {
          title: 'Mã sản phẩm',
          field: 'productCode',
          sorter: 'string',
        },
        {
          title: 'Tên sản phẩm',
          field: 'productName',
          sorter: 'string',
        },
        {
          title: 'Trạng thái',
          field: 'status',
          sorter: 'string',
        },
        {
          title: 'Người yêu cầu',
          field: 'requester',
          sorter: 'string',
        },
        {
          title: 'Ngày yêu cầu',
          field: 'requestDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Deadline',
          field: 'deadline',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Số lượng',
          field: 'quantity',
          sorter: 'number',
        },
        {
          title: 'Đơn giá',
          field: 'unitPrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Thành tiền chưa VAT',
          field: 'totalExclVAT',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Ngày đặt hàng',
          field: 'orderDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Ngày về dự kiến',
          field: 'expectedArrivalDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Ngày về thực tế',
          field: 'actualArrivalDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Ngày nhận',
          field: 'receiveDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Ghi chú',
          field: 'notes',
          sorter: 'string',
        },
        {
          title: 'Nhà cung cấp',
          field: 'supplier',
          sorter: 'string',
        },
        {
          title: 'Project Part List ID',
          field: 'projectPartListId',
          sorter: 'number',
        },
        {
          title: 'Status Request',
          field: 'statusRequest',
          sorter: 'string',
        },
        {
          title: 'Loại tiền',
          field: 'currencyType',
          sorter: 'string',
        },
        {
          title: 'TBP duyệt',
          field: 'tbpApproval',
          sorter: 'string',
        },
        {
          title: 'BGD duyệt',
          field: 'bgdApproval',
          sorter: 'string',
        },
        {
          title: 'Trưởng bộ phận',
          field: 'departmentHead',
          sorter: 'string',
        },
        {
          title: 'BGĐ',
          field: 'boardOfDirectors',
          sorter: 'string',
        },
        {
          title: 'Ngày TBP duyệt',
          field: 'tbpApprovalDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Loại kho',
          field: 'warehouseType',
          sorter: 'string',
        },
        {
          title: 'Product RTCID',
          field: 'productRtcid',
          sorter: 'string',
        },
        {
          title: 'Đơn vị',
          field: 'unit',
          sorter: 'string',
        },
        {
          title: 'Mã nội bộ',
          field: 'internalCode',
          sorter: 'string',
        },
        {
          title: 'Hàng nhập khẩu',
          field: 'isImported',
          sorter: 'string',
        },
        {
          title: 'Giá lịch sử',
          field: 'historicalPrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Tỷ giá',
          field: 'exchangeRate',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Thành tiền quy đổi (VND)',
          field: 'convertedTotalVND',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Lead Time',
          field: 'leadTime',
          sorter: 'number',
        },
        {
          title: 'Đơn giá xuất xưởng',
          field: 'factoryPrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Giá nhập khẩu',
          field: 'importPrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Tổng tiền nhập khẩu',
          field: 'totalImportCost',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Yêu cầu duyệt mua',
          field: 'purchaseApprovalRequest',
          sorter: 'string',
        },
        {
          title: 'Hãng',
          field: 'brand',
          sorter: 'string',
        },
        {
          title: 'Lý do huỷ',
          field: 'cancelReason',
          sorter: 'string',
        },
        {
          title: 'Project ID',
          field: 'projectId',
          sorter: 'number',
        },
        {
          title: 'NV mua',
          field: 'buyer',
          sorter: 'string',
        },
        {
          title: '% VAT',
          field: 'vatPercentage',
          sorter: 'number',
        },
        {
          title: 'Thành tiền có VAT',
          field: 'totalInclVAT',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'PONCCID',
          field: 'PONCCID',
          sorter: 'string',
        },
        {
          title: 'Đơn mua hàng',
          field: 'purchaseOrder',
          sorter: 'string',
        },
        {
          title: 'Đơn giá bán (Sale Admin up)',
          field: 'salePrice',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Khách hàng',
          field: 'customer',
          sorter: 'string',
        },
        {
          title: 'Is Commercial Product',
          field: 'isCommercialProduct',
          sorter: 'string',
        },
        {
          title: 'Huỷ yêu cầu',
          field: 'cancelRequest',
          sorter: 'string',
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'technicalSpecs',
          sorter: 'string',
        },
        {
          title: 'Job Requirement ID',
          field: 'jobRequirementId',
          sorter: 'string',
        },
        {
          title: 'Customer ID',
          field: 'customerId',
          sorter: 'string',
        },
        {
          title: 'Danh mục',
          field: 'category',
          sorter: 'string',
        },
        {
          title: 'PO Number',
          field: 'poNumber',
          sorter: 'string',
        },
        {
          title: 'Mã theo khách',
          field: 'customerCode',
          sorter: 'string',
        },
        {
          title: 'Mã dự án',
          field: 'projectCode',
          sorter: 'string',
        },
        {
          title: 'Mã POKH',
          field: 'poKhCode',
          sorter: 'string',
        },
        {
          title: 'Trạng thái đặt hàng',
          field: 'orderStatus',
          sorter: 'string',
        },
        {
          title: 'Mã đặc biệt',
          field: 'specialCode',
          sorter: 'string',
        },
        {
          title: 'Thành tiền lịch sử',
          field: 'historicalTotal',
          sorter: 'number',
          formatter: 'money',
          formatterParams: { thousand: ',', precision: 2 },
        },
        {
          title: 'Inventory Project ID',
          field: 'inventoryProjectId',
          sorter: 'string',
        },
        {
          title: 'Ghi chú KT',
          field: 'technicalNotes',
          sorter: 'string',
        },
        {
          title: 'Approved TBP',
          field: 'approvedTbp',
          sorter: 'string',
        },
        {
          title: 'Ngày dự kiến trả',
          field: 'expectedReturnDate',
          sorter: 'date',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy' },
        },
        {
          title: 'Loại phiếu',
          field: 'ticketType',
          sorter: 'string',
        },
      ],
      // Placeholder for data; replace with actual data source (e.g., API call)
      data: [],
      initialSort: [
        { column: 'id', dir: 'asc' }, // Initial sort by ID
      ],
    });
  }
}
