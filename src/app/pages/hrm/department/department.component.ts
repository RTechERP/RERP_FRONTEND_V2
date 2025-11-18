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
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../old/project/project-service/project.service';

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
    HasPermissionDirective,
  ],
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
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private projectService: ProjectService
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
      layout: 'fitDataStretch',
      selectableRows: true,
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

    this.tabulator.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        //this.tabulator.deselectRow();
        row.select();
      }
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
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
        this.isLoading = false;
      },
    });
  }

  // loadEmployees() {
  //   this.employeeService.getEmployees().subscribe({
  //     next: (data) => {
  //       this.employeeList = data.data.map((employee: any) => ({
  //         value: Number(employee.ID),
  //         label: `${employee.Code} - ${employee.FullName}`,
  //         ...employee,
  //       }));
  //       console.log('Employee list:', this.employeeList); // Debug log
  //     },
  //     error: (error) => {
  //       this.notification.error(NOTIFICATION_TITLE.error, error.message);
  //     },
  //   });
  // }

  loadEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
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
    if (selectedRows.length != 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn 1 phòng ban cần sửa!");
      return;
    }
    this.isEditMode = true;
    this.selectedDepartment = selectedRows[0].getData();

    // Reset form before setting new values
    this.departmentForm.reset();

    // Set form values with proper type conversion
    debugger
    this.departmentForm.patchValue({
      ID: this.selectedDepartment.ID,
      STT: this.selectedDepartment.STT,
      Code: this.selectedDepartment.Code,
      Name: this.selectedDepartment.Name,
      Status: this.selectedDepartment.Status,
      Email: this.selectedDepartment.Email || '',
      HeadofDepartment: Number(this.selectedDepartment.HeadofDepartment), // Convert to number
    });

    console.log('Form values after patch:', this.departmentForm.value); // Debug log
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phòng ban cần xóa');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phòng ban đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.deleteDepartment();
      },
      nzCancelText: 'Hủy',
    });
  }

  deleteDepartment() {
    debugger
    const selectedRows = this.tabulator.getSelectedRows();

    // Lấy data thực tế từ row
    const deleteRequests = selectedRows
      .map((row: any) => row.getData()) // row.getData() trả về object dữ liệu
      .filter((data: any) => data.ID > 0)
      .map((data: any) => this.departmentService.deleteDepartment(data.ID));

    if (deleteRequests.length === 0) return;

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa phòng ban thành công');
        this.loadDepartments();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
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
        NOTIFICATION_TITLE.warning,
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
            NOTIFICATION_TITLE.success,
            'Cập nhật phòng ban thành công'
          );
          this.closeModal();
          this.loadDepartments();
        },
        error: (error) => {
          
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Cập nhật phòng ban thất bại: ' + error.error.message
          );
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } else {
      this.departmentService.createDepartment(formData).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Thêm phòng ban thành công');
          this.closeModal();
          this.loadDepartments();
        },
        error: (response) => {
          this.notification.error(
            'Lỗi',
            'Thêm phòng ban thất bại: ' + response.error.message
          );
          this.isSubmitting = false;
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
