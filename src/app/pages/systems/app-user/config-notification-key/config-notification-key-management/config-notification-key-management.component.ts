import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ConfigNotificationService } from '../config-notification-service/config-notification.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { MenubarModule } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigNotificationKeyFormComponent } from '../config-notification-key-form/config-notification-key-form.component';

@Component({
  selector: 'app-config-notification-key-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, MenubarModule, 
    NzButtonModule, NzIconModule, NzInputModule, NzGridModule, 
    NzFormModule, NzSpinModule, NzModalModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './config-notification-key-management.component.html',
  styleUrl: './config-notification-key-management.component.css'
})
export class ConfigNotificationKeyManagementComponent implements OnInit {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  searchKeyword: string = '';
  showSearchBar: boolean = true;

  columns = [
    { field: 'KeyCode', header: 'Mã Key', width: '20%' },
    { field: 'KeyName', header: 'Tên Key', width: '30%' },
    { field: 'KeyContent', header: 'Nội dung', width: '50%' }
  ];

  constructor(
    private service: ConfigNotificationService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadData();
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm mới',
        icon: 'fa-solid fa-circle-plus text-primary',
        command: () => this.onAdd()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen text-warning',
        command: () => this.onEdit(),
        disabled: this.selectedItems.length !== 1
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash text-danger',
        command: () => this.onDelete(),
        disabled: this.selectedItems.length === 0
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => this.loadData()
      }
    ];
  }

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Sửa') {
        return { ...item, disabled: this.selectedItems.length !== 1 };
      }
      if (item.label === 'Xóa') {
        return { ...item, disabled: this.selectedItems.length === 0 };
      }
      return item;
    });
  }

  loadData(): void {
    this.loading = true;
    this.service.getConfigNotification().subscribe({
      next: (res: any) => {
        this.dataset = res.data || [];
        this.selectedItems = [];
        this.onSearch();
        this.loading = false;
        this.updateMenuState();
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  onSearch(): void {
    if (!this.searchKeyword || this.searchKeyword.trim() === '') {
      this.filteredDataset = [...this.dataset];
    } else {
      const keyword = this.searchKeyword.toLowerCase().trim();
      this.filteredDataset = this.dataset.filter(x => 
        (x.KeyCode && x.KeyCode.toLowerCase().includes(keyword)) ||
        (x.KeyName && x.KeyName.toLowerCase().includes(keyword)) ||
        (x.KeyContent && x.KeyContent.toLowerCase().includes(keyword))
      );
    }
  }

  onReset(): void {
    this.searchKeyword = '';
    this.onSearch();
  }

  onAdd(): void {
    const modalRef = this.ngbModal.open(ConfigNotificationKeyFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = null;

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      () => { this.loadData(); }
    );
  }

  onEdit(): void {
    if (this.selectedItems.length !== 1) return;
    
    const modalRef = this.ngbModal.open(ConfigNotificationKeyFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.selectedItems[0];

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      () => { }
    );
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;

    const idsToDelete = this.selectedItems.map(x => x.ID);

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${this.selectedItems.length} bản ghi đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.loading = true;
        this.service.deleteConfigNotification(idsToDelete).subscribe({
          next: (res: any) => {
            this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Xóa thành công');
            this.loadData();
          },
          error: (err: any) => {
            this.loading = false;
            this.showError(err);
          }
        });
      }
    });
  }

  toggleSearchPanel(): void {
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
