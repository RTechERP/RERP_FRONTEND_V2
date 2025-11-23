import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-form.component.html'
})
export class VehicleFormComponent implements OnChanges {
  @Input() vehicleData: any = null;
  @Input() isEditMode: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  vehicleForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleData'] || changes['isEditMode']) {
      this.initForm();
    }
  }

  private initForm(): void {
    this.vehicleForm = this.fb.group({
      VehicleID: [this.vehicleData?.VehicleID || 0],
      VehicleCode: [this.vehicleData?.VehicleCode || '', Validators.required],
      VehicleName: [this.vehicleData?.VehicleName || '', Validators.required],
      Cost: [this.vehicleData?.Cost || 0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.vehicleForm.valid) {
      this.formSubmit.emit(this.vehicleForm.value);
    } else {
      Object.values(this.vehicleForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }
}

