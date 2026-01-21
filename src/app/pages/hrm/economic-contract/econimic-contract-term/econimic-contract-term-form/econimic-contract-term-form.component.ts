import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { EconomicContractService } from '../../economic-contract-service/economic-contract.service';

@Component({
    standalone: true,
    selector: 'app-econimic-contract-term-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzGridModule,
        NzInputModule,
        NzInputNumberModule,
        NzButtonModule,
    ],
    templateUrl: './econimic-contract-term-form.component.html',
    styleUrl: './econimic-contract-term-form.component.css'
})
export class EconimicContractTermFormComponent implements OnInit {
    formGroup!: FormGroup;
    @Input() dataInput: any;
    @Input() nextSTT: number = 1;
    @Output() closeModal = new EventEmitter<void>();
    @Output() formSubmitted = new EventEmitter<void>();

    public activeModal = inject(NgbActiveModal);

    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private economicContractService: EconomicContractService
    ) {
        this.formGroup = this.fb.group({
            STT: [null],
            TermCode: ['', [Validators.required]],
            TermName: ['', [Validators.required]],
        });
    }

    ngOnInit(): void {
        if (this.dataInput) {
            this.patchForm(this.dataInput);
        } else {
            this.formGroup.patchValue({ STT: this.nextSTT });
        }
    }

    private patchForm(d: any) {
        this.formGroup.patchValue({
            STT: d.STT ?? null,
            TermCode: d.TermCode ?? '',
            TermName: d.TermName ?? '',
        });
    }

    private trimAllStringControls() {
        Object.keys(this.formGroup.controls).forEach(k => {
            const c = this.formGroup.get(k);
            const v = c?.value;
            if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
        });
    }

    blockE(event: KeyboardEvent) {
        if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
            event.preventDefault();
        }
    }

    close() {
        this.closeModal.emit();
        this.activeModal.dismiss('cancel');
    }

    save(isClose: boolean = true) {
        this.trimAllStringControls();

        if (this.formGroup.invalid) {
            Object.values(this.formGroup.controls).forEach(c => {
                c.markAsTouched();
                c.updateValueAndValidity({ onlySelf: true });
            });
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const formValue = this.formGroup.value;
        const payload = {
            ID: this.dataInput?.ID ?? 0,
            STT: formValue.STT,
            TermCode: formValue.TermCode,
            TermName: formValue.TermName,
        };

        this.economicContractService.saveEconomicContractTerm(payload).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu điều khoản hợp đồng thành công');
                    this.formSubmitted.emit();
                    if (isClose) {
                        this.activeModal.close('save');
                    } else {
                        const currentSTT = this.formGroup.get('STT')?.value || this.nextSTT;
                        this.formGroup.reset();
                        this.dataInput = null;
                        this.nextSTT = Number(currentSTT) + 1;
                        this.formGroup.patchValue({ STT: this.nextSTT });
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                const msg = err?.error?.message || err?.message || 'Lỗi khi lưu thông tin';
                this.notification.error(NOTIFICATION_TITLE.error, msg);
                console.error('Lỗi khi lưu:', err);
            }
        });
    }
}
