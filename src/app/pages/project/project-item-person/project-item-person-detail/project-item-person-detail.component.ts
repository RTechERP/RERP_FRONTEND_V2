import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectService } from '../../project-service/project.service';
import { WorkItemServiceService } from '../../work-item/work-item-service/work-item-service.service';
import { DateTime } from 'luxon';

// Interface cho tab hạng mục công việc
interface ProjectItemTab {
  id: number;
  TypeProjectItemID: number | null;
  Status: number;
  oldStatus: number; // Lưu trạng thái cũ để so sánh
  UserID: number | null;
  EmployeeIDRequest: number | null;
  Mission: string;
  PlanStartDate: Date | null;
  TotalDayPlan: number | null;
  PlanEndDate: Date | null;
  ActualStartDate: Date | null;
  ActualEndDate: Date | null;
  PercentItem: number | null;
  dateChangeStatus: Date | null; // Ngày thay đổi trạng thái
}

@Component({
  selector: 'app-project-item-person-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzInputNumberModule,
    NzIconModule,
    NzTabsModule,
    NzRadioModule,
    NzModalModule,
  ],
  templateUrl: './project-item-person-detail.component.html',
  styleUrl: './project-item-person-detail.component.css'
})
export class ProjectItemPersonDetailComponent implements OnInit {
  @Input() dataInput: any = null;

  formGroup!: FormGroup;
  saving: boolean = false;
  mode: 'add' | 'edit' = 'add';
  currentUser: any = null;

  // Dữ liệu cho combobox
  projects: any[] = [];
  employees: any[] = [];
  typeProjectItems: any[] = [];
  statusList: any[] = [
    { id: 0, name: 'Chưa làm' },
    { id: 1, name: 'Đang làm' },
    { id: 2, name: 'Hoàn thành' },
    { id: 3, name: 'Pending' },
  ];

  // Tabs management
  tabs: ProjectItemTab[] = [];
  selectedTabIndex: number = 0;
  private tabIdCounter: number = 1;

  // Work location
  workLocation: number = 1; // 1 = VP RTC, 0 = Địa điểm khác
  workLocationText: string = '';

  // Date change status modal
  isDateChangeModalVisible: boolean = false;
  tempDateChangeStatus: Date | null = new Date();
  currentTabForStatusChange: ProjectItemTab | null = null;
  previousStatusBeforeChange: number = 0;

  // Formatter cho %
  percentFormatter = (value: number): string => `${value}%`;
  percentParser = (value: string): number => Number(value.replace('%', '')) || 0;

  // Status đặc biệt cần auto fill ActualEndDate
  readonly STATUS_COMPLETED = 2; // Hoàn thành
  readonly STATUS_MAINTENANCE = 6;
  readonly STATUS_FINISHED = 9;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private workItemService: WorkItemServiceService,
    private notification: NzNotificationService,
    private modalService: NzModalService,
    public activeModal: NgbActiveModal,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.mode = this.dataInput ? 'edit' : 'add';
    this.initForm();
    this.getCurrentUser();
    this.loadProjects();
    this.loadEmployees();
    this.loadTypeProjectItems();

    // Khởi tạo tab đầu tiên
    if (!this.dataInput) {
      this.addTab();
    } else if (this.dataInput.ID) {
      // Nếu có ID, gọi API để lấy dữ liệu mới nhất
      this.loadDataById(this.dataInput.ID);
    }
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUser = data;

          // Cập nhật người phụ trách cho tất cả tabs
          this.tabs.forEach(tab => {
            if (!tab.UserID) {
              tab.UserID = data.ID || null;
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin user:', error);
      }
    });
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      ID: [0],
      ProjectID: [null, [Validators.required]],
    });
  }

  loadDataById(id: number): void {
    this.saving = true;
    // TODO: Implement API call to get project item by ID
    this.saving = false;
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data || [];
        console.log('Projects loaded:', this.projects.length, 'items');
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.projects = [];
      }
    });
  }

  loadEmployees(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = response.data || [];
        console.log('Employees loaded:', this.employees.length, 'items');
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.employees = [];
      }
    });
  }

  loadTypeProjectItems(): void {
    this.workItemService.cbbTypeProject().subscribe({
      next: (response: any) => {
        this.typeProjectItems = response.data || [];
        console.log('Type project items loaded:', this.typeProjectItems.length, 'items');
      },
      error: (error: any) => {
        console.error('Error loading type project items:', error);
        this.typeProjectItems = [];
      }
    });
  }

  // Tab management methods
  addTab(): void {
    const newTab: ProjectItemTab = {
      id: this.tabIdCounter++,
      TypeProjectItemID: null,
      Status: 0, // Mặc định: Chưa làm
      oldStatus: 0, // Lưu trạng thái ban đầu
      UserID: this.currentUser?.ID || null,
      EmployeeIDRequest: null,
      Mission: '',
      PlanStartDate: null,
      TotalDayPlan: null,
      PlanEndDate: null,
      ActualStartDate: null,
      ActualEndDate: null,
      PercentItem: 0,
      dateChangeStatus: null,
    };
    this.tabs.push(newTab);
    this.selectedTabIndex = this.tabs.length - 1;
  }

  closeTab({ index }: { index: number }): void {
    if (this.tabs.length > 1) {
      this.tabs.splice(index, 1);
      if (this.selectedTabIndex >= this.tabs.length) {
        this.selectedTabIndex = this.tabs.length - 1;
      }
    }
  }

  // Date calculation methods
  onPlanStartDateChange(tab: ProjectItemTab): void {
    if (tab.PlanStartDate && tab.TotalDayPlan && tab.TotalDayPlan > 0) {
      const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
      tab.PlanEndDate = startDate.plus({ days: tab.TotalDayPlan }).toJSDate();
    }
  }

  onTotalDayPlanChange(tab: ProjectItemTab): void {
    if (tab.PlanStartDate && tab.TotalDayPlan && tab.TotalDayPlan > 0) {
      const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
      tab.PlanEndDate = startDate.plus({ days: tab.TotalDayPlan }).toJSDate();
    }
  }

  onPlanEndDateChange(tab: ProjectItemTab): void {
    if (tab.PlanStartDate && tab.PlanEndDate) {
      const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
      const endDate = DateTime.fromJSDate(new Date(tab.PlanEndDate));
      const diff = endDate.diff(startDate, 'days').days;
      tab.TotalDayPlan = Math.max(0, Math.round(diff));
    }
  }

  // Xử lý khi thay đổi trạng thái
  onStatusChange(tab: ProjectItemTab, newStatus: number): void {
    this.beginStatusChange(tab, newStatus);
  }

  private beginStatusChange(tab: ProjectItemTab, newStatus: number): void {
    if (tab.Status === newStatus) {
      return;
    }

    const previousStatus = tab.Status;
    tab.Status = newStatus;

    if (this.isSkipDatePopupTransition(previousStatus, newStatus)) {
      this.commitStatusChange(tab, new Date());
      return;
    }

    this.showDateChangeStatusModal(tab, previousStatus);
  }

  private isSkipDatePopupTransition(oldStatus: number, newStatus: number): boolean {
    return (
      (oldStatus === this.STATUS_MAINTENANCE && newStatus === this.STATUS_FINISHED) ||
      (oldStatus === this.STATUS_FINISHED && newStatus === this.STATUS_MAINTENANCE)
    );
  }

  private isAutoFillActualEndDateStatus(status: number): boolean {
    return status === this.STATUS_COMPLETED || status === this.STATUS_MAINTENANCE || status === this.STATUS_FINISHED;
  }

  private commitStatusChange(tab: ProjectItemTab, dateChangeStatus: Date): void {
    tab.dateChangeStatus = dateChangeStatus;

    if (this.isAutoFillActualEndDateStatus(tab.Status)) {
      this.checkAndAutoFillActualEndDate(tab, dateChangeStatus);
    }
  }

  private cancelStatusChange(tab: ProjectItemTab): void {
    tab.Status = this.previousStatusBeforeChange;
    tab.dateChangeStatus = null;
  }

  // Hiển thị popup chọn ngày thay đổi trạng thái
  private showDateChangeStatusModal(tab: ProjectItemTab, previousStatus: number): void {
    this.currentTabForStatusChange = tab;
    this.previousStatusBeforeChange = previousStatus;
    this.tempDateChangeStatus = new Date();
    this.isDateChangeModalVisible = true;
  }

  // Xác nhận thay đổi trạng thái
  handleDateChangeStatusOk(): void {
    if (!this.tempDateChangeStatus) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày thay đổi trạng thái!');
      return;
    }

    if (this.currentTabForStatusChange) {
      this.commitStatusChange(this.currentTabForStatusChange, this.tempDateChangeStatus);
    }

    this.isDateChangeModalVisible = false;
    this.currentTabForStatusChange = null;
  }

  // Hủy thay đổi trạng thái
  handleDateChangeStatusCancel(): void {
    // Reset về trạng thái cũ khi hủy
    if (this.currentTabForStatusChange) {
      this.cancelStatusChange(this.currentTabForStatusChange);
    }

    this.isDateChangeModalVisible = false;
    this.currentTabForStatusChange = null;
  }

  // Kiểm tra và auto fill ActualEndDate khi status = Hoàn thành
  private checkAndAutoFillActualEndDate(tab: ProjectItemTab, dateChangeStatus: Date): void {
    const projectId = this.formGroup.get('ProjectID')?.value;
    
    if (!projectId) {
      // Nếu chưa chọn dự án, auto fill trực tiếp
      if (!tab.ActualEndDate) {
        tab.ActualEndDate = dateChangeStatus;
      }
      return;
    }

    // Gọi API kiểm tra FollowProjectBase
    this.projectService.getFollowProjectBases(projectId).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response?.data) ? response.data[0] : response?.data;
        const realityEnd = data?.RealityProjectEndDate;

        // Chỉ auto fill nếu FE đang chưa có ActualEndDate
        if (!tab.ActualEndDate && !realityEnd) {
          tab.ActualEndDate = dateChangeStatus;
        }
      },
      error: (error: any) => {
        console.error('Error checking FollowProjectBase:', error);
        // Nếu lỗi API, vẫn auto fill nếu chưa có
        if (!tab.ActualEndDate) {
          tab.ActualEndDate = dateChangeStatus;
        }
      }
    });
  }

  saveData(): void {
    // Mark all fields as dirty and touched to show validation errors
    Object.values(this.formGroup.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });

    // Validate tabs
    let isValid = this.formGroup.valid;
    for (const tab of this.tabs) {
      if (!tab.TypeProjectItemID || !tab.EmployeeIDRequest || !tab.PlanStartDate || !tab.PlanEndDate) {
        isValid = false;
        break;
      }
      // Kiểm tra: nếu status thay đổi nhưng chưa chọn ngày thay đổi
      if (tab.Status !== tab.oldStatus && !tab.dateChangeStatus) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày thay đổi trạng thái!');
        this.showDateChangeStatusModal(tab, tab.oldStatus);
        return;
      }
    }

    if (isValid) {
      this.saving = true;
      const formValue = this.formGroup.value;

      // Chuẩn bị dữ liệu để lưu
      const dataToSave = this.tabs.map(tab => ({
        ProjectID: formValue.ProjectID,
        TypeProjectItemID: tab.TypeProjectItemID,
        Status: tab.Status,
        OldStatus: tab.oldStatus,
        UserID: tab.UserID,
        EmployeeIDRequest: tab.EmployeeIDRequest,
        Mission: tab.Mission || '',
        PlanStartDate: tab.PlanStartDate ? DateTime.fromJSDate(new Date(tab.PlanStartDate)).toISO() : null,
        TotalDayPlan: tab.TotalDayPlan || 0,
        PlanEndDate: tab.PlanEndDate ? DateTime.fromJSDate(new Date(tab.PlanEndDate)).toISO() : null,
        ActualStartDate: tab.ActualStartDate ? DateTime.fromJSDate(new Date(tab.ActualStartDate)).toISO() : null,
        ActualEndDate: tab.ActualEndDate ? DateTime.fromJSDate(new Date(tab.ActualEndDate)).toISO() : null,
        PercentItem: tab.PercentItem || 0,
        // Thêm thông tin thay đổi trạng thái
        DateChangeStatus: tab.dateChangeStatus ? DateTime.fromJSDate(new Date(tab.dateChangeStatus)).toISO() : null,
        IsStatusChanged: tab.Status !== tab.oldStatus,
      }));

      console.log('Data to save:', dataToSave);

      // TODO: Implement API call to save data
      this.workItemService.saveData(dataToSave).subscribe({
        next: (response: any) => {
          if (response && response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
            this.saving = false;
            this.activeModal.close(true);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi không xác định');
            this.saving = false;
          }
        },
        error: (error: any) => {
          const msg = error.error?.message || error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          this.saving = false;
        }
      });
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }

  onWorkLocationChange(value: number): void {
    this.workLocation = value;
    if (value === 1) {
      this.workLocationText = ''; // Reset text khi chọn VP RTC
    }
  }
}
