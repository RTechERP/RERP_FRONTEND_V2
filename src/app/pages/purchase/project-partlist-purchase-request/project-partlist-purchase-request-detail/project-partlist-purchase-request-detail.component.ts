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

@Component({
  selector: 'app-project-partlist-purchase-request-detail',
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
  templateUrl: './project-partlist-purchase-request-detail.component.html',
  styleUrl: './project-partlist-purchase-request-detail.component.css',
})
export class ProjectPartlistPurchaseRequestDetailComponent
  implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    public activeModal: NgbActiveModal,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private fb: FormBuilder,
    private customerService: CustomerServiceService,
    private pokhService: PokhService,
    private whService: WarehouseReleaseRequestService,
    private currencyService: CurrencyService,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private modal: NzModalService
  ) { }

  @Input() projectPartlistDetail: any;

  validateForm!: FormGroup;
  customers: any[] = [];
  employees: any[] = [];
  products: any[] = [];
  employeeRequests: any[] = [];
  employeeBuys: any[] = [];
  productGroup: any[] = [];
  currencys: any[] = [];
  supplierSales: any[] = [];
  isDisable: any = false;
  IsTechBought: any = false;
  isLoadingData: boolean = false; // Flag để tránh trigger valueChanges khi đang load data
  isLimitedEditMode: boolean = false; // Chế độ edit giới hạn cho HR/Marketing - chỉ sửa số lượng và deadline

  private initForm() {
    this.validateForm = this.fb.group({
      CustomerID: [0],
      Maker: [''],
      StatusRequest: [{ value: 'Yêu cầu mua hàng', disabled: true }],
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
    });

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
        if (!this.isLoadingData) {
          setTimeout(() => this.getProductSale(), 0);
        }
      });
  }
  //#endregion

  ngOnInit(): void {
    this.initForm();

    // Load common data
    this.getCustomer();
    this.getEmployee();
    this.getCurrency();
    this.getSupplierSale();
    this.getProducts();
    this.getProductGroup();
    this.loadData();
  }

  ngAfterViewInit(): void { }

  loadData() {
    if (this.projectPartlistDetail != null) {
      let data = this.projectPartlistDetail;
      console.log(data);
      const id = data.ID ? Number(data.ID) : 0;
      this.isDisable = id > 0;

      this.IsTechBought = data.IsTechBought;
      this.isLimitedEditMode = data.isLimitedEditMode ?? false;

      // Set flag để tránh trigger valueChanges khi đang load
      this.isLoadingData = true;

      // Build form value
      const formValue: any = {
        CustomerID: data.CustomerID ?? 0,
        Maker: data.Manufacturer ?? '',
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

        CurrencyID: data.CurrencyID ?? null,
        HistoryPrice: data.HistoryPrice ?? 0,
        CurrencyRate: data.CurrencyRate ?? 0,
        VAT: data.VAT ?? 0,

        UnitFactoryExportPrice: data.UnitFactoryExportPrice ?? 0,
        UnitImportPrice: data.UnitImportPrice ?? 0,
        TotalImportPrice: data.TotalImportPrice ?? 0,

        Note: data.Note ?? '',
        LeadTime: data.TotalDayLeadTime ?? 0,

        IsImport: data.IsImport ?? false,
        ProductSaleID: data.ProductSaleID ?? 0,
        Unit: data.UnitName ?? '',
        ProductGroupID: data.ProductGroupID ?? 0,
      };

      this.validateForm.setValue(formValue);

      // Reset flag sau khi setValue xong
      setTimeout(() => {
        this.isLoadingData = false;
      }, 100);

      // Disable các control khi isDisable = true
      if (this.isDisable) {
        const controlsToDisable = [
          'Maker',
          'StatusRequest',
          'ProductName',
          'Unit',
          'ProductGroupID',
          'TotalPriceExchange',
          'TotalMoneyVAT',
          'UnitFactoryExportPrice',
          'UnitImportPrice',
          'TotalImportPrice',
          'CurrencyRate',
        ];

        this.updateEditForm(controlsToDisable, false);
      }

      if (!this.IsTechBought) {
        const controlsToDisable = [
          'CurrencyID',
          'VAT',
          'SupplierSaleID',
          'IsImport',
          'LeadTime',
        ];
        this.updateEditForm(controlsToDisable, false);
      }

      // Chế độ edit giới hạn cho HR/Marketing - chỉ cho sửa Quantity và DateReturnExpected
      if (this.isLimitedEditMode) {
        const controlsToDisable = [
          'CustomerID',
          'Maker',
          'StatusRequest',
          'ProductSaleID',
          'ProductName',
          'Unit',
          'EmployeeRequestID',
          'ProductGroupID',
          'EmployeeBuyID',
          'DateRequest',
          'UnitPrice',
          'TotalPrice',
          'SupplierSaleID',
          'TotalPriceExchange',
          'TotalMoneyVAT',
          'CurrencyID',
          'HistoryPrice',
          'CurrencyRate',
          'VAT',
          'UnitFactoryExportPrice',
          'UnitImportPrice',
          'TotalImportPrice',
          'Note',
          'LeadTime',
          'IsImport',
        ];
        this.updateEditForm(controlsToDisable, false);
      }

      // Disable ProductName nếu có ProductSaleID
      if (data.ProductSaleID && data.ProductSaleID > 0) {
        this.validateForm.get('ProductName')?.disable();
      }
    } else {
      // New record
      this.isDisable = false;
      this.validateForm.patchValue({
        DateRequest: new Date(),
        StatusRequest: 'Yêu cầu mua hàng',
      });

      // Disable StatusRequest
      this.validateForm.get('StatusRequest')?.disable();
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
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
      },
    });
  }

  getProducts() {
    this.pokhService.loadProducts().subscribe({
      next: (rs) => {
        this.products = rs.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
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
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
      },
    });
  }

  getCurrency() {
    this.currencyService.getAll().subscribe({
      next: (response: any) => {
        this.currencys = response.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
      },
    });
  }

  getProductGroup() {
    this.whService.loadProductGroup().subscribe({
      next: (response: any) => {
        this.productGroup = response.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
      },
    });
  }

  getSupplierSale() {
    this.supplierSaleService.getAllSupplierSale().subscribe({
      next: (response: any) => {
        this.supplierSales = response.data;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
      },
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
    const data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields

    const unitPrice = data.UnitPrice ?? 0;
    const quantity = data.Quantity ?? 0;
    const currencyRate = data.CurrencyRate ?? 0;
    const vat = data.VAT ?? 0;

    const totalPrice = unitPrice * quantity;
    const totalPriceExchange = totalPrice * currencyRate;
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    this.validateForm.patchValue({
      TotalPrice: totalPrice,
      TotalPriceExchange: totalPriceExchange,
      TotalMoneyVAT: totalMoneyVAT,
    });
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

  getProductSale() {
    // Nếu đang load data ban đầu, không gọi API để tránh ghi đè giá trị
    if (this.isLoadingData) {
      return;
    }

    let data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields
    const productSaleId = data.ProductSaleID;
    if (productSaleId > 0) {
      this.validateForm.get('ProductName')?.disable();
    } else {
      this.validateForm.get('ProductName')?.enable();
    }
    this.projectPartlistPurchaseRequestService
      .getProductSaleById(productSaleId)
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.validateForm.patchValue({
              ProductName: response.data.ProductName,
              Maker: response.data.Maker,
              Unit: response.data.Unit,
              ProductGroupID: response.data.ProductGroupID,
              HistoryPrice: response.data.HistoryPrice,
            });
          }
        },
        error: (error) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            error.error.message
          );
        },
      });
  }

  onAddProductSale() {
    const initialData = {
      ID: 0,
      TSAssetCode: '',
      TSAssetName: '',
      DepartmentID: null,
      EmployeeID: null,
      SourceID: null,
      UnitID: null,
      StatusID: null,
      DateBuy: '',
      DateEffect: '',
      Note: '',
      Insurance: '',
      Seri: '',
      SpecificationsAsset: '',
      TSCodeNCC: '',
      WindowActiveStatus: null,
      OfficeActiveStatus: null,
      STT: null,
      // cái gì cần default nữa thì add vào
    };

    const modalRef = this.modalService.open(TsAssetManagementFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = initialData;

    modalRef.result.then(
      () => this.getProducts(),
      () => { }
    );
  }

  onSave() {
    this.validateForm.markAllAsTouched();
    this.validateForm.updateValueAndValidity();

    if (this.validateForm.invalid) {
      return; // dừng lại nếu form lỗi
    }
    let data = this.validateForm.getRawValue(); // Dùng getRawValue() để lấy cả disabled fields

    // Kiểm tra người mua
    if (this.projectPartlistDetail?.ID <= 0 && data.EmployeeBuyID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn người mua'
      );
      return;
    }

    if (!this.IsTechBought) {
      const deadline = new Date(data.DateReturnExpected);
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
            this.executeSave(data);
          },
        });
        return;
      }
    }
    // Kiểm tra Deadline - end

    this.executeSave(data);
  }

  private executeSave(data: any) {
    // Kiểm tra Ghi chú khi IsTechBought = true
    if (this.IsTechBought && (!data.Note || data.Note.trim() === '')) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ghi chú!'
      );
      return;
    }

    // Build model
    const model = this.buildSaveModel(data);

    this.projectPartlistPurchaseRequestService.saveDataDetail(model).subscribe({
      next: (response: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu thành công!'
        );
        this.activeModal.dismiss();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || error.message);
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
      CurrencyID: data.CurrencyID || null,
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
      TotalDayLeadTime: data.LeadTime ? Number(data.LeadTime) : null,
      IsImport: data.IsImport,
      Note: data.Note,
      IsTechBought: this.IsTechBought,
      ProjectPartListID: this.projectPartlistDetail?.ProjectPartListID ?? 0,
    };

    const selectedProduct = this.products.find(p => p.ID === data.ProductSaleID);

    return {
      ...baseModel,
      ProductSaleID: data.ProductSaleID,
      ProductCode: selectedProduct?.ProductCode || '',
      ProductGroupID: data.ProductGroupID,
      Maker: data.Maker || '',
      UnitName: data.Unit || '',
    };
  }

  //#endregion
}
