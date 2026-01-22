import * as ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { MenuItem, PrimeIcons, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnEventArgs,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { PermissionService } from '../../../../services/permission.service';
import { NzModalModule, NzModalService } from "ng-zorro-antd/modal";
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductProtectiveGearDetailComponent } from '../product-protective-gear-detail/product-protective-gear-detail.component';
import { ProductProtectiveGear } from '../model/product-protective-gear';

@Component({
  standalone: true,
  imports: [
    CommonModule,
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
    NzSpinModule,
    HasPermissionDirective,
    AngularSlickgridModule,
    Menubar,
    NzModalModule,
    NzFormModule,
    SharedModule
  ],
  selector: 'app-inventory-demo-protective-gear',
  templateUrl: './inventory-demo-protective-gear.component.html',
  styleUrls: ['./inventory-demo-protective-gear.component.css']
})
export class InventoryDemoProtectiveGearComponent implements OnInit {

  constructor(
    private notification: NzNotificationService,
    private ProductProtectiveGearService: ProductProtectiveGearService,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private nzModalService: NzModalService
  ) { }
  menuBars: MenuItem[] = [];
  selectedRow: any = null;
  selectedProductRTCRow: any = null;
  selectedProductRTCRows: any[] = []; // Danh sách các row đã chọn
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number = 5;
  isAdvandShow = true;
  isSearchVisible: boolean = false;
  isDetailLoad: boolean = false;
  productGroupData: any[] = [];
  productRTCData: any[] = [];
  angularGridProductGroup!: AngularGridInstance;
  angularGridProductRTC!: AngularGridInstance;
  columnDefinitionsProductGroup: Column[] = [];
  columnDefinitionsProductRTC: Column[] = [];
  gridOptionsProductGroup: GridOption = {};
  gridOptionsProductRTC: GridOption = {};
  datasetProductGroup: any[] = [];
  datasetProductRTC: any[] = [];
  isLoading = false;
  isMobile = window.innerWidth <= 768;
  isShowModal = true;
  param: any = {
    ProductGroupID: null,
    Keyword: null,
    WarehouseID: null,
    AllProduct: null,
  };

  ngOnInit() {
    this.initMenuBar();
    this.initProductGroupGrid();
    this.initProductRTCGrid();
    this.getProductGroup();
  }
  initMenuBar() {
    this.menuBars = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: this.permissionService.hasPermission(""),
        command: () => {
          this.onExportExcel();
        },
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
        // visible: this.permissionService.hasPermission(""),
        command: () => {
          this.getProductGroup();
        },
      },

    ]
  }
  onSearch(): void {
    if (this.selectedRow && this.selectedRow.ID) {
      this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
    }
  }
  onExportExcel() {
    this.exportExcel();
  }


  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  getProductGroup() {
    this.ProductProtectiveGearService
      .getProductGroupInventoryDemo()
      .subscribe((response: any) => {
        const data = response.data || [];
        this.productGroupData = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID
        }));
        this.datasetProductGroup = this.productGroupData;
        if (this.datasetProductGroup.length > 0) {
          const firstRow = this.datasetProductGroup[0];
          this.selectedRow = firstRow;
          this.getProductRTC(firstRow.ID, this.filterText, this.warehouseID);
          setTimeout(() => {
            if (this.angularGridProductGroup && this.angularGridProductGroup.slickGrid) {
              this.angularGridProductGroup.slickGrid.setSelectedRows([0]);
            }
          }, 50);
        }
      });
  }

  getProductRTC(ProductGroupID: number, Keyword: string, WarehouseID: number) {
    this.isDetailLoad = true;
    this.ProductProtectiveGearService
      .getProductRTCInventoryDemo(ProductGroupID, Keyword, WarehouseID)
      .subscribe({
        next: (response: any) => {
          if (response.status == 1) {
            const data = response.data || [];
            this.productRTCData = data.map((item: any, index: number) => ({
              ...item,
              id: item.ID
            }));
            this.datasetProductRTC = this.productRTCData;
          }
          this.isDetailLoad = false;
        },
        error: () => {
          this.isDetailLoad = false;
        }
      });
  }

  initProductGroupGrid(): void {
    this.columnDefinitionsProductGroup = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'NumberOrder',
        name: 'STT',
        field: 'NumberOrder',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductGroupNo',
        name: 'Mã Nhóm',
        field: 'ProductGroupNo',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductGroupName',
        name: 'Tên Nhóm',
        field: 'ProductGroupName',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsProductGroup = {
      enableAutoResize: true,
      enableSorting: true,
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: false,
      multiSelect: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      autoHeight: false,
      gridWidth: '100%',
      enablePagination: false,
      enableGridMenu: true,
      forceFitColumns: true,
      gridMenu: {
        hideExportCsvCommand: true,
        hideExportTextDelimitedCommand: true,
      },
    };
  }

  initProductRTCGrid(): void {
    this.columnDefinitionsProductRTC = [
      {
        id: 'ID',
        name: 'ID',
        field: 'ID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductName',
        name: 'Tên',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },

      {
        id: 'LocationName',
        name: 'Vị trí',
        field: 'LocationName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'UnitCountName',
        name: 'DVT',
        field: 'UnitCountName',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'NumberImport',
        name: 'SL nhập',
        field: 'NumberImport',
        sortable: true,
        filterable: true,
        width: 80,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
      },
      {
        id: 'NumberExport',
        name: 'SL xuất',
        field: 'NumberExport',
        sortable: true,
        filterable: true,
        width: 80,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
      },
      {
        id: 'NumberBorrowing',
        name: 'SL mượn',
        field: 'NumberBorrowing',
        sortable: true,
        filterable: true,
        width: 80,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
      },
      {
        id: 'InventoryReal',
        name: 'SL trong kho',
        field: 'InventoryReal',
        sortable: true,
        filterable: true,
        width: 80,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end',
      },

    ];

    this.gridOptionsProductRTC = {
      enableAutoResize: true,
      enableSorting: true,
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: false,
      multiSelect: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      autoHeight: false,
      gridWidth: '100%',
      enablePagination: false,
      enableGridMenu: true,
      forceFitColumns: true,
      gridMenu: {
        hideExportCsvCommand: true,
        hideExportTextDelimitedCommand: true,
      },
    };
  }

  loadProductGroup() {
    this.isLoading = true;
    this.ProductProtectiveGearService.getProductGroupInventoryDemo().subscribe({
      next: (response) => {
        this.datasetProductGroup = response.data;
        this.datasetProductGroup = this.datasetProductGroup.map((x, i) => ({
          ...x,
          id: x.ID
        }));
        this.updateFilterCollections(this.angularGridProductGroup, this.datasetProductGroup);
        this.rowStyle(this.angularGridProductGroup);

        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        this.isLoading = false;
      }
    })
  }
  angularGridProductGroupReady(angularGrid: any): void {
    this.angularGridProductGroup = angularGrid.detail;
  }

  angularGridProductRTCReady(angularGrid: any): void {
    this.angularGridProductRTC = angularGrid.detail;
  }


  private updateFilterCollections(angularGrid: AngularGridInstance, data: any[]): void {
    if (!angularGrid || !angularGrid.slickGrid) return;
    const columns = angularGrid.slickGrid.getColumns();
    // const allData = angularGrid.dataView?.getItems();
    const allData = data;

    // Helper function to get unique values for a field
    const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      allData.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // Update collections for each filterable column
    columns.forEach((column: any) => {
      if (column.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (field && field !== 'BorrowCustomer') {
          const collection = getUniqueValues(field);
          if (column.filter) {
            column.filter.collection = collection;
          }
        }
      }
    });


    // Update grid columns
    angularGrid.slickGrid.setColumns(columns);
    angularGrid.slickGrid.render();
  }


  rowStyle(angularGrid: AngularGridInstance) {
    angularGrid.dataView.getItemMetadata = this.rowStyleIsUrgent(angularGrid.dataView.getItemMetadata, angularGrid);

  }
  rowStyleIsUrgent(previousItemMetadata: any, angularGrid: AngularGridInstance) {
    const newCssClass = 'bg-isurgent';

    return (rowNumber: number) => {
      const item = angularGrid.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: '',
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (meta && item && item.IsUrgent) {
        meta.cssClasses = (meta.cssClasses || '') + '' + newCssClass;
      }

      return meta;
    };
  }

  formatNumber(num: number, digits: number = 2) {
    num = num || 0;
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  async exportExcel() {
    try {
      // Lấy dữ liệu từ grid (nếu có filter thì lấy filtered data)
      let data: any[] = [];
      if (this.angularGridProductRTC && this.angularGridProductRTC.dataView) {
        data = this.angularGridProductRTC.dataView.getItems();
      } else {
        data = this.datasetProductRTC;
      }

      if (!data || data.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Báo cáo tồn kho');

      // Lọc các cột cần export (bỏ cột hidden, ID, và các cột không cần thiết)
      const visibleColumns = this.columnDefinitionsProductRTC.filter(
        (col: Column) =>
          !col.hidden &&
          col.id !== 'ID' &&
          col.field &&
          col.field.trim() !== ''
      );

      // Tạo header
      const headers = [
        ...visibleColumns.map((col: Column) => col.name || col.id || col.field || '')
      ];
      const headerRow = worksheet.addRow(headers);

      // Format header row
      headerRow.font = { bold: true, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.height = 25;

      // Thêm dữ liệu
      data.forEach((row: any, index: number) => {
        const rowData = [
          ...visibleColumns.map((col: Column) => {
            const field = col.field as string;
            let value = row[field];

            // Format date
            if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
              value = new Date(value);
            }

            // Format số (nếu có formatter decimal)
            if (col.formatter === Formatters.decimal && value != null) {
              value = Number(value) || 0;
            }

            return value;
          })
        ];
        worksheet.addRow(rowData);
      });

      // Freeze header row
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      // Format date columns
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        row.eachCell((cell, colNumber) => {
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
          }
          // Format số
          const colIndex = colNumber - 1;
          if (colIndex >= 0 && colIndex < visibleColumns.length) {
            const col = visibleColumns[colIndex];
            if (col.formatter === Formatters.decimal && cell.value != null) {
              cell.numFmt = '#,##0';
            }
          }
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      });

      // Auto fit columns
      worksheet.columns.forEach((column: any, index: number) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        });
        // Đặt width tối thiểu và tối đa
        column.width = Math.max(Math.min(maxLength, 30), 10);
      });

      // Thêm auto filter
      worksheet.autoFilter = {
        from: {
          row: 1,
          column: 1
        },
        to: {
          row: 1,
          column: visibleColumns.length
        }
      };

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const formattedDate = new Date()
        .toISOString()
        .slice(0, 10)
        .split('-')
        .reverse()
        .join('');

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DanhSachTonKhoDoBaoHo_${formattedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + (error.message || 'Unknown error'));
    }
  }
}
