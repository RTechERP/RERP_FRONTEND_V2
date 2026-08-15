import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AngularGridInstance,
  AngularSlickgridComponent,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { ActivatedRoute } from '@angular/router';

// Config
import {
  NOTIFICATION_TITLE,
  NOTIFICATION_TITLE_MAP,
  NOTIFICATION_TYPE_MAP,
  RESPONSE_STATUS,
} from '../../../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../services/permission.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { ProductSaleDetailComponent } from '../product-sale-detail/product-sale-detail.component';

@Component({
  selector: 'app-product-sale-new-approved',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridComponent,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NgbModalModule,
    Menubar,
  ],
  templateUrl: './product-sale-new-approved.component.html',
  styleUrl: './product-sale-new-approved.component.css',
})
export class ProductSaleNewApprovedComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  tooltipEl: HTMLDivElement | null = null;

  keyWords: string = '';
  isLoading: boolean = false;
  productSaleNewApprovedMenus: MenuItem[] = [];

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  excelExportService = new ExcelExportService();

  newProductSale: any = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
    IsFix: false,
  };
  isCheckmode: boolean = false;
  selectedList: any[] = [];
  idSale: number = 0;
  listLocation: any[] = [];
  listUnitCount: any[] = [];
  listProductGroupcbb: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadMenu();
    this.initAngularGrid();
    this.getdataUnit();
    this.getDataProductGroupCBB();
    
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.onSearch();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }

  getdataUnit() {
    this.productsaleService.getdataUnitCount().subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.listUnitCount = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy dữ liệu đơn vị tính:', err);
      },
    });
  }

  getDataProductGroupCBB() {
    this.productsaleService.getDataProductGroupcbb().subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy dữ liệu nhóm sản phẩm:', err);
      },
    });
  }

  loadMenu(): void {
    this.productSaleNewApprovedMenus = [
      {
        label: 'Sửa sản phẩm',
        visible: this.permissionService.hasPermission('N108'),
        icon: 'fa fa-pen text-success',
        command: () => {
          this.updateProductSale();
        },
      },
      {
        label: 'Duyệt sản phẩm',
        visible: this.permissionService.hasPermission('N108'),
        icon: 'fa fa-check text-success',
        command: () => {
          this.projectApprovedIsfix(true);
        },
      },
    ];
  }

  private decodeTokenIds(param: string): number[] {
    if (!param) return [];
    let raw = param.trim();
    if (!/^\d+(,\d+)*$/.test(raw)) {
      try {
        let base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
          base64 += '=';
        }
        raw = atob(base64);
      } catch (e) {
        console.error('Lỗi giải mã token IDs:', e);
      }
    }
    return raw
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
  }

  onSearch(): void {
    const idsParam =
      this.route.snapshot.queryParams['token'] ||
      this.route.snapshot.queryParams['ids'] ||
      this.route.snapshot.queryParams['productIds'];
    const targetIds = this.decodeTokenIds(idsParam || '');

    const idExistParam = this.route.snapshot.queryParams['idExist'];
    const existIds = this.decodeTokenIds(idExistParam || '');

    this.isLoading = true;
    this.productsaleService
      .getdataProductSalebyID(0, this.keyWords || '', true)
      .subscribe({
        next: (res: any) => {
          const data = res?.data || res || [];
          console.log('data', data);
          this.dataset = (Array.isArray(data) ? data : [])
            .filter((x: any) => {
              const isNotApproved = !x.IsApproved;
              const matchId =
                targetIds.length > 0
                  ? targetIds.includes(Number(x.ID || x.Id))
                  : true;
              return isNotApproved && matchId;
            })
            .map((x: any, i: number) => {
              const rowId = Number(x.ID || x.Id);
              return {
                ...x,
                id: x.ID || x.Id || `product_${i}`,
                isExistInWarehouse: existIds.includes(rowId),
              };
            });
          this.isLoading = false;
          setTimeout(() => {
            this.applyDistinctFilters();
          }, 300);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu sản phẩm: ' + (error.message || error)
          );
        },
      });
  }

  getSelectedRowsData(): any[] {
    if (!this.angularGrid?.slickGrid) return [];
    const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();
    return selectedIndexes
      .map((idx: number) => this.angularGrid.slickGrid.getDataItem(idx))
      .filter((item: any) => item && !item.__group);
  }

  projectApprovedIsfix(isApproved: boolean): void {
    const selectedData = this.getSelectedRowsData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn ít nhất 1 sản phẩm để ${isApproved ? 'duyệt' : 'hủy duyệt'}!`
      );
      return;
    }

    const filteredData = selectedData.filter(
      (row: any) => row.IsApproved != isApproved && (row.ID > 0 || row.Id > 0)
    );

    if (filteredData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Tất cả sản phẩm đã chọn đã ở trạng thái ${isApproved ? 'Đã duyệt' : 'Chưa duyệt'}!`
      );
      return;
    }

    const actionText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    this.modal.confirm({
      nzTitle: `Xác nhận ${actionText}`,
      nzContent: `Bạn có chắc chắn muốn ${actionText.toLowerCase()} cho ${filteredData.length} sản phẩm đã chọn không?`,
      nzOkText: actionText,
      nzCancelText: 'Hủy',
      nzOkDanger: !isApproved,
      nzOnOk: () => {
        const payload = filteredData.map((row: any) => ({
          ID: row.ID || row.Id,
          IsApproved: isApproved,
        }));

        this.isLoading = true;
        this.productsaleService.projectApprovedIsfix(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            if (
              res?.status === 1 ||
              res?.success ||
              res?.status === 'success'
            ) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `${actionText} thành công!`
              );
              this.onSearch();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                res?.message || `${actionText} thất bại!`
              );
            }
          },
          error: (err: any) => {
            this.isLoading = false;
            this.notification.create(
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

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Click vào cell chọn dòng
    angularGrid.slickGrid.onClick.subscribe((_e: any, args: any) => {
      const cols = angularGrid.slickGrid.getColumns();
      const colId = String(cols[args.cell]?.id ?? '');
      if (colId === '_checkbox_selector') return;
      angularGrid.slickGrid.setSelectedRows([args.row]);
    });

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.applyDistinctFilters();
      this.initDetailGridTooltip();
    }, 100);
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

  cleanXml(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
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

  excelBooleanFormatter: Formatter = (_row, _cell, value) => {
    if (value === true) return 'x';
    if (value === false) return '';
    return '';
  };

  initAngularGrid(): void {
    this.columnDefinitions = [
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
          options: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'ProductGroupType',
        field: 'ProductGroupType',
        name: 'Nhóm vật tư',
        width: 100,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          options: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'IsFix',
        field: 'IsFix',
        name: 'Tích xanh',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        filter: {
          model: Filters['singleSelect'],
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Có' },
            { value: false, label: 'Không' },
          ],
          options: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
        exportCustomFormatter: this.excelBooleanFormatter,
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
        formatter: (_r, _c, v, _cd, dataContext) => {
          if (!v) return '';
          if (dataContext?.isExistInWarehouse) {
            return `<div style="background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: 600;">${v}</div>`;
          }
          return v;
        },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
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
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
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
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'LocationName',
        field: 'LocationName',
        name: 'Vị trí',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        formatter: (_r, _c, v) => v,
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'Detail',
        field: 'Detail',
        name: 'Chi tiết nhập',
        width: 400,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: this.wrapTextFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 500,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: this.wrapTextFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.product-sale-new-approved-grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableSelection: true,
      selectionOptions: {
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
      frozenColumn: 3,
      rowHeight: 55,
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },
    };
  }

  private initDetailGridTooltip(): void {
    const gridContainer = this.elementRef.nativeElement.querySelector(
      '.product-sale-new-approved-grid-container'
    );
    if (!gridContainer) return;

    const tooltip = document.createElement('div');
    tooltip.style.cssText = [
      'display:none',
      'position:fixed',
      'z-index:99999',
      'background:#fff',
      'border:1px solid #d9d9d9',
      'border-radius:6px',
      'padding:8px 12px',
      'max-width:420px',
      'white-space:pre-wrap',
      'word-break:break-word',
      'line-height:1.6',
      'font-size:13px',
      'box-shadow:0 4px 16px rgba(0,0,0,0.15)',
      'pointer-events:auto',
      'user-select:text',
      '-webkit-user-select:text',
      'cursor:text',
    ].join(';');
    document.body.appendChild(tooltip);
    this.tooltipEl = tooltip;

    let isOverTooltip = false;
    let hideTimer: any = null;

    const showTooltip = (text: string, anchorEl: Element) => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      tooltip.textContent = text;
      tooltip.style.display = 'block';
      const rect = anchorEl.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + 420 > window.innerWidth)
        left = Math.max(8, window.innerWidth - 428);
      if (top + 150 > window.innerHeight) top = rect.top - 154;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    };

    const hideTooltip = () => {
      hideTimer = setTimeout(() => {
        if (!isOverTooltip) tooltip.style.display = 'none';
      }, 80);
    };

    tooltip.addEventListener('mouseenter', () => {
      isOverTooltip = true;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    });
    tooltip.addEventListener('mouseleave', () => {
      isOverTooltip = false;
      tooltip.style.display = 'none';
    });

    gridContainer.addEventListener('mouseover', (e: Event) => {
      const el = (e as MouseEvent).target as HTMLElement;
      const target = el.closest('[data-tooltip]') as HTMLElement | null;
      if (target) showTooltip(target.getAttribute('data-tooltip') || '', target);
    });

    gridContainer.addEventListener('mouseout', (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as Node | null;
      if (related && tooltip.contains(related)) return;
      hideTooltip();
    });
  }

  updateProductSale() {
    this.isCheckmode = true;
    const selectedRows = this.getSelectedRowsData();
    this.selectedList = selectedRows;
    const ids = this.selectedList.filter((item) => item.IsApproved != true).map((item) => item.ID || item.Id);

    if (ids.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 sản phẩm chưa được duyệt để sửa!'
      );
      return;
    }

    if (ids.length > 1) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chỉ chọn 1 sản phẩm để sửa!'
      );
      return;
    }

    this.idSale = ids[0];
    this.productsaleService.getDataProductSalebyID(this.idSale).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newProductSale = {
            ProductCode: data.ProductCode,
            ProductName: data.ProductName,
            Maker: data.Maker,
            Unit: data.Unit,
            NumberInStoreDauky: data.NumberInStoreDauky,
            NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
            ProductGroupID: data.ProductGroupID,
            LocationID: data.LocationID,
            FirmID: data.FirmID,
            Note: data.Note,
            IsFix:
              data.IsFix !== null && data.IsFix !== undefined
                ? data.IsFix
                : false,
          };

          this.productsaleService
            .getDataLocation(this.newProductSale.ProductGroupID)
            .subscribe({
              next: (locationRes: any) => {
                if (locationRes?.data) {
                  this.listLocation = Array.isArray(locationRes.data)
                    ? locationRes.data
                    : [];
                  this.openModalProductSale();
                }
              },
              error: (err: any) => {
                console.error('Lỗi khi tải dữ liệu location:', err);
                this.openModalProductSale();
              },
            });
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lấy thông tin sản phẩm!'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin!'
        );
        console.error(err);
      },
    });
  }

  openModalProductSale() {
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductSale = this.newProductSale;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.listLocation = this.listLocation;
    modalRef.componentInstance.listUnitCount = this.listUnitCount;
    modalRef.componentInstance.listProductGroupcbb = this.listProductGroupcbb;
    modalRef.componentInstance.selectedList = this.selectedList;
    modalRef.componentInstance.id = this.idSale;

    modalRef.result.then(
      () => this.onSearch(),
      () => this.onSearch()
    );
  }
}
