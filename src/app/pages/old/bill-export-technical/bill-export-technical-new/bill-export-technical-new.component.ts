
import { CommonModule } from '@angular/common';
import {
    Component,
    AfterViewInit,
    OnInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
    OnDestroy,
    inject,
    Inject,
    Optional,
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
import { BillExportTechnicalFormComponent } from '../bill-export-technical-form/bill-export-technical-form.component';
import { BillImportTechnicalSummaryComponent } from '../bill-import-technical-summary/bill-import-technical-summary.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BillExportTechnicalService } from '../bill-export-technical-service/bill-export-technical.service';
import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
// @ts-ignore
import { saveAs } from 'file-saver';
import { ClipboardService } from '../../../../services/clipboard.service';

@Component({
    selector: 'app-bill-export-technical-new',
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
    templateUrl: './bill-export-technical-new.component.html',
    styleUrls: ['./bill-export-technical-new.component.css']
})
export class BillExportTechnicalNewComponent implements OnInit, AfterViewInit, OnDestroy {
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
    tabDetailTitle: string = 'Thông tin phiếu xuất';
    billExportTechnicalData: any[] = [];
    billExportTechnicalDetailData: any[] = [];
    statusData = [
        { ID: 0, Name: 'Chưa duyệt' },
        { ID: 1, Name: 'Đã duyệt' },
    ];
    warehouseType: number = 0;
    isLoading: boolean = false;
    private subscriptions: Subscription[] = [];
    private ngbModal = inject(NgbModal);

    constructor(
        private notification: NzNotificationService,
        private billExportTechnicalService: BillExportTechnicalService,
        private appUserService: AppUserService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
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

        // Khởi tạo giá trị mặc định cho các filter
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (!this.dateStart) {
            this.dateStart = firstDayOfMonth;
        }
        if (!this.dateEnd) {
            this.dateEnd = lastDayOfMonth;
        }

        this.initGridColumns();
        this.initGridOptions();
        this.initDetailGridColumns();
        this.initDetailGridOptions();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.loadData();
        }, 100);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
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
                formatter: Formatters.iconBoolean,
                params: { cssClass: 'mdi mdi-check' },
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
                id: 'ApprovalDate',
                field: 'ApprovalDate',
                name: 'Ngày Duyệt / Hủy duyệt',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    if (!value) return '';
                    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
                },
            },
            {
                id: 'EmployeeApproveName',
                field: 'EmployeeApproveName',
                name: 'Người Duyệt / Hủy duyệt',
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
                id: 'BillTypeText',
                field: 'BillTypeText',
                name: 'Loại',
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
            {
                id: 'Code',
                field: 'Code',
                name: 'Mã phiếu xuất',
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
                id: 'ProjectName',
                field: 'ProjectName',
                name: 'Dự án',
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
                id: 'NameNCC',
                field: 'NameNCC',
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
                id: 'EmployeeCode',
                field: 'EmployeeCode',
                name: 'Mã nhân viên',
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
            {
                id: 'Receiver',
                field: 'Receiver',
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
                id: 'CreatedDate',
                field: 'CreatedDate',
                name: 'Ngày tạo',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    if (!value) return '';
                    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
                },
            },
            {
                id: 'WarehouseType',
                field: 'WarehouseType',
                name: 'Loại kho',
                width: 100,
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
                id: 'Addres',
                field: 'Addres',
                name: 'Địa chỉ',
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
        ];
    }

    private initGridOptions(): void {
        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
                applyResizeToContainer: true,
                // minHeight: 500,
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

    private initDetailGridColumns(): void {
        this.columnDefinitionsDetail = [
            {
                id: 'ProductQRCode',
                field: 'ProductQRCode',
                name: 'Mã QRCode',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: (row: number, cell: number, value: any) => {
                    if (!value) return '';
                    return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${value}</div>`;
                },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
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
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 250,
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
            },
            {
                id: 'UnitName',
                field: 'UnitName',
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
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 200,
                sortable: true,
                filterable: true,
            },
        ];
    }

    private initDetailGridOptions(): void {
        this.gridOptionsDetail = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            enableHeaderMenu: false,
            forceFitColumns: true,
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
            WarehouseTypeBill: this.warehouseType || 1,
        };

        const sub = this.billExportTechnicalService.getBillExportTechnical(request).subscribe({
            next: (response: any) => {
                const data = response.billExportTechnical || [];

                // Map data với id unique cho SlickGrid
                const mappedData = data.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || `bill_${index}_${Date.now()}`,
                }));

                this.dataset = mappedData;
                this.billExportTechnicalData = mappedData;

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
            },
            error: (error: any) => {
                this.isLoading = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách phiếu xuất: ' + (error.message || error)
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

    onRowClick(e: Event, args: any) {
        const rowData = args.dataContext;
        this.selectedRow = rowData;
        this.sizeTbDetail = null;
        this.updateTabDetailTitle();
        const id = rowData['ID'];

        this.isDetailLoad = true;
        const sub = this.billExportTechnicalService.getBillExportDetail(id).subscribe({
            next: (res) => {
                const details = Array.isArray(res.billDetail) ? res.billDetail : [];
                this.billExportTechnicalDetailData = details;

                // Map data với id unique cho SlickGrid
                const mappedDetailData = details.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || `detail_${index}_${Date.now()}`,
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
        if (selectedRow.Status === 1 || selectedRow.Status === true) {
            this.notification.warning(
                'Không thể xóa',
                'Biên bản đã được duyệt, không thể xóa!'
            );
            return;
        }

        const selectedId = selectedRow.ID;
        const payload = {
            billExportTechnical: {
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

        const sub = this.billExportTechnicalService.saveData(payload).subscribe({
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

    onApprove() {
        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                'Cảnh báo',
                'Vui lòng chọn biên bản cần duyệt!'
            );
            return;
        }

        const selectedRow = selectedRows[0];
        const sub = this.billExportTechnicalService
            .approveBill(selectedRow.ID, true)
            .subscribe({
                next: (res) => {
                    if (res.status === 1) {
                        this.notification.success(
                            NOTIFICATION_TITLE.success,
                            res.message || 'Duyệt phiếu thành công!'
                        );
                        this.loadData();
                    } else {
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            res.message || 'Có lỗi xảy ra khi duyệt phiếu!'
                        );
                    }
                },
                error: (err) => {
                    const errorMsg = err?.error?.message || 'Lỗi kết nối máy chủ!';
                    this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                },
            });
        this.subscriptions.push(sub);
    }

    onUnApprove() {
        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                'Cảnh báo',
                'Vui lòng chọn biên bản cần bỏ duyệt!'
            );
            return;
        }

        const selectedRow = selectedRows[0];
        const sub = this.billExportTechnicalService
            .approveBill(selectedRow.ID, false)
            .subscribe({
                next: (res) => {
                    if (res.status === 1) {
                        this.notification.success(
                            NOTIFICATION_TITLE.success,
                            res.message || 'Bỏ duyệt phiếu thành công!'
                        );
                        this.loadData();
                    } else {
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            res.message || 'Có lỗi xảy ra khi bỏ duyệt phiếu!'
                        );
                    }
                },
                error: (err) => {
                    const errorMsg = err?.error?.message || 'Lỗi kết nối máy chủ!';
                    this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                },
            });
        this.subscriptions.push(sub);
    }

    openModalExportTechnical() {
        const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });
        modalRef.componentInstance.warehouseID = this.warehouseID;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        // Lắng nghe sự kiện lưu dữ liệu thành công để reload table
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            this.loadData();
        });
    }

    /**
     * Mở modal fullscreen Tổng hợp chi tiết phiếu nhập phòng kỹ thuật
     */
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

    onExportExcel() {
        if (!this.selectedRow) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một phiếu xuất để xuất Excel!'
            );
            return;
        }

        const details = this.datasetDetail || [];

        if (!details || details.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu để xuất Excel!'
            );
            return;
        }

        const payload = {
            master: {
                ID: this.selectedRow.ID,
                Code: this.selectedRow.Code,
                CreatedDate: this.selectedRow.CreatedDate,
                SupplierName: this.selectedRow.SupplierName,
                CustomerName: this.selectedRow.CustomerName,
                Deliver: this.selectedRow.Deliver,
                EmployeeReceiverName: this.selectedRow.EmployeeReceiverName,
                DepartmentName: this.selectedRow.DepartmentName,
            },
            details: details.map((item: any) => ({
                ProductCode: item.ProductCode,
                ProductName: item.ProductName,
                Quantity: item.Quantity,
                UnitName: item.UnitName,
                Maker: item.Maker,
                WarehouseType: item.WarehouseType,
                ProductCodeRTC: item.ProductCodeRTC,
                Note: item.Note,
            })),
        };

        const sub = this.billExportTechnicalService
            .exportBillExportTechnical(payload)
            .subscribe({
                next: (blob: Blob) => {
                    const fileName = `PhieuXuatKT_${this.selectedRow.Code}.xlsx`;
                    saveAs(blob, fileName);
                },
                error: (err) => {
                    console.error(err);
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Không thể xuất phiếu xuất kỹ thuật!'
                    );
                },
            });
        this.subscriptions.push(sub);
    }

    onEditExportTechnical() {
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
        // Mở modal và truyền dữ liệu vào
        const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });
        modalRef.componentInstance.masterId = selectedRow.ID; // Để form tự gọi chi tiết
        modalRef.componentInstance.dataEdit = selectedRow;
        modalRef.componentInstance.warehouseID = this.warehouseID;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        const currentDetails = this.datasetDetail || [];
        modalRef.componentInstance.dataInput = { details: currentDetails };

        // Lắng nghe sự kiện lưu dữ liệu thành công để reload table
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            this.loadData();
        });
    }

    closePanel() {
        this.sizeTbDetail = '0';
    }

    updateTabDetailTitle(): void {
        if (this.selectedRow?.Code) {
            this.tabDetailTitle = `Thông tin phiếu xuất - ${this.selectedRow.Code}`;
        } else {
            this.tabDetailTitle = 'Thông tin phiếu xuất';
        }
    }
}
