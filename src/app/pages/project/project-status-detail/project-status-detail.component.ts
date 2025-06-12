import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-project-status-detail',
  imports: [FormsModule, NzGridModule, NzInputModule, NzButtonModule],
  templateUrl: './project-status-detail.component.html',
  styleUrl: './project-status-detail.component.css',
})
export class ProjectStatusDetailComponent implements OnInit {
  maxStt: any;
  statusName: any;
  projectStatus: any;
  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.getProjectStatus();
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projectStatus = response.data;
        if (this.projectStatus && this.projectStatus.length > 0) {
          this.maxStt =
            Math.max(...this.projectStatus.map((item: any) => item.STT || 0)) +
            1;
        } else {
          this.maxStt = 0;
        }
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  saveProjectStatus() {
    if (!this.statusName) {
      this.notification.error('', 'Vui lòng nhập trạng thái!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    debugger;
    const checkStatus = this.projectStatus.find(
      (item: any) => item.StatusName == this.statusName
    );
    if (checkStatus) {
      this.notification.error(
        '',
        'Trạng thái đã tồn tại. Vui lòng kiểm tra lại!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    this.projectService
      .saveProjectStatus(this.maxStt, this.statusName)
      .subscribe({
        next: (response: any) => {
          if (response.status == 1) {
            this.notification.error('', 'Đã lưu trạng thái!', {
              nzStyle: { fontSize: '0.75rem' },
            });
            this.activeModal.dismiss(true);
          }
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
  }
}
