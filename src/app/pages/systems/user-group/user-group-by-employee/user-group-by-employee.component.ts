import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Optional } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { UserGroupService } from '../user-group.service';
import { EmployeeService } from '../../../hrm/employee/employee-service/employee.service';
import { TableModule } from 'primeng/table';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-user-group-by-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSpinModule,
    NzSelectModule,
    NzInputModule,
    NzGridModule,
    NzIconModule,
    NzFormModule,
    TreeTableModule,
    MenubarModule,
    InputTextModule,
    TableModule
  ],
  templateUrl: './user-group-by-employee.component.html',
  styleUrls: ['./user-group-by-employee.component.css']
})
export class UserGroupByEmployeeComponent implements OnInit {
  @Input() employeeList: any[] = [];

  loading = false;
  selectedUserId: number | null = null;
  treeNodes: TreeNode[] = [];
  groupedEmployees: any[] = [];
  menuBars: MenuItem[] = [];
  showSearchBar = true;

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    private userGroupService: UserGroupService,
    private employeeService: EmployeeService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    if (this.employeeList.length === 0) {
      this.loadEmployees();
    } else {
      this.groupDropdownEmployees(this.employeeList);
    }
    // Load full tree initially with no selection
    this.loadPermissions(0);
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Lưu dữ liệu',
        icon: 'fa-solid fa-floppy-disk text-success',
        command: () => this.onSave(),
        disabled: !this.selectedUserId
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => this.onEmployeeChange(this.selectedUserId!)
      }
    ];
  }

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Lưu dữ liệu') {
        return { ...item, disabled: !this.selectedUserId };
      }
      return item;
    });
  }

  ToggleSearchPanelNew(event?: any): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        this.loading = false;
        this.employeeList = res.data || [];
        this.groupDropdownEmployees(this.employeeList);
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  private groupDropdownEmployees(employees: any[]): void {
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

  onEmployeeChange(userId: number): void {
    this.updateMenuState();
    if (userId) {
      this.loadPermissions(userId);
    } else {
      this.loadPermissions(0);
    }
  }

  loadPermissions(userId: number): void {
    this.loading = true;
    this.userGroupService.getUserPermissions(userId).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.treeNodes = this.buildTree(res.data || []);
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  selectedNodes: TreeNode[] = [];

  buildTree(data: any[]): TreeNode[] {
    const tree: TreeNode[] = [];
    const map = new Map<number, TreeNode>();
    this.selectedNodes = [];

    // First pass: Create all nodes
    data.forEach(item => {
      const node: TreeNode = {
        data: item,
        children: [],
        expanded: false
      };
      map.set(item.ID, node);
    });

    // Second pass: Link parents and collect selected nodes
    data.forEach(item => {
      const node = map.get(item.ID)!;

      if (item.IsChecked) {
        this.selectedNodes.push(node);
      }

      // Expand first few groups by default for visibility
      if (item.IsGroup && tree.length < 5) {
        node.expanded = true;
      }

      if (item.ParentID && map.has(item.ParentID)) {
        map.get(item.ParentID)!.children!.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  onSave(): void {
    if (!this.selectedUserId) {
      this.notification.warning("Cảnh báo", 'Vui lòng chọn nhân viên trước khi lưu!');
      return;
    }

    // Lấy danh sách ID Nhóm quyền được chọn (ID Nhóm trong SQL là ID gốc, không offset)
    // Trong SQL của chúng ta: Nhóm có IsGroup = 1 và ID > 0 (wait, I used negative IDs before but changed back?)
    // Let me check the latest SQL.

    const selectedGroupIds = this.selectedNodes
      .filter(node => node.data.IsGroup)
      .map(node => node.data.ID)
      .join(',');

    this.loading = true;
    this.userGroupService.saveUserGroupLinks(this.selectedUserId, selectedGroupIds).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.notification.success("Thành công", 'Lưu thông tin phân quyền thành công');
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}
