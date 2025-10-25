//Tabulator by LANGOCHAI
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import {
  CellComponent,
  ColumnDefinition,
  Options,
  TabulatorFull as Tabulator,
} from 'tabulator-tables';

@Component({
  selector: 'tabulator-table-single',
  template: `
    <div
      #tableContainer
      class="table-bordered border-primary tabulator-table"
    ></div>
  `,
})
export class TabulatorTableSingleComponent
  implements AfterViewInit, OnChanges, OnDestroy {
  //#region Inputs
  @Input() tableData: any[] = [];
  // TODO:   start Trungtv update 23/09/2025 
  @Input() selectableRow: any;
  // TODO:   end Trungtv update 23/09/2025 
  @Input() hasSelection = true;
  @Input() dataTree = false;
  @Input() columnNames: ColumnDefinition[] = [];
  @Input() height: string = '100%';

  @Input() ajaxURL?: string;
  @Input() ajaxParams: any = {};
  // @Input() method: string = 'GET';
  // @Input() headers: any = {
  //         'Content-Type': 'application/json',
  //       };
  @Input() ajaxConfig: any = 'GET';

  @Input() paginationSize: number = 10;
  // TODO:   start Trungtv update 23/09/2025 : gán page size mặc định
  @Input() paginationSizeSelector: any[] = [10, 20, 30, 50, 100];
  // TODO:   end Trungtv update 23/09/2025 
  //#endregion

  //#region Outputs
  /** Emits whenever the selection changes */
  @Output() rowSelectionChanged = new EventEmitter<any[]>();
  /** Emits whenever the cell edited */
  @Output() cellEdited = new EventEmitter<CellComponent>();
  /** Emits whenever the table buildt */
  @Output() tableBuildt = new EventEmitter<any>();
  // TODO:   start Trungtv update 23/09/2025 : gán output cho sự kiện rowclick, rowSelected, rowDeselected, rowDblClick
  /** Emits whenever the rowclick */
  @Output() rowClick = new EventEmitter<any>();
  /** Emits whenever the rowSelected */
  @Output() rowSelected = new EventEmitter<any>();
  /** Emits whenever the rowDeselected */
  @Output() rowDeselected = new EventEmitter<any>();
  /** Emits whenever the rowDblClick */
  @Output() rowDblClick = new EventEmitter<any>();
  // TODO:   end Trungtv update 23/09/2025 
  //#endregion

  @ViewChild('tableContainer', { static: true })
  private tableContainer!: ElementRef<HTMLDivElement>;

  public table?: Tabulator;

  //#region Life cycle
  ngAfterViewInit() {
    this.initializeTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.table) return;
    if (changes['tableData'] && !this.ajaxURL) {
      this.table.replaceData(this.tableData);
    }
    if (changes['columnNames']) {
      this.table.setColumns(this.columnNames);
    }
    if (changes['height']) {
      this.table.setHeight(this.height);
    }
  }

  ngOnDestroy() {
    this.table?.destroy();
  }
  //#endregion

  //#region Init
  private initializeTable() {
    const options: Options = {
      data: this.ajaxURL ? undefined : this.tableData,
      reactiveData: true,
      // TODO:   start Trungtv update 23/09/2025 : gán cấu hình column
      columns: this.normalizeColumns(this.columnNames),
      // TODO:   end Trungtv update 23/09/2025 
      layout: 'fitDataStretch',
      height: this.height,
      selectableRows: this.selectableRow,
      editTriggerEvent: 'click',

      // Tree
      dataTree: this.dataTree,
      dataTreeStartExpanded: true,
      dataTreeChildField: 'children',

      // Pagination
      pagination: true,
      paginationSize: this.paginationSize,
      // TODO:   start Trungtv update 23/09/2025 : thêm paginationSizeSelector cấu hình chọn size cho bảng
      paginationSizeSelector: this.paginationSizeSelector,
      // TODO:   end Trungtv update 23/09/2025 
      paginationMode: this.ajaxURL ? 'remote' : 'local',


      // Ajax
      ajaxURL: this.ajaxURL,
      ajaxParams: this.ajaxParams,
      ajaxConfig: this.ajaxConfig,
      // TODO:   start Trungtv update 23/09/2025 : thêm chọn page number cho tabulator
      ajaxResponse: function (url, params, response) {
        return {
          last_page: response.totalPage,
          data: response.data,
        };
      },


      // TODO:  end Trungtv update 23/09/2025 

    };

    // Row selection config
    if (this.selectableRow) {
      if (this.hasSelection) {
        options.selectableRows = true;
        options.rowHeader = {
          headerSort: false,
          resizable: false,
          frozen: true,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          cellClick: (_e: MouseEvent, cell: CellComponent) =>
            cell.getRow().toggleSelect(),
          width: 30,
        };
      } else {
        options.selectableRows = 1;
      }
    }

    // Init Tabulator
    this.table = new Tabulator(this.tableContainer.nativeElement, options);

    // Event emitters
    this.table.on('rowSelectionChanged', (data: any[]) => {
      this.rowSelectionChanged.emit(data);
    });
    this.table.on('cellEdited', (cell: CellComponent) => {
      this.cellEdited.emit(cell);
    });
    this.table.on('tableBuilt', () => {
      this.tableBuildt.emit();
    });
    // TODO:   start Trungtv update 23/09/2025 : thêm sự kiện rowclick, double click, row selected, row deselected
    // Double click vào row
    this.table.on("rowDblClick", (_e, row) => {
      this.rowDblClick.emit(row.getData());
    });
    // Click vào 1 row
    this.table.on("rowClick", (_e, row) => {
      this.rowClick.emit(row.getData());
    });

    // Khi 1 row được chọn
    this.table.on("rowSelected", (row) => {
      this.rowSelected.emit(row.getData());
    });

    // Khi 1 row bị bỏ chọn
    this.table.on("rowDeselected", (row) => {
      this.rowDeselected.emit(row.getData());
    });
    // TODO:   end Trungtv update 23/09/2025 
  }
  //#endregion

  //#region Methods
  /** Reload Ajax data (with new params if provided) */
  public reloadData(params?: any) {
    if (!this.ajaxURL) return;
    if (params) {
      this.ajaxParams = params;
    }
    this.table?.clearData(); // reset data trước
    this.table?.setData(this.ajaxURL, this.ajaxParams);
  }

  /** Update ajax params without reloading immediately */
  public setAjaxParams(params: any) {
    this.ajaxParams = params;
    this.table?.setData(this.ajaxURL || '', this.ajaxParams);
  }

  /** Select multiple rows by data */
  public selectRowDatas(datas: any[]) {
    const indices: number[] = this.tableData.reduce((r, v, i) => {
      return r.concat(datas.includes(v) ? i : []);
    }, []);
    this.table?.selectRow(indices);
  }

  /** Select a row by data */
  public selectRowData(data: any) {
    const index = this.tableData.findIndex((d) => d == data);
    this.table?.selectRow(index);
  }

  /** Get current selections */
  public getSelectedRows(): any[] {
    return this.table ? this.table.getSelectedData() : [];
  }

  /** Get current selection */
  public getSelectedRow(): any | null {
    const sel = this.getSelectedRows();
    return sel.length ? sel[0] : null;
  }

  /** Get all rows */
  public getAllRows() {
    return this.table?.getData();
  }
  // TODO:   start Trungtv update 23/09/2025 : Cấu hình cột: header căn giữa, chữ trái, số phải, ngày giữa
  private normalizeColumns(cols: ColumnDefinition[]): ColumnDefinition[] {
    return cols.map(col => {
      const newCol = { ...col };

      // Nếu chưa set headerHozAlign thì mặc định là center
      if (!newCol.headerHozAlign) {
        newCol.headerHozAlign = "center";
      }

      // Nếu chưa set hozAlign thì tự động đoán
      if (!newCol.hozAlign) {
        if (newCol.formatter === "money" ||
          newCol.field?.toLowerCase().includes("amount") ||
          newCol.field?.toLowerCase().includes("total") ||
          newCol.field?.toLowerCase().includes("rate") ||
          newCol.field?.toLowerCase().includes("price")) {

          newCol.hozAlign = "right"; // số tiền
        }
        else if (newCol.field?.toLowerCase().includes("date")) {
          newCol.hozAlign = "center"; // ngày tháng
          if (!newCol.formatter) {
            newCol.formatter = (cell) => {
              const v = cell.getValue();
              return v ? new Date(v).toLocaleDateString("vi-VN") : "";
            };
          }
        }
        else {
          newCol.hozAlign = "left"; // text mặc định
        }
      }

      return newCol;
    });
  }

  // TODO:   end Trungtv update 23/09/2025 
  //#endregion
}
