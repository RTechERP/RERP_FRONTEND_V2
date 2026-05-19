import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TableModule } from 'primeng/table';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { RatingErrorService } from '../../rating-error-service/rating-error.service';

@Component({
    standalone: true,
    selector: 'app-five-s-error-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzButtonModule,
        NzInputNumberModule,
        NzIconModule,
        NzCheckboxModule,
        NzSpinModule,
        NzGridModule,
        TableModule
    ],
    templateUrl: './five-s-error-form.component.html'
})
export class FiveSErrorFormComponent implements OnInit {
    @Input() dataInput: any = null;

    form!: FormGroup;
    isEdit = false;
    isLoading = false;

    ruleErrorOptions: any[] = [];
    typeErrorOptions = [
        { value: 1, label: 'S1 - Seiri' },
        { value: 2, label: 'S2 - Seiton' },
        { value: 3, label: 'S3 - Seiso' },
        { value: 4, label: 'S4 - Seiketsu' },
        { value: 5, label: 'S5 - Shitsuke' }
    ];

    ratingLevels = [
        { label: 'Kém', value: 'Kém', checked: true, description: '', point: 1, typePoint: 2, bonusPoint: 0, minusPoint: 1 },

        { label: 'Tốt', value: 'Tốt', checked: true, description: '', point: 0, typePoint: 2, bonusPoint: 0, minusPoint: 0 },
        { label: 'Rất tốt', value: 'Rất tốt', checked: true, description: '', point: 2, typePoint: 1, bonusPoint: 2, minusPoint: 0 },

    ];

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private ratingErrorService: RatingErrorService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadRuleErrors();
        if (this.dataInput) {
            this.isEdit = true;
            this.form.patchValue(this.dataInput);
            // Load rules (detail) theo FiveSErrorID
            this.loadRulesByErrorId(this.dataInput.ID);
        }
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            STT: [null],
            TypeError: [null, [Validators.required]],
            DetailError: ['', [Validators.required]],
            IsDeleted: [false],
            CreatedDate: [null],
            CreatedBy: [null],
            UpdatedDate: [null],
            UpdatedBy: [null]
        });

        // Bắt sự kiện thay đổi Loại lỗi để lấy STT tiếp theo
        this.form.get('TypeError')?.valueChanges.subscribe(typeError => {
            if (typeError) {
                this.onTypeErrorChange(typeError);
            }
        });
    }

    onTypeErrorChange(typeError: number) {
        // Chỉ tự động lấy STT nếu là thêm mới hoặc STT đang trống
        if (!this.isEdit || !this.form.get('STT')?.value) {
            this.ratingErrorService.getNextSTT(typeError).subscribe({
                next: (res: any) => {
                    if (res?.status === 1) {
                        this.form.patchValue({ STT: res.data });
                    }
                },
                error: (err: any) => {
                    console.error('Lỗi lấy STT tiếp theo:', err);
                }
            });
        }
    }

    get title(): string {
        return this.isEdit ? 'Cập nhật lỗi 5S' : 'Thêm mới lỗi 5S';
    }

    loadRuleErrors() {
        this.ratingErrorService.getFiveSRuleErrors().subscribe({
            next: (res: any) => {
                if (res?.status === 1) {
                    this.ruleErrorOptions = res.data || [];
                }
            },
            error: (err: any) => {
                console.error('Lỗi tải danh sách quy tắc:', err);
            }
        });
    }

    loadRulesByErrorId(errorId: number) {
        this.ratingErrorService.getRulesByErrorId(errorId).subscribe({
            next: (res: any) => {
                if (res?.status === 1 && res.data) {
                    const rules = res.data as any[];
                    this.ratingLevels.forEach(level => {
                        const rule = rules.find((r: any) => r.RatingLevels === level.value);
                        if (rule) {
                            level.checked = true;
                            level.description = rule.Description || '';
                        } else {
                            level.checked = false;
                            level.description = '';
                        }
                    });
                }
            },
            error: (err: any) => {
                console.error('Lỗi tải chi tiết quy tắc:', err);
            }
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
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const ratingLevelDetails = this.ratingLevels
            .filter(l => l.checked)
            .map(l => ({
                RatingLevels: l.value,
                Description: l.description,
                Point: l.point,
                TypePoint: l.typePoint,
                BonusPoint: l.bonusPoint,
                MinusPoint: l.minusPoint
            }));

        // Gửi DTO: FiveSError + RatingLevels tách biệt
        const payload = {
            FiveSError: this.form.value,
            FiveSRuleErrors: ratingLevelDetails
        };

        this.isLoading = true;
        this.ratingErrorService.saveFiveSError(payload).subscribe({
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
