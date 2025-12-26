import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WorkplanService } from '../workplan.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { WorkPlan } from '../WorkPlan';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
    selector: 'app-workplan-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzGridModule,
        NzDatePickerModule,
        NzRadioModule,
    ],
    templateUrl: './workplan-form.component.html',
    styleUrl: './workplan-form.component.css'
})
export class WorkplanFormComponent implements OnInit {
    @Input() isEditMode: boolean = false;
    @Input() dataInput: any = null;

    formGroup!: FormGroup;
    projects: any[] = [];
    locationType: number = 1; // 1: VP RTC, 0: Địa điểm khác

    constructor(
        private fb: FormBuilder,
        public activeModal: NgbActiveModal,
        private workplanService: WorkplanService,
        private projectService: ProjectService,
        private notification: NzNotificationService,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadProjects();

        if (this.isEditMode && this.dataInput) {
            this.loadDataToForm();
        }
    }

    initForm(): void {
        const today = new Date();
        this.formGroup = this.fb.group({
            ID: [0],
            StartDate: [today, [Validators.required]],
            EndDate: [today, [Validators.required]],
            TotalDay: [{ value: 1, disabled: true }],
            ProjectID: [0],
            Location: ['VP RTC', [Validators.required]],
            WorkContent: ['', [Validators.required]]
        });
    }

    loadProjects(): void {
        this.projectService.getProjectModal().subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    this.projects = Array.isArray(response.data) ? response.data : [];
                }
            },
            error: (error: any) => {
                console.error('Error loading projects:', error);
            }
        });
    }

    loadDataToForm(): void {
        if (!this.dataInput) return;

        const startDate = this.dataInput.StartDate
            ? new Date(this.dataInput.StartDate)
            : new Date();

        const endDate = this.dataInput.EndDate
            ? new Date(this.dataInput.EndDate)
            : new Date();

        // Xác định loại địa điểm
        const location = this.dataInput.Location || 'VP RTC';
        this.locationType = location === 'VP RTC' || location === '1' ? 1 : 0;

        this.formGroup.patchValue({
            ID: this.dataInput.ID || 0,
            StartDate: startDate,
            EndDate: endDate,
            TotalDay: this.dataInput.TotalDay || 1,
            ProjectID: this.dataInput.ProjectID || 0,
            Location: this.locationType === 1 ? 'VP RTC' : location,
            WorkContent: this.dataInput.WorkContent || ''
        });

        this.calculateTotalDays();
    }

    onDateChange(): void {
        this.calculateTotalDays();
    }

    calculateTotalDays(): void {
        const startDate = this.formGroup.get('StartDate')?.value;
        const endDate = this.formGroup.get('EndDate')?.value;

        if (startDate && endDate) {
            const start = DateTime.fromJSDate(new Date(startDate));
            const end = DateTime.fromJSDate(new Date(endDate));

            if (start.isValid && end.isValid) {
                const diff = end.diff(start, 'days').days + 1;
                this.formGroup.patchValue({ TotalDay: Math.max(1, Math.round(diff)) });
            }
        }
    }

    onLocationTypeChange(value: number): void {
        this.locationType = value;
        if (value === 1) {
            this.formGroup.patchValue({ Location: 'VP RTC' });
        } else {
            this.formGroup.patchValue({ Location: '' });
        }
    }

    closeModal(): void {
        this.activeModal.dismiss();
    }

    saveData(): void {
        // Validate form
        if (this.formGroup.invalid) {
            Object.values(this.formGroup.controls).forEach(control => {
                control.markAsDirty();
                control.updateValueAndValidity({ onlySelf: true });
            });
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        // Validate ngày
        const startDate = this.formGroup.get('StartDate')?.value;
        const endDate = this.formGroup.get('EndDate')?.value;

        if (startDate > endDate) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!');
            return;
        }

        const formValue = this.formGroup.getRawValue();

        const payload: WorkPlan = {
            ID: formValue.ID || 0,
            UserID: 0,
            StartDate: new Date(formValue.StartDate),
            EndDate: new Date(formValue.EndDate),
            TotalDay: formValue.TotalDay,
            ProjectID: formValue.ProjectID || 0,
            Location: formValue.Location,
            WorkContent: formValue.WorkContent,
            STT: 0,
            FullName: '',
            ProjectCode: '',
            ProjectName: '',
            RowNumber: 0,
            Project: ''
        };

        const loadingMsg = this.message.loading('Đang lưu dữ liệu...', { nzDuration: 0 }).messageId;

        this.workplanService.saveWorkPlan(payload).subscribe({
            next: (response: any) => {
                this.message.remove(loadingMsg);
                if (response && response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu kế hoạch thành công!');
                    this.activeModal.close(true);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu dữ liệu thất bại!');
                }
            },
            error: (error: any) => {
                this.message.remove(loadingMsg);
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }
}
