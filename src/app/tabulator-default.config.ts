import { TabulatorFull as Tabulator, Options } from 'tabulator-tables';

export const DEFAULT_TABLE_CONFIG: Options = {
  layout: 'fitDataFill',
  height: '90vh',
  pagination: true,
  paginationSize: 50,
  paginationSizeSelector: [10, 30, 50, 100, 300, 500],
  paginationMode: 'remote',
  movableColumns: true,
  resizableRows: true,
  reactiveData: true,
  //   selectableRows: 1,
  langs: {
    vi: {
      pagination: {
        first: '<<',
        last: '>>',
        prev: '<',
        next: '>',
      },
    },
  },
  locale: 'vi',
  columnDefaults: {
    headerWordWrap: true,
    headerVertical: false,
    headerHozAlign: 'center',
    minWidth: 60,
    hozAlign: 'left',
    vertAlign: 'middle',
    resizable: true,
  },

  rowHeader: {
    width: 20,
    headerSort: false,
    resizable: false,
    frozen: true,
    headerHozAlign: 'center',
    hozAlign: 'center',
    formatter: 'rowSelection',
    titleFormatter: 'rowSelection',
    cellClick: function (e, cell) {
      cell.getRow().toggleSelect();
    },
  },
};
