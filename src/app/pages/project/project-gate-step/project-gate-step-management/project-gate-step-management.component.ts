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
import { ProjectGateStepFormComponent } from '../project-gate-step-form/project-gate-step-form.component';
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

  // Produce data
  gateList: any[] = [];
  departmentList: any[] = [];
  positionList: any[] = [];
  templateList: any[] = [];
  groupedTemplates: Array<{
    label: string;
    options: Array<{
      label: string;
      value: number | null;
      disabled: boolean;
      isHeader?: boolean;
    }>;
  }> = [];

  columns: ColDef[] = [
    { field: 'TT', header: 'TT', width: '40px', filterType: 'text' },
    { field: 'SortOrder', header: 'Thứ tự', width: '40px', filterType: 'number' },
    { field: 'GateCode', header: 'Mã Gate', width: '120px', filterType: 'text' },
    { field: 'GateName', header: 'Tên Gate', width: '180px', filterType: 'text' },

    { field: 'Content', header: 'Nội dung công việc', width: '260px', filterType: 'text' },
    { field: 'CheckListNames', header: 'Yêu cầu hoàn thành', width: '200px', filterType: 'text' },
    { field: 'DepartmentNames', header: 'Phòng ban', width: '150px', filterType: 'text' },
    { field: 'PositionNames', header: 'Chức vụ', width: '150px', filterType: 'text' }
  ];

  constructor(
    private service: ProjectGateStepService,
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
    this.loadProduce();
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm mới',
        icon: 'fa-solid fa-circle-plus text-primary',
        command: () => this.onAdd()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen text-warning',
        command: () => this.onEdit(),
        disabled: this.selectedItems.length !== 1
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

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Sửa') return { ...item, disabled: this.selectedItems.length !== 1 };
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
    // 1. Group templates by Department Name first
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

    // Sort departments
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
        // Add Project Type header (disabled option)
        options.push({
          label: `--- ${projType} ---`,
          value: null,
          disabled: true,
          isHeader: true
        });

        // Add templates under this Project Type
        const templates = projTypesMap[projType];
        // Sort templates by Code
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

          // Map GateType from gateList
          rawData.forEach((row: any) => {
            const gate = this.gateList.find(g => g.ID === row.ProjectGateID);
            if (gate) {
              row.GateType = gate.Type; // 1 = Giải pháp, 2 = Triển khai
            }
          });

          // Sắp xếp theo GateType trước, sau đó theo SortOrder & TT
          rawData.sort((a: any, b: any) => {
            const typeA = a.GateType ?? 0;
            const typeB = b.GateType ?? 0;
            if (typeA !== typeB) {
              return typeA - typeB;
            }
            const orderA = a.SortOrder ?? 0;
            const orderB = b.SortOrder ?? 0;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return (a.TT || '').localeCompare(b.TT || '');
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
    this.filteredDataset = this.applyFilters(this.dataset, this.columns);
    if (this.templateId !== null && this.templateId !== undefined) {
      this.filteredDataset = this.filteredDataset.filter(row => row.ProjectGateStepTemplateID === this.templateId);
    }
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

  applyFilters(data: any[], columns: ColDef[]): any[] {
    return data.filter(row =>
      columns.every(col => {
        const fv = col.filterValue;
        if (fv === null || fv === undefined || fv === '') return true;
        const rv = row[col.field];
        if (col.filterType === 'number') return rv != null && String(rv).includes(String(fv));
        return rv != null && String(rv).toLowerCase().includes(String(fv).toLowerCase());
      })
    );
  }

  onReset(): void {
    this.templateId = null;
    this.templateName = '';
    this.templateCode = '';
    this.columns.forEach(col => col.filterValue = null);
    this.onFilterChange();
  }

  openForm(dataInput: any | null): void {
    const modalRef = this.ngbModal.open(ProjectGateStepFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    if (!dataInput && this.templateId) {
      dataInput = { ProjectGateStepTemplateID: this.templateId };
    }

    modalRef.componentInstance.dataInput = dataInput;
    modalRef.componentInstance.gateList = this.gateList;
    modalRef.componentInstance.departmentList = this.departmentList;
    modalRef.componentInstance.positionList = this.positionList;
    modalRef.componentInstance.templateList = this.templateList;

    modalRef.result.then(
      (result) => { if (result === 'save') this.loadData(); },
      () => { }
    );
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
          this.loadProduce(); // Tải lại template list trong select box
        }
      },
      () => { }
    );
  }

  onAdd(): void { this.openForm(null); }

  onOpenChecklist(): void {
    if (this.selectedItems.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đúng 1 công đoạn để quản lý checklist!');
      return;
    }
    const step = this.selectedItems[0];
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

  onEdit(): void {
    if (this.selectedItems.length !== 1) return;
    this.openForm({ ...this.selectedItems[0] });
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;
    const ids = this.selectedItems.map(x => x.ID);
    const count = this.selectedItems.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${count} bước/công đoạn đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.loading = true;
        this.service.delete(ids).subscribe({
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
      { header: 'Mã Gate', key: 'GateCode', width: 15 },
      { header: 'Tên Gate', key: 'GateName', width: 25 },
      { header: 'TT', key: 'TT', width: 10 },
      { header: 'Thứ tự sắp xếp', key: 'SortOrder', width: 15 },
      { header: 'Nội dung công việc', key: 'Content', width: 40 },
      { header: 'Yêu cầu hoàn thành', key: 'CheckListNames', width: 30 },
      { header: 'Phòng ban phụ trách', key: 'DepartmentNames', width: 30 },
      { header: 'Chức vụ phụ trách', key: 'PositionNames', width: 30 }
    ];

    this.filteredDataset.forEach((item) => {
      worksheet.addRow({
        GateCode: item.GateCode ?? '',
        GateName: item.GateName ?? '',
        TT: item.TT ?? '',
        SortOrder: item.SortOrder ?? '',
        Content: item.Content ?? '',
        CheckListNames: item.CheckListNames ?? '',
        DepartmentNames: item.DepartmentNames ?? '',
        PositionNames: item.PositionNames ?? ''
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
