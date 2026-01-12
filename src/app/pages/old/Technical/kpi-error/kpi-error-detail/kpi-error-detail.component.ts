import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { KpiErrorService } from '../kpi-error-service/kpi-error.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-error-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzInputNumberModule
    ],
    templateUrl: './kpi-error-detail.component.html',
    styleUrl: './kpi-error-detail.component.css'
})
export class KpiErrorDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() mode: 'add' | 'edit' = 'add';
    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    code: string = '';
    typeId: number = 0;
    quantity: number = 1;
    unit: number = 1;
    monney: number = 0;
    content: string = '';
    note: string = '';
    @Input() departmentId: number = 0;

    // Dropdown data
    errorTypes: any[] = [];
    departments: any[] = [];
    unitOptions: { value: number, label: string }[] = [
        { value: 1, label: 'Lần' },
        { value: 2, label: 'Lần / tháng' },
        { value: 3, label: 'Tuần / tháng' }
    ];

    // Number formatter/parser
    formatterNumber = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    parserNumber = (value: string): number => parseInt(value.replace(/,/g, ''), 10) || 0;

    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiErrorService: KpiErrorService
    ) { }

    ngOnInit(): void {
        this.loadErrorTypes();
        this.loadDepartments();

        if (this.mode === 'edit' && this.id) {
            this.loadData();
        }
    }

    loadErrorTypes(): void {
        this.kpiErrorService.getKPIErrorType().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.errorTypes = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading error types:', error);
            }
        });
    }

    loadDepartments(): void {
        this.kpiErrorService.getDepartment().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.departments = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    loadData(): void {
        this.kpiErrorService.getKPIErrorById(this.id).subscribe({
            next: (response: any) => {
                if (response?.status === 1 && response.data) {
                    const data = response.data;
                    this.code = data.Code || '';
                    this.typeId = data.KPIErrorTypeID || 0;
                    this.quantity = data.Quantity || 1;
                    this.unit = data.Unit || 1;
                    this.monney = data.Monney || 0;
                    this.content = data.Content || '';
                    this.note = data.Note || '';
                    this.departmentId = data.DepartmentID || 0;
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI error:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
            }
        });
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.code || this.code.trim() === '') {
            this.errors.code = 'Vui lòng nhập mã lỗi vi phạm';
            isValid = false;
        }

        if (!this.typeId || this.typeId === 0) {
            this.errors.typeId = 'Vui lòng chọn loại vi phạm';
            isValid = false;
        }

        if (!this.content || this.content.trim() === '') {
            this.errors.content = 'Vui lòng nhập nội dung lỗi vi phạm';
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
            KPIErrorTypeID: this.typeId,
            Quantity: this.quantity,
            Unit: this.unit,
            Monney: this.monney,
            Content: this.content,
            Note: this.note,
            DepartmentID: this.departmentId
        };

        this.kpiErrorService.saveKPIError(data).subscribe({
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
                console.error('Error saving KPI error:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
