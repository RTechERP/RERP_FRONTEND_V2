import { Component, OnInit } from '@angular/core';
import { CustomTable } from '../../../shared/custom-table';
import { ColumnDef } from '../../../shared/custom-table/column-def.model';
import { CustomTreeTable } from '../../../shared/custom-tree-table/custom-tree-table';
import { TreeColumnDef } from '../../../shared/custom-tree-table/tree-column-def.model';
import { ProjectApplicationTypesService } from './project-application-types-service/project-application-types.service';
import { ProjectService } from '../project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TreeNode } from 'primeng/api';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ProjectApplicationTypesFormComponent } from './project-application-types-form/project-application-types-form.component';
import { ProjectTechnologyFormComponent } from './project-technology-form/project-technology-form.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';

import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'app-project-application-types',
  standalone: true,
  imports: [
    CustomTable,
    CustomTreeTable,
    NzSplitterModule,
    NgbModalModule,
    NzIconModule,
    NzButtonModule,
    HasPermissionDirective,
    FormsModule,
    NzFormModule,
    NzModalModule,
    Menubar,
    NzTabsModule,
  ],
  templateUrl: './project-application-types.component.html',
  styleUrl: './project-application-types.component.css',
})
export class ProjectApplicationTypesComponent implements OnInit {
  dataset: any[] = [];
  dataTechnology: any[] = [];
  loading: boolean = false;
  projectTypes: any[] = [];
  projectTypeTreeData: TreeNode[] = [];
  loadingProjectTypes: boolean = false;
  dictProjectType: { [key: number]: string } = {};
  isCheckmode: boolean = false;
  isSearchPanelVisible: boolean = false;

  columns: ColumnDef[] = [
    {
      field: 'ApplicationName',
      header: 'Loại ứng dụng',
      width: '250px',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'Descriptions',
      header: 'Mô tả',
      sortable: true,
      filterType: 'text',
    },
  ];

  selectedApplicationTypes: any[] = [];
  selectedProjectType: any = null;
  menuBars: MenuItem[] = [];

  columnsTechnology: ColumnDef[] = [
    {
      field: 'TechnologyName',
      header: 'Tên',
      width: '250px',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'Descriptions',
      header: 'Mô tả',
      sortable: true,
      filterType: 'text',
    },
  ];
  selectedTechnologies: any[] = [];
  menuBarsTechnology: MenuItem[] = [];
  loadingTechnology: boolean = false;

  projectTypeColumns: TreeColumnDef[] = [
    {
      field: 'ProjectTypeName',
      header: 'Tên loại dự án',
      sortable: true,
      filterType: 'text',
      filterMode: 'multiselect',
      filterOptions: [],
      treeToggler: true,
    },
  ];

  constructor(
    private projectApplicationTypesService: ProjectApplicationTypesService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.getProjectType();
    this.loadProjectTechnology();
    this.initMenuBars();
    this.initMenuBarsTechnology();
  }

  initMenuBarsTechnology() {
    this.menuBarsTechnology = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onAddProjectTechnology();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onEditProjectTechnology();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onDeleteProjectTechnology();
        },
      },
    ];
  }

  initMenuBars() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onAddProjectApplicationType();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onEditProjectApplicationType();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N52,N53,N1'),
        command: () => {
          this.onDelete();
        },
      },
    ];
  }

  loadData(projectTypeID: number = 1): void {
    this.loading = true;
    this.projectApplicationTypesService
      .getProjectApplicationType(projectTypeID)
      .subscribe({
        next: (res: any) => {
          this.dataset = Array.isArray(res) ? res : (res?.data ?? []);
          this.loading = false;
        },
        error: () => {
          this.dataset = [];
          this.loading = false;
        },
      });
  }

  loadProjectTechnology(projectTypeID: number = 1): void {
    this.loadingTechnology = true;
    this.projectApplicationTypesService
      .getProjectTechnology(projectTypeID)
      .subscribe({
        next: (res: any) => {
          this.dataTechnology = Array.isArray(res) ? res : (res?.data ?? []);
          this.loadingTechnology = false;
        },
        error: () => {
          this.dataTechnology = [];
          this.loadingTechnology = false;
        },
      });
  }

  onProjectTypeClick(rowData: any): void {
    const projectTypeID = rowData.ID || 0;
    this.selectedProjectType = rowData;
    this.selectedApplicationTypes = [];
    this.selectedTechnologies = [];
    this.loadData(projectTypeID);
    this.loadProjectTechnology(projectTypeID);
  }

  toggleSearchPanel(): void {
    this.isSearchPanelVisible = !this.isSearchPanelVisible;
  }

  getProjectType() {
    this.loadingProjectTypes = true;
    this.projectService.getProjectType().subscribe({
      next: (response: any) => {
        this.projectTypes = this.projectService.createdDataTree(
          response.data,
          'ParentID',
          'ID',
          'ProjectTypeName',
        );
        // Convert NzTree format to PrimeNG TreeNode format
        this.projectTypeTreeData = this.convertToTreeNodes(response.data);
        response.data.forEach((item: any) => {
          if (!this.dictProjectType[item.ID]) {
            this.dictProjectType[item.ID] = item.ProjectTypeName;
          }
        });
        this.loadingProjectTypes = false;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
        this.loadingProjectTypes = false;
      },
    });
  }

  /**
   * Convert flat data to PrimeNG TreeNode[] using ParentID/ID hierarchy
   */
  private convertToTreeNodes(items: any[]): TreeNode[] {
    if (!items || !items.length) return [];

    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    for (const item of items) {
      const node: TreeNode = {
        key: String(item.ID),
        data: item,
        children: [],
        expanded: true,
      };
      map.set(item.ID, node);
    }

    for (const item of items) {
      const node = map.get(item.ID)!;
      const parentId = item.ParentID || 0;

      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  onAddProjectApplicationType() {
    if (!this.selectedProjectType) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn loại dự án trước khi thêm!',
      );
      return;
    }
    const modalRef = this.modalService.open(
      ProjectApplicationTypesFormComponent,
      {
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
      },
    );
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.projectTypeID = this.selectedProjectType.ID;

    modalRef.result
      .then((result) => {
        if (result) this.loadData(this.selectedProjectType.ID);
      })
      .catch(() => {});
  }

  onEditProjectApplicationType() {
    if (
      !this.selectedApplicationTypes ||
      this.selectedApplicationTypes.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 bản ghi để sửa!',
      );
      return;
    }
    if (this.selectedApplicationTypes.length > 1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Chỉ được phép chọn 1 bản ghi để sửa!',
      );
      return;
    }
    const modalRef = this.modalService.open(
      ProjectApplicationTypesFormComponent,
      {
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
      },
    );
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.data = this.selectedApplicationTypes[0];
    modalRef.componentInstance.projectTypeID = this.selectedProjectType?.ID;

    modalRef.result
      .then((result) => {
        if (result) this.loadData(this.selectedProjectType?.ID);
      })
      .catch(() => {});
  }

  onDelete() {
    if (
      !this.selectedApplicationTypes ||
      this.selectedApplicationTypes.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 bản ghi để xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedApplicationTypes.length} bản ghi đã chọn?`,
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const ids = this.selectedApplicationTypes.map((x) => x.ID);
        this.projectApplicationTypesService
          .deleteProjectApplicationType(ids)
          .subscribe({
            next: (res: any) => {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa thành công!',
              );
              this.selectedApplicationTypes = [];
              this.loadData(this.selectedProjectType?.ID);
            },
            error: (err: any) => {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                err?.error?.message || err?.message || 'Có lỗi xảy ra!',
              );
              console.error(err);
            },
          });
      },
    });
  }

  onAddProjectTechnology() {
    if (!this.selectedProjectType) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn loại dự án trước khi thêm!',
      );
      return;
    }
    const modalRef = this.modalService.open(ProjectTechnologyFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.projectTypeID = this.selectedProjectType.ID;

    modalRef.result
      .then((result) => {
        if (result) this.loadProjectTechnology(this.selectedProjectType.ID);
      })
      .catch(() => {});
  }

  onEditProjectTechnology() {
    if (!this.selectedTechnologies || this.selectedTechnologies.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 bản ghi để sửa!',
      );
      return;
    }
    if (this.selectedTechnologies.length > 1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Chỉ được phép chọn 1 bản ghi để sửa!',
      );
      return;
    }
    const modalRef = this.modalService.open(ProjectTechnologyFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.data = this.selectedTechnologies[0];
    modalRef.componentInstance.projectTypeID = this.selectedProjectType?.ID;

    modalRef.result
      .then((result) => {
        if (result) this.loadProjectTechnology(this.selectedProjectType?.ID);
      })
      .catch(() => {});
  }

  onDeleteProjectTechnology() {
    if (!this.selectedTechnologies || this.selectedTechnologies.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 bản ghi để xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedTechnologies.length} bản ghi đã chọn?`,
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const ids = this.selectedTechnologies.map((x) => x.ID);
        this.projectApplicationTypesService
          .deleteProjectTechnology(ids)
          .subscribe({
            next: (res: any) => {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa thành công!',
              );
              this.selectedTechnologies = [];
              this.loadProjectTechnology(this.selectedProjectType?.ID);
            },
            error: (err: any) => {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                err?.error?.message || err?.message || 'Có lỗi xảy ra!',
              );
              console.error(err);
            },
          });
      },
    });
  }
}
