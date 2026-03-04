import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    GridOption,
    Formatters,
} from 'angular-slickgrid';
import { KpiEvaluationService, SaveKPIEvaluationRequest } from '../kpi-evaluation-service/kpi-evaluation.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-evaluation-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        AngularSlickgridModule,
    ],
    templateUrl: './kpi-evaluation-detail.component.html',
    styleUrl: './kpi-evaluation-detail.component.css'
})
export class KpiEvaluationDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() departmentId: number = 0;
    @Input() detail: any = null; // Passed from parent for edit mode
    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    evaluationCode: string = '';
    note: string = '';

    // Error selection
    errorIds: number[] = [];

    // SlickGrid for error list
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiEvaluationService: KpiEvaluationService
    ) { }

    ngOnInit(): void {
        this.initGrid();
        this.loadErrors();

        if (this.mode === 'edit' && this.detail) {
            this.loadDetails();
        }
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'IsCheck',
                name: '',
                field: 'IsCheck',
                sortable: false,
                filterable: false,
                minWidth: 40,
                maxWidth: 40,
                cssClass: 'text-center',
                formatter: (_row, _cell, value) => {
                    const checked = value ? 'checked' : '';
                    return `<input type="checkbox" class="error-checkbox" ${checked} />`;
                },
            },
            {
                id: 'ID',
                name: 'ID',
                field: 'ID',
                sortable: true,
                hidden: true,
            },
            {
                id: 'Code',
                name: 'Mã lỗi',
                field: 'Code',
                sortable: true,
                filterable: true,
                minWidth: 120,
            },
            {
                id: 'Name',
                name: 'Tên lỗi',
                field: 'Name',
                sortable: true,
                filterable: true,
                minWidth: 200,
            },
            {
                id: 'Content',
                name: 'Nội dung',
                field: 'Content',
                sortable: true,
                filterable: true,
                minWidth: 200,
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                field: 'Note',
                sortable: true,
                filterable: true,
                minWidth: 150,
            },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.error-grid-container',
                calculateAvailableSizeBy: 'container',
            },
            enableCellNavigation: true,
            enableFiltering: true,
            enableSorting: true,
            rowHeight: 35,
            headerRowHeight: 40,
            autoEdit: false,
            autoCommitEdit: false,
        };
    }

    loadErrors(): void {
        const evalId = this.mode === 'edit' ? this.id : 0;
        this.kpiEvaluationService.getError(evalId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    const data = Array.isArray(response.data) ? response.data : [];
                    this.dataset = data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID ?? index,
                    }));

                    // Initialize errorIds with items that have IsCheck = true
                    this.errorIds = this.dataset
                        .filter((item: any) => item.IsCheck === true)
                        .map((item: any) => item.ID);
                }
            },
            error: (error: any) => {
                console.error('Error loading errors:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải danh sách lỗi');
            }
        });
    }

    loadDetails(): void {
        if (this.detail) {
            this.evaluationCode = this.detail.EvaluationCode || '';
            this.note = this.detail.Note || '';
        }
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    onGridClick(e: any, args: any): void {
        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        const cell = grid.getCellFromEvent(e);
        if (!cell) return;

        const column = this.columnDefinitions[cell.cell];
        if (column?.id !== 'IsCheck') return;

        const dataItem = grid.getDataItem(cell.row);
        if (!dataItem) return;

        const errorId = dataItem.ID;
        const currentChecked = dataItem.IsCheck === true;

        // Toggle check state
        dataItem.IsCheck = !currentChecked;

        if (dataItem.IsCheck) {
            if (!this.errorIds.includes(errorId)) {
                this.errorIds.push(errorId);
            }
        } else {
            const index = this.errorIds.indexOf(errorId);
            if (index > -1) {
                this.errorIds.splice(index, 1);
            }
        }

        // Refresh the grid row
        grid.invalidateRow(cell.row);
        grid.render();
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.evaluationCode || this.evaluationCode.trim() === '') {
            this.errors.evaluationCode = 'Vui lòng nhập mã nội dung';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        const dto: SaveKPIEvaluationRequest = {
            model: {
                ID: this.id,
                EvaluationCode: this.evaluationCode.trim(),
                Note: this.note.trim(),
                DepartmentID: this.departmentId,
                IsDeleted: false,
            },
            departmentId: this.departmentId,
            listErrorIds: this.errorIds,
        };

        this.kpiEvaluationService.saveData(dto).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error: any) => {
                console.error('Error saving KPI evaluation:', error);
                const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
