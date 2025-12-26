import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { WorkplanService } from './workplan.service';
import { WorkplanFormComponent } from './workplan-form/workplan-form.component';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-workplan',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModalModule,
        NzGridModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        NzCardModule,
        NzDatePickerModule,
        NzSelectModule,
        NzFormModule,
        NzSpinModule,
        NzModalModule,
    ],
    templateUrl: './workplan.component.html',
    styleUrl: './workplan.component.css',
    standalone: true
})
export class WorkplanComponent implements OnInit, AfterViewInit {
    @ViewChild('workplanTable', { static: false }) workplanTableElement!: ElementRef;

    workplanTable: Tabulator | null = null;
    isLoading: boolean = false;
    dataset: any[] = [];

    // Search params
    dateStart: Date | null = null;
    dateEnd: Date | null = null;
    keyword: string = '';
    selectedWorkPlanId: number = 0;

    constructor(
        private service: WorkplanService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService
    ) {
        // Set default dates: đầu tuần đến cuối tuần hiện tại
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        this.dateEnd = new Date(this.dateStart.getFullYear(), this.dateStart.getMonth(), this.dateStart.getDate() + 6);
    }

    ngOnInit(): void {
        // Data will be loaded after view init
    }

    ngAfterViewInit(): void {
        this.drawTable();
        this.loadData();
    }

    loadData(): void {
        if (!this.dateStart || !this.dateEnd) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
            return;
        }

        this.isLoading = true;
        const params = {
            DateStart: this.dateStart,
            DateEnd: this.dateEnd,
            Keyword: this.keyword || '',
            PageNumber: 1,
            PageSize: 1000
        };

        this.service.getWorkPlans(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    this.dataset = Array.isArray(response.data) ? response.data : [];
                } else {
                    this.dataset = [];
                }
                if (this.workplanTable) {
                    this.workplanTable.setData(this.dataset);
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    onSearch(): void {
        this.loadData();
    }

    resetSearch(): void {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        this.dateEnd = new Date(this.dateStart.getFullYear(), this.dateStart.getMonth(), this.dateStart.getDate() + 6);
        this.keyword = '';
        this.loadData();
    }

    onAddWorkPlan(): void {
        const modalRef = this.modalService.open(WorkplanFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.isEditMode = false;
        modalRef.componentInstance.dataInput = null;

        modalRef.result.then((result) => {
            if (result === true) {
                this.loadData();
            }
        }).catch(() => { });
    }

    onEditWorkPlan(): void {
        if (!this.selectedWorkPlanId || this.selectedWorkPlanId <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa!');
            return;
        }

        const selectedData = this.workplanTable?.getSelectedData() || [];
        if (selectedData.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa!');
            return;
        }

        const modalRef = this.modalService.open(WorkplanFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.isEditMode = true;
        modalRef.componentInstance.dataInput = { ...selectedData[0] };

        modalRef.result.then((result) => {
            if (result === true) {
                this.loadData();
            }
        }).catch(() => { });
    }

    onDeleteWorkPlan(): void {
        if (!this.selectedWorkPlanId || this.selectedWorkPlanId <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để xóa!');
            return;
        }

        // Tìm data của workplan được chọn
        const selectedWorkPlan = this.dataset?.find((item: any) => item.ID === this.selectedWorkPlanId);
        
        if (!selectedWorkPlan) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy kế hoạch đã chọn!');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa kế hoạch này?',
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
          
                const deletePayload = {
                    ...selectedWorkPlan,
                    IsDeleted: true
                };
                
                this.service.saveWorkPlan(deletePayload).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Xóa thành công!');
                            this.selectedWorkPlanId = 0;
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Xóa thất bại!');
                        }
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Xóa thất bại!';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            }
        });
    }
    private drawTable(): void {
        if (this.workplanTable) {
            this.workplanTable.setData(this.dataset || []);
            return;
        }
        // Date formatter
        const dateFormatter = (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        };

        this.workplanTable = new Tabulator(this.workplanTableElement.nativeElement, {
            data: this.dataset || [],
            ...DEFAULT_TABLE_CONFIG,
            paginationMode: 'local',
            height: '88vh',
            layout: 'fitDataStretch',
            selectableRows: 1,
            rowHeader:false,
            columns: [
                {
                    title: '<span style="font-size: 42px; font-weight: bold;">+</span>',
                    formatter: (cell: any) => {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary btn-edit" title="Sửa"><i class="fas fa-pen"></i></button>
                            <button class="btn btn-sm btn-danger btn-delete" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>`;
                    },
                    width: 80,
                    hozAlign: 'center',
                    headerSort: false,
                    frozen: true,
                    headerClick: (e: any, column: any) => {
                        this.onAddWorkPlan();
                    },
                    cellClick: (e: any, cell: any) => {
                        const target = e.target as HTMLElement;
                        const row = cell.getRow();
                        const data = row.getData();
                        this.selectedWorkPlanId = data.ID;

                        if (target.closest('.btn-edit')) {
                            this.onEditWorkPlanRow(data);
                        } else if (target.closest('.btn-delete')) {
                            this.onDeleteWorkPlanRow(data);
                        }
                    }
                },
                {
                    title: 'Ngày bắt đầu',
                    field: 'StartDate',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 120,
                    formatter: dateFormatter,
                },
                {
                    title: 'Ngày kết thúc',
                    field: 'EndDate',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 120,
                    formatter: dateFormatter,
                },
                {
                    title: 'Tổng số ngày',
                    field: 'TotalDay',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 100,
                },
                {
                    title: 'Người phụ trách',
                    field: 'FullName',
                    headerHozAlign: 'center',
                    width: 150,
                    formatter: 'textarea',
                },
                {
                    title: 'Dự án',
                    field: 'Project',
                    headerHozAlign: 'center',
                    width: 200,
                    formatter: 'textarea',
                },
                {
                    title: 'Nơi làm việc',
                    field: 'Location',
                    headerHozAlign: 'center',
                    width: 120,
                    formatter: 'textarea',
                },
                {
                    title: 'Nội dung công việc',
                    field: 'WorkContent',
                    headerHozAlign: 'center',
                    widthGrow: 1,
                    formatter: 'textarea',
                },
            ],
        });

        // Row selection event
        this.workplanTable.on('rowSelected', (row: any) => {
            const data = row.getData();
            this.selectedWorkPlanId = data.ID;
        });

        this.workplanTable.on('rowDeselected', () => {
            this.selectedWorkPlanId = 0;
        });

        // Double click to edit
        this.workplanTable.on('rowDblClick', (e: any, row: any) => {
            const data = row.getData();
            this.selectedWorkPlanId = data.ID;
            this.onEditWorkPlanRow(data);
        });
    }

    private onEditWorkPlanRow(data: any): void {
        const modalRef = this.modalService.open(WorkplanFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.isEditMode = true;
        modalRef.componentInstance.dataInput = { ...data };

        modalRef.result.then((result) => {
            if (result === true) {
                this.loadData();
            }
        }).catch(() => { });
    }

    private onDeleteWorkPlanRow(data: any): void {
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa kế hoạch: "${data.WorkContent?.substring(0, 50)}..."?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Tạo payload với IsDeleted = true
                const deletePayload = {
                    ...data,
                    IsDeleted: true
                };
                
                this.service.saveWorkPlan(deletePayload).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Xóa thành công!');
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Xóa thất bại!');
                        }
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Xóa thất bại!';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            }
        });
    }

}
