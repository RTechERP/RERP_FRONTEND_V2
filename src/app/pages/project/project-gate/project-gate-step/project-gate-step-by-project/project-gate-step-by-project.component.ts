import { Component, Input, OnInit, Optional, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
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
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

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
    TableModule,
    PopoverModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    MenubarModule,
    ContextMenuModule,
    ProjectGateStepFilesModalComponent,
    ProjectGateStepFormsModalComponent,
    ProjectRequestComponent,
    HasPermissionDirective,
    ProjectGateTaskDetailComponent
  ],
  templateUrl: './project-gate-step-by-project.component.html',
  styleUrls: ['./project-gate-step-by-project.component.css'],
  providers: [NzNotificationService, NzModalService]
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
  // Dành cho view tổng hợp
  isSummaryActive: boolean = true;
  selectedSummaryGateId: number | null = null;
  selectedSummaryDepartmentId: number | null = null;
  summaryGates: any[] = [];
  summaryGateGroups: any[] = [];
  summaryGateDetails: any = null;
  gateList: any[] = [];
  // Chi tiết step khi click trong view tổng hợp
  selectedStepDetail: any = null;
  selectedStepDetailDept: any = null;
  selectedDetailTab: number = 1; // 1: Công việc, 2: Checklist
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
    private appUserService: AppUserService
  ) { }
  ngOnInit(): void {
    if (this.route && this.route.snapshot && this.route.snapshot.queryParams) {
      const q = this.route.snapshot.queryParams;
      if (q['projectId']) this.projectId = Number(q['projectId']);
      if (q['projectCode']) this.projectCode = q['projectCode'];
      if (q['projectName']) this.projectName = q['projectName'];
      if (q['projectStatusName']) this.projectStatusName = q['projectStatusName'];
    }
    if (this.tabData) {
      if (this.tabData.projectId !== undefined) {
        this.projectId = Number(this.tabData.projectId);
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
      error: () => { }
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
      error: (error: any) => {

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
                IsApproved: savedItem.IsApproved,
                IsApprovedTBP: savedItem.IsApprovedTBP,
                CheckLists: savedItem.CheckLists || [],
                Forms: savedItem.Forms || [],
                Workers: []
              };

              if (savedItem.Workers && savedItem.Workers.length > 0) {
                stepObj.Workers = savedItem.Workers.map((w: any) => w.EmployeeID);
                stepObj.PeopleCount = savedItem.Workers.length;
                stepObj.DayCount = savedItem.Workers[0].DayCount;
                stepObj.UnitPrice = savedItem.Workers[0].UnitPrice;
                stepObj.TotalEffort = stepObj.PeopleCount * stepObj.DayCount;
              } else {
                stepObj.PeopleCount = null;
                stepObj.DayCount = null;
                stepObj.UnitPrice = null;
                stepObj.TotalEffort = 1;
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

  updateMenuItems() {
    this.menuItems = this.checkedProjectTypes.map(pt => {
      const isActive = !this.isSummaryActive && this.activeProjectTypeId === pt.ID;
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

  selectProjectType(ptId: number, deptId: number | null): void {
    this.isSummaryActive = false;
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

  getGateGroupNameForMachine(gateCode: string | null | undefined, machineIndex: number): string {
    const roman = this.getRomanNumeral(machineIndex);
    const prefix = `${roman}. `;
    const subGroup1 = `${machineIndex}.1`;
    const subGroup2 = `${machineIndex}.2`;

    if (!gateCode) return `${prefix}${subGroup2} Triển khai G4->G12`;
    const code = gateCode.trim().toUpperCase();
    const match = code.match(/^G(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 0 && num <= 3) {
        return `${prefix}${subGroup1} Giải pháp G0->G3`;
      }
    }
    return `${prefix}${subGroup2} Triển khai G4->G12`;
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

    this.projectTypeStepsMap[comboKey] = [...orderedSteps];
    // Chỉ tính toán lại ngày nếu không có dữ liệu đã lưu cho loại dự án này
    const ptId = Number(comboKey.split('_')[0]);
    const hasSavedData = this.savedGateSteps && this.savedGateSteps.some(x => x.ProjectTypeID === ptId);
    if (!hasSavedData) {
      this.recalculateAllStepsDates(comboKey);
    }
  }

  onStartDateValueChange(item: any, comboKey: string) {
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
      // 1. Bỏ qua các bước đã được chọn trong danh sách
      const isAlreadyAdded = steps.some((s: any) => s.ID === templateStep.ID && !s.isNew);
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

  onGateStepValueChange(item: any) {
    if (item.PeopleCount != null && item.DayCount != null) {
      item.TotalEffort = item.PeopleCount * item.DayCount;
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
          this.buildSummaryData();
        }
      },
      error: (err: any) => {

      }
    });
  }

  selectSummaryView(): void {
    this.isSummaryActive = true;
    this.activeProjectTypeId = null;
    this.activeDepartmentId = null;
    this.updateMenuItems();
    this.buildSummaryData();
  }

  buildSummaryData(): void {
    if (!this.savedGateSteps || this.savedGateSteps.length === 0) {
      this.summaryGates = [];
      this.summaryGateGroups = [];
      return;
    }

    const gateMap: { [gateId: number]: any } = {};

    this.savedGateSteps.forEach(link => {
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

      if (link.PlanEndDate || link.EndDate || link.Deadline || link.EndDatePlan) {
        planEndDateStr = String(link.PlanEndDate || link.EndDate || link.Deadline || link.EndDatePlan).substring(0, 10);
        planEndDateObj = DateTime.fromISO(planEndDateStr);
      } else if (startDateStr) {
        const startDt = DateTime.fromISO(startDateStr);
        if (startDt.isValid) {
          planEndDateObj = startDt.plus({ days: dayCount > 0 ? dayCount : 1 });
          planEndDateStr = planEndDateObj.toFormat('yyyy-MM-dd');
        }
      }

      // Kiểm tra công đoạn bị chậm tiến độ (Ngày kết thúc dự kiến < Ngày hiện tại và chưa xong/chưa duyệt)
      const today = DateTime.now().startOf('day');
      let isStepDelayed = false;

      if (link.IsLate === 1 || link.IsLate === true || link.IsDelayed === 1 || link.IsDelayed === true || link.isLate || link.isDelayed) {
        isStepDelayed = true;
      } else if (planEndDateObj && planEndDateObj.isValid && planEndDateObj < today && !link.IsApproved && !isCompleted) {
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
        projectTaskID: link.ProjectTaskID
      });
    });

    const gates = Object.values(gateMap).map((g: any) => {
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
    this.summaryGateDetails = this.summaryGates.find(g => g.gateId === gateId) || null;
    this.selectedStepDetail = null;
    this.selectedStepDetailDept = null;
    this.detailTasks = [];
    this.selectedRuleInTab = null;
    this.displayFilesInTab = [];
    this.scrollToSelectedGate(gateId);
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
    }
  }

  openGateTaskDetailTab(): void {
    if (!this.selectedStepDetail) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn công đoạn để xem chi tiết công việc!');
      return;
    }

    const step = this.selectedStepDetail;
    const dept = this.selectedStepDetailDept;
    const gate = this.summaryGateDetails;

    const tabKey = `gate-task-detail-${step.stepLinkId || step.projectTaskID || Date.now()}`;
    const gateLabel = gate ? `${gate.gateCode}` : 'Gate';
    const stepLabel = step.content ? step.content : 'Công việc';

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
        stepContent: step.content || '',
        deptName: dept?.deptName || '',
        projectTaskId: step.projectTaskID,
        detailTasks: this.detailTasks,
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
    console.log('openFormsModal clicked item:', item, 'resolved stepId:', stepId);

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
