import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, inject, HostListener, HostBinding, ElementRef } from '@angular/core';
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
import { EditLookupConfig } from '../custom-table/column-def.model';

@Component({
    selector: 'app-custom-tree-table',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TreeTableModule, TableModule, InputTextModule,
        SelectModule, MultiSelectModule, ButtonModule, IconFieldModule, InputIconModule,
        ContextMenuModule, PopoverModule, DatePickerModule, TextareaModule,
        ProgressBarModule, TagModule, DialogModule, OrderListModule,
        CheckboxModule, TabsModule
    ],
    templateUrl: './custom-tree-table.html',
    styleUrl: './custom-tree-table.css'
})
export class CustomTreeTable implements OnChanges {
    @ViewChild('tt') tt!: TreeTable;
    @ViewChild('cm') cm!: ContextMenu;
    @ViewChild('hcm') hcm!: ContextMenu;
    @ViewChild('lookupPanel') lookupPanel!: Popover;

    private el = inject(ElementRef);
    @HostBinding('attr.tabindex') tabindex = '0';

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

    get actualGlobalFilterFields(): string[] {
        if (this.globalFilterFields && this.globalFilterFields.length > 0) {
            return this.globalFilterFields;
        }
        return this.columns ? this.columns.filter(c => c.field).map(c => c.field) : [];
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

    emitCellValueChange(rowData: any, field: string, value: any) {
        rowData[field] = value;
        this.cellValueChange.emit({ rowKey: rowData[this.dataKey] ?? rowData['_id'], rowData, field, value });
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
        }
    }

    get visibleColumns(): TreeColumnDef[] {
        return this._allColumns.filter(c => !this._hiddenFields.has(c.field));
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
        if (filterType === 'date') return 'dateIs';
        return 'startsWith';
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
        } else if (filterType === 'date') {
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
                const result = await Promise.resolve(cfg.loadData(''));
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
                    const result = await Promise.resolve(cfg.loadData!(this.lookupSearchText));
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
    onCellClick(event: MouseEvent, col: TreeColumnDef, rowData: any) {
        // Ignore clicks originating from the tree expand/collapse toggler button
        const target = event.target as HTMLElement;
        if (target.closest('.p-treetable-toggler')) return;

        this.focusedCell = { rowData, colField: col.field };
        this.el.nativeElement.focus();
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
}
