import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import Swal from 'sweetalert2';
import { UserManagementService } from './user-management.service';
import { UserManagementDetailComponent } from './user-management-detail/user-management-detail.component';
import { PermissionService } from '../../../services/permission.service';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzFormModule,
    NzSelectModule,
    NzTagModule,
    NzSpinModule,
    MenubarModule,
    TableModule,
    CheckboxModule,
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  isLoading = false;
  tableData: any[] = [];
  selectedUsers: any[] = [];
  searchKeyword = '';
  menuBars: MenuItem[] = [];

  statusOptions = [
    { value: 2, label: 'Tất cả' },
    { value: 1, label: 'Khóa' },
    { value: 0, label: 'Hoạt động' },
    { value: -1, label: 'Chưa kích hoạt' }
  ];
  selectedStatus: number = 2;

  private sortClickCount: { [key: string]: number } = {};
  private sortClickTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private userService: UserManagementService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private notification: NzNotificationService,
    private permissionService: PermissionService,
  ) { }

  ngOnInit(): void {
    this.initMenu();

    this.route.queryParams.subscribe(params => {
      if (params['status'] !== undefined) {
        this.selectedStatus = Number(params['status']);
      }
      this.loadUsers();
    });
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onAdd(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onEdit(),
        disabled: this.selectedUsers.length !== 1,
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onDeleteMultiple(),
        disabled: this.selectedUsers.length === 0,
      },
      {
        label: 'Kích hoạt',
        icon: 'fa-solid fa-check-circle',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onActivateMultiple(),
        disabled: this.selectedUsers.length === 0,
      },
      {
        label: 'Khóa',
        icon: 'fa-solid fa-ban',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onDeactivateMultiple(),
        disabled: this.selectedUsers.length === 0,
      },
      {
        label: 'Mở khóa',
        icon: 'fa-solid fa-unlock',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onUnlockMultiple(),
        disabled: this.selectedUsers.length === 0,
      },
      {
        label: 'Reset mật khẩu',
        icon: 'fa-solid fa-key',
        visible: this.permissionService.hasPermission('N96'),
        command: () => this.onResetPasswordMultiple(),
        disabled: this.selectedUsers.length === 0,
      },
    ];
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAll(this.searchKeyword, this.selectedStatus).subscribe({
      next: (response: any) => {
        this.tableData = response.data || [];
        let isN96 = this.permissionService.hasPermission('N96');
        if (!isN96) {
          this.tableData = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải danh sách users');
      }
    });
  }

  onSearch(): void {
    this.loadUsers();
  }

  onAdd(): void {
    const modalRef = this.modalService.open(UserManagementDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  onEdit(): void {
    if (this.selectedUsers.length !== 1) return;

    const modalRef = this.modalService.open(UserManagementDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userData = this.selectedUsers[0];

    modalRef.result.then((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  onDeleteMultiple(): void {
    if (this.selectedUsers.length === 0) return;

    const count = this.selectedUsers.length;
    const names = this.selectedUsers.map(u => u.FullName).join(', ');

    Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa',
      html: `Bạn có chắc chắn muốn xóa <b>${count}</b> user(s)?<br/><br/><b>${names}</b>`,
      confirmButtonText: 'Xóa',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Hủy',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = this.selectedUsers.map(u => u.ID);
        this.userService.delete(ids).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              this.notification.success('Thành công', res.message || 'Xóa thành công');
              this.selectedUsers = [];
              this.loadUsers();
            } else {
              this.notification.error('Lỗi', res.message || 'Xóa thất bại');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Không thể xóa users');
          }
        });
      }
    });
  }

  onActivateMultiple(): void {
    const usersToActivate = this.selectedUsers.filter(u => u.Status === -1);
    if (usersToActivate.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có user nào ở trạng thái "Chưa kích hoạt" để kích hoạt');
      return;
    }

    const ids = usersToActivate.map(u => u.ID);
    this.userService.activate(ids).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.notification.success('Thành công', res.message || 'Kích hoạt thành công');
          this.loadUsers();
        } else {
          this.notification.error('Lỗi', res.message || 'Kích hoạt thất bại');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể kích hoạt users');
      }
    });
  }

  onDeactivateMultiple(): void {
    const usersToDeactivate = this.selectedUsers.filter(u => u.Status === 0);
    if (usersToDeactivate.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có user nào ở trạng thái "Hoạt động" để khóa');
      return;
    }

    const count = usersToDeactivate.length;

    Swal.fire({
      icon: 'warning',
      title: 'Xác nhận khóa',
      html: `Bạn có chắc chắn muốn khóa <b>${count}</b> user(s)?`,
      confirmButtonText: 'Khóa',
      confirmButtonColor: '#f39c12',
      cancelButtonText: 'Hủy',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = usersToDeactivate.map(u => u.ID);
        this.userService.deactivate(ids).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              this.notification.success('Thành công', res.message || 'Khóa thành công');
              this.loadUsers();
            } else {
              this.notification.error('Lỗi', res.message || 'Khóa thất bại');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Không thể khóa users');
          }
        });
      }
    });
  }

  onUnlockMultiple(): void {
    const usersToUnlock = this.selectedUsers.filter(u => u.Status === 1);
    if (usersToUnlock.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có user nào ở trạng thái "Khóa" để mở khóa');
      return;
    }

    const ids = usersToUnlock.map(u => u.ID);
    this.userService.unlock(ids).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.notification.success('Thành công', res.message || 'Mở khóa thành công');
          this.loadUsers();
        } else {
          this.notification.error('Lỗi', res.message || 'Mở khóa thất bại');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể mở khóa users');
      }
    });
  }

  onResetPasswordMultiple(): void {
    if (this.selectedUsers.length === 0) return;

    const count = this.selectedUsers.length;

    Swal.fire({
      icon: 'warning',
      title: 'Xác nhận reset mật khẩu',
      html: `Bạn có chắc chắn muốn reset mật khẩu của <b>${count}</b> user(s)?`,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#007bff',
      cancelButtonText: 'Hủy',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = this.selectedUsers.map(u => u.ID);
        this.userService.resetPassword(ids).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công',
                html: `Reset mật khẩu thành công!<br>Mật khẩu mới là: <b>RTCTechnology</b>`,
                confirmButtonText: 'OK',
              });
              this.loadUsers();
            } else {
              this.notification.error('Lỗi', res.message || 'Reset mật khẩu thất bại');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Không thể reset mật khẩu');
          }
        });
      }
    });
  }

  onRowDoubleClick(row: any): void {
    this.selectedUsers = [row];
    this.onEdit();
  }

  onRowSelect(event: any): void {
    this.updateMenuState();
  }

  onRowUnselect(event: any): void {
    this.updateMenuState();
  }

  onHeaderCheckboxToggle(event: any): void {
    this.updateMenuState();
  }

  private updateMenuState(): void {
    const hasSelection = this.selectedUsers.length > 0;
    const hasSingleSelection = this.selectedUsers.length === 1;
    this.menuBars.forEach(item => {
      if (item.label === 'Sửa') {
        item.disabled = !hasSingleSelection;
      }
      if (['Xóa', 'Kích hoạt', 'Khóa', 'Mở khóa', 'Reset mật khẩu'].includes(item.label || '')) {
        item.disabled = !hasSelection;
      }
    });
  }

  onSort(event: any): void {
    const field = event.field;
    if (!field) return;

    this.sortClickCount[field] = (this.sortClickCount[field] || 0) + 1;

    clearTimeout(this.sortClickTimeout);
    this.sortClickTimeout = setTimeout(() => {
      if (this.sortClickCount[field] >= 3) {
        const table = this.dt;
        if (table && table.filters) {
          table.filters[field] = { value: null, matchMode: undefined };
          table.reset();
        }
        this.sortClickCount[field] = 0;
      }
      this.sortClickCount = {};
    }, 400);
  }
}
