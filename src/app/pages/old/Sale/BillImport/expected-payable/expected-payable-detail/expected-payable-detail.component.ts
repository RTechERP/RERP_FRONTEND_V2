import { Component, OnInit, Input, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO imports
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ExpectedPayableService } from '../expected-payable.service';
import { ProjectService } from '../../../../../project/project-service/project.service';
import { SupplierSaleService } from '../../../../../purchase/supplier-sale/supplier-sale.service';

import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { ProjectPartlistPurchaseRequestService } from '../../../../../purchase/project-partlist-purchase-request/project-partlist-purchase-request.service';

import { AppUserService } from '../../../../../../services/app-user.service';
import { PaymentOrderService } from '../../../../../general-category/payment-order/payment-order.service';

@Component({
  selector: 'app-expected-payable-detail',
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
    NzGridModule,
    NzIconModule,
    NzSpinModule,
    NzModalModule,
    NzCheckboxModule,
  ],
  templateUrl: './expected-payable-detail.component.html',
  styleUrl: './expected-payable-detail.component.css'
})
export class ExpectedPayableDetailComponent implements OnInit {
  @Input() data: any = null;

  form!: FormGroup;
  isSaving = false;
  isLoadingData = false;

  suppliers: any[] = [];
  employees: any[] = [];
  currencies: any[] = [];
  poNCCsAll: any[] = [];
  poNCCs: any[] = [];

  isDisable = false;

  formatAmount = (value: number) =>
    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parseAmount = (value: string): number => Number(value.replace(/,/g, ''));

  formatPercent = (value: number) => `${value}%`;
  parsePercent = (value: string): number => Number(value.replace('%', ''));

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private expectedPayableService: ExpectedPayableService,
    private projectService: ProjectService,
    private supplierSaleService: SupplierSaleService,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private appUserService: AppUserService,
    private paymentOrderService: PaymentOrderService,
  ) { }

  ngOnInit(): void {
    this.loadLookUpData();
    this.buildForm();
    if (this.data) {
      this.form.patchValue({
        SupplierID: this.data?.SupplierID,
        DeliveryPerson: this.data?.DeliverID || this.appUserService.employeeID,
        BillImportID: this.data?.BillImportID || 0,
        InvoiceCode: this.data?.InvoiceNumber,
        InvoiceDate: this.data?.InvoiceDate,
        DueDate: this.data?.DueDate,
        Amount: this.data?.UnitPrice,
        CurrencyID: this.data?.CurrencyID,
        BudgetDomestic: this.data?.DomesticPayable,
        BudgetForeign: this.data?.ForeignPayable,
        ExtraAmount: this.data?.ArisingAmount,
        OfficeExpense: this.data?.OfficeExpense,
        TaxAmount: this.data?.TaxAmount,
        Note: this.data?.Note,
        PaymentPercentage: this.data?.PaymentPercentage ?? 100,
        PONCCID: this.data?.PONCCID,
        IsAdditional: this.data?.IsAdditional || false,
        WeekStartDate: this.data?.WeekStartDate,
        WeekEndDate: this.data?.WeekEndDate,
      });
      this.updateValidators(this.form.get('IsAdditional')?.value);
    }
  }

  buildForm(): void {
    if (this.data?.BillImportID) {
      this.isDisable = true;
    }


    this.form = this.fb.group({
      SupplierID: [{ value: null, disabled: this.isDisable }, Validators.required],
      DeliveryPerson: [{ value: this.appUserService.employeeID, disabled: true }, Validators.required],
      InvoiceCode: [{ value: null, disabled: this.isDisable }],
      InvoiceDate: [{ value: null, disabled: this.isDisable }],
      DueDate: [{ value: null, disabled: this.isDisable }, [Validators.required, (control: AbstractControl) => this.minDateValidator(control)]],
      Amount: [{ value: 0, disabled: this.isDisable }],
      CurrencyID: [{ value: null, disabled: this.isDisable }, Validators.required],
      AmountVND: [{ value: 0, disabled: true }],
      BudgetDomestic: [0],
      BudgetForeign: [0],
      ExtraAmount: [0],
      OfficeExpense: [0],
      TaxAmount: [0],
      Note: [null],
      PaymentPercentage: [{ value: 100, disabled: this.isDisable }, [Validators.required, Validators.min(0), Validators.max(100)]],
      PONCCID: [{ value: null, disabled: this.isDisable }],
      IsAdditional: [false],
      WeekStartDate: [null],
      WeekEndDate: [null],
    });

    this.form.get('IsAdditional')!.valueChanges.subscribe((isAdditional) => {
      this.updateValidators(isAdditional);
      if (!isAdditional) {
        this.form.get('WeekStartDate')?.setValue(null);
        this.form.get('WeekEndDate')?.setValue(null);
      }
    });

    this.form.get('WeekStartDate')!.valueChanges.subscribe(() => {
      this.form.get('WeekEndDate')?.updateValueAndValidity();
    });

    // Tính AmountVND khi Amount hoặc CurrencyID thay đổi
    this.form.get('Amount')!.valueChanges.subscribe(() => this.calcAmountVND());
    this.form.get('CurrencyID')!.valueChanges.subscribe(() => this.calcAmountVND());
    this.form.get('InvoiceDate')!.valueChanges.subscribe(() => {
      this.form.get('DueDate')?.updateValueAndValidity();
    });

    this.form.get('SupplierID')!.valueChanges.subscribe((v) => {
      this.calcAmountVND();
      this.filterPOs(v);
      const currentPO = this.form.get('PONCCID')?.value;
      const filtered = v ? this.poNCCsAll.filter(x => x.SupplierSaleID == v) : [];
      if (currentPO && !filtered.some(x => x.ID == currentPO)) {
        this.form.get('PONCCID')?.setValue(null, { emitEvent: false });
      }
    });

    this.form.get('PONCCID')!.valueChanges.subscribe((v) => {
      if (v) {
        const po = this.poNCCsAll.find((x: any) => x.ID == v);
        if (po) {
          if (po.SupplierSaleID) {
            const supplierCtrl = this.form.get('SupplierID');
            if (supplierCtrl) {
              supplierCtrl.setValue(po.SupplierSaleID);
              supplierCtrl.markAsUntouched();
              supplierCtrl.markAsPristine();
              supplierCtrl.updateValueAndValidity();
            }
          }
          if (po.CurrencyID) {
            this.form.get('CurrencyID')?.setValue(po.CurrencyID);
          }
          if (po.TotalMoneyPO !== undefined && po.TotalMoneyPO !== null) {
            this.form.get('Amount')?.setValue(po.TotalMoneyPO);
          }
        }
      }
    });
  }

  minDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const invoiceDateVal = this.form?.get('InvoiceDate')?.value;
    if (!invoiceDateVal) return null;
    const invoiceDate = new Date(invoiceDateVal);
    invoiceDate.setHours(0, 0, 0, 0);
    const selected = new Date(control.value);
    selected.setHours(0, 0, 0, 0);
    return selected >= invoiceDate ? null : { minDate: true };
  }

  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const startDateVal = this.form?.get('WeekStartDate')?.value;
    if (!startDateVal) return null;
    const startDate = new Date(startDateVal);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(control.value);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= startDate ? null : { dateRangeInvalid: true };
  }

  updateValidators(isAdditional: boolean): void {
    const supplierCtrl = this.form.get('SupplierID');
    const dueDateCtrl = this.form.get('DueDate');
    const startDateCtrl = this.form.get('WeekStartDate');
    const endDateCtrl = this.form.get('WeekEndDate');

    if (isAdditional) {
      supplierCtrl?.clearValidators();
      dueDateCtrl?.clearValidators();
      startDateCtrl?.setValidators(Validators.required);
      endDateCtrl?.setValidators([Validators.required, (control: AbstractControl) => this.dateRangeValidator(control)]);
    } else {
      supplierCtrl?.setValidators(Validators.required);
      dueDateCtrl?.setValidators([Validators.required, (control: AbstractControl) => this.minDateValidator(control)]);
      startDateCtrl?.clearValidators();
      endDateCtrl?.clearValidators();
    }

    supplierCtrl?.updateValueAndValidity();
    dueDateCtrl?.updateValueAndValidity();
    startDateCtrl?.updateValueAndValidity();
    endDateCtrl?.updateValueAndValidity();
  }

  calcAmountVND(): void {
    const amount = this.form.get('Amount')?.value || 0;
    const currencyId = this.form.get('CurrencyID')?.value;
    const currency = this.currencies.find(c => c.ID === currencyId);
    const rate = currency?.CurrencyRate || 1;
    this.form.get('AmountVND')?.setValue(Math.round(amount * rate * 100) / 100, { emitEvent: false });
  }


  loadLookUpData() {
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => {
        this.suppliers = res.data || [];
        console.log('suppliers', this.suppliers);
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + (error.message || error)
        );
      },
    });

    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + (error.message || error)
        );
      },
    });

    this.projectPartlistPurchaseRequestService.getCurrencies().subscribe({
      next: (response: any) => {
        this.currencies = response
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách loại tiền: ' + (error.message || error)
        );
      },
    });

    this.paymentOrderService.getProcurement().subscribe({
      next: (res: any) => {
        this.poNCCsAll = (res.data?.poNCCs || []).sort(
          (a: any, b: any) => new Date(b.CreatedDate).getTime() - new Date(a.CreatedDate).getTime()
        );
        this.filterPOs();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách PO: ' + (error.message || error)
        );
      }
    });
  }

  filterPOs(supplierId?: number): void {
    debugger;
    const sId = supplierId !== undefined ? supplierId : this.form?.get('SupplierID')?.value;
    this.poNCCs = sId ? this.poNCCsAll.filter((x: any) => x.SupplierSaleID == sId) : [...this.poNCCsAll];
  }

  private toLocalISOString(date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  }

  onSave(): void {
    if (this.form.invalid) {
      console.group('--- Form Invalid Controls ---');
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control && control.invalid) {
          console.log(`Field "${key}" is invalid. Errors:`, control.errors, 'Current Value:', control.value);
        }
      });
      console.groupEnd();
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    const value = { ...this.data, ...this.form.getRawValue() };

    let data = {
      ID: value?.ID || 0,
      BillImportID: value?.BillImportID || 0,
      SupplierSaleID: value?.SupplierID || 0,
      DeliverID: value?.DeliveryPerson || 0,
      InvoiceNumber: value?.InvoiceCode || "",
      InvoiceDate: value?.InvoiceDate ? this.toLocalISOString(value.InvoiceDate) : null,
      DueDate: value?.DueDate ? this.toLocalISOString(value.DueDate) : null,
      UnitPrice: value?.Amount || 0,
      CurrencyID: value?.CurrencyID || 0,
      DomesticPayable: value?.BudgetDomestic || 0,
      ForeignPayable: value?.BudgetForeign || 0,
      ArisingAmount: value?.ExtraAmount || 0,
      OfficeExpense: value?.OfficeExpense || 0,
      TaxAmount: value?.TaxAmount || 0,
      Note: value?.Note || "",
      PaymentPercentage: value?.PaymentPercentage ?? 100,
      PONCCID: value?.PONCCID || null,
      IsAdditional: value?.IsAdditional || false,
      WeekStartDate: value?.WeekStartDate ? this.toLocalISOString(value.WeekStartDate) : null,
      WeekEndDate: value?.WeekEndDate ? this.toLocalISOString(value.WeekEndDate) : null,
      IsDeleted: false
    }
    this.isSaving = true;
    this.expectedPayableService.saveExpectedPayable(data).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công!');
        this.activeModal.close(response);
      },
      error: (error: any) => {
        this.isSaving = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi lưu: ' + (error.message || error)
        );
      },
    });
  }

  onClose(): void {
    this.activeModal.dismiss();
  }
}
