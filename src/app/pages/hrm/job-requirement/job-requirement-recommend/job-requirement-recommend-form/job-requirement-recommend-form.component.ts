import { Component, OnInit, Input, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TooltipModule } from 'primeng/tooltip';

import { JobRequirementRecommendService } from '../job-requirement-recommend-service/job-requirement-recommend.service';
import { RecommendSupplierService } from '../../recommend-supplier/recommend-supplier-service/recommend-supplier.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AuthService } from '../../../../../auth/auth.service';

interface SupplierRecommendRow {
  ID: number;
  Supplier: string;
  Contact: string;
  UnitPrice: number;
  TotalAmount: number;
  Note: string;
  IsApproved: number;
}

interface ProductRecommendRow {
  rowID: number;
  ProductName: string;
  Suppliers: SupplierRecommendRow[];
}

@Component({
  selector: 'app-job-requirement-recommend-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzIconModule,
    NzButtonModule,
    NzSplitterModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSpinModule,
    TableModule,
    AutoCompleteModule,
    InputNumberModule,
    NzSelectModule,
    TooltipModule
  ],
  templateUrl: './job-requirement-recommend-form.component.html',
  styleUrls: ['./job-requirement-recommend-form.component.css']
})
export class JobRequirementRecommendFormComponent implements OnInit {
  @Input() jobRequirementID: number = 0;
  @Input() dataInput: any;
  @Input() isEditMode: boolean = false;

  private service = inject(JobRequirementRecommendService);
  private recommendSupplierService = inject(RecommendSupplierService);
  private notification = inject(NzNotificationService);
  private activeModal = inject(NgbActiveModal);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  currentUser: any = null;
  jobRequirementData: any = {};
  recommendationData: ProductRecommendRow[] = [];
  flatRecommendationDetails: any[] = [];
  deletedDetailIDs: number[] = [];
  initialRequirementID: number = 0;
  private productRowIdCounter = 0;

  // Job Requirement Selection
  jobRequirements: any[] = [];
  selectedJobReq: any = null;

  // Historical data for autocomplete
  historicalSuppliers: any[] = [];
  historicalProductNames: any[] = [];
  filteredSuppliers: any[] = [];
  filteredProductNames: any[] = [];
  filteredUnitPrices: any[] = [];

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.initialRequirementID = this.jobRequirementID;
    this.loadJobRequirements();
    this.loadHistoricalData();

    if (this.jobRequirementID) {
      this.loadJobRequirement(this.jobRequirementID);
    } else {
      this.addNewProductRow();
    }

    if (this.isEditMode && this.dataInput) {
      this.loadRecommendation(this.dataInput.master.ID);
    }
  }

  loadJobRequirements(): void {
    // Current date range for fetching job requirements
    const dateStart = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const dateEnd = new Date();

    this.recommendSupplierService.getJobrequirement(0, 0, 0, 0, '', dateStart, dateEnd).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.jobRequirements = res.data || [];
        }
      }
    });
  }

  loadHistoricalData(): void {
    this.service.getHistoricalSuppliers().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.historicalData = res.data || [];
        }
      }
    });
  }

  onJobReqSelect(value: any): void {
    if (value) {
      this.jobRequirementID = value.ID;
      // Clear data to allow fresh fill
      this.recommendationData = [];
      this.flatRecommendationDetails = [];
      this.loadJobRequirement(this.jobRequirementID);
    }
  }

  loadJobRequirement(id: number): void {
    this.isLoading = true;
    this.service.initRecommend(id).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.jobRequirementData = res.data?.master || {};
          this.historicalData = res.data?.historicalData || [];

          if (!this.isEditMode || this.jobRequirementID !== this.initialRequirementID) {
            const initialDetails = res.data?.initialDetails || [];
            if (initialDetails.length > 0) {
              setTimeout(() => {
                this.groupDetailsByProduct(initialDetails);
                this.cdr.detectChanges();
              }, 100); // 100ms delay to ensure DOM is ready for nzAutosize
            } else if (this.recommendationData.length === 0) {
              this.addNewProductRow();
            }
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải thông tin: ' + (err?.error?.message || err.message));
      }
    });
  }

  loadRecommendation(id: number): void {
    this.isLoading = true;
    this.service.getByID(id).subscribe({
      next: (res) => {
        if (res.status === 1) {
          const details = res.data?.details || [];
          this.recommendationData = this.groupDetailsByProduct(details);
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  private groupDetailsByProduct(details: any[]): ProductRecommendRow[] {
    const productMap = new Map<string, SupplierRecommendRow[]>();
    this.productRowIdCounter = 0;

    details.forEach(d => {
      const productName = d.ProductName || '';
      if (!productMap.has(productName)) {
        productMap.set(productName, []);
      }
      productMap.get(productName)!.push({
        ID: d.ID || 0,
        Supplier: d.Supplier || '',
        Contact: d.Contact || '',
        UnitPrice: d.UnitPrice || 0,
        TotalAmount: d.TotalAmount || 0,
        Note: d.Note || '',
        IsApproved: d.IsApproved || 0
      });
    });

    this.recommendationData = Array.from(productMap.entries()).map(([productName, suppliers]) => ({
      rowID: ++this.productRowIdCounter,
      ProductName: productName,
      Suppliers: suppliers
    }));

    this.flattenData();
    return this.recommendationData;
  }

  public flattenData(): void {
    const flat: any[] = [];
    this.recommendationData.forEach(p => {
      p.Suppliers.forEach((s, index) => {
        flat.push({
          supplierRef: s,
          originalProduct: p,
          productRowID: p.rowID,
          rowspan: index === 0 ? p.Suppliers.length : 0,
          supplierIndex: index
        });
      });
    });
    this.flatRecommendationDetails = flat;
  }

  trackByProductSupplier(index: number, item: any): string {
    return `${item.productRowID}-${item.supplierIndex}`;
  }

  historicalData: any[] = [];
  filteredHistoricalData: any[] = [];

  onSupplierInput(value: string): void {
    this.filteredSuppliers = Array.from(new Set(this.historicalData
      .filter(h => h.Supplier?.toLowerCase().includes(value.toLowerCase()))
      .map(h => h.Supplier)));
  }

  onProductNameInput(value: string): void {
    const valStr = (value || '').toLowerCase();
    this.filteredProductNames = Array.from(new Set(this.historicalData
      .filter(h => h.ProductName?.toLowerCase().includes(valStr))
      .map(h => h.ProductName)));
  }

  onUnitPriceInput(event: any): void {
    const value = event.filter || '';
    const valStr = value.toString().replace(/[^0-9]/g, '');
    if (!valStr) {
      this.filteredUnitPrices = [];
      return;
    }

    this.filteredUnitPrices = Array.from(new Set(this.historicalData
      .filter(h => h.UnitPrice != null && h.UnitPrice.toString().includes(valStr))
      .map(h => h.UnitPrice)));
  }

  onSelectHistoricalSupplier(supplierName: string, product: ProductRecommendRow, supplier: SupplierRecommendRow): void {
    const historical = this.historicalData.find(h => h.Supplier === supplierName);
    if (historical) {
      supplier.Contact = historical.Contact;
      supplier.UnitPrice = historical.UnitPrice;
      if (historical.ProductName && !product.ProductName) {
        product.ProductName = historical.ProductName;
      }
      this.calculateTotal(supplier);
    }
  }

  onSelectHistoricalProduct(productName: string, product: ProductRecommendRow, supplier: SupplierRecommendRow): void {
    const historical = this.historicalData.find(h => h.ProductName === productName);
    if (historical) {
      product.ProductName = historical.ProductName;
      if (!supplier.Supplier) {
        supplier.Supplier = historical.Supplier;
        supplier.Contact = historical.Contact;
        supplier.UnitPrice = historical.UnitPrice;
        this.calculateTotal(supplier);
      }
    }
  }

  addNewProductRow(): void {
    this.recommendationData = [
      ...this.recommendationData,
      {
        rowID: ++this.productRowIdCounter,
        ProductName: '',
        Suppliers: [this.createEmptySupplier()]
      }
    ];
    this.flattenData();
  }

  addSupplierRow(rowID: number): void {
    const product = this.recommendationData.find(p => p.rowID === rowID);
    if (product) {
      product.Suppliers.push(this.createEmptySupplier());
      this.flattenData();
    }
  }

  private createEmptySupplier(): SupplierRecommendRow {
    return {
      ID: 0,
      Supplier: '',
      Contact: '',
      UnitPrice: 0,
      TotalAmount: 0,
      Note: '',
      IsApproved: 0
    };
  }

  removeProductRow(rowID: number): void {
    const product = this.recommendationData.find(p => p.rowID === rowID);
    if (product) {
      product.Suppliers.forEach(s => {
        if (s.ID > 0) this.deletedDetailIDs.push(s.ID);
      });
      this.recommendationData = this.recommendationData.filter(p => p.rowID !== rowID);
      if (this.recommendationData.length === 0) {
        this.addNewProductRow();
      } else {
        this.flattenData();
      }
    }
  }

  removeSupplierRow(rowID: number, supplierIndex: number): void {
    const product = this.recommendationData.find(p => p.rowID === rowID);
    if (product) {
      const supplier = product.Suppliers[supplierIndex];
      if (supplier.ID > 0) {
        this.deletedDetailIDs.push(supplier.ID);
      }

      if (product.Suppliers.length === 1) {
        product.Suppliers[0] = this.createEmptySupplier();
      } else {
        product.Suppliers.splice(supplierIndex, 1);
      }
      this.flattenData();
    }
  }

  calculateTotal(item: any): void {
    const quantityStr = this.jobRequirementData.Quantity || '0';
    const quantity = parseFloat(quantityStr.replace(/[^0-9.]/g, '')) || 0;
    item.TotalAmount = (item.UnitPrice || 0) * quantity;
  }

  recalculateAllTotals(): void {
    this.recommendationData.forEach(p => {
      p.Suppliers.forEach(s => this.calculateTotal(s));
    });
  }

  saveData(): void {
    const flatDetails: any[] = [];
    this.recommendationData.forEach(p => {
      p.Suppliers.forEach(s => {
        if (p.ProductName && s.Supplier) {
          flatDetails.push({
            ...s,
            ProductName: p.ProductName,
            JobRequirementRecommendID: this.isEditMode ? this.dataInput.master.ID : 0
          });
        }
      });
    });

    if (flatDetails.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng nhập ít nhất một phương án đề xuất (Tên sản phẩm và Nhà cung cấp)');
      return;
    }

    const payload = {
      Master: {
        ID: this.isEditMode ? this.dataInput.master.ID : 0,
        JobRequirementID: this.jobRequirementID,
        RequesterID: this.currentUser?.EmployeeID || 0,
        RequestDate: new Date(),
        IsDeleted: false
      },
      Details: flatDetails,
      DeletedDetailIDs: this.deletedDetailIDs
    };

    this.service.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, this.isEditMode ? 'Cập nhật thành công' : 'Thêm mới thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lỗi khi lưu dữ liệu');
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ');
      }
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}
