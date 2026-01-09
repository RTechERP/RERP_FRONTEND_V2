import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, input, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, ColumnDefinition, CellComponent } from 'tabulator-tables';

// NG-ZORRO imports
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { RulePayDetailComponent } from '../../rulepay/rule-pay-detail/rule-pay-detail.component';
import { ProjectPartlistPurchaseRequestService } from '../../project-partlist-purchase-request/project-partlist-purchase-request.service';
import { PONCCService } from '../poncc.service';
import { AppUserService } from '../../../../services/app-user.service';
import { SupplierSaleDetailComponent } from '../../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { ProductSaleDetailComponent } from '../../../old/Sale/ProductSale/product-sale-detail/product-sale-detail.component';
import { ProjectPartlistPurchaseRequestComponent } from '../../project-partlist-purchase-request/project-partlist-purchase-request.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { BillImportServiceService } from '../../../old/Sale/BillImport/bill-import-service/bill-import-service.service';
import { BillImportDetailComponent } from '../../../old/Sale/BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { BillImportTechnicalFormComponent } from '../../../old/bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import { TabulatorPopupService } from '../../../../shared/components/tabulator-popup';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../../shared/pdf/vfs_fonts_custom.js';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';
import { SafeUrlPipe } from '../../../../../safeUrl.pipe';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';

(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = {
    Times: {
        normal: 'TIMES.ttf',
        bold: 'TIMESBD.ttf',
        bolditalics: 'TIMESBI.ttf',
        italics: 'TIMESI.ttf',
    },
};

@Component({
  selector: 'app-poncc-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzCheckboxModule,
    NzTabsModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzSwitchModule,
    HasPermissionDirective,
    SafeUrlPipe
  ],
  templateUrl: './poncc-detail.component.html',
  styleUrl: './poncc-detail.component.css'
})
export class PonccDetailComponent implements OnInit, AfterViewInit {

  informationForm!: FormGroup;
  companyForm!: FormGroup;
  diffForm!: FormGroup;
  extraForm!: FormGroup;
  @Input() warehouseType=1;
  @Input() poncc: any = null;
  @Input() ponccDetail: any;
  @Input() dtRef: any;
  @Input() lstPrjPartlistPurchaseRequest: any[] = [];
  @Input() lstBillImportId: any[] = [];
  @Input() isCopy: boolean = false;
  @Input() isAddPoYCMH: boolean = false;
  @Input() skipBillCodeGeneration: boolean = false; // Flag để bỏ qua generate BillCode khi đã có từ YCMH
  @ViewChild('tb_HoSoDiKem', { static: false }) tb_HoSoDiKem!: ElementRef;
  tabulatorHoSoDiKem: Tabulator | null = null;
  rupayId: number = 0;
  @ViewChild('tb_HangTien', { static: false }) tb_HangTien!: ElementRef;
  tabulatorHangTien: Tabulator | null = null;
  isAdmin: boolean = false;
  supplierSales: any[] = [];
  isEditMode: boolean = false;

  // Print properties
  showPreview = false;
  language: string = 'vi';
  dataPrint: any;
  pdfSrc: any;
  isShowSign = true;
  isShowSeal = true;
  isMerge = false;

  ponccType: any[] = [
    { value: 0, label: 'PO Thương mại' },
    { value: 1, label: 'PO mượn' },
  ];

  companyList: any[] = [
    { value: 1, label: 'RTC' },
    { value: 2, label: 'MVI' },
    { value: 3, label: 'APR' },
    { value: 4, label: 'YONKO' },
    { value: 5, label: 'R-Tech' },
  ];

  statusList: any[] = [
    { value: 0, label: 'Đang tiến hành' },
    { value: 1, label: 'Đã hoàn thành' },
    { value: 2, label: 'Đã thanh toán' },
    { value: 3, label: 'Hủy' },
    { value: 4, label: 'Đã xóa' },
    { value: 5, label: 'Đã Y/c nhập kho' },
  ];

  rulepays: any[] = [];
  employeeList: any[] = [];
  currencies: any[] = [];
  productSales: any[] = [];

  productRTCs: any[] = [];
  projects: any[] = [];
  referenceLinks: any[] = []; // Danh sách link tham chiếu từ dtRef

  // Column definitions for popups
  productSalePopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã sản phẩm',
      field: 'ProductCode',
      width: 150,
    },
    {
      title: 'Tên sản phẩm',
      field: 'ProductName',
      width: 250,
    },
    {
      title: 'Mã nội bộ',
      field: 'ProductNewCode',
      width: 150,
    },
    {
      title: 'DVT',
      field: 'Unit',
      width: 100,
    },
    {
      title: 'Tên nhóm',
      field: 'ProductGroupName',
      width: 200,
    },
  ];

  productRTCPopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã sản phẩm',
      field: 'ProductCode',
      width: 150,
    },
    {
      title: 'Tên sản phẩm',
      field: 'ProductName',
      width: 250,
    },
    {
      title: 'Mã nội bộ',
      field: 'ProductCodeRTC',
      width: 150,
    },
    {
      title: 'DVT',
      field: 'UnitCountName',
      width: 100,
    },
    {
      title: 'Tên nhóm',
      field: 'ProductGroupName',
      width: 200,
    },
  ];

  formatAmount = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Parser: chuyển 12,345.67 → 12345.67
  parseAmount = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/,/g, '');  // bỏ dấu phẩy
    return Number(cleaned);
  };



  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private ponccService: PONCCService,
    private appUserService: AppUserService,
    private billImportService: BillImportServiceService,
    private tabulatorPopupService: TabulatorPopupService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.isAdmin = this.appUserService.isAdmin;
    if (this.poncc && this.poncc.ID > 0) {
      this.ponccService.getPoncc(this.poncc.ID).subscribe({
        next: (response: any) => {
          this.rupayId = this.poncc.RulePayID;
          this.poncc = response.data;
          if (this.isCopy) {
            this.poncc.ID = 0;
          }
          this.mapDataToForm();
          this.loadReferenceLinks();
        },
        error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
        },
      });
    }
    else if (this.isAddPoYCMH) {
      this.getSupplierSale().then(() => {
        this.mapDataToForm();
        // Không gọi getBillCode() ở đây vì BillCode đã được set từ component cha (YCMH)
        // Nếu skipBillCodeGeneration = false, sẽ được generate tự động khi POType changes
        if (!this.skipBillCodeGeneration) {
          this.getBillCode(0);
        }
      });
    }
    // Trường hợp copy: poncc.ID = 0 nhưng có data sẵn từ component cha
    else if (this.isCopy && this.poncc) {
      this.rupayId = this.poncc.RulePayID;
      // Đợi các dropdown load xong rồi mới map data
      Promise.all([
        this.getSupplierSale(),
        this.getRulePay(),
        this.getCurrencies()
      ]).then(() => {
        console.log('🔷 Copy mode: data loaded, calling mapDataToForm');
        this.mapDataToForm();
      });
    }

    this.initInformationForm();
    this.initCompanyForm();
    this.initDiffForm();
    this.initExtraForm();

    this.getSupplierSale();
    this.getEmployee();
    this.getRulePay();
    this.getCurrencies();

    // Subscribe to POType changes to get BillCode
    this.informationForm.get('POType')?.valueChanges.subscribe((poTypeId: number) => {
      console.log('POType changed to:', poTypeId);
      // Nếu skipBillCodeGeneration = true (đã có BillCode từ YCMH), không generate lại
      if (this.skipBillCodeGeneration) {
        console.log('Skipping BillCode generation - already set from YCMH');
        return;
      }
      // Nếu đang ở chế độ edit, không generate lại BillCode
      if (this.isEditMode) {
        console.log('Skipping BillCode generation - in edit mode');
        return;
      }
      // Chỉ tự động generate BillCode khi đang tạo mới (ID = 0 hoặc undefined)
      // Khi edit/copy, không tự động generate để tránh ghi đè
      if ((poTypeId === 0 || poTypeId === 1) && (!this.poncc || this.poncc.ID === 0 || this.isCopy)) {
        this.getBillCode(poTypeId);
      }
    });

    // Subscribe to CurrencyID changes to update CurrencyRate automatically
    this.companyForm.get('CurrencyID')?.valueChanges.subscribe((currencyId: number) => {
      if (currencyId !== null && currencyId !== undefined) {
        this.onCurrencyChange(currencyId);
      }
    });

    this.extraForm.get('OrderQualityNotMet')?.valueChanges.subscribe(value => {

      if (value === true) {
        this.extraForm.get('ReasonForFailure')?.enable();
      } else {
        this.extraForm.get('ReasonForFailure')?.disable();
        this.extraForm.get('ReasonForFailure')?.reset();
      }

    });

    this.loadLookups();
  }

  // Load danh sách link tham chiếu từ dtRef
  private loadReferenceLinks(): void {
    if (!this.dtRef || !Array.isArray(this.dtRef)) {
      console.log('No dtRef data');
      return;
    }

    this.referenceLinks = [];
    this.lstBillImportId = [];

    this.dtRef.forEach((item: any) => {
      // Lấy BillImportId để add vào lstBillImportId
      const billImportId = Number(item.ID) || 0;
      if (billImportId > 0) {
        this.lstBillImportId.push(billImportId);
      }

      // Tạo link object
      this.referenceLinks.push({
        id: item.ID || 0,
        text: `${item.BillImportCode || ''} - ${item.WarehouseCode || ''}`,
        warehouseType: item.WarehouseType || 0
      });
    });

    console.log('Loaded reference links:', this.referenceLinks);
    console.log('lstBillImportId:', this.lstBillImportId);
  }

  // Hàm map data từ poncc vào form khi edit
  private mapDataToForm(): void {
    if (!this.poncc) return;


    // Map data vào informationForm
    this.informationForm.patchValue({
      SupplierSaleID: this.poncc.SupplierSaleID || null,
      POCode: this.poncc.POCode || '',
      RulePayID: this.rupayId || null,
      EmployeeID: this.poncc.EmployeeID || null,
      POType: this.poncc.POType ?? 0,
      Company: this.poncc.Company ?? 1,
      Note: this.poncc.Note || '',
      IsCheckTotalMoneyPO: this.poncc.IsCheckTotalMoneyPO || false
    }, { emitEvent: false });

    // Map data vào companyForm
    this.companyForm.patchValue({
      RequestDate: this.poncc.RequestDate ? new Date(this.poncc.RequestDate) : new Date(),
      DeliveryDate: this.poncc.DeliveryDate ? new Date(this.poncc.DeliveryDate) : new Date(),
      BillCode: this.poncc.BillCode || '',
      Status: this.poncc.Status ?? 0,
      TotalMoneyPO: this.poncc.TotalMoneyPO || 0,
      CurrencyID: this.poncc.CurrencyID || null,
      CurrencyRate: this.poncc.CurrencyRate || 0
    }, { emitEvent: false });


    // Map data vào diffForm
    this.diffForm.patchValue({
      AddressDelivery: this.poncc.AddressDelivery || '',
      OtherTerms: this.poncc.OtherTerms || '',
      ShippingPoint: this.poncc.ShippingPoint || ''
    });

    // Map data vào extraForm
    this.extraForm.patchValue({
      AccountNumberSupplier: this.poncc.AccountNumberSupplier || '',
      BankCharge: this.poncc.BankCharge || '',
      FedexAccount: this.poncc.FedexAccount || '',
      RuleIncoterm: this.poncc.RuleIncoterm || '',
      OriginItem: this.poncc.OriginItem || '',
      OrderTargets: this.poncc.OrderTargets || '',
      SupplierVoucher: this.poncc.SupplierVoucher || '',
      BankSupplier: this.poncc.BankSupplier || '',
      ReasonForFailure: this.poncc.ReasonForFailure || '',
      OrderQualityNotMet: this.poncc.OrderQualityNotMet || false,
      NCCNew: this.poncc.NCCNew || false,
      DeptSupplier: this.poncc.DeptSupplier || true
    });

    // Sau khi map xong, trigger các sự kiện để load thông tin đầy đủ
    // Đợi một chút để đảm bảo supplierSales, rulepays và currencies đã được load
    setTimeout(() => {
      // Load thông tin NCC (địa chỉ, mã số thuế, diễn giải)
      if (this.poncc.SupplierSaleID) {
        const selectedSupplier = this.supplierSales.find(s => s.ID === this.poncc.SupplierSaleID);
        if (selectedSupplier) {
          // Vì AddressSupplier và MaSoThueNCC là disabled fields, cần dùng setValue trực tiếp
          this.informationForm.get('AddressSupplier')?.setValue(selectedSupplier.AddressNCC || '');
          this.informationForm.get('MaSoThueNCC')?.setValue(selectedSupplier.MaSoThue || '');
          this.informationForm.get('Note')?.setValue(this.poncc.Note || selectedSupplier.Note || '');

          // Nếu poncc không có RulePayID, lấy từ supplier
          if (!this.poncc.RulePayID && selectedSupplier.RulePayID) {
            this.informationForm.get('RulePayID')?.setValue(selectedSupplier.RulePayID);
          }

        }
      }

      // Load thông tin Currency (tỷ giá) và trigger onCurrencyChange để cập nhật bảng
      // Đảm bảo currencies đã được load trước khi gọi onCurrencyChange
      if (this.poncc.CurrencyID && this.currencies.length > 0) {
        this.onCurrencyChange(this.poncc.CurrencyID);
      } else if (this.poncc.CurrencyID && this.currencies.length === 0) {
        // Nếu currencies chưa load xong, đợi thêm một chút
        setTimeout(() => {
          if (this.poncc.CurrencyID && this.currencies.length > 0) {
            this.onCurrencyChange(this.poncc.CurrencyID);
          }
        }, 500);
      }
    }, 1000); // Tăng thời gian chờ lên 1000ms

    console.log('Data mapped to forms:', {
      poncc: this.poncc,
      information: this.informationForm.value,
      company: this.companyForm.value,
      diff: this.diffForm.value,
      extra: this.extraForm.value
    });
  }

  initDiffForm(): void {
    this.diffForm = this.fb.group({
      AddressDelivery: [''],
      OtherTerms: [''],
      ShippingPoint: ['']
    });
  }

  initExtraForm(): void {
    this.extraForm = this.fb.group({
      AccountNumberSupplier: [''],
      BankCharge: [''],
      FedexAccount: [''],
      RuleIncoterm: [''],
      OriginItem: [''],
      OrderTargets: [''],
      SupplierVoucher: [''],
      BankSupplier: [''],
      OrderQualityNotMet: [false],
      ReasonForFailure: [{ value: '', disabled: true }],
      NCCNew: [false],
      DeptSupplier: [true]
    });
  }

  initInformationForm(): void {
    // Set giá trị mặc định EmployeeID là người đăng nhập hiện tại (chỉ khi tạo mới)
    const defaultEmployeeID = (!this.poncc || this.poncc.ID === 0 || this.isCopy)
      ? (this.appUserService.employeeID || null)
      : null;

    this.informationForm = this.fb.group({
      SupplierSaleID: [null, Validators.required],
      POCode: ['', Validators.required],
      AddressSupplier: [{ value: '', disabled: true }],
      MaSoThueNCC: [{ value: '', disabled: true }],
      RulePayID: [null, Validators.required],
      EmployeeID: [defaultEmployeeID, Validators.required],
      POType: [0, Validators.required],
      Company: [1, Validators.required],
      Note: [''],
      IsCheckTotalMoneyPO: [false]
    });

    // Chỉ gọi getBillCode khi đang tạo mới (không phải edit mode và không có poncc.ID)
    if (!this.isEditMode && (!this.poncc || this.poncc.ID === 0)) {
      this.getBillCode(0);
    }
  }

  initCompanyForm(): void {
    this.companyForm = this.fb.group({
      RequestDate: [new Date(), Validators.required],
      DeliveryDate: [new Date(), Validators.required],
      BillCode: [{ value: '', disabled: !this.isAdmin }, Validators.required],
      Status: [{ value: 0, disabled: !this.isAdmin }, Validators.required],
      TotalMoneyPO: [0, Validators.required],
      CurrencyID: [null, Validators.required],
      CurrencyRate: [0, Validators.required]
    });
  }

  getSupplierSale(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.supplierSaleService.getNCC().subscribe({
        next: (response: any) => {
          this.supplierSales = response.data;
          resolve();
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
          reject(error);
        },
      });
    });
  }

  onSupplierChange(selectedSupplierID: number): void {
    const selectedSupplier = this.supplierSales.find(s => s.ID === selectedSupplierID);
    if (this.poncc && this.poncc.ID > 0) {

    }
    if (selectedSupplier) {
      this.ponccService.getPOCode(selectedSupplier.CodeNCC).subscribe({
        next: (response: any) => {
          this.informationForm.patchValue({
            POCode: response.data || '',
            AddressSupplier: selectedSupplier.AddressNCC || '',
            MaSoThueNCC: selectedSupplier.MaSoThue || '',
            Note: selectedSupplier.Note || '',
            RulePayID: selectedSupplier.RulePayID || null,
          });
        },
        error: (error) => {
          this.informationForm.patchValue({
            POCode: selectedSupplier.CodeNCC || '',
            AddressSupplier: selectedSupplier.AddressNCC || '',
            MaSoThueNCC: selectedSupplier.MaSoThue || '',
            Note: selectedSupplier.Note || '',
            RulePayID: selectedSupplier.RulePayID || null,
          });
        },
      });

    } else {
      this.informationForm.patchValue({
        POCode: '',
        AddressSupplier: '',
        MaSoThueNCC: '',
        Note: '',
        RulePayID: null,
      });
    }
  }

  onCurrencyChange(selectedCurrencyID: number): void {
    try {
      const currency = this.currencies.find(c => c.ID === selectedCurrencyID);

      // Cập nhật CurrencyRate
      if (currency) {
        const now = new Date();
        const dateStart = new Date(currency.DateStart);
        const dateExpired = new Date(currency.DateExpried);

        // Kiểm tra xem currency có còn hiệu lực không
        const isValid = (now >= dateStart && now <= dateExpired);

        this.companyForm.patchValue({
          CurrencyRate: isValid ? currency.CurrencyRate : 0
        });

        // Hiển thị/ẩn cột CurrencyExchange dựa trên loại tiền tệ
        const isVND = currency.Code.trim().toLowerCase() === 'vnd';
        const currencyExchangeColumn = this.tabulatorHangTien?.getColumn('CurrencyExchange');
        if (currencyExchangeColumn) {
          if (isVND) {
            currencyExchangeColumn.hide();
          } else {
            currencyExchangeColumn.show();
          }
        }
      } else {
        this.companyForm.patchValue({
          CurrencyRate: 0
        });

        // Ẩn cột CurrencyExchange nếu không có currency
        const currencyExchangeColumn = this.tabulatorHangTien?.getColumn('CurrencyExchange');
        if (currencyExchangeColumn) {
          currencyExchangeColumn.hide();
        }
      }

      // Tính toán lại tất cả các dòng trong bảng
      if (this.tabulatorHangTien) {
        const currencyRate = this.companyForm.get('CurrencyRate')?.value || 0;
        const rows = this.tabulatorHangTien.getRows();

        rows.forEach((row: any) => {
          const data = row.getData();

          // Tính toán lại TotalPrice và CurrencyExchange
          const thanhTien = Number(data.ThanhTien) || 0;
          const totalMoneyVAT = Number(data.VATMoney) || 0;
          const feeShip = Number(data.FeeShip) || 0;
          const discount = Number(data.Discount) || 0;

          const totalPrice = thanhTien + totalMoneyVAT + feeShip - discount;
          const currencyExchange = selectedCurrencyID !== 0 ? totalPrice * currencyRate : 0;

          row.update({
            TotalPrice: totalPrice,
            CurrencyExchange: currencyExchange
          });
        });

        // Cập nhật tổng tiền vào form
        const allData = this.tabulatorHangTien.getData();
        const totalMoneyPO = allData.reduce((sum: number, item: any) => {
          return sum + (Number(item.TotalPrice) || 0);
        }, 0);

        this.companyForm.patchValue({
          TotalMoneyPO: totalMoneyPO
        });

        // Redraw table để cập nhật footer calculations
        this.tabulatorHangTien.redraw(true);
      }

    } catch (ex: any) {
      console.error('Error in onCurrencyChange:', ex);
    }
  }

  onTabChange(selectedIndex: number): void {
    // Redraw Tabulator khi chuyển tab để đảm bảo hiển thị đúng
    if (selectedIndex === 3 && this.tabulatorHoSoDiKem) {
      setTimeout(() => this.tabulatorHoSoDiKem?.redraw(), 100);
    }
  }

  ngAfterViewInit(): void {
    this.initTabulatorHoSoDiKem();
    this.initTabulatorHangTien();
  }

  initTabulatorHoSoDiKem(): void {
    if (!this.tb_HoSoDiKem) return;

    this.tabulatorHoSoDiKem = new Tabulator(this.tb_HoSoDiKem.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: [],
      layout: 'fitDataStretch',
      height: '100%',
      placeholder: 'Không có dữ liệu',
      columns: [
        { title: 'Mã chứng từ', field: 'code', headerSort: false, width: 150 },
        { title: 'Tên chứng từ', field: 'name', headerSort: false, minWidth: 200 },
        { title: 'Trạng thái', field: 'status', headerSort: false, width: 120 },
        {
          title: 'Ngày nhận/hủy',
          field: 'date',
          headerSort: false,
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            return new Date(value).toLocaleDateString('vi-VN');
          }
        },
        { title: 'Người nhận/hủy', field: 'person', headerSort: false, width: 150 },
        { title: 'Lý do hủy', field: 'reason', headerSort: false, minWidth: 200 },
        { title: 'Ghi chú', field: 'note', headerSort: false, minWidth: 200 }
      ]
    });
  }

  initTabulatorHangTien() {
    if (!this.tb_HangTien) return;

    // Formatter cho số tiền (với dấu phẩy ngăn cách hàng nghìn)
    const moneyFormatter = (cell: any) => {
      const value = cell.getValue();
      if (value === null || value === undefined || value === '') return '';
      const num = Number(value);
      if (isNaN(num)) return value;
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Formatter cho ngày tháng
    const dateFormatter = (cell: any) => {
      const value = cell.getValue();
      if (!value) return '';
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return date.toLocaleDateString('vi-VN');
    };

    // Bottom calc formatter cho tổng tiền
    const bottomCalcMoneyFormatter = (cell: any) => {
      const value = cell.getValue();
      if (value === null || value === undefined) return '';
      const num = Number(value);
      if (isNaN(num)) return '';
      return `<strong>${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
    };

    this.tabulatorHangTien = new Tabulator(this.tb_HangTien.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.ponccDetail || [],
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: true,
      pagination: false,
      columns: [
        {
          title: '',
          field: 'addRow',
          headerSort: false,
          width: 40,
          hozAlign: 'center',
          frozen: true,
          headerHozAlign: 'center',
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          formatter: (cell: any) => {
            // Luôn hiển thị nút xóa cho tất cả các dòng
            return `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`;
          },

          cellClick: (e: any, cell: any) => {
            const data = cell.getRow().getData();
            let id = parseInt(data['ID']);

            this.modal.confirm({
              nzTitle: 'Xác nhận',
              nzContent: `Bạn có chắc chắn muốn xóa sản phẩm [${data['ProductName'] ?? ''}] dòng ${data['STT'] ?? ''}?`,
              nzOkText: 'Xóa',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                let id = cell.getRow().getData().ID;
                if (id <= 0) {
                  cell.getRow().delete();
                  this.resetSTT();
                } else {
                  this.ponccService.deletedPonccDetail(id).subscribe((res: any) => {
                    cell.getRow().delete();
                    this.resetSTT();
                  });
                }
              }
            });
          }
        } as any,
        {
          title: 'STT',
          field: 'STT',
          width: 60,
          headerSort: false,
          hozAlign: 'center',
          frozen: true,
          bottomCalc: 'count',
          bottomCalcFormatter: (cell: any) => `<strong>Tổng: ${cell.getValue()}</strong>`
        },
        {
          title: 'Mã sản phẩm sale',
          field: 'ProductSaleID',
          width: 200,
          headerSort: false,
          frozen: true,
          formatter: (cell: any) => {
            const id = cell.getValue();
            const item = this.productSales.find((p: any) => p.ID === id);
            const displayText = item?.ProductCode || '';
            // Return clickable cell with icon
            return `<div style="cursor: pointer; display: flex; align-items: center; gap: 5px;">
                      <span>${displayText}</span>
                      <i class="fas fa-search" style="color: #1890ff; font-size: 0.85em;"></i>
                    </div>`;
          },
          cellClick: (e: any, cell: any) => {
            this.openProductSalePopup(cell);
          }
        },
        {
          title: 'Mã sản phẩm Demo',
          field: 'ProductRTCID',
          width: 150,
          headerSort: false,
          frozen: true,
          formatter: (cell: any) => {
            const id = cell.getValue();
            const item = this.productRTCs.find((p: any) => p.ID === id);
            const displayText = item?.ProductCode || '';
            // Return clickable cell with icon
            return `<div style="cursor: pointer; display: flex; align-items: center; gap: 5px;">
                      <span>${displayText}</span>
                      <i class="fas fa-search" style="color: #1890ff; font-size: 0.85em;"></i>
                    </div>`;
          },
          cellClick: (e: any, cell: any) => {
            this.openProductRTCPopup(cell);
          }
        },
        { title: 'Tồn CK', field: 'TotalQuantityLast', editor: "number", width: 150, headerSort: false, frozen: true },
        { title: 'Tên sản phẩm', field: 'ProductName', editor: "input", width: 300, headerSort: false, formatter: 'textarea' },
        { title: 'Mã nội bộ', field: 'ProductNewCode', editor: "input", width: 150, headerSort: false, formatter: 'textarea' },
        { title: 'Tên nhóm', field: 'ProductGroupName', editor: "input", width: 150, headerSort: false, formatter: 'textarea' },
        { title: 'Mã sản phẩm NCC', field: 'ProductCodeOfSupplier', editor: "input", width: 150, headerSort: false, formatter: 'textarea' },
        {
          title: 'Mã dự án',
          field: 'ProjectID',
          editor: "list",
          editorParams: { list: this.projects },
          width: 150,
          headerSort: false,
          formatter: (cell: any) => {
            const id = cell.getValue();
            const item = this.projects.find((p: any) => p.ID === id);
            return item?.ProjectCode || '';
          }
        },
        { title: 'Tên dự án', field: 'ProjectName', editor: "input", width: 150, headerSort: false },
        { title: 'Đơn vị', field: 'UnitName', editor: "input", width: 150, headerSort: false },
        {
          title: 'Số lượng',
          field: 'QtyRequest',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter
        },
        {
          title: 'Thành tiền',
          field: 'ThanhTien',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: '% VAT', field: 'VAT', editor: "number", width: 150, headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Tổng tiền VAT',
          field: 'VATMoney',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Hóa đơn', field: 'IsBill', width: 150, headerSort: false, hozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color: #1677ff;" />`;
          },
          cellClick: (e: any, cell: any) => {
            const currentValue = cell.getValue();
            const newValue = !(currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1');
            cell.setValue(newValue);
          }
        },
        {
          title: '% Chiết khấu',
          field: 'DiscountPercent',
          editor: "number", width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Chiết khấu',
          field: 'Discount',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Phí vận chuyển',
          field: 'FeeShip',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Tổng tiền',
          field: 'TotalPrice',
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            // Cập nhật tổng tiền PO vào form
            this.companyForm.patchValue({ TotalMoneyPO: value }, { emitEvent: false });
            return `<strong>${value ? value.toLocaleString('en-US') : '0'}</strong>`;
          }
        },
        {
          title: 'Tổng tiền quy đổi (VNĐ)',
          field: 'CurrencyExchange',
          editor: "number",
          width: 150,
          headerSort: false,
          visible: this.poncc && this.poncc.ID > 0, // Chỉ hiện khi edit
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Mã sản phẩm cha',
          field: 'ParentProductCode',
          width: 150,
          headerSort: false
        },
        {
          title: 'không mua', field: 'IsPurchase', width: 150, headerSort: false, hozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color: #1677ff;" />`;
          },
          cellClick: (e: any, cell: any) => {
            const currentValue = cell.getValue();
            const newValue = !(currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1');
            cell.setValue(newValue);
          }
        },
        {
          title: 'Deadline giao hàng',
          field: 'DeadlineDelivery',
          editor: "date",
          width: 150,
          headerSort: false,
          formatter: dateFormatter
        },
        {
          title: 'Ngày về dự kiến',
          field: 'ExpectedDate',
          editor: "date",
          width: 150,
          headerSort: false,
          hozAlign: 'center',
          formatter: dateFormatter
        },
        {
          title: 'Ngày về thực tế',
          field: 'ActualDate',
          editor: "date",
          width: 150,
          headerSort: false,
          hozAlign: 'center',
          formatter: dateFormatter
        },
        {
          title: 'Giá bán',
          field: 'PriceSale',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Ngày trả dự kiến',
          field: 'DateReturnEstimated',
          width: 150,
          headerSort: false,
          hozAlign: 'center',
          formatter: dateFormatter
        },
        {
          title: 'Giá lịch sử',
          field: 'PriceHistory',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        {
          title: 'Giá chào thầu',
          field: 'BiddingPrice',
          editor: "number",
          width: 150,
          headerSort: false,
          formatter: moneyFormatter,
          bottomCalc: 'sum',
          bottomCalcFormatter: bottomCalcMoneyFormatter
        },
        { title: 'Ghi chú', field: 'Note', editor: "input", width: 150, headerSort: false, formatter: 'textarea' },
        { title: 'Mã YCMH', field: 'YCMHCode', editor: "input", width: 150, headerSort: false, formatter: 'textarea' },
        {
          title: 'Chọn YCMH',
          field: 'selectYCMH',
          width: 120,
          headerSort: false,
          hozAlign: 'center',
          formatter: () => {
            return `<button class="btn btn-sm btn-primary" style="font-size: 0.75rem;">
                      <i class="fas fa-plus"></i> Chọn
                    </button>`;
          },
          cellClick: (e: any, cell: any) => {
            this.openYCMHModal(cell);
          }
        },
      ],

    } as any);

    // Đăng ký sự kiện cellEdited
    this.tabulatorHangTien.on('cellEdited', (cell: any) => this.onCellEdited(cell));
  }

  addRow() {
    if (this.tabulatorHangTien) {
      const data = this.tabulatorHangTien.getData();
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tabulatorHangTien.addRow({
        ID: 0,
        STT: maxSTT + 1,
      }, false);
    }
  }

  resetSTT() {
    const rows = this.tabulatorHangTien?.getRows();
    rows?.forEach((row: any, index: any) => {
      row.update({ STT: index + 1 });
    });
  }

  getEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
      },
    });
  }

  getRulePay(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.supplierSaleService.getRulePay().subscribe({
        next: (data) => {
          if (data.status == 1) {
            this.rulepays = data.data.map((item: any) => ({
              title: item.Code + " - " + item.Note,
              value: item.ID
            }));
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Không có dữ liệu liên hệ nào được tìm thấy.'
            );
          }
          resolve();
        },
        error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
            reject(error);
        }
      });
    });
  }

  addRulePay() {
    let newRulePay = {
      Code: '',
      Note: ''
    };

    const modalRef = this.modalService.open(RulePayDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.newRulePay = newRulePay;
    modalRef.componentInstance.isCheckmode = false;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getRulePay();
        }
      },
      (reason) => {
      }
    );
  }

  getCurrencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.projectPartlistPurchaseRequestService.getCurrencies().subscribe({
        next: (res: any) => {
          this.currencies = res || [];
          // Sau khi currencies được load, nếu đã có CurrencyID trong form thì cập nhật CurrencyRate
          const currencyId = this.companyForm?.get('CurrencyID')?.value;
          if (currencyId && this.currencies.length > 0) {
            // Đợi một chút để đảm bảo form đã được khởi tạo xong
            setTimeout(() => {
              this.onCurrencyChange(currencyId);
            }, 100);
          }
          resolve();
        }, error: (error: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
          reject(error);
        }
      });
    });
  }

  getBillCode(poTypeId: number) {
    if (this.skipBillCodeGeneration) {
      return;
    }

    this.ponccService.getBillCode(poTypeId).subscribe({
      next: (res: any) => {
        this.companyForm.patchValue({
          BillCode: res.data
        })
      }, error: (error: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
      }
    });
  }



  private loadLookups() {
    this.ponccService.getProductSale().subscribe({
      next: (data) => {
        console.log('ProductSale data:', data);
        this.productSales = data || [];
        this.updateEditorLookups();
      },
      error: (err) =>  {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
    this.ponccService.getProductRTC().subscribe({
      next: (data) => {
        console.log('ProductRTC data:', data);
        this.productRTCs = data || [];
        this.updateEditorLookups();
      },
      error: (err) => console.error('ProductRTC API error:', err)
    });
    this.ponccService.getProjects().subscribe({
      next: (data) => {
        console.log('Projects data:', data);
        this.projects = data || [];
        this.updateEditorLookups();
      },
      error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }

  private updateEditorLookups() {
    if (!this.tabulatorHangTien) return;
    let t = this.tabulatorHangTien;
    try {
      // ProductSaleID and ProductRTCID now use popup, no need to update editor params
      // Only update ProjectID if it still uses list editor
      t.updateColumnDefinition('ProjectID', {
        editorParams: { values: this.projects.map((c) => ({ value: c.ID, label: c.ProjectCode })) },
      } as any);
    } catch { }
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number' || !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  }

  private recalculateRow(row: any, editedField?: string): void {
    const data = row.getData();

    const quantity = Number(data['QtyRequest']) || 0;
    const unitPrice = Number(data['UnitPrice']) || 0;
    const discountPercent = Number(data['DiscountPercent']) || 0;
    const feeShip = Number(data['FeeShip']) || 0;
    const currencyRate = this.companyForm.get('CurrencyRate')?.value || 0;

    const thanhTien = quantity * unitPrice;
    const discount = thanhTien * (discountPercent / 100);

    let vatMoney: number;
    let vat: number;

    // Nếu user edit VATMoney trực tiếp, tính ngược lại VAT%
    if (editedField === 'VATMoney') {
      vatMoney = Number(data['VATMoney']) || 0;
      // Tính ngược VAT% từ VATMoney
      vat = thanhTien > 0 ? (vatMoney / thanhTien) * 100 : 0;
    } else {
      // Tính VATMoney từ VAT%
      vat = Number(data['VAT']) || 0;
      vatMoney = thanhTien * (vat / 100);
    }

    const totalPrice = thanhTien + vatMoney - discount + feeShip;
    const currencyExchange = totalPrice * currencyRate;

    // Tự động tích checkbox "Hóa đơn" khi VATMoney > 0
    const isBill = vatMoney > 0;

    row.update({
      ThanhTien: thanhTien,
      VAT: vat,
      VATMoney: vatMoney,
      Discount: discount,
      TotalPrice: totalPrice,
      CurrencyExchange: currencyExchange,
      IsBill: isBill
    });
  }

  // Mở popup chọn ProductSale
  openProductSalePopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    // Toggle: nếu đang mở thì đóng
    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    // Mở popup mới với TabulatorPopupService
    this.tabulatorPopupService.open(
      {
        data: this.productSales || [],
        columns: this.productSalePopupColumns,
        searchFields: ['ProductCode', 'ProductName', 'ProductNewCode'],
        searchPlaceholder: 'Tìm kiếm sản phẩm sale...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '600px',
        maxWidth: '800px',
        showClearButton: true,
        onRowSelected: (selectedProduct) => {
          // Update the row with selected product data
          const row = cell.getRow();
          this.updateProductInfo(row, selectedProduct.ID, true);

          // Redraw cell to update display
          cell.getTable().redraw(true);

          // Đóng popup
          this.tabulatorPopupService.close();
        },
        onCleared: () => {
          // Xóa giá trị ProductSale đã chọn
          const row = cell.getRow();
          row.update({
            ProductSaleID: 0,
            ProductName: '',
            UnitName: '',
            ProductNewCode: '',
            ProductGroupName: '',
            Note: '',
            ProductCodeOfSupplier: '',
            PriceHistory: 0,
          });
          cell.getTable().redraw(true);
        },
        onClosed: () => {
          // Optional: xử lý khi popup đóng
        },
      },
      cellElement
    );
  }

  // Mở popup chọn ProductRTC
  openProductRTCPopup(cell: CellComponent): void {
    const cellElement = cell.getElement();

    // Toggle: nếu đang mở thì đóng
    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    // Mở popup mới với TabulatorPopupService
    this.tabulatorPopupService.open(
      {
        data: this.productRTCs || [],
        columns: this.productRTCPopupColumns,
        searchFields: ['ProductCode', 'ProductName', 'ProductCodeRTC'],
        searchPlaceholder: 'Tìm kiếm sản phẩm RTC...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '600px',
        maxWidth: '800px',
        showClearButton: true,
        onRowSelected: (selectedProduct) => {
          // Update the row with selected product data
          const row = cell.getRow();
          this.updateProductInfo(row, selectedProduct.ID, false);

          // Redraw cell to update display
          cell.getTable().redraw(true);

          // Đóng popup
          this.tabulatorPopupService.close();
        },
        onCleared: () => {
          // Xóa giá trị ProductRTC đã chọn
          const row = cell.getRow();
          row.update({
            ProductRTCID: 0,
            ProductName: '',
            UnitName: '',
            ProductNewCode: '',
            ProductGroupName: '',
            Note: '',
            ProductCodeOfSupplier: '',
            PriceHistory: 0,
          });
          cell.getTable().redraw(true);
        },
        onClosed: () => {
          // Optional: xử lý khi popup đóng
        },
      },
      cellElement
    );
  }

  // Helper function để cập nhật thông tin sản phẩm
  private updateProductInfo(row: any, productId: number, isProductSale: boolean): void {
    const productList = isProductSale ? this.productSales : this.productRTCs;
    const product = productList.find((p: any) => p.ID === productId);

    if (!product) return;

    const employeePurchaseIDs = [49, 179];
    const productCodeOfSupplier = employeePurchaseIDs.includes(this.appUserService.employeeID || 0)
      ? product.ProductName
      : `${product.ProductName} ${product.ProductCode || ''}`;

    const updateData: any = {
      ProductSaleID: isProductSale ? productId : 0,
      ProductRTCID: isProductSale ? 0 : productId,
      ProductName: product.ProductName || '',
      UnitName: isProductSale ? (product.Unit || '') : (product.UnitCountName || ''),
      ProductNewCode: isProductSale ? (product.ProductNewCode || '') : (product.ProductCodeRTC || ''),
      ProductGroupName: product.ProductGroupName || '',
      Note: product.Note || '',
      ProductCodeOfSupplier: productCodeOfSupplier,
    };

    row.update(updateData);

    // Gọi API getHistoryPrice nếu có productCode
    if (product.ProductCode) {
      this.ponccService.getHistoryPrice(product.ID, product.ProductCode).subscribe({
        next: (response) => {
          row.update({ PriceHistory: response.data || 0 });
        },
        error: (err) => console.error('HistoryPrice API error:', err)
      });
    }
  }

  private onCellEdited(cell: any): void {
    const row = cell.getRow();
    const field = cell.getField();
    const newValue = cell.getValue();

    // Note: ProductSaleID and ProductRTCID are now handled in popup callbacks,
    // so we don't need to handle them here anymore

    // Xử lý thay đổi ProjectID - tự động điền ProjectName
    if (field === 'ProjectID' && newValue) {
      const project = this.projects.find((p: any) => p.ID === newValue);
      if (project) {
        row.update({
          ProjectName: project.ProjectName || '',
        });
      }
    }

    const selectedRows = this.tabulatorHangTien?.getSelectedRows() || [];

    // Nếu có dòng được chọn, cập nhật tất cả các dòng đã chọn
    if (selectedRows.length > 0) {
      selectedRows.forEach((selectedRow: any) => {
        // Bỏ qua dòng đang được edit
        if (selectedRow === row) return;

        const rowData = selectedRow.getData();
        const oldValue = rowData[field];

        // Chỉ cập nhật nếu giá trị thực sự khác
        if (this.normalizeValue(oldValue) !== this.normalizeValue(newValue)) {
          selectedRow.update({ [field]: newValue });

          // Cập nhật thông tin sản phẩm cho các dòng được chọn
          if (field === 'ProductSaleID' && newValue) {
            this.updateProductInfo(selectedRow, newValue, true);
          }

          if (field === 'ProductRTCID' && newValue) {
            this.updateProductInfo(selectedRow, newValue, false);
          }

          // Cập nhật ProjectName cho các dòng được chọn
          if (field === 'ProjectID' && newValue) {
            const project = this.projects.find((p: any) => p.ID === newValue);
            if (project) {
              selectedRow.update({
                ProjectName: project.ProjectName || '',
              });
            }
          }

          // Tính lại nếu là trường ảnh hưởng đến tổng tiền
          if (['QtyRequest', 'UnitPrice', 'VAT', 'DiscountPercent', 'FeeShip', 'VATMoney'].includes(field)) {
            this.recalculateRow(selectedRow);
          }
        }
      });
    }

    // Luôn tính lại cho dòng đang edit nếu cần
    if (['QtyRequest', 'UnitPrice', 'VAT', 'DiscountPercent', 'FeeShip', 'VATMoney'].includes(field)) {
      this.recalculateRow(row);
    }
  }

  openYCMHModal(cell: any) {
    const row = cell.getRow();
    const supplierSaleId = this.informationForm.get('SupplierSaleID')?.value;
    const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.showHeader = true;
    modalRef.componentInstance.headerText = "Yêu cầu mua hàng";
    modalRef.componentInstance.showCloseButton = true;
    modalRef.componentInstance.supplierId = supplierSaleId || 0;
    modalRef.componentInstance.isYCMH = true;

    modalRef.result.then((selectedData) => {
      if (!selectedData || !selectedData.strLstCodes || !selectedData.strLstRequestBuyIDs) {
        return;
      }

      row.update({
        PONCCDetailRequestBuyID: selectedData.strLstRequestBuyIDs,
        YCMHCode: selectedData.strLstCodes
      });
    }, () => { });
  }

  onAddSupplierSale() {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0;
    modalRef.result.finally(() => {
      this.getSupplierSale();
    });
  }

  // Lưu và đóng modal
  saveAndClose() {
    this.saveData(true);
  }

  // Lưu nhưng không đóng modal
  saveOnly() {
    this.saveData(false);
  }

  private saveData(closeAfterSave: boolean = true) {
    // Bước 1: Validate tất cả các form
    const isInformationValid = this.validateForm(this.informationForm);
    const isCompanyValid = this.validateForm(this.companyForm);

    if (!isInformationValid || !isCompanyValid) {
      return;
    }
    const tableData = this.tabulatorHangTien?.getData() || [];
    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];
      const quantity = Number(row.QtyRequest) || 0;
      const stt = row.STT || (i + 1);

      if (quantity <= 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Dòng ${stt}: Số lượng phải lớn hơn 0!\nSản phẩm: ${row.ProductName || 'Chưa có tên'}`
        );
        return;
      }
    }

    const ponccData = this.prepareDataForSave(tableData);
    console.log('ponccData', ponccData);
    let poncc = ponccData.poncc;
    this.ponccService.checkPoCode(poncc.ID, poncc.POCode, poncc.BillCode).subscribe({
      next: (res) => {
        if (res.data == 0) {
          this.save(ponccData, closeAfterSave);
        } else {
          this.modal.confirm({
            nzTitle: `Số đơn hàng [${poncc.BillCode}] đã tồn tại?\nBạn có muốn tự động tăng Số đơn hàng không.`,
            nzOkText: 'Ok',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOkDanger: false,
            nzClosable: false,
            nzOnOk: () => {
              this.ponccService.getBillCode(poncc.POType).subscribe({
                next: (res) => {
                  ponccData.poncc.BillCode = res.data;
                  this.save(ponccData, closeAfterSave);
                }, error: (error) => {
                    this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
                }
              });
            },
          });
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      }
    });
  }

  save(data: any, closeAfterSave: boolean = true) {
    this.ponccService.saveData(data).subscribe({
      next: (res) => {
        // Check if response indicates success
        if (res && (res.status === 1 || res.success === true || res.status === true)) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công!');

          // Reload data after save to get latest info including ID for new records
          if (res.data && res.data.ID) {
            this.poncc = { ...this.poncc, ID: res.data.ID };
            // Reload detail if needed
            this.loadPONCCDetail(res.data.ID);
          }

          if (closeAfterSave) {
            this.activeModal.close(res.data); // Close modal only if requested
          }
        } else {
          // API returned but with failure status
          const errorMessage = res?.message || 'Lưu không thành công!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          // Don't close modal - let user fix the issue
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || err.message);
        // Don't close modal on error
      }
    });
  }

  private loadPONCCDetail(id: number) {
    this.ponccService.getDetails(id).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.ponccDetail = res.data.data || [];
          this.dtRef = res.data.dtRef || [];
          this.initTabulatorHangTien();
        }
      },
      error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }

  // Hàm validate form
  private validateForm(form: FormGroup): boolean {
    // Mark all fields as touched để hiển thị lỗi
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });

    if (form.invalid) return false;
    return true;
  }

  // Hàm chuẩn bị dữ liệu để lưu
  private prepareDataForSave(tableData: any[]): any {
    // Chuẩn bị dữ liệu bảng (PONCCDetails)
    console.log('tableData:', tableData);

    const ponccDetails = tableData.map((row: any) => ({
      ID: row.ID || 0,
      STT: row.STT || 0,
      ProductSaleID: row.ProductSaleID || 0,
      ProductRTCID: row.ProductRTCID || 0,
      TotalQuantityLast: row.TotalQuantityLast || 0,
      ProductName: row.ProductName || '',
      ProductNewCode: row.ProductNewCode || '',
      ProductGroupName: row.ProductGroupName || '',
      ProductCodeOfSupplier: row.ProductCodeOfSupplier || '',
      ProjectID: row.ProjectID || 0,
      ProjectName: row.ProjectName || '',
      UnitName: row.UnitName || '',
      QtyRequest: row.QtyRequest || 0,
      UnitPrice: row.UnitPrice || 0,
      ThanhTien: row.ThanhTien || 0,
      VAT: row.VAT || 0,
      VATMoney: row.VATMoney || 0,
      IsBill: row.IsBill || false,
      DiscountPercent: row.DiscountPercent || 0,
      Discount: row.Discount || 0,
      FeeShip: row.FeeShip || 0,
      TotalPrice: row.TotalPrice || 0,
      CurrencyExchange: row.CurrencyExchange || 0,
      ParentProductCode: row.ParentProductCode || '',
      IsPurchase: row.IsPurchase || false,
      DeadlineDelivery: row.DeadlineDelivery || null,
      ExpectedDate: row.ExpectedDate || null,
      ActualDate: row.ActualDate || null,
      PriceSale: row.PriceSale || 0,
      DateReturnEstimated: row.DateReturnEstimated || null,
      PriceHistory: row.PriceHistory || 0,
      BiddingPrice: row.BiddingPrice || 0,
      Note: row.Note || '',
      YCMHCode: row.YCMHCode || '',
      PONCCDetailRequestBuyID: row.PONCCDetailRequestBuyID || '',
      ProjectPartlistPurchaseRequestID: row.ProjectPartlistPurchaseRequestID || 0,
      ProjectPartlistID: row.ProjectPartListID || 0,
    }));

    // Kết hợp tất cả dữ liệu
    let dataMaster = {
      // lất dữ liệu master
      ID: this.poncc?.ID || 0,
      SupplierSaleID: this.informationForm.get('SupplierSaleID')?.value,
      POCode: this.informationForm.get('POCode')?.value,
      EmployeeID: this.informationForm.get('EmployeeID')?.value,
      Company: this.informationForm.get('Company')?.value,
      POType: this.informationForm.get('POType')?.value,

      RequestDate: this.companyForm.get('RequestDate')?.value,
      BillCode: this.companyForm.get('BillCode')?.value,
      Status: this.companyForm.get('Status')?.value,
      TotalMoneyPO: this.companyForm.get('TotalMoneyPO')?.value,
      CurrencyID: this.companyForm.get('CurrencyID')?.value,
      CurrencyRate: this.companyForm.get('CurrencyRate')?.value,
      DeliveryDate: this.companyForm.get('DeliveryDate')?.value,

      AddressDelivery: this.diffForm.get('AddressDelivery')?.value,

      AccountNumberSupplier: this.extraForm.get('AccountNumberSupplier')?.value,
      BankCharge: this.extraForm.get('BankCharge')?.value,
      FedexAccount: this.extraForm.get('FedexAccount')?.value,
      OriginItem: this.extraForm.get('OriginItem')?.value,
      SupplierVoucher: this.extraForm.get('SupplierVoucher')?.value,
      BankSupplier: this.extraForm.get('BankSupplier')?.value,
      RuleIncoterm: this.extraForm.get('RuleIncoterm')?.value,
      OrderTargets: this.extraForm.get('OrderTargets')?.value,
      NCCNew: this.extraForm.get('NCCNew')?.value,
      DeptSupplier: this.extraForm.get('DeptSupplier')?.value,
      ShippingPoint: this.diffForm.get('ShippingPoint')?.value,

      ReasonForFailure: this.extraForm.get('ReasonForFailure')?.value,
      OrderQualityNotMet: this.extraForm.get('OrderQualityNotMet')?.value,

      Note: this.informationForm.get('Note')?.value,

      OtherTerms: this.diffForm.get('OtherTerms')?.value,

    };

    let data = {
      RulePayID: this.informationForm.get('RulePayID')?.value,
      IsCheckTotalMoneyPO: this.informationForm.get('IsCheckTotalMoneyPO')?.value,
      OrderQualityNotMet: this.extraForm.get('OrderQualityNotMet')?.value,
      poncc: dataMaster,
      lstPONCCDetail: ponccDetails,
      lstPrjPartlistPurchaseRequest: this.lstPrjPartlistPurchaseRequest || [],
      lstBillImportId: this.lstBillImportId || []
    }

    return data;
  }

  // Xử lý click vào link tham chiếu
  onReferenceLinkClick(link: any): void {
    let billImportId = link.id;
    let warehouseType = link.warehouseType;
    let ponccId = this.poncc?.ID;

    if (warehouseType.toLowerCase() == 'sale') {
      this.openBillImportSaleModal(billImportId, ponccId);
    }
    else {
      this.openBillImportTechnicalModal(billImportId, ponccId);
    }
  }

  // Luồng riêng để load chi tiết từ PONCC sang BillImport
  private loadPONCCDetailForBillImport(callback: (ponccDetails: any[]) => void): void {
    // Ưu tiên: Lấy chi tiết PONCC từ bảng hiện tại (dữ liệu mới nhất)
    if (this.tabulatorHangTien) {
      const ponccDetails = this.tabulatorHangTien.getData() || [];
      console.log('🔵 [PONCC->BillImport] Loaded details from table:', ponccDetails.length, 'items');
      callback(ponccDetails);
      return;
    }

    // Fallback: Sử dụng ponccDetail từ Input nếu table chưa khởi tạo
    if (this.ponccDetail && this.ponccDetail.length > 0) {
      console.log('🔵 [PONCC->BillImport] Loaded details from ponccDetail input:', this.ponccDetail.length, 'items');
      callback(this.ponccDetail);
      return;
    }

    // Nếu không có dữ liệu, trả về mảng rỗng
    console.warn('⚠️ [PONCC->BillImport] Không tìm thấy dữ liệu chi tiết PONCC');
    callback([]);
  }

  // Luồng riêng để xử lý BillImportDetail (kho sale)
  private openBillImportSaleModal(billImportId: number, ponccId: number): void {
    // Kiểm tra: Nếu có billImportId thì xem phiếu đã tạo, ngược lại tạo mới từ PONCC
    if (billImportId > 0) {
      // Luồng 1: Xem phiếu nhập kho đã tạo
      this.openExistingBillImportModal(billImportId, ponccId);
    } else {
      // Luồng 2: Tạo phiếu nhập kho mới từ PONCC
      this.openNewBillImportFromPONCC(ponccId);
    }
  }

  // Luồng 1: Xem phiếu nhập kho đã tạo
  private openExistingBillImportModal(billImportId: number, ponccId: number): void {
    // Chỉ cần lấy warehouseCode, phần còn lại để component tự load
    this.billImportService.getBillImportByID(billImportId).subscribe({
      next: (response) => {
        const billImport = response.data;

        this.ponccService.getWarehouseCode(billImport.WarehouseID).subscribe({
          next: (warehouseResponse) => {
            const warehouseCode = warehouseResponse.data || '';

            console.log('🔵 [Existing BillImport] Opening modal for ID:', billImportId);

            const modalRef = this.modalService.open(BillImportDetailComponent, {
              backdrop: 'static',
              keyboard: false,
              centered: true,
              windowClass: 'full-screen-modal',
            });

            // Set isCheckmode = true để component tự động load dữ liệu
            modalRef.componentInstance.isCheckmode = true;
            modalRef.componentInstance.id = billImportId;
            modalRef.componentInstance.WarehouseCode = warehouseCode;
            modalRef.componentInstance.warehouseID = billImport.WarehouseID;
            modalRef.componentInstance.poNCCId = ponccId ?? 0;

            modalRef.result
              .then(() => {
                // Reload danh sách tham chiếu sau khi cập nhật
                if (this.poncc && this.poncc.ID > 0) {
                  this.loadReferenceLinks();
                }
              })
              .catch(() => {
                // Xử lý khi modal bị hủy
              });
          },
          error: (err) => this.notification.error(
            NOTIFICATION_TITLE.error,
            `Lỗi khi lấy thông tin kho: ${err}`
          )
        });
      },
      error: (err) => this.notification.error(
        NOTIFICATION_TITLE.error,
        `Lỗi khi lấy thông tin phiếu nhập kho: ${err}`
      )
    });
  }

  // Luồng 2: Tạo phiếu nhập kho mới từ PONCC
  private openNewBillImportFromPONCC(ponccId: number): void {
    this.loadPONCCDetailForBillImport((ponccDetails) => {
      if (!this.poncc) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy thông tin PONCC');
        return;
      }

      // Xác định WarehouseID: ưu tiên từ PONCC, fallback về mặc định
      const warehouseID = this.poncc.WarehouseID || 1; // 1 là ID kho HN mặc định

      // Chuẩn bị dữ liệu master cho phiếu nhập kho mới
      const newBillImport = {
        Id: 0,
        BillImportCode: '', // Sẽ tự động tạo
        ReciverID: 0,
        Reciver: '',
        DeliverID: this.poncc.EmployeeID || 0,
        Deliver: '',
        KhoType: '',
        KhoTypeID: 0, // Sẽ được set dựa vào sản phẩm
        WarehouseID: warehouseID,
        BillTypeNew: 4, // Yêu cầu nhập kho
        SupplierID: this.poncc.SupplierSaleID || 0,
        Supplier: '',
        CreatDate: new Date(),
        RulePayID: this.informationForm.get('RulePayID')?.value || 0,
        DateRequestImport: new Date(),
      };

      // Lấy mã kho
      this.ponccService.getWarehouseCode(warehouseID).subscribe({
        next: (response) => {
          const warehouseCode = response.data || 'HN';

          console.log('🔵 [PONCC->BillImport] Opening modal with:', {
            ponccId,
            warehouseCode,
            warehouseID,
            detailCount: ponccDetails.length,
            supplierID: newBillImport.SupplierID
          });

          // Mở modal với dữ liệu từ PONCC
          const modalRef = this.modalService.open(BillImportDetailComponent, {
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'full-screen-modal',
          });

          modalRef.componentInstance.newBillImport = newBillImport;
          modalRef.componentInstance.WarehouseCode = warehouseCode;
          modalRef.componentInstance.warehouseID = warehouseID;
          modalRef.componentInstance.id = 0; // ID = 0 cho phiếu mới
          modalRef.componentInstance.poNCCId = ponccId ?? 0;
          modalRef.componentInstance.selectedList = ponccDetails; // Dùng selectedList cho phiếu tạo từ PONCC

          modalRef.result
            .then(() => {
              // Reload lại danh sách tham chiếu sau khi tạo phiếu thành công
              if (this.poncc && this.poncc.ID > 0) {
                this.loadReferenceLinks();
              }
            })
            .catch(() => {
              // Xử lý khi modal bị hủy
            });
        },
        error: (err) => this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi lấy thông tin kho: ${err}`
        )
      });
    });
  }

  // Luồng riêng để xử lý BillImportTechnical (kho kỹ thuật)
  private openBillImportTechnicalModal(billImportId: number, ponccId: number): void {
    // Kiểm tra: Nếu có billImportId thì xem phiếu đã tạo, ngược lại tạo mới từ PONCC
    if (billImportId > 0) {
      // Luồng 1: Xem phiếu nhập kho kỹ thuật đã tạo
      this.openExistingBillImportTechnicalModal(billImportId, ponccId);
    } else {
      // Luồng 2: Tạo phiếu nhập kho kỹ thuật mới từ PONCC
      this.openNewBillImportTechnicalFromPONCC(ponccId);
    }
  }

  // Luồng 1: Xem phiếu nhập kho kỹ thuật đã tạo
  private openExistingBillImportTechnicalModal(billImportId: number, ponccId: number): void {
    this.ponccService.getBillImportTech(billImportId).subscribe({
      next: (response) => {
        const billImport = response.data;

        this.ponccService.getWarehouseCode(billImport.WarehouseID).subscribe({
          next: (warehouseResponse) => {
            const warehouseCode = warehouseResponse.data || '';

            console.log('🔵 [Existing BillImportTech] Opening modal for ID:', billImportId);

            const modalRef = this.modalService.open(BillImportTechnicalFormComponent, {
              backdrop: 'static',
              keyboard: false,
              centered: true,
              windowClass: 'full-screen-modal',
            });

            // Set masterId để component tự động load chi tiết
            modalRef.componentInstance.masterId = billImportId;
            modalRef.componentInstance.dataEdit = billImport;
            modalRef.componentInstance.IsEdit = true;
            modalRef.componentInstance.warehouseID = billImport.WarehouseID;
            modalRef.componentInstance.WarehouseCode = warehouseCode;
            modalRef.componentInstance.PonccID = ponccId ?? 0;

            modalRef.result
              .then(() => {
                // Reload danh sách tham chiếu sau khi cập nhật
                if (this.poncc && this.poncc.ID > 0) {
                  this.loadReferenceLinks();
                }
              })
              .catch(() => {
                // Xử lý khi modal bị hủy
              });
          },
          error: (err) => this.notification.error(
            NOTIFICATION_TITLE.error,
            `Lỗi khi lấy thông tin kho: ${err}`
          )
        });
      },
      error: (err) => this.notification.error(
        NOTIFICATION_TITLE.error,
        `Lỗi khi lấy thông tin phiếu nhập kho kỹ thuật: ${err}`
      )
    });
  }

  // Luồng 2: Tạo phiếu nhập kho kỹ thuật mới từ PONCC
  private openNewBillImportTechnicalFromPONCC(ponccId: number): void {
    this.loadPONCCDetailForBillImport((ponccDetails) => {
      if (!this.poncc) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy thông tin PONCC');
        return;
      }

      // Xác định WarehouseID
      const warehouseID = this.poncc.WarehouseID || 1;

      // Chuẩn bị dữ liệu master cho phiếu nhập kho kỹ thuật mới
      const newBillImport = {
        ID: 0,
        BillCode: '', // Sẽ tự động tạo
        BillTypeNew: 5, // Y/c nhập kho
        ReceiverID: 0,
        DeliverID: this.poncc.EmployeeID || 0,
        SupplierSaleID: this.poncc.SupplierSaleID || 0,
        CustomerID: 0,
        WarehouseID: warehouseID,
        CreatDate: new Date(),
        RulePayID: this.informationForm.get('RulePayID')?.value || 0,
        DateRequestImport: new Date(),
        Status: false,
      };

      // Lấy mã kho
      this.ponccService.getWarehouseCode(warehouseID).subscribe({
        next: (response) => {
          const warehouseCode = response.data || 'HN';

          console.log('🔵 [PONCC->BillImportTech] Opening modal with:', {
            ponccId,
            warehouseCode,
            warehouseID,
            detailCount: ponccDetails.length,
            supplierID: newBillImport.SupplierSaleID
          });

          const modalRef = this.modalService.open(BillImportTechnicalFormComponent, {
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'full-screen-modal',
          });

          // Truyền dữ liệu vào component
          modalRef.componentInstance.newBillImport = newBillImport;
          modalRef.componentInstance.warehouseID = warehouseID;
          modalRef.componentInstance.WarehouseCode = warehouseCode;
          modalRef.componentInstance.PonccID = ponccId ?? 0;
          modalRef.componentInstance.flag = 1; // Kích hoạt luồng PONCC
          modalRef.componentInstance.dtDetails = ponccDetails; // Chi tiết từ PONCC

          modalRef.result
            .then(() => {
              // Reload danh sách tham chiếu sau khi tạo phiếu thành công
              if (this.poncc && this.poncc.ID > 0) {
                this.loadReferenceLinks();
              }
            })
            .catch(() => {
              // Xử lý khi modal bị hủy
            });
        },
        error: (err) => this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi lấy thông tin kho: ${err}`
        )
      });
    });
  }

  openModalProductSale() {
    let newProductSale = {
      ProductCode: '',
      ProductName: '',
      Maker: '',
      Unit: '',
      NumberInStoreDauky: 0,
      NumberInStoreCuoiKy: 0,
      ProductGroupID: 0,
      LocationID: 0,
      FirmID: 0,
      Note: '',
    };
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductSale = newProductSale;
    modalRef.componentInstance.isCheckmode = false;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.ponccService.getProductSale().subscribe({
          next: (data) => {
            console.log('ProductSale data:', data);
            this.productSales = data || [];
            this.updateEditorLookups();
          },
          error: (err) => console.error('ProductSale API error:', err)
        });
      }
    });
  }

  onPrint() {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Chức năng đang được cập nhật!`
    );
  }

  onPrintPO(language: string) {
    if (!this.poncc || !this.poncc.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng lưu PO trước khi in!'
      );
      return;
    }

    this.language = language;

    // Load data to print
    this.ponccService.printPO(this.poncc.ID, this.isMerge).subscribe({
      next: (response) => {
        this.dataPrint = response.data;
        this.renderPDF(this.language);
        this.showPreview = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Không thể tải dữ liệu để in!'
        );
      }
    });
  }

  renderPDF(language: string) {
    console.log('🔵 renderPDF - language:', language);
    const docDefinition = language === 'vi'
      ? this.onCreatePDFLanguageVi(this.dataPrint, this.isShowSign, this.isShowSeal)
      : this.onCreatePDFLanguageEn(this.dataPrint, this.isShowSign, this.isShowSeal);
    console.log('🔵 docDefinition:', docDefinition);

    pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
      this.pdfSrc = URL.createObjectURL(blob);
      this.cdr.detectChanges();
    });
  }

  toggleSign() {
    this.renderPDF(this.language);
  }

  toggleSeal() {
    this.renderPDF(this.language);
  }

  toggleMerge() {
    this.ponccService.printPO(this.poncc.ID, this.isMerge).subscribe({
      next: (response) => {
        this.dataPrint = response.data;
        this.renderPDF(this.language);
      }
    });
  }

  downloadPDF() {
    const docDefinition = this.language === 'vi'
      ? this.onCreatePDFLanguageVi(this.dataPrint, this.isShowSign, this.isShowSeal)
      : this.onCreatePDFLanguageEn(this.dataPrint, this.isShowSign, this.isShowSeal);

    pdfMake.createPdf(docDefinition).download(`PO_${this.poncc.BillCode}.pdf`);
  }

  onCreatePDFLanguageVi(data: any, isShowSign: boolean, isShowSeal: boolean) {
        // console.log(data);
        let po = data.po;
        let poDetails = data.poDetails;
        let employeePurchase = data.employeePurchase;
        let taxCompany = data.taxCompany;

        const totalAmount = poDetails.reduce((sum: number, x: any) => sum + x.ThanhTien, 0);
        const vatMoney = poDetails.reduce((sum: number, x: any) => sum + x.VATMoney, 0);
        const discount = poDetails.reduce((sum: number, x: any) => sum + x.Discount, 0);
        const totalPrice = poDetails.reduce((sum: number, x: any) => sum + x.TotalPrice, 0);

        let items: any = [];

        for (let i = 0; i < poDetails.length; i++) {
            let item = [
                { text: poDetails[i].STT, alignment: 'center' },
                { text: poDetails[i].ProductCodeOfSupplier, alignment: '' },

                { text: poDetails[i].UnitName, alignment: '' },
                {
                    text: this.formatNumber(poDetails[i].QtyRequest),
                    alignment: 'right',
                },
                { text: this.formatNumber(poDetails[i].UnitPrice), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].ThanhTien), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].VAT), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].VATMoney), alignment: 'right' },
            ];
            items.push(item);
        }

        let cellDisplaySign = { text: '', style: '', margin: [0, 60, 0, 60] };

        let cellPicPrepared: any = po.PicPrepared == '' ?
            cellDisplaySign
            : {
                image: 'data:image/png;base64,' + po.PicPrepared,
                width: 150,
                margin: [0, 0, 40, 0],
            };
        if (!isShowSign) cellPicPrepared = cellDisplaySign;
        let cellPicDirector: any = po.PicDirector == '' ?
            cellDisplaySign
            :
            {
                image: 'data:image/png;base64,' + po.PicDirector, width: 170,
                margin: [20, 0, 0, 0],
            };
        if (!isShowSeal) cellPicDirector = cellDisplaySign;
        // console.log('isShowSeal:', this.isShowSeal);
        // console.log('cellPicPrepared:', cellPicDirector);

        let docDefinition = {
            info: {
                title: po.BillCode,
            },
            content: [
                `${taxCompany.BuyerVietnamese}
                ${taxCompany.AddressBuyerVienamese}
                ${taxCompany.TaxVietnamese}`,
                { text: "ĐƠN MUA HÀNG", alignment: 'center', bold: true, fontSize: 12, margin: [0, 10, 0, 10] },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 35, 30, 25],
                        body: [
                            [
                                'Tên nhà cung cấp:', { colSpan: 3, text: po.NameNCC }, '', '', 'Ngày:',
                                { colSpan: 2, text: DateTime.fromISO(po.RequestDate).toFormat('dd/MM/yyyy') }
                            ],
                            [
                                'Địa chỉ:', { colSpan: 3, text: po.AddressNCC }, '', '',
                                'Số:', { colSpan: 2, text: po.BillCode }
                            ],
                        ]
                    },
                    layout: 'noBorders',
                },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 30, 25, 35],
                        body: [
                            [
                                'Mã số thuế:', { colSpan: 3, text: po.MaSoThue }, '', '',
                                { colSpan: 2, text: 'Loại tiền:' }, '', po.CurrencyText
                            ],
                        ]
                    },
                    layout: 'noBorders',
                },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 35, 30, 25],
                        body: [
                            [
                                'Điện thoại:', po.SupplierContactPhone,
                                'Fax:', { colSpan: 4, text: po.Fax }
                            ],
                            ['Diễn giải:', { colSpan: 6, text: po.Note }],
                        ]
                    },
                    layout: 'noBorders',

                },

                //Bảng chi tiết sản phẩm
                {
                    table: {
                        widths: [20, 120, 30, 45, '*', '*', 35, '*'],
                        body: [
                            //Header table
                            [
                                { text: 'STT', alignment: 'center', bold: true },
                                { text: 'Diễn giải', alignment: 'center', bold: true },
                                { text: 'Đơn vị', alignment: 'center', bold: true },
                                { text: 'Số lượng', alignment: 'center', bold: true },
                                { text: 'Đơn giá', alignment: 'center', bold: true },
                                { text: 'Thành tiền', alignment: 'center', bold: true },
                                { text: '% VAT', alignment: 'center', bold: true },
                                { text: 'Tổng tiền VAT', alignment: 'center', bold: true },
                            ],

                            //list item
                            ...items,
                            //sum footer table
                            [
                                { colSpan: 2, text: '', border: [true, false, false, true] }, '',
                                { colSpan: 4, text: 'Cộng tiền hàng:', border: [false, false, false, true] }, '4', '5', '6',
                                { colSpan: 2, text: this.formatNumber(totalAmount), alignment: 'right', bold: true, border: [false, false, true, true] }, '8'
                            ],
                            [
                                { colSpan: 2, text: '', border: [true, false, false, true] }, '2',
                                { colSpan: 4, text: 'Tiền thuế GTGT:', border: [false, false, false, true] }, '4', '5', '6',
                                { colSpan: 2, text: this.formatNumber(vatMoney), alignment: 'right', bold: true, border: [false, false, true, true] }, '8'
                            ],
                            [
                                { colSpan: 2, text: '', border: [true, false, false, true] }, '2',
                                { colSpan: 4, text: 'Chiết khấu:', border: [false, false, false, true] }, '4', '5', '6',
                                { colSpan: 2, text: this.formatNumber(discount), alignment: 'right', bold: true, border: [false, false, true, true] }, '8'
                            ],
                            [
                                { colSpan: 2, text: '', border: [true, false, false, true] }, '2',
                                { colSpan: 4, text: 'Tổng tiền thanh toán:', border: [false, false, false, true] }, '4', '5', '6',
                                { colSpan: 2, text: this.formatNumber(totalPrice), alignment: 'right', bold: true, border: [false, false, true, true] }, '8'
                            ],
                            [
                                { colSpan: 2, text: 'Số tiền viết bằng chữ:', border: [true, false, false, true] }, '',
                                { colSpan: 6, text: po.TotalMoneyText, bold: true, italics: true, border: [false, false, true, true] }, '4', '5', '6', '7', '8'
                            ],
                        ],
                    },
                },
                //Thông tin khác
                {
                    style: 'tableExample',
                    table: {
                        body: [
                            ['Ngày giao hàng:', DateTime.fromISO(po.DeliveryDate).toFormat('dd/MM/yyyy')],
                            ['Địa điểm giao hàng:', po.AddressDelivery],
                            ['Điều khoàn thanh toán:', po.RulePayName],
                            ['Số tài khoản:', po.AccountNumberSupplier],
                        ],
                    },
                    layout: 'noBorders',
                },
                //Chữ ký
                {
                    alignment: 'justify',
                    columns: [
                        { text: 'Người bán', alignment: 'center', bold: true },
                        { text: 'Người lập', alignment: 'center', bold: true },
                        { text: 'Người mua', alignment: 'center', bold: true },
                    ],
                },
                {
                    alignment: 'justify',
                    columns: [
                        {
                            text: '(Ký, họ tên)',
                            italics: true,
                            alignment: 'center',
                        },
                        {
                            text: '(Ký, họ tên)',
                            italics: true,
                            alignment: 'center',
                        },
                        {
                            text: '(Ký, họ tên)',
                            italics: true,
                            alignment: 'center',
                        },
                    ],
                },
                {
                    alignment: 'justify',
                    columns: [{ text: '', style: '' }, cellPicPrepared, cellPicDirector],
                },
                {
                    alignment: 'justify',
                    columns: [
                        {
                            text: '',
                        },
                        {
                            table: {
                                body: [
                                    ['Phone:', employeePurchase.Telephone],
                                    ['Email:', employeePurchase.Email]
                                ]
                            },
                            layout: 'noBorders',
                        },
                        {
                            text: '',
                        },
                    ],
                },

            ],
            defaultStyle: {
                fontSize: 10,
                alignment: 'justify',
                font: 'Times',
            },
        };


        return docDefinition;
    }

  onCreatePDFLanguageEn(data: any, isShowSign: boolean, isShowSeal: boolean) {
        let po = data.po;
        let poDetails = data.poDetails;
        let taxCompany = data.taxCompany;

        const totalAmount = poDetails.reduce((sum: number, x: any) => sum + x.ThanhTien, 0);
        const vatMoney = poDetails.reduce((sum: number, x: any) => sum + x.VATMoney, 0);
        const discount = poDetails.reduce((sum: number, x: any) => sum + x.Discount, 0);
        const totalPrice = poDetails.reduce((sum: number, x: any) => sum + x.TotalPrice, 0);

        let items: any = [];

        for (let i = 0; i < poDetails.length; i++) {
            let item = [
                { text: poDetails[i].STT, alignment: 'center' },
                { text: poDetails[i].ProductCodeOfSupplier, alignment: '' },

                { text: poDetails[i].UnitName, alignment: '' },
                {
                    text: this.formatNumber(poDetails[i].QtyRequest),
                    alignment: 'right',
                },
                { text: this.formatNumber(poDetails[i].UnitPrice), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].ThanhTien), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].VAT), alignment: 'right' },
                { text: this.formatNumber(poDetails[i].VATMoney), alignment: 'right' },
            ];
            items.push(item);
        }

        let cellDisplaySign = { text: '', style: '', margin: [0, 60, 0, 60] };
        let cellPicPrepared: any = po.PicPrepared == '' ?
            cellDisplaySign
            : {
                image: 'data:image/png;base64,' + po.PicPrepared,
                width: 150,
                margin: [0, 0, 40, 0],
            };
        if (!isShowSign) cellPicPrepared = cellDisplaySign;

        let cellPicDirector: any = po.PicDirector == '' ?
            cellDisplaySign
            :
            {
                image: 'data:image/png;base64,' + po.PicDirector, width: 170,
                margin: [20, 0, 0, 0],
            };
        if (!isShowSeal) cellPicDirector = cellDisplaySign;

        return {
            info: { title: po.BillCode },
            content: [
                {
                    alignment: 'justify',
                    columns: [
                                    {
              image:
                'data:image/png;base64,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',
              fit: [100, 100],
            },
                        `${taxCompany.BuyerEnglish}\n${taxCompany.AddressBuyerEnglish}\n${taxCompany.TaxEnglish}`,
                    ]
                },
                { text: "PURCHASE ORDER", alignment: 'center', bold: true, fontSize: 12, margin: [0, 10, 0, 10] },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 35, 30, 25],
                        body: [
                            ['Supplier Name:', { colSpan: 3, text:po.NameNCC }, '', '', 'Date:', { colSpan: 2, text: DateTime.fromISO(po.RequestDate).toFormat('MM/dd/yyyy') }],
                            ['Address:', { colSpan: 3, text: po.AddressNCC }, '', '', 'No:', { colSpan: 2, text: po.BillCode }],
                        ]
                    },
                    layout: 'noBorders',
                },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 30, 25, 35],
                        body: [['Tax No:', { colSpan: 3, text: po.MaSoThue }, '', '', { colSpan: 2, text: 'Currency:' }, '', po.CurrencyText]]
                    },
                    layout: 'noBorders',
                },
                {
                    style: 'tableExample',
                    table: {
                        widths: [80, '*', 30, 70, 35, 30, 25],
                        body: [
                            ['Tel:', po.SupplierContactPhone, 'Fax:', { colSpan: 4, text: po.Fax }],
                            ['Note:', { colSpan: 6, text: po.Note }],
                        ]
                    },
                    layout: 'noBorders',
                },
                {
                    table: {
                        widths: [20, 120, 30, 45, '*', '*', 35, '*'],
                        body: [
                            [
                                { text: 'No.', alignment: 'center', bold: true },
                                { text: 'Description', alignment: 'center', bold: true },
                                { text: 'Unit', alignment: 'center', bold: true },
                                { text: 'Quantity', alignment: 'center', bold: true },
                                { text: 'Unit Price', alignment: 'center', bold: true },
                                { text: 'Amount', alignment: 'center', bold: true },
                                { text: '% VAT', alignment: 'center', bold: true },
                                { text: 'Total VAT', alignment: 'center', bold: true },
                            ],
                            ...items,
                            [{ colSpan: 2, text: '', border: [true, false, false, true] }, '', { colSpan: 4, text: 'Sub Total:', border: [false, false, false, true] }, '', '', '', { colSpan: 2, text: this.formatNumber(totalAmount), alignment: 'right', bold: true, border: [false, false, true, true] }, ''],
                            [{ colSpan: 2, text: '', border: [true, false, false, true] }, '', { colSpan: 4, text: 'VAT:', border: [false, false, false, true] }, '', '', '', { colSpan: 2, text: this.formatNumber(vatMoney), alignment: 'right', bold: true, border: [false, false, true, true] }, ''],
                            [{ colSpan: 2, text: '', border: [true, false, false, true] }, '', { colSpan: 4, text: 'Discount:', border: [false, false, false, true] }, '', '', '', { colSpan: 2, text: this.formatNumber(discount), alignment: 'right', bold: true, border: [false, false, true, true] }, ''],
                            [{ colSpan: 2, text: '', border: [true, false, false, true] }, '', { colSpan: 4, text: 'Total Amount:', border: [false, false, false, true] }, '', '', '', { colSpan: 2, text: this.formatNumber(totalPrice), alignment: 'right', bold: true, border: [false, false, true, true] }, ''],
                            [{ colSpan: 2, text: 'Amount in words:', border: [true, false, false, true] }, '', { colSpan: 6, text: po.TotalMoneyText, bold: true, italics: true, border: [false, false, true, true] }, '', '', '', '', ''],
                        ],
                    },
                },
                {
                    style: 'tableExample',
                    table: {
                        body: [
                            ['Delivery Date:', DateTime.fromISO(po.DeliveryDate).toFormat('MM/dd/yyyy')],
                            ['Delivery Address:', po.AddressDelivery],
                            ['Payment Terms:', po.RulePayName],
                            ['Account Number:', po.AccountNumberSupplier],
                        ],
                    },
                    layout: 'noBorders',
                },
                {
                    alignment: 'justify',
                    columns: [
                        { text: 'Seller', alignment: 'center', bold: true },
                        { text: 'Prepared by', alignment: 'center', bold: true },
                        { text: 'Buyer', alignment: 'center', bold: true },
                    ],
                },
                {
                    alignment: 'justify',
                    columns: [
                        { text: '(Signature, Name)', italics: true, alignment: 'center' },
                        { text: '(Signature, Name)', italics: true, alignment: 'center' },
                        { text: '(Signature, Name)', italics: true, alignment: 'center' },
                    ],
                },
                {
                    alignment: 'justify',
                    columns: [{ text: '', style: '' }, cellPicPrepared, cellPicDirector],
                },
            ],
            defaultStyle: {
                fontSize: 10,
                alignment: 'justify',
                font: 'Times',
            },
        };
    }

    formatNumber(num: number, digits: number = 2) {
        num = num || 0;
        return num.toLocaleString('vi-VN', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }
}
