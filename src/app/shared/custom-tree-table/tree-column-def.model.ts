import { EditLookupConfig } from '../custom-table/column-def.model';

export type { EditLookupConfig };

export interface TreeColumnDef {
    /** The property name in the node.data object */
    field: string;
    /** Display name for the column header */
    header: string;
    /** Column width, e.g. '25%' or '200px' */
    width?: string;
    /** Enable sorting on this column */
    sortable?: boolean;
    /** Freeze this column */
    frozen?: boolean;
    /** Freeze direction: 'left' or 'right'. Default: 'left' */
    alignFrozen?: 'left' | 'right';
    /** PrimeNG filter type: 'text' | 'numeric' | 'date'. Default: 'text' */
    filterType?: string;
    /** Filter UI mode: 'input' | 'dropdown' | 'multiselect'. Default: 'input' */
    filterMode?: 'input' | 'dropdown' | 'multiselect';
    /** Manual filter options. Format: [{label, value}] */
    filterOptions?: { label: string; value: any }[];
    /** Lazy-load filter options once on init (returns Promise or array) */
    filterLoadOptions?: () => { label: string; value: any }[] | Promise<{ label: string; value: any }[]>;
    /** Virtual scroll for multiselect filter */
    filterVirtualScroll?: boolean;
    /** Item height (px) for filter virtual scroll */
    filterVirtualScrollItemSize?: number;
    /** Enable inline editing for this column */
    editable?: boolean;
    /** Whether to wrap text or truncate with ellipsis */
    textWrap?: boolean;
    /** Format function for display: (value, rowData?) => string */
    format?: (value: any, rowData?: any) => string;
    /** CSS class(es) applied to header, body, and footer cells. */
    cssClass?: string;
    /** Dynamic CSS class(es) applied to body cells based on row data. */
    cellClass?: (rowData: any) => string | string[] | Set<string> | { [klass: string]: any };
    /** Dynamic inline style applied to body cells based on row data. */
    cellStyle?: (rowData: any) => { [klass: string]: any } | null;
    /** Edit type. Default: 'text' */
    editType?: 'text' | 'number' | 'date' | 'lookup' | 'table-lookup' | 'textarea' | 'progressbar' | 'badge';
    /** Dynamic severity for badge type based on row data. */
    badgeSeverity?: (rowData: any) => 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
    /** Date format for date picker (PrimeNG format). Default: 'dd/mm/yy' */
    editDateFormat?: string;
    /** Show time picker along with date picker. Default: false */
    editShowTime?: boolean;
    /** Options for lookup editor: [{label, value}] */
    editOptions?: { label: string; value: any }[];
    /** Configuration for table-lookup editor */
    editLookupConfig?: EditLookupConfig;
    /** Built-in footer aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' */
    footerType?: 'sum' | 'avg' | 'count' | 'min' | 'max';
    /** Intl.NumberFormatOptions applied when using footerType */
    footerFormat?: Intl.NumberFormatOptions;
    /** Static text or function returning footer text. Receives flattened leaf data. */
    footer?: string | ((data: any[]) => string);
    /** CSS class for footer cell (overrides cssClass) */
    footerClass?: string;
    /** Emit cellAction event when cell is clicked (for action/icon columns). Default: false */
    clickable?: boolean;
    /** Show the tree expand/collapse toggler in this column (instead of the default first column). */
    treeToggler?: boolean;
    /** Custom HTML rendered inside the header cell (overrides col.header text). */
    headerFormat?: () => string;
    /** Emit headerCellAction when the header cell is clicked. Requires headerFormat. Default: false */
    headerClickable?: boolean;
}
