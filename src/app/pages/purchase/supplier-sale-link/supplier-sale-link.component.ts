import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { TabServiceService } from '../../../layouts/tab-service.service';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { finalize } from 'rxjs/operators';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { SupplierSaleLinkService } from './supplier-sale-link.service';
import { PermissionService } from '../../../services/permission.service';
import { SupplierSaleLinkFormComponent } from './supplier-sale-link-form/supplier-sale-link-form.component';
import { SupplierSaleLinkImportExcelComponent } from './supplier-sale-link-import-excel/supplier-sale-link-import-excel.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number' | 'date';
  filterOptions?: any[]; filterValue?: any;
  align?: string; dateFormat?: string; hidden?: boolean; uppercase?: boolean;
}

@Component({
  selector: 'app-supplier-sale-link',
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
  templateUrl: './supplier-sale-link.component.html',
  styleUrls: ['./supplier-sale-link.component.css']
})
export class SupplierSaleLinkComponent implements OnInit, OnDestroy {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  searchKeyword: string = '';
  searchEmployeeID: number = 0;
  employeePurchases: any[] = [];
  showSearchBar: boolean = true;

  columns: ColDef[] = [
    { field: 'CodeNCC', header: 'Mã', width: '120px', filterType: 'multiselect' },
    { field: 'NameNCC', header: 'Nhà cung cấp', width: '220px', filterType: 'multiselect' },
    { field: 'MatHang', header: 'Mặt hàng', width: '250px', filterType: 'text' },
    { field: 'Website', header: 'Website', width: '200px', filterType: 'text', type: 'link' },
    { field: 'IsAgencyCertified', header: 'Chứng nhận ĐL', width: '50px', filterType: 'multiselect', type: 'boolean' },
    { field: 'AgencyTime', header: 'Ngày đại lý', width: '180px', filterType: 'text' },
    { field: 'Note', header: 'Ghi chú', width: '300px', filterType: 'text' }
  ];

  private dataSavedSub?: Subscription;

  constructor(
    private supplierSaleLinkService: SupplierSaleLinkService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private tabService: TabServiceService,
    private permissionService: PermissionService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadEmployees();
    this.loadData();

    this.dataSavedSub = this.tabService.dataSaved$.subscribe(key => {
      if (key === 'supplier-sale-link') {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSavedSub) {
      this.dataSavedSub.unsubscribe();
    }
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm mới',
        icon: 'fa-solid fa-circle-plus text-primary',
        command: () => this.onAdd(),
        visible: this.permissionService.hasPermission('N33,N1')
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen text-warning',
        command: () => this.onEdit(),
        disabled: this.selectedItems.length !== 1,
        visible: this.permissionService.hasPermission('N33,N1')
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash text-danger',
        command: () => this.onDelete(),
        disabled: this.selectedItems.length === 0,
        visible: this.permissionService.hasPermission('N33,N1')
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => this.loadData(),
        visible: true,
      },
      { label: 'Nhập Excel', icon: 'fa-solid fa-file-import text-info', command: () => this.onImportExcel(), visible: this.permissionService.hasPermission('N33,N1') },
      { label: 'Xuất Excel', icon: 'fa-solid fa-file-excel text-success', command: () => this.onExport() }
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

  loadEmployees(): void {
    this.supplierSaleLinkService.getEmployees(4).subscribe({
      next: (res: any) => {
        this.employeePurchases = res.data || [];
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.supplierSaleLinkService.getAll(this.searchKeyword, this.searchEmployeeID).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        this.dataset = res.data || [];
        this.selectedItems = [];
        this.refreshFilters();
        this.updateMenuState();
      },
      error: (err: any) => this.showError(err)
    });
  }

  onFilterChange() {
    this.filteredDataset = this.applyFilters(this.dataset, this.columns);
  }

  applyFilters(data: any[], columns: ColDef[]): any[] {
    return data.filter(row => {
      return columns.every(col => {
        const fv = col.filterValue;
        if (fv === null || fv === undefined || fv === '' || (Array.isArray(fv) && fv.length === 0)) return true;
        const rv = row[col.field];
        if (col.filterType === 'multiselect') {
          if (!Array.isArray(fv) || fv.length === 0) return true;
          if (col.type === 'boolean') {
            return fv.includes(!!rv);
          }
          return fv.includes(rv) || fv.includes(String(rv));
        }
        if (col.filterType === 'number') {
          return rv != null && String(rv).includes(String(fv));
        }
        // text
        return rv != null && String(rv).toLowerCase().includes(String(fv).toLowerCase());
      });
    });
  }

  refreshFilters() {
    this.columns.forEach(col => {
      if (col.filterType === 'multiselect') {
        const set = new Set<any>();
        this.dataset.forEach(row => {
          const v = row?.[col.field];
          if (v !== null && v !== undefined && v !== '') {
            set.add(v);
          }
        });
        col.filterOptions = Array.from(set).sort().map(v => {
          if (col.type === 'boolean') {
            const isTrue = String(v).toLowerCase() === 'true' || v === true || v === 1;
            return { label: isTrue ? 'Yes' : 'No', value: isTrue };
          }
          return { label: String(v), value: v };
        });
      }
    });
    this.onFilterChange();
  }

  onSearch(): void {
    if (!this.searchEmployeeID) {
      this.searchEmployeeID = 0;
    }
    this.loadData();
  }

  onReset(): void {
    this.searchKeyword = '';
    this.searchEmployeeID = 0;
    this.loadData();
  }

  onAdd(): void {
    this.tabService.openTabComp({
      comp: SupplierSaleLinkFormComponent,
      title: 'Thêm NCC mới',
      key: 'supplier-sale-link-new',
      data: null
    });
  }

  onEdit(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    const id = selected.EmployeePurchaseID;
    this.tabService.openTabComp({
      comp: SupplierSaleLinkFormComponent,
      title: `Cập nhật NCC theo NV: ${selected.EmployeeName || ''}`,
      key: `supplier-sale-link-edit-${id}`,
      data: { ...selected }
    });
  }

  onImportExcel(): void {
    const modalRef = this.ngbModal.open(SupplierSaleLinkImportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.loadData();
        }
      },
      () => { } // dismissed
    );
  }

  onExport(): void {
    if (this.filteredDataset.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách NCC theo nhân viên mua');

    // Define columns
    const excelCols = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Mã NV', key: 'empCode', width: 10 },
      { header: 'Nhân viên', key: 'employee', width: 25 },
      { header: 'Mã NCC', key: 'code', width: 20 },
      { header: 'Tên nhà cung cấp', key: 'name', width: 50 },
      { header: 'Mặt hàng', key: 'mathang', width: 50 },
      { header: 'Website', key: 'website', width: 30 },
      { header: 'Chứng nhận ĐL', key: 'certified', width: 15 },
      { header: 'Thời điểm làm ĐL', key: 'agencyTime', width: 25 },
      { header: 'Ghi chú', key: 'note', width: 50 }
    ];

    worksheet.columns = excelCols;
    // Styling Header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Light Grey
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add Data
    this.filteredDataset.forEach((item, index) => {
      const row = worksheet.addRow({
        stt: index + 1,
        empCode: item.EmployeePurchaseCode,
        employee: item.EmployeePurchaseName,
        code: item.CodeNCC,
        name: item.NameNCC,
        mathang: item.MatHang,
        website: item.Website,
        certified: item.IsAgencyCertified ? 'Yes' : 'No',
        agencyTime: item.AgencyTime,
        note: item.Note
      });

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Times New Roman', size: 11 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 8) ? 'center' : 'left',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate and Save
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `DSNVMuaTheoNCC_${new Date().getTime()}.xlsx`);
    });
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;

    const ids = this.selectedItems.map(x => x.ID).join(',');
    const count = this.selectedItems.length;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${count} nhà cung cấp theo nhân viên mua đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.supplierSaleLinkService.delete(ids).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
            this.loadData();
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }

  toggleSearchPanel(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  getHref(value: any): string {
    if (!value) return '';
    const val = String(value).trim();
    if (val.startsWith('http://') || val.startsWith('https://')) {
      return val;
    }
    return 'http://' + val;
  }
}
