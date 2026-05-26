import { Component, Input, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HRRecruitmentCandidateService } from '../hr-recruitment-candidate.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

export interface CandidateRejectionMail {
  candidateId: any;
  candidateName: string;
  position: string;
  toEmail: string;
  subject: string;
  extraHtml: string;
  signature: string;
}

@Component({
  selector: 'app-hr-rejection-letter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzTabsModule,
    NzToolTipModule,
    NzSelectModule,
  ],
  templateUrl: './hr-rejection-letter.component.html',
  styleUrl: './hr-rejection-letter.component.css',
})
export class HrRejectionLetterComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private hRRecruitmentCandidateService: HRRecruitmentCandidateService,
    private sanitizer: DomSanitizer
  ) { }

  @Input() candidates: any[] = [];
  @ViewChildren('editorRef') editorRefs!: QueryList<ElementRef>;
  isSending = false;
  activeTabIndex = 0;

  mails: CandidateRejectionMail[] = [];

  ngOnInit(): void {
    this.mails = this.candidates.map((c) => {
      const m = {
        candidateId: c.ID,
        candidateName: c.FullName || '...',
        position: c.PositionName || '...',
        toEmail: c.Email || '',
        subject: '', // Sẽ được gán qua updateSubject
        extraHtml: '',
        signature: '',
      };
      this.updateSubject(m);
      return m;
    });
  }

  ngAfterViewInit(): void {
    // Set nội dung ban đầu một lần
    setTimeout(() => {
      this.editorRefs.forEach((ref, i) => {
        if (ref.nativeElement && this.mails[i]) {
          ref.nativeElement.innerHTML = this.mails[i].extraHtml || '';
        }
      });
    });
  }

  get activeMail(): CandidateRejectionMail {
    return this.mails[this.activeTabIndex];
  }

  updateSubject(mail: CandidateRejectionMail) {
    if (!mail) return;
    mail.subject = `RTC_THƯ THÔNG BÁO KẾT QUẢ PHỎNG VẤN_${(mail.candidateName || '').toUpperCase()}_${(mail.position || '').toUpperCase()}`;
  }

  private buildContent(mail: CandidateRejectionMail): string {
    const P = `style="font-size:11.5pt;font-family:'Times New Roman',serif;text-align:justify;margin:0;line-height:130%;"`;

    const intro = `
      <p ${P}>Kính gửi: Anh/Chị <strong>${mail.candidateName}</strong>,</p>
      <br>
      <p ${P}><strong>Công ty Cổ phần RTC Technology Việt Nam</strong> trân trọng cảm ơn Anh/Chị đã sắp xếp thời gian tham gia phỏng vấn vị trí <strong>${mail.position}</strong>.</p>

      <p ${P}>Qua buổi phỏng vấn, chúng tôi đánh giá cao một số kinh nghiệm của Anh/Chị. Tuy nhiên, ở thời điểm hiện tại, Anh/Chị chưa thực sự phù hợp với vị trí mà Chúng tôi tuyển dụng.</p>
 
      <p ${P}>Chúc Anh/Chị may mắn trong quá trình tìm việc và mong rằng có thể hợp tác với Anh/Chị trong tương lai.</p>

      <p ${P}><i>Trân trọng!</i></p>
    `;

    const extra = mail.extraHtml ? `<div style="margin-top:12px; font-family:'Times New Roman',serif; font-size:11.5pt;">${mail.extraHtml}</div>` : '';
    const sig = mail.signature ? `<br><br><p style="font-size:11.5pt;font-family:'Times New Roman',serif;margin:0;line-height:130%;"><i>${mail.signature.replace(/\n/g, '<br>')}</i></p>` : '';

    return `<div>${intro}${extra}${sig}</div>`;
  }

  // Dùng cho preview trong UI
  getPreviewBody(mail: CandidateRejectionMail): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.buildContent(mail));
  }

  // Dùng cho API gửi mail (wrapped HTML hoàn chỉnh)
  getMailBody(mail: CandidateRejectionMail): string {
    return `<!DOCTYPE html><html><body style="font-family:'Times New Roman',serif;font-size:14px;color:#222;margin:0;padding:10px 24px;">${this.buildContent(mail)}</body></html>`;
  }

  onEditorInput(i: number, event: Event) {
    if (this.mails[i]) {
      this.mails[i].extraHtml = (event.target as HTMLElement).innerHTML;
    }
  }

  onSend() {
    // Validate từng mail
    for (let i = 0; i < this.mails.length; i++) {
      const mail = this.mails[i];

      if (!mail.toEmail?.trim()) {
        this.activeTabIndex = i;
        this.notification.error(NOTIFICATION_TITLE.error, `[Ứng viên ${i + 1}] Vui lòng nhập email người nhận!`);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(mail.toEmail.trim())) {
        this.activeTabIndex = i;
        this.notification.error(NOTIFICATION_TITLE.error, `[Ứng viên ${i + 1}] "${mail.toEmail}" không đúng định dạng email!`);
        return;
      }

      if (!mail.subject?.trim()) {
        this.activeTabIndex = i;
        this.notification.error(NOTIFICATION_TITLE.error, `[Ứng viên ${i + 1}] Vui lòng nhập tiêu đề email!`);
        return;
      }
    }

    this.isSending = true;

    // Chuẩn bị payload gửi mail
    const mailPayload = this.mails.map(mail => ({
      ID: mail.candidateId,
      Subject: mail.subject,
      EmailTo: mail.toEmail,
      Body: this.getMailBody(mail),
      EmailCC: '',
      StatusSend: 4, // 4 = Từ chối/Không đạt
      DateSend: null,
      DeadlineFeedbackMail: null,
    }));

    // Gửi email từ chối
    this.hRRecruitmentCandidateService.sendOfferLetterMail(mailPayload).subscribe({
      next: () => {
        // Cập nhật trạng thái ứng viên sang "Kết quả không đạt" (status = 4)
        const statusPayload = {
          listIds: this.mails.map(m => m.candidateId),
          Status: 4,
          isApproved: true,
          NoteLog: 'Gửi thư thông báo kết quả không đạt',
        };

        this.hRRecruitmentCandidateService.updateStatus(statusPayload).subscribe({
          next: () => {
            this.isSending = false;
            this.notification.success(NOTIFICATION_TITLE.success, `Đã gửi thư từ chối tuyển dụng và cập nhật trạng thái không đạt cho ${this.mails.length} ứng viên!`);
            this.activeModal.close('sent');
          },
          error: (err: any) => {
            this.isSending = false;
            this.notification.warning(NOTIFICATION_TITLE.warning, `Đã gửi mail thành công nhưng lỗi cập nhật trạng thái ứng viên: ${err?.error?.message || err?.message}`);
            this.activeModal.close('sent');
          }
        });
      },
      error: (err: any) => {
        this.isSending = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Có lỗi xảy ra khi gửi email!');
      },
    });
  }

  onCancel() {
    this.activeModal.dismiss();
  }
}
