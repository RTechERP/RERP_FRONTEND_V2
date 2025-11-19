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

import { QuotationKhServicesService } from './quotation-kh-services/quotation-kh-services.service';
import { QuotationKhDetailComponent } from '../quotation-kh-detail/quotation-kh-detail.component';
import { QuotationKhDetailServiceService } from '../quotation-kh-detail/quotation-kh-detail-service/quotation-kh-detail-service.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { PokhComponent } from '../pokh/pokh.component';
import { PokhDetailComponent } from '../pokh-detail/pokh-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

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
    HasPermissionDirective,
  ],
  templateUrl: './quotation-kh.component.html',
  styleUrl: './quotation-kh.component.css',
})
export class QuotationKhComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;
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
    private customerPartService: CustomerPartService
  ) {}

  filterUserData: any[] = [];
  filterCustomerData: any[] = [];
  dataDetail: any[] = [];
  selectedId: number = 0;
  selectedRow: any = null;

  filters: any = {
    filterText: '',
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
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.mainTable.setData();
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  loadUsers(): void {
    this.quotationKhDetailService.getUser().subscribe(
      (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu User:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải User:', error);
      }
    );
  }

  loadCustomer(): void {
    this.customerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.filterCustomerData = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu Customer:',
            response.message
          );
        }
      },
      (error) => {
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
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }
  getQuotationKHAjaxParams(): any {
    return (params: any) => {
      console.log('Params từ Tabulator:', params);

      return {
        filterText: this.filters.filterText || '',
        customerId: this.filters.customerId || 0,
        userId: this.filters.userId || 0,
        status: this.filters.status || -1,
      };
    };
  }

  handleQuotationApproval(isApprove: boolean) {
    if (!this.selectedId) {
      this.notification.error(
        'Lỗi',
        'Vui lòng chọn báo giá cần duyệt hoặc hủy duyệt'
      );
      return;
    }

    // Kiểm tra trạng thái duyệt hiện tại
    const SELECTED_ITEM = this.selectedRow;
    if (!SELECTED_ITEM) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy thông tin báo giá');
      return;
    }

    if (isApprove && SELECTED_ITEM.IsApproved) {
      this.notification.info('Thông báo', 'Báo giá này đã được duyệt rồi!');
      return;
    }

    if (!isApprove && !SELECTED_ITEM.IsApproved) {
      this.notification.info('Thông báo', 'Báo giá này chưa được duyệt!');
      return;
    }

    const confirmMessage = isApprove
      ? `Bạn có chắc chắn muốn DUYỆT - Báo giá này không ?`
      : `Bạn có chắc chắn muốn HỦY DUYỆT - Báo giá này không ?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requestBody = {
          quotationKHs: {
            ID: this.selectedId,
            IsApproved: isApprove,
          },
          quotationKHDetails: [],
        };

        this.quotationKhDetailService.save(requestBody).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                'Thông báo',
                isApprove
                  ? 'Duyệt Báo giá thành công'
                  : 'Hủy duyệt Báo giá thành công'
              );
              this.selectedId = 0;
              this.mainTable.setData(); //Reload table
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xử lý Báo giá');
            }
          },
          error: (error) => {
            this.notification.error(
              'Thông báo',
              'Error handling Báo giá: ' + error
            );
          },
        });
      },
    });
  }
  onDelete() {
    if (!this.selectedId) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn báo giá cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có chắc muốn xóa báo giá này không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requestBody = {
          quotationKHs: {
            ID: this.selectedId,
            IsDeleted: true,
          },
          quotationKHDetails: [],
        };

        this.quotationKhDetailService.save(requestBody).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa báo giá thành công!');
              this.selectedId = 0;
              this.mainTable.setData(); //Reload table
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xử lý Báo giá');
            }
          },
          error: (error) => {
            this.notification.error(
              'Thông báo',
              'Error handling Báo giá: ' + error
            );
          },
        });
      },
    });
  }
  onEdit() {
    if (!this.selectedId) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần sửa');
      return;
    }
    this.quotationKhServices.getQuotationKHDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const DETAIL = response.data;
          const MAINDATA = this.selectedRow;
          const groupedData = [
            {
              MainData: MAINDATA,
              ID: this.selectedId,
              items: DETAIL,
            },
          ];
          const modalRef = this.modalService.open(QuotationKhDetailComponent, {
            centered: true,
            // windowClass: 'full-screen-modal',
            size: 'xl',
            backdrop: 'static',
          });
          modalRef.componentInstance.groupedData = groupedData;
          modalRef.componentInstance.isEditMode = true;

          modalRef.result.then(
            (result) => {
              if (result.success && result.reloadData) {
                this.mainTable.setData();
              }
            },
            (reason) => {
              console.log('Modal closed');
            }
          );
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  openPOKHModal() {
    // Tạo một component tạm thời để mở modal addModalContent
    const modalRef = this.modalService.open(PokhDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
    });

    modalRef.result.then(
      (result) => {
        console.log('POKH Modal closed');
      },
      (reason) => {
        console.log('POKH Modal dismissed');
      }
    );
  }
  async exportMainTableToExcel() {
    if (!this.mainTable) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('QUOTATIONKH_List');

    // Get column definitions from the table
    const columns = this.mainTable.getColumns();

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

    // Get current page data
    const currentPage = Number(this.mainTable.getPage());
    const pageSize = Number(this.mainTable.getPageSize());
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get all data and slice for current page
    const allData = this.mainTable.getData();
    const currentPageData = allData.slice(startIndex, endIndex);

    // Xác định các field cần format
    const moneyFields = [
      'TotalPrice',
      'ComMoney',
      'IntoMoney',
      'UnitPrice',
      'UnitPriceImport',
      'TotalPriceImport',
      'GiaNet',
    ];
    const percentFields = ['Commission'];
    const dateFields = ['CreateDate', 'QuotationDate'];

    // Process rows
    currentPageData.forEach((rowData) => {
      const row = columns.map((col) => {
        const field = col.getField();
        let value = rowData[field];
        if (moneyFields.includes(field)) {
          // Format tiền
          value =
            value !== undefined && value !== null && value !== ''
              ? new Intl.NumberFormat('vi-VN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(Number(value))
              : '';
        } else if (percentFields.includes(field)) {
          // Format phần trăm
          value =
            value !== undefined && value !== null && value !== ''
              ? (Number(value) * 100).toFixed(0) + '%'
              : '';
        } else if (dateFields.includes(field)) {
          // Format ngày
          value = value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        }
        return value;
      });
      worksheet.addRow(row);
    });

    // Add bottom calculations for money columns
    const bottomCalcRow = worksheet.addRow(
      columns.map((col) => {
        const column = col.getDefinition();
        const field = column.field as string;
        if (column.bottomCalc) {
          // Calculate total for current page only
          let total = 0;
          currentPageData.forEach((rowData) => {
            const value = rowData[field];
            if (typeof value === 'number') {
              total += value;
            } else if (!isNaN(Number(value))) {
              total += Number(value);
            }
          });
          // Format tiền nếu là cột tiền
          if (
            moneyFields.includes(field) ||
            column.bottomCalcFormatter === 'money'
          ) {
            return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(total);
          }
          // Format phần trăm nếu là cột phần trăm
          if (percentFields.includes(field)) {
            return (total * 100).toFixed(0) + '%';
          }
          return total;
        }
        return '';
      })
    );

    // Style the bottom calc row
    bottomCalcRow.font = { bold: true };
    bottomCalcRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add a label for the total row
    const totalLabelCell = bottomCalcRow.getCell(1);
    totalLabelCell.value = 'Tổng cộng';
    totalLabelCell.font = { bold: true };

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
    link.download = `QUOTATIONKH_List_Page_${currentPage}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  initMainTable(): void {
    this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      selectableRows: 1,
      height: '88vh',
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
      rowHeader: false,
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 70,
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
        },
        {
          title: 'Mã báo giá',
          field: 'QuotationCode',
          sorter: 'string',
          width: 150,
        },
        { title: 'PO', field: 'POCode', sorter: 'string', width: 150 },
        { title: 'Dự án', field: 'ProjectCode', sorter: 'string', width: 150 },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Người liên hệ',
          field: 'ContactName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'SĐT người liên hệ',
          field: 'ContactPhone',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Ngày tạo',
          field: 'CreateDate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Ngày báo giá',
          field: 'QuotationDate',
          sorter: 'string',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Tổng tiền',
          field: 'TotalPrice',
          sorter: 'number',
          width: 200,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
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
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tiền COM',
          field: 'ComMoney',
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
          title: 'COM (%)',
          field: 'Commission',
          sorter: 'number',
          width: 150,
          formatter: function (cell) {
            return cell.getValue() * 100 + '%';
          },
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Giải trình Fail',
          field: 'Explanation',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Download File',
          field: 'AttachFile',
          sorter: 'string',
          width: 150,
        },
      ],
    });
    this.mainTable.on('rowClick', (e: any, row: RowComponent) => {
      const ID = row.getData()['ID'];
      const rowData = row.getData();
      this.selectedId = ID;
      this.selectedRow = rowData;
      this.loadQuotationKHDetail(ID);
    });
  }

  initDetailTable(): void {
    this.detailTable = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '85vh',
      data: this.dataDetail,
      rowHeader: false,

      columns: [
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Mã báo khách',
          field: 'InternalCode',
          sorter: 'string',
          width: 80,
        },
        { title: 'Hãng', field: 'Maker', sorter: 'string', width: 150 },
        { title: 'Đơn vị', field: 'Unit', sorter: 'string', width: 150 },
        { title: 'Số lượng', field: 'Qty', sorter: 'string', width: 150 },
        {
          title: 'Đơn giá báo trước VAT',
          field: 'UnitPrice',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Thành tiền trước VAT',
          field: 'IntoMoney',
          sorter: 'number',
          width: 200,
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
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
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Loại tiền',
          field: 'TypeOfPrice',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Đơn giá nhập',
          field: 'UnitPriceImport',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Tổng giá nhập',
          field: 'TotalPriceImport',
          sorter: 'string',
          width: 150,
        },
        { title: 'Giá net', field: 'GiaNet', sorter: 'string', width: 150 },
        { title: 'Nhóm', field: 'GroupQuota', sorter: 'string', width: 150 },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 150 },
      ],
    });
  }
}
