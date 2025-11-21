import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-project-form-priority-detail',
  imports: [
    FormsModule,
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

  point: any;
  priority: any;
  priorityCode: any;
  projectCheckpoint: any;
  rate: any;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {}
  ngOnInit(): void {
    this.getPriorityType();
    this.getProjectPriorityDetail();
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
          this.point = dt.Score;
          this.priority = dt.ParentID;
          this.priorityCode = dt.Code;
          this.projectCheckpoint = dt.ProjectCheckpoint;
          this.rate = dt.Rate;
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  saveProjectPriority() {
    if (!this.priorityCode || this.priorityCode.trim() === '') {
      this.notification.error('', 'Vui lòng nhập Mã ưu tiên!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.priority) {
      this.notification.error('', 'Vui lòng chọn Loại ưu tiên!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.projectCheckpoint || this.projectCheckpoint.trim() === '') {
      this.notification.error('', 'Vui lòng nhập Checkpoint!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (!this.rate) {
      this.notification.error('', 'Vui lòng nhập Trọng số!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    if (!this.point) {
      this.notification.error('', 'Vui lòng chọn điểm!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    if (!this.priority) {
      this.notification.error('', 'Vui lòng chọn Loại ưu tiên!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const pattern = /^[a-zA-Z0-9_-]+$/;

    if (!pattern.test(this.priorityCode.trim())) {
      this.notification.error(
        '',
        'Mã ưu tiên không được chứa kí tự tiếng Việt và khoảng trắng!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    this.projectService
      .checkProjectPriority(this.priorityId, this.priorityCode)
      .subscribe({
        next: (response: any) => {
          if (response.data == false) {
            const dataSave = {
              ID: this.priorityId,
              Code: this.priorityCode,
              ProjectCheckpoint: this.projectCheckpoint,
              Rate: this.rate,
              Score: this.point,
              ParentID: this.priority,
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
