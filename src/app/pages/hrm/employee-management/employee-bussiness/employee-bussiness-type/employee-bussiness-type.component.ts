import { Component, OnInit } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-employee-bussiness-type',
  templateUrl: './employee-bussiness-type.component.html',
  styleUrls: ['./employee-bussiness-type.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    NzSpinModule,
    NgIf
  ],
})
export class EmployeeBussinessTypeComponent implements OnInit {
  private tabulator!: Tabulator;
  employeeBussinessTypes: any[] = [];
  employeeBussinessType: any = {};
  isEditMode: boolean = false;
  selectedEmployeeBussinessType: any = null;
  isVisible = false;
  isSubmitting = false;
  employeeBussinessTypeForm!: FormGroup;
  isLoading = false;
  constructor(
    private employeeBussinessService: EmployeeBussinessService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) {
    this.initForm();
  }

  private initForm() {
    this.employeeBussinessTypeForm = this.fb.group({
      ID: [0],
      TypeCode: ['',[Validators.required]],
      TypeName: ['',[Validators.required]],
      Cost: [0]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadEmployeeBussinessType();
  }

  loadEmployeeBussinessType() {
    this.isLoading = true;
    this.employeeBussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data: any) => {
        this.employeeBussinessTypes = data.data;
        this.tabulator.setData(this.employeeBussinessTypes);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại phụ cấp công tác: ' + error.message);
      }
    });
  }

  private initializeTable() : void {
    this.tabulator = new Tabulator('#tb_employee_bussiness_type', {
      data: this.employeeBussinessTypes,
      layout: 'fitColumns',
      selectableRows: true,
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },
      responsiveLayout: true,
      height: '100%',
      columns: [
        { title: 'Mã loại công tác', field: 'TypeCode', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Tên loại công tác', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Phụ cấp', field: 'Cost', hozAlign: 'right', headerHozAlign: 'center',
          formatter: function(cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
      ],
    })
  }

  openAddModal() {
      this.employeeBussinessTypeForm.reset();
      this.employeeBussinessTypeForm.patchValue({
        ID: 0,
        TypeCode: '',
        TypeName: '',
        Cost: 0
      });
      this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần sửa');
      return;
    }
    this.selectedEmployeeBussinessType = selectedRows[0].getData();
    this.employeeBussinessTypeForm.patchValue(this.selectedEmployeeBussinessType);
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần xóa');
      return;
    }
    const selectedEmployeeBussinessType = selectedRows[0].getData();

    
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại phụ cấp công tác đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeBussinessService.saveEmployeeTypeBussiness({
          ...selectedEmployeeBussinessType,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa loại phụ cấp công tác thành công');
            this.loadEmployeeBussinessType();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa loại phụ cấp công tác thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit() {
    if (this.employeeBussinessTypeForm.invalid) {
      Object.values(this.employeeBussinessTypeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.employeeBussinessTypeForm.value;

    this.employeeBussinessService.saveEmployeeTypeBussiness(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật loại phụ cấp công tác thành công');
        this.closeModal();
        this.loadEmployeeBussinessType();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật loại phụ cấp công tác thất bại: ' + error.message);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }


  closeModal() {
    this.isVisible = false;
    this.employeeBussinessTypeForm.reset();
    this.isSubmitting = false;
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }
}
