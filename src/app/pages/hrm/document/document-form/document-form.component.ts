import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { combineLatest } from 'rxjs';

import { DocumentService } from '../document-service/document.service';
import { DateTime } from 'luxon';

interface Document {
  STT: number;
  Code: string;
  DocumentTypeID: number;
  NameDocument: string;
  DepartmentID: number;
  DatePromulgate: Date | null;
  DateEffective: Date | null;
  GroupType: number;
  IsPromulgated?: boolean;
  IsOnWeb?: boolean;
}

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    NzCheckboxModule,
  ],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.css',
})
export class DocumentFormComponent implements OnInit, AfterViewInit {
  @Input() newDocument: Document = {
    STT: 0,
    Code: '',
    NameDocument: '',
    DepartmentID: 0,
    DocumentTypeID: 0,
    DatePromulgate: null,
    DateEffective: null,
    GroupType: 1,
  };

  @Input() documentID: number = 0;
  @Input() dataDepartment: any[] = [];
  @Input() searchParams = {
    departmentID: -1,
    idDocumentType: 0,
  };
  @Input() documentTypeID: number = 0;
  @Input() documentTypeData: any[] = [];
  @Input() dataInput: any;
  @Input() mode: 'add' | 'edit' = 'add';
  formGroup: FormGroup;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private documentService: DocumentService,
    private activeModal: NgbActiveModal
  ) {
    this.formGroup = this.fb.group({
      STT: 0,
      NameDocument: [null, [Validators.required, Validators.maxLength(100)]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      DepartmentID: ['', [Validators.required]],
      DocumentTypeID: ['', [Validators.required]],
      DatePromulgate: ['', [Validators.required]],
      DateEffective: ['', [Validators.required]],
      GroupType: 1,
      IsPromulgated: [false],
      IsOnWeb: [false],
    });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      STT: [0],
      NameDocument: ['', [Validators.required, Validators.maxLength(100)]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      DepartmentID: ['', Validators.required],
      DocumentTypeID: ['', Validators.required],
      DatePromulgate: ['', Validators.required],
      DateEffective: ['', Validators.required],
      GroupType: [1],
      IsPromulgated: [false],
      IsOnWeb: [false],
    });

    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      // Nếu DepartmentID không có (null, undefined, 0) thì set thành 0 (Văn bản chung)
      const departmentID =
        this.dataInput.DepartmentID !== null &&
        this.dataInput.DepartmentID !== undefined &&
        this.dataInput.DepartmentID !== ''
          ? this.dataInput.DepartmentID
          : 0;

      this.formGroup.patchValue({
        STT: this.dataInput.STT || 0,
        NameDocument: this.dataInput.NameDocument || '',
        Code: this.dataInput.Code || '',
        DepartmentID: departmentID,
        DocumentTypeID: this.dataInput.DocumentTypeID || '',
        DatePromulgate: this.formatDateForInput(this.dataInput.DatePromulgate),
        DateEffective: this.formatDateForInput(this.dataInput.DateEffective),
        GroupType: this.dataInput.GroupType || 1,
        IsPromulgated: this.dataInput.IsPromulgated || false,
        IsOnWeb: this.dataInput.IsOnWeb || false,
      });
    }

    // 👇 Lắng nghe sự thay đổi đồng thời của DocumentTypeID và DepartmentID (chỉ khi thêm mới)
    if (this.mode === 'add') {
      combineLatest([
        this.formGroup.get('DocumentTypeID')!.valueChanges,
        this.formGroup.get('DepartmentID')!.valueChanges,
      ]).subscribe(([typeId, deptId]) => {
        // Gọi hàm khi có thay đổi
        this.onTypeOrDepartmentChange(typeId, deptId);
      });
    }
    this.getdataDepartment();
    this.getDataDocumentType();
  }

  ngAfterViewInit(): void {}

  // Hàm format date cho input type="date" (yyyy-MM-dd)
  formatDateForInput(value: any): string {
    if (!value) return '';

    // Nếu là Date object
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value);
      return dt.isValid ? dt.toFormat('yyyy-MM-dd') : '';
    }

    const str = String(value).trim();
    if (!str) return '';

    // Thử parse ISO string
    let dt = DateTime.fromISO(str);
    if (dt.isValid) return dt.toFormat('yyyy-MM-dd');

    // Thử parse dd/MM/yyyy
    dt = DateTime.fromFormat(str, 'dd/MM/yyyy');
    if (dt.isValid) return dt.toFormat('yyyy-MM-dd');

    // Nếu là string dạng yyyy-MM-dd thì trả về luôn
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }

    return '';
  }

  onTypeOrDepartmentChange(typeId?: number, deptId?: number): void {
    if (!typeId) {
      this.formGroup.patchValue({ STT: 0 });
      return;
    }

    this.documentService.getNextStt(typeId, deptId ?? 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.formGroup.patchValue({ STT: res.nextStt });
        }
      },
      error: (err) => console.error('Lỗi API:', err),
    });
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  saveDocument() {
    if (this.saving) {
      return; // Ngăn không cho lưu nhiều lần
    }

    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach((c) => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    this.saving = true; // Bắt đầu lưu

    const formValue = this.formGroup.value;
    // Nếu DepartmentID không có (null, undefined, '') thì set thành 0 (Văn bản chung)
    const departmentID =
      formValue.DepartmentID !== null &&
      formValue.DepartmentID !== undefined &&
      formValue.DepartmentID !== ''
        ? formValue.DepartmentID
        : 0;

    const payload = {
      ID: this.dataInput?.ID ?? 0,
      STT: formValue.STT,
      Code: formValue.Code,
      DocumentTypeID: formValue.DocumentTypeID,
      DepartmentID: departmentID,
      NameDocument: formValue.NameDocument,
      DatePromulgate: formValue.DatePromulgate,
      DateEffective: formValue.DateEffective,
      GroupType: formValue.GroupType,
      IsPromulgated: formValue.IsPromulgated || false,
      IsOnWeb: formValue.IsOnWeb || false,
    };
    this.documentService.saveDocument(payload).subscribe({
      next: (res) => {
        this.saving = false; // Kết thúc lưu
        if (res.status === 1) {
          const message =
            this.mode === 'edit' ? 'Sửa thành công!' : 'Thêm mới thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể thêm nhóm!'
          );
        }
      },
      error: (err) => {
        this.saving = false; // Kết thúc lưu khi có lỗi
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
      },
    });
  }

  getdataDepartment() {
    this.documentService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];

      // Thêm 1 phần tử mới vào mảng
      this.dataDepartment.push({
        ID: 0,
        Name: 'Văn bản chung',
      });
    });
  }

  getDataDocumentType() {
    this.documentService.getDataDocumentType().subscribe((response: any) => {
      this.documentTypeData = response.data || [];
    });
  }

  close() {
    this.activeModal.close(true);
  }
}
