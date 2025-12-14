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
import { AngularGridInstance, AngularSlickgridModule, Column, Editors, Filters, Formatters, GridOption, Aggregator, OnCellChangeEventArgs, OnEventArgs } from 'angular-slickgrid';
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
            ParentID: null,
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
            ParentID: null,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
            _id: 1,
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
            ParentID: null,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
            _id: 2,
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
            _id: 6
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
            ParentID: null,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
            _id: 3,
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
            _id: 4,
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
            _id: 5,
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
                console.log('TypeOrder data:', this.dataset);
                console.log('TypeOrder data2:', this.dataset2);
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

        //Sự kiện chọn hình thức thanh toán
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
                id: 'deletete',
                name: PaymentOrderDetailField.ID.name,
                field: '_id',
                type: PaymentOrderDetailField.ID.type,
                // sortable: true, filterable: true,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                // filter: { model: Filters['compoundDate'] }
                onCellClick: (e: Event, args: OnEventArgs) => {
                    this.deleteItem(e, args)
                }
            },
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: PaymentOrderDetailField.STT.field,
                type: PaymentOrderDetailField.STT.type,
                // sortable: true, filterable: true,
                formatter: Formatters.tree,
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
                },
                onCellChange: (e: Event, args: OnEventArgs) => {
                    this.updateTotalMoney(args.cell, args.row);
                    this.updateTotal(args.cell);
                },
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
                },
                onCellChange: (e: Event, args: OnEventArgs) => {
                    this.updateTotalMoney(args.cell, args.row);
                    this.updateTotal(args.cell);
                },
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
                },
                onCellChange: (e: Event, args: OnEventArgs) => {
                    this.updateTotal(args.cell);
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
            gridWidth: '100%',
            datasetIdPropertyName: '_id',
            enableRowSelection: true,
            enableCellNavigation: true,

            enableFiltering: true,

            autoEdit: true,
            autoCommitEdit: true,
            editable: true,

            showFooterRow: true,
            createFooterRow: true,

            showCustomFooter: true,
            customFooterOptions: {
                leftFooterText: '<p class="fw-bold text-dark">Số tiền bằng chữ: </p>',
                hideMetrics: false,
                hideTotalItemCount: false,
                hideLastUpdateTimestamp: false
            },

            enableTreeData: true,
            treeDataOptions: {
                columnId: 'STT',           // the column where you will have the Tree with collapse/expand icons
                parentPropName: PaymentOrderDetailField.ParentID.field,  // the parent/child key relation in your dataset
                identifierPropName: '_id',
                // roo:0,
                levelPropName: 'treeLevel',  // optionally, you can define the tree level property name, it nothing is provided it will use "__treeLevel"
                indentMarginLeft: 15,        // optionally provide the indent spacer width in pixel, for example if you provide 10 and your tree level is 2 then it will have 20px of indentation
                exportIndentMarginLeft: 4,   // similar to `indentMarginLeft` but represent a space instead of pixels for the Export CSV/Excel
            },
            multiColumnSort: false,


        };

        console.log('init grid"');

        this.dataset = this.dataset.map((x, i) => ({
            ...x,
            _id: i + 1   // dành riêng cho SlickGrid
        }));

        // this.dataset2 = this.mockData(1);
        // this.dataset2 = this.dataset2.map((x, i) => ({
        //     ...x,
        //     _id: i + 1   // dành riêng cho SlickGrid
        // }));
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};

        this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
            console.log('angularGrid onRowCountChanged');
            this.dataset = [...this.angularGrid.dataView.getItems()];
        })

        this.angularGrid.dataView.onRowsChanged.subscribe(() => {
            console.log('angularGrid onRowsChanged');
            this.dataset = [...this.angularGrid.dataView.getItems()];
        })

    }

    angularGridReady2(angularGrid: AngularGridInstance) {
        this.angularGrid2 = angularGrid;
        this.gridData2 = this.angularGrid2?.slickGrid || {};
    }

    onCellChanged(e: Event, args: any) {
        this.dataset = [...this.angularGrid.dataView.getItems()];
    }

    onCellChanged2(e: Event, args: any) {
        this.dataset = [...this.angularGrid2.dataView.getItems()];
    }

    submitForm() {

        console.log('data table:', this.dataset);

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

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        let data = gridInstance.dataView.getItems();
        let _id = data.length <= 0 ? 0 : Math.max(...data.map(x => x._id || 0));
        let stt = data.length <= 0 ? 0 : Math.max(...data.map((x: any) => Number(x.STT) || 0));;
        const parent = gridInstance.dataView.getItemById(2);

        const isParent = parent && parent.__hasChildren;
        if (isParent) {
            const detailPayment = data.filter(x => x.ParentID == 2);
            stt = detailPayment.length <= 0 ? 0 : Math.max(...detailPayment.map((x: any) => Number(x.STT) || 0));
        }

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
            ParentID: isParent ? (parent?._id ?? null) : null,
            PaymentMethods: 0,
            PaymentInfor: '',
            EmployeeID: 0,
            TotalPaymentAmount: 0,
            PaymentPercentage: 0,
            treeLevel: isParent ? (parent?.treeLevel ?? 0) + 1 : 0
        };

        gridInstance.gridService.addItem(newItem, { position: 'bottom' });
    }

    deleteItem(e: Event, args: OnEventArgs) {

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const metadata = gridInstance.gridService.getColumnFromEventArguments(args);
        console.log(metadata);
        gridInstance.gridService.deleteItemById(metadata.dataContext._id);
    }


    onChangeTypeOrder(value: number) {
        // console.log('TypeOrder:', value);
        // if (value == 1) console.log('this.dataset:', this.dataset);
        // if (value == 2) console.log('this.dataset2:', this.dataset2);
    }

    updateTotal(cell: number) {

        if (cell <= 0) return;

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const columnId = gridInstance.slickGrid?.getColumns()[cell].id as number;

        let total = 0;
        // let i = this.dataset.length;
        let data = gridInstance.dataView.getItems();
        let i = data.length;
        while (i--) {
            total += parseFloat(data[i][columnId]) || 0;

        }
        const columnElement = gridInstance.slickGrid?.getFooterRowColumn(columnId);
        if (columnElement) {
            columnElement.textContent = `${total}`;
        }
    }


    updateTotalMoney(cell: number, row: number) {

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const grid = gridInstance?.slickGrid;
        const dataView = gridInstance?.dataView;

        if (!grid || !dataView) return;

        const columnId = gridInstance.slickGrid?.getColumns()[cell].id;

        if (columnId != PaymentOrderDetailField.Quantity.field &&
            columnId != PaymentOrderDetailField.UnitPrice.field
        ) return;

        const item = dataView.getItem(row);
        if (!item) return;

        const quantity = item[PaymentOrderDetailField.Quantity.field] ?? 0;
        const unitPrice = item[PaymentOrderDetailField.UnitPrice.field] ?? 0;

        let totalMoney = quantity * unitPrice;
        item[PaymentOrderDetailField.TotalMoney.field] = totalMoney;
        gridInstance.gridService.updateItem(item);

        const totalMoneyId = gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
        this.updateTotal(totalMoneyId);
    }

}
