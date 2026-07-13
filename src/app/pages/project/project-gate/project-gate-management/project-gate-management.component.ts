import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ProjectGateService } from '../project-gate.service';
import { ProjectGateFormComponent } from '../project-gate-form/project-gate-form.component';

export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number';
  filterOptions?: any[]; filterValue?: any;
}

@Component({
  selector: 'app-project-gate-management',
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
    NzCardModule,
    NzFlexModule,
    NzSelectModule,
    NzGridModule,
    NzFormModule,
    TableModule,
    TooltipModule,
    TagModule,
    MenubarModule,
    MultiSelectModule,
    InputTextModule
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './project-gate-management.component.html',
  styleUrls: ['./project-gate-management.component.css']
})
export class ProjectGateManagementComponent implements OnInit {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  searchKeyword: string = '';
  showSearchBar: boolean = true;

  columns: ColDef[] = [
    { field: 'STT', header: 'STT', width: '60px', filterType: 'number' },
    { field: 'GateCode', header: 'Mã Gate', width: '130px', filterType: 'text' },
    { field: 'Type', header: 'Loại', width: '110px', filterType: 'text' },
    { field: 'GateName', header: 'Tên Gate', width: '200px', filterType: 'text' },
    { field: 'StepName', header: 'Tên bước quy trình', width: '180px', filterType: 'text' },
    { field: 'Target', header: 'Mục tiêu', width: '220px', filterType: 'text' },
    { field: 'RequireInput', header: 'Yêu cầu đầu vào', width: '220px', filterType: 'text' },
    { field: 'RequireOuput', header: 'Yêu cầu đầu ra', width: '220px', filterType: 'text' },
    { field: 'ActionIfRejected', header: 'Hành động nếu reject', width: '220px', filterType: 'text' }
  ];

  // Mapping Type value to label
  typeLabel: Record<number, string> = {
    1: 'Giải pháp',
    2: 'Triển khai'
  };

  getTypeName(type: number | null | undefined): string {
    if (type == null) return '';
    return this.typeLabel[type] ?? '';
  }

  constructor(
    private service: ProjectGateService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadData();
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
      if (item.label === 'Sửa') {
        return { ...item, disabled: this.selectedItems.length !== 1 };
      }
      if (item.label === 'Xóa') {
        return { ...item, disabled: this.selectedItems.length === 0 };
      }
      return item;
    });
  }

  loadData(): void {
    this.loading = true;
    this.service.getAll().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        this.dataset = res.data || [];
        this.selectedItems = [];
        this.onFilterChange();
        this.updateMenuState();
      },
      error: (err: any) => this.showError(err)
    });
  }

  onFilterChange() {
    this.filteredDataset = this.applyFilters(this.dataset, this.columns);
    this.onKeywordSearch();
  }

  onKeywordSearch() {
    if (this.searchKeyword && this.searchKeyword.trim() !== '') {
      const keyword = this.searchKeyword.toLowerCase().trim();
      this.filteredDataset = this.filteredDataset.filter(row => {
        return (row.GateCode && row.GateCode.toLowerCase().includes(keyword)) ||
               (row.GateName && row.GateName.toLowerCase().includes(keyword)) ||
               (row.StepName && row.StepName.toLowerCase().includes(keyword)) ||
               (row.Target && row.Target.toLowerCase().includes(keyword));
      });
    }
  }

  applyFilters(data: any[], columns: ColDef[]): any[] {
    return data.filter(row => {
      return columns.every(col => {
        const fv = col.filterValue;
        if (fv === null || fv === undefined || fv === '' || (Array.isArray(fv) && fv.length === 0)) return true;
        const rv = row[col.field];
        if (col.filterType === 'number') {
          return rv != null && String(rv).includes(String(fv));
        }
        return rv != null && String(rv).toLowerCase().includes(String(fv).toLowerCase());
      });
    });
  }

  onSearch(): void {
    this.onFilterChange();
  }

  onReset(): void {
    this.searchKeyword = '';
    this.columns.forEach(col => col.filterValue = null);
    this.onFilterChange();
  }

  onAdd(): void {
    const modalRef = this.ngbModal.open(ProjectGateFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = null;

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      () => { }
    );
  }

  onEdit(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    
    const modalRef = this.ngbModal.open(ProjectGateFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = { ...selected };

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.loadData();
        }
      },
      () => { }
    );
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;

    const ids = this.selectedItems.map(x => x.ID);
    const count = this.selectedItems.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${count} gate kiểm soát đã chọn không?`,
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
      {
        nzStyle: { whiteSpace: 'pre-line' }
      }
    );
  }

  toggleSearchPanel(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  onExportExcel(): void {
    if (!this.filteredDataset || this.filteredDataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách Gate');

    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã Gate', key: 'GateCode', width: 15 },
      { header: 'Loại', key: 'TypeName', width: 15 },
      { header: 'Tên Gate', key: 'GateName', width: 25 },
      { header: 'Tên bước quy trình', key: 'StepName', width: 25 },
      { header: 'Mục tiêu', key: 'Target', width: 30 },
      { header: 'Yêu cầu đầu vào', key: 'RequireInput', width: 30 },
      { header: 'Yêu cầu đầu ra', key: 'RequireOuput', width: 30 },
      { header: 'Hành động nếu reject', key: 'ActionIfRejected', width: 30 }
    ];

    this.filteredDataset.forEach((item, index) => {
      worksheet.addRow({
        STT: item.STT ?? (index + 1),
        GateCode: item.GateCode ?? '',
        TypeName: this.getTypeName(item.Type),
        GateName: item.GateName ?? '',
        StepName: item.StepName ?? '',
        Target: item.Target ?? '',
        RequireInput: item.RequireInput ?? '',
        RequireOuput: item.RequireOuput ?? '',
        ActionIfRejected: item.ActionIfRejected ?? ''
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          const value = cell.value ? String(cell.value) : '';
          if (value.length > maxLen) {
            maxLen = value.length;
          }
        } else {
          const headerText = column.header ? String(column.header) : '';
          maxLen = Math.max(maxLen, headerText.length);
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 2 ? 'center' : 'left' };
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
      saveAs(blob, `DanhSachGateKiemSoat_${formattedDate}.xlsx`);
    }).catch(err => {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xuất file excel: ' + (err.message || err));
    });
  }
}
