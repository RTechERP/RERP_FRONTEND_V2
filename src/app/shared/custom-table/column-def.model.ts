export interface EditLookupConfig {
    /** Static data source. Optional when loadData is provided (used as fallback for display). */
    data?: any[];
    /** Lazy load function: called on popup open and on global search input change.
     *  Receives the current search query. Returns array or Promise<array>.
     *  When provided, the popup table data comes from this function. */
    loadData?: (query: string) => any[] | Promise<any[]>;
    /** Columns displayed in the lookup popup */
    columns: { field: string; header: string; width?: string }[];
    /** Field from selected row to store as the cell value */
    valueField: string;
    /** Field from selected row to display in the cell (defaults to valueField) */
    displayField?: string;
    /** Allow selecting multiple rows. Cell value becomes an array of valueField values. Default: false */
    multiSelect?: boolean;
}

export interface ColumnDef {
    /** The property name in the data object */
    field: string;
    /** Display name for the column header */
    header: string;
    /** Column width, e.g. '25%' or '200px' */
    width?: string;
    /** PrimeNG filter type: 'text' | 'numeric' | 'date'. Default: 'text' */
    filterType?: string;
    /** Filter UI mode: 'input' | 'dropdown' | 'multiselect' | 'datetime'. Default: 'input'
     *  'datetime' shows a date picker with toggle between single-date and date-range modes. */
    filterMode?: 'input' | 'dropdown' | 'multiselect' | 'datetime';
    /** Manual filter options. If empty, auto-populated from data. Format: [{label, value}] */
    filterOptions?: { label: string; value: any }[];
    /** Lazy load function for filter dropdown/multiselect options.
     *  Takes priority over filterOptions and auto-generated options from data.
     *  Called once when columns/data initialize. Returns options or Promise<options>. */
    filterLoadOptions?: () => { label: string; value: any }[] | Promise<{ label: string; value: any }[]>;
    /** Enable virtual scroll for multiselect filter (for large option lists). Default: false */
    filterVirtualScroll?: boolean;
    /** Virtual scroll item height in px. Default: 30 */
    filterVirtualScrollItemSize?: number;
    /** Enable sorting on this column */
    sortable?: boolean;
    /** Freeze this column */
    frozen?: boolean;
    /** Freeze direction: 'left' or 'right'. Default: 'left' */
    alignFrozen?: 'left' | 'right';
    /** Whether to wrap text or truncate with ellipsis. Default: false (truncate) */
    textWrap?: boolean;
    /** Enable inline editing for this column */
    editable?: boolean;
    /** Format function for display: (value, rowData?) => string.
     *  Example: (val) => val?.toLocaleString('vi-VN') + ' ₫' */
    format?: (value: any, rowData?: any) => string;
    /** CSS class(es) applied to both header and body cells.
     *  Example: 'text-right font-semibold' */
    cssClass?: string;
    /** Dynamic CSS class(es) applied to body cells based on row data. */
    cellClass?: (rowData: any) => string | string[] | Set<string> | { [klass: string]: any };
    /** Dynamic inline style applied to body cells based on row data. */
    cellStyle?: (rowData: any) => { [klass: string]: any } | null;
    /** Edit input type: 'text' (default) | 'number' | 'date' | 'lookup' | 'table-lookup' | 'textarea' | 'progressbar' | 'badge'.
     *  'date' shows a date picker. 'lookup' shows a searchable dropdown. 'table-lookup' shows a popup table.
     *  'progressbar' and 'badge' are read-only visual types. */
    editType?: 'text' | 'number' | 'date' | 'lookup' | 'table-lookup' | 'textarea' | 'progressbar' | 'badge';
    /** Dynamic severity for badge type based on row data. */
    badgeSeverity?: (rowData: any) => 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
    /** Date format for date picker (PrimeNG format). Default: 'dd/mm/yy'.
     *  Example: 'dd/mm/yy' → 11/03/2026, 'yy-mm-dd' → 2026-03-11 */
    editDateFormat?: string;
    /** Show time picker along with date picker. Default: false */
    editShowTime?: boolean;
    /** Options for lookup editor. Format: [{label, value}].
     *  Used when editType is 'lookup'. Renders a searchable p-select dropdown. */
    editOptions?: { label: string; value: any }[];
    /** Configuration for table-lookup editor.
     *  Used when editType is 'table-lookup'. Renders a popup overlay with searchable table. */
    editLookupConfig?: EditLookupConfig;
    /** Built-in footer aggregate. Applied automatically when showFooter=true.
     *  'sum' | 'avg' | 'count' | 'min' | 'max'
     *  Overridden by `footer` if both are set. */
    footerType?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    /** Number format options for footerType aggregates (Intl.NumberFormatOptions).
     *  Example: { minimumFractionDigits: 2, maximumFractionDigits: 2 } */
    footerFormat?: Intl.NumberFormatOptions;
    /** Footer cell content. Static string or function receiving the full dataset.
     *  Example: 'Total' | (data) => data.reduce((s, r) => s + r.price, 0).toLocaleString() */
    footer?: string | ((data: any[]) => string);
    /** CSS class(es) applied to the footer cell only (overrides cssClass for footer).
     *  If omitted, cssClass is used. */
    footerClass?: string;
    /** Emit cellAction event when cell is clicked (for action/icon columns). Default: false */
    clickable?: boolean;
    /** Custom HTML rendered inside the header cell (overrides col.header text). */
    headerFormat?: () => string;
    /** Emit headerCellAction when the header cell is clicked. Requires headerFormat. Default: false */
    headerClickable?: boolean;
}
