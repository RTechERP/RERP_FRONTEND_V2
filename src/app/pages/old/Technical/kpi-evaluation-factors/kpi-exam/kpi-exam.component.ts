import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO Modules
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';

// Angular SlickGrid
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Formatters,
    GridOption,
    Grouping,
    GroupTotalFormatters,
} from 'angular-slickgrid';

// Service
import { KpiExamService, KPIExam, SaveDataRequest, PositionItem } from '../kpi-exam-service/kpi-exam.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-exam',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzCheckboxModule,
        NzDatePickerModule,
        NzSpinModule,
        NzIconModule,
        AngularSlickgridModule,
    ],
    templateUrl: './kpi-exam.component.html',
    styleUrl: './kpi-exam.component.css',
    encapsulation: ViewEncapsulation.None
})
export class KpiExamComponent implements OnInit {
    // Input properties
    @Input() kpiSessionId: number = 0;
    @Input() kpiExam: KPIExam | null = null;
    @Input() sessions: any[] = [];

    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    selectedSessionId: number = 0;
    examCode: string = '';
    examName: string = '';
    deadline: Date = new Date();
    isActive: boolean = false;

    // Grid
    gridId = 'gridPosition';
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: PositionItem[] = [];
    selectedPositionIds: number[] = [];

    // State
    isLoading = false;
    isLoadingGrid = false;
    errors: any = {};

    // Mode
    isEditMode = false;
    examId = 0;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiExamService: KpiExamService
    ) { }

    ngOnInit(): void {
        this.initGrid();

        // Set edit mode if kpiExam is provided
        if (this.kpiExam && this.kpiExam.ID > 0) {
            this.isEditMode = true;
            this.examId = this.kpiExam.ID;
            this.loadExamData();
        } else {
            this.selectedSessionId = this.kpiSessionId;
        }

        this.loadPositions();
    }

    loadExamData(): void {
        if (this.kpiExam) {
            this.selectedSessionId = this.kpiExam.KPISessionID;
            this.examCode = this.kpiExam.ExamCode || '';
            this.examName = this.kpiExam.ExamName || '';
            this.deadline = this.kpiExam.Deadline ? new Date(this.kpiExam.Deadline) : new Date();
            this.isActive = this.kpiExam.IsActive ?? true;
        }
    }

    loadPositions(): void {
        this.isLoadingGrid = true;
        const examId = this.examId || 0;
        const sessionId = this.selectedSessionId || this.kpiSessionId;

        this.kpiExamService.getDataPosition(examId, sessionId).subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    const data = response.data || [];
                    this.dataset = data.map((item: any, idx: number) => ({
                        ...item,
                        id: item.ID,
                        IsCheck: item.IsCheck ?? false,
                    }));

                    // Collect initially checked position IDs
                    this.selectedPositionIds = this.dataset
                        .filter((item: PositionItem) => item.IsCheck)
                        .map((item: PositionItem) => item.ID);

                    // Apply grouping after data loads
                    setTimeout(() => this.applyGrouping(), 100);
                }
                this.isLoadingGrid = false;
            },
            error: (err) => {
                this.isLoadingGrid = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách vị trí');
            }
        });
    }

    //#region Grid Setup
    initGrid(): void {
        this.columnDefinitions = [
            { id: 'PositionCode', name: 'Mã vị trí', field: 'PositionCode', width: 150, sortable: true, filterable: true },
            { id: 'PositionName', name: 'Tên vị trí', field: 'PositionName', width: 300, sortable: true, filterable: true },
            { id: 'TypePositionName', name: 'Chức vụ', field: 'TypePositionName', width: 150, sortable: true, filterable: true },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-position',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            gridHeight: 300,
            forceFitColumns: true,
            enableCellNavigation: true,
            enableFiltering: true,
            enableGrouping: true,
            enableCheckboxSelector: true,
            enableRowSelection: true,
            multiSelect: true,
            rowSelectionOptions: { selectActiveRow: false },
            checkboxSelector: {
                hideSelectAllCheckbox: false,
            },
        };
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
        this.applyGrouping();

        // Subscribe to row selection change
        this.angularGrid.slickGrid?.onSelectedRowsChanged.subscribe((e: any, args: any) => {
            const selectedRows = args.rows || [];
            this.selectedPositionIds = selectedRows.map((rowIdx: number) => {
                const item = this.angularGrid.dataView?.getItem(rowIdx);
                return item?.ID;
            }).filter((id: number) => id !== undefined);
        });

        // Pre-select rows that were already checked (for edit mode)
        setTimeout(() => {
            if (this.dataset.length > 0) {
                const rowsToSelect: number[] = [];
                this.dataset.forEach((item, index) => {
                    if (item.IsCheck) {
                        const rowIdx = this.angularGrid.dataView?.getRowById(item.ID);
                        if (rowIdx !== undefined && rowIdx >= 0) {
                            rowsToSelect.push(rowIdx);
                        }
                    }
                });
                if (rowsToSelect.length > 0) {
                    this.angularGrid.slickGrid?.setSelectedRows(rowsToSelect);
                }
            }
        }, 300);
    }

    applyGrouping(): void {
        if (this.angularGrid?.dataView) {
            const grouping: Grouping = {
                getter: 'TypePositionName',
                formatter: (g: any) => `Chức vụ: <strong>${g.value}</strong> (${g.count} vị trí)`,
                aggregators: [],
                collapsed: false,
                lazyTotalsCalculation: true,
            };
            this.angularGrid.dataView.setGrouping(grouping);
        }
    }
    //#endregion

    //#region Validation
    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.selectedSessionId || this.selectedSessionId <= 0) {
            this.errors.sessionId = 'Vui lòng chọn kỳ đánh giá';
            isValid = false;
        }

        if (!this.examCode || this.examCode.trim() === '') {
            this.errors.examCode = 'Mã bài đánh giá không được để trống';
            isValid = false;
        }

        if (!this.examName || this.examName.trim() === '') {
            this.errors.examName = 'Tên bài đánh giá không được để trống';
            isValid = false;
        }

        if (!this.deadline) {
            this.errors.deadline = 'Vui lòng chọn hạn làm bài';
            isValid = false;
        }

        if (this.selectedPositionIds.length <= 0) {
            this.errors.positions = 'Vui lòng chọn ít nhất 1 vị trí';
            isValid = false;
        }

        return isValid;
    }
    //#endregion

    //#region Save Actions
    saveAndClose(): void {
        if (this.save()) {
            // Will close after successful save
        }
    }

    saveAndNew(): void {
        if (this.save(true)) {
            // Will reset form after successful save
        }
    }

    save(resetAfterSave: boolean = false): boolean {
        if (!this.validate()) {
            const firstError = Object.values(this.errors)[0];
            this.notification.warning(NOTIFICATION_TITLE.warning, firstError as string);
            return false;
        }

        this.isLoading = true;

        const kpiExam: KPIExam = {
            ID: this.examId,
            KPISessionID: this.selectedSessionId,
            ExamCode: this.examCode.trim(),
            ExamName: this.examName.trim(),
            Deadline: this.deadline,
            IsActive: this.isActive,
        };

        const dto: SaveDataRequest = {
            KPIExam: kpiExam,
            positionIds: this.selectedPositionIds,
        };

        this.kpiExamService.saveData(dto).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');

                    if (resetAfterSave) {
                        // Reset form for adding new
                        this.examId = 0;
                        this.examCode = '';
                        this.examName = '';
                        this.isActive = false;
                        this.selectedPositionIds = [];
                        this.dataset = this.dataset.map(item => ({ ...item, IsCheck: false }));
                        this.angularGrid?.slickGrid?.invalidate();
                        this.angularGrid?.slickGrid?.render();
                    } else {
                        this.onSaved.emit(response.data);
                        this.activeModal.close(response.data);
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isLoading = false;
                const errorMessage = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });

        return true;
    }
    //#endregion

    cancel(): void {
        this.activeModal.dismiss();
    }
}
