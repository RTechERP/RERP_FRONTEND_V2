import { Component, Input, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { RatingErrorService } from '../../rating-error-service/rating-error.service';

@Component({
    standalone: true,
    selector: 'app-five-s-minus-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzNotificationModule,
        NzButtonModule,
        NzSelectModule,
        NzInputModule,
        NzInputNumberModule,
        NzRadioModule,
        NzGridModule,
        NzFormModule,
        NzSpinModule,
        NzDatePickerModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-minus-form.component.html',
    styleUrl: './five-s-minus-form.component.css'
})
export class FiveSMinusFormComponent implements OnInit {
    @Input() dataInput: any;

    activeModal = inject(NgbActiveModal);
    private fb = inject(FormBuilder);
    private ratingErrorService = inject(RatingErrorService);
    private notification = inject(NzNotificationService);

    form!: FormGroup;
    isLoading = false;

    lstDepartments: any[] = [];
    lstTickets: any[] = [];
    lstErrors: any[] = [];

    ngOnInit(): void {
        this.initForm();
        this.loadCombos();
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            DepartmentID: [null, Validators.required],
            FiveSRatingTicketID: [null, Validators.required],
            FiveSErrorID: [null, Validators.required],
            Point: [0, Validators.required],
            DateMinus: [new Date(), Validators.required],
            Type: [2, Validators.required],
            Note: ['', Validators.required]
        });

        if (this.dataInput) {
            this.form.patchValue({
                ID: this.dataInput.ID,
                DepartmentID: this.dataInput.DepartmentID,
                FiveSRatingTicketID: this.dataInput.FiveSRatingTicketID,
                FiveSErrorID: this.dataInput.FiveSErrorID,
                Point: this.dataInput.Point,
                DateMinus: this.dataInput.DateMinus ? new Date(this.dataInput.DateMinus) : new Date(),
                Type: this.dataInput.Type,
                Note: this.dataInput.Note
            });
            // Disable key fields when editing to avoid changing relation
            this.form.get('DepartmentID')?.disable();
            this.form.get('FiveSRatingTicketID')?.disable();
            this.form.get('FiveSErrorID')?.disable();
        }
    }

    loadCombos() {
        this.ratingErrorService.getFiveSDepartments().subscribe(res => {
            if (res?.status === 1) this.lstDepartments = res.data;
        });

        forkJoin({
            sessions: this.ratingErrorService.getFiveSRatings(),
            tickets: this.ratingErrorService.getFiveSRatingTickets()
        }).subscribe(res => {
            if (res.sessions?.status === 1 && res.tickets?.status === 1) {
                const sessions = res.sessions.data || [];
                const tickets = res.tickets.data || [];

                // Map each ticket to its corresponding session info for display
                this.lstTickets = tickets.map((t: any) => {
                    const sess = sessions.find((s: any) => s.ID === t.Rating5SID);
                    if (!sess) return null;
                    return {
                        ...t,
                        SessionCode: sess?.Code || '',
                        SessionNote: sess?.Note || '',
                        SessionDate: sess?.RatingDate || ''
                    };
                }).filter((t: any) => t !== null);
            }
        });

        this.ratingErrorService.getFiveSErrors().subscribe(res => {
            if (res?.status === 1) this.lstErrors = res.data;
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ các thông tin bắt buộc');
            return;
        }

        const formValue = this.form.getRawValue();
        const payload = {
            DepartmentID: formValue.DepartmentID,
            FiveSRatingTicketID: formValue.FiveSRatingTicketID,
            FiveSErrorID: formValue.FiveSErrorID,
            fiveSBonusMinus: {
                ID: formValue.ID,
                Point: formValue.Point,
                Type: formValue.Type,
                DateMinus: formValue.DateMinus,
                Note: formValue.Note
            }
        };

        this.isLoading = true;
        this.ratingErrorService.saveMinusPoint(payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công');
                    this.activeModal.close('save');
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi lưu dữ liệu');
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

    closeForm() {
        this.activeModal.dismiss();
    }
}
