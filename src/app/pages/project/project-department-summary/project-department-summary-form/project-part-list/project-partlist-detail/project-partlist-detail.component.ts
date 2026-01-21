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
  disableReason: string = ''; // Lý do không thể sửa vật tư
  disableMainReason: string = ''; // Lý do chính không thể sửa
  currentIsApprovedTBP: boolean = false; // Lưu trữ giá trị IsApprovedTBP hiện tại
  currentPartListId: number = 0; // Lưu trữ ID của partlist đang edit
  hasDataChanged: boolean = false; // Flag để track xem có thay đổi dữ liệu hay không (mã đặc biệt)
  isParentNode: boolean = false; // Flag xác định đây là node cha (không có ProductCode) - không cần validate mã TB, hãng SX, đơn vị

  diffDataIsFix: any = {};
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

    // Không cần auto-detect isParentNode nữa
    // isParentNode được xác định từ data.__hasChildren khi loadSelectedData

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

    // Xác định node cha hay node con dựa vào __hasChildren
    // Node cha: có __hasChildren = true - KHÔNG validate productCode/maker/unit
    // Node con: không có __hasChildren hoặc = false - VALIDATE đầy đủ
    this.isParentNode = !!(data.__hasChildren === true);

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
      isProblem: data.IsProblem || false, // có vấn đề
      reasonProblem: data.ReasonProblem || '', // lý do vấn đề
      note: data.Note || '', // ghi chú

      // Thông tin báo giá
      supplierQuoteId: data.SupplierQuoteID || null,
      ncc: data.Supplier || '',
      unitPriceQuote: data.UnitPriceQuote || 0,
      totalPriceQuote: data.TotalPriceQuote || 0,
      currencyQuote: data.CurrencyIDQuote || null,
      leadTimeQuote: data.LeadTimeQuote || '',

      // Thông tin đặt mua
      billCodePurchase: data.BillCode || '',
      supplierPurchaseId: data.SupplierPurchaseID || null,
      nccFinal: data.SupplierFinal || '',
      unitPricePurchase: data.UnitPrice || 0,
      totalPricePurchase: data.TotalPrice || 0,
      currencyPurchase: data.CurrencyID || null,
      leadTimePurchase: data.LeadTime || '',
      requestDate: data.RequestDate ? new Date(data.RequestDate) : null,
      expectedDateReturn: data.ExpectedDateReturn ? new Date(data.ExpectedDateReturn) : null,
      startPurchaseDate: data.StartPurchaseDate ? new Date(data.StartPurchaseDate) : null,
      receiveDate: data.ReceiveDate ? new Date(data.ReceiveDate) : null,
      quantityReturn: data.QuantityReturn || 0,
      statusId: data.StatusID || null,
      quality: data.Quality || ''
    });

    // Cập nhật validators dựa trên loại node
    this.updateValidatorsBasedOnNodeType();

    // Cập nhật trạng thái của các trường qty
    this.currentIsApprovedTBP = data.IsApprovedTBP || false;
    this.updateQtyFieldsState(data.IsProblem || false, this.currentIsApprovedTBP);

    // Logic disable button Save theo WinForm: !(IsApprovedTBP == true || IsApprovedTBPNewCode == true)
    const isApprovedTBP = data.IsApprovedTBP === true || data.IsApprovedTBP === 1;
    const isApprovedTBPNewCode = data.IsApprovedTBPNewCode === true || data.IsApprovedTBPNewCode === 1;
    // Chuẩn hóa IsCheckPrice về boolean
    const IsCheckPrice = data.IsCheckPrice === true || data.IsCheckPrice === 1 || data.IsCheckPrice === '1';
    const StatusRequest = data.StatusRequest;
    const StatusPriceRequest = data.StatusPriceRequest;

    // Reset disable reason
    this.disableReason = '';

    // Kiểm tra các điều kiện disable và set message tương ứng
    if (isApprovedTBP) {
      this.isDisabled = true;
      this.disableMainReason = 'vật tư đã được duyệt TBP';
      this.disableReason = 'vật tư đã được duyệt TBP (Lưu ý: Bạn vẫn có thể cập nhật mã đặc biệt)';
    } else if (isApprovedTBPNewCode) {
      this.isDisabled = true;
      this.disableMainReason = 'vật tư đã được duyệt mã mới';
      this.disableReason = 'vật tư đã được duyệt mã mới (Lưu ý: Bạn vẫn có thể cập nhật mã đặc biệt)';
    } else if (IsCheckPrice == true && StatusPriceRequest > 0) {
      this.isDisabled = true;
      this.disableMainReason = 'vật tư đã được yêu cầu báo giá';
      this.disableReason = 'vật tư đã được yêu cầu báo giá (Lưu ý: Bạn vẫn có thể cập nhật mã đặc biệt)';
    } else {
      this.isDisabled = false;
      this.disableMainReason = '';
      this.disableReason = '';
    }

    // Hiển thị thông báo nếu vật tư không thể sửa
    if (this.isDisabled && this.disableMainReason) {
      setTimeout(() => {
        // Sử dụng HTML để hiển thị phần lưu ý với chữ nhỏ
        const message = `Vật tư không thể sửa vì ${this.disableMainReason}.`;
        const note = 'Lưu ý: Bạn vẫn có thể cập nhật mã đặc biệt';
        const htmlMessage = `${message}<br/><span style="font-size: 0.75rem; color: #666; display: block; margin-top: 4px;">${note}</span>`;

        // Tạo notification với HTML content (ng-zorro hỗ trợ HTML trong message)
        this.notification.warning(NOTIFICATION_TITLE.warning, htmlMessage);
      }, 300);
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

  // Method để update validators dựa trên loại node (cha/con)
  updateValidatorsBasedOnNodeType(): void {
    const productCodeControl = this.formGroup.get('productCode');
    const makerControl = this.formGroup.get('maker');
    const unitControl = this.formGroup.get('unit');

    if (this.isParentNode) {
      // Node cha: Xóa validators cho productCode, maker, unit
      productCodeControl?.clearValidators();
      makerControl?.clearValidators();
      unitControl?.clearValidators();
    } else {
      // Node con: Thêm validators required
      productCodeControl?.setValidators([Validators.required]);
      makerControl?.setValidators([Validators.required]);
      unitControl?.setValidators([Validators.required]);
    }

    // Update validity để form nhận biết thay đổi
    productCodeControl?.updateValueAndValidity({ emitEvent: false });
    makerControl?.updateValueAndValidity({ emitEvent: false });
    unitControl?.updateValueAndValidity({ emitEvent: false });
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
    debugger;
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
      const formValue = this.formGroup.getRawValue();

      // Sử dụng this.isParentNode đã được set từ __hasChildren
      // KHÔNG check lại productCode ở đây
      const isParentNode = this.isParentNode;

      // Validate tab 1
      // Node cha: Chỉ cần projectId, versionId, tt
      // Node con: Cần thêm productCode, unit, maker
      let requiredFields: string[];
      if (isParentNode) {
        // Node cha - không cần mã thiết bị, hãng sx, đơn vị
        requiredFields = ['projectId', 'versionId', 'tt'];
      } else {
        // Node con - cần đầy đủ
        requiredFields = ['projectId', 'versionId', 'tt', 'productCode', 'unit', 'maker'];
      }

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

        // Chỉ kiểm tra lỗi cho Unit và Maker nếu là node con
        if (!isParentNode) {
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
        }

        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ các trường bắt buộc!');
        return false;
      }

      // Validate qtyMin và qtyFull - chỉ validate cho node con (có dữ liệu)
      if (!isParentNode) {
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
    }
    return true;
  }

  closeModal(): void {
    // Nếu có thay đổi dữ liệu (cập nhật mã đặc biệt), đóng với success để load lại
    if (this.hasDataChanged) {
      this.activeModal.close({ success: true });
    } else {
      // Không có thay đổi, đóng bình thường không load lại
      this.activeModal.dismiss();
    }
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
  // isLeaf = true: Node lá (có ProductCode) - validate đầy đủ
  // isLeaf = false: Node cha - bỏ qua một số validate
  executeSave(dataToSave: any, overrideFix: boolean = false, isConfirm: boolean = false): void {
    if (isConfirm) {
      dataToSave.GroupMaterial = this.diffDataIsFix.ProductName || "";
      dataToSave.Manufacturer = this.diffDataIsFix.Maker || "";
      dataToSave.Unit = this.diffDataIsFix.Unit || "";
    }

    // Xác định isLeaf: Node lá là node có ProductCode (không phải node cha)
    // Node cha thường không có ProductCode hoặc ProductCode rỗng
    const isLeaf = !!(dataToSave.ProductCode && dataToSave.ProductCode.trim() !== '');

    // Sử dụng updateProjectPartList thay vì saveProjectPartListData
    this.projectPartListService.updateProjectPartList(dataToSave, overrideFix, isLeaf).subscribe({
      next: (response: any) => {
        // Kiểm tra nếu có lỗi ValidateFixProduct (status = 0 hoặc success = false)
        if (response.status === 0 || response.success === false) {
          // Hiển thị modal xác nhận với 3 options
          this.diffDataIsFix = response.data;
          console.log("diffDataIsFix", this.diffDataIsFix);
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
            this.executeSave(dataToSave, true, true);
          }
        },
        {
          label: 'Không',
          nzType: 'warning',
          onClick: () => {
            modalRef.close();
            this.executeSave(dataToSave, true, false);
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

  // Method để cập nhật mã đặc biệt riêng
  onSearchSpecialCode(event?: Event): void {
    // Chỉ cho phép cập nhật khi đang ở chế độ sửa
    if (this.currentPartListId === 0 || this.currentPartListId === null) {
      return;
    }

    // Lấy giá trị từ form control
    const specialCodeValue = this.formGroup.get('specialCode')?.value || '';

    // if (!specialCodeValue || specialCodeValue.trim() === '') {
    //   this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mã đặc biệt!');
    //   return;
    // }

    // Ngăn chặn hành vi mặc định nếu là event từ Enter key
    if (event) {
      event.preventDefault();
    }

    // Gọi API mới để cập nhật chỉ mã đặc biệt
    this.projectPartListService.updateSpecialCode(this.currentPartListId, specialCodeValue.trim()).subscribe({
      next: (response: any) => {
        // Kiểm tra response theo format của API
        if (response.status === 0 || response.success === false) {
          const errorMessage = response.message || 'Có lỗi xảy ra khi cập nhật mã đặc biệt!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          return;
        }

        if (response.status === 1 || response.success) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Cập nhật mã đặc biệt thành công!');
          // Cập nhật lại form với giá trị đã trim
          this.formGroup.patchValue({ specialCode: specialCodeValue.trim() }, { emitEvent: false });
          // Đánh dấu đã có thay đổi dữ liệu
          this.hasDataChanged = true;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Cập nhật mã đặc biệt thất bại!');
        }
      },
      error: (error: any) => {
        console.error('Error updating special code:', error);
        // Xử lý lỗi từ API - có thể là BadRequest với message trong error.error
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi cập nhật mã đặc biệt!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }
}
