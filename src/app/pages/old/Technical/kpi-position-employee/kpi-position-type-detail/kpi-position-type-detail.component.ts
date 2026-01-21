import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { KpiPositionEmployeeService } from '../kpi-position-employee-service/kpi-position-employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-position-type-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzInputNumberModule
    ],
    templateUrl: './kpi-position-type-detail.component.html',
    styleUrl: './kpi-position-type-detail.component.css'
})
export class KpiPositionTypeDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() isEditMode: boolean = false;
    @Input() departmentId: number = 0;
    @Input() kpiSessionId: number = 0;
    @Input() kpiPositionType: any = {};
    @Output() onSaved = new EventEmitter<any>();

    // Model data
    model: any = {};

    // Dropdown data
    projectTypes: any[] = [];

    // Validation errors
    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private service: KpiPositionEmployeeService
    ) { }

    ngOnInit(): void {
        this.initModel();
        this.loadProjectTypes();
    }

    private initModel(): void {
        const currentYear = new Date().getFullYear();
        const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;

        this.model = {
            ID: this.kpiPositionType?.ID || 0,
            TypeCode: this.kpiPositionType?.TypeCode || '',
            TypeName: this.kpiPositionType?.TypeName || '',
            STT: this.kpiPositionType?.STT || 0,
            ProjectTypeID: this.kpiPositionType?.ProjectTypeID || 1,
            YearValue: this.kpiPositionType?.YearValue || currentYear,
            QuaterValue: this.kpiPositionType?.QuaterValue || currentQuarter,
            IsDeleted: false
        };
    }

    private loadProjectTypes(): void {
        this.service.getProjectTypes(this.departmentId, this.kpiSessionId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.projectTypes = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading project types:', error);
            }
        });
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.model.TypeCode || this.model.TypeCode.trim() === '') {
            this.errors.typeCode = 'Vui lòng nhập mã loại';
            isValid = false;
        }

        if (!this.model.TypeName || this.model.TypeName.trim() === '') {
            this.errors.typeName = 'Vui lòng nhập tên loại';
            isValid = false;
        }

        return isValid;
    }

    saveAndClose(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.save(() => {
            this.activeModal.close({ success: true, data: this.model });
        });
    }

    saveAndNew(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.save(() => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công! Tiếp tục thêm mới.');
            // Reset model for new entry
            const currentYear = new Date().getFullYear();
            const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
            this.model = {
                ID: 0,
                TypeCode: '',
                TypeName: '',
                STT: 0,
                ProjectTypeID: 1,
                YearValue: currentYear,
                QuaterValue: currentQuarter,
                IsDeleted: false
            };
            this.errors = {};
        });
    }

    private save(onSuccess: () => void): void {
        const payload = {
            ID: this.model.ID || 0,
            TypeCode: (this.model.TypeCode || '').trim(),
            TypeName: (this.model.TypeName || '').trim(),
            STT: this.model.STT || 0,
            ProjectTypeID: this.model.ProjectTypeID,
            YearValue: this.model.YearValue,
            QuaterValue: this.model.QuaterValue,
            IsDeleted: false
        };

        this.service.saveKPIPositionType(payload).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
                    this.onSaved.emit(response.data);
                    onSuccess();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error: any) => {
                console.error('Error saving:', error);
                const errorMsg = error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
