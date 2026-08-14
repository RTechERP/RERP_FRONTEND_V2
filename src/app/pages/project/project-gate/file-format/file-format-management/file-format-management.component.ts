import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
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

import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { FileFormatService } from '../file-format.service';
import { FileFormatFormComponent } from '../file-format-form/file-format-form.component';

export interface ColDef {
  field: string;
  header: string;
  width: string;
  type?: string;
  filterType?: 'multiselect' | 'text' | 'number';
  filterOptions?: any[];
  filterValue?: any;
}

@Component({
  selector: 'app-file-format-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
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
  templateUrl: './file-format-management.component.html',
  styleUrls: ['./file-format-management.component.css']
})
export class FileFormatManagementComponent implements OnInit {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  searchKeyword: string = '';
  showSearchBar: boolean = true;

  columns: ColDef[] = [
    { field: 'STT', header: 'STT', width: '70px', filterType: 'number' },
    { field: 'FormatName', header: 'Tên định dạng', width: '220px', filterType: 'text' },
    { field: 'Extension', header: 'Đuôi mở rộng', width: '180px', filterType: 'text' },
    { field: 'CreatedBy', header: 'Người tạo', width: '160px', filterType: 'text' },
    { field: 'CreatedDate', header: 'Ngày tạo', width: '160px', filterType: 'text' }
  ];

  constructor(
    private service: FileFormatService,
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
        return (row.FormatName && row.FormatName.toLowerCase().includes(keyword)) ||
               (row.Extension && row.Extension.toLowerCase().includes(keyword));
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
    const modalRef = this.ngbModal.open(FileFormatFormComponent, {
      size: 'md',
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

    const modalRef = this.ngbModal.open(FileFormatFormComponent, {
      size: 'md',
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

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedItems.length} định dạng file đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const ids = this.selectedItems.map(item => item.ID);
        this.loading = true;
        this.service.delete(ids).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa định dạng file thành công!');
            this.loadData();
          },
          error: (err: any) => {
            this.loading = false;
            this.showError(err);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  async onExportExcel(): Promise<void> {
    if (this.filteredDataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách Định dạng File');

    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Tên định dạng', key: 'FormatName', width: 30 },
      { header: 'Đuôi mở rộng', key: 'Extension', width: 20 },
      { header: 'Người tạo', key: 'CreatedBy', width: 25 },
      { header: 'Ngày tạo', key: 'CreatedDate', width: 25 }
    ];

    this.filteredDataset.forEach((row, idx) => {
      worksheet.addRow({
        STT: row.STT || idx + 1,
        FormatName: row.FormatName || '',
        Extension: row.Extension || '',
        CreatedBy: row.CreatedBy || '',
        CreatedDate: row.CreatedDate ? DateTime.fromISO(row.CreatedDate).toFormat('dd/MM/yyyy HH:mm') : ''
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Danh_sach_Dinh_dang_File_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`);
  }

  private showError(err: any): void {
    this.notification.error(
      NOTIFICATION_TITLE.error,
      err?.error?.message || err?.message || 'Đã có lỗi xảy ra!'
    );
  }
}
