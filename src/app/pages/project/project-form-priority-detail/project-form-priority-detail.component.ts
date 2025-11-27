import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-project-form-priority-detail',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzModalModule,
    NzButtonModule,
    NzGridModule,
    NzInputNumberModule,
  ],
  templateUrl: './project-form-priority-detail.component.html',
  styleUrl: './project-form-priority-detail.component.css',
})
export class ProjectFormPriorityDetailComponent implements OnInit {
  @Input() priorityId: any = 0;
  prioritys: any;

  points = [
    { point: 0, ID: 0 },
    { point: 1, ID: 1 },
    { point: 2, ID: 2 },
    { point: 3, ID: 3 },
    { point: 4, ID: 4 },
    { point: 5, ID: 5 },
  ];

  priorityForm!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }
  ngOnInit(): void {
    this.getPriorityType();
    this.getProjectPriorityDetail();
  }

  initForm() {
    this.priorityForm = this.fb.group({
      priorityCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      priority: [null, [Validators.required]],
      rate: [null, [Validators.required, Validators.min(0), Validators.max(1)]],
      point: [null, [Validators.required]],
      projectCheckpoint: ['', [Validators.required]]
    });
  }

  getPriorityType() {
    this.projectService.getPriorityType().subscribe({
      next: (response: any) => {
        this.prioritys = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectPriorityDetail() {
    this.projectService.getprojectprioritydetail(this.priorityId).subscribe({
      next: (response: any) => {
        const dt = response.data;
        if (dt) {
          this.priorityForm.patchValue({
            priorityCode: dt.Code,
            priority: dt.ParentID,
            rate: dt.Rate,
            point: dt.Score,
            projectCheckpoint: dt.ProjectCheckpoint
          });
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  // Helper method để mark all fields as touched
  markFormGroupTouched() {
    Object.keys(this.priorityForm.controls).forEach(key => {
      const control = this.priorityForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  // Helper method để get error message
  getErrorMessage(controlName: string): string {
    const control = this.priorityForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('pattern')) {
      return 'Mã ưu tiên không được chứa kí tự tiếng Việt và khoảng trắng!';
    }
    if (control?.hasError('min') || control?.hasError('max')) {
      return 'Trọng số phải từ 0 đến 1';
    }
    return '';
  }

  saveProjectPriority() {
    // Mark all fields as touched để hiển thị lỗi
    if (this.priorityForm.invalid) {
      this.markFormGroupTouched();
      
      // Hiển thị thông báo lỗi cho từng trường
      if (this.priorityForm.get('priorityCode')?.hasError('required')) {
        this.notification.error('', 'Vui lòng nhập Mã ưu tiên!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('priorityCode')?.hasError('pattern')) {
        this.notification.error('', 'Mã ưu tiên không được chứa kí tự tiếng Việt và khoảng trắng!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('priority')?.hasError('required')) {
        this.notification.error('', 'Vui lòng chọn Loại ưu tiên!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('rate')?.hasError('required')) {
        this.notification.error('', 'Vui lòng nhập Trọng số!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('rate')?.hasError('min') || this.priorityForm.get('rate')?.hasError('max')) {
        this.notification.error('', 'Trọng số phải từ 0 đến 1!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('point')?.hasError('required')) {
        this.notification.error('', 'Vui lòng chọn điểm!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      if (this.priorityForm.get('projectCheckpoint')?.hasError('required')) {
        this.notification.error('', 'Vui lòng nhập Checkpoint!', {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
      return;
    }

    const formValue = this.priorityForm.value;
    const priorityCode = formValue.priorityCode?.trim();

    this.projectService
      .checkProjectPriority(this.priorityId, priorityCode)
      .subscribe({
        next: (response: any) => {
          if (response.data == false) {
            const dataSave = {
              ID: this.priorityId,
              Code: priorityCode,
              ProjectCheckpoint: formValue.projectCheckpoint,
              Rate: formValue.rate,
              Score: formValue.point,
              ParentID: formValue.priority,
            };
            this.projectService.saveprojectpriority(dataSave).subscribe({
              next: (response: any) => {
                this.notification.success('', 'Ưu tiên đã được lưu!', {
                  nzStyle: { fontSize: '0.75rem' },
                });
                this.activeModal.dismiss(true);
              },
              error: (error) => {
                console.error('Lỗi:', error);
              },
            });
          } else {
            this.notification.error(
              '',
              'Mã ưu tiên đã tồn tại vui lòng kiểm tra lại!',
              {
                nzStyle: { fontSize: '0.75rem' },
              }
            );
            return;
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
  }
}
