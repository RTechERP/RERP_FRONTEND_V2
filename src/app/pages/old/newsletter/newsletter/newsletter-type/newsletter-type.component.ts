import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../../../environments/environment';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { PermissionService } from '../../../../../services/permission.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { NewsletterService } from '../newsletter.service';
import { AuthService } from '../../../../../auth/auth.service';
import { MenubarModule } from 'primeng/menubar';
import { PrimeIcons, MenuItem } from 'primeng/api';
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzSpinModule,
    NgIf,
    NzInputNumberModule,
    MenubarModule,

  ],
  templateUrl: './newsletter-type.component.html',
  styleUrl: './newsletter-type.component.css'
})
export class NewsletterTypeComponent implements OnInit, AfterViewInit {

  @ViewChild('tb_newsletter_type', { static: false })
  tb_newsletter_type!: ElementRef;
  private newsletterTypeTabulator!: Tabulator;
  newsletterTypeList: any[] = [];
  private tabulator!: Tabulator;
  searchForm!: FormGroup;
  exportingExcel = false;
  sizeSearch: string = '0';
  isLoading: boolean = false;
  newsletterTypeForm!: FormGroup;
  // Dropdown data for search
  typeList: any[] = [];
  selectedTypeNewsletter: any = null;
  // Data
  overTimeList: any[] = [];
  currentUser: any;
  currenEmployee: any;
  menuBars: MenuItem[] = [
    {
      label: 'Thêm',
      icon: 'fa-solid fa-circle-plus fa-lg text-success',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.openAddModal();
      },
    },

    {
      label: 'Sửa',
      icon: 'fa-solid fa-file-pen fa-lg text-primary',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.openEditModal();
      },
    },
    {
      label: 'Xóa',
      icon: 'fa-solid fa-trash fa-lg text-danger',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.openDeleteModal();
      },
    },
    { separator: true },

    // {
    //   label: 'Xuất Excel',
    //   icon: 'fa-solid fa-file-excel fa-lg text-success',
    //   command: () => {
    //     this.exportToExcel();
    //   }
    // },
  ];
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private authService: AuthService,
    private permissionService: PermissionService,
    private newsletterService: NewsletterService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      this.currenEmployee = Array.isArray(this.currentUser)
        ? this.currentUser[0]
        : this.currentUser;
    });
    this.loadNewsletterType();
  }

  ngAfterViewInit(): void {
    this.newsletterTypeTable(this.tb_newsletter_type.nativeElement);
  }

  private initForm() {
    const canEditEmployee = this.permissionService.hasPermission('N80,N1,N34');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.newsletterTypeForm = this.fb.group({
      ID: [0],
      STT: [0],
      TypeCode: [''],
      TypeName: [''],
      IsDeleted: [false],
    });


    if (canEditEmployee) {
      this.newsletterTypeForm.get('TypeCode')?.enable();
      this.newsletterTypeForm.get('TypeName')?.enable();
      this.newsletterTypeForm.get('STT')?.enable();
    }
  }

  loadNewsletterType() {
    this.newsletterService
      .getNewsletterType()
      .subscribe({
        next: (data) => {
          this.newsletterTypeList = Array.isArray(data.data)
            ? data.data
            : [data.data];
          this.newsletterTypeTable(this.tb_newsletter_type.nativeElement);
          this.isLoading = false;
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
          this.notification.error(
            NOTIFICATION_TITLE.error,
            errorMessage
          );
          this.isLoading = false;
        },
      });
  }

  private newsletterTypeTable(container: HTMLElement): void {
    this.newsletterTypeTabulator = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      height: '89vh',
      data: this.newsletterTypeList,
      layout: 'fitDataStretch',
      selectableRows: true,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 50,
          headerSort: false,
          bottomCalc: 'count',
        },
        {
          title: 'Mã loại tin tức',
          field: 'NewsletterTypeCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          bottomCalc: 'count',
        },
        {
          title: 'Tên loại tin tức',
          field: 'NewsletterTypeName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
        }
      ],
    });
    this.newsletterTypeTabulator.on('rowDblClick', (e, row) => {
      const rowData = row.getData();
      console.log(rowData);
      this.openEditModal(rowData);
    });
  }



  openAddModal() {
    const maxSTT = this.newsletterTypeList.reduce((max, item) => {
      return Math.max(max, item.STT);
    }, 0);
    console.log(maxSTT);
    this.newsletterTypeForm.reset({
      ID: 0,
      TypeCode: '',
      TypeName: '',
      STT: maxSTT + 1,
      IsDeleted: false,
    });

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addNewsletterTypeModal')
    );
    modal.show();
  }

  // openEditModal() {
  // const modal = new (window as any).bootstrap.Modal(
  //     document.getElementById('addNewsletterTypeModal')
  //   );
  //   modal.show();
  // }

  openEditModal(data?: any) {
    // if (!data) {
    //   const selectedRows = this.newsletterTypeTabulator.getSelectedRows();
    // }
    // const selectedRows = data;

    // if (selectedRows.length === 0) {
    //   this.notification.warning(
    //     NOTIFICATION_TITLE.warning,
    //     'Vui lòng chọn loại tin tức cần sửa!'
    //   );
    //   return;
    // }

        if (!data) {
      const selectedRows = this.newsletterTypeTabulator.getSelectedRows();
      if (selectedRows.length === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn loại tin tức cần sửa!'
        );
        return;
      }
      data = selectedRows[0].getData();
    }

    if (data) {
      this.selectedTypeNewsletter = data;
      this.newsletterTypeForm.patchValue({
        ID: this.selectedTypeNewsletter.ID,
        STT: this.selectedTypeNewsletter.STT,
        TypeCode: this.selectedTypeNewsletter.NewsletterTypeCode,
        TypeName: this.selectedTypeNewsletter.NewsletterTypeName,
        IsDeleted: this.selectedTypeNewsletter.IsDeleted,
      });
    }

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('addNewsletterTypeModal')
    );
    modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.newsletterTypeTabulator.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn loại tin tức cần xóa'
      );
      return;
    }

    // Collect all selected food orders
    const newsletterTypeToDelete: any[] = [];

    if (selectedRows.length > 0) {
      selectedRows.forEach((row) => {
        newsletterTypeToDelete.push(row.getData());
      });
    }

    if (newsletterTypeToDelete.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy loại tin tức cần xóa'
      );
      return;
    }
    // Sau 10h: không cho xóa phiếu đặt cơm của ngày hôm nay và các ngày trước đó (trừ N1, N2, N34, IsAdmin)
    const hasAdminPermission = this.hasAdminPermission();

    let completed = 0;
    const total = newsletterTypeToDelete.length;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${newsletterTypeToDelete.length} loại tin tức ?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const deletePromises = newsletterTypeToDelete.map((newsletterType) => {
          const deleteData = {
            ...newsletterType,
            IsDeleted: true,
          };
          return this.newsletterService
            .saveNewsletterType(deleteData)
            .subscribe({
              next: (response) => {
                completed++;
                if (completed === total) {
                  this.notification.success(
                    NOTIFICATION_TITLE.success,
                    'Xóa loại tin tức thành công'
                  );
                  this.loadNewsletterType();
                }
              },
              error: (error: any) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  'Xóa loại tin tức thất bại: ' + errorMessage
                );
              },
            });
        });
      },
      nzCancelText: 'Hủy',
    });
  }
  hasAdminPermission(): boolean {
    // Kiểm tra IsAdmin trước
    if (this.currentUser?.IsAdmin === true) {
      return true;
    }
    // Kiểm tra quyền N1, N2, N34
    return this.permissionService.hasPermission('N1') ||
      this.permissionService.hasPermission('N80') ||
      this.permissionService.hasPermission('N34');
  }

  onSubmit() {
    if (this.isLoading) {
      return;
    }
    
    if (this.newsletterTypeForm.invalid) {
      Object.values(this.newsletterTypeForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    const formData = this.newsletterTypeForm.getRawValue();
    const hasPermission = this.hasAdminPermission();


    const newsletterTypeData = {
      ID: formData.ID,
      STT: formData.STT,
      NewsletterTypeCode: formData.TypeCode,
      NewsletterTypeName: formData.TypeName,
      IsDeleted: formData.IsDeleted,
    };

    this.isLoading = true;
    this.newsletterService.saveNewsletterType(newsletterTypeData).subscribe({
      next: (response) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          formData.ID === 0
            ? 'Thêm loại tin tức thành công'
            : 'Cập nhật loại tin tức thành công'
        );
        this.isLoading = false;
        this.closeModal();
        this.loadNewsletterType();
        this.newsletterTypeForm.reset({
          ID: 0,
          TypeCode: '',
          TypeName: '',
          STT: 0,
          IsDeleted: false,
        });
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi lưu loại tin tức';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
        this.isLoading = false;
      },
    });
  }

  closeModal() {
    const modal = document.getElementById('addNewsletterTypeModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.newsletterTypeForm.reset({
      ID: 0,
      TypeCode: '',
      TypeName: '',
      STT: 0,
      IsDeleted: false,
    });

  }

}
