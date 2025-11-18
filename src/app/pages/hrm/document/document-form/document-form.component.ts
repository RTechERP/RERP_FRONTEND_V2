import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule,FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzFormModule } from 'ng-zorro-antd/form';
import { combineLatest } from 'rxjs';

import { DocumentService } from '../document-service/document.service';
import { DocumentComponent } from '../document.component';

interface Document {
  STT: number;
  Code: string;
  DocumentTypeID: number;
  NameDocument: string;
  DepartmentID: number;
  DatePromulgate: Date | null;
  DateEffective: Date | null;
  GroupType: number;
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
    NzFormModule
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
  }
  @Input() documentTypeID: number = 0;
  @Input() documentTypeData: any[] = [];
  @Input() dataInput: any;
   formGroup: FormGroup;


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
  });

  // 👇 Lắng nghe sự thay đổi đồng thời của DocumentTypeID và DepartmentID
  combineLatest([
    this.formGroup.get('DocumentTypeID')!.valueChanges,
    this.formGroup.get('DepartmentID')!.valueChanges,
  ]).subscribe(([typeId, deptId]) => {
    // Gọi hàm khi có thay đổi
    this.onTypeOrDepartmentChange(typeId, deptId);
  });
    this.getdataDepartment();
    this.getDataDocumentType();
    
  }

  ngAfterViewInit(): void {}

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

    const formValue = this.formGroup.value;
    // if (!this.newDocument.Code || !this.newDocument.NameDocument) {
    //   this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
    //   return;
    // }
    // Add new product group
    const payload = {
      ID: this.dataInput?.ID ?? 0,
      STT: formValue.STT,
      Code: formValue.Code,
      DocumentTypeID: formValue.DocumentTypeID,
      DepartmentID: formValue.DepartmentID,
      NameDocument: formValue.NameDocument,
      DatePromulgate: formValue.DatePromulgate,
      DateEffective: formValue.DateEffective,
      GroupType: formValue.GroupType,
    };
    this.documentService.saveDocument(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.close();
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể thêm nhóm!'
          );
        }
      },
      error: (err) => {
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
      Name: "Văn bản chung"
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
