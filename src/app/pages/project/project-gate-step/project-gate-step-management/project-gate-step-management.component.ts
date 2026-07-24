import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ProjectGateStepService } from '../project-gate-step.service';
import { ProjectGateCheckListTypeService } from '../../project-gate/project-gate-checklist-type/project-gate-checklist-type.service';
import { ProjectGateStepTemplateModalComponent } from '../project-gate-step-template-modal/project-gate-step-template-modal.component';
import { ProjectGateStepChecklistComponent } from '../project-gate-step-checklist/project-gate-step-checklist.component';
import { TabServiceService } from '../../../../layouts/tab-service.service';

export interface ColDef {
  field: string; header: string; width: string;
  filterType?: 'text' | 'number';
  filterValue?: any;
}

@Component({
  selector: 'app-project-gate-step-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzModalModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    NzGridModule,
    NzFormModule,
    NzInputNumberModule,
    NzTagModule,
    TableModule,
    TooltipModule,
    MenubarModule,
    InputTextModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './project-gate-step-management.component.html',
  styleUrls: ['./project-gate-step-management.component.css']
})
export class ProjectGateStepManagementComponent implements OnInit {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  showSearchBar: boolean = true;

  templateId: number | null = null;
  templateName: string = '';
  templateCode: string = '';

  // Filter models
  sortOrderFilter: any = null;
  gateFilter: string = '';
  contentFilter: string = '';
  checklistFilter: string = '';

  // Produce data
  gateList: any[] = [];
  departmentList: any[] = [];
  positionList: any[] = [];
  templateList: any[] = [];
  checkListTypes: any[] = [];
  groupedTemplates: Array<{
    label: string;
    options: Array<{
      label: string;
      value: number | null;
      disabled: boolean;
      isHeader?: boolean;
    }>;
  }> = [];

  // Checklist modal state
  isChecklistModalVisible: boolean = false;
  checklistModalTitle: string = 'Cấu hình Checklist';
  editingStep: any = null;
  editingStepCheckLists: any[] = [];

  columns: ColDef[] = [
    { field: 'SortOrder', header: 'Thứ tự', width: '80px', filterType: 'number' },
    { field: 'ProjectGateID', header: 'Gate', width: '220px', filterType: 'text' },
    { field: 'Content', header: 'Nội dung công việc', width: '350px', filterType: 'text' },
    { field: 'CheckListNames', header: 'Checklist / Yêu cầu', width: '250px', filterType: 'text' }
  ];

  constructor(
    private service: ProjectGateStepService,
    private checkListTypeService: ProjectGateCheckListTypeService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal,
    private tabService: TabServiceService,
    @Optional() @Inject('tabData') public tabData: any
  ) { }

  ngOnInit(): void {
    if (this.tabData) {
      this.templateId = this.tabData.templateId ?? null;
      this.templateName = this.tabData.templateName ?? '';
      this.templateCode = this.tabData.templateCode ?? '';
    }
    this.initMenu();
    this.loadCheckListTypes();
    this.loadProduce();
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm dòng',
        icon: 'fa-solid fa-plus text-primary',
        command: () => this.onAddRow()
      },
      {
        label: 'Lưu',
        icon: 'fa-solid fa-floppy-disk text-success',
        command: () => this.onSave()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash text-danger',
        command: () => this.onDelete(),
        disabled: this.selectedItems.length === 0
      },
      {
        label: 'CheckList',
        icon: 'fa-solid fa-list-check text-info',
        command: () => this.onOpenChecklist(),
        disabled: this.selectedItems.length !== 1
      },
      {
        label: 'Xuất excel',
        icon: 'fa-solid fa-file-excel text-success',
        command: () => this.onExportExcel()
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => this.loadData()
      }
    ];
  }

  loadCheckListTypes(): void {
    this.checkListTypeService.getAll().subscribe({
      next: (res: any) => {
        this.checkListTypes = res.data || [];
      },
      error: (err: any) => {
        console.error('Error loading checklist types', err);
      }
    });
  }

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Xóa') return { ...item, disabled: this.selectedItems.length === 0 };
      if (item.label === 'CheckList') return { ...item, disabled: this.selectedItems.length !== 1 };
      return item;
    });
  }

  loadProduce(): void {
    this.loading = true;
    this.service.getProduce().subscribe({
      next: (res: any) => {
        const data = res.data || {};
        this.gateList = data.gates || [];
        this.departmentList = data.departments || [];
        this.positionList = data.positions || [];
        this.templateList = data.templates || [];
        this.groupTemplates();
        this.loadData();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  groupTemplates(): void {
    const deptMap: { [dept: string]: { [projType: string]: any[] } } = {};
    const noDeptName = 'Mẫu chung';

    this.templateList.forEach(t => {
      const dept = t.DepartmentName ? t.DepartmentName.trim() : noDeptName;
      const projType = t.ProjectTypeName ? t.ProjectTypeName.trim() : 'Không xác định kiểu dự án';

      if (!deptMap[dept]) {
        deptMap[dept] = {};
      }
      if (!deptMap[dept][projType]) {
        deptMap[dept][projType] = [];
      }
      deptMap[dept][projType].push(t);
    });

    const groups: typeof this.groupedTemplates = [];

    const depts = Object.keys(deptMap).sort((a, b) => {
      if (a === noDeptName) return 1;
      if (b === noDeptName) return -1;
      return a.localeCompare(b);
    });

    depts.forEach(dept => {
      const options: Array<{ label: string; value: number | null; disabled: boolean; isHeader?: boolean }> = [];
      const projTypesMap = deptMap[dept];
      const projTypes = Object.keys(projTypesMap).sort((a, b) => a.localeCompare(b));

      projTypes.forEach(projType => {
        options.push({
          label: `--- ${projType} ---`,
          value: null,
          disabled: true,
          isHeader: true
        });

        const templates = projTypesMap[projType];
        templates.sort((a, b) => (a.Code || '').localeCompare(b.Code || ''));

        templates.forEach(tpl => {
          options.push({
            label: `   ${tpl.Code} - ${tpl.Name}`,
            value: tpl.ID,
            disabled: false
          });
        });
      });

      groups.push({
        label: dept,
        options: options
      });
    });

    this.groupedTemplates = groups;
  }

  loadData(): void {
    this.loading = true;
    this.service.getAll(null, null)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: any) => {
          const rawData = res.data || [];

          rawData.forEach((row: any, idx: number) => {
            row._tempId = row.ID || -(idx + 1);
            row.CheckLists = row.CheckLists || [];
            const gate = this.gateList.find(g => g.ID === row.ProjectGateID);
            if (gate) {
              row.GateType = gate.Type; // 1 = Giải pháp, 2 = Triển khai
            } else {
              row.GateType = 999;
            }
          });

          // Sắp xếp theo GateType trước, sau đó theo SortOrder
          rawData.sort((a: any, b: any) => {
            const typeA = a.GateType ?? 999;
            const typeB = b.GateType ?? 999;
            if (typeA !== typeB) {
              return typeA - typeB;
            }
            const orderA = a.SortOrder ?? 0;
            const orderB = b.SortOrder ?? 0;
            return orderA - orderB;
          });

          this.dataset = rawData;
          this.selectedItems = [];
          this.onFilterChange();
          this.updateMenuState();
        },
        error: (err: any) => this.showError(err)
      });
  }

  onFilterChange(): void {
    let result = [...this.dataset];

    if (this.templateId !== null && this.templateId !== undefined) {
      result = result.filter(row => row.ProjectGateStepTemplateID === this.templateId);
    }

    if (this.sortOrderFilter !== null && this.sortOrderFilter !== undefined && this.sortOrderFilter !== '') {
      result = result.filter(row => row.SortOrder != null && String(row.SortOrder).includes(String(this.sortOrderFilter)));
    }

    if (this.gateFilter) {
      const gf = this.gateFilter.toLowerCase();
      result = result.filter(row =>
        (row.GateCode && row.GateCode.toLowerCase().includes(gf)) ||
        (row.GateName && row.GateName.toLowerCase().includes(gf))
      );
    }

    if (this.contentFilter) {
      const cf = this.contentFilter.toLowerCase();
      result = result.filter(row => row.Content && row.Content.toLowerCase().includes(cf));
    }

    if (this.checklistFilter) {
      const chkf = this.checklistFilter.toLowerCase();
      result = result.filter(row => row.CheckListNames && row.CheckListNames.toLowerCase().includes(chkf));
    }

    this.filteredDataset = result;
  }

  onTemplateChange(value: number | null): void {
    this.templateId = value;
    const selectedTpl = this.templateList.find(t => t.ID === value);
    if (selectedTpl) {
      this.templateName = selectedTpl.Name;
      this.templateCode = selectedTpl.Code;
    } else {
      this.templateName = '';
      this.templateCode = '';
    }
    this.onFilterChange();
  }

  onReset(): void {
    this.templateId = null;
    this.templateName = '';
    this.templateCode = '';
    this.sortOrderFilter = null;
    this.gateFilter = '';
    this.contentFilter = '';
    this.checklistFilter = '';
    this.onFilterChange();
  }

  onAddRow(): void {
    const maxSortOrder = this.dataset.reduce((max, item) => {
      const val = Number(item.SortOrder);
      return !isNaN(val) && val > max ? val : max;
    }, 0);

    const newRow: any = {
      ID: 0,
      ProjectGateID: null,
      GateCode: '',
      GateName: '',
      GateType: 999,
      TT: '',
      SortOrder: maxSortOrder + 1,
      Content: '',
      ProjectGateStepTemplateID: this.templateId ?? null,
      CheckListNames: '',
      CheckLists: [],
      _isNew: true,
      _tempId: -Date.now() - Math.floor(Math.random() * 1000)
    };

    this.dataset = [...this.dataset, newRow];
    this.onFilterChange();

    setTimeout(() => {
      const newRowIndex = this.filteredDataset.length - 1;
      this.focusRowInput(newRowIndex, 'Content');
    }, 100);
  }

  onGateChange(row: any, gateId: number | null): void {
    row.ProjectGateID = gateId;
    const gate = this.gateList.find(g => g.ID === gateId);
    if (gate) {
      row.GateCode = gate.GateCode;
      row.GateName = gate.GateName;
      row.GateType = gate.Type;
    } else {
      row.GateCode = '';
      row.GateName = '';
      row.GateType = 999;
    }
  }

  onSave(): void {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu');
      return;
    }

    // Validate required fields
    for (let i = 0; i < this.dataset.length; i++) {
      const item = this.dataset[i];
      if (!item.ProjectGateID) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Dòng ${i + 1}: Vui lòng chọn Gate!`);
        this.focusRowInput(i, 'ProjectGateID');
        return;
      }
    }

    this.loading = true;
    const payload = this.dataset.map(item => ({
      ID: item.ID || 0,
      ProjectGateID: item.ProjectGateID,
      TT: item.TT || '',
      SortOrder: item.SortOrder ?? null,
      Content: item.Content || '',
      ProjectGateStepTemplateID: item.ProjectGateStepTemplateID || this.templateId || null,
      CheckLists: (item.CheckLists || []).map((c: any) => ({
        ID: c.ID || 0,
        ProjectGateStepID: item.ID || 0,
        Type: c.Type || '',
        ProjectGateCheckListType: c.ProjectGateCheckListType || null,
        Description: c.Description || ''
      }))
    }));

    this.service.save(payload).subscribe({
      next: (res: any) => {
        this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
        this.loadData();
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  // ── Modal Cấu hình Checklist giống ở Form ───────────────────────────
  openChecklistForRow(step: any): void {
    this.editingStep = step;
    this.checklistModalTitle = `Cấu hình Checklist: [${step.GateCode || 'Mới'}] ${step.Content || 'Công đoạn chưa lưu'}`;

    if (step.CheckLists && step.CheckLists.length > 0) {
      this.editingStepCheckLists = step.CheckLists.map((c: any) => ({ ...c }));
      this.isChecklistModalVisible = true;
    } else if (step.ID > 0) {
      // Tải checklist hiện có từ backend nếu có
      this.loading = true;
      this.service.getCheckListsOnly(step.ID)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res: any) => {
            const list = res.data || [];
            step.CheckLists = list;
            this.editingStepCheckLists = list.map((c: any) => ({ ...c }));
            this.isChecklistModalVisible = true;
          },
          error: () => {
            this.editingStepCheckLists = [];
            this.isChecklistModalVisible = true;
          }
        });
    } else {
      this.editingStepCheckLists = [];
      this.isChecklistModalVisible = true;
    }
  }

  addModalCheckListItem(): void {
    this.editingStepCheckLists.push({
      ID: 0,
      ProjectGateStepID: this.editingStep?.ID || 0,
      Type: null,
      ProjectGateCheckListType: null,
      Description: ''
    });
  }

  onModalCheckListTypeChange(item: any, typeId: number): void {
    const selectedType = this.checkListTypes.find(t => t.ID === typeId);
    if (selectedType) {
      item.Type = selectedType.TypeCode;
    }
  }

  removeModalCheckListItem(index: number): void {
    this.editingStepCheckLists.splice(index, 1);
  }

  confirmChecklistModal(): void {
    // Validate that description is not empty if checklist item exists
    for (let i = 0; i < this.editingStepCheckLists.length; i++) {
      const c = this.editingStepCheckLists[i];
      if (!c.ProjectGateCheckListType) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Checklist dòng ${i + 1}: Vui lòng chọn loại checklist!`);
        return;
      }
      if (!c.Description || !c.Description.trim()) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Checklist dòng ${i + 1}: Vui lòng nhập mô tả!`);
        return;
      }
    }

    if (this.editingStep) {
      this.editingStep.CheckLists = [...this.editingStepCheckLists];
      const summaryNames = this.editingStep.CheckLists
        .map((c: any) => (c.Type ? `[${c.Type}] ` : '') + c.Description)
        .join('; ');
      this.editingStep.CheckListNames = summaryNames;
    }

    this.isChecklistModalVisible = false;
  }

  closeChecklistModal(): void {
    this.isChecklistModalVisible = false;
  }

  onOpenChecklist(): void {
    if (this.selectedItems.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đúng 1 công đoạn để quản lý checklist!');
      return;
    }
    const step = this.selectedItems[0];
    if (!step || !step.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu công đoạn trước khi quản lý quy tắc checklist!');
      return;
    }
    const tabKey = `checklist-step-${step.ID}`;
    this.tabService.openTabComp({
      comp: ProjectGateStepChecklistComponent,
      title: `CheckList: [${step.GateCode || step.ID}] ${step.Content || step.GateName || ''}`,
      key: tabKey,
      data: {
        stepId: step.ID,
        stepCode: step.GateCode || '',
        stepName: step.Content || step.GateName || '',
        stepData: step
      }
    });
  }

  removeSingleRow(item: any): void {
    if (item.ID > 0) {
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc muốn xóa công đoạn "${item.Content || item.GateCode || ''}" không?`,
        nzOkText: 'Xóa',
        nzOkDanger: true,
        nzOnOk: () => {
          this.loading = true;
          this.service.delete([item.ID]).subscribe({
            next: () => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadData();
            },
            error: (err: any) => {
              this.loading = false;
              this.showError(err);
            }
          });
        }
      });
    } else {
      this.dataset = this.dataset.filter(d => d._tempId !== item._tempId);
      this.onFilterChange();
    }
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;
    const savedIds = this.selectedItems.filter(x => x.ID > 0).map(x => x.ID);
    const unsavedTempIds = this.selectedItems.filter(x => !x.ID).map(x => x._tempId);
    const count = this.selectedItems.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${count} bước/công đoạn đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        if (savedIds.length > 0) {
          this.loading = true;
          this.service.delete(savedIds).subscribe({
            next: () => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadData();
            },
            error: (err: any) => {
              this.loading = false;
              this.showError(err);
            }
          });
        } else {
          this.dataset = this.dataset.filter(d => !unsavedTempIds.includes(d._tempId));
          this.selectedItems = [];
          this.onFilterChange();
          this.updateMenuState();
        }
      }
    });
  }

  onKeyDown(rowIndex: number, column: string, event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      if (rowIndex === this.filteredDataset.length - 1) {
        event.preventDefault();
        this.onAddRow();
        setTimeout(() => {
          this.focusRowInput(rowIndex + 1, 'Content');
        }, 100);
      } else {
        event.preventDefault();
        this.focusRowInput(rowIndex + 1, column);
      }
    } else if (event.key === 'ArrowUp') {
      if (rowIndex > 0) {
        event.preventDefault();
        this.focusRowInput(rowIndex - 1, column);
      }
    } else if (event.key === 'Tab') {
      if (rowIndex === this.filteredDataset.length - 1 && column === 'Content') {
        event.preventDefault();
        this.onAddRow();
        setTimeout(() => {
          this.focusRowInput(rowIndex + 1, 'SortOrder');
        }, 100);
      }
    }
  }

  focusRowInput(rowIndex: number, column: string): void {
    const selector = `[data-row="${rowIndex}"][data-col="${column}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      if (column === 'ProjectGateID') {
        const selectControl = element.querySelector('.ant-select-selector') as HTMLElement;
        if (selectControl) {
          selectControl.focus();
        } else {
          element.focus();
        }
      } else if (column === 'SortOrder') {
        const inputNum = element.querySelector('input') as HTMLElement;
        if (inputNum) {
          inputNum.focus();
        } else {
          element.focus();
        }
      } else {
        element.focus();
      }
    }
  }

  onManageTemplates(): void {
    const modalRef = this.ngbModal.open(ProjectGateStepTemplateModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadProduce();
        }
      },
      () => { }
    );
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || `${err.error}\n${err.message}`,
      { nzStyle: { whiteSpace: 'pre-line' } }
    );
  }

  toggleSearchPanel(): void { this.showSearchBar = !this.showSearchBar; }

  onExportExcel(): void {
    if (!this.filteredDataset || this.filteredDataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách Bước Gate');

    worksheet.columns = [
      { header: 'Thứ tự sắp xếp', key: 'SortOrder', width: 15 },
      { header: 'Mã Gate', key: 'GateCode', width: 15 },
      { header: 'Tên Gate', key: 'GateName', width: 25 },
      { header: 'Nội dung công việc', key: 'Content', width: 40 },
      { header: 'Yêu cầu hoàn thành', key: 'CheckListNames', width: 30 }
    ];

    this.filteredDataset.forEach((item) => {
      worksheet.addRow({
        SortOrder: item.SortOrder ?? '',
        GateCode: item.GateCode ?? '',
        GateName: item.GateName ?? '',
        Content: item.Content ?? '',
        CheckListNames: item.CheckListNames ?? ''
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
        });
      }
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const formattedDate = DateTime.now().toFormat('yyyyMMdd_HHmmss');
      saveAs(blob, `DanhSachBuocGate_${formattedDate}.xlsx`);
    }).catch(err => {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xuất file excel: ' + (err.message || err));
    });
  }
}

