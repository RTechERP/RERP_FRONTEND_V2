import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ProjectService } from '../../../../project-service/project.service';
import { ProjectPartListService } from '../project-partlist-service/project-part-list-service.service';
import { CurrencyService } from '../../../../../general-category/currency-list/currency.service';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { AuthService } from '../../../../../../auth/auth.service';

@Component({
  selector: 'app-project-partlist-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzTabsModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzGridModule,
    NzAutocompleteModule,
    NzModalModule
  ],
  templateUrl: './project-partlist-detail.component.html',
  styleUrl: './project-partlist-detail.component.css'
})
export class ProjectPartlistDetailComponent implements OnInit, AfterViewInit {
  @Input() selectedData: any[] = [];
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  @Input() type: number = 0;
  @Input() versionPOID: number = 0;
  @Input() CodeName: string = '';
  @Input() projectTypeName: string = '';
  @Input() projectSolutionId: number = 0;

  formGroup: FormGroup;
  currentTab: number = 0;

  // Dropdown data
  projects: any[] = [];
  versions: any[] = [];
  products: any[] = [];
  specialCodes: any[] = [];
  currencies: any[] = [];
  suppliers: any[] = [];
  employees: any[] = [];
  statuses: any[] = [];

  unitData: any[] = [];
  
  // Autocomplete suggestions
  productNameSuggestions: string[] = [];
  makerSuggestions: string[] = [];
  productNameOptions: string[] = [];
  makerOptions: string[] = [];

  currentUser: any;
  isDisabled: boolean = false;
  currentIsApprovedTBP: boolean = false; // Lưu trữ giá trị IsApprovedTBP hiện tại
  currentPartListId: number = 0; // Lưu trữ ID của partlist đang edit
  
  // Regex pattern cho TT
  private regexTT = /^\d+(\.\d+)*$/;
  
  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private projectPartListService: ProjectPartListService,
    private currencyService: CurrencyService,
    private notification: NzNotificationService,
    private authService: AuthService,
    private modal: NzModalService
  ) {
    this.formGroup = this.fb.group({
      // Tab 1: Thông tin chung
      projectId: [null, [Validators.required]],
      versionId: [null, [Validators.required]],
      tt: [null, [Validators.required, this.ttPatternValidator.bind(this)]],
      productCode: ['', [Validators.required]],
      specialCode: [''],
      isDeleted: [false],
      productName: [''],
      maker: ['', [Validators.required]],
      technicalInfo: [''],
      qtyMin: [0, [Validators.min(0)]],
      qtyFull: [0, [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required]],
      employeeId: [null],
      isProblem: [false],
      reasonProblem: [''],
      note: [''],

      // Tab 2: Thông tin báo giá
      supplierQuoteId: [null],
      ncc: [''], // Tên nhà cung cấp (báo giá)
      unitPriceQuote: [0],
      totalPriceQuote: [0],
      currencyQuote: [null],
      leadTimeQuote: [''],

      // Tab 3: Thông tin đặt mua
      billCodePurchase: [''],
      supplierPurchaseId: [null],
      nccFinal: [''], // Tên nhà cung cấp (đặt mua)
      unitPricePurchase: [0],
      totalPricePurchase: [0],
      currencyPurchase: [null],
      leadTimePurchase: [''],
      requestDate: [null],
      expectedDateReturn: [null],
      startPurchaseDate: [null],
      receiveDate: [null],
      quantityReturn: [0],
      statusId: [null],
      quality: ['']
    });

    // Update autocomplete options when input changes
    this.formGroup.get('productName')?.valueChanges.subscribe((value: string) => {
      this.productNameOptions = this.getProductNameOptions(value || '');
    });

    this.formGroup.get('maker')?.valueChanges.subscribe((value: string) => {
      this.makerOptions = this.getMakerOptions(value || '');
    });

    // Listen to isProblem checkbox changes để update qtyMin/qtyFull state
    this.formGroup.get('isProblem')?.valueChanges.subscribe((isProblem: boolean) => {
      this.updateQtyFieldsState(isProblem, this.currentIsApprovedTBP);
    });

    // Format qtyMin and qtyFull to integer (vì bước nhảy là 1)
    this.formGroup.get('qtyMin')?.valueChanges.subscribe((value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const formatted = Math.round(numValue);
          if (formatted !== numValue) {
            this.formGroup.get('qtyMin')?.setValue(formatted, { emitEvent: false });
          }
        }
      }
    });

    this.formGroup.get('qtyFull')?.valueChanges.subscribe((value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const formatted = Math.round(numValue);
          if (formatted !== numValue) {
            this.formGroup.get('qtyFull')?.setValue(formatted, { emitEvent: false });
          }
        }
      }
    });

    // Tự động fill tên nhà cung cấp khi chọn supplier (Tab 2: Báo giá)
    this.formGroup.get('supplierQuoteId')?.valueChanges.subscribe((supplierId: number | null) => {
      if (supplierId && this.suppliers && this.suppliers.length > 0) {
        const supplier = this.suppliers.find(s => s.ID === supplierId);
        if (supplier) {
          const supplierName = supplier.CodeNCC || supplier.NameNCC || supplier.Code || '';
          this.formGroup.patchValue({ ncc: supplierName }, { emitEvent: false });
        } else {
          this.formGroup.patchValue({ ncc: '' }, { emitEvent: false });
        }
      } else {
        this.formGroup.patchValue({ ncc: '' }, { emitEvent: false });
      }
    });

    // Tự động fill tên nhà cung cấp khi chọn supplier (Tab 3: Đặt mua)
    this.formGroup.get('supplierPurchaseId')?.valueChanges.subscribe((supplierId: number | null) => {
      if (supplierId && this.suppliers && this.suppliers.length > 0) {
        const supplier = this.suppliers.find(s => s.ID === supplierId);
        if (supplier) {
          const supplierName = supplier.CodeNCC || supplier.NameNCC || supplier.Code || '';
          this.formGroup.patchValue({ nccFinal: supplierName }, { emitEvent: false });
        } else {
          this.formGroup.patchValue({ nccFinal: '' }, { emitEvent: false });
        }
      } else {
        this.formGroup.patchValue({ nccFinal: '' }, { emitEvent: false });
      }
    });

  }

  ngOnInit(): void {
    this.getCurrentUser();
    // Load initial data if projectId provided
    if (this.projectId > 0) {
      this.formGroup.patchValue({ projectId: this.projectId });
    }
    
    // Load versions nếu đã có projectSolutionId và versionPOID
    if (this.projectSolutionId > 0) {
      // Load versions sẽ được gọi trong loadInitialData
    }

    // Subscribe to projectId changes
    this.formGroup.get('projectId')?.valueChanges.subscribe((projectId: number) => {
      this.onProjectChange(projectId);
    });
  }

  ngAfterViewInit(): void {
    this.loadInitialData();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.currentUser = response.data;
      },
      error: (error: any) => {
        console.error('Error loading current user:', error);
      }
      })
  } 
  loadInitialData(): void {
    this.getProjects();
    this.getCurrencies();
    this.getSuppliers();
    this.getEmployees();
    this.getStatuses();
    this.getUnitCount();
    this.loadSuggestions();

    // Load versions nếu đã có projectSolutionId
    if (this.projectSolutionId > 0) {
      this.loadVersions(this.projectSolutionId);
    }

    // If selectedData provided, load first item data
    if (this.selectedData && this.selectedData.length > 0) {
      this.loadSelectedData(this.selectedData[0]);
    } else {
      // Thêm mới - enable button Save
      this.isDisabled = false;
      
      if (this.projectId > 0) {
        // Nếu không có selectedData nhưng có projectId, set projectId vào form
        this.formGroup.patchValue({ projectId: this.projectId });
        
        // Load versions nếu có projectSolutionId
        if (this.projectSolutionId > 0) {
          this.loadVersions(this.projectSolutionId);
        }
        
        // Set versionId nếu có versionPOID
        if (this.versionPOID > 0) {
          this.formGroup.patchValue({ versionId: this.versionPOID });
        }
      }
    }
  }

  loadSelectedData(data: any): void {
    console.log("data", data);
    // Lưu ID của partlist đang edit
    this.currentPartListId = data.ID || 0;
    
    this.formGroup.patchValue({
      projectId: this.projectId || null, // mã dự án
      versionId: this.versionPOID || null, // mã phiên bản
      productCode: data.ProductCode || '', // mã sản phẩm
      productName: data.ProductName || '', // tên sản phẩm
      maker: data.Maker || '', // nhà sản xuất
      qtyFull: data.Qty || 0, // số lượng
      qtyMin: data.QtyMin || 0, // số lượng tối thiểu
      tt: data.TT || null, 
      specialCode: data.SpecialCode || '', // mã đặc biệt
      isDeleted: data.IsDeleted || false, // trạng thái xóa
      technicalInfo: data.Model || '', // thông tin kỹ thuật
      unit: data.Unit || '', // đơn vị
      employeeId: data.EmployeeID || null, // mã nhân viên
      isProblem: data.IsProblem || false, // trạng thái vấn đề
      reasonProblem: data.ReasonProblem || '', // lý do vấn đề
      note: data.Note || '', // ghi chú
      // Tab 2: Thông tin báo giá
      supplierQuoteId: data.SupplierSaleID || null, // nhà cung cấp
      ncc: data.NCC || '', // tên nhà cung cấp (báo giá)
      unitPriceQuote: data.Price || 0, // đơn giá
      totalPriceQuote: data.Amount || 0, // thành tiền
      currencyQuote: data.UnitMoney || null, // loại tiền
      leadTimeQuote: data.LeadTime || "", // thời gian giao hàng
      // Tab 3: Thông tin đặt mua
      billCodePurchase: data.OrderCode || '', // mã đơn hàng
      supplierPurchaseId: data.SupplierSaleID || null, // nhà cung cấp
      nccFinal: data.NCCFinal || '', // tên nhà cung cấp (đặt mua)
      unitPricePurchase: data.PriceOrder || "", // đơn giá
      totalPricePurchase: data.TotalPriceOrder || 0, // thành tiền
      currencyPurchase: data.UnitMoney || null, // loại tiền
      leadTimePurchase: data.LeadTime || "", // thời gian giao hàng
      requestDate: data.RequestDate || null, // ngày yêu cầu
      expectedDateReturn: data.ExpectedReturnDateDate || null, // ngày dự kiến trả hàng
      startPurchaseDate: data.OrderDate || null, // ngày bắt đầu đặt hàng
      receiveDate: data.RequestDate || null, // ngày nhận hàng
      // quantityReturn: data.QuantityReturn || 0, // số lượng trả hàng
      statusId: data.Status || null, // trạng thái
      quality: data.Quality || '' // chất lượng
    });

    // Load versions based on projectSolutionId
    if (this.projectSolutionId > 0) {
      this.loadVersions(this.projectSolutionId);
    }

    // Lưu trữ giá trị IsApprovedTBP để dùng khi isProblem thay đổi
    this.currentIsApprovedTBP = data.IsApprovedTBP === true || data.IsApprovedTBP === 1;

    // Logic enable/disable qtyMin and qtyFull theo WinForm
    this.updateQtyFieldsState(data.IsProblem || false, this.currentIsApprovedTBP);
    
    // Logic disable button Save theo WinForm: !(IsApprovedTBP == true || IsApprovedTBPNewCode == true)
    const isApprovedTBP = data.IsApprovedTBP === true || data.IsApprovedTBP === 1;
    const isApprovedTBPNewCode = data.IsApprovedTBPNewCode === true || data.IsApprovedTBPNewCode === 1;
    const IsCheckPrice = data.IsCheckPrice;
    const StatusRequest = data.StatusRequest;
    if(isApprovedTBP || isApprovedTBPNewCode || IsCheckPrice || StatusRequest===2 || StatusRequest===3){
      this.isDisabled = true;
    }else{
      this.isDisabled = false;
    }
  }

  // Method để update state của qtyMin và qtyFull
  updateQtyFieldsState(isProblem: boolean, isApprovedTBP: boolean): void {
    const isAdmin = this.currentUser?.IsAdmin || false;
    
    // Logic theo WinForm:
    // 1. Nếu isProblem == true && !IsAdmin → Enable
    // 2. Nếu isApprovedTBP == true && !IsAdmin → Disable
    if (isProblem && !isAdmin) {
      this.formGroup.get('qtyMin')?.enable();
      this.formGroup.get('qtyFull')?.enable();
    } else if (isApprovedTBP && !isAdmin) {
      this.formGroup.get('qtyMin')?.disable();
      this.formGroup.get('qtyFull')?.disable();
    } else {
      // Mặc định enable nếu không có điều kiện nào
      this.formGroup.get('qtyMin')?.enable();
      this.formGroup.get('qtyFull')?.enable();
    }
  }

  getProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data || response || [];
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
      }
    });
  }

  loadVersions(projectSolutionId: number): void {
    if (!projectSolutionId || projectSolutionId <= 0) return;

    // Load versions using get-cbb-version API endpoint
    this.projectPartListService.getCbbVersion(projectSolutionId).subscribe({
      next: (response: any) => {
        // Handle response structure - check if it's wrapped in data property
        if (response.status === 1 && response.data) {
          this.versions = response.data || [];
        } else if (Array.isArray(response)) {
          this.versions = response;
        } else if (response.data) {
          this.versions = response.data;
        } else {
          this.versions = [];
        }
        
        // Set default version if versionPOID provided
        if (this.versionPOID > 0) {
          this.formGroup.patchValue({ versionId: this.versionPOID });
        }
      },
      error: (error: any) => {
        console.error('Error loading versions:', error);
        this.versions = [];
        this.notification.error('Lỗi', 'Không thể tải danh sách phiên bản. Vui lòng thử lại!');
      }
    });
  }

  getCurrencies(): void {
    this.currencyService.getAll().subscribe({
      next: (response: any) => {
        // Handle response structure - check if it's wrapped in data property
        if (response.status === 1 && response.data) {
          this.currencies = response.data || [];
        } else if (Array.isArray(response)) {
          this.currencies = response;
        } else if (response.data) {
          this.currencies = response.data;
        } else {
          this.currencies = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading currencies:', error);
        this.currencies = [];
        this.notification.error('Lỗi', 'Không thể tải danh sách loại tiền. Vui lòng thử lại!');
      }
    });
  }

  getSuppliers(): void {
    this.projectService.getSupplierSales().subscribe({
      next: (response: any) => {
        this.suppliers = response.data || response || [];
      },
      error: (error: any) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  getEmployees(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        const data = response.data || response || [];
        this.employees = this.projectService.createdDataGroup(data, 'DepartmentName');
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  getStatuses(): void {
    // Load purchase statuses - adjust based on your actual API
    this.statuses = [
      { ID: 1, StatusName: 'Chưa đặt hàng' },
      { ID: 2, StatusName: 'Đã về' },
      { ID: 3, StatusName: 'Đã đặt hàng' },
      { ID: 4, StatusName: 'Không đặt hàng' }
    ];
  }

  getUnitCount(): void {
    this.projectPartListService.getUnitCount().subscribe({
      next: (response: any) => {
        // Handle response structure - check if it's wrapped in data property
        if (response.status === 1 && response.data) {
          this.unitData = response.data || [];
        } else if (Array.isArray(response)) {
          this.unitData = response;
        } else if (response.data) {
          this.unitData = response.data;
        } else {
          this.unitData = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading unit count:', error);
        this.unitData = [];
        this.notification.error('Lỗi', 'Không thể tải danh sách đơn vị tính. Vui lòng thử lại!');
      }
    });
  }

  loadSuggestions(): void {
    this.projectPartListService.getSuggestions().subscribe({
      next: (response: any) => {
        // Handle response structure: { status: 1, data: { ProductNames: [...], Makers: [...] } }
        if (response.status === 1 && response.data) {
          // API trả về data.ProductNames và data.Makers đã là arrays
          const productNames = response.data.ProductNames || [];
          const makers = response.data.Makers || [];

          // Filter và sort, loại bỏ null/undefined/empty strings
          this.productNameSuggestions = productNames
            .filter((name: any) => name && typeof name === 'string' && name.trim())
            .map((name: string) => name.trim())
            .sort();

          this.makerSuggestions = makers
            .filter((maker: any) => maker && typeof maker === 'string' && maker.trim())
            .map((maker: string) => maker.trim())
            .sort();
        } else {
          // Fallback nếu cấu trúc response khác
          this.productNameSuggestions = [];
          this.makerSuggestions = [];
        }
        
        // Initialize options with current form values
        const currentProductName = this.formGroup.get('productName')?.value || '';
        const currentMaker = this.formGroup.get('maker')?.value || '';
        this.productNameOptions = this.getProductNameOptions(currentProductName);
        this.makerOptions = this.getMakerOptions(currentMaker);
      },
      error: (error: any) => {
        console.error('Error loading suggestions:', error);
        // Don't show error notification for suggestions as it's not critical
        this.productNameSuggestions = [];
        this.makerSuggestions = [];
        this.productNameOptions = [];
        this.makerOptions = [];
      }
    });
  }

  // Filter suggestions based on input value
  getProductNameOptions(value: string): string[] {
    if (!value || value.trim() === '') {
      return this.productNameSuggestions.slice(0, 10); // Limit to 10 items when empty
    }
    const filterValue = value.toLowerCase();
    return this.productNameSuggestions
      .filter(option => option.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limit to 10 items
  }

  getMakerOptions(value: string): string[] {
    if (!value || value.trim() === '') {
      return this.makerSuggestions.slice(0, 10); // Limit to 10 items when empty
    }
    const filterValue = value.toLowerCase();
    return this.makerSuggestions
      .filter(option => option.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limit to 10 items
  }


  // Format số tiền với dấu phẩy ngăn cách hàng nghìn
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Parse số tiền từ chuỗi có dấu phẩy
  parseCurrency(value: string): number {
    if (!value) {
      return 0;
    }
    const numValue = parseFloat(value.replace(/,/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  }

  onProjectChange(projectId: number): void {
    // Khi thay đổi project, cần load lại solution để lấy projectSolutionId
    // Sau đó mới load versions
    if (projectId && projectId > 0) {
      // TODO: Load solution từ projectId để lấy projectSolutionId
      // Tạm thời: nếu đã có projectSolutionId thì dùng, không thì load lại
      if (this.projectSolutionId > 0) {
        this.loadVersions(this.projectSolutionId);
      } else {
        // Load solution để lấy projectSolutionId
        // Note: Cần có service để load solution từ projectId
        this.versions = [];
        this.formGroup.patchValue({ versionId: null });
      }
    } else {
      this.versions = [];
      this.formGroup.patchValue({ versionId: null });
    }
  }

  calculateTotalQuote(): void {
    const unitPrice = this.formGroup.get('unitPriceQuote')?.value || 0;
    const qty = this.formGroup.get('qtyFull')?.value || 0;
    const total = unitPrice * qty;
    this.formGroup.patchValue({ totalPriceQuote: total }, { emitEvent: false });
  }

  calculateTotalPurchase(): void {
    const unitPrice = this.formGroup.get('unitPricePurchase')?.value || 0;
    const qty = this.formGroup.get('qtyFull')?.value || 0;
    const total = unitPrice * qty;
    this.formGroup.patchValue({ totalPricePurchase: total }, { emitEvent: false });
  }

  onChangeTab(index: number): void {
    this.currentTab = index;
  }

  // Custom validator cho TT pattern
  ttPatternValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }
    const value = control.value.toString().trim();
    if (value && !this.regexTT.test(value)) {
      return { ttPattern: true };
    }
    return null;
  }


  getFieldError(fieldName: string): string | undefined {
    const control = this.formGroup.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        if (fieldName === 'unit') {
          return 'Đơn vị không được để trống!';
        }
        if (fieldName === 'maker') {
          return 'Hãng sản xuất không được để trống!';
        }
        return 'Trường này là bắt buộc!';
      }
      if (control.errors?.['ttPattern']) {
        return 'TT phải có định dạng số (ví dụ: 1, 1.1, 1.1.1, ...)!';
      }
      if (control.errors?.['min']) {
        if (fieldName === 'qtyMin' || fieldName === 'qtyFull') {
          return 'Số lượng phải lớn hơn hoặc bằng 0!';
        }
        return 'Giá trị phải lớn hơn hoặc bằng 0!';
      }
    }
    return undefined;
  }

  validateForm(): boolean {
    if (this.currentTab === 0) {
      // Validate tab 1
      const requiredFields = ['projectId', 'versionId', 'tt', 'productCode', 'unit', 'maker'];
      const invalidFields = requiredFields.filter(key => {
        const control = this.formGroup.get(key);
        return !control || control.invalid || control.value === null || control.value === '';
      });

      if (invalidFields.length > 0) {
        this.formGroup.markAllAsTouched();
        
        // Kiểm tra lỗi cụ thể cho TT
        const ttControl = this.formGroup.get('tt');
        if (ttControl?.errors?.['ttPattern']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'TT phải có định dạng số (ví dụ: 1, 1.1, 1.1.1, ...)!');
          return false;
        }
        
        // Kiểm tra lỗi cho Unit
        const unitControl = this.formGroup.get('unit');
        if (unitControl?.errors?.['required']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Đơn vị không được để trống!');
          return false;
        }
        
        // Kiểm tra lỗi cho Maker
        const makerControl = this.formGroup.get('maker');
        if (makerControl?.errors?.['required']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Hãng sản xuất không được để trống!');
          return false;
        }
        
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ các trường bắt buộc!');
        return false;
      }

      // Validate qtyMin và qtyFull - chỉ validate nếu không có giá trị hoặc < 0
      const qtyMinControl = this.formGroup.get('qtyMin');
      const qtyFullControl = this.formGroup.get('qtyFull');
      
      if (qtyMinControl?.invalid) {
        this.formGroup.markAllAsTouched();
        if (qtyMinControl.errors?.['min']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng/1 máy phải lớn hơn hoặc bằng 0!');
          return false;
        }
      }
      
      if (qtyFullControl?.invalid) {
        this.formGroup.markAllAsTouched();
        if (qtyFullControl.errors?.['required']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng tổng không được để trống!');
          return false;
        }
        if (qtyFullControl.errors?.['min']) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng tổng phải lớn hơn hoặc bằng 0!');
          return false;
        }
      }
    }
    return true;
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  saveData(): void {
    if (!this.validateForm()) {
      return;
    }

    // Prepare data to save - Map từ form sang model ProjectPartList
    const formValue = this.formGroup.getRawValue();
    
    // Map dữ liệu theo model ProjectPartList
    const dataToSave: any = {
      // ID - nếu đang edit thì có ID, thêm mới thì = 0
      ID: this.currentPartListId || 0,
      
      // Tab 1: Thông tin chung
      ProjectID: formValue.projectId || null,
      ProjectPartListVersionID: formValue.versionId || null,
      TT: formValue.tt?.trim() || null,
      ProductCode: formValue.productCode?.trim() || null,
      SpecialCode: formValue.specialCode?.trim() || null,
      GroupMaterial: formValue.productName?.trim() || null,
      Manufacturer: formValue.maker?.trim() || null,
      Model: formValue.technicalInfo?.trim() || null,
      QtyMin: formValue.qtyMin || 0,
      QtyFull: formValue.qtyFull || 0,
      Unit: formValue.unit?.trim()?.toUpperCase() || null,
      EmployeeID: formValue.employeeId || null,
      IsProblem: formValue.isProblem || false,
      ReasonProblem: formValue.reasonProblem?.trim() || null,
      Note: formValue.note?.trim() || null,
      IsDeleted: formValue.isDeleted || false,

      // Tab 2: Thông tin báo giá
      SupplierSaleID: formValue.supplierQuoteId || null,
      Price: formValue.unitPriceQuote || 0,
      Amount: formValue.totalPriceQuote || 0,
      // UnitMoney và LeadTime: ưu tiên Tab 3, nếu không có thì dùng Tab 2
      UnitMoney: formValue.currencyPurchase || formValue.currencyQuote || null,
      LeadTime: formValue.leadTimePurchase?.toString() || formValue.leadTimeQuote?.toString() || null,

      // Tab 3: Thông tin đặt mua
      OrderCode: formValue.billCodePurchase?.trim() || null,
      SuplierSaleFinalID: formValue.supplierPurchaseId || null,
      PriceOrder: formValue.unitPricePurchase || 0,
      TotalPriceOrder: formValue.totalPricePurchase || 0,
      RequestDate: formValue.requestDate ? DateTime.fromJSDate(new Date(formValue.requestDate)).toISO() : null,
      ExpectedReturnDate: formValue.expectedDateReturn ? DateTime.fromJSDate(new Date(formValue.expectedDateReturn)).toISO() : null,
      OrderDate: formValue.startPurchaseDate ? DateTime.fromJSDate(new Date(formValue.startPurchaseDate)).toISO() : null,
      ReturnDate: formValue.receiveDate ? DateTime.fromJSDate(new Date(formValue.receiveDate)).toISO() : null,
      QuantityReturn: formValue.quantityReturn || 0,
      Status: formValue.statusId || null,
      Quality: formValue.quality?.trim() || null
    };
    console.log("dataToSave", dataToSave);
    // Gọi API để lưu dữ liệu
    this.executeSave(dataToSave, false);
  }

  // Hàm thực hiện lưu dữ liệu
  executeSave(dataToSave: any, overrideFix: boolean = false): void {
    this.projectPartListService.saveProjectPartListData(dataToSave, overrideFix).subscribe({
      next: (response: any) => {
        // Kiểm tra nếu có lỗi ValidateFixProduct (status = 0 hoặc success = false)
        if (response.status === 0 || response.success === false) {
          // Hiển thị modal xác nhận với 3 options
          this.showValidateFixProductModal(response.message || 'Có lỗi xảy ra khi lưu dữ liệu!', dataToSave);
          return;
        }

        // Lưu thành công
        if (response.status === 1 || response.success) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu dữ liệu thành công!');
          this.activeModal.close({ success: true, data: response.data || dataToSave });
        } else {
          // Hiển thị lỗi từ server (validation errors khác)
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lưu dữ liệu thất bại!');
        }
      },
      error: (error: any) => {
        console.error('Error saving data:', error);
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  // Hiển thị modal xác nhận khi có lỗi ValidateFixProduct
  showValidateFixProductModal(errorMessage: string, dataToSave: any): void {
    const modalRef = this.modal.create({
      nzTitle: 'Xác nhận',
      nzContent: `
        <div>
          <p style="margin-bottom: 10px; white-space: pre-line;">${errorMessage}</p>
          <p><strong>Bạn có muốn cập nhật dữ liệu theo tích xanh? </strong></p>
        </div>
      `,
      nzFooter: [
        {
          label: 'Đồng ý',
          type: 'primary',
          onClick: () => {
            modalRef.close();
            this.activeModal.dismiss();
          }
        },
        {
          label: 'Không',
          nzType: 'warning',
          onClick: () => {
            modalRef.close();
            this.executeSave(dataToSave, true);
          }
        },
        {
          label: 'Hủy',
          onClick: () => {
            // Cancel: Giữ lại form (không làm gì)
            modalRef.close();
          }
        }
      ]
    });
  }
}
