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
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
import { DailyReportLxDetailComponent } from './daily-report-lx-detail/daily-report-lx-detail.component';
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
    NzSplitterModule,
    NzNotificationModule,
    NzModalModule,
    NzDropDownModule,
    Menubar,
  ],
  templateUrl: './daily-report-lxcp.component.html',
  styleUrl: './daily-report-lxcp.component.css'
})
export class DailyReportLXCPComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_daily_report_hr', { static: false })
  tb_daily_report_hrContainer!: ElementRef;

  private searchSubject = new Subject<string>();

  // Search panel state
  sizeSearch: string = '22%';
  showSearchBar: boolean = true; // Mặc định ẩn, sẽ được set trong ngOnInit
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];

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
    // Không vẽ bảng ở đây, đợi currentUser load xong mới vẽ
    // Bảng sẽ được vẽ trong getCurrentUser() sau khi có dữ liệu user
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.loadUsers(() => {
          // Set userId sau khi users đã load xong
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
        });
      }


      // Sau khi có currentUser (hoặc không có), vẽ bảng và load data
      if (this.tb_daily_report_hrContainer?.nativeElement) {
        this.drawTbDailyReportHr(this.tb_daily_report_hrContainer.nativeElement);
        this.getDailyReportHrData();
      }
    });
  }

  loadUsers(callback?: () => void): void {
    const userTeamID = this.teamId > 0 ? this.teamId : 0;
    const departmentid = this.departmentId > 0 ? this.departmentId : 0;

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

    this.dailyReportTechService.getDailyReportLXCP(searchParams).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.dailyReportHrData = Array.isArray(response.data.hrAll) ? response.data.hrAll : [];
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
    this.userId = 0;
    this.keyword = '';
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
      //userID: this.currentUser.EmployeeID || 0,
      employeeID: this.currentUser.EmployeeID || 0,
      keyword: this.keyword.trim() || '',
    };
  }

  drawTbDailyReportHr(container: HTMLElement): void {
    // Xác định columns dựa trên PositionID của currentUser
    // PositionID == 6: Lái xe -> dùng DAILY_REPORT_LX_COLUMNS
    // Ngược lại: Cắt phim -> dùng DAILY_REPORT_CP_COLUMNS
    const columns = this.currentUser?.PositionID == 6
      ? this.DAILY_REPORT_LX_COLUMNS
      : this.DAILY_REPORT_CP_COLUMNS;

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
        columns: columns,
      });
    }
  }
  //#region columns cho báo cáo lái xe
  private readonly DAILY_REPORT_LX_COLUMNS: any[] = [
    {
      title: 'Họ tên',
      field: 'FullName',
      width: 150,
      formatter: 'textarea',
    },
    {
      title: 'Ngày báo cáo',
      field: 'DateReport',
      hozAlign: 'center',
      width: 120,
      formatter: (cell: any) => {
        const value = cell.getValue() || '';
        const dateTime = DateTime.fromISO(value);
        return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
      },
    },
    {
      title: 'Số Km',
      field: 'KmNumber',
      width: 100,
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'right',
    },
    {
      title: 'Số cuốc muộn so với Lịch',
      field: 'TotalLate',
      width: 120,
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'right',
    },
    {
      title: 'Số phút muộn',
      field: 'TotalTimeLate',
      width: 100,
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'right',
    },
    {
      title: 'Lý do muộn',
      field: 'ReasonLate',
      width: 200,
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'left',
    },
    {
      title: 'Tình trạng xe',
      field: 'StatusVehicle',
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'left',
    },
    {
      title: 'Kiến nghị / Đề xuất',
      field: 'Propose',
      formatter: 'textarea',
      headerHozAlign: 'center',
      hozAlign: 'left',
    },
  ];
  //#endregion

  //#region columns cho báo cáo cắt phim
  private readonly DAILY_REPORT_CP_COLUMNS: any[] = [
    {
      title: 'Họ tên',
      field: 'FullName',
      width: 150,
      formatter: 'textarea',
    },
    {
      title: 'Ngày báo cáo',
      field: 'DateReport',
      hozAlign: 'center',
      width: 120,
      formatter: (cell: any) => {
        const value = cell.getValue() || '';
        const dateTime = DateTime.fromISO(value);
        return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
      },
    },
    {
      title: 'Đầu mục',
      field: 'FilmName',
      width: 200,
      hozAlign: 'left',
      formatter: 'textarea',
    },
    {
      title: 'Nội dung công việc',
      field: 'WorkContent',
      width: 300,
      formatter: 'textarea',
    },
    {
      title: 'DVT',
      field: 'UnitName',
      hozAlign: 'center',
      formatter: 'textarea',
    },
    {
      title: 'Năng suất trung bình(phút/đơn vị sản phẩm)',
      field: 'PerformanceAVG',
      width: 150,
      hozAlign: 'right',
      formatter: 'textarea',
    },
    {
      title: 'Kết quả thực hiện',
      field: 'Quantity',
      hozAlign: 'left',
      formatter: 'textarea',
    },
    {
      title: 'Thời gian thực hiện(Phút)',
      field: 'TimeActual',
      width: 150,
      hozAlign: 'right',
      formatter: 'textarea',
    },
    {
      title: 'Năng suất thực tế (Phút) / Đơn vị sản phẩm)',
      field: 'PerformanceActual',
      width: 150,
      formatter: 'textarea',
      hozAlign: 'right',
    },
    {
      title: 'Năng suất trung bình / Năng suất thực tế',
      field: 'Percentage',
      width: 150,
      hozAlign: 'right',
      formatter: 'textarea',
    },
  ];

  //#endregion

  editDailyReportById(id: number): void {
    const modalRef = this.modalService.open(DailyReportLxDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'daily-report-lxcp-modal'
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
        const employeeID = this.currentUser?.EmployeeID || 0;
        const deleteReport = {
          ID: id,
          EmployeeID: employeeID,
          IsDeleted: true,
        };

        this.dailyReportTechService.saveReportHr([deleteReport]).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Xóa báo cáo thành công!');
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
    console.log('[LXCP] addDailyReport called on mobile:', this.isMobile);
    console.log('[LXCP] Opening modal with currentUser:', this.currentUser);

    const modalRef = this.modalService.open(DailyReportLxDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: true, // Changed to true for better mobile compatibility
      windowClass: 'daily-report-lxcp-modal',
      scrollable: true // Added for mobile scrolling
    });

    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.currentUser = this.currentUser;

    console.log('[LXCP] Modal opened, ref:', modalRef);

    modalRef.result.then(
      (result) => {
        console.log('[LXCP] Modal closed with result:', result);
        if (result) {
          this.getDailyReportHrData();
        }
      },
      (reason) => {
        console.log('[LXCP] Modal dismissed, reason:', reason);
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  editDailyReport(): void {
    console.log('[LXCP] editDailyReport called');
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

    const modalRef = this.modalService.open(DailyReportLxDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: true, // Changed to true for better mobile compatibility
      windowClass: 'daily-report-lxcp-modal',
      scrollable: true // Added for mobile scrolling
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
        const employeeID = this.currentUser?.EmployeeID || 0;
        const deleteReport = {
          ID: dailyID,
          EmployeeID: employeeID,
          IsDeleted: true,
        };

        this.dailyReportTechService.saveReportHr([deleteReport]).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Xóa báo cáo thành công!');
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
    ];
  }
}
