import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  IterableDiffers,
  TemplateRef,
  input,
  Input,
  inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { CommonModule } from '@angular/common';
import { toArray } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { from } from 'rxjs';
import { concatMap, distinctUntilChanged } from 'rxjs/operators';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { CustomerServiceService } from '../../../crm/customers/customer/customer-service/customer-service.service';
import { PokhService } from '../../../old/pokh/pokh-service/pokh.service';
import { WarehouseReleaseRequestService } from '../../../old/warehouse-release-request/warehouse-release-request/warehouse-release-request.service';
import { CurrencyService } from '../../../general-category/currency-list/currency.service';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { TsAssetManagementFormComponent } from '../../../hrm/asset/asset/ts-asset-management/ts-asset-management-form/ts-asset-management-form.component';
import { FirmService } from '../../../general-category/firm/firm-service/firm.service';
import { EmployeeService } from '../../../hrm/employee/employee-service/employee.service';
import { ProjectPartListService } from '../../../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';
import { AppUserService } from '../../../../services/app-user.service';
import { TbProductRtcFormComponent } from '../../../old/tb-product-rtc/tb-product-rtc-form/tb-product-rtc-form.component';


@Component({
  selector: 'app-product-rtc-purchase-request',
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzInputNumberModule,
    NzCheckboxModule,
  ],
  templateUrl: './product-rtc-purchase-request.component.html',
  styleUrl: './product-rtc-purchase-request.component.css'
})
export class ProductRtcPurchaseRequestComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private fb: FormBuilder,
    private customerService: CustomerServiceService,
    private currencyService: CurrencyService,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private firmService: FirmService,
    private employeeService: EmployeeService,
    private projectPartListService: ProjectPartListService,
    private appUserService: AppUserService,
    private modal: NzModalService
  ) {
  }

  @Input() projectPartlistDetail: any;
  @Input() productRTCID?: number; // Nhận productRTCID để auto select sản phẩm khi mở form
  @Input() warehouseID?: number; // Nhận warehouseID từ component cha
  @Input() warehouseType?: number=1; // Nhận warehouseType từ component cha

  validateForm!: FormGroup;
  customers: any[] = [];
  employees: any[] = [];
  employeeRequests: any[] = [];
  employeeBuys: any[] = [];
  currencys: any[] = [];
  supplierSales: any[] = [];
  isDisable: any = false;
  IsTechBought: any = false;
  isLoadingData: boolean = false; // Flag để tránh trigger valueChanges khi đang load data
  isSaving: boolean = false; // Flag để hiển thị spinner khi đang lưu
  private isEditingMode: boolean = false; // Flag để biết khi nào đang edit và đã load data

  // ProductRTC specific data
  productsRTC: any[] = [];
  firms: any[] = [];
  unitCounts: any[] = [];
  productGroupsRTC: any[] = [];
  employeeApproves: any[] = [];

  private initForm() {
    this.validateForm = this.fb.group({
      CustomerID: [0],
      Maker: [''],
      StatusRequest: [{ value: 'Yêu cầu mua hàng', disabled: true }],
      ProductRTCID: [0],
      ProductName: ['', [Validators.required]],
      ProductCode: ['', [Validators.required]],
      ProductCodeRTC: [''], // Mã nội bộ
      FirmID: [0, [Validators.required]],
      UnitCountID: [0, [Validators.required]],
      ProductGroupRTCID: [0, [Validators.required]],
      EmployeeRequestID: [0],
      EmployeeBuyID: [0],
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

      // ProductRTC specific fields
      TicketType: [1], // 0: Phiếu mua, 1: Phiếu mượn
      DateReturnEstimated: [null],
      EmployeeApproveID: [0],
    });

    // Listener cho các field tính toán thành tiền
    ['UnitPrice', 'Quantity', 'VAT', 'CurrencyRate'].forEach((field) => {
      this.validateForm
        .get(field)
        ?.valueChanges.pipe(distinctUntilChanged())
        .subscribe((value) => {
          if (!this.isLoadingData) {
            setTimeout(() => this.updatePrice(), 0);
          }
        });
    });

    // Listener cho CurrencyID - khi thay đổi loại tiền cũng cần tính lại
    this.validateForm
      .get('CurrencyID')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((currencyID) => {
        if (!this.isLoadingData && currencyID) {
          // onCurrencyChange sẽ được gọi từ ngModelChange, nhưng đảm bảo tính toán
          setTimeout(() => this.updatePrice(), 100);
        }
    });

    this.validateForm
      .get('IsImport')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        if (!this.isLoadingData) {
          setTimeout(() => this.updateDisableByIsImport(), 0);
        }
      });

    // ProductRTC listener
    this.validateForm
      .get('ProductRTCID')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        // Chỉ gọi getProductRTC() khi:
        // 1. Không đang load data
        // 2. Không phải đang edit mode (vì dữ liệu đã có sẵn từ projectPartlistDetail)
        if (!this.isLoadingData && !this.isEditingMode) {
          setTimeout(() => this.getProductRTC(), 0);
        }
      });

    // TicketType listener - xử lý khi chọn loại phiếu (mua/mượn)
    this.validateForm
      .get('TicketType')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((ticketType) => {
        if (!this.isLoadingData) {
          this.handleTicketTypeChange(ticketType);
        }
      });
  }
  //#endregion

  ngOnInit(): void {
    this.initForm();

    // Disable các field không được phép chỉnh sửa
    this.disableReadOnlyFields();

    // Set EmployeeRequestID = nhân viên đăng nhập hiện tại (chỉ khi form mới, không có projectPartlistDetail)
    if (!this.projectPartlistDetail && this.appUserService.employeeID) {
      this.validateForm.patchValue({
        EmployeeRequestID: this.appUserService.employeeID
      });
    }

    // Load common data
    this.getCustomer();
    this.getEmployee();
    this.getCurrency();
    this.getSupplierSale();

    // Load ProductRTC specific data
    this.getProductsRTC();
    this.getFirms();
    this.getUnitCounts();
    this.getProductGroupsRTC();
    this.getEmployeeApproves();

    // Wait a bit for data to load, then load form data
    setTimeout(() => {
    this.loadData();
    }, 200);
  }

  ngAfterViewInit(): void { }

  // Disable các field không được phép chỉnh sửa
  // Chỉ cho phép chỉnh sửa: TicketType, ProductRTCID, EmployeeBuyID, EmployeeRequestID,
  // DateReturnExpected, DateRequest, UnitPrice, CurrencyID, Quantity, SupplierSaleID, Note
  // CustomerID luôn luôn disable
  private disableReadOnlyFields() {
    // Disable CustomerID luôn luôn
    this.validateForm.get('CustomerID')?.disable();

    // Danh sách các field được phép chỉnh sửa
    const allowedFields = [
      'TicketType',
      'ProductRTCID',
      'EmployeeBuyID',
      'EmployeeRequestID',
      'DateReturnExpected',
      'DateRequest',
      'UnitPrice',
      'CurrencyID',
      'Quantity',
      'SupplierSaleID',
      'Note'
    ];

    // Disable tất cả các field trừ các field được phép
    Object.keys(this.validateForm.controls).forEach(key => {
      if (!allowedFields.includes(key) && key !== 'StatusRequest' && key !== 'CustomerID') {
        // StatusRequest đã được disable trong initForm
        // CustomerID đã được disable ở trên
        this.validateForm.get(key)?.disable();
      }
    });
  }

  loadData() {
    // Nếu là form mới và chưa có EmployeeRequestID, set = nhân viên đăng nhập hiện tại
    if (!this.projectPartlistDetail && this.appUserService.employeeID) {
      const currentEmployeeID = this.validateForm.get('EmployeeRequestID')?.value;
      if (!currentEmployeeID || currentEmployeeID === 0) {
        this.validateForm.patchValue({
          EmployeeRequestID: this.appUserService.employeeID
        });
      }
    }

    if (this.projectPartlistDetail != null) {
      let data = this.projectPartlistDetail;
      const id = data.ID ? Number(data.ID) : 0;
      this.isDisable = id > 0;
      this.isEditingMode = true; // Set flag để biết đang edit mode

      this.IsTechBought = data.IsTechBought;

      // Set flag để tránh trigger valueChanges khi đang load
      this.isLoadingData = true;

      // Build form value
      const formValue: any = {
        CustomerID: data.CustomerID ?? 0,
        Maker: data.Manufacturer ?? data.Maker ?? data.FirmName ?? '',
        StatusRequest: data.StatusRequest ?? 0,
        ProductName: data.ProductName ?? '',
        EmployeeRequestID: data.EmployeeID ?? 0,
        EmployeeBuyID: data.EmployeeIDRequestApproved ?? 0,
        DateRequest: data.DateRequest ?? 0,
        DateReturnExpected: data.DateReturnExpected ?? null,

        UnitPrice: data.UnitPrice ?? 0,
        TotalPrice: data.TotalPrice ?? 0,
        Quantity: data.Quantity ?? 0,

        SupplierSaleID: data.SupplierSaleID ?? 0,
        TotalPriceExchange: data.TotalPriceExchange ?? 0,
        TotalMoneyVAT: data.TotaMoneyVAT ?? 0,

        CurrencyID: data.CurrencyID ?? '',
        HistoryPrice: data.HistoryPrice ?? 0,
        CurrencyRate: data.CurrencyRate ?? 0,
        VAT: data.VAT ?? 0,

        UnitFactoryExportPrice: data.UnitFactoryExportPrice ?? 0,
        UnitImportPrice: data.UnitImportPrice ?? 0,
        TotalImportPrice: data.TotalImportPrice ?? 0,

        Note: data.Note ?? '',
        LeadTime: data.TotalDayLeadTime ?? '',

        IsImport: data.IsImport ?? false,

        // ProductRTC specific fields
        ProductRTCID: data.ProductRTCID ?? 0,
        ProductCode: data.ProductCode ?? '',
        ProductCodeRTC: data.ProductCodeRTC ?? '',
        ProductGroupRTCID: data.ProductGroupRTCID ?? 0,
        TicketType: data.TicketType ?? 0,
        DateReturnEstimated: data.DateReturnEstimated ?? null,
        EmployeeApproveID: data.EmployeeApproveID ?? 0,
      };

      // Map Maker/FirmName to FirmID
      let makerName = '';
      if (data.Maker || data.FirmName) {
        makerName = data.Maker || data.FirmName;
        const firm = this.firms.find(f => f.FirmName === makerName);
        formValue.FirmID = firm?.ID ?? 0;
        formValue.Maker = makerName;
      } else {
        formValue.FirmID = 0;
      }

      // Map UnitName to UnitCountID
      const unitName = data.UnitName || '';
      if (unitName) {
        const unit = this.unitCounts.find(u => u.UnitCountName === unitName || u.UnitName === unitName);
        formValue.UnitCountID = unit?.ID ?? 0;
      } else {
        formValue.UnitCountID = 0;
      }

      this.validateForm.setValue(formValue);

      // Reset flag sau khi setValue xong
      setTimeout(() => {
        this.isLoadingData = false;
        // Giữ isEditingMode = true để tránh getProductRTC() tự động gọi từ valueChanges

        // Đảm bảo các field read-only vẫn bị disable sau khi load data
        this.disableReadOnlyFields();

        // Nếu các dropdown data chưa load xong khi setValue, map lại sau khi data đã load
        if (makerName && formValue.FirmID === 0 && this.firms.length > 0) {
          const firm = this.firms.find(f => f.FirmName === makerName);
          if (firm) {
            this.validateForm.patchValue({ FirmID: firm.ID });
          }
        }

        if (unitName && formValue.UnitCountID === 0 && this.unitCounts.length > 0) {
          const unit = this.unitCounts.find(u => u.UnitCountName === unitName);
          if (unit) {
            this.validateForm.patchValue({ UnitCountID: unit.ID });
          }
        }
      }, 100);

      // Khi edit, không cần gọi getProductRTC() vì dữ liệu đã có sẵn từ projectPartlistDetail
      // getProductRTC() sẽ được gọi tự động khi user thay đổi ProductRTCID (qua valueChanges listener)

      // Disable các control khi isDisable = true
      if (this.isDisable) {
        const controlsToDisable = [
          'Maker',
          'StatusRequest',
          'ProductName',
          'ProductCode',
          'ProductCodeRTC',
          'FirmID',
          'UnitCountID',
          'ProductGroupRTCID',
          'TotalPriceExchange',
          'TotalMoneyVAT',
          'UnitFactoryExportPrice',
          'UnitImportPrice',
          'TotalImportPrice',
          'CurrencyRate',
          'TicketType',
          'DateReturnEstimated',
          'EmployeeApproveID',
        ];

        this.updateEditForm(controlsToDisable, false);
      }

      if (!this.IsTechBought) {
        const controlsToDisable = [
          'CurrencyID',
          'VAT',
          'IsImport',
          'LeadTime',
        ];
        this.updateEditForm(controlsToDisable, false);
      }

      // Disable ProductRTC fields nếu có ProductRTCID
      if (data.ProductRTCID && data.ProductRTCID > 0) {
        this.validateForm.get('ProductName')?.disable();
        this.validateForm.get('ProductCode')?.disable();
        this.validateForm.get('FirmID')?.disable();
        this.validateForm.get('UnitCountID')?.disable();
        this.validateForm.get('ProductGroupRTCID')?.disable();
        // Không disable SupplierSaleID ở đây - để TicketType quản lý
      }

      // Xử lý TicketType để enable/disable các field liên quan
      // QUAN TRỌNG: Gọi handleTicketTypeChange CUỐI CÙNG để đảm bảo SupplierSaleID được set đúng
      this.handleTicketTypeChange(formValue.TicketType);
    } else {
      // New record
      this.isDisable = false;
      this.isEditingMode = false; // Reset flag khi tạo mới
      this.validateForm.patchValue({
        DateRequest: new Date(),
        TicketType: 0,
        StatusRequest: 'Yêu cầu mua hàng',
      });

      // Disable StatusRequest
      this.validateForm.get('StatusRequest')?.disable();

      // Nếu có productRTCID, auto select sản phẩm
      if (this.productRTCID && this.productRTCID > 0) {
        this.validateForm.patchValue({
          ProductRTCID: this.productRTCID
        });
        // Đợi các data (firms, unitCounts, productGroupsRTC) load xong rồi mới fill
        setTimeout(() => {
          this.getProductRTC();
        }, 300);
      }
    }
  }

  updateEditForm(list: any[], status: boolean) {
    list.forEach((controlName) => {
      if (status) this.validateForm.get(controlName)?.enable();
      else this.validateForm.get(controlName)?.disable();
    });
  }

  formatAmount = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Parser: chuyển 12,345.67 → 12345.67
  parseAmount = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/,/g, ''); // bỏ dấu phẩy
    return Number(cleaned);
  };

  getCustomer() {
    this.customerService.getCustomers().subscribe({
      next: (rs) => {
        this.customers = rs.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  getEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeBuys = this.employeeRequests =
          this.projectService.createdDataGroup(response.data, 'DepartmentName');
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  getCurrency() {
    this.currencyService.getAll().subscribe({
      next: (response: any) => {
        this.currencys = response.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  getSupplierSale() {
    this.supplierSaleService.getAllSupplierSale().subscribe({
      next: (response: any) => {
        this.supplierSales = response.data;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  // Load ProductRTC data - Load tất cả danh sách sản phẩm để hiển thị trong select
  getProductsRTC() {
    const request = {
      warehouseID: this.warehouseID ?? 0,
      warehouseType: this.warehouseType ?? 0,
      productRTCID: 0, // Không filter theo productRTCID, load tất cả để hiển thị trong dropdown
      checkAll: 1,
      keyWord: '',
      page: 1,
      size: 100000,
      productGroupID: 0,
    };

    this.projectPartlistPurchaseRequestService.getProductsRTC(request).subscribe({
      next: (response: any) => {
        // Xử lý response từ API ProductRTC
        let productsArray: any[] = [];

        if (response?.data) {
          if (Array.isArray(response.data)) {
            productsArray = response.data;
          } else if (response.data.products && Array.isArray(response.data.products)) {
            productsArray = response.data.products;
          }
        } else if (Array.isArray(response)) {
          productsArray = response;
        }

        this.productsRTC = productsArray;

        // Nếu có productRTCID từ input, set selected value và trigger getProductRTC() để fill các field
        if (this.productRTCID && this.productRTCID > 0 && !this.projectPartlistDetail) {
          // Set giá trị selected, getProductRTC() sẽ được trigger khi valueChanges và sẽ fill các field
          // Đợi một chút để đảm bảo productsRTC array đã được populate
          setTimeout(() => {
            this.validateForm.patchValue({ ProductRTCID: this.productRTCID });
          }, 100);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách sản phẩm RTC');
      }
    });
  }

  // Helper method để fill dữ liệu ProductRTC vào form
  private fillProductRTCData(productData: any) {
    if (!productData) {
      return;
    }

    // Set flag để tránh trigger getProductRTC() khi đang fill data
    this.isLoadingData = true;

    const formData: any = {
      ProductRTCID: productData.ID || this.productRTCID || 0,
      ProductName: productData.ProductName || '',
      ProductCode: productData.ProductCode || '',
      ProductCodeRTC: productData.ProductCodeRTC || '',
      FirmID: productData.FirmID || 0,
      UnitCountID: productData.UnitCountID || 0,
      ProductGroupRTCID: productData.ProductGroupRTCID || 0,
    };

    // Map Maker/FirmName
    const makerName = productData.FirmName || productData.Maker || '';
    if (makerName) {
      formData.Maker = makerName;
    }

    // Đảm bảo các dropdown data đã load xong trước khi fill
    const needWait = (formData.FirmID > 0 && this.firms.length === 0) ||
                     (formData.UnitCountID > 0 && this.unitCounts.length === 0) ||
                     (formData.ProductGroupRTCID > 0 && this.productGroupsRTC.length === 0);

    if (needWait) {
      setTimeout(() => {
        this.fillProductRTCData(productData);
      }, 300);
      return;
    }

    // Verify FirmID exists in firms array
    if (formData.FirmID > 0) {
      const firm = this.firms.find(f => f.ID === formData.FirmID);
      if (!firm) {
        // Nếu không tìm thấy FirmID, thử tìm theo FirmName
        const firmByName = this.firms.find(f => f.FirmName === makerName);
        if (firmByName) {
          formData.FirmID = firmByName.ID;
        } else {
          formData.FirmID = 0;
        }
      }
    }

    // Verify UnitCountID exists in unitCounts array
    if (formData.UnitCountID > 0) {
      const unit = this.unitCounts.find(u => u.ID === formData.UnitCountID);
      if (!unit) {
        // Nếu không tìm thấy UnitCountID, thử tìm theo UnitCountName
        const unitByName = this.unitCounts.find(u =>
          (u.UnitCountName || u.UnitName) === productData.UnitCountName
        );
        if (unitByName) {
          formData.UnitCountID = unitByName.ID;
        } else {
          formData.UnitCountID = 0;
        }
      }
    }

    // Verify ProductGroupRTCID exists in productGroupsRTC array
    if (formData.ProductGroupRTCID > 0) {
      const group = this.productGroupsRTC.find(g => g.ID === formData.ProductGroupRTCID);
      if (!group) {
        formData.ProductGroupRTCID = 0;
      }
    }

    // Fill form data - chỉ fill các field còn thiếu, không overwrite các field đã có giá trị
    const currentFormValues = this.validateForm.getRawValue();

    // Chỉ fill các field nếu chúng chưa có giá trị hoặc đang rỗng
    const formDataToPatch: any = {};
    if (!currentFormValues.ProductName || currentFormValues.ProductName === '') {
      formDataToPatch.ProductName = formData.ProductName;
    }
    if (!currentFormValues.ProductCode || currentFormValues.ProductCode === '') {
      formDataToPatch.ProductCode = formData.ProductCode;
    }
    if (!currentFormValues.ProductCodeRTC || currentFormValues.ProductCodeRTC === '') {
      formDataToPatch.ProductCodeRTC = formData.ProductCodeRTC;
    }
    if (!currentFormValues.FirmID || currentFormValues.FirmID === 0) {
      formDataToPatch.FirmID = formData.FirmID;
    }
    if (!currentFormValues.UnitCountID || currentFormValues.UnitCountID === 0) {
      formDataToPatch.UnitCountID = formData.UnitCountID;
    }
    if (!currentFormValues.ProductGroupRTCID || currentFormValues.ProductGroupRTCID === 0) {
      formDataToPatch.ProductGroupRTCID = formData.ProductGroupRTCID;
    }
    if (!currentFormValues.Maker || currentFormValues.Maker === '') {
      formDataToPatch.Maker = formData.Maker;
    }

    // Luôn update ProductRTCID để đảm bảo sync
    formDataToPatch.ProductRTCID = formData.ProductRTCID;

    this.validateForm.patchValue(formDataToPatch);

    // Disable các field sau khi fill
    this.disableProductRTCFields(formData.ProductRTCID);

    // Reset flag sau khi fill xong
    setTimeout(() => {
      this.isLoadingData = false;
    }, 100);
  }

  getFirms() {
    this.firmService.getFirms().subscribe({
      next: (response: any) => {
        this.firms = response.data || response || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách hãng');
      }
    });
  }

  getUnitCounts() {
    this.projectPartListService.getUnitCount().subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          this.unitCounts = response.data || [];
        } else if (Array.isArray(response)) {
          this.unitCounts = response;
        } else if (response.data) {
          this.unitCounts = response.data;
        } else {
          this.unitCounts = [];
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách đơn vị tính');
      }
    });
  }

  getProductGroupsRTC() {
    this.projectPartlistPurchaseRequestService.getProductGroupsRTC(1).subscribe({
      next: (response: any) => {
        this.productGroupsRTC = response.data || response || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách loại kho RTC');
      }
    });
  }

  getEmployeeApproves() {
    this.employeeService.getEmployeeApprove().subscribe({
      next: (response: any) => {
        this.employeeApproves = response.data || response || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải danh sách người duyệt');
      }
    });
  }

  onSubmit() { }

  onStatusChange(value: any) {
    let noteValue = '';

    switch (value) {
      case '0':
      case 0:
        noteValue = 'Chưa làm gì';
        break;

      case '1':
      case 1:
        noteValue = 'Đã về';
        break;

      case '2':
      case 2:
        noteValue = 'Chưa về';
        break;
    }

    // Gán giá trị vào formControl Note
    this.validateForm.get('Note')?.setValue(noteValue);
  }

  //#region Tình toán
  updatePrice() {
    if (this.isLoadingData) {
      return; // Tránh tính toán khi đang load data
    }

    const data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields

    const unitPrice = parseFloat(data.UnitPrice) || 0;
    const quantity = parseFloat(data.Quantity) || 0;
    const currencyRate = parseFloat(data.CurrencyRate) || 0;
    const vat = parseFloat(data.VAT) || 0;

    // Thành tiền chưa VAT = Đơn giá * Số lượng
    const totalPrice = unitPrice * quantity;

    // Thành tiền quy đổi (VNĐ) = Thành tiền chưa VAT * Tỷ giá
    const totalPriceExchange = totalPrice * currencyRate;

    // Thành tiền có VAT = Thành tiền chưa VAT + (Thành tiền chưa VAT * VAT%)
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    // Set flag để tránh trigger valueChanges khi đang update
    this.isLoadingData = true;

    // Enable tạm thời các field để có thể update giá trị
    const totalPriceControl = this.validateForm.get('TotalPrice');
    const totalPriceExchangeControl = this.validateForm.get('TotalPriceExchange');
    const totalMoneyVATControl = this.validateForm.get('TotalMoneyVAT');

    const wasTotalPriceDisabled = totalPriceControl?.disabled;
    const wasTotalPriceExchangeDisabled = totalPriceExchangeControl?.disabled;
    const wasTotalMoneyVATDisabled = totalMoneyVATControl?.disabled;

    // Enable tạm thời để update giá trị
    if (wasTotalPriceDisabled) totalPriceControl?.enable({ emitEvent: false });
    if (wasTotalPriceExchangeDisabled) totalPriceExchangeControl?.enable({ emitEvent: false });
    if (wasTotalMoneyVATDisabled) totalMoneyVATControl?.enable({ emitEvent: false });

    // Update giá trị
    this.validateForm.patchValue({
      TotalPrice: totalPrice,
      TotalPriceExchange: totalPriceExchange,
      TotalMoneyVAT: totalMoneyVAT,
    }, { emitEvent: false });

    // Disable lại nếu trước đó đã bị disable
    if (wasTotalPriceDisabled) totalPriceControl?.disable({ emitEvent: false });
    if (wasTotalPriceExchangeDisabled) totalPriceExchangeControl?.disable({ emitEvent: false });
    if (wasTotalMoneyVATDisabled) totalMoneyVATControl?.disable({ emitEvent: false });

    // Reset flag sau khi update
    setTimeout(() => {
      this.isLoadingData = false;
    }, 50);
  }

  updateDisableByIsImport() {
    let data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields
    let isImport = data.IsImport;
    let controlsToDisable = [
      'UnitFactoryExportPrice',
      'UnitImportPrice',
      'TotalImportPrice',
    ];
    this.updateEditForm(controlsToDisable, isImport);
  }

  onCurrencyChange(selectedCurrencyID: number): void {
    try {
      const currency = this.currencys.find(
        (c) => c.ID === selectedCurrencyID
      ) ?? {
        Code: '',
        CurrencyRate: 0,
        DateStart: new Date(),
        DateExpried: new Date(),
      };

      const now = new Date();
      const isExpired =
        (currency.DateExpried < now || currency.DateStart > now) &&
        currency.Code.toLowerCase().trim() !== 'vnd';

      this.validateForm.patchValue({
        CurrencyRate: !isExpired ? currency.CurrencyRate : 0,
      });

      this.updatePrice();
    } catch (ex: any) { }
  }

  // Handle ProductRTC change event từ select
  onProductRTCChange(productRTCId: number) {
    // Khi user thay đổi ProductRTCID thủ công, reset isEditingMode để cho phép getProductRTC() chạy
    this.isEditingMode = false;

    if (!productRTCId || productRTCId <= 0) {
      // Nếu không chọn gì (clear), enable lại các field: ProductCode, ProductName, UnitCountID, FirmID
      // Không bao gồm SupplierSaleID - để TicketType quản lý
      this.validateForm.get('ProductName')?.enable();
      this.validateForm.get('ProductCode')?.enable();
      this.validateForm.get('ProductCodeRTC')?.enable();
      this.validateForm.get('FirmID')?.enable();
      this.validateForm.get('UnitCountID')?.enable();
      this.validateForm.get('ProductGroupRTCID')?.enable();

      // Clear các giá trị khi clear sản phẩm
      this.validateForm.patchValue({
        ProductName: '',
        ProductCode: '',
        ProductCodeRTC: '',
        FirmID: 0,
        UnitCountID: 0,
        ProductGroupRTCID: 0,
      });
      return;
    }

    // Tìm product trong productsRTC array
    const selectedProduct = this.productsRTC.find(p => p.ID === productRTCId);

    if (selectedProduct) {
      // Fill dữ liệu từ product đã có trong array
      this.fillProductRTCData(selectedProduct);
    } else {
      // Nếu chưa có trong array, gọi API
      this.projectPartlistPurchaseRequestService
        .getProductRTCById(productRTCId)
        .subscribe({
          next: (response: any) => {
            const productData = response.data || response;
            if (productData) {
              this.fillProductRTCData(productData);
            }
          },
          error: (error) => {
            console.error('Error getting ProductRTC:', error);
            this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi lấy thông tin sản phẩm RTC');
          },
        });
    }
  }

  // Handle ProductRTC change
  getProductRTC() {
    if (this.isLoadingData) {
      return;
    }

    let data = this.validateForm.getRawValue();
    const productRTCId = data.ProductRTCID;

    const shouldDisable = productRTCId > 0;
    if (shouldDisable) {
      this.validateForm.get('ProductName')?.disable();
      this.validateForm.get('ProductCode')?.disable();
      this.validateForm.get('ProductCodeRTC')?.disable();
      this.validateForm.get('FirmID')?.disable();
      this.validateForm.get('UnitCountID')?.disable();
      this.validateForm.get('ProductGroupRTCID')?.disable();
      // Không disable SupplierSaleID ở đây - để TicketType quản lý
    } else {
      this.validateForm.get('ProductName')?.enable();
      this.validateForm.get('ProductCode')?.enable();
      this.validateForm.get('ProductCodeRTC')?.enable();
      this.validateForm.get('FirmID')?.enable();
      this.validateForm.get('UnitCountID')?.enable();
      this.validateForm.get('ProductGroupRTCID')?.enable();
      // Không enable SupplierSaleID ở đây - để TicketType quản lý
    }

    if (productRTCId > 0) {
      // Kiểm tra xem product đã có trong productsRTC array chưa (từ getProductsRTC)
      const existingProduct = this.productsRTC.find(p => p.ID === productRTCId);

      if (existingProduct) {
        // Nếu đã có dữ liệu từ getProductsRTC, dùng dữ liệu đó thay vì gọi API
        this.fillProductRTCData(existingProduct);
      } else {
        // Nếu chưa có trong array, mới gọi API
    this.projectPartlistPurchaseRequestService
          .getProductRTCById(productRTCId)
      .subscribe({
        next: (response: any) => {
              const productData = response.data || response;

              if (productData) {
                this.fillProductRTCData(productData);
          }
        },
        error: (error) => {
              console.error('Error getting ProductRTC:', error);
              this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi lấy thông tin sản phẩm RTC');
        },
      });
      }
    }
  }

  // Helper method để disable ProductRTC fields
  private disableProductRTCFields(productRTCId: number) {
    if (productRTCId > 0) {
      this.validateForm.get('ProductName')?.disable();
      this.validateForm.get('ProductCode')?.disable();
      this.validateForm.get('ProductCodeRTC')?.disable();
      this.validateForm.get('FirmID')?.disable();
      this.validateForm.get('UnitCountID')?.disable();
      this.validateForm.get('ProductGroupRTCID')?.disable();
      // Không disable SupplierSaleID ở đây - để TicketType quản lý
    }
  }

  // Handle Ticket Type change - xử lý khi chọn loại phiếu (mua/mượn)
  handleTicketTypeChange(ticketType: number) {
    if (ticketType === 1) { // Phiếu mượn
      // Enable các field cho phiếu mượn
      this.validateForm.get('DateReturnEstimated')?.enable();
      this.validateForm.get('EmployeeApproveID')?.enable();
      this.validateForm.get('SupplierSaleID')?.enable();

      // Set validators cho phiếu mượn
      this.validateForm.get('EmployeeApproveID')?.setValidators([Validators.required]);
      this.validateForm.get('SupplierSaleID')?.setValidators([Validators.required]);
    } else { // Phiếu mua (TicketType = 0)
      // Clear các giá trị không cần thiết cho phiếu mua
      this.validateForm.patchValue({
        DateReturnEstimated: null,
        EmployeeApproveID: 0
      });

      // Disable các field không cần cho phiếu mua
      this.validateForm.get('DateReturnEstimated')?.disable();
      // this.validateForm.get('EmployeeApproveID')?.disable();

      // Enable nhà cung cấp cho phiếu mua (không bắt buộc nhưng cho phép nhập)
      this.validateForm.get('SupplierSaleID')?.enable();

      // Clear validators
      // this.validateForm.get('EmployeeApproveID')?.clearValidators();
      this.validateForm.get('SupplierSaleID')?.clearValidators();
    }

    // Update validity
    // this.validateForm.get('EmployeeApproveID')?.updateValueAndValidity();
    this.validateForm.get('SupplierSaleID')?.updateValueAndValidity();
  }

  // Add ProductRTC - Mở modal thêm sản phẩm RTC
  onAddProductRTC() {
    const modalRef = this.modalService.open(TbProductRtcFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });

    // Truyền warehouseType vào modal
    modalRef.componentInstance.warehouseType = this.warehouseType || 1;
    modalRef.componentInstance.dataInput = null; // Tạo mới

    // Xử lý khi modal đóng - reload lại danh sách sản phẩm RTC
    modalRef.result.then(
      (result) => {
        if (result && result.refresh) {
          // Reload danh sách sản phẩm RTC sau khi thêm mới
          this.getProductsRTC();
        }
      },
      () => {
        // Modal bị dismiss, không làm gì
      }
    );
  }

  onSave() {
    this.validateForm.markAllAsTouched();
    this.validateForm.updateValueAndValidity();

    if (this.validateForm.invalid) {
      return; // dừng lại nếu form lỗi
    }
    let data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields

    // ProductRTC specific validation
    if (!data.ProductCode || data.ProductCode.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập mã sản phẩm!');
      return;
    }
    if (!data.Quantity || data.Quantity <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập số lượng sản phẩm!');
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

      // Chỉ validate nhà cung cấp cho phiếu mượn
      if (data.SupplierSaleID <= 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhà cung cấp!');
        return;
      }
    }

    // Phiếu mua (TicketType = 0) không cần validate nhà cung cấp

    // Kiểm tra người mua
    if (this.projectPartlistDetail?.ID <= 0 && data.EmployeeBuyID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn người mua'
      );
      return;
    }

    if (!this.IsTechBought) {
      const deadline = new Date(data.DeadLine);
      const dateNow = new Date();

      // Reset time to start of day for accurate day calculation
      const deadlineDate = new Date(
        deadline.getFullYear(),
        deadline.getMonth(),
        deadline.getDate()
      );
      const nowDate = new Date(
        dateNow.getFullYear(),
        dateNow.getMonth(),
        dateNow.getDate()
      );

      const timeSpan =
        Math.floor(
          (deadlineDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      // Kiểm tra deadline tối thiểu
      if (dateNow.getHours() < 15) {
        if (timeSpan < 2) {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Deadline tối thiếu là 2 ngày từ ngày hiện tại!'
          );
          return;
        }
      } else if (timeSpan < 3) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Yêu cầu từ sau 15h nên ngày Deadline sẽ bắt đầu tính từ ngày hôm sau và tối thiểu là 2 ngày!'
        );
        return;
      }

      // Kiểm tra deadline phải là ngày làm việc (T2-T6)
      const deadlineDay = deadline.getDay();
      if (deadlineDay === 0 || deadlineDay === 6) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Deadline phải là ngày làm việc (T2 - T6)!'
        );
        return;
      }

      // Đếm số ngày cuối tuần trong khoảng thời gian
      let countWeekday = 0;
      for (let i = 0; i < timeSpan; i++) {
        const dateValue = new Date(nowDate);
        dateValue.setDate(nowDate.getDate() + i);
        const dayOfWeek = dateValue.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          countWeekday++;
        }
      }

      // Cảnh báo nếu có ngày cuối tuần trong khoảng thời gian
if (countWeekday > 0) {
  const formattedDeadline = deadline.toLocaleDateString('vi-VN');

  this.modal.confirm({
    nzTitle: 'Xác nhận Deadline',
    nzContent: `Deadline sẽ không tính <b>Thứ 7</b> và <b>Chủ nhật</b>.<br/>
                Bạn có chắc muốn chọn Deadline là ngày <b>[${formattedDeadline}]</b> không?`,
    nzOkText: 'Xác nhận',
    nzCancelText: 'Hủy',
    nzOnOk: () => {

    },
    nzOnCancel: () => {
      return;
    }
  });
  return;

}
    }
    // Kiểm tra Deadline - end

    // Kiểm tra Ghi chú khi IsTechBought = true
    if (this.IsTechBought && (!data.Note || data.Note.trim() === '')) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng nhập ghi chú!'
      );
      return;
    }

    // Build model
    const model = this.buildSaveModel(data);

    // Set flag để hiển thị spinner
    this.isSaving = true;

    this.projectPartlistPurchaseRequestService.saveDataRTC(model).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu thành công!'
        );
        this.activeModal.dismiss();
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
      },
    });
  }

  buildSaveModel(data: any): any {
    // Get selected data for mapping
    const selectedProduct = this.productsRTC.find(p => p.ID === data.ProductRTCID);
    const selectedFirm = this.firms.find(f => f.ID === data.FirmID);
    const selectedUnit = this.unitCounts.find(u => u.ID === data.UnitCountID);
    const selectedCurrency = this.currencys.find(c => c.ID === data.CurrencyID);

    const model: any = {
      ID: this.projectPartlistDetail?.ID ?? 0,
      StatusRequest: 1, // Set StatusRequest = 1 khi lưu
      // ProductRTC fields
      ProductRTCID: data.ProductRTCID || 0,
      ProductName: data.ProductName || '',
      ProductCode: data.ProductCode || selectedProduct?.ProductCode || '',
      ProductGroupRTCID: data.ProductGroupRTCID || 0,

      // Maker (Hãng) - chưa lưu, chỉ gửi text
      Maker: selectedFirm?.FirmName || data.Maker || '',

      // UnitName (Đơn vị) - chưa lưu, chỉ gửi text
      UnitName: selectedUnit?.UnitCountName || selectedUnit?.UnitName || '',

      // Employee fields
      EmployeeID: data.EmployeeRequestID || 0,
      EmployeeIDRequestApproved: data.EmployeeBuyID || 0,

      // Date fields
      DateRequest: data.DateRequest || null,
      DateReturnExpected: data.DateReturnExpected || null,

      // Quantity
      Quantity: data.Quantity || 0,

      // Currency fields
      CurrencyID: data.CurrencyID || 0,
      UnitMoney: selectedCurrency?.Code || '', // UnitMoney từ Currency Code
      CurrencyRate: data.CurrencyRate || 0,

      // Price fields
      UnitPrice: data.UnitPrice || 0,
      TotalPrice: data.TotalPrice || 0,
      HistoryPrice: data.HistoryPrice || 0,
      TotalPriceExchange: data.TotalPriceExchange || 0,

      // VAT
      VAT: data.VAT || 0,
      TotaMoneyVAT: data.TotalMoneyVAT || 0,

      // Supplier
      SupplierSaleID: data.SupplierSaleID || 0,

      // Import fields
      UnitFactoryExportPrice: data.UnitFactoryExportPrice || 0,
      TotalImportPrice: data.TotalImportPrice || 0,

      // Lead time
      TotalDayLeadTime: data.LeadTime || 0,

      // Other fields
      IsImport: data.IsImport || false,
      Note: data.Note || '',

      // ProductRTC specific fields
      TicketType: data.TicketType || 0,
      DateReturnEstimated: data.DateReturnEstimated || null,
      EmployeeApproveID: data.EmployeeApproveID || 0,
      ApprovedTBP: data.EmployeeApproveID || 0, // Cùng giá trị với EmployeeApproveID

      // IsTechBought - chỉ truyền, backend sẽ xử lý logic
      IsTechBought: this.IsTechBought || false,
      ProjectPartListID: this.projectPartlistDetail?.ProjectPartListID ?? 0,

      // Clear ProductSale fields
      ProductSaleID: null,
      ProductGroupID: null,
    };

    return model;
  }

}
