import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  OnClickEventArgs,
  MultipleSelectOption,
  Aggregators,
  SortComparers,
  GroupTotalFormatters,
} from 'angular-slickgrid';
import * as ExcelJS from 'exceljs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { SortDirectionNumber } from '@slickgrid-universal/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../services/permission.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { DepartmentServiceService } from '../../../hrm/department/department-service/department-service.service';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { PurchaseQuoteProjectDetailComponent } from './purchase-quote-project-detail/purchase-quote-project-detail.component';
import { PurchaseQuoteCommerceDetailComponent } from './purchase-quote-commerce-detail/purchase-quote-commerce-detail.component';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { PonccNewComponent } from '../../poncc-new/poncc-new.component';
import { PaymentOrderComponent } from '../../../general-category/payment-order/payment-order.component';

@Component({
  selector: 'app-purchase-quote-summary',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzModalModule,
    NzDropDownModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './purchase-quote-summary.component.html',
  styleUrl: './purchase-quote-summary.component.css'
})
export class PurchaseQuoteSummaryComponent implements OnInit {

  purchaseQuoteSummaryMenu: MenuItem[] = [];

  isMobile: boolean = window.innerWidth <= 768;
  showSearchBar: boolean = !this.isMobile;
  shouldShowSearchBar: boolean = !this.isMobile;
  isShowModal: boolean = false;
  isLoading: boolean = false;

  @HostListener('window:resize')
  onWindowResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  dateStart: string = '';
  dateEnd: string = '';
  employeeRequestId: any = -1;
  employeeRequests: any = [];
  departmentId: any = 4;
  departments: any = [];
  keyword: any = '';

  gridId: string = '';
  angularGrid!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  dataMaster: any[] = [];
  excelExportService = new ExcelExportService();

  isTBP: boolean = false;

  constructor(
    private modal: NzModalService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private appUserService: AppUserService,
    private ngbModal: NgbModal,
    private projectService: ProjectService,
    private departmentService: DepartmentServiceService,
    private permissionService: PermissionService,
    private tabService: TabServiceService
  ) { }

  ngOnInit(): void {
    this.isTBP = this.permissionService.hasPermission('N33,N1');
    if (!this.isTBP) {
      this.employeeRequestId = this.appUserService.employeeID;
      this.departmentId = this.appUserService.departmentID;
    }

    this.gridId = 'gridPurchaseQuoteSummary-' + this.generateUUIDv4();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    this.dateStart = this.formatDateToInput(firstDayOfMonth);
    this.dateEnd = this.formatDateToInput(today);

    this.loadMenu();
    this.initGrid();
    this.loadLookups();
    this.onSearch();
  }

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadMenu() {
    this.purchaseQuoteSummaryMenu = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        visible: this.permissionService.hasPermission('N1,N33,N35'),
        command: () => {
          this.onExportExcel();
        },
      },
      {
        label: 'Chi tiết báo giá DA',
        icon: 'fa-solid fa-diagram-project text-primary',
        visible: this.permissionService.hasPermission('N1,N33,N35'),
        command: () => {
          this.onViewProjectDetail();
        },
      },
      {
        label: 'Chi tiết báo giá KH',
        icon: 'fa-solid fa-eye text-primary',
        visible: this.permissionService.hasPermission('N1,N33,N35'),
        command: () => {
          this.onViewCustomerDetail();
        },
      },
      {
        label: 'Chi tiết PONCC',
        icon: 'fa-solid fa-house text-primary',
        visible: this.permissionService.hasPermission('N1,N33,N35'),
        command: () => {
          this.onViewPoncc();
        },
      },
      {
        label: 'Chi tiết ĐNTT',
        icon: 'fa-solid fa-coins text-primary',
        visible: this.permissionService.hasPermission('N1,N33,N35'),
        command: () => {
          this.onViewĐNTT();
        },
      },
    ];
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isShowModal = true;
  }

  loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        console.log(response.data);
        this.employeeRequests = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });

    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data.data;
      },
      error: (err) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  onSearch() {
    this.isLoading = true;
    this.isShowModal = false;

    const isoDateStart = this.dateStart ? `${this.dateStart}T00:00:00` : '';
    const isoDateEnd = this.dateEnd ? `${this.dateEnd}T23:59:59` : '';

    this.projectPartlistPurchaseRequestService.getPurchaseQuoteSummary(
      isoDateStart,
      isoDateEnd,
      this.departmentId ?? -1,
      this.employeeRequestId ?? -1,
      this.keyword ?? ''
    ).subscribe({
      next: (response: any) => {
        this.dataMaster = response.data.map((item: any, index: number) => {
          return {
            ...item,
            id: index + 1,
            STT: index + 1
          };
        });
        this.isLoading = false;

        setTimeout(() => {
          this.angularGrid.resizerService.resizeGrid();
          this.angularGrid.dataView.refresh();
          this.angularGrid.slickGrid.render();

          this.applyDistinctFilters();
        }, 200);

        setTimeout(() => {
          this.updateFooterRow();
        }, 500);
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isLoading = false;
      },
    });
  }

  async onExportExcel() {
    const items: any[] =
      (this.angularGrid?.dataView?.getFilteredItems?.() as any[]) ||
      this.dataMaster;

    if (!items || items.length === 0) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TongHopBaoGia');

    // Cột định nghĩa
    const cols = [
      { key: 'STT', header: 'STT', isNum: false },
      { key: 'FullName', header: 'Nhân viên', isNum: false },
      { key: 'DateRequest', header: 'Ngày thực hiện', isNum: false },
      { key: 'TotalPurchaseRequests', header: 'SL yêu cầu báo giá DA', isNum: true },
      { key: 'TotalCompletedRequests', header: 'SL hoàn thành báo giá DA', isNum: true },
      { key: 'TotalCommercialQuoteRequests', header: 'SL yêu cầu báo giá TM', isNum: true },
      { key: 'TotalCommercialQuoteRequestCompleted', header: 'SL hoàn thành báo giá TM', isNum: true },
      { key: 'TotalRequest', header: 'Tổng SL yêu cầu báo giá', isNum: true },
      { key: 'TotalRequestCompleted', header: 'Tổng SL hoàn thành báo giá', isNum: true },
      { key: 'TotalPurchaseRequestPONCC', header: 'SL đơn hàng (poncc)', isNum: true },
      { key: 'TotalPaymentRequests', header: 'SL ĐNTT', isNum: true },
    ];

    // ── Header ──────────────────────────────────────────────
    const headerRow = sheet.addRow(cols.map(c => c.header));
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    headerRow.height = 30;

    // ── Data rows ────────────────────────────────────────────
    const numFmt = '#,##0.00';
    items.forEach((item, i) => {
      const rowData = cols.map(c => {
        if (c.key === 'STT') return i + 1;
        if (c.key === 'DateRequest') {
          const d = item[c.key];
          if (!d) return '';
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? d : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
        }
        return c.isNum ? (Number(item[c.key]) || 0) : (item[c.key] ?? '');
      });
      const row = sheet.addRow(rowData);
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colDef = cols[colNumber - 1];
        if (colDef?.isNum) {
          cell.numFmt = numFmt;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: colDef?.key === 'STT' ? 'center' : 'left', vertical: 'middle' };
        }
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });
    });

    // ── Footer tổng ──────────────────────────────────────────
    const numKeys = cols.filter(c => c.isNum).map(c => c.key);
    const totals: any = {};
    numKeys.forEach(k => {
      totals[k] = items.reduce((s, item) => s + (Number(item[k]) || 0), 0);
    });

    const footerData = cols.map(c => {
      if (c.key === 'STT') return '';
      if (c.key === 'FullName') return items.length;
      if (c.isNum) return totals[c.key];
      return '';
    });
    const footerRow = sheet.addRow(footerData);
    footerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colDef = cols[colNumber - 1];
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      if (colDef?.isNum || colDef?.key === 'FullName') {
        cell.numFmt = numFmt;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    // ── Auto-fit column width ────────────────────────────────
    sheet.columns.forEach((column, colIdx) => {
      const colDef = cols[colIdx];
      let maxLen = colDef ? colDef.header.length : 10;
      items.forEach(item => {
        let val = item[colDef?.key ?? ''];
        if (colDef?.isNum) val = (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const len = String(val ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      column.width = Math.max(12, Math.min(60, maxLen + 4));
    });

    // ── Xuất file ────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TongHopBaoGia_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.notification.success('Thành công', 'Xuất Excel thành công!');
  }

  onViewProjectDetail() {

    const selectedRows = this.angularGrid.gridService.getSelectedRows();
    if (selectedRows.length != 1 && !this.isTBP) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 dòng để xem chi tiết!');
      return;
    }

    const selectedItem = this.angularGrid.gridService.getDataItemByRowIndex(selectedRows[0]);

    const rawDate = selectedItem?.DateRequest;
    const _today = new Date();

    let dateStart: string;
    let dateEnd: string;

    if (rawDate) {
      const d = new Date(rawDate);
      dateStart = this.formatDateToInput(d);
      dateEnd = this.formatDateToInput(d);
    } else {
      const firstDayPrevMonth = new Date(_today.getFullYear(), _today.getMonth() - 1, 1);
      const lastDayCurrMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0);
      dateStart = this.formatDateToInput(firstDayPrevMonth);
      dateEnd = this.formatDateToInput(lastDayCurrMonth);
    }

    const fixedKey = 'purchase-quote-project-detail';

    // Đóng tab cũ nếu đang mở để reset lại component với param mới
    this.tabService.closeTabByKey(fixedKey);

    setTimeout(() => {
      this.tabService.openTabComp({
        comp: PurchaseQuoteProjectDetailComponent,
        title: 'Chi tiết báo giá DA',
        key: fixedKey,
        data: {
          dateStart: dateStart,
          dateEnd: dateEnd,
          employeeId: selectedItem?.EmployeeID ?? 0
        }
      });
    }, 50);

  }

  onViewCustomerDetail() {

    const selectedRows = this.angularGrid.gridService.getSelectedRows();
    // if (selectedRows.length != 1 && !this.isTBP) {
    //   this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 dòng để xem chi tiết!');
    //   return;
    // }

    const selectedItem = this.angularGrid.gridService.getDataItemByRowIndex(selectedRows[0]);

    const rawDate = selectedItem?.DateRequest;
    const _today = new Date();

    let dateStart: string;
    let dateEnd: string;

    if (rawDate) {
      // Có ngày chọn → dùng đúng ngày đó cho cả start và end
      const d = new Date(rawDate);
      dateStart = this.formatDateToInput(d);
      dateEnd = this.formatDateToInput(d);
    } else {
      // Không có → mặc định: đầu tháng trước → cuối tháng hiện tại
      const firstDayPrevMonth = new Date(_today.getFullYear(), _today.getMonth() - 1, 1);
      const lastDayCurrMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0);
      dateStart = this.formatDateToInput(firstDayPrevMonth);
      dateEnd = this.formatDateToInput(lastDayCurrMonth);
    }

    const fixedKey = 'purchase-quote-commerce-detail';

    this.tabService.closeTabByKey(fixedKey);

    setTimeout(() => {
      this.tabService.openTabComp({
        comp: PurchaseQuoteCommerceDetailComponent,
        title: 'Chi tiết báo giá KH',
        key: fixedKey,
        data: {
          dateStart: dateStart,
          dateEnd: dateEnd,
          employeeId: selectedItem?.EmployeeID ?? null
        }
      });
    }, 50);

  }

  onViewPoncc() {

    const selectedRows = this.angularGrid.gridService.getSelectedRows();
    // if (selectedRows.length != 1 && !this.isTBP) {
    //   this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 dòng để xem chi tiết!');
    //   return;
    // }

    const selectedItem = this.angularGrid.gridService.getDataItemByRowIndex(selectedRows[0]);

    const rawDate = selectedItem?.DateRequest;
    const _today = new Date();

    let dateStart: string;
    let dateEnd: string;

    if (rawDate) {
      // Có ngày chọn → dùng đúng ngày đó cho cả start và end
      const d = new Date(rawDate);
      dateStart = this.formatDateToInput(d);
      dateEnd = this.formatDateToInput(d);
    } else {
      // Không có → mặc định: đầu tháng trước → cuối tháng hiện tại
      const firstDayPrevMonth = new Date(_today.getFullYear(), _today.getMonth() - 1, 1);
      const lastDayCurrMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0);
      dateStart = this.formatDateToInput(firstDayPrevMonth);
      dateEnd = this.formatDateToInput(lastDayCurrMonth);
    }

    const fixedKey = 'poncc-new';

    this.tabService.closeTabByKey(fixedKey);

    setTimeout(() => {
      this.tabService.openTabComp({
        comp: PonccNewComponent,
        title: 'Chi tiết PO NCC',
        key: fixedKey,
        data: {
          dateStart: dateStart,
          dateEnd: dateEnd,
          employeeId: selectedItem?.EmployeeID ?? null,
          isPriceRequest: true
        }
      });
    }, 50);

  }

  onViewĐNTT() {

    const selectedRows = this.angularGrid.gridService.getSelectedRows();
    // if (selectedRows.length != 1 && !this.isTBP) {
    //   this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 dòng để xem chi tiết!');
    //   return;
    // }

    const selectedItem = this.angularGrid.gridService.getDataItemByRowIndex(selectedRows[0]);

    const rawDate = selectedItem?.DateRequest;
    const _today = new Date();

    let dateStart: string;
    let dateEnd: string;

    if (rawDate) {
      // Có ngày chọn → dùng đúng ngày đó cho cả start và end
      const d = new Date(rawDate);
      dateStart = this.formatDateToInput(d);
      dateEnd = this.formatDateToInput(d);
    } else {
      // Không có → mặc định: đầu tháng trước → cuối tháng hiện tại
      const firstDayPrevMonth = new Date(_today.getFullYear(), _today.getMonth() - 1, 1);
      const lastDayCurrMonth = new Date(_today.getFullYear(), _today.getMonth() + 1, 0);
      dateStart = this.formatDateToInput(firstDayPrevMonth);
      dateEnd = this.formatDateToInput(lastDayCurrMonth);
    }

    const fixedKey = 'payment-order-new';

    this.tabService.closeTabByKey(fixedKey);

    setTimeout(() => {
      this.tabService.openTabComp({
        comp: PaymentOrderComponent,
        title: 'Chi tiết ĐNTT',
        key: fixedKey,
        data: {
          dateStart: dateStart,
          dateEnd: dateEnd,
          employeeId: selectedItem?.EmployeeID ?? null,
          isPriceRequest: true,
          departmentID: this.departmentId,
        }
      });
    }, 50);

  }

  //#region Xử lý bảng
  gridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    setTimeout(() => {
      this.updateFooterRow();
      this.applyDistinctFilters();
      angularGrid.resizerService.resizeGrid();
      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();

      this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateFooterRow();
      });
      this.angularGrid.dataView.onRowsChanged.subscribe(() => {
        this.updateFooterRow();
      });
    }, 100);
  }

  initGrid() {
    this.columnDefinitionsMaster = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        maxWidth: 80,
        cssClass: 'text-center',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'FullName',
        name: 'Nhân viên',
        field: 'FullName',
        minWidth: 160,
        maxWidth: 160,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      // {
      //   id: 'DateRequest',
      //   name: 'Ngày thực hiện',
      //   field: 'DateRequest',
      //   cssClass: 'text-center',
      //   width: 120,
      //   sortable: true,
      //   filterable: true,
      //   formatter: Formatters.date,
      //   exportCustomFormatter: Formatters.date,
      //   type: 'date',
      //   params: { dateFormat: 'DD/MM/YYYY' },
      //   filter: { model: Filters['compoundDate'] },
      // },
      {
        id: 'DateRequest',
        name: 'Ngày thực hiện',
        field: 'DateRequest',
        //cssClass: 'text-center',
        minWidth: 180,
        maxWidth: 180,
        sortable: true,
        filterable: true,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },

        formatter: (row, cell, value, columnDef, dataContext, grid) => {
          // gọi formatter gốc với đủ 6 tham số
          let dateFormatted = Formatters.date(row, cell, value, columnDef, dataContext, grid);

          if (dataContext.IsHoliday === 1) {
            return `${dateFormatted} <span style="color:red">(Ngày nghỉ)</span>`;
          }

          return dateFormatted;
        },

        exportCustomFormatter: (row, cell, value, columnDef, dataContext, grid) => {
          let dateFormatted = Formatters.date(row, cell, value, columnDef, dataContext, grid);

          if (dataContext.IsHoliday === 1) {
            return `${dateFormatted} (Ngày nghỉ)`;
          }

          return dateFormatted;
        }
      },
      {
        id: 'TotalPurchaseRequests',
        name: 'SL yêu cầu báo giá DA',
        field: 'TotalPurchaseRequests',
        cssClass: 'text-end',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalCompletedRequests',
        name: 'SL hoàn thành báo giá DA',
        field: 'TotalCompletedRequests',
        cssClass: 'text-end',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalCommercialQuoteRequests',
        name: 'SL yêu cầu báo giá TM',
        field: 'TotalCommercialQuoteRequests',
        cssClass: 'text-end',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalCommercialQuoteRequestCompleted',
        name: 'SL hoàn thành báo giá TM',
        field: 'TotalCommercialQuoteRequestCompleted',
        cssClass: 'text-end',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalRequest',
        name: 'Tổng SL yêu cầu báo giá',
        field: 'TotalRequest',
        cssClass: 'text-end',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalRequestCompleted',
        name: 'Tổng SL hoàn thành báo giá',
        field: 'TotalRequestCompleted',
        cssClass: 'text-end bg-success-subtle',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalPurchaseRequestPONCC',
        name: 'SL đơn hàng (poncc)',
        field: 'TotalPurchaseRequestPONCC',
        cssClass: 'text-end bg-info-subtle',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalPaymentRequests',
        name: 'SL ĐNTT',
        field: 'TotalPaymentRequests',
        cssClass: 'text-end bg-warning-subtle',
        minWidth: 80,
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
    ];

    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.purchase-quote-summary',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      multiSelect: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      forceFitColumns: true,
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableGrouping: true,
      enableExcelExport: true,
      externalResources: [this.excelExportService],
      excelExportOptions: ({
        sanitizeDataExport: true,
        exportWithFormatter: true,
        filename: 'TongHopBaoGia',
        columnHeaderStyle: {
          font: { bold: true, color: 'FF000000' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFE0FFFF' }, // Màu xanh nhạt
        },
        customExcelFooter: (workbook: any, sheet: any) => {
          const items = (this.angularGrid?.dataView?.getFilteredItems?.() as any[]) || this.dataMaster;
          if (!items || items.length === 0) return;

          // --- 1. Tạo Row Tổng ---
          const rowCount = items.length;
          const totals = items.reduce((acc: any, item: any) => {
            acc.TotalPurchaseRequests += Number(item.TotalPurchaseRequests) || 0;
            acc.TotalCompletedRequests += Number(item.TotalCompletedRequests) || 0;
            acc.TotalCommercialQuoteRequests += Number(item.TotalCommercialQuoteRequests) || 0;
            acc.TotalCommercialQuoteRequestCompleted += Number(item.TotalCommercialQuoteRequestCompleted) || 0;
            acc.TotalRequest += Number(item.TotalRequest) || 0;
            acc.TotalRequestCompleted += Number(item.TotalRequestCompleted) || 0;
            acc.TotalPurchaseRequestPONCC += Number(item.TotalPurchaseRequestPONCC) || 0;
            acc.TotalPaymentRequests += Number(item.TotalPaymentRequests) || 0;
            return acc;
          }, {
            TotalPurchaseRequests: 0,
            TotalCompletedRequests: 0,
            TotalCommercialQuoteRequests: 0,
            TotalCommercialQuoteRequestCompleted: 0,
            TotalRequest: 0,
            TotalRequestCompleted: 0,
            TotalPurchaseRequestPONCC: 0,
            TotalPaymentRequests: 0,
          });

          const footerFormatStr = workbook.getStyleSheet().createFormat({
            font: { bold: true, color: 'FF000000' },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFD9E1F2' },
          });

          const footerFormatNum = workbook.getStyleSheet().createFormat({
            font: { bold: true, color: 'FF000000' },
            alignment: { horizontal: 'right', vertical: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFD9E1F2' },
            format: '#,##0.00'
          });

          const colIndexById = new Map<string, number>();
          (this.columnDefinitionsMaster || []).forEach((c: any, idx: number) => {
            if (c?.id) colIndexById.set(String(c.id), idx);
          });

          const footerRow: any[] = new Array((this.columnDefinitionsMaster || []).length).fill(undefined);

          const setStrCell = (colId: string, value: any) => {
            const idx = colIndexById.get(colId);
            if (idx === undefined) return;
            footerRow[idx] = { value, metadata: { style: footerFormatStr.id } };
          };

          const setNumCell = (colId: string, value: any) => {
            const idx = colIndexById.get(colId);
            if (idx === undefined) return;
            footerRow[idx] = { value, metadata: { style: footerFormatNum.id } };
          };

          setStrCell('STT', 'Tổng cộng');
          setNumCell('FullName', rowCount);
          setNumCell('TotalPurchaseRequests', totals.TotalPurchaseRequests);
          setNumCell('TotalCompletedRequests', totals.TotalCompletedRequests);
          setNumCell('TotalCommercialQuoteRequests', totals.TotalCommercialQuoteRequests);
          setNumCell('TotalCommercialQuoteRequestCompleted', totals.TotalCommercialQuoteRequestCompleted);
          setNumCell('TotalRequest', totals.TotalRequest);
          setNumCell('TotalRequestCompleted', totals.TotalRequestCompleted);
          setNumCell('TotalPurchaseRequestPONCC', totals.TotalPurchaseRequestPONCC);
          setNumCell('TotalPaymentRequests', totals.TotalPaymentRequests);

          sheet.data.push(footerRow);

          // --- 2. Tự động căn chỉnh độ rộng cột theo nội dung ---
          const getLetter = (index: number) => {
            let letter = '';
            while (index >= 0) {
              letter = String.fromCharCode((index % 26) + 65) + letter;
              index = Math.floor(index / 26) - 1;
            }
            return letter;
          };

          (this.columnDefinitionsMaster || []).forEach((col, idx) => {
            let maxLen = String(col.name || '').length;

            items.forEach((item: any) => {
              let v = item[col.field || ''];
              if (v !== undefined && v !== null) {
                // Formatting length simulation
                if (typeof v === 'number' && v > 999) {
                  v = v.toLocaleString('en-US');
                } else if (col.type === 'date' && v) {
                  v = '10/10/2026'; // approx length of date
                }
                const strLen = String(v).length;
                if (strLen > maxLen) maxLen = strLen;
              }
            });

            // Consider the footer content sizes as well
            if (col.id === 'FullName' && String(rowCount).length > maxLen) maxLen = String(rowCount).length;
            if (col.id === 'TotalRequests' && String(totals.TotalRequests).length > maxLen) maxLen = String(totals.TotalRequests).length;

            // Constrain and add padding
            maxLen = Math.max(10, Math.min(60, maxLen + 3));

            const letter = getLetter(idx);
            sheet.setColumnInstructions(letter, { width: maxLen });
          });
        }
      } as any),
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      enableContextMenu: true,
      contextMenu: {
        hideCloseButton: false,
        commandItems: [
          {
            command: 'view-project-detail',
            title: 'Chi tiết báo giá DA',
            iconCssClass: 'fa-solid fa-diagram-project text-primary',
            positionOrder: 1,
            itemVisibilityOverride: () => this.permissionService.hasPermission('N1,N33,N35'),
            action: (e, args) => {
              this.angularGrid.gridService.setSelectedRows([args.row as number]);
              this.onViewProjectDetail();
            }
          },
          {
            command: 'view-customer-detail',
            title: 'Chi tiết báo giá KH',
            iconCssClass: 'fa-solid fa-eye text-primary',
            positionOrder: 2,
            itemVisibilityOverride: () => this.permissionService.hasPermission('N1,N33,N35'),
            action: (e, args) => {
              this.angularGrid.gridService.setSelectedRows([args.row as number]);
              this.onViewCustomerDetail();
            }
          },
          {
            command: 'view-poncc',
            title: 'Chi tiết PONCC',
            iconCssClass: 'fa-solid fa-house text-primary',
            positionOrder: 3,
            itemVisibilityOverride: () => this.permissionService.hasPermission('N1,N33,N35'),
            action: (e, args) => {
              this.angularGrid.gridService.setSelectedRows([args.row as number]);
              this.onViewPoncc();
            }
          }
        ]
      }
    };
  }

  private applyDistinctFilters(): void {
    // Helper function to get unique values for a field
    const getUniqueValues = (
      data: any[],
      field: string
    ): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      data.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // Helper to update a single grid - giống project-slick-grid2
    const updateGrid = (
      angularGrid: AngularGridInstance | undefined,
      columnDefs: Column[]
    ): void => {
      if (!angularGrid?.slickGrid || !angularGrid.dataView) return;
      // Lấy toàn bộ data (không phải chỉ filtered view) - giống project-slick-grid2
      const data = angularGrid.dataView.getItems() as any[];
      if (!data || data.length === 0) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      // Update runtime columns
      columns.forEach((column: any) => {
        if (column?.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(data, field);
        }
      });

      // Update column definitions
      columnDefs.forEach((colDef: any) => {
        if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = getUniqueValues(data, field);
        }
      });

      angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
    };

    updateGrid(this.angularGrid, this.columnDefinitionsMaster);
  }

  updateFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const items =
        (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
        this.dataMaster;

      const rowCount = (items || []).length;

      const sum = (field: string) =>
        (items || []).reduce((s, item) => s + (Number(item[field]) || 0), 0);

      const totals = {
        TotalPurchaseRequests: sum('TotalPurchaseRequests'),
        TotalCompletedRequests: sum('TotalCompletedRequests'),
        TotalCommercialQuoteRequests: sum('TotalCommercialQuoteRequests'),
        TotalCommercialQuoteRequestCompleted: sum('TotalCommercialQuoteRequestCompleted'),
        TotalRequest: sum('TotalRequest'),
        TotalRequestCompleted: sum('TotalRequestCompleted'),
        TotalPurchaseRequestPONCC: sum('TotalPurchaseRequestPONCC'),
        TotalPaymentRequests: sum('TotalPaymentRequests'),
      };

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
        if (!footerCell) return;

        switch (col.id) {
          case 'FullName':
            footerCell.innerHTML = `<b>${rowCount}</b>`;
            break;
          case 'TotalPurchaseRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalPurchaseRequests)}</b>`;
            break;
          case 'TotalCompletedRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalCompletedRequests)}</b>`;
            break;
          case 'TotalCommercialQuoteRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalCommercialQuoteRequests)}</b>`;
            break;
          case 'TotalCommercialQuoteRequestCompleted':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalCommercialQuoteRequestCompleted)}</b>`;
            break;
          case 'TotalRequest':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalRequest)}</b>`;
            break;
          case 'TotalRequestCompleted':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalRequestCompleted)}</b>`;
            break;
          case 'TotalPurchaseRequestPONCC':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalPurchaseRequestPONCC)}</b>`;
            break;
          case 'TotalPaymentRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totals.TotalPaymentRequests)}</b>`;
            break;
          default:
            footerCell.innerHTML = '';
        }

        if (col.id !== 'FullName' && col.id !== 'STT' && col.id !== 'DateRequest') {
          footerCell.style.textAlign = 'right';
          footerCell.style.paddingRight = '5px';
        }
      });
    }
  }

  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  //#endregion

}
