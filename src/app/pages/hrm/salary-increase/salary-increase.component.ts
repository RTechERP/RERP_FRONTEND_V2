import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SplitterModule } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { forkJoin, of, Observable } from 'rxjs';
import {
  SalaryIncreaseService,
  SalaryIncrease,
  SalaryIncreaseDetail,
  SalaryIncreaseMailConfig,
  SalaryIncreaseSendMailItem,
  SalaryIncreaseSendMailResultItem
} from './salary-increase.service';
import { SalaryIncreaseFormComponent } from './salary-increase-form/salary-increase-form.component';
import { SalaryIncreaseDetailFormComponent } from './salary-increase-detail-form/salary-increase-detail-form.component';
import { SalaryIncreaseImportExcelComponent } from './salary-increase-import-excel/salary-increase-import-excel.component';
import { SalaryIncreasePreviewMailComponent } from './salary-increase-preview-mail/salary-increase-preview-mail.component';
import { buildSalaryIncreaseMailBody, buildSalaryIncreaseMailSubject } from './salary-increase-mail-template';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-salary-increase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SplitterModule,
    TableModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzInputModule,
    NzModalModule,
    DateInputComponent,
    HasPermissionDirective
  ],
  providers: [NzModalService],
  templateUrl: './salary-increase.component.html',
  styleUrls: ['./salary-increase.component.css']
})
export class SalaryIncreaseComponent implements OnInit {
  loadingMaster = false;
  loadingDetail = false;

  // Master Search Params
  keywordMaster = '';
  startDateMaster: Date | null = null;
  endDateMaster: Date | null = null;

  // Detail Search Params
  keywordDetail = '';

  selectedMasterRow: SalaryIncrease | null = null;
  selectedDetailRow: SalaryIncreaseDetail | null = null;

  masterList: SalaryIncrease[] = [];
  detailList: SalaryIncreaseDetail[] = [];

  // Chọn nhiều detail để gửi mail (độc lập với selectedDetailRow dùng để sửa/xóa)
  checkedDetailIds = new Set<number>();
  sendingMail = false;
  loadingPreview = false;
  private employeesCache: any[] | null = null;
  private mailConfigCache: SalaryIncreaseMailConfig | null = null;
  private departmentsCache: any[] | null = null;

  constructor(
    private service: SalaryIncreaseService,
    private ngbModal: NgbModal,
    private notification: NzNotificationService,
    private nzModal: NzModalService
  ) { }

  ngOnInit(): void {
    this.startDateMaster = DateTime.now().startOf('year').toJSDate();
    this.endDateMaster = DateTime.now().endOf('year').toJSDate();
    this.loadMasterData();
  }

  // Group phòng ban trong bảng detail có thể expand/collapse (mặc định expanded)
  private expandedGroups: { [key: string]: boolean } = {};

  toggleGroup(group: string): void {
    const key = group || 'Khác';
    this.expandedGroups[key] = !this.isGroupExpanded(key);
  }

  isGroupExpanded(group: string): boolean {
    const key = group || 'Khác';
    return this.expandedGroups[key] !== false;
  }

  loadMasterData(): void {
    this.loadingMaster = true;
    this.selectedMasterRow = null;
    this.selectedDetailRow = null;
    this.detailList = [];

    const params = {
      Keyword: this.keywordMaster?.trim() || '',
      StartDate: this.startDateMaster,
      EndDate: this.endDateMaster
    };

    this.service.searchMaster(params).subscribe({
      next: (res: any) => {
        this.loadingMaster = false;
        if (res?.status === 1) {
          this.masterList = res.data || [];
          if (this.masterList.length > 0) {
            this.onSelectMaster(this.masterList[0]);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải danh sách đợt');
        }
      },
      error: (err) => {
        this.loadingMaster = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi kết nối máy chủ');
      }
    });
  }

  onSelectMaster(row: SalaryIncrease): void {
    this.selectedMasterRow = row;
    this.selectedDetailRow = null;
    this.loadDetailData();
  }

  loadDetailData(): void {
    this.checkedDetailIds.clear();

    if (!this.selectedMasterRow || !this.selectedMasterRow.ID) {
      this.detailList = [];
      return;
    }

    this.loadingDetail = true;
    this.selectedDetailRow = null;

    const params = {
      SalaryIncreaseID: this.selectedMasterRow.ID,
      Keyword: this.keywordDetail?.trim() || ''
    };

    this.service.searchDetail(params).subscribe({
      next: (res: any) => {
        this.loadingDetail = false;
        if (res?.status === 1) {
          this.detailList = res.data || [];
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải danh sách nhân viên');
        }
      },
      error: (err) => {
        this.loadingDetail = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi kết nối máy chủ');
      }
    });
  }

  onSelectDetail(row: SalaryIncreaseDetail): void {
    this.selectedDetailRow = row;
  }

  // --- Chọn nhiều detail để gửi mail ---

  isDetailChecked(row: SalaryIncreaseDetail): boolean {
    return !!row.ID && this.checkedDetailIds.has(row.ID);
  }

  toggleDetailChecked(row: SalaryIncreaseDetail): void {
    if (!row.ID) return;
    if (this.checkedDetailIds.has(row.ID)) {
      this.checkedDetailIds.delete(row.ID);
      if (this.selectedDetailRow?.ID === row.ID) {
        this.selectedDetailRow = null;
      }
    } else {
      this.checkedDetailIds.add(row.ID);
      // Tick checkbox cũng coi như chọn dòng, để nút Sửa/Xóa được bật lên ngay.
      this.selectedDetailRow = row;
    }
  }

  isAllDetailChecked(): boolean {
    return this.detailList.length > 0 && this.detailList.every(r => this.isDetailChecked(r));
  }

  isSomeDetailChecked(): boolean {
    return this.checkedDetailIds.size > 0 && !this.isAllDetailChecked();
  }

  toggleAllDetailChecked(): void {
    if (this.isAllDetailChecked()) {
      this.checkedDetailIds.clear();
    } else {
      this.detailList.forEach(r => {
        if (r.ID) this.checkedDetailIds.add(r.ID);
      });
    }
  }

  // --- Xem trước mail quyết định điều chỉnh lương ---

  openPreviewMail(): void {
    const rows = this.detailList.filter(r => this.isDetailChecked(r));
    if (rows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 nhân viên để xem trước mail.');
      return;
    }

    this.loadingPreview = true;
    forkJoin({
      employees: this.employeesCache ? of(this.employeesCache) : this.loadEmployeesOnce(),
      mailConfig: this.mailConfigCache ? of(this.mailConfigCache) : this.loadMailConfigOnce(),
      departments: this.departmentsCache ? of(this.departmentsCache) : this.loadDepartmentsOnce()
    }).subscribe({
      next: ({ employees, mailConfig, departments }) => {
        this.loadingPreview = false;
        const items = this.buildSendMailItems(rows, employees, mailConfig, departments);

        const modalRef = this.ngbModal.open(SalaryIncreasePreviewMailComponent, {
          backdrop: 'static',
          centered: true,
          fullscreen: true
        });
        modalRef.componentInstance.items = items;
        modalRef.result.then((res) => {
          if (res === 'sent') {
            this.checkedDetailIds.clear();
            this.loadDetailData();
          }
        }).catch(() => { });
      },
      error: () => {
        this.loadingPreview = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không tải được dữ liệu nhân viên / cấu hình mail');
      }
    });
  }

  // --- Gửi mail quyết định điều chỉnh lương ---

  openSendMail(mode: 'sync' | 'queue'): void {
    const rows = this.detailList.filter(r => this.isDetailChecked(r));
    if (rows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 nhân viên để gửi mail.');
      return;
    }

    const alreadySentCount = rows.filter(r => r.IsSend).length;
    if (alreadySentCount > 0) {
      this.nzModal.confirm({
        nzTitle: 'Xác nhận gửi lại',
        nzContent: `Có ${alreadySentCount} nhân viên đã được gửi mail trước đó. Bạn có chắc chắn muốn gửi lại không?`,
        nzOkText: 'Gửi lại',
        nzCancelText: 'Hủy',
        nzOnOk: () => this.doSendMail(rows, mode)
      });
    } else {
      this.doSendMail(rows, mode);
    }
  }

  private doSendMail(rows: SalaryIncreaseDetail[], mode: 'sync' | 'queue'): void {
    this.sendingMail = true;
    const startedAt = performance.now();

    forkJoin({
      employees: this.employeesCache ? of(this.employeesCache) : this.loadEmployeesOnce(),
      mailConfig: this.mailConfigCache ? of(this.mailConfigCache) : this.loadMailConfigOnce(),
      departments: this.departmentsCache ? of(this.departmentsCache) : this.loadDepartmentsOnce()
    }).subscribe({
      next: ({ employees, mailConfig, departments }) => {
        const items = this.buildSendMailItems(rows, employees, mailConfig, departments);
        // 'sync': chờ SMTP gửi xong mới trả response, có kết quả từng nhân viên.
        // 'queue': trả về ngay sau khi đưa vào hàng đợi nền, không chờ gửi xong.
        const request$ = mode === 'queue' ? this.service.sendMailQueue(items) : this.service.sendMail(items);

        request$.subscribe({
          next: (res: any) => {
            this.sendingMail = false;
            const elapsedMs = Math.round(performance.now() - startedAt);
            const modeLabel = mode === 'queue' ? 'Hàng đợi' : 'Đồng bộ';

            if (res?.status === 1) {
              let failCount = 0;
              if (mode === 'sync') {
                const results: SalaryIncreaseSendMailResultItem[] = res.data || [];
                const failedResults = results.filter(r => !r.Success);
                failCount = failedResults.length;

                if (failCount > 0) {
                  const failedLabels = failedResults.map(r => {
                    const row = rows.find(x => x.ID === r.DetailID);
                    const name = row ? `${row.EmployeeCode || ''} ${row.EmployeeName || ''}`.trim() : `#${r.DetailID}`;
                    return r.ErrorMessage ? `${name} (${r.ErrorMessage})` : name;
                  });
                  this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Gửi thất bại cho: ${failedLabels.join('; ')}`,
                    { nzDuration: 0 }
                  );
                }
              } else if (rows.length > 0) {
                this.notification.info(
                  NOTIFICATION_TITLE.success,
                  'Mail đang được gửi ở nền. Vui lòng chờ ít phút rồi xem cột "Đã gửi" trong bảng để biết ai gửi thành công/thất bại.',
                  { nzDuration: 6000 }
                );
              }

              const summary = `${res.message || 'Gửi mail thành công'}`;
              if (failCount === 0) {
                this.notification.success(NOTIFICATION_TITLE.success, summary);
              } else {
                this.notification.warning(NOTIFICATION_TITLE.warning, summary);
              }
              this.checkedDetailIds.clear();
              this.loadDetailData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, `${res?.message || 'Gửi mail thất bại'}`);
            }
          },
          error: (err) => {
            this.sendingMail = false;
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi kết nối máy chủ khi gửi mail');
          }
        });
      },
      error: () => {
        this.sendingMail = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không tải được dữ liệu nhân viên / cấu hình mail');
      }
    });
  }

  private loadEmployeesOnce(): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      this.service.getEmployees().subscribe({
        next: (res: any) => {
          const employees = res?.status === 1 ? (res.data || []) : [];
          this.employeesCache = employees;
          subscriber.next(employees);
          subscriber.complete();
        },
        error: (err: any) => subscriber.error(err)
      });
    });
  }

  private loadMailConfigOnce(): Observable<SalaryIncreaseMailConfig> {
    return new Observable<SalaryIncreaseMailConfig>(subscriber => {
      this.service.getMailConfig().subscribe({
        next: (res: any) => {
          const config: SalaryIncreaseMailConfig = res?.status === 1 ? (res.data || {}) : {};
          this.mailConfigCache = config;
          subscriber.next(config);
          subscriber.complete();
        },
        error: (err: any) => subscriber.error(err)
      });
    });
  }

  private loadDepartmentsOnce(): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      this.service.getDepartments().subscribe({
        next: (res: any) => {
          const departments = res?.status === 1 ? (res.data || []) : [];
          this.departmentsCache = departments;
          subscriber.next(departments);
          subscriber.complete();
        },
        error: (err: any) => subscriber.error(err)
      });
    });
  }

  private buildSendMailItems(
    rows: SalaryIncreaseDetail[],
    employees: any[],
    mailConfig: SalaryIncreaseMailConfig,
    departments: any[]
  ): (SalaryIncreaseSendMailItem & { EmployeeName: string; IsSend?: boolean })[] {
    const employeeMap = new Map<number, any>();
    for (const emp of employees) {
      if (emp?.ID) employeeMap.set(emp.ID, emp);
    }
    const departmentMap = new Map<number, any>();
    for (const dept of departments || []) {
      if (dept?.ID) departmentMap.set(dept.ID, dept);
    }

    return rows.map(row => {
      const emp = row.EmployeeID ? employeeMap.get(row.EmployeeID) : null;
      const dept = emp?.DepartmentID ? departmentMap.get(emp.DepartmentID) : null;
      // Nhân viên được tăng lương chính là trưởng bộ phận -> không cc EmailTBP nữa (trùng người),
      // chỉ cc BGĐ/HRM/KTT.
      const isHeadOfDepartment = !!dept && !!row.EmployeeID && dept.HeadofDepartment === row.EmployeeID;

      const mailData = {
        EmployeeName: row.EmployeeName || emp?.FullName || '',
        Position: emp?.ChucVu || '',
        OldMonth: this.selectedMasterRow?.MonthFrom || '',
        NewMonth: this.selectedMasterRow?.MonthTo || '',
        OldSalary: this.formatNumber(row.PreviousBaseSalary),
        NewSalary: this.formatNumber(row.CurrentBaseSalary),
        EffectiveDate: this.formatDate(this.selectedMasterRow?.EffectiveDate),
        Footer: mailConfig.Footer || ''
      };

      // Thứ tự Cc: BGĐ -> TBP -> HRM -> KTT (bỏ TBP nếu chính nhân viên là trưởng bộ phận, tránh trùng người).
      const cc = [
        mailConfig.BGDEmail,
        isHeadOfDepartment ? '' : row.EmailTBP,
        mailConfig.HRMEmail,
        mailConfig.KTTEmail
      ]
        .filter((x): x is string => !!x && x.trim().length > 0)
        .join(';');
      const emailTo = emp?.EmailCongTy || emp?.EmailCaNhan || '';

      return {
        DetailID: row.ID!,
        EmployeeName: mailData.EmployeeName,
        EmailTo: emailTo,
        EmailCC: cc,
        Subject: buildSalaryIncreaseMailSubject(mailData),
        Body: buildSalaryIncreaseMailBody(mailData),
        IsSend: row.IsSend
      };
    });
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    return DateTime.fromISO(dateVal).toFormat('dd/MM/yyyy');
  }

  formatNumber(numVal: any): string {
    if (numVal === null || numVal === undefined) return '0';
    return new Intl.NumberFormat('vi-VN').format(numVal);
  }

  // --- Master CRUD Actions ---

  openAddMaster(): void {
    const modalRef = this.ngbModal.open(SalaryIncreaseFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadMasterData();
      }
    }).catch(() => {});
  }

  openEditMaster(): void {
    if (!this.selectedMasterRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đợt tăng lương cần sửa.');
      return;
    }

    const modalRef = this.ngbModal.open(SalaryIncreaseFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.dataRecord = this.selectedMasterRow;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadMasterData();
      }
    }).catch(() => {});
  }

  deleteMaster(): void {
    if (!this.selectedMasterRow || !this.selectedMasterRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đợt tăng lương cần xóa.');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa đợt tăng lương "${this.selectedMasterRow.Name}" không? Hành động này cũng sẽ ẩn toàn bộ thông tin chi tiết nhân viên bên trong.`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.loadingMaster = true;
        this.service.deleteMaster([this.selectedMasterRow!.ID!]).subscribe({
          next: (res: any) => {
            this.loadingMaster = false;
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadMasterData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa thất bại');
            }
          },
          error: (err) => {
            this.loadingMaster = false;
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
          }
        });
      }
    });
  }

  // --- Detail CRUD Actions ---

  openAddDetail(): void {
    if (!this.selectedMasterRow || !this.selectedMasterRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hoặc tạo đợt tăng lương trước.');
      return;
    }

    const modalRef = this.ngbModal.open(SalaryIncreaseDetailFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.salaryIncreaseId = this.selectedMasterRow.ID;
    modalRef.componentInstance.existingDetails = this.detailList;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadDetailData();
      }
    }).catch(() => {});
  }

  openImportExcel(): void {
    if (!this.selectedMasterRow || !this.selectedMasterRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hoặc tạo đợt tăng lương trước.');
      return;
    }

    const modalRef = this.ngbModal.open(SalaryIncreaseImportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.salaryIncreaseId = this.selectedMasterRow.ID;
    modalRef.componentInstance.existingEmployeeIds = this.detailList
      .map(d => d.EmployeeID)
      .filter((id): id is number => !!id);

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadDetailData();
      }
    }).catch(() => {});
  }

  openEditDetail(): void {
    if (!this.selectedMasterRow || !this.selectedMasterRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa chọn đợt tăng lương.');
      return;
    }
    if (!this.selectedDetailRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần cập nhật thông tin.');
      return;
    }

    const modalRef = this.ngbModal.open(SalaryIncreaseDetailFormComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.salaryIncreaseId = this.selectedMasterRow.ID;
    modalRef.componentInstance.dataRecord = this.selectedDetailRow;
    modalRef.componentInstance.existingDetails = this.detailList;

    modalRef.result.then((res) => {
      if (res === 'save') {
        this.loadDetailData();
      }
    }).catch(() => {});
  }

  deleteDetail(): void {
    if (!this.selectedDetailRow || !this.selectedDetailRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần xóa khỏi đợt tăng lương.');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa nhân viên này khỏi đợt tăng lương không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.loadingDetail = true;
        this.service.deleteDetail([this.selectedDetailRow!.ID!]).subscribe({
          next: (res: any) => {
            this.loadingDetail = false;
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadDetailData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa thất bại');
            }
          },
          error: (err) => {
            this.loadingDetail = false;
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
          }
        });
      }
    });
  }
}
