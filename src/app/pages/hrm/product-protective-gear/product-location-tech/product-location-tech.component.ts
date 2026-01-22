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
import { ProductLocationTechDetailComponent } from '../product-location-tech-detail/product-location-tech-detail.component';
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
  selector: 'app-product-location-tech',
  templateUrl: './product-location-tech.component.html',
  styleUrls: ['./product-location-tech.component.css']
})
export class ProductLocationTechComponent implements OnInit {

  constructor(
    private notification: NzNotificationService,
    private ProductProtectiveGearService: ProductProtectiveGearService,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private nzModalService: NzModalService) { }
  menuBars: MenuItem[] = [];
  selectedRow: any = null;
  selectedRows: any[] = [];
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number = 5;
  isSearchVisible: boolean = false;
  isDetailLoad: boolean = false;
  productLocationTechData: any[] = [];

  // Angular Slickgrid instances
  angularGridProductLocationTech!: AngularGridInstance;

  // Column definitions
  columnDefinitionsProductLocationTech: Column[] = [];

  // Grid options
  gridOptionsProductLocation: GridOption = {};

  // Datasets
  datasetProductLocation: any[] = [];

  isLoading = false;
  isMobile = window.innerWidth <= 768;
  isShowModal = false;
  param: any = {
    keyword: ''
  };
  ngOnInit() {
    this.initMenuBar();
    this.initProductLocationGrid();
    this.getProductLocation();
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

    ]
  }
  onSearch(): void {
    this.getProductLocation();
  }
  onCreate() {
    const modalRef = this.modalService.open(ProductLocationTechDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.warehouseID = this.warehouseID,
      // modalRef.componentInstance.warehouseType = this.warehouseType,
      modalRef.componentInstance.isEdit = false

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh grid after save
          this.getProductLocation();
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công');
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  onEdit() {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí cần sửa');
      return;
    }

    const modalRef = this.modalService.open(ProductLocationTechDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.productLocationTech = { ...this.selectedRow };
    modalRef.componentInstance.warehouseID = this.warehouseID,
      // modalRef.componentInstance.warehouseType = this.warehouseType,
      modalRef.componentInstance.isEdit = true
    modalRef.result.then(
      (result) => {
        if (result) {
          this.getProductLocation();
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công');
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  onDelete() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một vị trí cần xóa');
      return;
    }

    const count = this.selectedRows.length;
    const productNames = this.selectedRows
      .map(row => `Mã vị trí : ${row.LocationCode}`)
      .slice(0, 3)
      .join(', ');
    const moreText = count > 3 ? ` và ${count - 3} vị trí khác khác` : '';

    this.nzModalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${count} vị trí đã chọn?<br><strong>${productNames}${moreText}</strong>`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.deleteSelectedProducts();
      }
    });
  }

  deleteSelectedProducts() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      return;
    }

    const itemsToDelete = this.selectedRows;
    let deleteCount = 0;
    let errorCount = 0;
    const totalItems = itemsToDelete.length;
    itemsToDelete.forEach((item: any) => {
      const deleteData = {
        ...item,
        IsDeleted: true
      };

      this.ProductProtectiveGearService.saveProductLocation(deleteData).subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.getProductLocation();
            deleteCount++;
          } else {
            errorCount++;
          }

          // Kiểm tra xem đã xử lý xong tất cả items chưa
          if (deleteCount + errorCount === totalItems) {
            this.selectedRows = [];
            this.selectedRow = null;
            if (deleteCount > 0) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${deleteCount} vị trí!`);
            }
            if (errorCount > 0) {
              this.notification.warning(NOTIFICATION_TITLE.warning, `Có ${errorCount} vị trí xóa không thành công`);
            }
          }
        },
        error: (error: any) => {
          errorCount++;

          // Kiểm tra xem đã xử lý xong tất cả items chưa
          if (deleteCount + errorCount === totalItems) {
            this.selectedRows = [];
            this.selectedRow = null;

            // refresh grid
            this.getProductLocation();

            if (deleteCount > 0) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${deleteCount} vị trí!`);
            }
            if (errorCount > 0) {
              this.notification.error(NOTIFICATION_TITLE.error, `Có ${errorCount} vị trí xóa không thành công`);
            }
          }
        }
      });
    });
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  initProductLocationGrid(): void {
    this.columnDefinitionsProductLocationTech = [
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
        id: 'STT',
        name: 'STT',
        field: 'STT',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'LocationCode',
        name: 'Mã vị trí',
        field: 'LocationCode',
        sortable: true,
        filterable: true,
        width: 80,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'LocationName',
        name: 'Vị trí hiện tại',
        field: 'LocationName',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'OldLocationName',
        name: 'Vị trí cũ',
        field: 'OldLocationName',
        sortable: true,
        filterable: true,
        width: 100,
        filter: { model: Filters['compoundInputText'] },
      },
     
    ];

    this.gridOptionsProductLocation = {
      enableSorting: true,
      enableFiltering: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      multiSelect: true,
      enableAutoResize: true,
      enableGrouping: true,
      // gridHeight: 765,

      gridWidth: '100%',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableGridMenu: true,
      gridMenu: {
        hideExportCsvCommand: true,
        hideExportTextDelimitedCommand: true,
      },
    };
  }

  getProductLocation() {
    this.isLoading = true;
    this.ProductProtectiveGearService.getProductLocationTech().subscribe({
      next: (response) => {
        this.datasetProductLocation = response.data[0];
        this.datasetProductLocation = this.datasetProductLocation.map((x, i) => ({
          ...x,
          id: x.ID
        }));
        this.updateFilterCollections(this.angularGridProductLocationTech, this.datasetProductLocation);
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        this.isLoading = false;
      }
    })
  }
  angularGridProductGLocationReady(angularGrid: AngularGridInstance): void {
    this.angularGridProductLocationTech = angularGrid;
    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.setGrouping([
        {
          getter: 'LocationTypeText',
          formatter: (g: any) => {
            const locationTypeText = g.value;
            return `<span class="group-color-0" data-level="0">Loại: <strong>${locationTypeText}</strong>
                                </span></span>`;
          }
        }
      ]);
      //   angularGrid.dataView.setGrouping([
      //     {
      //       getter: (item: any) => item.LocationTypeText,
      //       formatter: (g: any) => `
      //   <span class="group-color-0">
      //     Loại: <strong>${g.value}</strong>
      //   </span>
      // `
      //     }
      //   ]);
    }
  }

  handleProductLocationRowSelection(event: any, args: any): void {
    const rows = args.rows;
    if (rows && rows.length > 0) {
      // Map selected row indexes to actual items using DataView when available
      this.selectedRows = rows.map((rowIndex: number) => {
        if (this.angularGridProductLocationTech?.dataView && typeof this.angularGridProductLocationTech.dataView.getItem === 'function') {
          return this.angularGridProductLocationTech.dataView.getItem(rowIndex);
        }
        return this.datasetProductLocation[rowIndex];
      }).filter((item: any) => item != null);

      // Pick the first selected item as the active selectedRow
      this.selectedRow = this.selectedRows.length > 0 ? this.selectedRows[0] : null;
    } else {
      // No selection
      this.selectedRows = [];
      this.selectedRow = null;
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
