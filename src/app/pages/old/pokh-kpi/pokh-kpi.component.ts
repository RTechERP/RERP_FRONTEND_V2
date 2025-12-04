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

import { PokhService } from '../pokh/pokh-service/pokh.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

import { CustomerServiceService } from '../../crm/customers/customer/customer-service/customer-service.service';
import { QuotationKhDetailServiceService } from '../quotation-kh-detail/quotation-kh-detail-service/quotation-kh-detail-service.service';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { ProjectService } from '../../project/project-service/project.service';

@Component({
  selector: 'app-pokh-kpi',
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
    // HasPermissionDirective,
  ],
  templateUrl: './pokh-kpi.component.html',
  styleUrl: './pokh-kpi.component.css',
})
export class PokhKpiComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_POKH', { static: false }) tb_POKHElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailElement!: ElementRef;

  tb_POKH!: Tabulator;
  tb_Detail!: Tabulator;
  sizeSearch: string = '0';
  sizeTbDetail: string = '20%';
  selectedId: number = 0;
  selectedRow: any = null;
  filterEmployeeTeamSale: any[] = [];
  selectedIds: number[] = []; // Lưu danh sách ID đã chọn

  groupSales: any[] = [];
  mainIndexes: any[] = [];
  filterUserData: any[] = [];

  customers: any[] = [];
  dataDetail: any[] = [];
  filters: any = {
    filterText: '',
    pageNumber: 1,
    pageSize: 50,
    customerId: 0,
    userId: 0,
    POType: 0,
    status: 0,
    mainIndexId: 0,
    group: 0,
    groupId: 0,
    warehouseId: 1,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };
  allSelected: boolean = false; // Thêm biến trạng thái chọn tất cả

  getStatusColor(status: number): string {
    switch (status) {
      case 0:
        return 'rgb(255, 255, 0)'; // Vàng
      case 1:
        return 'transparent'; // Không màu
      case 2:
        return 'rgb(244, 176, 132)'; // Cam nhạt
      case 3:
        return 'rgb(155, 194, 230)'; // Xanh dương nhạt
      case 4:
        return 'rgb(169, 208, 142)'; // Xanh lá nhạt
      case 5:
        return 'rgb(255, 255, 0)'; // Vàng
      default:
        return 'transparent';
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  closePanel() {
    this.sizeTbDetail = '0';
  }
  toggleSelectAll() {
    if (!this.tb_POKH) return;
    if (this.allSelected) {
      this.tb_POKH.deselectRow();
      this.allSelected = false;
    } else {
      // Chỉ chọn các row trên trang hiện tại
      const rows = this.tb_POKH.getRows();
      this.tb_POKH.selectRow(rows);
      this.allSelected = true;
    }
  }
  constructor(
    private POKHService: PokhService,
    private notification: NzNotificationService,
    private customerService: CustomerServiceService,
    private quotationKhDetailService: QuotationKhDetailServiceService,
    private viewPokhService: ViewPokhService,
    private projectService: ProjectService
  ) {}
  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadFilterCustomers();
    this.loadFilterUserData();
    this.loadFilterGroupSales();
    this.loadFilterMainIndexes();
  }
  ngAfterViewInit(): void {
    this.drawPOKHTable();
    this.initDetailTable();
  }

  loadPOKH(): void {
    if (this.tb_POKH) {
      // Sử dụng selectedIds đã lưu (không phụ thuộc vào data hiện tại)
      // Điều này đảm bảo các ID vẫn được giữ ngay cả khi dòng bị mất khỏi kết quả lọc
      const previouslySelectedIds = [...this.selectedIds];

      // Gọi setData() với tham số true để force reload data từ server
      this.tb_POKH.setData(null, true).then(() => {
        // Sau khi reload xong, chọn lại các dòng theo ID đã lưu
        if (previouslySelectedIds.length > 0) {
          setTimeout(() => {
            const allRows = this.tb_POKH.getRows();
            const rowsToSelect = allRows.filter((row: any) => {
              const rowData = row.getData();
              return previouslySelectedIds.includes(rowData.ID);
            });

            // Chọn lại các dòng có trong data mới
            if (rowsToSelect.length > 0) {
              this.tb_POKH.selectRow(rowsToSelect);
            }

            // Luôn load lại detail với tất cả các ID đã chọn (kể cả những ID không có trong data hiện tại)
            // Điều này đảm bảo detail luôn hiển thị đầy đủ dữ liệu của các dòng đã chọn
            this.loadMultiplePOKHKPIDetail(previouslySelectedIds);
          }, 100);
        } else {
          // Nếu không có ID nào được chọn, xóa detail
          this.dataDetail = [];
          if (this.tb_Detail) {
            this.tb_Detail.replaceData([]);
          }
        }
      });
    }
  }

  loadFilterCustomers(): void {
    this.projectService.getCustomers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
        return;
      }
    );
  }

  loadFilterUserData(): void {
    this.quotationKhDetailService.getUser().subscribe(
      (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải người phụ trách:',
            response.message
          );
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải người phụ trách:', error);
        return;
      }
    );
  }

  loadFilterGroupSales(): void {
    this.viewPokhService.loadGroupSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.groupSales = response.data;
        } else {
          this.notification.error('Lỗi khi tải nhóm:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhóm:', error);
        return;
      }
    );
  }

  loadFilterMainIndexes(): void {
    this.viewPokhService.loadMainIndex().subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainIndexes = response.data;
          console.log('main', this.mainIndexes);
        } else {
          this.notification.error('Lỗi khi tải Lọc:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Lọc:', error);
        return;
      }
    );
  }

  loadPOKHKPIDetail(id: number): void {
    this.POKHService.loadPOKHKPIDetail(id).subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataDetail = response.data;
          this.tb_Detail;
        } else {
          this.notification.error('Lỗi khi tải dự án:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dự án:', error);
        return;
      }
    );
  }
  loadMultiplePOKHKPIDetail(ids: number[]): void {
    if (!ids.length) {
      this.dataDetail = [];
      this.tb_Detail.replaceData(this.dataDetail);
      return;
    }
    const requests = ids.map((id) =>
      this.POKHService.loadPOKHKPIDetail(id).pipe(
        catchError(() => of({ status: 0, data: [] }))
      )
    );
    forkJoin(requests).subscribe((responses) => {
      const allDetails = responses
        .filter((res) => res.status === 1)
        .flatMap((res) => res.data);
      this.dataDetail = allDetails;
      this.tb_Detail.replaceData(this.dataDetail);
    });
  }

  searchPOKH() {
    this.loadPOKH();
  }
  exportExcel() {}
  getPOKHAjaxParams(): any {
    return (params: any) => {
      console.log('Params từ Tabulator:', params);

      return {
        filterText: this.filters.filterText || '',
        customerId: this.filters.customerId || 0,
        userId: this.filters.userId || 0,
        POType: this.filters.mainIndexId || 0,
        status: this.filters.status || 0,
        group: this.filters.groupId || 0,
        warehouseId: this.filters.warehouseId || 1,
        employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
        startDate:
          this.filters.startDate?.toISOString() || new Date().toISOString(),
        endDate:
          this.filters.endDate?.toISOString() || new Date().toISOString(),
      };
    };
  }
  async exportDetailTableToExcel() {
    const selectedRows = this.tb_POKH.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất một dòng để xuất Excel'
      );
      return;
    }

    if (!this.tb_Detail) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất Excel'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('POKH_KPI_List_Detail');

    // Get column definitions from the table
    const columns = this.tb_Detail.getColumns();

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
    const currentPage = Number(this.tb_Detail.getPage());
    const pageSize = Number(this.tb_Detail.getPageSize());
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get all data and slice for current page
    const allData = this.tb_Detail.getData();
    const currentPageData = allData.slice(startIndex, endIndex);

    // Process rows
    currentPageData.forEach((rowData) => {
      const row = columns.map((col) => {
        const field = col.getField();
        const column = col.getDefinition();
        let value = rowData[field];

        if (
          column.formatter === 'money' &&
          value !== null &&
          value !== undefined
        ) {
          const numValue = typeof value === 'number' ? value : Number(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }

        if (field === 'ReceivedDatePO' && value) {
          const dateTime = DateTime.fromISO(value);
          if (dateTime.isValid) {
            // Tạo Date object với UTC time nhưng với date đúng để Excel hiểu đúng
            // Excel xử lý Date object theo UTC, nên cần tạo với UTC time
            const date = new Date(
              Date.UTC(
                dateTime.year,
                dateTime.month - 1,
                dateTime.day,
                12,
                0,
                0
              )
            );
            value = date;
          }
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

    // Auto-fit columns and set format for money and date columns
    worksheet.columns.forEach((column: any, index: number) => {
      column.width = 15;

      // Get column definition from Tabulator
      const colDef = columns[index]?.getDefinition();

      // Apply number format to money columns
      if (colDef?.formatter === 'money') {
        worksheet.getColumn(index + 1).eachCell((cell, rowNumber) => {
          if (rowNumber > 1 && typeof cell.value === 'number') {
            cell.numFmt = '#,##0'; // Format with thousand separator
          }
        });
      }

      // Apply date format to date columns
      if (colDef?.field === 'ReceivedDatePO') {
        worksheet.getColumn(index + 1).eachCell((cell, rowNumber) => {
          if (rowNumber > 1 && cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy'; // Format as dd/MM/yyyy
          }
        });
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POKHKPIDetail_List_Page_${currentPage}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  drawPOKHTable(): void {
    if (!this.tb_POKHElement) {
      console.error('tb_POKH element not found');
      return;
    }
    const token = localStorage.getItem('token');
    this.tb_POKH = new Tabulator(this.tb_POKHElement.nativeElement, {
      layout: 'fitDataFill',
      height: '100%',
      selectableRows: true,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 10000,
      // paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      ajaxURL: this.POKHService.getPOKHAjax(),
      ajaxParams: this.getPOKHAjaxParams(),
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      ajaxResponse: (url, params, res) => {
        console.log('total', res.totalPages[0].TotalPage);
        console.log('data', res.data);
        return {
          data: res.data,
          last_page: res.totalPages[0].TotalPage,
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
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        formatter: 'rowSelection',
        headerHozAlign: 'center',
        hozAlign: 'center',
        titleFormatter: 'rowSelection',
        cellClick: (e, cell) => {
          e.stopPropagation();
        },
      },
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
          title: 'Trạng thái Số',
          field: 'Status',
          sorter: 'string',
          width: 150,
          visible: false,
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          sorter: 'string',
          width: 200,
          formatter: (cell) => {
            const rowData = cell.getRow().getData();
            const status = rowData['Status'];
            const value = cell.getValue() || '';
            let backgroundColor = '';

            switch (status) {
              case 0:
                backgroundColor = 'rgb(255, 255, 0)'; // Vàng
                break;
              case 1:
                backgroundColor = ''; // Không màu
                break;
              case 2:
                backgroundColor = 'rgb(244, 176, 132)'; // Cam nhạt
                break;
              case 3:
                backgroundColor = 'rgb(155, 194, 230)'; // Xanh dương nhạt
                break;
              case 4:
                backgroundColor = 'rgb(169, 208, 142)'; // Xanh lá nhạt
                break;
              case 5:
                backgroundColor = 'rgb(255, 255, 0)'; // Vàng
                break;
              default:
                backgroundColor = '';
                break;
            }

            // Set background color cho cell element
            if (backgroundColor) {
              const cellElement = cell.getElement();
              if (cellElement) {
                (cellElement as HTMLElement).style.backgroundColor =
                  backgroundColor;
              }
            }

            return value;
          },
        },
        { title: 'Loại', field: 'MainIndex', sorter: 'string', width: 70 },
        {
          title: 'New Account',
          field: 'NewAccount',
          sorter: 'boolean',
          width: 100,
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
        {
          title: 'Số POKH',
          field: 'ID',
          sorter: 'number',
          width: 100,
          visible: false,
        },
        { title: 'Mã PO', field: 'POCode', sorter: 'string', width: 150 },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          sorter: 'string',
          width: 300,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        { title: 'Dự án', field: 'ProjectName', sorter: 'string', width: 200 },
        {
          title: 'Ngày nhận PO',
          field: 'ReceivedDatePO',
          sorter: 'date',
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            // Nếu có giá trị thì chuyển đổi ISO sang dạng dd/MM/yyyy
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyCode',
          sorter: 'string',
          width: 80,
        },
        {
          title: 'Tổng tiền Xuất VAT',
          field: 'TotalMoneyKoVAT',
          sorter: 'number',
          width: 150,
          formatter: 'money',
        },
        {
          title: 'Tổng tiền nhận PO',
          field: 'TotalMoneyPO',
          sorter: 'number',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
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
          title: 'Tiền về',
          field: 'ReceiveMoney',
          sorter: 'number',
          width: 150,
          formatter: 'money',
        },
        {
          title: 'Tình trạng tiến độ giao hàng',
          field: 'DeliveryStatusText',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Tình trạng xuất kho',
          field: 'ExportStatusText',
          sorter: 'string',
          width: 150,
        },
        { title: 'End User', field: 'EndUser', sorter: 'string', width: 150 },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 120 },
        {
          title: 'Công nợ',
          field: 'Debt',
          sorter: 'number',
          width: 120,
          formatter: 'money',
        },
        {
          title: 'Hóa đơn',
          field: 'ImportStatus',
          sorter: 'string',
          width: 150,
        },
        { title: 'Đặt hàng', field: 'IsOder', sorter: 'string', width: 100 },
      ],
    });

    // Thêm sự kiện khi chuyển trang
    this.tb_POKH.on('pageLoaded', (pageno: number) => {
      this.filters.pageNumber = pageno;
      console.log('Trang hiện tại:', pageno);
      // Sau khi load trang mới, chọn lại các dòng đã chọn (nếu có)
      if (this.selectedIds.length > 0) {
        setTimeout(() => {
          const allRows = this.tb_POKH.getRows();
          const rowsToSelect = allRows.filter((row: any) => {
            const rowData = row.getData();
            return this.selectedIds.includes(rowData.ID);
          });
          if (rowsToSelect.length > 0) {
            this.tb_POKH.selectRow(rowsToSelect);
          }
          // Luôn load lại detail với tất cả các ID đã chọn
          this.loadMultiplePOKHKPIDetail(this.selectedIds);
        }, 100);
      }
    });

    // Thêm sự kiện khi thay đổi kích thước trang
    this.tb_POKH.on('pageSizeChanged', (size: number) => {
      this.filters.pageSize = size;
      console.log('Kích thước trang:', size);
      // Sau khi thay đổi kích thước trang, chọn lại các dòng đã chọn (nếu có)
      if (this.selectedIds.length > 0) {
        setTimeout(() => {
          const allRows = this.tb_POKH.getRows();
          const rowsToSelect = allRows.filter((row: any) => {
            const rowData = row.getData();
            return this.selectedIds.includes(rowData.ID);
          });
          if (rowsToSelect.length > 0) {
            this.tb_POKH.selectRow(rowsToSelect);
          }
          // Luôn load lại detail với tất cả các ID đã chọn
          this.loadMultiplePOKHKPIDetail(this.selectedIds);
        }, 100);
      }
    });

    // Xử lý khi chọn một dòng
    this.tb_POKH.on('rowSelected', (row: any) => {
      const rowData = row.getData();
      const id = rowData.ID;
      // Thêm ID vào danh sách nếu chưa có
      if (!this.selectedIds.includes(id)) {
        this.selectedIds.push(id);
      }
      // Load lại detail với tất cả các ID đã chọn
      this.loadMultiplePOKHKPIDetail(this.selectedIds);
    });

    // Xử lý khi bỏ chọn một dòng
    this.tb_POKH.on('rowDeselected', (row: any) => {
      const rowData = row.getData();
      const id = rowData.ID;
      // Xóa ID khỏi danh sách khi người dùng tự bỏ chọn
      this.selectedIds = this.selectedIds.filter(
        (selectedId) => selectedId !== id
      );
      // Load lại detail với danh sách ID còn lại
      if (this.selectedIds.length > 0) {
        this.loadMultiplePOKHKPIDetail(this.selectedIds);
      } else {
        this.dataDetail = [];
        if (this.tb_Detail) {
          this.tb_Detail.replaceData([]);
        }
      }
    });

    this.tb_POKH.on('rowSelectionChanged', (data: any[]) => {
      // Cập nhật trạng thái allSelected
      const rows = this.tb_POKH.getRows();
      this.allSelected = data.length === rows.length && rows.length > 0;
    });
  }
  initDetailTable(): void {
    if (!this.tb_DetailElement) {
      console.error('tb_Detail element not found');
      return;
    }
    this.tb_Detail = new Tabulator(this.tb_DetailElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      pagination: true,
      paginationSize: 50,
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
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        {
          title: 'Ngày nhận PO',
          field: 'ReceivedDatePO',
          sorter: 'string',
          width: '25%',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        { title: 'Số POKH', field: 'PONumber', sorter: 'string', width: '25%' },
        {
          title: 'Thành tiền trước VAT',
          field: 'IntoMoney',
          sorter: 'number',
          width: '25%',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
          },
        },
        {
          title: 'Người nhận hàng',
          field: 'UserReceiver',
          sorter: 'string',
          width: '25%',
        },
      ],
    });
  }
}
