import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ProjectTypeDepartmentService } from '../project-type-department.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-project-type-department-template-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSpinModule
  ],
  templateUrl: './project-type-department-template-form.component.html',
  styleUrls: ['./project-type-department-template-form.component.css']
})
export class ProjectTypeDepartmentTemplateFormComponent implements OnInit {
  @Input() projectTypeDepartmentId!: number;
  @Input() projectTypeName!: string;
  @Input() templateData?: any;

  loading = false;
  code = '';
  name = '';
  templateId = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private service: ProjectTypeDepartmentService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    if (this.templateData) {
      this.templateId = this.templateData.ID || 0;
      this.code = this.templateData.Code || '';
      this.name = this.templateData.Name || '';
    }
  }

  onSubmit(): void {
    if (!this.code.trim() || !this.name.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đầy đủ mã và tên template');
      return;
    }

    this.loading = true;
    const payload = [{
      ID: this.templateId,
      Code: this.code.trim(),
      Name: this.name.trim(),
      ProjectTypeDepartmentID: this.projectTypeDepartmentId
    }];

    this.service.saveTemplate(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu dữ liệu thành công');
          this.activeModal.close('save');
        } else if (res.status === 2) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Mã mẫu đã tồn tại!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Có lỗi xảy ra');
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
