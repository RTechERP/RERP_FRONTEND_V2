import { Component, OnInit, AfterViewInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RulePayService, RulePay } from '../rule-pay.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-rule-pay-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    HasPermissionDirective
  ],
  templateUrl: './rule-pay-detail.component.html',
  styleUrl: './rule-pay-detail.component.css'
})
export class RulePayDetailComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() newRulePay!: RulePay;
  @Input() isCheckmode: boolean = false;

  validateForm!: FormGroup;

  constructor(
    private rulePayService: RulePayService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  private initForm() {
    this.validateForm = this.fb.group({
      Code: ['', [Validators.required]],
      Note: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newRulePay'] && this.validateForm && this.newRulePay) {
      console.log('ngOnChanges - newRulePay changed:', this.newRulePay);
      setTimeout(() => {
        this.validateForm.patchValue({
          Code: this.newRulePay.Code || '',
          Note: this.newRulePay.Note || ''
        }, { emitEvent: false, onlySelf: true });
      }, 0);
    }
  }

  ngAfterViewInit(): void {
    // Patch value sau khi view đã được khởi tạo
    if (this.newRulePay && this.validateForm) {
      setTimeout(() => {
        this.validateForm.patchValue({
          Code: this.newRulePay.Code || '',
          Note: this.newRulePay.Note || ''
        }, { emitEvent: false, onlySelf: true });
        console.log('Form patched with:', this.validateForm.value);
      }, 0);
    }
  }

  add(): void {
    if (this.validateForm.invalid) {
    Object.values(this.validateForm.controls).forEach(c => {
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đủ thông tin bắt buộc');
    return;
  }
    const now = new Date();
    const formData = this.validateForm.value;
    const payload = {
      Data: {
        ID: 0,
        Code: formData.Code,
        Note: formData.Note,
        CreatedBy: '',
        CreatedDate: now,
        UpdatedBy: '',
        UpdatedDate: now,
        IsDelete: false
      }
    };
    this.rulePayService.saveData(payload).subscribe({
      next: (res) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Thêm thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }

  update(): void {
if (this.validateForm.invalid) {
    Object.values(this.validateForm.controls).forEach(c => {
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đủ thông tin bắt buộc');
    return;
  }
    const now = new Date();
    const formData = this.validateForm.value;
    console.log('Form data for update:', formData);
    console.log('Current form values:', this.validateForm.getRawValue());

    if (!this.newRulePay.ID) {
      this.notification.error(NOTIFICATION_TITLE.error,  'Không tìm thấy ID để cập nhật');
      return;
    }
    const payload = {
      Data: {
        ID: this.newRulePay.ID,
        Code: formData.Code,
        Note: formData.Note,
        CreatedBy: this.newRulePay.CreatedBy || '',
        CreatedDate: this.newRulePay.CreatedDate || now,
        UpdatedBy: '',
        UpdatedDate: now,
        IsDelete: false
      }
    };
    console.log('Update payload:', payload);
    this.rulePayService.saveData(payload).subscribe({
      next: (res) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        console.error('Error updating:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi cập nhật dữ liệu!');
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
