import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { EslTestRegistrationService } from '../esl-test-registration.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-esl-test-registration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzRadioModule,
    NzNotificationModule,
    NzSpinModule,
    NzGridModule,
    NzCardModule,
    TableModule,
    TagModule
  ],
  providers: [NzNotificationService, DatePipe],
  templateUrl: './esl-test-registration-form.component.html',
  styleUrls: ['./esl-test-registration-form.component.css']
})
export class EslTestRegistrationFormComponent implements OnInit {
  @Input() data: any;
  @Input() compID: any;

  form!: FormGroup;
  loading = false;
  testTables: any[] = [];
  employees: any[] = [];
  projects: any[] = [];
  isEdit = false;
  detailsList: any[] = [];
  columns = [
    { field: 'Type', header: 'Loại', width: '120px' },
    { field: 'StartDate', header: 'Ngày bắt đầu', width: '120px' },
    { field: 'EndDate', header: 'Ngày kết thúc', width: '120px' },
    { field: 'OwnerName', header: 'Người đăng ký', width: '150px' },
    { field: 'ApproverName', header: 'Người duyệt', width: '150px' },
    { field: 'Status', header: 'Trạng thái', width: '120px' }
  ];

  constructor(
    private fb: FormBuilder,
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    private appUserService: AppUserService,
    private datePipe: DatePipe
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadTestTables();
    this.loadEmployees();
    this.loadProjects();
    
    if (this.data) {
      this.isEdit = true;
      this.patchFormData(this.data);
      this.loadDetails(this.data.RegistrationID);
      if (this.data.Status === 1) {
        this.form.disable();
      }
    } else {
      const currentUser = this.appUserService.currentUser;
      this.form.patchValue({ OwnerID: currentUser?.EmployeeID });
    }

    this.form.get('ProjectCode')?.valueChanges.subscribe(code => {
      const selectedProject = this.projects.find(p => p.ProjectCode === code);
      if (selectedProject) {
        this.form.patchValue({ RegistrationContent: selectedProject.ProjectName });
      } else {
        this.form.patchValue({ RegistrationContent: null });
      }
    });
  }

  createForm(): void {
    this.form = this.fb.group({
      RegistrationID: [0],
      DetailID: [0],
      TestTableID: [null, [Validators.required]],
      ProjectCode: [null, [Validators.required]],
      RegistrationContent: [null],
      OwnerID: [null, [Validators.required]],
      ApproverID: [null, [Validators.required]],
      StartDate: [null, [Validators.required]],
      EndDate: [null, [Validators.required]]
    });
  }

  patchFormData(item: any): void {
    this.form.patchValue({
      RegistrationID: item.RegistrationID,
      DetailID: item.DetailID,
      TestTableID: item.TestTableID,
      ProjectCode: item.ProjectCode,
      RegistrationContent: item.RegistrationContent,
      OwnerID: item.OwnerID,
      ApproverID: item.ApproverID,
      StartDate: item.StartDate,
      EndDate: item.EndDate
    });
  }

  loadTestTables(): void {
    this.eslService.getTestTables().subscribe({
      next: (res: any) => {
        this.testTables = res.data || [];
      }
    });
  }

  loadEmployees(): void {
    this.eslService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
      }
    });
  }

  loadProjects(): void {
    this.eslService.getProjects().subscribe({
      next: (res: any) => {
        this.projects = res.data || [];
      }
    });
  }

  filterProjectOption = (input: string, option: any): boolean => {
    return (option.nzLabel || '').toLowerCase().includes(input.toLowerCase());
  };

  filterEmployeeOption = (input: string, option: any): boolean => {
    return (option.nzLabel || '').toLowerCase().includes(input.toLowerCase());
  };

  loadDetails(registrationId: number): void {
    this.eslService.getDetails(registrationId).subscribe({
      next: (res: any) => {
        this.detailsList = res.data || [];
      }
    });
  }

  getTypeLabel(type: number): string {
    switch(type) {
      case 1: return 'Đăng ký';
      case 2: return 'Gia hạn';
      case 3: return 'Bàn giao';
      default: return 'Khác';
    }
  }

  getStatusColor(status: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 0: return 'warn';
      case 1: return 'success';
      case 2: return 'danger';
      default: return 'info';
    }
  }

  getStatusLabel(status: number): string {
    switch(status) {
      case 0: return 'Chờ duyệt';
      case 1: return 'Đã duyệt';
      case 2: return 'Từ chối';
      default: return 'Khác';
    }
  }

  submitForm(): void {
    for (const i in this.form.controls) {
      this.form.controls[i].markAsDirty();
      this.form.controls[i].updateValueAndValidity();
    }

    if (this.form.valid) {
      const formValue = this.form.value;
      if (formValue.EndDate < formValue.StartDate) {
        this.notification.warning('Cảnh báo', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
        return;
      }

      this.loading = true;
      const sd = this.datePipe.transform(formValue.StartDate, 'yyyy-MM-dd') || '';
      const ed = this.datePipe.transform(formValue.EndDate, 'yyyy-MM-dd') || '';

      // Check conflict
      this.eslService.checkConflict({
        testTableId: formValue.TestTableID,
        startDate: sd,
        endDate: ed,
        excludeDetailId: formValue.DetailID > 0 ? formValue.DetailID : undefined
      }).subscribe({
        next: (resConflict: any) => {
          if (resConflict.status === 1) {
            // Save
            const payload = {
              ID: formValue.RegistrationID, // DTO maps to ID
              TestTableID: formValue.TestTableID,
              OwnerID: formValue.OwnerID,
              ApproverID: formValue.ApproverID,
              ProjectCode: formValue.ProjectCode,
              RegistrationContent: formValue.RegistrationContent,
              StartDate: sd,
              EndDate: ed
            };
            this.eslService.save(payload).pipe(finalize(() => this.loading = false)).subscribe({
              next: (res: any) => {
                if (res.status === 1) {
                  this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
                  this.tabService.notifyDataSaved('esl-test-registration');
                  this.tabService.closeTabByKey(this.compID);
                } else {
                  this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
                }
              },
              error: (err: any) => this.showError(err)
            });
          } else {
            this.loading = false;
            this.notification.warning('Xung đột thời gian', resConflict.message);
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.showError(err);
        }
      });
    }
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}

