import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BankList } from '../model/bank-list';
import { BankListService } from '../bank-list.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
    selector: 'app-bank-list-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzGridModule,
        NzInputNumberModule
    ],
    templateUrl: './bank-list-detail.component.html',
    styleUrls: ['./bank-list-detail.component.css']
})
export class BankListDetailComponent implements OnInit {
    @Input() data: BankList = new BankList();
    validateForm!: FormGroup;
    isSubmit = false;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private bankListService: BankListService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.validateForm = this.fb.group({
            ID: [this.data.ID || 0],
            STT: [this.data.STT],
            BankName: [this.data.BankName, [Validators.required]],
            IsDeleted: [this.data.IsDeleted || false]
        });
    }

    handleCancel(): void {
        this.activeModal.dismiss();
    }

    handleOk(): void {
        this.isSubmit = true;
        if (this.validateForm.valid) {
            const formValue = this.validateForm.value;
            this.bankListService.saveData(formValue).subscribe({
                next: (res) => {
                    if (res.status === 1 || res.success) {
                        this.notification.success('Thành công', res.message || 'Lưu dữ liệu thành công');
                        this.activeModal.close(true);
                    } else {
                        this.notification.error('Lỗi', res.message || 'Lưu dữ liệu thất bại');
                    }
                    this.isSubmit = false;
                },
                error: (err) => {
                    this.notification.error('Lỗi', err?.error?.message || 'Có lỗi xảy ra');
                    this.isSubmit = false;
                }
            });
        } else {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            this.isSubmit = false;
        }
    }
}
