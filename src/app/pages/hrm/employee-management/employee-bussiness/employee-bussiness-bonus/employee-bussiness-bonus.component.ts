import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { TypeFormComponent } from './type-form/type-form.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-employee-bussiness-bonus',
  standalone: true,
  templateUrl: './employee-bussiness-bonus.component.html',
  styleUrls: ['./employee-bussiness-bonus.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzNotificationModule,
    NzSpinModule,
    NzSplitterModule,
    VehicleFormComponent,
    TypeFormComponent
  ]
})
export class EmployeeBussinessBonusComponent implements OnInit, AfterViewInit {
  @ViewChild('vehicleForm') vehicleForm!: VehicleFormComponent;
  @ViewChild('typeForm') typeForm!: TypeFormComponent;

  // Vehicle
  private tabulatorVehicle!: Tabulator;
  vehicleList: any[] = [];
  isVehicleModalVisible = false;
  isVehicleSubmitting = false;
  isVehicleLoading = false;
  selectedVehicle: any = null;
  isVehicleEditMode = false;

  // Type
  private tabulatorType!: Tabulator;
  typeList: any[] = [];
  isTypeModalVisible = false;
  isTypeSubmitting = false;
  isTypeLoading = false;
  selectedType: any = null;
  isTypeEditMode = false;

  constructor(
    private employeeBussinessService: EmployeeBussinessService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit() {
    // Không load data ở đây, đợi bảng khởi tạo xong
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('AfterViewInit: Khởi tạo bảng...');
      
      // Kiểm tra element tồn tại
      const vehicleDiv = document.getElementById('tb_employee_bussiness_vehicle');
      const typeDiv = document.getElementById('tb_employee_bussiness_type');
      
      console.log('Vehicle div:', vehicleDiv);
      console.log('Type div:', typeDiv);
      
      // Khởi tạo bảng trước
      this.initializeVehicleTable();
      this.initializeTypeTable();
      
      // Sau đó load data
      this.loadVehicleList();
      this.loadTypeList();
    }, 200);
  }

  // ========== VEHICLE METHODS ==========
  loadVehicleList() {
    console.log('Loading vehicle list...');
    this.isVehicleLoading = true;
    this.employeeBussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (data: any) => {
        console.log('Vehicle data received:', data);
        this.vehicleList = data.data || [];
        console.log('Vehicle list:', this.vehicleList);
        if (this.tabulatorVehicle) {
          console.log('Setting vehicle data to tabulator...');
          this.tabulatorVehicle.setData(this.vehicleList);
        } else {
          console.error('Tabulator vehicle not initialized!');
        }
        this.isVehicleLoading = false;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phụ cấp phương tiện');
        this.isVehicleLoading = false;
      }
    });
  }

  private initializeVehicleTable(): void {
    console.log('Initializing vehicle table...');
    this.tabulatorVehicle = new Tabulator('#tb_employee_bussiness_vehicle', {
      data: this.vehicleList,
      layout: 'fitColumns',
      selectableRows: true,
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 50,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      responsiveLayout: true,
      height: '100%',
      columns: [
        { title: 'Mã phương tiện', field: 'VehicleCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên phương tiện', field: 'VehicleName', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: 'Phụ cấp', field: 'Cost', hozAlign: 'right', headerHozAlign: 'center',
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
      ],
    });
  }

  openVehicleAddModal() {
    this.isVehicleEditMode = false;
    this.selectedVehicle = null;
    this.isVehicleModalVisible = true;
  }

  openVehicleEditModal() {
    const selectedRows = this.tabulatorVehicle.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phụ cấp phương tiện cần sửa');
      return;
    }
    this.isVehicleEditMode = true;
    this.selectedVehicle = selectedRows[0].getData();
    this.isVehicleModalVisible = true;
  }

  openVehicleDeleteModal() {
    const selectedRows = this.tabulatorVehicle.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phụ cấp phương tiện cần xóa');
      return;
    }
    const selected = selectedRows[0].getData();

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phụ cấp phương tiện "${selected['VehicleName']}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.isVehicleLoading = true;
        this.employeeBussinessService.saveEmployeeVehicleBussiness({
          ...selected,
          IsDeleted: true
        }).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa phụ cấp phương tiện thành công');
            this.loadVehicleList();
          },
          error: (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa phụ cấp phương tiện thất bại');
            this.isVehicleLoading = false;
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmitVehicle(formData: any) {
    this.isVehicleSubmitting = true;

    this.employeeBussinessService.saveEmployeeVehicleBussiness(formData).subscribe({
      next: () => {
        const message = this.isVehicleEditMode
          ? 'Cập nhật phụ cấp phương tiện thành công'
          : 'Thêm phụ cấp phương tiện thành công';
        this.notification.success(NOTIFICATION_TITLE.success, message);
        this.closeVehicleModal();
        this.loadVehicleList();
      },
      error: (error: any) => {
        const message = this.isVehicleEditMode
          ? 'Cập nhật phụ cấp phương tiện thất bại'
          : 'Thêm phụ cấp phương tiện thất bại';
        this.notification.error(NOTIFICATION_TITLE.error, message);
        this.isVehicleSubmitting = false;
      },
      complete: () => {
        this.isVehicleSubmitting = false;
      }
    });
  }

  closeVehicleModal() {
    this.isVehicleModalVisible = false;
    this.isVehicleSubmitting = false;
    this.isVehicleEditMode = false;
    this.selectedVehicle = null;
  }

  // ========== TYPE METHODS ==========
  loadTypeList() {
    console.log('Loading type list...');
    this.isTypeLoading = true;
    this.employeeBussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data: any) => {
        console.log('Type data received:', data);
        this.typeList = data.data || [];
        console.log('Type list:', this.typeList);
        if (this.tabulatorType) {
          console.log('Setting type data to tabulator...');
          this.tabulatorType.setData(this.typeList);
        } else {
          console.error('Tabulator type not initialized!');
        }
        this.isTypeLoading = false;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại phụ cấp công tác');
        this.isTypeLoading = false;
      }
    });
  }

  private initializeTypeTable(): void {
    console.log('Initializing type table...');
    this.tabulatorType = new Tabulator('#tb_employee_bussiness_type', {
      data: this.typeList,
      layout: 'fitColumns',
      selectableRows: true,
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 50,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      responsiveLayout: true,
      height: '100%',
      columns: [
        { title: 'Mã loại công tác', field: 'TypeCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên loại công tác', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: 'Phụ cấp', field: 'Cost', hozAlign: 'right', headerHozAlign: 'center',
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
      ],
    });
  }

  openTypeAddModal() {
    this.isTypeEditMode = false;
    this.selectedType = null;
    this.isTypeModalVisible = true;
  }

  openTypeEditModal() {
    const selectedRows = this.tabulatorType.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần sửa');
      return;
    }
    this.isTypeEditMode = true;
    this.selectedType = selectedRows[0].getData();
    this.isTypeModalVisible = true;
  }

  openTypeDeleteModal() {
    const selectedRows = this.tabulatorType.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần xóa');
      return;
    }
    const selected = selectedRows[0].getData();

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại phụ cấp công tác "${selected['TypeName']}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.isTypeLoading = true;
        this.employeeBussinessService.saveEmployeeTypeBussiness({
          ...selected,
          IsDeleted: true
        }).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa loại phụ cấp công tác thành công');
            this.loadTypeList();
          },
          error: (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa loại phụ cấp công tác thất bại');
            this.isTypeLoading = false;
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmitType(formData: any) {
    this.isTypeSubmitting = true;

    this.employeeBussinessService.saveEmployeeTypeBussiness(formData).subscribe({
      next: () => {
        const message = this.isTypeEditMode
          ? 'Cập nhật loại phụ cấp công tác thành công'
          : 'Thêm loại phụ cấp công tác thành công';
        this.notification.success(NOTIFICATION_TITLE.success, message);
        this.closeTypeModal();
        this.loadTypeList();
      },
      error: (error: any) => {
        const message = this.isTypeEditMode
          ? 'Cập nhật loại phụ cấp công tác thất bại'
          : 'Thêm loại phụ cấp công tác thất bại';
        this.notification.error(NOTIFICATION_TITLE.error, message);
        this.isTypeSubmitting = false;
      },
      complete: () => {
        this.isTypeSubmitting = false;
      }
    });
  }

  closeTypeModal() {
    this.isTypeModalVisible = false;
    this.isTypeSubmitting = false;
    this.isTypeEditMode = false;
    this.selectedType = null;
  }

  closeMainModal() {
    this.activeModal.close();
  }
}
