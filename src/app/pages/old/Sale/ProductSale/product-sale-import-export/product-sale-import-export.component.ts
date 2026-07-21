import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SplitterModule } from 'primeng/splitter';
import { FieldsetModule } from 'primeng/fieldset';
import { CardModule } from 'primeng/card';

import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { BillImportTechnicalService } from '../../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { InventoryService } from '../../Inventory/inventory-service/inventory.service';
import { UserService } from '../../../../../services/user.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ProductSaleImportExportLogComponent } from './product-sale-import-export-log/product-sale-import-export-log.component';


export interface InventoryItem {
  id: number;
  productCode: string;
  productName: string;
  productNewCode: string;
  totalQuantityLast: number;
  displayText?: string;
}

export interface StandardizationRow {
  stt: number;
  exportProduct: InventoryItem | null;
  exportProductNewCode?: string;
  exportProductCode?: string;
  exportProductName?: string;
  exportStockQty?: number;
  importProduct: InventoryItem | null;
  importProductNewCode?: string;
  importProductCode?: string;
  importProductName?: string;
  quantity: number;
  note: string;
}

@Component({
  selector: 'app-product-sale-import-export',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    CheckboxModule,
    SplitterModule,
    FieldsetModule,
    CardModule,
    NzModalModule,
    NzNotificationModule,
    ProductSaleImportExportLogComponent
  ],
  templateUrl: './product-sale-import-export.component.html',
  styleUrl: './product-sale-import-export.component.css'
})
export class ProductSaleImportExportComponent implements OnInit {

  // #region Component Properties
  mainForm!: FormGroup;

  // Lookups & Data Sources
  warehouses: any[] = [];
  productGroups: any[] = [];
  employees: any[] = [];
  customers: any[] = [];
  suppliers: any[] = [];
  rulePays: any[] = [];

  // Inventory Lists for selection
  fullInventory: InventoryItem[] = [];
  filteredExportProducts: InventoryItem[] = [];
  filteredImportProducts: InventoryItem[] = [];

  // Search Inputs
  searchExportQuery: string = '';
  searchImportQuery: string = '';

  firstExport: number = 0;
  firstImport: number = 0;

  // Grid Data
  standardizationRows: StandardizationRow[] = [];
  selectedRowIndex: number | null = null;

  // Status UI
  lblStatus: string = 'Sẵn sàng';
  isSaving: boolean = false;
  isLoadingInventory: boolean = false;
  // #endregion

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private productsaleService: ProductsaleServiceService,
    private billImportService: BillImportTechnicalService,
    private projectService: ProjectService,
    private inventoryService: InventoryService,
    private modal: NzModalService,
    private userservice: AppUserService
  ) { }

  // #region Life Cycle
  ngOnInit(): void {
    this.initForm();
    this.loadAllLookups();
  }
  // #endregion

  // #region Form Initialization
  private initForm(): void {
    this.mainForm = this.fb.group({
      warehouseCode: ['HN', Validators.required],
      productGroupId: [null, Validators.required],
      customerId: [2017],
      supplierId: [1175],
      rulePayId: [{ value: 34, disabled: true }], // Mặc định: Không có điều khoản thanh toán
      deliverImportId: [24],
      reciverImportId: [24],
      senderExportId: [24],
      reciverExportId: [24],
      user: [{ value: 'Admin', disabled: true }],
      note: [''],
      date: [new Date(), Validators.required],
      requestDate: [new Date(), Validators.required]
    });
  }
  // #endregion

  // #region Load Data (APIs)
  loadAllLookups(): void {
    this.lblStatus = 'Đang tải danh mục...';

    this.getWarehouses();
    this.getEmployees();
    this.getCustomers();
    this.getSuppliers();
    this.getRulePays();

    this.lblStatus = 'Sẵn sàng';
  }

  getWarehouses(): void {
    this.productsaleService.getdataWareHouse().subscribe({
      next: (res: any) => {
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          this.warehouses = list.map((w: any) => ({
            id: w.ID || w.id || 0,
            warehouseCode: w.WarehouseCode || w.warehouseCode || '',
            warehouseName: w.WarehouseName || w.warehouseName || ''
          }));
          const hnWh = this.warehouses.find(w => w.warehouseCode === 'HN');
          if (hnWh) {
            this.getProductGroupsByWarehouse(hnWh.id);
          }
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách kho:', err);
      }
    });
  }

  getEmployees(): void {
    this.projectService.getUsers().subscribe({
      next: (res: any) => {
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          this.employees = list.map((item: any) => ({
            userId: item.ID || item.id,
            fullName: item.FullName || item.fullName,
            id: item.EmployeeID || item.ID
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', err);
      }
    });
  }

  getCustomers(): void {
    this.billImportService.getCustomer(1, 100000, '', 0, 0).subscribe({
      next: (res: any) => {
        if (res?.data?.data) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          this.customers = list.map((c: any) => ({
            id: c.ID || c.id,
            customerName: c.CustomerName || c.customerName
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách khách hàng:', err);
      }
    });
  }

  getSuppliers(): void {
    this.billImportService.getNCC().subscribe({
      next: (res: any) => {
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          this.suppliers = list.map((s: any) => ({
            id: s.ID || s.id,
            nameNcc: s.NameNCC || s.nameNcc
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách nhà cung cấp:', err);
      }
    });
  }

  getRulePays(): void {
    this.billImportService.getRulepay().subscribe({
      next: (res: any) => {
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          this.rulePays = list.map((r: any) => ({
            id: r.ID || r.id,
            note: r.Note || r.note
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách điều khoản thanh toán:', err);
      }
    });
  }

  getProductGroupsByWarehouse(warehouseId: number): void {
    this.productsaleService.getdataProductGroupNew(warehouseId, false, true).subscribe({
      next: (res) => {
        if (res?.data?.data1) {
          const list = Array.isArray(res.data.data1) ? res.data.data1 : [];
          this.productGroups = list.map((item: any) => ({
            id: item.ID || item.id,
            name: item.ProductGroupName || item.name,
            employeeId: item.EmployeeID || item.employeeId
          }));
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải nhóm sản phẩm:', err);
      }
    });
  }

  getInventoryData(warehouseCode: string, productGroupId: number): void {
    this.lblStatus = `Đang tải dữ liệu cho kho [${warehouseCode}]...`;
    this.isLoadingInventory = true;

    this.inventoryService.getInventory(false, '', warehouseCode, false, productGroupId).subscribe({
      next: (res) => {
        this.isLoadingInventory = false;
        if (res?.data) {
          const items = Array.isArray(res.data) ? res.data : [];
          this.fullInventory = items.map((item: any) => ({
            id: item.ProductSaleID || 0,
            productCode: item.ProductCode || item.productCode || '',
            productName: item.ProductName || item.productName || '',
            productNewCode: item.ProductNewCode || item.productNewCode || '',
            totalQuantityLast: item.TotalQuantityLast !== undefined ? item.TotalQuantityLast : 0,
            displayText: `[${item.ProductCode || item.productCode}] ${item.ProductName || item.productName} (Tồn: ${item.TotalQuantityLast !== undefined ? item.TotalQuantityLast : 0})`
          }));
          this.firstExport = 0;
          this.firstImport = 0;
          this.filterExportList();
          this.filterImportList();
          this.lblStatus = `Đã tải ${this.fullInventory.length} sản phẩm.`;
        } else {
          this.fullInventory = [];
          this.firstExport = 0;
          this.firstImport = 0;
          this.filterExportList();
          this.filterImportList();
          this.lblStatus = 'Không có sản phẩm nào.';
        }
      },
      error: (err: any) => {
        this.isLoadingInventory = false;
        console.error('Lỗi khi tải tồn kho:', err);
        this.lblStatus = 'Lỗi khi tải tồn kho.';
      }
    });
  }

  saveStandardization(payload: any): void {
    this.productsaleService.saveDataProductSaleImportExport(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.lblStatus = 'Sẵn sàng';
        if (res?.status === 1 || res?.success) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Tạo phiếu chuẩn hóa thành công!');
          this.resetForm();
          const whCode = this.mainForm.get('warehouseCode')?.value;
          const pgId = this.mainForm.get('productGroupId')?.value;
          if (whCode && pgId) {
            this.getInventoryData(whCode, pgId);
          }
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Có lỗi xảy ra khi tạo phiếu!');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.lblStatus = 'Sẵn sàng';
        console.error('Lỗi khi lưu phiếu chuẩn hóa:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message || err || 'Không thể kết nối đến máy chủ!');
      }
    });
  }
  // #endregion

  // #region Form Event Handlers
  onWarehouseChange(event: any): void {
    const selectedWh = event.value;
    if (selectedWh) {
      const wh = this.warehouses.find(w => w.warehouseCode === selectedWh);
      if (wh) {
        this.getProductGroupsByWarehouse(wh.id);
      }

      this.mainForm.patchValue({ productGroupId: null });
      this.fullInventory = [];
      this.filteredExportProducts = [];
      this.filteredImportProducts = [];
      this.firstExport = 0;
      this.firstImport = 0;
      this.standardizationRows = [];
      this.selectedRowIndex = null;
    }
  }

  onProductGroupChange(event: any): void {
    const pgId = event.value;
    debugger;
    const whCode = this.mainForm.get('warehouseCode')?.value;

    if (pgId && whCode) {
      this.standardizationRows = [];
      this.selectedRowIndex = null;

      const selectedPg = this.productGroups.find(g => g.id === pgId);

      if (selectedPg && selectedPg.employeeId) {
        const targetEmp = this.employees.find(emp => emp.id === selectedPg.employeeId || emp.userId === selectedPg.employeeId);
        if (targetEmp && targetEmp.userId) {
          this.mainForm.patchValue({
            deliverImportId: targetEmp.userId,
            reciverImportId: targetEmp.userId,
            senderExportId: targetEmp.userId,
            reciverExportId: targetEmp.userId
          });
          this.lblStatus = `Đã tự động gán nhân viên: ${targetEmp.fullName}`;
        }
      }

      this.getInventoryData(whCode, pgId);
    }
  }

  onExportSearch(): void {
    this.firstExport = 0;
    this.filterExportList();
  }

  onImportSearch(): void {
    this.firstImport = 0;
    this.filterImportList();
  }

  private filterExportList(): void {
    const query = (this.searchExportQuery || '').toLowerCase().trim();
    const availableInventory = this.fullInventory.filter(i => i.totalQuantityLast > 0);
    if (!query) {
      this.filteredExportProducts = availableInventory;
    } else {
      this.filteredExportProducts = availableInventory.filter(i =>
        (i.productCode || '').toString().toLowerCase().includes(query) ||
        (i.productName || '').toString().toLowerCase().includes(query) ||
        (i.productNewCode || '').toString().toLowerCase().includes(query)
      );
    }
  }

  private filterImportList(): void {
    const query = (this.searchImportQuery || '').toLowerCase().trim();
    if (!query) {
      this.filteredImportProducts = [...this.fullInventory];
    } else {
      this.filteredImportProducts = this.fullInventory.filter(i =>
        (i.productCode || '').toString().toLowerCase().includes(query) ||
        (i.productName || '').toString().toLowerCase().includes(query) ||
        (i.productNewCode || '').toString().toLowerCase().includes(query)
      );
    }
  }
  // #endregion

  // #region Double Click Product Handlers
  onExportProductSelect(item: InventoryItem): void {
    if (this.selectedRowIndex === null || this.selectedRowIndex < 0 || this.selectedRowIndex >= this.standardizationRows.length) {
      this.addNewRow();
      this.selectedRowIndex = this.standardizationRows.length - 1;
    }

    // Kiểm tra sản phẩm xuất trùng ở dòng khác
    const existingIndex = this.standardizationRows.findIndex((r, idx) =>
      idx !== this.selectedRowIndex && r.exportProductCode === item.productCode
    );
    if (existingIndex !== -1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Sản phẩm xuất [${item.productCode}] đã được chọn ở dòng số ${existingIndex + 1}!`
      );
      return;
    }

    const row = this.standardizationRows[this.selectedRowIndex];
    if (row.importProduct && row.importProduct.id === item.id) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Sản phẩm xuất không được trùng với sản phẩm nhập của cùng một dòng!`
      );
      return;
    }

    row.exportProduct = item;
    row.exportProductCode = item.productCode;
    row.exportProductName = item.productName;
    row.exportProductNewCode = item.productNewCode;
    row.exportStockQty = item.totalQuantityLast;
    row.quantity = item.totalQuantityLast; // Mặc định xuất hết

    // Trigger change detection / refresh grid data
    this.standardizationRows = [...this.standardizationRows];
  }

  onImportProductSelect(item: InventoryItem): void {
    if (this.selectedRowIndex === null || this.selectedRowIndex < 0 || this.selectedRowIndex >= this.standardizationRows.length) {
      this.addNewRow();
      this.selectedRowIndex = this.standardizationRows.length - 1;
    }

    const row = this.standardizationRows[this.selectedRowIndex];
    if (row.exportProduct && row.exportProduct.id === item.id) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Sản phẩm nhập không được trùng với sản phẩm xuất của cùng một dòng!`
      );
      return;
    }

    row.importProduct = item;
    row.importProductCode = item.productCode;
    row.importProductName = item.productName;
    row.importProductNewCode = item.productNewCode;

    // Trigger change detection / refresh grid data
    this.standardizationRows = [...this.standardizationRows];
  }
  // #endregion

  // #region Grid Operations
  addNewRow(): void {
    const nextStt = this.standardizationRows.length + 1;
    const newRow: StandardizationRow = {
      stt: nextStt,
      exportProduct: null,
      importProduct: null,
      quantity: 0,
      note: ''
    };
    this.standardizationRows = [...this.standardizationRows, newRow];
    this.selectedRowIndex = this.standardizationRows.length - 1;
  }

  removeRow(index: number): void {
    this.standardizationRows = this.standardizationRows.filter((_, i) => i !== index);
    // Cập nhật lại số thứ tự (STT)
    this.standardizationRows.forEach((row, i) => {
      row.stt = i + 1;
    });
    this.standardizationRows = [...this.standardizationRows];

    if (this.selectedRowIndex === index) {
      this.selectedRowIndex = null;
    } else if (this.selectedRowIndex !== null && this.selectedRowIndex > index) {
      this.selectedRowIndex--;
    }
  }

  selectGridRow(index: number): void {
    this.selectedRowIndex = index;
  }
  // #endregion

  // #region Save & Reset Business Logic
  resetForm(): void {
    this.standardizationRows = [];
    this.selectedRowIndex = null;
    this.searchExportQuery = '';
    this.searchImportQuery = '';
    this.firstExport = 0;
    this.firstImport = 0;
    this.filterExportList();
    this.filterImportList();
    this.lblStatus = 'Đã làm mới.';
  }

  saveForm(): void {
    if (this.mainForm.invalid) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const formVal = this.mainForm.getRawValue();

    if (this.standardizationRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Danh sách sản phẩm chuẩn hóa trống!');
      return;
    }

    // Kiểm tra tính hợp lệ từng dòng
    for (let i = 0; i < this.standardizationRows.length; i++) {
      const row = this.standardizationRows[i];
      if (!row.exportProduct || !row.importProduct || row.quantity <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn đủ sản phẩm xuất/nhập và số lượng chuyển > 0 cho tất cả các dòng (Lỗi tại dòng số ${i + 1})!`);
        return;
      }
      if (row.exportProduct.id === row.importProduct.id) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Sản phẩm xuất và sản phẩm nhập phải khác nhau (Lỗi tại dòng số ${i + 1})!`);
        return;
      }
      if (row.exportStockQty !== undefined && row.quantity > row.exportStockQty) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Số lượng chuyển không được lớn hơn số lượng tồn xuất (Lỗi tại dòng số ${i + 1})!`);
        return;
      }
    }

    // Hỏi xác nhận lưu
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn tạo phiếu chuẩn hóa cho ${this.standardizationRows.length} dòng này không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isSaving = true;
        this.lblStatus = 'Đang xử lý tạo phiếu...';

        // Tạo payload map tương tự C#
        const selectedWarehouse = this.warehouses.find(w => w.warehouseCode === formVal.warehouseCode);
        const selectedProductGroup = this.productGroups.find(pg => pg.id === formVal.productGroupId);

        const payload = {
          WarehouseId: selectedWarehouse?.id ?? 0,
          Date: formVal.date,
          RequestDate: formVal.requestDate,
          UserId: this.userservice.id ?? 0,
          Note: formVal.note,
          ProductGroupId: formVal.productGroupId ?? 0,
          CustomerId: formVal.customerId ?? 0,
          SupplierId: formVal.supplierId ?? 0,
          RulePayId: formVal.rulePayId ?? 0,
          SenderExportId: formVal.senderExportId ?? 0,
          ReciverExportId: formVal.reciverExportId ?? 0,
          DeliverImportId: formVal.deliverImportId ?? 0,
          ReciverImportId: formVal.reciverImportId ?? 0,
          SenderExportText: this.employees.find(e => e.userId === formVal.senderExportId)?.fullName || '',
          ReciverExportText: this.employees.find(e => e.userId === formVal.reciverExportId)?.fullName || '',
          DeliverImportText: this.employees.find(e => e.userId === formVal.deliverImportId)?.fullName || '',
          ReciverImportText: this.employees.find(e => e.userId === formVal.reciverImportId)?.fullName || '',
          ProductGroupText: selectedProductGroup ? selectedProductGroup.name : '',
          DataDetails: this.standardizationRows.map(r => ({
            Stt: r.stt,
            ExportProductId: r.exportProduct?.id,
            ExportProductNewCode: r.exportProductNewCode,
            ExportProductCode: r.exportProductCode,
            ExportProductName: r.exportProductName,
            ExportStockQty: r.exportStockQty,
            ImportProductId: r.importProduct?.id,
            ImportProductNewCode: r.importProductNewCode,
            ImportProductCode: r.importProductCode,
            ImportProductName: r.importProductName,
            Quantity: r.quantity,
            Note: r.note
          }))
        };

        this.saveStandardization(payload);
      }
    });
  }
  // #endregion

  isExportSelectedInActiveRow(item: InventoryItem): boolean {
    if (this.selectedRowIndex === null || !this.standardizationRows[this.selectedRowIndex]) {
      return false;
    }
    const activeRow = this.standardizationRows[this.selectedRowIndex];
    return activeRow.exportProductCode === item.productCode;
  }

  isImportSelectedInActiveRow(item: InventoryItem): boolean {
    if (this.selectedRowIndex === null || !this.standardizationRows[this.selectedRowIndex]) {
      return false;
    }
    const activeRow = this.standardizationRows[this.selectedRowIndex];
    return activeRow.importProductCode === item.productCode;
  }

  isRowInvalid(row: StandardizationRow): boolean {
    if (!row.exportProduct || !row.importProduct) {
      return true;
    }
    return row.exportProduct.id === row.importProduct.id;
  }

  historyImportExport() {
    this.modal.create({
      nzTitle: undefined,
      nzContent: ProductSaleImportExportLogComponent,
      nzWidth: 1200,
      nzFooter: null,
      nzClosable: false,
      nzMaskClosable: false
    });
  }
}
