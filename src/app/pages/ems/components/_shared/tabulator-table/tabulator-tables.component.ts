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
  RowComponent,
  ColumnDefinition,
  Options,
  TabulatorFull as Tabulator,
} from 'tabulator-tables';

@Component({
  selector: 'tabulator-table-single',
  template: `
    <div
      #tableContainer
      class="table-bordered tabulator-table"
    ></div>
  `,
})
export class TabulatorTableSingleComponent
  implements AfterViewInit, OnChanges, OnDestroy {
  //#region Properties
  @Input() tableData: any[] = [];
  @Input() selectableRow = true;
  @Input() hasSelection = true;
  @Input() dataTree = false;
  @Input() columnNames: ColumnDefinition[] = [];
  @Input() height: string = '';
  @Input() maxHeight: string = '';

  /** Emits whenever the selection changes */
  @Output() rowSelectionChanged = new EventEmitter<any[]>();
  /** Emits whenever the cell edited */
  @Output() cellEdited = new EventEmitter<CellComponent>();
  /** Emits whenever the table buildt */
  @Output() tableBuildt = new EventEmitter<any>();

  @ViewChild('tableContainer', { static: true })
  private tableContainer!: ElementRef<HTMLDivElement>;

  public table?: Tabulator;
  //#endregion

  //#region Life cycle
  ngAfterViewInit() {
    this.initializeTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.table) return;
    if (changes['tableData']) {
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

  //#region Methods
  private initializeTable() {
    const options: Options = {
      data: this.tableData,
      reactiveData: true,
      columns: this.columnNames,
      pagination: true,
      paginationSize: 10,
      layout: 'fitDataStretch',
      selectableRows: this.selectableRow,
      editTriggerEvent: 'click',
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: 'children',
    };
    if (this.height) options.height = this.height;
    if (this.maxHeight) options.maxHeight = this.maxHeight;
    if (this.dataTree) {
      options.dataTree = true;
      options.dataTreeStartExpanded = true;
      options.dataTreeChildField = 'children';
    }
    if (this.selectableRow)
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

    this.table = new Tabulator(this.tableContainer.nativeElement, options);
    this.table.on('rowSelectionChanged', (data: any[]) => {
      this.rowSelectionChanged.emit(data);
    });
    this.table.on('cellEdited', (cell: CellComponent) => {
      this.cellEdited.emit(cell);
    });
    this.table.on('tableBuilt', () => {
      this.tableBuildt.emit();
    });
  }

  public selectRowDatas(datas: any[]) {
    const indices: number[] = this.tableData.reduce((r, v, i) => {
      return r.concat(datas.includes(v) ? i : []);
    }, []);
    this.table?.selectRow(indices);
  }
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
  /** Get edited rows */
  public getEditedData() {
    const editedRowsSet = new Set<RowComponent>();
    const editedCells = this.table?.getEditedCells();
    editedCells?.forEach((cell) => {
      editedRowsSet.add(cell.getRow());
    });
    const editedRows = Array.from(editedRowsSet);
    return editedRows.map((row) => row.getData());
  }
  public redraw() {
    this.table?.redraw(true);
  }
  //#endregion
}
