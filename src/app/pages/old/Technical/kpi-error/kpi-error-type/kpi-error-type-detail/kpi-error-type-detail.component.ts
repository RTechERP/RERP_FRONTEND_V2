import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { KpiErrorTypeService } from '../kpi-error-type-service/kpi-error-type.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';

@Component({
    selector: 'app-kpi-error-type-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzInputNumberModule
    ],
    templateUrl: './kpi-error-type-detail.component.html',
    styleUrl: './kpi-error-type-detail.component.css'
})
export class KpiErrorTypeDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() mode: 'add' | 'edit' = 'add';
    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    code: string = '';
    name: string = '';
    stt: number = 1;

    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiErrorTypeService: KpiErrorTypeService
    ) { }

    ngOnInit(): void {
        if (this.mode === 'edit' && this.id) {
            this.loadData();
        } else {
            this.loadNextSTT();
        }
    }

    loadNextSTT(): void {
        this.kpiErrorTypeService.getSTTKPIErrorType().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.stt = response.data || 1;
                }
            },
            error: (error: any) => {
                console.error('Error loading STT:', error);
            }
        });
    }

    loadData(): void {
        this.kpiErrorTypeService.getKPIErrorTypeById(this.id).subscribe({
            next: (response: any) => {
                if (response?.status === 1 && response.data) {
                    const data = response.data;
                    this.code = data.Code || '';
                    this.name = data.Name || '';
                    this.stt = data.STT || 1;
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI error type:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
            }
        });
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.code || this.code.trim() === '') {
            this.errors.code = 'Vui lòng nhập mã loại lỗi';
            isValid = false;
        }

        if (!this.name || this.name.trim() === '') {
            this.errors.name = 'Vui lòng nhập tên loại lỗi';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        const data = {
            ID: this.id,
            Code: this.code,
            Name: this.name,
            STT: this.stt
        };

        this.kpiErrorTypeService.saveKPIErrorType(data).subscribe({
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
                console.error('Error saving KPI error type:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
