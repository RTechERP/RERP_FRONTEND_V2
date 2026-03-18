import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MessageService } from 'primeng/api';
import { HRRecruitmentExamService } from '../../../hr-recruitment/HRRecruitmentExam/hr-recruitment-exam-service/hrrecruitment-exam.service';
import { HRHiringRequestExamService } from '../hrhiring-request-exam.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';

@Component({
  selector: 'app-hrhiring-request-exam-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzIconModule,
    NzFormModule,
    NzCheckboxModule,
    TableModule,
    ButtonModule
  ],
  templateUrl: './hrhiring-request-exam-detail.component.html',
  styleUrl: './hrhiring-request-exam-detail.component.css',
  providers: [MessageService]
})
export class HRHiringRequestExamDetailComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() editData: any = null;

  recordId: number | null = null;

  departments: any[] = [];
  hiringRequests: any[] = [];
  exams: any[] = [];

  selectedDepartmentId: number | null = null;
  selectedHiringRequestId: number | null = null;
  selectedExams: any[] = [];
  initialExamIds: number[] = [];
  isActive: boolean = true;

  loading: boolean = false;

  constructor(
    private recruitmentExamService: HRRecruitmentExamService,
    private hiringRequestExamService: HRHiringRequestExamService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.initData();
  }

  initData(): void {
    if (this.editData) {
      if (this.isEditMode) {
        this.recordId = this.editData.ID;
      }
      this.selectedDepartmentId = this.editData.DepartmentID || this.editData.EmployeeChucVuHDID || 0;
      this.isActive = this.editData.Status !== undefined ? this.editData.Status : true;

      // Load hiring requests for the department
      if (this.selectedDepartmentId !== null) {
        this.recruitmentExamService.getDataCbbHiringRequest(this.selectedDepartmentId).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.hiringRequests = res.data.map((hr: any) => ({
                value: hr.ID || hr.Id,
                label: hr.EmployeeChucVuHDName || hr.PositionName || hr.Name
              }));
              this.selectedHiringRequestId = this.editData.HiringRequestID;
              this.cdr.detectChanges();
            }
          }
        });
      } else {
        this.selectedHiringRequestId = this.editData.HiringRequestID;
      }

      if (this.isEditMode) {
        this.loadAllExams(this.editData.ExamIDs);
      } else {
        this.loadAllExams();
      }
    } else {
      this.loadAllExams();
    }
  }

  loadDepartments(): void {
    console.log('loadDepartments calling...');
    this.recruitmentExamService.getDataDepartment().subscribe({
      next: (res) => {
        console.log('loadDepartments success:', res);
        if (res.status === 1) {
          // Map to standard { value, label } structure
          this.departments = res.data.map((d: any) => ({
            value: d.ID || d.Id,
            label: d.Name || d.DepartmentName
          }));
          // Prepend "All" option
          this.departments.unshift({ value: 0, label: 'Tất cả' });
          console.log('Mapped departments:', this.departments);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  loadAllExams(selectedExamIds?: number[]): void {
    console.log('loadAllExams calling...');
    // 0 to get all exams for grouping by department
    this.recruitmentExamService.getExams(0, '').subscribe({
      next: (res) => {
        console.log('loadAllExams success:', res);
        if (res.status === 1) {
          // Sort by DepartmentName to ensure proper grouping in the table
          this.exams = res.data.sort((a: any, b: any) => {
            const nameA = (a.DepartmentName || '').toUpperCase();
            const nameB = (b.DepartmentName || '').toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          });

          // Pre-select exams in edit mode
          if (selectedExamIds && selectedExamIds.length > 0) {
            this.initialExamIds = [...selectedExamIds];
            // Compare with ID from recruitment exam. 
            // The table value objects from recruitmentExamService.getExams(0, '') usually have ID as primary key.
            this.selectedExams = this.exams.filter(e => {
              const examId = e.ID || e.ExamID || e.Id;
              return selectedExamIds.includes(examId);
            });
            this.cdr.detectChanges();
          }
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  onDepartmentChange(departmentId: number): void {
    this.selectedHiringRequestId = null;
    this.hiringRequests = [];
    if (departmentId !== null && departmentId !== undefined) {
      this.recruitmentExamService.getDataCbbHiringRequest(departmentId).subscribe({
        next: (res) => {
          if (res.status === 1) {
            // Map to standard { value, label } structure
            this.hiringRequests = res.data.map((hr: any) => ({
              value: hr.ID || hr.Id,
              label: hr.EmployeeChucVuHDName || hr.PositionName || hr.Name
            }));
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error loading hiring requests:', err);
        }
      });
    }
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  resetForm(): void {
    if (!this.isEditMode) {
      this.selectedDepartmentId = null;
      this.selectedHiringRequestId = null;
      this.hiringRequests = [];
      this.selectedExams = [];
    }
  }

  onSave(isAddNew: boolean = false): void {
    if (!this.selectedHiringRequestId) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng chọn Yêu cầu tuyển dụng' });
      return;
    }

    if (!this.selectedExams || this.selectedExams.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng chọn ít nhất 1 bài thi' });
      return;
    }

    this.loading = true;
    const currentExamIds = this.selectedExams.map(exam => exam.ID || exam.ExamID || exam.Id);

    // Calculate deleted exams: IDs that were initially present but are no longer selected
    const deletedExamIds = this.initialExamIds.filter(id => !currentExamIds.includes(id));

    const savePayload = {
      IsActiveExam: this.isActive,
      HiringRequestID: this.selectedHiringRequestId,
      listHiringRequestIDExam: currentExamIds,
      deletedHiringRequestIDExam: deletedExamIds
    };

    this.hiringRequestExamService.saveData(savePayload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 1) {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Lưu thiết lập bài thi thành công' });
          if (isAddNew) {
            this.resetForm();
            this.selectedExams = [];
            this.cdr.detectChanges();
          } else {
            this.activeModal.close({ success: true });
          }
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: res.message || 'Lưu thất bại' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }
}
