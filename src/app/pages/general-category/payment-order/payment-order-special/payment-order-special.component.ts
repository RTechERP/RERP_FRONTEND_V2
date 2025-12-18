import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { AngularGridInstance, AngularSlickgridModule, Column, Editors, Formatters, GridOption, OnEventArgs } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { PaymentOrder, PaymentOrderDetailField, PaymentOrderField } from '../model/payment-order';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../../services/app-user.service';
import { PaymentOrderService } from '../payment-order.service';

@Component({
    selector: 'app-payment-order-special',
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
    templateUrl: './payment-order-special.component.html',
    styleUrl: './payment-order-special.component.css',
    standalone: true
})
export class PaymentOrderSpecialComponent implements OnInit {
    @Input() paymentOrder = new PaymentOrder();

    validateForm !: FormGroup;
    paymentOrderField = PaymentOrderField;

    //Khai báo biến combo
    customers: any[] = [];
    approvedTBPs: any[] = [];
    pokhs: any[] = [];
    billBumbers: any[] = [];
    units: any[] = [];

    //biến slick-grid
    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    angularGridFile!: AngularGridInstance;
    gridDataFile: any;
    columnDefinitionFiles: Column[] = [];
    gridOptionFiles: GridOption = {};
    datasetFile: any[] = [];


    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private paymentService: PaymentOrderService,
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.initGrid();
        this.initGridFile();
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'deletete',
                name: PaymentOrderDetailField.ID.name,
                field: 'id',
                type: PaymentOrderDetailField.ID.type,
                // sortable: true, filterable: true,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                // filter: { model: Filters['compoundDate'] }
                onCellClick: (e: Event, args: OnEventArgs) => {
                    // this.deleteItem(e, args)
                },
                header: {
                    buttons: [
                        {
                            cssClass: 'fa fa-plus',
                            tooltip: 'Thêm mới',
                            command: 'add'
                        }
                    ]
                }
            },
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: 'STT',
                type: PaymentOrderDetailField.STT.type,
                width: 70,
                sortable: true, filterable: false,
                // formatter: Formatters.tree,
                editor: {
                    model: Editors['text']
                }
            },

            {
                id: PaymentOrderDetailField.ContentPayment.field,
                name: 'Đối tượng nhận COM',
                field: PaymentOrderDetailField.ContentPayment.field,
                type: PaymentOrderDetailField.ContentPayment.type,
                width: 250,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors['text']
                }
            },


            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                width: 150,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors['float'],
                    decimal: 2
                },
            },
            {
                id: PaymentOrderDetailField.PaymentMethods.field,
                name: 'Hình thức thanh toán',
                field: PaymentOrderDetailField.PaymentMethods.field,
                type: PaymentOrderDetailField.PaymentMethods.type,
                width: 100,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors[''],
                    decimal: 2
                },
            },
            {
                id: PaymentOrderDetailField.PaymentInfor.field,
                name: 'Thông tin thanh toán',
                field: PaymentOrderDetailField.PaymentInfor.field,
                type: PaymentOrderDetailField.PaymentInfor.type,
                width: 150,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors['text'],
                },
            },
            {
                id: 'UserTeamName',
                name: 'Team kinh doanh',
                field: 'UserTeamName',
                type: 'string',
                width: 150,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors['select'],
                },
            },
            {
                id: PaymentOrderDetailField.Note.field,
                name: 'Ghi chú / Chứng từ kèm theo',
                field: PaymentOrderDetailField.Note.field,
                type: PaymentOrderDetailField.Note.type,
                width: 300,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                editor: {
                    model: Editors['text'],
                },
            },

        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
            },
            gridWidth: '100%',
            enableRowSelection: true,
            enableCellNavigation: true,

            enableFiltering: false,

            autoEdit: true,
            autoCommitEdit: true,
            editable: true,

            showFooterRow: true,
            createFooterRow: true,

            enableHeaderButton: true,
            headerButton: {
                // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
                onCommand: (_e, args) => {
                    this.handleOnCommand(_e, args)
                },

            },
        };
    }

    initGridFile() {
        this.columnDefinitionFiles = [
            {
                id: 'deletete',
                name: 'ID',
                field: 'ID',
                type: 'number',
                // sortable: true, filterable: true,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                // filter: { model: Filters['compoundDate'] }
                onCellClick: (e: Event, args: OnEventArgs) => {
                    // this.deleteFile(e, args)
                }
            },
            {
                id: 'FileName',
                name: 'Tên file',
                field: 'FileName',
                type: 'string',

            },
        ]

        this.gridOptionFiles = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
            },
            gridWidth: '100%',
        }
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
    }
    angularGridFileReady(angularGrid: AngularGridInstance) {
        this.angularGridFile = angularGrid;
        this.gridDataFile = angularGrid?.slickGrid || {};
    }


    initForm() {
        this.validateForm = this.fb.group({
            FullName: this.fb.control({ value: this.appUserService.currentUser?.FullName, disabled: true }),
            DepartmentName: this.fb.control({ value: this.appUserService.currentUser?.DepartmentName, disabled: true }),
            IsUrgent: this.fb.control(this.paymentOrder.IsUrgent),
            DeadlinePayment: this.fb.control(this.paymentOrder.DeadlinePayment),
            CustomerID: this.fb.control(this.paymentOrder.CustomerID),
            ApprovedTBPID: this.fb.control(this.paymentOrder.ApprovedTBPID, [Validators.required]),
            ApprovedBGDID: this.fb.control(this.paymentOrder.ApprovedBGDID),
            DateOrder: this.fb.control(this.paymentOrder.DateOrder, [Validators.required]),
            DatePayment: this.fb.control(this.paymentOrder.DatePayment),
            PaymentOrderTypeID: this.fb.control(this.paymentOrder.PaymentOrderTypeID, [Validators.required]),
            POCode: this.fb.control(this.paymentOrder.POCode),
            BillNumbers: this.fb.control(this.paymentOrder.BillNumbers),
            ReasonOrder: this.fb.control(this.paymentOrder.ReasonOrder, [Validators.required]),
            Unit: this.fb.control(this.paymentOrder.Unit, [Validators.required]),
        });
    }

    submitForm() {
        console.log('this.dataset:', this.dataset);
    }


    handleChangeFile(e: Event) {

    }

    handleOnCommand(_e: any, args: any) {
        const column = args.column;
        const button = args.button;
        const command = args.command;

        let data = this.angularGrid.dataView.getItems();
        // let _id = data.length <= 0 ? 0 : Math.max(...data.map(x => x._id || 0));
        // let stt = data.length <= 0 ? 0 : Math.max(...data.map((x: any) => Number(x.STT) || 0));

        // console.log(args);
        const newItem = {
            id: data.length + 1,
            ID: 0,
            PaymentOrderID: 0,
            STT: `${data.length + 1}`,
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
            PaymentPercentage: 100,
        };

        this.angularGrid.gridService.addItem(newItem, { position: 'bottom' });

    }


    addItem() {

    }

    deleteItem() {

    }

    onCellChanged(e: Event, args: any) {
        // this.dataset = [...this.angularGrid.dataView.getItems()];
    }
}
