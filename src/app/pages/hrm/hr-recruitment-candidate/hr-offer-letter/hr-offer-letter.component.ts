import { Component, Input, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HRRecruitmentCandidateService } from '../hr-recruitment-candidate.service';
import { HrRecruitmentApproveService } from '../../hr-recruitment/hr-recruitment-approve/hr-recruitment-approve.service';

export interface CandidateOfferMail {
  candidateId: any;
  candidateName: string;
  positionType: 'official' | 'internship';
  position: string;
  department: string;
  reportingTo: string;
  toEmail: string;
  subject: string;
  // Văn bản
  docNumber: string;
  signDate: any;
  // Thời gian nhận việc
  startDate: any;
  startTimeHour: string;
  startTimeMinute: string;
  // Chế độ lương
  salary: number | null;
  probationSalary: string;
  probationPeriod: string;
  // Deadline phản hồi
  replyDeadlineDate: any;
  replyDeadlineHour: string;
  replyDeadlineMinute: string;
  // Thông tin khác
  workAddress: string;
  workTimeText: string;
  contactPhone: string;
  contactEmail: string;
  extraHtml: string;
  signature: string;
}

@Component({
  selector: 'app-hr-offer-letter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzTabsModule,
    NzToolTipModule,
    NzSelectModule,
  ],
  templateUrl: './hr-offer-letter.component.html',
  styleUrl: './hr-offer-letter.component.css',
})
export class HrOfferLetterComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private hRRecruitmentCandidateService: HRRecruitmentCandidateService,
    private hrRecruitmentApproveService: HrRecruitmentApproveService,
    private sanitizer: DomSanitizer
  ) { }
  @Input() candidates: any[] = [];
  @ViewChildren('editorRef') editorRefs!: QueryList<ElementRef>;
  isSending = false;
  activeTabIndex = 0;
  previewIndex = -1; // -1 = không preview

  mails: CandidateOfferMail[] = [];

  hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  formatterVND = (value: number | string): string => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  parserVND = (value: string): number => {
    if (!value) return 0;
    const num = Number(value.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  ngOnInit(): void {
    const today = new Date();
    this.mails = this.candidates.map((c) => {

      // Deadline mặc định là 3 ngày sau
      const deadlineD = new Date();
      deadlineD.setDate(today.getDate() + 3);

      // Số văn bản tự động theo năm hiện tại
      const docNo = `56/2026/TMNV-RTC`;

      const m = {
        candidateId: c.ID,
        candidateName: c.FullName || '...',
        positionType: 'official' as 'official' | 'internship',
        position: c.PositionName || '...',
        department: c.DepartmentName || '...',
        reportingTo: 'Trưởng bộ phận',
        toEmail: c.Email || '',
        subject: '', // Sẽ được gán qua updateSubject
        docNumber: docNo,
        signDate: today,
        startDate: c.StartDate,
        startTimeHour: '08',
        startTimeMinute: '00',
        salary: c.BasicSalary ? Number(c.BasicSalary) : null,
        probationSalary: '90%*LCB',
        probationPeriod: c.ProbationPeriod || '02 tháng',
        replyDeadlineDate: deadlineD,
        replyDeadlineHour: '17',
        replyDeadlineMinute: '00',
        workAddress: 'Tầng 1, Khu P, Toà Hateco Apollo, đường 70, phường Phương Canh, Hà Nội',
        workTimeText: 'Từ thứ 2 đến hết thứ 6, thứ 7 làm việc/nghỉ cách tuần.',
        contactPhone: '0965 513 189',
        contactEmail: 'hr@rtc.edu.vn',
        extraHtml: '',
        signature: 'Phòng Hành chính Nhân sự\nCông ty Cổ phần RTC Technology Việt Nam',
      };
      this.updateSubject(m);
      return m;
    });

    // Sau khi build xong mails, tự động nạp lương từ bảng HRRecruitmentApprove
    this.loadSalaryFromApprove();
  }

  /**
   * Với mỗi ứng viên:
   * B1) getDataToHRRecruitApprove(candidateID)  →  HRRecruitmentApplicationFormID
   * B2) getDataHRRecruitmentApprove(formID)     →  BasicSalary, ProbationarySalary, ProbationPeriod, DateStart
   */
  private loadSalaryFromApprove(): void {
    this.candidates.forEach((c, index) => {
      this.hrRecruitmentApproveService.getDataToHRRecruitApprove(c.ID).subscribe({
        next: (res: any) => {
          if (res.status === 1 && res.infomation?.length > 0) {
            const formID = res.infomation[0].HRRecruitmentApplicationFormID;
            if (!formID) return;

            this.hrRecruitmentApproveService.getDataHRRecruitmentApprove(formID).subscribe({
              next: (res2: any) => {
                if (res2.status === 1 && res2.data) {
                  const app = Array.isArray(res2.data) ? res2.data[0] : res2.data;
                  if (app && this.mails[index]) {
                    // Lương chính thức
                    if (app.BasicSalary) {
                      this.mails[index].salary = app.BasicSalary ? Number(app.BasicSalary) : null;
                    }
                    // Thời gian thử việc
                    if (app.ProbationPeriod) {
                      this.mails[index].probationPeriod = app.ProbationPeriod;
                    }
                    if (app.DateStart) {
                      this.mails[index].startDate = new Date(app.DateStart);
                      this.updateSubject(this.mails[index]);
                    }
                  }
                }
              },
              error: () => { /* Giữ nguyên giá trị mặc định */ }
            });
          }
        },
        error: () => { /* Giữ nguyên giá trị mặc định */ }
      });
    });
  }

  formatSalary(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '...';
    let num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return num.toLocaleString('vi-VN');
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

  get activeMail(): CandidateOfferMail {
    return this.mails[this.activeTabIndex];
  }

  updateSubject(mail: CandidateOfferMail) {
    if (!mail) return;
    mail.subject = `RTC_THƯ MỜI NHẬN VIỆC_${(mail.candidateName || '').toUpperCase()}_${(mail.position || '').toUpperCase()}_${this.formatDate(mail.startDate)}`;
  }

  formatDate(val: any): string {
    if (!val) return '.../.../.....';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '.../.../.....';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  private buildContent(mail: CandidateOfferMail): string {
    const TNR = `font-family:'Times New Roman',serif;font-size:11.5pt;line-height:130%;`;
    const P = `style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:130%;"`;
    const Pindent = `style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:28pt;margin:0;line-height:130%;"`;

    const startTimeStr = `${mail.startTimeHour}H${mail.startTimeMinute} ngày ${this.formatDate(mail.startDate)}`;
    const signD = mail.signDate ? new Date(mail.signDate) : new Date();
    const signDateStr = `Hà Nội, ngày ${signD.getDate()} tháng ${String(signD.getMonth() + 1).padStart(2, '0')} năm ${signD.getFullYear()}`;

    const header = `
     <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
        <tr>
          <td style="width: 40%; text-align: center; vertical-align: top; font-size: 16px; font-weight: bold; padding-right: 30px;">
            <strong style="font-size:11.5pt;font-family:Times New Roman,serif;">CÔNG TY CỔ PHẦN<br>RTC TECHNOLOGY VIỆT NAM</strong>
            <div style="border-top: 1px solid #000; height: 0; width: 50%; margin: 2px auto 0;"></div>
          </td>
          <td style="width: 60%; text-align: center; vertical-align: top; font-size: 16px;">
            <strong style="font-size:11.5pt;font-family:Times New Roman,serif;">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
            <span style="font-weight: bold;font-size:11.5pt;font-family:Times New Roman,serif;">Độc lập - Tự do - Hạnh phúc</span>
            <div style="border-top: 1px solid #000; height: 0; width: 26%; margin: 1px auto 0;"></div>
          </td>
        </tr>
        <tr style="height:17.35pt;">
<td valign="top" style="width:191.4pt;height:17.35pt;padding:0 5.4pt;">
<p align="center" style="font-size:12pt;font-family:Aptos,sans-serif;text-align:center;margin:0;line-height:17.0pt;"><span style="font-size:11.5pt;font-family:Times New Roman,serif;">Số: ${mail.docNumber}</span><span lang="pt-BR" style="font-size:11.5pt;font-family:Times New Roman,serif;"></span></p></td>
<td valign="top" style="width:287.6pt;height:17.35pt;padding:0 5.4pt;">
<p align="right" style="font-size:12pt;font-family:Aptos,sans-serif;text-align:right;margin:0;line-height:17.0pt;"><i><span lang="pt-BR" style="font-size:11.5pt;font-family:Times New Roman,serif;">${signDateStr}</span></i></p></td></tr>
      </table>
      <p style="font-size:16px;font-family:'Times New Roman',serif;text-align:center;margin:12pt 0 4pt 0;font-weight:bold;letter-spacing:0.5px;">
        THƯ MỜI NHẬN VIỆC
      </p>
    `;


    const body = `
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><b><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></b><i><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Kính gửi:<b> </b>Anh /Chị<b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"> ${mail.candidateName},</b></span></i></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:28.34pt;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Chúng tôi chân thành cảm ơn sự quan tâm của Anh/Chị đối với Công ty cũng như chức danh công việc mà Anh/Chị đã dự tuyển. </span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:28.34pt;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Chúng tôi trân trọng thông báo Anh/Chị đã trúng tuyển trong đợt phỏng vấn vừa qua. Anh/Chị sẽ:</span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">1. Làm việc tại&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; :<b ><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"> ${mail.department} &nbsp;</i></b></span><b><i><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">– &nbsp;CTCP RTC Technology Việt Nam</span></i></b></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">2. Chức danh công việc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${mail.position}</i></b></span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">3. Báo cáo trực tiếp cho&nbsp;&nbsp;&nbsp;&nbsp; : <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${mail.reportingTo}</i></b></span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">4. Ngày nhận việc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <b><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${startTimeStr}</i></b></span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">5. Thời gian làm việc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : ${mail.workTimeText}</span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:-60.1pt;margin:0 0 0 60.1pt;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">6. Lương và các chế độ khác như sau: </span></p>
      ${mail.positionType === 'internship' ? `
      <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">6.1. Lương thực tập&nbsp;&nbsp; : <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${this.formatSalary(mail.salary)} đồng/tháng <br>
      </b>6.2. Các khoản phụ cấp khác (nếu có): <b><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">Theo quy định của Công ty</i></b>.&nbsp;&nbsp;&nbsp;&nbsp; <br>
      6.3. Các chế độ khác&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <b><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">Theo quy định của Công ty</i></b>.</span></p>
      ` : `
      <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">6.1. Lương chính thức&nbsp;&nbsp; : <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${this.formatSalary(mail.salary)} đồng/tháng <br>
      </b>6.2<i>. </i>Lương thử việc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;: <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"><span style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${mail.probationSalary}</span><span style="letter-spacing:-.4pt;"><br>
      </span></b>6.3. Các khoản phụ cấp khác(nếu có): <b><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">Theo quy định của Công ty</i></b>.&nbsp;&nbsp;&nbsp;&nbsp; </span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">6.4. Các chế độ khác&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <b><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">Theo quy định của Công ty</i></b>.</span></p>
      `}
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-indent:0;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">7. Địa chỉ đến nhận việc: <b style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;"><i style="font-size:12pt;font-family:Times New Roman,serif;line-height:130%;">${mail.workAddress}</i></b></span></p>
      <p style="font-size:12pt;font-family:Arial,sans-serif;text-align:justify;text-indent:28.34pt;margin:0;line-height:15.0pt;line-height:130%;"><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Mời Anh/Chị liên hệ với Phòng Hành chính Nhân sự Số điện thoại: <b style="font-size:9.5pt;font-family:Times New Roman,serif;line-height:130%;">${mail.contactPhone}</b>/Email: </span><b><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;"><a href="mailto:${mail.contactEmail}" title="mailto:${mail.contactEmail}">${mail.contactEmail}</a></span></b><span style="font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;"> để nhận việc.</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><b><i><u><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Lưu ý</span></u></i></b><i><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">:&nbsp;</span></i></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Chuẩn bị hồ sơ đầy đủ theo danh sách dưới đây khi đến nhận việc:</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Sơ yếu lý lịch (Có xác nhận của địa phương, có thời hạn trong 06 tháng).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">CCCD (Bản sao chứng thực).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Xác nhận cư trú (Bản sao chứng thực).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Giấy khám sức khỏe (Khám tại bệnh viện, không quá 06 tháng kể từ ngày khám).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Bằng cấp (Bản sao chứng thực).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Văn bằng chứng chỉ có liên quan (Bản sao chứng thực).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Sổ BHXH (Bản photo).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Giấy xác nhận nhân sự (CA xã/phường xác nhận không quá 06 tháng).</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Bản&nbsp;CV mô tả quá trình công tác.</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;background-color:white;margin:0;line-height:130%;"><span style="color:black;font-size:12pt;font-family:Arial,sans-serif;line-height:130%;">&#9744; </span><span style="color:black;font-size:11.5pt;font-family:'Times New Roman',serif;line-height:130%;">Đơn xin việc.</span></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;margin:0;"><i><span style="font-size:11.5pt;font-family:'Times New Roman',serif;">Chúng tôi hoan nghênh sự gia nhập của Anh/Chị vào Công ty và hy vọng chúng ta sẽ có một sự hợp tác tốt đẹp, lâu bền<br>
      Trân trọng!</span></i></p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;margin:0;">&nbsp;</p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;margin:0;">&nbsp;</p>
      <p style="font-size:12pt;font-family:Aptos,sans-serif;margin:0;">&nbsp;</p>

    `;

    return `<div style="max-width: 800px; margin: 0 auto; width: 100%;">${header}${body}</div>`;
  }

  // Dùng cho preview trong UI
  getPreviewBody(mail: CandidateOfferMail): SafeHtml {
    let content = ``
    return this.sanitizer.bypassSecurityTrustHtml(this.buildContent(mail));
  }

  // Dùng cho API gửi mail (wrapped HTML hoàn chỉnh)
  getMailBody(mail: CandidateOfferMail): string {
    return `<!DOCTYPE html><html><body style="font-family:'Times New Roman',serif;font-size:14px;color:#222;max-width:800px;margin:0 auto;padding:20px;">${this.buildContent(mail)}</body></html>`;
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

      if (!mail.position?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng nhập vị trí trúng tuyển!`);
        return;
      }

      if (mail.salary === null || mail.salary === undefined || mail.salary === 0) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng nhập mức lương!`);
        return;
      }

      if (mail.positionType === 'official' && !mail.probationSalary?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng nhập mức lương thử việc!`);
        return;
      }

      if (!mail.startDate) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `[Ứng viên ${i + 1}] Vui lòng chọn ngày nhận việc!`);
        return;
      }

      const now = new Date();

      const startDate = new Date(mail.startDate);
      startDate.setHours(+mail.startTimeHour, +mail.startTimeMinute, 0, 0);

      if (startDate <= now) {
        this.activeTabIndex = i;
        this.notification.error('Thời gian không hợp lệ', `[Ứng viên ${i + 1}] Thời gian nhận việc (${mail.startTimeHour}:${mail.startTimeMinute} ngày ${this.formatDate(mail.startDate)}) phải sau thời điểm hiện tại!`);
        return;
      }
    }

    this.isSending = true;

    const toLocalISO = (d: Date): string => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    let payload = this.mails.map(mail => {
      // Gộp ngày + giờ + phút thành datetime local
      const startDT = mail.startDate ? (() => {
        const d = new Date(mail.startDate);
        d.setHours(+mail.startTimeHour, +mail.startTimeMinute, 0, 0);
        return toLocalISO(d);
      })() : null;

      const deadlineDT = mail.replyDeadlineDate ? (() => {
        const d = new Date(mail.replyDeadlineDate);
        d.setHours(+mail.replyDeadlineHour, +mail.replyDeadlineMinute, 0, 0);
        return toLocalISO(d);
      })() : null;

      return {
        ID: mail.candidateId,
        Subject: mail.subject,
        EmailTo: mail.toEmail,
        Body: this.getMailBody(mail),
        EmailCC: '',
        StatusSend: 3, // 3 = Thư mời nhận việc
        DateSend: startDT,
        DeadlineFeedbackMail: deadlineDT,
      };
    });

    this.hRRecruitmentCandidateService.sendOfferLetterMail(payload).subscribe({
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


}


