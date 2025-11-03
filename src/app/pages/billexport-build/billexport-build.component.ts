import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Tabulator, ColumnDefinition } from 'tabulator-tables';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { Subject, takeUntil } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../old/project/project-service/project.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';

interface SupplierSale {
  ID: number;
  CodeNCC: string;
  NameNCC: string;
}

interface Customer {
  ID: number;
  CustomerName: string;
  CustomerShortName: string;
}

interface Receiver {
  ID: number;
  LoginName: string;
  FullName: string;
}

interface Product {
  ID: string;
  ProductID: number;
  ProductCodeRTC: string;
  ProductName: string;
  UnitName: string;
  Quantity: number;
  Maker: string;
  Note: string;
}

@Component({
  selector: 'app-billexport-build',
  templateUrl: './billexport-build.component.html',
  styleUrls: ['./billexport-build.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzDividerModule,
    NzIconModule,
    NzDatePickerModule
  ]
})
export class BillexportBuildComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() billData: any = null;
  @Output() saved = new EventEmitter<{ mode: 'add' | 'edit'; data: any }>();
  @Output() cancelled = new EventEmitter<void>();
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  // Data lists
  supplierList: SupplierSale[] = [];
  customerList: Customer[] = [];
  receiverList: Receiver[] = [];
  loaiPhieuList = ['Trả', 'Cho mượn', 'Tặng / Bán', 'Mất', 'Bảo hành', 'Xuất dự án', 'Hỏng', 'Xuất kho'];

  // Table management
  productExportTable: Tabulator | null = null;
  productExportData: Product[] = [];
  productData: any[] = [];

  warehouseID: number = 2;

  // Loading states
  isLoading = false;
  isGeneratingCode = false;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    @Optional() public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    @Optional() private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();

    if (this.mode === 'edit' && this.billData) {
      this.patchFormData();
    } else {
      // Set default bill type for new bills
      this.form.get('BillType')?.setValue('Xuất kho');
      this.generateBillCode();
    }
  }

  ngAfterViewInit(): void {
    // Load product master list
    this.projectService.getAllProduct().subscribe({
      next: (res) => {
        this.productData = Array.isArray(res.data)
          ? res.data.map((p: any) => ({
            ...p,
            UnitName: p.UnitCountName || p.UnitName || ''
          }))
          : [];
        console.log('Dữ liệu sản phẩm tải về:', res);
        console.log('Danh sách sản phẩm:', this.productData);

        // Initialize table after getting product data
        this.initProductTable();
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        this.productData = [];
        this.initProductTable();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelled.complete();

  }

  initForm(): void {
    this.form = this.fb.group({
      Code: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
      BillType: ['', Validators.required],
      NameNCC: [''],
      Receiver: [''],
      WarehouseType: ['Đồ phòng sạch'],
      ProjectName: [''],
      CustomerName: [''],
      CreatedDate: [new Date()],
    });

    // Listen for BillType changes to generate code
    this.form.get('BillType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && this.mode === 'add') {
          this.generateBillCode();
        }
      });
  }

  patchFormData(): void {
    if (!this.billData) return;

    this.form.patchValue({
      Code: this.billData.Code,
      BillType: this.getLoaiPhieuText(this.billData.BillType),
      NameNCC: this.billData.NameNCC,
      Receiver: this.billData.Receiver,
      ProjectName: this.billData.ProjectName,
      CustomerName: this.billData.CustomerName,
      CreatedDate: this.billData.CreatedDate ? new Date(this.billData.CreatedDate) : new Date(),
    });

    if (this.billData.products) {
      this.productExportData = [...this.billData.products];
    }
  }

  generateBillCode(): void {
    const billType = this.form.get('BillType')?.value;
    if (!billType) return;

    const billTypeNumber = this.convertLoaiPhieuToType(billType);
    if (!billTypeNumber) return;

    this.isGeneratingCode = true;
    this.projectService.getBillCode(billTypeNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.status === 1 && res.data) {
            this.form.get('Code')?.setValue(res.data);
          } else {
            this.message.error('Không thể tạo mã phiếu tự động');
          }
          this.isGeneratingCode = false;
        },
        error: (err) => {
          console.error('Lỗi khi tạo mã phiếu:', err);
          this.message.error('Không thể tạo mã phiếu tự động');
          this.isGeneratingCode = false;
        }
      });
  }

  getLoaiPhieuText(billType: number): string {
    const mapping: Record<number, string> = {
      1: 'Trả',
      2: 'Cho mượn',
      3: 'Tặng / Bán',
      4: 'Mất',
      5: 'Bảo hành',
      6: 'Xuất dự án',
      7: 'Hỏng',
      8: 'Xuất kho'
    };
    return mapping[billType] || '';
  }

  loadDropdownData(): void {
    forkJoin({
      suppliers: this.projectService.getSupplierSale(),
      customers: this.projectService.getCustomer(),
      receivers: this.projectService.getReceiver()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.supplierList = Array.isArray(results.suppliers.data) ? results.suppliers.data : results.suppliers;
          this.customerList = Array.isArray(results.customers.data) ? results.customers.data : results.customers;
          this.receiverList = Array.isArray(results.receivers.data) ? results.receivers.data : results.receivers;

        },
        error: (err) => {
          console.error('Lỗi khi load dữ liệu dropdown:', err);
          this.message.error('Không thể tải dữ liệu danh sách');
        }
      });
  }

  initProductTable(): void {
    const tableElement = document.getElementById('productExportTable');
    if (!tableElement) return;

    if (this.productExportTable) {
      this.productExportTable.destroy();
      this.productExportTable = null;
    }

    let initialData: Product[] = [];

    if (this.mode === 'edit' && this.billData) {
      // Load product details for edit mode
      this.projectService.getBillById(this.billData.ID.toString()).subscribe({
        next: (res: any) => {
          const initialData = res?.data?.billDetail || [];
          this.createTabulatorTable(tableElement, initialData);
        },
        error: (err) => {
          console.error('Lỗi khi load chi tiết phiếu:', err);
          this.createTabulatorTable(tableElement, []);
        }
      });
    } else {
      // Add mode - empty table
      this.createTabulatorTable(tableElement, []);
    }
  }

  private createTabulatorTable(tableElement: HTMLElement, initialData: Product[]) {
    const productSelectEditor = (cell: any, onRendered: any, success: any, cancel: any) => {
      const editor = document.createElement("select");
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Chọn sản phẩm";
      editor.appendChild(defaultOption);

      // Thêm các option sản phẩm
      this.productData.forEach(product => {
        const option = document.createElement("option");
        option.value = product.ID.toString();
        option.textContent = `${product.ProductName} (${product.ProductCodeRTC})`;
        option.dataset['product'] = JSON.stringify(product);
        editor.appendChild(option);
      });

      editor.value = cell.getValue() || "";

      onRendered(() => {
        editor.focus();
        editor.style.cssText = "width: 100%; padding: 5px;";
      });

      function onChange() {
        success(editor.value);
      }

      editor.addEventListener("change", onChange);
      editor.addEventListener("blur", onChange);

      return editor;
    };

    const columns: ColumnDefinition[] = [
      {
        title: 'Mã sản phẩm',
        field: 'ProductID',
        editor: productSelectEditor,
        cellEdited: (cell) => {
          const selectedId = Number(cell.getValue());
          const row = cell.getRow();
          const product = this.productData.find(p => p.ID === selectedId);
          if (product) {
            const currentData = row.getData();
            row.update({
              ...currentData,
              ProductID: product.ID,
              ProductRTCID: product.ProductRTCID,
              ProductCodeRTC: product.ProductCodeRTC,
              ProductName: product.ProductName,
              UnitName: product.UnitName,
              Maker: product.Maker
            });
          }
        }
      },
      { title: 'Mã nội bộ', field: 'ProductCodeRTC' },
      { title: 'Tên sản phẩm', field: 'ProductName' },
      { title: 'ĐVT', field: 'UnitName' },
      {
        title: 'Số lượng xuất',
        field: 'Quantity',
        editor: 'number',
        validator: ['required', 'numeric', 'min:1'] as any
      },
      { title: 'Hãng', field: 'Maker' },
      { title: 'Ghi chú', field: 'Note', editor: 'input', width: 120 },
      {
        title: '',
        formatter: () => '<button class="btn-remove">X</button>',
        width: 40,
        hozAlign: 'center',
        cellClick: (e, cell) => {
          e.stopPropagation();
          cell.getRow().delete();
        }
      }
    ];

    this.productExportTable = new Tabulator(tableElement, {
      height: '35vh',
      layout: 'fitDataStretch',
      locale: 'vi',
      selectableRows: true,
      columns: columns,
      data: initialData
    });
  }

  addProduct(): void {
    const newProduct: Product = {
      ID: '',
      ProductID: 0,
      ProductCodeRTC: '',
      ProductName: '',
      UnitName: '',
      Quantity: 1,
      Maker: '',
      Note: ''
    };

    this.productExportTable?.addRow(newProduct, true).then(row => {
      const cell = row.getCell('ProductID');
      if (cell) {
        cell.edit(true);
      }
    });
  }

  validateForm(): boolean {
    if (this.form.invalid) {
      this.message.error('Vui lòng kiểm tra lại thông tin bắt buộc');
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return false;
    }

    const productData = this.productExportTable?.getData() as Product[] || [];
    if (productData.length === 0) {
      this.message.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    const invalidProducts = productData.some(
      p => !p.ProductID || p.ProductID === 0 || !p.Quantity || p.Quantity <= 0
    );

    if (invalidProducts) {
      this.message.error('Vui lòng kiểm tra thông tin sản phẩm');
      return false;
    }

    return true;
  }

  cancel(): void {
    if (this.form.dirty || (this.productExportTable && this.productExportTable.getDataCount() > 0)) {
      if (this.modal) {
        this.modal.confirm({
          nzTitle: 'Bạn có chắc muốn hủy?',
          nzContent: 'Dữ liệu chưa lưu sẽ bị mất!',
          nzOnOk: () => this.closeModal()
        });
      } else {
        // Nếu không có modal service, trực tiếp đóng
        this.closeModal();
      }
    } else {
      this.closeModal();
    }
  }

  private closeModal(): void {
    this.form.reset();
    if (this.productExportTable) {
      this.productExportTable.clearData();
    }
    this.cancelled.next();
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  private convertLoaiPhieuToType(billTypeText: string): number {
    const mapping: Record<string, number> = {
      'Trả': 1,
      'Cho mượn': 2,
      'Tặng / Bán': 3,
      'Mất': 4,
      'Bảo hành': 5,
      'Xuất dự án': 6,
      'Hỏng': 7,
      'Xuất kho': 8
    };
    return mapping[billTypeText] || 0;
  }
  onBillTypeChange(value: string): void {
    if (value && this.mode === 'add') {
      this.generateBillCode();
    }
  }

  onSaveBill(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;

    const billExportTechnical = {
      ID: this.mode === 'edit' ? this.billData.ID : 0,
      Code: this.form.value.Code,
      BillType: this.convertLoaiPhieuToType(this.form.value.BillType),
      CustomerName: this.form.value.CustomerName || '',
      ProjectName: this.form.value.ProjectName || '',
      Receiver: this.form.value.Receiver || '',
      SupplierName: this.form.value.NameNCC || '',
      WarehouseID: this.warehouseID,
      WarehouseType: this.form.value.WarehouseType,
      CreatedDate: new Date().toISOString(),
      UpdatedDate: new Date().toISOString(),
    };

    const productList: Product[] = this.productExportTable?.getData() || [];

    const billExportDetailTechnicals = productList.map((p, index) => ({
      ID: p.ID || 0,
      BillExportTechID: billExportTechnical.ID,
      ProductID: p.ProductID,
      Quantity: Number(p.Quantity),
      UnitName: p.UnitName,
      Note: p.Note,
      WarehouseID: this.warehouseID,
      CreatedDate: new Date().toISOString(),
      UpdatedDate: new Date().toISOString()
    }));

    const payload = {
      billExportTechnical,
      billExportDetailTechnicals,
      billExportTechDetailSerials: [],
      billExportTechnicalLog: [],
      inentoryDemos: [],
      historyDeleteBill: null,
      historyProductRTCs: []
    };

    this.projectService.saveOrUpdateBillExpost(payload).subscribe({
      next: (res: any) => {
        if (res.status !== 1) {
          this.message?.error(res.message || 'Lưu phiếu thất bại.');
          this.isLoading = false;
          return;
        }

        // Phát sự kiện với dữ liệu đầy đủ từ server
        this.saved.emit({
          mode: this.mode,
          data: res.data || res.billExportTechnical || billExportTechnical
        });

        this.message?.success('Lưu phiếu thành công');
        this.isLoading = false;

        // Tự động đóng modal sau khi lưu thành công (nếu đang ở trong modal)
        if (this.activeModal) {
          this.activeModal.close();
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu phiếu:', err);
        this.message?.error('Không thể lưu phiếu.');
        this.isLoading = false;
      }
    });
  }
}