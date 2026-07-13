import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
import { combineLatest } from 'rxjs';
import { DateTime } from 'luxon';
import { finalize } from 'rxjs/operators';

import { ProjectGateStepService } from '../project-gate-step.service';
import { ProjectService } from '../../project-service/project.service';
import { AuthService } from '../../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { TabServiceService } from '../../../../layouts/tab-service.service';

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
    MenubarModule
  ],
  templateUrl: './project-gate-step-by-project.component.html',
  styleUrls: ['./project-gate-step-by-project.component.css'],
  providers: [NzNotificationService, NzModalService]
})
export class ProjectGateStepByProjectComponent implements OnInit {
  @Input() projectId!: number;
  @Input() projectCode!: string;
  @Input() projectName!: string;

  activeProjectTypeId: number | null = null;
  checkedProjectTypes: any[] = [];
  menuItems: MenuItem[] = [];
  allGateSteps: any[] = [];
  projectTypeStepsMap: { [key: number]: any[] } = {};
  savedGateSteps: any[] = [];
  isGateStepsLoaded: boolean = false;

  usersFlat: any[] = [];
  users: any[] = [];
  projectTypeNodes: TreeNode[] = [];
  selectedTypeNodes: TreeNode[] = [];

  expectedPlanDate: string | null = null;
  createDate: string | null = null;
  isSaving: boolean = false;
  isLoading: boolean = false;

  // For deleted steps list
  showDeletedModal: boolean = false;
  isLoadingDeleted: boolean = false;
  deletedSteps: any[] = [];

  // For worker lookup popover
  activeManpowerItem: any = null;
  workersSearchText: string = '';
  workersFilteredData: any[] = [];

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
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    console.log('[ProjectGateStepByProjectComponent] ngOnInit tabData:', this.tabData);
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
    console.log('[ProjectGateStepByProjectComponent] resolved projectId:', this.projectId);

    this.isLoading = true;
    this.getUsers();
    this.getFollowProjectBase();
    this.getProjectTypeLinks();
    this.loadAllGateSteps();
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
    console.log('[ProjectGateStepByProjectComponent] getProjectTypeLinks called with projectId:', this.projectId);
    combineLatest([
      this.projectService.getProjectTypeLinks(this.projectId),
      this.projectService.getProjectApplicationLinks(this.projectId),
      this.projectService.getProjectTechnologyLinks(this.projectId)
    ]).subscribe({
      next: ([responseLinks, responseApps, responseTechs]: any) => {
        console.log('[ProjectGateStepByProjectComponent] responseLinks:', responseLinks);
        console.log('[ProjectGateStepByProjectComponent] responseApps:', responseApps);
        console.log('[ProjectGateStepByProjectComponent] responseTechs:', responseTechs);
        const links = responseLinks.data || [];
        const apps = (responseApps.data || []);
        const techs = (responseTechs.data || []);

        links.forEach((item: any) => {
          item.ApplicationTypeIDs = apps.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.ApplicationTypeID);
          item.TechnologyIDs = techs.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.TechnologyID);
        });

        const treeData = this.projectService.setDataTree(links, 'ID');
        this.projectTypeNodes = this.mapToTreeNodes(treeData);

        // Sync initial selection
        this.selectedTypeNodes = [];
        this.getFlatNodes(this.projectTypeNodes, this.selectedTypeNodes);
        console.log('[ProjectGateStepByProjectComponent] selectedTypeNodes:', this.selectedTypeNodes);
        this.updateCheckedProjectTypes();
        console.log('[ProjectGateStepByProjectComponent] checkedProjectTypes:', this.checkedProjectTypes);
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

    // Set active Project Type to the first tab if not selected yet
    if (this.checkedProjectTypes.length > 0 && !this.activeProjectTypeId) {
      this.activeProjectTypeId = this.checkedProjectTypes[0].ID;
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
            },
            error: (err: any) => {
              console.error('Error loading saved gate steps:', err);
              this.savedGateSteps = [];
              this.isGateStepsLoaded = true;
              this.updateTabsSteps();
            }
          });
        } else {
          this.savedGateSteps = [];
          this.isGateStepsLoaded = true;
          this.isLoading = false;
          this.updateTabsSteps();
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
    this.checkedProjectTypes.forEach(pt => {
      if (!this.projectTypeStepsMap[pt.ID]) {
        const allSteps = JSON.parse(JSON.stringify(this.allGateSteps));

        // Check if there is saved data for this project type
        const savedForThisType = (this.savedGateSteps || []).filter((x: any) => x.ProjectTypeID === pt.ID);

        let steps: any[];

        if (savedForThisType.length > 0) {
          // Only include steps that exist in saved data
          steps = allSteps.filter((step: any) => savedForThisType.some((s: any) => s.ProjectGateStepID === step.ID));
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

            const savedItems = savedForThisType.filter((x: any) => x.ProjectGateStepID === step.ID);
            const originalItem = savedItems.find((x: any) => !x.IsRepeat) || savedItems[0];
            const repeatedItem = savedItems.find((x: any) => x.IsRepeat);

            if (originalItem) {
              step.StartDate = originalItem.StartDate ? originalItem.StartDate.substring(0, 10) : null;
              step.isRepeatChecked = !!repeatedItem;

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
          // No saved data - use all default steps
          steps = allSteps;
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

        this.projectTypeStepsMap[pt.ID] = steps;

        steps.filter((s: any) => s.isRepeatChecked).forEach((s: any) => {
          this.addRepeatedStep(pt.ID, s);

          // Bind data for the repeated step
          const repeatedStep = this.projectTypeStepsMap[pt.ID].find((x: any) => x.isRepeated && x.parentStepId === s.ID);
          const repeatedItem = savedForThisType.find((x: any) => x.ProjectGateStepID === s.ID && x.IsRepeat);

          if (repeatedStep && repeatedItem) {
            repeatedStep.StartDate = repeatedItem.StartDate ? repeatedItem.StartDate.substring(0, 10) : null;
            if (repeatedItem.Workers && repeatedItem.Workers.length > 0) {
              repeatedStep.Workers = repeatedItem.Workers.map((w: any) => w.EmployeeID);
              repeatedStep.PeopleCount = repeatedItem.Workers.length;
              repeatedStep.DayCount = repeatedItem.Workers[0].DayCount;
              repeatedStep.UnitPrice = repeatedItem.Workers[0].UnitPrice;
              repeatedStep.TotalEffort = repeatedStep.PeopleCount * repeatedStep.DayCount;
            }
          }
        });

        this.recalculateSequenceNumbers(pt.ID);
      }
    });

    const checkedIds = this.checkedProjectTypes.map(pt => pt.ID);
    Object.keys(this.projectTypeStepsMap).forEach(key => {
      const id = Number(key);
      if (!checkedIds.includes(id)) {
        delete this.projectTypeStepsMap[id];
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
          this.selectProjectType(pt.ID);
        }
      };
    });
  }

  selectProjectType(ptId: number): void {
    this.activeProjectTypeId = ptId;
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

  onRepeatToggle(ptId: number, item: any) {
    if (item.isRepeatChecked) {
      this.addRepeatedStep(ptId, item);
    } else {
      this.removeRepeatedStep(ptId, item);
    }
    this.recalculateSequenceNumbers(ptId);
  }

  addRepeatedStep(ptId: number, item: any) {
    const steps = this.projectTypeStepsMap[ptId] || [];
    const alreadyExists = steps.some((step: any) => step.isRepeated && step.parentStepId === item.ID);
    if (alreadyExists) return;

    const repeatedStep = JSON.parse(JSON.stringify(item));
    repeatedStep.ID = -Date.now() - Math.floor(Math.random() * 1000);
    repeatedStep.machineIndex = 2; // Duplicated to Machine II
    repeatedStep.isRepeated = true;
    repeatedStep.parentStepId = item.ID;
    repeatedStep.isRepeatChecked = false;
    repeatedStep.groupName = this.getGateGroupNameForMachine(item.GateCode, 2);
    repeatedStep.repeatOrder = Date.now();

    this.projectTypeStepsMap[ptId] = [...steps, repeatedStep];
  }

  removeRepeatedStep(ptId: number, item: any) {
    if (this.projectTypeStepsMap[ptId]) {
      this.projectTypeStepsMap[ptId] = this.projectTypeStepsMap[ptId].filter(
        (step: any) => !(step.isRepeated && step.parentStepId === item.ID)
      );
    }
  }

  recalculateSequenceNumbers(ptId: number) {
    const steps = this.projectTypeStepsMap[ptId] || [];

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

    this.projectTypeStepsMap[ptId] = [...steps];
    // Only recalculate dates if there is no saved data for this project type
    const hasSavedData = this.savedGateSteps && this.savedGateSteps.some(x => x.ProjectTypeID === ptId);
    if (!hasSavedData) {
      this.recalculateAllStepsDates(ptId);
    }
  }

  onStartDateValueChange(item: any, ptId: number) {
    const steps = this.projectTypeStepsMap[ptId] || [];
    const index = steps.findIndex((s: any) => s.ID === item.ID);
    if (index !== -1) {
      this.updateSubsequentStepsDates(ptId, index);
    }
  }

  updateSubsequentStepsDates(ptId: number, startFromIndex: number) {
    const steps = this.projectTypeStepsMap[ptId] || [];
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

  recalculateAllStepsDates(ptId: number) {
    const steps = this.projectTypeStepsMap[ptId] || [];
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

  removeStep(projectTypeId: number, stepId: number) {
    if (this.projectTypeStepsMap[projectTypeId]) {
      const steps = this.projectTypeStepsMap[projectTypeId];
      const stepToDelete = steps.find((s: any) => s.ID === stepId);
      if (stepToDelete) {
        if (stepToDelete.isRepeated) {
          const parent = steps.find((s: any) => s.ID === stepToDelete.parentStepId);
          if (parent) {
            parent.isRepeatChecked = false;
          }
        } else {
          this.projectTypeStepsMap[projectTypeId] = steps.filter(
            (step: any) => step.ID !== stepId && !(step.isRepeated && step.parentStepId === stepId)
          );
          this.recalculateSequenceNumbers(projectTypeId);
          return;
        }
      }
      this.projectTypeStepsMap[projectTypeId] = steps.filter(
        (step: any) => step.ID !== stepId
      );
      this.recalculateSequenceNumbers(projectTypeId);
    }
  }

  isFirstSubgroupOfMachine(ptId: number, item: any): boolean {
    const steps = this.projectTypeStepsMap[ptId] || [];
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

  getTotalEffort(ptId: number): number {
    const steps = this.projectTypeStepsMap[ptId] || [];
    return steps.reduce((sum, item) => sum + (Number(item.TotalEffort) || 0), 0);
  }

  getTotalAmount(ptId: number): number {
    const steps = this.projectTypeStepsMap[ptId] || [];
    return steps.reduce((sum, item) => {
      const effort = Number(item.TotalEffort) || 0;
      const price = Number(item.UnitPrice) || 0;
      return sum + (effort * price);
    }, 0);
  }

  getGroupTotalEffort(ptId: number, groupName: string): number {
    const steps = this.projectTypeStepsMap[ptId] || [];
    return steps
      .filter(x => x.groupName === groupName)
      .reduce((sum, item) => sum + (Number(item.TotalEffort) || 0), 0);
  }

  getGroupTotalAmount(ptId: number, groupName: string): number {
    const steps = this.projectTypeStepsMap[ptId] || [];
    return steps
      .filter(x => x.groupName === groupName)
      .reduce((sum, item) => {
        const effort = Number(item.TotalEffort) || 0;
        const price = Number(item.UnitPrice) || 0;
        return sum + (effort * price);
      }, 0);
  }

  // Workers selection lookup handlers
  getWorkersDisplay(workerIds: any[]): string {
    if (!workerIds || workerIds.length === 0) return '';
    return this.usersFlat
      .filter(u => workerIds.includes(u.EmployeeID))
      .map(u => u.FullName)
      .join(', ');
  }

  openWorkersLookup(event: Event, item: any, lookupPanel: any) {
    this.activeManpowerItem = item;
    this.workersSearchText = '';
    this.filterWorkersData();
    lookupPanel.toggle(event);
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
      let typeId = Number(key);
      let steps = (this.projectTypeStepsMap as any)[key].map((s: any) => {
        return {
          ProjectGateStepID: s.isRepeated ? s.parentStepId : s.ID,
          ProjectTypeID: typeId,
          StartDate: s.StartDate,
          IsRepeat: s.isRepeated ? true : false,
          Content: s.Content,
          DayCount: s.DayCount,
          PeopleCount: s.PeopleCount,
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
        this.notification.success('Thành công', 'Lưu thông tin nhân công dự án thành công!', {
          nzStyle: { fontSize: '12px' }
        });
        this.closeModal();
      },
      error: (err: any) => {
        console.error('Error saving Manpower steps:', err);
        const msg = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu nhân công!';
        this.notification.error('Thất bại', msg, {
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

  getDeletedSteps() {
    this.isLoadingDeleted = true;
    this.deletedSteps = [];
    this.projectGateStepService.getDeletedByProject(this.projectId).subscribe({
      next: (res: any) => {
        const deletedLinks = res.data || [];
        // Map to template steps to show full details
        this.deletedSteps = deletedLinks.map((link: any) => {
          const template = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
          return {
            ...link,
            GateCode: template?.GateCode || '',
            GateName: template?.GateName || '',
            Content: template?.Content || '',
            DepartmentNames: template?.DepartmentNames || '',
            selected: false
          };
        });
        this.isLoadingDeleted = false;
      },
      error: (err: any) => {
        console.error('Error loading deleted steps:', err);
        const msg = err?.error?.message || err?.message || 'Không thể tải danh sách đã xóa!';
        this.notification.error('Thất bại', msg, {
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
      if (!this.projectTypeStepsMap[ptId]) {
        this.projectTypeStepsMap[ptId] = [];
      }

      const steps = this.projectTypeStepsMap[ptId];
      const template = this.allGateSteps.find(s => s.ID === link.ProjectGateStepID);
      if (!template) return;

      if (link.IsRepeat) {
        // Parent original step needs to be present in active steps
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

        // Add repeated step
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
        // Original step
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

        existingStep.StartDate = link.StartDate ? link.StartDate.substring(0, 10) : null;
        if (link.Workers && link.Workers.length > 0) {
          existingStep.Workers = link.Workers.map((w: any) => w.EmployeeID);
          existingStep.PeopleCount = link.Workers.length;
          existingStep.DayCount = link.Workers[0].DayCount;
          existingStep.UnitPrice = link.Workers[0].UnitPrice;
          existingStep.TotalEffort = existingStep.PeopleCount * existingStep.DayCount;
        }
      }

      this.recalculateSequenceNumbers(ptId);
    });

    this.notification.success('Thành công', 'Khôi phục các bước công việc thành công! Vui lòng bấm "Lưu thông tin" để hoàn tất.', {
      nzStyle: { fontSize: '12px' }
    });
    this.showDeletedModal = false;
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else if (this.tabData && this.tabData._tabKey) {
      this.tabService.closeTabByKey(this.tabData._tabKey);
    }
  }
}
