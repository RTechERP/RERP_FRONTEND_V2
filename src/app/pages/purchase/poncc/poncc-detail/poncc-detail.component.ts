import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

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

@Component({
  selector: 'app-poncc-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    HasPermissionDirective
  ],
  templateUrl: './poncc-detail.component.html',
  styleUrl: './poncc-detail.component.css'
})
export class PonccDetailComponent implements OnInit, AfterViewInit {

  informationForm!: FormGroup;
  companyForm!: FormGroup;
  diffForm!: FormGroup;
  extraForm!: FormGroup;
  @Input() poncc: any = null;
  @Input() ponccDetail: any;
  @Input() dtRef: any;
  @Input() lstPrjPartlistPurchaseRequest: any[] = [];
  @Input() lstBillImportId: any[] = [];
  @Input() isCopy: boolean = false;
  @Input() isAddPoYCMH: boolean = false;
  @ViewChild('tb_HoSoDiKem', { static: false }) tb_HoSoDiKem!: ElementRef;
  tabulatorHoSoDiKem: Tabulator | null = null;
  rupayId: number = 0;
  @ViewChild('tb_HangTien', { static: false }) tb_HangTien!: ElementRef;
  tabulatorHangTien: Tabulator | null = null;
  isAdmin: boolean = false;
  supplierSales: any[] = [];
  isEditMode: boolean = false;

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
    private billImportService: BillImportServiceService
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
          this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
        },
      });
    }
    else if (this.isAddPoYCMH) {
      this.getSupplierSale().then(() => {
        this.mapDataToForm();
        this.getBillCode(0);
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
      console.log(poTypeId);
      if (poTypeId === 0 || poTypeId === 1) {
        this.getBillCode(poTypeId);
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
      DeptSupplier: this.poncc.DeptSupplier || false
    });

    // Sau khi map xong, trigger các sự kiện để load thông tin đầy đủ
    // Đợi một chút để đảm bảo supplierSales, rulepays và currencies đã được load
    setTimeout(() => {
      console.log('Loading additional data...', {
        supplierSalesCount: this.supplierSales.length,
        rulepaysCount: this.rulepays.length,
        currenciesCount: this.currencies.length
      });

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

          console.log('Loaded supplier info:', {
            AddressNCC: selectedSupplier.AddressNCC,
            MaSoThue: selectedSupplier.MaSoThue,
            Note: selectedSupplier.Note,
            RulePayID: selectedSupplier.RulePayID
          });
        } else {
          console.warn('Supplier not found:', this.poncc.SupplierSaleID);
        }
      }

      // Load thông tin Currency (tỷ giá) và trigger onCurrencyChange để cập nhật bảng
      if (this.poncc.CurrencyID) {
        this.onCurrencyChange(this.poncc.CurrencyID);
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
      DeptSupplier: [false]
    });
  }

  initInformationForm(): void {
    this.informationForm = this.fb.group({
      SupplierSaleID: [null, Validators.required],
      POCode: ['', Validators.required],
      AddressSupplier: [{ value: '', disabled: true }],
      MaSoThueNCC: [{ value: '', disabled: true }],
      RulePayID: [null, Validators.required],
      EmployeeID: [null, Validators.required],
      POType: [0, Validators.required],
      Company: [1, Validators.required],
      Note: [''],
      IsCheckTotalMoneyPO: [false]
    });

    this.getBillCode(0);
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
          editor: "list",
          editorParams: { list: this.productSales },
          width: 200,
          headerSort: false,
          frozen: true,
          formatter: (cell: any) => {
            const id = cell.getValue();
            const item = this.productSales.find((p: any) => p.ID === id);
            return item?.ProductCode || '';
          }
        },
        {
          title: 'Mã sản phẩm Demo',
          field: 'ProductRTCID',
          editor: "list",
          editorParams: { list: this.productRTCs },
          width: 150,
          headerSort: false,
          frozen: true,
          formatter: (cell: any) => {
            const id = cell.getValue();
            const item = this.productRTCs.find((p: any) => p.ID === id);
            return item?.ProductCode || '';
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
  }

  getRulePay() {
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
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
      }
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

  getCurrencies() {
    this.projectPartlistPurchaseRequestService.getCurrencies().subscribe({
      next: (res: any) => {
        this.currencies = res || [];
      }, error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách tiền tệ: ' + error.message);
      }
    });
  }

  getBillCode(poTypeId: number) {
    debugger;
    this.ponccService.getBillCode(poTypeId).subscribe({
      next: (res: any) => {
        this.companyForm.patchValue({
          BillCode: res.data
        })
      }, error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi mã po: ' + error.message);
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
      error: (err) => console.error('ProductSale API error:', err)
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
      error: (err) => console.error('Projects API error:', err)
    });
  }

  private updateEditorLookups() {
    if (!this.tabulatorHangTien) return;
    let t = this.tabulatorHangTien;
    try {
      t.updateColumnDefinition('ProductSaleID', {
        editorParams: { values: this.productSales.map((c) => ({ value: c.ID, label: c.ProductCode })) },
      } as any);
      t.updateColumnDefinition('ProductRTCID', {
        editorParams: { values: this.productRTCs.map((c) => ({ value: c.ID, label: c.ProductCode })) },
      } as any);
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

    // Xử lý thay đổi ProductSaleID
    if (field === 'ProductSaleID' && newValue) {
      this.updateProductInfo(row, newValue, true);
    }

    // Xử lý thay đổi ProductRTCID
    if (field === 'ProductRTCID' && newValue) {
      this.updateProductInfo(row, newValue, false);
    }

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

  saveData() {
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
          this.save(ponccData);
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
                  this.save(ponccData);
                }, error: (error) => {
                  this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi mã po: ' + error.message);
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

  save(data: any) {
    this.ponccService.saveData(data).subscribe({
      next: (res) => {
        // Check if response indicates success
        if (res && (res.status === 1 || res.success === true || res.status === true)) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công!');
          this.activeModal.close(); // Close modal only on success
        } else {
          // API returned but with failure status
          const errorMessage = res?.message || 'Lưu không thành công!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          // Don't close modal - let user fix the issue
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra!');
        // Don't close modal on error
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
      PONCCDetailRequestBuyID: row.PONCCDetailRequestBuyID || ''
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
      this.billImportService.getBillImportByID(billImportId).subscribe({
        next: (data) => {
          let billImport = data.data;
          this.ponccService.getWarehouseCode(billImport.WarehouseID).subscribe({
            next: (data) => {
              let warehouseCode = data.data || '';
              const modalRef = this.modalService.open(BillImportDetailComponent, {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                windowClass: 'full-screen-modal',
              });

              modalRef.componentInstance.newBillImport = billImport;
              modalRef.componentInstance.WarehouseCode = warehouseCode;
              modalRef.componentInstance.warehouseID = billImport.WarehouseID;
              modalRef.componentInstance.id = billImport.ID ?? 0;
              modalRef.componentInstance.poNCCId = ponccId ?? 0;

              modalRef.result
                .then((result) => {
                })
                .catch((reason) => {
                });
            },
            error: (err) => this.notification.error(
              NOTIFICATION_TITLE.error,
              `Lỗi khi lấy thông tin kho nhập kho: ${err}`
            )
          });
        },
        error: (err) => this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi lấy thông tin phiếu nhập kho: ${err}`
        )
      });
    }
    else {
      this.ponccService.getBillImportTech(billImportId).subscribe({
        next: (data) => {
          let billImport = data.data;
          this.ponccService.getWarehouseCode(billImport.WarehouseID).subscribe({
            next: (data) => {
              let warehouseCode = data.data || '';
              const modalRef = this.modalService.open(BillImportTechnicalFormComponent, {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                windowClass: 'full-screen-modal',
              });

              modalRef.componentInstance.newBillImport = billImport;
              modalRef.componentInstance.warehouseID = billImport.WarehouseID;
              modalRef.componentInstance.PonccID = ponccId ?? 0;
              modalRef.componentInstance.id = billImport.ID ?? 0;

              modalRef.result
                .then((result) => {
                })
                .catch((reason) => {
                });
            },
            error: (err) => this.notification.error(
              NOTIFICATION_TITLE.error,
              `Lỗi khi lấy thông tin kho nhập kho: ${err}`
            )
          });
        },
        error: (err) => this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi lấy thông tin phiếu nhập kho: ${err}`
        )
      });
    }
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
}
