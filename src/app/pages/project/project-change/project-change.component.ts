import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
@Component({
  selector: 'app-project-change',
  imports: [FormsModule, NzSelectModule, NzGridModule, NzButtonModule],
  templateUrl: './project-change.component.html',
  styleUrl: './project-change.component.css',
})
export class ProjectChangeComponent implements OnInit {
  @Input() projectIdOld: any;
  @Input() reportIds: any[] = [];
  projects: any;
  projectIdNew: any;
  disable: any = false;

  ngOnInit(): void {
    this.getProjectModal();
  }
  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) {}

  getProjectModal() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  saveChange() {
    if (this.disable == true) {
      this.saveProjectWorkReport();
    } else {
      this.saveChangeProject();
    }
  }

  saveProjectWorkReport() {
    if (this.projectIdNew <= 0 || !this.projectIdNew) {
      this.notification.error('', 'Vui lòng chọn đến dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const dataSave = {
      ProjectIDOld: this.projectIdOld,
      ProjectIDNew: this.projectIdNew,
      reportIDs: this.reportIds,
    };

    this.projectService.saveProjectWorkReport(dataSave).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success('', 'Đã chuyển dự án!', {
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

  saveChangeProject() {
    debugger
    if (this.projectIdOld <= 0 || !this.projectIdOld) {
      this.notification.error('', 'Vui lòng chọn từ dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    if (this.projectIdNew <= 0 || !this.projectIdNew) {
      this.notification.error('', 'Vui lòng chọn đến dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    if (this.projectIdNew == this.projectIdOld) {
      this.notification.error(
        '',
        'Hai mã dự án giống nhau. Vui lòng kiểm tra lại!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    this.projectService
      .saveChangeProject(this.projectIdOld, this.projectIdNew)
      .subscribe({
        next: (response: any) => {
          if (response.data == true) {
            this.notification.success('', 'Đã chuyển dự án!', {
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
