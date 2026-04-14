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
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { FiveSDepartmentFormComponent } from './five-s-department-form/five-s-department-form.component';

@Component({
    standalone: true,
    selector: 'app-five-s-department',
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
        MenubarModule,
        TableModule,
        TooltipModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-department.component.html',
    styleUrl: './five-s-department.component.css'
})
export class FiveSDepartmentComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];
    isLoading = false;

    dataset: any[] = [];
    selectedRow: any = null;

    constructor(
        private ratingErrorService: RatingErrorService,
        private notification: NzNotificationService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.initMenuBar();
        this.loadData();
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
                    this.loadData();
                },
            }
        ];
    }

    loadData() {
        this.isLoading = true;
        this.selectedRow = null;
        
        this.ratingErrorService.getFiveSDepartments().subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.dataset = res.data || [];
                    this.dataset.sort((a, b) => (a.STT || 0) - (b.STT || 0));
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
        this.selectedRow = event.data;
    }

    onRowUnselect(event: any) {
        this.selectedRow = null;
    }

    onCreate() {
        const modalRef = this.ngbModal.open(FiveSDepartmentFormComponent, { size: 'lg', backdrop: 'static', centered: true });
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
        const modalRef = this.ngbModal.open(FiveSDepartmentFormComponent, { size: 'lg', backdrop: 'static', centered: true });
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
                this.ratingErrorService.deleteFiveSDepartment(this.selectedRow).subscribe({
                    next: (res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                            this.loadData();
                            this.selectedRow = null;
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
