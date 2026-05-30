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
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  GridOption,
} from 'angular-slickgrid';
import { Subscription } from 'rxjs';

import { InventoryService } from '../inventory-service/inventory.service';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';

@Component({
  selector: 'app-inventory-overaged',
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
    AngularSlickgridModule,
  ],
  templateUrl: './inventory-overaged.component.html',
  styleUrl: './inventory-overaged.component.css'
})
export class InventoryOveragedComponent implements OnInit, AfterViewInit, OnDestroy {
  warehouseId: number = 1;
  warehouseCode: string = 'HN';
  componentId: string = '';
  isLoadingInventory: boolean = false;
  filterOveraged: boolean = false;
  private allDatasetInventory: any[] = [];

  warehouses = [
    { id: 1, code: 'HN', name: 'Hà Nội' },
    { id: 2, code: 'HCM', name: 'Hồ Chí Minh' },
    { id: 3, code: 'BN', name: 'Bắc Ninh' },
    { id: 4, code: 'HP', name: 'Hải Phòng' },
    { id: 5, code: 'BH', name: 'Đồ bảo hộ' },
    { id: 6, code: 'DP', name: 'Đan Phượng' },
  ];

  angularGridInventory!: AngularGridInstance;
  columnDefinitionsInventory: Column[] = [];
  gridOptionsInventory: GridOption = {};
  datasetInventory: any[] = [];

  searchParam = {
    checkedAll: true,
    Find: '',
    checkedStock: false,
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private inventoryService: InventoryService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private elementRef: ElementRef,
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
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 250,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'NameNCC',
        field: 'NameNCC',
        name: 'NCC',
        width: 200,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Deliver',
        field: 'Deliver',
        name: 'Người nhập',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInput'] },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 70,
        sortable: true,
        filterable: true,
      },
      {
        id: 'TotalQuantityFirst',
        field: 'TotalQuantityFirst',
        name: 'Tồn đầu kỳ',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'Import',
        field: 'Import',
        name: 'Nhập',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'Export',
        field: 'Export',
        name: 'Xuất',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'TotalQuantityLastActual',
        field: 'TotalQuantityLastActual',
        name: 'SL tồn thực tế',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'QuantityRequestExport',
        field: 'QuantityRequestExport',
        name: 'SL yêu cầu xuất',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'TotalQuantityKeep',
        field: 'TotalQuantityKeep',
        name: 'SL giữ',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'TotalQuantityLast',
        field: 'TotalQuantityLast',
        name: 'Tồn CK(được sử dụng)',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'QuantityUse',
        field: 'QuantityUse',
        name: 'Tồn sử dụng',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'MinQuantity',
        field: 'MinQuantity',
        name: 'Tồn tối thiểu Y/c',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'MinQuantityActual',
        field: 'MinQuantityActual',
        name: 'Tồn tối thiểu thực tế',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'TotalQuantityReturnNCC',
        field: 'TotalQuantityReturnNCC',
        name: 'SL phải trả NCC',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'ImportPT',
        field: 'ImportPT',
        name: 'Tổng mượn',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'ExportPM',
        field: 'ExportPM',
        name: 'Tổng trả',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'StillBorrowed',
        field: 'StillBorrowed',
        name: 'Đang mượn',
        cssClass: 'text-end',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        type: 'number',
      },
      {
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Detail',
        field: 'Detail',
        name: 'Chi tiết nhập',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 150,
        sortable: true,
        filterable: true,
      },
      // {
      //   id: 'QtyExport',
      //   field: 'QtyExport',
      //   name: 'Tồn trong kỳ',
      //   width: 150,
      //   sortable: true,
      //   filterable: true,
      // }
    ];
  }

  private initGridOptions(): void {
    // this.gridOptionsInventory = {
    //   enableAutoResize: true,
    //   autoResize: {
    //     container: '.grid-container-inventory-' + this.componentId,
    //     calculateAvailableSizeBy: 'container',
    //     resizeDetection: 'container',
    //   },
    //   gridWidth: '100%',
    //   datasetIdPropertyName: 'id',
    //   enableRowSelection: true,
    //   enableCellNavigation: true,
    //   enableFiltering: true,
    //   autoFitColumnsOnFirstLoad: true,
    //   createFooterRow: true,
    //   showFooterRow: true,
    //   footerRowHeight: 28,
    //   rowHeight: 45,
    // };

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
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 4,
      enableHeaderMenu: false,
      enableContextMenu: true,
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
      .getInventoryOveraged(
        true,
        this.searchParam.Find,
        this.warehouseCode,
        false,
        0
      )
      .subscribe({
        next: (res) => {
          this.isLoadingInventory = false;
          if (res?.data) {
            this.allDatasetInventory = res.data.map((item: any) => ({
              ...item,
              id: item.ID,
            }));
            this.datasetInventory = this.filterOveraged
              ? this.allDatasetInventory.filter(i => i.IsOveraged === 1)
              : [...this.allDatasetInventory];
            this.cdr.detectChanges();
            setTimeout(() => {
              this.updateInventoryFooterRow();
            }, 100);
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
    this.getInventory();
  }

  toggleFilterOveraged() {
    this.filterOveraged = !this.filterOveraged;
    this.datasetInventory = this.filterOveraged
      ? this.allDatasetInventory.filter(i => i.IsOveraged === 1)
      : [...this.allDatasetInventory];
    this.cdr.detectChanges();
    setTimeout(() => this.updateInventoryFooterRow(), 100);
  }

  angularGridReadyInventory(angularGrid: AngularGridInstance) {
    this.angularGridInventory = angularGrid;
    if (angularGrid.dataView) {
      const originalGetItemMetadata = angularGrid.dataView.getItemMetadata.bind(angularGrid.dataView);
      angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = angularGrid.dataView.getItem(row);
        const base = originalGetItemMetadata(row) || {};
        if (item?.IsOveraged) {
          return { ...base, cssClasses: ((base as any).cssClasses || '') + ' row-overaged' };
        }
        return base;
      };
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateInventoryFooterRow();
      });
    }
  }

  updateInventoryFooterRow(): void {
    if (!this.angularGridInventory?.slickGrid) return;

    const items = (this.angularGridInventory.dataView?.getFilteredItems?.() as any[]) || this.datasetInventory || [];
    const productCount = items.length;

    const sumFields = [
      'TotalQuantityFirst',
      'Import',
      'Export',
      'TotalQuantityLastActual',
      'TotalQuantityLast',
    ];

    const sums: { [key: string]: number } = {};
    sumFields.forEach(field => {
      sums[field] = items.reduce((sum, item) => sum + (Number(item?.[field]) || 0), 0);
    });

    try {
      const productNameFooter = this.angularGridInventory.slickGrid.getFooterRowColumn('ProductName');
      if (productNameFooter) {
        productNameFooter.textContent = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(productCount);
      }

      sumFields.forEach(field => {
        const footerCell = this.angularGridInventory.slickGrid.getFooterRowColumn(field);
        if (footerCell) {
          footerCell.textContent = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(sums[field] || 0);
        }
      });
    } catch (e) { }
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
}
