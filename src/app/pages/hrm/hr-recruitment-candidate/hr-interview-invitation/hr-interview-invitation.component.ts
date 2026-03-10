import { Component, Input, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HRRecruitmentCandidateService } from '../hr-recruitment-candidate.service';

export interface CandidateMail {
  candidateId: any;
  candidateName: string;
  position: string;
  toEmail: string;
  subject: string;
  interviewDate: any;
  interviewHour: string;
  interviewMinute: string;
  interviewAddress: string;
  replyDeadlineDate: any;
  replyDeadlineHour: string;
  replyDeadlineMinute: string;
  contactPhone: string;
  contactEmail: string;
  extraHtml: string;
  signature: string;
  round1InterviewDate: any; // Ngày phỏng vấn vòng 1 (chỉ dùng cho round 2)
}

@Component({
  selector: 'app-hr-interview-invitation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzTabsModule,
    NzToolTipModule,
    NzSelectModule,
  ],
  templateUrl: './hr-interview-invitation.component.html',
  styleUrl: './hr-interview-invitation.component.css',
})
export class HrInterviewInvitationComponent implements OnInit, AfterViewInit {
  @Input() candidates: any[] = [];
  @Input() round: number = 1;
  @ViewChildren('editorRef') editorRefs!: QueryList<ElementRef>;

  isSending = false;
  activeTabIndex = 0;
  previewIndex = -1; // -1 = không preview

  mails: CandidateMail[] = [];

  hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  ngOnInit(): void {
    this.mails = this.candidates.map((c) => ({
      candidateId: c.ID,
      candidateName: c.FullName || '...',
      position: c.PositionName || '...',
      toEmail: c.Email || '',
      subject: this.round === 1 ? `RTC_THƯ MỜI PHỎNG VẤN VỊ TRÍ ${c.PositionName.toUpperCase() || '...'}_${c.FullName.toUpperCase() || '...'}`
        : `RTC_THƯ MỜI PHỎNG VẤN VÒNG 2 VỊ TRÍ ${c.PositionName.toUpperCase() || '...'}_${c.FullName.toUpperCase() || '...'}`,
      interviewDate: null,
      interviewHour: '08',
      interviewMinute: '00',
      interviewAddress: 'Công ty Cổ phần RTC Technology Việt Nam',
      replyDeadlineDate: null,
      replyDeadlineHour: '17',
      replyDeadlineMinute: '00',
      contactPhone: '0965 513 189',
      contactEmail: 'Tuyendung@rtc.edu.vn',
      extraHtml: '',
      signature: '(Chữ ký chân email)',
      round1InterviewDate: c.DateInterview ? new Date(c.DateInterview) : null,
    }));
  }

  ngAfterViewInit(): void {
    // Set nội dung ban đầu một lần, không dùng [innerHTML] binding để tránh reset cursor
    setTimeout(() => {
      this.editorRefs.forEach((ref, i) => {
        if (ref.nativeElement && this.mails[i]) {
          ref.nativeElement.innerHTML = this.mails[i].extraHtml || '';
        }
      });
    });
  }

  get activeMail(): CandidateMail {
    return this.mails[this.activeTabIndex];
  }

  formatDate(val: any): string {
    if (!val) return '.../.../.....';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '.../.../.....';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  private buildContent(mail: CandidateMail): string {
    const P = `style="margin:2px 0;line-height:1.6;"`;
    const time = mail.interviewDate
      ? `${mail.interviewHour}h${mail.interviewMinute} ngày ${this.formatDate(mail.interviewDate)}`
      : `${mail.interviewHour}h${mail.interviewMinute} ngày .../.../.....`;

    const replyDeadline = mail.replyDeadlineDate
      ? `${mail.replyDeadlineHour}h${mail.replyDeadlineMinute} ngày ${this.formatDate(mail.replyDeadlineDate)}`
      : `${mail.replyDeadlineHour}h${mail.replyDeadlineMinute} ngày .../.../.....`;

    const intro = this.round === 2
      ? `<p ${P}>Công ty Cổ phần RTC Technology Việt Nam chân thành cảm ơn Anh/Chị đã sắp xếp thời gian tham gia phỏng vấn vòng 1 vị trí <strong>${mail.position}</strong> ngày ${mail.round1InterviewDate ? this.formatDate(mail.round1InterviewDate) : '.../.../...'}.</p><p ${P}>Qua buổi phỏng vấn, chúng tôi đánh giá cao trình độ và kinh nghiệm của Anh/Chị về vị trí dự tuyển.</p>`
      : `<p ${P}>Công ty Cổ phần RTC Technology Việt Nam đã nhận được thư ứng tuyển vào vị trí <strong>${mail.position}</strong> của Anh/Chị.</p><p ${P}>Sau khi sơ tuyển, chúng tôi nhận thấy kiến thức chuyên môn và kinh nghiệm của Anh/Chị phù hợp để ứng tuyển vào vị trí này.</p>`;

    return `<p ${P}>Kính gửi: Anh/Chị <strong>${mail.candidateName}</strong>,</p>${intro}<p ${P}>Bằng email này, chúng tôi kính mời Anh/Chị đến tham dự buổi phỏng vấn${this.round === 2 ? ' <strong>vòng 2</strong>' : ''} theo thời gian và địa điểm như sau:</p><p ${P}><strong>1. Thời gian:</strong> ${time}</p><p ${P}><strong>2. Địa chỉ:</strong> ${mail.interviewAddress}</p><p ${P}><strong>Mọi thông tin cần hỗ trợ vui lòng liên hệ Bộ phận Tuyển dụng: ${mail.contactPhone}</strong></p><p ${P}>Rất mong Anh/Chị sắp xếp thời gian tham dự buổi phỏng vấn đúng giờ. Khi đi mang theo 01 bộ hồ sơ photo.</p><p ${P}>Anh/chị vui lòng phản hồi về việc tham dự phỏng vấn muộn nhất trước <strong>${replyDeadline}</strong> với Bộ phận Tuyển dụng qua email: <em>${mail.contactEmail}</em></p>${mail.extraHtml ? `<div style="margin:8px 0">${mail.extraHtml}</div>` : ''}<p ${P}>Trân trọng cảm ơn!</p><p><em>${mail.signature.replace(/\n/g, '<br>')}</em></p>`;
  }

  // Dùng cho preview trong UI
  getPreviewBody(mail: CandidateMail): string {
    return this.buildContent(mail);
  }

  // Dùng cho API gửi mail (wrapped HTML hoàn chỉnh)
  getMailBody(mail: CandidateMail): string {
    return `<!DOCTYPE html><html><body style="font-family:'Times New Roman',serif;font-size:14px;color:#222;max-width:720px;margin:0 auto;padding:20px;">${this.buildContent(mail)}</body></html>`;
  }

  // Rich text editor commands
  execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
  }

  onEditorInput(i: number, event: Event) {
    this.mails[i].extraHtml = (event.target as HTMLElement).innerHTML;
  }

  togglePreview(index: number) {
    this.previewIndex = this.previewIndex === index ? -1 : index;
  }

  onSend() {
    // Validate từng mail
    for (let i = 0; i < this.mails.length; i++) {
      const mail = this.mails[i];

      if (!mail.toEmail?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng nhập email người nhận!`);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(mail.toEmail.trim())) {
        this.activeTabIndex = i;
        this.notification.error('Email không hợp lệ', `[Ứng viên ${i + 1}] "${mail.toEmail}" không đúng định dạng email!`);
        return;
      }

      if (!mail.subject?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng nhập tiêu đề email!`);
        return;
      }

      if (!mail.interviewDate) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng chọn ngày phỏng vấn!`);
        return;
      }

      if (!mail.replyDeadlineDate) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng chọn ngày phản hồi!`);
        return;
      }

      const now = new Date();

      const interviewDate = new Date(mail.interviewDate);
      interviewDate.setHours(+mail.interviewHour, +mail.interviewMinute, 0, 0);

      const replyDate = new Date(mail.replyDeadlineDate);
      replyDate.setHours(+mail.replyDeadlineHour, +mail.replyDeadlineMinute, 0, 0);

      if (interviewDate <= now) {
        this.activeTabIndex = i;
        this.notification.error('Thời gian không hợp lệ', `[Ứng viên ${i + 1}] Thời gian phỏng vấn (${mail.interviewHour}:${mail.interviewMinute} ngày ${this.formatDate(mail.interviewDate)}) phải sau thời điểm hiện tại!`);
        return;
      }

      if (replyDate <= now) {
        this.activeTabIndex = i;
        this.notification.error('Thời gian không hợp lệ', `[Ứng viên ${i + 1}] Thời hạn phản hồi (${mail.replyDeadlineHour}:${mail.replyDeadlineMinute} ngày ${this.formatDate(mail.replyDeadlineDate)}) phải sau thời điểm hiện tại!`);
        return;
      }

      if (replyDate >= interviewDate) {
        this.activeTabIndex = i;
        this.notification.error('Thời gian không hợp lệ', `[Ứng viên ${i + 1}] Thời hạn phản hồi phải trước thời gian phỏng vấn!`);
        return;
      }
    }

    this.isSending = true;

    let payload = this.mails.map(mail => ({
      ID: mail.candidateId,
      Subject: mail.subject,
      EmailTo: mail.toEmail,
      Body: this.getMailBody(mail),
      EmailCC: '',
      StatusSend: this.round === 2 ? 2 : 1,
      DateSend: this.round === 2 ? mail.round1InterviewDate : mail.interviewDate,
    }));

    this.service.sendInterviewMail(payload).subscribe({
      next: () => {
        this.isSending = false;
        this.notification.success('Thành công', `Đã gửi ${this.mails.length} mail thành công!`);
        this.activeModal.close('sent');
      },
      error: (err: any) => {
        this.isSending = false;
        this.notification.error('Lỗi gửi mail', err?.error?.message || err?.message || 'Có lỗi xảy ra!');
      },
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private service: HRRecruitmentCandidateService
  ) { }
}


