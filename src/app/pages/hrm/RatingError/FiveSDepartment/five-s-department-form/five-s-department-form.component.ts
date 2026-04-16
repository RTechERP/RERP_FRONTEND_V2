import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { RatingErrorService } from '../../rating-error-service/rating-error.service';

@Component({
    standalone: true,
    selector: 'app-five-s-department-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzInputNumberModule,
        NzIconModule,
        NzSpinModule,
        NzGridModule
    ],
    templateUrl: './five-s-department-form.component.html'
})
export class FiveSDepartmentFormComponent implements OnInit {
    @Input() dataInput: any = null;

    form!: FormGroup;
    isEdit = false;
    isLoading = false;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private ratingErrorService: RatingErrorService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initForm();
        if (this.dataInput) {
            this.isEdit = true;
            this.form.patchValue(this.dataInput);
        } else {
            this.isLoading = true;
            this.ratingErrorService.getFiveSDepartmentNextSTT().subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (res?.status === 1) {
                        this.form.patchValue({ STT: res.data });
                    }
                },
                error: (err: any) => {
                    this.isLoading = false;
                    console.error('Error fetching next STT', err);
                }
            });
        }
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            STT: [null, [Validators.required]],
            Code: ['', [Validators.required]],
            Name: ['', [Validators.required]],
            Description: [''],
            IsDeleted: [false],
            CreatedDate: [null],
            CreatedBy: [null],
            UpdatedDate: [null],
            UpdatedBy: [null]
        });
    }

    get title(): string {
        return this.isEdit ? 'Sửa phòng ban chấm điểm 5S' : 'Thêm phòng ban chấm điểm 5S';
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

        this.isLoading = true;
        this.ratingErrorService.saveFiveSDepartment(this.form.value).subscribe({
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
