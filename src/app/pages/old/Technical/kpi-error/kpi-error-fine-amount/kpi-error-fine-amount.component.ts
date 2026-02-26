import { Component, OnInit, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Editors,
    Formatters,
    GridOption,
} from 'angular-slickgrid';
import { KpiErrorFineAmountService } from './kpi-error-fine-amount-service/kpi-error-fine-amount.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

interface KpiErrorGroup {
    typeName: string;
    errors: any[];
}

@Component({
    selector: 'app-kpi-error-fine-amount',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzSelectModule,
        AngularSlickgridModule
    ],
    templateUrl: './kpi-error-fine-amount.component.html',
    styleUrl: './kpi-error-fine-amount.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiErrorFineAmountComponent implements OnInit {
    // SlickGrid properties
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // KPI Error dropdown
    kpiErrors: any[] = [];
    kpiErrorGroups: KpiErrorGroup[] = [];
    selectedKpiErrorId: number = 0;

    // Input from parent
    @Input() kpiErrorId: number = 0;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiErrorFineAmountService: KpiErrorFineAmountService
    ) { }

    ngOnInit(): void {
        this.initGrid();
        this.loadKPIErrors();
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'ID',
                name: 'ID',
                field: 'ID',
                hidden: true,
            },
            {
                id: 'QuantityError',
                name: 'Số lần phạm lỗi',
                field: 'QuantityError',
                sortable: false,
                minWidth: 50,
                maxWidth: 100,
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'TotalMoneyError',
                name: 'Số tiền phạt',
                field: 'TotalMoneyError',
                sortable: false,
                minWidth: 100,
                editor: {
                    model: Editors['integer'],
                },
                formatter: Formatters.decimal,
                params: { minDecimal: 0, maxDecimal: 0, thousandSeparator: ',' },
                cssClass: 'text-end',
                headerCssClass: 'text-end',
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                field: 'Note',
                sortable: false,
                minWidth: 100,
                editor: {
                    model: Editors['text'],
                },
            },
        ];

        this.gridOptions = {
            autoResize: {
                container: '#grid-container',
                calculateAvailableSizeBy: 'container',
            },
            enableAutoResize: true,
            gridWidth: '100%',
            forceFitColumns: true,
            // autoFitColumnsOnFirstLoad: false,
            // enableAutoSizeColumns: false,
            enableCellNavigation: true,
            enableColumnReorder: false,
            enableSorting: false,
            editable: true,
            autoEdit: true,
            rowHeight: 35,
            headerRowHeight: 40,
            autoCommitEdit: true,
        };
    }

    loadKPIErrors(): void {
        this.kpiErrorFineAmountService.getKPIError().subscribe({
            next: (response: any) => {
                if (response?.status === 1 && response.data) {
                    this.kpiErrors = response.data;
                    this.groupKpiErrors();

                    //tự chọn kpierror nếu input > 0
                    if (this.kpiErrorId > 0) {
                        this.selectedKpiErrorId = this.kpiErrorId;
                        this.loadFineAmountData(this.kpiErrorId);
                    }
                }
                else {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu');
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI errors:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách lỗi');
            }
        });
    }

    groupKpiErrors(): void {
        const groupMap = new Map<string, any[]>();

        this.kpiErrors.forEach(error => {
            const typeName = error.TypeName || 'Khác';
            if (!groupMap.has(typeName)) {
                groupMap.set(typeName, []);
            }
            groupMap.get(typeName)!.push(error);
        });

        this.kpiErrorGroups = Array.from(groupMap.entries()).map(([typeName, errors]) => ({
            typeName,
            errors
        }));
    }

    onKpiErrorChange(kpiErrorId: number): void {
        if (!kpiErrorId) {
            this.dataset = [];
            return;
        }

        this.loadFineAmountData(kpiErrorId);
    }

    loadFineAmountData(kpiErrorId: number): void {
        this.kpiErrorFineAmountService.getKPIErrorFineAmount(kpiErrorId).subscribe({
            next: (response: any) => {
                if (response?.status === 1 && response.data) {
                    this.dataset = response.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index + 1,
                    }));
                } else {
                    this.dataset = [];
                }
            },
            error: (error: any) => {
                console.error('Error loading fine amount data:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu đánh giá lỗi');
            }
        });
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    save(): void {
        if (!this.selectedKpiErrorId) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một lỗi để lưu');
            return;
        }

        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu');
            return;
        }

        // Get the current data from the grid
        const dataToSave = this.dataset.map(item => ({
            ID: item.ID,
            KPIErrorID: this.selectedKpiErrorId,
            QuantityError: item.QuantityError,
            TotalMoneyError: item.TotalMoneyError || 0,
            Note: item.Note || ''
        }));

        this.kpiErrorFineAmountService.saveKPIErrorFineAmount(dataToSave).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.activeModal.close();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error: any) => {
                console.error('Error saving fine amount data:', error);
                const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.close();
    }
}
