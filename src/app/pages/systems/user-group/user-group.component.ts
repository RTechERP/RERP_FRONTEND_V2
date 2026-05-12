import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { UserGroupService } from './user-group.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { UserGroupFormComponent } from './user-group-form/user-group-form.component';
import { UserGroupEmployeeSelectTableComponent } from './employee-select-table/employee-select-table.component';
import { UserGroupDistributionFormComponent } from './user-group-distribution-form/user-group-distribution-form.component';
import { UserGroupCopyDistributionFormComponent } from './user-group-copy-distribution-form/user-group-copy-distribution-form.component';
import { MenubarModule } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-user-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzNotificationModule,
    NzModalModule,
    NzSpinModule,
    NzInputModule,
    NzCardModule,
    NzFlexModule,
    NzSelectModule,
    NzGridModule,
    NzFormModule,
    TableModule,
    TooltipModule,
    TagModule,
    MenubarModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './user-group.component.html',
  styleUrls: ['./user-group.component.css']
})
export class UserGroupComponent implements OnInit, OnDestroy {
  // Data sets
  dataset: any[] = [];
  datasetRights: any[] = [];
  datasetUsers: any[] = [];

  selectedGroup: any = null;
  selectedGroupId: number = 0;
  loading = false;
  showSearchBar = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  menuBars: MenuItem[] = [];
  dateFormat = 'dd/MM/yyyy';

  searchParams = {
    keyword: '',
    userId: 0
  };
  employeeList: any[] = [];
  groupedEmployees: any[] = [];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  constructor(
    private userGroupService: UserGroupService,
    private employeeService: EmployeeService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal,
    private permissinSv: PermissionService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadEmployees();
    this.loadMasterData();
  }

  ngOnDestroy(): void { }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm nhóm',
        icon: 'fa-solid fa-circle-plus text-primary',
        command: () => this.onAdd(),
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Sửa nhóm',
        icon: 'fa-solid fa-file-pen text-warning',
        command: () => this.onEdit(),
        disabled: !this.selectedGroup,
        visible: this.permissinSv.hasPermission("N1999"),
      },

      {
        label: 'Xóa nhóm',
        icon: 'fa-solid fa-trash text-danger',
        command: () => this.onDelete(),
        disabled: !this.selectedGroup,
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Phân quyền',
        icon: 'fa-solid fa-user-shield text-info',
        command: () => this.onAssignPermissions(),
        visible: this.permissinSv.hasPermission("N1999"),
        disabled: !this.selectedGroup
      },
      {
        label: 'Copy quyền',
        icon: 'fa-solid fa-copy text-success',
        visible: this.permissinSv.hasPermission("N1999"),
        command: () => this.onCopyPermissions()
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => this.loadMasterData(),
        visible: this.permissinSv.hasPermission("N1999"),
      }
    ];
  }

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Sửa nhóm' || item.label === 'Xóa nhóm' || item.label === 'Phân quyền') {
        return { ...item, disabled: !this.selectedGroup };
      }
      return item;
    });
  }

  onRowSelect(event: any): void {
    const item = event.data;
    if (item && item.ID !== this.selectedGroupId) {
      this.selectedGroup = item;
      this.selectedGroupId = item.ID;
      this.updateMenuState();
      this.loadDetails(item.ID);
    }
  }

  onRowUnselect(): void {
    this.selectedGroup = null;
    this.selectedGroupId = 0;
    this.datasetRights = [];
    this.datasetUsers = [];
    this.updateMenuState();
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        this.employeeList = res.data || [];
        this.groupDropdownEmployees(this.employeeList);
      },
      error: (err: any) => this.showError(err)
    });
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }

  loadMasterData(): void {
    this.loading = true;
    this.userGroupService.getAll(this.searchParams.keyword, this.searchParams.userId).subscribe({
      next: (res: any) => {
        this.dataset = res.data || [];
        this.selectedGroup = null;
        this.selectedGroupId = 0;
        this.updateMenuState();
        this.datasetRights = [];
        this.datasetUsers = [];
        this.loading = false;

        if (this.dataset.length > 0) {
          this.selectedGroup = this.dataset[0];
          this.selectedGroupId = this.selectedGroup.ID;
          this.updateMenuState();
          this.loadDetails(this.selectedGroupId);
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  loadDetails(groupId: number): void {
    this.loading = true;
    forkJoin({
      users: this.userGroupService.getGroupLinks(groupId),
      rights: this.userGroupService.getRightsDistribution(groupId)
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        this.datasetUsers = res.users.data || [];
        this.datasetRights = res.rights.data || [];
      },
      error: (err: any) => this.showError(err)
    });
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  onSearch(): void {
    this.loadMasterData();
  }

  onUserIdChange(value: any): void {
    if (value === null || value === undefined) {
      this.searchParams.userId = 0;
    }
    this.onSearch();
  }

  onReset(): void {
    this.searchParams = {
      keyword: '',
      userId: 0
    };
    this.loadMasterData();
  }

  onAdd(): void {
    const modalRef = this.ngbModal.open(UserGroupFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
    modalRef.result.then(
      (res) => { if (res === 'save') this.loadMasterData(); },
      () => { }
    );
  }

  onEdit(): void {
    if (!this.selectedGroup) return;
    const modalRef = this.ngbModal.open(UserGroupFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.dataInput = this.selectedGroup;
    modalRef.result.then(
      (res) => { if (res === 'save') this.loadMasterData(); },
      () => { }
    );
  }

  onAssignPermissions(): void {
    if (!this.selectedGroup) return;
    const modalRef = this.ngbModal.open(UserGroupDistributionFormComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.groupId = this.selectedGroup.ID;
    modalRef.componentInstance.groupName = this.selectedGroup.Name;
    modalRef.result.then(
      (res) => { if (res === 'save') this.loadDetails(this.selectedGroup.ID); },
      () => { }
    );
  }

  onCopyPermissions(): void {
    const modalRef = this.ngbModal.open(UserGroupCopyDistributionFormComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.employeeList = this.employeeList;
    modalRef.result.then(
      (res) => { if (res === 'save') this.loadMasterData(); },
      () => { }
    );
  }

  onDelete(): void {
    if (!this.selectedGroup) return;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa nhóm <b>${this.selectedGroup.Name}</b> không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.userGroupService.delete(this.selectedGroup.ID).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
            this.loadMasterData();
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  onAddUsers(): void {
    if (!this.selectedGroupId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhóm trước');
      return;
    }

    const modalRef = this.ngbModal.open(UserGroupEmployeeSelectTableComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.employeeList = [...this.employeeList];
    modalRef.componentInstance.selectedEmployeeIds = this.datasetUsers.map(u => u.UserID);

    modalRef.result.then(
      (selectedEmployees: any[]) => {
        if (selectedEmployees && selectedEmployees.length > 0) {
          const userIds = selectedEmployees.map(x => x.UserID || x.ID).join(';');
          this.userGroupService.addUsersToGroup(userIds, this.selectedGroupId).subscribe({
            next: () => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Thêm người dùng thành công');
              this.loadDetails(this.selectedGroupId);
            },
            error: (err: any) => this.showError(err)
          });
        }
      },
      () => { }
    );
  }

  onDeleteUser(data: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Xóa người dùng <b>${data.EmployeeName || data.FullName}</b> khỏi nhóm <b>${this.selectedGroup.Name}</b> ?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.userGroupService.deleteLink(data.ID).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa liên kết');
            this.loadDetails(this.selectedGroupId);
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  toggleSearchPanel(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  ToggleSearchPanelNew(e?: Event): void {
    if (e) e.stopPropagation();
    this.showSearchBar = !this.showSearchBar;
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}
