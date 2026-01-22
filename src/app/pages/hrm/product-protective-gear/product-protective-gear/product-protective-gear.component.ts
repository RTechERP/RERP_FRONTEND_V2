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
    AngularSlickgridModule,
    Menubar,
    NzModalModule,
    NzFormModule,
    SharedModule
  ],
  selector: 'app-product-protective-gear',
  templateUrl: './product-protective-gear.component.html',
  styleUrls: ['./product-protective-gear.component.css']
})
export class ProductProtectiveGearComponent implements OnInit {
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
  selectedGroupRows: any[] = []; // selected rows for product group (mirrors product-location-tech pattern)
  selectedProductRTCRow: any = null;
  selectedProductRTCRows: any[] = []; // Danh sách các row đã chọn
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number = 5;
  isSearchVisible: boolean = false;
  isDetailLoad: boolean = false;
  productGroupData: any[] = [];
  productRTCData: any[] = [];

  // Angular Slickgrid instances
  angularGridProductGroup!: AngularGridInstance;
  angularGridProductRTC!: AngularGridInstance;

  // Column definitions
  columnDefinitionsProductGroup: Column[] = [];
  columnDefinitionsProductRTC: Column[] = [];

  // Grid options
  gridOptionsProductGroup: GridOption = {};
  gridOptionsProductRTC: GridOption = {};

  // Datasets
  datasetProductGroup: any[] = [];
  datasetProductRTC: any[] = [];

  isLoading = false;
  isMobile = window.innerWidth <= 768;
  isShowModal = false;
  param: any = {
    keyword: ''
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
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission(""),
        command: () => {
          this.onCreate();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission(""),
        command: () => {
          this.onEdit();
        }
      },

      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission(""),
        command: () => {
          this.onDelete();
        }
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
  onCreate() {
    const modalRef = this.modalService.open(ProductProtectiveGearDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.productProtectiveGear = new ProductProtectiveGear();
    modalRef.componentInstance.wareHouseType = this.selectedRow?.WarehouseType;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Reset product selection after adding
          this.selectedProductRTCRows = [];
          this.selectedProductRTCRow = null;
          if (this.angularGridProductRTC && this.angularGridProductRTC.slickGrid) {
            this.angularGridProductRTC.slickGrid.setSelectedRows([]);
          }

          // Refresh grid after save
          if (this.selectedRow && this.selectedRow.ID) {
            this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
          }
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công');
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  onEdit() {
    if (!this.selectedProductRTCRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm cần sửa');
      return;
    }

    const modalRef = this.modalService.open(ProductProtectiveGearDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.productProtectiveGear = { ...this.selectedProductRTCRow };
    modalRef.componentInstance.wareHouseType = this.selectedRow.WarehouseType;
    modalRef.result.then(
      (result) => {
        if (result) {
          // Reset product selection after update
          this.selectedProductRTCRows = [];
          this.selectedProductRTCRow = null;
          if (this.angularGridProductRTC && this.angularGridProductRTC.slickGrid) {
            this.angularGridProductRTC.slickGrid.setSelectedRows([]);
          }

          this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công');
        }
      },

      (reason) => {
        // Modal dismissed
      }
    );
  }

  onDelete() {
    if (!this.selectedProductRTCRows || this.selectedProductRTCRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một sản phẩm cần xóa');
      return;
    }

    const count = this.selectedProductRTCRows.length;
    const productNames = this.selectedProductRTCRows
      .map(row => row.ProductName || row.ProductCode || `ID: ${row.ID}`)
      .slice(0, 3)
      .join(', ');
    const moreText = count > 3 ? ` và ${count - 3} sản phẩm khác` : '';

    this.nzModalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${count} sản phẩm đã chọn?<br><strong>${productNames}${moreText}</strong>`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.deleteSelectedProducts();
      }
    });
  }

  deleteSelectedProducts() {
    if (!this.selectedProductRTCRows || this.selectedProductRTCRows.length === 0) {
      return;
    }

    const itemsToDelete = this.selectedProductRTCRows;
    let deleteCount = 0;
    let errorCount = 0;
    const totalItems = itemsToDelete.length;
    const wareHouseType = this.selectedRow?.WarehouseType || 0;

    itemsToDelete.forEach((item: any) => {
      const deleteData = {
        ...item,
        IsDeleted: true,
        IsDelete: true
      };

      this.ProductProtectiveGearService.postSaveData(deleteData, wareHouseType).subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            deleteCount++;
          } else {
            errorCount++;
          }

          // Kiểm tra xem đã xử lý xong tất cả items chưa
          if (deleteCount + errorCount === totalItems) {
            this.selectedProductRTCRows = [];
            this.selectedProductRTCRow = null;

            // Refresh grid
            if (this.selectedRow && this.selectedRow.ID) {
              this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
            }

            if (deleteCount > 0) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${deleteCount} sản phẩm!`);
            }
            if (errorCount > 0) {
              this.notification.warning(NOTIFICATION_TITLE.warning, `Có ${errorCount} sản phẩm xóa không thành công`);
            }
          }
        },
        error: (error: any) => {
          errorCount++;

          // Kiểm tra xem đã xử lý xong tất cả items chưa
          if (deleteCount + errorCount === totalItems) {
            this.selectedProductRTCRows = [];
            this.selectedProductRTCRow = null;

            // Refresh grid
            if (this.selectedRow && this.selectedRow.ID) {
              this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
            }

            if (deleteCount > 0) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${deleteCount} sản phẩm!`);
            }
            if (errorCount > 0) {
              this.notification.error(NOTIFICATION_TITLE.error, `Có ${errorCount} sản phẩm xóa không thành công`);
            }
          }
        }
      });
    });
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  getProductGroup() {
    this.ProductProtectiveGearService
      .getProductGroup()
      .subscribe((response: any) => {
        const data = response.data || [];
        console.log('data', data);
        this.productGroupData = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID
        }));
        this.datasetProductGroup = this.productGroupData;
        if (this.datasetProductGroup.length > 0) {
          const firstRow = this.datasetProductGroup[0];
          console.log(firstRow);
          // Use the grid selection to trigger the same selection logic as when user clicks a row
          setTimeout(() => {
            if (this.angularGridProductGroup && this.angularGridProductGroup.slickGrid) {
              this.angularGridProductGroup.slickGrid.setSelectedRows([0]);
            } else {
              // Fallback behavior
              this.selectedRow = firstRow;
              this.getProductRTC(firstRow.ID, this.filterText, this.warehouseID);
            }
          }, 50);
        }
      });
  }

  getProductRTC(ProductGroupID: number, Keyword: string, WarehouseID: number) {
    this.isDetailLoad = true;
    this.ProductProtectiveGearService
      .getProductRTC(ProductGroupID, Keyword, WarehouseID)
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
        id: 'ProductGroupRTCID',
        name: 'ProductGroupRTCID',
        field: 'ProductGroupRTCID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'UnitCountID',
        name: 'UnitCountID',
        field: 'UnitCountID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'ProductLocationID',
        name: 'ProductLocationID',
        field: 'ProductLocationID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },
      {
        id: 'FirmID',
        name: 'FirmID',
        field: 'FirmID',
        sortable: true,
        filterable: true,
        width: 0,
        minWidth: 0,
        maxWidth: 0,
        hidden: true,
        excludeFromColumnPicker: true, // ẩn khỏi column picker
      },

      {
        id: 'ProductGroupNo',
        name: 'Mã Nhóm',
        field: 'ProductGroupNo',
        sortable: true,
        filterable: true,
        width: 80,
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
      enableSorting: true,
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: false,
      multiSelect: false,
      enableGridMenu: false,
      enableAutoResize: true,
      // gridHeight: 765,
      gridWidth: '100%',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      autoResize: {
        container: '.grid-container-detail-special',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
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
        id: 'Size',
        name: 'Size',
        field: 'Size',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'LocationName',
        name: 'Vị trí(Hộp)',
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
      {
        id: 'LocationImg',
        name: 'Ảnh',
        field: 'LocationImg',
        sortable: true,
        filterable: true,
        width: 150,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CreateDate',
        name: 'Ngày tạo',
        field: 'CreateDate',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        sortable: true,
        filterable: true,
        width: 120,
        filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptionsProductRTC = {
      enableAutoResize: true,
      enableSorting: true,
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      multiSelect: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      autoHeight: false,
      // gridHeight: 765,
      gridWidth: '100%',
      enablePagination: false,
      // enableColumnReorder: true,
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
    this.ProductProtectiveGearService.getProductGroup().subscribe({
      next: (response) => {
        this.datasetProductGroup = response.data;
        this.datasetProductGroup = this.datasetProductGroup.map((x, i) => ({
          ...x,
          id: x.ID
        }));

        this.updateFilterCollections(this.angularGridProductGroup, this.datasetProductGroup);
        this.rowStyle(this.angularGridProductGroup);


        const columnElement = this.angularGridProductGroup.slickGrid?.getFooterRowColumn('Code');
        if (columnElement) {
          columnElement.textContent = `${this.formatNumber(this.datasetProductGroup.length, 0)}`;
        }

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

  handleProductGroupRowSelection(event: any, args: any): void {
    const rows = args.rows;
    if (rows && rows.length > 0) {
      // Map selected indexes to actual items using the grid DataView (works with filtering/sorting)
      this.selectedGroupRows = rows.map((rowIndex: number) => {
        if (this.angularGridProductGroup?.dataView && typeof this.angularGridProductGroup.dataView.getItem === 'function') {
          return this.angularGridProductGroup.dataView.getItem(rowIndex);
        }
        return this.datasetProductGroup[rowIndex];
      }).filter((item: any) => item != null);

      // Use first selected item as active selection
      this.selectedRow = this.selectedGroupRows.length > 0 ? this.selectedGroupRows[0] : null;

      if (this.selectedRow && this.selectedRow.ID) {
        this.getProductRTC(this.selectedRow.ID, this.filterText, this.warehouseID);
      }

      console.log(`Selected ${this.selectedGroupRows.length} group row(s):`, this.selectedGroupRows);
    } else {
      // No selection
      this.selectedGroupRows = [];
      this.selectedRow = null;
      this.datasetProductRTC = [];
      this.selectedProductRTCRows = [];
      this.selectedProductRTCRow = null;
    }
  }


  handleProductRTCRowSelection(event: any, args: any): void {
    const rows = args.rows;
    if (rows && rows.length > 0) {
      // Lấy tất cả các row đã chọn
      this.selectedProductRTCRows = rows.map((rowIndex: number) => {
        return this.angularGridProductRTC.dataView.getItem(rowIndex);
      }).filter((item: any) => item != null);

      // Lấy row đầu tiên để hiển thị/edit (nếu cần)
      if (this.selectedProductRTCRows.length > 0) {
        this.selectedProductRTCRow = this.selectedProductRTCRows[0];
      } else {
        this.selectedProductRTCRow = null;
      }

      console.log(`Selected ${this.selectedProductRTCRows.length} row(s):`, this.selectedProductRTCRows);
    } else {
      // Không có row nào được chọn
      this.selectedProductRTCRows = [];
      this.selectedProductRTCRow = null;
    }
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

    // this.gridData.invalidate();
    // this.gridData.render();

    // this.gridDataSpecial.invalidate();
    // this.gridDataSpecial.render();
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
}
