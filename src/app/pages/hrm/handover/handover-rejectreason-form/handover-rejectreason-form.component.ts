import { Component } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';


@Component({
  selector: 'app-handover-rejectreason-form',
   standalone: true,
  imports: [
   ReactiveFormsModule,
   NzButtonModule,
   NzModalModule,
   NzFormModule,
   NzInputModule,
   CommonModule

  ],
  templateUrl: './handover-rejectreason-form.component.html',
  styleUrls: ['./handover-rejectreason-form.component.css']
})
export class HandoverRejectreasonFormComponent {
  form: FormGroup;

  constructor(private modal: NzModalRef, private fb: FormBuilder) {
    // Tạo form với 1 trường "reason", bắt buộc nhập
    this.form = this.fb.group({
      reason: [null, [Validators.required, Validators.minLength(1)]]
    });
  }

  // Gửi lý do và đóng modal
  submit() {
    if (this.form.valid) {
      this.modal.close(this.form.value.reason); // trả lý do cho component gọi modal
    } else {
      // Đánh dấu tất cả các control là touched để hiển thị validation
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
    }
  }

  // Hủy modal
  cancel() {
    this.modal.destroy();
  }
}
