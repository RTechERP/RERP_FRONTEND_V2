import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { FileFormatService } from '../file-format.service';

@Component({
  selector: 'app-file-format-form',
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
  templateUrl: './file-format-form.component.html',
  styleUrls: ['./file-format-form.component.css']
})
export class FileFormatFormComponent implements OnInit {
  @Input() dataInput: any = null;

  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: FileFormatService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        STT: this.dataInput.STT,
        FormatName: this.dataInput.FormatName,
        Extension: this.dataInput.Extension
      });
    } else {
      this.loadNextSTT();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      STT: [1, [Validators.required, Validators.min(1)]],
      FormatName: ['', [Validators.required, Validators.maxLength(100)]],
      Extension: ['', [Validators.required, Validators.maxLength(20)]]
    });
  }

  loadNextSTT(): void {
    this.service.getAll().subscribe({
      next: (res: any) => {
        const allData: any[] = res.data || [];
        const maxSTT = allData.reduce((max: number, item: any) => {
          const stt = typeof item.STT === 'number' ? item.STT : 0;
          return stt > max ? stt : max;
        }, 0);
        this.form.get('STT')!.setValue(maxSTT + 1);
      },
      error: () => { }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onSubmit(closeAfterSave: boolean = true): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const val = { ...this.form.value };

    // Chuẩn hóa đuôi file (ví dụ: xlsx -> .xlsx)
    let ext = (val.Extension || '').trim();
    if (ext && !ext.startsWith('.') && !ext.includes('/')) {
      ext = '.' + ext;
    }
    val.Extension = ext;

    this.loading = true;
    this.service.save([val]).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 2) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Dữ liệu đã tồn tại!');
          return;
        }
        this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

        if (closeAfterSave) {
          this.activeModal.close('save');
        } else {
          if (!this.isEdit) {
            const currentSTT = this.form.get('STT')?.value || 1;
            this.form.reset({
              ID: 0,
              STT: currentSTT + 1,
              FormatName: '',
              Extension: ''
            });
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Có lỗi xảy ra!');
      }
    });
  }
}
