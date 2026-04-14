import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatter,
    GridOption,
} from 'angular-slickgrid';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { FiveSRuleErrorFormComponent } from './five-s-rule-error-form/five-s-rule-error-form.component';

@Component({
    standalone: true,
    selector: 'app-five-s-rule-error',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModalModule,
        NzNotificationModule,
        NzModalModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        Menubar,
        AngularSlickgridModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-rule-error.component.html',
    styleUrl: './five-s-rule-error.component.css'
})
export class FiveSRuleErrorComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];
    isLoading = false;

    // SlickGrid
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];
    selectedRow: any = null;

    constructor(
        private ratingErrorService: RatingErrorService,
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
                command: () => this.onCreate(),
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => this.onEdit(),
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => this.onDelete(),
            },
            {
                label: 'Refresh',
                icon: 'fa-solid fa-rotate fa-lg text-primary',
                command: () => this.loadData(),
            }
        ];
    }

    initGrid() {
        const typePointFormatter: Formatter = (row, cell, value) => {
            if (value === 1) return 'Điểm cộng';
            if (value === 2) return 'Điểm trừ';
            return '';
        };

        this.columnDefinitions = [
            { id: 'ID', name: 'ID', field: 'ID', width: 60, sortable: true, filterable: true, type: 'number', filter: { model: Filters['compoundInputNumber'] } },
            { id: 'Name', name: 'Tên quy tắc lỗi', field: 'Name', width: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'TypePoint', name: 'Loại điểm', field: 'TypePoint', width: 120, sortable: true, filterable: true, formatter: typePointFormatter },
            { id: 'Point', name: 'Điểm', field: 'Point', width: 100, sortable: true, filterable: true, type: 'number', filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
            { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Description', name: 'Mô tả chi tiết', field: 'Description', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CreatedBy', name: 'Người tạo', field: 'CreatedBy', width: 120, sortable: true, filterable: true },
            { id: 'CreatedDate', name: 'Ngày tạo', field: 'CreatedDate', width: 120, sortable: true, type: 'date', formatter: (row, cell, value) => value ? new Date(value).toLocaleDateString('vi-VN') : '' }
        ];

        this.gridOptions = {
            datasetIdPropertyName: 'ID',
            enableAutoResize: true,
            autoResize: {
                container: '#grid-container-five-s-rule-error',
                calculateAvailableSizeBy: 'container',
            },
            enableCellNavigation: true,
            enableCheckboxSelector: true,
            checkboxSelector: { hideInFilterHeaderRow: false, hideInColumnTitleRow: false, hideSelectAllCheckbox: false, applySelectOnAllPages: true },
            rowSelectionOptions: { selectActiveRow: false },
            enableRowSelection: true,
            enableFiltering: true,
            enableSorting: true,
            rowHeight: 30,
            headerRowHeight: 35,
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
    }

    loadData() {
        this.isLoading = true;
        this.ratingErrorService.getFiveSRuleErrors().subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.dataset = res.data || [];
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi tải dữ liệu');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    onCellClicked(e: any, args: any) {
        this.selectedRow = this.angularGrid.gridService.getSelectedRowsDataItem()[0];
    }

    onCreate() {
        const modalRef = this.ngbModal.open(FiveSRuleErrorFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = null;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onEdit() {
        const selectedRows = this.angularGrid.gridService.getSelectedRowsDataItem();
        if (selectedRows.length !== 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 bản ghi để sửa');
            return;
        }
        const modalRef = this.ngbModal.open(FiveSRuleErrorFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = selectedRows[0];
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onDelete() {
        const selectedRows = this.angularGrid.gridService.getSelectedRowsDataItem();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 bản ghi để xóa');
            return;
        }

        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ${selectedRows.length} bản ghi đã chọn không?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // In the backend we used update for soft delete, but we need to call delete API
                // Typically project-specific: delete might take IDs or the whole items.
                // Assuming the delete API takes a single item or we loop through.
                // Here I'll loop for simplicity as the backend delete was POST [FromBody] FiveSRuleError
                let deletedCount = 0;
                selectedRows.forEach(item => {
                    this.ratingErrorService.deleteFiveSRuleError(item).subscribe({
                        next: (res: any) => {
                            deletedCount++;
                            if (deletedCount === selectedRows.length) {
                                this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                                this.loadData();
                            }
                        },
                        error: (err: any) => {
                            this.notification.create(
                                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                                err?.error?.message || `${err.error}\n${err.message}`,
                                { nzStyle: { whiteSpace: 'pre-line' } }
                            );
                        }
                    });
                });
            }
        });
    }
}
