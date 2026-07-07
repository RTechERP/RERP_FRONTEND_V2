import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
  Inject,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MenuCommandItemCallbackArgs,
  MultipleSelectOption,
} from 'angular-slickgrid';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';

import { InventoryService } from '../inventory-service/inventory.service';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { ChiTietSanPhamSaleNewComponent } from '../../chi-tiet-san-pham-sale/chi-tiet-san-pham-sale-new/chi-tiet-san-pham-sale-new.component';

@Component({
  selector: 'app-inventory-not-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSpinModule,
    NzTagModule,
    NzDatePickerModule,
    AngularSlickgridModule,
  ],
  templateUrl: './inventory-not-export.component.html',
  styleUrl: './inventory-not-export.component.css'
})
export class InventoryNotExportComponent implements OnInit, AfterViewInit, OnDestroy {
  warehouseId: number = -1;
  warehouseCode: string = '';
  componentId: string = '';
  isLoadingInventory: boolean = false;
  // true = chỉ hiện dòng mượn/trả trong 1 năm không có xuất
  filterBorrowOnly: boolean = false;
  private allDatasetInventory: any[] = [];

  warehouses = [
    { id: -1, code: '', name: 'Tất cả' },
    { id: 1, code: 'HN', name: 'Hà Nội' },
    { id: 2, code: 'HCM', name: 'Hồ Chí Minh' },
    { id: 3, code: 'BN', name: 'Bắc Ninh' },
    { id: 4, code: 'HP', name: 'Hải Phòng' },
    { id: 6, code: 'DP', name: 'Đan Phượng' },
  ];

  angularGridInventory!: AngularGridInstance;
  columnDefinitionsInventory: Column[] = [];
  gridOptionsInventory: GridOption = {};
  datasetInventory: any[] = [];
  private filterTimeout: any;

  searchParam = {
    checkedAll: true,
    Find: '',
    checkedStock: false,
    fromDate: new Date(new Date().getFullYear(), 0, 1),
    toDate: new Date(),
  };

  searchHistory: string[] = [];
  showSearchHistory: boolean = false;
  private readonly SEARCH_HISTORY_KEY = 'inventory_not_export__search_history';
  private readonly MAX_HISTORY = 10;

  private subscriptions: Subscription[] = [];

  constructor(
    private inventoryService: InventoryService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private elementRef: ElementRef,
    private tabService: TabServiceService,
    @Optional() @Inject('tabData') private tabData: any,
  ) { }

  ngOnInit(): void {
    this.componentId = this.generateUUIDv4();
    if (this.tabData) {
      this.warehouseId = this.tabData.warehouseID ?? 1;
      const wh = this.warehouses.find(w => w.id === this.warehouseId);
      this.warehouseCode = wh ? wh.code : 'HN';
    }
    this.initGridColumns();
    this.initGridOptions();
    this.loadSearchHistory();
    this.getInventory();
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onWarehouseChange(id: number) {
    const wh = this.warehouses.find(w => w.id === id);
    this.warehouseCode = wh ? wh.code : 'HN';
    this.getInventory();
  }

  private initGridColumns(): void {
    this.columnDefinitionsInventory = [
      {
        id: 'ProductGroupName',
        field: 'ProductGroupName',
        name: 'Tên nhóm',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        excelExportOptions: { valueParserCallback: (_val, args) => args.dataContext['ProductGroupName'] || '' },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 220,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 250,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        excelExportOptions: { valueParserCallback: (_val, args) => args.dataContext['ProductName'] || '' },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'QuantityUse',
        field: 'QuantityUse',
        name: 'Tồn sử dụng',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2 },
      },
      {
        id: 'StillBorrowed',
        field: 'StillBorrowed',
        name: 'Đang mượn',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2 },
      },
      {
        id: 'TotalQuantityLast',
        field: 'TotalQuantityLast',
        name: 'Tồn kho',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2 },
      },
      {
        id: 'NameNCC',
        field: 'NameNCC',
        name: 'Nhà cung cấp',
        width: 250,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        excelExportOptions: { valueParserCallback: (_val, args) => args.dataContext['NameNCC'] || '' },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 300,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        excelExportOptions: { valueParserCallback: (_val, args) => args.dataContext['Note'] || '' },
      },
      {
        id: 'LastTransactionDate',
        field: 'LastTransactionDate',
        name: 'Ngày mượn/trả gần nhất',
        width: 160,
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
        id: 'LastTransactionCode',
        field: 'LastTransactionCode',
        name: 'Mã phiếu mượn/trả gần nhất',
        width: 160,
        sortable: true,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption,
        },
      },
    ];
  }

  private initGridOptions(): void {
    this.gridOptionsInventory = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-inventory-' + this.componentId,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: false },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableAutoSizeColumns: true,
      frozenColumn: 4,
      enableHeaderMenu: false,
      enableContextMenu: true,
      contextMenu: {
        commandItems: [
          {
            command: 'view-detail',
            title: 'Xem chi tiết',
            iconCssClass: 'fa fa-external-link',
            action: (_e: any, args: MenuCommandItemCallbackArgs) => {
              const dataContext = args.dataContext;
              if (dataContext) this.openChiTietSanPhamSale(dataContext);
            },
          },
        ],
      },
      rowHeight: 55,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },
      enableGrouping: true,
    };
  }

  getInventory() {
    this.isLoadingInventory = true;
    const sub = this.inventoryService
      .getInventoryNotExport(
        true,
        this.searchParam.Find,
        this.warehouseCode,
        false,
        0,
        this.searchParam.fromDate,
        this.searchParam.toDate
      )
      .subscribe({
        next: (res) => {
          this.isLoadingInventory = false;
          if (res?.data) {
            this.allDatasetInventory = res.data.map((item: any) => ({
              ...item,
              id: item.ID,
            }));
            this.datasetInventory = this.filterBorrowOnly
              ? this.allDatasetInventory.filter(i => i.IsBorrowNotExport1Year === 1)
              : [...this.allDatasetInventory];
            this.cdr.detectChanges();
            setTimeout(() => this.applyDistinctFilters(this.angularGridInventory), 100);
            setTimeout(() => this.updateInventoryFooterRow(), 500);
          }
        },
        error: (err) => {
          this.isLoadingInventory = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
    this.subscriptions.push(sub);
  }

  getdataFind() {
    this.saveSearchHistory(this.searchParam.Find);
    this.getInventory();
  }

  selectHistoryItem(item: string): void {
    this.searchParam.Find = item;
    this.showSearchHistory = false;
    this.getdataFind();
  }

  private loadSearchHistory(): void {
    try {
      this.searchHistory = JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY) || '[]');
    } catch {
      this.searchHistory = [];
    }
  }

  private saveSearchHistory(keyword: string): void {
    const kw = (keyword || '').trim();
    if (!kw) return;
    this.searchHistory = [kw, ...this.searchHistory.filter(h => h !== kw)].slice(0, this.MAX_HISTORY);
    localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
  }

  // toggle lọc chỉ hiện dòng có mượn/trả trong 1 năm nhưng không có xuất
  toggleFilterBorrowOnly() {
    this.filterBorrowOnly = !this.filterBorrowOnly;
    this.datasetInventory = this.filterBorrowOnly
      ? this.allDatasetInventory.filter(i => i.IsBorrowNotExport1Year === 1)
      : [...this.allDatasetInventory];
    this.cdr.detectChanges();
    setTimeout(() => this.updateInventoryFooterRow(), 100);
  }

  get borrowOnlyCount(): number {
    return this.allDatasetInventory.filter(i => i.IsBorrowNotExport1Year === 1).length;
  }

  angularGridReadyInventory(angularGrid: AngularGridInstance) {
    this.angularGridInventory = angularGrid;
    if (angularGrid.dataView) {
      const originalGetItemMetadata = angularGrid.dataView.getItemMetadata.bind(angularGrid.dataView);
      angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = angularGrid.dataView.getItem(row);
        const base = originalGetItemMetadata(row) || {};
        if (item?.IsBorrowNotExport1Year === 1) {
          return { ...base, cssClasses: ((base as any).cssClasses || '') + ' row-overaged' };
        }
        return base;
      };
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
          // Không gọi setColumns nếu đang có filter input đang focus → tránh mất focus
          const activeEl = document.activeElement;
          const isFilterFocused = activeEl && (
            activeEl.closest('.slick-headerrow-column') ||
            activeEl.closest('.ms-parent')
          );
          if (!isFilterFocused) {
            this.applyDistinctFilters(this.angularGridInventory);
          }
        }, 500);
        this.updateInventoryFooterRow();
      });
    }
    // Khởi tạo footer ngay khi grid ready
    setTimeout(() => this.updateInventoryFooterRow(), 100);
  }

  exportExcel(): void {
    const items: any[] = (this.angularGridInventory?.dataView?.getFilteredItems?.() as any[]) || this.datasetInventory || [];
    const columns = this.columnDefinitionsInventory;
    const sumFields = ['QuantityUse', 'StillBorrowed', 'TotalQuantityLast'];

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F497D' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      }
    };

    const borderStyle = {
      top: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const aoa: any[][] = [];
    aoa.push(columns.map(c => ({ v: c.name || c.field, s: headerStyle })));

    items.forEach(item => {
      const isBorrowOnly = item.IsBorrowNotExport1Year === 1;
      const rowStyle = isBorrowOnly ? {
        font: { color: { rgb: '9C0006' } },
        fill: { fgColor: { rgb: 'FFC7CE' } },
        border: borderStyle,
      } : { border: borderStyle };

      const row = columns.map(c => {
        let val = item[c.field as string];
        const isNum = c.type === 'number' || c.cssClass?.includes('text-end');
        if (c.field === 'LastTransactionDate' && val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            val = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        }
        const style = isNum
          ? { ...rowStyle, alignment: { horizontal: 'right' }, numFmt: '#,##0.##' }
          : rowStyle;
        return { v: val !== null && val !== undefined ? val : '', t: isNum && typeof val === 'number' ? 'n' : 's', s: style };
      });
      aoa.push(row);
    });

    const footerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'DCE6F1' } },
      border: borderStyle,
    };
    const footerRow = columns.map(c => {
      if (c.field === 'ProductName') return { v: `Tổng: ${items.length} sản phẩm`, s: footerStyle };
      if (sumFields.includes(c.field as string)) {
        const total = items.reduce((s, i) => s + (Number(i[c.field as string]) || 0), 0);
        return { v: total, t: 'n', s: { ...footerStyle, alignment: { horizontal: 'right' }, numFmt: '#,##0.##' } };
      }
      return { v: '', s: footerStyle };
    });
    aoa.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = columns.map(c => ({ wch: Math.max(12, Math.ceil((c.width || 100) / 7)) }));
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mượn không xuất');

    const wh = this.warehouses.find(w => w.id === this.warehouseId);
    const whName = wh ? wh.name : '';
    const fileName = `MuonKhongXuat_${whName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
  }

  updateInventoryFooterRow(): void {
    if (!this.angularGridInventory?.slickGrid) return;

    const items = (this.angularGridInventory.dataView?.getFilteredItems?.() as any[]) || this.datasetInventory || [];
    const productCount = items.length;
    const sumFields = ['QuantityUse', 'StillBorrowed', 'TotalQuantityLast'];

    const sums: { [key: string]: number } = {};
    sumFields.forEach(field => {
      sums[field] = items.reduce((sum, item) => sum + (Number(item?.[field]) || 0), 0);
    });

    try {
      const productNameFooter = this.angularGridInventory.slickGrid.getFooterRowColumn('ProductName');
      if (productNameFooter) {
        productNameFooter.textContent = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0, maximumFractionDigits: 2,
        }).format(productCount);
      }
      sumFields.forEach(field => {
        const footerCell = this.angularGridInventory.slickGrid.getFooterRowColumn(field);
        if (footerCell) {
          footerCell.textContent = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0, maximumFractionDigits: 2,
          }).format(sums[field] || 0);
        }
      });
    } catch (e) { }
  }

  applyDistinctFilters(angularGrid: AngularGridInstance): void {
    if (!angularGrid?.slickGrid || !angularGrid.dataView) return;
    const data = angularGrid.dataView.getFilteredItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (items: any[], field: string): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = String(value);
        if (!map.has(key)) map.set(key, { value, label: key });
      });
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    columns?.forEach((column: any) => {
      if (column.filter?.model === Filters['multipleSelect']) {
        column.filter.collection = getUniqueValues(data, column.field);
      }
    });
    this.columnDefinitionsInventory.forEach((colDef: any) => {
      if (colDef.filter?.model === Filters['multipleSelect']) {
        colDef.filter.collection = getUniqueValues(data, colDef.field);
      }
    });
    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
    // setColumns rebuild lại footer DOM → cần set lại nội dung footer ngay sau
    this.updateInventoryFooterRow();
  }

  wrapTextFormatter: Formatter = (_row, _cell, value) => {
    if (!value) return '';
    return `<span title="${String(value).replace(/"/g, '&quot;')}" style="white-space: normal; line-height: 1.2; display: block;">${value}</span>`;
  };

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  openChiTietSanPhamSale(productData: any) {
    const productCode = productData.ProductCode || '';
    this.tabService.openTabComp({
      comp: ChiTietSanPhamSaleNewComponent,
      title: `Chi tiết SP - ${productCode}`,
      key: `chi-tiet-san-pham-sale-${productData.ProductSaleID || 0}`,
      data: {
        code: productCode,
        suplier: productData.Supplier || '',
        productName: productData.ProductName || '',
        numberDauKy: productData.NumberInStoreDauky?.toString() || '0',
        numberCuoiKy: productData.NumberInStoreCuoiKy?.toString() || '0',
        import: productData.Import?.toString() || '0',
        export: productData.Export?.toString() || '0',
        productSaleID: productData.ProductSaleID || 0,
        wareHouseCode: this.warehouseCode || 'HN',
      }
    });
  }
}
