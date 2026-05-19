import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
  Input,
  Optional,
  Inject
} from '@angular/core';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import * as ExcelJS from 'exceljs';
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
  SortDirectionNumber,
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { AppUserService } from '../../../../../services/app-user.service';
import { MenuItem } from 'primeng/api';
import { DateTime } from 'luxon';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { ProjectPartlistPriceRequestService } from '../../../../old/project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';

import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../services/permission.service';

@Component({
  selector: 'app-purchase-quote-project-detail',
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
    Menubar
  ],
  templateUrl: './purchase-quote-project-detail.component.html',
  styleUrl: './purchase-quote-project-detail.component.css'
})
export class PurchaseQuoteProjectDetailComponent implements OnInit {
  constructor(
    @Optional() public activeModal: NgbActiveModal | null,
    private notify: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private modal: NzModalService,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private permissionService: PermissionService,
    private projectPartlistPriceRequestService: ProjectPartlistPriceRequestService,
    @Optional() @Inject('tabData') public tabData?: any
  ) { }

  shouldShowSearchBar: boolean = true;

  @Input() dateStart: any = '';
  @Input() dateEnd: any = '';
  @Input() employeeId: any = 0;
  @Input() status: any = 0;
  @Input() filterText: any = '';

  projectId: any = 0;

  projects: any[] = [];
  employees: any[] = [];

  isLoading: boolean = false;

  purchaseQuoteSummaryMenu: MenuItem[] = [];

  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  summaryData: any[] = [];
  isTBP: boolean = false;

  gridId: string = '';

  ngOnInit(): void {
    this.gridId = `gridSummaryPurchaseQuote-${this.generateUUIDv4()}`;
    if (this.tabData) {
      this.dateStart = this.tabData.dateStart || this.dateStart;
      this.dateEnd = this.tabData.dateEnd || this.dateEnd;
      this.employeeId = this.tabData.employeeId || this.employeeId;
    }

    this.isTBP = this.permissionService.hasPermission('N33,N1');
    if (!this.isTBP) {
      this.employeeId = this.appUserService.employeeID;
      //this.departmentId = this.appUserService.departmentID;
    }

    this.loadMenu();
    this.loadLookups();
    this.initGridColumns();
    this.initGridOptions();
    this.onSearch();
  }

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  loadMenu() {
    this.purchaseQuoteSummaryMenu = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        command: () => {
          this.ExportToExcelTab();
        },
      },
    ];
  }

  onSearch() {
    const dateStart = this.formatDateForAPI(this.dateStart);   // T00:00:00
    const dateEnd = this.formatDateEndForAPI(this.dateEnd);     // T23:59:59

    this.isLoading = true;
    this.projectPartlistPriceRequestService
      .getAllPartlistLocalSummary(
        dateStart,
        dateEnd,
        this.status,
        this.projectId ?? 0,
        this.filterText,
        this.employeeId ?? 0,
        0
      )
      .subscribe({
        next: (res) => {
          const rawData = res.data || [];
          this.processAndUpdateGrid(rawData);
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

    // this.projectPartlistPriceRequestService
    //   .getTypes(0, 0)
    //   .subscribe((response) => {
    //     const projectTypes = response.data?.dtType || [];

    //     let allRawData: any[] = [];
    //     let completedRequests = 0;
    //     const totalTypes = projectTypes.filter(
    //       (type: any) => Number(type.ProjectTypeID) > 0
    //     ).length;

    //     if (totalTypes === 0) {
    //       this.isLoading = false;
    //       this.summaryData = [];
    //       if (this.angularGridMaster && this.angularGridMaster.dataView) {
    //         this.angularGridMaster.dataView.setItems([]);
    //         this.angularGridMaster.dataView.refresh();
    //       }
    //       return;
    //     }

    //     projectTypes.forEach((type: any) => {
    //       const typeId = Number(type.ProjectTypeID);

    //       if (typeId > 0) {

    //       }
    //     });
    //   });
  }

  private processAndUpdateGrid(rawData: any[]) {
    // Map data với id unique và convert số
    const mappedData = rawData.map((item: any, index: number) => {
      const uniqueId =
        item.ID && Number(item.ID) > 0
          ? `id_${item.ID}`
          : `idx_${index}_${Date.now()}`;

      // Convert các trường số từ string sang number
      const numericFields = [
        'Quantity',
        'UnitPrice',
        'HistoryPrice',
        'TotalPrice',
        'TotalPriceExchange',
        'VAT',
        'TotaMoneyVAT',
        'UnitFactoryExportPrice',
        'UnitImportPrice',
        'TotalImportPrice',
        'TotalDayLeadTime',
        'CurrencyRate',
      ];

      const convertedItem = { ...item, id: uniqueId };
      numericFields.forEach((field) => {
        if (
          convertedItem[field] !== null &&
          convertedItem[field] !== undefined &&
          convertedItem[field] !== ''
        ) {
          convertedItem[field] = Number(convertedItem[field]) || 0;
        }
      });

      const booleanFields = ['IsDeleted', 'IsCheckPrice', 'IsImport'];
      booleanFields.forEach((field) => {
        const rawValue = convertedItem[field];
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          convertedItem[field] = false;
          return;
        }
        convertedItem[field] =
          rawValue === true ||
          rawValue === 1 ||
          rawValue === '1' ||
          rawValue === 'true' ||
          rawValue === 'True';
      });

      return convertedItem;
    });

    this.summaryData = mappedData;
    this.isLoading = false;

    if (this.angularGridMaster && this.angularGridMaster.dataView) {
      this.angularGridMaster.dataView.setItems(mappedData);

      // Phải set lại grouping sau khi setItems
      this.angularGridMaster.dataView.setGrouping({
        getter: 'ProjectCode',
        formatter: (g: any) => {
          const projectCode = g.value || 'Chưa có mã dự án';
          const firstItem = this.angularGridMaster.dataView.getItemByIdx(g.rows[0]);
          const projectName = firstItem?.ProjectFullName || '';
          const displayText = projectName ? `${projectName}` : projectCode;
          return `Dự án: ${displayText} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
        },
        comparer: (a: any, b: any) => {
          return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
        },
        collapsed: false,
      });

      this.angularGridMaster.dataView.refresh();
      this.angularGridMaster.slickGrid.invalidate();
      this.angularGridMaster.slickGrid.render();

      this.applyDistinctFilters();

      setTimeout(() => {
        this.updateFooterRow();
      }, 100);
    }
  }

  private applyDistinctFilters(): void {
    const angularGrid = this.angularGridMaster;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];

    // Nếu data rỗng, xóa hết filter collections
    if (!data || data.length === 0) {
      const columns = angularGrid.slickGrid.getColumns();
      if (columns) {
        columns.forEach((column: any) => {
          if (
            column.filter &&
            column.filter.model === Filters['multipleSelect']
          ) {
            column.filter.collection = [];
          }
        });
      }

      if (this.columnDefinitionsMaster) {
        this.columnDefinitionsMaster.forEach((colDef: any) => {
          if (
            colDef.filter &&
            colDef.filter.model === Filters['multipleSelect']
          ) {
            colDef.filter.collection = [];
          }
        });
      }

      const updatedColumns = angularGrid.slickGrid.getColumns();
      angularGrid.slickGrid.setColumns(updatedColumns);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
      return;
    }

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      let hasBlank = false;

      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') {
          hasBlank = true;
          return;
        }
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });

      const result = Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      // Thêm option "(Trống)" nếu có giá trị blank
      if (hasBlank) {
        result.unshift({ value: '', label: '(Trống)' });
      }

      return result;
    };

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];
    const booleanFields = new Set(['IsDeleted', 'IsCheckPrice', 'IsImport']);

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitionsMaster) {
      this.columnDefinitionsMaster.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }

  updateFooterRow() {
    if (this.angularGridMaster && this.angularGridMaster.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGridMaster.dataView?.getFilteredItems?.() as any[]) ||
        this.summaryData;

      // Đếm số lượng mã sản phẩm
      const productCodeCount = (items || []).filter(
        (item) => item.ProductCode
      ).length;

      // Tính tổng số lượng
      const totalQuantity = (items || []).reduce(
        (sum, item) => sum + (Number(item.Quantity) || 0),
        0
      );

      // Tính tổng các cột giá tiền
      const totalUnitPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitPrice) || 0),
        0
      );
      const totalPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPrice) || 0),
        0
      );
      const totalPriceExchange = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPriceExchange) || 0),
        0
      );
      const totalMoneyVAT = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotaMoneyVAT) || 0),
        0
      );
      const totalImportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalImportPrice) || 0),
        0
      );
      const totalHistoryPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.HistoryPrice) || 0),
        0
      );
      const totalVAT = (items || []).reduce(
        (sum, item) => sum + (Number(item.VAT) || 0),
        0
      );
      const totalDayLeadTime = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalDayLeadTime) || 0),
        0
      );
      const totalUnitFactoryExportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitFactoryExportPrice) || 0),
        0
      );
      const totalUnitImportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitImportPrice) || 0),
        0
      );

      this.angularGridMaster.slickGrid.setFooterRowVisibility(true);

      const columns = this.angularGridMaster.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGridMaster.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        switch (col.id) {
          case 'ProductCode':
            footerCell.innerHTML = `<b>${productCodeCount}</b>`;
            break;
          case 'Quantity':
            footerCell.innerHTML = `<b>${totalQuantity.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitPrice':
            footerCell.innerHTML = `<b>${totalUnitPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'HistoryPrice':
            footerCell.innerHTML = `<b>${totalHistoryPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalPrice':
            footerCell.innerHTML = `<b>${totalPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalPriceExchange':
            footerCell.innerHTML = `<b>${totalPriceExchange.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'VAT':
            footerCell.innerHTML = `<b>${totalVAT.toLocaleString('en-US')}</b>`;
            break;
          case 'TotaMoneyVAT':
            footerCell.innerHTML = `<b>${totalMoneyVAT.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalDayLeadTime':
            footerCell.innerHTML = `<b>${totalDayLeadTime.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitFactoryExportPrice':
            footerCell.innerHTML = `<b>${totalUnitFactoryExportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitImportPrice':
            footerCell.innerHTML = `<b>${totalUnitImportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalImportPrice':
            footerCell.innerHTML = `<b>${totalImportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          default:
            footerCell.innerHTML = '';
        }
      });
    }
  }

  loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
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
      }
    });

    this.projectPartlistPriceRequestService.getProject().subscribe({
      next: (response: any) => {
        this.projects = response.data;
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
      }
    });
  }

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    // Override getItemMetadata để tô màu dòng đã hủy
    const originalGetItemMetadata = angularGrid.dataView.getItemMetadata;
    angularGrid.dataView.getItemMetadata = (row: number) => {
      const item = angularGrid.dataView.getItem(row);
      if (item?.__group === true) {
        return originalGetItemMetadata
          ? originalGetItemMetadata.call(angularGrid.dataView, row)
          : null;
      }
      if (item?.IsDeleted === true) {
        return { cssClasses: 'row-deleted' };
      }
      return null;
    };

    if (angularGrid && angularGrid.dataView) {
      if (this.summaryData.length > 0) {
        angularGrid.dataView.setItems(this.summaryData);
      }

      angularGrid.dataView.setGrouping({
        getter: 'ProjectCode',
        formatter: (g: any) => {
          const projectCode = g.value || 'Chưa có mã dự án';
          const firstItem = angularGrid.dataView.getItemByIdx(g.rows[0]);
          const projectName = firstItem?.ProjectFullName || '';
          const displayText = projectName ? `${projectName}` : projectCode;
          return `Dự án: ${displayText} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
        },
        comparer: (a: any, b: any) => {
          return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
        },
        collapsed: false,
      });

      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();

      this.applyDistinctFilters();

      // Cập nhật footer khi filter thay đổi
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateFooterRow();
      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateFooterRow();
    }, 100);
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'IsDeleted',
        name: 'Hủy yêu cầu',
        field: 'IsDeleted',
        cssClass: 'text-center',
        width: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
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
        id: 'IsCheckPrice',
        name: 'Check giá',
        field: 'IsCheckPrice',
        cssClass: 'text-center',
        width: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
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
        id: 'TT',
        name: 'TT',
        field: 'TT',
        width: 80,
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
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<span style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<span style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.2em; max-height: 3.6em;">${value}</div>`;
        },
      },
      {
        id: 'Model',
        name: 'Thông số kỹ thuật',
        field: 'Model',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.2em; max-height: 3.6em;">${value}</div>`;
        },
      },
      {
        id: 'Manufacturer',
        name: 'Hãng',
        field: 'Manufacturer',
        width: 80,
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
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'Unit',
        name: 'Đơn vị',
        field: 'Unit',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'StatusRequestText',
        name: 'Trạng thái',
        field: 'StatusRequestText',
        width: 150,
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
        id: 'FullName',
        name: 'Người yêu cầu',
        field: 'FullName',
        width: 150,
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
        id: 'FullNameSale',
        name: 'Sale phụ trách',
        field: 'FullNameSale',
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
      {
        id: 'QuoteEmployee',
        name: 'NV báo giá',
        field: 'QuoteEmployee',
        width: 150,
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
        id: 'DateRequest',
        name: 'Ngày yêu cầu',
        field: 'DateRequest',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Deadline',
        name: 'Deadline',
        field: 'Deadline',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },

      {
        id: 'DatePriceQuote',
        name: 'Ngày báo giá',
        field: 'DatePriceQuote',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        cssClass: 'text-center',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CurrencyRate',
        name: 'Tỷ giá',
        field: 'CurrencyRate',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá',
        field: 'UnitPrice',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'HistoryPrice',
        name: 'Giá lịch sử',
        cssClass: 'text-end',
        field: 'HistoryPrice',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'DateHistoryPrice',
        name: 'Ngày báo giá lịch sử',
        field: 'DateHistoryPrice',
        cssClass: 'text-center',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'TotalPrice',
        name: 'Thành tiền chưa VAT',
        field: 'TotalPrice',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalPriceExchange',
        name: 'Thành tiền quy đổi (VND)',
        field: 'TotalPriceExchange',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'VAT',
        name: '%VAT',
        cssClass: 'text-end',
        field: 'VAT',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotaMoneyVAT',
        name: 'Thành tiền có VAT',
        cssClass: 'text-end',
        field: 'TotaMoneyVAT',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp',
        field: 'NameNCC',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TotalDayLeadTime',
        name: 'Lead Time (Ngày làm việc)',
        field: 'TotalDayLeadTime',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'DateExpected',
        name: 'Ngày dự kiến hàng về',
        field: 'DateExpected',
        width: 100,
        cssClass: 'text-center',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'NotePartlist',
        name: 'Ghi chú KT',
        field: 'NotePartlist',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SpecialCode',
        name: 'Mã đặc biệt',
        field: 'SpecialCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsImport',
        name: 'Hàng nhập khẩu',
        field: 'IsImport',
        width: 80,
        cssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
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
        id: 'UnitFactoryExportPrice',
        name: 'Đơn giá xuất xưởng',
        field: 'UnitFactoryExportPrice',
        width: 180,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitImportPrice',
        name: 'Đơn giá nhập khẩu',
        field: 'UnitImportPrice',
        width: 180,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalImportPrice',
        name: 'Thành tiền nhập khẩu',
        field: 'TotalImportPrice',
        width: 180,
        cssClass: 'text-end',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'LeadTime',
        name: 'LeadTime',
        field: 'LeadTime',
        width: 80,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'ReasonDeleted',
        name: 'Lý do xóa',
        field: 'ReasonDeleted',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-summary-purchase-quote',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: false,
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
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      frozenColumn: 9,
      enableContextMenu: true,
    };
  }

  formatDateForAPI(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return `${dateStr}T00:00:00`;
  }

  formatDateEndForAPI(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return `${dateStr}T23:59:59`;
  }

  //#region Xuất excel
  async ExportToExcelTab() {
    const angularGrid = this.angularGridMaster;
    if (!angularGrid) {
      this.notify.warning('Thông báo', 'Không tìm thấy bảng dữ liệu.');
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    // Lấy dữ liệu từ Map (local pagination) thay vì gọi API
    const rawData = this.summaryData || [];

    if (rawData.length === 0) {
      this.notify.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      this.isLoading = false;
      return;
    }

    try {
      let columns = this.columnDefinitionsMaster || [];
      columns = columns.filter((col: any) => col.hidden !== true);

      // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
      const supplierIndex = columns.findIndex(
        (col: any) => col.field === 'SupplierSaleID'
      );
      const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
      if (supplierIndex >= 0 && !codeNCCExists) {
        const codeNCCColumn = {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
        } as any;
        columns.splice(supplierIndex, 0, codeNCCColumn);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo giá');

      // Thêm header
      const headerRow = worksheet.addRow(
        columns.map((col: Column) => col.name || col.field)
      );
      headerRow.font = { bold: true, name: 'Tahoma' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Nhóm dữ liệu theo ProjectFullName
      const grouped = rawData.reduce((acc: any, item: any) => {
        const groupKey = item.ProjectFullName || 'Không rõ dự án';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {});

      for (const groupName of Object.keys(grouped)) {
        const groupRows = grouped[groupName];

        // Thêm dòng Group Header
        const groupHeaderRow = worksheet.addRow([
          `${groupName} (${groupRows.length})`,
        ]);
        groupHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFd9edf7' },
        };
        groupHeaderRow.font = { bold: true, name: 'Tahoma' };
        groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

        // Merge cells từ cột A đến cột cuối cùng
        const lastColumnLetter = this.getColumnLetter(columns.length);
        worksheet.mergeCells(
          `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
        );

        // Thêm các dòng dữ liệu trong nhóm
        groupRows.forEach((row: any) => {
          const rowData = columns.map((col: any) => {
            const value = row[col.field];

            // Xử lý null/undefined thành khoảng trống
            if (value === null || value === undefined) {
              return '';
            }

            // Xử lý object rỗng
            if (
              typeof value === 'object' &&
              value !== null &&
              Object.keys(value).length === 0
            ) {
              return '';
            }

            // Xử lý checkbox: true -> "X", false -> ""
            const fieldName = col.field || '';
            if (
              fieldName === 'IsCheckPrice' ||
              fieldName === 'IsImport' ||
              fieldName === 'IsDeleted'
            ) {
              return value === true ? 'V' : '';
            }

            // Format tiền cho các cột số tiền
            if (
              [
                'TotalPrice',
                'UnitPrice',
                'HistoryPrice',
                'TotaMoneyVAT',
                'TotalPriceExchange',
                'UnitFactoryExportPrice',
                'UnitImportPrice',
                'TotalImportPrice',
                'Quantity',
                'TotalMoneyVAT',
                'CurrencyRate',
              ].includes(col.field)
            ) {
              const numValue = Number(value) || 0;
              return numValue === 0
                ? 0
                : new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(numValue);
            }

            // Format date columns thành dd/MM/yyyy
            if (
              [
                'DatePriceQuote',
                'DateRequest',
                'Deadline',
                'DateExpected',
                'DateHistoryPrice',
                'LeadTime',
              ].includes(fieldName)
            ) {
              if (!value) return '';
              // Xử lý nhiều kiểu dữ liệu date
              let dateValue: DateTime | null = null;
              if (value instanceof Date) {
                dateValue = DateTime.fromJSDate(value);
              } else if (typeof value === 'string') {
                dateValue = DateTime.fromISO(value);
                if (!dateValue.isValid) {
                  // Thử các format khác
                  const formats = [
                    'yyyy/MM/dd',
                    'dd/MM/yyyy',
                    'yyyy-MM-dd',
                    'MM/dd/yyyy',
                  ];
                  for (const format of formats) {
                    dateValue = DateTime.fromFormat(value, format);
                    if (dateValue.isValid) break;
                  }
                }
              }
              return dateValue && dateValue.isValid
                ? dateValue.toFormat('dd/MM/yyyy')
                : '';
            }

            // Format VAT và TotalDayLeadTime theo en-US
            if (fieldName === 'VAT' || fieldName === 'TotalDayLeadTime') {
              if (value === null || value === undefined || value === '')
                return '';
              const numValue = Number(value) || 0;
              return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
              }).format(numValue);
            }

            // Xử lý trường select với lookup
            if (col.field === 'CurrencyCode') {
              return value;
            }

            if (col.field === 'NameNCC') {
              return value;
            }

            if (col.field === 'CodeNCC') {
              return value;
            }

            // Xử lý chuỗi rỗng
            if (value === '') {
              return '';
            }

            // Return giá trị bình thường
            return value;
          });
          worksheet.addRow(rowData);
        });

        // Thêm dòng trống giữa các group
        worksheet.addRow([]);
      }

      // Footer tổng cho toàn bảng
      const totalFooterRowData = columns.map((col: Column) => {
        // Kiểm tra xem cột có cần tính tổng không
        if (!this.shouldCalculateSum(col)) return '';

        const values = rawData.map((r: any) => Number(r[col.field]) || 0);
        const result = values.reduce((a: number, b: number) => a + b, 0);

        // Format tiền cho các cột tiền
        if (
          [
            'TotalPrice',
            'UnitPrice',
            'HistoryPrice',
            'TotaMoneyVAT',
            'TotalPriceExchange',
            'UnitFactoryExportPrice',
            'UnitImportPrice',
            'TotalImportPrice',
          ].includes(col.field || '') &&
          typeof result === 'number'
        ) {
          return result === 0
            ? 0
            : new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(result);
        }

        // Format số cho các cột số khác
        if (
          col.field === 'Quantity' ||
          col.field === 'TotalDayLeadTime' ||
          col.field === 'VAT'
        ) {
          return this.formatNumberEnUS(
            result,
            col.field === 'Quantity' ? 2 : 0
          );
        }

        return result;
      });

      // Thêm label "Tổng cộng" vào cột đầu tiên
      if (totalFooterRowData.some((val: any) => val !== '')) {
        totalFooterRowData[0] = 'Tổng cộng';
        const totalFooterRow = worksheet.addRow(totalFooterRowData);
        totalFooterRow.font = { bold: true, name: 'Tahoma' };
        totalFooterRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        totalFooterRow.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
      }

      // Auto-fit column width theo nội dung thực tế
      worksheet.columns.forEach((column: any, colIndex: number) => {
        let maxLength = 0;

        // Lấy header length
        const headerCell = worksheet.getRow(1).getCell(colIndex + 1);
        if (headerCell && headerCell.value) {
          maxLength = headerCell.value.toString().length;
        }

        // Duyệt qua tất cả các cell trong cột để tìm độ dài lớn nhất
        column.eachCell?.({ includeEmpty: true }, (cell: any) => {
          if (cell && cell.value) {
            const cellValue = cell.value.toString();
            const cellLength = cellValue.length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });

        // Set width với min 10, max 50
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Viền ô
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Đặt font Tahoma cho tất cả các cell
          if (!cell.font) {
            cell.font = { name: 'Tahoma' };
          } else {
            cell.font = { ...cell.font, name: 'Tahoma' };
          }

          // WrapText cho tất cả các cell
          if (rowNumber === 1) {
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
              wrapText: true,
            };
          } else {
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
          }
        });
      });

      // Tạo & tải file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `price-request-full-${new Date().toISOString().split('T')[0]
        }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.notify.error(
        NOTIFICATION_TITLE.error,
        'Đã xảy ra lỗi khi xuất Excel. Vui lòng thử lại sau.'
      );
    }
  }

  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }

  private shouldCalculateSum(column: Column): boolean {
    // Các cột có groupTotalsFormatter cần tính tổng
    if (column.groupTotalsFormatter) {
      return true;
    }

    const sumFields = [
      'Quantity',
      'UnitPrice',
      'HistoryPrice',
      'TotalPrice',
      'TotalPriceExchange',
      'VAT',
      'TotaMoneyVAT',
      'TotalDayLeadTime',
      'UnitFactoryExportPrice',
      'UnitImportPrice',
      'TotalImportPrice',
    ];

    return sumFields.includes(column.field || '');
  }

  private formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }

  //#endregion

}
