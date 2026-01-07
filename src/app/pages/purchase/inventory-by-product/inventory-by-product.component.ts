import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { InventoryByProductService } from './inventory-by-product-service/inventory-by-product.service';
import { MaterialDetailOfProductRtcComponent } from '../../old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { ChiTietSanPhamSaleComponent } from '../../old/Sale/chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';
import { WarehouseService } from '../../general-category/wearhouse/warehouse-service/warehouse.service';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
  FieldType,
  MultipleSelectOption,
} from 'angular-slickgrid';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzFormModule,
    NzSplitterModule,
    Menubar,
    AngularSlickgridModule,
  ],
  selector: 'app-inventory-by-product',
  templateUrl: './inventory-by-product.component.html',
  styleUrl: './inventory-by-product.component.css',
})
export class InventoryByProductComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  keyword: string = '';
  loading: boolean = false;

  inventoryProductMenu: MenuItem[] = [];

  angularGridMaster!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  inventoryByProductTable = 'inventoryByProductTable';

  dataSet: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private inventoryByProductService: InventoryByProductService,
    private warehouseService: WarehouseService,
    private menuEventService: MenuEventService,
    private cdr: ChangeDetectorRef
  ) {}
  //#endregion

  //#region Khởi tạo hàm
  ngOnInit(): void {
    this.loadMenu();
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.searchData();
      }, 100);
    }, 200);
  }

  loadMenu() {
    this.inventoryProductMenu = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        command: () => {
          this.exportToExcel();
        },
      },
    ];
  }
  //#endregion

  //#region Xử lý bảng
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    this.applyGrouping();

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 100);
  }

  private applyGrouping(): void {
    const angularGrid = this.angularGridMaster;
    if (!angularGrid || !angularGrid.dataView) return;

    angularGrid.dataView.setGrouping([
      {
        getter: 'WarehouseType',
        comparer: () => 0,
        formatter: (g: any) => {
          const warehouseType = g.value || 'Không xác định';
          return `Loại kho: <strong>${warehouseType}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
        },
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false,
      },
      {
        getter: 'WarehouseName',
        comparer: () => 0,
        formatter: (g: any) => {
          const warehouseName = g.value || 'Không xác định';
          return `Kho: <strong>${warehouseName}</strong> <span style="color:#2b4387; margin-left:0.5rem;">(${g.count} SP)</span>`;
        },
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false,
      },
    ]);

    angularGrid.dataView.refresh();
    angularGrid.slickGrid?.render();
  }

  private getRowNumberWithinWarehouseNameGroup(row: number): number {
    const angularGrid = this.angularGridMaster;
    const dv: any = angularGrid?.dataView as any;
    if (!dv || typeof dv.getItem !== 'function') return row + 1;

    const currentItem = dv.getItem(row);
    if (!currentItem || currentItem.__group || currentItem.__groupTotals)
      return 0;

    let groupHeaderIndex = -1;
    for (let i = row; i >= 0; i--) {
      const it = dv.getItem(i);
      if (it && it.__group && it.level === 1) {
        groupHeaderIndex = i;
        break;
      }
    }

    if (groupHeaderIndex < 0) return row + 1;

    let counter = 0;
    for (let i = groupHeaderIndex + 1; i <= row; i++) {
      const it = dv.getItem(i);
      if (!it || it.__group || it.__groupTotals) continue;
      counter++;
    }

    return counter;
  }

  //#region Cập nhật footer row
  updateMasterFooterRow() {
    if (this.angularGridMaster && this.angularGridMaster.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGridMaster.dataView?.getFilteredItems?.() as any[]) ||
        this.dataSet;

      // Đếm số lượng BillCode
      const billCodeCount = (items || []).filter(
        (item) => item.BillCode
      ).length;

      // Tính tổng cho các cột số có cssClass: 'text-end'
      const totals: { [key: string]: number } = {};

      // Lấy danh sách các cột có cssClass chứa 'text-end'
      const numericColumns = this.columnDefinitions
        .filter((col: any) => col.cssClass?.includes('text-end'))
        .map((col: any) => col.field);

      // Tính tổng cho từng cột
      numericColumns.forEach((field: string) => {
        totals[field] = (items || []).reduce(
          (sum, item) => sum + (Number(item[field]) || 0),
          0
        );
      });

      this.angularGridMaster.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = this.angularGridMaster.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGridMaster.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột BillCode
        if (col.id === 'BillCode') {
          footerCell.innerHTML = `<b>${billCodeCount} đơn hàng</b>`;
        }
        // Format số tiền cho các cột text-end
        else if (totals[col.field] !== undefined) {
          const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totals[col.field]);
          footerCell.innerHTML = `<b>${formattedValue}</b>`;
        } else {
          footerCell.innerHTML = '';
        }
      });
    }
  }
  //#endregion

  //#region Lọc giá trị
  applyDistinctFilters(): void {
    const angularGrid = this.angularGridMaster;
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
  //#endregion

  initGridColumns() {
    this.columnDefinitions = [
      {
        id: 'rowNumber',
        name: 'STT',
        field: 'rowNumber',
        cssClass: 'text-center',
        width: 80,
        sortable: false,

        formatter: (row: number) => {
          const stt = this.getRowNumberWithinWarehouseNameGroup(row);
          return stt > 0 ? String(stt) : '';
        },

        filterable: true,
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductGroupName',
        name: 'Tên nhóm',
        field: 'ProductGroupName',
        width: 200,
        sortable: false,
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },

        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'UnitName',
        name: 'ĐVT',
        field: 'UnitName',
        width: 80,
        sortable: false,
        filterable: true,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'InventoryTotal',
        name: 'Tồn thực tế',
        field: 'InventoryTotal',
        cssClass: 'text-end',
        width: 80,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'InventoryReal',
        name: 'Tồn cuối kỳ (Được sử dụng)',
        field: 'InventoryReal',
        cssClass: 'text-end',
        width: 90,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'NumberBorrowing',
        name: 'Đang mượn',
        field: 'NumberBorrowing',
        cssClass: 'text-end',
        width: 80,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'SupplierName',
        name: 'Tên Nhà cung cấp',
        field: 'SupplierName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
    ];
  }

  initGridOptions() {
    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-inventory-by-product-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },

      gridWidth: '100%',
      datasetIdPropertyName: 'id',

      //enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },

      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },

      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableGrouping: true,

      enableAutoSizeColumns: true,
      autoFitColumnsOnFirstLoad: true,

      contextMenu: {
        hideCloseButton: false,
        commandTitle: '',
        commandItems: [
          {
            command: 'detail',
            title: 'Chi tiết',
            iconCssClass: 'fa-solid fa-eye',
            positionOrder: 10,
            action: (_e, args) => {
              const rowData = (args as any)?.dataContext;
              if (!rowData || rowData.__group || rowData.__groupTotals) {
                this.notification.warning(
                  'Thông báo',
                  'Vui lòng chọn 1 dòng dữ liệu!'
                );
                return;
              }

              try {
                const r = (args as any)?.row;
                const c = (args as any)?.cell;
                if ((args as any)?.grid && typeof r === 'number') {
                  (args as any).grid.setActiveCell(r, c || 0);
                  (args as any).grid.setSelectedRows([r]);
                }
              } catch {
                // ignore
              }

              this.openDetail(rowData);
            },
          },
        ],
      },

      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };
  }
  //#endregion

  //#region Tìm kiếm
  searchData() {
    this.loading = true;
    this.inventoryByProductService
      .getInventoryByProduct(this.keyword)
      .subscribe({
        next: (response: any) => {
          const data = response.data || [];
          this.dataSet = data;
          this.dataSet = this.dataSet.map((x, index) => ({
            ...x,
            rowNumber: index + 1,
            id: index--,
          }));
          console.log(this.dataSet);
          this.loading = false;

          setTimeout(() => {
            this.applyGrouping();
            this.applyDistinctFilters();
            this.updateMasterFooterRow();
          }, 100);
        },
        error: (error: any) => {
          console.error('Lỗi khi tải dữ liệu:', error);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu tồn kho!'
          );
          this.loading = false;
        },
      });
  }
  //#endregion

  //#region Hàm xử lý
  openDetail(rowData: any): void {
    console.log(rowData);
    // Lấy các giá trị từ row được chọn
    const productID = rowData.ProductID || rowData.ID || 0;
    const warehouseType = rowData.WarehouseType || '';
    const warehouseName =
      rowData.WarehouseName || rowData.ProductGroupName || '';

    if (productID === 0) {
      this.notification.warning('Thông báo', 'Hãy chọn sản phẩm!');
      return;
    }

    // Gọi API để lấy warehouse theo tên
    this.warehouseService.getWareHouseByName(warehouseName).subscribe({
      next: (response: any) => {
        const warehouses = response?.data || response || [];
        if (!warehouses || warehouses.length === 0) {
          this.notification.error(
            'Lỗi',
            'Không tìm thấy kho với tên: ' + warehouseName
          );
          return;
        }

        const warehouse = Array.isArray(warehouses)
          ? warehouses[0]
          : warehouses;

        switch (warehouseType) {
          case 'Sale':
            this.openChiTietSanPhamSale(productID, warehouse, rowData);
            break;
          case 'Demo':
            this.openMaterialDetailOfProductRTC(productID, warehouse, rowData);
            break;
          default:
            this.notification.warning('Thông báo', 'Hãy chọn sản phẩm!');
            break;
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin kho:', error);
        this.notification.error('Lỗi', 'Không thể lấy thông tin kho!');
      },
    });
  }

  openChiTietSanPhamSale(
    productID: number,
    warehouse: any,
    rowData: any
  ): void {
    const numberDauKy = '0';
    const numberCuoiKy = String(rowData.InventoryTotal || 0);
    const warehouseCode = warehouse.WarehouseCode || '';
    const productName = rowData.ProductName || rowData.ProductCode || '';

    const title = `Chi tiết sản phẩm Sale: ${productName}`;
    const params = new URLSearchParams({
      productSaleID: String(productID || 0),
      wareHouseCode: warehouseCode,
      numberDauKy: String(numberDauKy || 0),
      numberCuoiKy: String(numberCuoiKy || 0),
    });

    //this.menuEventService.openNewTab(ChiTietSanPhamSaleComponent, title, data);
    window.open(
      `/chi-tiet-san-pham-sale?${params.toString()}`,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
  }

  openMaterialDetailOfProductRTC(
    productID: number,
    warehouse: any,
    rowData: any
  ): void {
    const productName = rowData.ProductName || '';
    const productCode = rowData.ProductCode || '';
    const numberDauKy = '0';
    const numberCuoiKy = String(rowData.InventoryTotal || 0);
    const importValue = '0';
    const exportValue = '0';
    const borrowing = String(rowData.NumberBorrowing || 0);
    const numberReal = String(rowData.InventoryReal || 0);
    const warehouseID = warehouse.ID || warehouse.Id || warehouse.id || 0;

    const title = `Chi tiết: ${productName || productCode}`;
    const params = new URLSearchParams({
      productRTCID1: String(productID || 0),
      warehouseID1: String(warehouseID || 1),
      ProductCode: productCode || '',
      ProductName: productName || '',
      NumberBegin: String(numberDauKy || 0),
      InventoryLatest: String(numberCuoiKy || 0),
      NumberImport: String(importValue || 0),
      NumberExport: String(exportValue || 0),
      NumberBorrowing: String(borrowing || 0),
      InventoryReal: String(numberReal || 0),
    });

    // this.menuEventService.openNewTab(
    //   MaterialDetailOfProductRtcComponent,
    //   title,
    //   data
    // );

    window.open(
      `/material-detail-of-product-rtc?${params.toString()}`,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
  }
  //#endregion

  //#region Xuất excel
  async exportToExcel() {
    if (!this.angularGridMaster || !this.angularGridMaster.dataView) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
      return;
    }

    const dataView = this.angularGridMaster.dataView;
    const slickGrid = this.angularGridMaster.slickGrid;
    const items = (dataView.getItems?.() as any[]) || [];

    if (!items || items.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.loading = true;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tồn kho theo sản phẩm');

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
          fgColor: { argb: 'FF1677FF' },
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

      for (let i = 0; i < totalRows; i++) {
        const item = (dataView as any).getItem?.(i);
        if (!item) continue;

        // Kiểm tra nếu là group header
        if (item.__group) {
          const groupLevel = item.level || 0;
          const groupValue = item.value || 'Không xác định';
          const groupCount = item.count || 0;

          let groupText = '';
          if (groupLevel === 0) {
            groupText = `Loại kho: ${groupValue} (${groupCount} SP)`;
          } else if (groupLevel === 1) {
            groupText = `  Kho: ${groupValue} (${groupCount} SP)`;
          }

          const groupRow = worksheet.addRow([groupText]);
          groupRow.font = {
            name: 'Times New Roman',
            size: 11,
            bold: true,
            color: { argb: groupLevel === 0 ? 'FF008000' : 'FF0000FF' },
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

          continue;
        }

        // Kiểm tra nếu là group totals
        if (item.__groupTotals) {
          continue; // Bỏ qua group totals nếu có
        }

        // Data row thông thường
        const rowData = columns.map((col: any) => {
          const field = col?.field;

          if (field === 'rowNumber') {
            const stt = this.getRowNumberWithinWarehouseNameGroup(i);
            return stt > 0 ? stt : '';
          }

          const value = field ? item[field] : undefined;

          // Format số
          if (
            ['InventoryTotal', 'InventoryReal', 'NumberBorrowing'].includes(
              String(field || '')
            )
          ) {
            return value !== null && value !== undefined ? Number(value) : 0;
          }

          return value !== null && value !== undefined ? value : '';
        });

        const excelRow = worksheet.addRow(rowData);
        excelRow.font = {
          name: 'Times New Roman',
          size: 10,
        };

        excelRow.eachCell((cell, colNumber) => {
          const col = columns[colNumber - 1] || null;

          let alignment: any = {
            vertical: 'middle',
            wrapText: true,
          };

          // STT căn giữa
          if (col?.field === 'rowNumber') {
            alignment.horizontal = 'center';
          }
          // Số căn phải
          else if (
            col?.field &&
            ['InventoryTotal', 'InventoryReal', 'NumberBorrowing'].includes(
              col.field
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

      const footerData = columns.map((col: any, idx: number) => {
        const field = col?.field;
        if (idx === 0) return 'Tổng';

        if (
          ['InventoryTotal', 'InventoryReal', 'NumberBorrowing'].includes(
            String(field || '')
          )
        ) {
          return (onlyDataItems || []).reduce(
            (sum: number, it: any) => sum + (Number(it?.[field]) || 0),
            0
          );
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

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ton-kho-theo-san-pham-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.notification.success('Thành công', 'Xuất Excel thành công!');
      this.loading = false;
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error('Lỗi', 'Lỗi khi xuất file Excel!');
      this.loading = false;
    }
  }
  //#endregion
}
