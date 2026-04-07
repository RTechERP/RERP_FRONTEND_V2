import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, inject, HostListener, HostBinding, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { Popover, PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { OrderListModule } from 'primeng/orderlist';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { MenuItem, FilterService } from 'primeng/api';
import { ColumnDef, EditLookupConfig } from './column-def.model';
import { TableLayoutService } from './table-layout.service';
import { UserService } from '../../services/user.service';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-custom-table',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, InputTextModule,
        SelectModule, MultiSelectModule, ButtonModule, IconFieldModule, InputIconModule,
        ContextMenuModule, PopoverModule, DatePickerModule, TextareaModule, CheckboxModule,
        TabsModule, ProgressBarModule, TagModule, DialogModule, OrderListModule,
        ScrollingModule
    ],
    templateUrl: './custom-table.html',
    styleUrl: './custom-table.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTable implements OnChanges, AfterViewInit, OnDestroy {
    @ViewChild('dt') dt!: Table;
    @ViewChild('cm') cm!: ContextMenu;
    @ViewChild('hcm') hcm!: ContextMenu;
    @ViewChild('lookupPanel') lookupPanel!: Popover;

    private el = inject(ElementRef);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone);
    private filterService = inject(FilterService);
    private tableLayoutService = inject(TableLayoutService);
    private userService = inject(UserService);
    @HostBinding('attr.tabindex') tabindex = '0';

    constructor() {
        this.filterService.register('dateIs', (value: any, filter: any) => {
            if (filter === undefined || filter === null) return true;
            if (value === undefined || value === null) return false;

            const vDate = new Date(value);
            if (isNaN(vDate.getTime())) return false; // Không phải là ngày hợp lệ

            const fDate = new Date(filter);

            return vDate.getDate() === fDate.getDate() &&
                vDate.getMonth() === fDate.getMonth() &&
                vDate.getFullYear() === fDate.getFullYear();
        });
    }

    @Input() minWidth: string = '50rem';

    get tableStyleObj(): { [key: string]: string | null } {
        return { 'min-width': this.minWidth, 'width': this.resizeMode === 'expand' ? null : '100%' };
    }

    // --- Highlighting State ---
    globalFilterValue: string = '';

    // --- Excel Filter State ---
    excelFilterSearchText: { [field: string]: string } = {};
    activeFilterTab: { [field: string]: string } = {};
    customFilterMatchMode: { [field: string]: string } = {};
    customFilterValue: { [field: string]: any } = {};

    // --- DateTime Filter State ---
    dateFilterMode: { [field: string]: 'single' | 'range' } = {};
    dateRangeFilter: { [field: string]: Date[] } = {};
    dateSingleFilter: { [field: string]: Date | null } = {};

    // --- Table Lookup State ---
    lookupSearchText: string = '';
    lookupColFilters: { [field: string]: string } = {};
    lookupFilteredData: any[] = [];
    lookupLoading: boolean = false;
    activeLookupCol: ColumnDef | null = null;
    activeLookupRowData: any = null;
    lookupSelectedRows: any[] = [];
    /** Cache of last-loaded data per field (for formatValue when using loadData) */
    private lookupDataCache: { [field: string]: any[] } = {};

    // --- Cell Value Cache (avoid re-calling formatValue + getHighlightedText per CD cycle) ---
    private cellValueCache = new Map<string, string>();

    // --- Cell Focus State ---
    focusedCell: { rowData: any, colField: string } | null = null;
    private lookupDebounceTimer: any = null;

    // --- Data ---
    private _originalData: any[] = [];
    private _data: any[] = [];

    @Input() set data(val: any[]) {
        this._originalData = val ? [...val] : [];
        this._data = val ? [...val] : [];
        this.cellValueCache.clear();
        this.scheduleBuildFilterOptionsCache();
    }
    get data(): any[] {
        return this._data;
    }
    @Input() columns: ColumnDef[] = [];
    @Input() dataKey: string = '';
    @Input() loading: boolean = false;

    // --- Caption ---
    @Input() title: string = '';
    @Input() showGlobalFilter: boolean = false;
    @Input() globalFilterFields: string[] = [];

    get actualGlobalFilterFields(): string[] {
        if (this.globalFilterFields && this.globalFilterFields.length > 0) {
            return this.globalFilterFields;
        }
        return this.columns ? this.columns.filter(c => c.field).map(c => c.field) : [];
    }

    // --- Layout ---
    @Input() height: string = '100%';
    @HostBinding('style.height') get hostHeight() { return this.height; }
    @Input() resizable: boolean = true;
    @Input() resizeMode: string = 'expand';
    @Input() showGridlines: boolean = true;
    @Input() fontSize: string = '10px';
    @HostBinding('style.--table-font-size') get tableFontSizeVar() { return this.fontSize; }
    @HostBinding('style.--virtual-row-height') get virtualRowHeightVar() { return this.isVirtualScroll ? this.virtualScrollItemSize + 'px' : null; }
    @HostBinding('class.vs-active') get vsActiveClass() { return this.isVirtualScroll; }
    /** 'auto' = columns size to content; 'fixed' = use the widths set in column definitions */
    @Input() columnLayout: 'auto' | 'fixed' = 'auto';
    _columnLayout: 'auto' | 'fixed' = 'auto';
    @HostBinding('style.--table-col-layout') get colLayoutVar() { return this._columnLayout; }
    @Input() showColumnFilter: boolean = true;
    /** 'row' = filter inputs below header (default), 'menu' = filter icon in header opens popup */
    @Input() filterDisplay: 'row' | 'menu' = 'row';
    @Input() textWrap: boolean = false;
    @Input() stripedRows: boolean = false;

    // --- Scrollable ---
    @Input() scrollable: boolean = false;
    @Input() scrollHeight: string = 'flex';

    // --- Virtual Scrolling ---
    @Input() virtualScroll: boolean = false;
    @Input() virtualScrollItemSize: number = 46;
    /** Auto-enable virtual scroll when data exceeds this threshold (0 = disabled) */
    @Input() lazyRenderThreshold: number = 100;

    /** Resolved: true if virtualScroll is on OR data exceeds threshold */
    get isVirtualScroll(): boolean {
        return this.virtualScroll || (this.lazyRenderThreshold > 0 && this._data.length > this.lazyRenderThreshold);
    }

    /** Resolved: scrollable must be true when virtual scroll is active */
    get isScrollable(): boolean {
        return this.scrollable || this.isVirtualScroll;
    }

    /** Resolved scroll height */
    get resolvedScrollHeight(): string {
        return this.isScrollable ? (this.scrollHeight || 'flex') : '';
    }

    // --- Row Grouping ---
    @Input() rowGroupMode: 'subheader' | 'rowspan' | undefined = undefined;
    @Input() groupRowsBy: string = '';
    @Input() rowGroupShowFooter: boolean = false;
    @Input() expandableRowGroups: boolean = false;
    expandedRowKeys: { [key: string]: boolean } = {};
    /** Field used as the key for cell rowspan merging. Consecutive rows with the same value will be merged for columns marked rowSpan=true */
    @Input() rowSpanBy: string = '';

    // --- Pagination ---
    @Input() paginator: boolean = false;
    @Input() rows: number = 10;
    @Input() rowsPerPageOptions: number[] = [10, 20, 50];

    // --- Sorting ---
    @Input() sortMode: 'single' | 'multiple' = 'single';

    // --- Selection ---
    @Input() selectionMode: 'single' | 'multiple' | null = null;
    @Input() selection: any = null;
    @Output() selectionChange = new EventEmitter<any>();

    // --- Context Menu ---
    @Input() contextMenuItems: MenuItem[] = [];
    @Input() selectedContextRow: any = null;
    @Output() selectedContextRowChange = new EventEmitter<any>();
    @Output() contextMenuSelectionChange = new EventEmitter<any>();

    // --- Column Reorder ---
    @Input() reorderableColumns: boolean = false;

    // --- Row Reorder ---
    @Input() reorderableRows: boolean = false;
    @Output() rowReorder = new EventEmitter<any>();

    // --- Table Lookup ---
    @Output() lookupSelect = new EventEmitter<{ selectedRow: any; field: string; rowData: any }>();

    // --- Cell Action (fired for clickable columns, e.g. delete icon) ---
    @Output() cellAction = new EventEmitter<{ field: string; rowData: any }>();

    // --- Header Cell Action (fired for headerClickable columns, e.g. upload button in header) ---
    @Output() headerCellAction = new EventEmitter<{ field: string }>();

    onHeaderCellClick(event: Event, col: ColumnDef) {
        event.stopPropagation();
        if (col.headerClickable) {
            this.headerCellAction.emit({ field: col.field });
        }
    }

    // --- Row Expansion ---
    @Input() expandable: boolean = false;
    @Input() rowExpandMode: 'single' | 'multiple' = 'multiple';
    expandedRows: { [key: string]: boolean } = {};

    // --- Click Row Select (highlight active row on cell click, always single) ---
    /** Bật highlight dòng khi click bất kỳ cell nào. Luôn là single: click dòng khác → bỏ highlight dòng cũ.
     *  Hoạt động độc lập với selectionMode="multiple" (checkbox multi-select). */
    @Input() clickSelectRow: boolean = false;
    // --- Styling ---
    @Input() rowClass: ((rowData: any) => string | string[] | Set<string> | { [klass: string]: any }) | null = null;
    @Input() headerGroups: any[][] = [];

    // --- Column Chooser ---
    showColumnChooser: boolean = false;
    chooserColumns: ColumnDef[] = [];
    @Output() rowClick = new EventEmitter<any>();
    @Output() rowDoubleClick = new EventEmitter<any>();
    @Output() rowDblClick = new EventEmitter<any>();
    clickedRowKey: any = null;

    onRowClick(rowData: any) {
        if (!this.clickSelectRow) return;
        const newKey = this.dataKey ? rowData[this.dataKey] : rowData;
        if (this.clickedRowKey !== newKey) {
            // Only clear focusedCell if it belongs to the OLD row.
            // If onCellClick already set focusedCell to the new row, keep it.
            const focusedKey = this.focusedCell
                ? (this.dataKey ? this.focusedCell.rowData[this.dataKey] : this.focusedCell.rowData)
                : null;
            if (focusedKey !== newKey) {
                this.focusedCell = null;
            }
        }
        this.clickedRowKey = newKey;
        this.rowClick.emit(rowData);
    }

    isRowClicked(rowData: any): boolean {
        if (!this.clickSelectRow) return false;
        const key = this.dataKey ? rowData[this.dataKey] : rowData;
        return this.clickedRowKey === key;
    }

    onRowDoubleClick(rowData: any) {
        this.rowDoubleClick.emit(rowData);
    }

    onRowDblClick(rowData: any) {
        this.rowDblClick.emit(rowData);
    }

    // --- RowSpan helpers ---
    private getDisplayedData(): any[] {
        return (this.dt?.filteredValue as any[]) || this.data;
    }

    /** Returns false for cells that should be hidden because the row above spans over them */
    showRowSpanCell(rowIndex: number, col: ColumnDef): boolean {
        if (!col.rowSpan || !this.rowSpanBy) return true;
        if (rowIndex === 0) return true;
        const data = this.getDisplayedData();
        return data[rowIndex]?.[this.rowSpanBy] !== data[rowIndex - 1]?.[this.rowSpanBy];
    }

    /** Returns span count for the first row of a group, null for subsequent rows */
    getRowSpanCount(rowIndex: number): number | null {
        if (!this.rowSpanBy) return null;
        const data = this.getDisplayedData();
        const key = data[rowIndex]?.[this.rowSpanBy];
        if (rowIndex > 0 && data[rowIndex - 1]?.[this.rowSpanBy] === key) return null;
        let count = 1;
        while (rowIndex + count < data.length && data[rowIndex + count]?.[this.rowSpanBy] === key) {
            count++;
        }
        return count > 1 ? count : null;
    }

    // --- Footer ---
    @Input() showFooter: boolean = false;

    getFooterValue(col: ColumnDef): string {
        if (col.footer) {
            if (typeof col.footer === 'function') return col.footer(this.data);
            return col.footer;
        }
        if (col.footerType) {
            const vals = this.data
                .map(r => r[col.field])
                .filter(v => v != null && !isNaN(Number(v)))
                .map(Number);
            const fmt = col.footerFormat;
            switch (col.footerType) {
                case 'sum': return vals.reduce((s, v) => s + v, 0).toLocaleString(undefined, fmt);
                case 'avg': return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toLocaleString(undefined, fmt) : '';
                case 'count': return this.data.length.toString();
                case 'min': return vals.length ? Math.min(...vals).toLocaleString(undefined, fmt) : '';
                case 'max': return vals.length ? Math.max(...vals).toLocaleString(undefined, fmt) : '';
            }
        }
        return '';
    }

    /** Returns cssClass merged with auto text-align.
     *  Numeric columns → text-right; others → default (left).
     *  If base already contains an explicit alignment class, skip auto-align. */
    getAutoAlignClass(base: string | undefined, col: ColumnDef): string {
        const cls = base || '';
        if (cls.includes('text-right') || cls.includes('text-left') || cls.includes('text-center')) {
            return cls;
        }
        return (cls + (col.filterType === 'numeric' ? ' text-right' : '')).trim();
    }

    /** Build the CSS class string for a body <td>. Returns a single pre-built string
     *  so Angular doesn't diff a new array on every CD cycle. */
    getTdClass(col: ColumnDef, rowData: any): string {
        let cls = this.autoAlignCache[col.field] || '';
        if (col.cellClass) cls += ' ' + col.cellClass(rowData);
        if (col.frozen) cls += col.alignFrozen === 'right' ? ' frozen-right' : ' frozen-left';
        if (this.focusedCell && this.focusedCell.rowData === rowData && this.focusedCell.colField === col.field) cls += ' focused-cell';
        return cls;
    }

    // --- Cell Editing ---
    @Input() editMode: 'cell' | 'row' | undefined = undefined;

    // --- CSV Export ---
    @Input() exportable: boolean = false;
    @Input() exportFilename: string = 'download';

    // --- State Persistence ---
    @Input() stateKey: string | undefined = undefined;
    @Input() stateStorage: 'session' | 'local' = 'local';
    @Input() tableId: string = '';

    // --- Header Context Menu ---
    headerMenuItems: MenuItem[] = [];
    activeSortField: string | null = null;
    private _allColumns: ColumnDef[] = [];
    private _hiddenFields: Set<string> = new Set();
    private _snapshotTaken = false;
    private _originalColumnsOrder: string[] = [];
    private _originalWidths: { [field: string]: string } = {};
    private _layoutModified = false;

    // --- Filter Options Cache ---
    filterOptionsCache: { [field: string]: { label: string; value: any }[] } = {};
    private _cacheScheduleId: any = null;

    // --- Pre-computed auto-align class per column (avoid per-cell recalc) ---
    autoAlignCache: { [field: string]: string } = {};

    private scrollUnlisten: (() => void) | null = null;
    private _viewInitialized = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columnLayout']) {
            this._columnLayout = this.columnLayout;
        }
        if (changes['data'] || changes['columns']) {
            this.scheduleBuildFilterOptionsCache();
        }
        if (changes['columns'] && this.columns) {
            this._allColumns = [...this.columns];
            this.rebuildAutoAlignCache();
            if (this._viewInitialized) {
                setTimeout(() => this.recalcFrozenPositions());
            }
            if (!this._snapshotTaken && this.tableId) {
                this._snapshotTaken = true;
                this._originalColumnsOrder = this._allColumns.map(c => c.field);
                this._originalWidths = {};
                this._allColumns.forEach(c => { if (c.width) this._originalWidths[c.field] = c.width; });
                this.loadTableLayout();
            } else {
                this.columns = this.visibleColumns;
            }
        }
    }

    ngAfterViewInit(): void {
        this._viewInitialized = true;
        // Patch: run scroll events outside Angular zone so scrolling doesn't trigger CD
        this.zone.runOutsideAngular(() => {
            const scrollable = this.el.nativeElement.querySelector('.p-datatable-scrollable-body, .p-scroller');
            if (scrollable) {
                const handler = () => { }; // passive listener to prevent zone.js patching
                scrollable.addEventListener('scroll', handler, { passive: true });
                this.scrollUnlisten = () => scrollable.removeEventListener('scroll', handler);
            }
        });
        // Fix frozen header positions:
        // Run after PrimeNG's updateStickyPosition microtask (Promise.resolve) using configured col widths
        setTimeout(() => this.recalcFrozenPositions());
        // Also run after DOM layout completes for auto-width columns
        setTimeout(() => this.recalcFrozenPositions(), 200);
    }

    ngOnDestroy(): void {
        this.scrollUnlisten?.();
    }

    private rebuildAutoAlignCache() {
        this.autoAlignCache = {};
        for (const col of this.columns) {
            this.autoAlignCache[col.field] = this.getAutoAlignClass(col.cssClass, col);
        }
    }

    get visibleColumns(): ColumnDef[] {
        return this._allColumns.filter(c => c.visible !== false && !this._hiddenFields.has(c.field));
    }

    get isLayoutModified(): boolean {
        return this._layoutModified;
    }

    // --- Filter Options (auto-populated from data, or lazy-loaded) ---
    scheduleBuildFilterOptionsCache() {
        if (this._cacheScheduleId != null) return;
        this._cacheScheduleId = setTimeout(() => {
            this._cacheScheduleId = null;
            this.buildFilterOptionsCache();
            this.cdr.markForCheck();
        }, 0);
    }

    buildFilterOptionsCache() {
        // Only pre-build static options (filterOptions / filterLoadOptions).
        // Data-derived options for dropdown/multiselect are built lazily in
        // getFilterOptions() to avoid blocking the main thread on large datasets.
        if (!this.columns?.length) return;
        for (const col of this.columns) {
            if (col.filterLoadOptions) {
                Promise.resolve(col.filterLoadOptions()).then(opts => {
                    this.filterOptionsCache[col.field] = opts;
                    this.cdr.markForCheck();
                });
            } else if (col.filterOptions) {
                this.filterOptionsCache[col.field] = col.filterOptions;
            }
            // Data-derived options: clear stale cache so getFilterOptions() rebuilds on next access.
            else if (col.filterMode === 'dropdown' || col.filterMode === 'multiselect') {
                delete this.filterOptionsCache[col.field];
            }
        }
    }

    getFilterOptions(col: ColumnDef): { label: string; value: any }[] {
        if (this.filterOptionsCache[col.field] !== undefined) {
            return this.filterOptionsCache[col.field];
        }
        // Lazy build from data on first access (e.g. when user opens the filter panel).
        if ((col.filterMode === 'dropdown' || col.filterMode === 'multiselect') && this._data?.length) {
            const unique = [...new Set(this._data.map(d => d[col.field]).filter(v => v != null))];
            this.filterOptionsCache[col.field] = unique.map(v => ({ label: String(v), value: v }));
            return this.filterOptionsCache[col.field];
        }
        return [];
    }


    // --- TrackBy ---
    trackByField(_: number, col: ColumnDef): string { return col.field; }
    trackByIndex(i: number): number { return i; }

    onGlobalFilter(event: Event) {
        this.globalFilterValue = (event.target as HTMLInputElement).value;
        this.cellValueCache.clear();
        this.dt.filterGlobal(this.globalFilterValue, 'contains');
    }

    getHighlightedText(text: any): string {
        if (!this.globalFilterValue || text == null) return String(text || '');
        const str = String(text);
        const term = this.globalFilterValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${term})`, 'gi');
        return str.replace(regex, '<mark>$1</mark>');
    }

    /** Memoized cell value: formatValue + getHighlightedText once per cell, cached across CD cycles */
    getCellValue(col: ColumnDef, rowData: any): string {
        const rowKey = this.dataKey ? rowData[this.dataKey] : null;
        const cacheKey = rowKey != null ? `${col.field}__${rowKey}__${this.globalFilterValue}` : null;
        if (cacheKey) {
            const cached = this.cellValueCache.get(cacheKey);
            if (cached !== undefined) return cached;
        }
        const result = this.getHighlightedText(this.formatValue(col, rowData));
        if (cacheKey) this.cellValueCache.set(cacheKey, result);
        return result;
    }

    isFilterSelected(value: any[], val: any): boolean {
        return !!(value && value.includes(val));
    }

    toggleFilter(value: any[], val: any, filterCallback: (v: any) => void) {
        const current = value || [];
        if (current.includes(val)) {
            filterCallback(current.filter(v => v !== val));
        } else {
            filterCallback([...current, val]);
        }
    }

    selectAllFilter(col: ColumnDef, filterCallback: (v: any) => void) {
        const options = this.getFilterOptions(col);
        filterCallback(options.map(o => o.value));
    }

    clearFilter(filterCallback: (v: any) => void) {
        filterCallback(null);
    }

    isAllFilterSelected(value: any[], col: ColumnDef): boolean {
        const options = this.getFilterOptions(col);
        if (!options.length) return false;
        return !!(value && value.length === options.length);
    }

    toggleAllFilter(value: any[], col: ColumnDef, filterCallback: (v: any) => void) {
        if (this.isAllFilterSelected(value, col)) {
            filterCallback(null);
        } else {
            const options = this.getFilterOptions(col);
            filterCallback(options.map(o => o.value));
        }
    }

    getDefaultMatchMode(filterType: string = 'text'): string {
        if (filterType === 'numeric') return 'equals';
        if (filterType === 'date' || filterType === 'datetime' || filterType === 'time') return 'dateIs';
        return 'contains';
    }

    getMatchMode(field: string, filterType: string = 'text'): string {
        if (this.activeFilterTab[field] === '1') {
            return this.customFilterMatchMode[field] || this.getDefaultMatchMode(filterType);
        }
        return 'in';
    }

    getCustomFilterMatchModes(filterType: string = 'text'): any[] {
        if (filterType === 'numeric') {
            return [
                { label: 'Equals', value: 'equals' },
                { label: 'Not Equals', value: 'notEquals' },
                { label: 'Less Than', value: 'lt' },
                { label: 'Less Than or Equal To', value: 'lte' },
                { label: 'Greater Than', value: 'gt' },
                { label: 'Greater Than or Equal To', value: 'gte' }
            ];
        } else if (filterType === 'date' || filterType === 'datetime' || filterType === 'time') {
            return [
                { label: 'Is', value: 'dateIs' },
                { label: 'Is Not', value: 'dateIsNot' },
                { label: 'Before', value: 'dateBefore' },
                { label: 'After', value: 'dateAfter' }
            ];
        }
        return [
            { label: 'Begins With', value: 'startsWith' },
            { label: 'Contains', value: 'contains' },
            { label: 'Ends With', value: 'endsWith' },
            { label: 'Equals', value: 'equals' },
            { label: 'Not Equals', value: 'notEquals' }
        ];
    }

    applyCustomFilter(field: string, checkboxValue: any, filterCallback: Function) {
        if (this.activeFilterTab[field] === '1') {
            filterCallback(this.customFilterValue[field]);
        } else {
            filterCallback(checkboxValue);
        }
    }

    clearCustomFilter(field: string, filterCallback: Function) {
        this.customFilterValue[field] = null;
        filterCallback(null);
    }

    // =============================================
    // DateTime Filter
    // =============================================
    toggleDateFilterMode(field: string, filterCallback: Function) {
        this.dateFilterMode[field] = this.dateFilterMode[field] === 'range' ? 'single' : 'range';
        this.dateRangeFilter[field] = [];
        this.dateSingleFilter[field] = null;
        filterCallback(null);
    }

    onDateRangeChange(field: string, value: Date[], filterCallback: Function) {
        this.dateRangeFilter[field] = value;
        if (value && value.length >= 2 && value[0] && value[1]) {
            filterCallback(value);
        } else if (!value || value.length === 0) {
            filterCallback(null);
        }
    }

    getFilteredOptions(col: ColumnDef): { label: string; value: any }[] {
        const options = this.getFilterOptions(col);
        const term = (this.excelFilterSearchText[col.field] || '').toLowerCase();
        if (!term) return options;
        return options.filter(o => o.label.toLowerCase().includes(term));
    }

    trackByValue(_index: number, opt: { label: string; value: any }): any {
        return opt.value;
    }

    onSelectionChange(selection: any) {
        this.selection = selection;
        this.selectionChange.emit(selection);
        this.focusedCell = null;
    }

    toggleGroup(group: string) {
        if (this.expandedRows[group]) {
            delete this.expandedRows[group];
        } else {
            this.expandedRows[group] = true;
        }
    }

    isGroupExpanded(group: string): boolean {
        return !!this.expandedRows[group];
    }

    onContextMenuSelect(event: any) {
        this.selectedContextRow = event.data;
        if (this.contextMenuItems) {
            this.contextMenuItems.forEach(item => (item as any).data = event.data);
        }
        this.selectedContextRowChange.emit(event.data);
        this.contextMenuSelectionChange.emit(event.data);
        if (this.selectionMode) {
            if (Array.isArray(this.selection)) {
                if (!this.selection.includes(event.data)) {
                    this.selection = [...this.selection, event.data];
                    this.selectionChange.emit(this.selection);
                }
            } else {
                this.selection = [event.data];
                this.selectionChange.emit(this.selection);
            }
        }
    }

    formatValue(col: ColumnDef, rowData: any): string {
        const val = rowData[col.field];
        if (col.format) {
            return col.format(val, rowData);
        }
        if (col.editType === 'date' && val instanceof Date) {
            return this.formatDate(val, col.editDateFormat || 'dd/mm/yy', col.editShowTime);
        }
        if (col.editType === 'lookup' && col.editOptions) {
            const opt = col.editOptions.find(o => o.value === val);
            if (opt) return opt.label;
        }
        if (col.editType === 'table-lookup' && col.editLookupConfig) {
            const cfg = col.editLookupConfig;
            const source = cfg.data || this.lookupDataCache[col.field] || [];
            if (cfg.multiSelect && Array.isArray(val)) {
                return val.map(v => {
                    const r = source.find(d => d[cfg.valueField] === v);
                    return r ? r[cfg.displayField || cfg.valueField] : v;
                }).join(', ');
            }
            const row = source.find(d => d[cfg.valueField] === val);
            if (row) return row[cfg.displayField || cfg.valueField];
        }
        return val != null ? val : '';
    }

    private formatDate(date: Date, fmt: string, showTime?: boolean): string {
        const pad = (n: number) => n < 10 ? '0' + n : '' + n;
        const dd = pad(date.getDate());
        const mm = pad(date.getMonth() + 1);
        const yy = date.getFullYear().toString();
        let result = fmt
            .replace('dd', dd)
            .replace('mm', mm)
            .replace('yy', yy);
        if (showTime) {
            result += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }
        return result;
    }

    async openTableLookup(event: Event, col: ColumnDef, rowData: any) {
        this.activeLookupCol = col;
        this.activeLookupRowData = rowData;
        this.lookupSearchText = '';
        this.lookupColFilters = {};
        this.lookupSelectedRows = [];
        clearTimeout(this.lookupDebounceTimer);

        const cfg = col.editLookupConfig!;

        // Show panel immediately (may show loading spinner)
        this.lookupPanel.hide();
        setTimeout(() => this.lookupPanel.show(event));

        if (cfg.loadData) {
            this.lookupLoading = true;
            this.lookupFilteredData = [];
            try {
                const result = await Promise.resolve(cfg.loadData(''));
                this.lookupFilteredData = result;
                this.lookupDataCache[col.field] = result; // cache for formatValue
            } finally {
                this.lookupLoading = false;
                this.cdr.markForCheck();
            }
        } else {
            this.lookupFilteredData = cfg.data || [];
        }

        // Init selected rows after data is available
        if (cfg.multiSelect) {
            const currentVal: any[] = rowData[col.field] ?? [];
            this.lookupSelectedRows = this.lookupFilteredData.filter(r => currentVal.includes(r[cfg.valueField]));
        }
    }

    filterLookupData() {
        const cfg = this.activeLookupCol?.editLookupConfig;
        if (!cfg) return;

        if (cfg.loadData) {
            // Debounce API calls by 300ms
            clearTimeout(this.lookupDebounceTimer);
            this.lookupDebounceTimer = setTimeout(async () => {
                this.lookupLoading = true;
                try {
                    const result = await Promise.resolve(cfg.loadData!(this.lookupSearchText));
                    // Apply column-level filters client-side on returned data
                    this.lookupFilteredData = this.applyLookupColFilters(cfg, result);
                } finally {
                    this.lookupLoading = false;
                    this.cdr.markForCheck();
                }
            }, 300);
            return;
        }

        // Static data: filter client-side
        const globalTerm = this.lookupSearchText.toLowerCase();
        this.lookupFilteredData = (cfg.data || []).filter(row => {
            if (globalTerm) {
                const matchesGlobal = cfg.columns.some(c => {
                    const val = row[c.field];
                    return val != null && String(val).toLowerCase().includes(globalTerm);
                });
                if (!matchesGlobal) return false;
            }
            return this.applyLookupColFilters(cfg, [row]).length > 0;
        });
    }

    private applyLookupColFilters(cfg: EditLookupConfig, data: any[]): any[] {
        return data.filter(row =>
            cfg.columns.every((c: { field: string }) => {
                const colTerm = (this.lookupColFilters[c.field] || '').toLowerCase();
                if (!colTerm) return true;
                const val = row[c.field];
                return val != null && String(val).toLowerCase().includes(colTerm);
            })
        );
    }

    /** Single-select: click any cell → select and close */
    selectLookupRow(row: any) {
        if (!this.activeLookupCol || !this.activeLookupRowData) return;
        const cfg = this.activeLookupCol.editLookupConfig!;
        if (cfg.multiSelect) return; // handled by toggleLookupRow
        this.activeLookupRowData[this.activeLookupCol.field] = row[cfg.valueField];
        this.lookupSelect.emit({ selectedRow: row, field: this.activeLookupCol.field, rowData: this.activeLookupRowData });
        this.lookupPanel.hide();
        this.activeLookupCol = null;
        this.activeLookupRowData = null;
    }

    /** Multi-select: click checkbox to toggle row */
    toggleAllLookupRows() {
        if (this.lookupSelectedRows.length === this.lookupFilteredData.length) {
            this.lookupSelectedRows = [];
        } else {
            this.lookupSelectedRows = [...this.lookupFilteredData];
        }
    }

    toggleLookupRow(row: any) {
        const cfg = this.activeLookupCol?.editLookupConfig;
        if (!cfg) return;
        const idx = this.lookupSelectedRows.findIndex(r => r[cfg.valueField] === row[cfg.valueField]);
        if (idx >= 0) {
            this.lookupSelectedRows = this.lookupSelectedRows.filter((_, i) => i !== idx);
        } else {
            this.lookupSelectedRows = [...this.lookupSelectedRows, row];
        }
    }

    /** Multi-select: confirm button → apply and close */
    confirmLookupSelection() {
        if (!this.activeLookupCol || !this.activeLookupRowData) return;
        const cfg = this.activeLookupCol.editLookupConfig!;
        this.activeLookupRowData[this.activeLookupCol.field] =
            this.lookupSelectedRows.map(r => r[cfg.valueField]);
        this.lookupSelect.emit({
            selectedRow: this.lookupSelectedRows,
            field: this.activeLookupCol.field,
            rowData: this.activeLookupRowData
        });
        this.lookupPanel.hide();
        this.activeLookupCol = null;
        this.activeLookupRowData = null;
    }

    isLookupRowSelected(row: any): boolean {
        const cfg = this.activeLookupCol?.editLookupConfig;
        if (!cfg) return false;
        if (cfg.multiSelect) {
            return this.lookupSelectedRows.some(r => r[cfg.valueField] === row[cfg.valueField]);
        }
        if (!this.activeLookupRowData) return false;
        const cur = this.activeLookupRowData[this.activeLookupCol!.field];
        return cur === row[cfg.valueField];
    }

    // =============================================
    // Header Context Menu (DevExpress-style)
    // =============================================
    onHeaderContextMenu(event: any, field: string) {
        this.activeSortField = field;
        const col = this._allColumns.find(c => c.field === field);

        this.headerMenuItems = [];

        // --- Sort ---
        if (col?.sortable) {
            this.headerMenuItems.push(
                { label: 'Sắp xếp tăng', icon: 'pi pi-sort-amount-up', command: () => this.sortAscending() },
                { label: 'Sắp xếp giảm', icon: 'pi pi-sort-amount-down', command: () => this.sortDescending() },
                { label: 'Bỏ sắp xếp', icon: 'pi pi-sort-alt-slash', command: () => this.clearSort() },
                { separator: true }
            );
        }

        // --- Column Visibility ---
        this.headerMenuItems.push(
            { label: 'Ẩn cột này', icon: 'pi pi-eye-slash', command: () => this.hideColumn(field) },
            { label: 'Cột nâng cao', icon: 'pi pi-list', command: () => this.openColumnChooser() },
            {
                label: 'Hiện/Ẩn cột', icon: 'pi pi-eye',
                items: this._allColumns.filter(c => c.visible !== false).map(c => ({
                    label: c.header,
                    icon: this._hiddenFields.has(c.field) ? 'pi pi-square' : 'pi pi-check-square',
                    command: () => this.toggleColumnVisible(c.field)
                }))
            },
            { separator: true }
        );

        // --- Column Sizing ---
        this.headerMenuItems.push(
            { label: 'Tự động co cột', icon: 'pi pi-arrows-h', command: () => this.autoFitColumn(field) },
            { label: 'Tự động co tất cả cột', icon: 'pi pi-arrows-alt', command: () => this.autoFitAllColumns() },
            {
                label: this._columnLayout === 'auto' ? 'Dùng chiều rộng cài sẵn' : 'Fit theo nội dung',
                icon: this._columnLayout === 'auto' ? 'pi pi-lock' : 'pi pi-unlock',
                command: () => {
                    this._columnLayout = this._columnLayout === 'auto' ? 'fixed' : 'auto';
                    this.cdr.markForCheck();
                }
            },
            { separator: true }
        );

        // --- Layout Persistence ---
        if (this.tableId) {
            this.headerMenuItems.push(
                { label: 'Lưu layout lên server', icon: 'pi pi-cloud-upload', command: () => this.saveTableLayoutToBackend() },
                ...(this._layoutModified
                    ? [{ label: 'Khôi phục layout mặc định', icon: 'pi pi-refresh', command: () => this.resetTableLayout() }]
                    : []),
                { separator: true }
            );
        }

        // --- Filter & Search Toggles ---
        this.headerMenuItems.push(
            {
                label: this.showColumnFilter ? 'Ẩn lọc dữ liệu' : 'Hiển thị lọc dữ liệu',
                icon: 'pi pi-filter',
                command: () => { this.showColumnFilter = !this.showColumnFilter; }
            },
            {
                label: this.showGlobalFilter ? 'Ẩn thanh tìm kiếm' : 'Hiển thị thanh tìm kiếm',
                icon: 'pi pi-search',
                command: () => { this.showGlobalFilter = !this.showGlobalFilter; }
            }
        );

        // Tính không gian còn lại bên dưới vị trí click để submenu không tràn viewport
        const availableBelow = window.innerHeight - (event.clientY ?? 0) - 12;
        document.documentElement.style.setProperty(
            '--tbl-submenu-max-height',
            Math.max(Math.min(availableBelow, 240), 80) + 'px'
        );

        this.hcm.show(event);
        event.preventDefault();
        event.stopPropagation();
    }

    sortAscending() {
        if (!this.activeSortField) return;
        this.dt.sortField = this.activeSortField;
        this.dt.sortOrder = 1;
        this.dt.sortSingle();
    }

    sortDescending() {
        if (!this.activeSortField) return;
        this.dt.sortField = this.activeSortField;
        this.dt.sortOrder = -1;
        this.dt.sortSingle();
    }

    clearSort() {
        this.dt.sortOrder = 0;
        this.dt.sortField = undefined;
        this.dt.multiSortMeta = [];
        this.activeSortField = null;
        this._data = [...this._originalData];
        this.dt.value = this._data;
        if (this.dt.tableService) {
            this.dt.tableService.onSort(null);
        }
    }

    hideColumn(field: string) {
        this._hiddenFields.add(field);
        this.columns = this.visibleColumns;
    }

    toggleColumnVisible(field: string) {
        if (this._hiddenFields.has(field)) {
            this._hiddenFields.delete(field);
        } else {
            if (this.visibleColumns.length <= 1) return;
            this._hiddenFields.add(field);
        }
        this.columns = this.visibleColumns;
        this.saveTableLayout();
    }

    autoFitColumn(field: string) {
        const col = this.columns.find(c => c.field === field);
        if (col) {
            col.width = 'auto';
        }
    }

    autoFitAllColumns() {
        this.columns.forEach(c => c.width = 'auto');
    }

    onRowReorder(event: any) {
        this.rowReorder.emit(event);
    }

    onColResize() {
        // After resize, recalculate sticky left offsets for frozen columns.
        // PrimeNG doesn't re-run initFrozenColumns on resize in v21.
        setTimeout(() => {
            this.recalcFrozenPositions();
            if (this.tableId) {
                this.syncColumnWidthsFromDOM();
                this.saveTableLayout();
            }
        });
    }

    private recalcFrozenPositions() {
        const host = (this.dt as any).el?.nativeElement as HTMLElement;
        if (!host) return;
        ['thead', 'tbody', 'tfoot'].forEach(section => {
            const rows = host.querySelectorAll<HTMLTableRowElement>(`${section} tr`);
            rows.forEach(row => {
                let offset = 0;
                const cells = row.querySelectorAll<HTMLElement>(
                    '.p-datatable-frozen-column:not(.p-datatable-frozen-column-right)'
                );
                cells.forEach(cell => {
                    cell.style.left = offset + 'px';
                    // Prefer configured width from inline style (set via [style.width] binding on <th>)
                    // to avoid depending on DOM layout (offsetWidth may be 0 before layout completes).
                    // Fall back to offsetWidth; enforce min 30px so empty columns still contribute correct offset.
                    const configW = this.parseCellWidthPx(cell);
                    offset += configW ?? Math.max(cell.offsetWidth, 30);
                });
            });
        });
    }

    /** Parse cell's inline style width/minWidth to px. Returns null if not determinable. */
    private parseCellWidthPx(cell: HTMLElement): number | null {
        for (const prop of ['width', 'minWidth'] as const) {
            const val: string = (cell.style as any)[prop];
            if (!val) continue;
            if (val.endsWith('px')) {
                const n = parseFloat(val);
                if (n > 0) return n;
            }
            if (val.endsWith('rem')) {
                const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
                const n = parseFloat(val) * base;
                if (n > 0) return n;
            }
        }
        return null;
    }

    onCellEditComplete(_event: any) {
        // Cell edit is handled inline by PrimeNG
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    // =============================================
    // Column Chooser (Advanced)
    // =============================================
    openColumnChooser() {
        // Deep copy the internal visible columns
        this.chooserColumns = [...this.columns];
        // Append hidden columns at the end
        const visibleFields = new Set(this.columns.map(c => c.field));
        this._allColumns.forEach(c => {
            if (!visibleFields.has(c.field)) {
                this.chooserColumns.push(c);
            }
        });
        this.showColumnChooser = true;
    }

    private _syncChooserToColumns() {
        this.columns = this.chooserColumns.filter(c => !this._hiddenFields.has(c.field));
        const chosenFields = new Set(this.columns.map(c => c.field));
        const newAllColumns = [...this.columns];
        this._allColumns.forEach(c => {
            if (!chosenFields.has(c.field)) newAllColumns.push(c);
        });
        this._allColumns = newAllColumns;
    }

    applyColumnChooser() {
        this._syncChooserToColumns();
        this.saveTableLayout();
        this.showColumnChooser = false;
    }

    closeColumnChooser() {
        this.showColumnChooser = false;
    }

    isColumnHidden(field: string): boolean {
        return this._hiddenFields.has(field);
    }

    toggleChooserColumnVisible(event: any, field: string) {
        event?.originalEvent?.stopPropagation();
        this.toggleColumnVisible(field);
        this._syncChooserToColumns();
    }

    // =============================================
    // Cell Focus & Copy
    // =============================================
    onCellClick(event: MouseEvent, col: ColumnDef, rowData: any) {
        // Set focus state
        this.focusedCell = { rowData, colField: col.field };

        // Ensure this component host gets browser focus for keyboard events
        this.el.nativeElement.focus();

        // Handle original table-lookup click behavior
        if (col.editType === 'table-lookup' && col.editable && this.editMode) {
            this.openTableLookup(event, col, rowData);
        } else if (col.clickable) {
            this.cellAction.emit({ field: col.field, rowData });
        }
    }

    isCellFocused(rowData: any, colField: string): boolean {
        return this.focusedCell?.rowData === rowData && this.focusedCell?.colField === colField;
    }

    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            if (this.focusedCell) {
                // Determine the cell value
                const colDef = this.columns.find(c => c.field === this.focusedCell?.colField);
                let textToCopy = '';
                if (colDef) {
                    const rawValue = this.focusedCell.rowData[colDef.field];
                    textToCopy = colDef.format ? colDef.format(rawValue, this.focusedCell.rowData) : rawValue;
                }

                if (textToCopy !== undefined && textToCopy !== null) {
                    navigator.clipboard.writeText(String(textToCopy)).catch(err => {
                        console.error('Failed to copy cell text: ', err);
                    });
                }
            }
        }
    }

    // =============================================
    // Table Layout Persistence
    // =============================================

    private loadTableLayout(): void {
        if (!this.tableId) return;
        const saved = this.tableLayoutService.load(this.tableId);
        if (!saved) { this._layoutModified = false; return; }

        // Apply hidden fields
        this._hiddenFields = new Set(saved.hiddenFields || []);

        // Apply column order to _allColumns
        if (saved.columnOrder?.length) {
            this._allColumns.sort((a, b) => {
                const ai = saved.columnOrder.indexOf(a.field);
                const bi = saved.columnOrder.indexOf(b.field);
                return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
            });
        }

        // Apply saved widths to ColumnDef objects
        if (saved.widths) {
            this._allColumns.forEach(c => {
                if (saved.widths[c.field]) c.width = saved.widths[c.field];
            });
        }

        this.columns = this.visibleColumns;
        this._layoutModified = true;
        this.cdr.markForCheck();
    }

    private syncColumnWidthsFromDOM(): void {
        const ths = this.el.nativeElement.querySelectorAll('th[data-field]') as NodeListOf<HTMLElement>;
        ths.forEach((th: HTMLElement) => {
            const field = th.getAttribute('data-field');
            const col = this._allColumns.find(c => c.field === field);
            if (col && th.style.width) col.width = th.style.width;
        });
    }

    private saveTableLayout(): void {
        if (!this.tableId) return;
        const widths: { [field: string]: string } = {};
        this._allColumns.forEach(c => { if (c.width) widths[c.field] = c.width; });
        this.tableLayoutService.save(this.tableId, {
            hiddenFields: Array.from(this._hiddenFields),
            columnOrder: this._allColumns.map(c => c.field),
            widths
        });
        this._layoutModified = true;
    }

    saveTableLayoutToBackend(): void {
        if (!this.tableId) return;
        const widths: { [field: string]: string } = {};
        this._allColumns.forEach(c => { if (c.width) widths[c.field] = c.width; });
        const state = {
            hiddenFields: Array.from(this._hiddenFields),
            columnOrder: this._allColumns.map(c => c.field),
            widths
        };
        this.tableLayoutService.saveToBackend(this.tableId, state).subscribe();
    }

    resetTableLayout(): void {
        if (!this.tableId) return;
        this.tableLayoutService.reset(this.tableId);
        this._layoutModified = false;

        // Restore hidden fields (empty = all visible)
        this._hiddenFields = new Set();

        // Restore column order
        if (this._originalColumnsOrder.length) {
            this._allColumns.sort((a, b) => {
                const ai = this._originalColumnsOrder.indexOf(a.field);
                const bi = this._originalColumnsOrder.indexOf(b.field);
                return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
            });
        }

        // Restore widths
        this._allColumns.forEach(c => {
            c.width = this._originalWidths[c.field] ?? undefined;
        });

        this.columns = this.visibleColumns;
        this.cdr.markForCheck();
    }
}
