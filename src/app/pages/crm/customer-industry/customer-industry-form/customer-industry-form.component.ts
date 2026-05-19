import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CustomerIndustryService } from '../customer-industry-service/customer-industry.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-customer-industry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
  ],
  templateUrl: './customer-industry-form.component.html',
  styleUrl: './customer-industry-form.component.css',
})
export class CustomerIndustryFormComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() data: any = null;

  form!: FormGroup;
  isLoading: boolean = false;
  hasSaved: boolean = false; // Flag to track if at least one item was saved

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private customerIndustryService: CustomerIndustryService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      ID: [this.data?.ID || 0],
      IndustriesNameVI: ['', [Validators.required, Validators.maxLength(255)]],
      IndustriesNameEN: ['', [Validators.required, Validators.maxLength(255)]],
      Descriptions: ['', Validators.maxLength(500)],
    });
    if (this.isEditMode && this.data) {
      this.form.patchValue(this.data);
    }
  }

  save(addNew: boolean = false): void {
    this.form.patchValue({
      IndustriesNameVI: (this.form.value.IndustriesNameVI || '').trim(),
      IndustriesNameEN: (this.form.value.IndustriesNameEN || '').trim(),
    });

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isLoading = true;
    const value = this.form.value;

    this.customerIndustryService.saveCustomerIndustry(value).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.hasSaved = true;
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu dữ liệu thành công!',
        );

        if (addNew) {
          // Reset form to add new entry, keeping ProjectTypeID
          this.form.reset({
            ID: 0,
            IndustriesNameVI: '',
            IndustriesNameEN: '',
            Descriptions: '',
          });
          // Reset validation state
          Object.values(this.form.controls).forEach((control) => {
            control.markAsPristine();
            control.markAsUntouched();
          });
        } else {
          this.activeModal.close(true);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg =
          err.error?.message || err.message || 'Lưu dữ liệu thất bại!';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
      },
    });
  }

  close(): void {
    this.activeModal.close(this.hasSaved);
  }
}
