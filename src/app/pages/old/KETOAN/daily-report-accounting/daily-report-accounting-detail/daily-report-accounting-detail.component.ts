import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DailyReportAccountingService } from '../daily-report-accounting-service/daily-report-accounting.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ID_ADMIN_SALE_LIST } from '../../../../../app.config';

@Component({
  selector: 'app-daily-report-accounting-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzFormModule,
    CommonModule,
  ],
  templateUrl: './daily-report-accounting-detail.component.html',
  styleUrl: './daily-report-accounting-detail.component.css'
})
export class DailyReportAccountingDetailComponent implements OnInit {
  @Input() editId: number = 0;
  dailyReportForm!: FormGroup;
  isSubmitted: boolean = false;

  isAdmin: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;



  // Data sources
  users: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private dailyReportAccountingService: DailyReportAccountingService,
    private appUserService: AppUserService,
  ) {


    this.initForm();
  }

  get reports(): FormArray {
    return this.dailyReportForm.get('reports') as FormArray;
  }

  initForm(): void {
    this.dailyReportForm = this.fb.group({
      reports: this.fb.array([])
    });
  }

  createReportGroup(): FormGroup {
    return this.fb.group({
      id: [0],
      employeeId: [null, Validators.required],
      reportDate: [new Date(), Validators.required],
      content: ['', Validators.required],
      result: ['', Validators.required],
      nextPlan: ['', Validators.required],
      pendingIssues: [''],
      urgent: [''],
      mistakeOrViolation: ['']
    });
  }

  ngOnInit(): void {
    const currentUser = this.appUserService.currentUser;
    const currentUserId = this.appUserService.id || 0;
    const hasN1 = this.appUserService.hasPermission('N1') || (currentUser?.Permissions ? currentUser.Permissions.split(',').includes('N1') : false);
    const hasN52 = this.appUserService.hasPermission('N52') || (currentUser?.Permissions ? currentUser.Permissions.split(',').includes('N52') : false);
    this.isAdmin = this.appUserService.isAdmin || hasN1 || hasN52 || ID_ADMIN_SALE_LIST.includes(currentUserId);

    this.loadUsers();

    if (this.editId > 0) {
      this.isEditMode = true;
      this.loadExistingData();
    } else {
      this.addReport();
    }
  }

  addReport(): void {
    const reportGroup = this.createReportGroup();

    // Always set to current user initially
    const currentEmployeeId = this.appUserService.employeeID;
    if (currentEmployeeId) {
      reportGroup.patchValue({ employeeId: currentEmployeeId });
    }

    // Disable if not admin
    if (!this.isAdmin) {
      reportGroup.get('employeeId')?.disable();
    }

    this.reports.push(reportGroup);
  }

  removeReport(index: number): void {
    if (this.reports.length > 1) {
      this.reports.removeAt(index);
    }
  }

  loadExistingData(): void {
    this.isLoading = true;
    this.dailyReportAccountingService.getById(this.editId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const data = response.data;
          const reportGroup = this.createReportGroup();

          // Disable if not admin
          if (!this.isAdmin) {
            reportGroup.get('employeeId')?.disable();
          }

          reportGroup.patchValue({
            id: data.Id || data.ID || 0,
            employeeId: data.EmployeeID || null,
            reportDate: data.ReportDate ? new Date(data.ReportDate) : null,
            content: data.Content || '',
            result: data.Result || '',
            nextPlan: data.NextPlan || '',
            pendingIssues: data.PendingIssues || '',
            urgent: data.Urgent || '',
            mistakeOrViolation: data.MistakeOrViolation || '',
          });

          this.reports.push(reportGroup);
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading existing data:', error);
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải dữ liệu');
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.dailyReportAccountingService.getEmployees().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.users = (response.data || []).filter((item: any) => item.FullName && item.FullName.trim().length > 0);
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
        console.error('Error loading employees:', error);
      }
    });
  }

  getFormData(): any[] {
    const formatDate = (date: any): string => {
      if (!date) return '';
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') return new Date(date).toISOString();
      return '';
    };

    return this.reports.controls.map(control => {
      const formValue = control.getRawValue();
      return {
        Id: formValue.id || 0,
        EmployeeID: formValue.employeeId,
        ReportDate: formatDate(formValue.reportDate).split('T')[0], // Backend expects DateOnly format theoretically, or string
        Content: formValue.content,
        Result: formValue.result,
        NextPlan: formValue.nextPlan,
        PendingIssues: formValue.pendingIssues,
        Urgent: formValue.urgent,
        MistakeOrViolation: formValue.mistakeOrViolation,
      };
    });
  }

  saveAndClose(): void {
    this.isSubmitted = true;

    if (this.dailyReportForm.invalid) {
      this.reports.controls.forEach(group => {
        Object.keys((group as FormGroup).controls).forEach(key => {
          group.get(key)?.markAsDirty();
          group.get(key)?.updateValueAndValidity();
        });
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSaving = true;
    const dataToSave = this.getFormData();

    this.dailyReportAccountingService.save(dataToSave).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Lưu báo cáo thành công!');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu thất bại!');
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving data:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lưu dữ liệu!');
        this.isSaving = false;
      }
    });
  }

  closeModal(): void {
    this.activeModal.close({ success: false, reloadData: false });
  }
}
