import { Component, Input, OnInit, Optional, Inject, ViewChild, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { MultiSelectModule } from 'primeng/multiselect';
import { MenuItem, TreeNode } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { finalize } from 'rxjs/operators';
import { ProjectGateStepService } from '../project-gate-step.service';
import { ProjectService } from '../../../project-service/project.service';
import { ProjectTypeDepartmentService } from '../../project-type-department/project-type-department.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { ProjectWorkerService } from '../../../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectGateStepFilesModalComponent } from '../project-gate-step-files-modal/project-gate-step-files-modal.component';
import { ProjectGateStepFormsModalComponent } from '../project-gate-step-forms-modal/project-gate-step-forms-modal.component';
import { ProjectRequestComponent } from '../../../project-request/project-request.component';
import { PermissionService } from '../../../../../services/permission.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ProjectGateTaskDetailComponent } from '../../../project-gate-step/project-gate-task-detail/project-gate-task-detail.component';
import { ProjectDetailComponent } from '../../../project-detail/project-detail.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { ProjectHistoryProblemService } from '../../../project-history-problem/project-history-problem-service/project-history-problem.service';
import { ProjectTaskTimeLineTotalService, TimelineByTeamItem } from '../../../../project_task/project-task-time-line-total/project-task-time-line-total.service';
import { WorkplanService } from '../../../../person/workplan/workplan.service';
import { EmployeeService } from '../../../../hrm/employee/employee-service/employee.service';
import { ProjectTaskDetailComponent } from '../../../../project_task/kanban/project-task-detail/project-task-detail.component';
import { ProjectTaskTimeLineAllProjectComponent } from '../../../../project_task/project-task-time-line-all-project/project-task-time-line-all-project.component';
import { ProjectTaskService } from '../../../../project_task/project-task/project-task.service';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-project-gate-step-by-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzIconModule,
    NzTooltipModule,
    NzGridModule,
    TableModule,
    PopoverModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    MenubarModule,
    ContextMenuModule,
    MultiSelectModule,
    NzSplitterModule,
    ProjectGateStepFilesModalComponent,
    ProjectGateStepFormsModalComponent,
    ProjectRequestComponent,
    HasPermissionDirective,
    ProjectGateTaskDetailComponent
  ],
  templateUrl: './project-gate-step-by-project.component.html',
  styleUrls: ['./project-gate-step-by-project.component.css'],
  providers: [NzNotificationService, NzModalService, NzMessageService]
})
export class ProjectGateStepByProjectComponent implements OnInit {
  @ViewChild('cm') cm!: any;
  contextMenuItems: MenuItem[] = [];
  selectedStepForMenu: any = null;

  @Input() projectId!: number;
  @Input() projectCode!: string;
  @Input() projectName!: string;
  @Input() projectStatusName: string = '';

  get hasEditPermission(): boolean {
    return this.permissionService.hasPermission('N1,N109') || (this.appUserService?.isAdmin ?? false);
  }

  get canAddStepOrTemplate(): boolean {
    if (!this.hasEditPermission) return false;
    if (!this.projectStatusName) return true;
    const s = this.projectStatusName.trim().toLowerCase();
    return s.includes('giải pháp') || s.includes('giai phap')
      || s.includes('tiếp cận') || s.includes('tiep can')
      || s.includes('demo');
  }

  activeProjectTypeId: number | null = null;
  activeDepartmentId: number | null = null;
  checkedProjectTypes: any[] = [];
  groupedMenuDepartments: any[] = [];
  departments: any[] = [];
  menuItems: MenuItem[] = [];
  allGateSteps: any[] = [];
  projectTypeStepsMap: { [key: string]: any[] } = {};
  savedGateSteps: any[] = [];
  isGateStepsLoaded: boolean = false;
  projectTypeDepartmentLinks: any[] = [];

  usersFlat: any[] = [];
  users: any[] = [];
  projectTypeNodes: TreeNode[] = [];
  selectedTypeNodes: TreeNode[] = [];
  expectedPlanDate: string | null = null;
  createDate: string | null = null;
  isSaving: boolean = false;
  isLoading: boolean = false;
  showValidationErrors: boolean = false;
  // Dành cho các mẫu (templates)
  templates: any[] = [];
  selectedTemplateId: number | null = null;
  projectTypeTemplateMap: { [key: string]: number | null } = {};
  // Dành cho danh sách các công đoạn đã xóa
  showDeletedModal: boolean = false;
  isLoadingDeleted: boolean = false;
  deletedSteps: any[] = [];
  // Dành cho view tổng hợp & IssueLog
  isSummaryActive: boolean = true;
  isIssueLogActive: boolean = false;

  // Dành cho Issue Log (PrimeNG Table)
  dataHistory: any[] = [];
  dataDetail: any[] = [];
  selectedHistoryRow: any = null;
  deletedIdsHistory: number[] = [];
  deletedIdsDetail: number[] = [];
  deletedDetailHistoryIdMap: Map<number, number> = new Map();
  nextRowIdHistory: number = 0;
  nextRowIdDetail: number = 0;
  isLoadHistory: boolean = false;
  isLoadDetail: boolean = false;
  projectInfoHistory: any = null;

  cbbStatusHistory: any[] = [
    { id: 1, name: "Phát sinh lỗi" },
    { id: 2, name: "Không phát sinh lỗi" },
    { id: 3, name: "Đang xử lý" },
    { id: 4, name: "Đã xử lý" },
    { id: 5, name: "Phát sinh mới" },
  ];
  selectedSummaryGateId: number | null = null;
  selectedSummaryDepartmentId: number | null = null;
  summaryGates: any[] = [];
  summaryGateGroups: any[] = [];
  summaryGateDetails: any = null;
  gateList: any[] = [];
  // Chi tiết step khi click trong view tổng hợp
  selectedStepDetail: any = null;
  selectedStepDetailDept: any = null;
  selectedDetailTab: number = 1; // 1: Công việc, 2: Checklist, 3: Biểu mẫu
  summaryGateTab: number = 1; // 1: Phòng ban tham gia, 2: Tổng hợp biểu mẫu Gate
  detailTasks: any[] = [];
  isLoadingDetailTasks: boolean = false;
  // Dành cho Tab 2 Checklist detail files
  selectedRuleInTab: any = null;
  displayFilesInTab: any[] = [];
  isLoadingRuleFiles: boolean = false;
  // Dành cho popover tra cứu/chọn nhân viên
  activeManpowerItem: any = null;
  workersSearchText: string = '';
  workersFilteredData: any[] = [];
  // Dành cho duyệt/hủy duyệt nhiều công đoạn
  selectedStepLinkIds: Set<number> = new Set<number>();
  isApprovingMultiple: boolean = false;

  formatAmount = (value: number) => value != null ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  parseAmount = (value: string): number => {
    const cleaned = value.replace(/,/g, ''); // bỏ dấu phẩy
    return Number(cleaned);
  };


  constructor(
    @Optional() public activeModal: NgbActiveModal,
    @Optional() @Inject('tabData') public tabData: any,
    @Optional() private route: ActivatedRoute,
    private tabService: TabServiceService,
    private projectGateStepService: ProjectGateStepService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private projectTypeDeptService: ProjectTypeDepartmentService,
    private projectWorkerService: ProjectWorkerService,
    private modalService: NzModalService,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private message: NzMessageService,
    private projectHistoryProblemService: ProjectHistoryProblemService,
    private timelineTotalService: ProjectTaskTimeLineTotalService,
    private workplanService: WorkplanService,
    private employeeService: EmployeeService,
    private projectTaskService: ProjectTaskService
  ) { }
  ngOnInit(): void {
    if (this.route && this.route.snapshot && this.route.snapshot.queryParams) {
      const q = this.route.snapshot.queryParams;
      const qId = q['projectId'] ?? q['projectID'] ?? q['ProjectID'] ?? q['id'] ?? q['ID'];
      if (qId !== undefined) this.projectId = Number(qId);
      if (q['projectCode']) this.projectCode = q['projectCode'];
      if (q['projectName']) this.projectName = q['projectName'];
      if (q['projectStatusName']) this.projectStatusName = q['projectStatusName'];
    }
    if (this.tabData) {
      const pId = this.tabData.projectId ?? this.tabData.projectID ?? this.tabData.ProjectID ?? this.tabData.id ?? this.tabData.ID;
      if (pId !== undefined && pId !== null) {
        this.projectId = Number(pId);
      }
      if (this.tabData.projectCode !== undefined) {
        this.projectCode = this.tabData.projectCode;
      }
      if (this.tabData.projectName !== undefined) {
        this.projectName = this.tabData.projectName;
      }
      if (this.tabData.projectStatusName !== undefined) {
        this.projectStatusName = this.tabData.projectStatusName;
      } else if (this.tabData.projectStatus !== undefined) {
        this.projectStatusName = this.tabData.projectStatus;
      } else if (this.tabData.statusName !== undefined) {
        this.projectStatusName = this.tabData.statusName;
      }
    }
    this.isLoading = true;
    this.getUsers();
    this.loadDepartments();
    this.loadProjectTypeDepartmentLinks();
    this.getFollowProjectBase();
    this.loadProjectStatus();
    this.getProjectTypeLinks();
    this.loadAllGateSteps();
    this.loadTemplates();
  }

  loadProjectStatus(): void {
    if (!this.projectId) return;
    this.projectService.getProjectDetails(this.projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const item = Array.isArray(res.data) ? res.data[0] : (res.data.project || res.data);
          const status = item?.ProjectStatusName || item?.StatusName || item?.ProjectStatusText || item?.ProjectStatus || item?.CurrentState;
          if (status) {
            this.projectStatusName = status.toString();
          }
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  getUsers(): void {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.usersFlat = response.data || [];
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }
  getFollowProjectBase(): void {
    this.projectService.getFollowProjectBases(this.projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const item = Array.isArray(res.data) ? res.data[0] : res.data;
          this.expectedPlanDate = item.ExpectedPlanDate
            ? DateTime.fromISO(item.ExpectedPlanDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.createDate = item.CreatedDate
            ? DateTime.fromISO(item.CreatedDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          const status = item.ProjectStatusName || item.StatusName || item.ProjectStatusText || item.ProjectStatus || item.Status;
          if (status) {
            this.projectStatusName = status.toString();
          }
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  getProjectTypeLinks(): void {
    combineLatest([
      this.projectService.getProjectTypeLinks(this.projectId),
      this.projectService.getProjectApplicationLinks(this.projectId),
      this.projectService.getProjectTechnologyLinks(this.projectId)
    ]).subscribe({
      next: ([responseLinks, responseApps, responseTechs]: any) => {
        const links = responseLinks.data || [];
        const apps = (responseApps.data || []);
        const techs = (responseTechs.data || []);

        links.forEach((item: any) => {
          item.ApplicationTypeIDs = apps.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.ApplicationTypeID);
          item.TechnologyIDs = techs.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.TechnologyID);
        });

        const treeData = this.projectService.setDataTree(links, 'ID');
        this.projectTypeNodes = this.mapToTreeNodes(treeData);

        // Đồng bộ danh sách các node được chọn ban đầu
        this.selectedTypeNodes = [];
        this.getFlatNodes(this.projectTypeNodes, this.selectedTypeNodes);
        this.updateCheckedProjectTypes();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  mapToTreeNodes(data: any[]): TreeNode[] {
    return data.map(item => {
      const node: TreeNode = {
        data: item,
        expanded: true,
        children: item._children ? this.mapToTreeNodes(item._children) : []
      };
      return node;
    });
  }

  getFlatNodes(nodes: TreeNode[], selection: TreeNode[]) {
    nodes.forEach(node => {
      if (node.data.Selected) {
        selection.push(node);
      }
      if (node.children) {
        this.getFlatNodes(node.children, selection);
      }
    });
  }

  getSelectedData(nodes: TreeNode[], result: any[] = []) {
    nodes.forEach(node => {
      if (node.data.Selected) {
        result.push(node.data);
      }
      if (node.children) {
        this.getSelectedData(node.children, result);
      }
    });
    return result;
  }

  updateCheckedProjectTypes() {
    const list: any[] = [];
    this.getSelectedData(this.projectTypeNodes, list);
    this.checkedProjectTypes = list.filter(item => item.Selected && (!item._children || item._children.length === 0));

    if (this.checkedProjectTypes.length === 0) {
      this.checkedProjectTypes = list.filter(item => item.Selected);
    }

    this.updateGroupedMenuDepartments();

    // Đặt loại dự án và phòng ban hoạt động thành mục đầu tiên nếu chưa được chọn và không thuộc view tổng hợp
    if (!this.isSummaryActive && this.groupedMenuDepartments.length > 0 && !this.activeProjectTypeId) {
      const firstGroup = this.groupedMenuDepartments[0];
      if (firstGroup.projectTypes && firstGroup.projectTypes.length > 0) {
        const pt = firstGroup.projectTypes[0];
        this.activeProjectTypeId = pt.ID;
        this.activeDepartmentId = firstGroup.id;
        firstGroup.collapsed = false;
        const key = `${pt.ID}_${firstGroup.id}`;
        this.selectedTemplateId = this.projectTypeTemplateMap[key] || null;
        this.updateMenuItems();
      }
    }

    this.updateMenuItems();
    this.updateTabsSteps();
  }

  refreshData(): void {
    if (this.isIssueLogActive) {
      this.loadDataHistoryProblem();
      return;
    }
    if (this.isMasterPlanActive) {
      this.loadMasterPlanTimeline();
      return;
    }
    this.isLoading = true;
    this.selectedStepLinkIds.clear();
    this.projectTypeStepsMap = {};
    this.isGateStepsLoaded = false;
    this.selectedStepDetail = null;
    this.selectedStepDetailDept = null;
    this.detailTasks = [];

    this.getUsers();
    this.loadDepartments();
    this.loadProjectTypeDepartmentLinks();
    this.getFollowProjectBase();
    this.getProjectTypeLinks();
    this.loadAllGateSteps();
    this.loadTemplates();

  }

  loadAllGateSteps() {
    this.projectGateStepService.getAll().subscribe({
      next: (res: any) => {
        this.allGateSteps = res.data || [];

        if (this.projectId && this.projectId > 0) {
          this.projectGateStepService.getByProject(this.projectId).pipe(
            finalize(() => this.isLoading = false)
          ).subscribe({
            next: (res2: any) => {
              this.savedGateSteps = res2.data || [];
              this.isGateStepsLoaded = true;
              this.updateTabsSteps(true);
              this.buildSummaryData();
            },
            error: (err: any) => {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                err?.error?.message || `${err.error}\n${err.message}`,
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
              this.savedGateSteps = [];
              this.isGateStepsLoaded = true;
              this.updateTabsSteps(true);
              this.buildSummaryData();
            }
          });
        } else {
          this.savedGateSteps = [];
          this.isGateStepsLoaded = true;
          this.isLoading = false;
          this.updateTabsSteps(true);
          this.buildSummaryData();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isGateStepsLoaded = true;
        this.isLoading = false;
      }
    });
  }

  updateTabsSteps(forceRebuild: boolean = false) {
    if (!this.allGateSteps || this.allGateSteps.length === 0) {
      return;
    }
    if (!this.isGateStepsLoaded) {
      return;
    }

    if (forceRebuild) {
      this.projectTypeStepsMap = {};
    }

    this.groupedMenuDepartments.forEach(group => {
      const deptId = group.id; // ID phòng ban (kiểu số hoặc null)
      group.projectTypes.forEach((pt: any) => {
        const key = `${pt.ID}_${deptId}`;

        if (!this.projectTypeStepsMap[key]) {
          const allSteps = JSON.parse(JSON.stringify(this.allGateSteps));

          // Kiểm tra xem có dữ liệu đã lưu cho sự kết hợp này không (khớp theo ProjectTypeID + DepartmentID)
          const savedForThisCombo = (this.savedGateSteps || []).filter((x: any) => {
            if (x.ProjectTypeID !== pt.ID) return false;
            // Nếu liên kết đã lưu có DepartmentID, khớp trực tiếp
            if (x.DepartmentID !== undefined && x.DepartmentID !== null) {
              return x.DepartmentID === deptId;
            }
            // Phương án dự phòng: khớp theo DepartmentIDs của công đoạn (dữ liệu cũ không có DepartmentID)
            if (deptId === null) return true;
            const step = this.allGateSteps.find((s: any) => s.ID === x.ProjectGateStepID);
            return step && step.DepartmentIDs && step.DepartmentIDs.includes(deptId);
          });

          let steps: any[];

          if (savedForThisCombo.length > 0) {
            steps = [];
            savedForThisCombo.forEach((savedItem: any) => {
              const templateStep = allSteps.find((step: any) => step.ID === savedItem.ProjectGateStepID);

              const stepObj: any = {
                ID: savedItem.ID,
                ProjectGateStepID: savedItem.ProjectGateStepID,
                ProjectTypeID: savedItem.ProjectTypeID,
                DepartmentID: savedItem.DepartmentID,
                ProjectGateStepLinkID: savedItem.ID,
                ParentID: savedItem.ParentID || null,
                parentLinkId: savedItem.ParentID || null,
                isSubStep: !!savedItem.ParentID,
                isNew: false,
                isRepeated: !!savedItem.IsRepeat,
                GateCode: templateStep?.GateCode || `G${savedItem.ProjectGateStepID}`,
                GateName: templateStep?.GateName || 'Công đoạn con',
                Content: savedItem.Content || templateStep?.Content || '',
                ActualContent: savedItem.ActualContent || '',
                DepartmentNames: templateStep?.DepartmentNames || '',
                PositionNames: templateStep?.PositionNames || '',
                CheckListNames: templateStep?.CheckListNames || '',
                SortOrder: templateStep?.SortOrder || 0,
                machineIndex: savedItem.IsRepeat ? 2 : 1,
                isRepeatChecked: !!savedItem.IsRepeat,
                repeatOrder: savedItem.IsRepeat ? Date.now() : 0,
                parentStepId: savedItem.ProjectGateStepID,
                groupName: this.getGateGroupNameForMachine(templateStep?.GateCode || `G${savedItem.ProjectGateStepID}`, savedItem.IsRepeat ? 2 : 1),
                StartDate: savedItem.StartDate ? savedItem.StartDate.substring(0, 10) : null,
                DateEnd: savedItem.DateEnd ? String(savedItem.DateEnd).substring(0, 10) : null,
                IsApproved: savedItem.IsApproved,
                IsApprovedTBP: savedItem.IsApprovedTBP,
                CheckLists: savedItem.CheckLists || [],
                Forms: savedItem.Forms || [],
                Workers: []
              };
              if (savedItem.Workers && savedItem.Workers.length > 0) {
                stepObj.Workers = savedItem.Workers.map((w: any) => w.EmployeeID);
                stepObj.PeopleCount = savedItem.Workers.length;
                stepObj.DayCount = savedItem.DayCount != null ? savedItem.DayCount : savedItem.Workers[0].DayCount;
                stepObj.UnitPrice = savedItem.Workers[0].UnitPrice;
                stepObj.TotalEffort = stepObj.PeopleCount * stepObj.DayCount;
              } else {
                stepObj.PeopleCount = null;
                stepObj.DayCount = savedItem.DayCount != null ? savedItem.DayCount : null;
                stepObj.UnitPrice = null;
                stepObj.TotalEffort = 1;
              }

              if (!stepObj.DateEnd && stepObj.StartDate && stepObj.DayCount) {
                this.calculateDateEnd(stepObj);
              }

              steps.push(stepObj);
            });

            // Chuẩn hóa ParentID cho các dòng con nếu dữ liệu cũ lưu ParentID theo ProjectGateStepID thay vì ID của dòng cha
            steps.forEach((step: any) => {
              if (step.ParentID) {
                const parentExist = steps.find((p: any) => p.ID === step.ParentID);
                if (!parentExist) {
                  const legacyParent = steps.find((p: any) => p.ProjectGateStepID === step.ParentID && !p.ParentID);
                  if (legacyParent) {
                    step.ParentID = legacyParent.ID;
                    step.parentLinkId = legacyParent.ID;
                  }
                }
              }
            });
          } else {
            // Không có dữ liệu đã lưu — mặc định từ template hoặc rỗng
            steps = allSteps.filter((step: any) => {
              if (deptId === null) return true;
              return step.DepartmentIDs && step.DepartmentIDs.includes(deptId);
            });
            steps.forEach((step: any) => {
              step.machineIndex = 1;
              step.isRepeatChecked = false;
              step.repeatOrder = 0;
              step.isRepeated = false;
              step.parentStepId = null;
              step.groupName = this.getGateGroupNameForMachine(step.GateCode, 1);
              step.PeopleCount = null;
              step.DayCount = null;
              step.TotalEffort = 1;
              step.UnitPrice = null;
              step.Workers = [];
            });
          }

          this.projectTypeStepsMap[key] = steps;

          steps.filter((s: any) => s.isRepeatChecked).forEach((s: any) => {
            this.addRepeatedStep(key, s);

            // Gán dữ liệu cho công đoạn lặp lại
            const repeatedStep = this.projectTypeStepsMap[key].find((x: any) => x.isRepeated && x.parentStepId === s.ID);
            const repeatedItem = savedForThisCombo.find((x: any) => x.ProjectGateStepID === s.ID && x.IsRepeat);

            if (repeatedStep && repeatedItem) {
              repeatedStep.ProjectGateStepLinkID = repeatedItem.ID;
              repeatedStep.IsApproved = repeatedItem.IsApproved;
              repeatedStep.IsApprovedTBP = repeatedItem.IsApprovedTBP;
              repeatedStep.StartDate = repeatedItem.StartDate ? repeatedItem.StartDate.substring(0, 10) : null;

              repeatedStep.CheckLists = repeatedItem.CheckLists || [];
              repeatedStep.Forms = repeatedItem.Forms || [];

              if (repeatedItem.Workers && repeatedItem.Workers.length > 0) {
                repeatedStep.Workers = repeatedItem.Workers.map((w: any) => w.EmployeeID);
                repeatedStep.PeopleCount = repeatedItem.Workers.length;
                repeatedStep.DayCount = repeatedItem.Workers[0].DayCount;
                repeatedStep.UnitPrice = repeatedItem.Workers[0].UnitPrice;
                repeatedStep.TotalEffort = repeatedStep.PeopleCount * repeatedStep.DayCount;
              }
            }
          });

          this.recalculateSequenceNumbers(key);
        }
      });
    });

    // Dọn dẹp các khóa (keys) không còn hoạt động
    const activeKeys = new Set<string>();
    this.groupedMenuDepartments.forEach(group => {
      group.projectTypes.forEach((pt: any) => {
        activeKeys.add(`${pt.ID}_${group.id}`);
      });
    });

    Object.keys(this.projectTypeStepsMap).forEach(k => {
      if (!activeKeys.has(k)) {
        delete this.projectTypeStepsMap[k];
      }
    });
  }
  /** Lấy công đoạn cha của một công đoạn con */
  getParentStep(item: any, comboKey: string): any {
    if (!item || (!item.ParentID && !item.isSubStep && !item.parentLinkId)) return null;
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const parentId = item.ParentID || item.parentLinkId;
    let parent = steps.find((s: any) =>
      (s.ID && s.ID === parentId) ||
      (s.ProjectGateStepLinkID && s.ProjectGateStepLinkID === parentId) ||
      (!s.ParentID && !s.isSubStep && s.ProjectGateStepID === item.parentStepId)
    );
    if (!parent && (item.isSubStep || item.ParentID)) {
      const currentIndex = steps.indexOf(item);
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!steps[i].isSubStep && !steps[i].ParentID) {
          parent = steps[i];
          break;
        }
      }
    }
    return parent;
  }

  /** Lấy Ngày bắt đầu tối thiểu cho công đoạn con (từ Ngày bắt đầu của công đoạn cha) */
  getMinStartDate(item: any, comboKey: string): string | null {
    if (!item || (!item.ParentID && !item.isSubStep && !item.parentLinkId)) return null;
    const parent = this.getParentStep(item, comboKey);
    return parent && parent.StartDate ? String(parent.StartDate).substring(0, 10) : null;
  }

  /** Lấy Ngày bắt đầu tối đa cho công đoạn con (từ DateEnd của công đoạn con hoặc công đoạn cha) */
  getMaxStartDate(item: any, comboKey: string): string | null {
    if (!item || (!item.ParentID && !item.isSubStep && !item.parentLinkId)) return null;
    const parent = this.getParentStep(item, comboKey);
    if (item.DateEnd) {
      return String(item.DateEnd).substring(0, 10);
    }
    return parent && parent.DateEnd ? String(parent.DateEnd).substring(0, 10) : null;
  }

  /** Lấy Ngày kết thúc tối thiểu cho công đoạn con (từ StartDate của công đoạn con hoặc công đoạn cha) */
  getMinDateEnd(item: any, comboKey: string): string | null {
    if (!item || (!item.ParentID && !item.isSubStep && !item.parentLinkId)) return null;
    const parent = this.getParentStep(item, comboKey);
    if (item.StartDate) {
      return String(item.StartDate).substring(0, 10);
    }
    return parent && parent.StartDate ? String(parent.StartDate).substring(0, 10) : null;
  }

  /** Lấy Ngày kết thúc tối đa cho công đoạn con (từ DateEnd của công đoạn cha) */
  getMaxDateEnd(item: any, comboKey: string): string | null {
    if (!item || (!item.ParentID && !item.isSubStep && !item.parentLinkId)) return null;
    const parent = this.getParentStep(item, comboKey);
    return parent && parent.DateEnd ? String(parent.DateEnd).substring(0, 10) : null;
  }

  /** Cập nhật số ngày của công đoạn cha = tổng số ngày của các công đoạn con */
  updateParentDayCount(parent: any, comboKey: string): void {
    if (!parent) return;
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const parentRealId = parent.ID || parent.ProjectGateStepLinkID;
    const children = steps.filter((s: any) =>
      (s.ParentID && (s.ParentID === parentRealId || s.parentLinkId === parentRealId)) ||
      (s.isSubStep && (s.parentLinkId === parentRealId || s.ParentID === parentRealId || s.parentStepId === parent.ProjectGateStepID))
    );

    if (children.length > 0) {
      const sumDays = children.reduce((acc: number, c: any) => acc + (Number(c.DayCount) || 0), 0);
      parent.DayCount = sumDays;
      if (parent.PeopleCount != null) {
        parent.TotalEffort = parent.PeopleCount * parent.DayCount;
      }
    }
  }
  updateMenuItems() {
    this.menuItems = this.checkedProjectTypes.map(pt => {
      const isActive = !this.isSummaryActive && !this.isIssueLogActive && this.activeProjectTypeId === pt.ID;
      return {
        label: `Nhân công - ${pt.ProjectTypeName}`,
        icon: 'fa-solid fa-users text-primary',
        styleClass: isActive ? 'active-menu-item' : 'inactive-menu-item',
        command: () => {
          this.selectProjectType(pt.ID, null);
        }
      };
    });
  }

  isManpowerExpanded: boolean = false;
  collapsedDeptGroups: Set<any> = new Set<any>();

  toggleManpowerMenu(): void {
    this.isManpowerExpanded = !this.isManpowerExpanded;
  }

  isDeptGroupExpanded(deptId: any): boolean {
    return !this.collapsedDeptGroups.has(deptId);
  }

  /** Kiểm tra công đoạn cha có các công đoạn con hay không */
  hasChildrenStep(item: any, comboKey: string): boolean {
    if (!item || item.ParentID || item.isSubStep || item.isNew) return false;
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const parentRealId = item.ID || item.ProjectGateStepLinkID;
    return steps.some((s: any) =>
      (s.ParentID && (s.ParentID === item.ID || s.ParentID === item.ProjectGateStepLinkID || s.parentLinkId === item.ID)) ||
      (s.isSubStep && (s.parentLinkId === parentRealId || s.ParentID === parentRealId))
    );
  }

  /** Bật / tắt thu gọn các công đoạn con của 1 công đoạn cha */
  toggleExpandStep(item: any): void {
    if (!item) return;
    item.collapsed = !item.collapsed;
  }

  /** Kiểm tra công đoạn (con) có bị ẩn/thu gọn bởi công đoạn cha không */
  isStepCollapsed(item: any, comboKey: string): boolean {
    if (!item || (!item.ParentID && !item.isSubStep)) return false;
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const parentId = item.ParentID || item.parentLinkId;
    const parent = steps.find((s: any) =>
      (s.ID && s.ID === parentId) ||
      (s.ProjectGateStepLinkID && s.ProjectGateStepLinkID === parentId) ||
      (!s.ParentID && !s.isSubStep && s.ProjectGateStepID === item.parentStepId)
    );
    return parent ? !!parent.collapsed : false;
  }

  selectProjectType(ptId: number, deptId: number | null): void {
    if (
      this.activeProjectTypeId !== null &&
      this.activeDepartmentId !== undefined &&
      (this.activeProjectTypeId !== ptId || this.activeDepartmentId !== deptId)
    ) {
      const prevKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
      if (this.projectTypeStepsMap[prevKey]) {
        this.projectTypeStepsMap[prevKey] = this.projectTypeStepsMap[prevKey].filter((s: any) => !s.isNew);
      }
      if (this.hasNoSavedSteps(this.activeProjectTypeId, this.activeDepartmentId)) {
        this.projectTypeStepsMap[prevKey] = [];
        this.projectTypeTemplateMap[prevKey] = null;
      }
    }

    this.isSummaryActive = false;
    this.isIssueLogActive = false;
    this.isMasterPlanActive = false;
    this.isManpowerExpanded = true;
    this.activeProjectTypeId = ptId;
    this.activeDepartmentId = deptId;
    const key = `${ptId}_${deptId}`;
    this.selectedTemplateId = this.projectTypeTemplateMap[key] || null;

    const activeGroup = (this.groupedMenuDepartments || []).find(g => g.id === deptId);
    if (activeGroup) {
      activeGroup.collapsed = false;
    }

    this.updateMenuItems();
  }

  getRomanNumeral(num: number): string {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return roman[num - 1] || num.toString();
  }

  getGiaiPhapGroupTitle(): string {
    const giaiPhapGates = (this.gateList || []).filter(g => (g.Type ?? 1) === 1);
    if (giaiPhapGates.length > 0) {
      const firstCode = giaiPhapGates[0].GateCode || 'G0';
      const lastCode = giaiPhapGates[giaiPhapGates.length - 1].GateCode || 'G3';
      return `Giải pháp ${firstCode}->${lastCode}`;
    }
    return 'Giải pháp G0->G3';
  }

  getTrienKhaiGroupTitle(): string {
    const trienKhaiGates = (this.gateList || []).filter(g => (g.Type ?? 1) === 2);
    if (trienKhaiGates.length > 0) {
      const firstCode = trienKhaiGates[0].GateCode || 'G4';
      const lastCode = trienKhaiGates[trienKhaiGates.length - 1].GateCode || 'G12';
      return `Triển khai ${firstCode}->${lastCode}`;
    }
    return 'Triển khai G4->G12';
  }

  getGateGroupNameForMachine(gateCode: string | null | undefined, machineIndex: number): string {
    const roman = this.getRomanNumeral(machineIndex);
    const prefix = `${roman}. `;
    const subGroup1 = `${machineIndex}.1`;
    const subGroup2 = `${machineIndex}.2`;

    const title1 = `${prefix}${subGroup1} ${this.getGiaiPhapGroupTitle()}`;
    const title2 = `${prefix}${subGroup2} ${this.getTrienKhaiGroupTitle()}`;

    if (!gateCode) return title2;
    const code = gateCode.trim().toUpperCase();

    const matchedGate = (this.gateList || []).find(g => (g.GateCode || '').trim().toUpperCase() === code);
    if (matchedGate) {
      if ((matchedGate.Type ?? 1) === 1) {
        return title1;
      }
      return title2;
    }

    const match = code.match(/^G(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const giaiPhapGates = (this.gateList || []).filter(g => (g.Type ?? 1) === 1);
      if (giaiPhapGates.length > 0) {
        const nums = giaiPhapGates
          .map(g => {
            const m = (g.GateCode || '').trim().toUpperCase().match(/^G(\d+)/);
            return m ? parseInt(m[1], 10) : null;
          })
          .filter(n => n !== null) as number[];
        if (nums.length > 0 && num >= Math.min(...nums) && num <= Math.max(...nums)) {
          return title1;
        }
      } else if (num >= 0 && num <= 3) {
        return title1;
      }
    }
    return title2;
  }

  onRepeatToggle(comboKey: string, item: any) {
    if (item.isRepeatChecked) {
      this.addRepeatedStep(comboKey, item);
    } else {
      this.removeRepeatedStep(comboKey, item);
    }
    this.recalculateSequenceNumbers(comboKey);
  }

  addRepeatedStep(comboKey: string, item: any) {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const alreadyExists = steps.some((step: any) => step.isRepeated && step.parentStepId === item.ID);
    if (alreadyExists) return;

    const repeatedStep = JSON.parse(JSON.stringify(item));
    repeatedStep.ID = -Date.now() - Math.floor(Math.random() * 1000);
    repeatedStep.machineIndex = 2; // Nhân bản sang Máy II
    repeatedStep.isRepeated = true;
    repeatedStep.parentStepId = item.ID;
    repeatedStep.isRepeatChecked = false;
    repeatedStep.groupName = this.getGateGroupNameForMachine(item.GateCode, 2);
    repeatedStep.repeatOrder = Date.now();

    this.projectTypeStepsMap[comboKey] = [...steps, repeatedStep];
  }

  removeRepeatedStep(comboKey: string, item: any) {
    if (this.projectTypeStepsMap[comboKey]) {
      this.projectTypeStepsMap[comboKey] = this.projectTypeStepsMap[comboKey].filter(
        (step: any) => !(step.isRepeated && step.parentStepId === item.ID)
      );
    }
  }

  recalculateSequenceNumbers(comboKey: string) {
    const steps = this.projectTypeStepsMap[comboKey] || [];

    steps.forEach((step: any) => {
      if (step.machineIndex === undefined || step.machineIndex === null) {
        step.machineIndex = 1;
      }
      if (step.isRepeatChecked === undefined || step.isRepeatChecked === null) {
        step.isRepeatChecked = false;
      }
      if (step.repeatOrder === undefined || step.repeatOrder === null) {
        step.repeatOrder = 0;
      }
      step.groupName = this.getGateGroupNameForMachine(step.GateCode, step.machineIndex);
    });

    // Phân tách các công đoạn cha (gốc) và công đoạn con
    const parentSteps: any[] = [];
    const childMap = new Map<any, any[]>();

    steps.forEach((step: any) => {
      const pId = step.ParentID || step.parentLinkId;
      if (pId) {
        if (!childMap.has(pId)) {
          childMap.set(pId, []);
        }
        childMap.get(pId)!.push(step);
      } else {
        parentSteps.push(step);
      }
    });

    // Sắp xếp các công đoạn cha theo machineIndex, groupName và SortOrder
    parentSteps.sort((a: any, b: any) => {
      if (a.machineIndex !== b.machineIndex) {
        return a.machineIndex - b.machineIndex;
      }
      const groupComparison = (a.groupName || '').localeCompare(b.groupName || '');
      if (groupComparison !== 0) {
        return groupComparison;
      }
      if (a.machineIndex === 1) {
        return (a.SortOrder || 0) - (b.SortOrder || 0);
      } else {
        return (a.repeatOrder || 0) - (b.repeatOrder || 0);
      }
    });

    // Ghép lại danh sách: Mỗi cha đi liền với các dòng con của nó ngay bên dưới
    const orderedSteps: any[] = [];
    parentSteps.forEach((parent: any) => {
      orderedSteps.push(parent);
      const parentKeys = [parent.ProjectGateStepLinkID, parent.ID, parent.ProjectGateStepID, parent.parentStepId].filter(k => k != null);

      const children: any[] = [];
      parentKeys.forEach(k => {
        if (childMap.has(k)) {
          const matchedChildren = childMap.get(k)!;
          matchedChildren.forEach(c => {
            if (!children.includes(c)) {
              children.push(c);
            }
          });
        }
      });

      children.forEach((child: any) => {
        child.groupName = parent.groupName;
        child.machineIndex = parent.machineIndex;
        const parentRealId = parent.ID || parent.ProjectGateStepLinkID;
        if (parentRealId) {
          child.ParentID = parentRealId;
          child.parentLinkId = parentRealId;
        }
        orderedSteps.push(child);
      });
    });

    // Thêm bất kỳ dòng con mồ côi nào chưa được xếp vào danh sách (nếu có)
    steps.forEach((step: any) => {
      if (!orderedSteps.includes(step)) {
        orderedSteps.push(step);
      }
    });

    const counters: { [key: string]: number } = {};
    const childCounters: { [key: string]: number } = {};
    const stepMap = new Map<any, any>();

    orderedSteps.forEach((step: any) => {
      if (step.ProjectGateStepLinkID) stepMap.set(step.ProjectGateStepLinkID, step);
      if (step.ID) stepMap.set(step.ID, step);
    });

    orderedSteps.forEach((step: any) => {
      let isG0toG3 = false;
      if (step.GateCode) {
        const code = step.GateCode.trim().toUpperCase();
        const match = code.match(/^G(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= 0 && num <= 3) {
            isG0toG3 = true;
          }
        }
      }
      const subGroup = isG0toG3 ? '1' : '2';
      const prefix = `${step.machineIndex}.${subGroup}`;

      // Xác định công đoạn cha
      const parentLinkId = step.ParentID || step.parentLinkId;
      let parentStep = parentLinkId ? stepMap.get(parentLinkId) : null;

      if (!parentStep && (step.isSubStep || step.ParentID)) {
        const currentIndex = orderedSteps.indexOf(step);
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (!orderedSteps[i].isSubStep && !orderedSteps[i].ParentID) {
            parentStep = orderedSteps[i];
            step.ParentID = parentStep.ProjectGateStepLinkID || parentStep.ID;
            step.parentLinkId = step.ParentID;
            break;
          }
        }
      }

      if (parentStep && parentStep.TT) {
        // Là công đoạn con -> TT được đánh theo TT cha (Ví dụ: Cha 1.1.1 -> Con 1.1.1.1, 1.1.1.2)
        const parentTT = parentStep.TT;
        if (!childCounters[parentTT]) {
          childCounters[parentTT] = 1;
        }
        step.TT = `${parentTT}.${childCounters[parentTT]}`;
        childCounters[parentTT]++;
      } else {
        // Là công đoạn cha -> Tăng TT bình thường (Ví dụ: 1.1.1, 1.1.2)
        if (!counters[prefix]) {
          counters[prefix] = 1;
        }
        step.TT = `${prefix}.${counters[prefix]}`;
        counters[prefix]++;
      }
    });
    // Cập nhật số ngày ở các công đoạn cha có con = sum(số ngày công đoạn con) TNB Update
    parentSteps.forEach((parent: any) => {
      this.updateParentDayCount(parent, comboKey);
    });
    this.projectTypeStepsMap[comboKey] = [...orderedSteps];
    // Chỉ tính toán lại ngày nếu không có dữ liệu đã lưu cho loại dự án này
    const ptId = Number(comboKey.split('_')[0]);
    const hasSavedData = this.savedGateSteps && this.savedGateSteps.some(x => x.ProjectTypeID === ptId);
    if (!hasSavedData) {
      this.recalculateAllStepsDates(comboKey);
    }
  }

  calculateDateEnd(item: any): void {
    if (!item || !item.StartDate) return;
    const comboKey = `${this.activeProjectTypeId || item.ProjectTypeID}_${this.activeDepartmentId || item.DepartmentID}`;
    if (this.hasChildrenStep(item, comboKey)) return;
    const startDt = DateTime.fromISO(String(item.StartDate).substring(0, 10));
    if (!startDt.isValid) return;
    const dayCount = Number(item.DayCount) || 1;
    const endDt = startDt.plus({ days: dayCount > 0 ? dayCount - 1 : 0 });
    item.DateEnd = endDt.toFormat('yyyy-MM-dd');
  }

  onDateEndValueChange(item: any): void {
    if (!item || !item.StartDate || !item.DateEnd) return;
    const comboKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
    if (item && (item.ParentID || item.isSubStep || item.parentLinkId)) {
      const minDate = item.StartDate ? String(item.StartDate).substring(0, 10) : this.getMinStartDate(item, comboKey);
      const maxDate = this.getMaxDateEnd(item, comboKey);
      if (minDate && item.DateEnd < minDate) {
        item.DateEnd = minDate;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày kết thúc của công đoạn con không được nhỏ hơn Ngày bắt đầu (${minDate})`, { nzStyle: { fontSize: '12px' } });
      } else if (maxDate && item.DateEnd > maxDate) {
        item.DateEnd = maxDate;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày kết thúc của công đoạn con không được lớn hơn Ngày kết thúc của công đoạn cha (${maxDate})`, { nzStyle: { fontSize: '12px' } });
      }
    }
    const startDt = DateTime.fromISO(String(item.StartDate).substring(0, 10));
    const endDt = DateTime.fromISO(String(item.DateEnd).substring(0, 10));
    if (startDt.isValid && endDt.isValid && endDt >= startDt) {
      const diffDays = Math.floor(endDt.diff(startDt, 'days').days) + 1;
      if (diffDays > 0) {
        item.DayCount = diffDays;
        this.onGateStepValueChange(item);
      }
    }
  }

  onStartDateValueChange(item: any, comboKey: string) {

    if (item && (item.ParentID || item.isSubStep || item.parentLinkId)) {
      const minDate = this.getMinStartDate(item, comboKey);
      const maxDate = this.getMaxDateEnd(item, comboKey);
      if (minDate && item.StartDate && item.StartDate < minDate) {
        item.StartDate = minDate;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày bắt đầu của công đoạn con không được nhỏ hơn Ngày bắt đầu của công đoạn cha (${minDate})`, { nzStyle: { fontSize: '12px' } });
      } else if (maxDate && item.StartDate && item.StartDate > maxDate) {
        item.StartDate = maxDate;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Ngày bắt đầu của công đoạn con không được lớn hơn Ngày kết thúc của công đoạn cha (${maxDate})`, { nzStyle: { fontSize: '12px' } });
      }
    }
    this.calculateDateEnd(item);
    this.onGateStepValueChange(item);
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const index = steps.findIndex((s: any) => s.ID === item.ID);
    if (index !== -1) {
      this.updateSubsequentStepsDates(comboKey, index);
    }
  }

  updateSubsequentStepsDates(comboKey: string, startFromIndex: number) {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    if (startFromIndex < 0 || startFromIndex >= steps.length) return;

    let currentDate = DateTime.fromISO(steps[startFromIndex].StartDate);
    if (!currentDate.isValid) return;

    const startStepDayCount = Number(steps[startFromIndex].DayCount) || 0;
    currentDate = currentDate.plus({ days: startStepDayCount });

    for (let i = startFromIndex + 1; i < steps.length; i++) {
      steps[i].StartDate = currentDate.toFormat('yyyy-MM-dd');
      const dayCount = Number(steps[i].DayCount) || 0;
      currentDate = currentDate.plus({ days: dayCount });
    }
  }

  recalculateAllStepsDates(comboKey: string) {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    let baseDate: DateTime;
    if (this.expectedPlanDate) {
      baseDate = DateTime.fromISO(this.expectedPlanDate);
    } else if (this.createDate) {
      baseDate = DateTime.fromISO(this.createDate);
    } else {
      baseDate = DateTime.local();
    }
    if (!baseDate.isValid) {
      baseDate = DateTime.local();
    }

    let currentDate = baseDate;
    steps.forEach((step: any) => {
      step.StartDate = currentDate.toFormat('yyyy-MM-dd');
      const dayCount = Number(step.DayCount) || 0;
      currentDate = currentDate.plus({ days: dayCount });
    });
  }

  removeStep(comboKey: string, stepId: number) {
    if (!this.projectTypeStepsMap[comboKey]) return;
    const steps = this.projectTypeStepsMap[comboKey];
    const stepToDelete = steps.find((s: any) => s.ID === stepId);
    if (!stepToDelete) return;
    if (this.isStepPassed(stepToDelete) || this.isStepApprovedTBP(stepToDelete)) {
      return;
    }

    const stepName = stepToDelete.GateName
      ? `${stepToDelete.GateCode} - ${stepToDelete.GateName}`
      : (stepToDelete.Content || 'công đoạn này');

    this.modalService.confirm({
      nzTitle: '<b>Xác nhận xóa công đoạn</b>',
      nzContent: `Bạn có chắc chắn muốn xóa <b>${stepName}</b> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.doRemoveStep(comboKey, stepId)
    });
  }

  private doRemoveStep(comboKey: string, stepId: number) {
    if (this.projectTypeStepsMap[comboKey]) {
      const steps = this.projectTypeStepsMap[comboKey];
      const stepToDelete = steps.find((s: any) => s.ID === stepId);
      if (stepToDelete) {
        const parentOfDeleted = this.getParentStep(stepToDelete, comboKey);
        const targetParentIds = [
          stepToDelete.ID,
          stepToDelete.ProjectGateStepLinkID,
          stepToDelete.ProjectGateStepID,
          stepToDelete.parentStepId
        ].filter((k: any) => k !== undefined && k !== null && k !== 0);

        if (stepToDelete.isRepeated) {
          const parent = steps.find((s: any) => targetParentIds.includes(s.ID) || targetParentIds.includes(s.ProjectGateStepID));
          if (parent) {
            parent.isRepeatChecked = false;
          }
        }

        this.projectTypeStepsMap[comboKey] = steps.filter((step: any) => {
          if (step === stepToDelete || step.ID === stepId) return false;

          // Xóa bước lặp lại nếu bước cha bị xóa
          if (step.isRepeated && step.parentStepId && targetParentIds.includes(step.parentStepId)) {
            return false;
          }

          // Xóa tất cả các công đoạn con nếu công đoạn cha bị xóa
          const pId = step.ParentID || step.parentLinkId;
          if (pId && targetParentIds.includes(pId)) {
            return false;
          }

          return true;
        });

        this.recalculateSequenceNumbers(comboKey);
        if (parentOfDeleted) {
          this.updateParentDayCount(parentOfDeleted, comboKey);
        }
      }
    }
  }

  isFirstSubgroupOfMachine(comboKey: string, item: any): boolean {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    const firstStepForMachine = steps.find((s: any) => s.machineIndex === item.machineIndex);
    return firstStepForMachine ? firstStepForMachine.groupName === item.groupName : false;
  }

  getMachineHeaderName(item: any): string {
    const roman = this.getRomanNumeral(item.machineIndex);
    if (item.machineIndex === 1) {
      return `${roman}. Máy đầu tiên`;
    }
    return `${roman}. Máy thứ hai trở đi`;
  }

  getSubgroupHeaderName(item: any): string {
    if (!item.groupName) return '';
    return item.groupName.replace(/^[IVX]+\.\s*/, '');
  }

  isGiaiPhapGroup(item: any): boolean {
    if (!item || !item.groupName) return false;
    const name = item.groupName.toLowerCase();
    return name.includes('giải pháp') || name.includes('g0->g3');
  }

  isTrienKhaiGroup(item: any): boolean {
    if (!item || !item.groupName) return false;
    const name = item.groupName.toLowerCase();
    return name.includes('triển khai') || name.includes('g4->g12');
  }

  getTotalEffort(comboKey: string): number {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    return steps.reduce((sum, item) => sum + (Number(item.TotalEffort) || 0), 0);
  }

  getTotalAmount(comboKey: string): number {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    return steps.reduce((sum, item) => {
      const effort = Number(item.TotalEffort) || 0;
      const price = Number(item.UnitPrice) || 0;
      return sum + (effort * price);
    }, 0);
  }

  getGroupTotalEffort(comboKey: string, groupName: string): number {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    return steps
      .filter(x => x.groupName === groupName)
      .reduce((sum, item) => sum + (Number(item.TotalEffort) || 0), 0);
  }

  getGroupTotalAmount(comboKey: string, groupName: string): number {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    return steps
      .filter(x => x.groupName === groupName)
      .reduce((sum, item) => {
        const effort = Number(item.TotalEffort) || 0;
        const price = Number(item.UnitPrice) || 0;
        return sum + (effort * price);
      }, 0);
  }

  // Bộ xử lý tra cứu/chọn nhân viên thực hiện (mỗi người 1 dòng nếu có từ 2 người trở lên)
  getWorkersDisplay(workerIds: any[]): string {
    if (!workerIds || workerIds.length === 0) return '';
    return this.usersFlat
      .filter(u => workerIds.includes(u.EmployeeID))
      .map(u => u.FullName)
      .join('\n');
  }

  getFormattedNames(names: string | null | undefined): string {
    if (!names) return '';
    return names.split(',').map(n => n.trim()).filter(n => n).join('\n');
  }

  openWorkersLookup(event: Event, item: any, lookupPanel: any) {
    if (item.isNew) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn công đoạn trước khi chọn nhân viên.', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }
    this.activeManpowerItem = item;
    this.workersSearchText = '';
    this.filterWorkersData();
    lookupPanel.toggle(event);
  }

  private generateDraftId(): number {
    return -Math.floor(Math.random() * 1000000000) - 1;
  }

  addBlankStep(comboKey: string) {
    if (!this.hasEditPermission) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền thực hiện thao tác này (cần quyền N1 hoặc N109)!', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }
    if (!this.canAddStepOrTemplate) return;
    if (!comboKey) return;
    const steps = this.projectTypeStepsMap[comboKey] || [];

    // Kiểm tra xem đã có dòng trống nào đang được thêm hay chưa
    const hasBlank = steps.some((s: any) => s.isNew);
    if (hasBlank) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đã có một dòng trống đang được thêm mới.', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }

    const blankStep = {
      ID: this.generateDraftId(),
      isNew: true,
      machineIndex: 1,
      isRepeated: false,
      parentStepId: null,
      groupName: 'III. Thêm mới công đoạn',
      TT: '',
      SortOrder: 9999,
      GateCode: '',
      GateName: 'Chọn công đoạn...',
      DepartmentNames: '',
      Content: '',
      ActualContent: '',
      PositionNames: '',
      CheckListNames: '',
      StartDate: null,
      isRepeatChecked: false,
      PeopleCount: null,
      DayCount: null,
      TotalEffort: 1,
      UnitPrice: null,
      Workers: []
    };

    this.projectTypeStepsMap[comboKey] = [...steps, blankStep];
  }

  getAvailableStepsForSelect(comboKey: string): any[] {
    const steps = this.projectTypeStepsMap[comboKey] || [];
    if (!comboKey) return [];

    const parts = comboKey.split('_');
    const ptId = Number(parts[0]);
    const deptIdStr = parts[1];
    const deptId = deptIdStr === 'null' ? null : Number(deptIdStr);

    const selectedTemplateId = this.projectTypeTemplateMap[comboKey];

    // Lấy danh sách ID mẫu trùng khớp với Kiểu dự án (ptId) và Phòng ban (deptId)
    const matchingTemplateIds = new Set(
      (this.templates || [])
        .filter(t => t.ProjectTypeID === ptId && (deptId === null || t.DepartmentID === deptId))
        .map(t => t.ID)
    );

    return (this.allGateSteps || []).filter((templateStep: any) => {
      // 1. Bỏ qua các bước đã được chọn trong danh sách (khớp theo ProjectGateStepID, ID hoặc GateCode)
      const isAlreadyAdded = steps.some((s: any) => {
        if (s.isNew) return false;
        const sGateCode = (s.GateCode || '').trim().toUpperCase();
        const tGateCode = (templateStep.GateCode || '').trim().toUpperCase();
        return (
          s.ProjectGateStepID === templateStep.ID ||
          s.ID === templateStep.ID ||
          (sGateCode !== '' && tGateCode !== '' && sGateCode === tGateCode)
        );
      });
      if (isAlreadyAdded) return false;

      // 2. Nếu người dùng chọn một Mẫu công đoạn cụ thể
      if (selectedTemplateId) {
        return templateStep.ProjectGateStepTemplateID === selectedTemplateId;
      }

      // 3. Nếu chưa chọn mẫu cụ thể, lọc các công đoạn thuộc các Mẫu của Kiểu dự án & Phòng ban đó
      if (matchingTemplateIds.size > 0) {
        return matchingTemplateIds.has(templateStep.ProjectGateStepTemplateID);
      }

      // 4. Dự phòng nếu không có Mẫu cấu hình: lọc theo phòng ban
      return deptId === null || (templateStep.DepartmentIDs && templateStep.DepartmentIDs.includes(deptId));
    });
  }

  onNewStepSelect(comboKey: string, item: any, templateStepId: any) {
    if (!templateStepId) return;
    const templateStep = this.allGateSteps.find(s => s.ID === templateStepId);
    if (!templateStep) return;

    // Gán dữ liệu từ mẫu vào dòng
    item.ID = templateStep.ID;
    item.GateCode = templateStep.GateCode;
    item.GateName = templateStep.GateName;
    item.Content = templateStep.Content;
    item.DepartmentNames = templateStep.DepartmentNames;
    item.PositionNames = templateStep.PositionNames;
    item.CheckListNames = templateStep.CheckListNames;
    item.CheckLists = templateStep.CheckLists || [];
    item.Forms = templateStep.Forms || [];
    item.SortOrder = templateStep.SortOrder;
    item.isNew = false;

    item.machineIndex = 1;
    item.isRepeatChecked = false;
    item.repeatOrder = 0;
    item.isRepeated = false;
    item.parentStepId = null;
    item.groupName = this.getGateGroupNameForMachine(templateStep.GateCode, 1);
    item.PeopleCount = null;
    item.DayCount = null;
    item.TotalEffort = 1;
    item.UnitPrice = null;
    item.Workers = [];

    // Tính toán lại thứ tự sắp xếp, số thứ tự và ngày tháng
    this.recalculateSequenceNumbers(comboKey);
  }

  filterWorkersData() {
    let filtered = [...this.usersFlat];
    if (this.workersSearchText) {
      const search = this.workersSearchText.toLowerCase();
      filtered = filtered.filter(u =>
        (u.Code && u.Code.toLowerCase().includes(search)) ||
        (u.FullName && u.FullName.toLowerCase().includes(search)) ||
        (u.DepartmentName && u.DepartmentName.toLowerCase().includes(search))
      );
    }

    if (this.activeManpowerItem && this.activeManpowerItem.Workers) {
      const selectedWorkers = new Set(this.activeManpowerItem.Workers);
      filtered.sort((a, b) => {
        const aSelected = selectedWorkers.has(a.EmployeeID) ? 1 : 0;
        const bSelected = selectedWorkers.has(b.EmployeeID) ? 1 : 0;
        return bSelected - aSelected;
      });
    }

    this.workersFilteredData = filtered;
  }

  isWorkerSelected(worker: any): boolean {
    if (!this.activeManpowerItem || !this.activeManpowerItem.Workers) return false;
    return this.activeManpowerItem.Workers.includes(worker.EmployeeID);
  }

  toggleWorkerSelection(worker: any) {
    if (!this.activeManpowerItem) return;
    if (!this.activeManpowerItem.Workers) {
      this.activeManpowerItem.Workers = [];
    }
    const idx = this.activeManpowerItem.Workers.indexOf(worker.EmployeeID);
    if (idx > -1) {
      this.activeManpowerItem.Workers.splice(idx, 1);
    } else {
      this.activeManpowerItem.Workers.push(worker.EmployeeID);
    }
    this.activeManpowerItem.Workers = [...this.activeManpowerItem.Workers];
    this.onWorkersChange(this.activeManpowerItem);
  }

  toggleAllWorkers() {
    if (!this.activeManpowerItem) return;
    if (this.workersFilteredData.length === 0) return;

    const allSelected = this.workersFilteredData.every(w => this.isWorkerSelected(w));

    if (allSelected) {
      this.activeManpowerItem.Workers = (this.activeManpowerItem.Workers || []).filter(
        (id: any) => !this.workersFilteredData.find(w => w.EmployeeID === id)
      );
    } else {
      const currentIds = this.activeManpowerItem.Workers || [];
      const newIds = this.workersFilteredData.map(w => w.EmployeeID).filter(id => !currentIds.includes(id));
      this.activeManpowerItem.Workers = [...currentIds, ...newIds];
    }
    this.onWorkersChange(this.activeManpowerItem);
  }

  clearWorkerSelection() {
    if (this.activeManpowerItem) {
      this.activeManpowerItem.Workers = [];
      this.onWorkersChange(this.activeManpowerItem);
    }
  }

  onGateStepValueChange_OLD(item: any) {
    if (item.PeopleCount != null && item.DayCount != null) {
      item.TotalEffort = item.PeopleCount * item.DayCount;
    }

    // Tự động tính lại Ngày kết thúc khi số ngày hoặc ngày bắt đầu thay đổi
    this.calculateDateEnd(item);

    // Tự động tính tổng số ngày fill vào công đoạn cha khi chỉnh sửa số ngày ở công đoạn con
    if (item && (item.ParentID || item.isSubStep)) {
      const comboKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
      const steps = this.projectTypeStepsMap[comboKey] || [];
      const parentId = item.ParentID || item.parentLinkId;
      const parent = steps.find((s: any) => s.ID === parentId || s.ProjectGateStepLinkID === parentId);
      if (parent) {
        const parentRealId = parent.ID || parent.ProjectGateStepLinkID;
        const children = steps.filter((s: any) => s.ParentID === parentRealId || s.parentLinkId === parentRealId || s.isSubStep);
        const sumDays = children.reduce((acc: number, c: any) => acc + (Number(c.DayCount) || 0), 0);
        parent.DayCount = sumDays;
        this.calculateDateEnd(parent);
        if (parent.PeopleCount != null) {
          parent.TotalEffort = parent.PeopleCount * parent.DayCount;
        }
      }
    }
  }
  onGateStepValueChange(item: any) {
    if (item.PeopleCount != null && item.DayCount != null) {
      item.TotalEffort = item.PeopleCount * item.DayCount;
    }

    const comboKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;

    // Tự động tính lại Ngày kết thúc khi số ngày hoặc ngày bắt đầu thay đổi nếu dòng này KHÔNG phải là công đoạn cha có con
    if (!this.hasChildrenStep(item, comboKey)) {
      this.calculateDateEnd(item);
    }

    // Tự động tính tổng số ngày fill vào công đoạn cha khi chỉnh sửa ở công đoạn con
    if (item && (item.ParentID || item.isSubStep || item.parentLinkId)) {
      const parent = this.getParentStep(item, comboKey);
      if (parent) {
        this.updateParentDayCount(parent, comboKey);
      }
    }
  }
  onWorkersChange(item: any) {
    item.PeopleCount = item.Workers ? item.Workers.length : 0;
    this.onGateStepValueChange(item);
  }

  buildSavePayload(): any {
    let allSteps: any[] = [];
    Object.keys(this.projectTypeStepsMap).forEach(key => {
      const parts = key.split('_');
      const typeId = Number(parts[0]);
      const deptId = parts[1] === 'null' ? null : Number(parts[1]);
      const templateId = this.projectTypeTemplateMap[key] ?? null;

      let steps = (this.projectTypeStepsMap as any)[key]
        .filter((s: any) => !s.isNew)
        .map((s: any) => {
          return {
            ID: s.ID || s.ProjectGateStepLinkID || 0,
            ProjectGateStepID: s.ProjectGateStepID || (s.isRepeated ? s.parentStepId : s.ID),
            ProjectTypeID: s.ProjectTypeID || (typeId > 0 ? typeId : this.activeProjectTypeId),
            StartDate: s.StartDate,
            DateEnd: s.DateEnd || null,
            IsRepeat: s.isRepeated ? true : false,
            Content: s.Content,
            ActualContent: s.ActualContent || '',
            DayCount: s.DayCount,
            PeopleCount: s.PeopleCount,
            DepartmentID: s.DepartmentID !== undefined && s.DepartmentID !== null ? s.DepartmentID : deptId,
            ProjectGateStepTemplateID: templateId,
            ParentID: s.ParentID || s.parentLinkId || null,
            Workers: (s.Workers || []).map((wId: any) => {
              return {
                EmployeeID: wId,
                DayCount: s.DayCount || 0,
                UnitPrice: s.UnitPrice || 0,
                TotalAmount: (s.DayCount || 0) * (s.UnitPrice || 0)
              };
            }),
            CheckLists: (s.CheckLists || [])
              .filter((c: any) => (c.Type === 'File_Path' || c.type === 'File_Path') && c.PathFolder && c.PathFolder.trim() !== '')
              .map((c: any) => {
                return {
                  ProjectGateStepCheckListID: c.ID,
                  PathFolder: c.PathFolder || '',
                  IsPass: c.IsPass || false
                };
              })
          };
        });
      allSteps = allSteps.concat(steps);
    });

    return {
      ProjectID: this.projectId,
      Steps: allSteps
    };
  }

  addSubStep(comboKey: string, parentItem: any): void {
    if (!this.hasEditPermission) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền thực hiện thao tác này (cần quyền N1 hoặc N109)!', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }
    if (!this.projectTypeStepsMap[comboKey]) {
      this.projectTypeStepsMap[comboKey] = [];
    }

    const steps = this.projectTypeStepsMap[comboKey];
    const parentIndex = steps.findIndex((s: any) => s === parentItem || s.ID === parentItem.ID || (s.ProjectGateStepLinkID && s.ProjectGateStepLinkID === parentItem.ProjectGateStepLinkID));

    const parentLinkId = parentItem.ID || parentItem.ProjectGateStepLinkID;
    const cleanGateName = (parentItem.GateName || '').replace(/\s*\(Con\)+$/gi, '').trim();

    const subStep = {
      ID: this.generateDraftId(),
      ProjectGateStepID: parentItem.ProjectGateStepID,
      ProjectTypeID: parentItem.ProjectTypeID,
      DepartmentID: parentItem.DepartmentID,
      ParentID: parentLinkId,
      parentStepId: parentItem.ProjectGateStepID,
      parentLinkId: parentLinkId,
      isSubStep: true,
      isNew: false,
      isSubStepDraft: true,
      Content: '',
      ActualContent: '',
      GateCode: parentItem.GateCode,
      GateName: cleanGateName,
      groupName: parentItem.groupName,
      machineIndex: parentItem.machineIndex || 1,
      ProjectGateStepTemplateID: parentItem.ProjectGateStepTemplateID,
      StartDate: parentItem.StartDate,
      PeopleCount: 1,
      DayCount: 1,
      UnitPrice: parentItem.UnitPrice || 0,
      TotalEffort: 1,
      TotalAmount: parentItem.UnitPrice || 0,
      Workers: parentItem.Workers ? [...parentItem.Workers] : [],
      CheckLists: [],
      Forms: []
    };

    if (parentIndex !== -1) {
      // Chèn sau tất cả các dòng con hiện có của cùng dòng cha
      let insertIndex = parentIndex + 1;
      while (
        insertIndex < steps.length &&
        (steps[insertIndex].ParentID === parentLinkId ||
          steps[insertIndex].parentLinkId === parentLinkId ||
          steps[insertIndex].isSubStep)
      ) {
        if (steps[insertIndex].ParentID === parentLinkId || steps[insertIndex].parentLinkId === parentLinkId) {
          insertIndex++;
        } else {
          break;
        }
      }
      steps.splice(insertIndex, 0, subStep);
    } else {
      steps.push(subStep);
    }

    this.projectTypeStepsMap[comboKey] = [...steps];
    this.recalculateSequenceNumbers(comboKey);
  }

  selectedStepInTable: any = null;

  selectStepRow(item: any): void {
    if (this.selectedStepInTable === item) {
      this.selectedStepInTable = null;
    } else {
      this.selectedStepInTable = item;
    }
  }

  isStepRowSelected(item: any): boolean {
    return this.selectedStepInTable === item;
  }

  addSelectedSubStep(comboKey: string): void {
    if (!this.hasEditPermission) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền thực hiện thao tác này (cần quyền N1 hoặc N109)!', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }
    if (!this.selectedStepInTable) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 công đoạn gốc (công đoạn cha) trong bảng trước khi bấm Thêm con.',
        { nzStyle: { fontSize: '12px' } }
      );
      return;
    }

    if (this.selectedStepInTable.ParentID || this.selectedStepInTable.isSubStep) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Chỉ được tạo công đoạn con cho các công đoạn chính (level gốc)!',
        { nzStyle: { fontSize: '12px' } }
      );
      return;
    }

    this.addSubStep(comboKey, this.selectedStepInTable);
  }

  save(closeAfterSave: boolean = false) {
    if (!this.hasEditPermission) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền thực hiện thao tác này (cần quyền N1 hoặc N109)!', {
        nzStyle: { fontSize: '12px' }
      });
      return;
    }
    this.isSaving = true;
    const payload = this.buildSavePayload();

    this.projectGateStepService.saveGateStepLink(payload).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (res: any) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thông tin nhân công dự án thành công!', {
          nzStyle: { fontSize: '12px' }
        });
        if (closeAfterSave) {
          this.closeModal();
        } else {
          this.reloadGateSteps();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  reloadGateSteps(): void {
    this.isLoading = true;
    this.getProjectTypeLinks();
    this.projectGateStepService.getByProject(this.projectId).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res: any) => {
        this.savedGateSteps = res.data || [];
        this.projectTypeStepsMap = {};
        this.updateTabsSteps();
        this.buildSummaryData();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  openDeletedStepsModal() {
    this.showDeletedModal = true;
    this.getDeletedSteps();
  }

  closeDeletedStepsModal() {
    this.showDeletedModal = false;
  }

  getProjectTypeName(projectTypeId: number | null | undefined): string {
    if (!projectTypeId) return '';
    const pt = this.checkedProjectTypes.find(x => x.ID === projectTypeId);
    if (pt) {
      return pt.ProjectTypeName || '';
    }
    return this.findProjectTypeNameInNodes(this.projectTypeNodes, projectTypeId);
  }

  private findProjectTypeNameInNodes(nodes: TreeNode[], id: number): string {
    for (const node of nodes) {
      if (node.data && node.data.ID === id) {
        return node.data.ProjectTypeName || '';
      }
      if (node.children && node.children.length > 0) {
        const name = this.findProjectTypeNameInNodes(node.children, id);
        if (name) return name;
      }
    }
    return '';
  }

  loadTemplates() {
    this.projectGateStepService.getProduce().subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.templates = res.data.templates || [];
          this.gateList = res.data.gates || [];
          Object.keys(this.projectTypeStepsMap).forEach(key => {
            this.recalculateSequenceNumbers(key);
          });
          this.buildSummaryData();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  selectSummaryView(): void {
    if (
      this.activeProjectTypeId !== null &&
      this.activeDepartmentId !== undefined
    ) {
      const prevKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
      if (this.projectTypeStepsMap[prevKey]) {
        this.projectTypeStepsMap[prevKey] = this.projectTypeStepsMap[prevKey].filter((s: any) => !s.isNew);
      }
      if (this.hasNoSavedSteps(this.activeProjectTypeId, this.activeDepartmentId)) {
        this.projectTypeStepsMap[prevKey] = [];
        this.projectTypeTemplateMap[prevKey] = null;
      }
    }

    this.isSummaryActive = true;
    this.isIssueLogActive = false;
    this.isMasterPlanActive = false;
    this.activeProjectTypeId = null;
    this.activeDepartmentId = null;
    this.updateMenuItems();
    this.buildSummaryData();
  }

  // ========== ISSUE LOG LOGIC (PrimeNG Table) ==========
  selectIssueLogView(): void {
    if (
      this.activeProjectTypeId !== null &&
      this.activeDepartmentId !== undefined
    ) {
      const prevKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
      if (this.projectTypeStepsMap[prevKey]) {
        this.projectTypeStepsMap[prevKey] = this.projectTypeStepsMap[prevKey].filter((s: any) => !s.isNew);
      }
      if (this.hasNoSavedSteps(this.activeProjectTypeId, this.activeDepartmentId)) {
        this.projectTypeStepsMap[prevKey] = [];
        this.projectTypeTemplateMap[prevKey] = null;
      }
    }

    this.isSummaryActive = false;
    this.isIssueLogActive = true;
    this.isMasterPlanActive = false;
    this.activeProjectTypeId = null;
    this.activeDepartmentId = null;
    this.selectedHistoryRow = null;
    this.updateMenuItems();
    this.loadProjectInfoHistory();
    this.loadDataHistoryProblem();
  }

  // ========== MASTER PLAN LOGIC (Gantt Timeline View) ==========
  isMasterPlanActive: boolean = false;
  mpInitialized: boolean = false;
  mpDateStart: string = this.getDefaultDateStart();
  mpDateEnd: string = this.getDefaultDateEnd();
  mpDepartmentId: number = 0;
  mpTeamId: number = 0;
  mpUserId: number = 0;

  mpDepartmentList: any[] = [];
  mpTeamList: any[] = [];
  mpUserList: any[] = [];

  mpLoading = signal(false);
  mpDateColumns: any[] = [];
  mpGroupedData: any[] = [];
  mpFilteredData = signal<any[]>([]);
  mpVisibleData = signal<any[]>([]);
  mpDayOffSet = new Set<string>();
  mpAllStatuses: any[] = [];
  private mpStatusMap = new Map<string, any>();
  mpTotalTaskCount = signal(0);

  mpFilterEmployeeColumn: number[] = [];
  mpFilterTeamColumn: string[] = [];
  mpFilterTaskKeyword = '';
  mpFilterProjectKeyword = '';
  mpSelectedStatuses: number[] = [0, 1];
  mpFilterStatusColumn: number[] = [];

  mpStatusOptions: any[] = [];
  mpStatusType1Options: any[] = [];
  mpStatusType2Options: any[] = [];
  mpColumnStatusOptions: any[] = [];
  mpEmployeeColumnOptions: any[] = [];
  mpTeamColumnOptions: any[] = [];

  private mpCHUNK_SIZE = 20;
  private mpCurrentVisibleCount = 20;

  mpContextMenuVisible = false;
  mpContextMenuX = 0;
  mpContextMenuY = 0;
  mpContextMenuFocusTaskId: number = 0;
  mpContextMenuProject: any = null;

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.formatDateForInput(firstDay);
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return this.formatDateForInput(lastDay);
  }

  selectMasterPlanView(): void {
    if (
      this.activeProjectTypeId !== null &&
      this.activeDepartmentId !== undefined
    ) {
      const prevKey = `${this.activeProjectTypeId}_${this.activeDepartmentId}`;
      if (this.projectTypeStepsMap[prevKey]) {
        this.projectTypeStepsMap[prevKey] = this.projectTypeStepsMap[prevKey].filter((s: any) => !s.isNew);
      }
      if (this.hasNoSavedSteps(this.activeProjectTypeId, this.activeDepartmentId)) {
        this.projectTypeStepsMap[prevKey] = [];
        this.projectTypeTemplateMap[prevKey] = null;
      }
    }

    this.isSummaryActive = false;
    this.isIssueLogActive = false;
    this.isMasterPlanActive = true;
    this.activeProjectTypeId = null;
    this.activeDepartmentId = null;
    this.updateMenuItems();
    this.loadMasterPlanDropdownsAndInit();
  }

  loadMasterPlanDropdownsAndInit(): void {
    if (!this.mpInitialized) {
      this.mpInitialized = true;
      this.loadMpProjectTaskStatuses();
    } else {
      this.loadMasterPlanTimeline();
    }
  }

  loadMpDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.mpDepartmentList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading departments for Master Plan:', err)
    });
  }

  loadMpTeamsByDepartment(deptId: number): void {
    this.workplanService.getTeamByDepartmentId(deptId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.mpTeamList = (Array.isArray(res.data) ? res.data : []).filter((x: any) => !x.IsDeleted);
        } else {
          this.mpTeamList = [];
        }
      },
      error: () => { this.mpTeamList = []; }
    });
  }

  loadMpEmployees(): void {
    this.employeeService.filterEmployee(0, this.mpDepartmentId, '').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.mpUserList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.mpUserList = [];
        }
      },
      error: () => { this.mpUserList = []; }
    });
  }

  loadMpEmployeesByTeam(teamId: number): void {
    this.projectService.getEmployeeByUserTeam(teamId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.mpUserList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.mpUserList = [];
        }
      },
      error: () => { this.mpUserList = []; }
    });
  }

  loadMpProjectTaskStatuses(): void {
    this.timelineTotalService.getProjectTaskStatuses().subscribe({
      next: (statuses) => {
        this.mpAllStatuses = statuses;
        this.mpStatusMap.clear();
        statuses.forEach((s: any) => {
          this.mpStatusMap.set(`${s.Type}_${s.No}`, s);
        });
        const type1Statuses = statuses.filter((s: any) => s.Type === 1);
        const type2Statuses = statuses.filter((s: any) => s.Type === 2);

        this.mpStatusOptions = type1Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: s.No
        }));

        this.mpStatusType1Options = type1Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: `1_${s.No}`
        }));
        this.mpStatusType2Options = type2Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: `2_${s.No}`
        }));

        this.mpColumnStatusOptions = [...this.mpStatusOptions];
        const overdueValueByNo: Record<number, number> = { 0: 10, 1: 11, 2: 21 };
        type1Statuses.forEach((s: any) => {
          const overdueValue = overdueValueByNo[s.No];
          if (overdueValue === undefined) return;
          this.mpColumnStatusOptions.push({
            label: `${s.Description || s.Title} quá hạn`,
            value: overdueValue
          });
        });
        type2Statuses.forEach((s: any) => {
          const customValue = s.No === 1 ? 22 : 23;
          this.mpColumnStatusOptions.push({
            label: s.Description || s.Title,
            value: customValue
          });
        });

        this.loadMasterPlanTimeline();
      },
      error: (err) => console.error('Error loading project task statuses:', err)
    });
  }

  onMpDepartmentChange(): void {
    this.mpTeamId = 0;
    this.mpUserId = 0;
    this.mpTeamList = [];
    this.loadMpEmployees();
    this.loadMpTeamsByDepartment(this.mpDepartmentId || 0);
    this.loadMasterPlanTimeline();
  }

  onMpTeamChange(): void {
    this.mpUserId = 0;
    if (this.mpTeamId > 0) {
      this.loadMpEmployeesByTeam(this.mpTeamId);
    } else {
      this.loadMpEmployees();
    }
    this.loadMasterPlanTimeline();
  }

  resetMasterPlanSearch(): void {
    this.mpDateStart = this.getDefaultDateStart();
    this.mpDateEnd = this.getDefaultDateEnd();
    this.mpSelectedStatuses = [0, 1];
    this.mpFilterEmployeeColumn = [];
    this.mpFilterTeamColumn = [];
    this.mpFilterTaskKeyword = '';
    this.mpFilterProjectKeyword = '';
    this.mpFilterStatusColumn = [];
    this.loadMasterPlanTimeline();
  }

  loadMasterPlanTimeline(): void {
    if (!this.mpDateStart || !this.mpDateEnd || !this.projectId) return;

    this.mpLoading.set(true);

    setTimeout(() => {
      const startDate = new Date(this.mpDateStart);
      const endDate = new Date(this.mpDateEnd);

      let statusStr = '';
      if (this.mpSelectedStatuses.length === 0 || this.mpSelectedStatuses.length === this.mpStatusOptions.length) {
        statusStr = '-1';
      } else {
        statusStr = this.mpSelectedStatuses.join(',');
      }

      forkJoin({
        timelineData: this.projectGateStepService.getTimelineByProject({
          dateStart: this.mpDateStart,
          dateEnd: this.mpDateEnd,
          projectID: this.projectId,
          status: statusStr,
          typeSearch: 1
        }),
        dayOffData: this.timelineTotalService.getProjectTaskGetDayOff(this.mpDateStart, this.mpDateEnd)
      }).subscribe({
        next: ({ timelineData, dayOffData }) => {
          setTimeout(() => {
            this.mpDayOffSet = new Set(dayOffData);
            this.generateMasterPlanDateColumns(startDate, endDate);
            this.transformMasterPlanData(timelineData);
            this.applyMasterPlanFilters();
            this.mpLoading.set(false);
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          console.error('Error loading master plan timeline:', err);
          this.mpLoading.set(false);
          this.message.error('Không thể tải dữ liệu Master Plan timeline');
          this.cdr.detectChanges();
        }
      });
    }, 50);
  }

  generateMasterPlanDateColumns(start: Date, end: Date) {
    const dates: any[] = [];
    let current = new Date(start);
    const todayStr = this.formatDate(new Date());
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      const isDayOff = this.mpDayOffSet.has(dateStr);
      dates.push({
        fullDate: d,
        dateStr: dateStr,
        dayName: this.getDayShortName(d),
        dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isToday: dateStr === todayStr,
        isDayOff: isDayOff
      });
      current.setDate(current.getDate() + 1);
    }
    this.mpDateColumns = dates;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatMpDate(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDayShortName(date: Date): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  }

  trackByGate(index: number, item: any): any {
    return item.GateCode || index;
  }

  transformMasterPlanData(raw: TimelineByTeamItem[]) {
    const gatesMap = new Map<string, any>();

    raw.forEach(item => {
      const gateCode = (item as any).GateCode || 'Khác';
      const gateStt = (item as any).STTGate ?? 999;
      const taskKey = `${item.ProjectTaskID}_${item.ID}`;

      if (!gatesMap.has(gateCode)) {
        gatesMap.set(gateCode, {
          GateCode: gateCode,
          STTGate: gateStt,
          tasksMap: new Map<string, any>()
        });
      }

      const gateRecord = gatesMap.get(gateCode);

      if (!gateRecord.tasksMap.has(taskKey)) {
        gateRecord.tasksMap.set(taskKey, {
          ProjectTaskID: item.ProjectTaskID,
          ProjectTaskCode: item.ProjectTaskCode || '',
          ProjectTaskTitle: item.ProjectTaskTitle || '',
          ProjectTaskParentID: item.ProjectTaskParentID,
          ProjectTaskParentCode: item.ProjectTaskParentCode || '',
          ProjectTaskParentTitle: item.ProjectTaskParentTitle || '',
          ProjectID: item.ProjectID,
          ProjectCode: item.ProjectCode || '',
          ProjectName: item.ProjectName || '',
          FullName: item.FullName || '',
          TeamName: item.TeamName || '',
          employeeId: item.ID,
          GateCode: gateCode,
          STTGate: gateStt,
          PlanStartDate: item.PlanStartDate || item['StartDate'],
          Status: item.Status,
          IsApproved: item['IsApprove'] !== undefined && item['IsApprove'] !== null ? item['IsApprove'] : null,
          isOverdue: this.isTaskOverdue(item),
          StatusName: '',
          planned: null,
          actual: null
        });
        gateRecord.tasksMap.get(taskKey).StatusName = this.getStatusDisplayName(gateRecord.tasksMap.get(taskKey));
      }

      const taskEntry = gateRecord.tasksMap.get(taskKey);
      if (item.TypeDate === 1) taskEntry.planned = item;
      else if (item.TypeDate === 2) taskEntry.actual = item;
    });

    const helperGetTime = (item: any): number => {
      const dStr = item.PlanStartDate || item['StartDate'] || (item.planned && (item.planned.PlanStartDate || item.planned['StartDate']));
      if (!dStr) return 9999999999999;
      const t = new Date(dStr).getTime();
      return isNaN(t) ? 9999999999999 : t;
    };

    this.mpGroupedData = Array.from(gatesMap.values())
      .sort((g1: any, g2: any) => {
        if (g1.STTGate !== g2.STTGate) return g1.STTGate - g2.STTGate;
        return g1.GateCode.localeCompare(g2.GateCode, 'vi');
      })
      .map(gt => {
        const tasks = Array.from(gt.tasksMap.values())
          .sort((t1: any, t2: any) => {
            const time1 = helperGetTime(t1);
            const time2 = helperGetTime(t2);
            if (time1 !== time2) return time1 - time2;
            return (t1.ProjectTaskCode || '').localeCompare(t2.ProjectTaskCode || '', 'vi');
          })
          .map((t: any) => ({
            ...t,
            _statusStyle: this.getStatusStyle(t),
            rows: [
              t.planned || { TypeDate: 1 },
              t.actual || { TypeDate: 2 }
            ]
          }));

        return {
          GateCode: gt.GateCode,
          STTGate: gt.STTGate,
          tasks: tasks
        };
      });

    this.preComputeMasterPlanCellData();

    const allEmployees = new Map<number, string>();
    const allTeams = new Set<string>();

    raw.forEach(item => {
      if (item.ID && item.FullName) {
        allEmployees.set(item.ID, item.FullName);
      }
      if (item.TeamName) {
        allTeams.add(item.TeamName);
      }
    });

    this.mpEmployeeColumnOptions = Array.from(allEmployees.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    this.mpTeamColumnOptions = Array.from(allTeams)
      .map(t => ({ value: t, label: t }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }

  private preComputeMasterPlanCellData(): void {
    const dateStrs = this.mpDateColumns.map(c => c.dateStr);
    for (const gate of this.mpGroupedData) {
      for (const task of gate.tasks) {
        for (const row of task.rows) {
          const cellData: Record<string, any> = {};
          const isPlanned = row.TypeDate === 1;
          const isActual = row.TypeDate === 2;

          for (const dateStr of dateStrs) {
            const cell: any = {};

            if (isPlanned) {
              const val = row[dateStr]?.toString() || '0';
              cell.isPlannedFilled = val === '10' || val === '11' || val === '30' || val === '31';
              cell.isOutsideWork = val === '11' || val === '31';
              cell.hasCheckMark = val === '2' || val === '30' || val === '31';
            }

            if (isActual) {
              const raw = row[dateStr];
              let hours = 0, isOutside = 0, leaveTime = 0, leaveType = 0;
              if (raw != null && raw !== '') {
                const rawStr = raw.toString();
                if (rawStr.includes('|')) {
                  const parts = rawStr.split('|');
                  hours = parseFloat(parts[0]) || 0;
                  isOutside = parseInt(parts[1], 10) || 0;
                  leaveTime = parseInt(parts[2], 10) || 0;
                  leaveType = parseInt(parts[3], 10) || 0;
                } else {
                  hours = parseFloat(rawStr) || 0;
                }
              }
              cell.actualHours = hours;
              cell.actualIsOutside = isOutside;
              cell.isFilledActual = hours > 0 && isOutside === 0;
              cell.isFilledActualOutside = hours > 0 && isOutside === 1;
              cell.leaveTime = leaveTime;
              cell.leaveType = leaveType;
              cell.hasLeave = leaveTime > 0 && leaveType > 0;
              if (cell.hasLeave) {
                cell.leaveLabel = this.getLeaveLabel(leaveType, leaveTime);
                cell.tooltip = this.getLeaveTooltip(leaveTime, leaveType);
              } else {
                cell.tooltip = null;
              }
            }

            cellData[dateStr] = cell;
          }
          row._cellData = cellData;
        }
      }
    }
  }

  applyMasterPlanFilters() {
    let gates = this.mpGroupedData.map(gt => ({
      ...gt,
      tasks: [...gt.tasks]
    }));

    if (this.mpFilterEmployeeColumn && this.mpFilterEmployeeColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => this.mpFilterEmployeeColumn.includes(t.employeeId))
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterTeamColumn && this.mpFilterTeamColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => this.mpFilterTeamColumn.includes(t.TeamName))
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterProjectKeyword) {
      const fpk = this.mpFilterProjectKeyword.toLowerCase();
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) =>
          (t.ProjectCode || '').toLowerCase().includes(fpk) ||
          (t.ProjectName || '').toLowerCase().includes(fpk)
        )
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterTaskKeyword) {
      const fk = this.mpFilterTaskKeyword.toLowerCase();
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) =>
          (t.ProjectTaskCode || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskTitle || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskParentCode || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskParentTitle || '').toLowerCase().includes(fk) ||
          (t.GateCode || '').toLowerCase().includes(fk)
        )
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterStatusColumn && this.mpFilterStatusColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => {
          if (this.mpFilterStatusColumn.includes(t.Status)) return true;

          if (t.isOverdue) {
            if (this.mpFilterStatusColumn.includes(10) && t.Status === 0) return true;
            if (this.mpFilterStatusColumn.includes(11) && t.Status === 1) return true;
            if (this.mpFilterStatusColumn.includes(21) && t.Status === 2) return true;
          }

          const approved = t.IsApproved;
          const isApproveValue = approved === 1 || approved === true || approved === '1';
          const isRejectValue = approved === 0 || approved === false || approved === '0';

          if (this.mpFilterStatusColumn.includes(22) && isApproveValue) return true;
          if (this.mpFilterStatusColumn.includes(23) && isRejectValue) return true;

          return false;
        })
      })).filter(gt => gt.tasks.length > 0);
    }

    let totalTasks = 0;
    let globalTaskIndex = 1;
    gates.forEach(gt => {
      gt._rowspan = gt.tasks.length * 2;
      gt.tasks.forEach((t: any) => {
        t.globalIndex = globalTaskIndex++;
      });
      totalTasks += gt.tasks.length;
    });

    this.mpTotalTaskCount.set(totalTasks);
    this.mpFilteredData.set(gates);

    this.mpCurrentVisibleCount = this.mpCHUNK_SIZE;
    this.updateMasterPlanVisibleData();
  }

  private updateMasterPlanVisibleData() {
    this.mpVisibleData.set(this.mpFilteredData().slice(0, this.mpCurrentVisibleCount));
  }

  onMasterPlanScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
      if (this.mpCurrentVisibleCount < this.mpFilteredData().length) {
        this.mpCurrentVisibleCount += this.mpCHUNK_SIZE;
        this.updateMasterPlanVisibleData();
      }
    }
  }

  onMpColumnFilter() {
    this.applyMasterPlanFilters();
  }

  getLeaveLabel(leaveType: number, leaveTime: number): string {
    const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
    const timeMap: Record<number, string> = { 1: 'S', 2: 'C' };
    const typePart = typeMap[leaveType] || '';
    if (!typePart) return '';
    const timePart = timeMap[leaveTime] || '';
    return timePart ? `${typePart}/${timePart}` : typePart;
  }

  getLeaveTooltip(leaveTime: number, leaveType: number): string {
    const timeMap: Record<number, string> = { 1: 'Buổi sáng', 2: 'Buổi chiều', 3: 'Cả ngày' };
    const typeMap: Record<number, string> = { 1: 'Nghỉ không lương (Ro)', 2: 'Nghỉ phép (P)', 3: 'Việc riêng có lương (R)' };
    const parts = [];
    if (timeMap[leaveTime]) parts.push(timeMap[leaveTime]);
    if (typeMap[leaveType]) parts.push(typeMap[leaveType]);
    return parts.join(' – ');
  }

  private isTaskOverdue(task: any): boolean {
    const approved = task.IsApproved ?? task.IsApprove;
    if (approved === 1 || approved === true || approved === '1') {
      return false;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (planEnd) planEnd.setHours(0, 0, 0, 0);

    const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    if (task.Status === 2) {
      return !!(dueDate && planEnd && dueDate > planEnd);
    }

    if (task.Status === 0 || task.Status === 1) {
      return !!(planEnd && planEnd < now);
    }

    return false;
  }

  getTaskStatusConfig(task: any): any {
    const approved = task.IsApproved ?? task.IsApprove;
    if (approved === 0 || approved === false || approved === '0') {
      return this.mpStatusMap.get('2_0') || this.mpAllStatuses.find(s => s.Type === 2 && s.No === 0);
    } else if (approved === 1 || approved === true || approved === '1') {
      return this.mpStatusMap.get('2_1') || this.mpAllStatuses.find(s => s.Type === 2 && s.No === 1);
    } else {
      return this.mpStatusMap.get(`1_${task.Status}`) || this.mpAllStatuses.find(s => s.Type === 1 && s.No === task.Status);
    }
  }

  getStatusDisplayName(task: any): string {
    const statusConfig = this.getTaskStatusConfig(task);
    const baseName = (statusConfig && statusConfig.Description) || this.getStatusName(task.Status);
    const isOverdue = task.isOverdue ?? this.isTaskOverdue(task);

    if (isOverdue) {
      return baseName + '\nQuá hạn';
    }

    return baseName;
  }

  getStatusStyle(node: any): { [key: string]: string } {
    if (node.isOverdue) {
      return {};
    }
    const statusConfig = this.getTaskStatusConfig(node);
    if (statusConfig) {
      return {
        'background-color': statusConfig.ColorBackground ? statusConfig.ColorBackground.trim() : '#f1f5f9',
        'color': statusConfig.ColorFont ? statusConfig.ColorFont.trim() : '#475569'
      };
    }
    return {};
  }

  getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Chưa làm';
      case 1: return 'Đang làm';
      case 2: return 'Hoàn thành';
      case 3: return 'Pending';
      case 4: return 'Hủy';
      default: return '';
    }
  }

  openMasterPlanTaskDetail(task: any): void {
    const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskId) {
      console.error('Task ID not found', task);
      return;
    }

    const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskId}`;
    const approvalStatus = task?.IsApproved !== undefined && task?.IsApproved !== null ? task.IsApproved : undefined;
    this.tabService.openTabComp({
      comp: ProjectTaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId, ApprovalStatus: approvalStatus }
    });
  }

  onMasterPlanContextMenu(event: MouseEvent, project: any, focusId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.mpContextMenuProject = project;
    this.mpContextMenuFocusTaskId = focusId;
    this.mpContextMenuX = event.clientX;
    this.mpContextMenuY = event.clientY;
    this.mpContextMenuVisible = true;
  }

  closeMasterPlanContextMenu(): void {
    this.mpContextMenuVisible = false;
  }

  openMasterPlanProjectReport(): void {
    this.closeMasterPlanContextMenu();
    const project = this.mpContextMenuProject;
    if (!project?.ProjectID) {
      this.message.warning('Không tìm thấy thông tin dự án');
      return;
    }

    const focusTaskId = this.mpContextMenuFocusTaskId || 0;

    this.tabService.openTabComp({
      comp: ProjectTaskTimeLineAllProjectComponent,
      title: project.ProjectCode || 'Báo cáo DA',
      key: `project-task-all-project-${project.ProjectID}`,
      data: {
        projectId: project.ProjectID,
        projectCode: project.ProjectCode,
        projectName: project.ProjectName,
        focusTaskId: focusTaskId
      }
    });
  }

  async exportMasterPlanToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT', field: 'globalIndex', width: 10, align: 'center' },
      { header: 'Gate', field: 'GateCode', width: 12, align: 'center' },
      { header: 'Người thực hiện', field: 'FullName', width: 25 },
      { header: 'Mã Dự Án', field: 'ProjectCode', width: 15 },
      { header: 'Tên Dự Án', field: 'ProjectName', width: 25 },
      { header: 'Mã Công Việc', field: 'Code', width: 20 },
      { header: 'Tên Công Việc', field: 'Title', width: 40 },
      { header: 'Trạng Thái', field: 'StatusName', width: 15, align: 'center' },
      { header: 'Start', field: 'StartDateDisplay', width: 16, align: 'center' },
      { header: 'Working days', field: 'DurationDays', width: 14, align: 'center' },
      { header: 'Finish', field: 'EndDateDisplay', width: 16, align: 'center' },
      { header: 'Loại', field: 'TypeLabel', width: 12, align: 'center' }
    ];

    this.mpDateColumns.forEach(dateCol => {
      cols.push({
        header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
        field: dateCol.dateStr,
        width: 7.5,
        align: 'center',
        renderValue: (item: any) => {
          if (item.TypeDate === 1 && (item[dateCol.dateStr] === '2' || item[dateCol.dateStr] === '30' || item[dateCol.dateStr] === '31')) {
            return '✔';
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            if (val !== '0') {
              let label = '';
              const act = val.includes('|') ? val.split('|') : [val];
              const hours = parseFloat(act[0]) || 0;
              const leaveTime = act.length > 2 ? parseInt(act[2], 10) || 0 : 0;
              const leaveType = act.length > 3 ? parseInt(act[3], 10) || 0 : 0;
              if (hours > 0) {
                label = hours.toString();
              }
              if (leaveTime > 0 && leaveType > 0) {
                const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
                const timeMap: Record<number, string> = { 1: 'S', 2: 'C' };
                const typePart = typeMap[leaveType] || '';
                if (typePart) {
                  const timePart = timeMap[leaveTime] || '';
                  const leaveLabel = timePart ? `${typePart}/${timePart}` : typePart;
                  label = label ? `${label} (${leaveLabel})` : leaveLabel;
                }
              }
              return label;
            }
          }
          return '';
        },
        cellStyle: (item: any) => {
          if (item.TypeDate === 1 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            const isPlanned = ['10', '11', '30', '31'].includes(val);
            const isOutside = ['11', '31'].includes(val);
            if (isPlanned) {
              const fontStyle = ['2', '30', '31'].includes(val) ? { color: { argb: 'FFFFFFFF' }, bold: true } : undefined;
              if (isOutside) {
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB066' } }, font: fontStyle };
              }
              return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + plannedColor } }, font: fontStyle };
            }
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            if (val !== '0') {
              const act = val.includes('|') ? val.split('|') : [val];
              const hours = parseFloat(act[0]) || 0;
              const isOutside = act.length > 1 ? parseInt(act[1], 10) || 0 : 0;
              if (hours > 0) {
                if (isOutside === 1) {
                  return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } } };
                }
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } };
              }
            }
          }
          if (dateCol.isToday) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } } };
          }
          if (dateCol.isSunday || dateCol.isDayOff) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } };
          }
          return {};
        }
      });
    });

    const flattenedData: any[] = [];
    const mergeRanges: any[] = [];

    this.mpFilteredData().forEach((gate: any) => {
      const gateStartRow = flattenedData.length + 2;

      gate.tasks.forEach((task: any) => {
        const taskStartRow = flattenedData.length + 2;

        const row0 = task.rows[0];
        const row1 = task.rows[1];

        flattenedData.push({
          ...row0,
          globalIndex: task.globalIndex,
          GateCode: gate.GateCode,
          FullName: task.FullName,
          ProjectCode: task.ProjectCode,
          ProjectName: task.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          StartDateDisplay: this.formatMpDate(row0?.PlanStartDate || row0?.StartDate),
          DurationDays: row0?.DurationDays != null ? row0.DurationDays : '',
          EndDateDisplay: this.formatMpDate(row0?.PlanEndDate || row0?.EndDate),
          TypeLabel: 'Dự kiến'
        });

        flattenedData.push({
          ...row1,
          globalIndex: task.globalIndex,
          GateCode: gate.GateCode,
          FullName: task.FullName,
          ProjectCode: task.ProjectCode,
          ProjectName: task.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          StartDateDisplay: this.formatMpDate(row1?.PlanStartDate || row1?.StartDate),
          DurationDays: row1?.DurationDays != null ? row1.DurationDays : '',
          EndDateDisplay: this.formatMpDate(row1?.PlanEndDate || row1?.EndDate),
          TypeLabel: 'Thực tế'
        });

        mergeRanges.push({ s: { r: taskStartRow, c: 1 }, e: { r: taskStartRow + 1, c: 1 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 3 }, e: { r: taskStartRow + 1, c: 3 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 4 }, e: { r: taskStartRow + 1, c: 4 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 6 }, e: { r: taskStartRow + 1, c: 6 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 7 }, e: { r: taskStartRow + 1, c: 7 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 8 }, e: { r: taskStartRow + 1, c: 8 } });
      });

      const gateEndRow = flattenedData.length + 1;
      mergeRanges.push({ s: { r: gateStartRow, c: 2 }, e: { r: gateEndRow, c: 2 } });
    });

    const tempTable = {
      value: flattenedData,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Master Plan Dự Án',
      `MasterPlan_${this.projectCode || this.projectId}`,
      (ws) => {
        mergeRanges.forEach(range => {
          ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
          const cell = ws.getCell(range.s.r, range.s.c);
          cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
        });

        const fixedHeadersLen = 9;
        const todayColIdx = this.mpDateColumns.findIndex((c: any) => c.isToday);
        const excelTodayColNum = todayColIdx >= 0 ? fixedHeadersLen + todayColIdx + 1 : -1;

        ws.eachRow((row: any, rowNumber: number) => {
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
            if (excelTodayColNum > 0) {
              let leftBorder: any = undefined;
              let rightBorder: any = undefined;

              if (colNumber === excelTodayColNum) {
                leftBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
                rightBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              } else if (colNumber === excelTodayColNum + 1) {
                leftBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              } else if (colNumber === excelTodayColNum - 1) {
                rightBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              }

              if (leftBorder || rightBorder) {
                cell.border = {
                  top: cell.border?.top || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  bottom: cell.border?.bottom || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  left: leftBorder || cell.border?.left || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  right: rightBorder || cell.border?.right || { style: 'thin', color: { argb: 'FFD9D9D9' } }
                };
              }
            }

            if (rowNumber === 1 && colNumber > fixedHeadersLen) {
              const dCol = this.mpDateColumns[colNumber - fixedHeadersLen - 1];
              if (dCol) {
                if (dCol.isSunday || dCol.isDayOff) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                  cell.font = { ...cell.font, color: { argb: 'FFE11D48' } };
                } else if (dCol.isToday) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
                }
              }
            }
          });
        });
      }
    );
  }

  trackByGroup(index: number, group: any): any {
    return group.employeeId;
  }

  trackByProject(index: number, project: any): any {
    return project.ProjectID;
  }

  trackByTask(index: number, task: any): any {
    return task.ProjectTaskID;
  }

  trackByRow(index: number, row: any): any {
    return row.TypeDate || index;
  }

  trackByColumn(index: number, col: any): any {
    return col.dateStr;
  }

  loadProjectInfoHistory(): void {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          if (response.status === 1 && response.data) {
            this.projectInfoHistory = response.data;
            this.projectCode = this.projectInfoHistory.ProjectCode || this.projectCode;
          }
        },
        error: (error: any) => {
          console.error('Error loading project info:', error);
        }
      });
    }
  }

  loadDataHistoryProblem(): void {
    if (this.projectId <= 0) {
      this.dataHistory = [];
      this.dataDetail = [];
      return;
    }

    this.isLoadHistory = true;
    this.projectHistoryProblemService.getDataHistoryProblem(this.projectId).subscribe({
      next: (response: any) => {
        this.isLoadHistory = false;
        if (response.status === 1) {
          let responseData = response.data;
          let dtMaster = responseData?.dtMaster;
          if (!dtMaster) {
            this.dataHistory = [];
          } else if (Array.isArray(dtMaster)) {
            this.dataHistory = dtMaster.map((item: any) => this.mapMasterDataToTableHistory(item));
          } else {
            this.dataHistory = [];
          }

          if (this.dataHistory && this.dataHistory.length > 0) {
            this.selectHistoryRow(this.dataHistory[0]);
          } else {
            this.selectedHistoryRow = null;
            this.dataDetail = [];
          }
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Không có dữ liệu lịch sử phát sinh!');
          this.dataHistory = [];
          this.dataDetail = [];
        }
      },
      error: (error: any) => {
        this.isLoadHistory = false;
        console.error('Error loading history problem:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu lịch sử phát sinh!');
        this.dataHistory = [];
        this.dataDetail = [];
      },
    });
  }

  selectHistoryRow(row: any): void {
    this.selectedHistoryRow = row;
    if (row && row.ID > 0) {
      this.loadDetailByHistoryId(row.ID);
    } else {
      this.dataDetail = [];
    }
  }

  loadDetailByHistoryId(historyId: number): void {
    if (!historyId || historyId <= 0) {
      this.dataDetail = [];
      return;
    }

    this.isLoadDetail = true;
    this.projectHistoryProblemService.getDataHistoryProblemDetail(historyId).subscribe({
      next: (response: any) => {
        this.isLoadDetail = false;
        if (response.status === 1) {
          let detailData = response.data;
          if (!detailData) {
            this.dataDetail = [];
          } else if (Array.isArray(detailData)) {
            this.dataDetail = detailData.map((item: any) => ({
              ...item,
              ID: item.ID || 0,
              HistoryID: item.ProjectHistoryProblemID || historyId,
              ProjectHistoryProblemID: item.ProjectHistoryProblemID || historyId,
              STT: item.STT || 1,
              Description: item.Description || '',
              Status: item.Status || null,
              Note: item.Note || '',
              IsDeleted: item.IsDeleted || false
            }));
          } else if (typeof detailData === 'object' && Object.keys(detailData).length > 0) {
            this.dataDetail = [{
              ...detailData,
              ID: detailData.ID || 0,
              HistoryID: detailData.ProjectHistoryProblemID || historyId,
              ProjectHistoryProblemID: detailData.ProjectHistoryProblemID || historyId,
              STT: detailData.STT || 1,
              Description: detailData.Description || '',
              Status: detailData.Status || null,
              Note: detailData.Note || '',
              IsDeleted: detailData.IsDeleted || false
            }];
          } else {
            this.dataDetail = [];
          }
        } else {
          this.dataDetail = [];
        }
      },
      error: (error: any) => {
        this.isLoadDetail = false;
        console.error('Error loading detail:', error);
        this.dataDetail = [];
      },
    });
  }

  mapMasterDataToTableHistory(item: any): any {
    return {
      ID: item.ID || 0,
      STT: item.STT || 1,
      ProblemType: item.TypeProblem || '',
      ErrorContent: item.ContentError || '',
      Reason: item.Reason || '',
      Solution: item.Remedies || '',
      Method: item.TestMethod || '',
      Image: item.Image || '',
      ProblemDate: item.DateProblem ? DateTime.fromISO(item.DateProblem).toFormat('yyyy-MM-dd') : null,
      ExecuteDate: item.DateImplementation ? DateTime.fromISO(item.DateImplementation).toFormat('yyyy-MM-dd') : null,
      PIC: item.PIC || '',
      ProjectID: item.ProjectID || this.projectId,
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
    };
  }

  addHistoryRow(): void {
    this.nextRowIdHistory = this.nextRowIdHistory - 1;
    const maxSTT = this.getMaxSTT(this.dataHistory);

    const newRow = {
      ID: this.nextRowIdHistory,
      STT: maxSTT + 1,
      ProblemType: '',
      ErrorContent: '',
      Reason: '',
      Solution: '',
      Method: '',
      Image: '',
      ProblemDate: null,
      ExecuteDate: null,
      PIC: '',
      IsDeleted: false
    };

    this.dataHistory = [...this.dataHistory, newRow];
    this.selectHistoryRow(newRow);
  }

  deleteHistoryRow(row: any, event?: Event): void {
    if (event) event.stopPropagation();

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng lịch sử phát sinh này?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        if (row.ID > 0) {
          this.deletedIdsHistory.push(row.ID);
        }
        this.dataHistory = this.dataHistory.filter(item => item !== row);
        this.updateSTT(this.dataHistory);

        if (this.selectedHistoryRow === row) {
          if (this.dataHistory.length > 0) {
            this.selectHistoryRow(this.dataHistory[0]);
          } else {
            this.selectedHistoryRow = null;
            this.dataDetail = [];
          }
        }
      }
    });
  }

  addDetailRow(): void {
    if (!this.selectedHistoryRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng từ bảng lịch sử phát sinh trước!');
      return;
    }

    if (!this.selectedHistoryRow.ID || this.selectedHistoryRow.ID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu dòng lịch sử phát sinh trước khi thêm chi tiết!');
      return;
    }

    this.nextRowIdDetail = this.nextRowIdDetail - 1;
    const maxSTT = this.getMaxSTT(this.dataDetail);

    const newRow = {
      ID: this.nextRowIdDetail,
      HistoryID: this.selectedHistoryRow.ID || 0,
      ProjectHistoryProblemID: this.selectedHistoryRow.ID || 0,
      STT: maxSTT + 1,
      Description: '',
      Status: null,
      Note: '',
      IsDeleted: false
    };

    this.dataDetail = [...this.dataDetail, newRow];
  }

  deleteDetailRow(row: any, event?: Event): void {
    if (event) event.stopPropagation();

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng chi tiết này?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        if (row.ID > 0) {
          this.deletedIdsDetail.push(row.ID);
          const historyId = row.HistoryID || row.ProjectHistoryProblemID || 0;
          this.deletedDetailHistoryIdMap.set(row.ID, historyId);
        }
        this.dataDetail = this.dataDetail.filter(item => item !== row);
        this.updateSTT(this.dataDetail);
      }
    });
  }

  getMaxSTT(data: any[]): number {
    if (!data || data.length === 0) return 0;
    const sttValues = data
      .map((item: any) => parseInt(item.STT, 10))
      .filter((stt: number) => !isNaN(stt) && stt > 0);
    return sttValues.length > 0 ? Math.max(...sttValues) : 0;
  }

  updateSTT(data: any[]): void {
    if (!data) return;
    data.forEach((item: any, index: number) => {
      item.STT = index + 1;
    });
  }

  formatDateInput(dateVal: any): string {
    if (!dateVal) return '';
    const str = dateVal.toString().trim();
    if (str.length >= 10 && str.includes('-')) {
      const parts = str.substring(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    if (dateVal instanceof Date) {
      return DateTime.fromJSDate(dateVal).toFormat('dd/MM/yyyy');
    }
    return str;
  }

  validateDataHistory(historyData: any[]): { isValid: boolean; message: string } {
    for (let i = 0; i < historyData.length; i++) {
      const item = historyData[i];
      const rowNumber = i + 1;

      if (!item.ProblemType || item.ProblemType.trim() === '') {
        return {
          isValid: false,
          message: `Vui lòng nhập Loại cho dòng thứ [${rowNumber}]`
        };
      }

      if (!item.ErrorContent || item.ErrorContent.trim() === '') {
        return {
          isValid: false,
          message: `Vui lòng nhập Nội dung cho dòng thứ [${rowNumber}]`
        };
      }

      if (!item.Reason || item.Reason.trim() === '') {
        return {
          isValid: false,
          message: `Vui lòng nhập Nguyên nhân cho dòng thứ [${rowNumber}]`
        };
      }
    }
    return { isValid: true, message: '' };
  }

  saveHistoryProblemData(): void {
    const historyData = this.dataHistory.filter((item: any) => !item.IsDeleted);

    const validation = this.validateDataHistory(historyData);
    if (!validation.isValid) {
      this.notification.error(NOTIFICATION_TITLE.error, validation.message);
      return;
    }

    const filesToUpload: File[] = this.dataHistory
      .filter((row: any) => row.ImageFile && !row.IsDeleted)
      .map((row: any) => row.ImageFile);

    const subPath = this.getSubPathHistoryProblem();

    if (filesToUpload.length > 0 && !subPath) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không thể xác định đường dẫn lưu file. Vui lòng kiểm tra thông tin dự án!'
      );
      return;
    }

    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Thông báo', 'Đang tải file lên...');
      this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && res?.data?.length > 0) {
            let fileIndex = 0;
            this.dataHistory.forEach((row: any) => {
              if (row.ImageFile && !row.IsDeleted && res.data[fileIndex]) {
                const filePath = res.data[fileIndex].FilePath || res.data[fileIndex].ServerPath || '';
                row.Image = filePath;
                delete row.ImageFile;
                fileIndex++;
              }
            });
          }
          this.callSaveHistoryProblemData();
        },
        error: (error: any) => {
          console.error('Lỗi upload file:', error);
          this.notification.error(NOTIFICATION_TITLE.error, 'Upload file thất bại. Vui lòng thử lại!');
        }
      });
    } else {
      this.callSaveHistoryProblemData();
    }
  }

  callSaveHistoryProblemData(): void {
    const payload = this.mapTableDataToApiFormatHistory(this.dataHistory, this.dataDetail);

    this.projectHistoryProblemService.saveData(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu dữ liệu thành công!');
          this.deletedIdsHistory = [];
          this.deletedIdsDetail = [];
          this.deletedDetailHistoryIdMap.clear();
          this.loadDataHistoryProblem();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
        }
      },
      error: (error: any) => {
        console.error('Error saving data:', error);
        const errorMessage = error.error?.message || error.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  mapTableDataToApiFormatHistory(historyData: any[], detailData: any[]): any[] {
    const result: any[] = [];
    const activeMasters = historyData.filter((h: any) => !h.IsDeleted);
    const detailByHistoryId = new Map<number, any[]>();
    const deletedDetailIdsByHistoryId = new Map<number, number[]>();

    detailData.forEach((detail: any) => {
      const historyId = detail.HistoryID || detail.ProjectHistoryProblemID || 0;

      if (detail.IsDeleted && detail.ID > 0) {
        if (!deletedDetailIdsByHistoryId.has(historyId)) {
          deletedDetailIdsByHistoryId.set(historyId, []);
        }
        deletedDetailIdsByHistoryId.get(historyId)!.push(detail.ID);
      } else if (!detail.IsDeleted) {
        if (!detailByHistoryId.has(historyId)) {
          detailByHistoryId.set(historyId, []);
        }
        detailByHistoryId.get(historyId)!.push(this.mapDetailDataToApiHistory(detail));
      }
    });

    this.deletedIdsDetail.forEach((deletedDetailId: number) => {
      const historyId = this.deletedDetailHistoryIdMap.get(deletedDetailId) || 0;
      if (historyId > 0) {
        if (!deletedDetailIdsByHistoryId.has(historyId)) {
          deletedDetailIdsByHistoryId.set(historyId, []);
        }
        deletedDetailIdsByHistoryId.get(historyId)!.push(deletedDetailId);
      }
    });

    activeMasters.forEach((history: any) => {
      const historyId = history.ID || 0;
      const details = detailByHistoryId.get(historyId) || [];
      const deletedIdsDetail = deletedDetailIdsByHistoryId.get(historyId) || [];

      result.push({
        projectHistoryProblem: this.mapMasterDataToApiHistory(history),
        detail: details.length > 0 ? details : [],
        deleteIdsMaster: [],
        deletedIdsDetail: deletedIdsDetail.length > 0 ? deletedIdsDetail : []
      });
    });

    this.deletedIdsHistory.forEach((deletedId: number) => {
      result.push({
        projectHistoryProblem: null,
        detail: [],
        deleteIdsMaster: [deletedId],
        deletedIdsDetail: []
      });
    });

    return result;
  }

  mapMasterDataToApiHistory(item: any): any {
    return {
      ID: item.ID && item.ID > 0 ? item.ID : 0,
      ProjectID: item.ProjectID || this.projectId,
      STT: item.STT || 1,
      TypeProblem: item.ProblemType || '',
      ContentError: item.ErrorContent || '',
      Reason: item.Reason || '',
      Remedies: item.Solution || '',
      TestMethod: item.Method || '',
      Image: item.Image || '',
      DateProblem: item.ProblemDate || null,
      DateImplementation: item.ExecuteDate || null,
      PIC: item.PIC || '',
      EmployeeID: item.EmployeeID || null,
      IsDeleted: item.IsDeleted || false,
    };
  }

  mapDetailDataToApiHistory(item: any): any {
    return {
      ID: item.ID && item.ID > 0 ? item.ID : 0,
      ProjectHistoryProblemID: item.ProjectHistoryProblemID || item.HistoryID || null,
      STT: item.STT || 1,
      Description: item.Description || '',
      Status: item.Status || null,
      Note: item.Note || '',
      IsDeleted: item.IsDeleted || false,
    };
  }

  openFileSelectorForImageHistory(row: any): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = false;
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) {
        document.body.removeChild(fileInput);
        return;
      }

      const file = files[0];
      row.Image = file.name;
      row.ImageFile = file;

      document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    }, 100);
  }

  getSubPathHistoryProblem(): string {
    if (!this.projectInfoHistory) {
      return '';
    }
    const year = this.projectInfoHistory.CreatedDate
      ? new Date(this.projectInfoHistory.CreatedDate).getFullYear()
      : new Date().getFullYear();
    const projectCode = this.projectInfoHistory.ProjectCode || this.projectCode || '';
    if (!projectCode) {
      return '';
    }
    return `${year}\\${projectCode}\\TaiLieuChung\\TongHopPhatSinh\\Image`;
  }

  downloadImageHistory(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có đường dẫn file để tải xuống!');
      return;
    }

    const loadingMsg = this.message ? this.message.loading('Đang tải xuống file...', { nzDuration: 0 }).messageId : null;

    this.projectHistoryProblemService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        if (loadingMsg && this.message) this.message.remove(loadingMsg);
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || 'downloaded_file';
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success(NOTIFICATION_TITLE.success, 'Tải xuống thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        if (loadingMsg && this.message) this.message.remove(loadingMsg);
        console.error('Lỗi khi tải file:', res);
        this.notification.error(NOTIFICATION_TITLE.error, 'Tải xuống thất bại!');
      }
    });
  }

  exportExcelHistoryProblem(): void {
    if (!this.dataHistory || this.dataHistory.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();

    if (this.dataHistory && this.dataHistory.length > 0) {
      const wsHistory = workbook.addWorksheet('Lịch sử phát sinh');
      wsHistory.columns = [
        { header: 'STT', key: 'STT', width: 10 },
        { header: 'Loại', key: 'ProblemType', width: 20 },
        { header: 'Nội dung lỗi', key: 'ErrorContent', width: 40 },
        { header: 'Nguyên nhân', key: 'Reason', width: 40 },
        { header: 'Biện pháp khắc phục', key: 'Solution', width: 40 },
        { header: 'Phương pháp khắc phục', key: 'Method', width: 40 },
        { header: 'Hình ảnh', key: 'Image', width: 30 },
        { header: 'Ngày phát sinh', key: 'ProblemDate', width: 15 },
        { header: 'Ngày thực hiện', key: 'ExecuteDate', width: 15 },
        { header: 'PIC', key: 'PIC', width: 20 }
      ];

      wsHistory.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      wsHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      wsHistory.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      this.dataHistory.forEach((row: any, index: number) => {
        const wsRow = wsHistory.addRow({
          STT: row.STT || index + 1,
          ProblemType: row.ProblemType || '',
          ErrorContent: row.ErrorContent || '',
          Reason: row.Reason || '',
          Solution: row.Solution || '',
          Method: row.Method || '',
          Image: row.Image || '',
          ProblemDate: row.ProblemDate ? this.formatDateForExcel(row.ProblemDate) : '',
          ExecuteDate: row.ExecuteDate ? this.formatDateForExcel(row.ExecuteDate) : '',
          PIC: row.PIC || ''
        });

        if (row.ProblemDate) wsRow.getCell('ProblemDate').numFmt = 'dd/mm/yyyy';
        if (row.ExecuteDate) wsRow.getCell('ExecuteDate').numFmt = 'dd/mm/yyyy';
      });
    }

    if (this.dataDetail && this.dataDetail.length > 0) {
      const wsDetail = workbook.addWorksheet('Chi tiết phát sinh');
      wsDetail.columns = [
        { header: 'STT', key: 'STT', width: 10 },
        { header: 'Mô tả', key: 'Description', width: 50 },
        { header: 'Trạng thái', key: 'Status', width: 20 },
        { header: 'Ghi chú', key: 'Note', width: 40 }
      ];

      wsDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      wsDetail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      wsDetail.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      this.dataDetail.forEach((row: any, index: number) => {
        wsDetail.addRow({
          STT: row.STT || index + 1,
          Description: row.Description || '',
          Status: this.getStatusNameHistory(row.Status),
          Note: row.Note || ''
        });
      });
    }

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `LichSuPhatSinh_${this.projectCode || 'DuAn'}_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    }).catch((error) => {
      console.error('Error exporting Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất Excel!');
    });
  }

  getStatusNameHistory(id: number | null): string {
    if (!id) return '';
    const status = this.cbbStatusHistory.find((s: any) => s.id === id);
    return status ? status.name : '';
  }

  formatDateForExcel(date: string | Date): Date | null {
    if (!date) return null;
    try {
      const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date as Date);
      if (dt.isValid) {
        return dt.toJSDate();
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    return null;
  }

  buildSummaryData(): void {
    if (!this.savedGateSteps || this.savedGateSteps.length === 0) {
      this.summaryGates = [];
      this.summaryGateGroups = [];
      return;
    }

    const gateMap: { [gateId: number]: any } = {};

    this.savedGateSteps.forEach(link => {
      // Bỏ qua các công đoạn con, chỉ hiển thị công đoạn cha ở TỔNG HỢP GATE
      if (link.ParentID || link.parentLinkId || link.isSubStep) {
        return;
      }

      const stepDef = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
      if (!stepDef) return;

      const gateId = stepDef.ProjectGateID;
      if (!gateId) return;

      const gateMeta = this.gateList.find(g => g.ID === gateId);
      const gateType = gateMeta ? (gateMeta.Type ?? 1) : 1;

      if (!gateMap[gateId]) {
        gateMap[gateId] = {
          gateId: gateId,
          gateCode: stepDef.GateCode || `G${gateId}`,
          gateName: stepDef.GateName || 'Không tên',
          type: gateType,
          sortOrder: stepDef.SortOrder || 0,
          departments: {}
        };
      }

      const deptId = link.DepartmentID ?? 0;

      if (this.selectedSummaryDepartmentId !== null && deptId !== this.selectedSummaryDepartmentId) {
        return;
      }

      const deptName = this.getDepartmentName(deptId);

      if (!gateMap[gateId].departments[deptId]) {
        gateMap[gateId].departments[deptId] = {
          deptId: deptId,
          deptName: deptName,
          steps: []
        };
      }

      const totalChecklists = link.CheckLists ? link.CheckLists.length : 0;
      const passedChecklists = link.CheckLists ? link.CheckLists.filter((c: any) => c.IsApprovedTBP === 1).length : 0;
      const isCompleted = totalChecklists > 0 && totalChecklists === passedChecklists;

      // Xử lý Ngày bắt đầu và Ngày kết thúc dự kiến (PlanEndDate)
      const startDateStr = link.StartDate ? String(link.StartDate).substring(0, 10) : null;
      let dayCount = Number(link.DayCount) || 0;
      if (!dayCount && link.Workers && link.Workers.length > 0) {
        dayCount = Number(link.Workers[0].DayCount) || 0;
      }

      let planEndDateStr: string | null = null;
      let planEndDateObj: DateTime | null = null;

      if (link.DateEnd || link.PlanEndDate || link.EndDate || link.Deadline || link.EndDatePlan) {
        planEndDateStr = String(link.DateEnd || link.PlanEndDate || link.EndDate || link.Deadline || link.EndDatePlan).substring(0, 10);
        planEndDateObj = DateTime.fromISO(planEndDateStr);
      } else if (startDateStr) {
        const startDt = DateTime.fromISO(startDateStr);
        if (startDt.isValid) {
          planEndDateObj = startDt.plus({ days: dayCount > 0 ? dayCount - 1 : 0 });
          planEndDateStr = planEndDateObj.toFormat('yyyy-MM-dd');
        }
      }

      // Kiểm tra công đoạn bị chậm tiến độ (Ngày kết thúc dự kiến < Ngày hiện tại và chưa được duyệt công đoạn)
      const today = DateTime.now().startOf('day');
      let isStepDelayed = false;
      const isApprovedStep = link.IsApproved === true || link.IsApproved === 1;

      if (link.IsLate === 1 || link.IsLate === true || link.IsDelayed === 1 || link.IsDelayed === true || link.isLate || link.isDelayed) {
        isStepDelayed = true;
      } else if (planEndDateObj && planEndDateObj.isValid && planEndDateObj.startOf('day') < today && !isApprovedStep) {
        isStepDelayed = true;
      }

      gateMap[gateId].departments[deptId].steps.push({
        stepLinkId: link.ID,
        projectGateStepID: link.ProjectGateStepID,
        content: stepDef.Content || 'Không nội dung',
        startDate: startDateStr,
        dayCount: dayCount,
        planEndDate: planEndDateStr,
        isApproved: link.IsApproved,
        totalChecklists: totalChecklists,
        passedChecklists: passedChecklists,
        isCompleted: isCompleted,
        isDelayed: isStepDelayed,
        checkLists: link.CheckLists || [],
        forms: link.Forms || [],
        Forms: link.Forms || [],
        projectTaskID: link.ProjectTaskID
      });
    });

    let gates = Object.values(gateMap).map((g: any) => {
      const deptsArray = Object.values(g.departments).map((d: any) => {
        const totalSteps = d.steps.length;
        const completedSteps = d.steps.filter((s: any) => s.isCompleted).length;
        const approvedSteps = d.steps.filter((s: any) => s.isApproved).length;
        const isApproved = totalSteps > 0 && totalSteps === approvedSteps;
        const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        const isDeptDelayed = d.steps.some((s: any) => s.isDelayed);
        return {
          ...d,
          totalSteps,
          completedSteps,
          approvedSteps,
          isApproved,
          progress,
          isDelayed: isDeptDelayed
        };
      });

      const totalDepartments = deptsArray.length;
      const approvedDepartments = deptsArray.filter((d: any) => d.isApproved).length;
      const gateProgress = totalDepartments > 0 ? Math.round((approvedDepartments / totalDepartments) * 100) : 0;

      let totalGateSteps = 0;
      let completedGateSteps = 0;
      deptsArray.forEach((d: any) => {
        totalGateSteps += d.totalSteps;
        completedGateSteps += d.completedSteps;
      });

      const isGateDelayedFlag = g.isDelayed || g.isLate || g.IsLate || g.IsDelayed || deptsArray.some((d: any) => d.isDelayed);

      return {
        ...g,
        departments: deptsArray,
        totalSteps: totalGateSteps,
        completedSteps: completedGateSteps,
        totalDepartments,
        approvedDepartments,
        progress: gateProgress,
        isDelayed: !!isGateDelayedFlag
      };
    });

    if (this.selectedSummaryDepartmentId !== null) {
      gates = gates.filter((g: any) => g.totalDepartments > 0);
    }

    gates.sort((a, b) => {
      const typeA = a.type ?? 1;
      const typeB = b.type ?? 1;
      if (typeA !== typeB) return typeA - typeB;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.gateCode.localeCompare(b.gateCode);
    });

    this.summaryGates = gates;

    // Gom nhóm theo Type (1: GIẢI PHÁP, 2: TRIỂN KHAI, khác)
    const typeNameMap: { [key: number]: string } = {
      1: 'GIẢI PHÁP',
      2: 'TRIỂN KHAI'
    };

    const groupsMap: { [key: number]: { type: number; typeName: string; gates: any[] } } = {};

    this.summaryGates.forEach((g: any) => {
      const t = g.type ?? 1;
      if (!groupsMap[t]) {
        groupsMap[t] = {
          type: t,
          typeName: typeNameMap[t] || (t === 1 ? 'GIẢI PHÁP' : t === 2 ? 'TRIỂN KHAI' : 'KHÁC'),
          gates: []
        };
      }
      groupsMap[t].gates.push(g);
    });

    this.summaryGateGroups = Object.values(groupsMap).sort((a, b) => a.type - b.type);

    if (this.summaryGates.length > 0) {
      let targetGateId = this.selectedSummaryGateId;

      if (!targetGateId || !this.summaryGates.some(g => g.gateId === targetGateId)) {
        const firstUncompleted = this.summaryGates.find(g => g.progress < 100);
        if (firstUncompleted) {
          targetGateId = firstUncompleted.gateId;
        } else {
          targetGateId = this.summaryGates[this.summaryGates.length - 1].gateId;
        }
      } else {
        const currentGate = this.summaryGates.find(g => g.gateId === targetGateId);
        if (currentGate && currentGate.progress === 100) {
          const currentIndex = this.summaryGates.findIndex(g => g.gateId === targetGateId);
          const nextUncompleted = this.summaryGates.slice(currentIndex + 1).find(g => g.progress < 100);
          if (nextUncompleted) {
            targetGateId = nextUncompleted.gateId;
          } else {
            const anyUncompleted = this.summaryGates.find(g => g.progress < 100);
            if (anyUncompleted) {
              targetGateId = anyUncompleted.gateId;
            }
          }
        }
      }

      if (targetGateId !== null) {
        this.selectSummaryGate(targetGateId);
      }
    } else {
      this.summaryGateDetails = null;
    }
  }

  isGateDelayed(gate: any): boolean {
    if (!gate) return false;
    if (gate.isDelayed || gate.isLate || gate.IsLate || gate.IsDelayed) return true;
    if (gate.departments && Array.isArray(gate.departments)) {
      const today = DateTime.now().startOf('day');
      return gate.departments.some((d: any) => {
        if (d.isDelayed || d.isLate) return true;
        if (d.steps && Array.isArray(d.steps)) {
          return d.steps.some((s: any) => {
            if (s.isDelayed || s.isLate || s.IsLate || s.IsDelayed) return true;

            let planEnd: DateTime | null = null;
            if (s.planEndDate || s.endDate || s.deadline) {
              const rawStr = String(s.planEndDate || s.endDate || s.deadline).substring(0, 10);
              planEnd = DateTime.fromISO(rawStr);
            } else if (s.startDate) {
              const startDt = DateTime.fromISO(String(s.startDate).substring(0, 10));
              const dCount = Number(s.dayCount) || 1;
              if (startDt.isValid) {
                planEnd = startDt.plus({ days: dCount });
              }
            }

            if (planEnd && planEnd.isValid && planEnd < today && !s.isApproved && !s.isCompleted) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    }
    return false;
  }

  getDepartmentName(deptId: number | null | undefined): string {
    if (deptId === null || deptId === undefined) return 'Tất cả phòng ban';
    if (deptId === 0) return 'Mẫu chung';
    const dept = this.departments.find(d => d.ID === deptId || d.id === deptId);
    return dept ? (dept.Name || dept.name) : `Phòng ban ID ${deptId}`;
  }

  get summaryDepartmentOptions(): any[] {
    if (!this.savedGateSteps || this.savedGateSteps.length === 0) {
      return [];
    }

    const deptIds = new Set<number>();
    this.savedGateSteps.forEach((x: any) => {
      deptIds.add(x.DepartmentID ?? 0);
    });

    const options: any[] = [];
    deptIds.forEach(id => {
      if (id === 0) {
        options.push({ ID: 0, Name: 'Mẫu chung' });
      } else {
        const dept = (this.departments || []).find((d: any) => (d.ID === id || d.id === id));
        if (dept) {
          options.push({ ID: id, Name: dept.Name || dept.name });
        } else {
          options.push({ ID: id, Name: `Phòng ban ID ${id}` });
        }
      }
    });

    return options.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
  }

  onSummaryDepartmentChange(deptId: number | null): void {
    this.selectedSummaryDepartmentId = deptId;
    this.buildSummaryData();
  }

  selectSummaryGate(gateId: number): void {
    this.selectedSummaryGateId = gateId;
    const gate = this.summaryGates.find(g => g.gateId === gateId) || null;
    this.summaryGateDetails = gate;
    this.summaryGateTab = 1;
    this.selectedStepDetail = null;
    this.selectedStepDetailDept = null;
    this.detailTasks = [];
    this.selectedRuleInTab = null;
    this.displayFilesInTab = [];
    this.scrollToSelectedGate(gateId);

    const gateCodeUpper = gate?.gateCode?.trim()?.toUpperCase() || '';
    if (gateCodeUpper === 'G3A') {
      if (!this.projectId) return;
      this.projectService.getDemoProject(this.projectId).subscribe({
        next: (res: any) => {
          const demoPrj = res?.data;
          if (demoPrj && demoPrj.ID) {
            const key = `project-gate-step-by-project/${demoPrj.ID}`;
            const projectStatusName = demoPrj.ProjectStatusName || demoPrj.ProjectStatusText || demoPrj.ProjectStatus || '';
            this.tabService.openTabComp({
              comp: ProjectGateStepByProjectComponent,
              title: `Chi tiết dự án - ${demoPrj.ProjectCode}`,
              key: key,
              data: {
                projectId: demoPrj.ID,
                projectCode: demoPrj.ProjectCode,
                projectName: demoPrj.ProjectName,
                projectStatusName: projectStatusName,
                _tabKey: key
              }
            });
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa tạo dự án demo!');
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        }
      });
    }
  }

  selectSummaryGateTab(tabIndex: number): void {
    this.summaryGateTab = tabIndex;
    if (tabIndex === 2) {
      this.loadFormsForCurrentGate();
    }
  }

  loadFormsForCurrentGate(): void {
    if (!this.summaryGateDetails || !this.summaryGateDetails.departments) return;
    this.summaryGateDetails.departments.forEach((dept: any) => {
      if (dept.steps && Array.isArray(dept.steps)) {
        dept.steps.forEach((step: any) => {
          const stepId = step.projectGateStepID || step.stepId || step.ID || step.stepLinkId;
          if (stepId && (!step.forms || step.forms.length === 0)) {
            this.projectGateStepService.getFormsByStep(stepId).subscribe({
              next: (res: any) => {
                if (res?.data) {
                  step.forms = res.data;
                  step.Forms = res.data;
                }
              }
            });
          }
        });
      }
    });
  }

  getAllFormsOfCurrentGate(): any[] {
    if (!this.summaryGateDetails || !this.summaryGateDetails.departments) return [];
    const formsList: any[] = [];
    this.summaryGateDetails.departments.forEach((dept: any) => {
      if (dept.steps && Array.isArray(dept.steps)) {
        dept.steps.forEach((step: any) => {
          const stepForms = step.forms || step.Forms || [];
          stepForms.forEach((f: any) => {
            formsList.push({
              ...f,
              deptName: dept.deptName || '',
              stepContent: step.content || 'Công đoạn'
            });
          });
        });
      }
    });
    return formsList;
  }

  scrollToSelectedGate(gateId?: number): void {
    const targetId = gateId ?? this.selectedSummaryGateId;
    if (!targetId) return;

    setTimeout(() => {
      const el = document.getElementById(`gate-card-${targetId}`);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 150);
  }

  isG2Gate(gate: any): boolean {
    if (!gate) return false;
    const code = (gate.gateCode || gate.GateCode || '').trim().toUpperCase();
    return code === 'G2' || code.includes('G2');
  }

  openProjectRequest(): void {
    if (!this.projectId) {
      this.notification.warning('Thông báo', 'Không tìm thấy ID dự án!');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectRequestComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectID = this.projectId;
  }

  selectStepDetail(step: any, dept: any): void {
    if (this.selectedStepDetail && this.selectedStepDetail.stepLinkId === step.stepLinkId) {
      this.selectedStepDetail = null;
      this.selectedStepDetailDept = null;
      this.detailTasks = [];
      this.selectedRuleInTab = null;
      this.displayFilesInTab = [];
      return;
    }

    this.selectedStepDetail = step;
    this.selectedStepDetailDept = dept;
    this.detailTasks = [];
    this.selectedRuleInTab = null;
    this.displayFilesInTab = [];
    this.selectedDetailTab = 1; // Mặc định chuyển về Tab 1 khi click chọn bước mới

    if (step.projectTaskID) {
      this.isLoadingDetailTasks = true;
      this.projectGateStepService.getProjectItemParentChild(step.projectTaskID).subscribe({
        next: (res: any) => {
          this.detailTasks = res?.data || [];
          this.isLoadingDetailTasks = false;
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
          this.isLoadingDetailTasks = false;
        }
      });
    } else {

    }
  }

  selectDetailTab(tabIndex: number): void {
    this.selectedDetailTab = tabIndex;
    if (tabIndex === 2) {
      if (!this.selectedRuleInTab && this.selectedStepDetail?.checkLists?.length > 0) {
        this.selectRuleInTab(this.selectedStepDetail.checkLists[0]);
      } else {
        this.refreshDisplayFilesInTab();
      }
    } else if (tabIndex === 3) {
      this.loadFormsForSelectedDept();
    }
  }

  getDepartmentForms(): any[] {
    const dept = this.selectedStepDetailDept;
    if (dept && dept.steps) {
      const forms: any[] = [];
      dept.steps.forEach((step: any) => {
        const stepForms = step.forms || step.Forms || [];
        stepForms.forEach((f: any) => {
          forms.push({
            ...f,
            stepContent: step.content || step.Content || 'Công đoạn',
            deptName: dept.deptName || ''
          });
        });
      });
      return forms;
    }

    if (this.selectedStepDetail) {
      const stepForms = this.selectedStepDetail.forms || this.selectedStepDetail.Forms || [];
      return stepForms.map((f: any) => ({
        ...f,
        stepContent: this.selectedStepDetail.content || 'Công đoạn',
        deptName: this.selectedStepDetailDept?.deptName || ''
      }));
    }

    return [];
  }

  loadFormsForSelectedDept(): void {
    const dept = this.selectedStepDetailDept;
    if (!dept || !dept.steps) return;
    dept.steps.forEach((step: any) => {
      const stepId = step.projectGateStepID || step.stepId || step.ID || step.stepLinkId;
      if (stepId && (!step.forms || step.forms.length === 0)) {
        this.projectGateStepService.getFormsByStep(stepId).subscribe({
          next: (res: any) => {
            if (res?.data) {
              step.forms = res.data;
              step.Forms = res.data;
            }
          }
        });
      }
    });
  }

  downloadFormFile(form: any): void {
    if (!form || !form.FilePath) return;
    this.projectGateStepService.downloadFile(form.FilePath).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = form.FileName || 'bieu_mau_dinh_kem';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          'Không thể tải xuống tệp tin!',
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  openGateTaskDetailTab(stepParam?: any, deptParam?: any): void {
    const step = stepParam || this.selectedStepDetail;
    const dept = deptParam || this.selectedStepDetailDept;
    const gate = this.summaryGateDetails;

    if (!step) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn công đoạn để xem chi tiết công việc!');
      return;
    }

    const tabKey = `gate-task-detail-${step.stepLinkId || step.projectTaskID || step.ID || Date.now()}`;
    const gateLabel = gate ? `${gate.gateCode}` : 'Gate';
    const stepLabel = step.content || step.Content || 'Công việc';

    this.tabService.openTabComp({
      comp: ProjectGateTaskDetailComponent,
      title: `Công việc: ${gateLabel} - ${stepLabel}`,
      key: tabKey,
      data: {
        projectId: this.projectId,
        projectCode: this.projectCode,
        projectName: this.projectName,
        gateCode: gate?.gateCode || '',
        gateName: gate?.gateName || '',
        stepContent: step.content || step.Content || '',
        deptName: dept?.deptName || step.deptName || '',
        projectTaskId: step.projectTaskID || step.ProjectTaskID || null,
        detailTasks: stepParam ? [] : this.detailTasks,
        _tabKey: tabKey
      }
    });
  }

  selectRuleInTab(cl: any): void {
    if (this.selectedRuleInTab?.ID === cl?.ID && cl?.Files?.length) {
      this.refreshDisplayFilesInTab();
      return;
    }

    this.selectedRuleInTab = cl;
    if (!cl || !cl.ID) {
      this.displayFilesInTab = [];
      return;
    }

    this.isLoadingRuleFiles = true;
    this.projectGateStepService.getFiles(cl.ID).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          cl.Files = res.data || [];
        } else {
          cl.Files = [];
        }
        this.refreshDisplayFilesInTab();
        this.isLoadingRuleFiles = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        cl.Files = [];
        this.refreshDisplayFilesInTab();
        this.isLoadingRuleFiles = false;
      }
    });
  }

  refreshDisplayFilesInTab(): void {
    if (this.selectedRuleInTab) {
      this.displayFilesInTab = (this.selectedRuleInTab.Files || []).map((f: any) => ({
        ...f,
        ruleId: this.selectedRuleInTab.ID,
        ruleDescription: this.selectedRuleInTab.Description || this.selectedRuleInTab.FileRule
      }));
    } else {
      const list: any[] = [];
      if (this.selectedStepDetail?.checkLists) {
        this.selectedStepDetail.checkLists.forEach((cl: any) => {
          if (cl.Files && cl.Files.length > 0) {
            cl.Files.forEach((f: any) => {
              list.push({
                ...f,
                ruleId: cl.ID,
                ruleDescription: cl.Description || cl.FileRule
              });
            });
          }
        });
      }
      this.displayFilesInTab = list;
    }
    this.cdr.markForCheck();
  }

  downloadFileInTab(file: any): void {
    if (!file || !file.FilePath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'File không có đường dẫn để tải về.');
      return;
    }
    this.projectGateStepService.downloadFile(file.FilePath).subscribe({
      next: (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.FileName || 'downloaded_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }
  hasNoSavedSteps(ptId: number | null, deptId: number | null): boolean {
    if (!ptId) return false;
    const savedForThisCombo = (this.savedGateSteps || []).filter((x: any) => {
      if (x.ProjectTypeID !== ptId) return false;
      // If the saved link has DepartmentID set, match directly
      if (x.DepartmentID !== undefined && x.DepartmentID !== null) {
        return x.DepartmentID === deptId;
      }
      // Fallback: legacy data without DepartmentID
      if (deptId === null) return true;
      const step = this.allGateSteps.find((s: any) => s.ID === x.ProjectGateStepID);
      return step && step.DepartmentIDs && step.DepartmentIDs.includes(deptId);
    });
    return savedForThisCombo.length === 0;
  }

  onTemplateChange(ptId: number, deptId: number | null, templateId: any) {
    if (!this.canAddStepOrTemplate) return;
    const numericId = templateId ? Number(templateId) : null;
    const key = `${ptId}_${deptId}`;
    this.projectTypeTemplateMap[key] = numericId;

    if (numericId) {
      // Tải các công đoạn từ mẫu được chọn
      const filteredSteps = JSON.parse(JSON.stringify(this.allGateSteps))
        .filter((step: any) => step.ProjectGateStepTemplateID === numericId);

      filteredSteps.forEach((step: any) => {
        step.machineIndex = 1;
        step.isRepeatChecked = false;
        step.repeatOrder = 0;
        step.isRepeated = false;
        step.parentStepId = null;
        step.groupName = this.getGateGroupNameForMachine(step.GateCode, 1);
        step.PeopleCount = null;
        step.DayCount = null;
        step.TotalEffort = 1;
        step.UnitPrice = null;
        step.Workers = [];
      });

      this.projectTypeStepsMap[key] = filteredSteps;
      this.recalculateSequenceNumbers(key);
    } else {
      // Không chọn mẫu nào — xóa các công đoạn hiện tại
      this.projectTypeStepsMap[key] = [];
    }
  }

  getDeletedSteps() {
    this.isLoadingDeleted = true;
    this.deletedSteps = [];
    this.projectGateStepService.getDeletedByProject(this.projectId).subscribe({
      next: (res: any) => {
        const deletedLinks = res.data || [];
        // Ánh xạ sang các công đoạn mẫu để hiển thị đầy đủ chi tiết
        this.deletedSteps = deletedLinks.map((link: any) => {
          const template = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
          return {
            ...link,
            GateCode: template?.GateCode || '',
            GateName: template?.GateName || '',
            Content: template?.Content || '',
            DepartmentNames: template?.DepartmentNames || '',
            DepartmentName: this.getDepartmentName(link.DepartmentID),
            ProjectTypeName: this.getProjectTypeName(link.ProjectTypeID),
            selected: false
          };
        });
        this.isLoadingDeleted = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isLoadingDeleted = false;
      }
    });
  }

  toggleSelectAllDeleted(checked: boolean) {
    this.deletedSteps.forEach(s => s.selected = checked);
  }

  isAllDeletedSelected(): boolean {
    if (this.deletedSteps.length === 0) return false;
    return this.deletedSteps.every(s => s.selected);
  }

  hasSelectedDeletedSteps(): boolean {
    if (!this.deletedSteps || this.deletedSteps.length === 0) return false;
    return this.deletedSteps.some(s => s.selected);
  }

  recoverSelectedSteps() {
    const selected = this.deletedSteps.filter(s => s.selected);
    if (selected.length === 0) return;

    selected.forEach(link => {
      const ptId = link.ProjectTypeID;
      let targetDeptId: number | null = null;

      if (link.DepartmentID !== undefined && link.DepartmentID !== null && link.DepartmentID !== 0) {
        targetDeptId = link.DepartmentID;
      } else if (this.activeDepartmentId !== undefined && this.activeDepartmentId !== null) {
        targetDeptId = this.activeDepartmentId;
      }

      const comboKey = `${ptId}_${targetDeptId}`;

      if (!this.projectTypeStepsMap[comboKey]) {
        this.projectTypeStepsMap[comboKey] = [];
      }

      const steps = this.projectTypeStepsMap[comboKey];
      const template = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
      if (!template) return;

      if (link.IsRepeat) {
        // Công đoạn gốc cha cần phải có mặt trong danh sách công đoạn hoạt động
        let parentStep = steps.find(s => s.ID === link.ProjectGateStepID && !s.isRepeated);
        if (!parentStep) {
          parentStep = JSON.parse(JSON.stringify(template));
          parentStep.machineIndex = 1;
          parentStep.isRepeatChecked = true;
          parentStep.repeatOrder = 0;
          parentStep.isRepeated = false;
          parentStep.parentStepId = null;
          parentStep.groupName = this.getGateGroupNameForMachine(parentStep.GateCode, 1);
          parentStep.PeopleCount = null;
          parentStep.DayCount = null;
          parentStep.TotalEffort = 1;
          parentStep.UnitPrice = null;
          parentStep.Workers = [];
          steps.push(parentStep);
        } else {
          parentStep.isRepeatChecked = true;
        }

        // Thêm công đoạn lặp lại
        const repeatedExists = steps.some(s => s.isRepeated && s.parentStepId === link.ProjectGateStepID);
        if (!repeatedExists) {
          const repeatedStep = JSON.parse(JSON.stringify(parentStep));
          repeatedStep.ID = -Date.now() - Math.floor(Math.random() * 1000);
          repeatedStep.machineIndex = 2;
          repeatedStep.isRepeated = true;
          repeatedStep.parentStepId = link.ProjectGateStepID;
          repeatedStep.isRepeatChecked = false;
          repeatedStep.groupName = this.getGateGroupNameForMachine(parentStep.GateCode, 2);
          repeatedStep.repeatOrder = Date.now();
          repeatedStep.ProjectGateStepLinkID = link.ID;

          repeatedStep.StartDate = link.StartDate ? link.StartDate.substring(0, 10) : null;
          if (link.Workers && link.Workers.length > 0) {
            repeatedStep.Workers = link.Workers.map((w: any) => w.EmployeeID);
            repeatedStep.PeopleCount = link.Workers.length;
            repeatedStep.DayCount = link.Workers[0].DayCount;
            repeatedStep.UnitPrice = link.Workers[0].UnitPrice;
            repeatedStep.TotalEffort = repeatedStep.PeopleCount * repeatedStep.DayCount;
          }
          repeatedStep.CheckLists = link.CheckLists || [];
          repeatedStep.Forms = link.Forms || [];
          steps.push(repeatedStep);
        }
      } else {
        // Công đoạn gốc
        let existingStep = steps.find(s => s.ID === link.ProjectGateStepID && !s.isRepeated);
        if (!existingStep) {
          existingStep = JSON.parse(JSON.stringify(template));
          existingStep.machineIndex = 1;
          existingStep.isRepeatChecked = false;
          existingStep.repeatOrder = 0;
          existingStep.isRepeated = false;
          existingStep.parentStepId = null;
          existingStep.groupName = this.getGateGroupNameForMachine(existingStep.GateCode, 1);
          existingStep.PeopleCount = null;
          existingStep.DayCount = null;
          existingStep.TotalEffort = 1;
          existingStep.UnitPrice = null;
          existingStep.Workers = [];
          steps.push(existingStep);
        }

        existingStep.ProjectGateStepLinkID = link.ID;

        existingStep.StartDate = link.StartDate ? link.StartDate.substring(0, 10) : null;
        if (link.Workers && link.Workers.length > 0) {
          existingStep.Workers = link.Workers.map((w: any) => w.EmployeeID);
          existingStep.PeopleCount = link.Workers.length;
          existingStep.DayCount = link.Workers[0].DayCount;
          existingStep.UnitPrice = link.Workers[0].UnitPrice;
          existingStep.TotalEffort = existingStep.PeopleCount * existingStep.DayCount;
        }
        existingStep.CheckLists = link.CheckLists || [];
        existingStep.Forms = link.Forms || [];
      }

      this.recalculateSequenceNumbers(comboKey);
    });

    this.notification.success(NOTIFICATION_TITLE.success, 'Khôi phục các bước công việc thành công! Vui lòng bấm "Lưu thông tin" để hoàn tất.', {
      nzStyle: { fontSize: '12px' }
    });
    this.showDeletedModal = false;
  }

  loadDepartments(): void {
    this.projectService.getDepartment().subscribe({
      next: (res: any) => {
        this.departments = res.data || [];
        this.updateGroupedMenuDepartments();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  loadProjectTypeDepartmentLinks(): void {
    this.projectTypeDeptService.getAll().subscribe({
      next: (res: any) => {
        this.projectTypeDepartmentLinks = res.data || [];
        this.updateGroupedMenuDepartments();
        this.updateTabsSteps();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  updateGroupedMenuDepartments(): void {
    if (!this.checkedProjectTypes || this.checkedProjectTypes.length === 0 || this.departments.length === 0) {
      this.groupedMenuDepartments = [];
      return;
    }

    const prevCollapsedState = new Map<any, boolean>();
    if (this.groupedMenuDepartments && this.groupedMenuDepartments.length > 0) {
      this.groupedMenuDepartments.forEach(g => {
        prevCollapsedState.set(g.id, g.collapsed);
      });
    }

    const groupsMap = new Map<number | null, any[]>();

    this.departments.forEach(dept => {
      // Tìm tất cả loại dự án được liên kết với phòng ban này trong cấu hình
      const linksForDept = this.projectTypeDepartmentLinks.filter(l => l.DepartmentID === dept.ID && !l.IsDeleted);
      const linkedTypeIds = new Set(linksForDept.map(l => l.ProjectTypeID));

      // Lọc các loại dự án đã chọn của dự án này mà được liên kết với phòng ban hiện tại
      const ptsInDept = this.checkedProjectTypes.filter(pt => linkedTypeIds.has(pt.ID));

      if (ptsInDept.length > 0) {
        groupsMap.set(dept.ID, ptsInDept);
      }
    });

    // Xử lý các loại dự án không được liên kết với bất kỳ phòng ban nào
    const allLinkedTypeIds = new Set(this.projectTypeDepartmentLinks.filter(l => !l.IsDeleted).map(l => l.ProjectTypeID));
    const unlinkedPts = this.checkedProjectTypes.filter(pt => !allLinkedTypeIds.has(pt.ID));
    if (unlinkedPts.length > 0) {
      groupsMap.set(null, unlinkedPts);
    }

    const groups: any[] = [];
    groupsMap.forEach((pts, deptId) => {
      let deptName = 'Chưa phân phòng ban';
      if (deptId !== null) {
        const dept = this.departments.find(d => d.ID === deptId || d.id === deptId);
        if (dept) {
          deptName = dept.Name || dept.name || `Phòng ban ${deptId}`;
        }
      }
      // Mặc định là đóng thu gọn (collapsed = true) ngoại trừ phòng ban đang active hoặc đã thao tác trước đó
      let isCollapsed = true;
      if (prevCollapsedState.has(deptId)) {
        isCollapsed = prevCollapsedState.get(deptId)!;
      } else if (this.activeDepartmentId !== null && deptId === this.activeDepartmentId) {
        isCollapsed = false;
      }

      groups.push({
        id: deptId,
        name: deptName,
        projectTypes: pts,
        collapsed: isCollapsed
      });
    });

    // Sắp xếp các nhóm để nhóm "Chưa phân phòng ban" nằm ở cuối, các nhóm khác sắp xếp theo bảng chữ cái
    groups.sort((a, b) => {
      if (a.id === null) return 1;
      if (b.id === null) return -1;
      return a.name.localeCompare(b.name);
    });

    this.groupedMenuDepartments = groups;
  }

  toggleDeptGroup(group: any): void {
    if (group) {
      group.collapsed = !group.collapsed;
    }
  }

  get isAllDeptGroupsCollapsed(): boolean {
    if (!this.groupedMenuDepartments || this.groupedMenuDepartments.length === 0) return true;
    return this.groupedMenuDepartments.every(g => g.collapsed);
  }

  toggleAllDeptGroups(): void {
    const shouldCollapse = !this.isAllDeptGroupsCollapsed;
    this.groupedMenuDepartments.forEach(g => {
      g.collapsed = shouldCollapse;
    });
  }

  getTemplatesForActiveType(): any[] {
    if (!this.activeProjectTypeId) return [];
    return this.templates.filter(t =>
      t.ProjectTypeID === this.activeProjectTypeId &&
      (this.activeDepartmentId === null || t.DepartmentID === this.activeDepartmentId)
    );
  }

  hasUploadFolder(item: any): boolean {
    if (!item || !item.CheckLists) return false;
    return item.CheckLists.some((c: any) => c.PathFolder && c.PathFolder.trim() !== '');
  }

  countCompletedRules(item: any): number {
    if (!item || !item.CheckLists) return 0;
    return item.CheckLists.filter((c: any) => c.IsApprovedTBP === 1 || c.IsApprovedTBP === true).length;
  }

  isStepPassed(item: any): boolean {
    return item?.IsApproved === true;
  }

  isStepApprovedTBP(item: any): boolean {
    if (!item) return false;
    return item.IsApprovedTBP === 1 || item.IsApprovedTBP === true || item.IsApproved === true;
  }

  getRelativeSubPath(pathFolder: string): string {
    if (!pathFolder) return '';
    const match = pathFolder.match(/[\\\/]projects[\\\/](.*)$/i);
    if (match) {
      return match[1];
    }
    return pathFolder.replace(/^\\\\192\.168\.1\.190\\duan\\projects\\/i, '')
      .replace(/^\\\\192\.168\.1\.190\\duan\\/i, '')
      .replace(/^\\+/g, '');
  }

  getFileIcon(contentType: string, fileName: string): string {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
    const mime = (contentType || '').toLowerCase();

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
      return 'fa-solid fa-file-image text-success';
    if (mime === 'application/pdf' || ext === 'pdf')
      return 'fa-solid fa-file-pdf text-danger';
    if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime) || ['doc', 'docx'].includes(ext))
      return 'fa-solid fa-file-word text-primary';
    if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mime) || ['xls', 'xlsx'].includes(ext))
      return 'fa-solid fa-file-excel text-success';
    if (['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mime) || ['ppt', 'pptx'].includes(ext))
      return 'fa-solid fa-file-powerpoint text-warning';
    if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mime) || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
      return 'fa-solid fa-file-zipper text-secondary';
    if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv'].includes(ext))
      return 'fa-solid fa-file-video text-info';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext))
      return 'fa-solid fa-file-audio text-info';
    if (ext === 'dwg' || ext === 'dxf')
      return 'fa-solid fa-drafting-compass text-primary';

    return 'fa-solid fa-file text-secondary';
  }

  onRowContextMenu(event: MouseEvent, item: any) {
    if (!this.hasUploadFolder(item)) {
      event.preventDefault();
      return;
    }

    this.selectedStepForMenu = item;
    // this.contextMenuItems = [
    //   {
    //     label: 'Tải file lên (Upload file)',
    //     icon: 'pi pi-upload text-primary',
    //     command: () => this.triggerFileUpload(item)
    //   }
    // ];

    if (this.cm) {
      this.cm.show(event);
    }
    event.preventDefault();
    event.stopPropagation();
  }


  getStepFilesCount(item: any): number {
    if (!item.CheckLists || item.CheckLists.length === 0) return 0;
    let count = 0;
    for (const cl of item.CheckLists) {
      if (cl.Files) {
        count += cl.Files.length;
      }
    }
    return count;
  }

  /*region hàm mở modal checklist */
  openFileListModal(item: any, cl?: any) {
    const modalRef = this.ngbModal.open(ProjectGateStepFilesModalComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    modalRef.componentInstance.stepLinkId = item.ProjectGateStepLinkID;
    modalRef.componentInstance.selectedRuleId = cl?.ID || null;
    modalRef.componentInstance.gateCode = item.GateCode || '';
    modalRef.componentInstance.gateName = item.GateName || '';
    modalRef.componentInstance.projectCode = this.projectCode || item.ProjectCode || '';
    modalRef.componentInstance.projectName = this.projectName || item.ProjectName || '';
    modalRef.componentInstance.stepCode = item.StepCode || item.ProjectGateStepCode || '';
    modalRef.componentInstance.isApproved = item.IsApproved || item.isApproved || false;

    modalRef.result
      .then((result: any) => {
        this.loadAllGateSteps();
      })
      .catch((error: any) => {
        this.loadAllGateSteps();
      });
  }

  openFormsModal(item: any) {
    const stepId = item.ProjectGateStepID || (item.isRepeated ? item.parentStepId : item.ID) || item.stepId || item.ProjectGateStepTemplateID;

    const modalRef = this.ngbModal.open(ProjectGateStepFormsModalComponent, {
      centered: true,
      size: 'xl',
      keyboard: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.stepId = stepId;
    modalRef.componentInstance.gateCode = item.GateCode || '';
    modalRef.componentInstance.gateName = item.Content || item.GateName || '';

    if (stepId) {
      modalRef.componentInstance.loadData();
    }
  }
  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else if (this.tabData && this.tabData._tabKey) {
      this.tabService.closeTabByKey(this.tabData._tabKey);
    }
  }

  // ─── Duyệt / Hủy duyệt nhiều công đoạn ───────────────────────────────────

  /** Bật/tắt chọn 1 công đoạn đã lưu (isNew=false mới được chọn) */
  toggleSelectStep(item: any): void {
    if (item.isNew || !item.ProjectGateStepLinkID) return;
    if (this.selectedStepLinkIds.has(item.ProjectGateStepLinkID)) {
      this.selectedStepLinkIds.delete(item.ProjectGateStepLinkID);
    } else {
      this.selectedStepLinkIds.add(item.ProjectGateStepLinkID);
    }
  }

  isStepSelected(item: any): boolean {
    return !!item?.ProjectGateStepLinkID && this.selectedStepLinkIds.has(item.ProjectGateStepLinkID);
  }

  /** Kiểm tra xem tất cả các công đoạn đã lưu trong tab hiện tại đã được chọn chưa */
  isAllStepsSelected(): boolean {
    const key = this.activeProjectTypeId + '_' + this.activeDepartmentId;
    const steps = (this.projectTypeStepsMap[key] || []).filter((s: any) => !s.isNew && s.ProjectGateStepLinkID);
    if (!steps.length) return false;
    return steps.every((s: any) => this.selectedStepLinkIds.has(s.ProjectGateStepLinkID));
  }

  /** Chọn / Bỏ chọn tất cả công đoạn trong tab hiện tại */
  toggleSelectAllSteps(event: any): void {
    const checked = event?.target?.checked ?? event;
    const key = this.activeProjectTypeId + '_' + this.activeDepartmentId;
    const steps = (this.projectTypeStepsMap[key] || []).filter((s: any) => !s.isNew && s.ProjectGateStepLinkID);

    if (checked) {
      steps.forEach((s: any) => this.selectedStepLinkIds.add(s.ProjectGateStepLinkID));
    } else {
      steps.forEach((s: any) => this.selectedStepLinkIds.delete(s.ProjectGateStepLinkID));
    }
  }

  /** Lấy danh sách item đã được chọn thuộc tab đang hiển thị */
  getSelectedSavedSteps(): any[] {
    const key = this.activeProjectTypeId + '_' + this.activeDepartmentId;
    const steps = this.projectTypeStepsMap[key] || [];
    return steps.filter((s: any) => !s.isNew && s.ProjectGateStepLinkID && this.selectedStepLinkIds.has(s.ProjectGateStepLinkID));
  }

  isStartDateInvalid(item: any): boolean {
    return !!(this.showValidationErrors && this.isStepSelected(item) && !item.StartDate);
  }

  isPeopleCountInvalid(item: any): boolean {
    return !!(this.showValidationErrors && this.isStepSelected(item) && (item.PeopleCount == null || item.PeopleCount <= 0));
  }

  isDayCountInvalid(item: any): boolean {
    return !!(this.showValidationErrors && this.isStepSelected(item) && (item.DayCount == null || item.DayCount <= 0));
  }

  isWorkersInvalid(item: any): boolean {
    return !!(this.showValidationErrors && this.isStepSelected(item) && (!item.Workers || item.Workers.length === 0));
  }

  isUnitPriceInvalid(item: any): boolean {
    return !!(this.showValidationErrors && this.isStepSelected(item) && (item.UnitPrice == null || item.UnitPrice <= 0));
  }

  isStepInvalid(item: any): boolean {
    return this.isStartDateInvalid(item) ||
      this.isPeopleCountInvalid(item) ||
      this.isDayCountInvalid(item) ||
      this.isWorkersInvalid(item) ||
      this.isUnitPriceInvalid(item);
  }

  /** Kiểm tra dữ liệu các công đoạn được chọn trước khi duyệt */
  validateStepsBeforeApprove(selectedSteps: any[]): boolean {
    const hasInvalid = selectedSteps.some((step: any) =>
      !step.StartDate ||
      step.PeopleCount == null || step.PeopleCount <= 0 ||
      step.DayCount == null || step.DayCount <= 0 ||
      !step.Workers || step.Workers.length === 0 ||
      step.UnitPrice == null || step.UnitPrice <= 0
    );

    if (hasInvalid) {
      this.showValidationErrors = true;
      this.notification.warning(
        'Cảnh báo dữ liệu',
        'Vui lòng điền đầy đủ thông tin còn thiếu ở các ô có viền đỏ trước khi duyệt.'
      );
      return false;
    }

    this.showValidationErrors = false;
    return true;
  }

  /** Entry point: hỏi xác nhận rồi gọi API duyệt */
  confirmApproveMultiple(isApproved: boolean): void {
    const selected = this.getSelectedSavedSteps();
    if (!selected.length) {
      this.notification.warning('Chú ý', 'Vui lòng chọn ít nhất một công đoạn.');
      return;
    }

    // Kiểm tra thông tin bắt buộc trước khi thực hiện duyệt
    if (isApproved && !this.validateStepsBeforeApprove(selected)) {
      return;
    }

    const action = isApproved ? 'duyệt' : 'hủy duyệt';
    const count = selected.length;

    this.modalService.confirm({
      nzTitle: `<b>Xác nhận ${action} công đoạn</b>`,
      nzContent: `Bạn có chắc muốn <b>${action}</b> <b style="color:#1677ff">${count}</b> công đoạn đã chọn không?`,
      nzOkText: isApproved ? 'Duyệt' : 'Hủy duyệt',
      nzOkType: isApproved ? 'primary' : 'default',
      nzOkDanger: !isApproved,
      nzCancelText: 'Không',
      nzOnOk: () => {
        const linkIds = selected.map((s: any) => s.ProjectGateStepLinkID);

        if (isApproved) {
          this.isSaving = true;
          const payload = this.buildSavePayload();

          this.projectGateStepService.saveGateStepLink(payload).pipe(
            finalize(() => this.isSaving = false)
          ).subscribe({
            next: () => {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Đã tự động lưu thông tin công đoạn thành công trước khi duyệt!',
                { nzStyle: { fontSize: '12px' } }
              );
              this.doApproveMultiple(linkIds, isApproved);
            },
            error: (err: any) => {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                'Không thể tự động lưu dữ liệu công đoạn trước khi duyệt: ' + (err?.error?.message || err?.message || err?.error),
                { nzStyle: { whiteSpace: 'pre-line' } }
              );
            }
          });
        } else {
          this.doApproveMultiple(linkIds, isApproved);
        }
      }
    });
  }

  /** Gọi API ApproveMultiple, xử lý HasPendingTBP và reload */
  private doApproveMultiple(linkIds: number[], isApproved: boolean, force: boolean = false): void {
    this.isApprovingMultiple = true;
    this.projectGateStepService.approveMultiple(linkIds, isApproved, force).subscribe({
      next: (res: any) => {
        const data = res?.data;

        // API trả về cảnh báo TBP chưa duyệt
        if (data && !data.Success && data.HasPendingTBP) {
          this.isApprovingMultiple = false;

          this.modalService.confirm({
            nzTitle: '<b>Cảnh báo: Còn checklist TBP chưa duyệt</b>',
            nzContent: `
              <div style="font-size:13px">
                <p>${data.Message}</p>
                <p class="mt-2 mb-0 text-muted">Bạn vẫn muốn tiếp tục duyệt không?</p>
              </div>`,
            nzOkText: 'Tiếp tục duyệt',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOnOk: () => this.doApproveMultiple(linkIds, isApproved, true)
          });
          return;
        }

        // Thành công: Xóa danh sách đã chọn và gọi reloadGateSteps để làm mới dữ liệu
        const action = isApproved ? 'Duyệt' : 'Hủy duyệt';
        this.notification.success(NOTIFICATION_TITLE.success, data?.Message || `${action} thành công`);
        this.selectedStepLinkIds.clear();
        this.reloadGateSteps();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
      complete: () => {
        this.isApprovingMultiple = false;
      }
    });
  }

}
