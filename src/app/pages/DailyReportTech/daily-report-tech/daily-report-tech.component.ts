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
import { DailyReportTechService } from '../DailyReportTechService/daily-report-tech.service';
import { AuthService } from '../../../auth/auth.service';
import { DepartmentServiceService } from '../../hrm/department/department-service/department-service.service';
import { TeamServiceService } from '../../hrm/team/team-service/team-service.service';
import { ProjectService } from '../../project/project-service/project.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import * as ExcelJS from 'exceljs';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DailyReportTechDetailComponent } from './daily-report-tech-detail/daily-report-tech-detail.component';
import { DailyReportExcelComponent } from '../daily-report-excel/daily-report-excel.component';
import { USER_ALL_REPORT_TECH } from '../../../app.config';
import { USER_ALL_REPORT } from '../../../app.config';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { AppUserService } from '../../../services/app-user.service';

@Component({
  selector: 'app-daily-report-tech',

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
  templateUrl: './daily-report-tech.component.html',
  styleUrl: './daily-report-tech.component.css'
})

export class DailyReportTechComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_daily_report_tech', { static: false })
  tb_daily_report_techContainer!: ElementRef;

  private searchSubject = new Subject<string>();

  // Search panel state
  sizeSearch: string = '22%';
  showSearchBar: boolean = true; // Mặc định ẩn, sẽ được set trong ngOnInit
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];
  isLoading: boolean = false;

  // Search filters
  dateStart: string = DateTime.local().minus({ days: 1 }).toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local().toFormat('yyyy-MM-dd');
  departmentId: number = 2;
  teamId: number = 0;
  userId: number = 0;
  keyword: string = '';

  // Data arrays
  departments: any[] = [];
  teams: any[] = [];
  users: any[] = [];
  dailyReportTechData: any[] = [];
  projects: any[] = [];

  //data user
  userData: any = null;

  // Table
  tb_daily_report_tech: any;

  constructor(
    private dailyReportTechService: DailyReportTechService,
    private authService: AuthService,
    private departmentService: DepartmentServiceService,
    private teamService: TeamServiceService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private appUserService: AppUserService,
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

    this.loadDepartments();
    this.loadUsers();
    this.loadTeams(); // Load teams khi departmentId = 2
    this.loadProjects(); // Load projects
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.projects = [];
      },
    });
  }

  ngAfterViewInit(): void {
    // Vẽ table trước với data rỗng (giống summary-of-exam-results)
    this.drawTbDailyReportTech(this.tb_daily_report_techContainer.nativeElement);

    // Load dữ liệu sau khi table đã được khởi tạo
    setTimeout(() => {
      // Sử dụng AppUserService để kiểm tra user hiện tại
      if (this.appUserService.currentUser) {
        this.getDailyReportTechData();
      }
    }, 100);
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
          // Thêm option "Tất cả" với ID = 0 vào đầu danh sách
          this.teams = [
            { ID: 0, Name: 'Tất cả' },
            ...(response.data || [])
          ];

          // Nếu có currentUser, kiểm tra LeaderID để tự động chọn team
          const employeeID = this.appUserService.employeeID;
          if (employeeID) {
            const leaderTeam = (response.data || []).find(
              (team: any) => team.LeaderID === employeeID
            );
            if (leaderTeam && leaderTeam.ID) {
              this.teamId = leaderTeam.ID;
              // Reload users theo team vừa chọn
              this.loadUsers();
            }
          }
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
    // Load users dựa trên teamId nếu có, ngược lại load theo departmentId
    const userTeamID = this.teamId > 0 ? this.teamId : undefined;
    const departmentid = this.departmentId > 0 ? this.departmentId : undefined;

    this.dailyReportTechService.getEmployees(userTeamID, departmentid).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const employees = Array.isArray(response.data) ? response.data : [];

          // Group employees by DepartmentName nếu có
          if (employees.length > 0 && employees[0].DepartmentName) {
            this.users = this.groupEmployeesByDepartment(employees);
          } else {
            // Nếu không có DepartmentName, tạo một group mặc định
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

        // Sau khi load users, tìm và set userId từ currentUser
        // Nếu không tìm thấy currentUser trong danh sách, tự động set về "Tất cả" (ID = 0)
        const currentUser = this.appUserService.currentUser;
        if (currentUser) {
          if (currentUser.ID && !this.appUserService.isAdmin && !USER_ALL_REPORT_TECH.includes(currentUser.ID)) {
            this.setUserIdFromEmployeeID(currentUser.ID);
          } else if (currentUser.EmployeeID && !this.appUserService.isAdmin && !USER_ALL_REPORT_TECH.includes(currentUser.EmployeeID)) {
            this.setUserIdFromEmployeeID(currentUser.EmployeeID);
          } else {
            // Nếu không có ID hoặc EmployeeID, set về "Tất cả"
            this.userId = 0;
          }
        } else {
          // Nếu không có currentUser, set về "Tất cả"
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
    // Tìm user trong danh sách users dựa trên EmployeeID, ID, hoặc UserID
    for (const group of this.users) {
      for (const option of group.options) {
        const item = option.item;
        if (item) {
          // Tìm theo UserID, ID, hoặc EmployeeID
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
    // Nếu không tìm thấy currentUser trong danh sách, set về "Tất cả" (ID = 0)
    this.userId = 0;
  }

  onDepartmentChange(): void {
    this.teamId = 0; // Reset teamId khi đổi department
    this.loadTeams();
    this.loadUsers(); // Reload users khi đổi department
  }

  onTeamChange(): void {
    this.loadUsers(); // Reload users khi đổi team
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
    this.getDailyReportTechData();
  }

  getDailyReportTechData(): void {
    const searchParams = this.getSearchParams();
    this.isLoading = true;

    this.dailyReportTechService.getDailyReportTech(searchParams).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.dailyReportTechData = Array.isArray(response.data) ? response.data : [];
        } else {
          this.dailyReportTechData = [];
        }

        if (this.tb_daily_report_tech) {
          this.tb_daily_report_tech.replaceData(this.dailyReportTechData);
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
        console.error('Lỗi khi lấy dữ liệu báo cáo kỹ thuật:', error);
        this.dailyReportTechData = [];
        if (this.tb_daily_report_tech) {
          this.tb_daily_report_tech.replaceData(this.dailyReportTechData);
        }
        this.isLoading = false;
      }
    });
  }

  setDefaultSearch(): void {
    this.dateStart = DateTime.local().minus({ days: 1 }).toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local().toFormat('yyyy-MM-dd');
    this.departmentId = 2;
    this.teamId = 0;
    this.userId = 0;
    this.keyword = '';
    this.loadTeams(); // Load lại teams khi reset (sẽ trigger loadUsers)
    this.searchDailyReports();
  }

  getSearchParams(): any {
    // dateStart và dateEnd giờ là string format yyyy-MM-dd từ native date input
    // Xử lý userID an toàn thông qua appUserService
    let userID = 0;
    const currentUser = this.appUserService.currentUser;
    if (currentUser) {
      if ((currentUser.IsLeader || 0) > 1 || this.appUserService.isAdmin || USER_ALL_REPORT_TECH.includes(currentUser.ID) || currentUser.Permissions?.includes('N1')) {
        userID = this.userId || 0;
      } else {
        userID = currentUser.ID || 0;
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

  drawTbDailyReportTech(container: HTMLElement): void {
    if (this.tb_daily_report_tech) {
      this.tb_daily_report_tech.setData(this.dailyReportTechData);
    } else {
      this.tb_daily_report_tech = new Tabulator(container, {
        data: this.dailyReportTechData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        rowHeader: false,
        selectableRows: 1,
        height: '87vh',
        paginationMode: 'local',
        columns: [
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
            width: 100,
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
            width: 100,
          },
          {
            title: 'Dự án',
            field: 'ProjectText',
            width: 200,
            formatter: 'textarea',
          },
          {
            title: 'Hạng mục',
            field: 'ProjectItemCode',
            width: 120,
          },
          {
            title: 'Tổng giờ',
            field: 'TotalHours',
            hozAlign: 'right',
            width: 60,
            headerSort: false,
          },
          {
            title: 'Giờ OT',
            field: 'TotalHourOT',
            hozAlign: 'right',
            width: 60,
            headerSort: false,
          },
          {
            title: '% Hoàn thành',
            field: 'PercentComplete',
            hozAlign: 'right',
            width: 55,
            headerSort: false,
            formatter: (cell: any) => {
              const value = cell.getValue() || 0;
              return `${value}%`;
            },
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
            title: 'Tên hạng mục',
            field: 'ProjectItemName',
            width: 200,
            formatter: 'textarea',
          },
          {
            title: 'Dự kiến',
            columns: [
              {
                title: 'Ngày bắt đầu',
                field: 'PlanStartDate',
                // formatter: (cell: any) => {
                //   const value = cell.getValue() || '';
                //   const dateTime = DateTime.fromISO(value);
                //   return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                // },
                hozAlign: 'center',
                width: 120,
              },
              {
                title: 'Tổng số ngày',
                field: 'TotalDayPlan',
                hozAlign: 'right',
                width: 100,
              },
              {
                title: 'Ngày kết thúc',
                field: 'PlanEndDate',
                // formatter: (cell: any) => {
                //   const value = cell.getValue() || '';
                //   const dateTime = DateTime.fromISO(value);
                //   return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                // },
                hozAlign: 'center',
                width: 120,
              },
            ],
          },
          {
            title: 'Thực tế',
            columns: [
              {
                title: 'Ngày bắt đầu',
                field: 'ActualStartDate',
                // formatter: (cell: any) => {
                //   const value = cell.getValue() || '';
                //   const dateTime = DateTime.fromISO(value);
                //   return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                // },
                hozAlign: 'center',
                width: 120,
              },
              {
                title: 'Tổng số ngày',
                field: 'TotalDayActual',
                hozAlign: 'right',
                width: 100,
              },
              {
                title: 'Ngày kết thúc',
                field: 'ActualEndDate',
                // formatter: (cell: any) => {
                //   const value = cell.getValue() || '';
                //   const dateTime = DateTime.fromISO(value);
                //   return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                // },
                hozAlign: 'center',
                width: 120,
              },
            ],
          },
        ],
      });
    }
  }

  // Header actions
  addDailyReport(): void {
    const modalRef = this.modalService.open(DailyReportTechDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-tech-modal'
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.currentUser = this.appUserService.currentUser;
    modalRef.componentInstance.projects = this.projects || [];
    modalRef.componentInstance.projectItems = []; // TODO: Load project items khi cần

    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        if (result) {
          // Reload data nếu cần
          this.getDailyReportTechData();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  editDailyReport(): void {
    const selectedRows = this.tb_daily_report_tech.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 báo cáo để sửa!');
      return;
    }

    const selectedRow = selectedRows[0] as any;
    // Lấy ID từ row (có thể là ID, DailyID, hoặc DailyReportTechnicalID)
    const dailyID = selectedRow['ID'];

    if (!dailyID) {
      this.notification.error('Thông báo', 'Không tìm thấy ID của báo cáo!');
      return;
    }

    const modalRef = this.modalService.open(DailyReportTechDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-tech-modal'
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.dataInput = dailyID; // Truyền ID để load dữ liệu
    modalRef.componentInstance.currentUser = this.appUserService.currentUser;
    modalRef.componentInstance.projects = this.projects || [];
    modalRef.componentInstance.projectItems = [];

    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        if (result) {
          // Reload dữ liệu sau khi sửa thành công
          this.getDailyReportTechData();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  deleteDailyReport(): void {
    const selectedRows = this.tb_daily_report_tech.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 báo cáo để xóa!');
      return;
    }

    const selectedRow = selectedRows[0] as any;
    // Lấy ID từ row (có thể là ID, DailyID, hoặc DailyReportTechnicalID)
    const dailyID = selectedRow['ID'];

    if (!dailyID) {
      this.notification.error('Thông báo', 'Không tìm thấy ID của báo cáo!');
      return;
    }

    // Xác nhận trước khi xóa bằng NzModal
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Gọi API xóa
        this.dailyReportTechService.deleteDailyReport(dailyID).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Đã xóa báo cáo thành công!');
              // Reload dữ liệu
              this.getDailyReportTechData();
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
    // Lấy dữ liệu để copy dựa trên filter hiện tại
    const searchParams = this.getSearchParams();

    // Tìm EmployeeID từ users dựa trên searchParams.userID (UserID từ dropdown)
    // Dropdown bind [nzValue]="child.item.UserID", nên searchParams.userID là UserID
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

    // Gọi API để lấy dữ liệu copy
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

    // Lấy danh sách ngày duy nhất
    const uniqueDates = [...new Set(result.map(item => item.DateReport))];

    // Chỉ copy khi có đúng 1 ngày (giống RTCWeb)
    if (uniqueDates.length === 1) {
      // Copy 1 ngày
      const contentSummary = this.formatSingleDayReport(result, uniqueDates[0]);
      // Copy vào clipboard
      this.copyToClipboard(contentSummary);
    } else {
      // Nếu có nhiều ngày, hiển thị cảnh báo
      this.notification.warning('Thông báo', `Bạn không thể copy nội dung của ${uniqueDates.length} ngày!`);
    }
  }

  private formatSingleDayReport(dayData: any[], dateReport: string): string {
    let project = '';
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
        // Tránh trùng lặp ProjectItemCode trong content (giống RTCWeb)
        if (item.ProjectItemCode && !content.includes(item.ProjectItemCode)) {
          content += (item.Mission || item.Content || '') + '\n';
        } else if (!item.ProjectItemCode) {
          // Nếu không có ProjectItemCode, thêm trực tiếp
          content += (item.Mission || item.Content || '') + '\n';
        }

        // Tránh trùng lặp ProjectCode trong project (giống RTCWeb)
        if (item.ProjectCode && !project.includes(item.ProjectCode)) {
          project += `${item.ProjectCode} - ${item.ProjectName || ''}\n`;
        }

        // Các field khác append trực tiếp (giống RTCWeb)
        if (item.Results) resultReport += item.Results + '\n';
        if (item.Backlog) backlog += item.Backlog + '\n';
        if (item.Problem) problem += item.Problem + '\n';
        if (item.ProblemSolve) problemSolve += item.ProblemSolve + '\n';
        if (item.Note) note += item.Note + '\n';
        if (item.PlanNextDay) planNextDay = item.PlanNextDay;
      }
    });

    // Format theo departmentId (nếu departmentId == 6 thì không hiển thị Mã dự án)
    // Lấy departmentId từ currentUser hoặc từ filter
    const departmentId = this.departmentId || this.appUserService.departmentID || 0;

    // Format giống RTCWeb
    if (departmentId !== 6) {
      contentSummary += `* Mã dự án - Tên dự án: \n${project.trim()}\n`;
    }

    contentSummary += `\n* Nội dung công việc:\n${content.trim()}\n`;
    contentSummary += `\n* Kết quả công việc:\n${resultReport.trim()}\n`;
    contentSummary += `\n* Tồn đọng:\n${backlog.trim() === '' ? '- Không có' : backlog.trim()}\n`;

    if (departmentId === 6) {
      contentSummary += `\n* Lý do tồn đọng:\n${note.trim() === '' ? '- Không có' : note.trim()}\n`;
    }

    contentSummary += `\n* Vấn đề phát sinh:\n${problem.trim() === '' ? '- Không có' : problem.trim()}\n`;
    contentSummary += `\n* Giải pháp cho vấn đề phát sinh:\n${problemSolve.trim() === '' ? '- Không có' : problemSolve.trim()}\n`;
    contentSummary += `\n* Kế hoạch ngày tiếp theo:\n${planNextDay.trim() === '' ? '- Không có' : planNextDay.trim()}\n`;

    return contentSummary;
  }

  private async copyToClipboard(text: string): Promise<void> {
    // Hàm fallback sử dụng execCommand
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
      // Thử sử dụng Clipboard API nếu có
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
        } catch (clipboardErr: any) {
          // Nếu Clipboard API fail (thường do document not focused), fallback sang execCommand
          if (clipboardErr.name === 'NotAllowedError' || clipboardErr.message?.includes('not focused')) {
            useExecCommand();
          } else {
            throw clipboardErr;
          }
        }
      } else {
        // Nếu không có Clipboard API, dùng execCommand
        useExecCommand();
      }
    } catch (err: any) {
      this.notification.error('Thông báo', 'Không thể copy vào clipboard. Vui lòng thử lại!');
    }
  }

  async exportReport(): Promise<void> {
    const table = this.tb_daily_report_tech;
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
    const worksheet = workbook.addWorksheet('Báo cáo kỹ thuật');

    // Lấy columns từ bảng
    const columns = table.getColumns();
    const columnDefinitions = columns.map((col: any) => col.getDefinition());

    // Lọc bỏ các columns không có field hoặc là nested columns (chỉ lấy columns cấp 1)
    const visibleColumns = columnDefinitions.filter((col: any) => {
      return col.field && col.visible !== false && !col.columns; // Loại bỏ nested columns
    });

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
              } else if (field.includes('Date')) {
                // Các trường date khác
                value = dateTime.toFormat('dd/MM/yyyy');
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
    link.download = `BaoCaoKyThuat_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success('Thông báo', `Xuất excel thành công!`);
  }

  async exportList(): Promise<void> {
    const table = this.tb_daily_report_tech;
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
    const worksheet = workbook.addWorksheet('Danh sách báo cáo kỹ thuật');

    // Lấy columns từ bảng
    const columns = table.getColumns();
    const columnDefinitions = columns.map((col: any) => col.getDefinition());

    // Lọc bỏ các columns không có field hoặc là nested columns (chỉ lấy columns cấp 1)
    const visibleColumns = columnDefinitions.filter((col: any) => {
      return col.field && col.visible !== false && !col.columns; // Loại bỏ nested columns
    });

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
              } else if (field.includes('Date')) {
                // Các trường date khác
                value = dateTime.toFormat('dd/MM/yyyy');
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
    link.download = `DanhSachBaoCaoKyThuat_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success('Thông báo', `Đã xuất ${data.length} bản ghi thành công!`);
  }
  async exportReportTeam(): Promise<void> {
    const modalRef = this.modalService.open(DailyReportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
    });
    modalRef.componentInstance.teams = this.teams;
    modalRef.componentInstance.currentUser = this.appUserService.currentUser;
    modalRef.componentInstance.selectedTeamId = this.teamId;
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.projectItems = [];
    modalRef.componentInstance.projectItems = [];
  }

  createdText(text: string): string {
    return `<span class="fs-12">${text}</span>`;
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
        label: 'Xuất báo cáo',
        icon: PrimeIcons.FILE_EXCEL,
        command: () => this.exportReportTeam(),
      },
      {
        label: 'Xuất danh sách',
        icon: PrimeIcons.FILE_EXCEL,
        command: () => this.exportList(),
      },
    ];
  }
}

