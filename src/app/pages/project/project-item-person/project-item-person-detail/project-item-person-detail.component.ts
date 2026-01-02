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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectService } from '../../project-service/project.service';
import { WorkItemServiceService } from '../../work-item/work-item-service/work-item-service.service';
import { DateTime } from 'luxon';
import { ProjectItemProblemComponent } from '../../work-item/work-item-form/project-item-problem/project-item-problem.component';
import { ProjectItemPersonService } from '../project-item-person-service/project-item-person.service';

// Interface cho tab hạng mục công việc
interface ProjectItemTab {
  id: number;
  TypeProjectItemID: number | null;
  Status: number;
  oldStatus: number; // Lưu trạng thái cũ để so sánh
  UserID: number | null;
  EmployeeIDRequest: number | null;
  ParentID: number | null; // ID hạng mục cha
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
  employeesRequest: any[] = [];
  typeProjectItems: any[] = [];
  ParentList: any[] = []; // Danh sách hạng mục cha
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

  defaultEmployeeRequestId: number = 0;
  editingItemId: number = 0; // ID của item đang edit
  private previousProjectID: number | null = null; // Lưu ProjectID trước đó để so sánh

  additionalInfo: {
    Problem: string;
    Note: string;
    UpdateDate: Date | null;
    CreatedBy: number | null;
  } = {
    Problem: '',
    Note: '',
    UpdateDate: null,
    CreatedBy: null,
  };

  activeAccordion: Record<string, boolean> = {
    additional_info: true,
  };

  // Date change status modal
  isDateChangeModalVisible: boolean = false;
  tempDateChangeStatus: Date | null = new Date();
  currentTabForStatusChange: ProjectItemTab | null = null;
  previousStatusBeforeChange: number = 0;

  // Formatter cho %
  percentFormatter = (value: number): string => `${value}%`;
  percentParser = (value: string): number => Number(value.replace('%', '')) || 0;

  // Status constants
  readonly STATUS_NOT_STARTED = 0; // Chưa làm
  readonly STATUS_IN_PROGRESS = 1; // Đang làm
  readonly STATUS_COMPLETED = 2;   // Hoàn thành
  readonly STATUS_PENDING = 3;     // Pending
  readonly STATUS_MAINTENANCE = 6;
  readonly STATUS_FINISHED = 9;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private projectItemPersonService : ProjectItemPersonService,
    private workItemService: WorkItemServiceService,
    private notification: NzNotificationService,
    private ngbModalService: NgbModal,
    public activeModal: NgbActiveModal,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.mode = this.dataInput ? 'edit' : 'add';
    this.initForm();
    this.getCurrentUser();
    this.loadProjects();
    this.loadEmployees();
    this.loadEmployeesRequest();
    this.loadTypeProjectItems();

    // Khởi tạo tab đầu tiên
    if (!this.dataInput) {
      this.addTab();
    } else if (this.dataInput.ID) {
      // Nếu có ID, gọi API để lấy dữ liệu mới nhất
      this.loadDataById(this.dataInput.ID);
    }
  }

  toggleAccordion(key: string): void {
    this.activeAccordion[key] = !this.activeAccordion[key];
  }

  openProjectItemProblemDetail(projectItemId: number | null | undefined): void {
    const id = Number(projectItemId || 0);
    if (!id || id <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ xem/nhập phát sinh khi đã có bản ghi!');
      return;
    }

    const modalRef = this.ngbModalService.open(ProjectItemProblemComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    modalRef.componentInstance.projectItemId = id;

    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          if (result.contentProblem !== undefined) {
            this.additionalInfo.Problem = result.contentProblem;
          }
        }
      })
      .catch((error: any) => {
        console.error('Error opening project item problem detail:', error);
      });
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUser = data;

          const defaultResponsibleEmployeeId =
            data?.ID ?? null;

          // Cập nhật người phụ trách cho tất cả tabs
          this.tabs.forEach(tab => {
            if (!tab.UserID) {
              tab.UserID = defaultResponsibleEmployeeId;
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

    // Lắng nghe thay đổi ProjectID để load danh sách hạng mục cha
    this.formGroup.get('ProjectID')?.valueChanges.subscribe((projectID: number) => {
      // Chỉ xử lý khi ProjectID thực sự thay đổi
      if (this.previousProjectID !== projectID) {
        this.previousProjectID = projectID;
        
        if (projectID && projectID > 0) {
          this.loadParentList(projectID);
          // Clear ParentID của tất cả các tab khi đổi dự án
          this.tabs.forEach(tab => {
            tab.ParentID = null;
          });
        } else {
          this.ParentList = [];
          this.tabs.forEach(tab => {
            tab.ParentID = null;
          });
        }
      } else if (projectID && projectID > 0) {
        // Load lại ParentList nếu ProjectID không đổi (trường hợp load data by ID)
        this.loadParentList(projectID);
      }
    });
  }

  loadParentList(projectID: number): void {
    this.projectItemPersonService.getProjectItemParent(projectID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.ParentList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.ParentList = [];
        }
      },
      error: (error: any) => {
        this.ParentList = [];
      }
    });
  }

  loadDataById(id: number): void {
    this.saving = true;
    this.projectItemPersonService.getById(id).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          
          // Set previousProjectID trước để tránh trigger valueChanges không cần thiết
          this.previousProjectID = data.ProjectID || null;
          
          // Set ProjectID vào form
          this.formGroup.patchValue({
            ID: data.ID,
            ProjectID: data.ProjectID,
          });

          // Load danh sách hạng mục cha khi đã có ProjectID
          if (data.ProjectID) {
            this.loadParentList(data.ProjectID);
          }

          // Tạo tab từ dữ liệu API
          const editTab: ProjectItemTab = {
            id: this.tabIdCounter++,
            TypeProjectItemID: data.TypeProjectItem || null,
            Status: data.Status ?? 0,
            oldStatus: data.Status ?? 0,
            UserID: data.UserID || null,
            EmployeeIDRequest: data.EmployeeIDRequest || null,
            ParentID: data.ParentID || null,
            Mission: data.Mission || '',
            PlanStartDate: data.PlanStartDate ? new Date(data.PlanStartDate) : null,
            TotalDayPlan: data.TotalDayPlan || null,
            PlanEndDate: data.PlanEndDate ? new Date(data.PlanEndDate) : null,
            ActualStartDate: data.ActualStartDate ? new Date(data.ActualStartDate) : null,
            ActualEndDate: data.ActualEndDate ? new Date(data.ActualEndDate) : null,
            PercentItem: data.PercentageActual ?? 0,
            dateChangeStatus: null,
          };
          this.tabs = [editTab];
          this.selectedTabIndex = 0;

          // Load thông tin khác
          this.additionalInfo = {
            Problem: data.ReasonLate || '',
            Note: data.Note || '',
            UpdateDate: data.UpdatedDate ? new Date(data.UpdatedDate) : null,
            CreatedBy: data.CreatedBy || null,
          };

          // Lưu ID của item đang edit
          this.editingItemId = data.ID;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error: any) => {
        this.saving = false;
        console.error('Error loading data by ID:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
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
  loadEmployeesRequest(): void {
    this.projectItemPersonService.cbbEmployeeRequest().subscribe({
      next: (response: any) => {
        this.employeesRequest = response?.data?.rows || [];
        this.defaultEmployeeRequestId = Number(response?.data?.employeeRequest || 0);

        if (this.defaultEmployeeRequestId > 0) {
          this.tabs.forEach(tab => {
            if (!tab.EmployeeIDRequest || tab.EmployeeIDRequest === 0) {
              tab.EmployeeIDRequest = this.defaultEmployeeRequestId;
            }
          });
        }

        console.log('EmployeesRequest loaded:', this.employeesRequest.length, 'items');
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.employeesRequest = [];
        this.defaultEmployeeRequestId = 0;
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
      UserID: this.currentUser?.EmployeeID ?? this.currentUser?.EmployeeId ?? this.currentUser?.ID ?? null,
      EmployeeIDRequest: null,
      ParentID: null, // Mặc định không chọn hạng mục cha
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
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phải có ít nhất 1 hạng mục!');
    }
  }

  // Date calculation methods
onPlanStartDateChange(tab: ProjectItemTab): void {
  if (tab.PlanStartDate && tab.TotalDayPlan && tab.TotalDayPlan > 0) {
    const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
    // Trừ 1 vì ngày bắt đầu đã tính là ngày thứ 1
    tab.PlanEndDate = startDate.plus({ days: tab.TotalDayPlan - 1 }).toJSDate();
  }
}

onTotalDayPlanChange(tab: ProjectItemTab): void {
  if (tab.PlanStartDate && tab.TotalDayPlan && tab.TotalDayPlan > 0) {
    const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
    // Trừ 1 vì ngày bắt đầu đã tính là ngày thứ 1
    tab.PlanEndDate = startDate.plus({ days: tab.TotalDayPlan - 1 }).toJSDate();
  }
}

onPlanEndDateChange(tab: ProjectItemTab): void {
  if (tab.PlanStartDate && tab.PlanEndDate) {
    const startDate = DateTime.fromJSDate(new Date(tab.PlanStartDate));
    const endDate = DateTime.fromJSDate(new Date(tab.PlanEndDate));
    const diff = endDate.diff(startDate, 'days').days;
    // Cộng 1 vì cả ngày bắt đầu và ngày kết thúc đều được tính
    tab.TotalDayPlan = Math.max(1, Math.round(diff) + 1);
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

    // Không show modal chọn ngày khi đổi trạng thái.
    // Chỉ khi status = Hoàn thành thì tự set ngày.
    this.commitStatusChange(tab, new Date());
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

    // Đang làm → fill ActualStartDate = hôm nay (nếu chưa có)
    if (tab.Status === this.STATUS_IN_PROGRESS) {
      if (!tab.ActualStartDate) {
        tab.ActualStartDate = dateChangeStatus;
      }
      // Reset % về 0 khi chuyển sang trạng thái Đang làm
      tab.PercentItem = 0;
      return;
    }

    // Hoàn thành → fill ActualEndDate = hôm nay, % = 100
    if (tab.Status === this.STATUS_COMPLETED) {
      if (!tab.ActualEndDate) {
        tab.ActualEndDate = dateChangeStatus;
      }
      tab.PercentItem = 100;
      return;
    }

    // Status khác (Chưa làm, Pending, ...) → reset dates và % về 0
    tab.ActualStartDate = null;
    tab.ActualEndDate = null;
    tab.PercentItem = 0;
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

    // Validate formGroup (ProjectID)
    if (!this.formGroup.valid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dự án!');
      return;
    }

    const formValue = this.formGroup.value;
    const projectId = formValue.ProjectID;

    // Validate từng tab theo yêu cầu backend
    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const tabName = `Hạng mục ${i + 1}`;

      if (!tab.TypeProjectItemID || tab.TypeProjectItemID <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng chọn kiểu hạng mục!`);
        this.selectedTabIndex = i;
        return;
      }
      if (!tab.EmployeeIDRequest || tab.EmployeeIDRequest <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng chọn người giao việc!`);
        this.selectedTabIndex = i;
        return;
      }
      if (!tab.Mission || tab.Mission.trim() === '') {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng nhập công việc!`);
        this.selectedTabIndex = i;
        return;
      }
      if (!tab.UserID || tab.UserID <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng chọn người phụ trách!`);
        this.selectedTabIndex = i;
        return;
      }
      if (!tab.PlanStartDate) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng nhập ngày bắt đầu!`);
        this.selectedTabIndex = i;
        return;
      }
      if (!tab.PlanEndDate) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng nhập ngày kết thúc!`);
        this.selectedTabIndex = i;
        return;
      }
      // Validate thực tế nếu status = 2 (Hoàn thành)
      if (tab.Status === 2) {
        if (!tab.ActualEndDate) {
          this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Vui lòng nhập ngày kết thúc thực tế!`);
          this.selectedTabIndex = i;
          return;
        }
        if (tab.ActualStartDate && tab.ActualEndDate) {
          const start = DateTime.fromJSDate(new Date(tab.ActualStartDate));
          const end = DateTime.fromJSDate(new Date(tab.ActualEndDate));
          if (start > end) {
            this.notification.warning(NOTIFICATION_TITLE.warning, `${tabName}: Ngày kết thúc thực tế phải lớn hơn ngày bắt đầu thực tế!`);
            this.selectedTabIndex = i;
            return;
          }
        }
      }
    }

    // Tất cả validate passed, bắt đầu lưu
    this.saving = true;

    // Gọi API lấy code cho từng tab (chạy tuần tự)
    this.generateCodesAndSave(projectId);
  }

  private async generateCodesAndSave(projectId: number): Promise<void> {
    try {
      const projectItems: any[] = [];
      const isEditMode = this.mode === 'edit' && this.editingItemId > 0;

      for (const tab of this.tabs) {
        // Chỉ gọi API lấy code mới khi thêm mới (không phải edit)
        let code = '';
        if (!isEditMode) {
          try {
            const response: any = await this.projectItemPersonService.getProjectItemCode(projectId).toPromise();
            if (response && response.status === 1 && response.data) {
              code = response.data;
            }
          } catch (err) {
            console.error('Error getting project item code:', err);
          }
        }

        // Xử lý ParentID: chuyển sang number và kiểm tra
        let parentID = 0;
        if (tab.ParentID !== null && tab.ParentID !== undefined) {
          const parentIdValue = tab.ParentID;
          const parentIdNum = typeof parentIdValue === 'string' ? parseInt(parentIdValue, 10) : Number(parentIdValue);
          if (!isNaN(parentIdNum) && parentIdNum > 0) {
            parentID = parentIdNum;
          }
        }

        // Map tab sang format ProjectItem entity
        const projectItem = {
          ID: isEditMode ? this.editingItemId : 0, // Nếu edit thì gửi ID, nếu add thì gửi 0
          Status: tab.Status ?? 0,
          STT: null,
          UserID: tab.UserID ?? 0,
          ProjectID: projectId,
          Mission: tab.Mission || '',
          PlanStartDate: tab.PlanStartDate ? DateTime.fromJSDate(new Date(tab.PlanStartDate)).toISO() : null,
          PlanEndDate: tab.PlanEndDate ? DateTime.fromJSDate(new Date(tab.PlanEndDate)).toISO() : null,
          ActualStartDate: tab.ActualStartDate ? DateTime.fromJSDate(new Date(tab.ActualStartDate)).toISO() : null,
          ActualEndDate: tab.ActualEndDate ? DateTime.fromJSDate(new Date(tab.ActualEndDate)).toISO() : null,
          Note: this.additionalInfo.Note || '',
          TotalDayPlan: tab.TotalDayPlan ?? 0,
          PercentItem: tab.PercentItem ?? 0,
          ParentID: parentID, // Gửi giá trị đã xử lý
          TotalDayActual: 0,
          ItemLate: 0,
          TimeSpan: 0,
          TypeProjectItem: tab.TypeProjectItemID ?? 0,
          PercentageActual: 0,
          EmployeeIDRequest: tab.EmployeeIDRequest ?? 0,
          UpdatedDateActual: tab.ActualEndDate ? DateTime.fromJSDate(new Date(tab.ActualEndDate)).toISO() : null,
          IsApproved: 0,
          Code: code,
          CreatedDate: null,
          CreatedBy: null,
          UpdatedDate: this.additionalInfo.UpdateDate ? DateTime.fromJSDate(new Date(this.additionalInfo.UpdateDate)).toISO() : null,
          UpdatedBy: null,
          IsUpdateLate: false,
          ReasonLate: this.additionalInfo.Problem || '',
          UpdatedDateReasonLate: null,
          IsApprovedLate: false,
          EmployeeRequestID: 0,
          EmployeeRequestName: null,
          IsDeleted: false,
          Location: this.workLocation === 1 ? 'VP RTC' : this.workLocationText,
        };

        projectItems.push(projectItem);
      }

      // Tạo payload theo format ProjectItemFullDTO
      const payload = {
        projectItems: projectItems,
        projectItemProblem: null,
        ProjectItemFile: null,
      };

      console.log('Payload to save:', payload);

      // Gọi API lưu
      this.projectItemPersonService.saveData(payload).subscribe({
        next: (response: any) => {
          this.saving = false;
          if (response && response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
            this.activeModal.close(true);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi không xác định');
          }
        },
        error: (error: any) => {
          this.saving = false;
          const msg = error.error?.message || error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
        }
      });
    } catch (error: any) {
      this.saving = false;
      console.error('Error in generateCodesAndSave:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu!');
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

  // Khi nhập ngày bắt đầu thực tế → tự chuyển status sang Đang làm
  onActualStartDateChange(tab: ProjectItemTab): void {
    if (tab.ActualStartDate && tab.Status !== this.STATUS_IN_PROGRESS && tab.Status !== this.STATUS_COMPLETED) {
      tab.Status = this.STATUS_IN_PROGRESS;
    }
  }

  // Khi nhập ngày kết thúc thực tế → tự chuyển status sang Hoàn thành, % = 100
  onActualEndDateChange(tab: ProjectItemTab): void {
    if (tab.ActualEndDate) {
      tab.Status = this.STATUS_COMPLETED;
      tab.PercentItem = 100;
    }
  }

  // Xử lý khi thay đổi ParentID
  onParentIDChange(tab: ProjectItemTab, value: any): void {
    if (value !== null && value !== undefined) {
      const parentIdNum = typeof value === 'string' ? parseInt(value, 10) : Number(value);
      tab.ParentID = !isNaN(parentIdNum) && parentIdNum > 0 ? parentIdNum : null;
    } else {
      tab.ParentID = null;
    }
    
    // Cập nhật vào tabs array để đảm bảo reference đúng
    const tabIndex = this.tabs.findIndex(t => t.id === tab.id);
    if (tabIndex >= 0) {
      this.tabs[tabIndex].ParentID = tab.ParentID;
    }
  }

}
