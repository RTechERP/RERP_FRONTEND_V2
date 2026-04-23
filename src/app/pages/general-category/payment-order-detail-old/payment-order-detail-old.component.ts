import { PaymentOrderFile, PaymentOrderField, PaymentOrder } from './../payment-order/model/payment-order';
import { PaymentOrderService, CURRENCY_CONFIGS } from './../payment-order/payment-order.service';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from './../../../app.config';
import { AppUserService } from '../../../services/app-user.service';
import { FilePreviewComponent } from '../file-preview/file-preview.component';
import { environment } from '../../../../environments/environment';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CurrencyFormatRealtimeDirective } from '../../../directives/CurrencyFormatRealtime.directive';
@Component({
    selector: 'app-payment-order-detail-old',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzSelectModule,
        NzDatePickerModule,
        NzButtonModule,
        NzIconModule,
        FilePreviewComponent,
        NzToolTipModule,
        CurrencyFormatRealtimeDirective
    ],
    templateUrl: './payment-order-detail-old.component.html',
    styleUrl: './payment-order-detail-old.component.css'
})
export class PaymentOrderDetailOldComponent implements OnInit, OnDestroy {

    validateForm!: FormGroup;

    paymentOrderTypes: any[] = [];
    approvedTBPs: any[] = [];
    supplierSalesAll: any[] = [];
    supplierSales: any[] = [];
    poNCCsAll: any[] = [];
    poNCCs: any[] = [];
    registerContracts: any[] = [];
    projects: any[] = [];
    typeBankTransfers: any[] = [];
    units: any[] = [];

    @Input() ponccID: number = 0;
    @Input() paymentOrder = new PaymentOrder();
    @Input() isCopy = false;
    @Input() initialContentPayment: string = '';

    paymentOrderField = PaymentOrderField;

    // Type 1, 3 data
    dataset: any[] = [
        {
            _id: 1, ID: 0, Stt: '1', ContentPayment: '', Unit: '', Quantity: 0, UnitPrice: 0, TotalMoney: 0, Note: '', ParentID: null, PaymentPercentage: 100,
            //  TotalMoneyWithInvoice: 0 
        }
    ];

    // Type 2 data (I / II+details / III+diffs)
    dataset2: any[] = [
        {
            _id: 1, ID: 0, Stt: 'I', ContentPayment: 'Số tiền tạm ứng', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: null, PaymentPercentage: 0,
            //  TotalMoneyWithInvoice: 0 
        },
        {
            _id: 2, ID: 0, Stt: 'II', ContentPayment: 'Số tiền thanh toán', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: null, PaymentPercentage: 0,
            //  TotalMoneyWithInvoice: 0 
        },
        {
            _id: 6, ID: 0, Stt: '1', ContentPayment: '', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: 2, PaymentPercentage: 100,
            //  TotalMoneyWithInvoice: 0 
        },
        {
            _id: 3, ID: 0, Stt: 'III', ContentPayment: 'Chênh lệch', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: null, PaymentPercentage: 0,
            //  TotalMoneyWithInvoice: 0 
        },
        {
            _id: 4, ID: 0, Stt: '1', ContentPayment: 'Tạm ứng chi không hết (I-II)', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: 3, PaymentPercentage: 0,
            //  TotalMoneyWithInvoice: 0 
        },
        {
            _id: 5, ID: 0, Stt: '2', ContentPayment: 'Số chi quá tạm ứng (II-I)', TotalMoney: 0, Unit: '', Quantity: 0, UnitPrice: 0, Note: '', ParentID: 3, PaymentPercentage: 0,
            //  TotalMoneyWithInvoice: 0 
        },
    ];

    // File management
    dataFiles: any[] = [];
    fileUploads: any[] = [];
    fileDeletes: any[] = [];

    isSubmit = false;
    private destroy$ = new Subject<void>();

    // ---- Type 2 getters ----
    private readonly FIXED_STTS = ['I', 'II', 'III'];
    private readonly FIXED_CONTENTS = [
        'Số tiền tạm ứng', 'Số tiền thanh toán', 'Chênh lệch',
        'Tạm ứng chi không hết (I-II)', 'Số chi quá tạm ứng (II-I)'
    ];

    get t2RowI(): any { return this.dataset2.find(r => (r.Stt || '').trim() === 'I') || {}; }
    get t2RowII(): any { return this.dataset2.find(r => (r.Stt || '').trim() === 'II') || {}; }
    get t2RowIII(): any { return this.dataset2.find(r => (r.Stt || '').trim() === 'III') || {}; }
    get t2RowDiff1(): any { return this.dataset2.find(r => (r.ContentPayment || '').trim().includes('Tạm ứng chi không hết')) || {}; }
    get t2RowDiff2(): any { return this.dataset2.find(r => (r.ContentPayment || '').trim().includes('Số chi quá tạm ứng')) || {}; }
    get t2DetailRows(): any[] {
        return this.dataset2.filter(r => {
            const stt = (r.Stt || '').trim();
            const content = (r.ContentPayment || '').trim();
            return !['I', 'II', 'III'].includes(stt) && !this.FIXED_CONTENTS.some(fc => fc.trim() === content);
        });
    }

    get totalI(): number { return this.round2(this.parseNum(this.t2RowI?.TotalMoney)); }
    get totalIIThanhTien(): number {
        return this.round2(this.t2DetailRows.reduce((s, r) => s + this.parseNum(r.TotalMoney), 0));
    }
    get totalII(): number {
        const total = this.t2DetailRows.reduce((s, r) => {
            const tm = this.parseNum(r.TotalMoney);
            const pct = this.parseNum(r.PaymentPercentage);
            return s + (tm * (pct / 100));
        }, 0);
        return this.round2(total);
    }
    get totalDiff(): number { return this.round2(Math.abs(this.totalI - this.totalII)); }
    get diff1(): number { return this.round2(Math.max(this.totalI - this.totalII, 0)); }
    get diff2(): number { return this.round2(Math.max(this.totalII - this.totalI, 0)); }
    // Diff theo Thành tiền (TotalMoney): so sánh TM_I vs TM_II (không nhân %)
    get diffThanhTien1(): number { return this.round2(Math.max(this.totalI - this.totalIIThanhTien, 0)); }
    get diffThanhTien2(): number { return this.round2(Math.max(this.totalIIThanhTien - this.totalI, 0)); }
    get totalIIIThanhTien(): number { return this.round2(this.diffThanhTien1 + this.diffThanhTien2); }
    get totalType1(): number {
        const total = this.dataset.reduce((s, r) => {
            const tm = this.parseNum(r.TotalMoney);
            const pct = this.parseNum(r.PaymentPercentage);
            return s + (tm * (pct / 100));
        }, 0);
        return this.round2(total);
    }
    get currentTotal(): number {
        return this.paymentOrder.TypeOrder === 2
            ? (this.totalDiff !== 0 ? this.totalDiff : this.totalII)
            : this.totalType1;
    }
    isRomanNumeral(stt: string): boolean {
        return /^[IVXLCDMivxlcdm]+$/.test((stt || '').trim());
    }

    parseNum(val: any): number {
        return parseFloat(String(val ?? '').replace(/,/g, '')) || 0;
    }

    private round2(val: number): number {
        return Math.round((val + Number.EPSILON) * 100) / 100;
    }

    get totalMoneyText(): string {
        const unit = this.validateForm?.value?.Unit || 'vnd';
        return this.paymentService.readMoney(this.currentTotal, unit);
    }

    constructor(
        public activeModal: NgbActiveModal,
        private fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private paymentService: PaymentOrderService,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initDataCombo();
        this.initFormGroup();
        this.loadDetailData();
        if (this.ponccID > 0) this.loadDataFromPONCC();
        if (this.initialContentPayment && this.t2DetailRows.length > 0) {
            this.t2DetailRows[0].ContentPayment = this.initialContentPayment;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initDataCombo(): void {
        this.paymentService.getDataCombo().subscribe({
            next: (res) => {
                this.paymentOrderTypes = res.data.paymentOrderTypes;
                this.approvedTBPs = res.data.approvedTBPs;
                this.supplierSalesAll = res.data.supplierSales;
                this.supplierSales = [...this.supplierSalesAll];
                this.poNCCsAll = res.data.poNCCs;
                this.poNCCs = [...this.poNCCsAll];
                this.registerContracts = res.data.registerContracts;
                this.projects = res.data.projects;
                // Patch lại các trường nz-select sau khi combo data đã có — không recreate form để tránh mất subscriptions
                if (this.validateForm) {
                    // Auto-select TBP theo department khi tạo mới hoặc copy
                    let approvedTBPID = this.paymentOrder.ApprovedTBPID;
                    const isNewOrCopy = this.paymentOrder.ID <= 0 || this.isCopy;
                    if (isNewOrCopy) {
                        if (this.appUserService.currentUser?.DepartmentID == 4) {
                            const matched = this.approvedTBPs.find((x: any) => x.DepartmentID == 4);
                            if (matched) approvedTBPID = matched.EmployeeID;
                        }

                    }

                    this.validateForm.patchValue({
                        TypeOrder: this.paymentOrder.TypeOrder,
                        PaymentOrderTypeID: this.paymentOrder.PaymentOrderTypeID,
                        ApprovedTBPID: approvedTBPID,
                        SupplierSaleID: this.paymentOrder.SupplierSaleID,
                        PONCCID: this.paymentOrder.PONCCID,
                        RegisterContractID: this.paymentOrder.RegisterContractID,
                        ProjectID: this.paymentOrder.ProjectID,
                    }, { emitEvent: false });
                    const sid = this.paymentOrder.SupplierSaleID;
                    this.poNCCs = sid ? this.poNCCsAll.filter((x: any) => x.SupplierSaleID == sid) : [...this.poNCCsAll];
                    this.cdr.detectChanges();
                }
            },
            error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message)
        });
        this.typeBankTransfers = [
            { ID: 5, Text: 'Chuyển khoản cá nhân' },
            { ID: 1, Text: 'Chuyển khoản RTC' },
            { ID: 2, Text: 'Chuyển khoản MVI' },
            { ID: 3, Text: 'Chuyển khoản APR' },
            { ID: 4, Text: 'Chuyển khoản Yonko' },
            { ID: 6, Text: 'Chuyển khoản R-Tech' },
        ];
        this.units = CURRENCY_CONFIGS;
    }

    initFormGroup(): void {
        const dateOrder = (this.paymentOrder.ID <= 0 || this.isCopy) ? new Date() : (this.paymentOrder.DateOrder || new Date());
        this.validateForm = this.fb.group({
            TypeOrder: this.fb.control(this.paymentOrder.TypeOrder, [Validators.required]),
            PaymentOrderTypeID: this.fb.control(this.paymentOrder.PaymentOrderTypeID, [Validators.required]),
            DateOrder: this.fb.control({ value: dateOrder, disabled: true }, [Validators.required]),
            FullName: this.fb.control({ value: (this.paymentOrder.ID > 0 && !this.isCopy) ? this.paymentOrder.FullName : this.appUserService.currentUser?.FullName, disabled: true }),
            DepartmentName: this.fb.control({ value: (this.paymentOrder.ID > 0 && !this.isCopy) ? this.paymentOrder.DepartmentName : this.appUserService.currentUser?.DepartmentName, disabled: true }),
            ApprovedTBPID: this.fb.control(this.paymentOrder.ApprovedTBPID, [Validators.required]),
            SupplierSaleID: this.fb.control(this.paymentOrder.SupplierSaleID),
            PONCCID: this.fb.control(this.paymentOrder.PONCCID),
            RegisterContractID: this.fb.control(this.paymentOrder.RegisterContractID),
            ProjectID: this.fb.control(this.paymentOrder.ProjectID),
            IsUrgent: this.fb.control(this.paymentOrder.IsUrgent),
            DeadlinePayment: this.fb.control(this.paymentOrder.DeadlinePayment),
            ReasonOrder: this.fb.control(this.paymentOrder.ReasonOrder, [Validators.required]),
            ReceiverInfo: this.fb.control(this.paymentOrder.ReceiverInfo, [Validators.required]),
            IsBill: this.fb.control(this.paymentOrder.IsBill),
            StartLocation: this.fb.control(this.paymentOrder.StartLocation),
            EndLocation: this.fb.control(this.paymentOrder.EndLocation),
            TypePayment: this.fb.control((this.paymentOrder.ID <= 0 || this.isCopy) ? (this.paymentOrder.TypePayment || 1) : this.paymentOrder.TypePayment, [Validators.required]),
            DatePayment: this.fb.control(this.paymentOrder.DatePayment),
            TypeBankTransfer: this.fb.control(this.paymentOrder.TypeBankTransfer),
            AccountNumber: this.fb.control(this.paymentOrder.AccountNumber),
            Bank: this.fb.control(this.paymentOrder.Bank),
            ContentBankTransfer: this.fb.control(this.paymentOrder.ContentBankTransfer),
            Unit: this.fb.control(this.paymentOrder.Unit?.toLowerCase(), [Validators.required]),
        });

        this.validateForm.get('TypeOrder')?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((v: number) => {
                this.paymentOrder.TypeOrder = v;
                const dp = this.validateForm.get('DatePayment');
                v != 2 ? dp?.setValidators([Validators.required]) : dp?.clearValidators();
                dp?.updateValueAndValidity();
            });

        this.validateForm.get('PaymentOrderTypeID')?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((v: number) => {
                this.paymentOrder.PaymentOrderTypeID = v;
                ['StartLocation', 'EndLocation'].forEach(f => {
                    const ctrl = this.validateForm.get(f);
                    v == 22 ? ctrl?.setValidators([Validators.required]) : ctrl?.clearValidators();
                    ctrl?.updateValueAndValidity();
                });
            });

        this.validateForm.get('SupplierSaleID')?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((v: number) => {
                this.poNCCs = v ? this.poNCCsAll.filter(x => x.SupplierSaleID == v) : [...this.poNCCsAll];
                const s = this.supplierSalesAll.find(x => x.ID == v);
                if (s) this.validateForm.patchValue({ AccountNumber: s.SoTK, ReceiverInfo: s.NameNCC, Bank: s.NganHang });
            });

        this.validateForm.get('IsUrgent')?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((v: boolean) => {
                this.paymentOrder.IsUrgent = v;
                const dl = this.validateForm.get('DeadlinePayment');
                v ? dl?.setValidators([Validators.required]) : dl?.clearValidators();
                dl?.updateValueAndValidity();
            });

        const initialTypePayment = this.validateForm.get('TypePayment')?.value;
        this.validateForm.get('TypePayment')?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((v: number) => {
                this.paymentOrder.TypePayment = v;
                const bankFields = ['TypeBankTransfer', 'AccountNumber', 'Bank', 'ContentBankTransfer'];
                bankFields.forEach(f => {
                    const ctrl = this.validateForm.get(f);
                    v == 1 ? ctrl?.setValidators([Validators.required]) : ctrl?.clearValidators();
                    ctrl?.updateValueAndValidity();
                });
            });
        if (initialTypePayment) {
            this.validateForm.get('TypePayment')?.updateValueAndValidity();
        }
    }

    loadDetailData(): void {
        if (this.paymentOrder.ID <= 0) return;
        this.paymentService.getDetail(this.paymentOrder.ID).subscribe({
            next: (res) => {
                const details: any[] = res.data.details || [];
                if (this.paymentOrder.TypeOrder != 2) {
                    this.dataset = details.map((x, i) => {
                        const pid = x.ParentID ?? x.ParentId ?? 0;
                        return {
                            ...x, _id: i + 1,
                            ParentID: (pid == 0 ? null : pid),
                            PaymentPercentage: x.PaymentPercentage ?? 100,
                        };
                    });
                } else {
                    const findRow = (stt: string) => details.find(r => (r.Stt || '').trim() === stt);
                    const rowI = findRow('I');
                    const rowII = findRow('II');
                    const rowIII = findRow('III');
                    const d1 = details.find(r => (r.ContentPayment || '').trim().includes('Tạm ứng chi không hết'));
                    const d2 = details.find(r => (r.ContentPayment || '').trim().includes('Số chi quá tạm ứng'));

                    const ridII = rowII?.Id || rowII?.ID || 0;
                    const detailRows = ridII ? details.filter(r => (r.ParentId || r.ParentID || 0) === ridII) : [];

                    // const mapRow = (r: any, defaultId: number) => {
                    //     if (!r) return null;
                    //     const rid = r.ID ?? r.Id ?? 0;
                    //     const pid = r.ParentID ?? r.ParentId ?? 0;
                    //     let pct = this.parseNum(r.PaymentPercentage);
                    //     if (defaultId > 5 && pct === 0) pct = 100;
                    //     if (defaultId <= 5) pct = 0;
                    //     return {
                    //         ...r,
                    //         _id: rid || defaultId,
                    //         ParentID: pid || null,
                    //         PaymentPercentage: pct
                    //     };
                    // };

                    // this.dataset2 = [
                    //     mapRow(rowI, 1),
                    //     mapRow(rowII, 2),
                    //     ...detailRows.map((r, i) => mapRow(r, 6 + i)),
                    //     mapRow(rowIII, 3),
                    //     mapRow(d1, 4),
                    //     mapRow(d2, 5),
                    // ].filter(Boolean);
                    const mapRow = (r: any, defaultId: number, isHeader: boolean = false) => {
                        if (!r) return null;
                        const rid = r.Id || r.ID || 0;
                        const pid = r.ParentId || r.ParentID || 0;
                        let pct = this.parseNum(r.PaymentPercentage);
                        if (defaultId > 5 && pct === 0) pct = 100;
                        if (defaultId <= 5) pct = 0;

                        return {
                            ...r,
                            // Nếu là dòng Header I, II, III thì ép ID cố định 1, 2, 3
                            _id: isHeader ? defaultId : (rid || defaultId),
                            ParentID: isHeader ? null : pid,
                            PaymentPercentage: pct,
                            ...(this.isCopy ? { TotalPaymentAmount: 0 } : {}),
                        };
                    };

                    this.dataset2 = [
                        mapRow(rowI, 1, true),   // Header I -> _id: 1
                        mapRow(rowII, 2, true),  // Header II -> _id: 2
                        ...detailRows.map((r, i) => mapRow(r, 6 + i)), // Dòng chi tiết
                        mapRow(rowIII, 3, true), // Header III -> _id: 3
                        mapRow(d1, 4),
                        mapRow(d2, 5),
                    ].filter(Boolean);
                }
                if (!this.isCopy) {
                    this.dataFiles = (res.data.files || []).map((x: any, i: number) => ({ ...x, _rowId: i + 1 }));
                }
                this.cdr.detectChanges();
            },
            error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message)
        });
    }

    loadDataFromPONCC(): void {
        this.paymentService.getDataFromPONCC(this.ponccID).subscribe({
            next: (res) => {
                const { poNCC, supplierSale, poNCCDetails } = res.data;
                this.validateForm.patchValue({
                    SupplierSaleID: poNCC.SupplierSaleID, PONCCID: poNCC.ID, ApprovedTBPID: 178,
                    AccountNumber: poNCC.AccountNumberSupplier, Bank: poNCC.BankSupplier,
                    ReceiverInfo: supplierSale?.NameNCC || '', Unit: poNCC.Unit.toLowerCase(),
                });
                this.dataset = poNCCDetails.map((item: any, i: number) => ({
                    _id: i + 1, ID: 0, Stt: item.STT || `${i + 1}`,
                    ContentPayment: item.ProductName || '', Unit: item.Unit || '',
                    Quantity: item.QtyRequest || 0, UnitPrice: item.UnitPrice || 0,
                    TotalMoney: item.TotalPrice || 0, Note: item.Note || '', ParentID: null,
                    PaymentPercentage: 100,
                    // TotalMoneyWithInvoice: 0,
                }));
                this.cdr.detectChanges();
            },
            error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message)
        });
    }

    // ---- Type 1 table ----
    addRow(): void {
        const maxId = this.dataset.length > 0 ? Math.max(...this.dataset.map(r => r._id || 0)) : 0;
        const maxStt = this.dataset.length > 0 ? Math.max(...this.dataset.map(r => parseInt(r.Stt) || 0)) : 0;
        this.dataset = [...this.dataset, {
            _id: maxId + 1, ID: 0, Stt: `${maxStt + 1}`,
            ContentPayment: '', Unit: '', Quantity: 0, UnitPrice: 0, TotalMoney: 0, Note: '', ParentID: null,
            PaymentPercentage: 100,
            // TotalMoneyWithInvoice: 0,
        }];
    }

    deleteRow(index: number): void {
        this.dataset = this.dataset.filter((_, i) => i !== index);
    }

    calcTotalMoney(row: any): void {
        row.TotalMoney = (this.parseNum(row.Quantity)) * (this.parseNum(row.UnitPrice));
        this.calcTotalPayment(row);
    }

    calcTotalPayment(row: any): void {
        row.TotalPaymentAmount = (this.parseNum(row.TotalMoney)) * ((this.parseNum(row.PaymentPercentage)) / 100);
    }

    // ---- Type 2 table ----
    addDetailRow(): void {
        const maxId = this.dataset2.length > 0 ? Math.max(...this.dataset2.map(r => r._id || 0)) : 5;
        const maxStt = this.t2DetailRows.length > 0 ? Math.max(...this.t2DetailRows.map(r => parseInt(r.Stt) || 0)) : 0;
        const newRow = {
            _id: maxId + 1, ID: 0, Stt: `${maxStt + 1}`,
            ContentPayment: '', Unit: '', Quantity: 0, UnitPrice: 0, TotalMoney: 0, Note: '', ParentID: 2,
            PaymentPercentage: 100,
            // TotalMoneyWithInvoice: 0,
        };
        const iiiIdx = this.dataset2.findIndex(r => r.Stt === 'III');
        if (iiiIdx >= 0) {
            this.dataset2 = [...this.dataset2.slice(0, iiiIdx), newRow, ...this.dataset2.slice(iiiIdx)];
        } else {
            this.dataset2 = [...this.dataset2, newRow];
        }
    }

    deleteDetailRow(row: any): void {
        this.dataset2 = this.dataset2.filter(r => r !== row);
    }

    // replaced by calcTotalMoney and calcTotalPayment

    // ---- Submit ----
    submitForm(): void {
        if (!this.validateForm.valid) {
            Object.values(this.validateForm.controls).forEach(c => {
                if (c.invalid) { c.markAsDirty(); c.markAsTouched(); c.updateValueAndValidity({ onlySelf: true }); }
            });
            const fieldNames: Record<string, string> = {
                TypeOrder: 'Loại đề nghị',
                PaymentOrderTypeID: 'Loại nội dung đề nghị',
                DateOrder: 'Ngày đề nghị',
                FullName: 'Người đề nghị',
                DepartmentName: 'Bộ phận',
                ApprovedTBPID: 'TBP duyệt',
                SupplierSaleID: 'Nhà cung cấp',
                PONCCID: 'PO NCC',
                RegisterContractID: 'Hợp đồng',
                ProjectID: 'Dự án',
                IsUrgent: 'Thanh toán gấp',
                DeadlinePayment: 'Deadline thanh toán',
                ReasonOrder: 'Lý do',
                ReceiverInfo: 'Thông tin người nhận tiền',
                IsBill: 'Có hóa đơn',
                StartLocation: 'Điểm đi',
                EndLocation: 'Điểm đến',
                TypePayment: 'Hình thức thanh toán',
                DatePayment: 'Thời gian thanh quyết toán',
                TypeBankTransfer: 'Hình thức chuyển khoản',
                AccountNumber: 'Số tài khoản',
                Bank: 'Ngân hàng',
                ContentBankTransfer: 'Nội dung chuyển khoản',
                Unit: 'Loại tiền'
            };
            const invalidFields = Object.entries(this.validateForm.controls)
                .filter(([, c]) => c.invalid)
                .map(([key]) => fieldNames[key] || key)
                .filter(Boolean)
                .join(', ');
            this.notification.warning('Vui lòng kiểm tra lại', `Các trường bắt buộc chưa điền: ${invalidFields}`);
            return;
        }
        if (this.validateForm.getRawValue().IsBill) {
            // if (this.paymentOrder.TypeOrder != 2) {
            //     const hasEmpty = this.dataset.some(r => r.TotalMoneyWithInvoice === null || r.TotalMoneyWithInvoice === undefined || r.TotalMoneyWithInvoice === '');
            //     if (hasEmpty) {
            //         this.notification.warning('Vui lòng kiểm tra lại', 'Khi có hóa đơn, cột Tổng tiền TT có HĐ bắt buộc phải điền (nếu không có hóa đơn cho dòng đó thì điền = 0)');
            //         return;
            //     }
            // } else {
            //     const v = this.t2RowII.TotalMoneyWithInvoice;
            //     if (v === null || v === undefined || v === '') {
            //         this.notification.warning('Vui lòng kiểm tra lại', 'Khi có hóa đơn, cột Tổng tiền TT có HĐ (dòng II) bắt buộc phải điền');
            //         return;
            //     }
            // }
        }

        this.isSubmit = true;

        const sanitize = (r: any, overrides: any = {}) => ({
            ...r,
            ...overrides,
            PaymentPercentage: this.parseNum(r.PaymentPercentage),
            // TotalMoneyWithInvoice: parseFloat(r.TotalMoneyWithInvoice) || 0,
            ...(this.isCopy ? { Id: 0, ID: 0, PaymentOrderId: 0, PaymentOrderID: 0 } : {}),
        });

        let details: any[];
        if (this.paymentOrder.TypeOrder != 2) {
            details = this.dataset.map(r => sanitize(r, { ID: this.isCopy ? 0 : r.ID }));
        } else {
            // details = [
            //     sanitize(this.t2RowI, { ID: this.isCopy ? 0 : (this.t2RowI.ID || 0) }),
            //     sanitize(this.t2RowII, { ID: this.isCopy ? 0 : (this.t2RowII.ID || 0), TotalMoney: this.totalII }),
            //     ...this.t2DetailRows.map(r => sanitize(r, { ID: this.isCopy ? 0 : (r.ID || 0) })),
            //     sanitize(this.t2RowIII, { ID: this.isCopy ? 0 : (this.t2RowIII.ID || 0), TotalMoney: this.totalDiff }),
            //     sanitize(this.dataset2.find(r => r.ContentPayment?.includes('Tạm ứng chi không hết')) || {}, { ID: 0, TotalMoney: this.diff1 }),
            //     sanitize(this.dataset2.find(r => r.ContentPayment?.includes('Số chi quá tạm ứng')) || {}, { ID: 0, TotalMoney: this.diff2 }),
            // ].filter(r => r.Stt !== undefined);
            details = [
                sanitize(this.t2RowI, { ID: this.isCopy ? 0 : (this.t2RowI.ID || 0) }),
                sanitize(this.t2RowII, { ID: this.isCopy ? 0 : (this.t2RowII.ID || 0), TotalMoney: this.totalII, TotalPaymentAmount: this.totalII }),

                // Đối với các dòng chi tiết của mục II
                ...this.t2DetailRows.map(r => sanitize(r, {
                    ID: this.isCopy ? 0 : (r.ID || 0),
                    // Luôn dùng _id của Header II (= 2) để C# khớp x.ParentID == item._id
                    ParentID: this.t2RowII._id
                })),

                sanitize(this.t2RowIII, {
                    ID: this.isCopy ? 0 : (this.t2RowIII.ID || 0),
                    TotalMoney: 0,
                    TotalPaymentAmount: this.totalDiff
                }),

                // Các dòng chênh lệch ở mục III
                sanitize(this.dataset2.find(r => r.ContentPayment?.includes('Tạm ứng chi không hết')) || {},
                    { ID: 0, TotalMoney: 0, TotalPaymentAmount: this.diff1, ParentID: 3 }),
                sanitize(this.dataset2.find(r => r.ContentPayment?.includes('Số chi quá tạm ứng')) || {},
                    { ID: 0, TotalMoney: 0, TotalPaymentAmount: this.diff2, ParentID: 3 }),
            ].filter(r => r.Stt !== undefined);
        }

        const formRawValue = this.validateForm.getRawValue();
        const formatDateLocal = (dateVal: any) => {
            if (!dateVal) return dateVal;
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return dateVal;

            const tzo = -d.getTimezoneOffset();
            const dif = tzo >= 0 ? '+' : '-';
            const pad = (num: number) => {
                const norm = Math.floor(Math.abs(num));
                return (norm < 10 ? '0' : '') + norm;
            };
            const tzoStr = dif + pad(tzo / 60) + ':' + pad(tzo % 60);

            return d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0') + 'T' +
                String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0') + ':' +
                String(d.getSeconds()).padStart(2, '0') + tzoStr;
        };

        if (formRawValue.DateOrder) formRawValue.DateOrder = formatDateLocal(formRawValue.DateOrder);
        if (formRawValue.DeadlinePayment) formRawValue.DeadlinePayment = formatDateLocal(formRawValue.DeadlinePayment);
        if (formRawValue.DatePayment) formRawValue.DatePayment = formatDateLocal(formRawValue.DatePayment);

        const unit = this.validateForm.value.Unit;
        const totalMoney = this.currentTotal;
        this.paymentOrder = {
            ...this.paymentOrder,
            ...formRawValue,
            PaymentOrderDetails: details,
            TotalMoney: totalMoney,
            TotalMoneyText: this.paymentService.readMoney(totalMoney, unit),
            ID: this.isCopy ? 0 : this.paymentOrder.ID,
            ...(this.isCopy ? {
                id: 0,
                ID: 0,
                EmployeeID: this.appUserService.currentUser?.EmployeeID ?? 0,
                Code: '',
                CreatedBy: null,
                CreatedDate: null,
                UpdatedBy: null,
                UpdatedDate: null,
            } : {}),
        } as any;

        this.paymentService.save(this.paymentOrder).subscribe({
            next: (res) => {
                this.isSubmit = false;
                this.uploadFile(res.data.ID);
                this.notification.success(NOTIFICATION_TITLE.success, res.message);
                this.activeModal.close();
            },
            error: (err) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                this.isSubmit = false;
            }
        });
    }

    // ---- File methods ----
    handleChangeFile(e: Event): void {
        const input = e.target as HTMLInputElement;
        if (!input.files?.length) return;
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const id = (this.dataFiles.length > 0 ? Math.max(...this.dataFiles.map((f: any) => f._rowId || 0)) : 0) + i + 1;
            this.dataFiles = [...this.dataFiles, { Id: 0, FileName: file.name, _rowId: id }];
            this.fileUploads.push({ id, file });
        }
        input.value = '';
    }

    deleteFile(file: any): void {
        this.dataFiles = this.dataFiles.filter(f => f !== file);
        const idx = this.fileUploads.findIndex(f => f.id === file._rowId);
        if (idx >= 0) this.fileUploads.splice(idx, 1);
        const fileId = file.Id ?? file.ID ?? 0;
        if (fileId > 0) this.fileDeletes.push({ Id: fileId, IsDeleted: true });
    }

    uploadFile(paymentOrderID: number): void {
        const files = this.fileUploads.map(f => f.file);
        this.paymentService.uploadFile(files, paymentOrderID, JSON.stringify(this.fileDeletes)).subscribe({
            error: (err) => this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                err?.error?.message || `${err.error}\n${err.message}`,
                { nzStyle: { whiteSpace: 'pre-line' } }
            )
        });
    }

    openFilePreview(file: any): void {
        const serverPath: string = file.ServerPath || '';
        const fileName: string = file.FileName || '';
        if (!serverPath || !fileName) return;

        const host = environment.host + 'api/share';
        const fileUrl = (serverPath.replace('\\\\192.168.1.190\\Software', host) + `/${fileName}`).replace(/\\/g, '/');

        const ext = (fileName.split('.').pop() ?? '').toLowerCase();
        const openRaw = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf'].includes(ext);
        if (openRaw) {
            const newWindow = window.open(fileUrl, '_blank');
            if (newWindow) {
                newWindow.onload = () => { newWindow.document.title = fileName; };
            }
        } else {
            const baseUrl = environment.baseHref ? environment.baseHref.replace(/\/$/, '') : '';
            const url = `${baseUrl}/file-preview?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}`;
            window.open(url, '_blank');
        }
    }
}
