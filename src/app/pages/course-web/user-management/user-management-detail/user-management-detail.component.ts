import { Component, OnInit, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { UserManagementService } from '../user-management.service';

@Component({
  selector: 'app-user-management-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzDatePickerModule,
  ],
  templateUrl: './user-management-detail.component.html',
  styleUrl: './user-management-detail.component.css',
})
export class UserManagementDetailComponent implements OnInit {
  @Input() userData: any = null;
  @Input() mode: 'add' | 'edit' = 'add';

  formGroup!: FormGroup;
  saving = false;
  employeeList: any[] = [];

  SexOptions = [
    { value: 1, label: 'Nam' },
    { value: 0, label: 'Nữ' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserManagementService,
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
  ) { }

  ngOnInit(): void {
    this.initForm();

    if (this.mode === 'edit' && this.userData) {
      this.patchFormData();
    }
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      PasswordHash: ['', this.mode === 'add' ? [Validators.required, Validators.minLength(6)] : []],
      FullName: ['', [Validators.required]],
      Email: ['', [Validators.required, Validators.email]],
      BirthOfDate: [null],
      Sex: [1],
      IsActive: [true],
      PhoneNumber: ['', [Validators.pattern(/^0\d{9}$/)]],
      Address: [''],
      Organization: [''],
      Position: [''],
      CanLearnAhead: [false],
    });
  }

  patchFormData(): void {
    if (this.userData) {
      this.formGroup.patchValue({
        FullName: this.userData.FullName || '',
        Email: this.userData.Email || '',
        BirthOfDate: this.userData.BirthOfDate ? new Date(this.userData.BirthOfDate) : null,
        Sex: this.userData.Sex ?? 1,
        IsActive: this.userData.Status === 0,
        PhoneNumber: this.userData.PhoneNumber || '',
        Address: this.userData.Address || '',
        Organization: this.userData.Organization || '',
        Position: this.userData.Position || '',
        CanLearnAhead: this.userData.CanLearnAhead || false,
      });
    }
  }


  save(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.formGroup.value;

    const payload: any = {
      ID: this.userData?.ID,
      FullName: formValue.FullName,
      Email: formValue.Email,
      BirthOfDate: formValue.BirthOfDate,
      Sex: formValue.Sex,
      Status: formValue.IsActive ? 0 : -1,
      PhoneNumber: formValue.PhoneNumber,
      Address: formValue.Address,
      Organization: formValue.Organization,
      Position: formValue.Position,
      CanLearnAhead: formValue.CanLearnAhead,
    };

    if (this.mode === 'add') {
      payload.PasswordHash = formValue.PasswordHash;
    }

    if (this.mode === 'edit') {
      payload.ID = this.userData?.ID;
    }

    this.userService.save(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.status === 1) {
          this.notification.success('Thành công', res.message || 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error('Lỗi', res.message || 'Lưu thất bại');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error('Lỗi', 'Không thể lưu user');
      }
    });
  }

  close(): void {
    this.activeModal.close(false);
  }
}
