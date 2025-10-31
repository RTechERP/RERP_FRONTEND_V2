import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DepartmentServiceService } from './department-service/department-service.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from "../../../directives/has-permission.directive";

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NgIf,
    NzSpinModule,
    HasPermissionDirective
],
  standalone: true,
})
export class DepartmentComponent implements OnInit {
  private tabulator!: Tabulator;
  departments: any[] = [];
  isEditMode: boolean = false;
  selectedDepartmentId: number = 0;
  selectedDepartment: any = null;
  isVisible = false;
  isSubmitting = false;
  departmentForm!: FormGroup;
  employeeList: any[] = [];
  searchText: string = '';

  isLoading = false;

  constructor(
    private departmentService: DepartmentServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    this.initForm();
  }

  private initForm() {
    this.departmentForm = this.fb.group({
      ID: [0],
      STT: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      Status: [1],
      Email: [''],
      HeadofDepartment: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadDepartments();
    this.loadEmployees();
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_department', {
      data: this.departments,
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitColumns',
      //   responsiveLayout: true,
      //   selectableRows: 1,
      //   height: '100%',
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Mã phòng ban',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 300,
        },
        {
          title: 'Tên phòng ban',
          field: 'Name',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 900,
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value === 1
              ? '<span>Hoạt động</span>'
              : '<span>Ngừng hoạt động</span>';
          },
        },
      ],
    });

    this.tabulator.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedDepartment = row.getData();
    });

    this.tabulator.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.selectedDepartment = row.getData();
      this.openEditModal();
    });
  }

  loadDepartments() {
    this.isLoading = true;
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data.data.map((item: any, index: number) => ({
          ...item,
          STT: index + 1,
        }));
        this.tabulator.setData(this.departments);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Lỗi khi tải danh sách phòng ban: ' + error.message
        );
        this.isLoading = false;
      },
    });
  }

  loadEmployees() {
    this.departmentService.getEmployees().subscribe({
      next: (data) => {
        // Format employee data for select options
        this.employeeList = data.data.map((employee: any) => ({
          value: Number(employee.ID),
          label: `${employee.Code} - ${employee.FullName}`,
          ...employee,
        }));
        console.log('Employee list:', this.employeeList); // Debug log
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
  }

  onSearch(event: any) {
    const value = event.target.value.toLowerCase();
    this.searchText = value;
    this.tabulator.setFilter([
      { field: 'Code', type: 'like', value: value },
      { field: 'Name', type: 'like', value: value },
      { field: 'Email', type: 'like', value: value },
    ]);
  }

  openAddModal() {
    this.isEditMode = false;
    const nextSTT =
      this.departments.length > 0
        ? Math.max(...this.departments.map((item) => item.STT)) + 1
        : 1;

    this.departmentForm.patchValue({
      ID: 0,
      STT: nextSTT,
      Code: '',
      Name: '',
      Status: 1,
      Email: '',
      HeadofDepartment: null,
    });
    this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn phòng ban cần chỉnh sửa'
      );
      return;
    }
    this.isEditMode = true;
    this.selectedDepartment = selectedRows[0].getData();

    // Reset form before setting new values
    this.departmentForm.reset();

    // Set form values with proper type conversion
    this.departmentForm.patchValue({
      ID: this.selectedDepartment.ID,
      STT: this.selectedDepartment.STT,
      Code: this.selectedDepartment.Code,
      Name: this.selectedDepartment.Name,
      Status: Number(this.selectedDepartment.Status),
      Email: this.selectedDepartment.Email || '',
      HeadofDepartment: Number(this.selectedDepartment.HeadofDepartment), // Convert to number
    });

    console.log('Form values after patch:', this.departmentForm.value); // Debug log
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn phòng ban cần xóa');
      return;
    }
    this.selectedDepartment = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phòng ban "${this.selectedDepartment.Name}" không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteDepartment(),
      nzCancelText: 'Hủy',
    });
  }

  deleteDepartment() {
    this.departmentService
      .deleteDepartment(this.selectedDepartment.ID)
      .subscribe({
        next: () => {
          this.notification.success('Thành công', 'Xóa phòng ban thành công');
          this.loadDepartments();
          this.selectedDepartment = null;
        },
        error: (response) => {
          this.notification.error(
            'Lỗi',
            'Xóa phòng ban thất bại: ' + response.error.message
          );
        },
      });
  }

  onSubmit() {
    if (this.departmentForm.invalid) {
      Object.values(this.departmentForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    this.isSubmitting = true;
    const formData = this.departmentForm.value;

    if (this.isEditMode) {
      this.departmentService.createDepartment(formData).subscribe({
        next: () => {
          this.notification.success(
            'Thành công',
            'Cập nhật phòng ban thành công'
          );
          this.closeModal();
          this.loadDepartments();
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Cập nhật phòng ban thất bại: ' + error.message
          );
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } else {
      this.departmentService.createDepartment(formData).subscribe({
        next: () => {
          this.notification.success('Thành công', 'Thêm phòng ban thành công');
          this.closeModal();
          this.loadDepartments();
        },
        error: (response) => {
          this.notification.error(
            'Lỗi',
            'Thêm phòng ban thất bại: ' + response.error.message
          );
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  closeModal() {
    this.isVisible = false;
    this.departmentForm.reset();
    this.isSubmitting = false;
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }
}
