import {
  Component,
  OnInit,
  Input,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { DateTime } from 'luxon';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DailyReportTechService } from '../DailyReportTechService/daily-report-tech.service';
import { OverTimePersonFormComponent } from '../../hrm/over-time/over-time-person/over-time-person-form/over-time-person-form.component';

interface ReportItem {
  ID: number;
  Content: string;
  Results: string;
  TotalHours: number;
  TotalHourOT: number;
  Problem: string;
  ProblemSolve: string;
  Backlog: string;
  Note: string;
}

@Component({
  selector: 'app-daily-report-hr-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzCollapseModule,
    NzRadioModule,
  ],
  templateUrl: './daily-report-hr-detail.component.html',
  styleUrl: './daily-report-hr-detail.component.css'
})
export class DailyReportHrDetailComponent implements OnInit, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataInput: any;
  @Input() currentUser: any;

  formGroup: FormGroup;
  saving: boolean = false;

  // Danh sách báo cáo (không dùng tab, dùng list) - giữ lại để tương thích với code cũ
  reportList: ReportItem[] = [];
  activeReportIndex: number = 0;

  // Nơi làm việc (chung cho tất cả)
  workLocation: number = 1; // 1: VP RTC, 0: Địa điểm khác
  workLocationText: string = 'VP RTC';

  // Accordion state
  activeAccordion: { [key: string]: boolean } = {
    additional_info: false
  };

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private modalService: NzModalService,
    private dailyReportTechService: DailyReportTechService,
    private ngbModal: NgbModal,
  ) {
    this.formGroup = this.fb.group({
      DateReport: [null, [Validators.required]],
      Content: ['', [Validators.required]],
      Results: ['', [Validators.required]],
      PlanNextDay: ['', [Validators.required]],
      Problem: [{value: '', disabled: true}],
      ProblemSolve: [{value: '', disabled: true}],
      Backlog: [''],
      Note: [''],
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.dataInput) {
      const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);
      
      if (dailyID) {
        this.loadDataForEdit(dailyID);
      }
    } else {
      // Set ngày báo cáo mặc định theo quy tắc 9h sáng
      const now = DateTime.local();
      const currentHour = now.hour;
      
      if (currentHour >= 0 && currentHour <= 9) {
        this.formGroup.patchValue({
          DateReport: null
        });
      } else {
        this.formGroup.patchValue({
          DateReport: now.toJSDate()
        });
      }
    }
  }

  loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDataByID(dailyID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = Array.isArray(response.data) ? response.data[0] : response.data;
          this.populateForm(data);
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tải dữ liệu báo cáo!');
        }
      },
      error: (error: any) => {
        console.error('Error loading daily report data:', error);
        this.notification.error('Lỗi', error?.error?.message || error?.message || 'Đã xảy ra lỗi khi tải dữ liệu!');
      }
    });
  }

  private populateForm(data: any): void {
    // Set tất cả giá trị vào formGroup
    const dateReport = data.DateReport ? DateTime.fromISO(data.DateReport).toJSDate() : null;
    this.formGroup.patchValue({
      DateReport: dateReport,
      Content: data.Content || '',
      Results: data.Results || '',
      PlanNextDay: data.PlanNextDay || '',
      Problem: data.Problem || '',
      ProblemSolve: data.ProblemSolve || '',
      Backlog: data.Backlog || '',
      Note: data.Note || ''
    });

    // Reset reportList và thêm 1 dòng từ data (giữ lại để tương thích)
    this.reportList = [];
    const reportItem: ReportItem = {
      ID: data.ID || 0,
      Content: data.Content || '',
      Results: data.Results || '',
      TotalHours: data.TotalHours || 0,
      TotalHourOT: data.TotalHourOT || 0,
      Problem: data.Problem || '',
      ProblemSolve: data.ProblemSolve || '',
      Backlog: data.Backlog || '',
      Note: data.Note || ''
    };
    this.reportList.push(reportItem);
    this.activeReportIndex = 0;

    // Set workLocation
    const locationText = data.Location || data.LocationText || '';
    if (locationText.trim().toUpperCase() === 'VP RTC') {
      this.workLocation = 1;
      this.workLocationText = 'VP RTC';
    } else {
      this.workLocation = 0;
      this.workLocationText = locationText;
    }
  }
  ngAfterViewInit(): void {
    
  }

  disabledDate = (current: Date): boolean => {
    const today = DateTime.local().startOf('day');
    const oneDayAgo = today.minus({ days: 1 });
    const currentDate = DateTime.fromJSDate(current).startOf('day');
    return currentDate < oneDayAgo;
  };

  onWorkLocationChange(location: number): void {
    this.workLocation = location;
    if (location === 1) {
      this.workLocationText = 'VP RTC';
    } else {
      this.workLocationText = '';
    }
  }

  toggleAccordion(key: string): void {
    this.activeAccordion[key] = !this.activeAccordion[key];
  }

  generateSummary(): string {
    const dateReport = this.formGroup.get('DateReport')?.value;
    const dateReportStr = dateReport ? DateTime.fromJSDate(dateReport).toFormat('dd/MM/yyyy') : '';

    // Lấy dữ liệu từ formGroup
    const content = this.formGroup.get('Content')?.value || '';
    const resultReport = this.formGroup.get('Results')?.value || '';
    const backlog = this.formGroup.get('Backlog')?.value || '';
    const problem = this.formGroup.get('Problem')?.value || '';
    const problemSolve = this.formGroup.get('ProblemSolve')?.value || '';
    const note = this.formGroup.get('Note')?.value || '';
    const planNextDay = this.formGroup.get('PlanNextDay')?.value || '';

    // Format theo RTCWeb cho HR (không có ProjectID)
    // Không có phần "* Mã dự án - Tên dự án:"
    let contentSummary = `Báo cáo công việc ngày ${dateReportStr}\n`;
    contentSummary += `\n* Nội dung công việc:\n${content.trim()}\n`;
    contentSummary += `\n* Kết quả công việc:\n${resultReport.trim()}\n`;
    contentSummary += `\n* Tồn đọng:\n${backlog.trim() === '' ? '- Không có' : backlog.trim()}\n`;
    // HR có phần "Lý do tồn đọng" (thay vì "Ghi chú" như Technical)
    contentSummary += `\n* Lý do tồn đọng:\n${note.trim() === '' ? '- Không có' : note.trim()}\n`;
    contentSummary += `\n* Vấn đề phát sinh:\n${problem.trim() === '' ? '- Không có' : problem.trim()}\n`;
    contentSummary += `\n* Giải pháp cho vấn đề phát sinh:\n${problemSolve.trim() === '' ? '- Không có' : problemSolve.trim()}\n`;
    contentSummary += `\n* Kế hoạch ngày tiếp theo:\n${planNextDay.trim() === '' ? '- Không có' : planNextDay.trim()}\n`;

    return contentSummary;
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  }

  openPreviewModal(): void {
    const summaryContent = this.generateSummary();
   
    if (!summaryContent || summaryContent.trim() === '') {
      return;
    }
   
    const escapedContent = summaryContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
   
    const modal = this.modalService.create({
      nzTitle: 'Tổng hợp báo cáo',
      nzContent: `
        <div style="max-height: 60vh; overflow-y: auto; padding: 10px;">
          <pre style="
            width: 100%; 
            padding: 15px; 
            font-family: 'Courier New', monospace; 
            font-size: 13px; 
            line-height: 1.6;
            background-color: #f5f5f5;
            border: 1px solid #d9d9d9; 
            border-radius: 4px; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            margin: 0;
          ">${escapedContent}</pre>
        </div>
      `,
      nzFooter: [
        {
          label: 'Huỷ',
          onClick: () => modal.destroy()
        },
        {
          label: 'Báo cáo',
          type: 'primary',
          onClick: async () => {
            const copySuccess = await this.copyToClipboard(summaryContent);
            if (copySuccess) {
              this.notification.success('Thông báo', 'Đã copy nội dung báo cáo vào clipboard!');
            } else {
              this.notification.warning('Thông báo', 'Không thể copy vào clipboard. Vui lòng copy thủ công.');
            }
            
            this.submitDailyReport();
            modal.destroy();
          }
        }
      ],
      nzWidth: '90%',
      nzStyle: { top: '20px' },
      nzClosable: true,
      nzMaskClosable: false
    });
  }


  private validateFlatData(): { isValid: boolean; message: string } {
    // Mark all fields as touched để hiển thị lỗi
    this.formGroup.markAllAsTouched();

    // Validate DateReport
    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      return { isValid: false, message: 'Vui lòng nhập Ngày báo cáo!' };
    }

    // Validate Content
    const content = this.formGroup.get('Content')?.value;
    if (!content || content.trim() === '') {
      return { isValid: false, message: 'Vui lòng nhập Nội dung công việc!' };
    }

    // Validate Results
    const results = this.formGroup.get('Results')?.value;
    if (!results || results.trim() === '') {
      return { isValid: false, message: 'Vui lòng nhập Kết quả!' };
    }

    // Validate PlanNextDay
    const planNextDay = this.formGroup.get('PlanNextDay')?.value;
    if (!planNextDay || planNextDay.trim() === '') {
      return { isValid: false, message: 'Vui lòng nhập Kế hoạch ngày tiếp theo!' };
    }

    return { isValid: true, message: '' };
  }

  submitDailyReport(): void {
    if (this.saving) {
      return;
    }

    const dateReport = this.formGroup.get('DateReport')?.value;
    if (!dateReport) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày báo cáo!');
      return;
    }

    const validation = this.validateFlatData();
    if (!validation.isValid) {
      this.notification.warning('Thông báo', validation.message);
      return;
    }

    // Lấy ID từ reportList nếu đang edit
    let reportID = 0;
    if (this.mode === 'edit' && this.reportList.length > 0 && this.reportList[0].ID > 0) {
      reportID = this.reportList[0].ID;
    }

    // Tạo dữ liệu từ formGroup
    const dateReportStr = DateTime.fromJSDate(dateReport).toFormat('yyyy-MM-dd');
    const userReport = this.currentUser?.ID || 0;

    const report: any = {
      ID: reportID,
      UserReport: userReport,
      DateReport: dateReportStr,
      Content: this.formGroup.get('Content')?.value || '',
      Results: this.formGroup.get('Results')?.value || '',
      Problem: this.formGroup.get('Problem')?.value || '',
      ProblemSolve: this.formGroup.get('ProblemSolve')?.value || '',
      PlanNextDay: this.formGroup.get('PlanNextDay')?.value || '',
      Note: this.formGroup.get('Note')?.value || '',
      Backlog: this.formGroup.get('Backlog')?.value || '',
      Location: this.workLocationText || ''
    };

    this.saving = true;

    this.dailyReportTechService.saveReportHr(report).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.status === 1) {
          this.notification.success('Thông báo', response.message || 'Báo cáo đã được lưu thành công!');
          
          this.sendEmailAfterSave();
          
          this.close(true);
        } else {
          this.notification.error('Thông báo', response?.message || 'Lưu báo cáo thất bại!');
        }
      },
      error: (error: any) => {
        this.saving = false;
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu báo cáo!';
        this.notification.error('Thông báo', errorMessage);
      }
    });
  }

  private sendEmailAfterSave(): void {
    try {
      const summaryContent = this.generateSummary();
      
      if (!summaryContent || summaryContent.trim() === '') {
        return;
      }

      const dateReport = this.formGroup.get('DateReport')?.value;

      this.dailyReportTechService.sendEmailReport(summaryContent, dateReport).subscribe({
        next: (response: any) => {
          // Email đã được gửi thành công (không cần thông báo)
        },
        error: (error: any) => {
          console.error('Error sending email:', error);
        }
      });
    } catch (error) {
      console.error('Error in sendEmailAfterSave:', error);
    }
  }

  saveDailyReport(): void {
    if (this.saving) {
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      
      const errors: string[] = [];
      
      if (this.formGroup.get('DateReport')?.hasError('required')) {
        errors.push('Ngày báo cáo');
      }
      if (this.formGroup.get('Content')?.hasError('required')) {
        errors.push('Nội dung công việc');
      }
      if (this.formGroup.get('Results')?.hasError('required')) {
        errors.push('Kết quả');
      }
      if (this.formGroup.get('PlanNextDay')?.hasError('required')) {
        errors.push('Kế hoạch ngày tiếp theo');
      }
      
      if (errors.length > 0) {
        this.notification.warning('Thông báo', `Vui lòng điền đầy đủ các trường bắt buộc: ${errors.join(', ')}`);
      } else {
        this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      }
      return;
    }

    const flatValidation = this.validateFlatData();
    if (!flatValidation.isValid) {
      this.notification.warning('Thông báo', flatValidation.message);
      return;
    }

    this.openPreviewModal();
  }

  close(success: boolean = false): void {
    this.activeModal.close(success);
  }

  openOverTimeModal(): void {
    try {
      const modalRef = this.ngbModal.open(OverTimePersonFormComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        windowClass: 'overtime-modal-custom'
      });
      
      if (!modalRef) {
        this.notification.error('Lỗi', 'Không thể mở modal làm thêm!');
        return;
      }
      
      if (modalRef.componentInstance) {
        modalRef.componentInstance.data = null;
        modalRef.componentInstance.isEditMode = false;
      }
      
      modalRef.result.then(
        (result) => {
          // Modal đóng
        },
        (reason) => {
          // Modal bị đóng mà không có kết quả
        }
      ).catch((error) => {
        console.error('Error in modal result:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi mở modal làm thêm!');
      });
    } catch (error) {
      console.error('Error in openOverTimeModal:', error);
      this.notification.error('Lỗi', 'Không thể mở modal làm thêm! Vui lòng thử lại.');
    }
  }
}
