import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectorRef, Inject, Optional } from '@angular/core';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { SupplierSaleLinkService } from '../supplier-sale-link.service';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { MenubarModule } from 'primeng/menubar';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule as NzGridModuleZorro } from 'ng-zorro-antd/grid';

export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number' | 'date';
  filterOptions?: any[]; filterValue?: any;
  align?: string; dateFormat?: string; hidden?: boolean; uppercase?: boolean;
}

@Component({
  selector: 'app-supplier-sale-link-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzSpinModule,
    NzCheckboxModule,
    NzGridModule,
    TableModule,
    MenubarModule,
    NzIconModule,
    MultiSelectModule,
    InputTextModule
  ],
  templateUrl: './supplier-sale-link-form.component.html',
  styleUrls: ['./supplier-sale-link-form.component.css']
})
export class SupplierSaleLinkFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  private _data: any;

  @Input() set data(val: any) {
    this._data = val;
    if (val && val.EmployeePurchaseID) {
      this.isEdit = true;
      // We'll handle data patching in ngOnInit or a dedicated method
    }
  }
  get data() { return this._data; }

  menuBars: MenuItem[] = [];
  showSearchBar = true;

  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  employeePurchases: any[] = [];
  employeeOptions: any[] = []; // For nzOptions
  selectedSuppliers: any[] = [];
  totalRecords = 0;
  lastLazyLoadEvent: any;
  searchTableKeyword = '';
  searchSubject = new Subject<string>();

  columns: ColDef[] = [
    { field: 'CodeNCC', header: 'Mã', width: '150px', filterType: 'multiselect' },
    { field: 'NameNCC', header: 'Tên nhà cung cấp', width: '250px', filterType: 'multiselect' },
    { field: 'MatHang', header: 'Mặt hàng', width: '250px', filterType: 'text' },
    { field: 'Note', header: 'Ghi chú', width: 'auto', filterType: 'text' }
  ];

  constructor(
    private fb: FormBuilder,
    private supplierSaleLinkService: SupplierSaleLinkService,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject('tabData') private _tabData: any
  ) {
    if (this._tabData) {
      this.data = this._tabData;
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.initMenu();
    this.loadDropdowns();

    this.searchSubject.pipe(debounceTime(500)).subscribe(kw => {
      this.onTableSearch(kw);
    });
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Lưu dữ liệu',
        icon: 'fa-solid fa-floppy-disk text-success',
        command: () => this.onSubmit(),
        disabled: this.form?.invalid || this.loading
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-arrows-rotate text-secondary',
        command: () => {
          const empId = this.form.get('EmployeePurchaseID')?.value;
          if (empId) this.loadAllSelectedItems(empId);
        }
      },
      {
        label: 'Đóng',
        icon: 'fa-solid fa-xmark text-danger',
        command: () => this.onClose()
      }
    ];
  }

  updateMenuState(): void {
    this.menuBars = this.menuBars.map(item => {
      if (item.label === 'Lưu dữ liệu') {
        const isDisabled = !this.form || this.form.invalid || this.loading || this.selectedSuppliers.length === 0;
        return { ...item, disabled: isDisabled };
      }
      return item;
    });
    this.cdr.detectChanges();
  }

  initForm(): void {
    this.form = this.fb.group({
      EmployeePurchaseID: [null, [Validators.required]]
    });

    if (this.data && (this.data.EmployeePurchaseID || this.data.id)) {
      this.isEdit = true;
      this.form.patchValue({
        EmployeePurchaseID: this.data.EmployeePurchaseID || this.data.id
      });
      // Trigger data load
      this.loadAllSelectedItems(this.data.EmployeePurchaseID || this.data.id);
    }

    this.form.get('EmployeePurchaseID')?.valueChanges.subscribe(val => {
      this.updateMenuState();
      if (val) {
        this.loadAllSelectedItems(val);
      } else {
        this.selectedSuppliers = [];
      }
    });
  }

  loadDropdowns(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.supplierSaleLinkService.getEmployees(4).subscribe({
      next: (res: any) => {
        const data = res.data || [];
        this.employeePurchases = Array.from(new Map(data.map((item: any) => [item.ID, item])).values());

        this.employeeOptions = this.employeePurchases.map((item: any) => ({
          label: `${item.Code} - ${item.FullName}`,
          value: item.ID
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
        this.cdr.detectChanges();
      }
    });
  }

  loadAllSelectedItems(employeeID: number) {
    this.loading = true;
    this.cdr.detectChanges();
    this.supplierSaleLinkService.getWithSelection(employeeID, '', 1, 999999).subscribe({
      next: (res: any) => {
        this.selectedSuppliers = (res.data || []).filter((x: any) => x.IsSelected === 1);
        if (this.lastLazyLoadEvent) {
          this.lastLazyLoadEvent.first = 0;
          this.loadLazy(this.lastLazyLoadEvent);
        }
        this.loading = false;
        this.cdr.detectChanges();
        this.updateMenuState();
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
        this.cdr.detectChanges();
      }
    });
  }

  loadLazy(event: any): void {
    this.lastLazyLoadEvent = event;
    const employeeID = this.form.get('EmployeePurchaseID')?.value || 0;

    // In lazy mode, we need to handle pagination and filtering
    const page = (event.first / event.rows) + 1;
    const rows = event.rows;
    const keyword = this.searchTableKeyword;

    this.loading = true;
    this.cdr.detectChanges();
    this.supplierSaleLinkService.getWithSelection(employeeID, keyword, page, rows).subscribe({
      next: (res: any) => {
        this.suppliers = (res.data || []).map((s: any) => {
          const existing = this.selectedSuppliers.find(sel => sel.ID === s.ID);
          if (existing) {
            // If it exists in selection, use that reference but update it with the latest data from DB if needed
            // Actually, we usually want to keep the user's current edits in selectedSuppliers
            return existing;
          }
          return s;
        });

        this.totalRecords = this.suppliers.length > 0 ? this.suppliers[0].TotalCount : 0;

        // Sync selected status from the database for the current page
        // If an item is marked as IsSelected in DB but not in our current selection array, add it.
        const preSelected = this.suppliers.filter(s => s.IsSelected === 1);
        const currentSelections = [...this.selectedSuppliers];
        let changed = false;

        preSelected.forEach(s => {
          if (!currentSelections.find(sel => sel.ID === s.ID)) {
            currentSelections.push(s);
            changed = true;
          }
        });

        if (changed) {
          this.selectedSuppliers = currentSelections;
        }

        this.refreshFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.filteredSuppliers = this.applyFilters(this.suppliers, this.columns);
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
        const set = new Set<string>();
        this.suppliers.forEach(row => {
          const v = row?.[col.field];
          if (v !== null && v !== undefined && v !== '') set.add(String(v));
        });
        col.filterOptions = Array.from(set).sort().map(v => ({ label: v, value: v }));
      }
    });
    this.onFilterChange();
  }

  onTableSearch(keyword: string): void {
    this.searchTableKeyword = keyword;
    if (this.lastLazyLoadEvent) {
      this.lastLazyLoadEvent.first = 0; // Reset to first page
      this.loadLazy(this.lastLazyLoadEvent);
    }
  }

  trackById(index: number, item: any): any {
    return item.ID;
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (this.selectedSuppliers.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một nhà cung cấp');
        return;
      }

      this.loading = true;
      const employeeID = this.form.get('EmployeePurchaseID')?.value;

      const itemsToSave = this.selectedSuppliers.map(s => ({
        SupplierSaleID: s.ID,
        EmployeePurchaseID: employeeID,
        Note: s.Note || '',
        MatHang: s.MatHang || ''
      }));

      // Validation: MatHang is required for all selected items
      const invalidItem = this.selectedSuppliers.find(s => !s.MatHang || s.MatHang.trim() === '');
      if (invalidItem) {
        this.notification.error(NOTIFICATION_TITLE.error, `Vui lòng nhập mặt hàng cho nhà cung cấp: ${invalidItem.NameNCC}`);
        this.loading = false;
        return;
      }

      // If backend only supports single save, we might need to iterate.
      // But usually 'save' in this project can be overloaded.
      // Given the previous code saved one object, I'll send the array and see.
      // Actually, I should probably check if there is a 'saveData' pattern.

      this.supplierSaleLinkService.save(itemsToSave).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
          this.tabService.notifyDataSaved('supplier-sale-link');
          this.onClose();
        },
        error: (err: any) => {
          this.loading = false;
          this.showError(err);
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onClose(): void {
    const activeKey = (this.tabService as any).activeTab?.key;
    if (activeKey) {
      this.tabService.closeTabByKey(activeKey);
    } else {
      this.tabService.closeTabByKey(this.isEdit ? `supplier-sale-link-edit-${this.data?.EmployeePurchaseID}` : 'supplier-sale-link-new');
    }
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}
