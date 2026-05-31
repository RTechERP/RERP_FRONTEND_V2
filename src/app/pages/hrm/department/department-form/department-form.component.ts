import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DepartmentServiceService } from '../department-service/department-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzTreeSelectModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.css'],
})
export class DepartmentFormComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() departmentData: any = null;
  @Input() employeeList: any[] = [];
  @Input() departmentNodes: any[] = [];
  @Input() nextSTT: number = 0;

  form!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentServiceService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.mode === 'edit' && this.departmentData) {
      this.patchForm();
    } else {
      this.form.patchValue({ STT: this.nextSTT });
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      ParentID: [null],
      STT: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      Status: [1],
      Email: [''],
      HeadofDepartment: [null, [Validators.required]],
    });
  }

  private patchForm(): void {
    this.form.patchValue({
      ID: this.departmentData.ID || 0,
      ParentID: this.departmentData.ParentID && this.departmentData.ParentID !== 0 ? Number(this.departmentData.ParentID) : null,
      STT: this.departmentData.STT || 0,
      Code: this.departmentData.Code || '',
      Name: this.departmentData.Name || '',
      Status: this.departmentData.Status ?? 1,
      Email: this.departmentData.Email || '',
      HeadofDepartment: this.departmentData.HeadofDepartment ? Number(this.departmentData.HeadofDepartment) : null,
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue();
    formValue.ParentID = formValue.ParentID ? Number(formValue.ParentID) : 0;

    this.departmentService.createDepartment(formValue).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.activeModal.close({ action: 'save' });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(
           NOTIFICATION_TITLE.error,
          (this.mode === 'add' ? 'Thêm phòng ban thất bại: ' : 'Cập nhật phòng ban thất bại: ') + (err?.error?.message || err.message)
        );
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get title(): string {
    return this.mode === 'add' ? 'THÊM PHÒNG BAN MỚI' : 'SỬA PHÒNG BAN';
  }
}
