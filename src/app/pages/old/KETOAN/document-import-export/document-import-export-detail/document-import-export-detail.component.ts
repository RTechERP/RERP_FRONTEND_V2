import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { DocumentImportExportService } from '../document-import-export-service/document-import-export.service';

@Component({
  selector: 'app-document-import-export-detail',
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTableModule,
    NzIconModule,
    NzModalModule,
  ],
  templateUrl: './document-import-export-detail.component.html',
  styleUrl: './document-import-export-detail.component.css'
})
export class DocumentImportExportDetailComponent implements OnInit, AfterViewInit{

  @Input() documentType: number = 1; // 1 = Import, 2 = Export
  @Input() isEditMode: boolean = false;
  @Input() documentId: number = 0;
  @Input() documentData: any = null;

  documentCode: string = '';
  documentName: string = '';
  
  errors = {
    documentCode: '',
    documentName: ''
  };

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private message: NzMessageService,
    private modalService: NgbModal,
    private documentImportExportService: DocumentImportExportService
  ) {}

  ngOnInit(): void {
    if (this.isEditMode && this.documentData) {
      this.loadDocumentData();
    }
  }

  ngAfterViewInit(): void {

  }

  loadDocumentData(): void {
    if (this.documentData) {
      this.documentCode = this.documentData.DocumentImportCode || this.documentData.Code || '';
      this.documentName = this.documentData.DocumentImportName || this.documentData.Name || '';
    }
  }

  isFormValid(): boolean {
    return this.documentCode.trim() !== '' && this.documentName.trim() !== '';
  }

  cancel(): void {
    this.activeModal.close({
      success: false,
      reloadData: false
    });
  }

  saveAndClose(): void {
    this.errors = {
      documentCode: '',
      documentName: ''
    };

    // Validate
    if (!this.documentCode.trim()) {
      this.errors.documentCode = 'Vui lòng nhập mã chứng từ';
      return;
    }

    if (!this.documentName.trim()) {
      this.errors.documentName = 'Vui lòng nhập tên chứng từ';
      return;
    }

    // Save data
    this.documentImportExportService.saveDocumentImportExport(
      this.documentType,
      this.documentCode.trim(),
      this.documentName.trim(),
      this.isEditMode ? this.documentId : undefined
    ).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu chứng từ thành công');
          this.activeModal.close({
            success: true,
            reloadData: true,
            data: response.data
          });
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu thất bại');
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error.error.message);
        console.log("Lỗi text: ", error.error.message);
      }
    });
  }
}
