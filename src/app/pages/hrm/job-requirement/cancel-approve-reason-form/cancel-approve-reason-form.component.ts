import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-cancel-approve-reason-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './cancel-approve-reason-form.component.html',
  styleUrl: './cancel-approve-reason-form.component.css'
})
export class CancelApproveReasonFormComponent implements OnInit {
  formGroup: FormGroup;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.formGroup = this.fb.group({
      reasonCancel: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onConfirm(): void {
    if (this.formGroup.valid) {
      const reasonCancel = this.formGroup.get('reasonCancel')?.value?.trim() || '';
      this.activeModal.close(reasonCancel);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.formGroup.controls).forEach(key => {
        this.formGroup.get(key)?.markAsTouched();
      });
    }
  }
}

