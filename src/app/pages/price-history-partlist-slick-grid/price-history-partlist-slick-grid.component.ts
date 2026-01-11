import { Component, Input, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { NgModel } from '@angular/forms';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project/project-service/project.service';

@Component({
  selector: 'app-price-history-partlist-slick-grid',
  templateUrl: './price-history-partlist-slick-grid.component.html',
  styleUrl: './price-history-partlist-slick-grid.component.css',
  imports: [
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    AngularSlickgridModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzDropDownModule,
    CommonModule,
  ],
})
export class PriceHistoryPartlistSlickGridComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  isLoadTable: any = false;
  showSearchPanel: boolean = true;

  employeeRequests: any[] = [];
  projects: any[] = [];
  suppliers: any[] = [];

  employeeRequestId: any;
  projectId: any;
  supplierId: any;
  keyword: any;
  pageNumber: number = 1;
  pageSize: number = 50;
  totalPage: number = 1;
  readonly pageSizeOptions: number[] = [10, 20, 50, 100];
  //#endregion

  //#region Load dữ liệu
  ngOnInit(): void {
    this.initGrid();
    this.getProject();
    this.getEmployeeRequest();
    this.getSupplierSales();
  }
  ngAfterViewInit(): void {
    setTimeout(() => this.getPriceHistoryPartlist(), 0);
  }
  //#endregion

  //#region Sự kiện khác
  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
  }
  onSearchChange(value: string) {
    this.getPriceHistoryPartlist();
  }

  resetSearch() {
    this.employeeRequestId = null;
    this.projectId = null;
    this.supplierId = null;
    this.keyword = '';
    this.pageNumber = 1;
    this.getPriceHistoryPartlist();
  }

  prevPage(): void {
    if (this.pageNumber <= 1) return;
    this.pageNumber--;
    this.getPriceHistoryPartlist();
  }

  nextPage(): void {
    if (this.pageNumber >= this.totalPage) return;
    this.pageNumber++;
    this.getPriceHistoryPartlist();
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(Number(page) || 1, 1), this.totalPage || 1);
    this.pageNumber = next;
    this.getPriceHistoryPartlist();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 50;
    this.pageNumber = 1;
    this.getPriceHistoryPartlist();
  }

  async getPriceHistoryPartlist() {
    this.isLoadTable = true;
    const data = {
      pageNumber: this.pageNumber || 1,
      pageSize: this.pageSize || 50,
      projectId: this.projectId ?? 0,
      supplierSaleId: this.supplierId ?? 0,
      employeeRequestId: this.employeeRequestId ?? 0,
      keyword: this.keyword?.trim() ?? '',
    };

    this.projectService.getPriceHistoryPartlist(data).subscribe({
      next: (response: any) => {
        let rawData = response.data || [];
        if (!Array.isArray(rawData) && rawData.dt && Array.isArray(rawData.dt)) {
          rawData = rawData.dt;
        }

        const newData = rawData.map((item: any, index: number) => ({
          ...item,
          id: item.ID || item.id || index + 1
        }));
        this.dataset = newData;

        if (this.angularGrid?.dataView) {
          this.angularGrid.dataView.setItems(newData);
          this.angularGrid.dataView.refresh();
        }

        // Parse TotalPage from response.data.totalpage[0].TotalPage
        const apiTotalPage = Number(response?.data?.totalpage?.[0]?.TotalPage) || 1;
        this.totalPage = Number.isFinite(apiTotalPage) && apiTotalPage > 0 ? apiTotalPage : 1;

        const currentPage = Number(this.pageNumber) || 1;
        if (currentPage > this.totalPage) {
          this.pageNumber = this.totalPage;
        } else if (currentPage < 1) {
          this.pageNumber = 1;
        }

        this.isLoadTable = false;
        this.cdr.detectChanges();

        setTimeout(() => this.applyDistinctFilters(), 100);
      },
      error: (error) => {
        this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra');
        this.isLoadTable = false;
      },
    });
  }

  getProject() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getEmployeeRequest() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeRequests = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getSupplierSales() {
    this.projectService.getSupplierSales().subscribe({
      next: (response: any) => {
        this.suppliers = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  exportExcel() {
    if (!this.angularGrid) return;

    const datatable = this.angularGrid.dataView.getItems();
    if (!datatable || datatable.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để xuất excel!');
      return;
    }

    this.projectService.exportExcelGroup(
      this.angularGrid,
      datatable,
      'Lịch sử giá',
      'LichSuGia',
      'TableType'
    );
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 200,
        sortable: true,
        filterable: true,
         formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductCode}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        sortable: true,
        filterable: true,
         formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductName}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Model',
        name: 'Thông số kỹ thuật',
        field: 'Model',
        width: 300,
        sortable: true,
        filterable: true,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Model}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Maker}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Unit',
        name: 'Đơn vị',
        field: 'Unit',
        width: 90,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Unit}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày cập nhật',
        field: 'CreatedDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          const dateTime = DateTime.fromISO(value);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá',
        field: 'UnitPrice',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        cssClass: 'text-center',
        width: 90,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'CurrencyRate',
        name: 'Tỉ giá',
        field: 'CurrencyRate',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.CurrencyRate}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalMoney',
        name: 'Thành tiền tỉ giá',
        field: 'TotalMoney',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CodeNCC',
        name: 'Mã nhà cung cấp',
        field: 'CodeNCC',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.CodeNCC}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'NameNCC',
        name: 'Tên nhà cung cấp',
        field: 'NameNCC',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NameNCC}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectCode}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'LeadTime',
        name: 'LeadTime',
        field: 'LeadTime',
        width: 90,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.LeadTime}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-price-history',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableSorting: true,
      multiColumnSort: true,
      enablePagination: false,
      showHeaderRow: true,
      headerRowHeight: 35,
      rowHeight: 40,
      frozenColumn: 1,
      explicitInitialization: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    setTimeout(() => {
      this.angularGrid.resizerService?.resizeGrid();

      const gridContainer = document.getElementById('grid-container-price-history') as HTMLElement;
      if (gridContainer) {
        const slickViewport = gridContainer.querySelector('.slick-viewport') as HTMLElement;
        if (slickViewport) {
          slickViewport.style.height = `${gridContainer.offsetHeight - 35}px`;
        }
      }
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

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];
    const booleanFields = new Set([
      'NCCNew',
      'DeptSupplier',
      'IsBill',
      'OrderQualityNotMet',
    ]);

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

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
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
  //#endregion
}
