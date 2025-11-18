import { Component, OnInit, AfterViewInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { EmployeeService } from '../employee-service/employee.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-employee-login-manager',
  templateUrl: './employee-login-manager.component.html',
  styleUrls: ['./employee-login-manager.component.css'],
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
    NzSplitterModule,
    FormsModule,
    NzCheckboxModule
  ],
  standalone: true
})
export class EmployeeLoginManagerComponent implements OnInit, OnChanges {
  @Input() selectedEmployee: any;
  loginManagerForm!: FormGroup;
  employeeList: any[] = [];
  employeeNameList: any[] = [];
  hasUser: boolean = true;
  

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadEmployee();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedEmployee'] && this.selectedEmployee) {
      this.getLoginInfo(this.selectedEmployee.UserID);
    }
  }

  onHasUserChange(checked: boolean) {
    this.hasUser = checked;
    if (checked) {
      // Khi checkbox được check, enable các input
      this.loginManagerForm.get('LoginName')?.enable();
      this.loginManagerForm.get('PasswordHash')?.enable();
    } else {
      // Khi checkbox bị uncheck, disable các input và clear giá trị
      this.loginManagerForm.get('LoginName')?.disable();
      this.loginManagerForm.get('PasswordHash')?.disable();
      
    }
  }

  onCodeChange(value: number) {
    if (value) {
      this.loginManagerForm.patchValue({
        FullName: value
      });
    }
  }

  onNameChange(value: number) {
    if (value) {
      this.loginManagerForm.patchValue({
        Code: value
      });
    }
  }

  getLoginInfo(userId: number) {
    this.employeeService.getLoginInfo(userId).subscribe({
      next: (data: any) => {
        if (data && data.data && data.data.Status == 1) {
          this.hasUser = false;
          this.loginManagerForm.patchValue({
            Code: this.selectedEmployee.ID,
            FullName: this.selectedEmployee.ID,
            TeamID: data.data.TeamID,
            HasUser: false,
            LoginName: data.data.LoginName,
            PasswordHash: data.data.PasswordHash,
            UserID: data.data.ID
          }); 
        } else {
          this.hasUser = true;
          this.loginManagerForm.patchValue({
            Code: this.selectedEmployee.ID,
            FullName: this.selectedEmployee.ID,
            TeamID: data.data.TeamID,
            HasUser: true,
            LoginName: data.data.LoginName,
            PasswordHash: data.data.PasswordHash,
            UserID: data.data.ID

          });
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lấy thông tin đăng nhập: ' + error.message);
      }
    });
  }

  loadEmployee() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        // Tạo list cho select mã nhân viên
        this.employeeList = data.data.map((employee: any) => ({
          value: Number(employee.ID),
          label: employee.Code, // Label khi đã chọn chỉ hiển thị Code
          Code: employee.Code,
          FullName: employee.FullName,
          ...employee
        }));
        
        // Tạo list cho select họ tên
        this.employeeNameList = data.data.map((employee: any) => ({
          value: Number(employee.ID),
          label: employee.FullName, // Label khi đã chọn chỉ hiển thị FullName
          Code: employee.Code,
          FullName: employee.FullName,
          ...employee
        }));
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    });
  }

  private initForm() {
    this.loginManagerForm = this.fb.group({
      Code: ['', Validators.required],
      FullName: ['', Validators.required],
      TeamID: [''],
      HasUser: [false],
      LoginName: ['', Validators.required],
      PasswordHash: ['', Validators.required],
      UserID: ['']
    });
  }

  onSubmit() {
    if (this.loginManagerForm.invalid) {
      Object.keys(this.loginManagerForm.controls).forEach(key => {
        const control = this.loginManagerForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formData = this.loginManagerForm.value;
    // Tìm employee tương ứng với ID đã chọn
    const selectedEmployee = this.employeeList.find(emp => emp.value === formData.Code);
    if (selectedEmployee) {
      formData.Code = selectedEmployee.Code;
      formData.FullName = selectedEmployee.FullName;
      formData.UserID = selectedEmployee.UserID
      formData.Status = formData.HasUser;
    }

    this.employeeService.saveLoginInfo(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thông tin đăng nhập thành công');
        this.closeModal();
      },
      error: (response) => {
        this.notification.error("Thất bại", "Cập nhật thông tin đăng nhập thất bại" + response.error.message);
      }
    })
  }

  closeModal() {
    const modal = document.getElementById('loginManagerForm');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

}
