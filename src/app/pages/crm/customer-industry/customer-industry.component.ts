import { Component, OnInit } from '@angular/core';
import { CustomTable } from '../../../shared/custom-table';
import { ColumnDef } from '../../../shared/custom-table/column-def.model';
import { CustomTreeTable } from '../../../shared/custom-tree-table/custom-tree-table';
import { TreeColumnDef } from '../../../shared/custom-tree-table/tree-column-def.model';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TreeNode } from 'primeng/api';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';
import { CustomerIndustryService } from './customer-industry-service/customer-industry.service';
import { CustomerIndustryFormComponent } from './customer-industry-form/customer-industry-form.component';

@Component({
  selector: 'app-customer-industry',
  standalone: true,
  imports: [
    CustomTable,
    NzSplitterModule,
    NgbModalModule,
    NzIconModule,
    NzButtonModule,
    HasPermissionDirective,
    FormsModule,
    NzFormModule,
    NzModalModule,
    Menubar,
  ],
  templateUrl: './customer-industry.component.html',
  styleUrl: './customer-industry.component.css',
})
export class CustomerIndustryComponent implements OnInit {
  data: any[] = [];
  loading: boolean = false;
  selectedCustomer: any;
  selectedCustomerIndustry: any = null;
  menuBarsCustomer: MenuItem[] = [];
  pageSize: number = 20;
  pageSizeOptions: number[] = [20, 50, 100];


  constructor(
    private customerIndustryService: CustomerIndustryService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private permissionService: PermissionService,
    public activeModal: NgbActiveModal,
  ) { }

    columns: ColumnDef[] = [
      {
      field: 'STT',
      header: 'STT',
      sortable: true,
      filterType: 'text',
      width: '100px'
    },
    {
      field: 'IndustriesNameVI',
      header: 'Tên tiếng việt',
      width: '250px',
      sortable: true,
      filterType: 'text',
    },
    {
      field: 'IndustriesNameEN',
      header: 'Tên tiếng anh',
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

    initMenuBars() {
    this.menuBarsCustomer = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N13,N1,N27,N31'),
        command: () => {
          this.onAddCustomerIndustry();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N13,N1,N27,N31'),
        command: () => {
          this.onEditCustomerIndustry();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N13,N1,N27,N31'),
        command: () => {
          this.onDeleteCustomerIndustry();
        },
      },
    ];
  }

  ngOnInit(): void {
    this.getCustomerIndustry();
    this.initMenuBars();
  }

  closeModal(): void {
    this.activeModal.close();
  }

  getCustomerIndustry() : void {
    this.customerIndustryService.getCustomerIndustry().subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.loading = false;
        console.log("hehe:", this.data)
      },
      error: () => {
        this.data = [],
        this.loading = false
      }
    })
  }

   onCustomerClick(rowData: any): void {
    const customerIndustryID = rowData.ID || 0;
    this.selectedCustomer = rowData;
  }

    onAddCustomerIndustry() {
      const modalRef = this.modalService.open(
        CustomerIndustryFormComponent,
        {
          centered: true,
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
        },
      );
      modalRef.componentInstance.isEditMode = false;
  
      modalRef.result
        .then((result) => {
          if (result) this.getCustomerIndustry();
        })
        .catch(() => { });
    }
  
    onEditCustomerIndustry() {
      if (
        !this.selectedCustomer ||
        this.selectedCustomer.length === 0
      ) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn 1 bản ghi để sửa!',
        );
        return;
      }
      if (this.selectedCustomer.length > 1) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Chỉ được phép chọn 1 bản ghi để sửa!',
        );
        return;
      }
      const modalRef = this.modalService.open(
        CustomerIndustryFormComponent,
        {
          centered: true,
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
        },
      );
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.data = this.selectedCustomer[0];
  
      modalRef.result
        .then((result) => {
          if (result) this.getCustomerIndustry();
        })
        .catch(() => { });
    }
  
    onDeleteCustomerIndustry() {
      if (
        !this.selectedCustomer ||
        this.selectedCustomer.length === 0
      ) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn ít nhất 1 bản ghi để xóa!',
        );
        return;
      }
  
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedCustomer.length} bản ghi đã chọn?`,
        nzOkText: 'Đồng ý',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          const ids = this.selectedCustomer.map((x: any) => x.ID);
          this.customerIndustryService
            .deleteCustomerIndustr(ids)
            .subscribe({
              next: (res: any) => {
                this.notification.success(
                  NOTIFICATION_TITLE.success,
                  'Xóa thành công!',
                );
                this.selectedCustomer = [];
                this.getCustomerIndustry();
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
