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
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { FiveSMinusFormComponent } from './five-s-minus-form/five-s-minus-form.component';

@Component({
    standalone: true,
    selector: 'app-five-s-minus',
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
        NzGridModule,
        NzFormModule,
        NzInputModule,
        Menubar,
        TableModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-minus.component.html',
    styleUrl: './five-s-minus.component.css'
})
export class FiveSMinusComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];
    isLoading = false;

    // p-table
    dataset: any[] = [];
    filteredData: any[] = [];
    keyword = '';
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
                label: 'Refresh',
                icon: 'fa-solid fa-rotate fa-lg text-primary',
                command: () => this.loadData(),
            }
        ];
    }

    loadData() {
        this.isLoading = true;
        this.ratingErrorService.getMinusPoints(0, 0).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.dataset = res.data || [];
                    this.selectedRow = null;
                    this.onSearch();
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

    onSearch(): void {
        if (!this.keyword) {
            this.filteredData = [...this.dataset];
        } else {
            const searchKey = this.keyword.toLowerCase();
            this.filteredData = this.dataset.filter(x =>
                (x.DepartmentName?.toLowerCase().includes(searchKey)) ||
                (x.TicketName?.toLowerCase().includes(searchKey)) ||
                (x.ErrorName?.toLowerCase().includes(searchKey)) ||
                (x.Note?.toLowerCase().includes(searchKey))
            );
        }
    }

    onCreate() {
        const modalRef = this.ngbModal.open(FiveSMinusFormComponent, { size: 'lg', backdrop: 'static', centered: true });
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
        const modalRef = this.ngbModal.open(FiveSMinusFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = this.selectedRow;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }
}
