import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { DocumentService } from '../document-service/document.service';
import { DocumentComponent } from '../document.component';

interface DocumentType {
  Code: string;
  Name: string;
}

@Component({
  selector: 'app-document-type-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    ReactiveFormsModule,

  ],
  templateUrl: './document-type-form.component.html',
  styleUrl: './document-type-form.component.css'
})
export class DocumentTypeFormComponent implements OnInit, AfterViewInit{

  @Input() newDocumentType: DocumentType = {
    Code: '',
    Name: ''
  }

    @Input() documentTypeID: number = 0;
    @Input() dataInput: any;
    @Input() mode: 'add' | 'edit' = 'add';
    formGroup: FormGroup;
    saving: boolean = false;
    // Data: any[] = [];

     constructor(
      private fb: FormBuilder,
      private notification: NzNotificationService,
      private documentService: DocumentService,
      private activeModal: NgbActiveModal,
            ) {
               this.formGroup = this.fb.group({
        Name: [null, [Validators.required, Validators.maxLength(100)]],
        Code: ['', [Validators.required, Validators.maxLength(100)]],
      });
            }
  ngOnInit(): void {
      this.newDocumentType = {
        Code: '',
        Name: '',
      }

      // Load dữ liệu nếu là chế độ edit
      if (this.mode === 'edit' && this.dataInput) {
        this.formGroup.patchValue({
          Name: this.dataInput.Name || '',
          Code: this.dataInput.Code || '',
        });
      }
  }

  ngAfterViewInit(): void {
      
  }
    private trimAllStringControls() {
  Object.keys(this.formGroup.controls).forEach(k => {
    const c = this.formGroup.get(k);
    const v = c?.value;
    if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
  });
}

  saveDocumentType() {
    if (this.saving) {
      return; // Ngăn không cho lưu nhiều lần
    }

    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.saving = true; // Bắt đầu lưu

    const formValue = this.formGroup.value;
    const payload = {
      ID: this.dataInput?.ID || 0,
      Name: formValue.Name,
      Code: formValue.Code,
    };
    this.documentService.saveDocumentType(payload).subscribe({
      next: (res) => {
        this.saving = false; // Kết thúc lưu
        if (res.status === 1) {
          const message = this.mode === 'edit' ? 'Sửa thành công!' : 'Thêm mới thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể thêm nhóm!');
        }
      },
      error: (err) => {
        this.saving = false; // Kết thúc lưu khi có lỗi
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      }
    });
  }
    close() {
   
    this.activeModal.close(true);
  }



}
