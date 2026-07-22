import { Component, Input, OnInit, Optional, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { ProjectService } from '../../project-service/project.service';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectTypeDepartmentService } from '../../project-gate/project-type-department/project-type-department.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { ProjectWorkerService } from '../../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectGateStepFilesModalComponent } from '../project-gate-step-files-modal/project-gate-step-files-modal.component';

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
    ProjectGateStepFilesModalComponent
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
  summaryGates: any[] = [];
  summaryGateDetails: any = null;
  gateList: any[] = [];

  // Chi tiết step khi click trong view tổng hợp
  selectedStepDetail: any = null;
  selectedStepDetailDept: any = null;
  selectedDetailTab: number = 1; // 1: Công việc, 2: Checklist
  detailTasks: any[] = [];
  isLoadingDetailTasks: boolean = false;

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
    private tabService: TabServiceService,
    private projectGateStepService: ProjectGateStepService,
    private projectService: ProjectService,
    private authService: AuthService,
    private notification: NzNotificationService,
    private projectTypeDeptService: ProjectTypeDepartmentService,
    private projectWorkerService: ProjectWorkerService,
    private modalService: NzModalService,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
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
    }

    this.isLoading = true;
    this.getUsers();
    this.loadDepartments();
    this.loadProjectTypeDepartmentLinks();
    this.getFollowProjectBase();
    this.getProjectTypeLinks();
    this.loadAllGateSteps();
    this.loadTemplates();
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
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi getUsers:', error);
      }
    });
  }

  getFollowProjectBase(): void {
    this.projectService.getFollowProjectBases(this.projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.expectedPlanDate = res.data.ExpectedPlanDate
            ? DateTime.fromISO(res.data.ExpectedPlanDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.createDate = res.data.CreatedDate
            ? DateTime.fromISO(res.data.CreatedDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
        }
      },
      error: (error: any) => {
        console.error('Lỗi getFollowProjectBases:', error);
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
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi getProjectTypeLinks:', error);
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

    // Đặt loại dự án và phòng ban hoạt động thành mục đầu tiên nếu chưa được chọn
    if (this.groupedMenuDepartments.length > 0 && !this.activeProjectTypeId) {
      const firstGroup = this.groupedMenuDepartments[0];
      if (firstGroup.projectTypes && firstGroup.projectTypes.length > 0) {
        const pt = firstGroup.projectTypes[0];
        this.activeProjectTypeId = pt.ID;
        this.activeDepartmentId = firstGroup.id;
        const key = `${pt.ID}_${firstGroup.id}`;
        this.selectedTemplateId = this.projectTypeTemplateMap[key] || null;
        this.updateMenuItems();
      }
    }

    this.updateMenuItems();
    this.updateTabsSteps();
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
              this.updateTabsSteps();
              this.buildSummaryData();
            },
            error: (err: any) => {
              console.error('Error loading saved gate steps:', err);
              this.savedGateSteps = [];
              this.isGateStepsLoaded = true;
              this.updateTabsSteps();
              this.buildSummaryData();
            }
          });
        } else {
          this.savedGateSteps = [];
          this.isGateStepsLoaded = true;
          this.isLoading = false;
          this.updateTabsSteps();
          this.buildSummaryData();
        }
      },
      error: (err: any) => {
        console.error('Error loading gate steps:', err);
        this.isGateStepsLoaded = true;
        this.isLoading = false;
      }
    });
  }

  updateTabsSteps() {
    if (!this.allGateSteps || this.allGateSteps.length === 0) {
      return;
    }
    if (!this.isGateStepsLoaded) {
      return;
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
            // Chỉ bao gồm các công đoạn tồn tại trong dữ liệu đã lưu cho sự kết hợp này
            steps = allSteps.filter((step: any) => savedForThisCombo.some((s: any) => s.ProjectGateStepID === step.ID));
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

              const savedItems = savedForThisCombo.filter((x: any) => x.ProjectGateStepID === step.ID);
              const originalItem = savedItems.find((x: any) => !x.IsRepeat) || savedItems[0];
              const repeatedItem = savedItems.find((x: any) => x.IsRepeat);

              if (originalItem) {
                step.ProjectGateStepLinkID = originalItem.ID;
                step.IsApproved = originalItem.IsApproved;
                step.StartDate = originalItem.StartDate ? originalItem.StartDate.substring(0, 10) : null;
                step.isRepeatChecked = !!repeatedItem;

                if (originalItem.CheckLists && originalItem.CheckLists.length > 0) {
                  step.CheckLists = (step.CheckLists || []).map((tc: any) => {
                    const savedLink = originalItem.CheckLists.find((c: any) => c.ProjectGateStepCheckListID === tc.ID);
                    if (savedLink) {
                      return {
                        ...savedLink,
                        Description: tc.Description || savedLink.Description,
                        IsRequired: tc.IsCheck || savedLink.IsRequired || tc.IsRequired,
                        Type: tc.Type || savedLink.Type
                      };
                    }
                    return {
                      ID: 0,
                      ProjectGateStepCheckListID: tc.ID,
                      PathFolder: tc.PathFolder || '',
                      IsPass: false,
                      IsRequired: tc.IsCheck || tc.IsRequired,
                      Description: tc.Description,
                      Type: tc.Type,
                      Files: []
                    };
                  });
                }

                if (originalItem.Workers && originalItem.Workers.length > 0) {
                  step.Workers = originalItem.Workers.map((w: any) => w.EmployeeID);
                  step.PeopleCount = originalItem.Workers.length;
                  step.DayCount = originalItem.Workers[0].DayCount;
                  step.UnitPrice = originalItem.Workers[0].UnitPrice;
                  step.TotalEffort = step.PeopleCount * step.DayCount;
                }
              }
            });
          } else {
            // Không có dữ liệu đã lưu — mặc định là rỗng; người dùng phải chọn một mẫu hoặc thêm thủ công
            steps = [];
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
              repeatedStep.StartDate = repeatedItem.StartDate ? repeatedItem.StartDate.substring(0, 10) : null;

              if (repeatedItem.CheckLists && repeatedItem.CheckLists.length > 0) {
                repeatedStep.CheckLists = (repeatedStep.CheckLists || []).map((tc: any) => {
                  const savedLink = repeatedItem.CheckLists.find((c: any) => c.ProjectGateStepCheckListID === tc.ID);
                  if (savedLink) {
                    return {
                      ...savedLink,
                      Description: tc.Description || savedLink.Description,
                      IsRequired: tc.IsCheck || savedLink.IsRequired || tc.IsRequired,
                      Type: tc.Type || savedLink.Type
                    };
                  }
                  return {
                    ID: 0,
                    ProjectGateStepCheckListID: tc.ID,
                    PathFolder: tc.PathFolder || '',
                    IsPass: false,
                    IsRequired: tc.IsCheck || tc.IsRequired,
                    Description: tc.Description,
                    Type: tc.Type,
                    Files: []
                  };
                });
              }

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
      const isActive = this.activeProjectTypeId === pt.ID;
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

  selectProjectType(ptId: number, deptId: number | null): void {
    this.isSummaryActive = false;
    this.activeProjectTypeId = ptId;
    this.activeDepartmentId = deptId;
    const key = `${ptId}_${deptId}`;
    this.selectedTemplateId = this.projectTypeTemplateMap[key] || null;
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

    steps.sort((a: any, b: any) => {
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

    const counters: { [key: string]: number } = {};

    steps.forEach((step: any) => {
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
      if (!counters[prefix]) {
        counters[prefix] = 1;
      }
      step.TT = `${prefix}.${counters[prefix]}`;
      counters[prefix]++;
    });

    this.projectTypeStepsMap[comboKey] = [...steps];
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
    if (this.projectTypeStepsMap[comboKey]) {
      const steps = this.projectTypeStepsMap[comboKey];
      const stepToDelete = steps.find((s: any) => s.ID === stepId);
      if (stepToDelete) {
        if (stepToDelete.isRepeated) {
          const parent = steps.find((s: any) => s.ID === stepToDelete.parentStepId);
          if (parent) {
            parent.isRepeatChecked = false;
          }
        } else {
          this.projectTypeStepsMap[comboKey] = steps.filter(
            (step: any) => step.ID !== stepId && !(step.isRepeated && step.parentStepId === stepId)
          );
          this.recalculateSequenceNumbers(comboKey);
          return;
        }
      }
      this.projectTypeStepsMap[comboKey] = steps.filter(
        (step: any) => step.ID !== stepId
      );
      this.recalculateSequenceNumbers(comboKey);
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

  // Bộ xử lý tra cứu/chọn nhân viên thực hiện
  getWorkersDisplay(workerIds: any[]): string {
    if (!workerIds || workerIds.length === 0) return '';
    return this.usersFlat
      .filter(u => workerIds.includes(u.EmployeeID))
      .map(u => u.FullName)
      .join(', ');
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

  addBlankStep(comboKey: string) {
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
      ID: -Date.now(),
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
    const deptIdStr = comboKey.split('_')[1];
    const deptId = deptIdStr === 'null' ? null : Number(deptIdStr);

    return this.allGateSteps.filter((templateStep: any) =>
      !steps.some((s: any) => s.ID === templateStep.ID && !s.isNew) &&
      (deptId === null || (templateStep.DepartmentIDs && templateStep.DepartmentIDs.includes(deptId)))
    );
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

  save() {
    this.isSaving = true;
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
            ProjectGateStepID: s.isRepeated ? s.parentStepId : s.ID,
            ProjectTypeID: typeId,
            StartDate: s.StartDate,
            IsRepeat: s.isRepeated ? true : false,
            Content: s.Content,
            DayCount: s.DayCount,
            PeopleCount: s.PeopleCount,
            DepartmentID: deptId,
            ProjectGateStepTemplateID: templateId,
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

    const payload = {
      ProjectID: this.projectId,
      Steps: allSteps
    };

    this.projectGateStepService.saveGateStepLink(payload).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (res: any) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thông tin nhân công dự án thành công!', {
          nzStyle: { fontSize: '12px' }
        });
        this.closeModal();
      },
      error: (err: any) => {
        console.error('Error saving Manpower steps:', err);
        const msg = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu nhân công!';
        this.notification.error(NOTIFICATION_TITLE.error, msg, {
          nzStyle: { fontSize: '12px' }
        });
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
        console.error('Error loading templates:', err);
      }
    });
  }

  selectSummaryView(): void {
    this.isSummaryActive = true;
    this.activeProjectTypeId = null;
    this.activeDepartmentId = null;
    this.buildSummaryData();
  }

  buildSummaryData(): void {
    if (!this.savedGateSteps || this.savedGateSteps.length === 0) {
      this.summaryGates = [];
      return;
    }

    const gateMap: { [gateId: number]: any } = {};

    this.savedGateSteps.forEach(link => {
      const stepDef = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
      if (!stepDef) return;

      const gateId = stepDef.ProjectGateID;
      if (!gateId) return;

      const gateMeta = this.gateList.find(g => g.ID === gateId);
      const gateType = gateMeta ? gateMeta.Type : 1;

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

      gateMap[gateId].departments[deptId].steps.push({
        stepLinkId: link.ID,
        projectGateStepID: link.ProjectGateStepID,
        content: stepDef.Content || 'Không nội dung',
        startDate: link.StartDate,
        isApproved: link.IsApproved,
        totalChecklists: totalChecklists,
        passedChecklists: passedChecklists,
        isCompleted: isCompleted,
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
        return {
          ...d,
          totalSteps,
          completedSteps,
          approvedSteps,
          isApproved,
          progress
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

      return {
        ...g,
        departments: deptsArray,
        totalSteps: totalGateSteps,
        completedSteps: completedGateSteps,
        totalDepartments,
        approvedDepartments,
        progress: gateProgress
      };
    });

    gates.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.gateCode.localeCompare(b.gateCode);
    });

    this.summaryGates = gates;

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

  getDepartmentName(deptId: number): string {
    if (deptId === 0) return 'Mẫu chung';
    const dept = this.departments.find(d => d.ID === deptId);
    return dept ? dept.Name : `Phòng ban ID ${deptId}`;
  }

  selectSummaryGate(gateId: number): void {
    this.selectedSummaryGateId = gateId;
    this.summaryGateDetails = this.summaryGates.find(g => g.gateId === gateId) || null;
    this.selectedStepDetail = null;
    this.selectedStepDetailDept = null;
    this.detailTasks = [];
  }

  selectStepDetail(step: any, dept: any): void {
    if (this.selectedStepDetail && this.selectedStepDetail.stepLinkId === step.stepLinkId) {
      this.selectedStepDetail = null;
      this.selectedStepDetailDept = null;
      this.detailTasks = [];
      return;
    }

    this.selectedStepDetail = step;
    this.selectedStepDetailDept = dept;
    this.detailTasks = [];
    this.selectedDetailTab = 1; // Mặc định chuyển về Tab 1 khi click chọn bước mới

    if (step.projectTaskID) {
      this.isLoadingDetailTasks = true;
      this.projectGateStepService.getProjectItemParentChild(step.projectTaskID).subscribe({
        next: (res: any) => {
          this.detailTasks = res?.data || [];
          this.isLoadingDetailTasks = false;
        },
        error: (err: any) => {
          console.error('Error fetching parent-child tasks:', err);
          this.isLoadingDetailTasks = false;
        }
      });
    } else {
      console.warn('selectStepDetail - step.projectTaskID is null/undefined. No API call triggered.');
    }
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
            ProjectTypeName: this.getProjectTypeName(link.ProjectTypeID),
            selected: false
          };
        });
        this.isLoadingDeleted = false;
      },
      error: (err: any) => {
        console.error('Error loading deleted steps:', err);
        const msg = err?.error?.message || err?.message || 'Không thể tải danh sách đã xóa!';
        this.notification.error(NOTIFICATION_TITLE.error, msg, {
          nzStyle: { fontSize: '12px' }
        });
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
      // Find the department groups that contain this project type
      const deptGroups = this.groupedMenuDepartments.filter(g =>
        g.projectTypes.some((pt: any) => pt.ID === ptId)
      );
      const comboKeys: string[] = deptGroups.length > 0
        ? deptGroups.map(g => `${ptId}_${g.id}`)
        : [`${ptId}_null`];

      comboKeys.forEach(comboKey => {
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
        }

        this.recalculateSequenceNumbers(comboKey);
      });
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
        console.error('Error loading departments:', err);
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
        console.error('Error loading project type department links:', err);
      }
    });
  }

  updateGroupedMenuDepartments(): void {
    if (!this.checkedProjectTypes || this.checkedProjectTypes.length === 0 || this.departments.length === 0) {
      this.groupedMenuDepartments = [];
      return;
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
      groups.push({
        id: deptId,
        name: deptName,
        projectTypes: pts
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
    return item.CheckLists.filter((c: any) => c.IsApprovedTBP === true).length;
  }

  isStepPassed(item: any): boolean {
    return item?.IsApproved === true;
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
    this.contextMenuItems = [
      {
        label: 'Tải file lên (Upload file)',
        icon: 'pi pi-upload text-primary',
        command: () => this.triggerFileUpload(item)
      }
    ];

    if (this.cm) {
      this.cm.show(event);
    }
    event.preventDefault();
    event.stopPropagation();
  }

  triggerFileUpload(item: any, cl?: any) {
    if (!item) return;
    let targetCl = cl;
    if (!targetCl && item.CheckLists) {
      targetCl = item.CheckLists.find((c: any) => c.PathFolder && c.PathFolder.trim() !== '');
    }
    if (!targetCl) return;

    const pathFolder = targetCl.PathFolder;
    const subPath = this.getRelativeSubPath(pathFolder);

    if (!subPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xác định đường dẫn lưu file!');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      const filesToUpload = Array.from(files);
      this.notification.info('Đang upload', 'Đang tải file lên...');

      this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            const uploadedFiles = res.data || [];
            if (uploadedFiles.length > 0) {
              const saveRequests: Observable<any>[] = uploadedFiles.map((fData: any) => {
                const fileDto = {
                  FileName: fData.savedFileName || fData.SavedFileName || fData.originalFileName || fData.OriginalFileName,
                  FilePath: fData.filePath || fData.FilePath,
                  FileSize: fData.fileSize || fData.FileSize,
                  ContentType: fData.contentType || fData.ContentType
                };
                return this.projectGateStepService.saveFile(targetCl.ID, fileDto);
              });

              forkJoin(saveRequests).subscribe({
                next: (saveResults: any[]) => {
                  this.notification.success(NOTIFICATION_TITLE.success, `Đã tải lên và lưu ${uploadedFiles.length} file thành công!`);
                  targetCl.IsPass = true;

                  // Thêm file vào mảng cục bộ để update UI
                  targetCl.Files = targetCl.Files || [];
                  saveResults.forEach((saveRes: any, index: number) => {
                    const fData = uploadedFiles[index];
                    if (saveRes?.status === 1) {
                      targetCl.Files.push({
                        ID: saveRes.data,
                        FileName: fData.originalFileName || fData.OriginalFileName || fData.savedFileName || fData.SavedFileName,
                        FilePath: fData.filePath || fData.FilePath,
                        FileSize: fData.fileSize || fData.FileSize,
                        ContentType: fData.contentType || fData.ContentType,
                        CreatedBy: 'You',
                        CreatedDate: new Date()
                      });
                    }
                  });
                },
                error: (saveErr: any) => {
                  console.error('Lỗi lưu file vào DB:', saveErr);
                  this.notification.error(NOTIFICATION_TITLE.error, 'Tải file lên thành công nhưng không thể ghi nhận dữ liệu vào cơ sở dữ liệu.');
                }
              });
            } else {
              this.notification.success(NOTIFICATION_TITLE.success, `Tải file lên thành công!`);
              targetCl.IsPass = true;
            }
          } else {
            const msg = res?.message || 'Upload file không thành công.';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          }
        },
        error: (error: any) => {
          console.error('Lỗi upload file:', error);
          const msg = error.message || 'Lỗi kết nối khi tải file lên.';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
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

    modalRef.result
      .then((result: any) => {
        this.loadAllGateSteps();
      })
      .catch((error: any) => {
        this.loadAllGateSteps();
      });
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

  /** Lấy danh sách item đã được chọn thuộc tab đang hiển thị */
  getSelectedSavedSteps(): any[] {
    const key = this.activeProjectTypeId + '_' + this.activeDepartmentId;
    const steps = this.projectTypeStepsMap[key] || [];
    return steps.filter((s: any) => !s.isNew && s.ProjectGateStepLinkID && this.selectedStepLinkIds.has(s.ProjectGateStepLinkID));
  }

  /** Entry point: hỏi xác nhận rồi gọi API duyệt */
  confirmApproveMultiple(isApproved: boolean): void {
    const selected = this.getSelectedSavedSteps();
    if (!selected.length) {
      this.notification.warning('Chú ý', 'Vui lòng chọn ít nhất một công đoạn.');
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
      nzOnOk: () => this.doApproveMultiple(selected.map((s: any) => s.ProjectGateStepLinkID), isApproved)
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

        // Thành công
        const action = isApproved ? 'Duyệt' : 'Hủy duyệt';
        this.notification.success('Thành công', data?.Message || `${action} thành công`);
        this.selectedStepLinkIds.clear();
        
        // Reload dữ liệu từ server để cập nhật savedGateSteps
        this.projectGateStepService.getByProject(this.projectId).subscribe({
          next: (res: any) => {
            this.savedGateSteps = res.data || [];
            // Rebuild projectTypeStepsMap từ savedGateSteps đã cập nhật
            this.updateTabsSteps();
            // Cập nhật summary data
            this.buildSummaryData();
            // Trigger change detection
            this.cdr.markForCheck();
          },
          error: (err: any) => {
            console.error('Lỗi', err);
          }
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Lỗi không xác định';
        this.notification.error('Lỗi', msg);
      },
      complete: () => {
        this.isApprovingMultiple = false;
      }
    });
  }
}
