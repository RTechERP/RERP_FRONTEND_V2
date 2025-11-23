import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './type-form.component.html'
})
export class TypeFormComponent implements OnChanges {
  @Input() typeData: any = null;
  @Input() isEditMode: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  typeForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['typeData'] || changes['isEditMode']) {
      this.initForm();
    }
  }

  private initForm(): void {
    this.typeForm = this.fb.group({
      TypeID: [this.typeData?.TypeID || 0],
      TypeCode: [this.typeData?.TypeCode || '', Validators.required],
      TypeName: [this.typeData?.TypeName || '', Validators.required],
      Cost: [this.typeData?.Cost || 0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.typeForm.valid) {
      this.formSubmit.emit(this.typeForm.value);
    } else {
      Object.values(this.typeForm.controls).forEach(control => {
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

