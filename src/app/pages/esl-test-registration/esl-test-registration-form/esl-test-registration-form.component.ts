import { Component, Input, OnInit, Optional } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
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
    FormsModule,
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
  approvers: any[] = [];
  projects: any[] = [];
  isEdit = false;
  allowEdit = true;
  maxNo = 0;
  maxNoDetail: any = null;
  detailsList: any[] = [];
  columns = [
    { field: 'No', header: 'Số lần', width: '80px' },
    { field: 'Type', header: 'Loại', width: '100px' },
    { field: 'StartDate', header: 'Ngày bắt đầu', width: '150px' },
    { field: 'EndDate', header: 'Ngày kết thúc', width: '150px' },
    { field: 'OwnerName', header: 'Người nhận', width: '150px' },
    { field: 'ApproverName', header: 'Người duyệt', width: '150px' },
    { field: 'Status', header: 'Trạng thái', width: '120px' }
  ];

  constructor(
    private fb: FormBuilder,
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    private appUserService: AppUserService,
    private datePipe: DatePipe,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadTestTables();
    this.loadEmployees();
    this.loadApprovers();
    this.loadProjects();

    if (this.data) {
      this.isEdit = true;
      this.patchFormData(this.data);
      this.loadDetails(this.data.RegistrationID);
    } else {
      const currentUser = this.appUserService.currentUser;
      this.form.patchValue({ 
        OwnerID: currentUser?.EmployeeID,
        StartDate: new Date()
      });
    }

    this.form.get('ProjectCode')?.valueChanges.subscribe(code => {
      const selectedProject = this.projects.find(p => p.ProjectCode === code);
      if (selectedProject) {
        this.form.patchValue({
          RegistrationContent: selectedProject.ProjectName,
          ProjectID: selectedProject.ID || selectedProject.ProjectID || 0
        });
      } else {
        this.form.patchValue({ RegistrationContent: null, ProjectID: null });
      }
    });

    this.form.get('StartDate')?.valueChanges.subscribe((val: Date) => {
      if (val) {
        const newEnd = new Date(val);
        newEnd.setDate(newEnd.getDate() + 7);
        this.form.patchValue({ EndDate: newEnd }, { emitEvent: false });
      } else {
        this.form.patchValue({ EndDate: null }, { emitEvent: false });
      }
    });
  }

  createForm(): void {
    this.form = this.fb.group({
      RegistrationID: [0],
      DetailID: [0],
      TestTableID: [null, [Validators.required]],
      ProjectCode: [null, [Validators.required]],
      ProjectID: [null],
      RegistrationContent: [null],
      OwnerID: [null, [Validators.required]],
      ApproverID: [null, [Validators.required]],
      StartDate: [null, [Validators.required]],
      EndDate: [null, [Validators.required]],
      IsDelete: [false]
    });
  }

  patchFormData(item: any): void {
    this.form.patchValue({
      RegistrationID: item.RegistrationID,
      DetailID: item.DetailID,
      TestTableID: item.TestTableID,
      ProjectCode: item.ProjectCode,
      ProjectID: item.ProjectID,
      RegistrationContent: item.RegistrationContent,
      OwnerID: item.OwnerID,
      ApproverID: item.ApproverID,
      StartDate: item.StartDate,
      EndDate: item.EndDate,
      IsDelete: item.IsDelete || false
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

  loadApprovers(): void {
    this.eslService.getApprovers().subscribe({
      next: (res: any) => {
        this.approvers = res.data?.result || res.data || [];
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
        const rawDetails = res.data || [];
        this.detailsList = rawDetails.filter((x: any) => x.Status !== 1);

        if (this.isEdit && rawDetails.length > 0) {
          const latestDetail = rawDetails.reduce((prev: any, current: any) => (prev.No > current.No) ? prev : current);
          this.maxNo = latestDetail.No;
          this.maxNoDetail = latestDetail;
          this.applyEditRules(latestDetail.No, latestDetail.Status);
        }
      }
    });
  }

  applyEditRules(no: number, status: number): void {
    if (status >= 1) {
      this.form.disable();
      this.allowEdit = false;
    } else {
      this.allowEdit = true;
      if (no === 1) {
        this.form.enable();
      } else {
        this.form.disable();
      }
    }
  }

  getTypeLabel(type: number): string {
    switch (type) {
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
    switch (status) {
      case 0: return 'Chờ duyệt';
      case 1: return 'Đã duyệt';
      case 2: return 'Từ chối';
      default: return 'Khác';
    }
  }

  onStartDateChange(date: Date, rowData: any): void {
    if (date) {
      const end = new Date(date);
      end.setDate(end.getDate() + 7);
      rowData.EndDate = end;
    } else {
      rowData.EndDate = null;
    }
  }

  submitForm(): void {
    for (const i in this.form.controls) {
      this.form.controls[i].markAsDirty();
      this.form.controls[i].updateValueAndValidity();
    }

    if (this.form.valid || (this.maxNo > 1 && this.allowEdit)) {
      const formValue = this.form.getRawValue();
      let payload: any = {};
      let sd = '';
      let ed = '';

      if (this.maxNo > 1) {
        sd = this.datePipe.transform(this.maxNoDetail.StartDate, 'yyyy-MM-dd') || '';
        ed = this.datePipe.transform(this.maxNoDetail.EndDate, 'yyyy-MM-dd') || '';

        if (new Date(this.maxNoDetail.EndDate) < new Date(this.maxNoDetail.StartDate)) {
          this.notification.warning('Cảnh báo', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
          return;
        }

        payload = {
          ID: formValue.RegistrationID,
          TestTableID: formValue.TestTableID,
          OwnerID: this.maxNoDetail.OwnerID,
          ApproverID: this.maxNoDetail.ApproverID,
          ProjectCode: formValue.ProjectCode,
          ProjectID: formValue.ProjectID,
          RegistrationContent: formValue.RegistrationContent,
          StartDate: sd,
          EndDate: ed,
          IsDelete: formValue.IsDelete || false,
          Status: this.maxNoDetail.Status,
          Type: this.maxNoDetail.Type,
          No: this.maxNoDetail.No
        };
      } else {
        if (formValue.EndDate < formValue.StartDate) {
          this.notification.warning('Cảnh báo', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
          return;
        }
        sd = this.datePipe.transform(formValue.StartDate, 'yyyy-MM-dd') || '';
        ed = this.datePipe.transform(formValue.EndDate, 'yyyy-MM-dd') || '';

        payload = {
          ID: formValue.RegistrationID,
          TestTableID: formValue.TestTableID,
          OwnerID: formValue.OwnerID,
          ApproverID: formValue.ApproverID,
          ProjectCode: formValue.ProjectCode,
          ProjectID: formValue.ProjectID,
          RegistrationContent: formValue.RegistrationContent,
          StartDate: sd,
          EndDate: ed,
          IsDelete: formValue.IsDelete || false,
          Status: 0,
          Type: 1,
          No: 1
        };
      }

      this.loading = true;

      // Check conflict
      this.eslService.checkConflict({
        testTableId: payload.TestTableID,
        startDate: sd,
        endDate: ed,
        excludeDetailId: this.maxNo > 1 ? this.maxNoDetail.ID : (formValue.DetailID > 0 ? formValue.DetailID : undefined)
      }).subscribe({
        next: (resConflict: any) => {
          if (resConflict.status === 1) {
            // Save
            this.eslService.save(payload).pipe(finalize(() => this.loading = false)).subscribe({
              next: (res: any) => {
                if (res.status === 1) {
                  this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
                  if (this.activeModal) {
                    this.activeModal.close(true);
                  } else {
                    this.tabService.notifyDataSaved('esl-test-registration');
                    this.tabService.closeTabByKey(this.compID);
                  }
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

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else {
      this.tabService.closeTabByKey(this.compID);
    }
  }
}

