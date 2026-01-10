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
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';

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
import { NOTIFICATION_TITLE } from '../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';
import { AppUserService } from '../../../services/app-user.service';
import { InventoryProjectProductSaleLinkService } from './inventory-project-product-sale-link.service';
import { InventoryProjectProductSaleLinkDetailComponent } from './inventory-project-product-sale-link-detail/inventory-project-product-sale-link-detail.component';

@Component({
  selector: 'app-inventory-project-product-sale-link',
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
    NzSelectModule,
    NzDatePickerModule,
    NzSplitterModule,
    NzTreeSelectModule,
    NzDropDownModule,
    NgbModalModule,
    Menubar,
  ],
  templateUrl: './inventory-project-product-sale-link.component.html',
  styleUrl: './inventory-project-product-sale-link.component.css',
})
export class InventoryProjectProductSaleLinkComponent
  implements OnInit, AfterViewInit
{
  //#region Khai báo biến
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private inventoryProjectProductSaleLinkService: InventoryProjectProductSaleLinkService
  ) {}

  inventoryProjectProductSaleLinkMenu: MenuItem[] = [];
  productGroups: any[] = [];
  productGroupId: number = 0;
  keyWords: string = '';

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  dataset: any[] = [];

  isLoading: boolean = false;
  //#endregion

  //#region Hàm khởi tạo
  ngOnInit(): void {
    this.loadMenu();
    this.loadProductGroups();
    this.initAngularGrid();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.onSearch();
    }, 100);
  }

  loadMenu() {
    this.inventoryProjectProductSaleLinkMenu = [
      {
        label: 'Thêm vật tư',
        icon: 'fa fa-plus text-success',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.onAdd();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        visible: this.permissionService.hasPermission(''),
        command: () => {
          this.onDelete();
        },
      },
    ];
  }
  //#endregion

  //#region Load dữ liệu
  loadProductGroups() {
    this.inventoryProjectProductSaleLinkService.getProductGroups().subscribe({
      next: (response: any) => {
        this.productGroups = response.data;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhóm sản phẩm: ' + error.message
        );
      },
    });
  }

  onSearch() {
    this.isLoading = true;
    const productGroupID = this.productGroupId || 0;
    const keyWord = this.keyWords || '';
    this.inventoryProjectProductSaleLinkService
      .getAll(productGroupID, keyWord)
      .subscribe({
        next: (response: any) => {
          this.dataset = response.data;
          this.dataset = this.dataset.map((x, i) => ({
            ...x,
            id: i++,
          }));
          this.isLoading = false;
          setTimeout(() => {
            this.applyDistinctFilters();
            this.updateMasterFooterRow();
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách nhóm sản phẩm: ' + error.message
          );
        },
      });
  }
  //#endregion

  //#region Xử lý bảng
  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
        this.dataset;

      // Đếm số lượng Code
      const codeCount = (items || []).filter((item) => item.Code).length;

      //this.angularGrid.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột Code
        if (col.id === 'Code') {
          footerCell.innerHTML = `<b>${codeCount}</b>`;
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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

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

  initAngularGrid() {
    this.columnDefinitions = [
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã nhân viên',
        width: 120,
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
        id: 'FullName',
        field: 'FullName',
        name: 'Tên nhân viên',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 333,
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
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 999,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
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
        id: 'ProductGroupName',
        field: 'ProductGroupName',
        name: 'Tên nhóm',
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
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
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
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        minWidth: 100,
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
        id: 'CreatedBy',
        field: 'CreatedBy',
        name: 'Người tạo',
        minWidth: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'CreatedDate',
        field: 'CreatedDate',
        name: 'Ngày tạo',
        minWidth: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
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
        applySelectOnAllPages: false,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableHeaderMenu: false,
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ',',
      },

      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };
  }
  //#endregion

  //#region Chọn vật tư
  onAdd() {
    const modalRef = this.modalService.open(
      InventoryProjectProductSaleLinkDetailComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        size: 'xl',
      }
    );

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

  //#region Xóa vật tư
  onDelete() {
    const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();

    if (selectedIndexes.length <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn sản phẩm cần xóa!'
      );
      return;
    }

    const ids = this.angularGrid.slickGrid
      .getSelectedRows()
      .map((index: number) => this.angularGrid.dataView.getItem(index))
      .filter((item: any) => Number(item?.ID) > 0)
      .map((item: any) => Number(item.ID));

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa các vật tư đã chọn không?`,
      nzOnOk: () => {
        this.inventoryProjectProductSaleLinkService
          .deletedBillImportQC(ids)
          .subscribe({
            next: (response: any) => {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa vật tư thành công!'
              );
              this.onSearch();
            },
            error: (error: any) => {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Lỗi khi xóa phiếu: ' +
                  (error?.message || error?.error?.message)
              );
            },
          });
      },
    });
  }
  //#endregion
}
