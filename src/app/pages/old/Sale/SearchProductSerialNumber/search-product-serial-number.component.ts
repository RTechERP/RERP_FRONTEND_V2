import {
    Component,
    OnInit,
    AfterViewInit,
    ViewChild,
    Input,
    Inject,
    Optional,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    Validators,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { DateTime } from 'luxon';
import { SearchProductSerialNumberServiceService } from './search-product-serial-number-service/search-product-serial-number-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
@Component({
  selector: 'app-search-product-serial-number',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
    NzSpinModule,
    NzCardModule,
    AngularSlickgridModule
  ],
  templateUrl: './search-product-serial-number.component.html',
  styleUrl: './search-product-serial-number.component.css',
})
export class SearchProductSerialNumberComponent
  implements OnInit, AfterViewInit {

  constructor(
    private searchProductSerialNumberService: SearchProductSerialNumberServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  isLoadingTableImport: boolean = false;
  isLoadingTableExport: boolean = false;

  // Angular SlickGrid instances
  angularGridImport!: AngularGridInstance;
  angularGridExport!: AngularGridInstance;

  // Column definitions
  columnDefinitionsImport: Column[] = [];
  columnDefinitionsExport: Column[] = [];

  // Grid options
  gridOptionsImport: GridOption = {};
  gridOptionsExport: GridOption = {};

  // Datasets
  datasetImport: any[] = [];
  datasetExport: any[] = [];

  keyword: string = '';
  warehouseID: number = 1;
  idTable: string = '';

  ngOnInit(): void {
    this.idTable = this.generateUUIDv4();
    this.route.queryParams.subscribe(params => {
      this.warehouseID =
        params['warehouseID']
        ?? this.tabData?.warehouseID
        ?? 1;
    });
    this.initColumns();
    this.loadData();
  }
  ngAfterViewInit(): void {
  }

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  //#region Load dữ liệu
  loadData() {
    this.isLoadingTableImport = true;
    this.isLoadingTableExport = true;
    this.searchProductSerialNumberService.getAll(this.keyword).subscribe({
      next: (res: any) => {
        debugger;
        this.datasetImport = res.dataImport;
        this.datasetExport = res.dataExport;

        this.datasetImport = this.datasetImport.map((item: any, index: number) => {
          return {
            ...item,
            id: `${index++}` + `_${this.idTable}`,
          };
        });
        this.datasetExport = this.datasetExport.map((item: any, index: number) => {
          return {
            ...item,
            id: `${index++}` + `_${this.idTable}`,
          };
        });

        console.log(this.datasetImport);
        console.log(this.datasetExport);
        this.isLoadingTableImport = false;
        this.isLoadingTableExport = false;

        setTimeout(() => {
          this.applyDistinctFiltersImport();
          this.applyDistinctFiltersExport();
        }, 100);
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu lịch sử mượn/trả'
        );
        this.isLoadingTableImport = false;
        this.isLoadingTableExport = false;
      },
    });
  }
  //#endregion

  //#region Xử lý bảng
  angularGridReadyImport(angularGrid: AngularGridInstance) {
    this.angularGridImport = angularGrid;

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {

      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridReadyExport(angularGrid: AngularGridInstance) {
    this.angularGridExport = angularGrid;

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {

      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  initColumns() {
    // Import columns
    this.columnDefinitionsImport = [
      {
        id: 'Status',
        field: 'Status',
        name: 'Duyệt',
        width: 60,
        cssClass: 'text-center',
        sortable: false,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row, _cell, _value, _column, _dataContext) => {
          const value = _dataContext.Status;
          return `<input type="checkbox" ${value === true ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      {
        id: 'BillImportCode',
        field: 'BillImportCode',
        name: 'Mã phiếu nhập',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã theo dự án',
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
        id: 'ProjectCodeText',
        field: 'ProjectCodeText',
        name: 'Mã dự án',
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
        id: 'SerialNumber',
        field: 'SerialNumber',
        name: 'Số serial',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú (PO)',
        width: 200,
        sortable: true,
        filterable: true,
      },
    ];

    // Export columns
    this.columnDefinitionsExport = [
      {
        id: 'Status',
        field: 'Status',
        name: 'Duyệt',
        width: 60,
        cssClass: 'text-center',
        sortable: false,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row, _cell, _value, _column, _dataContext) => {
          const value = _dataContext.Status;
          return `<input type="checkbox" ${value === true ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã phiếu xuất',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'CustomerName',
        field: 'CustomerName',
        name: 'Tên khách hàng',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductFullName',
        field: 'ProductFullName',
        name: 'Mã theo dự án',
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
        id: 'ProjectCodeText',
        field: 'ProjectCodeText',
        name: 'Mã dự án',
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
        id: 'SerialNumber',
        field: 'SerialNumber',
        name: 'Số serial',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú (PO)',
        width: 200,
        sortable: true,
        filterable: true,
      },
    ];

    // Grid options
    this.gridOptionsExport = {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-export-${this.idTable}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableEmptyDataWarningMessage: false,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: false,
      datasetIdPropertyName: 'id',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      enableAutoTooltip: true,
      //autoHeight: true,
    };

    this.gridOptionsImport = {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-import-${this.idTable}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableEmptyDataWarningMessage: false,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: false,
      datasetIdPropertyName: 'id',
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      enableAutoTooltip: true,
      //autoHeight: true,
    };
  }
  //#endregion

  //#region Apply Distinct Filters
  private applyDistinctFiltersImport(): void {
    const fieldsToFilter = ['Status', 'ProjectName', 'ProjectCodeText'];
    this.applyDistinctFiltersToGrid(this.angularGridImport, this.columnDefinitionsImport, fieldsToFilter);
  }

  private applyDistinctFiltersExport(): void {
    const fieldsToFilter = ['Status', 'ProjectName', 'ProjectCodeText'];
    this.applyDistinctFiltersToGrid(this.angularGridExport, this.columnDefinitionsExport, fieldsToFilter);
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    columnDefs.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
  //#endregion
}
