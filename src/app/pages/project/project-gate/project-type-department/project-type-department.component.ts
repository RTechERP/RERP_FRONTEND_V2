import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenubarModule } from 'primeng/menubar';
import { SplitterModule } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { MenuItem } from 'primeng/api';
import { ProjectTypeDepartmentService } from './project-type-department.service';
import { ProjectTypeDepartmentFormComponent } from './project-type-department-form/project-type-department-form.component';
import { ProjectTypeDepartmentTemplateFormComponent } from './project-type-department-template-form/project-type-department-template-form.component';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { ProjectGateStepManagementComponent } from '../../project-gate-step/project-gate-step-management/project-gate-step-management.component';

@Component({
  selector: 'app-project-type-department',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenubarModule,
    SplitterModule,
    TableModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzInputModule,
    NzModalModule,
    ProjectTypeDepartmentTemplateFormComponent
  ],
  providers: [NzModalService],
  templateUrl: './project-type-department.component.html',
  styleUrls: ['./project-type-department.component.css']
})
export class ProjectTypeDepartmentComponent implements OnInit {
  menuBars: MenuItem[] = [];
  
  loadingDepartments = false;
  loadingProjectTypes = false;

  departments: any[] = [];
  selectedDepartment: any = null;
  searchDeptKeyword = '';

  projectTypes: any[] = [];
  selectedProjectType: any = null;

  // Cột 3: Nạp danh sách Template khi ấn vào Kiểu dự án
  templates: any[] = [];
  loadingTemplates = false;

  constructor(
    private service: ProjectTypeDepartmentService,
    private ngbModal: NgbModal,
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private tabService: TabServiceService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadDepartments();
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Tải lại danh sách',
        icon: 'fa-solid fa-arrows-rotate',
        command: () => this.loadDepartments()
      }
    ];
  }

  loadDepartments(): void {
    this.loadingDepartments = true;
    this.service.getDepartments().subscribe({
      next: (res: any) => {
        this.departments = res.data || [];
        this.loadingDepartments = false;
        if (this.departments.length > 0) {
          this.onSelectDepartment(this.departments[0]);
        }
      },
      error: (err) => {
        this.loadingDepartments = false;
        this.showErrorNotification(err);
      }
    });
  }

  get filteredDepartments(): any[] {
    if (!this.searchDeptKeyword) {
      return this.departments;
    }
    const keyword = this.searchDeptKeyword.toLowerCase().trim();
    return this.departments.filter(x => 
      (x.Code && x.Code.toLowerCase().includes(keyword)) ||
      (x.Name && x.Name.toLowerCase().includes(keyword))
    );
  }

  onSelectDepartment(dept: any): void {
    this.selectedDepartment = dept;
    this.projectTypes = [];
    this.selectedProjectType = null;
    this.templates = [];
    this.loadProjectTypesForSelectedDepartment();
  }

  loadProjectTypesForSelectedDepartment(): void {
    if (!this.selectedDepartment) return;
    this.loadingProjectTypes = true;
    this.service.getByDepartment(this.selectedDepartment.ID).subscribe({
      next: (res: any) => {
        this.projectTypes = res.data || [];
        this.loadingProjectTypes = false;
      },
      error: (err) => {
        this.loadingProjectTypes = false;
        this.showErrorNotification(err);
      }
    });
  }

  onSelectProjectType(type: any): void {
    this.selectedProjectType = type;
    this.templates = [];
    // Ở giai đoạn này, chỉ hiển thị danh sách kiểu dự án. Khi click kiểu dự án có thể nạp thêm danh sách template (nếu có API)
    // Tạm thời hiển thị placeholder hoặc load dữ liệu mẫu
    this.loadTemplatesForSelectedProjectType();
  }

  loadTemplatesForSelectedProjectType(): void {
    if (!this.selectedProjectType || !this.selectedProjectType.ProjectTypeDepartmentID) return;
    this.loadingTemplates = true;
    this.service.getTemplates(this.selectedProjectType.ProjectTypeDepartmentID).subscribe({
      next: (res: any) => {
        this.templates = res.data || [];
        this.loadingTemplates = false;
      },
      error: (err) => {
        this.loadingTemplates = false;
        this.showErrorNotification(err);
      }
    });
  }

  openAddTemplateModal(): void {
    if (!this.selectedProjectType || !this.selectedProjectType.ProjectTypeDepartmentID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một kiểu dự án trước.');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectTypeDepartmentTemplateFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.projectTypeDepartmentId = this.selectedProjectType.ProjectTypeDepartmentID;
    modalRef.componentInstance.projectTypeName = this.selectedProjectType.ProjectTypeName;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadTemplatesForSelectedProjectType();
      }
    }).catch(() => {});
  }

  openEditTemplateModal(row: any): void {
    if (!this.selectedProjectType || !this.selectedProjectType.ProjectTypeDepartmentID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một kiểu dự án trước.');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectTypeDepartmentTemplateFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.projectTypeDepartmentId = this.selectedProjectType.ProjectTypeDepartmentID;
    modalRef.componentInstance.projectTypeName = this.selectedProjectType.ProjectTypeName;
    modalRef.componentInstance.templateData = row;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadTemplatesForSelectedProjectType();
      }
    }).catch(() => {});
  }

  goToTemplateSteps(row: any): void {
    const tabKey = `template-steps-${row.ID}`;
    this.tabService.openTabComp({
      comp: ProjectGateStepManagementComponent,
      title: `Cấu hình bước: ${row.Name || row.Code}`,
      key: tabKey,
      data: {
        templateId: row.ID,
        templateName: row.Name || '',
        templateCode: row.Code || ''
      }
    });
  }

  deleteTemplate(row: any): void {
    if (!this.selectedProjectType) return;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa template "${row.Name}" không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.loadingTemplates = true;
        this.service.deleteTemplate([row.ID]).subscribe({
          next: (res: any) => {
            this.loadingTemplates = false;
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Xóa template thành công');
              this.loadTemplatesForSelectedProjectType();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa template thất bại');
            }
          },
          error: (err) => {
            this.loadingTemplates = false;
            this.showErrorNotification(err);
          }
        });
      }
    });
  }

  openAddProjectTypeModal(): void {
    if (!this.selectedDepartment) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một phòng ban trước.');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectTypeDepartmentFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.departmentId = this.selectedDepartment.ID;
    modalRef.componentInstance.departmentName = this.selectedDepartment.Name;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadProjectTypesForSelectedDepartment();
      }
    }).catch(() => {});
  }

  deleteLink(row: any): void {
    if (!this.selectedDepartment) return;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa kiểu dự án "${row.ProjectTypeName}" khỏi phòng ban "${this.selectedDepartment.Name}" không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.loadingProjectTypes = true;
        this.service.deleteLink(this.selectedDepartment.ID, row.ID).subscribe({
          next: (res: any) => {
            this.loadingProjectTypes = false;
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Xóa liên kết thành công');
              this.loadProjectTypesForSelectedDepartment();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa liên kết thất bại');
            }
          },
          error: (err) => {
            this.loadingProjectTypes = false;
            this.showErrorNotification(err);
          }
        });
      }
    });
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
