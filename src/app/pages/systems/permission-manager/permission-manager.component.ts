import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TableModule } from 'primeng/table';
import { TreeNode, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { SplitterModule } from 'primeng/splitter';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { PermissionManagerService } from './permission-manager.service';
import { PermissionManagerGroupFormComponent } from './permission-manager-group-form/permission-manager-group-form.component';
import { PermissionManagerFunctionFormComponent } from './permission-manager-function-form/permission-manager-function-form.component';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-permission-manager',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzButtonModule,
    NzNotificationModule,
    NzGridModule,
    NzTagModule,
    TreeTableModule,
    TableModule,
    NgbModalModule,
    Menubar,
    NzInputModule,
    FormsModule,
    SplitterModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './permission-manager.component.html',
  styleUrls: ['./permission-manager.component.css']
})
export class PermissionManagerComponent implements OnInit {

  // Master state
  groupList: any[] = [];
  groupTree: TreeNode[] = [];
  selectedGroupNodes: TreeNode[] = []; // Changed to array for checkbox selection
  selectedGroupNode: TreeNode | null = null; // Still needed to keep track of the "last/active" selected group for Detail panel

  // Detail state
  functionList: any[] = [];
  selectedFunction: any = null;

  // UI state
  loadingGroups = false;
  loadingFunctions = false;
  searchGroupText = '';
  searchFunctionText = '';

  // Menubars
  menuBarsGroup: MenuItem[] = [];
  menuBarsFunction: MenuItem[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionManagerService,
    private permissinSv: PermissionService
  ) { }

  ngOnInit(): void {
    this.initMenuBars();
    this.loadGroups();
  }

  // ============================================================
  // INIT MENUBARS
  // ============================================================

  initMenuBars(): void {
    this.menuBarsGroup = [
      {
        label: 'Thêm nhóm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.openAddGroupModal(),
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Sửa nhóm',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        disabled: true,
        command: () => this.openEditGroupModal(),
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Xóa nhóm',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        disabled: true,
        command: () => this.openDeleteGroup(),
        visible: this.permissinSv.hasPermission("N1999"),
      }
    ];

    this.menuBarsFunction = [
      {
        label: 'Thêm chức năng',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        disabled: true,
        command: () => this.openAddFunctionModal(),
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Sửa chức năng',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        disabled: true,
        command: () => this.openEditFunctionModal(),
        visible: this.permissinSv.hasPermission("N1999"),
      },
      {
        label: 'Xóa chức năng',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        disabled: true,
        command: () => this.openDeleteFunction(),
        visible: this.permissinSv.hasPermission("N1999"),
      }
    ];
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

  loadGroups(): void {
    this.loadingGroups = true;
    this.permissionService.getGroups().subscribe({
      next: (res: any) => {
        this.groupList = res.data || [];
        this.groupTree = this.buildGroupTree(this.groupList);
        this.selectedGroupNodes = [];
        this.selectedGroupNode = null;
        this.functionList = [];
        this.selectedFunction = null;
        this.resetMenuBars();
        this.loadingGroups = false;
      },
      error: (err: any) => {
        this.loadingGroups = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  loadFunctions(groupId: number): void {
    this.loadingFunctions = true;
    this.permissionService.getFunctionsByGroup(groupId).subscribe({
      next: (res: any) => {
        this.functionList = res.data || [];
        this.selectedFunction = null;
        this.menuBarsFunction[1].disabled = true;
        this.menuBarsFunction[2].disabled = true;
        this.menuBarsFunction = [...this.menuBarsFunction];
        this.loadingFunctions = false;
      },
      error: (err: any) => {
        this.loadingFunctions = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  // ============================================================
  // BUILD TREE
  // ============================================================

  buildGroupTree(groups: any[]): TreeNode[] {
    const map = new Map<number, TreeNode>();

    // Step 1: Create a node for every group
    groups.forEach(g => map.set(g.ID, {
      data: g,
      children: [],
      expanded: false,
      leaf: false
    }));

    const roots: TreeNode[] = [];

    // Step 2: Wire parent-child relationships
    // ParentID = null or 0 means root node
    groups.forEach(g => {
      const node = map.get(g.ID)!;
      const parentId = g.ParentID;
      if (parentId && parentId !== 0 && map.has(parentId)) {
        map.get(parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Step 3: Mark leaf nodes (no children)
    map.forEach(node => {
      if (!node.children || node.children.length === 0) {
        node.leaf = true;
      }
    });

    return [...roots]; // new reference to trigger Angular change detection
  }


  // ============================================================
  // TREE NODE EVENTS
  // ============================================================

  onNodeSelect(event: any): void {
    // This is called when the checkbox is clicked
    this.selectedGroupNode = event.node;
    this.loadFunctions(event.node.data.ID);
    this.resetMenuBars();
  }

  // Row activation for details (independent of checkbox)
  setActiveNode(node: TreeNode): void {
    this.selectedGroupNode = node;

    // Auto-select the checkbox on row click
    let currentSelection = [...(this.selectedGroupNodes || [])];
    const index = currentSelection.indexOf(node);

    if (index === -1) {
      currentSelection.push(node);
    } else {
      currentSelection.splice(index, 1);
    }

    this.selectedGroupNodes = currentSelection;

    this.loadFunctions(node.data.ID);
    this.resetMenuBars();

    // Force UI refresh to show checkbox state immediately
    this.cdr.detectChanges();
  }

  onNodeUnselect(): void {
    if (!this.selectedGroupNodes || this.selectedGroupNodes.length === 0) {
      this.selectedGroupNode = null;
      this.functionList = [];
      this.selectedFunction = null;
      this.resetMenuBars();
    }
  }

  resetMenuBars(): void {
    const groupSelected = !!this.selectedGroupNode;
    const functionSelected = !!this.selectedFunction;

    // Group buttons
    this.menuBarsGroup[1].disabled = !groupSelected; // Edit
    this.menuBarsGroup[2].disabled = !groupSelected; // Delete

    // Function buttons
    this.menuBarsFunction[0].disabled = !groupSelected; // Add
    this.menuBarsFunction[1].disabled = !functionSelected; // Edit
    this.menuBarsFunction[2].disabled = !functionSelected; // Delete

    // Trigger change detection for PrimeNG Menubar
    this.menuBarsGroup = [...this.menuBarsGroup];
    this.menuBarsFunction = [...this.menuBarsFunction];
  }

  onFunctionSelect(event: any): void {
    this.selectedFunction = event.data;
    this.resetMenuBars();
  }

  onFunctionUnselect(): void {
    this.selectedFunction = null;
    this.resetMenuBars();
  }

  // ============================================================
  // GROUP MODALS
  // ============================================================

  openAddGroupModal(): void {
    const modalRef = this.ngbModal.open(PermissionManagerGroupFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.groupList = this.groupList;

    modalRef.result.then(
      (result) => { if (result === 'save') this.loadGroups(); },
      () => { }
    );
  }

  openEditGroupModal(): void {
    if (!this.selectedGroupNode) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhóm cần sửa');
      return;
    }

    const modalRef = this.ngbModal.open(PermissionManagerGroupFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.selectedGroupNode.data;
    modalRef.componentInstance.groupList = this.groupList;

    modalRef.result.then(
      (result) => { if (result === 'save') this.loadGroups(); },
      () => { }
    );
  }

  openDeleteGroup(): void {
    if (!this.selectedGroupNode) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhóm cần xóa');
      return;
    }

    if (this.selectedGroupNode.children && this.selectedGroupNode.children.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể xóa nhóm cha. Vui lòng xóa các nhóm con trước.');
      return;
    }

    const data = this.selectedGroupNode.data;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa nhóm <b>${data.Name}</b> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.permissionService.saveGroup({ ...data, IsHide: true }).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa nhóm chức năng thành công');
            this.loadGroups();
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          }
        });
      }
    });
  }

  // ============================================================
  // FUNCTION MODALS
  // ============================================================

  openAddFunctionModal(): void {
    if (!this.selectedGroupNode) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhóm để thêm chức năng');
      return;
    }

    const modalRef = this.ngbModal.open(PermissionManagerFunctionFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.groupId = this.selectedGroupNode.data.ID;
    modalRef.componentInstance.groupList = this.groupList;

    modalRef.result.then(
      (result) => {
        if (result === 'save') this.loadFunctions(this.selectedGroupNode!.data.ID);
      },
      () => { }
    );
  }

  openEditFunctionModal(): void {
    if (!this.selectedFunction) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chức năng cần sửa');
      return;
    }

    const modalRef = this.ngbModal.open(PermissionManagerFunctionFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.selectedFunction;
    modalRef.componentInstance.groupId = this.selectedGroupNode!.data.ID;
    modalRef.componentInstance.groupList = this.groupList;

    modalRef.result.then(
      (result) => {
        if (result === 'save') this.loadFunctions(this.selectedGroupNode!.data.ID);
      },
      () => { }
    );
  }

  openDeleteFunction(): void {
    if (!this.selectedFunction) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chức năng cần xóa');
      return;
    }

    const fn = this.selectedFunction;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa chức năng <b>${fn.Name}</b> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.permissionService.saveFunction({ ...fn, IsHide: true }).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa chức năng thành công');
            this.loadFunctions(this.selectedGroupNode!.data.ID);
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          }
        });
      }
    });
  }
}
