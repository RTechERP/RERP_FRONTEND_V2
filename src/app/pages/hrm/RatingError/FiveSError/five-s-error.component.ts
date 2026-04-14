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
import { NzSplitterModule } from 'ng-zorro-antd/splitter';

import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { FiveSErrorFormComponent } from './five-s-error-form/five-s-error-form.component';

@Component({
    standalone: true,
    selector: 'app-five-s-error',
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
        NzSplitterModule,

        MenubarModule,
        TableModule,
        TooltipModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-error.component.html',
    styleUrl: './five-s-error.component.css'
})
export class FiveSErrorComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];
    isLoading = false;

    dataset: any[] = [];
    selectedRow: any = null;

    datasetDetail: any[] = [];
    detailTabTitle: string = 'Chi tiết mức độ đánh giá:';

    typeErrorOptions = [
        { value: 1, label: 'S1 - Seiri' },
        { value: 2, label: 'S2 - Seiton' },
        { value: 3, label: 'S3 - Seiso' },
        { value: 4, label: 'S4 - Seiketsu' },
        { value: 5, label: 'S5 - Shitsuke' }
    ];

    constructor(
        private ratingErrorService: RatingErrorService,
        private notification: NzNotificationService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.initMenuBar();
        this.loadData();
    }

    getTypeErrorName(value: any): string {
        return this.typeErrorOptions.find(opt => Number(opt.value) === Number(value))?.label || String(value || '');
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return '';
        }
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
                command: () => {
                    this.selectedRow = null;
                    this.datasetDetail = [];
                    this.detailTabTitle = 'Chi tiết mức độ đánh giá:';
                    this.loadData();
                },
            }
        ];
    }

    loadData() {
        this.isLoading = true;
        this.selectedRow = null;
        this.datasetDetail = [];
        this.detailTabTitle = 'Chi tiết mức độ đánh giá:';
        
        this.ratingErrorService.getFiveSErrors().subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.dataset = res.data || [];
                    this.dataset.sort((a, b) => (a.TypeError || 0) - (b.TypeError || 0));
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

    onRowSelect(event: any) {
        const item = event.data;
        if (!item || !item['ID']) return;

        this.selectedRow = item;
        this.detailTabTitle = `Chi tiết mức độ đánh giá: ${item['DetailError'] || ''}`;
        const errorId = item['ID'];
        this.ratingErrorService.getRulesByErrorId(errorId).subscribe({
            next: (res: any) => {
                if (res?.status === 1) {
                    this.datasetDetail = (res.data || []).map((rule: any, index: number) => ({
                        ...rule,
                        id: rule.ID || index
                    }));
                } else {
                    this.datasetDetail = [];
                }
            },
            error: (err: any) => {
                console.error('Lỗi khi lấy chi tiết mức độ đánh giá:', err);
                this.datasetDetail = [];
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    onRowUnselect(event: any) {
        this.selectedRow = null;
        this.datasetDetail = [];
        this.detailTabTitle = 'Chi tiết mức độ đánh giá:';
    }

    onCreate() {
        const modalRef = this.ngbModal.open(FiveSErrorFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = null;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onEdit() {
        if (!this.selectedRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 bản ghi để sửa');
            return;
        }
        const modalRef = this.ngbModal.open(FiveSErrorFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = this.selectedRow;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onDelete() {
        if (!this.selectedRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 bản ghi để xóa');
            return;
        }
        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa bản ghi đã chọn không?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.ratingErrorService.deleteFiveSError(this.selectedRow).subscribe({
                    next: (res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                            this.loadData();
                            this.selectedRow = null;
                            this.datasetDetail = [];
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
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
            }
        });
    }
}
