import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { ProjectGateStepService } from '../project-gate-step.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-project-gate-step-template-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    TableModule
  ],
  templateUrl: './project-gate-step-template-modal.component.html',
  styleUrls: ['./project-gate-step-template-modal.component.css'],
  providers: [NzNotificationService, NzModalService]
})
export class ProjectGateStepTemplateModalComponent implements OnInit {
  templates: any[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private service: ProjectGateStepService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.service.getAllTemplates().subscribe({
      next: (res: any) => {
        this.templates = res.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Không thể tải danh sách template');
      }
    });
  }

  onAddRow(): void {
    this.templates = [
      ...this.templates,
      { ID: 0, Code: '', Name: '' }
    ];
  }

  onDeleteRow(index: number, item: any): void {
    if (item.ID <= 0) {
      this.templates = this.templates.filter((_, idx) => idx !== index);
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc muốn xóa template '${item.Code}' này không?`,
        nzOkText: 'Xóa',
        nzOkDanger: true,
        nzOnOk: () => {
          this.loading = true;
          this.service.deleteTemplates([item.ID]).subscribe({
            next: () => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadTemplates();
            },
            error: (err: any) => {
              this.loading = false;
              this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi khi xóa template');
            }
          });
        }
      });
    }
  }

  onSubmit(): void {
    // Validation
    for (const item of this.templates) {
      if (!item.Code || !item.Code.trim()) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã template không được để trống');
        return;
      }
      if (!item.Name || !item.Name.trim()) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Tên template không được để trống');
        return;
      }
    }

    // Check duplicate code local
    const codes = this.templates.map(x => x.Code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã template bị trùng lặp');
      return;
    }

    this.loading = true;
    this.service.saveTemplates(this.templates).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 2) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
          return;
        }
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công');
        this.activeModal.close('save');
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi khi lưu dữ liệu');
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
