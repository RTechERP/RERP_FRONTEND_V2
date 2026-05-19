import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { RatingErrorService } from '../../rating-error-service/rating-error.service';

@Component({
    standalone: true,
    selector: 'app-five-s-rating-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzButtonModule,
        NzIconModule,
        NzDatePickerModule,
        NzSpinModule,
        NzGridModule
    ],
    templateUrl: './five-s-rating-form.component.html'
})
export class FiveSRatingFormComponent implements OnInit {
    @Input() dataInput: any = null;

    form!: FormGroup;
    isEdit = false;
    isLoading = false;

    years: number[] = [];
    months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private ratingErrorService: RatingErrorService,
        private notification: NzNotificationService
    ) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            this.years.push(i);
        }
    }

    ngOnInit(): void {
        this.initForm();
        if (this.dataInput) {
            this.isEdit = true;
            this.form.patchValue(this.dataInput);
        }
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            YearValue: [new Date().getFullYear(), [Validators.required]],
            MonthValue: [new Date().getMonth() + 1, [Validators.required]],
            RatingDate: [new Date(), [Validators.required]],

            // Standard Tracking fields
            IsDeleted: [false],
            CreatedDate: [null],
            CreatedBy: [null],
            UpdatedDate: [null],
            UpdatedBy: [null],
            Note: [null]
        });
    }

    get title(): string {
        return this.isEdit ? 'Cập nhật đánh giá 5S' : 'Thêm mới đánh giá 5S';
    }

    onSubmit() {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const payload = this.form.value;

        this.isLoading = true;
        this.ratingErrorService.saveFiveSRating(payload).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                    this.activeModal.close('save');
                } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
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

    onCancel() {
        this.activeModal.dismiss('cancel');
    }
}
