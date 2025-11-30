import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-update-vehicle-money-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputNumberModule,
    NzButtonModule,
    NzModalModule
  ],
  templateUrl: './update-vehicle-money-form.component.html',
  styleUrl: './update-vehicle-money-form.component.css'
})
export class UpdateVehicleMoneyFormComponent implements OnInit {
  @Input() vehicleMoney: number | null = null;
  @Output() save = new EventEmitter<number>();

  vehicleMoneyForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    this.vehicleMoneyForm = this.fb.group({
      vehicleMoney: [
        this.vehicleMoney || null,
        [Validators.required, this.positiveNumberValidator]
      ]
    });
  }

  // Custom validator cho số tiền phải > 0
  positiveNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return { positiveNumber: true };
    }
    return null;
  };

  // Formatter: hiển thị số với dấu phẩy và đ
  formatter = (value: number): string => {
    if (!value) return '';
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  // Parser: loại bỏ đ và dấu phẩy
  parser = (value: string): number => {
    if (!value) return 0;
    const parsed = value.replace(/[^\d]/g, '');
    return parsed ? Number(parsed) : 0;
  };

  getErrorMessage(): string {
    const control = this.vehicleMoneyForm.get('vehicleMoney');
    if (control?.hasError('required')) {
      return 'Vui lòng nhập số tiền';
    }
    if (control?.hasError('positiveNumber')) {
      return 'Số tiền phải lớn hơn 0';
    }
    return '';
  }

  onSubmit() {
    if (this.vehicleMoneyForm.valid) {
      const value = this.vehicleMoneyForm.get('vehicleMoney')?.value;
      this.save.emit(value);
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.vehicleMoneyForm.controls).forEach(key => {
        this.vehicleMoneyForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}

