import { ClipboardService } from './../../../../services/clipboard.service';
import { CommonModule } from '@angular/common';
import {
    Component,
    AfterViewInit,
    OnInit,
    ChangeDetectorRef,
    OnDestroy,
    inject,
    Injector,
    Optional,
    Inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, MultipleSelectOption, OnSelectedRowsChangedEventArgs, OnClickEventArgs } from 'angular-slickgrid';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { BillImportTechnicalFormComponent } from '../bill-import-technical-form/bill-import-technical-form.component';
import { CheckHistoryTechComponent } from '../check-history-tech/check-history-tech.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { DateTime } from 'luxon';
// @ts-ignore
import { saveAs } from 'file-saver';
import { BillImportTechnicalSummaryComponent } from '../../bill-export-technical/bill-import-technical-summary/bill-import-technical-summary.component';
import { CheckHistoryTechSlickGridComponent } from '../check-history-tech-slick-grid/check-history-tech-slick-grid.component';

function formatDateCell(value: any): string {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
}

@Component({
    selector: 'app-bill-import-technical-new',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzDatePickerModule,
        NzFormModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzModalModule,
        NzSpinModule,
        NzSplitterModule,
        NzTabsModule,
        AngularSlickgridModule,
        HasPermissionDirective,
        NgbModalModule,
    ],
    templateUrl: './bill-import-technical-new.component.html',
    styleUrls: ['./bill-import-technical-new.component.css']
})
export class BillImportTechnicalNewComponent implements OnInit, AfterViewInit, OnDestroy {
    // AngularSlickGrid for master table
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // AngularSlickGrid for detail table
    angularGridDetail!: AngularGridInstance;
    columnDefinitionsDetail: Column[] = [];
    gridOptionsDetail: GridOption = {};
    datasetDetail: any[] = [];

    // Data
    selectedRow: any = null;
    sizeTbDetail: any = '0';
    dateStart: Date | null = null;
    dateEnd: Date | null = null;
    employeeID: number | null = null;
    filterText: string = '';
    warehouseID: number = 1;
    selectedApproval: number | null = null;
    isSearchVisible: boolean = false;
    isDetailLoad: boolean = false;
    tabDetailTitle: string = 'Thông tin phiếu nhập';
    billImportTechnicalData: any[] = [];
    billImportTechnicalDetailData: any[] = [];
    statusData = [
        { ID: 0, Name: 'Chưa duyệt' },
        { ID: 1, Name: 'Đã duyệt' },
    ];
    warehouseType: number = 1;
    isLoading: boolean = false;
    private subscriptions: Subscription[] = [];
    private ngbModal = inject(NgbModal);
private gridResizeObserver!: ResizeObserver;
private detailResizeObserver!: ResizeObserver;
    constructor(
        private notification: NzNotificationService,
        private billImportTechnicalService: BillImportTechnicalService,
        private modal: NzModalService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private injector: Injector,
        private ClipboardService: ClipboardService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }
    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            // this.warehouseID = params['warehouseID'] || 1;
            // this.warehouseType = params['warehouseType'] || 1;

            this.warehouseID =
                params['warehouseID']
                ?? this.tabData?.warehouseID
                ?? 1;

            this.warehouseType =
                params['warehouseType']
                ?? this.tabData?.warehouseType
                ?? 1;
        });

        // Khởi tạo giá trị mặc định cho dateStart (đầu tháng hiện tại) và dateEnd (hôm nay)
        const now = new Date();
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1); // Ngày đầu tháng
        this.dateEnd = new Date(); // Hôm nay

        this.initGridColumns();
        this.initGridOptions();
        this.initDetailGridColumns();
        this.initDetailGridOptions();
    }
    private initResizeObserver(): void {
      const masterEl = document.querySelector('.grid-container') as HTMLElement;
      const detailEl = document.querySelector('.grid-container-detail') as HTMLElement;

      if (masterEl) {
        this.gridResizeObserver = new ResizeObserver(() => {
          this.angularGrid?.slickGrid?.resizeCanvas();
        });
        this.gridResizeObserver.observe(masterEl);
      }

      if (detailEl) {
        this.detailResizeObserver = new ResizeObserver(() => {
          this.angularGridDetail?.slickGrid?.resizeCanvas();
        });
        this.detailResizeObserver.observe(detailEl);
      }
    }
    ngAfterViewInit(): void {
        this.initResizeObserver();
        setTimeout(() => {
            this.loadData();
        }, 100);

    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
          this.gridResizeObserver?.disconnect();
  this.detailResizeObserver?.disconnect();
    }

    // Helper method to format date to yyyy-MM-dd
    private formatDateToString(date: Date | null): string {
        if (!date) return '';
        return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
    }

    private initGridColumns(): void {
        this.columnDefinitions = [
            {
                id: 'Status',
                field: 'Status',
                name: 'Duyệt',
                width: 80,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    const checked = value === true || value === 'true' || value === 1 || value === '1';
                    return checked ? '✓' : '';
                },
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [
                        { value: true, label: 'Đã duyệt' },
                        { value: false, label: 'Chưa duyệt' },
                    ],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'EmployeeApproveName',
                field: 'EmployeeApproveName',
                name: 'Người duyệt',
                width: 180,
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
                id: 'DateStatus',
                field: 'DateStatus',
                name: 'Ngày duyệt',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => formatDateCell(value),
            },
            {
                id: 'BillTypeNewText',
                field: 'BillTypeNewText',
                name: 'Loại phiếu',
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
                id: 'BillCode',
                field: 'BillCode',
                name: 'Mã phiếu nhập',
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
                id: 'NCC',
                field: 'NCC',
                name: 'Nhà cung cấp',
                width: 200,
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
                id: 'CustomerName',
                field: 'CustomerName',
                name: 'Khách hàng',
                width: 200,
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
                id: 'DepartmentName',
                field: 'DepartmentName',
                name: 'Phòng ban',
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
                id: 'Deliver',
                field: 'Deliver',
                name: 'Người giao',
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
                id: 'EmployeeReceiverName',
                field: 'EmployeeReceiverName',
                name: 'Người nhận',
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
                id: 'CreatDate',
                field: 'CreatDate',
                name: 'Ngày tạo',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => formatDateCell(value),
            },
            {
                id: 'CreatedBy',
                field: 'CreatedBy',
                name: 'Người tạo',
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
                id: 'WarehouseType',
                field: 'WarehouseType',
                name: 'Loại kho',
                width: 120,
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
        ];
    }

    private initGridOptions(): void {
        this.gridOptions = {
            // enableAutoResize: true,
            // autoResize: {
            //     container: '.grid-container',
            //     calculateAvailableSizeBy: 'container',
            //     resizeDetection: 'container',
            // },
              enableAutoResize: false,
  // gridWidth: '100%',
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false,
            },
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
                applySelectOnAllPages: true,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            frozenColumn: 1,
            enableHeaderMenu: false,
            enableCellMenu: true,
            cellMenu: {
                commandItems: [
                    {
                        command: 'copy',
                        title: 'Sao chép (Copy)',
                        iconCssClass: 'fa fa-copy',
                        positionOrder: 1,
                        action: (_e, args) => {
                            this.ClipboardService.copy(args.value);
                        },
                    },
                ],
            },
        };
    }
    openSummaryModal() {
        const modalRef = this.ngbModal.open(BillImportTechnicalSummaryComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
            size: 'xl',
        });
        // Truyền warehouseID vào component
        modalRef.componentInstance.warehouseId = this.warehouseID;
    }
    private initDetailGridColumns(): void {
        this.columnDefinitionsDetail = [
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 300,
                sortable: true,
                filterable: true,
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 300,
                sortable: true,
                filterable: true,
            },
            {
                id: 'Serial',
                field: 'Serial',
                name: 'Serial',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'Quantity',
                field: 'Quantity',
                name: 'Số lượng',
                width: 100,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'UnitCountName',
                field: 'UnitCountName',
                name: 'ĐVT',
                width: 80,
                sortable: true,
                filterable: true,
            },
            {
                id: 'WarehouseType',
                field: 'WarehouseType',
                name: 'Tình trạng hàng',
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
            },
            {
                id: 'BillCodePO',
                field: 'BillCodePO',
                name: 'Đơn mua hàng',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'EmployeeBorrowName',
                field: 'EmployeeBorrowName',
                name: 'Người cần mượn',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'DeadlineReturnNCC',
                field: 'DeadlineReturnNCC',
                name: 'Deadline trả NCC',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => formatDateCell(value),
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 300,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    if (!value) return '';
                    return `<span class="text-wrap">${value}</span>`;
                },
            },
            {
                id: 'IsBorrowSupplier',
                field: 'IsBorrowSupplier',
                name: 'Mượn từ NCC?',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    if (value === true || value === 1) return 'Có';
                    if (value === false || value === 0) return 'Không';
                    return '';
                },
            },
        ];
    }

    private initDetailGridOptions(): void {
        this.gridOptionsDetail = {
            enableAutoResize: false,
            // autoResize: {
            //     container: '.grid-container-detail',
            //     calculateAvailableSizeBy: 'container',
            //     resizeDetection: 'container',
            // },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            enableHeaderMenu: false,
        };
    }

    loadData() {
        this.isLoading = true;
        const request = {
            Page: 1,
            Size: 100000,
            dateStart: this.formatDateToString(this.dateStart) || '2024-12-01',
            dateEnd: this.formatDateToString(this.dateEnd) || '2025-12-31',
            status:
                this.selectedApproval !== null
                    ? this.selectedApproval === 1
                        ? '1'
                        : '0'
                    : '-1',
            filterText: this.filterText || '',
            warehouseID: this.warehouseID || 1,
            BillType: (this.warehouseType || 1) == 2,
        };

        const sub = this.billImportTechnicalService.getBillimportTechnical(request).subscribe({
            next: (response: any) => {
                const data = response.billImportTechnical || [];

                // Map data với id unique cho SlickGrid
                const mappedData = data.map((item: any, index: number) => ({
                    ...item,
                    // id: item.ID || `bill_${index}_${Date.now()}`,
                    id: index + 1,
                }));

                this.dataset = mappedData;
                this.billImportTechnicalData = mappedData;

                // Update filter collections after data is loaded
                this.updateFilterCollections();

                this.isLoading = false;
                this.cdr.detectChanges();

                // Resize grid sau khi data được load
                setTimeout(() => {
                    if (this.angularGrid) {
                        this.angularGrid.resizerService.resizeGrid();
                    }
                }, 100);

                // Auto-select first row if available
                if (mappedData.length > 0 && this.angularGrid) {
                    setTimeout(() => {
                        this.angularGrid.slickGrid.setSelectedRows([0]);
                        const firstRowData = this.angularGrid.dataView.getItem(0);
                        if (firstRowData) {
                            this.onRowClick(null, { dataContext: firstRowData, row: 0 });
                        }
                    }, 200);
                } else {
                    // Clear detail when no master data
                    this.billImportTechnicalDetailData = [];
                    this.selectedRow = null;
                    this.sizeTbDetail = '0';
                    this.updateTabDetailTitle();
                    if (this.angularGridDetail) {
                        this.datasetDetail = [];
                        this.cdr.detectChanges();
                    }
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách phiếu nhập: ' + (error.message || error)
                );
            }
        });
        this.subscriptions.push(sub);
    }

    private updateFilterCollections(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const columns = this.angularGrid.slickGrid.getColumns();
        const allData = this.dataset;

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            allData.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        // Update collections for each filterable column
        columns.forEach((column: any) => {
            if (column.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (field && field !== 'Status') {
                    const collection = getUniqueValues(field);
                    if (column.filter) {
                        column.filter.collection = collection;
                    }
                }
            }
        });

        // Update grid columns
        this.angularGrid.slickGrid.setColumns(columns);
        this.angularGrid.slickGrid.render();
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;

        // Setup row click event using SlickGrid's event system
        if (angularGrid && angularGrid.slickGrid) {
            angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
                const row = args.row;
                if (row !== undefined && row >= 0) {
                    const rowData = angularGrid.dataView.getItem(row);
                    if (rowData) {
                        this.onRowClick(e, { dataContext: rowData, row: row });
                    }
                }
            });
        }

        // Resize grid sau khi container đã render
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    angularGridDetailReady(angularGrid: AngularGridInstance) {
        this.angularGridDetail = angularGrid;

        // Resize grid sau khi container đã render
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    onRowClick(e: Event | null, args: any) {
        const rowData = args.dataContext;
        this.selectedRow = rowData;
        this.sizeTbDetail = null;
        this.updateTabDetailTitle();
        const id = rowData['ID'];

        this.isDetailLoad = true;
        const sub = this.billImportTechnicalService.getBillImportDetail(id).subscribe({
            next: (res) => {
                const details = Array.isArray(res.billDetail) ? res.billDetail : [];
                this.billImportTechnicalDetailData = details;

                // Map data với id unique cho SlickGrid
                const mappedDetailData = details.map((item: any, index: number) => ({
                    ...item,
                    // id: item.ID || `detail_${index}_${Date.now()}`,
                    id: index + 1,
                }));

                this.datasetDetail = mappedDetailData;
                this.isDetailLoad = false;
                this.cdr.detectChanges();

                // Resize detail grid
                setTimeout(() => {
                    if (this.angularGridDetail) {
                        this.angularGridDetail.resizerService.resizeGrid();
                    }
                }, 100);
            },
            error: () => {
                this.isDetailLoad = false;
            }
        });
        this.subscriptions.push(sub);
    }

    onRowSelectionChanged(eventData: any, args: OnSelectedRowsChangedEventArgs) {
        // Handle row selection if needed
    }

    getSelectedRows(): any[] {
        if (!this.angularGrid) return [];
        const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) return [];
        return selectedIndexes.map((index: number) =>
            this.angularGrid.dataView.getItem(index)
        ).filter((item: any) => item);
    }

    onSearch(): void {
        this.loadData();
    }

    toggleSearchPanel(): void {
        this.isSearchVisible = !this.isSearchVisible;
    }

    updateTabDetailTitle(): void {
        if (this.selectedRow?.BillCode) {
            this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillCode}`;
        } else {
            this.tabDetailTitle = 'Thông tin phiếu nhập';
        }
    }

    openModalImportExcel() {
        const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: false,
            scrollable: true,
            modalDialogClass: 'modal-fullscreen',
        });
        // Truyền warehouseID từ component cha vào modal
        modalRef.componentInstance.warehouseID = this.warehouseID;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            // Reload table after successful save
            this.loadData();
        });
    }

    onEditBillImportTechnical() {
        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn biên bản cần sửa!'
            );
            return;
        }
        const selectedRow = selectedRows[0];
        if (selectedRow.Status === true || selectedRow.Status === 1) {
            this.notification.warning(
                'Không thể sửa',
                'Biên bản đã duyệt, không thể sửa!'
            );
            return;
        }
        const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: false,
            scrollable: true,
            modalDialogClass: 'modal-fullscreen',
        });
        modalRef.componentInstance.masterId = selectedRow.ID;
        modalRef.componentInstance.dataEdit = selectedRow;
        // Truyền warehouseID từ component cha vào modal
        modalRef.componentInstance.warehouseID = this.warehouseID;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            // Reload table after successful edit
            this.loadData();
        });
    }

    onDeleteBillImportTechnical() {
        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn biên bản cần xóa!'
            );
            return;
        }
        const selectedRow = selectedRows[0];
        if (selectedRow.Status === true || selectedRow.Status === 1) {
            this.notification.warning(
                'Không thể xóa',
                'Biên bản đã được duyệt, không thể xóa!'
            );
            return;
        }

        const selectedId = selectedRow.ID;
        const payload = {
            billImportTechnical: {
                ID: selectedId,
                IsDeleted: true,
            },
            historyDeleteBill: {
                ID: 0,
                UserID: 1,
                BillID: selectedId,
                Name: 'AdminSW',
                TypeBill: selectedRow.BillCode,
                DeleteDate: DateTime.now().toUTC().toISO(),
            },
        };

        const sub = this.billImportTechnicalService.saveData(payload).subscribe({
            next: () => {
                this.notification.success(
                    NOTIFICATION_TITLE.success,
                    'Xóa biên bản thành công!'
                );
                this.loadData();
            },
            error: (err) => {
                this.notification.warning(
                    NOTIFICATION_TITLE.error,
                    'Lỗi kết nối máy chủ!'
                );
            },
        });
        this.subscriptions.push(sub);
    }

    // Approve multiple bills
    onApprove() {
        const selectedRows = this.getSelectedRows();

        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn phiếu cần duyệt!');
            return;
        }

        // Show confirmation dialog
        const billCount = selectedRows.length;
        const confirmMsg =
            billCount === 1
                ? `Bạn có chắc chắn muốn duyệt phiếu "${selectedRows[0].BillCode || selectedRows[0].ID
                }" không?`
                : `Bạn có chắc chắn muốn duyệt ${billCount} phiếu đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận duyệt phiếu',
            nzContent: confirmMsg,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Gửi chỉ ID của bills cần duyệt
                const billsToApprove = selectedRows.map((bill) => ({ ID: bill.ID }));

                const sub = this.billImportTechnicalService.approveBills(billsToApprove).subscribe({
                    next: (response) => {
                        console.log('Approve response:', response);

                        if (response?.success) {
                            // Backend trả về success = true
                            const data = response.data || {};
                            const successCount = data.SuccessCount || 0;
                            const totalProcessed = data.TotalProcessed || billCount;

                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                response.message ||
                                `Duyệt thành công ${successCount}/${totalProcessed} phiếu!`
                            );
                        } else {
                            // Backend trả về success = false nhưng vẫn OK status
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                response?.message || 'Không có phiếu nào được duyệt.'
                            );
                        }

                        // Reload table after successful approve
                        this.loadData();
                    },
                    error: (err) => {
                        console.error('Approve error:', err);
                        const errorMsg =
                            err?.error?.message || err?.message || 'Lỗi kết nối máy chủ!';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                    },
                });
                this.subscriptions.push(sub);
            },
        });
    }

    // Unapprove multiple bills
    onUnApprove() {
        const selectedRows = this.getSelectedRows();

        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                'Cảnh báo',
                'Vui lòng chọn phiếu cần hủy duyệt!'
            );
            return;
        }

        // Show confirmation dialog
        const billCount = selectedRows.length;
        const confirmMsg =
            billCount === 1
                ? `Bạn có chắc chắn muốn HỦY DUYỆT phiếu "${selectedRows[0].BillCode || selectedRows[0].ID
                }" không?`
                : `Bạn có chắc chắn muốn HỦY DUYỆT ${billCount} phiếu đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận hủy duyệt phiếu',
            nzContent: confirmMsg,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                // Gửi chỉ ID của bills cần hủy duyệt
                const billsToUnapprove = selectedRows.map((bill) => ({ ID: bill.ID }));

                const sub = this.billImportTechnicalService
                    .unapproveBills(billsToUnapprove)
                    .subscribe({
                        next: (response) => {
                            console.log('Unapprove response:', response);

                            if (response?.success) {
                                // Backend trả về success = true
                                const data = response.data || {};
                                const successCount = data.SuccessCount || 0;
                                const totalProcessed = data.TotalProcessed || billCount;

                                this.notification.success(
                                    NOTIFICATION_TITLE.success,
                                    response.message ||
                                    `Hủy duyệt thành công ${successCount}/${totalProcessed} phiếu!`
                                );
                            } else {
                                // Backend trả về success = false nhưng vẫn OK status
                                this.notification.warning(
                                    NOTIFICATION_TITLE.warning,
                                    response?.message || 'Không có phiếu nào được hủy duyệt.'
                                );
                            }

                            this.loadData();
                        },
                        error: (err) => {
                            console.error('Unapprove error:', err);
                            const errorMsg =
                                err?.error?.message || err?.message || 'Lỗi kết nối máy chủ!';
                            this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                        },
                    });
                this.subscriptions.push(sub);
            },
        });
    }

    exportBillImportTechnicalExcel() {
        const selectedMaster = this.selectedRow;
        const details = this.datasetDetail || [];

        if (!selectedMaster || !details || details.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu để xuất Excel!'
            );
            return;
        }

        // Hiển thị thông báo đang tải
        const loadingNotification = this.notification.info(
            'Đang xử lý',
            'Đang tải dữ liệu...',
            { nzDuration: 0 } // Không tự đóng
        );

        const payload = {
            Master: {
                ID: selectedMaster.ID,
                Code: selectedMaster.BillCode,
                CreatedDate: selectedMaster.CreatDate,
                SupplierName: selectedMaster.NCC || selectedMaster.Suplier,
                CustomerName: selectedMaster.CustomerName,
                Deliver: selectedMaster.Deliver,
                Receiver: selectedMaster.EmployeeReceiverName,
                DepartmentName: selectedMaster.DepartmentName,
                Addres: selectedMaster.Addres || '',
            },
            Details: details.map((item: any) => ({
                ProductCode: item.ProductCode,
                ProductName: item.ProductName,
                Quantity: item.Quantity,
                UnitName: item.UnitCountName || item.UnitName,
                Maker: item.Maker,
                WarehouseType: item.WarehouseType,
                ProductCodeRTC: item.ProductCodeRTC,
                Note: item.Note,
            })),
        };

        const sub = this.billImportTechnicalService
            .exportBillImportTechnical(payload)
            .subscribe({
                next: (blob: Blob) => {
                    const fileName = `PhieuNhapKT_${selectedMaster.BillCode}.xlsx`;
                    saveAs(blob, fileName);

                    // Đóng notification loading
                    this.notification.remove(loadingNotification.messageId);

                    // Hiển thị thông báo thành công
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        'Xuất Excel thành công!'
                    );
                },
                error: (err) => {
                    // Đóng notification loading
                    this.notification.remove(loadingNotification.messageId);

                    console.error(err);
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Không thể xuất phiếu nhập kỹ thuật!'
                    );
                },
            });
        this.subscriptions.push(sub);
    }

    closePanel() {
        this.sizeTbDetail = '0';
    }

    openCheckHistoryTech() {
        const modalRef = this.ngbModal.open(CheckHistoryTechSlickGridComponent, {
            centered: false,
            fullscreen: true,
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            windowClass: 'full-screen-modal',
            injector: this.injector
        });

        // Truyền warehouseId và warehouseType vào modal qua @Input
        if (modalRef.componentInstance) {
            modalRef.componentInstance.warehouseID = this.warehouseID || 1;
            modalRef.componentInstance.warehouseType = this.warehouseType || 1;
        }

        // Xử lý khi modal đóng
        modalRef.result.then(
            (result) => {
                // Có thể reload data nếu cần
                if (result === 'success') {
                    // this.loadData();
                }
            },
            (dismissed) => {
                // Modal dismissed
            }
        );
    }
}
