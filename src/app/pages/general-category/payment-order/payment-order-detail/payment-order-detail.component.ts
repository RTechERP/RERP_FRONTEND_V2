import { Component, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormLayoutType, NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { PaymentOrder, PaymentOrderDetail, PaymentOrderDetailField, PaymentOrderField } from '../model/payment-order';
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { AngularGridInstance, AngularSlickgridModule, Column, Editors, Filters, Formatters, GridOption } from 'angular-slickgrid';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PaymentOrderService } from '../payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';

@Component({
    selector: 'app-payment-order-detail',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzGridModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzRadioModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        FormsModule,
        AngularSlickgridModule,
    ],
    templateUrl: './payment-order-detail.component.html',
    styleUrl: './payment-order-detail.component.css'
})
export class PaymentOrderDetailComponent implements OnInit {

    validateForm !: FormGroup;

    paymentOrderTypes: any[] = [];
    approvedTBPs: any[] = [];
    supplierSales: any[] = [];
    poNCCs: any[] = [];
    registerContracts: any[] = [];
    projects: any[] = [];
    typeBankTransfers: any[] = [];
    units: any[] = [];

    paymentOrder: PaymentOrder = {} as PaymentOrder;
    paymentOrderField = PaymentOrderField;

    angularGrid!: AngularGridInstance;
    angularGrid2!: AngularGridInstance;

    gridData: any;
    gridData2: any;

    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: '1',
            ContentPayment: '',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 0,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        }
    ];
    dataset2: any[] = [
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: 'I',
            ContentPayment: 'Số tiền tạm ứng',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 0,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: 'II',
            ContentPayment: 'Số tiền thanh toán',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 0,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: '1',
            ContentPayment: '',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 2,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: 'III',
            ContentPayment: 'Chênh lệch',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 0,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: '1',
            ContentPayment: 'Tạm ứng chi không hết (I-II)',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 3,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
        {
            ID: 0,
            PaymentOrderID: 0,
            STT: '2',
            ContentPayment: 'Số chi quá tạm ứng (II-I)',
            Unit: '',
            Quantity: 0,
            UnitPrice: 0,
            TotalMoney: 0,
            Note: '',
            ParentID: 3,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
        },
    ];

    private destroy$ = new Subject<void>();

    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private paymentService: PaymentOrderService,
    ) {
        this.validateForm = this.fb.group({
            TypeOrder: this.fb.control(null, [Validators.required]),
            PaymentOrderTypeID: this.fb.control(null, [Validators.required]),
            DateOrder: this.fb.control(null, [Validators.required]),
            FullName: this.fb.control({ value: appUserService.currentUser?.FullName, disabled: true }),
            DepartmentName: this.fb.control({ value: appUserService.currentUser?.DepartmentName, disabled: true }),
            ApprovedTBPID: this.fb.control(0, [Validators.required]),
            SupplierSaleID: this.fb.control(0),
            PONCCID: this.fb.control(0),
            RegisterContractID: this.fb.control(0),
            ProjectID: this.fb.control(0),
            IsUrgent: this.fb.control(false),
            DeadlinePayment: this.fb.control(null),
            ReasonOrder: this.fb.control(null, [Validators.required]),
            ReceiverInfo: this.fb.control(null, [Validators.required]),
            TypePayment: this.fb.control(1, [Validators.required]),
            DatePayment: this.fb.control(null),
            TypeBankTransfer: this.fb.control(1, [Validators.required]),
            AccountNumber: this.fb.control('', [Validators.required]),
            Bank: this.fb.control('', [Validators.required]),
            ContentBankTransfer: this.fb.control('', [Validators.required]),
            Unit: this.fb.control('', [Validators.required]),
        });


        //Sự kiện chọn loại đề nghị
        this.validateForm
            .get(this.paymentOrderField.TypeOrder.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: number) => {
                this.paymentOrder.TypeOrder = value;
                if (value != 2) this.validateForm.get(this.paymentOrderField.DatePayment.field)?.setValidators([Validators.required]);
                else this.validateForm.get(this.paymentOrderField.DatePayment.field)?.clearValidators();

                this.validateForm.get(this.paymentOrderField.DatePayment.field)?.updateValueAndValidity();
                this.onChangeTypeOrder(value);
            });

        //Sự kiện chọn nhà cung cấp
        this.validateForm
            .get(this.paymentOrderField.SupplierSaleID.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: number) => {
                this.poNCCs = this.poNCCs.filter(x => x.SupplierSaleID == value);
            });

        //Sự kiện chọn thanh toán gấp
        this.validateForm
            .get(this.paymentOrderField.IsUrgent.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: boolean) => {
                if (value) this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.setValidators([Validators.required]);
                else this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.clearValidators();

                this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.updateValueAndValidity();
            });

        this.validateForm
            .get(this.paymentOrderField.TypePayment.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: number) => {
                this.paymentOrder.TypePayment = value;
                if (value == 1) {
                    this.validateForm.get(this.paymentOrderField.TypeBankTransfer.field)?.setValidators([Validators.required]);
                    this.validateForm.get(this.paymentOrderField.AccountNumber.field)?.setValidators([Validators.required]);
                    this.validateForm.get(this.paymentOrderField.Bank.field)?.setValidators([Validators.required]);
                    this.validateForm.get(this.paymentOrderField.ContentBankTransfer.field)?.setValidators([Validators.required]);
                }
                else {
                    this.validateForm.get(this.paymentOrderField.TypeBankTransfer.field)?.clearValidators();
                    this.validateForm.get(this.paymentOrderField.AccountNumber.field)?.clearValidators();
                    this.validateForm.get(this.paymentOrderField.Bank.field)?.clearValidators();
                    this.validateForm.get(this.paymentOrderField.ContentBankTransfer.field)?.clearValidators();
                }

                this.validateForm.get(this.paymentOrderField.TypeBankTransfer.field)?.updateValueAndValidity();
                this.validateForm.get(this.paymentOrderField.AccountNumber.field)?.updateValueAndValidity();
                this.validateForm.get(this.paymentOrderField.Bank.field)?.updateValueAndValidity();
                this.validateForm.get(this.paymentOrderField.ContentBankTransfer.field)?.updateValueAndValidity();
                this.onChangeTypeOrder(value);
            });

    }

    ngOnInit(): void {
        this.initGrid();
        this.initDataCombo();
    }

    initDataCombo() {
        this.paymentService.getDataCombo().subscribe({
            next: (response) => {
                console.log(response);
                this.paymentOrderTypes = response.data.paymentOrderTypes;
                this.approvedTBPs = response.data.approvedTBPs;
                this.supplierSales = response.data.supplierSales;
                this.poNCCs = response.data.poNCCs;
                this.registerContracts = response.data.registerContracts;
                this.projects = response.data.projects;
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        });

        this.typeBankTransfers = [
            { ID: 6, Text: 'Chuyển khoản cá nhân' },
            { ID: 1, Text: 'Chuyển khoản RTC' },
            { ID: 2, Text: 'Chuyển khoản MVI' },
            { ID: 3, Text: 'Chuyển khoản APR' },
            { ID: 4, Text: 'Chuyển khoản Yonko' },
            { ID: 5, Text: 'Chuyển khoản R-Tech' },
        ];

        this.units = [
            { ID: 'vnd', Text: 'VND' },
            { ID: 'usd', Text: 'USD' },
            { ID: 'eur', Text: 'EURO' },
            { ID: 'jpy', Text: 'JPY' },
            { ID: 'sgd', Text: 'SGD' },
            { ID: 'cny', Text: 'CNY' },
            { ID: 'inr', Text: 'INR' },
        ]
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: PaymentOrderDetailField.STT.field,
                type: PaymentOrderDetailField.STT.type,
                // sortable: true, filterable: true,
                // formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                // filter: { model: Filters['compoundDate'] }
                editor: {
                    model: Editors['text']
                }

            },
            {
                id: PaymentOrderDetailField.ContentPayment.field,
                name: PaymentOrderDetailField.ContentPayment.name,
                field: PaymentOrderDetailField.ContentPayment.field,
                type: PaymentOrderDetailField.ContentPayment.type,
                // sortable: true, filterable: true,
                // formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                // filter: { model: Filters['compoundDate'] }
                editor: {
                    model: Editors['text']
                }
            },
            {
                id: PaymentOrderDetailField.Unit.field,
                name: PaymentOrderDetailField.Unit.name,
                field: PaymentOrderDetailField.Unit.field,
                type: PaymentOrderDetailField.Unit.type,
                // sortable: true, filterable: true,
                // filter: { model: Filters['compoundInputNumber'] }
                editor: {
                    model: Editors['text']
                }
            },
            {
                id: PaymentOrderDetailField.Quantity.field,
                name: PaymentOrderDetailField.Quantity.name,
                field: PaymentOrderDetailField.Quantity.field,
                type: PaymentOrderDetailField.Quantity.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['float'],
                    decimal: 2
                }
            },
            {
                id: PaymentOrderDetailField.UnitPrice.field,
                name: PaymentOrderDetailField.UnitPrice.name,
                field: PaymentOrderDetailField.UnitPrice.field,
                type: PaymentOrderDetailField.UnitPrice.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['float'],
                    decimal: 2
                }
            },
            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: PaymentOrderDetailField.TotalMoney.name,
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['float'],
                    decimal: 2
                }
            },

            {
                id: PaymentOrderDetailField.PaymentPercentage.field,
                name: PaymentOrderDetailField.PaymentPercentage.name,
                field: PaymentOrderDetailField.PaymentPercentage.field,
                type: PaymentOrderDetailField.PaymentPercentage.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['float'],
                    decimal: 2
                }
            },

            {
                id: PaymentOrderDetailField.TotalPaymentAmount.field,
                name: PaymentOrderDetailField.TotalPaymentAmount.name,
                field: PaymentOrderDetailField.TotalPaymentAmount.field,
                type: PaymentOrderDetailField.TotalPaymentAmount.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['float'],
                    decimal: 2
                }
            },
            {
                id: PaymentOrderDetailField.Note.field,
                name: PaymentOrderDetailField.Note.name,
                field: PaymentOrderDetailField.Note.field,
                type: PaymentOrderDetailField.Note.type,
                // sortable: true, filterable: true,
                // customTooltip: {
                //     useRegularTooltip: true,
                //     useRegularTooltipFromCellTextOnly: true,
                // },
                // filter: { model: Filters['compoundInputText'] }
                editor: {
                    model: Editors['longText']
                }
            },

        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
            },
            // enableFiltering: true,
            gridWidth: '100%',
            // rowHeight: 50,
            datasetIdPropertyName: '_id',
            enableRowSelection: true,
            enableCellNavigation: true,
            autoCommitEdit: true,
            editable: true,
        };

        this.dataset = this.dataset.map((x, i) => ({
            ...x,
            _id: i + 1   // dành riêng cho SlickGrid
        }));

        // this.dataset2 = this.mockData(1);
        this.dataset2 = this.dataset2.map((x, i) => ({
            ...x,
            _id: i + 1   // dành riêng cho SlickGrid
        }));
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
    }

    angularGridReady2(angularGrid: AngularGridInstance) {
        this.angularGrid2 = angularGrid;
        this.gridData2 = this.angularGrid2?.slickGrid || {};
    }

    submitForm() {

        // console.log('data table:', this.dataset);

        if (this.validateForm.valid) {
            console.log('submit data', this.validateForm.value);
        } else {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }

    }

    addItem() {
        if (this.paymentOrder.TypeOrder != 2) {
            let stt = Math.max(...this.dataset.map(x => Number(x.STT) || 0));
            let _id = Math.max(...this.dataset.map(x => x._id || 0));

            const newItem = {
                _id: _id + 1,
                ID: 0,
                PaymentOrderID: 0,
                STT: `${stt + 1}`,
                ContentPayment: '',
                Unit: '',
                Quantity: 0,
                UnitPrice: 0,
                TotalMoney: 0,
                Note: '',
                ParentID: 0,
                PaymentMethods: 0,
                PaymentInfor: '',
                EmployeeID: 0,
                TotalPaymentAmount: 0,
                PaymentPercentage: 0,
            };

            this.angularGrid.gridService.addItem(newItem);
        }
        else {
            const detailPayment = this.dataset2.filter(x => x.ParentID == 2);
            let stt = Math.max(...detailPayment.map(x => Number(x.STT) || 0));
            let _id = Math.max(...detailPayment.map(x => x._id || 0));

            const newItem = {
                _id: _id + 1,
                ID: 0,
                PaymentOrderID: 0,
                STT: `${stt + 1}`,
                ContentPayment: '',
                Unit: '',
                Quantity: 0,
                UnitPrice: 0,
                TotalMoney: 0,
                Note: '',
                ParentID: 2,
                PaymentMethods: 0,
                PaymentInfor: '',
                EmployeeID: 0,
                TotalPaymentAmount: 0,
                PaymentPercentage: 0,
            };

            this.angularGrid2.gridService.addItem(newItem);
        };

    }


    onChangeTypeOrder(value: number) {
        // console.log('TypeOrder:', value);
        // if (value == 1) console.log('this.dataset:', this.dataset);
        // if (value == 2) console.log('this.dataset2:', this.dataset2);
    }
}
