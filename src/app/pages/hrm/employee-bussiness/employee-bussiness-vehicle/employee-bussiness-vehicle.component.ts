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
import { NOTIFICATION_TITLE } from '../../../../app.config';


@Component({
  selector: 'app-employee-bussiness-vehicle',
  templateUrl: './employee-bussiness-vehicle.component.html',
  styleUrls: ['./employee-bussiness-vehicle.component.css'],
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
export class EmployeeBussinessVehicleComponent implements OnInit {

   private tabulator!: Tabulator;
    employeeBussinessVehicles: any[] = [];
    employeeBussinessVehicle: any = {};
    isEditMode: boolean = false;
    selectedEmployeeBussinessVehicle: any = null;
    isVisible = false;
    isSubmitting = false;
    employeeBussinessVehicleForm!: FormGroup;
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
    this.employeeBussinessVehicleForm = this.fb.group({
      ID: [0],
      VehicleCode: ['',[Validators.required]],
      VehicleName: ['',[Validators.required]],
      Cost: [0]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadEmployeeBussinessVehicle();
  }


  loadEmployeeBussinessVehicle() {
    this.isLoading = true;
    this.employeeBussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (data: any) => {
        this.employeeBussinessVehicles = data.data;
        this.tabulator.setData(this.employeeBussinessVehicles);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại phụ cấp phương tiện: ' + error.message);
      }
    });
  }

  private initializeTable() : void {
    this.tabulator = new Tabulator('#tb_employee_bussiness_vehicle', {
      data: this.employeeBussinessVehicles,
      layout: 'fitColumns',
      selectableRows: true,
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },
      responsiveLayout: true,
      height: '85vh',
      columns: [
        { title: 'Mã phương tiện', field: 'VehicleCode', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Tên phương tiện', field: 'VehicleName', hozAlign: 'left', headerHozAlign: 'center'},
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
    
    // Set font-size 12px cho Tabulator sau khi render
    setTimeout(() => {
      const tabulatorElement = document.getElementById('tb_employee_bussiness_vehicle');
      if (tabulatorElement) {
        const style = document.createElement('style');
        style.id = 'tabulator-font-size-override';
        style.textContent = `
          #tb_employee_bussiness_vehicle,
          #tb_employee_bussiness_vehicle.tabulator,
          #tb_employee_bussiness_vehicle .tabulator,
          #tb_employee_bussiness_vehicle .tabulator-table,
          #tb_employee_bussiness_vehicle .tabulator-cell,
          #tb_employee_bussiness_vehicle .tabulator-cell-content,
          #tb_employee_bussiness_vehicle .tabulator-header,
          #tb_employee_bussiness_vehicle .tabulator-col,
          #tb_employee_bussiness_vehicle .tabulator-col-content,
          #tb_employee_bussiness_vehicle .tabulator-col-title,
          #tb_employee_bussiness_vehicle .tabulator-row,
          #tb_employee_bussiness_vehicle .tabulator-row .tabulator-cell,
          #tb_employee_bussiness_vehicle * {
            font-size: 12px !important;
          }
        `;
        // Remove existing style if any
        const existingStyle = document.getElementById('tabulator-font-size-override');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    }, 200);
  }

  openAddModal() {
      this.employeeBussinessVehicleForm.reset();
      this.employeeBussinessVehicleForm.patchValue({
        ID: 0,
        VehicleCode: '',
        VehicleName: '',
        Cost: 0
      });
      this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp phương tiện cần sửa');
      return;
    }
    this.selectedEmployeeBussinessVehicle = selectedRows[0].getData();
    this.employeeBussinessVehicleForm.patchValue(this.selectedEmployeeBussinessVehicle);
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp phương tiện cần xóa');
      return;
    }
    const selectedEmployeeBussinessVehicle = selectedRows[0].getData();

    
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại phụ cấp phương tiện đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeBussinessService.saveEmployeeVehicleBussiness({
          ...selectedEmployeeBussinessVehicle,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa loại phụ cấp phương tiện thành công');
            this.loadEmployeeBussinessVehicle();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa loại phụ cấp phương tiện thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit() {
    if (this.employeeBussinessVehicleForm.invalid) {
      Object.values(this.employeeBussinessVehicleForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.employeeBussinessVehicleForm.value;

    this.employeeBussinessService.saveEmployeeVehicleBussiness(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật loại phụ cấp phương tiện thành công');
        this.closeModal();
        this.loadEmployeeBussinessVehicle();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật loại phụ cấp phương tiện thất bại: ' + error.message);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }


  closeModal() {
    this.isVisible = false;
    this.employeeBussinessVehicleForm.reset();
    this.isSubmitting = false;
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }

}
