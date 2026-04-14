import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { RatingErrorService } from '../../rating-error-service/rating-error.service';

@Component({
    standalone: true,
    selector: 'app-five-s-rule-error-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzInputNumberModule,
        NzSelectModule,
        NzIconModule
    ],
    templateUrl: './five-s-rule-error-form.component.html'
})
export class FiveSRuleErrorFormComponent implements OnInit {
    @Input() dataInput: any = null;

    form!: FormGroup;
    isEdit = false;
    isLoading = false;

    typePointOptions = [
        { label: 'Điểm cộng', value: 1 },
        { label: 'Điểm trừ', value: 2 }
    ];

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
        }
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            Name: ['', [Validators.required]],
            TypePoint: [null, [Validators.required]],
            Point: [null],
            Note: [''],
            Description: [''],
            IsDeleted: [false],
            CreatedDate: [null],
            CreatedBy: [null],
            UpdatedDate: [null],
            UpdatedBy: [null]
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            return;
        }

        this.isLoading = true;
        this.ratingErrorService.saveFiveSRuleError(this.form.value).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                    this.activeModal.close('save');
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
                }
            },
            error: () => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ');
            }
        });
    }

    onCancel() {
        this.activeModal.dismiss('cancel');
    }
}
