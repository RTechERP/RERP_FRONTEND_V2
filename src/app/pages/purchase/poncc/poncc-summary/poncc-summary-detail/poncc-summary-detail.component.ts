import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  input,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  TabulatorFull as Tabulator,
  ColumnDefinition,
  CellComponent,
} from 'tabulator-tables';

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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AppUserService } from '../../../../../services/app-user.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DateTime } from 'luxon';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../project/project-service/project.service';
import { SupplierSaleService } from '../../../supplier-sale/supplier-sale.service';
import { ProjectPartlistPurchaseRequestService } from '../../../project-partlist-purchase-request/project-partlist-purchase-request.service';
import { UnitService } from '../../../../hrm/asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { PONCCService } from '../../poncc.service';

@Component({
  selector: 'app-poncc-summary-detail',
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
    HasPermissionDirective,
  ],
  templateUrl: './poncc-summary-detail.component.html',
  styleUrl: './poncc-summary-detail.component.css',
})
export class PonccSummaryDetailComponent implements OnInit {
  //#region khai báo biến
  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private supplierSaleService: SupplierSaleService,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private unitService: UnitService,
    private ponccService: PONCCService
  ) {}

  @Input() ponccSummary: any;
  generalInfoForm!: FormGroup; // Thông tin chung
  additionalInfoForm!: FormGroup; // Thông tin thêm
  itemInfoForm!: FormGroup; // Thông tin hàng

  supplierSales: any[] = [];
  companyList: any[] = [
    { value: 1, label: 'RTC' },
    { value: 2, label: 'MVI' },
    { value: 3, label: 'ARP' },
    { value: 4, label: 'YONKO' },
  ];
  unitList: any[] = [];
  employeeList: any[] = [];
  currencyList: any[] = [];

  statusList: any[] = [
    { value: 0, label: 'Đang tiến hành' },
    { value: 1, label: 'Đã hoàn thành' },
    { value: 2, label: 'Đã thanh toán' },
    { value: 3, label: 'Hủy' },
    { value: 4, label: 'Đã xóa' },
    { value: 5, label: 'Đã Y/c nhập kho' },
  ];
  //#endregion

  //#region hàm khởi chạy
  ngOnInit(): void {
    this.initForms();
    this.loadLookups();

    // Load data sau khi lookups đã load xong
    if (this.ponccSummary) {
      setTimeout(() => {
        this.loadData();
      }, 300);
    }
  }

  // Formatter và Parser cho input number tiền tệ
  moneyFormatter = (value: number | string): string => {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  moneyParser = (value: string): number => {
    return value ? Number(value.replace(/,/g, '')) : 0;
  };
  //#endregion

  //#region Xử lý dữ liệu form
  initForms(): void {
    this.generalInfoForm = this.fb.group({
      SupplierSaleID: [0],
      ProductName: [''],
      ProductCodeOfSupplier: [''],
      Company: [0],
      TotalPrice: [0],
      FeeShip: [0],
      PriceSale: [0],
      UnitPrice: [0],
      PriceHistory: [0],
      UnitPriceVat: [0],
      BiddingPrice: [0],
      Vat: [0],
      UnitID: [0],
      SupplierVoucher: [''],
      DeptSupplier: [false],
      NCCNew: [false],
    });

    this.additionalInfoForm = this.fb.group({
      ProjectCode: [''],
      ProjectName: [''],
      ProductNewCode: [''],
      ProductCode: [''],
      TotalMoneyChangePO: [0],
      Note: [''],
    });
    this.itemInfoForm = this.fb.group({
      EmployeeID: [0],
      QuantityOrder: [0],
      Status: [0],
      QuantityReturn: [0],
      RequestDate: [new Date()],
      QuantityRemain: [0],
      DeliveryDate: [new Date()],
      BillCode: [''],
      DatelineShip: [new Date()],
      CurrencyID: [0],
      MinQuantity: [0],
      CurrencyRate: [0],
      POCode: [''],
      TotalQuantityLast: [0],
    });
  }

  onCurrencyChange(currencyId: number): void {
    if (currencyId) {
      const currency = this.currencyList.find((c) => c.ID === currencyId);
      if (currency && currency.CurrencyRate) {
        this.itemInfoForm.patchValue({
          CurrencyRate: currency.CurrencyRate,
        });
      }
    }
  }
  //#endregion

  //#region Hàm xử lý
  loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => (this.supplierSales = res.data || []),
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + error.message
        );
      },
    });
    this.projectPartlistPurchaseRequestService.getCurrencies().subscribe({
      next: (res: any) => {
        this.currencyList = res || [];
        const currencyId = this.itemInfoForm?.get('CurrencyID')?.value;
        if (currencyId && this.currencyList.length > 0) {
          setTimeout(() => {
            this.onCurrencyChange(currencyId);
          }, 100);
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách tiền tệ: ' + error.message
        );
      },
    });

    this.unitService.getUnit().subscribe({
      next: (res: any) => {
        this.unitList = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách đơn vị: ' + error.message
        );
      },
    });
  }

  loadData(): void {
    if (!this.ponccSummary) return;

    const poh = this.ponccSummary;
    const companyId = this.companyList.find(
      (s) => s.label?.toLowerCase() === poh.CompanyText?.toLowerCase()
    )?.value;
    const unitId = this.unitList.find(
      (u) =>
        u.UnitName?.toLowerCase() === this.ponccSummary.UnitName?.toLowerCase()
    )?.ID;

    // Đổ dữ liệu vào generalInfoForm
    this.generalInfoForm.patchValue({
      SupplierSaleID: poh.SupplierSaleID || null,
      ProductName: poh.ProductName || '',
      ProductCodeOfSupplier: poh.ProductCodeOfSupplier || '',
      Company: companyId || 0,
      TotalPrice: poh.TotalPrice || 0,
      FeeShip: poh.FeeShip || 0,
      PriceSale: poh.PriceSale || 0,
      UnitPrice: poh.UnitPrice || 0,
      PriceHistory: poh.PriceHistory || 0,
      UnitPriceVat: poh.UnitPriceVAT || 0,
      BiddingPrice: poh.BiddingPrice || 0,
      Vat: poh.VAT || 0,
      UnitID: unitId || 0,
      SupplierVoucher: poh.SupplierVoucher || '',
      DeptSupplier: poh.DeptSupplier || false,
      NCCNew: poh.NCCNew || false,
    });

    // Đổ dữ liệu vào additionalInfoForm
    this.additionalInfoForm.patchValue({
      ProjectCode: poh.ProjectCode || '',
      ProjectName: poh.ProjectName || '',
      ProductNewCode: poh.ProductNewCode || '',
      ProductCode: poh.ProductCode || '',
      TotalMoneyChangePO: poh.TotalMoneyChangePO || 0,
      Note: poh.Note || '',
    });

    // Đổ dữ liệu vào itemInfoForm
    this.itemInfoForm.patchValue({
      EmployeeID: poh.EmployeeID || 0,
      QuantityOrder: poh.QtyRequest || 0,
      Status: poh.Status || 0,
      QuantityReturn: poh.QuantityReturn || 0,
      RequestDate: poh.RequestDate ? new Date(poh.RequestDate) : new Date(),
      QuantityRemain: poh.QuantityRemain || 0,
      DeliveryDate: poh.DeliveryDate ? new Date(poh.DeliveryDate) : new Date(),
      BillCode: poh.BillCode || '',
      DatelineShip: poh.DeadlineDelivery
        ? new Date(poh.DeadlineDelivery)
        : new Date(),
      CurrencyID: poh.CurrencyID || 0,
      MinQuantity: poh.MinQuantity || 0,
      CurrencyRate: poh.CurrencyRate || 0,
      POCode: poh.POCode || '',
      TotalQuantityLast: poh.TotalQuantityLast || 0,
    });

    // Trigger currency change để load tỷ giá nếu có
    if (poh.CurrencyID) {
      this.onCurrencyChange(poh.CurrencyID);
    }
  }
  //#endregion

  //#region Lưu dữ liệu
  onSave() {
    const poh: any = {};

    // Lấy dữ liệu từ additionalInfoForm
    poh.ProjectCode = this.additionalInfoForm.get('ProjectCode')?.value || '';
    poh.ProjectName = this.additionalInfoForm.get('ProjectName')?.value || '';
    poh.ProductNewCode =
      this.additionalInfoForm.get('ProductNewCode')?.value || '';
    poh.ProductCode = this.additionalInfoForm.get('ProductCode')?.value || '';
    poh.TotalMoneyChangePO =
      this.additionalInfoForm.get('TotalMoneyChangePO')?.value || 0;
    poh.Note = this.additionalInfoForm.get('Note')?.value || '';

    // Lấy dữ liệu từ generalInfoForm
    poh.ProductCodeOfSupplier =
      this.generalInfoForm.get('ProductCodeOfSupplier')?.value || '';
    poh.TotalPrice = this.generalInfoForm.get('TotalPrice')?.value || 0;
    poh.FeeShip = this.generalInfoForm.get('FeeShip')?.value || 0;
    poh.PriceSale = this.generalInfoForm.get('PriceSale')?.value || 0;
    poh.PriceHistory = this.generalInfoForm.get('PriceHistory')?.value || 0;
    poh.BiddingPrice = this.generalInfoForm.get('BiddingPrice')?.value || 0;
    poh.VAT = this.generalInfoForm.get('Vat')?.value || 0;
    poh.UnitPrice = this.generalInfoForm.get('UnitPrice')?.value || 0;
    poh.UnitPriceVAT = this.generalInfoForm.get('UnitPriceVat')?.value || 0;
    poh.SupplierVoucher =
      this.generalInfoForm.get('SupplierVoucher')?.value || '';
    poh.DeptSupplier = this.generalInfoForm.get('DeptSupplier')?.value || false;
    poh.NCCNew = this.generalInfoForm.get('NCCNew')?.value || false;
    poh.ProductName = this.generalInfoForm.get('ProductName')?.value || '';
    poh.SupplierSaleID = this.generalInfoForm.get('SupplierSaleID')?.value || 0;
    poh.Company = this.generalInfoForm.get('Company')?.value || 0;
    poh.UnitID = this.generalInfoForm.get('UnitID')?.value || 0;

    // Lấy dữ liệu từ itemInfoForm
    poh.QtyRequest = this.itemInfoForm.get('QuantityOrder')?.value || 0;
    poh.QuantityReturn = this.itemInfoForm.get('QuantityReturn')?.value || 0;
    poh.QuantityRemain = this.itemInfoForm.get('QuantityRemain')?.value || 0;
    poh.MinQuantity = this.itemInfoForm.get('MinQuantity')?.value || 0;
    poh.BillCode = this.itemInfoForm.get('BillCode')?.value || '';
    poh.Status = this.itemInfoForm.get('Status')?.value || 0;
    poh.POCode = this.itemInfoForm.get('POCode')?.value || '';
    poh.CurrencyRate = this.itemInfoForm.get('CurrencyRate')?.value || 0;
    poh.TotalQuantityLast =
      this.itemInfoForm.get('TotalQuantityLast')?.value || 0;
    poh.EmployeeID = this.itemInfoForm.get('EmployeeID')?.value || 0;
    poh.CurrencyID = this.itemInfoForm.get('CurrencyID')?.value || 0;

    // Xử lý ngày tháng
    const requestDate = this.itemInfoForm.get('RequestDate')?.value;
    poh.RequestDate = requestDate ? new Date(requestDate).toISOString() : null;

    const deliveryDate = this.itemInfoForm.get('DeliveryDate')?.value;
    poh.DeliveryDate = deliveryDate
      ? new Date(deliveryDate).toISOString()
      : null;

    const datelineShip = this.itemInfoForm.get('DatelineShip')?.value;
    poh.DeadlineDelivery = datelineShip
      ? new Date(datelineShip).toISOString()
      : null;

    // Lấy text từ dropdown/select
    const companyId = this.generalInfoForm.get('Company')?.value;
    poh.CompanyText =
      this.companyList.find((c) => c.value === companyId)?.label || '';

    const employeeId = this.itemInfoForm.get('EmployeeID')?.value;
    poh.FullName =
      this.employeeList.find((e) => e.ID === employeeId)?.FullName || '';

    const supplierId = this.generalInfoForm.get('SupplierSaleID')?.value;
    poh.NameNCC =
      this.supplierSales.find((s) => s.ID === supplierId)?.NameNCC || '';

    const currencyId = this.itemInfoForm.get('CurrencyID')?.value;
    poh.CurrencyName =
      this.currencyList.find((c) => c.ID === currencyId)?.CurrencyName || '';

    const unitId = this.generalInfoForm.get('UnitID')?.value;
    poh.Unit = this.unitList.find((u) => u.ID === unitId)?.UnitName || '';

    const status = this.itemInfoForm.get('Status')?.value;
    poh.StatusText =
      this.statusList.find((s) => s.value === status)?.label || '';
    poh.ID = this.ponccSummary?.ID || 0;
    this.ponccService.savePonccHistory(poh).subscribe((res) => {
      if (res) {
        this.activeModal.close();
      }
    });
  }
  //#endregion
}
