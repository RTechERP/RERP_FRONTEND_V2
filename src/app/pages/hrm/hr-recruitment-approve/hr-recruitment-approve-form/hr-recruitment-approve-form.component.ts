import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
// import { hrRecruitmentApproveServiceService } from '../hr-recruitment-interview-assessment-service.service';
import { HrRecruitmentApproveService } from '../hr-recruitment-approve.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';
import { ProjectService } from '../../../project/project-service/project.service';

export interface Experiences { //kinh nghiệm
  CompanyName: string;
  PositionName: string;
  DateStart: Date;
  DateEnd: Date;
}
export interface Infomation { // thông tin ứng viên
  FullName: string;
  DateOfBirth: Date;
  PermanentResidence: string;
  CurrentAddress: string;
  NameOfSchool: string;
  Major: string;
  PositionName: string;
  DepartmentName: string;
  DepartmentID: number;
  HRRecruitmentApplicationFormID: number;
  Salary: number;
}
export interface HRRecruitmentApprove {
  ID: number;
  DateOfIssue: Date;
  LocationOfIssue: string;
  DepartmentID: number;
  HRRecruitmentApplicationFormID: number;
  DateStart: Date;
  ProbationPeriod: string;
  BasicSalary: number;
  ProbationarySalary: number;
  EmployeeApprover: number;
  TBPApprover: number;
  BGDApprover: number;
  IsDeleted: boolean;
  EmployeeApproverName: string | null;
  TBPApproverName: string | null;
  BGDApproverName: string | null;
  HCNSApproveName: string | null;
  HCNSApprove: number;
}


@Component({
  selector: 'app-hr-recruitment-approve-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
  ],
  templateUrl: './hr-recruitment-approve-form.component.html',
  styleUrl: './hr-recruitment-approve-form.component.css'
})
export class HrRecruitmentApproveFormComponent implements OnInit {

  @Input() HRRecruitmentCandidateID: number = 0;
  @Input() Status: number = 0;


  experiences: Experiences[] = [];
  infomation: Infomation[] = [];
  hrRecruitmentApprove: HRRecruitmentApprove[] = [];

  // Data so van ban & ngay
  soVanBan: string = '';
  diaDiem: string = 'Hà Nội';
  ngay: string = '';
  thang: string = '';
  nam: string = '';
  currentId: number = 0;
  loading: boolean = false;
  isReadOnly: boolean = false;

  // Muc 1: Thong tin nhan su
  hoTen: string = '';
  ngaySinh: string = '';
  hoKhau: string = '';
  noiO: string = '';
  trinhDo: string = '';
  truong: string = '';
  chucDanh: string = '';

  // Muc 2: Kinh nghiem (binding sang danh sach row cua bang)
  kinhNghiem: any[] = [];

  // Muc 3: Thoi gian thu viec
  thoiGianNhanViec: string = '';
  thoiGianThuViec: string = '02 tháng';
  thuViecTu: string = '';
  thuViecDen: string = '';

  // Muc 5: Che do
  luongCB: string = '';
  luongThuViec: string = '';

  // Chu ky (4 cot)
  nguoiLap: string = '';
  truongPhongBan: string = '';
  phcns: string = '';
  pheDuyet: string = '';

  // Select TBP duyệt
  tbpList: any[] = [];
  selectedTBPId: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    // private hrRecruitmentApproveService: hrRecruitmentApproveServiceService,
    private hrRecruitmentApproveService: HrRecruitmentApproveService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    // TODO: Load candidate info if HRRecruitmentCandidateID is provided
    this.getDataToHRRecruitApprove();
    this.loadTBPList();
  }

  loadTBPList(): void {
    this.projectService.getUsers().subscribe({
      next: (res: any) => {
        this.tbpList = this.projectService.createdDataGroup(res.data, 'DepartmentName');
      },
      error: () => { this.tbpList = []; }
    });
  }
  getDataToHRRecruitApprove() {
    this.hrRecruitmentApproveService.getDataToHRRecruitApprove(this.HRRecruitmentCandidateID).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.experiences = response.experiences || [];
          this.infomation = response.infomation || [];

          // Map thong tin ca nhan
          if (this.infomation.length > 0) {
            const info = this.infomation[0];
            this.hoTen = info.FullName;
            this.ngaySinh = this.formatDate(info.DateOfBirth);
            this.hoKhau = info.PermanentResidence;
            this.noiO = info.CurrentAddress;
            this.trinhDo = info.Major;
            this.truong = info.NameOfSchool;
            this.chucDanh = info.PositionName;
            this.luongCB = this.formatSalary(info.Salary) ?? "";
            // Sau khi co info, query tiep data da luu neu ton tai
            if (info.HRRecruitmentApplicationFormID) {
              this.getDataHRRecruitmentApprove(info.HRRecruitmentApplicationFormID);
            }
          }

          // Map kinh nghiem
          this.kinhNghiem = this.experiences.map(exp => {
            const start = this.formatDate(exp.DateStart);
            const end = this.formatDate(exp.DateEnd);

            return {
              thoiGian: start && end ? `${start} - ${end}` : start || end || '',
              donVi: exp.CompanyName || '',
              chucVu: exp.PositionName || ''
            };
          });

          // Mac dinh it nhat 1 dong neu khong co du lieu
          if (this.kinhNghiem.length === 0) {
            this.kinhNghiem.push({ thoiGian: '', donVi: '', chucVu: '' });
          }

          // Mac dinh ngay hien tai cho phan ngay ky (neu ti nua load data cu thay the thi thoi)
          const now = new Date();
          this.ngay = now.getDate().toString().padStart(2, '0');
          this.thang = (now.getMonth() + 1).toString().padStart(2, '0');
          this.nam = now.getFullYear().toString().substring(2);

          // Mac dinh nguoi lap la nguoi dang nhap
          if (this.appUserService.fullName) {
            this.nguoiLap = this.appUserService.fullName;
          }
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  getDataHRRecruitmentApprove(HRRecruitmentApplicationFormID: number) {
    this.hrRecruitmentApproveService.getDataHRRecruitmentApprove(HRRecruitmentApplicationFormID).subscribe({
      next: (response: any) => {
        // Neu status == 1 va co data (co the la array hoac object tuy API)
        if (response.status == 1 && response.data) {
          const app = Array.isArray(response.data) ? response.data[0] : response.data;
          if (app) {
            this.currentId = app.ID || 0;
            this.diaDiem = app.LocationOfIssue || 'Hà Nội';
            this.thuViecTu = this.formatDateISO(app.DateStart);
            this.thuViecDen = this.formatDate(app.DateEnd);
            this.luongCB = this.formatSalary(app.BasicSalary);
            this.luongThuViec = this.formatSalary(app.ProbationarySalary);

            // Map lai ngay ky neu co
            if (app.DateOfIssue) {
              const d = new Date(app.DateOfIssue);
              this.ngay = d.getDate().toString().padStart(2, '0');
              this.thang = (d.getMonth() + 1).toString().padStart(2, '0');
              this.nam = d.getFullYear().toString().substring(2);
            }

            // Map ten nguoi ky (4 cot)
            if (app.EmployeeApproverName) this.nguoiLap = app.EmployeeApproverName;
            if (app.TBPApproverName) this.truongPhongBan = app.TBPApproverName;
            if (app.HCNSApproveName) this.phcns = app.HCNSApproveName;
            if (app.BGDApproverName) this.pheDuyet = app.BGDApproverName;

            // Map TBP đã chọn trước đó
            if (app.TBPApprover) this.selectedTBPId = app.TBPApprover;

            // Map thoi gian thu viec (truong moi)
            if (app.ProbationPeriod) this.thoiGianThuViec = app.ProbationPeriod;

            // Kiểm tra quyền chỉnh sửa
            if (this.Status > 6) {
              this.isReadOnly = true;
            } else if (this.Status === 6) {
              // Nếu đã có bất kỳ cấp nào khác ký (ngoài người lập) thì khóa form
              if (app.TBPApproverName || app.HCNSApproveName || app.BGDApproverName) {
                this.isReadOnly = true;
              }
            }
          }
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy data cũ:', error);
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /** Trả về YYYY-MM-DD — dùng cho <input type="date"> */
  formatDateISO(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }

  formatSalary(val: any): string {
    if (val === null || val === undefined) return '';
    const digits = val.toString().replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  onSalaryInput(event: Event, field: 'luongCB' | 'luongThuViec'): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;

    // Tach phan nguyen va phan thap phan (cho phep dau '.')
    const dotIndex = raw.indexOf('.');
    let intRaw = dotIndex >= 0 ? raw.substring(0, dotIndex) : raw;
    let decRaw = dotIndex >= 0 ? raw.substring(dotIndex + 1) : '';

    // Chi giu lai chu so trong moi phan
    let intDigits = intRaw.replace(/\D/g, '');
    intDigits = intDigits.replace(/^0+(?=\d)/, ''); // Remove leading zeros
    let decDigits = decRaw.replace(/\D/g, '');

    // decimal(18,4): phan nguyen toi da 14 chu so, phan thap phan toi da 4 chu so
    if (intDigits.length > 14) intDigits = intDigits.substring(0, 14);
    if (decDigits.length > 4) decDigits = decDigits.substring(0, 4);

    // Format phan nguyen voi dau phay hang nghin
    const formattedInt = intDigits
      ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : '';

    // Gop lai
    const formatted = dotIndex >= 0
      ? `${formattedInt}.${decDigits}`
      : formattedInt;

    input.value = formatted;
    this[field] = formatted;
  }

  /**
   * Masked date input: tu dong format DD/MM/YYYY
   * - Clamp ngay <= 31, thang <= 12 ngay khi nhap
   * - Khi du 8 chu so (DD/MM/YYYY): validate ngay hop le, neu sai thi xoa va bao loi
   */
  onDateMask(event: Event, field: 'ngaySinh' | 'thuViecTu' | 'thuViecDen' | 'thoiGianNhanViec'): void {
    const input = event.target as HTMLInputElement;

    // Chi giu lai chu so, toi da 8 chu so
    let digits = input.value.replace(/\D/g, '').substring(0, 8);

    // Clamp DD: neu nhap >= 2 chu so cho ngay thi kiem tra
    if (digits.length >= 2) {
      let dd = parseInt(digits.substring(0, 2), 10);
      if (dd > 31) dd = 31;
      if (dd < 1 && digits.substring(0, 2) !== '00') dd = 1;
      digits = dd.toString().padStart(2, '0') + digits.substring(2);
    }

    // Clamp chu so DAU cua thang (khi co >= 3 chu so):
    // Thang hop le la 01-12, nen chu so dau chi duoc la 0 hoac 1
    // Neu la 2-9 → clamp ve '1' (khong co thang nao tu 20-99)
    if (digits.length >= 3) {
      const mmFirst = parseInt(digits[2], 10);
      if (mmFirst > 1) {
        digits = digits.substring(0, 2) + '1' + digits.substring(3);
      }
    }

    // Clamp MM day du (khi co >= 4 chu so): thang phai <= 12
    if (digits.length >= 4) {
      let mm = parseInt(digits.substring(2, 4), 10);
      if (mm > 12) mm = 12;
      if (mm < 1 && digits.substring(2, 4) !== '00') mm = 1;
      digits = digits.substring(0, 2) + mm.toString().padStart(2, '0') + digits.substring(4);
    }

    // Format thanh DD/MM/YYYY
    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    // Khi nhap du 8 chu so: validate ngay thuc su co ton tai
    if (digits.length === 8) {
      const dd = parseInt(digits.substring(0, 2), 10);
      const mm = parseInt(digits.substring(2, 4), 10);
      const yyyy = parseInt(digits.substring(4, 8), 10);
      const dateObj = new Date(yyyy, mm - 1, dd);
      const isValid =
        dateObj.getFullYear() === yyyy &&
        dateObj.getMonth() === mm - 1 &&
        dateObj.getDate() === dd;

      if (!isValid) {
        input.value = '';
        this[field] = '';
        input.style.borderBottom = '1.5px solid red';
        input.title = 'Ngày không hợp lệ ';
        this.notification.warning('Cảnh báo', `Ngày "${formatted}" không hợp lệ, vui lòng nhập lại!`);
        return;
      }
    }

    // Reset style neu hop le
    input.style.borderBottom = '';
    input.title = '';
    input.value = formatted;
    this[field] = formatted;
  }

  addKinhNghiem(): void {
    this.kinhNghiem.push({ thoiGian: '', donVi: '', chucVu: '' });
  }

  removeKinhNghiem(index: number): void {
    if (this.kinhNghiem.length > 1) {
      this.kinhNghiem.splice(index, 1);
    }
  }

  onPrint(): void {
    window.print();
  }

  onSave(): void {
    if (this.infomation.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy thông tin ứng viên để lưu!');
      return;
    }

    // Validate bắt buộc
    if (!this.thuViecTu || !this.thuViecTu.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập ngày nhận việc!');
      return;
    }
    if (!this.isValidDateISO(this.thuViecTu)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày nhận việc "${this.thuViecTu}" không hợp lệ!`);
      return;
    }

    const date = new Date(this.thuViecTu);
    const year = date.getFullYear();

    if (year < 1900 || year > 2100) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày nhận việc "${this.thuViecTu}" không hợp lệ!`);
      this.thuViecTu = '';
      return;
    }
    if (!this.luongCB || !this.luongCB.trim() || this.parseSalaryStr(this.luongCB) <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mức lương chính thức!');
      return;
    }
    if (!this.selectedTBPId) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn TBP duyệt!');
      return;
    }

    this.loading = true;
    const info = this.infomation[0];

    // Build DateOfIssue from ngay/thang/nam
    let dateOfIssue: any = null;
    if (this.ngay && this.thang && this.nam) {
      dateOfIssue = new Date(parseInt('20' + this.nam), parseInt(this.thang) - 1, parseInt(this.ngay));
    }

    const dataSave: any = {
      ID: this.currentId,
      HRRecruitmentApplicationFormID: info.HRRecruitmentApplicationFormID,
      DepartmentID: info.DepartmentID,
      DateOfIssue: dateOfIssue ? dateOfIssue.toLocaleDateString('en-CA') : null,
      LocationOfIssue: this.diaDiem,
      DateStart: this.thuViecTu || null, // đã là YYYY-MM-DD từ input[type=date]
      ProbationPeriod: this.thoiGianThuViec,
      BasicSalary: this.parseSalaryStr(this.luongCB),
      ProbationarySalary: this.parseSalaryStr(this.luongThuViec),
      EmployeeApprover: this.appUserService.employeeID || 0,
      TBPApprover: this.selectedTBPId || 0,
      HCNSApprove: 0,
      BGDApprover: 0,
      IsDeleted: false,
      EmployeeApproverName: this.nguoiLap,
      TBPApproverName: this.truongPhongBan,
      HCNSApproveName: this.phcns,
      BGDApproverName: this.pheDuyet
    };

    this.hrRecruitmentApproveService.saveHRRecruitmentApprove(dataSave).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.status == 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu tờ trình phê duyệt tuyển dụng thành công!');
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi lưu dữ liệu!');
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error(error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ!');
      }
    });
  }

  /**
   * Kiem tra chuoi ngay DD/MM/YYYY co hop le khong:
   * - Phai du dinh dang DD/MM/YYYY (10 ky tu)
   * - Nam phai >= 4 chu so
   * - Ngay phai thuc su ton tai (vd: 30/02 khong hop le)
   */
  isValidDateStr(str: string): boolean {
    if (!str) return false;
    const parts = str.split('/');
    if (parts.length !== 3) return false;
    const dd = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const yyyy = parseInt(parts[2], 10);
    // Nam phai du 4 chu so
    if (parts[2].length < 4 || yyyy < 1900 || yyyy > 2100) return false;
    // Thang phai 1-12
    if (mm < 1 || mm > 12) return false;
    // Ngay phai >= 1
    if (dd < 1) return false;
    // Kiem tra ngay co ton tai trong thang/nam do khong
    const dateObj = new Date(yyyy, mm - 1, dd);
    return (
      dateObj.getFullYear() === yyyy &&
      dateObj.getMonth() === mm - 1 &&
      dateObj.getDate() === dd
    );
  }

  /** Validate YYYY-MM-DD — dùng cho <input type="date"> */
  isValidDateISO(str: string): boolean {
    if (!str || str.length !== 10) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
  }

  parseDateStr(str: string): any {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  parseSalaryStr(str: string): number {
    if (!str) return 0;
    const digits = str.replace(/,/g, '');
    return parseFloat(digits) || 0;
  }
}
