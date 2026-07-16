import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ProjectTypeDepartmentService } from '../project-type-department.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';

@Component({
  selector: 'app-project-type-department-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSpinModule,
    TableModule,
    CheckboxModule
  ],
  templateUrl: './project-type-department-form.component.html',
  styleUrls: ['./project-type-department-form.component.css']
})
export class ProjectTypeDepartmentFormComponent implements OnInit {
  @Input() departmentId!: number;
  @Input() departmentName!: string;

  loading = false;
  projectTypes: any[] = [];
  selectedProjectTypes: any[] = [];
  searchKeyword = '';

  constructor(
    public activeModal: NgbActiveModal,
    private service: ProjectTypeDepartmentService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    if (this.departmentId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    // Tải đồng thời tất cả kiểu dự án và các kiểu dự án đã liên kết
    this.service.getProjectTypes().subscribe({
      next: (allRes: any) => {
        this.projectTypes = allRes.data || [];
        
        this.service.getByDepartment(this.departmentId).subscribe({
          next: (linkedRes: any) => {
            const linkedList = linkedRes.data || [];
            const linkedIds = new Set(linkedList.map((x: any) => x.ID));
            
            // Tìm các đối tượng kiểu dự án tương ứng để gán vào PrimeNG selection
            this.selectedProjectTypes = this.projectTypes.filter(x => linkedIds.has(x.ID));
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.showErrorNotification(err);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.showErrorNotification(err);
      }
    });
  }

  get filteredProjectTypes(): any[] {
    if (!this.searchKeyword) {
      return this.projectTypes;
    }
    const keyword = this.searchKeyword.toLowerCase().trim();
    return this.projectTypes.filter(x => 
      (x.ProjectTypeCode && x.ProjectTypeCode.toLowerCase().includes(keyword)) ||
      (x.ProjectTypeName && x.ProjectTypeName.toLowerCase().includes(keyword))
    );
  }

  onSubmit(): void {
    this.loading = true;
    const projectTypeIds = this.selectedProjectTypes.map(x => x.ID);
    const payload = {
      DepartmentID: this.departmentId,
      ProjectTypeIDs: projectTypeIds
    };

    this.service.saveByDepartment(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu dữ liệu thành công');
          this.activeModal.close('save');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.showErrorNotification(err);
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  private showErrorNotification(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err?.message || 'Có lỗi xảy ra',
      { nzStyle: { whiteSpace: 'pre-line' } }
    );
  }
}
