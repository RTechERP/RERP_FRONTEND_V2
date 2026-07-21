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
  Formatter,
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


interface ProductSale {
  ID?: number;
  IsStandardized: boolean;
}

@Component({
  selector: 'app-product-sale-standardized',
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
  templateUrl: './product-sale-standardized.component.html',
  styleUrl: './product-sale-standardized.component.css'
})
export class ProductSaleStandardizedComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private notify: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private modal: NzModalService,
    private appUserService: AppUserService,
    private productsaleService: ProductsaleServiceService

  ) { }

  newProductSale: ProductSale = {
    IsStandardized: false,
  };

  shouldShowSearchBar: boolean = true;
  productSaleMenu: MenuItem[] = [];

  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  productSalesData: any[] = [];
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

  ngOnInit(): void {
    this.tableId = this.generateUUIDv4();
    this.loadMenu();
    this.initGridColumns();
    this.initGridOptions();
    this.onLoadData();
  }

  ngAfterViewInit(): void {

  }

  loadMenu() {
    this.productSaleMenu = [
      // {
      //   label: 'Thêm sản phẩm',
      //   icon: 'fa fa-plus text-success',
      //   visible: this.appUserService.isAdmin,
      //   command: () => {
      //     this.openModalProductSale();
      //   },
      // },
      {
        label: 'Chuẩn hóa',
        icon: 'fa-solid fa-check text-success',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.onStandardizedProductSale(true);
        },
      },
      {
        label: 'Bỏ chuẩn hóa',
        icon: 'fa-solid fa-x text-danger',
        visible: this.appUserService.isAdmin,
        command: () => {
          this.onStandardizedProductSale(false);
        },
      },
      // {
      //   label: 'Chuẩn hóa nhập/xuất',
      //   icon: 'fa-solid fa-arrows-turn-to-dots text-primary',
      //   visible: this.appUserService.isAdmin,
      //   command: () => {
      //     this.onLoadData();
      //   },
      // },
    ];
  }

  onLoadData() {
    this.isLoading = true;
    this.productsaleService.getdataProductSaleNew()
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.productSalesData = (
              Array.isArray(res.data) ? res.data : []
            ).map((item: any, index: number) => ({
              ...item,
              id: item.ID || `product_${index}_${Date.now()}`,
            }));
          }
          setTimeout(() => {
            this.updateMasterFooterRow();
            this.angularGridMaster.slickGrid.invalidate();
            this.angularGridMaster.slickGrid.render();
          }, 100);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
          this.isLoading = false;
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
        id: 'IsStandardized',
        name: 'Chuẩn hóa',
        field: 'IsStandardized',
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
      // {
      //   id: 'ProductGroupName',
      //   name: 'Tên nhóm',
      //   field: 'ProductGroupName',
      //   width: 120,
      //   sortable: false,
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      //   customTooltip: {
      //     useRegularTooltip: true,
      //   },
      //   formatter: this.wrapTextFormatter,
      // },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã Sản phẩm',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
      },

      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên Sản phẩm',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: this.wrapTextFormatter,
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
        this.productSalesData;

      // Đếm số lượng ProductGroupID
      const productGroupCount = (items || []).filter(
        (item) => item.ProductCode
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
        if (col.id === 'ProductCode') {
          footerCell.innerHTML = `<b>${productGroupCount}</b>`;
        }
      });
    }
  }

  openModalProductSale() {
    // const modalRef = this.ngbModal.open(ProductGroupDetailComponent, {
    //   centered: true,
    //   size: 'lg',
    //   backdrop: 'static',
    //   keyboard: false,
    // });
    // modalRef.componentInstance.newProductGroup = this.newProductGroup;
    // modalRef.componentInstance.isCheckmode = false;
    // modalRef.componentInstance.id = 0;

    // modalRef.result.catch((result) => {
    //   if (result === true) {
    //     this.onLoadData();
    //   }
    // });
  }

  onStandardizedProductSale(IsStandardized: boolean) {
    const selectedRows = this.angularGridMaster.gridService.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notify.warning('Vui lòng chọn sản phẩm', '');
      return;
    }

    const selectedItems = selectedRows
      .map((idx: number) => this.angularGridMaster.dataView.getItem(idx))
      .filter((item: any) => item && !item.__group && !item.__groupTotals);

    this.modal.confirm({
      nzTitle: `Xác nhận ${IsStandardized ? 'chuẩn hóa' : 'bỏ chuẩn hóa'}`,
      nzContent: `Bạn có chắc muốn ${IsStandardized ? 'chuẩn hóa' : 'bỏ chuẩn hóa'} danh sách sản phẩm đã chọn không?`,
      nzOkText: 'Xác nhận',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        debugger;
        const updateData = selectedItems
          .filter((row: any) => row.IsStandardized === !IsStandardized || row.IsStandardized === null)
          .map((row: any) => ({
            ID: row.ID ?? 0,
            IsStandardized: IsStandardized,
          }));

        if (updateData.length === 0) {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có sản phẩm hợp lệ để cập nhật!');
          return;
        }

        this.isLoading = true;
        this.productsaleService.standardizeProductGroup(updateData).subscribe({
          next: (_res: any) => {
            this.isLoading = false;
            this.notify.success(NOTIFICATION_TITLE.success, `Đã ${IsStandardized ? 'chuẩn hóa' : 'bỏ chuẩn hóa'} thành công ${updateData.length} sản phẩm`);
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
