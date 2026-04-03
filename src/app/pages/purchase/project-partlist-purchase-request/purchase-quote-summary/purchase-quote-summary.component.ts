import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
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

  showSearchBar: boolean = true;
  shouldShowSearchBar: boolean = true;
  isLoading: boolean = false;

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
    private permissionService: PermissionService
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
    ];
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
    this.shouldShowSearchBar = this.showSearchBar;
    this.loadMenu();
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
      { key: 'DateRequest', header: 'Ngày tổng hợp', isNum: false },
      { key: 'TotalQuoteRequests', header: 'SL yêu cầu báo giá', isNum: true },
      { key: 'CompletedRequests', header: 'SL hoàn thành báo giá', isNum: true },
      { key: 'TotalPurchaseRequests', header: 'Tổng SL báo giá dự án', isNum: true },
      { key: 'TotalProjects', header: 'SL dự án', isNum: true },
      { key: 'TotalCommercialQuoteRequests', header: 'Tổng SL báo giá thương mại', isNum: true },
      { key: 'TotalPurchaseRequestPONCC', header: 'SL đơn hàng', isNum: true },
      { key: 'TotalPaymentRequests', header: 'SL ĐNTT', isNum: true },
      { key: 'TotalRequests', header: 'Tổng SL báo giá', isNum: true },
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
    // if (selectedRows.length != 1) {
    //   this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 nhân viên để xem chi tiết!');
    //   return;
    // }

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

    const modalRef = this.ngbModal.open(PurchaseQuoteProjectDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.dateStart = dateStart;
    modalRef.componentInstance.dateEnd = dateEnd;
    modalRef.componentInstance.employeeId = selectedItem?.EmployeeID ?? 0;

    modalRef.result.finally(() => { });

  }

  onViewCustomerDetail() {

    const selectedRows = this.angularGrid.gridService.getSelectedRows();
    // if (selectedRows.length != 1) {
    //   this.notification.warning('Cảnh báo', 'Vui lòng chọn 1 nhân viên để xem chi tiết!');
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

    const modalRef = this.ngbModal.open(PurchaseQuoteCommerceDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.dateStart = dateStart;
    modalRef.componentInstance.dateEnd = dateEnd;
    modalRef.componentInstance.employeeId = selectedItem?.EmployeeID ?? null;

    modalRef.result.finally(() => { });

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
        width: 200,
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
      {
        id: 'DateRequest',
        name: 'Ngày tổng hợp',
        field: 'DateRequest',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'TotalQuoteRequests',
        name: 'SL yêu cầu báo giá',
        field: 'TotalQuoteRequests',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'CompletedRequests',
        name: 'SL hoàn thành báo giá',
        field: 'CompletedRequests',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalPurchaseRequests',
        name: 'Tổng SL báo giá dự án',
        field: 'TotalPurchaseRequests',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalProjects',
        name: 'SL dự án',
        field: 'TotalProjects',
        cssClass: 'text-end',
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
        name: 'Tổng SL báo giá thương mại',
        field: 'TotalCommercialQuoteRequests',
        cssClass: 'text-end',
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
        cssClass: 'text-end',
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
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
      },
      {
        id: 'TotalRequests',
        name: 'Tổng SL báo giá',
        field: 'TotalRequests',
        cssClass: 'text-end',
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
            acc.TotalQuoteRequests += Number(item.TotalQuoteRequests) || 0;
            acc.CompletedRequests += Number(item.CompletedRequests) || 0;
            acc.TotalPurchaseRequests += Number(item.TotalPurchaseRequests) || 0;
            acc.TotalProjects += Number(item.TotalProjects) || 0;
            acc.TotalCommercialQuoteRequests += Number(item.TotalCommercialQuoteRequests) || 0;
            acc.TotalPurchaseRequestPONCC += Number(item.TotalPurchaseRequestPONCC) || 0;
            acc.TotalPaymentRequests += Number(item.TotalPaymentRequests) || 0;
            acc.TotalRequests += Number(item.TotalRequests) || 0;
            return acc;
          }, {
            TotalQuoteRequests: 0,
            CompletedRequests: 0,
            TotalPurchaseRequests: 0,
            TotalProjects: 0,
            TotalCommercialQuoteRequests: 0,
            TotalPurchaseRequestPONCC: 0,
            TotalPaymentRequests: 0,
            TotalRequests: 0
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
          setNumCell('TotalQuoteRequests', totals.TotalQuoteRequests);
          setNumCell('CompletedRequests', totals.CompletedRequests);
          setNumCell('TotalPurchaseRequests', totals.TotalPurchaseRequests);
          setNumCell('TotalProjects', totals.TotalProjects);
          setNumCell('TotalCommercialQuoteRequests', totals.TotalCommercialQuoteRequests);
          setNumCell('TotalPurchaseRequestPONCC', totals.TotalPurchaseRequestPONCC);
          setNumCell('TotalPaymentRequests', totals.TotalPaymentRequests);
          setNumCell('TotalRequests', totals.TotalRequests);

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
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
        this.dataMaster;

      const rowCount = (items || []).length;

      // Tính tổng các cột
      const totalQuoteRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalQuoteRequests) || 0),
        0
      );
      const completedRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.CompletedRequests) || 0),
        0
      );
      const totalPurchaseRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPurchaseRequests) || 0),
        0
      );
      const totalProjects = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalProjects) || 0),
        0
      );
      const totalCommercialQuoteRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalCommercialQuoteRequests) || 0),
        0
      );
      const totalPurchaseRequestPONCC = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPurchaseRequestPONCC) || 0),
        0
      );
      const totalPaymentRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPaymentRequests) || 0),
        0
      );
      const totalRequests = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalRequests) || 0),
        0
      );

      // Bỏ gọi setFooterRowVisibility(true) để tránh re-render làm mất footer
      // Thay vào đó cập nhật trực tiếp nội dung vào DOM cell
      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        switch (col.id) {
          case 'FullName':
            footerCell.innerHTML = `<b>${rowCount}</b>`;
            break;
          case 'TotalQuoteRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalQuoteRequests)}</b>`;
            break;
          case 'CompletedRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(completedRequests)}</b>`;
            break;
          case 'TotalPurchaseRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalPurchaseRequests)}</b>`;
            break;
          case 'TotalProjects':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalProjects)}</b>`;
            break;
          case 'TotalCommercialQuoteRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalCommercialQuoteRequests)}</b>`;
            break;
          case 'TotalPurchaseRequestPONCC':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalPurchaseRequestPONCC)}</b>`;
            break;
          case 'TotalPaymentRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalPaymentRequests)}</b>`;
            break;
          case 'TotalRequests':
            footerCell.innerHTML = `<b>${this.formatNumberEnUS(totalRequests)}</b>`;
            break;
          default:
            footerCell.innerHTML = '';
        }

        // Căn phải cho các cột số
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
