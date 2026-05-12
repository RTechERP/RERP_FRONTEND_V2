import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { UserGroupService } from '../user-group.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-user-group-distribution-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSpinModule,
    NzSelectModule,
    NzInputModule,
    TreeTableModule
  ],
  templateUrl: './user-group-distribution-form.component.html',
  styleUrls: ['./user-group-distribution-form.component.css']
})
export class UserGroupDistributionFormComponent implements OnInit {
  @Input() groupId!: number;
  @Input() groupName: string = '';

  loading = false;
  flattenData: any[] = [];
  treeNodes: TreeNode[] = [];
  userGroups: any[] = [];
  currentGroupId!: number;

  constructor(
    public activeModal: NgbActiveModal,
    private userGroupService: UserGroupService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.currentGroupId = this.groupId;
    this.loadUserGroups();
    this.loadData();
  }

  loadUserGroups(): void {
    this.userGroupService.getAll().subscribe({
      next: (res: any) => {
        this.userGroups = res.data || [];
      },
      error: (err: any) => {
        console.error('Failed to load user groups', err);
      }
    });
  }

  onGroupChange(newGroupId: number): void {
    if (newGroupId) {
      this.currentGroupId = newGroupId;
      const selectedGroup = this.userGroups.find(g => g.ID === newGroupId);
      if (selectedGroup) {
        this.groupName = selectedGroup.Name;
      }
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.userGroupService.getGroupPermissionTree(this.currentGroupId).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.flattenData = res.data || [];
        this.treeNodes = this.buildTree(this.flattenData);
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

  buildTree(items: any[]): TreeNode[] {
    const tree: TreeNode[] = [];
    const map: { [key: number]: TreeNode } = {};

    items.forEach(item => {
      const node: TreeNode = {
        data: item,
        children: [],
        expanded: true
      };
      map[item.ID] = node;
    });

    items.forEach(item => {
      if (item.ParentID && map[item.ParentID]) {
        map[item.ID].parent = map[item.ParentID];
        map[item.ParentID].children!.push(map[item.ID]);
      } else {
        tree.push(map[item.ID]);
      }
    });

    // Cập nhật trạng thái cha lúc đổ dữ liệu lên: nếu các con đều tick thì cha cũng tick
    const checkNodesBottomUp = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          checkNodesBottomUp(node.children);
          const allChildrenChecked = node.children.every(child => child.data.IsCheck);
          node.data.IsCheck = allChildrenChecked;
        }
      });
    };
    checkNodesBottomUp(tree);

    return tree;
  }

  onCheckboxChange(rowNode: any): void {
    const isChecked = rowNode.node.data.IsCheck;
    this.cascadeCheckDown(rowNode.node, isChecked);
    this.cascadeCheckUp(rowNode.node);
  }

  cascadeCheckDown(node: TreeNode, isChecked: boolean) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        child.data.IsCheck = isChecked;
        this.cascadeCheckDown(child, isChecked);
      });
    }
  }

  cascadeCheckUp(node: TreeNode) {
    if (node.parent) {
      const parent = node.parent;
      const allChildrenChecked = parent.children!.every(child => child.data.IsCheck);
      parent.data.IsCheck = allChildrenChecked;
      this.cascadeCheckUp(parent);
    }
  }

  onSave(): void {
    const permissionsToSave = this.flattenData
      .filter(item => item.IsCheck !== item.IsCheckOld)
      .map(item => ({
        ID: item.ID,
        OldValue: item.IsCheckOld,
        IsChecked: item.IsCheck,
        UserGroupRightDistributionID: item.UserGroupRightDistributionID || 0
      }));

    if (permissionsToSave.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có thay đổi nào để lưu.');
      return;
    }

    const req = {
      UserGroupID: this.currentGroupId,
      Permissions: permissionsToSave
    };

    this.loading = true;
    this.userGroupService.saveGroupPermissions(req).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật phân quyền thành công.');
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
