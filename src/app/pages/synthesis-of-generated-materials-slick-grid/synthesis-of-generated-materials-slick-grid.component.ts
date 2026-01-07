import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { OnInit, AfterViewInit } from '@angular/core';
import { EnvironmentInjector, ApplicationRef } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project/project-service/project.service';

@Component({
  selector: 'app-synthesis-of-generated-materials-slick-grid',
  templateUrl: './synthesis-of-generated-materials-slick-grid.component.html',
  styleUrl: './synthesis-of-generated-materials-slick-grid.component.css',
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
export class SynthesisOfGeneratedMaterialsSlickGridComponent implements OnInit, AfterViewInit {
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

  projects: any[] = [];

  projectId: any;
  keyword: any;
  dateStart: any = DateTime.local().startOf('month').toJSDate();
  dateEnd: any = DateTime.local().endOf('month').toJSDate();
  //#endregion

  //#region Load dữ liệu
  ngOnInit(): void {
    this.initGrid();
    this.getProject();
  }

  ngAfterViewInit(): void {
    this.getSynthesisOfGeneratedMaterials();
  }
  //#endregion

  //#region Sự kiện khác
  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
  }

  onSearchChange(value: string) {
    this.getSynthesisOfGeneratedMaterials();
  }

  resetSearch() {
    this.projectId = null;
    this.keyword = '';
    this.dateStart = DateTime.local().startOf('month').toJSDate();
    this.dateEnd = DateTime.local().endOf('month').toJSDate();
    this.getSynthesisOfGeneratedMaterials();
  }

  async getSynthesisOfGeneratedMaterials() {
    this.isLoadTable = true;
    let data = {
      pageNumber: 1,
      pageSize: 999999,
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      projectId: this.projectId ?? 0,
      keyword: this.keyword?.trim() ?? '',
    };

    this.projectService.getSynthesisOfGeneratedMaterials(data).subscribe({
      next: (response: any) => {
        let dataArray: any[] = [];

        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data && Array.isArray(response.data.dt)) {
          dataArray = response.data.dt;
        } else if (response.data && typeof response.data === 'object') {
          dataArray = [];
        }

        this.dataset = dataArray.map((item: any, index: number) => ({
          ...item,
          id: item.ID || item.id || index + 1
        }));
        this.isLoadTable = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
      },
      error: (error) => {
        this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra');
        console.error('Lỗi:', error);
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
      'Báo cáo vật tư phát sinh',
      'BaoCaoVatTuPhatSinh',
      'TableType'
    );
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'TT',
        name: 'TT',
        field: 'TT',
        width: 60,
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
      },
      {
        id: 'GroupMaterial',
        name: 'Tên vật tư',
        field: 'GroupMaterial',
        width: 200,
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
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.GroupMaterial}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ProductCode',
        name: 'Mã thiết bị',
        field: 'ProductCode',
        width: 150,
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
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.ProductCode}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 100,
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
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.ProductNewCode}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'QtyMin',
        name: 'SL/1 máy',
        field: 'QtyMin',
        width: 70,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'QtyFull',
        name: 'Số lượng tổng',
        field: 'QtyFull',
        width: 70,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'Unit',
        name: 'Đơn vị',
        field: 'Unit',
        width: 80,
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
      },
      {
        id: 'UnitPriceQuote',
        name: 'Đơn giá báo',
        field: 'UnitPriceQuote',
        width: 130,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPriceQuote',
        name: 'Thành tiền báo giá',
        field: 'TotalPriceQuote',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'UnitPricePurchase',
        name: 'Đơn giá mua',
        field: 'UnitPricePurchase',
        width: 130,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPricePurchase',
        name: 'Thành tiền mua',
        field: 'TotalPricePurchase',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          if (value === null || value === undefined || value === '') return '';
          return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
        },
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CreatedDate',
        name: 'Ngày phát sinh',
        field: 'CreatedDate',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
          const dateTime = DateTime.fromISO(value);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'ReasonProblem',
        name: 'Lý do phát sinh',
        field: 'ReasonProblem',
        width: 200,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.ReasonProblem}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 120,
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
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.ProjectCode}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'note',
        name: 'Ghi chú',
        field: 'note',
        width: 200,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-synthesis-materials',
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
      rowHeight: 35,
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

      const gridContainer = document.getElementById('grid-container-synthesis-materials') as HTMLElement;
      if (gridContainer) {
        const slickViewport = gridContainer.querySelector('.slick-viewport') as HTMLElement;
        if (slickViewport) {
          const containerHeight = gridContainer.offsetHeight;
          slickViewport.style.height = `${containerHeight - 35}px`;
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

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
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
}
