import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';


import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../app.config';

interface SupplierProposalRow {
  ID?: number;
  STT?: number;
  JobRequirementID?: number;
  DepartmentRequiredID?: number;
  Supplier: string;
  Contact: string;
  UnitPrice: string | number;
  TotalAmount: string | number;
  Note: string;
}

interface ProductProposalRow {
  rowID: number;
  ProductName: string;
  Suppliers: SupplierProposalRow[];
}

interface ValidationError {
  productId: number;
  supplierIndex: number;
  field: string;
  message: string;
}

@Component({
  selector: 'app-recommend-supplier-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    NzSplitterModule,
    NzCheckboxModule,

  ],
  standalone: true,
  templateUrl: './recommend-supplier-form.component.html',
  styleUrl: './recommend-supplier-form.component.css',
})
export class RecommendSupplierFormComponent implements OnInit, AfterViewInit {
  @ViewChild('DepartmentRequiredTable') tableRef1!: ElementRef;
  @ViewChild('DepartmentApprovedTable') tableRef3!: ElementRef;


  @Input() JobrequirementID: number = 0;
  @Input() dataInput: any;
  @Input() isCheckmode: boolean = false;
  DeletedCommend: any[] = [];

  DepartmentRequiredData: any[] = [];
  DepartmentRequiredTable: Tabulator | null = null;

  HCNSApprovalData: ProductProposalRow[] = [];
  private productRowIdCounter = 0;
  private hasHydratedHCNSData = false;
  validationErrors: Map<string, ValidationError> = new Map();

  DepartmentApprovedData: any[] = [];
  DepartmentApprovedTable: Tabulator | null = null;

  DepartmentID: number = 0;
  EmployeeID: number = 0;
  Step: number = 0;
  ApprovedTBPID: number = 0;
  Request: string = '';
  Keyword: string = '';
  DateStart: Date = new Date();
  DateEnd: Date = new Date();
  DepartmentRequiredID: number = 0;

  ngOnInit(): void {
    if (this.JobrequirementID) {
      if (this.isCheckmode) {
        this.loadDepartmentRequiredData(this.JobrequirementID);
      } else {
        this.loadJobRequirementDetail(this.JobrequirementID);
      }
    }
  }

  ngAfterViewInit(): void {
    this.draw_DepartmentRequiredTable();
    this.ensureHCNSDataHydrated();
  }

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private jobRequirementService: JobRequirementService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {
  }

  private hydrateSupplierRow(supplier?: SupplierProposalRow): SupplierProposalRow {
    const departmentRequiredID = supplier?.DepartmentRequiredID
      || (this.DepartmentRequiredData && this.DepartmentRequiredData.length > 0
        ? (this.DepartmentRequiredData[0].ID || this.DepartmentRequiredData[0].DepartmentRequiredID || 0)
        : 0);

    return {
      ID: supplier?.ID,
      STT: supplier?.STT,
      JobRequirementID: supplier?.JobRequirementID || this.JobrequirementID || 0,
      DepartmentRequiredID: departmentRequiredID,
      Supplier: supplier?.Supplier || '',
      Contact: supplier?.Contact || '',
      UnitPrice: supplier && supplier.UnitPrice !== undefined ? supplier.UnitPrice : '',
      TotalAmount: supplier && supplier.TotalAmount !== undefined ? supplier.TotalAmount : '',
      Note: supplier?.Note || '',
    };
  }

  private hydrateProductRow(product?: ProductProposalRow): ProductProposalRow {
    const rowId = product && typeof product.rowID === 'number'
      ? product.rowID
      : ++this.productRowIdCounter;

    if (rowId > this.productRowIdCounter) {
      this.productRowIdCounter = rowId;
    }

    const suppliers = product?.Suppliers && product.Suppliers.length
      ? product.Suppliers.map((supplier) => this.hydrateSupplierRow(supplier))
      : [this.hydrateSupplierRow()];

    return {
      rowID: rowId,
      ProductName: product?.ProductName || '',
      Suppliers: suppliers,
    };
  }

  private ensureHCNSDataHydrated(): void {
    if (this.hasHydratedHCNSData) return;

    this.HCNSApprovalData = this.HCNSApprovalData && this.HCNSApprovalData.length
      ? this.HCNSApprovalData.map((product) => this.hydrateProductRow(product))
      : [];

    // Thêm 1 dòng mặc định nếu không có dữ liệu
    if (!this.HCNSApprovalData || this.HCNSApprovalData.length === 0) {
      this.addDefaultProductRow();
    }

    this.hasHydratedHCNSData = true;
  }

  private addDefaultProductRow(): void {
    if (!this.HCNSApprovalData || this.HCNSApprovalData.length === 0) {
      this.HCNSApprovalData = [this.hydrateProductRow()];
    }
  }

  closeModal() {
    this.activeModal.close(true);
  }

  loadJobRequirementDetail(JobrequirementID: number) {
    // Tạo 2 observable: master & detail
    const master$ = this.jobRequirementService.getJobrequirement(
      this.DepartmentID,
      this.EmployeeID,
      this.Step,
      this.ApprovedTBPID,
      this.Request,
      (this.DateStart = new Date(
        new Date().setFullYear(new Date().getFullYear() - 5)
      )),
      this.DateEnd
    );

    const detail$ =
      this.jobRequirementService.getJobrequirementbyID(JobrequirementID);

    forkJoin([master$, detail$]).subscribe({
      next: ([masterRes, detailRes]: any) => {
        const masterList = masterRes.data || [];
        const master =
          masterList.find((m: any) => m.ID === JobrequirementID) || {};
        const pivotRow = (detailRes.data?.detailsCategory || [])[0] || {};

        const combinedRecord = {
          ...master,
          JobRequirementID: pivotRow.JobRequirementID || master.ID || 0,
          RequestContent: pivotRow.RequestContent || '',
          RequestedBy: pivotRow.RequestedBy || '',
          Reason: pivotRow.Reason || '',
          Quantity: pivotRow.Quantity || '',
          Quality: pivotRow.Quality || '',
          Location: pivotRow.Location || '',
          DeadlineDate: pivotRow.DeadlineDate || '',
        };

        this.DepartmentRequiredData = [combinedRecord];

        if (this.DepartmentRequiredTable) {
          this.DepartmentRequiredTable.replaceData(this.DepartmentRequiredData);
        }
      },
      error: (err) => console.error(err),
    });
  }

  loadDepartmentRequiredData(JobrequirementID: number): void {
    this.jobRequirementService.getDepartmentRequired(
      this.JobrequirementID = JobrequirementID,
      this.EmployeeID,
      this.DepartmentID,
      this.Keyword, // Keyword
      (this.DateStart = new Date(
        new Date().setFullYear(new Date().getFullYear() - 5)
      )),
      this.DateEnd
    ).subscribe({
      next: (response: any) => {
        const departmentRequiredData = response.data?.departmentRequiredData || [];

        this.DepartmentRequiredData = Array.isArray(departmentRequiredData)
          ? departmentRequiredData
          : [departmentRequiredData];

        if (this.DepartmentRequiredTable) {
          this.DepartmentRequiredTable.replaceData(this.DepartmentRequiredData);
        }

        this.loadHCNSData(JobrequirementID);
      },
      error: (err) => {
        this.DepartmentRequiredData = [];
        if (this.DepartmentRequiredTable) {
          this.DepartmentRequiredTable.replaceData([]);
        }
      }
    });
  }

  loadHCNSData(JobrequirementID: number): void {
    this.jobRequirementService.getHCNSProposals(
      JobrequirementID,
      this.DepartmentRequiredID,
      this.DateStart,
      this.DateEnd
    ).subscribe({
      next: (response: any) => {
        this.loadHCNSDataFromDB(response);
      },
      error: (err) => {
        this.HCNSApprovalData = [];
        this.hasHydratedHCNSData = true;
        // Thêm 1 dòng mặc định khi có lỗi load dữ liệu
        this.addDefaultProductRow();
      }
    });
  }

  private loadHCNSDataFromDB(response: any): void {

    const hcnsProposals = response?.data?.HCNSProPosalData || [];

    if (!hcnsProposals || !hcnsProposals.length) {
      this.HCNSApprovalData = [];
      this.hasHydratedHCNSData = true;
      // Thêm 1 dòng mặc định nếu không có dữ liệu
      this.addDefaultProductRow();
      return;
    }

    this.hasHydratedHCNSData = false;
    this.productRowIdCounter = 0;

    const productMap = new Map<string, SupplierProposalRow[]>();

    hcnsProposals.forEach((row: any) => {
      const productName = row.ProductName || '';

      if (!productName) return;

      if (!productMap.has(productName)) {
        productMap.set(productName, []);
      }

      const supplier: SupplierProposalRow = {
        ID: row.ID || 0,
        STT: row.STT || 0,
        JobRequirementID: row.JobRequirementID || this.JobrequirementID || 0,
        DepartmentRequiredID: row.DepartmentRequiredID || 0,
        Supplier: row.Supplier || '',
        Contact: row.Contact || '',
        UnitPrice: row.UnitPrice || '',
        TotalAmount: row.TotalAmount || '',
        Note: row.Note || '',
      };

      productMap.get(productName)!.push(supplier);
    });

    this.HCNSApprovalData = Array.from(productMap.entries()).map(([productName, suppliers]) => {
      const product: ProductProposalRow = {
        rowID: ++this.productRowIdCounter,
        ProductName: productName,
        Suppliers: suppliers.map(s => this.hydrateSupplierRow(s)),
      };
      return product;
    });

    this.hasHydratedHCNSData = true;
  }

  saveData(): void {
    if (!this.validateHCNSData()) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng kiểm tra lại các trường bắt buộc trong bảng đề xuất'
      );
      return;
    }

    const hcnsPayload = this.buildHCNSPayload();

    if (this.isCheckmode == true) {
      // Update mode
      const payload = {
        JobRequirementID: this.JobrequirementID,
        DepartmentRequired: [
          ...(this.DepartmentRequiredTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            JobRequirementID: item.JobRequirementID || 0,
            RequesterID: item.RequesterID || 0,
            PositionID: item.PositionID || 0,
            DepartmentID: item.DepartmentID || 0,
            RequestDate: item.DateRequest || '',
            CompletionDate: item.DeadlineRequest || '',
            RequestContent: item.RequestContent || '',
            Unit: item.Unit || '',
            Reason: item.Reason || '',
            Description: item.Unit || '',
            Quantity: item.Quantity || '',
            Note: item.Note || '',
          })) || []),
        ],
        HCNSProposal: hcnsPayload,
        DeletedCommend: this.DeletedCommend,
      };
      this.jobRequirementService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể cập nhật !'
            );
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi cập nhật!');
        },
      });
    } else {
      // Insert mode
      const payload = {
        JobRequirementID: this.JobrequirementID,
        DepartmentRequired: [
          ...(this.DepartmentRequiredTable?.getData().map((item: any) => ({
            ID: 0,
            STT: item.STT || 0,
            JobRequirementID: item.JobRequirementID || 0,
            RequesterID: item.EmployeeID || 0,
            PositionID: item.ChucVuHDID || 0,
            DepartmentID: item.DepartmentID || 0,
            RequestDate: item.DateRequest || '',
            CompletionDate: item.DeadlineRequest || '',
            RequestContent: item.RequestContent || '',
            Unit: item.Unit || '',
            Reason: item.Reason || '',
            Description: item.Unit || '',
            Quantity: item.Quantity || '',
            Note: item.Note || '',
          })) || []),
        ],

        HCNSProposal: hcnsPayload,
        DeletedCommend: this.DeletedCommend,

      };

      this.jobRequirementService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể thêm mới biên bản họp!'
            );
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, err.message || 'Có lỗi xảy ra khi thêm mới!');
        },
      });
    }
  }

  draw_DepartmentRequiredTable() {
    if (this.DepartmentRequiredTable) {
      this.DepartmentRequiredTable.replaceData(this.DepartmentRequiredData);
    } else {
      this.DepartmentRequiredTable = new Tabulator(
        this.tableRef1.nativeElement,
        {
          data: this.DepartmentRequiredData,
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          layout: 'fitDataStretch',
          height: '100%',
          paginationMode: 'local',
          columns: [
            {
              title: 'STT',
              hozAlign: 'center',
              formatter: 'rownum',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'Người yêu cầu',
              field: 'EmployeeName',
              headerHozAlign: 'center',
              editor: 'input',
            },
            // {
            //   title: 'Vị trí',
            //   field: 'ChucVu',
            //   headerHozAlign: 'center',
            //   editor: 'input',
            // },
            {
              title: 'Bộ phận',
              field: 'EmployeeDepartment',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Ngày yêu cầu',
              field: 'DateRequest',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value
                  ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                  : '';
              },
            },
            {
              title: 'Nội dung yêu cầu',
              field: 'RequestContent',
              headerHozAlign: 'center',
              editor: 'textarea',
            },
            {
              title: 'Lý do yêu cầu',
              field: 'Reason',
              headerHozAlign: 'center',
              editor: 'textarea',
            },
            {
              title: 'Đơn vị tính',
              field: 'Unit',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Số lượng',
              field: 'Quantity',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Ngày yêu cầu hoàn thành',
              field: 'DeadlineRequest',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 200,
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value
                  ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                  : '';
              },
            },
            {
              title: 'Link/Mô tả chi tiết',
              field: 'Note',
              headerHozAlign: 'center',
              editor: 'textarea',
            },
          ],
        }
      );
    }
  }


  private getProductById(productId: number): ProductProposalRow | undefined {
    return this.HCNSApprovalData.find(p => p.rowID === productId);
  }

  addProductRow(): void {
    this.HCNSApprovalData = [...this.HCNSApprovalData, this.hydrateProductRow()];
    this.hasHydratedHCNSData = true;
  }

  addSupplierRow(productId: number): void {
    const product = this.getProductById(productId);
    if (!product) return;
    product.Suppliers = [...product.Suppliers, this.hydrateSupplierRow()];
  }

  private addToDeletedCommend(id: number): void {
    if (id && id > 0 && !this.DeletedCommend.includes(id)) {
      this.DeletedCommend.push(id);
    }
  }

  removeProductRow(productId: number): void {
    const product = this.getProductById(productId);
    if (!product) return;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa sản phẩm này không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (product.Suppliers && product.Suppliers.length > 0) {
          product.Suppliers.forEach((supplier) => {
            if (supplier.ID && supplier.ID > 0) {
              this.addToDeletedCommend(supplier.ID);
            }
          });
        }

        this.HCNSApprovalData = this.HCNSApprovalData.filter(p => p.rowID !== productId);
      },
    });
  }

  removeSupplierRow(productId: number, supplierIndex: number): void {
    const product = this.getProductById(productId);
    if (!product?.Suppliers[supplierIndex]) return;

    const supplier = product.Suppliers[supplierIndex];

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa nhà cung cấp này không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (supplier.ID && supplier.ID > 0) {
          this.addToDeletedCommend(supplier.ID);
        }

        if (product.Suppliers.length === 1) {
          Object.assign(product.Suppliers[0], {
            Supplier: '',
            Contact: '',
            UnitPrice: '',
            TotalAmount: '',
            Note: ''
          });
        } else {
          product.Suppliers.splice(supplierIndex, 1);
        }
      },
    });
  }

  syncProductName(productId: number, value: string): void {
    const product = this.getProductById(productId);
    if (product) {
      product.ProductName = value;
    }
  }

  private buildHCNSPayload(): any[] {
    if (!this.HCNSApprovalData?.length) return [];
    const rows: any[] = [];
    this.HCNSApprovalData.forEach(product => {
      const suppliers = product.Suppliers?.length ? product.Suppliers : [this.hydrateSupplierRow()];
      suppliers.forEach(supplier => rows.push(this.buildSupplierPayload(product, supplier)));
    });
    return rows;
  }

  private buildSupplierPayload(product: ProductProposalRow, supplier: SupplierProposalRow) {
    const departmentRequiredID = supplier.DepartmentRequiredID
      || (this.DepartmentRequiredData && this.DepartmentRequiredData.length > 0
        ? (this.DepartmentRequiredData[0].ID || this.DepartmentRequiredData[0].DepartmentRequiredID || 0)
        : 0);

    return {
      ID: supplier.ID && supplier.ID > 0 ? supplier.ID : 0,
      STT: supplier.STT || 0,
      JobRequirementID: supplier.JobRequirementID || this.JobrequirementID || 0,
      DepartmentRequiredID: departmentRequiredID,
      ProductName: product.ProductName || '',
      Supplier: supplier.Supplier || '',
      Contact: supplier.Contact || '',
      UnitPrice: this.parseCurrency(supplier.UnitPrice),
      TotalAmount: this.parseCurrency(supplier.TotalAmount),
      Note: supplier.Note || '',
    };
  }

  private parseCurrency(value: string | number | undefined): number {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return value;
    const numeric = Number(String(value).replace(/,/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  private isValidNumber(value: string | number | undefined): boolean {
    if (value == null || value === '') return false;
    if (typeof value === 'number') return !Number.isNaN(value) && isFinite(value);
    const numeric = Number(String(value).replace(/,/g, ''));
    return !Number.isNaN(numeric) && isFinite(numeric);
  }

  private isEmpty(value: string | number | undefined): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  }

  private getValidationKey(productId: number, supplierIndex: number, field: string): string {
    return `${productId}_${supplierIndex}_${field}`;
  }

  private addValidationError(productId: number, supplierIndex: number, field: string, message: string): void {
    const key = this.getValidationKey(productId, supplierIndex, field);
    this.validationErrors.set(key, {
      productId,
      supplierIndex,
      field,
      message
    });
  }

  private removeValidationError(productId: number, supplierIndex: number, field: string): void {
    const key = this.getValidationKey(productId, supplierIndex, field);
    this.validationErrors.delete(key);
  }

  getValidationError(productId: number, supplierIndex: number, field: string): string {
    const key = this.getValidationKey(productId, supplierIndex, field);
    return this.validationErrors.get(key)?.message || '';
  }

  hasValidationError(productId: number, supplierIndex: number, field: string): boolean {
    const key = this.getValidationKey(productId, supplierIndex, field);
    return this.validationErrors.has(key);
  }

  private validateSupplier(product: ProductProposalRow, supplier: SupplierProposalRow, supplierIndex: number): boolean {
    let isValid = true;

    if (supplierIndex === 0) {
      if (this.isEmpty(product.ProductName)) {
        this.addValidationError(product.rowID, supplierIndex, 'ProductName', 'Tên sản phẩm/dịch vụ không được để trống');
        isValid = false;
      } else {
        this.removeValidationError(product.rowID, supplierIndex, 'ProductName');
      }
    }

    if (this.isEmpty(supplier.Supplier)) {
      this.addValidationError(product.rowID, supplierIndex, 'Supplier', 'NCC/Phương án không được để trống');
      isValid = false;
    } else {
      this.removeValidationError(product.rowID, supplierIndex, 'Supplier');
    }

    if (this.isEmpty(supplier.Contact)) {
      this.addValidationError(product.rowID, supplierIndex, 'Contact', 'Thông tin liên hệ không được để trống');
      isValid = false;
    } else {
      this.removeValidationError(product.rowID, supplierIndex, 'Contact');
    }

    if (this.isEmpty(supplier.UnitPrice)) {
      this.addValidationError(product.rowID, supplierIndex, 'UnitPrice', 'Đơn giá không được để trống');
      isValid = false;
    } else if (!this.isValidNumber(supplier.UnitPrice)) {
      this.addValidationError(product.rowID, supplierIndex, 'UnitPrice', 'Đơn giá phải là số hợp lệ');
      isValid = false;
    } else {
      const unitPrice = this.parseCurrency(supplier.UnitPrice);
      if (unitPrice <= 0) {
        this.addValidationError(product.rowID, supplierIndex, 'UnitPrice', 'Đơn giá phải lớn hơn 0');
        isValid = false;
      } else {
        this.removeValidationError(product.rowID, supplierIndex, 'UnitPrice');
      }
    }

    if (this.isEmpty(supplier.TotalAmount)) {
      this.addValidationError(product.rowID, supplierIndex, 'TotalAmount', 'Thành tiền không được để trống');
      isValid = false;
    } else if (!this.isValidNumber(supplier.TotalAmount)) {
      this.addValidationError(product.rowID, supplierIndex, 'TotalAmount', 'Thành tiền phải là số hợp lệ');
      isValid = false;
    } else {
      const totalAmount = this.parseCurrency(supplier.TotalAmount);
      if (totalAmount <= 0) {
        this.addValidationError(product.rowID, supplierIndex, 'TotalAmount', 'Thành tiền phải lớn hơn 0');
        isValid = false;
      } else {
        this.removeValidationError(product.rowID, supplierIndex, 'TotalAmount');
      }
    }

    return isValid;
  }

  private validateHCNSData(): boolean {
    this.validationErrors.clear();

    let isValid = true;

    this.HCNSApprovalData.forEach(product => {
      if (!product.Suppliers || product.Suppliers.length === 0) {
        product.Suppliers = [this.hydrateSupplierRow()];
      }

      product.Suppliers.forEach((supplier, supplierIndex) => {
        const supplierValid = this.validateSupplier(product, supplier, supplierIndex);
        if (!supplierValid) {
          isValid = false;
        }
      });
    });

    return isValid;
  }

  validateField(productId: number, supplierIndex: number, field: string, value: any): void {
    const product = this.getProductById(productId);
    if (!product) return;

    const supplier = product.Suppliers?.[supplierIndex];
    if (!supplier) return;

    if (field === 'ProductName') {
      product.ProductName = value;
    } else if (field in supplier) {
      (supplier as any)[field] = value;
    }
    this.validateSupplier(product, supplier, supplierIndex);
  }

  /**
   * Format số thành định dạng tiền VNĐ (có dấu phẩy ngăn cách hàng nghìn)
   */
  formatCurrency(value: string | number | undefined): string {
    if (value == null || value === '') return '';

    // Chuyển về số
    let numericValue: number;
    if (typeof value === 'number') {
      numericValue = value;
    } else {
      // Loại bỏ tất cả ký tự không phải số (trừ dấu chấm cho số thập phân)
      const cleanValue = String(value).replace(/[^\d]/g, '');
      numericValue = parseInt(cleanValue, 10);
    }

    if (isNaN(numericValue)) return '';

    // Format với dấu phẩy ngăn cách hàng nghìn
    return numericValue.toLocaleString('vi-VN');
  }

  /**
   * Xử lý sự kiện input để format tiền real-time
   */
  onCurrencyInput(event: Event, supplier: SupplierProposalRow, field: 'UnitPrice' | 'TotalAmount'): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;

    // Lấy giá trị số thuần (loại bỏ tất cả ký tự không phải số)
    const numericValue = input.value.replace(/[^\d]/g, '');

    // Chuyển thành số
    const number = parseInt(numericValue, 10);

    if (isNaN(number)) {
      supplier[field] = '';
      return;
    }

    // Lưu giá trị số vào model
    supplier[field] = number;

    // Format hiển thị
    const formattedValue = number.toLocaleString('vi-VN');

    // Cập nhật input value
    input.value = formattedValue;

    // Tính toán vị trí cursor mới
    const oldLength = oldValue.replace(/[^\d]/g, '').length;
    const newLength = numericValue.length;
    const diffCommas = formattedValue.length - numericValue.length;

    // Đặt lại cursor position
    setTimeout(() => {
      const newCursorPos = cursorPosition + (formattedValue.length - oldValue.length);
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  /**
   * Get formatted value for display in input
   */
  getFormattedCurrencyValue(value: string | number | undefined): string {
    if (value == null || value === '') return '';

    let numericValue: number;
    if (typeof value === 'number') {
      numericValue = value;
    } else {
      const cleanValue = String(value).replace(/[^\d]/g, '');
      numericValue = parseInt(cleanValue, 10);
    }

    if (isNaN(numericValue)) return '';

    return numericValue.toLocaleString('vi-VN');
  }

  /**
   * Chỉ cho phép nhập số (chặn các ký tự không phải số)
   */
  onCurrencyKeyDown(event: KeyboardEvent): boolean {
    // Cho phép các phím điều khiển: Backspace, Delete, Tab, Escape, Enter, Arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

    if (allowedKeys.includes(event.key)) {
      return true;
    }

    // Cho phép Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return true;
    }

    // Chỉ cho phép nhập số 0-9
    if (event.key >= '0' && event.key <= '9') {
      return true;
    }

    // Chặn tất cả các ký tự khác
    event.preventDefault();
    return false;
  }
}
