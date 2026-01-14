import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { DailyReportTechService } from '../DailyReportTechService/daily-report-tech.service';
import { AuthService } from '../../../auth/auth.service';
import { DepartmentServiceService } from '../../hrm/department/department-service/department-service.service';
import { TeamServiceService } from '../../hrm/team/team-service/team-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import * as ExcelJS from 'exceljs';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DailyReportHrDetailComponent } from '../daily-report-hr-detail/daily-report-hr-detail.component';

@Component({
  selector: 'app-daily-report-hr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzSplitterModule,
    NzNotificationModule,
    NzModalModule,
  ],
  templateUrl: './daily-report-hr.component.html',
 // styleUrl: './daily-report-hr.component.css'
})
export class DailyReportHrComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_daily_report_hr', { static: false })
  tb_daily_report_hrContainer!: ElementRef;

  private searchSubject = new Subject<string>();

  // Search panel state
  sizeSearch: string = '22%';
  
  // Search filters
  dateStart: any = DateTime.local().minus({ days: 1 }).set({ hour: 0, minute: 0, second: 0 }).toISO();
  dateEnd: any = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toISO();
  departmentId: number = 0;
  teamId: number = 0;
  userId: number = 0;
  keyword: string = '';

  // Data arrays
  departments: any[] = [];
  teams: any[] = [];
  users: any[] = [];
  currentUser: any = null;
  dailyReportHrData: any[] = [];

  // Table
  tb_daily_report_hr: any;

  constructor(
    private dailyReportTechService: DailyReportTechService,
    private authService: AuthService,
    private departmentService: DepartmentServiceService,
    private teamService: TeamServiceService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
  ) {
    this.searchSubject
      .pipe(debounceTime(800))
      .subscribe(() => {
        this.searchDailyReports();
      });
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadDepartments();
    this.loadUsers();
    this.loadTeams();
  }

  ngAfterViewInit(): void {
    this.drawTbDailyReportHr(this.tb_daily_report_hrContainer.nativeElement);
    
    setTimeout(() => {
      if (this.currentUser) {
        this.getDailyReportHrData();
      }
    }, 100);
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        
        if (this.users.length > 0) {
          if (data.ID) {
            this.setUserIdFromEmployeeID(data.ID);
          } else if (data.EmployeeID) {
            this.setUserIdFromEmployeeID(data.EmployeeID);
          } else {
            this.userId = 0;
          }
        } else {
          this.userId = 0;
        }
        
        if (this.tb_daily_report_hr) {
          this.getDailyReportHrData();
        }
      } else {
        this.userId = 0;
        if (this.tb_daily_report_hr) {
          this.getDailyReportHrData();
        }
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        this.departments = response.data || [];
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      },
    });
  }

  loadTeams(): void {
    if (this.departmentId > 0) {
      this.teamService.getTeams(this.departmentId).subscribe({
        next: (response: any) => {
          this.teams = [
            { ID: 0, Name: 'Tất cả' },
            ...(response.data || [])
          ];
        },
        error: (error) => {
          console.error('Error loading teams:', error);
          this.teams = [{ ID: 0, Name: 'Tất cả' }];
        },
      });
    } else {
      this.teams = [{ ID: 0, Name: 'Tất cả' }];
      this.teamId = 0;
    }
  }

  loadUsers(): void {
    const userTeamID = this.teamId > 0 ? this.teamId : undefined;
    const departmentid = this.departmentId > 0 ? this.departmentId : undefined;
    
    this.dailyReportTechService.getEmployees(userTeamID, departmentid).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const employees = Array.isArray(response.data) ? response.data : [];
          
          if (employees.length > 0 && employees[0].DepartmentName) {
            this.users = this.groupEmployeesByDepartment(employees);
          } else {
            this.users = [{
              label: 'Nhân viên',
              options: employees.map((emp: any) => ({
                item: emp
              }))
            }];
          }
        } else {
          this.users = [];
        }
        
        if (this.currentUser) {
          if (this.currentUser.ID) {
            this.setUserIdFromEmployeeID(this.currentUser.ID);
          } else if (this.currentUser.EmployeeID) {
            this.setUserIdFromEmployeeID(this.currentUser.EmployeeID);
          } else {
            this.userId = 0;
          }
        } else {
          this.userId = 0;
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
      },
    });
  }

  groupEmployeesByDepartment(employees: any[]): any[] {
    const grouped: { [key: string]: any[] } = {};
    
    employees.forEach(emp => {
      const deptName = emp.DepartmentName || 'Khác';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push({ item: emp });
    });

    return Object.keys(grouped).map(deptName => ({
      label: deptName,
      options: grouped[deptName]
    }));
  }

  setUserIdFromEmployeeID(employeeID: number): void {
    for (const group of this.users) {
      for (const option of group.options) {
        const item = option.item;
        if (item) {
          if (item.UserID === employeeID || item.ID === employeeID || item.EmployeeID === employeeID) {
            this.userId = item.UserID;
            return;
          }
        } else if (option.UserID === employeeID) {
          this.userId = option.UserID;
          return;
        }
      }
    }
    this.userId = 0;
  }

  onDepartmentChange(): void {
    this.teamId = 0;
    this.loadTeams();
    this.loadUsers();
  }

  onTeamChange(): void {
    this.loadUsers();
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  searchDailyReports(): void {
    this.getDailyReportHrData();
  }

  getDailyReportHrData(): void {
    const searchParams = this.getSearchParams();
    
    this.dailyReportTechService.getDailyReportTech(searchParams).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.dailyReportHrData = Array.isArray(response.data) ? response.data : [];
        } else {
          this.dailyReportHrData = [];
        }
        
        if (this.tb_daily_report_hr) {
          this.tb_daily_report_hr.replaceData(this.dailyReportHrData);
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi khi lấy dữ liệu báo cáo HR:', error);
        this.dailyReportHrData = [];
        if (this.tb_daily_report_hr) {
          this.tb_daily_report_hr.replaceData(this.dailyReportHrData);
        }
      }
    });
  }

  setDefaultSearch(): void {
    this.dateStart = DateTime.local().minus({ days: 1 }).set({ hour: 0, minute: 0, second: 0 }).toISO();
    this.dateEnd = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toISO();
    this.departmentId = 0;
    this.teamId = 0;
    this.keyword = '';
    this.loadTeams();
    this.searchDailyReports();
  }

  getSearchParams(): any {
    let dateStart: DateTime;
    if (this.dateStart instanceof Date) {
      dateStart = DateTime.fromJSDate(this.dateStart);
    } else if (typeof this.dateStart === 'string') {
      dateStart = DateTime.fromISO(this.dateStart);
    } else {
      dateStart = DateTime.local().minus({ days: 1 });
    }

    let dateEnd: DateTime;
    if (this.dateEnd instanceof Date) {
      dateEnd = DateTime.fromJSDate(this.dateEnd);
    } else if (typeof this.dateEnd === 'string') {
      dateEnd = DateTime.fromISO(this.dateEnd);
    } else {
      dateEnd = DateTime.local();
    }

    let userID = 0;
    if (this.currentUser) {
      if (this.currentUser.IsLeader > 1 || this.currentUser.IsAdmin == true) {
        userID = this.userId || 0;
      } else {
        userID = this.currentUser.ID || 0;
      }
    }

    return {
      dateStart: dateStart.isValid ? dateStart.toFormat('yyyy-MM-dd') : null,
      dateEnd: dateEnd.isValid ? dateEnd.toFormat('yyyy-MM-dd') : null,
      departmentID: this.departmentId || 0,
      teamID: this.teamId || 0,
      userID: userID,
      keyword: this.keyword.trim() || '',
    };
  }

  drawTbDailyReportHr(container: HTMLElement): void {
    if (this.tb_daily_report_hr) {
      this.tb_daily_report_hr.setData(this.dailyReportHrData);
    } else {
      this.tb_daily_report_hr = new Tabulator(container, {
        data: this.dailyReportHrData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        rowHeader: false,
        selectableRows: 1,
        height: '87vh',
        paginationMode: 'local',
        columns: [
          {
            title: '',
            field: 'ID',
            width: 100,
            formatter: (cell: any) => {
              return `
                <button class="btn btn-primary btn-sm me-1 btn-edit-row" title="Sửa">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-delete-row" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              `;
            },
            cellClick: (e: any, cell: any) => {
              const row = cell.getRow().getData();
              const id = row.ID || 0;
              const target = e.target as HTMLElement;
              
              if (target.closest('.btn-edit-row')) {
                this.editDailyReportById(id);
              } else if (target.closest('.btn-delete-row')) {
                this.deleteDailyReportById(id);
              }
            },
            headerSort: false,
            hozAlign: 'center',
          },
          {
            title: 'Họ tên',
            field: 'FullName',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Ngày báo cáo',
            field: 'DateReport',
            formatter: (cell: any) => {
              const value = cell.getValue() || '';
              const dateTime = DateTime.fromISO(value);
              return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            },
            hozAlign: 'center',
            width: 120,
          },
          {
            title: 'Tổng giờ',
            field: 'TotalHours',
            hozAlign: 'right',
            width: 80,
            headerSort: false,
          },
          {
            title: 'Nội dung',
            field: 'Content',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Kết quả',
            field: 'Results',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Kế hoạch ngày tiếp theo',
            field: 'PlanNextDay',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Tồn đọng',
            field: 'Backlog',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Vấn đề phát sinh',
            field: 'Problem',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Giải pháp',
            field: 'ProblemSolve',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            width: 300,
            formatter: 'textarea',
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            formatter: (cell: any) => {
              const value = cell.getValue() || '';
              const dateTime = DateTime.fromISO(value);
              return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy HH:mm:ss') : '';
            },
            hozAlign: 'center',
            width: 150,
          },
        ],
      });
    }
  }

  editDailyReportById(id: number): void {
    const modalRef = this.modalService.open(DailyReportHrDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-hr-modal'
    });

    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.dataInput = id;
    modalRef.componentInstance.currentUser = this.currentUser;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getDailyReportHrData();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  deleteDailyReportById(id: number): void {
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.dailyReportTechService.deleteDailyReport(id).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Đã xóa báo cáo thành công!');
              this.getDailyReportHrData();
            } else {
              this.notification.error('Thông báo', response?.message || 'Không thể xóa báo cáo!');
            }
          },
          error: (error: any) => {
            const errorMsg = error?.error?.message || error?.message || 'Đã xảy ra lỗi khi xóa báo cáo!';
            this.notification.error('Thông báo', errorMsg);
            console.error('Error deleting daily report:', error);
          }
        });
      }
    });
  }

  // Header actions
  addDailyReport(): void {
    const modalRef = this.modalService.open(DailyReportHrDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-hr-modal'
    });

    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.currentUser = this.currentUser;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getDailyReportHrData();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  editDailyReport(): void {
    const selectedRows = this.tb_daily_report_hr.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 báo cáo để sửa!');
      return;
    }

    const selectedRow = selectedRows[0] as any;
    const dailyID = selectedRow['ID'];

    if (!dailyID) {
      this.notification.error('Thông báo', 'Không tìm thấy ID của báo cáo!');
      return;
    }

    const modalRef = this.modalService.open(DailyReportHrDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-hr-modal'
    });

    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.dataInput = dailyID;
    modalRef.componentInstance.currentUser = this.currentUser;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getDailyReportHrData();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  deleteDailyReport(): void {
    const selectedRows = this.tb_daily_report_hr.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 báo cáo để xóa!');
      return;
    }

    const selectedRow = selectedRows[0] as any;
    const dailyID = selectedRow['ID'];

    if (!dailyID) {
      this.notification.error('Thông báo', 'Không tìm thấy ID của báo cáo!');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.dailyReportTechService.deleteDailyReport(dailyID).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Đã xóa báo cáo thành công!');
              this.getDailyReportHrData();
            } else {
              this.notification.error('Thông báo', response?.message || 'Không thể xóa báo cáo!');
            }
          },
          error: (error: any) => {
            const errorMsg = error?.error?.message || error?.message || 'Đã xảy ra lỗi khi xóa báo cáo!';
            this.notification.error('Thông báo', errorMsg);
            console.error('Error deleting daily report:', error);
          }
        });
      }
    });
  }

  copyDailyReport(): void {
    const searchParams = this.getSearchParams();
    
    let employeeID = 0;
    if (searchParams.userID && searchParams.userID > 0) {
      for (const group of this.users) {
        if (group.options && Array.isArray(group.options)) {
          const foundUser = group.options.find((opt: any) => opt.item?.UserID === searchParams.userID);
          if (foundUser && foundUser.item?.ID) {
            employeeID = foundUser.item.ID;
            break;
          }
        }
      }
    }
    
    const copyParams = {
      dateStart: searchParams.dateStart,
      dateEnd: searchParams.dateEnd,
      team_id: searchParams.teamID || 0,
      keyword: searchParams.keyword || '',
      userid: employeeID || 0,
      departmentid: searchParams.departmentID || 0
    };
    
    this.dailyReportTechService.getForCopy(copyParams).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const result = Array.isArray(response.data) ? response.data : [];
          this.formatAndCopyReport(result);
        } else {
          this.notification.error('Thông báo', 'Không có dữ liệu để copy!');
        }
      },
      error: (error: any) => {
        const errorMsg = error?.error?.message || error?.message || 'Đã xảy ra lỗi khi lấy dữ liệu copy!';
        this.notification.error('Thông báo', errorMsg);
      }
    });
  }

  private formatAndCopyReport(result: any[]): void {
    if (!result || result.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để copy!');
      return;
    }

    const uniqueDates = [...new Set(result.map(item => item.DateReport))];
    
    if (uniqueDates.length === 1) {
      const contentSummary = this.formatSingleDayReport(result, uniqueDates[0]);
      this.copyToClipboard(contentSummary);
    } else {
      this.notification.warning('Thông báo', `Bạn không thể copy nội dung của ${uniqueDates.length} ngày!`);
    }
  }

  private formatSingleDayReport(dayData: any[], dateReport: string): string {
    let content = '';
    let resultReport = '';
    let backlog = '';
    let problem = '';
    let problemSolve = '';
    let planNextDay = '';
    let note = '';

    const dateTime = DateTime.fromISO(dateReport);
    const formattedDate = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : dateReport;
    let contentSummary = `Báo cáo công việc ngày ${formattedDate}\n`;

    dayData.forEach(item => {
      if (item) {
        if (item.Content) content += item.Content + '\n';
        if (item.Results) resultReport += item.Results + '\n';
        if (item.Backlog) backlog += item.Backlog + '\n';
        if (item.Problem) problem += item.Problem + '\n';
        if (item.ProblemSolve) problemSolve += item.ProblemSolve + '\n';
        if (item.Note) note += item.Note + '\n';
        if (item.PlanNextDay) planNextDay = item.PlanNextDay;
      }
    });

    contentSummary += `\n* Nội dung công việc:\n${content.trim()}\n`;
    contentSummary += `\n* Kết quả công việc:\n${resultReport.trim()}\n`;
    contentSummary += `\n* Tồn đọng:\n${backlog.trim() === '' ? '- Không có' : backlog.trim()}\n`;
    contentSummary += `\n* Ghi chú:\n${note.trim() === '' ? '- Không có' : note.trim()}\n`;
    contentSummary += `\n* Vấn đề phát sinh:\n${problem.trim() === '' ? '- Không có' : problem.trim()}\n`;
    contentSummary += `\n* Giải pháp cho vấn đề phát sinh:\n${problemSolve.trim() === '' ? '- Không có' : problemSolve.trim()}\n`;
    contentSummary += `\n* Kế hoạch ngày tiếp theo:\n${planNextDay.trim() === '' ? '- Không có' : planNextDay.trim()}\n`;

    return contentSummary;
  }

  private async copyToClipboard(text: string): Promise<void> {
    const useExecCommand = (): boolean => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
          return true;
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err: any) {
        throw err;
      } finally {
        document.body.removeChild(textArea);
      }
    };
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
        } catch (clipboardErr: any) {
          if (clipboardErr.name === 'NotAllowedError' || clipboardErr.message?.includes('not focused')) {
            useExecCommand();
          } else {
            throw clipboardErr;
          }
        }
      } else {
        useExecCommand();
      }
    } catch (err: any) {
      this.notification.error('Thông báo', 'Không thể copy vào clipboard. Vui lòng thử lại!');
    }
  }

  async exportReport(): Promise<void> {
    const table = this.tb_daily_report_hr;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu xuất báo cáo!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo HR');

    const columns = table.getColumns();
    const headers = columns.map((col: any) => col.getDefinition().title);
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `BaoCaoHR_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
