import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

import { NOTIFICATION_TITLE } from '../../../../app.config';
import { EconomicContractService } from '../economic-contract-service/economic-contract.service';
import { EconomicContractTypeFormComponent } from './economic-contract-type-form/economic-contract-type-form.component';

@Component({
    standalone: true,
    selector: 'app-economic-contract-type',
    imports: [
        CommonModule,
        FormsModule,
        NgbModalModule,
        NzNotificationModule,
        NzModalModule,
        NzCardModule,
        NzSplitterModule,
        Menubar,
        AngularSlickgridModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './economic-contract-type.component.html',
    styleUrl: './economic-contract-type.component.css'
})
export class EconomicContractTypeComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];

    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    private excelExportService = new ExcelExportService();

    constructor(
        private economicContractService: EconomicContractService,
        private notification: NzNotificationService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.initMenuBar();
        this.initGrid();
        this.loadData();
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => {
                    this.onCreate();
                },
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => {
                    this.onEdit();
                }
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => {
                    this.onDelete();
                }
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.exportToExcel();
                }
            }
        ];
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'STT',
                name: 'STT',
                field: 'STT',
                type: 'number',
                width: 60,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-center',
                excelExportOptions: { width: 8 }
            },
            {
                id: 'TypeCode',
                name: 'Mã loại hợp đồng',
                field: 'TypeCode',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                excelExportOptions: { width: 20 }
            },
            {
                id: 'TypeName',
                name: 'Tên loại hợp đồng',
                field: 'TypeName',
                type: 'string',
                minWidth: 300,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 60 }
            },
            {
                id: 'CreatedDate',
                name: 'Ngày tạo',
                field: 'CreatedDate',
                type: 'dateIso',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: Formatters.dateIso,
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center',
                hidden: true,
                excludeFromExport: true
            },
            {
                id: 'CreatedBy',
                name: 'Người tạo',
                field: 'CreatedBy',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                hidden: true,
                excludeFromExport: true
            },
            {
                id: 'UpdatedDate',
                name: 'Ngày cập nhật',
                field: 'UpdatedDate',
                type: 'dateIso',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: Formatters.dateIso,
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center',
                hidden: true,
                excludeFromExport: true
            },
            {
                id: 'UpdatedBy',
                name: 'Người cập nhật',
                field: 'UpdatedBy',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                hidden: true,
                excludeFromExport: true
            },
        ];

        this.gridOptions = {
            datasetIdPropertyName: 'id',
            autoResize: {
                container: '#grid-container-type',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            enableAutoResize: true,
            gridWidth: '100%',
            forceFitColumns: true,
            enableRowSelection: true,
            multiSelect: true,
            rowSelectionOptions: {
                selectActiveRow: false
            },
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: false,
                hideSelectAllCheckbox: false,
                applySelectOnAllPages: true
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableColumnReorder: true,
            enableSorting: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            rowHeight: 30,
            headerRowHeight: 35,
            // Excel Export
            externalResources: [this.excelExportService],
            enableExcelExport: true,
            excelExportOptions: {
                sanitizeDataExport: true,
                exportWithFormatter: true,
                columnHeaderStyle: {
                    font: { fontName: 'Times New Roman', size: 12, bold: false, color: '#220000' },
                    fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF33CC33' },
                    alignment: { horizontal: 'center' },
                    border: {
                        top: { color: 'FF000000', style: 'thin' },
                        left: { color: 'FF000000', style: 'thin' },
                        right: { color: 'FF000000', style: 'thin' },
                        bottom: { color: 'FF000000', style: 'thin' }
                    }
                },
                dataStyle: {
                    font: { fontName: 'Times New Roman', size: 12 },
                    border: {
                        top: { color: 'FF000000', style: 'thin' },
                        left: { color: 'FF000000', style: 'thin' },
                        right: { color: 'FF000000', style: 'thin' },
                        bottom: { color: 'FF000000', style: 'thin' }
                    }
                }
            } as any,
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid.dataView;
    }

    loadData() {
        this.economicContractService.getEconomicContractTypes().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.dataset = (res.data || []).map((item: any) => ({ ...item, id: item.ID }));
                    this.updateFilterCollections();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy dữ liệu thất bại');
                }
            },
            error: (err) => {
                const msg = err?.error?.message || err?.message || 'Lỗi khi lấy dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, msg);
                console.error('Lỗi lấy dữ liệu:', err);
            }
        });
    }

    onCreate() {
        const modalRef = this.ngbModal.open(EconomicContractTypeFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = null;
        const maxSTT = this.dataset.length > 0 ? Math.max(...this.dataset.map(x => x.STT || 0)) : 0;
        modalRef.componentInstance.nextSTT = maxSTT + 1;
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            this.loadData();
        });
        modalRef.result.then(
            (result) => {
                if (result === 'save') {
                    this.loadData();
                }
            },
            (dismissed) => { }
        );
    }

    onEdit() {
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
            return;
        }
        const rowIndex = selectedRows[0];
        const rowData = this.angularGrid.dataView.getItem(rowIndex);

        const modalRef = this.ngbModal.open(EconomicContractTypeFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = { ...rowData };
        modalRef.componentInstance.formSubmitted.subscribe(() => {
            this.loadData();
        });
        modalRef.result.then(
            (result) => {
                if (result === 'save') {
                    this.loadData();
                }
            },
            (dismissed) => { }
        );
    }

    onDelete() {
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng để xóa!');
            return;
        }

        const selectedIds = selectedRows.map(index => this.angularGrid.dataView.getItem(index).ID);
        let content = '';
        if (selectedIds.length === 1) {
            const rowData = this.angularGrid.dataView.getItem(selectedRows[0]);
            content = `Bạn chắc chắn muốn xóa loại hợp đồng <b>${rowData.TypeCode} - ${rowData.TypeName}</b>?`;
        } else {
            content = `Bạn chắc chắn muốn xóa <b>${selectedIds.length}</b> loại hợp đồng đã chọn?`;
        }

        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: content,
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                return this.economicContractService.deleteEconomicContractType(selectedIds)
                    .toPromise()
                    .then((res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công');
                            this.loadData();
                            this.angularGrid.slickGrid.setSelectedRows([]);
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
                        }
                    })
                    .catch((err) => {
                        const msg = err?.error?.message || err?.message || 'Không gọi được API';
                        this.notification.error(NOTIFICATION_TITLE.error, msg);
                    });
            },
        });
    }

    exportToExcel() {
        this.excelExportService.exportToExcel({
            filename: 'LoaiHopDong',
            format: 'xlsx',
        });
    }

    updateFilterCollections() {
        if (!this.angularGrid?.slickGrid) return;

        this.columnDefinitions.forEach(column => {
            if (column.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field as string;
                const uniqueValues = Array.from(new Set(this.dataset.map(item => item[field])))
                    .filter(val => val !== undefined && val !== null && val !== '')
                    .sort()
                    .map(val => ({ label: val, value: val }));

                column.filter.collection = uniqueValues;
            }
        });

        // Sử dụng setColumns thay vì reassign columnDefinitions để giữ lại checkbox column
        this.angularGrid.slickGrid.setColumns(this.angularGrid.slickGrid.getColumns());
    }
}
