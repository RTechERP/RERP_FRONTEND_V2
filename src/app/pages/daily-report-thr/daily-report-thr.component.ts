import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { DailyReportTechService } from '../DailyReportTech/DailyReportTechService/daily-report-tech.service';
import { AuthService } from '../../auth/auth.service';
import { DepartmentServiceService } from '../hrm/department/department-service/department-service.service';
import { TeamServiceService } from '../hrm/team/team-service/team-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../tabulator-default.config';
import * as ExcelJS from 'exceljs';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DailyReportHrDetailComponent } from '../DailyReportTech/daily-report-hr-detail/daily-report-hr-detail.component';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

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
    NzGridModule,
    NzSplitterModule,
    NzNotificationModule,
    NzModalModule,
    NzDropDownModule,
    NzSpinModule,
    Menubar,
  ],
  templateUrl: './daily-report-thr.component.html',
  styleUrl: './daily-report-thr.component.css'
})
export class DailyReportThrComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_daily_report_hr', { static: false })
  tb_daily_report_hrContainer!: ElementRef;

  private searchSubject = new Subject<string>();

  // Search panel state
  sizeSearch: string = '22%';
  showSearchBar: boolean = false; // Mặc định ẩn, sẽ được set trong ngOnInit
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];
  isLoading: boolean = false;

  // Search filters
  dateStart: string = DateTime.local().minus({ days: 1 }).toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local().toFormat('yyyy-MM-dd');
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

  @HostListener('window:resize')
  onResize() {
    this.updateResponsiveState();
  }

  ngOnInit(): void {
    this.updateResponsiveState();
    this.initMenuBar();

    // Load theo thứ tự: getCurrentUser -> loadDepartments -> set departmentId -> loadTeams -> loadUsers -> getDailyReportHrData
    this.getCurrentUser();
  }

  ngAfterViewInit(): void {
    this.drawTbDailyReportHr(this.tb_daily_report_hrContainer.nativeElement);
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;

        // Load departments trước, sau đó set departmentId và load các bộ lọc khác
        this.loadDepartments(() => {
          // Set departmentId từ currentUser.DepartmentID sau khi departments đã load xong
          if (this.currentUser.IsAdmin == true) {
            this.departmentId = 6;
          }
          else if (this.currentUser.DepartmentID && this.currentUser.IsAdmin != true) {
            this.departmentId = this.currentUser.DepartmentID;
          }
          if (this.currentUser && this.currentUser.DepartmentID && this.currentUser.IsAdmin != true) {
            this.departmentId = this.currentUser.DepartmentID;
          }

          // Load teams và users sau khi đã set departmentId
          this.loadTeams();
          this.loadUsers(() => {
            // Set userId sau khi users đã load xong
            if (this.currentUser) {
              if (this.currentUser.IsLeader > 1 || this.currentUser.IsAdmin == true) {
                this.userId = 0
              }
              else if (this.currentUser.ID && this.currentUser.IsAdmin != true) {
                this.setUserIdFromEmployeeID(this.currentUser.ID);
              } else if (this.currentUser.EmployeeID && this.currentUser.IsAdmin != true) {
                this.setUserIdFromEmployeeID(this.currentUser.EmployeeID);
              }
            } else {
              this.userId = 0;
            }

            // Load data bảng sau khi tất cả các bộ lọc đã sẵn sàng
            if (this.tb_daily_report_hr) {
              this.getDailyReportHrData();
            }
          });
        });
      } else {
        this.userId = 0;
        // Vẫn load departments và các bộ lọc khác
        this.loadDepartments(() => {
          this.loadTeams();
          this.loadUsers(() => {
            if (this.tb_daily_report_hr) {
              this.getDailyReportHrData();
            }
          });
        });
      }
    });
  }

  loadDepartments(callback?: () => void): void {
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        this.departments = response.data || [];
        if (callback) {
          callback();
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.departments = [];
        if (callback) {
          callback();
        }
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

  loadUsers(callback?: () => void): void {
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

        if (callback) {
          callback();
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        if (callback) {
          callback();
        }
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

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const isMobile = window.innerWidth <= 768;
    const wasOpen = this.showSearchBar;

    this.showSearchBar = !this.showSearchBar;

    if (isMobile) {
      if (this.showSearchBar) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    }

    requestAnimationFrame(() => {
      if (isMobile && this.showSearchBar && !wasOpen) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  searchDailyReports(): void {
    this.getDailyReportHrData();
  }

  getDailyReportHrData(): void {
    const searchParams = this.getSearchParams();
    this.isLoading = true;

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

        // Tự động ẩn filter bar trên mobile sau khi tìm kiếm
        const isMobile = window.innerWidth <= 768;
        if (isMobile && this.showSearchBar) {
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          setTimeout(() => {
            this.showSearchBar = false;
          }, 100);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi khi lấy dữ liệu báo cáo HR:', error);
        this.dailyReportHrData = [];
        if (this.tb_daily_report_hr) {
          this.tb_daily_report_hr.replaceData(this.dailyReportHrData);
        }
        this.isLoading = false;
      }
    });
  }

  setDefaultSearch(): void {
    this.dateStart = DateTime.local().minus({ days: 1 }).toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local().toFormat('yyyy-MM-dd');
    this.departmentId = 0;
    this.teamId = 0;
    this.userId = 0;
    this.keyword = '';
    this.loadTeams();
    this.searchDailyReports();
  }

  getSearchParams(): any {

    let userID = 0;
    if (this.currentUser) {
      if (this.currentUser.IsLeader > 1 || this.currentUser.IsAdmin == true) {
        userID = this.userId || 0;
      } else {
        userID = this.currentUser.ID || 0;
      }
    }

    return {
      dateStart: this.dateStart || DateTime.local().minus({ days: 1 }).toFormat('yyyy-MM-dd'),
      dateEnd: this.dateEnd || DateTime.local().toFormat('yyyy-MM-dd'),
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
          // {
          //   title: '',
          //   field: 'ID',
          //   width: 100,
          //   formatter: (cell: any) => {
          //     return `
          //       <button class="btn btn-primary btn-sm me-1 btn-edit-row" title="Sửa">
          //         <i class="fas fa-pen"></i>
          //       </button>
          //       <button class="btn btn-danger btn-sm btn-delete-row" title="Xóa">
          //         <i class="fas fa-trash"></i>
          //       </button>
          //     `;
          //   },
          //   cellClick: (e: any, cell: any) => {
          //     const row = cell.getRow().getData();
          //     const id = row.ID || 0;
          //     const target = e.target as HTMLElement;

          //     if (target.closest('.btn-edit-row')) {
          //       this.editDailyReportById(id);
          //     } else if (target.closest('.btn-delete-row')) {
          //       this.deleteDailyReportById(id);
          //     }
          //   },
          //   headerSort: false,
          //   hozAlign: 'center',
          // },
          {
            title: 'Họ tên',
            field: 'FullName',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Chức vụ',
            field: 'PositionName',
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
          // {
          //   title: 'Tổng giờ',
          //   field: 'TotalHours',
          //   hozAlign: 'right',
          //   width: 80,
          //   headerSort: false,
          // },
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
            title: 'Lý do tồn đọng',
            field: 'BacklogReason',
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
    // Hàm fallback sử dụng execCommand với focus handling
    const useExecCommand = (): boolean => {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Style để textarea không hiển thị nhưng vẫn có thể focus
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';

      document.body.appendChild(textArea);

      // Đảm bảo focus window trước
      window.focus();
      textArea.focus();
      textArea.select();

      // Thử select bằng cách khác nếu cần
      textArea.setSelectionRange(0, text.length);

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
          return true;
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err: any) {
        document.body.removeChild(textArea);
        throw err;
      }
    };

    try {
      // Đảm bảo window được focus
      window.focus();

      // Thử sử dụng Clipboard API nếu có
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
          return;
        } catch (clipboardErr: any) {
          console.warn('Clipboard API failed, trying execCommand:', clipboardErr.message);
          // Fallback sang execCommand
          useExecCommand();
          return;
        }
      } else {
        // Nếu không có Clipboard API, dùng execCommand
        useExecCommand();
        return;
      }
    } catch (err: any) {
      console.error('Copy to clipboard final error:', err);
      this.notification.error(
        'Thông báo',
        'Không thể copy vào clipboard. Vui lòng click vào trang trước khi copy!'
      );
    }
  }

  async exportReport(): Promise<void> {
    const table = this.tb_daily_report_hr;
    if (!table) {
      this.notification.error('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }

    // Lấy dữ liệu hiện tại từ bảng (bao gồm cả filter/search)
    const data = table.getData('active'); // 'active' để lấy data đã được filter
    if (!data || data.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để xuất báo cáo!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo HR');

    // Lấy columns từ bảng
    const columns = table.getColumns();
    const columnDefinitions = columns.map((col: any) => col.getDefinition());

    // Lọc bỏ các columns không có field (như action buttons)
    const visibleColumns = columnDefinitions.filter((col: any) => col.field && col.visible !== false);

    // Tạo header
    const headers = visibleColumns.map((col: any) => col.title || col.field);
    worksheet.addRow(headers);

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // Xử lý dữ liệu từng dòng
    data.forEach((row: any, rowIndex: number) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.field;
        let value = row[field];

        // Xử lý formatter nếu có
        if (col.formatter) {
          if (typeof col.formatter === 'function') {
            // Tạo cell giả để lấy giá trị đã format
            const fakeCell = {
              getValue: () => value,
              getRow: () => ({ getData: () => row })
            };
            try {
              const formattedValue = col.formatter(fakeCell as any);
              // Nếu formatter trả về HTML, lấy text
              if (typeof formattedValue === 'string' && formattedValue.includes('<')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formattedValue;
                value = tempDiv.textContent || tempDiv.innerText || value;
              } else {
                value = formattedValue;
              }
            } catch (e) {
              // Nếu lỗi, dùng giá trị gốc
            }
          } else if (col.formatter === 'textarea') {
            // Giữ nguyên giá trị cho textarea
          }
        }

        // Xử lý date
        if (value && typeof value === 'string') {
          // Kiểm tra nếu là ISO date string
          if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const dateTime = DateTime.fromISO(value);
            if (dateTime.isValid) {
              // Nếu là DateReport hoặc CreatedDate, format đúng
              if (field === 'DateReport') {
                value = dateTime.toFormat('dd/MM/yyyy');
              } else if (field === 'CreatedDate') {
                value = dateTime.toFormat('dd/MM/yyyy HH:mm:ss');
              } else {
                value = dateTime.toJSDate();
              }
            }
          }
        }

        return value || '';
      });

      const excelRow = worksheet.addRow(rowData);
      excelRow.alignment = { vertical: 'top', wrapText: true };
    });

    // Định dạng cột
    worksheet.columns.forEach((column: any, index: number) => {
      const colDef = visibleColumns[index];
      if (!colDef) return;

      let maxLength = colDef.title ? colDef.title.length : 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });

      // Set width với giới hạn
      column.width = Math.min(Math.max(maxLength, 10), 50);

      // Alignment
      if (colDef.hozAlign === 'right') {
        column.alignment = { horizontal: 'right' };
      } else if (colDef.hozAlign === 'center') {
        column.alignment = { horizontal: 'center' };
      }
    });

    // Auto filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = DateTime.now().toFormat('ddMMyyyy');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `BaoCaoHR_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success('Thông báo', `Xuất excel thành công!`);
  }

  private updateResponsiveState(): void {
    const nextIsMobile = window.innerWidth <= 768;
    const modeChanged = this.isMobile !== nextIsMobile;
    this.isMobile = nextIsMobile;

    if (modeChanged) {
      this.showSearchBar = !this.isMobile;
    }
  }

  private initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Tìm kiếm',
        icon: PrimeIcons.SEARCH,
        command: () => this.ToggleSearchPanelNew(),
      },
      {
        label: 'Thêm',
        icon: PrimeIcons.PLUS,
        command: () => this.addDailyReport(),
      },
      {
        label: 'Sửa',
        icon: PrimeIcons.PENCIL,
        command: () => this.editDailyReport(),
      },
      {
        label: 'Xóa',
        icon: PrimeIcons.TRASH,
        command: () => this.deleteDailyReport(),
      },
      {
        label: 'Copy',
        icon: PrimeIcons.COPY,
        command: () => this.copyDailyReport(),
      },
      {
        label: 'Xuất danh sách',
        icon: PrimeIcons.FILE_EXCEL,
        command: () => this.exportReport(),
      },
    ];
  }
}
