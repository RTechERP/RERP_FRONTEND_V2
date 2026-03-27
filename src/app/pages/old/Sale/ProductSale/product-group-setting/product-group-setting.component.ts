import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
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
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { AppUserService } from '../../../../../services/app-user.service';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { DateTime } from 'luxon';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { ProductGroupDetailComponent } from '../product-group-detail/product-group-detail.component';

interface ProductGroup {
  ID?: number;
  ProductGroupID: string;
  ProductGroupName: string;
  IsVisible: boolean;
  EmployeeID: number;
  WareHouseID: number;
  ParentID: number;
}

@Component({
  selector: 'app-product-group-setting',
  imports: [
    CommonModule,
    AngularSlickgridModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzSplitterModule,
    FormsModule,
    NzSpinComponent,
    Menubar,
  ],
  templateUrl: './product-group-setting.component.html',
  styleUrl: './product-group-setting.component.css'
})
export class ProductGroupSettingComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private notify: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private modal: NzModalService,
    private appUserService: AppUserService,
    private productsaleService: ProductsaleServiceService

  ) { }

  newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0,
    ParentID: 0,
  };

  shouldShowSearchBar: boolean = true;
  productGroupMenu: MenuItem[] = [];
  warehouseId: number = 1;
  warehouses: any[] = [];
  productGroups: any[] = [];

  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  productGroupsData: any[] = [];
  angularGridMaster!: AngularGridInstance;

  tableId: any = this.generateUUIDv4();

  isLoading: boolean = false;

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngOnInit(): void {
    this.tableId = this.generateUUIDv4();
    this.loadLookups();
    this.loadMenu();
    this.initGridColumns();
    this.initGridOptions();
    this.onLoadData();
  }

  ngAfterViewInit(): void {

  }

  loadLookups() {
    this.productsaleService.getdataWareHouse().subscribe({
      next: (response: any) => {
        this.warehouses = response.data;
      },
      error: (err: any) => {
        this.notify.create(
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

  loadMenu() {
    this.productGroupMenu = [
      {
        label: 'Thêm nhóm mới',
        icon: 'fa fa-plus text-success',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.openModalProductGroup();
        },
      },
      {
        label: 'Hiển thị',
        icon: 'fa-solid fa-eye text-primary',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.onVisibleProductGroup(false);
        },
      },
      {
        label: 'Bỏ hiển thị',
        icon: 'fa-solid fa-eye-slash text-danger',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.onVisibleProductGroup(true);
        },
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-refresh',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.onLoadData();
        },
      },
    ];
  }

  onLoadData() {
    this.productsaleService.getdataProductGroupNew(this.warehouseId, false, false).subscribe({
      next: (response: any) => {
        this.productGroupsData = response.data.data.map((item: any) => {
          return {
            ...item,
            id: item.ID,
          };
        });

        setTimeout(() => {
          this.updateMasterFooterRow();
          this.angularGridMaster.slickGrid.invalidate();
          this.angularGridMaster.slickGrid.render();
        }, 100);

      },
      error: (err: any) => {
        this.notify.create(
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

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);

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
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'IsView',
        name: 'Hiển thị',
        field: 'IsView',
        cssClass: 'text-center',
        width: 80,
        sortable: false,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductGroupID',
        name: 'Mã nhóm',
        field: 'ProductGroupID',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductGroupName',
        name: 'Tên nhóm',
        field: 'ProductGroupName',
        width: 120,
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
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-product-group',
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

      enableAutoSizeColumns: false,
      autoFitColumnsOnFirstLoad: false,
      forceFitColumns: true,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
    };
  }

  updateMasterFooterRow() {
    if (this.angularGridMaster && this.angularGridMaster.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGridMaster.dataView?.getFilteredItems?.() as any[]) ||
        this.productGroupsData;

      // Đếm số lượng ProductGroupID
      const productGroupCount = (items || []).filter(
        (item) => item.ProductGroupID
      ).length;

      this.angularGridMaster.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = this.angularGridMaster.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGridMaster.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột ProductGroupID
        if (col.id === 'ProductGroupID') {
          footerCell.innerHTML = `<b>${productGroupCount}</b>`;
        }
      });
    }
  }

  openModalProductGroup() {
    const modalRef = this.ngbModal.open(ProductGroupDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductGroup = this.newProductGroup;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.id = 0;

    modalRef.result.catch((result) => {
      if (result === true) {
        this.onLoadData();
      }
    });
  }

  onVisibleProductGroup(isVisible: boolean) {
    const selectedRows = this.angularGridMaster.gridService.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notify.warning('Vui lòng chọn nhóm sản phẩm', '');
      return;
    }

    const selectedItems = selectedRows
      .map((idx: number) => this.angularGridMaster.dataView.getItem(idx))
      .filter((item: any) => item && !item.__group && !item.__groupTotals);

    let warehouseName = '';
    if (this.warehouses && this.warehouses.length > 0) {
      const warehouse = this.warehouses.find(
        (item) => item.ID === this.warehouseId
      );
      if (warehouse) {
        warehouseName = warehouse.WarehouseName;
      }
    }

    this.modal.confirm({
      nzTitle: `Xác nhận ${!isVisible ? 'Hiển thị' : 'Bỏ hiển thị'}`,
      nzContent: `Bạn có chắc muốn ${!isVisible ? 'hiển thị' : 'bỏ hiển thị'} danh sách nhóm sản phẩm đã chọn trong kho ${warehouseName} không?`,
      nzOkText: !isVisible ? 'Hiển thị' : 'Bỏ hiển thị',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updateData = selectedItems
          .filter((row: any) => row.IsView === isVisible ? 0 : 1)
          .map((row: any) => ({
            ID: 0,
            WarehouseID: this.warehouseId ?? null,
            ProductGroupID: row.ID ?? null,
            IsDeleted: isVisible,
          }));

        if (updateData.length === 0) {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có nhóm hợp lệ để cập nhật!');
          return;
        }

        this.isLoading = true;
        this.productsaleService.visibleProductGroup(updateData).subscribe({
          next: (_res: any) => {
            this.isLoading = false;
            this.notify.success(NOTIFICATION_TITLE.success, `Đã ${!isVisible ? 'hiển thị' : 'bỏ hiển thị'} thành công ${updateData.length} nhóm`);
            this.onLoadData();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.notify.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          },
        });
      },
    });
  }

}
