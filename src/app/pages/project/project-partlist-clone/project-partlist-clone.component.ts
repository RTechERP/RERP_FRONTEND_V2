import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AngularSlickgridModule, Column, GridOption, Formatters, Filters, AngularGridInstance, Editors, OnEventArgs, Formatter, MultipleSelectOption } from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../project-service/project.service';
import { ProjectWorkerService } from '../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectPartListService } from '../project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { NOTIFICATION_TITLE_MAP } from '../../hrm/hr-recruitment-interview-assessment/hr-recruitment-interview-assessment-form/hr-recruitment-interview-assessment-form.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ProjectSolutionDetailComponent } from '../project-department-summary/project-department-summary-form/project-solution-detail/project-solution-detail.component';
import { ProjectSolutionVersionDetailComponent } from '../project-department-summary/project-department-summary-form/project-solution-version-detail/project-solution-version-detail.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { lastValueFrom } from 'rxjs';
import { AppUserService } from '../../../services/app-user.service';

@Component({
  selector: 'app-project-partlist-clone',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzButtonModule, AngularSlickgridModule, NzModalModule, NzDropDownModule],
  templateUrl: './project-partlist-clone.component.html',
  styleUrl: './project-partlist-clone.component.css'
})
export class ProjectPartlistCloneComponent implements OnInit {
  @Input() sourceProjectId: any;
  @Input() sourceSolutionId: any;
  @Input() sourceStatus: any;
  @Input() cloneProjectPartlist: any[] = [];

  targetProjectId: any;
  targetSolutionId: any;
  targetStatus: any;

  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  @Input() dataset: any[] = [];

  slickgridId: any;

  projects: any[] = [];
  sourceSolutionResponse: any[] = [];
  targetSolutionResponse: any[] = [];

  projectVersions: any[] = [];
  targetprojectVersions: any[] = [];

  angularGrid!: AngularGridInstance;

  //#region Control gán cho bảng
  productNameSuggestions: any[] = [];
  makerSuggestions: any[] = [];

  productNameOptions: any[] = [];
  makerOptions: any[] = [];

  unitData: any[] = [];

  employees: any[] = [];
  recentProjects: any[] = [];
  isLoadingSave: boolean = false;
  errorRowIds = new Set<any>(); // track dòng lỗi để bôi đỏ
  private readonly MAX_RECENT_PROJECTS = 10;
  private get recentProjectsKey(): string {
    const userId = this.appUserService.id || 'default';
    return `recent_project_ids_partlist_${userId}`;
  }
  //#endregion

  constructor(
    private projectWorkerService: ProjectWorkerService,
    private projectService: ProjectService,
    private projectPartListService: ProjectPartListService,
    @Optional() public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal,
    private appUserService: AppUserService,
    @Optional() @Inject('tabData') private tabData?: any
  ) { }

  ngOnInit(): void {
    this.slickgridId = 'clonePartListGrid_' + this.generateUUIDv4();

    // Đọc data từ tabData nếu được mở như tab (deep copy tránh shared reference giữa các tab)
    if (this.tabData) {
      if (this.tabData.sourceProjectId !== undefined) this.sourceProjectId = this.tabData.sourceProjectId;
      if (this.tabData.sourceSolutionId !== undefined) this.sourceSolutionId = this.tabData.sourceSolutionId;
      if (this.tabData.sourceStatus !== undefined) this.sourceStatus = this.tabData.sourceStatus;
      if (this.tabData.cloneProjectPartlist !== undefined)
        this.cloneProjectPartlist = JSON.parse(JSON.stringify(this.tabData.cloneProjectPartlist));
      if (this.tabData.dataset !== undefined)
        this.dataset = JSON.parse(JSON.stringify(this.tabData.dataset));
    }

    this.getProjects();
    if (this.sourceProjectId > 0) {
      this.loadDataSolution(1, this.sourceProjectId, true);
    }
    if (this.sourceSolutionId > 0) {
      this.getProjectVersions(1, this.sourceSolutionId, true);
    }

    if (this.targetProjectId > 0) {
      this.loadDataSolution(2, this.targetProjectId, true);
    }

    if (this.targetSolutionId > 0) {
      this.getProjectVersions(2, this.targetSolutionId, true);
    }
    this.loadSuggestions();
    this.getUnitCount();
    this.getEmployees();
    this.initGrid();

    this.loadPartlist();
  }

  //#region Hàm gọi API
  private loadRecentProjects(): void {
    try {
      const key = this.recentProjectsKey;
      const recentIds: number[] = JSON.parse(localStorage.getItem(key) || '[]');
      this.recentProjects = recentIds
        .map(id => this.projects.find(p => p.ID === id))
        .filter(p => !!p);
    } catch {
      this.recentProjects = [];
    }
  }

  private saveRecentProject(projectId: number): void {
    if (!projectId || projectId <= 0) return;
    try {
      const key = this.recentProjectsKey;
      let recentIds: number[] = JSON.parse(localStorage.getItem(key) || '[]');
      // Remove if already exists, then add to front
      recentIds = recentIds.filter(id => id !== projectId);
      recentIds.unshift(projectId);
      // Keep max items
      if (recentIds.length > this.MAX_RECENT_PROJECTS) {
        recentIds = recentIds.slice(0, this.MAX_RECENT_PROJECTS);
      }
      localStorage.setItem(key, JSON.stringify(recentIds));
      this.loadRecentProjects();
    } catch (e) {
      console.error('Error saving recent project:', e);
    }
  }

  loadPartlist() {
    if (this.dataset.length > 0) {
      this.dataset = this.dataset
        .map((item: any, index: number) => ({
          ...item,
          id: item.id || `${index}`,
        }))
        .sort((a: any, b: any) => {
          const aParts = String(a.TT || '').split('.').map(Number);
          const bParts = String(b.TT || '').split('.').map(Number);
          const len = Math.max(aParts.length, bParts.length);
          for (let i = 0; i < len; i++) {
            const diff = (aParts[i] || 0) - (bParts[i] || 0);
            if (diff !== 0) return diff;
          }
          return 0;
        });

      console.log(this.dataset)
      if (this.angularGrid) {
        this.angularGrid.dataView.refresh();
        this.angularGrid.resizerService?.resizeGrid();
      }
    }
  }

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;

        if (this.targetProjectId > 0) {
          this.saveRecentProject(this.targetProjectId);
        }
        this.loadRecentProjects();
      },
      error: (error: any) => {
        console.error('Lỗi getProjects:', error);
      },
    });
  }

  loadDataSolution(type: number, projectId: number, isInit: boolean = false) {
    if (!isInit) {
      if (type === 1) {
        this.sourceSolutionId = null;
        this.sourceStatus = null;
        this.projectVersions = [];
      } else {
        this.targetSolutionId = null;
        this.targetStatus = null;
        this.targetprojectVersions = [];
      }
    }

    if (!projectId) {
      if (type === 1) {
        this.sourceSolutionResponse = [];
      } else {
        this.targetSolutionResponse = [];
      }
      return;
    }

    this.projectWorkerService.getSolution(projectId).subscribe({
      next: (response: any) => {
        if (type === 1) {
          this.sourceSolutionResponse = response.data;
        } else {
          this.targetSolutionResponse = response.data;
        }

        console.log(this.sourceSolutionResponse);
        console.log(this.targetSolutionResponse);
      },
      error: (error: any) => {
        console.error('Lỗi loadDataSolution:', error);
      },
    });
  }

  getProjectVersions(type: number, solutionId: number, isInit: boolean = false) {
    if (!isInit) {
      if (type === 1) {
        this.sourceStatus = null;
      } else {
        this.targetStatus = null;
      }
    }

    if (!solutionId) {
      if (type === 1) {
        this.projectVersions = [];
      } else {
        this.targetprojectVersions = [];
      }
      return;
    }

    const solutionVersion$ = this.projectPartListService.getProjectPartListVersion(solutionId, false);
    const poVersion$ = this.projectPartListService.getProjectPartListVersion(solutionId, true);

    import('rxjs').then(({ forkJoin }) => {
      forkJoin([solutionVersion$, poVersion$]).subscribe({
        next: ([solutionResponse, poResponse]: any[]) => {
          let mergedData: any[] = [];

          // Process Solution Version data
          if (solutionResponse && solutionResponse.status === 1) {
            const solutionData = (solutionResponse.data || []).map((item: any) => ({
              ...item,
              STT: item.STT,
              id: `solution_${item.ID}`,
              originalId: item.ID,
              VersionType: 1,
              VersionTypeName: 'Phiên bản giải pháp',
              VersionName: `${item.CodeNew}${item.IsConsumable ? '-VTTH' : ''}`
            }));
            mergedData = [...mergedData, ...solutionData];
          }

          // Process PO Version data
          if (poResponse && poResponse.status === 1) {
            const poData = (poResponse.data || []).map((item: any) => ({
              ...item,
              STT: item.STT,
              id: `po_${item.ID}`,
              originalId: item.ID,
              VersionType: 2,
              VersionTypeName: 'Phiên bản PO',
              VersionName: `${item.CodeNew}${item.IsConsumable ? '-VTTH' : ''}`
            }));
            mergedData = [...mergedData, ...poData];
          }

          if (type === 1) {
            this.projectVersions = mergedData;
          } else {
            this.targetprojectVersions = mergedData;
          }

          console.log('projectVersions', this.projectVersions);
          console.log('targetprojectVersions', this.targetprojectVersions);
        },
        error: (error: any) => {
          console.error('Lỗi getProjectVersions:', error);
        }
      });
    });

    console.log('projectVersions', this.projectVersions);
    console.log('targetprojectVersions', this.targetprojectVersions);
  }
  //#endregion

  //#region load select cho bảng
  loadSuggestions(): void {
    this.projectPartListService.getSuggestions().subscribe({
      next: (response: any) => {
        const productNames = response.data.ProductNames || [];
        const makers = response.data.Makers || [];

        this.productNameSuggestions = productNames
          .filter((name: any) => name && typeof name === 'string' && name.trim())
          .map((name: string) => name.trim())
          .sort();

        this.makerSuggestions = makers
          .filter((maker: any) => maker && typeof maker === 'string' && maker.trim())
          .map((maker: string) => maker.trim())
          .sort();

        const newMakerCollection = this.getMakerCollection();
        const colDefMaker = this.columnDefinitions.find(c => c.id === 'Manufacturer');
        if (colDefMaker && colDefMaker.editor) {
          colDefMaker.editor.collection = newMakerCollection;
        }
        if (this.angularGrid?.slickGrid) {
          this.angularGrid.slickGrid.invalidate();
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

  getUnitCount(): void {
    this.projectPartListService.getUnitCount().subscribe({
      next: (response: any) => {
        // Handle response structure - check if it's wrapped in data property
        if (response.status === 1 && response.data) {
          this.unitData = response.data || [];
        } else if (Array.isArray(response)) {
          this.unitData = response;
        } else if (response.data) {
          this.unitData = response.data;
        } else {
          this.unitData = [];
        }
        const newUnitCollection = this.getUnitCollection();
        const colDef = this.columnDefinitions.find(c => c.id === 'Unit');
        if (colDef && colDef.editor) {
          colDef.editor.collection = newUnitCollection;
        }
        if (this.angularGrid?.slickGrid) {
          this.angularGrid.slickGrid.invalidate();
        }
      },
      error: (err: any) => {
        this.unitData = [];
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  getProductNameOptions(value: string): string[] {
    if (!value || value.trim() === '') {
      return this.productNameSuggestions.slice(0, 10);
    }
    const filterValue = value.toLowerCase();
    return this.productNameSuggestions
      .filter(option => option.toLowerCase().includes(filterValue))
      .slice(0, 10);
  }

  getMakerOptions(value: string): string[] {
    if (!value || value.trim() === '') {
      return this.makerSuggestions.slice(0, 10); // Limit to 10 items when empty
    }
    const filterValue = value.toLowerCase();
    return this.makerSuggestions
      .filter(option => option.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limit to 10 items
  }

  getEmployees(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        const data = response.data || response || [];
        this.employees = data;
        console.log('this.employees', this.employees);

        const newEmployeeCollection = this.getEmployeeCollection();
        const colDef = this.columnDefinitions.find(c => c.id === 'EmployeeID');
        if (colDef && colDef.editor) {
          colDef.editor.collection = newEmployeeCollection;
        }
        if (this.angularGrid?.slickGrid) {
          this.angularGrid.slickGrid.invalidate();
        }
      },
      error: (err: any) => {
        this.unitData = [];
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }
  //#endregion

  //#region Hàm Xử lý bảng
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.angularGrid.slickGrid.onCellChange.subscribe((e: any, args: any) => {
      this.onCellChanged(args);
    });
  }

  onCellChanged(args: any): void {
    const column = args.column || this.angularGrid.slickGrid.getColumns()[args.cell];
    if (column.id === 'TT') {
      const changedRowIdx = args.row;
      const changedItem = args.item || this.angularGrid.dataView.getItem(changedRowIdx);
      if (!changedItem) return;

      const startTT = (changedItem.TT || '').toString().trim();
      if (!startTT) return;
      if (!/^\d+(\.\d+)*$/.test(startTT)) return;

      const match = startTT.match(/^(.*?)(\d+)$/);
      if (!match) return;

      const prefix = match[1];
      let lastNumber = parseInt(match[2], 10);

      const dataView = this.angularGrid.dataView;
      const totalRows = dataView.getLength();

      dataView.beginUpdate();
      try {
        for (let i = changedRowIdx + 1; i < totalRows; i++) {
          const item = dataView.getItem(i);
          if (item) {
            lastNumber++;
            item.TT = prefix + lastNumber;
            dataView.updateItem(item.id, item);

            const dsItem = this.dataset.find(x => x.id === item.id);
            if (dsItem) {
              dsItem.TT = item.TT;
            }
          }
        }
      } finally {
        dataView.endUpdate();
        this.angularGrid.slickGrid.invalidate();
      }
    }
  }

  // Helper methods trả về collection cho singleSelect editor
  getProductNameCollection(): any[] {
    return this.productNameSuggestions.map((name: string) => ({ value: name, label: name }));
  }

  getMakerCollection(): Array<{
    value: string;
    label: string;
  }> {
    const currencies = (this.makerSuggestions || []).map((c: any) => ({
      value: c,
      label: c,
    }));
    return [...currencies];
  }

  getUnitCollection(): Array<{
    value: string;
    label: string;
  }> {
    const units = (this.unitData || []).map((c: any) => ({
      value: c.UnitName,
      label: c.UnitName + ' - ' + c.UnitCode,
    }));
    return [...units];
  }

  // getUnitCollection(): any[] {
  //   return this.unitData.map((u: any) => ({ value: u.UnitCode, label: u.UnitCode }));
  // }

  getEmployeeCollection(): any[] {
    const employees = (this.employees || []).map((c: any) => ({
      value: c.ID,
      label: c.Code + ' - ' + c.FullName,
    }));
    return [...employees];
  }

  deleteFile(e: Event, args: OnEventArgs) {
    const metadata = this.angularGrid.gridService.getColumnFromEventArguments(args);
    const id = metadata.dataContext.id;
    const productName = metadata.dataContext.ProductCode === null || metadata.dataContext.ProductCode === '' ? metadata.dataContext.GroupMaterial : metadata.dataContext.ProductCode;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa tb <b>${productName}</b> không?`,
      nzOkText: 'Đồng ý',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.angularGrid.gridService.deleteItemById(id);
      }
    });
  }

  wrapTextFormatter: Formatter = (_row, _cell, value, _column, dataContext) => {
    if (!value) return '';
    return `
              <span
                  title="${String(value).replace(/"/g, '&quot;')}"
                  style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.3;"
              >
                  ${value}
              </span>
          `;
  };

  initGrid() {
    const selectCellFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column) => {
      if (value === null || value === undefined || value === '') return '';

      // Xử lý nếu editor trả về mảng (ví dụ: ["Honda"])
      if (Array.isArray(value)) {
        return value.map((v: any) => {
          if (v !== null && typeof v === 'object') return v.label || v.value || '';
          return v;
        }).join(', ');
      }

      if (typeof value === 'object') {
        return value.label || value.value || '';
      }

      if (columnDef && columnDef.id === 'EmployeeID') {
        const emp = this.getEmployeeCollection().find(x => x.value == value);
        if (emp) return emp.label;
      }

      return value;
    };

    this.columnDefinitions = [
      {
        id: 'delete',
        name: '',
        field: 'ID',
        type: 'number',
        width: 50, maxWidth: 50,
        sortable: false, filterable: false,
        formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer text-danger' },
        onCellClick: (e: Event, args: OnEventArgs) => {
          this.deleteFile(e, args)
        },
        cssClass: 'text-center'
      },
      {
        id: 'TT',
        name: 'TT',
        field: 'TT',
        sortable: true,
        width: 100,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['text'] },
      },
      {
        id: 'ProductCode',
        name: 'Mã thiết bị <span class="text-danger ms-1">(*)</span>',
        field: 'ProductCode',
        sortable: true,
        width: 150,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'] },
      },
      {
        id: 'SpecialCode',
        name: 'Mã đặc biệt',
        field: 'SpecialCode',
        sortable: true,
        width: 120,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        //editor: { model: Editors['text'] },
      },
      {
        id: 'IsDeleted',
        name: 'Đã xóa',
        field: 'IsDeleted',
        sortable: true,
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 1;
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        // editor: { model: Editors['checkbox'] },
      },
      {
        id: 'GroupMaterial',
        name: 'Tên thiết bị',
        field: 'GroupMaterial',
        sortable: true,
        width: 250,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: this.wrapTextFormatter,
        editor: { model: Editors['longText'] },
      },
      {
        id: 'Manufacturer',
        name: 'Hãng <span class="text-danger ms-1">(*)</span>',
        field: 'Manufacturer',
        sortable: true,
        width: 120,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: {
          model: Editors['singleSelect'],
          collection: this.getMakerCollection(),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: selectCellFormatter,
      },
      {
        id: 'Unit',
        name: 'Đơn vị <span class="text-danger ms-1">(*)</span>',
        field: 'Unit',
        sortable: true,
        width: 120,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: {
          model: Editors['singleSelect'],
          collection: this.getUnitCollection(),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: selectCellFormatter,
      },
      {
        id: 'Model',
        name: 'Thông số kỹ thuật',
        field: 'Model',
        sortable: true,
        width: 250,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: this.wrapTextFormatter,
        editor: { model: Editors['longText'] },
      },
      {
        id: 'QtyMin',
        name: 'SL/1 máy',
        field: 'QtyMin',
        sortable: true,
        width: 100,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['text'] },
      },
      {
        id: 'QtyFull',
        name: 'SL tổng',
        field: 'QtyFull',
        sortable: true,
        width: 100,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['text'] },
      },
      {
        id: 'EmployeeID',
        name: 'Nv phụ trách',
        field: 'EmployeeID',
        sortable: true,
        width: 180,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: {
          model: Editors['singleSelect'],
          collection: this.getEmployeeCollection(),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: selectCellFormatter,
      },
      {
        id: 'IsProblem',
        name: 'Phát sinh',
        field: 'IsProblem',
        sortable: true,
        width: 90,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 1;
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['checkbox'] },
      },
      {
        id: 'ReasonProblem',
        name: 'Lý do phát sinh',
        field: 'ReasonProblem',
        sortable: true,
        width: 350,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['longText'] },
        // Chỉ cho phép edit khi IsProblem = true
        onBeforeEditCell: (_e: any, args: any) => {
          return !!args.item?.IsProblem;
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        width: 350,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['longText'] },
      }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-clone-partlist',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableCheckboxSelector: false,
      multiColumnSort: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableGrouping: true,
      rowHeight: 60,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: any, row: number) => this.getPartListRowMetadata(item, row),
        },
      },
    };
  }

  getPartListRowMetadata(item: any, row: number): any {
    if (!item) return null;

    const hasChildren = item.__hasChildren;
    let rowCssClass = '';

    if (hasChildren) {
      rowCssClass = 'row-parent';
    }
    if (this.errorRowIds.has(item.id)) {
      rowCssClass = (rowCssClass ? rowCssClass + ' ' : '') + 'row-error';
    }

    return {
      cssClasses: rowCssClass,
    };
  }

  closeModal() {
    let result = {
      projectId: this.targetProjectId
    };
    if (this.activeModal) {
      this.activeModal.close(result);
    }
  }

  deleteRow(item: any) {
    if (!item) return;
    // Commit bất kỳ edit đang mở trước khi xóa
    try { this.angularGrid.slickGrid.getEditController()?.commitCurrentEdit(); } catch (_) { }
    // Lấy toàn bộ data hiện tại từ dataView (bao gồm các edit đã commit)
    const allRows = this.angularGrid.dataView.getItems();
    // Xóa thuần dữ liệu và gán lại dataset để kích hoạt AngularSlickgrid tự reset
    const newData = allRows.filter((x: any) => x.id !== item.id);
    this.dataset = [...newData];
  }

  addDestinationSolution() {
    // Kiểm tra đã chọn dự án chưa
    if (!this.targetProjectId || this.targetProjectId === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án trước!');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectSolutionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });

    modalRef.componentInstance.projectId = this.targetProjectId;
    //modalRef.componentInstance.dataSolution = this.targetDataSolution;
    modalRef.componentInstance.isEdit = false;
    modalRef.result.then((result: any) => {
      this.loadDataSolution(2, this.targetProjectId);
    }).catch(() => { });
  }

  addDestinationVersion(typenumber: number) {
    if (!this.targetSolutionId || this.targetSolutionId === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn lại giải pháp và thao tác lại!');
      return;
    }

    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });

    modalRef.componentInstance.ProjectID = this.targetProjectId;
    modalRef.componentInstance.projectSolutionId = this.targetSolutionId;
    modalRef.componentInstance.typeNumber = typenumber;
    modalRef.componentInstance.isEdit = false;
    modalRef.componentInstance.typecheck = 1; // 1 for versions in PartList (matching old component logic)
    modalRef.componentInstance.SolutionTypeID = typenumber; // 1: giải pháp, 2: PO

    // Truyền toàn bộ dataset để tính STT
    modalRef.componentInstance.versionData = this.targetprojectVersions;

    modalRef.result.then((result: any) => {
      this.getProjectVersions(2, this.targetSolutionId);
    }).catch(() => { });
  }

  async saveClone() {
    // 1. Validate các trường đích
    if (!this.targetProjectId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Dự án đích.');
      return;
    }
    if (!this.targetSolutionId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Giải pháp đích.');
      return;
    }
    if (!this.targetStatus) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Phiên bản đích.');
      return;
    }

    // Commit dữ liệu bảng đang nhập dở
    try { this.angularGrid?.slickGrid?.getEditController()?.commitCurrentEdit(); } catch (_) { }
    const currentData = this.angularGrid?.dataView?.getItems() || this.dataset || [];

    // 2. Validate bảng phải có dữ liệu
    if (!currentData || currentData.length === 0) {
      this.notification.warning('Thông báo', 'Bảng chi tiết sản phẩm phải có ít nhất 1 sản phẩm.');
      return;
    }

    // 3. Validate chi tiết từng dòng trên bảng
    const errorRowIds = new Set<any>();
    const errorMessages: string[] = [];

    for (let i = 0; i < currentData.length; i++) {
      const item = currentData[i];
      if (item.__hasChildren) continue;

      const tt = item.TT?.toString().trim();
      if (!tt) {
        errorRowIds.add(item.id);
        errorMessages.push(`Dòng ${i + 1}: Vui lòng nhập TT.`);
        continue;
      }
      if (!/^\d+(\.\d+)*$/.test(tt)) {
        errorRowIds.add(item.id);
        errorMessages.push(`Dòng ${i + 1}: TT phải có định dạng số (ví dụ: 1, 1.1, 1.1.1, ...).`);
        continue;
      }

      const pCode = item.ProductCode?.toString().trim();
      const mfg = Array.isArray(item.Manufacturer) ? item.Manufacturer[0] : item.Manufacturer;
      const unit = Array.isArray(item.Unit) ? item.Unit[0] : item.Unit;

      if (!pCode || !mfg || !unit) {
        let errorMsg = `Dòng ${i + 1}: Vui lòng điền `;
        if (!pCode) errorMsg += 'mã thiết bị, ';
        if (!mfg) errorMsg += 'hãng, ';
        if (!unit) errorMsg += 'đơn vị, ';
        errorMsg = errorMsg.slice(0, -2) + '.';
        errorRowIds.add(item.id);
        errorMessages.push(errorMsg);
        continue;
      }

      const qtyMin = item.QtyMin;
      if (qtyMin !== null && qtyMin !== undefined && qtyMin !== '') {
        const numQtyMin = Number(qtyMin);
        if (isNaN(numQtyMin) || numQtyMin < 0) {
          errorRowIds.add(item.id);
          errorMessages.push(`Dòng ${i + 1}: Số lượng/máy phải lớn hơn hoặc bằng 0.`);
          continue;
        }
      }

      const qtyFull = item.QtyFull;
      if (qtyFull !== null && qtyFull !== undefined && qtyFull !== '') {
        const numQtyFull = Number(qtyFull);
        if (isNaN(numQtyFull) || numQtyFull < 0) {
          errorRowIds.add(item.id);
          errorMessages.push(`Dòng ${i + 1}: Số lượng tổng phải lớn hơn hoặc bằng 0.`);
          continue;
        }
      }
    }

    if (errorRowIds.size > 0) {
      // Bôi đỏ dòng lỗi qua row metadata, scroll đến dòng lỗi đầu tiên
      this.errorRowIds = errorRowIds;
      this.angularGrid?.slickGrid?.invalidate();

      const firstErrorId = [...errorRowIds][0];
      const firstErrorRowIdx = this.angularGrid?.dataView?.getRowById(firstErrorId);
      if (firstErrorRowIdx !== undefined && firstErrorRowIdx >= 0) {
        this.angularGrid?.slickGrid?.scrollRowIntoView(firstErrorRowIdx, true);
      }

      this.notification.warning('Dữ liệu chưa hợp lệ', errorMessages.join('\n'), {
        nzStyle: { whiteSpace: 'pre-line' },
        nzDuration: 8000
      });
      return;
    }


    this.isLoadingSave = true;
    const sortByTT = (a: any, b: any): number => {
      const partsA = (a.TT || '').toString().split('.').map(Number);
      const partsB = (b.TT || '').toString().split('.').map(Number);
      const len = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < len; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;
        if (numA !== numB) return numA - numB;
      }
      return 0;
    };

    const dataSubmit = currentData
      .map((item: any) => ({
        Id: 0,
        ProjectID: this.targetProjectId,
        ProjectPartListVersionID: this.targetStatus,
        TT: item.TT,
        ProductCode: item.ProductCode || null,
        SpecialCode: item.SpecialCode || null,
        GroupMaterial: item.GroupMaterial || null,
        Manufacturer: item.Manufacturer || null,
        Model: item.Model || null,
        QtyMin: item.QtyMin || 0,
        QtyFull: item.QtyFull || 0,
        Unit: item.Unit || null,
        EmployeeID: item.EmployeeID || null,
        IsProblem: item.IsProblem || false,
        ReasonProblem: item.ReasonProblem || null,
        Note: item.Note || null,
        IsDeleted: item.IsDeleted || false,
        Amount: 0,
        QuantityReturn: 0,
        TotalPriceOrder: 0,
        PriceOrder: 0,
        Price: 0,
      }))
      .sort(sortByTT);

    let version = this.targetprojectVersions.find((x: any) => x.ID === this.targetStatus);
    if (version && version.IsConsumable) {
      try {
        const res: any = await lastValueFrom(this.projectPartListService.checkPartlistConsumable(dataSubmit, version.ProjectTypeID));

        if (res.data && res.data.trim() !== "") {
          const productsArray = (res.data as string)
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
          await this.showSkippedProductsModal(productsArray);
          this.isLoadingSave = false;
          return;
        }
      } catch (err: any) {
        this.isLoadingSave = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        return;
      }
    }

    this.projectPartListService.cloneProjectPartList(dataSubmit).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            'Đã nhân bản các vật tư!'
          );
          this.errorRowIds.clear();
          this.isLoadingSave = false;
          this.closeModal();
        } else {
          this.isLoadingSave = false;
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (err: any) => {
        this.isLoadingSave = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });

  }

  private showSkippedProductsModal(products: string[]): void {
    this.modal.info({
      nzTitle: `⚠️ Sản phẩm không hợp lệ (${products.length} mã)`,
      nzContent: `
        <div style="margin-bottom:8px;font-size:12px;color:#999;">
          Các mã sau không tồn tại trong kho vtth tương ứng phiên bản đích vui lòng kiểm tra lại:
        </div>
        <div style="
          background:#fafafa;
          border:1px solid #e8e8e8;
          border-radius:6px;
          padding:12px 14px;
          max-height:280px;
          overflow-y:auto;
          font-size:13px;
          color:#333;
          line-height:2;
        ">${products.map(p => `<span style="white-space:nowrap">${p}</span>`).join(',&nbsp; ')}</div>`,
      nzOkText: 'Ok',
      nzWidth: 560,
      nzBodyStyle: { padding: '16px 20px' },
      nzOnOk: () => { }
    });
  }
  //#endregion
}
