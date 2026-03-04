import { SearchProductTechSerialService } from './search-tech-product-/search-product-tech-serial.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  inject,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Inject,
  Optional,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
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
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  standalone: true,
  imports: [
    NzCheckboxModule,
    NzUploadModule,
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
    NgbModalModule,
    NzSpinModule,
    AngularSlickgridModule,
  ],
  selector: 'app-search-product-tech-serial',
  templateUrl: './search-product-tech-serial.component.html',
  styleUrls: ['./search-product-tech-serial.component.css'],
})
export class SearchProductTechSerialComponent implements OnInit, AfterViewInit {
  wareHouseID: number = 1;
  warehouseType: number = 1;
  serialNumber: string = '';
  exportDataTable: any[] = [];
  importDataTable: any[] = [];
  importTable: Tabulator | null = null;
  exportTable: Tabulator | null = null;
  isLoadingTableImport: boolean = false;
  isLoadingTableExport: boolean = false;

  angularGridImport!: AngularGridInstance;
  angularGridExport!: AngularGridInstance;

  columnDefinitionsImport: Column[] = [];
  columnDefinitionsExport: Column[] = [];

  gridOptionsImport: GridOption = {};
  gridOptionsExport: GridOption = {};

  datasetImport: any[] = [];
  datasetExport: any[] = [];
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private searchProductTechSerialService: SearchProductTechSerialService,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) { }
  searchTimeout: any;
  idTable: string = '';

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngOnInit() {
    this.idTable = this.generateUUIDv4();
    this.route.queryParams.subscribe(params => {
      this.wareHouseID =
        params['wareHouseID']
        ?? this.tabData?.warehouseID
        ?? 1;
      this.warehouseType =
        params['warehouseType']
        ?? this.tabData?.warehouseType
        ?? 1;
      console.log(this.wareHouseID, this.warehouseType);
    });
    this.initColumns();
    this.getSearchProductTechSerial();
  }
  ngAfterViewInit(): void {

  }

  getSearchProductTechSerial() {
    this.isLoadingTableImport = true;
    this.isLoadingTableExport = true;
    let request = {
      wareHouseID: this.wareHouseID || 1,
      serialNumber: this.serialNumber || '',
    };

    this.searchProductTechSerialService
      .getSearchProductTechSerial(request)
      .subscribe((response: any) => {
        this.datasetImport = response.import;
        this.datasetExport = response.export;

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
      });
  }

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
        id: 'BillCode',
        field: 'BillCode',
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
        id: 'ProductCodeRTC',
        field: 'ProductCodeRTC',
        name: 'Mã nội bộ',
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
        id: 'Maket',
        field: 'Maket',
        name: 'Hãng',
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
        id: 'ProductCodeRTC',
        field: 'ProductCodeRTC',
        name: 'Mã nội bộ',
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
        id: 'Maket',
        field: 'Maket',
        name: 'Hãng',
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
        id: 'ProductQRCode',
        field: 'ProductQRCode',
        name: 'Mã QR Code',
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
        container: '.grid-container-export-tech-' + this.idTable,
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
        container: '.grid-container-import-tech-' + this.idTable,
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
    const fieldsToFilter = ['Status', 'ProductCodeRTC', 'Maket'];
    this.applyDistinctFiltersToGrid(this.angularGridImport, this.columnDefinitionsImport, fieldsToFilter);
  }

  private applyDistinctFiltersExport(): void {
    const fieldsToFilter = ['Status', 'ProductCodeRTC', 'Maket'];
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
}
