import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TravelRegistrationServiceService } from '../travel-registration-service/travel-registration-service.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';

@Component({
  standalone: true,
  selector: 'app-travel-registration-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './travel-registration-detail.component.html'
})
export class TravelRegistrationDetailComponent implements OnInit {
  @Input() dataInput: any = null;

  form!: FormGroup;
  isEdit = false;
  isLoading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.dataInput) {
      this.isEdit = true;
      this.form.patchValue({
        ...this.dataInput,
        BirthDay: this.dataInput.BirthDay ? new Date(this.dataInput.BirthDay) : null,
        CCCDIssueDate: this.dataInput.CCCDIssueDate ? new Date(this.dataInput.CCCDIssueDate) : null,
        ConfirmDate: this.dataInput.ConfirmDate ? new Date(this.dataInput.ConfirmDate) : null
      });
    }
  }

  initForm() {
    this.form = this.fb.group({
      ID: [0],
      EmployeeID: [0],
      EmployeeCode: [''],
      EmployeeName: ['', [Validators.required]],
      Department: [''],
      PositionName: [''],
      BirthDay: [null],
      Age: [null],
      Height: [null],
      Gender: ['Nam'],
      Relationship: [''],
      Address: [''],
      CCCD: ['', [Validators.required]],
      CCCDIssueDate: [null],
      CCCDIssuePlace: [''],
      PhoneNumber: [''],
      DepartureLocation: [''],
      ConfirmStatus: [0],
      ConfirmDate: [null],
      ConfirmBy: [''],
      OwnerEmployeeID: [0]
    });
  }

  get title(): string {
    return this.isEdit ? 'Sửa thông tin đăng ký du lịch' : 'Thêm thông tin đăng ký du lịch';
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    this.isLoading = true;

    // Convert dates back to string format if needed before sending to API
    const submitData = { ...this.form.value };

    this.travelRegistrationService.saveData(submitData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
          this.activeModal.close('save');
        } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  onCancel() {
    this.activeModal.dismiss('cancel');
  }
}
