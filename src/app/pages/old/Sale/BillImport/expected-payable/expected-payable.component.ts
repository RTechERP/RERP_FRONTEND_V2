import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// ng-bootstrap
import {
  NgbModal,
  NgbActiveModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Config
import { NOTIFICATION_TITLE } from '../../../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../services/permission.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ExpectedPayableService } from './expected-payable.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { SupplierSaleService } from '../../../../purchase/supplier-sale/supplier-sale.service';
import { ExpectedPayableDetailComponent } from './expected-payable-detail/expected-payable-detail.component';
import { ExpectedPayableLogActivityComponent } from './expected-payable-log-activity/expected-payable-log-activity.component';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';


@Component({
  selector: 'app-expected-payable',
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSplitterModule,
    NzTableModule,
    NzTreeSelectModule,
    NzDropDownModule,
    NgbModalModule,
    Menubar,
  ],
  templateUrl: './expected-payable.component.html',
  styleUrl: './expected-payable.component.css'
})
export class ExpectedPayableComponent implements OnInit, AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  tooltipEl: HTMLDivElement | null = null;

  //#region Khai báo biến
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private expectedPayableService: ExpectedPayableService,
    private projectService: ProjectService,
    private supplierSaleService: SupplierSaleService,
  ) { }

  private modalRef: any;
  expectedPayableMenus: MenuItem[] = [];
  productGroups: any[] = [];
  productGroupId: number = 0;
  keyWords: string = '';

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  excelExportService = new ExcelExportService();

  dataset: any[] = [];
  dirtyRows: Map<number, any> = new Map(); // key = ExpectedPayableID
  isSaving: boolean = false;

  isLoading: boolean = false;

  suppliers: any[] = [];
  employees: any[] = [];
  isTBP: boolean = false;
  dateStart: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  dateEnd: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  supplierId: any = -1;
  employeeId: any = -1;
  //#endregion

  //#region Hàm khởi tạo
  onDateChange(field: 'dateStart' | 'dateEnd', value: string): void {
    if (value) {
      (this as any)[field] = new Date(value);
    }
  }

  private toLocalISOString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
  }

  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  ngOnInit(): void {
    this.isTBP = this.permissionService.hasPermission('N33');
    if (!this.isTBP) {
      this.employeeId = this.appUserService.employeeID;
    }
    this.loadMenu();
    this.initAngularGrid();
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.onSearch();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }

  loadMenu() {
    this.expectedPayableMenus = [
      {
        label: 'Thêm',
        icon: 'fa fa-plus text-success',
        visible: this.permissionService.hasPermission('N35'),
        command: () => {
          this.onAdd();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa fa-pencil text-primary',
        visible: this.permissionService.hasPermission('N35'),
        command: () => {
          this.onEdit();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        visible: this.permissionService.hasPermission('N35'),
        command: () => {
          this.onDelete();
        },
      },
      {
        label: 'Lưu dữ liệu',
        icon: 'fa fa-save text-warning',
        visible: this.permissionService.hasPermission('N35'),
        command: () => {
          this.onSaveSummary();
        },
      },
      {
        label: 'Lịch sử thao tác',
        icon: 'fa fa-history text-success',
        visible: this.permissionService.hasPermission('N35'),
        command: () => {
          this.onHistoryActivity();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa fa-download text-success',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.onExcel();
        },
      },
    ];
  }
  //#endregion

  //#region Load dữ liệu
  loadLookups() {
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => {
        this.suppliers = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + (error.message || error)
        );
      },
    });

    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + (error.message || error)
        );
      },
    });


  }

  onSearch() {
    this.isLoading = true;
    this.expectedPayableService
      .getExpectedPayables(
        DateTime.fromJSDate(this.dateStart).startOf('day'),
        DateTime.fromJSDate(this.dateEnd).endOf('day'),
        this.supplierId || -1,
        this.employeeId || -1,
        this.keyWords || ''
      )
      .subscribe({
        next: (response: any) => {
          this.dataset = (response.data || []).map((x: any, i: number) => ({
            ...x,
            id: i,
          }));
          this.dirtyRows.clear();
          this.isLoading = false;
          setTimeout(() => {
            this.applyDistinctFilters();
            this.updateMasterFooterRow();
            // this.groupByNameNCC();
          }, 500);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu: ' + (error.message || error)
          );
        },
      });
  }
  //#endregion

  //#region Group
  groupByNameNCC(): void {
    if (!this.angularGrid?.dataView) return;
    this.angularGrid.dataView.setGrouping([
      {
        getter: 'NameNCC',
        formatter: (g: any) =>
          `<b>${g.value || '(Không có tên)'}</b>`,
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
      },
    ]);
  }

  clearGrouping(): void {
    if (!this.angularGrid?.dataView) return;
    this.angularGrid.dataView.setGrouping([]);
  }

  /** Trả về true nếu dataContext là group row (không phải data row thực) */
  private isGroupRow(item: any): boolean {
    return item && item.__group === true;
  }
  //#endregion

  //#region Xử lý bảng
  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const items =
        (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
        this.dataset;

      const codeCount = (items || []).filter((item: any) => item.CodeNCC).length;

      const numericCols = ['UnitPrice', 'Amount', 'AmountVnd', 'DomesticPayable', 'ForeignPayable', 'ArisingAmount', 'OfficeExpense', 'TaxAmount'];
      const sums: Record<string, number> = {};
      numericCols.forEach(f => {
        sums[f] = (items || []).reduce((acc: number, item: any) => acc + (Number(item[f]) || 0), 0);
      });

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
        if (!footerCell) return;

        if (col.id === 'CodeNCC') {
          footerCell.innerHTML = `<b>${codeCount}</b>`;
        } else if (numericCols.includes(col.id)) {
          footerCell.innerHTML = `<b>${this.formatNumberEnUS(sums[col.id])}</b>`;
        } else {
          footerCell.innerHTML = '';
        }
      });
    }
  }

  applyDistinctFilters(): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];
    if (!data || data.length === 0) return;

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }

  wrapTextFormatter: Formatter = (_row, _cell, value, _column, dataContext) => {
    if (!value) return '';
    return `
            <span
                title="${String(value).replace(/"/g, '&quot;')}"
                style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.3;"
            >
                ${value}
            </span>
        `;
  };

  exportDefaultFormatter: Formatter = (_row, _cell, value) => value ?? '';

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    // Track thay đổi cell
    angularGrid.slickGrid.onCellChange.subscribe((_e: any, args: any) => {
      this.onCellChanged(args);
    });

    // Click vào cell thường → select dòng đó; click checkbox hoặc cột editable → giữ nguyên multi-select
    angularGrid.slickGrid.onClick.subscribe((_e: any, args: any) => {
      const cols = angularGrid.slickGrid.getColumns();
      const colId = String(cols[args.cell]?.id ?? '');
      if (colId === '_checkbox_selector') return;
      if (this.SUMMARY_FIELDS.includes(colId)) return; // giữ multi-select khi click cột sửa
      angularGrid.slickGrid.setSelectedRows([args.row]);
    });

    // Double click → mở form sửa
    angularGrid.slickGrid.onDblClick.subscribe((_e: any, args: any) => {
      const cols = angularGrid.slickGrid.getColumns();
      const colId = cols[args.cell]?.id;
      if (colId === '_checkbox_selector') return;
      angularGrid.slickGrid.setSelectedRows([args.row]);
      this.onEdit();
    });

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
      this.initDetailGridTooltip();
    }, 100);
  }

  readonly SUMMARY_FIELDS = ['DomesticPayable', 'ForeignPayable', 'ArisingAmount', 'OfficeExpense', 'TaxAmount'];

  onCellChanged(args: any): void {
    const cols = this.angularGrid.slickGrid.getColumns();
    const colId = String(cols[args.cell]?.id ?? '');
    if (!this.SUMMARY_FIELDS.includes(colId)) return;

    const changedItem = this.angularGrid.dataView.getItemById(args.item.id);
    if (!changedItem) return;

    // Apply thay đổi cho tất cả dòng được chọn
    const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
    if (selectedRows.length > 1) {
      for (const rowIdx of selectedRows) {
        const rowItem = this.angularGrid.dataView.getItemByIdx(rowIdx);
        if (!rowItem || rowItem.id === changedItem.id) continue;
        rowItem[colId] = changedItem[colId];
        this.angularGrid.dataView.updateItem(rowItem.id, rowItem);
        this.dirtyRows.set(rowItem.ExpectedPayableID, rowItem);
      }
    }

    this.dirtyRows.set(changedItem.ExpectedPayableID, changedItem);
    this.updateMasterFooterRow();
  }

  initAngularGrid() {
    this.columnDefinitions = [
      {
        id: 'CodeNCC',
        field: 'CodeNCC',
        name: 'Mã NCC',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'NameNCC',
        field: 'NameNCC',
        name: 'Tên NCC',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'DeliverName',
        field: 'DeliverName',
        name: 'Người giao',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'Debt',
        field: 'Debt',
        name: 'Công nợ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'POCode',
        field: 'POCode',
        name: 'Số PO',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'BillCode',
        field: 'BillCode',
        name: 'Đơn mua hàng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'SomeBill',
        field: 'SomeBill',
        name: 'Số hóa đơn',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'DateSomeBill',
        field: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        minWidth: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'DueDate',
        field: 'DueDate',
        name: 'Ngày tới hạn',
        minWidth: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'UnitPrice',
        name: 'Số tiền',
        field: 'UnitPrice',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'CurrencyCode',
        field: 'CurrencyCode',
        name: 'Loại tiền',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'PaymentPercentage',
        name: '% Thanh toán',
        field: 'PaymentPercentage',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any) =>
          value != null ? `${value}%` : '',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'Amount',
        name: 'Tổng tiền thanh toán',
        field: 'Amount',
        width: 180,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'AmountVnd',
        name: 'Thành tiền VNĐ',
        field: 'AmountVnd',
        width: 180,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'DomesticPayable',
        name: 'Dự trù NCC trong nước',
        field: 'DomesticPayable',
        width: 150,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        editor: { model: Editors['float'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ForeignPayable',
        name: 'Dự trù NCC nước ngoài',
        field: 'ForeignPayable',
        width: 150,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        editor: { model: Editors['float'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ArisingAmount',
        name: 'Tiền hàng phát sinh',
        field: 'ArisingAmount',
        width: 150,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        editor: { model: Editors['float'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'OfficeExpense',
        name: 'Chi phí văn phòng',
        field: 'OfficeExpense',
        width: 150,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        editor: { model: Editors['float'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TaxAmount',
        name: 'Thuế',
        field: 'TaxAmount',
        width: 150,
        sortable: false,
        filterable: true,
        cssClass: 'text-end',
        editor: { model: Editors['float'] },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'BillImportCode',
        field: 'BillImportCode',
        name: 'Phiếu nhập',
        width: 180,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.formatTextWithTooltip,
        exportCustomFormatter: this.exportDefaultFormatter,
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.expected-payable-grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableCheckboxSelector: true,
      multiColumnSort: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableGrouping: true,
      rowHeight: 60,
      showFooterRow: true,
      createFooterRow: true,
      footerRowHeight: 28,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      frozenColumn: 3,
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },
      externalResources: [this.excelExportService],
    };
  }
  //#endregion

  //#region Hàm thêm sửa xóa
  onAdd() {
    const modalRef = this.modalService.open(ExpectedPayableDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
    });

    modalRef.result.then((result) => {
      if (result) {
        this.onSearch();
      }
    }, () => { });
  }

  onEdit() {
    const selectedRows = this.angularGrid?.slickGrid.getSelectedRows();
    const dataRows = (selectedRows || []).filter((idx: number) => !this.isGroupRow(this.angularGrid.slickGrid.getDataItem(idx)));
    if (dataRows.length != 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để sửa!');
      return;
    }

    const selectedRow = this.angularGrid.slickGrid.getDataItem(dataRows[0]);

    if (selectedRow.DeliverID != this.appUserService.employeeID && !this.appUserService.isAdmin && !this.isTBP) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ người giao mới được sửa!');
      return;
    }

    let data = {
      ID: selectedRow.ExpectedPayableID,
      SupplierID: selectedRow.SupplierSaleID,
      DeliverID: selectedRow.DeliverID,
      BillImportID: selectedRow.BillImportID,
      InvoiceNumber: selectedRow.SomeBill,
      InvoiceDate: selectedRow.DateSomeBill,
      DueDate: selectedRow.DueDate,
      UnitPrice: selectedRow.UnitPrice,
      CurrencyID: selectedRow.CurrencyID,
      DomesticPayable: selectedRow.DomesticPayable,
      ForeignPayable: selectedRow.ForeignPayable,
      ArisingAmount: selectedRow.ArisingAmount,
      OfficeExpense: selectedRow.OfficeExpense,
      TaxAmount: selectedRow.TaxAmount,
      Note: selectedRow.Note,
      PONCCID: selectedRow.PONCCID,
    }

    const modalRef = this.modalService.open(ExpectedPayableDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
    });

    modalRef.componentInstance.data = data;

    modalRef.result.then((result) => {
      if (result) {
        this.onSearch();
      }
    }, () => { });
  }

  onDelete() {
    const selectedRows = this.angularGrid?.slickGrid.getSelectedRows();
    const dataRows = (selectedRows || []).filter((idx: number) => !this.isGroupRow(this.angularGrid.slickGrid.getDataItem(idx)));
    if (!dataRows || dataRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 dòng để xóa!');
      return;
    }

    const payload: any[] = [];
    for (const idx of dataRows) {
      const row = this.angularGrid.slickGrid.getDataItem(idx);
      if (!row) continue;
      if ((row.DeliverID === this.appUserService.employeeID || this.appUserService.isAdmin) && row.BillImportDetailID == 0) {
        payload.push({ ID: row.ExpectedPayableID, IsDeleted: true });
      }
    }

    if (payload.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dòng nào phù hợp để xóa! Chỉ có thể xóa khi là người giao và không có phiếu nhập tương ứng.');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${payload.length} dòng đã chọn?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.expectedPayableService.deleteExpectedPayable(payload).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công!');
            this.onSearch();
          },
          error: (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa: ' + (error.message || error));
          }
        });
      }
    });
  }

  onHistoryActivity() {
    const selectedRows = this.angularGrid?.slickGrid.getSelectedRows();
    const dataRows = (selectedRows || []).filter((idx: number) => !this.isGroupRow(this.angularGrid.slickGrid.getDataItem(idx)));
    if (dataRows.length != 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để xem!');
      return;
    }

    const selectedRow = this.angularGrid.slickGrid.getDataItem(dataRows[0]);

    this.modalRef = this.modalService.open(ExpectedPayableLogActivityComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
    });

    this.modalRef.componentInstance.expectedPayableId = selectedRow.ExpectedPayableID;
    this.modalRef.componentInstance.expectedPayableCode = selectedRow.SomeBill;
  }

  private formatTextWithTooltip(
    _row: number,
    _cell: number,
    value: any
  ): string {
    if (!value) return '';
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="cell-multiline" data-tooltip="${escaped}">${escaped}</div>`;
  }

  private initDetailGridTooltip(): void {
    const gridContainer = this.elementRef.nativeElement.querySelector(
      '.expected-payable-grid-container'
    );
    if (!gridContainer) return;

    const tooltip = document.createElement('div');
    tooltip.style.cssText = [
      'display:none', 'position:fixed', 'z-index:99999',
      'background:#fff', 'border:1px solid #d9d9d9', 'border-radius:6px',
      'padding:8px 12px', 'max-width:420px', 'white-space:pre-wrap',
      'word-break:break-word', 'line-height:1.6', 'font-size:13px',
      'box-shadow:0 4px 16px rgba(0,0,0,0.15)', 'pointer-events:auto',
      'user-select:text', '-webkit-user-select:text', 'cursor:text',
    ].join(';');
    document.body.appendChild(tooltip);
    this.tooltipEl = tooltip;

    let isOverTooltip = false;
    let hideTimer: any = null;

    const showTooltip = (text: string, anchorEl: Element) => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      tooltip.textContent = text;
      tooltip.style.display = 'block';
      const rect = anchorEl.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + 420 > window.innerWidth) left = Math.max(8, window.innerWidth - 428);
      if (top + 150 > window.innerHeight) top = rect.top - 154;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    };

    const hideTooltip = () => {
      hideTimer = setTimeout(() => {
        if (!isOverTooltip) tooltip.style.display = 'none';
      }, 80);
    };

    tooltip.addEventListener('mouseenter', () => {
      isOverTooltip = true;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    tooltip.addEventListener('mouseleave', () => {
      isOverTooltip = false;
      tooltip.style.display = 'none';
    });

    gridContainer.addEventListener('mouseover', (e: Event) => {
      const el = (e as MouseEvent).target as HTMLElement;
      const target = el.closest('[data-tooltip]') as HTMLElement | null;
      if (target) showTooltip(target.getAttribute('data-tooltip') || '', target);
    });

    gridContainer.addEventListener('mouseout', (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as Node | null;
      if (related && tooltip.contains(related)) return;
      hideTooltip();
    });
  }
  //#endregion

  onSaveSummary(): void {
    if (this.dirtyRows.size === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu thay đổi để lưu!');
      return;
    }

    const payload = Array.from(this.dirtyRows.values()).map((row: any) => ({
      ID: row.ExpectedPayableID || 0,
      BillImportDetailID: row.BillImportDetailID || 0,
      SupplierSaleID: row.SupplierSaleID || 0,
      DeliverID: row.DeliverID || 0,
      InvoiceNumber: row.SomeBill || '',
      InvoiceDate: row.DateSomeBill ? this.toLocalISOString(new Date(row.DateSomeBill)) : null,
      DueDate: row.DueDate ? this.toLocalISOString(new Date(row.DueDate)) : null,
      UnitPrice: row.UnitPrice || 0,
      CurrencyID: row.CurrencyID || 0,
      DomesticPayable: row.DomesticPayable || 0,
      ForeignPayable: row.ForeignPayable || 0,
      ArisingAmount: row.ArisingAmount || 0,
      OfficeExpense: row.OfficeExpense || 0,
      TaxAmount: row.TaxAmount || 0,
      Note: row.Note || '',
      IsDeleted: false
    }));

    this.modal.confirm({
      nzTitle: 'Xác nhận lưu',
      nzContent: `Bạn có chắc muốn lưu ${payload.length} dòng đã thay đổi?`,
      nzOkText: 'Lưu',
      nzOnOk: () => {
        this.isSaving = true;
        this.expectedPayableService.saveExpectedPayables(payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.dirtyRows.clear();
            this.notification.success(NOTIFICATION_TITLE.success, `Lưu thành công ${payload.length} dòng!`);
            this.onSearch();
          },
          error: (error: any) => {
            this.isSaving = false;
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu: ' + (error?.error?.message || error.message || error));
          }
        });
      }
    });
  }

  async onExcel(): Promise<void> {
    const items =
      (this.angularGrid?.dataView?.getFilteredItems?.() as any[]) ||
      this.dataset;

    if (!items || items.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dự trù phải trả');

    const runtimeColumns =
      (this.angularGrid?.slickGrid?.getColumns?.() as any[]) ||
      this.columnDefinitions;
    const columns = runtimeColumns.filter(
      (col: any) => col?.id !== '_checkbox_selector' && col?.hidden !== true
    );

    const numericCols = [
      'UnitPrice',
      'Amount',
      'AmountVnd',
      'DomesticPayable',
      'ForeignPayable',
      'ArisingAmount',
      'OfficeExpense',
      'TaxAmount',
    ];
    const dateCols = ['DateSomeBill', 'DueDate'];

    // 1. Header Row: Màu xanh nhạt, cỡ chữ to 12pt bold
    const headers = columns.map((col: any) => col?.name || col?.id);
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      cell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: 'FF1F497D' },
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFA6B9D7' } },
        left: { style: 'thin', color: { argb: 'FFA6B9D7' } },
        bottom: { style: 'medium', color: { argb: 'FF4F81BD' } },
        right: { style: 'thin', color: { argb: 'FFA6B9D7' } },
      };
    });

    // 2. Data Rows: Căn chỉnh định dạng & căn lề nội dung cột
    const sums: Record<string, number> = {};
    numericCols.forEach((f) => (sums[f] = 0));

    items.forEach((item: any) => {
      const rowValues = columns.map((col: any) => {
        const field = col.field || col.id;
        const val = item[field];

        if (numericCols.includes(field)) {
          const num = Number(val) || 0;
          sums[field] += num;
          return num;
        }

        if (dateCols.includes(field)) {
          if (!val) return '';
          if (typeof val === 'string' && val.includes('T')) {
            const dt = DateTime.fromISO(val);
            if (dt.isValid) return dt.toFormat('dd/MM/yyyy');
          }
          const dt = DateTime.fromJSDate(new Date(val));
          return dt.isValid ? dt.toFormat('dd/MM/yyyy') : String(val);
        }

        if (field === 'PaymentPercentage') {
          return val != null && val !== '' ? `${val}%` : '';
        }

        return val ?? '';
      });

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 22;

      dataRow.eachCell((cell, colNumber) => {
        const colDef = columns[colNumber - 1];
        const field = colDef?.field || colDef?.id;

        cell.font = { name: 'Arial', size: 11 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        if (numericCols.includes(field)) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        } else if (
          dateCols.includes(field) ||
          field === 'CurrencyCode' ||
          field === 'PaymentPercentage'
        ) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // 3. Footer Row: Hàng tổng cộng cuối trang
    const codeCount = items.filter((item: any) => item.CodeNCC).length;
    const footerValues = columns.map((col: any) => {
      const field = col.field || col.id;
      if (field === 'CodeNCC') return `Tổng (${codeCount})`;
      if (numericCols.includes(field)) return sums[field];
      return '';
    });

    const footerRow = worksheet.addRow(footerValues);
    footerRow.height = 25;

    footerRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      const field = colDef?.field || colDef?.id;

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F4F8' },
      };
      cell.font = { name: 'Arial', size: 11, bold: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF4F81BD' } },
        bottom: { style: 'double', color: { argb: 'FF4F81BD' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      if (numericCols.includes(field)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });

    // 4. Auto column width: Căn chỉnh độ rộng cột dựa trên tiêu đề và dữ liệu
    worksheet.columns.forEach((column: any, index: number) => {
      const colDef = columns[index];
      const headerName = String(colDef?.name || colDef?.id || '');
      let maxLen = headerName.length;

      items.forEach((item: any) => {
        const field = colDef?.field || colDef?.id;
        let val = item[field];
        if (numericCols.includes(field)) {
          val = this.formatNumberEnUS(val);
        } else if (dateCols.includes(field)) {
          val = 'DD/MM/YYYY';
        }
        if (val != null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });

      column.width = Math.max(14, Math.min(60, maxLen + 4));
    });

    // 5. Xuất và tải file Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const dateStr = DateTime.now().toFormat('ddMMyyyy_HHmmss');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DuTruThanhToan_${dateStr}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

