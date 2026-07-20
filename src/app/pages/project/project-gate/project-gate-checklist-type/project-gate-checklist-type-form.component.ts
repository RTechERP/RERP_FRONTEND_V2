import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ProjectGateCheckListTypeService } from './project-gate-checklist-type.service';

@Component({
  selector: 'app-project-gate-checklist-type-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule
  ],
  templateUrl: './project-gate-checklist-type-form.component.html',
  styleUrls: ['./project-gate-checklist-type-form.component.css']
})
export class ProjectGateCheckListTypeFormComponent implements OnInit {
  @Input() dataInput: any = null;
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: ProjectGateCheckListTypeService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        STT: this.dataInput.STT,
        TypeCode: this.dataInput.TypeCode,
        Description: this.dataInput.Description
      });
    } else {
      this.loadNextSTT();
    }
  }

  loadNextSTT(): void {
    this.service.getAll().subscribe({
      next: (res: any) => {
        const allData: any[] = res.data || [];
        const maxSTT = allData.reduce((max: number, g: any) => {
          const stt = typeof g.STT === 'number' ? g.STT : 0;
          return stt > max ? stt : max;
        }, 0);
        this.form.get('STT')!.setValue(maxSTT + 1);
      },
      error: () => { }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      STT: [null, [Validators.required]],
      TypeCode: ['', [Validators.required, Validators.maxLength(100)]],
      Description: ['', [Validators.maxLength(550)]]
    });
  }

  onSubmit(closeAfterSave: boolean): void {
    if (this.form.valid) {
      this.loading = true;
      const payload = [{
        ...this.form.value,
        IsDeleted: false
      }];

      this.service.save(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status === 2) {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Mã loại checklist đã tồn tại!');
            return;
          }
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
          this.saveSuccess.emit();
          if (closeAfterSave) {
            this.activeModal.close('save');
          } else {
            if (!this.isEdit) {
              this.form.reset({
                ID: 0,
                STT: null,
                TypeCode: '',
                Description: ''
              });
              this.loadNextSTT();
            }
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
