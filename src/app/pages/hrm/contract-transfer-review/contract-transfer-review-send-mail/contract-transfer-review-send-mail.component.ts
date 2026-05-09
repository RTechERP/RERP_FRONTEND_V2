import { Component, Input, OnInit } from '@angular/core';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { ProjectService } from '../../../project/project-service/project.service';

/** Dữ liệu mail tương ứng với 1 phiếu đánh giá */
export interface ContractReviewMail {
  recordId: number;
  // Thông tin nhân viên
  employeeName: string;
  employeeSex: number | null;   // 1=Nam->Mr., 0=Nu->Ms., null=chua ro
  positionName: string;
  departmentName: string;
  dateStart: any;
  dateEnd: any;
  periodLabel: string;   // Nhãn loại thời gian: "Thời gian thực tập" | "Thời gian thử việc" | "Thời gian đánh giá"
  contractTypeName: string;  // Tên loại HĐLĐ dùng trong tiêu đề email: HDTV | HĐLĐ 12T L1 | ...
  // Người đánh giá (Kính gửi đầu tiên)
  evaluatorName: string;
  evaluatorPosition: string;
  evaluatorSex: number | null;  // 1=Nam->Mr., 0=Nu->Ms., null=chua ro
  selectedLeaderId: any;   // ID người được chọn trong dropdown
  // Can bo quan ly truc tiep (chi hien thi)
  managerName: string;
  // Leader / Trưởng bộ phận
  leaderName: string;
  leaderPosition: string;
  // Email
  toEmail: string;       // gửi đến nhân viên
  ccEmail: string;       // CC quản lý
  subject: string;
  // Deadline nộp
  deadlineDate: any;
  deadlineHour: string;
  deadlineMinute: string;
}

@Component({
  selector: 'app-contract-transfer-review-send-mail',
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
    NzSelectModule,
  ],
  templateUrl: './contract-transfer-review-send-mail.component.html',
  styleUrl: './contract-transfer-review-send-mail.component.css',
})
export class ContractTransferReviewSendMailComponent implements OnInit {

  @Input() records: any[] = [];  // Danh sách JobPerformanceEvaluation

  isSending = false;
  activeTabIndex = 0;

  mails: ContractReviewMail[] = [];
  employeeOptions: any[] = [];  // flat list dùng cho dropdown chọn Trưởng BP

  hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private service: ContractTransferReviewService,
    private projectService: ProjectService,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {

    this.mails = this.records.map(r => {
      // Ưu tiên TBPApproveID (đã chọn khi tạo phiếu), fallback HeadofDepartment, cuối cùng EmployeeEvaluationID
      const tbpId = r.TBPApproveID && Number(r.TBPApproveID) !== 0 ? Number(r.TBPApproveID) : null;
      const leaderId = tbpId;
      const employeeLoaiHDLD = r.EvaluationEmployeeLoaiHDID && Number(r.EvaluationEmployeeLoaiHDID) !== 0 ? Number(r.EvaluationEmployeeLoaiHDID) : null;
      // evaluatorName = TBP đã chọn (dùng trong email "Kính gửi")
      const evaluatorName = r.TBPApproveName || '';
      const evaluatorPosition = r.TBPApprovePositionName || '';

      // Deadline: 1 ngày trước ngày đánh giá đến (DateEnd)
      let dl = new Date();
      const baseDate = r.DateEnd || r.DateEvaluation;
      if (baseDate) {
        dl = new Date(baseDate);
        if (!isNaN(dl.getTime())) {
          dl.setDate(dl.getDate() - 1);
        } else {
          dl = new Date();
          dl.setDate(dl.getDate() + 7);
        }
      } else {
        dl.setDate(dl.getDate() + 7);
      }

      const mail: ContractReviewMail = {
        recordId: r.ID,
        employeeName: r.EmployeeName || '',
        // 1=Nam, 0=Nữ — từ e.Sex as EmployeeSex trong SP
        employeeSex: r.EmployeeSex != null ? Number(r.EmployeeSex) : null,
        // Ưu tiên EmployeePosition từ SP (join EmployeeChucVu)
        positionName: r.EmployeePosition || r.PositionName || '',
        departmentName: r.DepartmentName || '',
        dateStart: r.DateStart ? new Date(r.DateStart) : null,
        dateEnd: r.DateEnd ? new Date(r.DateEnd) : null,
        periodLabel: this.getPeriodLabel(employeeLoaiHDLD),
        contractTypeName: this.getContractTypeName(employeeLoaiHDLD),
        managerName: r.EmployeeEvaluationName || '',  // Cán bộ quản lý trực tiếp
        evaluatorName,        // TBP (điền vào "Kính gửi" email)
        evaluatorPosition,
        evaluatorSex: null,  // sẽ được điền khi gọi getEmployeeMailInfo
        selectedLeaderId: leaderId,
        leaderName: r.LeaderName || '',
        leaderPosition: r.LeaderPositionName || '',
        // Ưu tiên email công ty, fallback email cá nhân
        toEmail: r.EmployeeEmailCongTy || r.EmployeeEmailCaNhan || '',
        ccEmail: r.LeaderEmail || '',
        subject: '',
        deadlineDate: dl,
        deadlineHour: '17',
        deadlineMinute: '00',
      };
      this.updateSubject(mail);
      return mail;
    });

    // Fetch email + giới tính nhân viên nếu còn thiếu (trường hợp pseudo-row từ auto-open)
    this.records.forEach((r, i) => {
      const mail = this.mails[i];
      if ((!mail.toEmail || mail.employeeSex === null) && r.EmployeeID) {
        this.service.getEmployeeMailInfo(r.EmployeeID).subscribe({
          next: (apiRes: any) => {
            const info = Array.isArray(apiRes?.data) ? apiRes.data[0] : (apiRes?.data || apiRes);
            if (info) {
              if (!mail.toEmail) {
                mail.toEmail = info.EmailCongTy || info.EmailCaNhan || '';
              }
              if (mail.employeeSex === null && info.Sex != null) {
                mail.employeeSex = Number(info.Sex);
              }
            }
          },
          error: () => { /* giữ nguyên */ }
        });
      }
    });

    // Load danh sách nhân viên để chọn Trưởng bộ phận
    this.projectService.getUsers().subscribe({
      next: (res: any) => {
        // Flat list từ grouped data
        const groups: any[] = this.projectService.createdDataGroup(res.data, 'DepartmentName');
        this.employeeOptions = groups.reduce((acc: any[], g) => {
          return acc.concat((g.options || []).map((o: any) => ({
            id: o.item.EmployeeID,
            name: o.item.FullName,
            position: o.item.PositionName || '',
            department: o.item.DepartmentName || '',
            label: `${o.item.Code} - ${o.item.FullName}`,
          })));
        }, []);

        // Sau khi có danh sách, gọi API lấy email + sex cho các mail đã có selectedLeaderId
        // (trường hợp HeadofDepartment được gán sẵn từ đầu)
        this.mails.forEach(mail => {
          if (mail.selectedLeaderId) {
            // Cập nhật name/position từ flat list (nếu chưa có)
            const found = this.employeeOptions.find(e => e.id === mail.selectedLeaderId);
            if (found) {
              if (!mail.evaluatorName) mail.evaluatorName = found.name;
              if (!mail.evaluatorPosition) mail.evaluatorPosition = found.position || '';
            }
            // Gọi API để lấy email CC + sex + position chính xác
            this.service.getEmployeeMailInfo(mail.selectedLeaderId).subscribe({
              next: (apiRes: any) => {
                const info = Array.isArray(apiRes?.data) ? apiRes.data[0] : (apiRes?.data || apiRes);
                if (info) {
                  mail.ccEmail = info.EmailCongTy || info.EmailCaNhan || mail.ccEmail;
                  if (info.PositionName) mail.evaluatorPosition = info.PositionName;
                  if (info.FullName) mail.evaluatorName = info.FullName;
                  mail.evaluatorSex = info.Sex != null ? Number(info.Sex) : null;
                }
              },
              error: () => { /* giữ nguyên giá trị đã có */ }
            });
          }
        });
      },
      error: () => { /* giữ nguyên */ }
    });
  }

  /** Khi chọn Trưởng BP mới — cập nhật evaluatorName, evaluatorPosition và ccEmail */
  onLeaderChange(mail: ContractReviewMail): void {
    if (!mail.selectedLeaderId) {
      mail.evaluatorName = '';
      mail.evaluatorPosition = '';
      mail.ccEmail = '';
      return;
    }

    // Fill nhanh từ flat list trước (tránh delay)
    const found = this.employeeOptions.find(e => e.id === mail.selectedLeaderId);
    if (found) {
      mail.evaluatorName = found.name;
      mail.evaluatorPosition = found.position || '';
    }

    // Gọi API lấy email + chức vụ + giới tính chính xác từ backend
    // SP: spGetInfomationEmployeeCV → { FullName, EmailCongTy, EmailCaNhan, PositionName, Sex }
    this.service.getEmployeeMailInfo(mail.selectedLeaderId).subscribe({
      next: (res: any) => {
        // API dùng ProcedureToListTAsync → res.data là array
        const info = Array.isArray(res?.data) ? res.data[0] : (res?.data || res);
        if (info) {
          // Ưu tiên email công ty, fallback email cá nhân
          mail.ccEmail = info.EmailCongTy || info.EmailCaNhan || '';
          if (info.PositionName) mail.evaluatorPosition = info.PositionName;
          if (info.FullName) mail.evaluatorName = info.FullName;
          // Sex: 1=Nam→Mr., 0=Nữ→Ms.
          mail.evaluatorSex = info.Sex != null ? Number(info.Sex) : null;
        }
      },
      error: () => { /* giữ nguyên giá trị từ flat list */ }
    });
  }

  updateSubject(mail: ContractReviewMail): void {
    mail.subject = `Thông báo V/v Đánh giá chuyển ${mail.contractTypeName}_${mail.employeeName}_${mail.positionName}`;
  }

  formatDate(val: any): string {
    if (!val) return '.../.../.....';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '.../.../.....';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // ─── Build email body ───────────────────────────────────────────────────────

  /** Trả về danh xưng dựa trên giới tính: 1=Nam→Mr., 0=Nữ→Ms., null→Mr./Ms. */
  private getSalutation(sex: number | null): string {
    if (sex === 1) return 'Mr.';
    if (sex === 0) return 'Ms.';
    return 'Mr./Ms.';
  }

  /**
   * Trả về nhãn thời gian hiển thị trong email theo loại HĐLĐ:
   *   0 = HDTV (Hợp đồng thực tập)   → "Thời gian thực tập"
   *   4 = HĐLĐ 12T L1 (thử việc)       → "Thời gian thử việc"
   *   other                            → "Thời gian đánh giá"
   */
  private getPeriodLabel(loaiHDLDID: number | null): string {
    if (loaiHDLDID === 0) return 'Thời gian thực tập';
    if (loaiHDLDID === 1) return 'Thời gian thử việc';
    return 'Thời gian đánh giá';
  }

  private getContractTypeName(loaiHDLDID: number | null): string {
    switch (loaiHDLDID) {
      case 1: return 'HĐTV';
      case 2: return 'HĐLĐ 36T';
      case 4: return 'HĐLĐ 12T L1';
      case 5: return 'HDKXDTH';
      case 6: return 'HDLD 6T';
      case 7: return 'HĐLĐ 12T L2';
      default: return 'HĐLĐ';
    }
  }

  private buildContent(mail: ContractReviewMail): string {
    const deadlineStr = `${mail.deadlineHour}H${mail.deadlineMinute} ngày ${this.formatDate(mail.deadlineDate)}`;
    const trialPeriod = `${this.formatDate(mail.dateStart)} - ${this.formatDate(mail.dateEnd)}`;

    const evalSal = this.getSalutation(mail.evaluatorSex);
    const empSal = this.getSalutation(mail.employeeSex);

    // Dòng "Kính gửi" theo đúng mẫu:
    // Mr./Ms. [Evaluator] - [Position],
    // Mr./Ms. [Employee]  - [Position],
    const evaluatorLine = mail.evaluatorName
      ? `<b>${evalSal} ${mail.evaluatorName}${mail.evaluatorPosition ? ' - ' + mail.evaluatorPosition : ''}</b>,`
      : '';
    const employeeLine = mail.employeeName
      ? `<b>${empSal} ${mail.employeeName}${mail.positionName ? ' - ' + mail.positionName : ''}</b>,`
      : '';

    return `
<div style="font-family:'Times New Roman',serif;font-size:11.5pt;line-height:160%;color:#000;">

  <p style="margin:0 0 4pt 0;"><i><b>Kính gửi:&nbsp; ${evaluatorLine}</b></i></p>
  ${employeeLine ? `<p style="margin:0 0 12pt 40pt;"><i>${employeeLine}</i></p>` : ''}

  <p>
    Về việc đánh giá chuyển HĐLĐ nhân sự, P. HCNS xin gửi thông tin CBNV như sau:<br>
    Họ và tên: ${mail.employeeName}<br>
    Chức danh: ${mail.positionName}<br>
    ${mail.periodLabel}: ${trialPeriod}<br>
    Đề nghị ${empSal} ${mail.employeeName} làm bản tự đánh giá
    và ${'phòng ' + mail.departmentName || 'bộ phận liên quan'} làm đánh giá chuyển hợp đồng
    <i>(trên phần mềm)</i> trước ${deadlineStr} để P. HCNS trình Ban Giám đốc
    phê duyệt và căn cứ để làm các thủ tục tiếp theo cho người lao động.
  </p>

  <p style="margin:12pt 0 4pt 0;">Trân trọng!</p>

  <p style="margin:8pt 0 4pt 0;">Thanks &amp; Best regards!</p>
  <p style="margin:0; color:#555;">-------------------------------------</p>

</div>`;
  }


  getPreviewBody(mail: ContractReviewMail): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.buildContent(mail));
  }

  private getMailBody(mail: ContractReviewMail): string {
    return `<!DOCTYPE html><html><body style="font-family:'Times New Roman',serif;font-size:14px;color:#222;max-width:800px;margin:0 auto;padding:20px;">${this.buildContent(mail)}</body></html>`;
  }

  // ─── Send ────────────────────────────────────────────────────────────────────

  onSend(): void {
    // Validate
    for (let i = 0; i < this.mails.length; i++) {
      const mail = this.mails[i];
      const label = `[Phiếu ${i + 1} - ${mail.employeeName}]`;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!mail.toEmail?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `${label} Vui lòng nhập email nhân viên!`);
        return;
      }
      if (!emailRegex.test(mail.toEmail.trim())) {
        this.activeTabIndex = i;
        this.notification.error('Email không hợp lệ', `${label} "${mail.toEmail}" không đúng định dạng!`);
        return;
      }
      if (!mail.subject?.trim()) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `${label} Vui lòng nhập tiêu đề email!`);
        return;
      }
      if (!mail.deadlineDate) {
        this.activeTabIndex = i;
        this.notification.error('Thiếu thông tin', `${label} Vui lòng chọn ngày deadline!`);
        return;
      }
    }

    this.isSending = true;

    const payload = this.mails.map(mail => {
      return {
        ID: mail.recordId,
        Subject: mail.subject,
        EmailTo: mail.toEmail,
        EmailCC: mail.ccEmail || '',
        Body: this.getMailBody(mail),
      };
    });

    this.service.sendMail(payload).subscribe({
      next: (res: any) => {
        this.isSending = false;
        if (res?.status === 1 || res?.success) {
          this.notification.success('Thành công', `Đã gửi ${this.mails.length} email thông báo!`);
          this.activeModal.close('sent');
        } else {
          this.notification.error('Lỗi', res?.message || 'Gửi mail thất bại!');
        }
      },
      error: (err: any) => {
        this.isSending = false;
        this.notification.error('Lỗi gửi mail', err?.error?.message || err?.message || 'Có lỗi xảy ra!');
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
}
