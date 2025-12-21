import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormLayoutType, NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { PaymentOrder, PaymentOrderDetail, PaymentOrderDetailField, PaymentOrderField, PaymentOrderFile } from '../model/payment-order';
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { AngularGridInstance, AngularSlickgridModule, Column, Editors, Filters, Formatters, GridOption, Aggregator, OnCellChangeEventArgs, OnEventArgs, GridService } from 'angular-slickgrid';
import { min, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CURRENCY_CONFIGS, PaymentOrderService } from '../payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { ChiTieitSanPhamSaleService } from '../../../old/Sale/chi-tiet-san-pham-sale/chi-tieit-san-pham-sale.service';

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
        NzUploadModule,
        FormsModule,
        AngularSlickgridModule,
    ],
    templateUrl: './payment-order-detail.component.html',
    styleUrl: './payment-order-detail.component.css'
})
export class PaymentOrderDetailComponent implements OnInit, AfterViewInit {

    validateForm !: FormGroup;

    paymentOrderTypes: any[] = [];
    approvedTBPs: any[] = [];
    supplierSales: any[] = [];
    poNCCs: any[] = [];
    registerContracts: any[] = [];
    projects: any[] = [];
    typeBankTransfers: any[] = [];
    units: any[] = [];
    @Input() ponccID: number = 0;
    @Input() paymentOrder = new PaymentOrder();
    paymentOrderField = PaymentOrderField;

    angularGrid!: AngularGridInstance;
    angularGrid2!: AngularGridInstance;
    angularGridFile!: AngularGridInstance;

    gridData: any;
    gridData2: any;
    grdFile: any;

    columnDefinitions: Column[] = [];
    columnFileDefinitions: Column[] = [];

    gridOptions: GridOption = {};
    gridFileOptions: GridOption = {};

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
            PaymentPercentage: 100,
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
            PaymentPercentage: 100,
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


    dataFiles: PaymentOrderFile[] = []; //Để hiển thị lại từ db

    fileUploads: any[] = []; //Lưu những file chọn đẻ upload
    fileDeletes: any[] = []; //Lưu những file xóa

    private destroy$ = new Subject<void>();

    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private paymentService: PaymentOrderService,
    ) { }

    ngOnInit(): void {
        this.initFormGroup();
        this.initDataCombo();
        this.initGrid();
    // Thêm xử lý khi ponccID > 0
    if (this.ponccID > 0) {
        this.loadDataFromPONCC();
    }
    }
    loadDataFromPONCC() {
        this.paymentService.getDataFromPONCC(this.ponccID).subscribe({
            next: (response) => {
                const poNCC = response.data.poNCC;
                const supplierSale = response.data.supplierSale;
                const poNCCDetails = response.data.poNCCDetails;

                // 1. Set giá trị cho form
                this.validateForm.patchValue({
                    SupplierSaleID: poNCC.SupplierSaleID,
                    PONCCID: poNCC.ID,
                    ApprovedTBPID: 178, // Hoặc lấy từ config
                    AccountNumber: poNCC.AccountNumberSupplier,
                    Bank: poNCC.BankSupplier,
                    ReceiverInfo: supplierSale?.NameNCC || '',
                    Unit: poNCC.Unit.toLowerCase(),
                });

                // 2. Tạo dataset từ chi tiết PO NCC
                this.dataset = poNCCDetails.map((item: any, index: number) => ({
                    _id: index + 1,
                    ID: 0,
                    PaymentOrderID: 0,
                    STT: item.STT || `${index + 1}`,
                    ContentPayment: item.ProductName || '',
                    Unit: item.Unit || '',
                    Quantity: item.QtyRequest || 0,
                    UnitPrice: item.UnitPrice || 0,
                    TotalMoney: item.TotalPrice || 0,
                    Note: item.Note || '',
                    ParentID: null,
                    PaymentMethods: 0,
                    PaymentInfor: '',
                    EmployeeID: 0,
                    TotalPaymentAmount: item.TotalPrice || 0,
                    PaymentPercentage: 100,
                    treeLevel: 0, // Thêm treeLevel cho tree data formatter
                }));

                // 3. Refresh grid - đợi grid ready
                setTimeout(() => {
                    if (this.angularGrid && this.angularGrid.dataView) {
                        this.angularGrid.dataView.setItems(this.dataset);
                        this.angularGrid.slickGrid?.invalidate();
                        this.angularGrid.slickGrid?.render();

                        // 4. Cập nhật tổng tiền sau khi grid đã render
                        setTimeout(() => {
                            this.updateTotal(this.getColumnIndex(PaymentOrderDetailField.TotalMoney.field));
                            this.updateTotal(this.getColumnIndex(PaymentOrderDetailField.TotalPaymentAmount.field));
                        }, 50);
                    }
                }, 100);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error?.message)
            }
        });
    }
    getColumnIndex(fieldName: string): number {
        let gridInstance = this.paymentOrder.TypeOrder == 2 ? this.angularGrid2 : this.angularGrid;
        return gridInstance?.slickGrid?.getColumns().findIndex(x => x.id == fieldName) ?? -1;
    }
    ngAfterViewInit(): void {

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
            { ID: 5, Text: 'Chuyển khoản cá nhân' },
            { ID: 1, Text: 'Chuyển khoản RTC' },
            { ID: 2, Text: 'Chuyển khoản MVI' },
            { ID: 3, Text: 'Chuyển khoản APR' },
            { ID: 4, Text: 'Chuyển khoản Yonko' },
            { ID: 6, Text: 'Chuyển khoản R-Tech' },
        ];

        this.units = CURRENCY_CONFIGS;
    }

    initFormGroup() {


        this.validateForm = this.fb.group({
            TypeOrder: this.fb.control(this.paymentOrder.TypeOrder, [Validators.required]),
            PaymentOrderTypeID: this.fb.control(this.paymentOrder.PaymentOrderTypeID, [Validators.required]),
            DateOrder: this.fb.control(this.paymentOrder.DateOrder, [Validators.required]),
            FullName: this.fb.control({ value: this.appUserService.currentUser?.FullName, disabled: true }),
            DepartmentName: this.fb.control({ value: this.appUserService.currentUser?.DepartmentName, disabled: true }),
            ApprovedTBPID: this.fb.control(this.paymentOrder.ApprovedTBPID, [Validators.required]),
            SupplierSaleID: this.fb.control(this.paymentOrder.SupplierSaleID),
            PONCCID: this.fb.control(this.paymentOrder.PONCCID),
            RegisterContractID: this.fb.control(this.paymentOrder.RegisterContractID),
            ProjectID: this.fb.control(this.paymentOrder.ProjectID),
            IsUrgent: this.fb.control(this.paymentOrder.IsUrgent),
            DeadlinePayment: this.fb.control(this.paymentOrder.DeadlinePayment),
            ReasonOrder: this.fb.control(this.paymentOrder.ReasonOrder, [Validators.required]),
            ReceiverInfo: this.fb.control(this.paymentOrder.ReceiverInfo, [Validators.required]),
            TypePayment: this.fb.control(this.paymentOrder.TypePayment, [Validators.required]),
            DatePayment: this.fb.control(this.paymentOrder.DatePayment),
            TypeBankTransfer: this.fb.control(this.paymentOrder.TypeBankTransfer, [Validators.required]),
            AccountNumber: this.fb.control(this.paymentOrder.AccountNumber, [Validators.required]),
            Bank: this.fb.control(this.paymentOrder.Bank, [Validators.required]),
            ContentBankTransfer: this.fb.control(this.paymentOrder.ContentBankTransfer, [Validators.required]),
            Unit: this.fb.control(this.paymentOrder.Unit, [Validators.required]),

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

        //Sự kiện chọn đơn vị
        this.validateForm
            .get(this.paymentOrderField.Unit.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: string) => {

                let gridInstance = this.angularGrid;
                if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

                const columnId = gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalPaymentAmount.field);
                const columnElement = gridInstance.slickGrid?.getFooterRowColumn(columnId);
                this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(parseFloat(columnElement.textContent || ''), value);
            });
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
                    this.updateTotalPaymentAmount(args.cell, args.row);
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
                    decimal: 2,
                    options: { max: 100 }
                },
                onCellChange: (e: Event, args: OnEventArgs) => {
                    this.updateTotalPaymentAmount(args.cell, args.row);
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


        this.columnFileDefinitions = [
            {
                id: 'deletete',
                name: 'ID',
                field: 'ID',
                type: 'number',
                // sortable: true, filterable: true,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                // filter: { model: Filters['compoundDate'] }
                onCellClick: (e: Event, args: OnEventArgs) => {
                    this.deleteFile(e, args)
                }
            },
            {
                id: 'FileName',
                name: 'Tên file',
                field: 'FileName',
                type: 'string',
                // sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                // // filter: { model: Filters['compoundDate'] }
                // onCellClick: (e: Event, args: OnEventArgs) => {
                //     this.deleteItem(e, args)
                // }
            },
        ]
        this.gridFileOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
            },
            gridWidth: '100%',
        }

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

            // showCustomFooter: true,
            // customFooterOptions: {
            //     // leftFooterText: `<p class="fw-bold text-dark">Số tiền bằng chữ: <span id='${this.paymentOrderField.TotalMoneyText.field}'></span></p>`,
            //     hideMetrics: true,
            //     hideTotalItemCount: true,
            //     hideLastUpdateTimestamp: true
            // },

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

        // console.log('init grid"');

        this.dataset = this.dataset.map((x, i) => ({
            ...x,
            _id: i + 1   // dành riêng cho SlickGrid
        }));

        // this.dataset2 = this.mockData(1);
        this.dataset2.forEach(item => {
            item.PaymentPercentage = 100;
        });

        if (this.paymentOrder.ID > 0) {
            this.paymentService.getDetail(this.paymentOrder.ID).subscribe({
                next: (response) => {
                    // console.log(response);

                    if (this.paymentOrder.TypeOrder != 2) {
                        this.dataset = response.data.details;
                        this.dataset = this.dataset.map((x, i) => ({
                            ...x,
                            _id: x.Id   // dành riêng cho SlickGrid
                        }));
                    } else {
                        this.dataset2 = response.data.details;
                        this.dataset2 = this.dataset2.map((x, i) => ({
                            ...x,
                            _id: x.Id   // dành riêng cho SlickGrid
                        }));
                    }

                    this.dataFiles = response.data.files;
                    this.dataFiles = this.dataFiles.map((x, i) => ({
                        ...x,
                        id: i + 1
                    }));
                }
            })
        }
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

    angularGridReadyFile(angularGrid: AngularGridInstance) {
        this.angularGridFile = angularGrid;
        this.grdFile = this.angularGridFile?.slickGrid || {};
    }

    onCellChanged(e: Event, args: any) {
        this.dataset = [...this.angularGrid.dataView.getItems()];
    }

    onCellChanged2(e: Event, args: any) {
        this.dataset = [...this.angularGrid2.dataView.getItems()];
    }

    submitForm() {
        // console.log('this.validateForm.valid', this.validateForm.valid);
        // console.log('this.fileUploads:', this.fileUploads);
        this.uploadFile(14176);
        if (!this.validateForm.valid) {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {

            let gridInstance = this.angularGrid;
            if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

            const columnId = gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalPaymentAmount.field);
            const columnElement = gridInstance.slickGrid?.getFooterRowColumn(columnId);
            this.paymentOrder = {
                ...this.paymentOrder,
                ...this.validateForm.getRawValue(),
                PaymentOrderDetails: gridInstance.dataView.getItems(),
                TotalMoney: parseFloat(columnElement.textContent ?? ''),
            };
            console.log('submit data', this.paymentOrder);

            this.paymentService.save(this.paymentOrder).subscribe({
                next: (response) => {
                    console.log(response);

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
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
            PaymentPercentage: 100,
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

    handleChangeFile(e: Event): void {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {


            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                this.dataFiles.push({
                    ID: i + i,
                    FileName: file.name
                });

                this.fileUploads.push({
                    id: i + 1,
                    file: file
                });
            }

            this.dataFiles = this.dataFiles.map((x, i) => ({
                ...x,
                id: i + 1   // dành riêng cho SlickGrid
            }));
        }

        // console.log('this.fileUploads:', this.fileUploads);
        // console.log('this.dataFiles:', this.dataFiles);
    }

    deleteFile(e: Event, args: OnEventArgs) {

        // let gridInstance = this.angularGridFile;
        // if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const metadata = this.angularGridFile.gridService.getColumnFromEventArguments(args);
        // console.log(metadata);

        const id = metadata.dataContext.id;
        this.angularGridFile.gridService.deleteItemById(id);

        //Xóa file trên list file đã chọn
        const fileRemove = this.fileUploads.findIndex(x => x.id === id);
        if (fileRemove >= 0) {
            this.fileUploads.splice(fileRemove, 1);
        }

        //Xóa file trong DB
        // console.log('metadata.dataContext.ID:', metadata.dataContext.Id);
        if (metadata.dataContext.Id > 0) {
            this.fileDeletes.push(
                {
                    Id: metadata.dataContext.Id,
                    IsDeleted: true
                }
            )
        }

    }


    uploadFile(paymentOrderID: number) {
        let files = this.fileUploads.map(x => x.file);

        // let fileDelete = this.fileDeletes.join(',');

        console.log('uploadFile files:', files);
        console.log('fileDelete:', JSON.stringify(this.fileDeletes));
        console.log('paymentOrderID:', paymentOrderID);
        this.paymentService.uploadFile(files, paymentOrderID, JSON.stringify(this.fileDeletes)).subscribe({
            next: (reponse) => {
                console.log(reponse);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })
    }

    updateTotal(cell: number) {

        if (cell <= 0) return;

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const columnId = gridInstance.slickGrid?.getColumns()[cell].id;

        let total = 0;
        // let i = this.dataset.length;
        let data = gridInstance.dataView.getItems();
        if (this.paymentOrder.TypeOrder != 2) {
            let i = data.length;
            while (i--) {
                total += parseFloat(data[i][columnId]) || 0;
            }
            const columnElement = gridInstance.slickGrid?.getFooterRowColumn(columnId);
            if (columnElement) {
                columnElement.textContent = `${total}`;

                if (columnId == PaymentOrderField.TotalMoney.field) {
                    this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(total, this.validateForm.value.Unit);
                }
            }
        } else {

            //Tính Thành tiền
            const totalMoney1 = data.filter(x => x._id == 1).reduce((total, item) => total + (item.TotalMoney || 0), 0);
            const totalMoney2 = data.filter(x => x.ParentID == 2).reduce((total, item) => total + (item.TotalMoney || 0), 0);
            const totalMoneyDiff = Math.abs(totalMoney1 - totalMoney2);

            const totalMoneyDiff1 = totalMoney1 - totalMoney2;
            const totalMoneyDiff2 = totalMoney2 - totalMoney1;

            //Tính tổng tiền thanh toán
            const totalPaymentAmount1 = data.filter(x => x._id == 1).reduce((total, item) => total + (item.TotalPaymentAmount || 0), 0);
            const totalPaymentAmount2 = data.filter(x => x.ParentID == 2).reduce((total, item) => total + (item.TotalPaymentAmount || 0), 0);
            const totalPaymentAmountDiff = Math.abs(totalPaymentAmount1 - totalPaymentAmount2);

            const totalPaymentAmountDiff1 = totalPaymentAmount1 - totalPaymentAmount2;
            const totalPaymentAmountDiff2 = totalPaymentAmount2 - totalPaymentAmount1;

            //Gán giá trị lên view
            const rowParent2 = data.findIndex(x => x._id === 2);
            const rowParent3 = data.findIndex(x => x._id === 3);
            const rowParent4 = data.findIndex(x => x._id === 4);
            const rowParent5 = data.findIndex(x => x._id === 5);

            data[rowParent2][PaymentOrderDetailField.TotalMoney.field] = totalMoney2;
            data[rowParent3][PaymentOrderDetailField.TotalMoney.field] = totalMoneyDiff;
            data[rowParent4][PaymentOrderDetailField.TotalMoney.field] = Math.max(totalMoneyDiff1, 0);
            data[rowParent5][PaymentOrderDetailField.TotalMoney.field] = Math.max(totalMoneyDiff2, 0);

            data[rowParent2][PaymentOrderDetailField.TotalPaymentAmount.field] = totalPaymentAmount2;
            data[rowParent3][PaymentOrderDetailField.TotalPaymentAmount.field] = totalPaymentAmountDiff;
            data[rowParent4][PaymentOrderDetailField.TotalPaymentAmount.field] = Math.max(totalPaymentAmountDiff1, 0);
            data[rowParent5][PaymentOrderDetailField.TotalPaymentAmount.field] = Math.max(totalPaymentAmountDiff2, 0);

            gridInstance.gridService.updateItems(data);

            const columnTotalMoneyId = gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
            const columnTotalMoneyElement = gridInstance.slickGrid?.getFooterRowColumn(columnTotalMoneyId);
            if (columnTotalMoneyElement) columnTotalMoneyElement.textContent = `${totalMoneyDiff}`;

            const columnTotalPaymentAmountId = gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalPaymentAmount.field)
            const columnTotalPaymentAmountElement = gridInstance.slickGrid?.getFooterRowColumn(columnTotalPaymentAmountId);
            if (columnTotalPaymentAmountElement) columnTotalPaymentAmountElement.textContent = `${totalPaymentAmountDiff}`;

            this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(totalPaymentAmountDiff, this.validateForm.value.Unit);
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

        this.updateTotalPaymentAmount(cell, row);
        this.updateTotal(gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field));
    }

    updateTotalPaymentAmount(cell: number, row: number) {

        let gridInstance = this.angularGrid;
        if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;

        const grid = gridInstance?.slickGrid;
        const dataView = gridInstance?.dataView;

        if (!grid || !dataView) return;

        const columnId = gridInstance.slickGrid?.getColumns()[cell].id;

        // if (columnId != PaymentOrderDetailField.PaymentPercentage.field) return;

        const item = dataView.getItem(row);
        if (!item) return;

        // const quantity = item[PaymentOrderDetailField.Quantity.field] ?? 0;
        const paymentPercentage = item[PaymentOrderDetailField.PaymentPercentage.field] ?? 0;
        const totalMoney = item[PaymentOrderDetailField.TotalMoney.field] ?? 0;
        const totalPaymentAmount = (paymentPercentage * totalMoney) / 100;

        item[PaymentOrderDetailField.TotalPaymentAmount.field] = totalPaymentAmount;
        gridInstance.gridService.updateItem(item);

        this.updateTotal(gridInstance.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalPaymentAmount.field));
    }

}
