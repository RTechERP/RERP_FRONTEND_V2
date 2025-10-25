import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPurchaseRequestService } from '../service/project-partlist-purchase-request.service';

@Component({
  selector: 'app-Project-Partlist-Purchase-Request-Form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzInputNumberModule,
    NzToolTipModule,
    NzCheckboxModule,
  ],
  templateUrl: './Project-Partlist-Purchase-Request-Form.component.html',
  styleUrls: ['./Project-Partlist-Purchase-Request-Form.component.css'],
})
export class ProjectPartlistPurchaseRequestFormComponent implements OnInit {
  @Input() dataInput: any = [];
  @Output() formSubmit = new EventEmitter<any>();

  purchaseRequestForm!: FormGroup;
  isLoading = false;

  // Data sources for dropdowns
  customers: any[] = [];
  products: any[] = [];
  productGroups: any[] = [];
  employees: any[] = [];
  currencies: any[] = [];
  suppliers: any[] = [];
  noteOptions: string[] = [
    '1 - Chưa sử dụng',
    '2 - Đang sử dụng',
    '3 - Sửa chữa, bảo dưỡng',
    '4 - Mất',
    '5 - Hỏng',
    '6 - Thanh lý',
    '7 - Đề nghị thanh lý'
  ];

  // UI state flags
  isEditMode = false;
  statusRequest: string = 'Yêu cầu mua hàng';
  
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);
  public activeModal = inject(NgbActiveModal);
  private purchaseRequestService = inject(ProjectPartlistPurchaseRequestService);

  constructor() {
    this.initializeForm();
  }

  ngOnInit() {
    this.isEditMode = this.dataInput && this.dataInput.ID > 0;

    if (this.dataInput) {
      this.loadFormData();
    }

    this.updatePrice();
    this.loadDropdownData();
  }

  private initializeForm(): void {
    this.purchaseRequestForm = this.fb.group({
      projectId: [null],
      customerId: [null],
      
      // Product information
      productSaleId: [null],
      productCode: [''],
      productName: ['', [Validators.required, this.trimValidator]], // Validate tên sản phẩm
      manufacturer: [''],
      unitName: [''],
      productGroupId: [null],

      // Employee information
      employeeRequestId: [null],
      employeeBuy: [null, [this.employeeBuyValidator.bind(this)]], // Validate nhân viên mua

      // Quantity and pricing
      quantity: [1, [Validators.required, Validators.min(1)]], // Validate số lượng > 0
      unitPrice: [0],
      currencyId: [null],
      currencyRate: [1],
      totalPrice: [0],
      totalPriceExchange: [0],
      vat: [0],
      totalMoneyVAT: [0],
      historyPrice: [0],

      // Supplier and import info
      supplierSaleId: [null],
      isImport: [false],
      unitFactoryExportPrice: [0],
      unitImportPrice: [0],
      totalImportPrice: [0],
      leadTime: [0],

      // Dates
      dateRequest: [new Date()],
      deadline: [null, [this.deadlineValidator.bind(this)]], // Validate deadline

      // Notes and flags
      note: ['', [this.noteValidator.bind(this)]], // Validate ghi chú
      isTechBought: [false],
      statusRequest: [this.statusRequest],
    });

    // Subscribe to form changes for price calculation
    this.purchaseRequestForm.get('unitPrice')?.valueChanges.subscribe(() => this.updatePrice());
    this.purchaseRequestForm.get('quantity')?.valueChanges.subscribe(() => this.updatePrice());
    this.purchaseRequestForm.get('currencyRate')?.valueChanges.subscribe(() => this.updatePrice());
    this.purchaseRequestForm.get('vat')?.valueChanges.subscribe(() => this.updatePrice());
    
    // Subscribe to currency changes
    this.purchaseRequestForm.get('currencyId')?.valueChanges.subscribe((currencyId) => {
      this.onCurrencyChange(currencyId);
    });

    // Subscribe to product changes
    this.purchaseRequestForm.get('productSaleId')?.valueChanges.subscribe((productId) => {
      this.onProductChange(productId);
    });

    // Subscribe to isTechBought changes
    this.purchaseRequestForm.get('isTechBought')?.valueChanges.subscribe(() => {
      this.updateFieldStatesBasedOnTechBought();
    });
  }

  // Custom validators
  private trimValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') {
      return { required: true };
    }
    return null;
  }

  private employeeBuyValidator(control: AbstractControl): ValidationErrors | null {
    const isTechBought = this.purchaseRequestForm?.get('isTechBought')?.value;
    const isEditMode = this.isEditMode;
    
    if (!isTechBought && !isEditMode && (!control.value || control.value === 0)) {
      return { employeeBuyRequired: true };
    }
    return null;
  }

  private deadlineValidator(control: AbstractControl): ValidationErrors | null {
    const isTechBought = this.purchaseRequestForm?.get('isTechBought')?.value;
    
    if (isTechBought) {
      return null; // Không validate deadline nếu là tech bought
    }

    if (!control.value) {
      return { deadlineRequired: true };
    }

    const deadline = new Date(control.value);
    const dateNow = new Date();
    const currentHour = dateNow.getHours();
    
    // Tính số ngày từ hiện tại đến deadline
    const timeDiff = deadline.getTime() - dateNow.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Kiểm tra deadline tối thiểu
    if (currentHour < 15) {
      if (daysDiff < 2) {
        return { deadlineTooSoon: { message: 'Deadline tối thiểu là 2 ngày từ ngày hiện tại!' } };
      }
    } else {
      if (daysDiff < 3) {
        return { deadlineTooSoon: { message: 'Yêu cầu từ sau 15h nên ngày Deadline sẽ bắt đầu tính từ ngày hôm sau và tối thiểu là 2 ngày!' } };
      }
    }

    // Kiểm tra deadline có phải là ngày làm việc không
    const dayOfWeek = deadline.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
      return { weekendDeadline: { message: 'Deadline phải là ngày làm việc (T2 - T6)!' } };
    }

    return null;
  }

  private noteValidator(control: AbstractControl): ValidationErrors | null {
    const isTechBought = this.purchaseRequestForm?.get('isTechBought')?.value;
    
    if (isTechBought && (!control.value || control.value.trim() === '')) {
      return { noteRequired: true };
    }
    return null;
  }

  // Load dropdown data
  private loadDropdownData(): void {
    this.loadCustomers();
    this.loadProductSales();
    this.loadproductGroups();
    this.loadEmployees();
    this.loadCurrencies();
    this.loadSuppliers();
  }

  loadCustomers() {
    this.purchaseRequestService.getCustomer().subscribe({
      next: (response) => {
        this.customers = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách khách hàng!');
        console.error('Error loading customers:', error);
      },
    });
  }

  loadProductSales() {
    this.purchaseRequestService.getProductSales().subscribe({
      next: (response) => {
        this.products = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách sản phẩm!');
        console.error('Error loading products:', error);
      },
    });
  }

  loadCurrencies() {
    this.purchaseRequestService.getCurrency().subscribe({
      next: (response) => {
        this.currencies = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách loại tiền!');
        console.error('Error loading currencies:', error);
      },
    });
  }

  loadSuppliers() {
    this.purchaseRequestService.getSupplier().subscribe({
      next: (response) => {
        this.suppliers = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách nhà cung cấp!');
        console.error('Error loading suppliers:', error);
      },
    });
  }

  loadproductGroups() {
    this.purchaseRequestService.getProductGroup().subscribe({
      next: (response) => {
        this.productGroups = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách nhóm sản phẩm!');
        console.error('Error loading product groups:', error);
      },
    });
  }

  loadEmployees() {
    this.purchaseRequestService.getEmployeeApprove().subscribe({
      next: (response) => {
        this.employees = response.data;
      },
      error: (error) => {
        this.message.error('Không thể tải danh sách nhân viên!');
        console.error('Error loading employees:', error);
      },
    });
  }

  private loadFormData() {
    if (this.dataInput) {
      const data = this.dataInput;
      this.purchaseRequestForm.patchValue({
        projectId: data.ProjectID,
        customerId: data.CustomerID || 0,
        productSaleId: data.ProductSaleID,
        productCode: data.ProductCode,
        productName: data.ProductName,
        manufacturer: data.Manufacturer,
        unitName: data.UnitName,
        productGroupId: data.ProductGroupID,
        employeeRequestId: data.EmployeeID,
        employeeBuy: data.EmployeeIDRequestApproved || null,
        quantity: data.Quantity || 1,
        unitPrice: data.UnitPrice || 0,
        currencyId: data.CurrencyID,
        currencyRate: data.CurrencyRate || 1,
        totalPrice: data.TotalPrice || 0,
        totalPriceExchange: data.TotalPriceExchange || 0,
        vat: data.VAT || 0,
        totalMoneyVAT: data.TotaMoneyVAT || 0,
        historyPrice: data.HistoryPrice || 0,
        supplierSaleId: data.SupplierSaleID,
        isImport: data.IsImport || false,
        unitFactoryExportPrice: data.UnitFactoryExportPrice || 0,
        unitImportPrice: data.UnitImportPrice || 0,
        totalImportPrice: data.TotalImportPrice || 0,
        leadTime: data.TotalDayLeadTime || 0,
        dateRequest: data.DateRequest ? new Date(data.DateRequest) : new Date(),
        deadline: data.DateReturnExpected ? new Date(data.DateReturnExpected) : null,
        note: data.Note || '',
        isTechBought: data.IsTechBought || false,
        statusRequest: this.statusRequest,
      });

      this.updateFieldStatesBasedOnTechBought();
    }
  }

  // Event handlers
  onCurrencyChange(currencyId: any): void {
    if (currencyId) {
      const currency = this.currencies.find(c => c.ID === currencyId);
      if (currency) {
        const now = new Date();
        const isExpired = (currency.DateExpried < now || currency.DateStart > now) && 
                         currency.Code?.toLowerCase().trim() !== 'vnd';
        
        const rate = !isExpired ? currency.CurrencyRate : 0;
        this.purchaseRequestForm.get('currencyRate')?.setValue(rate);
      }
    }
  }

  onProductChange(productId: any): void {
    if (productId) {
      const product = this.products.find(p => p.ID === productId);
      if (product) {
        this.purchaseRequestForm.patchValue({
          productName: product.ProductName,
          manufacturer: product.Maker,
          unitName: product.Unit,
          productGroupId: product.ProductGroupID
        });

        // Load history price if product code exists
        if (product.ProductCode) {
          this.loadHistoryPrice(productId, product.ProductCode);
        }
      }
    }
  }

  private loadHistoryPrice(productId: number, productCode: string): void {
    // this.purchaseRequestService.getHistoryPrice(productId).subscribe({
    //   next: (response) => {
    //     if (response.data && response.data.length > 0) {
    //       const historyItem = response.data.find((item: any) => item.ProductCode === productCode);
    //       if (historyItem) {
    //         this.purchaseRequestForm.get('historyPrice')?.setValue(historyItem.UnitPrice || 0);
    //       }
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error loading history price:', error);
    //   }
    // });
  }

  // Form submission
  onSave() {
    if (this.validateForm()) {
      this.isLoading = true;
      const formData = this.purchaseRequestForm.value;

      this.purchaseRequestService.saveData(formData).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.message.success('Lưu thành công!');
            this.activeModal.close(res.data);
          } else {
            this.message.error('Lưu thất bại: ' + res.message);
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.message.error('Lỗi khi gọi API: ' + err.message);
          this.isLoading = false;
        },
      });
    }
  }

  onSaveAndContinue() {
    if (this.validateForm()) {
      this.isLoading = true;
      const formData = this.purchaseRequestForm.value;

      this.formSubmit.emit(formData);
      this.purchaseRequestForm.reset();
      this.message.success('Lưu thành công! Có thể tiếp tục nhập.');
      this.isLoading = false;
    }
  }

  onCancel() {
    this.activeModal.dismiss('cancel');
  }

  // Validation method equivalent to CheckValidate() in C#
  private validateForm(): boolean {
    // Trigger validation for all fields
    Object.keys(this.purchaseRequestForm.controls).forEach(key => {
      const control = this.purchaseRequestForm.get(key);
      if (control) {
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    // Check if form is valid
    if (!this.purchaseRequestForm.valid) {
      // Find first invalid field and show specific error message
      const firstInvalidField = Object.keys(this.purchaseRequestForm.controls)
        .find(key => this.purchaseRequestForm.get(key)?.invalid);
      
      if (firstInvalidField) {
        const control = this.purchaseRequestForm.get(firstInvalidField);
        const errors = control?.errors;
        
        if (errors) {
          if (errors['required'] || errors['trimValidator']) {
            this.message.error(this.getFieldErrorMessage(firstInvalidField, 'required'));
          } else if (errors['employeeBuyRequired']) {
            this.message.error('Vui lòng chọn Nhân viên mua!');
          } else if (errors['deadlineRequired']) {
            this.message.error('Vui lòng chọn Deadline!');
          } else if (errors['deadlineTooSoon']) {
            this.message.error(errors['deadlineTooSoon'].message);
          } else if (errors['weekendDeadline']) {
            this.message.error(errors['weekendDeadline'].message);
          } else if (errors['noteRequired']) {
            this.message.error('Vui lòng nhập Ghi chú!');
          } else if (errors['min']) {
            this.message.error('Vui lòng nhập Số lượng!');
          }
        }
      }
      
      return false;
    }

    // Additional weekend validation for deadline (confirmation dialog)
    const deadline = this.purchaseRequestForm.get('deadline')?.value;
    const isTechBought = this.purchaseRequestForm.get('isTechBought')?.value;
    
    if (!isTechBought && deadline) {
      const dateNow = new Date();
      const deadlineDate = new Date(deadline);
      const timeDiff = deadlineDate.getTime() - dateNow.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Count weekend days in the period
      let weekendCount = 0;
      for (let i = 0; i < daysDiff; i++) {
        const checkDate = new Date(dateNow.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendCount++;
        }
      }
      
      if (weekendCount > 0) {
        const confirmed = confirm(
          `Deadline sẽ không tính Thứ 7 và Chủ nhật.\nBạn có chắc muốn chọn Deadline là ngày [${deadlineDate.toLocaleDateString('vi-VN')}] không?`
        );
        if (!confirmed) {
          return false;
        }
      }
    }

    return true;
  }

  private getFieldErrorMessage(fieldName: string, errorType: string): string {
    const fieldMessages: { [key: string]: string } = {
      'productName': 'Vui lòng nhập Tên sản phẩm!',
      'employeeBuy': 'Vui lòng chọn Nhân viên mua!',
      'quantity': 'Vui lòng nhập Số lượng!',
      'deadline': 'Vui lòng chọn Deadline!',
      'note': 'Vui lòng nhập Ghi chú!'
    };
    
    return fieldMessages[fieldName] || 'Vui lòng điền đầy đủ thông tin!';
  }

  // Method to handle field states based on isTechBought
  private updateFieldStatesBasedOnTechBought(): void {
    const isTechBought = this.purchaseRequestForm.get('isTechBought')?.value;

    const fieldsToToggle = [
      'currencyId',
      'vat',
      'supplierSaleId',
      'isImport',
      'leadTime',
    ];

    fieldsToToggle.forEach((fieldName) => {
      const field = this.purchaseRequestForm.get(fieldName);
      if (field) {
        if (isTechBought) {
          field.enable();
        } else {
          field.disable();
        }
      }
    });

    // Update validators for dependent fields
    this.purchaseRequestForm.get('employeeBuy')?.updateValueAndValidity();
    this.purchaseRequestForm.get('note')?.updateValueAndValidity();
    this.purchaseRequestForm.get('deadline')?.updateValueAndValidity();
  }

  // Price calculation methods
  private updatePrice(): void {
    const unitPrice = this.purchaseRequestForm.get('unitPrice')?.value || 0;
    const quantity = this.purchaseRequestForm.get('quantity')?.value || 0;
    const currencyRate = this.purchaseRequestForm.get('currencyRate')?.value || 1;
    const vat = this.purchaseRequestForm.get('vat')?.value || 0;

    // Tính thành tiền chưa VAT
    const totalPrice = unitPrice * quantity;
    this.purchaseRequestForm.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });

    // Tính thành tiền quy đổi (VND)
    const totalPriceExchange = unitPrice * quantity * currencyRate;
    this.purchaseRequestForm.get('totalPriceExchange')?.setValue(totalPriceExchange, { emitEvent: false });

    // Tính thành tiền có VAT
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;
    this.purchaseRequestForm.get('totalMoneyVAT')?.setValue(totalMoneyVAT, { emitEvent: false });
  }

  // Utility method to get form control
  getFormControl(controlName: string): AbstractControl | null {
    return this.purchaseRequestForm.get(controlName);
  }

  // Utility method to check if field has error
  hasFieldError(controlName: string): boolean {
    const control = this.purchaseRequestForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Utility method to get field error message
  getFieldError(controlName: string): string {
    const control = this.purchaseRequestForm.get(controlName);
    if (control && control.errors) {
      const errors = control.errors;
      if (errors['required'] || errors['trimValidator']) {
        return this.getFieldErrorMessage(controlName, 'required');
      } else if (errors['employeeBuyRequired']) {
        return 'Vui lòng chọn Nhân viên mua!';
      } else if (errors['deadlineRequired']) {
        return 'Vui lòng chọn Deadline!';
      } else if (errors['deadlineTooSoon']) {
        return errors['deadlineTooSoon'].message;
      } else if (errors['weekendDeadline']) {
        return errors['weekendDeadline'].message;
      } else if (errors['noteRequired']) {
        return 'Vui lòng nhập Ghi chú!';
      } else if (errors['min']) {
        return 'Số lượng phải lớn hơn 0!';
      }
    }
    return '';
  }
}