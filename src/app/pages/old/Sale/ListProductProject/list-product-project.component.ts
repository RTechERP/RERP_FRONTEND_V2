import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    Optional,
    Inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// ng-bootstrap
import {
    NgbModal,
    NgbActiveModal,
    NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Config
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ListProductProjectService } from './list-product-project-service/list-product-project.service';
// import { ClipboardService } from '../../../../services/clipboard.service';

@Component({
    selector: 'app-list-product-project',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzSelectModule,
        NzSplitterModule,
        NzIconModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzDatePickerModule,
        NzDropDownModule,
        NzSpinModule,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './list-product-project.component.html',
    styleUrl: './list-product-project.component.css',
})
export class ListProductProjectComponent implements OnInit, AfterViewInit, OnDestroy {
    constructor(
        private listproductprojectService: ListProductProjectService,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        // private clipboardService: ClipboardService
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    listProductMenu: MenuItem[] = [];
    cbbProject: any;
    isLoading: boolean = false;
    warehouseCode: string = 'HN';
    sreachParam = {
        selectedProject: {
            ProjectCode: '',
            ID: 0,
            // Có thể thêm ProjectName nếu cần
            // ProjectName: ""
        },
        WareHouseCode: this.warehouseCode,
    };

    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};

    dataset: any[] = [];

    // Excel Export Service
    excelExportService = new ExcelExportService();

    private queryParamsSub?: Subscription;

    ngOnInit(): void {
        // Get warehouseCode from query params
        // Note: RouteReuseStrategy will recreate component when queryParams change
        this.queryParamsSub = this.route.queryParams.subscribe((params) => {
            // this.warehouseCode = params['warehouseCode'] || 'HN';
            this.warehouseCode =
                params['warehouseCode']
                ?? this.tabData?.warehouseCode
                ?? 'HN';
            this.sreachParam.WareHouseCode = this.warehouseCode;
        });

        this.loadMenu();
        this.getProject();
        this.initAngularGrid();
        this.loadData();
    }

    ngOnDestroy(): void {
        // Cleanup subscription
        if (this.queryParamsSub) {
            this.queryParamsSub.unsubscribe();
        }

        // Cleanup SlickGrid
        if (this.angularGrid) {
            try {
                if (this.angularGrid.slickGrid) {
                    this.angularGrid.slickGrid.destroy();
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
            this.angularGrid = undefined as any;
        }
    }
    ngAfterViewInit(): void { }

    loadMenu() {
        this.listProductMenu = [
            {
                label: 'Xem danh sách',
                icon: 'fas fa-search text-primary',
                command: () => this.loadData(),
            },
            {
                label: 'Xuất Excel',
                icon: 'fas fa-file-excel text-success',
                command: () => this.exportExcel(),
            },
        ];
    }

    loadData() {
        if (this.sreachParam.selectedProject == null) {
            this.sreachParam.selectedProject = {
                ProjectCode: '',
                ID: 0,
            };
        }
        this.isLoading = true;
        this.listproductprojectService
            .getData(
                this.sreachParam.selectedProject.ProjectCode,
                this.sreachParam.selectedProject.ID,
                this.sreachParam.WareHouseCode
            )
            .subscribe({
                next: (res) => {
                    this.dataset = res.data;
                    this.dataset = this.dataset.map((item: any, index: number) => {
                        return {
                            ...item,
                            id: index++,
                        };
                    });

                    console.log(this.dataset);
                    setTimeout(() => {
                        this.angularGrid?.resizerService.resizeGrid();
                        this.applyGrouping();
                        this.applyDistinctFilters();
                    }, 100);

                    setTimeout(() => {
                        this.updateMasterFooterRow();
                    }, 1500);
                    this.isLoading = false;
                },
                error: (err) => {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Có lỗi xảy ra khi lấy sản phẩm theo dự án'
                    );
                    this.isLoading = false;
                },
            });
    }

    private applyGrouping(): void {
        const angularGrid = this.angularGrid;
        if (!angularGrid || !angularGrid.dataView) return;

        angularGrid.dataView.setGrouping([
            {
                getter: 'ProjectCode',
                comparer: () => 0,
                formatter: (g: any) => {
                    const projectFullName = g.rows?.[0]?.ProjectFullName || '';
                    return `Dự án: <strong>${projectFullName}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
                },
                aggregateCollapsed: false,
                lazyTotalsCalculation: true,
                collapsed: false,
            },
            {
                getter: 'WarehouseName',
                comparer: () => 0,
                formatter: (g: any) => {
                    const warehouseName = g.value || 'Kho: HN';
                    return `<strong>${warehouseName}</strong> <span style="color:#2b4387; margin-left:0.5rem;">(${g.count} SP)</span>`;
                },
                aggregateCollapsed: false,
                lazyTotalsCalculation: true,
                collapsed: false,
            },
        ]);

        // Reset pagination về trang 1 và refresh
        angularGrid.dataView.setPagingOptions({ pageNum: 0 });
        angularGrid.dataView.refresh();
        angularGrid.slickGrid?.invalidate();
        angularGrid.slickGrid?.render();
    }

    getProject() {
        this.listproductprojectService.getProject().subscribe({
            next: (res) => {
                this.cbbProject = res.data;
            },
            error: (err) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Có lỗi xảy ra khi lấy dự án'
                );
            },
        });
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.applyGrouping();

        if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                this.updateMasterFooterRow();
            });

            // Update footer khi chuyển trang
            angularGrid.dataView.onPagingInfoChanged.subscribe(() => {
                this.updateMasterFooterRow();
            });
        }

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            this.updateMasterFooterRow();
            this.applyDistinctFilters();
        }, 300);

        // Thêm delay bổ sung để đảm bảo trang 1 được tính
        setTimeout(() => {
            this.updateMasterFooterRow();
        }, 800);
    }

    updateMasterFooterRow() {
        if (this.angularGrid && this.angularGrid.slickGrid) {
            const dataView = this.angularGrid.dataView;
            const slickGrid = this.angularGrid.slickGrid;
            const items: any[] = [];

            if (dataView && slickGrid) {
                // Lấy data gốc đã filter (không có group structure)
                const filteredItems = dataView.getFilteredItems() || [];

                // Lấy thông tin pagination
                const pageInfo = dataView.getPagingInfo();
                const startIndex = pageInfo.pageSize * pageInfo.pageNum;

                // Kiểm tra nếu startIndex vượt quá length
                if (startIndex >= filteredItems.length && filteredItems.length > 0) {
                    console.warn('startIndex vượt quá filteredItems.length', {
                        startIndex,
                        filteredItemsLength: filteredItems.length,
                        pageNum: pageInfo.pageNum,
                        pageSize: pageInfo.pageSize,
                    });
                }

                const endIndex = Math.min(
                    startIndex + pageInfo.pageSize,
                    filteredItems.length
                );

                // Slice để lấy items của trang hiện tại
                const pageItems = filteredItems.slice(startIndex, endIndex);

                // Filter chỉ lấy data rows có ProjectCode (vì có thể có ProductCode null)
                pageItems.forEach((item: any) => {
                    if (item && item.ProjectCode) {
                        items.push(item);
                    }
                });

                // Debug khi items rỗng
                if (items.length === 0 && pageItems.length > 0) {
                    console.warn('pageItems có data nhưng items rỗng', {
                        pageItemsLength: pageItems.length,
                        firstItem: pageItems[0],
                        pageNum: pageInfo.pageNum,
                    });
                }
            }

            // Đếm số lượng sản phẩm (đã bỏ qua group)
            const codeCount = items.length;

            // Tính tổng các cột số liệu
            const totals = (items || []).reduce(
                (acc, item) => {
                    acc.NumberInStoreDauky += item.NumberInStoreDauky || 0;
                    acc.Import += item.Import || 0;
                    acc.Export += item.Export || 0;
                    acc.QuantityImportExport += item.QuantityImportExport || 0;
                    acc.NumberInStoreCuoiKy += item.NumberInStoreCuoiKy || 0;
                    return acc;
                },
                {
                    NumberInStoreDauky: 0,
                    Import: 0,
                    Export: 0,
                    QuantityImportExport: 0,
                    NumberInStoreCuoiKy: 0,
                }
            );

            // Set footer values cho từng column
            const columns = this.angularGrid.slickGrid.getColumns();
            columns.forEach((col: any) => {
                const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
                    col.id
                );
                if (!footerCell) return;

                // Đếm cho cột Code
                if (col.id === 'ProjectCode') {
                    footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
                }
                // Tổng các cột số liệu
                else if (col.id === 'NumberInStoreDauky') {
                    footerCell.innerHTML = `<b>${totals.NumberInStoreDauky.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'Import') {
                    footerCell.innerHTML = `<b>${totals.Import.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'Export') {
                    footerCell.innerHTML = `<b>${totals.Export.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'QuantityImportExport') {
                    footerCell.innerHTML = `<b>${totals.QuantityImportExport.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'NumberInStoreCuoiKy') {
                    footerCell.innerHTML = `<b>${totals.NumberInStoreCuoiKy.toLocaleString(
                        'en-US'
                    )}</b>`;
                }
            });
        }
    }

    applyDistinctFilters(): void {
        const angularGrid = this.angularGrid;
        if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

        const data = angularGrid.dataView.getItems() as any[];
        if (!data || data.length === 0) return;

        const getUniqueValues = (
            items: any[],
            field: string
        ): Array<{ value: any; label: string }> => {
            const map = new Map<string, { value: any; label: string }>();
            items.forEach((row: any) => {
                const value = row?.[field];
                if (value === null || value === undefined || value === '') return;
                const key = `${typeof value}:${String(value)}`;
                if (!map.has(key)) {
                    map.set(key, { value, label: String(value) });
                }
            });
            return Array.from(map.values()).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
        };

        const columns = angularGrid.slickGrid.getColumns();
        if (columns) {
            columns.forEach((column: any) => {
                if (
                    column.filter &&
                    column.filter.model === Filters['multipleSelect']
                ) {
                    const field = column.field;
                    if (!field) return;
                    column.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        if (this.columnDefinitions) {
            this.columnDefinitions.forEach((colDef: any) => {
                if (
                    colDef.filter &&
                    colDef.filter.model === Filters['multipleSelect']
                ) {
                    const field = colDef.field;
                    if (!field) return;
                    colDef.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        const updatedColumns = angularGrid.slickGrid.getColumns();
        angularGrid.slickGrid.setColumns(updatedColumns);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
    }

    initAngularGrid() {
        this.columnDefinitions = [
            {
                id: 'ProjectCode',
                field: 'ProjectCode',
                name: 'Mã dự án',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                    collectionOptions: {
                        addBlankEntry: true,
                    },
                },
                excelExportOptions: { width: 15 },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                    collectionOptions: {
                        addBlankEntry: true,
                    },
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'ProductNewCode',
                field: 'ProductNewCode',
                name: 'Mã nội bộ',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                    collectionOptions: {
                        addBlankEntry: true,
                    },
                },
                excelExportOptions: { width: 15 },
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 40 },
            },
            {
                id: 'NumberInStoreDauky',
                field: 'NumberInStoreDauky',
                name: 'Tồn đầu kỳ',
                cssClass: 'text-end',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'Import',
                field: 'Import',
                name: 'Nhập dự án',
                cssClass: 'text-end',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'Export',
                field: 'Export',
                name: 'Xuất dự án',
                cssClass: 'text-end',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'QuantityImportExport',
                field: 'QuantityImportExport',
                name: 'Tồn dự án',
                cssClass: 'text-end',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'NumberInStoreCuoiKy',
                field: 'NumberInStoreCuoiKy',
                name: 'Tồn cuối kỳ',
                cssClass: 'text-end',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false,
            },
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
                applySelectOnAllPages: false,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            enableCellMenu: true,
            cellMenu: {
                commandItems: [
                    {
                        command: 'copy',
                        title: 'Sao chép (Copy)',
                        iconCssClass: 'fa fa-copy',
                        positionOrder: 1,
                        action: (_e, args) => {
                            //   this.clipboardService.copy(args.value);
                        },
                    },
                ],
            },
            autoFitColumnsOnFirstLoad: true,
            enableAutoSizeColumns: true,
            forceFitColumns: true,
            enableHeaderMenu: false,
            enableExcelExport: true,
            externalResources: [this.excelExportService],
            excelExportOptions: {
                sanitizeDataExport: true,
                exportWithFormatter: true,
                addGroupIndentation: true,
                groupingColumnHeaderTitle: '',
                columnHeaderStyle: {
                    font: { bold: true, color: 'FFFFFFFF' },
                    fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4D94FF' },
                },
                customExcelHeader: (workbook: any, sheet: any) => {
                    const titleFormat = workbook.getStyleSheet().createFormat({
                        font: { size: 16, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
                        alignment: { wrapText: true, horizontal: 'center', vertical: 'center' },
                        fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF1F497D' },
                    });
                    sheet.setRowInstructions(0, { height: 35 });
                    const customTitle = `DANH SÁCH SẢN PHẨM THEO DỰ ÁN - ${this.sreachParam.selectedProject?.ProjectCode || 'Tất cả'}`;
                    sheet.mergeCells('A1', 'J1');
                    sheet.data.push([
                        { value: customTitle, metadata: { style: titleFormat.id } },
                    ]);
                },
            },
            formatterOptions: {
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ',',
            },
            enableGrouping: true,
            rowHeight: 30,
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 28,
            enablePagination: true,
            pagination: {
                pageSize: 500,
                pageSizes: [200, 300, 400, 500],
                totalItems: 0,
            },
        };
    }

    exportExcel() {
        if (!this.angularGrid || !this.angularGrid.dataView) {
            this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
            return;
        }

        const filteredItems = (this.angularGrid.dataView.getFilteredItems?.() as any[]) || [];

        if (!filteredItems || filteredItems.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }

        try {
            this.excelExportService.exportToExcel({
                filename: `DanhSachSPTheoDuAn_${this.sreachParam.selectedProject?.ProjectCode || ''}`,
                format: 'xlsx',
            });
            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Export error:', error);
            this.notification.error('Lỗi', 'Có lỗi khi xuất Excel!');
        }
    }
}
