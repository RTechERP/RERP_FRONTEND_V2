import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { UserGroupService } from '../user-group.service';

@Component({
  selector: 'app-user-group-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './user-group-form.component.html',
  styleUrls: ['./user-group-form.component.css']
})
export class UserGroupFormComponent implements OnInit {
  @Input() dataInput: any = null;

  form!: FormGroup;
  isEdit = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private userGroupService: UserGroupService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        Code: this.dataInput.Code,
        Name: this.dataInput.Name
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      Leader: [0],
      DepartmentID: [0]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const payload = this.form.value;
      const obs = this.userGroupService.save(payload);

      obs.subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
          this.activeModal.close('save');
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || err.message
          );
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
