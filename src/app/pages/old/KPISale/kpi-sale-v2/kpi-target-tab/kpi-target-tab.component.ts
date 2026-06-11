import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { 
  KpiSaleTarget, 
  KpiSalePeriod, 
  KpiSaleTemplate, 
  KpiSaleIndex, 
  EmployeeOption,
  IndexTreeRow 
} from '../kpi-sale-v2.component';

@Component({
  selector: 'app-kpi-target-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTreeSelectModule
  ],
  templateUrl: './kpi-target-tab.component.html',
  styleUrl: './kpi-target-tab.component.css'
})
export class KpiTargetTabComponent implements OnInit {
  @ViewChild('targetFormTemplate') targetFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];
  isLoading = false;
  isApiMode = false;

  // Masters datasets
  templates: KpiSaleTemplate[] = [];
  periods: KpiSalePeriod[] = [];
  employees: EmployeeOption[] = [];
  indexes: KpiSaleIndex[] = [];

  // Filter models
  selectedTemplateId = 0;
  selectedPeriodId = 0;
  selectedEmployeeId = 0;
  searchText = '';

  // Data table source
  targets: KpiSaleTarget[] = [];

  get filteredTargets(): KpiSaleTarget[] {
    return this.targets;
  }

  // Modal draft
  targetDraft: KpiSaleTarget = this.getDefaultTargetDraft();
  targetModalRef?: NzModalRef;

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private tabService: TabServiceService,
    private modalService: NzModalService,
    private notification: NzNotificationService
  ) {}

  onEmployeeSelect(employeeId: number): void {
    this.selectedEmployeeId = employeeId;
    void this.loadTargets();
  }

  ngOnInit(): void {
    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.loadInitialData();
        }
      },
      {
        label: 'Thêm mục tiêu',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => {
          this.openTargetForm();
        }
      }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        templates: this.safeApi<any[]>(this.kpiSaleService.getTemplates()),
        periods: this.safeApi<any[]>(this.kpiSaleService.getPeriods()),
        employees: this.safeApi<any[]>(this.kpiSaleService.getEmployees())
      }));

      this.isApiMode = [
        response.templates,
        response.periods,
        response.employees
      ].some(item => item?.status === 1);

      if (response.templates?.status === 1 && Array.isArray(response.templates.data)) {
        this.templates = response.templates.data.map(item => this.normalizeTemplate(item));
      }
      if (response.periods?.status === 1 && Array.isArray(response.periods.data)) {
        this.periods = response.periods.data.map(item => this.normalizePeriod(item));
      }
      if (response.employees?.status === 1 && Array.isArray(response.employees.data)) {
        this.employees = response.employees.data
          .map(item => this.normalizeEmployee(item))
          .filter(item => item.fullName);
      }

      // Pre-select defaults
      if (this.templates.length > 0 && !this.selectedTemplateId) {
        this.selectedTemplateId = this.templates[0].id;
      }
      if (this.periods.length > 0 && !this.selectedPeriodId) {
        this.selectedPeriodId = this.periods.find(p => !p.isClosed)?.id || this.periods[0].id;
      }
      if (this.employees.length > 0 && !this.selectedEmployeeId) {
        this.selectedEmployeeId = this.employees[0].id;
      }

      await this.onFilterChange();
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể nạp dữ liệu danh mục');
    } finally {
      this.isLoading = false;
    }
  }

  async onFilterChange(): Promise<void> {
    this.isLoading = true;
    try {
      if (this.selectedTemplateId) {
        const indexResponse = await firstValueFrom(
          this.safeApi<any[]>(this.kpiSaleService.getIndexes(this.selectedTemplateId))
        );
        if (indexResponse?.status === 1 && Array.isArray(indexResponse.data)) {
          this.indexes = indexResponse.data.map(item => this.normalizeIndex(item));
        }
      }
      await this.loadTargets();
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadTargets(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.safeApi<any[]>(this.kpiSaleService.getTargets(
          this.selectedEmployeeId || undefined,
          this.selectedPeriodId || undefined,
          this.selectedTemplateId || undefined
        ))
      );
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.targets = response.data.map(item => this.normalizeTarget(item));
      } else {
        // Fallback sample data if API not connected
        if (!this.isApiMode) {
          this.targets = this.getMockTargets();
        } else {
          this.targets = [];
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // --- CRUD Actions ---
  openTargetForm(target?: KpiSaleTarget): void {
    if (target) {
      this.targetDraft = { ...target };
    } else {
      this.targetDraft = this.getDefaultTargetDraft();
    }

    this.targetModalRef = this.modalService.create({
      nzTitle: target ? 'Sửa mục tiêu KPI' : 'Thêm mục tiêu KPI',
      nzContent: this.targetFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.targetModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveTarget()
        }
      ],
      nzWidth: 500
    });
  }

  async saveTarget(): Promise<void> {
    const period = this.periods.find(p => p.id === this.targetDraft.periodId);
    if (!period) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy kỳ KPI');
      return;
    }
    if (period.periodType !== 'MONTH') {
      this.notification.warning('Cảnh báo', 'Chỉ được thiết lập mục tiêu cho kỳ THÁNG. Kỳ QUÝ và NĂM sẽ được tự động tổng hợp từ các tháng.');
      return;
    }
    if (!this.targetDraft.employeeId || !this.targetDraft.periodId || !this.targetDraft.kpiIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đầy đủ thông tin nhân viên, kỳ và chỉ tiêu KPI');
      return;
    }

    this.isLoading = true;
    try {
      if (this.isApiMode) {
        const apiData = this.targetToApi(this.targetDraft);
        const response = await firstValueFrom(this.kpiSaleService.saveTarget(apiData));
        if (response?.status === 1) {
          this.notification.success('Thông báo', response.message || 'Lưu mục tiêu thành công');
          this.tabService.notifyDataSaved('kpi-targets');
          this.targetModalRef?.destroy();
          await this.loadTargets();
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu mục tiêu');
        }
      } else {
        // Client side edit for mock data
        const existingIdx = this.targets.findIndex(t => 
          t.employeeId === this.targetDraft.employeeId && 
          t.periodId === this.targetDraft.periodId && 
          t.kpiIndexId === this.targetDraft.kpiIndexId
        );
        if (existingIdx !== -1) {
          this.targets[existingIdx].goalValue = this.targetDraft.goalValue;
          this.targets = [...this.targets];
        } else {
          const newTarget: KpiSaleTarget = {
            ...this.targetDraft,
            id: this.targets.length ? Math.max(...this.targets.map(t => t.id)) + 1 : 1
          };
          this.targets = [...this.targets, newTarget];
        }
        this.tabService.notifyDataSaved('kpi-targets');
        this.targetModalRef?.destroy();
        this.notification.success('Thông báo', 'Lưu mục tiêu demo thành công');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể lưu mục tiêu');
    } finally {
      this.isLoading = false;
    }
  }

  // --- Draft Handlers ---
  onTargetPeriodChange(val: string): void {
    if (val) {
      this.targetDraft.periodId = Number(val);
      this.onTargetDraftChange();
    }
  }

  async onTargetDraftChange(): Promise<void> {
    if (!this.targetDraft.employeeId || !this.targetDraft.kpiIndexId || !this.targetDraft.periodId) {
      return;
    }

    const period = this.periods.find(p => p.id === this.targetDraft.periodId);
    if (!period) return;

    if (this.isApiMode) {
      try {
        this.isLoading = true;
        const allTargetsResponse = await firstValueFrom(this.safeApi<any[]>(
          this.kpiSaleService.getTargets(this.targetDraft.employeeId, undefined, this.selectedTemplateId)
        ));

        let sumOfChildren = 0;
        let existingTargetValue: number | undefined;

        if (allTargetsResponse?.status === 1 && Array.isArray(allTargetsResponse.data)) {
          const allTargets = allTargetsResponse.data.map(item => this.normalizeTarget(item));
          const existing = allTargets.find(t => t.kpiIndexId === this.targetDraft.kpiIndexId && t.periodId === this.targetDraft.periodId);
          if (existing) {
            existingTargetValue = existing.goalValue;
          }

          if (period.periodType === 'QUARTER' || period.periodType === 'YEAR') {
            let childMonthIds: number[] = [];
            if (period.periodType === 'QUARTER') {
              childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === period.id).map(p => p.id);
            } else if (period.periodType === 'YEAR') {
              const quarterIds = this.periods.filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === period.id).map(p => p.id);
              childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId)).map(p => p.id);
            }

            const childrenTargets = allTargets.filter(t => t.kpiIndexId === this.targetDraft.kpiIndexId && childMonthIds.includes(t.periodId));
            sumOfChildren = childrenTargets.reduce((sum, t) => sum + (t.goalValue || 0), 0);

            if (sumOfChildren > 0 || !existingTargetValue) {
              this.targetDraft.goalValue = sumOfChildren;
            } else if (existingTargetValue) {
              this.targetDraft.goalValue = existingTargetValue;
            }
          } else {
            this.targetDraft.goalValue = existingTargetValue || 0;
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    } else {
      const existing = this.targets.find(item =>
        item.employeeId === this.targetDraft.employeeId &&
        item.periodId === this.targetDraft.periodId &&
        item.kpiIndexId === this.targetDraft.kpiIndexId
      );

      if (period.periodType === 'QUARTER' || period.periodType === 'YEAR') {
        let childMonthIds: number[] = [];
        if (period.periodType === 'QUARTER') {
          childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === period.id).map(p => p.id);
        } else if (period.periodType === 'YEAR') {
          const quarterIds = this.periods.filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === period.id).map(p => p.id);
          childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId)).map(p => p.id);
        }

        const childrenTargets = this.targets.filter(t => t.employeeId === this.targetDraft.employeeId && t.kpiIndexId === this.targetDraft.kpiIndexId && childMonthIds.includes(t.periodId));
        const sumOfChildren = childrenTargets.reduce((sum, t) => sum + (t.goalValue || 0), 0);

        if (sumOfChildren > 0 || !existing) {
          this.targetDraft.goalValue = sumOfChildren;
        } else if (existing) {
          this.targetDraft.goalValue = existing.goalValue;
        }
      } else {
        this.targetDraft.goalValue = existing ? existing.goalValue : 0;
      }
    }
  }

  // --- Getters & Tree helpers ---
  get indexesForTemplate(): KpiSaleIndex[] {
    return this.indexes
      .filter(item => item.templateId === this.selectedTemplateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get filteredEmployees(): EmployeeOption[] {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) return this.employees;
    return this.employees.filter(e => 
      e.code.toLowerCase().includes(keyword) || 
      e.fullName.toLowerCase().includes(keyword) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(keyword))
    );
  }

  // Period nodes for the LEFT SIDEBAR filter — full tree (QUARTER/YEAR/MONTH all visible)
  get sidebarPeriodNodes(): any[] {
    const byParent = new Map<number, KpiSalePeriod[]>();
    for (const p of this.periods) {
      const parentId = p.parentPeriodId || 0;
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(p);
    }

    const buildTree = (parentId: number): any[] => {
      const children = byParent.get(parentId) || [];
      return children.map(p => {
        const hasChildren = byParent.has(p.id) && byParent.get(p.id)!.length > 0;
        return {
          key: p.id.toString(),
          title: p.periodCode,
          isLeaf: !hasChildren,
          children: hasChildren ? buildTree(p.id) : [],
          expanded: true
        };
      });
    };
    return buildTree(0);
  }

  // Period nodes for the TARGET FORM modal — MONTH only (QUARTER/YEAR blocked)
  get formPeriodNodes(): any[] {
    return this.periods
      .filter(p => p.periodType === 'MONTH')
      .map(p => ({
        key: p.id.toString(),
        title: p.periodCode,
        isLeaf: true
      }));
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(item => item.id === employeeId);
    return employee ? `${employee.code} - ${employee.fullName}` : '';
  }

  getPeriodName(periodId: number): string {
    return this.periods.find(item => item.id === periodId)?.periodCode || '';
  }

  getIndexName(indexId: number): string {
    return this.indexes.find(item => item.id === indexId)?.indexName || '';
  }

  trackById(_index: number, item: any): number {
    return item.id || item.index?.id || _index;
  }

  getDefaultTargetDraft(): KpiSaleTarget {
    return {
      id: 0,
      employeeId: this.selectedEmployeeId || this.employees[0]?.id || 0,
      periodId: this.selectedPeriodId || this.periods[0]?.id || 0,
      kpiIndexId: this.indexesForTemplate[0]?.id || 0,
      goalValue: 0
    };
  }

  // --- Helpers ---
  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private normalizeTemplate(item: any): KpiSaleTemplate {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateCode: this.read<string>(item, 'TemplateCode', 'templateCode') || '',
      templateName: this.read<string>(item, 'TemplateName', 'templateName') || '',
      description: this.read<string>(item, 'Description', 'description') || '',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizePeriod(item: any): KpiSalePeriod {
    const toDate = (val: any) => {
      if (val instanceof Date) return val;
      const date = val ? new Date(val) : new Date();
      return isNaN(date.getTime()) ? new Date() : date;
    };
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode') || '',
      periodName: this.read<string>(item, 'PeriodName', 'periodName') || '',
      periodType: (this.read<string>(item, 'PeriodType', 'periodType') || 'MONTH') as any,
      dateStart: toDate(this.read<any>(item, 'DateStart', 'dateStart')),
      dateEnd: toDate(this.read<any>(item, 'DateEnd', 'dateEnd')),
      parentPeriodId: this.read<number>(item, 'ParentPeriodID', 'ParentPeriodId', 'parentPeriodId'),
      isClosed: !!this.read<boolean>(item, 'IsClosed', 'isClosed')
    };
  }

  private normalizeEmployee(item: any): EmployeeOption {
    return {
      id: this.read<number>(item, 'EmployeeID', 'UserID', 'ID', 'id') || 0,
      code: this.read<string>(item, 'Code', 'EmployeeCode', 'code') || '',
      fullName: this.read<string>(item, 'FullName', 'Name', 'fullName') || '',
      departmentName: this.read<string>(item, 'DepartmentName', 'departmentName') || '',
    };
  }

  private normalizeIndex(item: any): KpiSaleIndex {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || this.selectedTemplateId,
      parentId: this.read<number>(item, 'ParentID', 'ParentId', 'parentId'),
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<any>(item, 'IndexType', 'indexType') || 'DETAIL') as any,
      unitType: (this.read<any>(item, 'UnitType', 'unitType') || 'MONEY') as any,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType'),
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType'),
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeTarget(item: any): KpiSaleTarget {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || 0,
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || 0,
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || 0,
      goalValue: this.read<number>(item, 'GoalValue', 'goalValue') || 0,
      employeeName: this.read<string>(item, 'EmployeeName', 'employeeName'),
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode'),
      indexName: this.read<string>(item, 'IndexName', 'indexName'),
    };
  }

  private targetToApi(item: KpiSaleTarget): any {
    return {
      ID: item.id,
      EmployeeID: item.employeeId,
      PeriodID: item.periodId,
      KpiIndexID: item.kpiIndexId,
      GoalValue: item.goalValue || 0,
    };
  }

  private read<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }

  private getMockTargets(): KpiSaleTarget[] {
    return [
      { id: 1, employeeId: 101, periodId: 1, kpiIndexId: 1, goalValue: 717224000 },
      { id: 2, employeeId: 101, periodId: 2, kpiIndexId: 1, goalValue: 715000000 },
      { id: 3, employeeId: 101, periodId: 3, kpiIndexId: 1, goalValue: 1432224000 },
      { id: 4, employeeId: 101, periodId: 1, kpiIndexId: 2, goalValue: 485000000 },
      { id: 5, employeeId: 101, periodId: 2, kpiIndexId: 2, goalValue: 520000000 },
      { id: 6, employeeId: 101, periodId: 3, kpiIndexId: 2, goalValue: 1005000000 }
    ];
  }
}
