# 📋 PLAN CÂP NHẬT HTML TEMPLATE - TÍCH HỢP PRODUCTRTC

## 🎯 OVERVIEW
Cập nhật HTML template hiện có của bạn để hỗ trợ cả **ProductSale** và **ProductRTC** với thay đổi tối thiểu, tận dụng tối đa layout hiện tại.

---

## 📝 PHASE 1: THÊM PRODUCT TYPE SELECTOR (Optional)

### 1.1. Thêm Radio Buttons để chọn Product Type (nếu cần)

**Vị trí:** Ngay sau modal header, trước form

```html
<div class="modal-body">
    <!-- NEW: Product Type Selector (Optional - nếu muốn user switch được) -->
    <div class="bg-light p-2 mb-3 rounded" *ngIf="allowProductTypeSwitch">
        <div class="d-flex align-items-center gap-3">
            <strong class="text-muted">Loại sản phẩm:</strong>
            <nz-radio-group [(ngModel)]="currentProductType" 
                            [ngModelOptions]="{standalone: true}"
                            (ngModelChange)="onProductTypeChange($event)">
                <label nz-radio [nzValue]="0">Product Sale</label>
                <label nz-radio [nzValue]="1">Product RTC</label>
            </nz-radio-group>
        </div>
    </div>

    <form nz-form [formGroup]="validateForm" class="container-fluid" nzLayout="vertical">
        <!-- Existing form content -->
```

---

## 📝 PHASE 2: CẬP NHẬT ROW 1 - CUSTOMER, MAKER, STATUS

### 2.1. Row 1 - Giữ nguyên nhưng thêm conditional cho Maker

**Thay thế row đầu tiên:**

```html
<div nz-row [nzGutter]="16">
    <!-- Customer - Common field -->
    <div nz-col [nzSpan]="12">
        <nz-form-item>
            <nz-form-label>Khách hàng</nz-form-label>
            <nz-form-control>
                <nz-select formControlName="CustomerID" 
                           nzPlaceHolder="Chọn khách hàng" 
                           name="CustomerID"
                           nzShowSearch="true">
                    <nz-option *ngFor="let item of customers" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.CustomerCode + '-' + item.CustomerName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Maker/Firm - Different for ProductSale vs ProductRTC -->
    <div nz-col [nzSpan]="6">
        <!-- ProductSale: Text input -->
        <nz-form-item *ngIf="currentProductType === 0">
            <nz-form-label>Hãng</nz-form-label>
            <nz-form-control>
                <input nz-input name="Maker" formControlName="Maker" placeholder="Nhập hãng" />
            </nz-form-control>
        </nz-form-item>

        <!-- ProductRTC: Dropdown (NEW) -->
        <nz-form-item *ngIf="currentProductType === 1">
            <nz-form-label nzRequired>Hãng</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng chọn hãng">
                <nz-select formControlName="FirmID" 
                           nzPlaceHolder="Chọn hãng"
                           nzShowSearch="true">
                    <nz-option *ngFor="let item of firms" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.FirmName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Status - Common field -->
    <div nz-col [nzSpan]="6">
        <nz-form-item>
            <nz-form-label>Trạng thái</nz-form-label>
            <nz-form-control>
                <input nz-input name="StatusRequest" 
                       formControlName="StatusRequest"
                       placeholder="Yêu cầu mua hàng" 
                       disabled />
            </nz-form-control>
        </nz-form-item>
    </div>
</div>
```

---

## 📝 PHASE 3: CẬP NHẬT ROW 2 - PRODUCT SELECTION

### 3.1. Row 2 - Product Code, Name, Unit, Employee, ProductGroup

**Thay thế row thứ 2:**

```html
<div nz-row [nzGutter]="16">
    <!-- Product Selection - Different for ProductSale vs ProductRTC -->
    <div nz-col [nzSpan]="6">
        <!-- ProductSale Selection (Existing) -->
        <nz-form-item *ngIf="currentProductType === 0">
            <nz-form-label class="fs-12 d-flex align-items-center" [nzSpan]="24">
                <div class="d-flex"> Mã sản phẩm
                    <button class="p-0 m-0 fs-12 px-1 h-auto" 
                            nz-button nzSize="small" 
                            title="Thêm sản phẩm"
                            nzType="text" 
                            (click)="onAddProductSale()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </nz-form-label>
            <nz-form-control>
                <nz-select formControlName="ProductSaleID" 
                           nzPlaceHolder="Chọn sản phẩm"
                           nzShowSearch="true" 
                           name="ProductSaleID">
                    <nz-option *ngFor="let item of products" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.ProductCode + '-' + item.ProductName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>

        <!-- ProductRTC Selection (NEW) -->
        <nz-form-item *ngIf="currentProductType === 1">
            <nz-form-label class="fs-12 d-flex align-items-center" [nzSpan]="24">
                <div class="d-flex"> Mã sản phẩm RTC
                    <button class="p-0 m-0 fs-12 px-1 h-auto" 
                            nz-button nzSize="small" 
                            title="Thêm sản phẩm RTC"
                            nzType="text" 
                            (click)="onAddProductRTC()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </nz-form-label>
            <nz-form-control>
                <nz-select formControlName="ProductRTCID" 
                           nzPlaceHolder="Chọn sản phẩm RTC"
                           nzShowSearch="true" 
                           name="ProductRTCID">
                    <nz-option *ngFor="let item of productsRTC" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.ProductCodeRTC + '-' + item.ProductName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Product Name - Common but different requirement -->
    <div nz-col [nzSpan]="6">
        <nz-form-item>
            <nz-form-label>Tên sản phẩm <span class="text-danger">(*)</span></nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập tên sản phẩm!">
                <input nz-input name="ProductName" 
                       formControlName="ProductName"
                       placeholder="Nhập tên sản phẩm" />
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Unit - Different for ProductSale vs ProductRTC -->
    <div nz-col [nzSpan]="4">
        <!-- ProductSale: Text input (Existing) -->
        <nz-form-item *ngIf="currentProductType === 0">
            <nz-form-label>Đơn vị</nz-form-label>
            <nz-form-control>
                <input nz-input name="Unit" 
                       formControlName="Unit" 
                       placeholder="Nhập đơn vị" />
            </nz-form-control>
        </nz-form-item>

        <!-- ProductRTC: Dropdown (NEW) -->
        <nz-form-item *ngIf="currentProductType === 1">
            <nz-form-label nzRequired>Đơn vị</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng chọn đơn vị">
                <nz-select formControlName="UnitCountID" 
                           nzPlaceHolder="Chọn đơn vị"
                           nzShowSearch="true">
                    <nz-option *ngFor="let item of unitCounts" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.UnitCountName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Employee Request - Common -->
    <div nz-col [nzSpan]="4">
        <nz-form-item>
            <label class="form-label mb-2">Người yêu cầu</label>
            <nz-select name="EmployeeRequestID" 
                       formControlName="EmployeeRequestID" 
                       class="w-100"
                       nzShowSearch 
                       nzPlaceHolder="Chọn người yêu cầu">
                <ng-container *ngFor="let group of employeeRequests">
                    <nz-option-group [nzLabel]="group.label">
                        <nz-option *ngFor="let option of group.options"
                                   [nzLabel]="option.item.Code +' - '+ option.item.FullName"
                                   [nzValue]="option.item.EmployeeID">
                        </nz-option>
                    </nz-option-group>
                </ng-container>
            </nz-select>
        </nz-form-item>
    </div>

    <!-- Product Group - Different datasource for ProductSale vs ProductRTC -->
    <div nz-col [nzSpan]="4">
        <!-- ProductSale: ProductGroup (Existing) -->
        <nz-form-item *ngIf="currentProductType === 0">
            <label class="form-label mb-2">Loại kho</label>
            <nz-select class="w-100" 
                       nzPlaceHolder="Chọn loại kho" 
                       name="ProductGroupID"
                       formControlName="ProductGroupID">
                <nz-option *ngFor="let item of productGroup" 
                           [nzValue]="item.ID"
                           [nzLabel]="item.ProductGroupName">
                </nz-option>
            </nz-select>
        </nz-form-item>

        <!-- ProductRTC: ProductGroupRTC (NEW) -->
        <nz-form-item *ngIf="currentProductType === 1">
            <label class="form-label mb-2">Loại kho <span class="text-danger">(*)</span></label>
            <nz-form-control nzErrorTip="Vui lòng chọn loại kho">
                <nz-select class="w-100" 
                           nzPlaceHolder="Chọn loại kho" 
                           name="ProductGroupRTCID"
                           formControlName="ProductGroupRTCID">
                    <nz-option *ngFor="let item of productGroupsRTC" 
                               [nzValue]="item.ID"
                               [nzLabel]="item.ProductGroupName">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>
</div>
```

---

## 📝 PHASE 4: THÊM ROW MỚI - PRODUCTRTC SPECIFIC FIELDS

### 4.1. Thêm row mới ngay sau row 2 (chỉ hiện cho ProductRTC)

```html
<!-- NEW ROW: ProductRTC Specific Fields - Ticket Type, Product Code, Employee Approve -->
<div nz-row [nzGutter]="16" *ngIf="currentProductType === 1">
    <div nz-col [nzSpan]="6">
        <nz-form-item>
            <nz-form-label nzRequired>Mã sản phẩm</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập mã sản phẩm">
                <input nz-input name="ProductCode" 
                       formControlName="ProductCode"
                       placeholder="Nhập mã sản phẩm" />
            </nz-form-control>
        </nz-form-item>
    </div>

    <div nz-col [nzSpan]="6">
        <nz-form-item>
            <nz-form-label nzRequired>Loại phiếu</nz-form-label>
            <nz-form-control>
                <nz-select formControlName="TicketType" 
                           nzPlaceHolder="Chọn loại phiếu">
                    <nz-option [nzValue]="0" nzLabel="Phiếu mua"></nz-option>
                    <nz-option [nzValue]="1" nzLabel="Phiếu mượn"></nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Employee Approve - Only show when TicketType = 1 (Phiếu mượn) -->
    <div nz-col [nzSpan]="6" *ngIf="validateForm.get('TicketType')?.value === 1">
        <nz-form-item>
            <nz-form-label nzRequired>Người duyệt</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng chọn người duyệt">
                <nz-select name="EmployeeApproveID" 
                           formControlName="EmployeeApproveID" 
                           class="w-100"
                           nzShowSearch 
                           nzPlaceHolder="Chọn người duyệt">
                    <nz-option *ngFor="let item of employeeApproves"
                               [nzLabel]="item.FullName"
                               [nzValue]="item.EmployeeID">
                    </nz-option>
                </nz-select>
            </nz-form-control>
        </nz-form-item>
    </div>

    <!-- Date Return Estimated - Only show when TicketType = 1 (Phiếu mượn) -->
    <div nz-col [nzSpan]="6" *ngIf="validateForm.get('TicketType')?.value === 1">
        <nz-form-item>
            <nz-form-label>Ngày dự kiến trả</nz-form-label>
            <nz-form-control>
                <nz-date-picker class="w-100" 
                                nzFormat="dd/MM/yyyy" 
                                name="DateReturnEstimated"
                                formControlName="DateReturnEstimated">
                </nz-date-picker>
            </nz-form-control>
        </nz-form-item>
    </div>
</div>
```

---

## 📝 PHASE 5: CẬP NHẬT ROW 3 - GIỮ NGUYÊN

Row 3 (Employee Buy, Date Request, Deadline, Unit Price, Currency, Quantity) giữ nguyên vì đây là các fields chung.

**Chỉ cần update title của modal header để phân biệt:**

```html
<div class="modal-header bg-primary align-items-center ps-3">
    <h6 class="text-light text-uppercase m-0 fw-bold">
        {{ currentProductType === 0 ? 'Chi tiết yêu cầu mua hàng (PRODUCT SALE)' : 'Chi tiết yêu cầu mua hàng (PRODUCT RTC)' }}
    </h6>
    <button type="button" class="btn-close position-absolute end-0 m-3" 
            aria-label="Close"
            (click)="activeModal.dismiss()">
    </button>
</div>
```

---

## 📝 PHASE 6: CẬP NHẬT FORM CONTROLS

### 6.1. Component TypeScript - Thêm Variables

```typescript
// Add to component class
currentProductType: ProductType = ProductType.PRODUCT_SALE;
allowProductTypeSwitch: boolean = false; // Set to true if you want radio buttons

// ProductRTC specific data
productsRTC: any[] = [];
firms: any[] = [];
unitCounts: any[] = [];
productGroupsRTC: any[] = [];
employeeApproves: any[] = [];
```

### 6.2. Update initForm()

```typescript
private initForm() {
  this.validateForm = this.fb.group({
    // Existing fields
    CustomerID: [0],
    Maker: [''],
    StatusRequest: [''],
    ProductSaleID: [0],
    ProductName: ['', [Validators.required]],
    Unit: [''],
    EmployeeRequestID: [0],
    ProductGroupID: [0],
    EmployeeBuyID: [0, [Validators.required]],
    DateRequest: [null],
    DateReturnExpected: [null, [Validators.required]],
    UnitPrice: [0],
    TotalPrice: [0],
    Quantity: [0, [Validators.required, Validators.min(1)]],
    SupplierSaleID: [0],
    TotalPriceExchange: [0],
    TotalMoneyVAT: [0],
    CurrencyID: [0],
    HistoryPrice: [0],
    CurrencyRate: [0],
    VAT: [0],
    UnitFactoryExportPrice: [0],
    UnitImportPrice: [0],
    TotalImportPrice: [0],
    Note: [''],
    LeadTime: [0],
    IsImport: [false],

    // NEW: ProductRTC fields
    ProductRTCID: [0],
    ProductCode: [''],
    FirmID: [0],
    UnitCountID: [0],
    ProductGroupRTCID: [0],
    TicketType: [0],
    DateReturnEstimated: [null],
    EmployeeApproveID: [0],
  });

  // Existing listeners
  ['UnitPrice', 'Quantity', 'VAT', 'CurrencyRate'].forEach((field) => {
    this.validateForm
      .get(field)
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        if (!this.isLoadingData) {
          setTimeout(() => this.updatePrice(), 0);
        }
      });
  });

  this.validateForm
    .get('IsImport')
    ?.valueChanges.pipe(distinctUntilChanged())
    .subscribe(() => {
      if (!this.isLoadingData) {
        setTimeout(() => this.updateDisableByIsImport(), 0);
      }
    });

  this.validateForm
    .get('ProductSaleID')
    ?.valueChanges.pipe(distinctUntilChanged())
    .subscribe(() => {
      if (!this.isLoadingData && this.currentProductType === ProductType.PRODUCT_SALE) {
        setTimeout(() => this.getProductSale(), 0);
      }
    });

  // NEW: ProductRTC listener
  this.validateForm
    .get('ProductRTCID')
    ?.valueChanges.pipe(distinctUntilChanged())
    .subscribe(() => {
      if (!this.isLoadingData && this.currentProductType === ProductType.PRODUCT_RTC) {
        setTimeout(() => this.getProductRTC(), 0);
      }
    });

  // NEW: TicketType listener
  this.validateForm
    .get('TicketType')
    ?.valueChanges.pipe(distinctUntilChanged())
    .subscribe((ticketType) => {
      if (!this.isLoadingData) {
        this.handleTicketTypeChange(ticketType);
      }
    });
}
```

### 6.3. Add New Methods

```typescript
// NEW: Load ProductRTC data
getProductsRTC() {
  this.projectPartlistPurchaseRequestService.getProductsRTC().subscribe({
    next: (response: any) => {
      this.productsRTC = response.data || [];
      if (this.productRTCID > 0 && !this.projectPartlistDetail) {
        this.validateForm.patchValue({ ProductRTCID: this.productRTCID });
      }
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    }
  });
}

getFirms() {
  this.projectPartlistPurchaseRequestService.getFirms().subscribe({
    next: (response: any) => {
      this.firms = response.data || [];
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    }
  });
}

getUnitCounts() {
  this.projectPartlistPurchaseRequestService.getUnitCounts().subscribe({
    next: (response: any) => {
      this.unitCounts = response.data || [];
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    }
  });
}

getProductGroupsRTC() {
  this.projectPartlistPurchaseRequestService.getProductGroupsRTC().subscribe({
    next: (response: any) => {
      this.productGroupsRTC = response.data || [];
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    }
  });
}

getEmployeeApproves() {
  this.projectPartlistPurchaseRequestService.getEmployeeApproves().subscribe({
    next: (response: any) => {
      this.employeeApproves = response.data || [];
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    }
  });
}

// NEW: Handle ProductRTC change
getProductRTC() {
  if (this.isLoadingData) return;
  
  let data = this.validateForm.getRawValue();
  const productRTCId = data.ProductRTCID;
  
  const shouldDisable = productRTCId > 0;
  if (shouldDisable) {
    this.validateForm.get('ProductName')?.disable();
    this.validateForm.get('ProductCode')?.disable();
    this.validateForm.get('FirmID')?.disable();
    this.validateForm.get('UnitCountID')?.disable();
    this.validateForm.get('ProductGroupRTCID')?.disable();
  } else {
    this.validateForm.get('ProductName')?.enable();
    this.validateForm.get('ProductCode')?.enable();
    this.validateForm.get('FirmID')?.enable();
    this.validateForm.get('UnitCountID')?.enable();
    this.validateForm.get('ProductGroupRTCID')?.enable();
  }
  
  if (productRTCId > 0) {
    this.projectPartlistPurchaseRequestService
      .getProductRTCById(productRTCId)
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.validateForm.patchValue({
              ProductName: response.data.ProductName,
              ProductCode: response.data.ProductCode,
              FirmID: response.data.FirmID,
              UnitCountID: response.data.UnitCountID,
              ProductGroupRTCID: response.data.ProductGroupRTCID,
            });
          }
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
        },
      });
  }
}

// NEW: Handle Ticket Type change
handleTicketTypeChange(ticketType: number) {
  if (ticketType === 1) { // Phiếu mượn
    this.validateForm.get('DateReturnEstimated')?.enable();
    this.validateForm.get('EmployeeApproveID')?.enable();
    this.validateForm.get('EmployeeApproveID')?.setValidators([Validators.required]);
  } else { // Phiếu mua
    this.validateForm.patchValue({
      DateReturnEstimated: null,
      EmployeeApproveID: 0
    });
    this.validateForm.get('DateReturnEstimated')?.disable();
    this.validateForm.get('EmployeeApproveID')?.disable();
    this.validateForm.get('EmployeeApproveID')?.clearValidators();
  }
  this.validateForm.get('EmployeeApproveID')?.updateValueAndValidity();
}

// NEW: Add ProductRTC
onAddProductRTC() {
  this.notification.info('Thông báo', 'Chức năng thêm ProductRTC đang được phát triển');
}

// NEW: Product Type Change (if using radio buttons)
onProductTypeChange(type: number) {
  this.currentProductType = type;
  // Clear opposite type's fields
  if (type === ProductType.PRODUCT_SALE) {
    this.validateForm.patchValue({
      ProductRTCID: 0,
      ProductCode: '',
      FirmID: 0,
      UnitCountID: 0,
      ProductGroupRTCID: 0,
      TicketType: 0,
      DateReturnEstimated: null,
      EmployeeApproveID: 0,
    });
  } else {
    this.validateForm.patchValue({
      ProductSaleID: 0,
      Maker: '',
      Unit: '',
      ProductGroupID: 0,
    });
  }
}
```

### 6.4. Update ngOnInit()

```typescript
ngOnInit(): void {
  this.currentProductType = this.productType || ProductType.PRODUCT_SALE;
  this.initForm();
  
  // Load common data
  this.getCustomer();
  this.getEmployee();
  this.getCurrency();
  this.getSupplierSale();
  
  // Load specific data based on product type
  if (this.currentProductType === ProductType.PRODUCT_SALE) {
    this.getProducts();
    this.getProductGroup();
  } else {
    this.getProductsRTC();
    this.getFirms();
    this.getUnitCounts();
    this.getProductGroupsRTC();
    this.getEmployeeApproves();
  }
  
  this.loadData();
}
```

### 6.5. Update loadData()

```typescript
loadData() {
  if (this.projectPartlistDetail != null) {
    let data = this.projectPartlistDetail;
    const id = data.ID ? Number(data.ID) : 0;
    this.isDisable = id > 0;
    this.IsTechBought = data.IsTechBought;
    
    // Determine product type
    if (data.ProductRTCID && data.ProductRTCID > 0) {
      this.currentProductType = ProductType.PRODUCT_RTC;
    } else {
      this.currentProductType = ProductType.PRODUCT_SALE;
    }
    
    this.isLoadingData = true;
    
    // Build form value
    const formValue: any = {
      CustomerID: data.CustomerID ?? 0,
      Maker: data.Manufacturer ?? '',
      StatusRequest: data.StatusRequest ?? 0,
      ProductName: data.ProductName ?? '',
      EmployeeRequestID: data.EmployeeID ?? 0,
      EmployeeBuyID: data.EmployeeIDRequestApproved ?? 0,
      DateRequest: data.DateRequest ?? null,
      DateReturnExpected: data.DateReturnExpected ?? null,
      UnitPrice: data.UnitPrice ?? 0,
      TotalPrice: data.TotalPrice ?? 0,
      Quantity: data.Quantity ?? 0,
      SupplierSaleID: data.SupplierSaleID ?? 0,
      TotalPriceExchange: data.TotalPriceExchange ?? 0,
      TotalMoneyVAT: data.TotaMoneyVAT ?? 0,
      CurrencyID: data.CurrencyID ?? 0,
      HistoryPrice: data.HistoryPrice ?? 0,
      CurrencyRate: data.CurrencyRate ?? 0,
      VAT: data.VAT ?? 0,
      UnitFactoryExportPrice: data.UnitFactoryExportPrice ?? 0,
      UnitImportPrice: data.UnitImportPrice ?? 0,
      TotalImportPrice: data.TotalImportPrice ?? 0,
      Note: data.Note ?? '',
      LeadTime: data.TotalDayLeadTime ?? 0,
      IsImport: data.IsImport ?? false,
    };
    
    // Set specific fields based on type
    if (this.currentProductType === ProductType.PRODUCT_RTC) {
      formValue.ProductRTCID = data.ProductRTCID ?? 0;
      formValue.ProductCode = data.ProductCode ?? '';
      formValue.ProductGroupRTCID = data.ProductGroupRTCID ?? 0;
      formValue.TicketType = data.TicketType ?? 0;
      formValue.DateReturnEstimated = data.DateReturnEstimated ?? null;
      formValue.EmployeeApproveID = data.EmployeeApproveID ?? 0;
      
      // Map Maker to FirmID
      if (data.Maker) {
        const firm = this.firms.find(f => f.FirmName === data.Maker);
        formValue.FirmID = firm?.ID ?? 0;
      } else {
        formValue.FirmID = 0;
      }
      
      // Map UnitName to UnitCountID
      if (data.UnitName) {
        const unit = this.unitCounts.find(u => u.UnitCountName === data.UnitName);
        formValue.UnitCountID = unit?.ID ?? 0;
      } else {
        formValue.UnitCountID = 0;
      }
      
      // Clear ProductSale fields
      formValue.ProductSaleID = 0;
      formValue.Unit = '';
      formValue.ProductGroupID = 0;
    } else {
      formValue.ProductSaleID = data.ProductSaleID ?? 0;
      formValue.Unit = data.UnitName ?? '';
      formValue.ProductGroupID = data.ProductGroupID ?? 0;
      
      // Clear ProductRTC fields
      formValue.ProductRTCID = 0;
      formValue.ProductCode = '';
      formValue.FirmID = 0;
      formValue.UnitCountID = 0;
      formValue.ProductGroupRTCID = 0;
      formValue.TicketType = 0;
      formValue.DateReturnEstimated = null;
      formValue.EmployeeApproveID = 0;
    }
    
    this.validateForm.setValue(formValue);
    
    setTimeout(() => {
      this.isLoadingData = false;
    }, 100);
  } else {
    // New record
    this.validateForm.patchValue({
      DateRequest: new Date(),
      TicketType: 0,
    });
    
    if (this.productRTCID > 0) {
      this.validateForm.patchValue({
        ProductRTCID: this.productRTCID
      });
    }
  }
}
```

### 6.6. Update onSave()

Thêm validation cho ProductRTC:

```typescript
onSave() {
  this.validateForm.markAllAsTouched();
  this.validateForm.updateValueAndValidity();
  
  if (this.validateForm.invalid) {
    return;
  }
  
  let data = this.validateForm.getRawValue();
  
  // ProductRTC specific validation
  if (this.currentProductType === ProductType.PRODUCT_RTC) {
    if (!data.ProductCode || data.ProductCode.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập mã sản phẩm!');
      return;
    }
    
    if (data.FirmID <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn hãng!');
      return;
    }
    
    if (data.UnitCountID <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn đơn vị tính!');
      return;
    }
    
    if (data.ProductGroupRTCID <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn loại kho!');
      return;
    }
    
    // Validate Phiếu mượn
    if (data.TicketType === 1) {
      if (data.EmployeeApproveID <= 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn người duyệt!');
        return;
      }
      
      if (data.SupplierSaleID <= 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhà cung cấp!');
        return;
      }
    }
  }
  
  // ProductSale validation (existing)
  if (this.currentProductType === ProductType.PRODUCT_SALE) {
    if (this.projectPartlistDetail?.ID <= 0 && data.EmployeeBuyID <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn người mua');
      return;
    }
  }
  
  // Common deadline validation (existing code)
  if (!this.IsTechBought) {
    // ... existing deadline validation code ...
  }
  
  // Build model
  const model = this.buildSaveModel(data);
  
  // Save
  this.projectPartlistPurchaseRequestService.saveDataDetail(model).subscribe({
    next: (response: any) => {
      this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công!');
      this.activeModal.dismiss();
    },
    error: (error) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    },
  });
}

buildSaveModel(data: any): any {
  const baseModel = {
    ID: this.projectPartlistDetail?.ID ?? 0,
    ProductName: data.ProductName,
    EmployeeID: data.EmployeeRequestID,
    EmployeeIDRequestApproved: data.EmployeeBuyID,
    DateRequest: data.DateRequest,
    DateReturnExpected: data.DateReturnExpected,
    Quantity: data.Quantity,
    CurrencyID: data.CurrencyID,
    CurrencyRate: data.CurrencyRate,
    UnitPrice: data.UnitPrice,
    TotalPrice: data.TotalPrice,
    HistoryPrice: data.HistoryPrice,
    TotalPriceExchange: data.TotalPriceExchange,
    VAT: data.VAT,
    TotaMoneyVAT: data.TotalMoneyVAT,
    SupplierSaleID: data.SupplierSaleID,
    UnitFactoryExportPrice: data.UnitFactoryExportPrice,
    UnitImportPrice: data.UnitImportPrice,
    TotalImportPrice: data.TotalImportPrice,
    TotalDayLeadTime: data.LeadTime,
    IsImport: data.IsImport,
    Note: data.Note,
    IsTechBought: this.IsTechBought,
    ProjectPartListID: this.projectPartlistDetail?.ProjectPartListID ?? 0,
  };
  
  if (this.currentProductType === ProductType.PRODUCT_RTC) {
    const selectedProduct = this.productsRTC.find(p => p.ID === data.ProductRTCID);
    const selectedFirm = this.firms.find(f => f.ID === data.FirmID);
    const selectedUnit = this.unitCounts.find(u => u.ID === data.UnitCountID);
    
    return {
      ...baseModel,
      ProductRTCID: data.ProductRTCID,
      ProductCode: data.ProductCode || selectedProduct?.ProductCode || '',
      ProductGroupRTCID: data.ProductGroupRTCID,
      Maker: selectedFirm?.FirmName || '',
      UnitName: selectedUnit?.UnitCountName || '',
      TicketType: data.TicketType,
      DateReturnEstimated: data.DateReturnEstimated,
      EmployeeApproveID: data.EmployeeApproveID,
      ApprovedTBP: data.EmployeeApproveID,
      // Clear ProductSale fields
      ProductSaleID: null,
      ProductGroupID: null,
    };
  } else {
    const selectedProduct = this.products.find(p => p.ID === data.ProductSaleID);
    
    return {
      ...baseModel,
      ProductSaleID: data.ProductSaleID,
      ProductCode: selectedProduct?.ProductCode || '',
      ProductGroupID: data.ProductGroupID,
      // Clear ProductRTC fields
      ProductRTCID: null,
      ProductGroupRTCID: null,
      TicketType: null,
      DateReturnEstimated: null,
      EmployeeApproveID: null,
    };
  }
}
```

---

## 📋 SUMMARY

### **Những thay đổi chính:**

1. **Row 1:** Maker field có 2 version (text input cho ProductSale, dropdown cho ProductRTC)
2. **Row 2:** Product selection, Unit, ProductGroup có conditional rendering
3. **Row mới:** Thêm row cho ProductRTC specific fields (ProductCode, TicketType, EmployeeApprove)
4. **Form Controls:** Thêm fields mới cho ProductRTC
5. **Methods:** Thêm các methods load data và handle events cho ProductRTC
6. **Validation:** Thêm validation riêng cho ProductRTC

### **Ưu điểm của cách này:**

✅ Tận dụng tối đa HTML template hiện có  
✅ Thay đổi tối thiểu, dễ review  
✅ Conditional rendering rõ ràng với *ngIf  
✅ Giữ nguyên layout và styling  
✅ Dễ test và debug  

### **Cách sử dụng:**

```typescript
// Open for ProductSale (existing)
const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
  size: 'xl',
  backdrop: 'static',
});
modalRef.componentInstance.projectPartlistDetail = detail;
modalRef.componentInstance.productType = ProductType.PRODUCT_SALE;

// Open for ProductRTC (new)
const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
  size: 'xl',
  backdrop: 'static',
});
modalRef.componentInstance.productRTCID = productRTCID;
modalRef.componentInstance.productType = ProductType.PRODUCT_RTC;
```

Bạn có muốn tôi tạo file HTML hoàn chỉnh với tất cả các thay đổi không?
