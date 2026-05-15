import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserGroupService } from '../user-group.service';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TreeNode } from 'primeng/api';
import { TreeTableModule, TreeTable } from 'primeng/treetable';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-user-group-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzNotificationModule,
    NzModalModule,
    NzSpinModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    TreeTableModule,
    TableModule,
    InputTextModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './user-group-search.component.html',
  styleUrls: ['./user-group-search.component.css']
})
export class UserGroupSearchComponent implements OnInit {
  @ViewChild('tt') treeTable!: TreeTable;

  loading = false;
  treeNodes: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  datasetEmployees: any[] = [];
  selectedGroupId: number | null = null;

  constructor(
    private userGroupService: UserGroupService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading = true;
    this.userGroupService.getTree().subscribe({
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

  buildTree(data: any[]): TreeNode[] {
    const tree: TreeNode[] = [];
    const map = new Map<string, TreeNode>();

    // First pass: Create all nodes (Using Type + ID to ensure unique keys)
    data.forEach(item => {
      const key = `${item.Type}_${item.ID}`;
      const node: TreeNode = {
        data: item,
        children: [],
        expanded: false
      };
      map.set(key, node);
    });

    // Second pass: Link parents
    data.forEach(item => {
      const key = `${item.Type}_${item.ID}`;
      const node = map.get(key)!;
      if (item.ParentID !== null) {
        const parentKey = `GROUP_${item.ParentID}`;
        if (map.has(parentKey)) {
          map.get(parentKey)!.children!.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  onNodeSelect(event: any): void {
    const data = event.node.data;
    if (data.Type === 'GROUP') {
      this.selectedGroupId = data.ID;
      this.loadEmployees(data.ID);
    } else {
      this.selectedGroupId = null;
      this.datasetEmployees = [];
    }
  }

  onNodeUnselect(): void {
    this.selectedGroupId = null;
    this.datasetEmployees = [];
  }

  loadEmployees(groupId: number): void {
    this.loading = true;
    this.userGroupService.getGroupLinks(groupId).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.datasetEmployees = res.data || [];
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  onDeleteUser(item: any): void {
    if (!this.selectedGroupId) return;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Xóa người dùng <b>${item.FullName}</b> khỏi nhóm quyền?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.userGroupService.deleteLink(item.ID).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa nhân viên ${item.FullName} khỏi nhóm quyền`);
            this.loadEmployees(this.selectedGroupId!);
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  showError(err: any): void {
    this.notification.error('Lỗi', err?.error?.message || err.message);
  }
}
