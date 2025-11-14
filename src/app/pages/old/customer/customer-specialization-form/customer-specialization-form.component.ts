import { Component } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { CustomerServiceService } from '../customer-service/customer-service.service';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-customer-specialization-form',
  imports: [CommonModule, FormsModule, NzIconModule, NzButtonModule],
  templateUrl: './customer-specialization-form.component.html',
  styleUrl: './customer-specialization-form.component.css',
  providers: [NzNotificationService, NzModalService]
})
export class CustomerSpecializationFormComponent implements OnInit {
  private tabulator!: Tabulator;
  customerSpecialization: any[] = [];
  isEditMode: boolean = false;
  selectedSpecializationId: number = 0;
  selectedSpecialization: any = null;
  toastMessage: string = '';
  isSuccess: boolean = false;
  searchKeyword: string = '';

  specialization = {
    ID: 0,
    STT: 0,
    Code: '',
    Name: ''
  };

  constructor(
    private customerService: CustomerServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.initializeTable();
    this.loadCustomerSpecialization();
  }

  loadCustomerSpecialization() {
    this.customerService.getCustomerSpecialization().subscribe((data: any) => {
      this.customerSpecialization = data.data;
      this.customerSpecialization = this.customerSpecialization.map((item, index) => ({
        ...item,
        STT: index + 1
      }));
      this.initializeTable();
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#customerSpecialization-table', {
      data: this.customerSpecialization,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      height: '700px',
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: 'Mã ngành nghề', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 400 },
        { title: 'Tên ngành nghề', field: 'Name', hozAlign: 'left', headerHozAlign: 'center' },
      ],
      pagination: true,
      paginationSize: 30,
      paginationSizeSelector: [10, 20, 30, 40, 50],
      paginationButtonCount: 5,
    });

    this.tabulator.on("rowSelectionChanged", (data: any) => {
      if (data.length > 0) {
        this.selectedSpecializationId = data[0].getData().ID;
        this.selectedSpecialization = data[0].getData();
      } else {
        this.selectedSpecializationId = 0;
        this.selectedSpecialization = null;
      }
    });
  }

  openAddModal() {
    this.isEditMode = false;
    const nextSTT = this.customerSpecialization.length > 0
      ? Math.max(...this.customerSpecialization.map(item => item.STT)) + 1
      : 1;
    this.specialization = {
      ID: 0,
      STT: nextSTT,
      Code: '',
      Name: ''
    };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addSpecializationModal'));
    modal.show();
  }

  showNotification(message: string, isSuccess: boolean) {
    this.toastMessage = message;
    this.isSuccess = isSuccess;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('notificationModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.showNotification('Vui lòng chọn ngành nghề cần sửa', false);
      return;
    }

    this.isEditMode = true;
    this.selectedSpecialization = selectedRows[0].getData();
    this.specialization = {
      ID: this.selectedSpecialization.ID,
      STT: this.selectedSpecialization.STT,
      Code: this.selectedSpecialization.Code,
      Name: this.selectedSpecialization.Name
    };

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addSpecializationModal'));
    modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngành nghề cần xóa');
      return;
    }
    const selectedSpecialization = selectedRows[0].getData();

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa ngành nghề này không?',
      nzOkText: 'Đồng ý',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.customerService.saveCustomerSpecialization({
          ...selectedSpecialization,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Xóa ngành nghề thành công');
            this.loadCustomerSpecialization();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa ngành nghề thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit(form: any) {
    if (form.invalid) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin trước khi lưu');
      return;
    }
    if (this.isEditMode) {
      this.customerService.saveCustomerSpecialization(this.specialization).subscribe({
        next: (response) => {
          this.closeModal();
          this.loadCustomerSpecialization();
          this.notification.success('Thành công', 'Cập nhật ngành nghề thành công');
        },
        error: (error) => {
          this.notification.error('Thất bại', 'Cập nhật ngành nghề thất bại: ' + error.message);
        }
      });
    } else {
      this.customerService.saveCustomerSpecialization(this.specialization).subscribe({
        next: (response) => {
          this.closeModal();
          this.loadCustomerSpecialization();
          this.notification.success('Thành công', 'Thêm ngành nghề thành công');
        },
        error: (error) => {
          this.notification.error('Thất bại', 'Thêm ngành nghề thất bại: ' + error.message);
        }
      });
    }
  }

  // deleteSpecialization() {
  //   if (this.selectedSpecializationId) {
  //     this.customerService.deleteCustomerSpecialization(this.selectedSpecializationId).subscribe({
  //       next: (response) => {
  //         this.loadCustomerSpecialization();
  //         this.notification.success('Thành công', 'Xóa ngành nghề thành công');
  //       },
  //       error: (response) => {
  //         this.notification.error('Thất bại', 'Xóa ngành nghề thất bại: ' + response.error.message);
  //       }
  //     });
  //   }
  // }

  closeModal() {
    const modal = document.getElementById('addSpecializationModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

  onSearch() {
    if (!this.searchKeyword.trim()) {
      this.loadCustomerSpecialization();
      return;
    }

    const filteredData = this.customerSpecialization.filter(item =>
      item.Code.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
      item.Name.toLowerCase().includes(this.searchKeyword.toLowerCase())
    );

    // Add STT to filtered data
    const dataWithSTT = filteredData.map((item, index) => ({
      ...item,
      STT: index + 1
    }));

    this.tabulator.setData(dataWithSTT);
  }

  resetSearch() {
    this.searchKeyword = '';
    this.loadCustomerSpecialization();
  }
}
