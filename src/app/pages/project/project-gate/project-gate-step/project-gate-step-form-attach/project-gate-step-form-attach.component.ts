import { Component, Inject, Input, OnInit, Optional, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProjectGateStepService } from '../project-gate-step.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { TabServiceService } from '../../../../../layouts/tab-service.service';

@Component({
  selector: 'app-project-gate-step-form-attach',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTooltipModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzTagModule,
    NzIconModule,
    NzDividerModule,
    TableModule,
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './project-gate-step-form-attach.component.html',
  styleUrls: ['./project-gate-step-form-attach.component.css']
})
export class ProjectGateStepFormAttachComponent implements OnInit {
  @Input() stepId!: number;
  @Input() stepCode!: string;
  @Input() stepName!: string;
  @Input() departmentName: string = '';
  @Input() isReadOnly: boolean = false;

  isLoading = false;
  isSaving = false;
  isSubmitted = false;

  forms: any[] = [];
  deletedFormIds: number[] = [];
  selectedFormRowForUpload: any = null;

  @ViewChild('fileInputUpload') fileInputUpload!: ElementRef<HTMLInputElement>;

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    @Optional() @Inject('tabData') public tabData: any,
    private service: ProjectGateStepService,
    private tabService: TabServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (this.tabData) {
      this.stepId = this.tabData.stepId ?? this.stepId;
      this.stepCode = this.tabData.stepCode ?? this.stepCode;
      this.stepName = this.tabData.stepName ?? this.stepName;
      this.departmentName = this.tabData.departmentName ?? this.departmentName ?? '';
      this.isReadOnly = this.tabData.isReadOnly ?? this.isReadOnly;
    }
    this.loadData();
  }

  loadData(): void {
    console.log('ProjectGateStepFormAttachComponent loadData stepId:', this.stepId);
    if (!this.stepId) return;
    this.isLoading = true;
    this.forms = [];
    this.deletedFormIds = [];

    this.service.getFormsByStep(this.stepId)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          console.log('ProjectGateStepFormAttachComponent getFormsByStep response:', res);
          this.forms = (res.data || []).map((d: any, idx: number) => ({
            ...d,
            STT: d.STT || idx + 1,
            _tempId: d.ID || -(idx + 1),
            _selected: false,
            _isNew: false,
            _dirty: false
          }));
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Lỗi nạp danh sách biểu mẫu:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách biểu mẫu!');
          this.cdr.detectChanges();
        }
      });
  }

  addDetailRow(): void {
    const nextStt = this.forms.length > 0
      ? Math.max(...this.forms.map(d => d.STT || 0)) + 1
      : 1;

    this.forms = [
      ...this.forms,
      {
        ID: 0,
        ProjectGateStepID: this.stepId,
        STT: nextStt,
        FormName: '',
        FileName: '',
        FilePath: '',
        FileSize: null,
        Description: '',
        _tempId: -Date.now() - Math.floor(Math.random() * 1000),
        _selected: false,
        _isNew: true,
        _dirty: true
      }
    ];
  }

  removeDetailRow(row: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa biểu mẫu này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (row.ID > 0) {
          this.deletedFormIds.push(row.ID);
        }
        this.forms = this.forms.filter(f => f._tempId !== row._tempId);
      }
    });
  }

  isAllFormsSelected(): boolean {
    if (this.forms.length === 0) return false;
    return this.forms.every(f => f._selected);
  }

  toggleSelectAllForms(checked: boolean): void {
    this.forms.forEach(f => f._selected = checked);
  }

  hasSelectedForms(): boolean {
    return this.forms.some(f => f._selected);
  }

  removeSelectedForms(): void {
    const selectedCount = this.forms.filter(f => f._selected).length;
    if (selectedCount === 0) return;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedCount} biểu mẫu đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.forms.forEach(f => {
          if (f._selected && f.ID > 0) {
            this.deletedFormIds.push(f.ID);
          }
        });
        this.forms = this.forms.filter(f => !f._selected);
      }
    });
  }

  markRowDirty(row: any): void {
    row._dirty = true;
  }

  triggerUploadFile(row: any): void {
    this.selectedFormRowForUpload = row;
    if (this.fileInputUpload) {
      this.fileInputUpload.nativeElement.value = '';
      this.fileInputUpload.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const row = this.selectedFormRowForUpload;
    if (!row) return;

    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    this.notification.info('Đang upload', 'Đang tải file biểu mẫu lên...');

    this.service.uploadFormFile(file, this.departmentName).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) {
          row.FileName = res.data.OriginalFileName || file.name;
          row.FilePath = res.data.FilePath;
          row.FileSize = res.data.FileSize;
          row._dirty = true;
          this.notification.success(NOTIFICATION_TITLE.success, 'Đã đính kèm file thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Tải file thất bại!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi upload file biểu mẫu:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi tải file!');
      }
    });
  }

  removeFile(row: any): void {
    row.FileName = '';
    row.FilePath = '';
    row.FileSize = null;
    row._dirty = true;
  }

  downloadFile(row: any): void {
    if (!row.FilePath) return;
    this.service.downloadFile(row.FilePath).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = row.FileName || 'bieu_mau_dinh_kem';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải tệp tin!');
      }
    });
  }

  onSubmit(): void {
    this.isSubmitted = true;

    // Validate FormName mandatory
    const invalidRow = this.forms.find(f => !f.FormName || !f.FormName.trim());
    if (invalidRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập Tên biểu mẫu cho tất cả các dòng!');
      return;
    }

    this.isSaving = true;
    const dto = {
      Items: this.forms,
      DeletedIds: this.deletedFormIds
    };

    this.service.saveStepForms(this.stepId, dto)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu danh sách biểu mẫu thành công!');
            this.loadData();
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu biểu mẫu thất bại!');
          }
        },
        error: (err: any) => {
          console.error('Lỗi lưu biểu mẫu:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu biểu mẫu!');
        }
      });
  }

  onCancel(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else if (this.stepId) {
      this.tabService.closeTabByKey(`form-attach-step-${this.stepId}`);
    }
  }

  // Support Table Keyboard Navigation
  onKeyDown(rowIndex: number, colName: string, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (rowIndex === this.forms.length - 1) {
        this.addDetailRow();
      }
    }
  }
}
