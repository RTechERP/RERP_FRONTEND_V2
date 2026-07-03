import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, OnInit, SimpleChanges, inject, HostListener, HostBinding, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeTableModule, TreeTable } from 'primeng/treetable';
import { TableModule } from 'primeng/table';
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
import { MenuItem, TreeNode } from 'primeng/api';
import { TreeColumnDef } from './tree-column-def.model';
import { EditLookupConfig } from '../custom-table-kpi/column-def.model';
import { TableLayoutService } from '../custom-table-kpi/table-layout.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-custom-tree-table-kpi',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TreeTableModule, TableModule, InputTextModule,
        SelectModule, MultiSelectModule, ButtonModule, IconFieldModule, InputIconModule,
        ContextMenuModule, PopoverModule, DatePickerModule, TextareaModule,
        ProgressBarModule, TagModule, DialogModule, OrderListModule,
        CheckboxModule, TabsModule
    ],
    templateUrl: './custom-tree-table-kpi.html',
    styleUrl: './custom-tree-table-kpi.css'
})
export class CustomTreeTableKpi implements OnChanges, OnInit {
    @ViewChild('tt') tt!: TreeTable;
    @ViewChild('cm') cm!: ContextMenu;
    @ViewChild('hcm') hcm!: ContextMenu;
    @ViewChild('lookupPanel') lookupPanel!: Popover;

    private el = inject(ElementRef);
    private tableLayoutService = inject(TableLayoutService);
    private userService = inject(UserService);
    @HostBinding('attr.tabindex') tabindex = '0';

    // --- Navigation Callback ---
    // Called before navigation starts - parent can set flag to skip tree rebuild
    @Input() onNavigationStart: (() => void) | null = null;

    // --- Highlighting State ---
    globalFilterValue: string = '';

    // --- Excel Filter State ---
    excelFilterSearchText: { [field: string]: string } = {};
    activeFilterTab: { [field: string]: string } = {};
    customFilterMatchMode: { [field: string]: string } = {};
    customFilterValue: { [field: string]: any } = {};

    // --- Table Lookup State ---
    lookupSearchText: string = '';
    lookupColFilters: { [field: string]: string } = {};
    lookupFilteredData: any[] = [];
    lookupLoading: boolean = false;
    activeLookupCol: TreeColumnDef | null = null;
    activeLookupRowData: any = null;
    lookupSelectedRows: any[] = [];
    /** Cache of last-loaded data per field (for formatValue when using loadData) */
    private lookupDataCache: { [field: string]: any[] } = {};
    private lookupDebounceTimer: any = null;

    // --- Cell Focus State ---
    focusedCell: { rowData: any, colField: string } | null = null;

    // --- Data ---
    private _originalData: TreeNode[] = [];
    private _data: TreeNode[] = [];

    @Input() set data(val: TreeNode[]) {
        this._originalData = this.deepCloneNodes(val || []);
        this._data = val || [];
        this.buildFilterOptionsCache();
    }
    get data(): TreeNode[] {
        return this._data;
    }
    @Input() columns: TreeColumnDef[] = [];
    @Input() dataKey: string = '';
    @Input() loading: boolean = false;

    // --- Caption ---
    @Input() title: string = '';
    @Input() showGlobalFilter: boolean = false;
    @Input() globalFilterFields: string[] = [];

    @Input() minWidth: string = '50rem';

    get actualGlobalFilterFields(): string[] {
        if (this.globalFilterFields && this.globalFilterFields.length > 0) {
            return this.globalFilterFields;
        }
        return this.columns ? this.columns.filter(c => c.field).map(c => c.field) : [];
    }

    isCellEditable(rowData: any, col: TreeColumnDef): boolean {
        return !!((col.isEditable ? col.isEditable(rowData) : col.editable) && this.editMode === 'cell');
    }

    // --- Layout ---
    @Input() height: string = '100%';
    @HostBinding('style.height') get hostHeight() { return this.height; }
    @HostBinding('style.--tt-scroll-height') get cssScrollHeight() {
        return this.scrollable ? (this.scrollHeight || this.height) : 'auto';
    }
    @Input() resizable: boolean = true;
    @Input() resizeMode: string = 'fit';
    @Input() showGridlines: boolean = true;
    @Input() showColumnFilter: boolean = true;
    @Input() textWrap: boolean = false;
    @Input() stripedRows: boolean = false;

    // --- Scrollable ---
    @Input() scrollable: boolean = false;
    @Input() scrollHeight: string = '';

    // --- Virtual Scrolling ---
    @Input() virtualScroll: boolean = false;
    @Input() virtualScrollItemSize: number = 46;

    // --- Pagination ---
    @Input() paginator: boolean = false;
    @Input() rows: number = 10;
    @Input() rowsPerPageOptions: number[] = [10, 20, 50];

    // --- Sorting ---
    @Input() sortMode: 'single' | 'multiple' = 'single';

    // --- Selection ---
    @Input() selectionMode: 'single' | 'multiple' | 'checkbox' | null = null;
    @Input() selection: any = null;
    @Output() selectionChange = new EventEmitter<any>();

    // --- Context Menu ---
    @Input() contextMenuItems: MenuItem[] = [];
    selectedContextNode: any = null;

    // --- Row Reorder ---
    @Input() reorderableRows: boolean = false;
    @Output() rowReorder = new EventEmitter<any>();

    // --- Click Row Select ---
    @Input() clickSelectRow: boolean = false;
    @Output() rowClick = new EventEmitter<any>();
    clickedRowKey: any = null;

    // --- Styling ---
    @Input() rowClass: ((rowData: any) => string | string[] | Set<string> | { [klass: string]: any }) | null = null;
    @Input() headerGroups: any[][] = [];

    // --- Column Chooser ---
    showColumnChooser: boolean = false;
    chooserColumns: TreeColumnDef[] = [];

    // --- Column Reorder ---
    @Input() reorderableColumns: boolean = false;

    // --- Cell Editing ---
    @Input() editMode: 'cell' | undefined = undefined;

    // --- CSV Export ---
    @Input() exportable: boolean = false;
    @Input() exportFilename: string = 'download';

    // --- Table Layout Persistence ---
    @Input() tableId: string = '';
    private _snapshotTaken = false;
    private _originalColumnsOrder: string[] = [];
    private _layoutModified = false;

    // --- Footer ---
    @Input() showFooter: boolean = false;

    // --- Table Lookup ---
    @Output() lookupSelect = new EventEmitter<{ selectedRow: any; field: string; rowData: any }>();

    // --- Cell Value Change (fired from inline editors) ---
    @Output() cellValueChange = new EventEmitter<{ rowKey: any; rowData: any; field: string; value: any }>();

    // --- Cell Action (fired for clickable columns, e.g. delete icon) ---
    @Output() cellAction = new EventEmitter<{ field: string; rowData: any }>();

    // --- Header Cell Action (fired for headerClickable columns, e.g. add-row button in header) ---
    @Output() headerCellAction = new EventEmitter<{ field: string }>();

    onHeaderCellClick(event: Event, col: TreeColumnDef) {
        event.stopPropagation();
        if (col.headerClickable) {
            this.headerCellAction.emit({ field: col.field });
        }
    }

    emitCellValueChange(rowData: any, field: string, value: any, forceEmit = false) {
        rowData[field] = value;
        if (forceEmit) {
            this.cellValueChange.emit({ rowKey: rowData[this.dataKey] ?? rowData['_id'], rowData, field, value });
        }
    }

    onCellEditComplete(rowData: any, field: string) {
        console.log('[TreeTable onCellEditComplete]', { field, value: rowData[field], rowData: { STT: rowData.STT, ID: rowData.ID, id: rowData.id } });
        this.cellValueChange.emit({ rowKey: rowData[this.dataKey] ?? rowData['_id'], rowData, field, value: rowData[field] });
    }

    onInputFocus(event: any) {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        if (target && typeof target.select === 'function') {
            target.select();
        }
    }

    toggleAllLookupRows() {
        if (this.lookupSelectedRows.length === this.lookupFilteredData.length) {
            this.lookupSelectedRows = [];
        } else {
            this.lookupSelectedRows = [...this.lookupFilteredData];
        }
    }

    // --- Header Context Menu ---
    headerMenuItems: MenuItem[] = [];
    activeSortField: string | null = null;
    private _allColumns: TreeColumnDef[] = [];
    private _hiddenFields: Set<string> = new Set();

    // --- Filter Options Cache ---
    filterOptionsCache: { [field: string]: { label: string; value: any }[] } = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['columns'] || changes['data']) {
            this.buildFilterOptionsCache();
        }
        if (changes['columns'] && this.columns) {
            this._allColumns = [...this.columns];
            this.columns = this.visibleColumns;
        }
    }

    ngOnInit(): void {
        if (this.tableId && !this._snapshotTaken) {
            this._snapshotTaken = true;
            this._originalColumnsOrder = this.columns.map(c => c.field);
            this.loadTreeTableLayout();
            this.columns = this.visibleColumns;
        } else {
            this.columns = this.visibleColumns;
        }
    }

    get visibleColumns(): TreeColumnDef[] {
        return this._allColumns.filter(c => !c.hidden && c.visible !== false && !this._hiddenFields.has(c.field));
    }

    /**
     * Dynamically calculates the colspan for a header group based on currently visible columns.
     * Requires the group object to have a 'fields' property containing the list of fields it covers.
     */
    getGroupColspan(h: any): number {
        if (!h.fields || h.fields.length === 0) return h.colspan || 1;
        return h.fields.filter((f: string) => {
            const col = this._allColumns.find(c => c.field === f);
            return col && !col.hidden && col.visible !== false && !this._hiddenFields.has(f);
        }).length;
    }

    /**
     * Checks if a header group should be visible (colspan > 0).
     */
    isGroupVisible(h: any): boolean {
        return this.getGroupColspan(h) > 0;
    }

    /** True when any column explicitly sets treeToggler:true (disables the i===0 fallback). */
    get hasTtColumn(): boolean {
        return this.columns?.some(c => c.treeToggler) ?? false;
    }

    private buildFilterOptionsCache(): void {
        this.filterOptionsCache = {};
        if (!this.columns?.length) return;
        const flatData = this.flattenNodes(this.data);
        for (const col of this.columns) {
            if (col.filterLoadOptions) {
                Promise.resolve(col.filterLoadOptions()).then(opts => {
                    this.filterOptionsCache[col.field] = opts;
                });
            } else if (col.filterOptions && col.filterOptions.length > 0) {
                this.filterOptionsCache[col.field] = col.filterOptions;
            } else if ((col.filterMode === 'dropdown' || col.filterMode === 'multiselect') && flatData.length) {
                const unique = [...new Set(flatData.map(d => d[col.field]).filter(v => v != null))];
                this.filterOptionsCache[col.field] = unique.map(v => ({ label: String(v), value: v }));
            }
        }
    }

    private flattenNodes(nodes: TreeNode[]): any[] {
        let result: any[] = [];
        for (const node of nodes) {
            if (node.data) result.push(node.data);
            if (node.children) result = result.concat(this.flattenNodes(node.children));
        }
        return result;
    }

    getFilterOptions(col: TreeColumnDef): { label: string; value: any }[] {
        return this.filterOptionsCache[col.field] || [];
    }

    getFilteredOptions(col: TreeColumnDef): { label: string; value: any }[] {
        const options = this.getFilterOptions(col);
        const term = (this.excelFilterSearchText[col.field] || '').toLowerCase();
        if (!term) return options;
        return options.filter(o => o.label.toLowerCase().includes(term));
    }

    onGlobalFilter(event: Event) {
        this.globalFilterValue = (event.target as HTMLInputElement).value;
        this.tt.filterGlobal(this.globalFilterValue, 'contains');
    }

    getHighlightedText(text: any): string {
        if (!this.globalFilterValue || text == null) return String(text || '');
        const str = String(text);
        const term = this.globalFilterValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${term})`, 'gi');
        return str.replace(regex, '<mark>$1</mark>');
    }

    // =============================================
    // Excel-style filter helpers
    // =============================================
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

    isAllFilterSelected(value: any[], col: TreeColumnDef): boolean {
        const options = this.getFilterOptions(col);
        if (!options.length) return false;
        return !!(value && value.length === options.length);
    }

    toggleAllFilter(value: any[], col: TreeColumnDef, filterCallback: (v: any) => void) {
        if (this.isAllFilterSelected(value, col)) {
            filterCallback(null);
        } else {
            filterCallback(this.getFilterOptions(col).map(o => o.value));
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

    applyTreeFilter(field: string, checkboxValue: any) {
        if (this.activeFilterTab[field] === '1') {
            const val = this.customFilterValue[field];
            const mode = this.customFilterMatchMode[field] || this.getDefaultMatchMode();
            this.tt.filter(val, field, mode);
        } else {
            this.tt.filter(checkboxValue, field, 'in');
        }
    }

    clearTreeFilter(field: string) {
        this.customFilterValue[field] = null;
        this.tt.filter('', field, 'in');
    }

    // =============================================
    // Auto-align helper
    // =============================================
    /** Returns cssClass merged with auto text-align.
     *  Numeric columns → text-right; others → default (left).
     *  If base already contains an explicit alignment class, skip auto-align. */
    getAutoAlignClass(base: string | undefined, col: TreeColumnDef): string {
        const cls = base || '';
        if (cls.includes('text-right') || cls.includes('text-left') || cls.includes('text-center')) {
            return cls;
        }
        return (cls + (col.filterType === 'numeric' ? ' text-right' : '')).trim();
    }

    // =============================================
    // Footer
    // =============================================
    getFooterValue(col: TreeColumnDef): string {
        const flatData = this.flattenNodes(this.data);
        if (col.footer) {
            if (typeof col.footer === 'function') return col.footer(flatData);
            return col.footer;
        }
        if (col.footerType) {
            const vals = flatData
                .map(r => r[col.field])
                .filter(v => v != null && !isNaN(Number(v)))
                .map(Number);
            const fmt = col.footerFormat;
            switch (col.footerType) {
                case 'sum': return vals.reduce((s, v) => s + v, 0).toLocaleString(undefined, fmt);
                case 'avg': return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toLocaleString(undefined, fmt) : '';
                case 'count': return flatData.length.toString();
                case 'min': return vals.length ? Math.min(...vals).toLocaleString(undefined, fmt) : '';
                case 'max': return vals.length ? Math.max(...vals).toLocaleString(undefined, fmt) : '';
            }
        }
        return '';
    }

    // =============================================
    // Selection & Row Click
    // =============================================
    onSelectionChange(value: any) {
        this.selection = value;
        this.selectionChange.emit(value);
    }

    onRowClick(rowNode: any) {
        if (!this.clickSelectRow) return;
        const key = rowNode?.node?.key;
        if (key) {
            this.clickedRowKey = key;
            this.rowClick.emit(rowNode.node.data);
        }
    }

    isRowClicked(rowNode: any): boolean {
        if (!this.clickSelectRow || !this.clickedRowKey) return false;
        return rowNode?.node?.key === this.clickedRowKey;
    }

    // =============================================
    // Format Value
    // =============================================
    formatValue(col: TreeColumnDef, rowData: any): string {
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
        if (col.editType === 'multiselect' && col.editOptions && Array.isArray(val)) {
            return val.map(v => col.editOptions!.find(o => o.value === v)?.label || v).join(', ');
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
        let result = fmt.replace('dd', dd).replace('mm', mm).replace('yy', yy);
        if (showTime) {
            result += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }
        return result;
    }

    // =============================================
    // Table Lookup
    // =============================================
    async openTableLookup(event: Event, col: TreeColumnDef, rowData: any) {
        this.activeLookupCol = col;
        this.activeLookupRowData = rowData;
        this.lookupSearchText = '';
        this.lookupColFilters = {};
        this.lookupSelectedRows = [];
        clearTimeout(this.lookupDebounceTimer);

        const cfg = col.editLookupConfig!;

        this.lookupPanel.hide();
        setTimeout(() => this.lookupPanel.show(event));

        if (cfg.loadData) {
            this.lookupLoading = true;
            this.lookupFilteredData = [];
            try {
                const result = await Promise.resolve(cfg.loadData('', rowData));
                this.lookupFilteredData = result;
                this.lookupDataCache[col.field] = result;
            } finally {
                this.lookupLoading = false;
            }
        } else {
            this.lookupFilteredData = cfg.data || [];
        }

        if (cfg.multiSelect) {
            const currentVal: any[] = rowData[col.field] ?? [];
            this.lookupSelectedRows = this.lookupFilteredData.filter(r => currentVal.includes(r[cfg.valueField]));
        }
    }

    filterLookupData() {
        const cfg = this.activeLookupCol?.editLookupConfig;
        if (!cfg) return;

        if (cfg.loadData) {
            clearTimeout(this.lookupDebounceTimer);
            this.lookupDebounceTimer = setTimeout(async () => {
                this.lookupLoading = true;
                try {
                    const result = await Promise.resolve(cfg.loadData!(this.lookupSearchText, this.activeLookupRowData));
                    this.lookupFilteredData = this.applyLookupColFilters(cfg, result);
                } finally {
                    this.lookupLoading = false;
                }
            }, 300);
            return;
        }

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
        if (cfg.multiSelect) return;
        this.activeLookupRowData[this.activeLookupCol.field] = row[cfg.valueField];
        this.lookupSelect.emit({ selectedRow: row, field: this.activeLookupCol.field, rowData: this.activeLookupRowData });
        this.lookupPanel.hide();
        this.activeLookupCol = null;
        this.activeLookupRowData = null;
    }

    /** Multi-select: toggle checkbox */
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

    onContextMenuSelect(event: any) {
        this.selectedContextNode = event.node;
    }

    // =============================================
    // Column Resize
    // =============================================
    onColResize() {
        setTimeout(() => this.recalcFrozenPositions());
    }

    private recalcFrozenPositions() {
        const host = (this.tt as any).el?.nativeElement as HTMLElement;
        if (!host) return;
        ['thead', 'tbody', 'tfoot'].forEach(section => {
            const rows = host.querySelectorAll<HTMLTableRowElement>(`${section} tr`);
            rows.forEach(row => {
                let offset = 0;
                const cells = row.querySelectorAll<HTMLElement>(
                    '.p-treetable-frozen-column:not(.p-treetable-frozen-column-right)'
                );
                cells.forEach(cell => {
                    cell.style.left = offset + 'px';
                    offset += cell.offsetWidth;
                });
            });
        });
    }

    // =============================================
    // Header Context Menu (DevExpress-style)
    // =============================================
    onHeaderContextMenu(event: any, field: string) {
        this.activeSortField = field;
        const col = this._allColumns.find(c => c.field === field);

        this.headerMenuItems = [];

        if (col?.sortable) {
            this.headerMenuItems.push(
                { label: 'Sắp xếp tăng', icon: 'pi pi-sort-amount-up', command: () => this.sortAscending() },
                { label: 'Sắp xếp giảm', icon: 'pi pi-sort-amount-down', command: () => this.sortDescending() },
                { label: 'Bỏ sắp xếp', icon: 'pi pi-sort-alt-slash', command: () => this.clearSort() },
                { separator: true }
            );
        }

        this.headerMenuItems.push(
            { label: 'Ẩn cột này', icon: 'pi pi-eye-slash', command: () => this.hideColumn(field) },
            { label: 'Cột nâng cao', icon: 'pi pi-list', command: () => this.openColumnChooser() },
            {
                label: 'Hiện/Ẩn cột', icon: 'pi pi-eye',
                items: this._allColumns.map(c => ({
                    label: c.header,
                    icon: this._hiddenFields.has(c.field) ? 'pi pi-square' : 'pi pi-check-square',
                    command: () => this.toggleColumnVisible(c.field)
                }))
            },
            { separator: true }
        );

        this.headerMenuItems.push(
            { label: 'Tự động co cột', icon: 'pi pi-arrows-h', command: () => this.autoFitColumn(field) },
            { label: 'Tự động co tất cả cột', icon: 'pi pi-arrows-alt', command: () => this.autoFitAllColumns() },
            { separator: true }
        );

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
            },
            {
                label: 'Mở rộng tất cả', icon: 'pi pi-plus',
                command: () => this.expandAll()
            },
            {
                label: 'Thu gọn tất cả', icon: 'pi pi-minus',
                command: () => this.collapseAll()
            }
        );

        this.hcm.show(event);
        event.preventDefault();
        event.stopPropagation();
    }

    sortAscending() {
        if (!this.activeSortField) return;
        this.tt.sortField = this.activeSortField;
        this.tt.sortOrder = 1;
        this.tt.sortSingle();
    }

    sortDescending() {
        if (!this.activeSortField) return;
        this.tt.sortField = this.activeSortField;
        this.tt.sortOrder = -1;
        this.tt.sortSingle();
    }

    clearSort() {
        this.tt.sortOrder = 0;
        this.tt.sortField = undefined;
        this.tt.multiSortMeta = [];
        this.activeSortField = null;
        this._data = this.deepCloneNodes(this._originalData);
        this.tt.value = this._data;
        if (this.tt.tableService) {
            this.tt.tableService.onSort(null);
        }
    }

    expandAll() {
        if (!this.tt?.value) return;
        this.tt.value.forEach(node => this.expandRecursive(node, true));
    }

    collapseAll() {
        if (!this.tt?.value) return;
        this.tt.value.forEach(node => this.expandRecursive(node, false));
    }

    private expandRecursive(node: TreeNode, isExpand: boolean) {
        node.expanded = isExpand;
        if (node.children) {
            node.children.forEach(childNode => this.expandRecursive(childNode, isExpand));
        }
    }

    // =============================================
    // Column Chooser (Advanced)
    // =============================================
    openColumnChooser() {
        this.chooserColumns = [...this.columns];
        const visibleFields = new Set(this.columns.map(c => c.field));
        this._allColumns.forEach(c => {
            if (!visibleFields.has(c.field)) {
                this.chooserColumns.push(c);
            }
        });
        this.showColumnChooser = true;
    }

    applyColumnChooser() {
        this.columns = this.chooserColumns.filter(c => !this._hiddenFields.has(c.field));
        const chosenFields = new Set(this.columns.map(c => c.field));
        const newAllColumns = [...this.columns];
        this._allColumns.forEach(c => {
            if (!chosenFields.has(c.field)) {
                newAllColumns.push(c);
            }
        });
        this._allColumns = newAllColumns;
        this.showColumnChooser = false;
    }

    closeColumnChooser() {
        this.showColumnChooser = false;
    }

    isColumnHidden(field: string): boolean {
        return this._hiddenFields.has(field);
    }

    toggleChooserColumnVisible(event: any, field: string) {
        event.stopPropagation();
        this.toggleColumnVisible(field);
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
        this.saveTreeTableLayout();
    }

    autoFitColumn(field: string) {
        const col = this.columns.find(c => c.field === field);
        if (col) col.width = 'auto';
    }

    autoFitAllColumns() {
        this.columns.forEach(c => c.width = 'auto');
    }

    private deepCloneNodes(nodes: TreeNode[]): TreeNode[] {
        return nodes.map(node => ({
            ...node,
            data: node.data ? { ...node.data } : undefined,
            children: node.children ? this.deepCloneNodes(node.children) : undefined
        }));
    }

    exportCSV() {
        const flatData = this.flattenNodes(this.data);
        if (!flatData.length || !this.columns.length) return;

        const headers = this.columns.map(c => c.header);
        const rows = flatData.map(row =>
            this.columns.map(c => {
                const val = row[c.field];
                const str = val != null ? String(val) : '';
                return '"' + str.replace(/"/g, '""') + '"';
            }).join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = (this.exportFilename || 'download') + '.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // =============================================
    // Cell Focus & Copy
    // =============================================
    private focusedRowIdx: number = -1;

    onCellClick(event: MouseEvent, col: TreeColumnDef, rowData: any) {
        // Ignore clicks originating from the tree expand/collapse toggler button
        const target = event.target as HTMLElement;
        if (target.closest('.p-treetable-toggler')) return;

        this.focusedCell = { rowData, colField: col.field };
        // Sync numeric row index for stable navigation across re-renders
        const visibleNodes = this.getVisibleNodes(this.data);
        const rowIdx = visibleNodes.findIndex(n => {
            const dKey = this.dataKey;
            if (dKey && n.data[dKey] !== undefined && rowData[dKey] !== undefined) {
                return n.data[dKey] === rowData[dKey];
            }
            return n.data === rowData;
        });
        if (rowIdx !== -1) this.focusedRowIdx = rowIdx;

        // Only focus the host element if we are NOT in an editable cell that will show an input
        // This prevents stealing focus from the newly created editor input.
        const isEditable = (col.isEditable ? col.isEditable(rowData) : col.editable) && this.editMode;
        if (!isEditable) {
            this.el.nativeElement.focus();
        }

        if (col.editType === 'table-lookup' && col.editable && this.editMode) {
            this.openTableLookup(event, col, rowData);
        } else if (col.clickable) {
            this.cellAction.emit({ field: col.field, rowData });
        }
    }

    isCellFocused(rowData: any, colField: string): boolean {
        if (!rowData || !this.focusedCell) return false;

        const dKey = this.dataKey;
        const altKey = dKey === 'id' ? 'ID' : (dKey === 'ID' ? 'id' : null);

        const currentData = this.focusedCell.rowData;

        if (dKey && rowData[dKey] !== undefined && currentData[dKey] !== undefined) {
            if (rowData[dKey] === currentData[dKey] && this.focusedCell.colField === colField) return true;
        }
        if (altKey && rowData[altKey] !== undefined && currentData[altKey] !== undefined) {
            if (rowData[altKey] === currentData[altKey] && this.focusedCell.colField === colField) return true;
        }

        return currentData === rowData && this.focusedCell.colField === colField;
    }

    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            if (this.focusedCell) {
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
            return;
        }

        // Arrow Key & Enter Navigation
        if (this.focusedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) {
            const target = event.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (isInput) {
                // Inside an input, Left/Right should move the cursor, not change cells.
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return;

                // For Enter, Up, or Down, we want to save (blur) and move.
                if (event.key === 'Enter' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    this.onCellEditComplete(this.focusedCell.rowData, this.focusedCell.colField);
                    target.blur();
                }
            }

            event.preventDefault();
            const direction = event.key === 'Enter' ? 'ArrowDown' : event.key;
            this.navigateFocus(direction);
        }
    }

    private navigateFocus(direction: string) {
        if (!this.focusedCell) return;

        // FIX FOCUS: Notify parent we're about to navigate
        // Parent can set flag to skip tree rebuild until focus is restored
        if (this.onNavigationStart) {
            this.onNavigationStart();
        }

        const currentField = this.focusedCell.colField;
        const currentRowData = this.focusedCell.rowData;
        const colIdx = this.columns.findIndex(c => c.field === currentField);

        const visibleNodes = this.getVisibleNodes(this.data);
        const rowIdx = visibleNodes.findIndex(node => {
            // Robust ID matching (handles 'id' vs 'ID' mismatch)
            const dKey = this.dataKey;
            const altKey = dKey === 'id' ? 'ID' : (dKey === 'ID' ? 'id' : null);

            if (dKey && node.data[dKey] !== undefined && currentRowData[dKey] !== undefined) {
                return node.data[dKey] === currentRowData[dKey];
            }
            if (altKey && node.data[altKey] !== undefined && currentRowData[altKey] !== undefined) {
                return node.data[altKey] === currentRowData[altKey];
            }
            return node.data === currentRowData;
        });

        if (rowIdx === -1) {
            // Fallback: use stored numeric index (survived re-render)
            console.warn('navigateFocus: current row not found by reference, using cached rowIdx:', this.focusedRowIdx);
            if (this.focusedRowIdx === -1 || this.focusedRowIdx >= visibleNodes.length) return;
        }

        const effectiveRowIdx = rowIdx !== -1 ? rowIdx : this.focusedRowIdx;

        let nextRowIdx = effectiveRowIdx;
        let nextColIdx = colIdx;

        if (direction === 'ArrowUp' || direction === 'ArrowDown') {
            const step = direction === 'ArrowUp' ? -1 : 1;
            let tempIdx = effectiveRowIdx + step;

            // Skip summary rows (ID: -1) and find next valid index
            while (tempIdx >= 0 && tempIdx < visibleNodes.length) {
                const node = visibleNodes[tempIdx];
                const id = node.data.ID ?? node.data.id;
                // If it's the summary row, skip it. If it's a valid row, stop and focus.
                if (id !== -1 && id !== '-1') {
                    nextRowIdx = tempIdx;
                    break;
                }
                tempIdx += step;
            }
        } else {
            if (direction === 'ArrowLeft') nextColIdx = Math.max(0, colIdx - 1);
            if (direction === 'ArrowRight') nextColIdx = Math.min(this.columns.length - 1, colIdx + 1);
        }

        const nextRowData = visibleNodes[nextRowIdx].data;
        const nextCol = this.columns[nextColIdx];

        console.log('--- Navigation Debug ---');
        console.log('Direction:', direction);
        console.log('Current Row Index:', effectiveRowIdx, 'STT:', currentRowData.STT || currentRowData.Stt);
        console.log('Next Row Index:', nextRowIdx, 'STT:', nextRowData.STT || nextRowData.Stt, 'ID:', nextRowData.ID || nextRowData.id);
        console.log('Total Visible Nodes:', visibleNodes.length);

        this.focusedCell = { rowData: nextRowData, colField: nextCol.field };
        this.focusedRowIdx = nextRowIdx;

        // PERFORMANCE: Use requestAnimationFrame instead of fixed 50ms setTimeout
        // This schedules the focus operation for the next paint, which is faster and more efficient
        requestAnimationFrame(() => {
            const selector = `tbody .focused-cell`;
            const cellEl = this.el.nativeElement.querySelector(selector) as HTMLElement;
            if (cellEl) {
                cellEl.focus();
                // If the user was editing, they probably want to continue editing the next cell
                if (this.editMode && (nextCol.isEditable ? nextCol.isEditable(nextRowData) : nextCol.editable)) {
                    cellEl.click();
                }
            }
        });
    }

    /**
     * PERFORMANCE: Optimized getVisibleNodes - avoids creating new arrays on each iteration
     * Uses push() + spread instead of concat() which creates new arrays
     */
    private getVisibleNodes(nodes: TreeNode[]): TreeNode[] {
        const result: TreeNode[] = [];
        const stack: TreeNode[] = [...nodes];

        while (stack.length > 0) {
            const node = stack.pop()!;
            result.push(node);
            if (node.expanded && node.children && node.children.length > 0) {
                // Add children in reverse order to maintain original order (stack is LIFO)
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
            }
        }
        return result;
    }

    // =============================================
    // Tree Table Layout Persistence
    // =============================================

    private loadTreeTableLayout(): void {
        if (!this.tableId) return;
        const saved = this.tableLayoutService.load(this.tableId);
        if (!saved) { this._layoutModified = false; return; }

        // Apply hidden fields via _hiddenFields set (consistent with visibleColumns getter)
        this._hiddenFields = new Set(saved.hiddenFields || []);

        // Apply column order to _allColumns
        if (saved.columnOrder?.length) {
            this._allColumns.sort((a, b) => {
                const ai = saved.columnOrder.indexOf(a.field);
                const bi = saved.columnOrder.indexOf(b.field);
                return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
            });
        }

        this.columns = this.visibleColumns;
        this._layoutModified = true;
    }

    private saveTreeTableLayout(): void {
        if (!this.tableId) return;
        const hidden = Array.from(this._hiddenFields);
        this.tableLayoutService.save(this.tableId, {
            hiddenFields: hidden,
            columnOrder: this._allColumns.map(c => c.field),
            widths: {}
        });
        this._layoutModified = true;
    }

    resetTreeTableLayout(): void {
        if (!this.tableId) return;
        this.tableLayoutService.reset(this.tableId);
        this._layoutModified = false;
        this._hiddenFields = new Set();
        if (this._originalColumnsOrder.length) {
            this._allColumns.sort((a, b) => {
                const ai = this._originalColumnsOrder.indexOf(a.field);
                const bi = this._originalColumnsOrder.indexOf(b.field);
                return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
            });
        }
        this.columns = this.visibleColumns;
    }
}

