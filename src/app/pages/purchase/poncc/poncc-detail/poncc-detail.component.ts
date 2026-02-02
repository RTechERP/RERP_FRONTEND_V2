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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BillImportDetailNewComponent } from '../../../old/Sale/BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';

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
    SafeUrlPipe,
    NzSpinModule
  ],
  templateUrl: './poncc-detail.component.html',
  styleUrl: './poncc-detail.component.css'
})
export class PonccDetailComponent implements OnInit, AfterViewInit {

  informationForm!: FormGroup;
  companyForm!: FormGroup;
  diffForm!: FormGroup;
  extraForm!: FormGroup;
  @Input() warehouseType = 1;
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
  isLoadingData: boolean = false;

  // Print properties
  showPreview = false;
  language: string = 'vi';
  dataPrint: any;
  pdfSrc: any;
  isShowSign = true;
  isShowSeal = true;
  isMerge = false;
  isLoadingExcel: boolean = false;
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

  preparedMarginTop: number = 0;
  directorMarginTop: number = 0;
  preparedMarginLeft: number = 0;
  directorMarginLeft: number = 0.53;
  titleMarginTop: number = 0;
  preparedMarginTopCm: number = 0;
  directorMarginTopCm: number = 0;
  preparedMarginLeftCm: number = 0;
  directorMarginLeftCm: number = 0.53;
  titleMarginTopCm: number = 0;
  preparedWidth: number = 150;
  directorWidth: number = 170;

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
        if (!this.skipBillCodeGeneration) {
          this.getBillCode(0);
        }
      });
    }
    else if (this.isCopy && this.poncc) {
      this.rupayId = this.poncc.RulePayID;
      Promise.all([
        this.getSupplierSale(),
        this.getRulePay(),
        this.getCurrencies()
      ]).then(() => {
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

    this.informationForm.get('POType')?.valueChanges.subscribe((poTypeId: number) => {
      if (this.skipBillCodeGeneration) {
        return;
      }
      if (this.isEditMode) {
        return;
      }
      if ((poTypeId === 0 || poTypeId === 1) && (!this.poncc || this.poncc.ID === 0 || this.isCopy)) {
        this.getBillCode(poTypeId);
      }
    });

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

    this.isLoadingData = true;

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
      DeptSupplier: this.poncc.DeptSupplier || false
    });

    setTimeout(() => {
      if (this.poncc.SupplierSaleID > 0) {
        this.onSupplierChange(this.poncc.SupplierSaleID);
      }

      if (this.poncc.CurrencyID && this.currencies.length > 0) {
        this.onCurrencyChange(this.poncc.CurrencyID);
      } else if (this.poncc.CurrencyID && this.currencies.length === 0) {
        setTimeout(() => {
          if (this.poncc.CurrencyID && this.currencies.length > 0) {
            this.onCurrencyChange(this.poncc.CurrencyID);
          }
        }, 1000);
      }

      this.isLoadingData = false;
    }, 1000);
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
      DeptSupplier: [false]
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
    if (selectedSupplier) {
      this.ponccService.getPOCode(selectedSupplier.CodeNCC).subscribe({
        next: (response: any) => {
          this.informationForm.patchValue({
            POCode: response.data || '',
            AddressSupplier: selectedSupplier.AddressNCC || this.poncc.AddressNCC || '',
            MaSoThueNCC: selectedSupplier.MaSoThue || this.poncc.MaSoThueNCC || '',
            Note: selectedSupplier.Description || this.poncc.Note || '',
            RulePayID: this.rupayId || selectedSupplier.RulePayID || null,
          });
        },
        error: (error) => {
          this.informationForm.patchValue({
            POCode: this.poncc.CodeNCC || selectedSupplier.CodeNCC || '',
            AddressSupplier: selectedSupplier.AddressNCC || this.poncc.AddressNCC || '',
            MaSoThueNCC: selectedSupplier.MaSoThue || this.poncc.MaSoThueNCC || '',
            Note: selectedSupplier.Description || this.poncc.Note || '',
            RulePayID: this.rupayId || selectedSupplier.RulePayID || null,
          });
        },
      });

      // udpate ở đây - update thông tin supplier vào các form
      this.extraForm.patchValue({
        AccountNumberSupplier: selectedSupplier.SoTK || this.poncc.SoTK || '',
        BankSupplier: selectedSupplier.NganHang || this.poncc.NganHang || '',
        FedexAccount: selectedSupplier.FedexAccount || this.poncc.FedexAccount || '',
        OriginItem: selectedSupplier.OriginItem || this.poncc.OriginItem || '',
        BankCharge: selectedSupplier.BankCharge || this.poncc.BankCharge || '',
        DeptSupplier: selectedSupplier.IsDebt || this.poncc.IsDebt || false,
        RuleIncoterm: selectedSupplier.RuleIncoterm || this.poncc.RuleIncoterm || ''
      });

      this.diffForm.patchValue({
        AddressDelivery: selectedSupplier.AddressDelivery || this.poncc.AddressDelivery || ''
      });

      // Update Note vào informationForm (nếu chưa có)
      if (!this.informationForm.get('Note')?.value) {
        this.informationForm.patchValue({
          Note: selectedSupplier.Description || this.poncc.Note || ''
        })
      }

      // Update Company vào informationForm nếu supplier có
      if (selectedSupplier.Company !== null && selectedSupplier.Company !== undefined) {
        this.informationForm.patchValue({
          Company: selectedSupplier.Company || this.poncc.Company
        });
      }

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
      error: (err) => {
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
          const modalRef = this.modalService.open(BillImportDetailNewComponent, {
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
        this.showPreview = true;
        this.renderPDF(this.language);
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
    this.convertFillter();
    this.renderPDF(this.language);
  }

  toggleSeal() {
    this.convertFillter();
    this.renderPDF(this.language);
  }

  toggleMerge() {
    this.convertFillter();
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

    const totalAmount = poDetails.reduce(
      (sum: number, x: any) => sum + x.ThanhTien,
      0
    );
    const vatMoney = poDetails.reduce(
      (sum: number, x: any) => sum + x.VATMoney,
      0
    );
    const discount = poDetails.reduce(
      (sum: number, x: any) => sum + x.Discount,
      0
    );
    const totalPrice = poDetails.reduce(
      (sum: number, x: any) => sum + x.TotalPrice,
      0
    );

    let items: any = [];

    for (let i = 0; i < poDetails.length; i++) {
      let item = [
        { text: poDetails[i].STT, alignment: 'center' },
        { text: poDetails[i].ProductCodeOfSupplier, alignment: '' },

        { text: (poDetails[i].UnitName || poDetails[i].Unit), alignment: '' },
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

    let cellPicPrepared: any =
      po.PicPrepared == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicPrepared,
          width: this.preparedWidth,
          margin: [this.preparedMarginLeftCm, this.preparedMarginTopCm, 40, 0],
        };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;
    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicDirector,
          width: this.directorWidth,
          margin: [this.directorMarginLeftCm, this.directorMarginTopCm, 0, 0],
        };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    // console.log('isShowSeal:', this.isShowSeal);
    // console.log('cellPicPrepared:', cellPicDirector);

    let docDefinition = {
      pageMargins: [40, 20, 40, 10],
      info: {
        title: po.BillCode,
      },
      content: [
        `${taxCompany.BuyerVietnamese || ''}
                  ${taxCompany.AddressBuyerVienamese || ''}
                  ${taxCompany.TaxVietnamese || ''}`,
        {
          text: 'ĐƠN MUA HÀNG',
          alignment: 'center',
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 10],
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 35, 30, 25],
            body: [
              [
                'Tên nhà cung cấp:',
                { colSpan: 3, text: po.NameNCC },
                '',
                '',
                'Ngày:',
                {
                  colSpan: 2,
                  text: DateTime.fromISO(po.RequestDate).toFormat('dd/MM/yyyy'),
                },
              ],
              [
                'Địa chỉ:',
                { colSpan: 3, text: po.AddressNCC },
                '',
                '',
                'Số:',
                { colSpan: 2, text: po.BillCode },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 30, 25, 35],
            body: [
              [
                'Mã số thuế:',
                { colSpan: 3, text: po.MaSoThue },
                '',
                '',
                { colSpan: 2, text: 'Loại tiền:' },
                '',
                po.CurrencyText,
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 35, 30, 25],
            body: [
              [
                'Điện thoại:',
                po.SupplierContactPhone,
                'Fax:',
                { colSpan: 4, text: po.Fax },
              ],
              ['Diễn giải:', { colSpan: 6, text: po.Note }],
            ],
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
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 4,
                  text: 'Cộng tiền hàng:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(totalAmount),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Tiền thuế GTGT:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(vatMoney),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Chiết khấu:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(discount),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Tổng tiền thanh toán:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(totalPrice),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                {
                  colSpan: 2,
                  text: 'Số tiền viết bằng chữ:',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 6,
                  text: po.TotalMoneyText,
                  bold: true,
                  italics: true,
                  border: [false, false, true, true],
                },
                '4',
                '5',
                '6',
                '7',
                '8',
              ],
            ],
          },
        },
        //Thông tin khác
        {
          style: 'tableExample',
          table: {
            body: [
              [
                'Ngày giao hàng:',
                DateTime.fromISO(po.DeliveryDate).toFormat('dd/MM/yyyy'),
              ],
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
          margin: [0, this.titleMarginTopCm, 0, 0],
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
                  ['Email:', employeePurchase.Email],
                ],
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

    const totalAmount = poDetails.reduce(
      (sum: number, x: any) => sum + x.ThanhTien,
      0
    );
    const vatMoney = poDetails.reduce(
      (sum: number, x: any) => sum + x.VATMoney,
      0
    );
    const discount = poDetails.reduce(
      (sum: number, x: any) => sum + x.Discount,
      0
    );
    const totalPrice = poDetails.reduce(
      (sum: number, x: any) => sum + x.TotalPrice,
      0
    );

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
    let cellPicPrepared: any =
      po.PicPrepared == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicPrepared,
          width: this.preparedWidth,
          margin: [this.preparedMarginLeftCm, this.preparedMarginTopCm, 40, 0],
        };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;

    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicDirector,
          width: this.directorWidth,
          margin: [this.directorMarginLeftCm, this.directorMarginTopCm, 0, 0],
        };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    const EMPTY_IMAGE_BASE64 =
      'iVBORw0KGgoAAAANSUhEUgAAANgAAABSCAYAAAA2CxpTAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjw' +
      'v8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD+SURBVHhe7dOhAQAgDMAw4P+fh0dTl8j67pmZBSTOG4B/' +
      'DAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhi' +
      'EDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiE' +
      'DAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg' +
      '0HIYBAyGIQMBiGDQchgEDIYhC4EjgSgJ7qviAAAAABJRU5ErkJggg==';
    let docDefinition = {
      pageMargins: [40, 20, 40, 10],
      info: {
        title: po.BillCode,
      },
      content: [
        {
          alignment: 'justify',
          columns: [
            {
              image:
                'data:image/png;base64,' + (po.Logo || EMPTY_IMAGE_BASE64),
              fit: [100, 100],
            },
            {
              text: 'PURCHASE ORDER',
              fontSize: 12,
              alignment: 'center',
              bold: true,
              margin: [0, 20, 0, 0],
            },
            {
              text: po.POCode,
              fontSize: 12,
              alignment: 'center',
              bold: true,
              margin: [0, 20, 0, 0],
            },
          ],
        },

        {
          style: 'tableExample',
          table: {
            widths: [90, '*', 30, 60],
            body: [
              [
                'Supplier name:',
                { text: po.NameNCC, bold: true },
                'Date:',
                DateTime.fromISO(po.RequestDate).toFormat('dd/MM/yyyy'),
              ],
              [
                'Address:',
                { text: po.AddressNCC, bold: true },
                'No:',
                po.BillCode,
              ],
            ],
          },
          layout: 'noBorders',
        },

        {
          style: 'tableExample',
          table: {
            widths: [90, '*', 30, 70, 60, 30],
            body: [
              [
                'Telephone number:',
                { text: po.SupplierContactPhone },
                'Fax:',
                po.Fax == '' ? '............................' : po.Fax,
                'Currency type:',
                po.CurrencyText,
              ],
              [
                'Contact Name:',
                { text: po.SupplierContactName },
                'Email:',
                { colSpan: 3, text: po.SupplierContactEmail },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [90, '*'],
            body: [
              ['Buyer:', { text: taxCompany.BuyerEnglish, bold: true }],
              ['Address:', taxCompany.AddressBuyerEnglish],
              ['Legal Representative:', taxCompany.LegalRepresentativeEnglish],
              ['Purchaser:', po.Purchaser],
            ],
          },
          layout: 'noBorders',
        },

        'We hereby accept and confirm to order with the following details:',
        {
          style: 'tableExample',
          table: {
            widths: [20, 130, 30, 46, '*', '*', 30, '*'],
            body: [
              //Header table
              [
                { text: 'No', alignment: 'center', bold: true },
                { text: 'Description', alignment: 'center', bold: true },
                { text: 'Unit', alignment: 'center', bold: true },
                { text: 'Quantity', alignment: 'center', bold: true },
                { text: 'Unit price', alignment: 'center', bold: true },
                { text: 'Amount', alignment: 'center', bold: true },
                { text: 'VAT', alignment: 'center', bold: true },
                { text: 'VATMoney', alignment: 'center', bold: true },
              ],

              //list item
              ...items,
              //sum footer table
              [
                {
                  colSpan: 8,
                  text: '',
                  style: 'header',
                  border: [true, false, true, true],
                },
              ],
              [
                {
                  colSpan: 2,
                  text: 'Total amount:',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 3,
                  text: po.RuleIncoterm,
                  style: 'header',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(totalAmount),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'VAT amount',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(vatMoney),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'Discount',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(discount),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'Total payment',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(totalPrice),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                {
                  colSpan: 2,
                  text: 'Total amount (In words):',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 6,
                  text: po.TotalAmountText,
                  bold: true,
                  italics: true,
                  border: [false, false, true, true],
                },
              ],
            ],
          },
          layout: {
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          height: 60,
        },
        {
          style: 'tableExample',
          table: {
            body: [
              [
                'Delivery date:',
                DateTime.fromISO(po.DeliveryDate).toFormat('dd/MM/yyyy'),
              ],
              ['Delivery point:', po.AddressDelivery],
              ['Term:', po.RulePayName],
              ['Bank Charge:', po.BankCharge],
              ['Fedex Account:', po.FedexAccount],
              ['Bank Account:', po.AccountNumberSupplier],
            ],
          },
          layout: 'noBorders',
        },

        {
          alignment: 'justify',
          margin: [0, this.titleMarginTopCm, 0, 0],
          columns: [
            { text: 'Supplier', alignment: 'center', bold: true },
            { text: 'Prepared by', alignment: 'center', bold: true },
            { text: 'Director', alignment: 'center', bold: true },
          ],
        },
        {
          alignment: 'justify',
          columns: [
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
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

    return docDefinition;
  }

  onPrintPOExcel() {
    this.isLoadingExcel = true;
    this.ponccService
      .printPONCCExcel(this.poncc.ID, this.isMerge, this.language, this.isShowSign, this.isShowSeal)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.poncc.BillCode}.xlsx`;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.isLoadingExcel = false;
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Lỗi khi in PO'
          );
          this.isLoadingExcel = false;
        }
      });
  }

  formatNumber(num: number, digits: number = 2) {
    num = num || 0;
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  cmToPx(cm: number, dpi: number = 96): number {
    return cm * dpi / 2.54;
  }

  convertFillter() {
    this.preparedMarginLeftCm = this.cmToPx(this.preparedMarginLeft);
    this.preparedMarginTopCm = this.cmToPx(this.preparedMarginTop);
    this.directorMarginLeftCm = this.cmToPx(this.directorMarginLeft);
    this.directorMarginTopCm = this.cmToPx(this.directorMarginTop);
    this.titleMarginTopCm = this.cmToPx(this.titleMarginTop);
  }

  resetNumber() {
    this.preparedMarginLeft = 0;
    this.preparedMarginTop = 0;
    this.preparedWidth = 150;
    this.directorMarginLeft = 0.53;
    this.directorMarginTop = 0;
    this.directorWidth = 170;
    this.titleMarginTop = 0;
    this.toggleSeal();
  }


}
