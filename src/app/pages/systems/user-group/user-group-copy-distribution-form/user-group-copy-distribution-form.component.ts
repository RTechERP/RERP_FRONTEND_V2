import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { UserGroupService } from '../user-group.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-user-group-copy-distribution-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSpinModule,
    NzSelectModule,
    TableModule
  ],
  templateUrl: './user-group-copy-distribution-form.component.html',
  styleUrls: ['./user-group-copy-distribution-form.component.css']
})
export class UserGroupCopyDistributionFormComponent implements OnInit {
  @Input() employeeList: any[] = [];
  groupedEmployees: any[] = [];
  
  fromUserId: number | null = null;
  toUserId: number | null = null;
  
  loading = false;
  groups: any[] = [];
  selectedGroups: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private userGroupService: UserGroupService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.groupDropdownEmployees(this.employeeList);
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

  onFromUserChange(): void {
    if (!this.fromUserId) {
      this.groups = [];
      this.selectedGroups = [];
      return;
    }

    this.loading = true;
    this.userGroupService.getGroupsByUser(this.fromUserId).subscribe({
      next: (res: any) => {
        this.loading = false;
        // Group logic to prevent duplicates in table if spGetUserGroupIdByUserID returns multiple functions for same role
        const data = res.data || [];
        const uniqueGroupsMap = new Map();
        for (const item of data) {
            if (!uniqueGroupsMap.has(item.RoleID)) {
                uniqueGroupsMap.set(item.RoleID, { RoleID: item.RoleID, Name: item.Name, Functions: item.Functions });
            } else {
                const existing = uniqueGroupsMap.get(item.RoleID);
                existing.Functions += ', ' + item.Functions;
            }
        }
        this.groups = Array.from(uniqueGroupsMap.values());
        this.selectedGroups = [...this.groups];
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || err.message
        );
      }
    });
  }

  onSave(): void {
    if (!this.toUserId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên đích (Đến nhân viên).');
      return;
    }

    if (this.fromUserId === this.toUserId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Nhân viên nguồn và đích không được trùng nhau.');
      return;
    }

    if (!this.selectedGroups || this.selectedGroups.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một quyền để copy.');
      return;
    }

    const payload = {
      ToUserID: this.toUserId,
      RoleIDs: this.selectedGroups.map(g => g.RoleID)
    };

    this.loading = true;
    this.userGroupService.copyUserGroups(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Copy quyền thành công.');
        this.activeModal.close('save');
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || err.message
        );
      }
    });
  }
}
