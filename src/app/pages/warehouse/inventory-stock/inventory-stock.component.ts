import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
  Inject,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
  MenuCommandItemCallbackArgs,
} from 'angular-slickgrid';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { InventoryStockService } from './inventory-stock.service';
import { ProductGroupDetailComponent } from '../../old/Sale/ProductSale/product-group-detail/product-group-detail.component';
import { InventoryStockDetailComponent } from './inventory-stock-detail/inventory-stock-detail.component';
import { AppUserService } from '../../../services/app-user.service';
import * as ExcelJS from 'exceljs';
import { PermissionService } from '../../../services/permission.service';
import { ProductsaleServiceService } from '../../old/Sale/ProductSale/product-sale-service/product-sale-service.service';
import { InventoryService } from '../../old/Sale/Inventory/inventory-service/inventory.service';
import { InventoryStockImportExcelComponent } from './inventory-stock-import-excel/inventory-stock-import-excel.component';
import { InventoryStockLogComponent } from './inventory-stock-log/inventory-stock-log.component';

@Component({
  selector: 'app-inventory-stock',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzSpinModule,
    NgbModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './inventory-stock.component.html',
  styleUrl: './inventory-stock.component.css',
})
export class InventoryStockComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService,
    private inventoryStockService: InventoryStockService,
    private permissionService: PermissionService,
    private productsaleSV: ProductsaleServiceService,
    private inventorySV: InventoryService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  inventory: any[] = [];
  warehouses: any[] = [];
  warehouseCode: string = '';
  warehouseId: number = 1;

  // Menu
  inventoryStockMenu: MenuItem[] = [];

  // Data
  dataProductGroup: any[] = [];
  dataPGWareHouse: any[] = [];
  dataInventory: any[] = [];

  // AngularSlickGrid instances
  angularGridProductGroup!: AngularGridInstance;
  angularGridPGWarehouse!: AngularGridInstance;
  angularGridInventory!: AngularGridInstance;

  // Column definitions
  columnDefinitionsProductGroup: Column[] = [];
  columnDefinitionsPGWarehouse: Column[] = [];
  columnDefinitionsInventory: Column[] = [];

  // Grid options
  gridOptionsProductGroup: GridOption = {};
  gridOptionsPGWarehouse: GridOption = {};
  gridOptionsInventory: GridOption = {};

  // Datasets
  datasetProductGroup: any[] = [];
  datasetPGWarehouse: any[] = [];
  datasetInventory: any[] = [];

  // Loading states
  isLoadingProductGroup: boolean = false;
  isLoadingInventory: boolean = false;

  keyword: string = '';
  checkedAll: boolean = false;
  randomCode: string = '';
  private isNotEnoughMetadataApplied = false;
  private selectedProductGroupRowIndex: number = 0;
  //#endregion

  //#region hàm khởi tạo
  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.warehouseCode =
        params['warehouseCode']
        ?? this.tabData?.warehouseCode
        ?? 'HN';
      this.warehouseId = Number(
        params['warehouseID']
        ?? this.tabData?.warehouseID
        ?? 1
      );
    });

    this.randomCode = this.generateUUIDv4();
    this.initGridColumns();
    this.initGridOptions();
    this.getProductGroup()
    this.onSearch();
    this.loadWarehouse();
    this.loadMenu();
  }
  ngAfterViewInit(): void {
    setTimeout(() => this.onSearch(), 1000);
  }

  loadWarehouse(): void {
    this.inventoryStockService.getWarehouse().subscribe({
      next: (response: any) => {
        this.warehouses = response.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }

  onWarehouseChange(warehouseId: number): void {
    this.warehouseId = warehouseId;
    const selectedWh = this.warehouses.find(w => w.ID === warehouseId);
    if (selectedWh) {
      this.warehouseCode = selectedWh.WarehouseCode;
    }
    this.getProductGroup().then(() => {
      this.onSearch();
    });
  }
  //#endregion

  //#region load dữ liệu
  loadMenu() {
    this.inventoryStockMenu = [
      {
        label: 'Thêm sản phẩm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N27,N35,N1,N33,N34'),
        command: () => {
          console.log('Thêm sản phẩm');
          this.onAddProduct();
        },
      },
      {
        label: 'Sửa sản phẩm',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N27,N1'),
        command: () => {
          this.onEditProduct();
        },
      },
      {
        label: 'Xóa sản phẩm',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N27,N35,N1,N33,N34'),
        command: () => {
          this.onDeleted();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        },
      },
      {
        label: 'Nhập excel',
        icon: 'fa-solid fa-file-arrow-up fa-lg text-success',
        command: () => {
          this.onImportExcel();
        },
      },
      {
        label: 'Lịch sử thao tác',
        icon: 'fa-solid fa-clock-rotate-left fa-lg text-info',
        command: () => {
          this.onInventoryStockLog();
        },
      },
    ];
  }

  getProductGroup(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingProductGroup = true;
      this.productsaleSV.getdataProductGroupNew(this.warehouseId, false, true).subscribe({
        next: (res) => {
          this.datasetProductGroup = res.data.data1.filter((x: any) => x.ID === 13);
          this.datasetProductGroup = this.datasetProductGroup.map(
            (item, index) => {
              return {
                ...item,
                id: `${index++}_inventory_stock_${this.warehouseCode}`,
              };
            }
          );
          this.isLoadingProductGroup = false;
          setTimeout(() => {
            // Sử dụng biến selectedProductGroupRowIndex để set lại dòng được chọn
            if (this.angularGridProductGroup?.slickGrid) {
              this.angularGridProductGroup.slickGrid.setSelectedRows([
                this.selectedProductGroupRowIndex,
              ]);
            }
            resolve();
          });
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            });
          this.isLoadingProductGroup = false;
          reject(err);
        },
      });
    });
  }

  //#region Tìm kiếm
  onSearch(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingInventory = true;
      let id = -1;
      let productGroupId = 0;
      if (this.angularGridProductGroup?.slickGrid) {
        const selectedIndexes =
          this.angularGridProductGroup.slickGrid.getSelectedRows();
        if (selectedIndexes.length > 0) {
          const selectedItem = this.angularGridProductGroup.dataView.getItem(
            selectedIndexes[0]
          );
          id = selectedItem?.ID || 0;
          productGroupId = selectedItem?.ID || 0;
        }
      }

      if (this.checkedAll) id = 0;

      // Reset flag để cho phép re-apply styling
      this.isNotEnoughMetadataApplied = false;

      this.inventoryStockService
        .getDataInventory(id, this.warehouseId, productGroupId, this.keyword)
        .subscribe({
          next: (res) => {
            this.datasetInventory = res.data.dtMaster;
            this.datasetInventory = this.datasetInventory.map((item, index) => {
              return {
                ...item,
                id: `${index++}_inventory_stock_${this.warehouseCode}`,
              };
            });

            if (productGroupId > 0) {
              this.getDataProductGroupWareHouse(productGroupId);
            } else {
              this.datasetPGWarehouse = res.data.dtWarehouse || [];
              if (this.datasetPGWarehouse.length > 0) {
                this.datasetPGWarehouse = this.datasetPGWarehouse.map(
                  (item, index) => {
                    return {
                      ...item,
                      id: `${index++}_inventory_stock_${this.warehouseCode}`,
                    };
                  }
                );
              }
            }
            this.isLoadingInventory = false;

            setTimeout(() => {
              this.applyGrouping();
              this.applyDistinctFilters();

              this.angularGridInventory?.slickGrid?.invalidate();
              this.angularGridInventory?.slickGrid?.render();
            }, 100);
            setTimeout(() => {
              this.applyNotEnoughRowStyling();
              this.updateMasterFooterRow();

              this.angularGridInventory?.slickGrid?.invalidate();
              this.angularGridInventory?.slickGrid?.render();
            }, 1000);
            resolve();
          },
          error: (err) => {
            this.isLoadingInventory = false;
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              });
            reject(err);
          },
        });
    });
  }
  //#endregion

  //#endregion

  //#region xử lý bảng
  private initGridColumns(): void {
    // Product Group columns
    this.columnDefinitionsProductGroup = [
      {
        id: 'ProductGroupID',
        field: 'ProductGroupID',
        name: 'Mã nhóm',
        maxWidth: 80,
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
        id: 'ProductGroupName',
        field: 'ProductGroupName',
        name: 'Tên nhóm',
        width: 120,
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
    ];

    // PG Warehouse columns
    this.columnDefinitionsPGWarehouse = [
      {
        id: 'WarehouseCode',
        field: 'WarehouseCode',
        name: 'Kho',
        maxWidth: 80,
        sortable: true,
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'NV phụ trách',
        width: 100,
        sortable: true,
      },
    ];

    // Inventory columns
    this.columnDefinitionsInventory = [
      {
        id: 'ProductGroupName',
        field: 'ProductGroupName',
        name: 'Tên nhóm',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        filter: {
          model: Filters['compoundInput'],
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
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          model: Filters['compoundInput'],
        },
      },
      // {
      //   id: 'NameNCC',
      //   field: 'NameNCC',
      //   name: 'NCC',
      //   width: 200,
      //   sortable: true,
      //   filterable: true,
      //   customTooltip: {
      //     useRegularTooltip: true,
      //   },
      //   filter: {
      //     model: Filters['compoundInput'],
      //   },
      // },
      {
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
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
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'QuantityUse',
        field: 'QuantityUse',
        name: 'Tồn sử dụng',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Tồn tối thiểu Y/C',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'TotalQuantityEnough',
        field: 'TotalQuantityEnough',
        name: 'Số lượng còn lại',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người yêu cầu',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        minWidth: 350,
        sortable: true,
        filterable: true,
        formatter: this.wrapTextFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          model: Filters['compoundInput'],
        },
      },
    ];
  }

  private initGridOptions(): void {
    // Product Group grid options
    this.gridOptionsProductGroup = {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-product-group-${this.randomCode}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      enableHeaderMenu: false,
      forceFitColumns: true,
    };

    // PG Warehouse grid options
    this.gridOptionsPGWarehouse = {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-pg-warehouse-${this.randomCode}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableCellNavigation: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      enableHeaderMenu: false,
      forceFitColumns: true,
    };

    // Inventory grid options
    this.gridOptionsInventory = {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-inventory-${this.randomCode}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      multiSelect: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableGrouping: true,
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 4,
      enableHeaderMenu: false,
      enableContextMenu: true,
      enableCustomTooltip: true,
      rowHeight: 45,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      forceFitColumns: false,
      rowCssClasses: (row: number, dataContext: any) => {
        const isEnough = Number(dataContext?.IsEnough);
        if (isEnough === 0) {
          return 'row-not-enough';
        }
        return '';
      },
    } as any;
  }

  angularGridReadyProductGroup(angularGrid: AngularGridInstance) {
    this.angularGridProductGroup = angularGrid;

    if (angularGrid && angularGrid.slickGrid) {
      // Event khi chọn row
      angularGrid.slickGrid.onSelectedRowsChanged.subscribe(() => {
        this.onSearch();
      });

      // Event double-click
      angularGrid.slickGrid.onDblClick.subscribe((e: any, args: any) => {
        const item = angularGrid.dataView.getItem(args.row);
        this.openModalProductGroup(item);
      });

      // Lắng nghe thay đổi dữ liệu của DataView để set selection khi dữ liệu load xong
      angularGrid.dataView.onRowsChanged.subscribe(() => {
        const selectedRows = angularGrid.slickGrid.getSelectedRows();
        if (selectedRows.length === 0 && angularGrid.dataView.getLength() > 0) {
          angularGrid.slickGrid.setSelectedRows([this.selectedProductGroupRowIndex]);
        }
      });

      // Nếu dữ liệu đã có sẵn trong grid, set selection ngay
      if (angularGrid.dataView.getLength() > 0) {
        const selectedRows = angularGrid.slickGrid.getSelectedRows();
        if (selectedRows.length === 0) {
          angularGrid.slickGrid.setSelectedRows([this.selectedProductGroupRowIndex]);
        }
      }
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridReadyPGWarehouse(angularGrid: AngularGridInstance) {
    this.angularGridPGWarehouse = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridReadyInventory(angularGrid: AngularGridInstance) {
    this.angularGridInventory = angularGrid;
    this.applyGrouping();

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    // Click vào cột checkbox → toggle multi-select, click vào ô dữ liệu → chỉ chọn dòng đó
    angularGrid.slickGrid.onClick.subscribe((_e: any, args: any) => {
      const grid = angularGrid.slickGrid;
      const rowIndex = args.row;
      const cell = args.cell;
      const columns = grid.getColumns();
      const isCheckboxColumn = columns[cell]?.id === '_checkbox_selector';

      if (isCheckboxColumn) {
        // Cột checkbox: toggle multi-select
        const selectedRows: number[] = grid.getSelectedRows();
        const idx = selectedRows.indexOf(rowIndex);
        if (idx === -1) {
          selectedRows.push(rowIndex);
        } else {
          selectedRows.splice(idx, 1);
        }
        grid.setSelectedRows(selectedRows);
      } else {
        // Ô dữ liệu: chỉ chọn dòng đó
        grid.setSelectedRows([rowIndex]);
      }
    });

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 100);
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

  private applyGrouping(): void {
    const angularGrid = this.angularGridInventory;
    if (!angularGrid || !angularGrid.dataView) return;

    angularGrid.dataView.setGrouping([
      {
        getter: 'WarehouseCode',
        comparer: () => 0,
        formatter: (g: any) => {
          const warehouseCode = g.value || 'Không xác định';
          return `Kho: <strong>${warehouseCode}</strong> <span style="color:#ed502f;">(${g.count})</span>`;
        },
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false,
      },
      // {
      //   getter: 'ProjectTypeName',
      //   comparer: () => 0,
      //   formatter: (g: any) => {
      //     const projectTypeName = g.value || 'Không xác định';
      //     return `Loại: <strong>${projectTypeName}</strong> <span style="color:#2b4387;">(${g.count})</span>`;
      //   },
      //   aggregateCollapsed: false,
      //   lazyTotalsCalculation: true,
      //   collapsed: false,
      // },
    ]);

    angularGrid.dataView.refresh();
    angularGrid.slickGrid?.render();
  }

  private applyNotEnoughRowStyling(): void {
    const angularGrid = this.angularGridInventory;
    const dataView = angularGrid?.dataView;
    const grid = angularGrid?.slickGrid;
    if (!dataView || !grid || this.isNotEnoughMetadataApplied) return;

    const previousItemMetadata = dataView.getItemMetadata;

    dataView.getItemMetadata = (rowNumber: number) => {
      const item = dataView.getItem(rowNumber) as any;

      // Gọi previousItemMetadata để lấy metadata từ grouping plugin
      let meta: any = null;
      if (typeof previousItemMetadata === 'function') {
        meta = (previousItemMetadata as any).call(dataView, rowNumber);
      }

      // Nếu không có meta, tạo mới
      if (!meta) {
        meta = { cssClasses: '' };
      }

      // Chỉ thêm class cho data rows (không phải group/totals)
      if (
        item &&
        !item.__group &&
        !item.__groupTotals &&
        Number(item?.IsEnough) === 0
      ) {
        meta.cssClasses = `${meta.cssClasses || ''} row-not-enough`.trim();
      }

      return meta;
    };

    this.isNotEnoughMetadataApplied = true;
    grid.invalidate();
    grid.render();
  }

  updateMasterFooterRow() {
    if (!this.angularGridInventory?.slickGrid) {
      return;
    }

    // Lấy dữ liệu đã lọc
    const items =
      (this.angularGridInventory.dataView?.getFilteredItems?.() as any[]) ||
      this.datasetInventory;

    // Đếm số lượng ProductCode
    const productCodeCount = (items || []).length;

    // Tính tổng cho các cột số
    const totals: { [key: string]: number } = {};
    const numericFields = ['TotalQuantityLast', 'Quantity', 'TotalQuantityEnough'];

    numericFields.forEach((field: string) => {
      totals[field] = (items || []).reduce(
        (sum, item) => sum + (Number(item[field]) || 0),
        0
      );
    });

    this.angularGridInventory.slickGrid.setFooterRowVisibility(true);

    // Set footer values
    const columns = this.angularGridInventory.slickGrid.getColumns();

    columns.forEach((col: any) => {
      const footerCell = this.angularGridInventory.slickGrid.getFooterRowColumn(
        col.id
      );
      if (!footerCell) {
        return;
      }

      if (col.id === 'ProductCode') {
        footerCell.innerHTML = `<b>${productCodeCount}</b>`;
      } else if (totals[col.field] !== undefined) {
        const formattedValue = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(totals[col.field]);
        footerCell.innerHTML = `<b>${formattedValue}</b>`;
      } else {
        footerCell.innerHTML = '';
      }
    });
  }

  applyDistinctFilters(): void {
    const angularGrid = this.angularGridInventory;
    const angularGridProductGroup = this.angularGridProductGroup;

    if (!angularGrid?.dataView || !angularGridProductGroup?.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];
    const dataProductGroup =
      angularGridProductGroup.dataView.getItems() as any[];

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

    if (this.columnDefinitionsInventory) {
      this.columnDefinitionsInventory.forEach((colDef: any) => {
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

    const columnProductGroups = angularGridProductGroup.slickGrid.getColumns();
    if (columnProductGroups) {
      columnProductGroups.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(dataProductGroup, field);
        }
      });
    }

    if (this.columnDefinitionsProductGroup) {
      this.columnDefinitionsProductGroup.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = getUniqueValues(dataProductGroup, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();

    const updatedColumnProductGroups =
      angularGridProductGroup.slickGrid.getColumns();
    angularGridProductGroup.slickGrid.setColumns(updatedColumnProductGroups);
    angularGridProductGroup.slickGrid.invalidate();
    angularGridProductGroup.slickGrid.render();
  }
  //#endregion

  //#region Sửa nhóm
  openModalProductGroup(row: any) {
    // Lưu index của dòng hiện tại vào biến class
    const currentSelectedRows =
      this.angularGridProductGroup?.slickGrid?.getSelectedRows() || [];
    this.selectedProductGroupRowIndex =
      currentSelectedRows.length > 0 ? currentSelectedRows[0] : 0;

    let newProductGroup = {
      ProductGroupID: row.ProductGroupID || '',
      ProductGroupName: row.ProductGroupName || '',
      EmployeeID: Number(row.EmployeeID) || 0,
      IsVisible: row.IsVisible || false,
      WareHouseID: Number(this.warehouseId),
    };

    const modalRef = this.modalService.open(ProductGroupDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.newProductGroup = newProductGroup;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.id = Number(row.ID);
    modalRef.componentInstance.isFromParent = true;

    modalRef.result.catch(async (result) => {
      if (result == true) {
        // getProductGroup sẽ tự động set lại selection dựa vào selectedProductGroupRowIndex
        await this.getProductGroup();
        this.onSearch();
      }
    });
  }
  //#endregion

  //#region Thêm
  onAddProduct() {
    const modalRef = this.modalService.open(InventoryStockDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.inventoryStock = [];
    modalRef.componentInstance.warehouseID = Number(this.warehouseId);

    modalRef.result.then(
      (result) => {
        this.onSearch();
      },
      () => {
        // Modal dismissed
      }
    );
  }

  //#endregion

  //#region Sửa
  onEditProduct() {
    const angularGrid = this.angularGridInventory;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length != 1) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 dòng để sửa!');
      return;
    }

    // const ids = selectedRows
    //   .filter(
    //     (row: any) =>
    //       row.EmployeeIDRequest == this.appUserService.employeeID && row.ID > 0
    //   )
    //   .map((row: any) => row.ID);

    // if (ids.length <= 0 && !this.appUserService.isAdmin) {
    //   this.notification.info(
    //     'Thông báo',
    //     'Không có sản phẩm hợp lệ để sửa! Chỉ người yêu cầu mới được sửa sản phẩm.'
    //   );
    //   return;
    // }

    const item = angularGrid.dataView.getItem(selectedRowIndexes[0]);

    this.inventoryStockService.getInventoryById(item.ID).subscribe({
      next: (response: any) => {
        const modalRef = this.modalService.open(InventoryStockDetailComponent, {
          centered: true,
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
        });
        modalRef.componentInstance.inventoryStock = item;
        modalRef.componentInstance.warehouseID = Number(this.warehouseId);

        modalRef.result.then(
          (result) => {
            this.onSearch();
          },
          () => {
            // Modal dismissed
          }
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }
  //#endregion

  //#region Xóa
  onDeleted() {
    const angularGrid = this.angularGridInventory;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length <= 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn sản phẩm cần xóa!');
      return;
    }

    const ids = selectedRows
      .filter((row: any) => row.ID > 0)
      .map((row: any) => row.ID);

    // if (ids.length <= 0 && !this.appUserService.isAdmin) {
    //   this.notification.info(
    //     'Thông báo',
    //     'Không có sản phẩm hợp lệ để xóa! Chỉ người yêu cầu mới được xóa sản phẩm.'
    //   );
    //   return;
    // }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa các sản phẩm đã chọn không? Các sản phẩm không phải bạn yêu cầu sẽ tự động được bỏ qua.`,
      nzOnOk: () => {
        this.inventoryStockService.deletedInventory(ids).subscribe({
          next: (response: any) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Xóa sản phẩm thành công!'
            );
            this.onSearch();
          },
          error: (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              });
          },
        });
      },
    });
  }
  //#endregion

  //#region Xuất excel
  async exportToExcel() {
    if (!this.angularGridInventory || !this.angularGridInventory.dataView) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
      return;
    }

    const dataView = this.angularGridInventory.dataView;
    const slickGrid = this.angularGridInventory.slickGrid;
    const items = (dataView.getItems?.() as any[]) || [];

    if (!items || items.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.isLoadingInventory = true;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tồn kho yêu cầu');

      // Lấy columns hiển thị (không bao gồm checkbox)
      const runtimeColumns = (slickGrid?.getColumns?.() as any[]) || [];
      const columns = runtimeColumns.filter(
        (col: any) => col?.id !== '_checkbox_selector' && col?.hidden !== true
      );

      const headers = columns.map((col: any) => col?.name || col?.id);

      // Header row
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4D94FF' },
        };
        cell.font = {
          name: 'Times New Roman',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Lấy tất cả items bao gồm cả group headers
      const totalRows = (dataView as any).getLength?.() ?? 0;
      let sttCounter = 0; // Đếm STT cho data rows

      for (let i = 0; i < totalRows; i++) {
        const item = (dataView as any).getItem?.(i);
        if (!item) continue;

        // Kiểm tra nếu là group header
        if (item.__group) {
          const groupLevel = item.level || 0;
          const groupValue = item.value || 'Không xác định';
          const groupCount = item.count || 0;

          let groupText = '';
          let groupColor = 'FF008000'; // Màu xanh lá

          if (groupLevel === 0) {
            // Level 0: Kho
            groupText = `Kho: ${groupValue} (${groupCount} SP)`;
            groupColor = 'FFED502F'; // Màu đỏ
          } else if (groupLevel === 1) {
            // Level 1: Loại
            groupText = `  Loại: ${groupValue} (${groupCount} SP)`;
            groupColor = 'FF2B4387'; // Màu xanh dương
          }

          const groupRow = worksheet.addRow([groupText]);
          groupRow.font = {
            name: 'Times New Roman',
            size: 11,
            bold: true,
            color: { argb: groupColor },
          };
          groupRow.alignment = { horizontal: 'left', vertical: 'middle' };

          // Merge cells cho group header
          worksheet.mergeCells(
            groupRow.number,
            1,
            groupRow.number,
            headers.length
          );

          groupRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          // Reset STT counter cho mỗi group level 1
          if (groupLevel === 1) {
            sttCounter = 0;
          }

          continue;
        }

        // Kiểm tra nếu là group totals
        if (item.__groupTotals) {
          continue; // Bỏ qua group totals
        }

        // Data row thông thường
        sttCounter++;
        const rowData = columns.map((col: any, colIndex: number) => {
          const field = col?.field;

          // STT column
          if (colIndex === 0 || field === 'rowNumber') {
            return sttCounter;
          }

          const value = field ? item[field] : undefined;

          // Format số cho các cột số
          const numericFields = [
            'TotalQuantity',
            'TotalQuantityLast',
            'Quantity',
          ];
          if (numericFields.includes(String(field || ''))) {
            return value !== null && value !== undefined ? Number(value) : 0;
          }

          return value !== null && value !== undefined ? value : '';
        });

        const excelRow = worksheet.addRow(rowData);
        excelRow.font = {
          name: 'Times New Roman',
          size: 10,
        };

        // Kiểm tra nếu là dòng "Không đủ" để tô màu
        const isNotEnough = Number(item?.IsEnough) === 0;
        if (isNotEnough) {
          excelRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFDFFAB' }, // Màu vàng nhạt
            };
          });
        }

        excelRow.eachCell((cell, colNumber) => {
          const col = columns[colNumber - 1] || null;

          let alignment: any = {
            vertical: 'middle',
            wrapText: true,
          };

          // STT căn giữa
          if (colNumber === 1) {
            alignment.horizontal = 'center';
          }
          // Số căn phải
          else if (
            col?.cssClass?.includes('text-right') ||
            ['TotalQuantityEnough', 'QuantityUse', 'Quantity'].includes(
              col?.field
            )
          ) {
            alignment.horizontal = 'right';
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          }
          // Chữ căn trái
          else {
            alignment.horizontal = 'left';
          }

          cell.alignment = alignment;
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }

      // Thêm footer row với tổng
      const filteredItems =
        ((dataView as any).getFilteredItems?.() as any[]) || (items as any[]);
      const onlyDataItems = (filteredItems || []).filter(
        (it: any) => !it?.__group && !it?.__groupTotals
      );

      const numericFields = ['TotalQuantity', 'TotalQuantityLast', 'Quantity'];
      const footerData = columns.map((col: any, idx: number) => {
        const field = col?.field;
        if (idx === 0) return 'Tổng';

        if (numericFields.includes(String(field || ''))) {
          return (onlyDataItems || []).reduce(
            (sum: number, it: any) => sum + (Number(it?.[field]) || 0),
            0
          );
        }

        // Đếm số sản phẩm cho cột ProductCode
        if (field === 'ProductCode') {
          return `${onlyDataItems.length} SP`;
        }

        return '';
      });

      const footerRow = worksheet.addRow(footerData);
      footerRow.font = {
        name: 'Times New Roman',
        size: 11,
        bold: true,
      };
      footerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' },
        };

        if (colNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (typeof cell.value === 'number') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Set column widths
      worksheet.columns.forEach((column: any, index: number) => {
        const col = columns[index];
        const w = Number(col?.width) || 120;
        column.width = Math.max(10, Math.min(50, Math.round(w / 8)));
      });

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}${today.getFullYear()}`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `DanhSachTonKho_${this.warehouseCode}_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.notification.success('Thành công', 'Xuất Excel thành công!');
      this.isLoadingInventory = false;
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error('Lỗi', 'Lỗi khi xuất file Excel!');
      this.isLoadingInventory = false;
    }
  }
  //#endregion

  //#region Nhập excel
  onImportExcel() {
    const modalRef = this.modalService.open(
      InventoryStockImportExcelComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl',
      }
    );
    modalRef.componentInstance.warehouseId = this.warehouseId;

    modalRef.result.then(
      (result) => {
        this.onSearch();
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onInventoryStockLog() {
    const angularGrid = this.angularGridInventory;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item && !item.__group && !item.__groupTotals);

    if (selectedRows.length !== 1) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 sản phẩm để xem lịch sử thao tác!');
      return;
    }

    const item = selectedRows[0];
    const modalRef = this.modalService.open(
      InventoryStockLogComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
      }
    );
    modalRef.componentInstance.inventoryId = Number(item.ID);
    modalRef.componentInstance.productCode = item.ProductCode;
    modalRef.componentInstance.productName = item.ProductName;
  }

  getDataProductGroupWareHouse(id: number) {
    const sub = this.inventorySV.getPGWH(id, this.warehouseCode).subscribe({
      next: (res) => {
        if (res?.data) {
          this.dataPGWareHouse = res.data;

          // Map data với id unique cho SlickGrid
          const mappedData = this.dataPGWareHouse.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
          }));

          this.datasetPGWarehouse = mappedData;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }
  //#endregion
}
