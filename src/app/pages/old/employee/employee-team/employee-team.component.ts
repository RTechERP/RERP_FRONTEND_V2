import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { FormGroupDirective } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EmployeeService } from '../employee-service/employee.service';
import { NzOptionComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-employee-team',
  templateUrl: './employee-team.component.html',
  styleUrls: ['./employee-team.component.css'],
  imports: [
    NzIconModule,
    NzButtonModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzOptionComponent
  ],
  providers: [NzNotificationService, NzModalService],
  standalone: true
})
export class EmployeeTeamComponent implements OnInit {
  private tabulator!: Tabulator;
  employeeTeam: any[] = [];
  departmentList: any[] = [];
  employeeTeamForm!: FormGroup;
  selectedEmployeeTeam: any = null;
  department: any = null;
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService
  ) {
    this.initForm();
  }

  private initForm() {
    this.employeeTeamForm = this.fb.group({
      ID: [0],
      STT: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      DepartmentID: [0, [Validators.required]],
      IsDeleted: [0]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadEmployeeTeam();
    this.loadDepartments();
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_employeeTeam', {
      data: this.employeeTeam,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      height: '70vh',
      groupBy: "DepartmentName",
      groupHeader: function(value, count, data, group){
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " teams)</span>";
      },
      columns: [
        {
          title: 'STT', field: 'STT', hozAlign:'center',headerHozAlign:'center', width: 100
        },
        {
          title: 'Mã team', field: 'Code', hozAlign:'center',headerHozAlign:'center'
        },
        {
          title: 'Tên team', field: 'Name', hozAlign:'center',headerHozAlign:'center'
        }
      ]
    });
  }

  loadEmployeeTeam() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (data: any) => {
        this.employeeTeam = data.data;
        this.tabulator.setData(this.employeeTeam);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách team phòng ban: ' + error.message);
      }
    })
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data.map((department: any) => ({
          value: Number(department.ID),
          label: `${department.Name}`
        }));
        console.log(this.departmentList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  onSubmit() {
    if (this.employeeTeamForm.valid) {
        this.employeeService.saveEmployeeTeam(this.employeeTeamForm.value).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật team phòng ban thành công');
            this.closeModal();
            this.loadEmployeeTeam();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật team phòng ban thất bại: ' + error.message);
          }
        });
    } else {
      Object.values(this.employeeTeamForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  openAddModal() {
    const nextSTT = this.employeeTeam.length > 0 
    ? Math.max(...this.employeeTeam.map(item => item.STT)) + 1 
    : 1;
    this.employeeTeamForm.reset({
      ID: 0,
      STT: nextSTT,
      Code: '',
      Name: '',
      DepartmentID: 0,
      IsDeleted: 0
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEmployeeTeamModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn team phòng ban cần sửa');
      return;
    }

    this.selectedEmployeeTeam = selectedRows[0].getData();
    this.employeeTeamForm.patchValue({
      ID: this.selectedEmployeeTeam.ID,
      STT: this.selectedEmployeeTeam.STT,
      DepartmentID: this.selectedEmployeeTeam.DepartmentID,
      Code: this.selectedEmployeeTeam.Code,
      Name: this.selectedEmployeeTeam.Name,
      IsDeleted: 0
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEmployeeTeamModal'));
    modal.show();
  }

  closeModal() {
    const modal = document.getElementById('addEmployeeTeamModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.employeeTeamForm.reset();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn team phòng ban cần xóa');
      return;
    }

    const selectedEmployeeTeam = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa team phòng ban này không?`,
      nzOkText:"Xóa",
      nzOkType:'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeService.saveEmployeeTeam({
          ...selectedEmployeeTeam,
          IsDeleted: 1
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa team phòng ban thành công');
            this.loadEmployeeTeam();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa team phòng ban thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }
}
