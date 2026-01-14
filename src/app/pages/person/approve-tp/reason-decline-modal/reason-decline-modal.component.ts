import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-reason-decline-modal',
  templateUrl: './reason-decline-modal.component.html',
  styleUrls: ['./reason-decline-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule
  ]
})
export class ReasonDeclineModalComponent implements OnInit {
  reasonForm!: FormGroup;
  selectedRows: any[] = [];
  modalTitle: string = 'Lý do không duyệt';
  labelText: string = 'Lý do không duyệt';
  placeholderText: string = 'Nhập lý do không duyệt...';

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.reasonForm = this.fb.group({
      reasonDecline: ['', [Validators.required]]
    });
  }


  handleOk(): void {
    if (this.reasonForm.valid) {
      const reason = this.reasonForm.get('reasonDecline')?.value.trim();
      this.modal.destroy({ reason, confirmed: true });
    } else {
      // Mark all fields as dirty to show validation errors
      Object.values(this.reasonForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
    }
  }
  
  onCancel(): void {
    this.modal.destroy();
  }

}

