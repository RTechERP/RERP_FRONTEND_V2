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
import { PaymentOrder, PaymentOrderDetailField, PaymentOrderField, PaymentOrderFile } from '../model/payment-order';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../../services/app-user.service';
import { CURRENCY_CONFIGS, PaymentOrderService } from '../payment-order.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { Subject, takeUntil } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';

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
        NzIconModule
    ],
    templateUrl: './payment-order-special.component.html',
    styleUrl: './payment-order-special.component.css',
    standalone: true
})
export class PaymentOrderSpecialComponent implements OnInit {
    @Input() paymentOrder = new PaymentOrder();
    private destroy$ = new Subject<void>();

    validateForm !: FormGroup;
    paymentOrderField = PaymentOrderField;

    //Khai báo biến combo
    customers: any[] = [];
    approvedTBPs: any[] = [];
    pokhs: any[] = [];
    billBumbers: any[] = [];
    units: any[] = [];
    userTeamNames: any[] = [];

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
    datasetFile: PaymentOrderFile[] = [];
    fileUploads: any[] = []; //Lưu những file chọn đẻ upload
    fileDeletes: any[] = []; //Lưu những file xóa

    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private paymentService: PaymentOrderService,
    ) { }

    ngOnInit(): void {
        this.initDataCombo();
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
                    this.deleteItem(e, args)
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
                formatter: Formatters.collection,
                params: {
                    collection: [
                        { value: 0, label: 'Tiền mặt' },
                        { value: 1, label: 'Chuyển khoản' }
                    ]
                },
                editor: {
                    model: Editors['singleSelect'],

                    collection: [
                        {
                            value: 0,
                            label: 'Tiền mặt',
                            symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
                        },
                        {
                            value: 1,
                            label: 'Chuyển khoản',
                            symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
                        }
                    ]
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
                id: 'EmployeeID',
                name: 'Team kinh doanh',
                field: 'EmployeeID',
                type: 'string',
                width: 150,
                sortable: true, filterable: false,
                formatter: Formatters.collection,
                params: {
                    collection: this.userTeamNames
                },
                editor: {
                    model: Editors['singleSelect'],
                    collection: this.userTeamNames
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
                    model: Editors['longText'],
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
                    this.addItem(_e, args)
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
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer text-danger' },
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


    initDataCombo() {
        this.paymentService.getDataCombo().subscribe({
            next: (response) => {
                console.log('initDataCombo:', response);
                this.customers = response.data.customers;
                this.approvedTBPs = response.data.approvedTBPs;
                this.pokhs = response.data.pokhs;
                this.billBumbers = response.data.pokhDetails;
                this.userTeamNames = response.data.userTeamNames.map((x: any) => ({
                    value: x.ID.toString(),
                    label: x.Name
                }))


                console.log('this.userTeamNames:', this.userTeamNames);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        });

        this.units = CURRENCY_CONFIGS;
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
            PaymentOrderPOs: this.fb.control(this.paymentOrder.PaymentOrderPOs),
            PaymentOrderBillNumbers: this.fb.control(this.paymentOrder.PaymentOrderBillNumbers),
            ReasonOrder: this.fb.control(this.paymentOrder.ReasonOrder, [Validators.required]),
            Unit: this.fb.control(this.paymentOrder.Unit, [Validators.required]),
        });


        this.validateForm
            .get(this.paymentOrderField.Unit.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: string) => {
                const columnId = this.angularGrid.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
                const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
                this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(parseFloat(columnElement.textContent || ''), value);
            });
    }

    submitForm() {
        // console.log('this.validateForm.valid', this.validateForm.valid);
        // console.log('this.fileUploads:', this.fileUploads);
        // this.uploadFile(14176);
        if (!this.validateForm.valid) {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {

            // let gridInstance = this.angularGrid;
            // if (this.paymentOrder.TypeOrder == 2) gridInstance = this.angularGrid2;


            // console.log('this.validateForm.getRawValue():', this.validateForm.getRawValue());
            // console.log('this.angularGrid.dataView.getItems():', this.angularGrid.dataView.getItems());

            const formData = this.validateForm.getRawValue();
            const detailDatas = this.angularGrid.dataView.getItems();

            let paymentOrderDetails = detailDatas.map((x) => ({
                ...x,
                PaymentOrderDetailUserTeamSales: [
                    {
                        UserTeamSaleID: x.EmployeeID
                    }
                ]
            }));

            const maxLen = Math.max(formData.PaymentOrderPOs.length, formData.PaymentOrderBillNumbers.length);
            let paymentOrderPOs = Array.from({ length: maxLen }, (_, i) => ({
                POKHID: formData.PaymentOrderPOs[i] ?? null,
                BillNumber: formData.PaymentOrderBillNumbers[i] ?? ''
            }));
            paymentOrderPOs = Object.values(paymentOrderPOs);

            const columnId = this.angularGrid.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
            const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
            this.paymentOrder = {
                ...this.paymentOrder,
                ...this.validateForm.getRawValue(),
                PaymentOrderDetails: paymentOrderDetails,
                TotalMoney: parseFloat(columnElement.textContent ?? ''),
                PaymentOrderPOs: paymentOrderPOs,
            };
            // console.log('submit data', this.paymentOrder);

            this.paymentService.save(this.paymentOrder).subscribe({
                next: (response) => {
                    // console.log(response);
                    this.uploadFile(response.data.ID);
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                },
            });
        }
    }

    uploadFile(paymentOrderID: number) {
        let files = this.fileUploads.map(x => x.file);

        // let fileDelete = this.fileDeletes.join(',');

        // console.log('uploadFile files:', files);
        // console.log('fileDelete:', JSON.stringify(this.fileDeletes));
        // console.log('paymentOrderID:', paymentOrderID);
        this.paymentService.uploadFile(files, paymentOrderID, JSON.stringify(this.fileDeletes)).subscribe({
            next: (reponse) => {
                // console.log(reponse);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })
    }


    handleChangeFile(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {


            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                this.datasetFile.push({
                    ID: i + i,
                    FileName: file.name
                });

                this.fileUploads.push({
                    id: i + 1,
                    file: file
                });
            }

            this.datasetFile = this.datasetFile.map((x, i) => ({
                ...x,
                id: i + 1   // dành riêng cho SlickGrid
            }));
        }
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

    addItem(_e: any, args: any) {
        const column = args.column;
        const button = args.button;
        const command = args.command;

        let data = this.angularGrid.dataView.getItems();
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

    deleteItem(e: Event, args: OnEventArgs) {

        const metadata = this.angularGrid.gridService.getColumnFromEventArguments(args);
        // console.log(metadata);
        this.angularGrid.gridService.deleteItemById(metadata.dataContext.id);
    }


    onCellChanged(e: Event, args: any) {
        this.updateTotal(args.cell);
    }


    updateTotal(cell: number) {

        if (cell <= 0) return;
        const columnId = this.angularGrid.slickGrid?.getColumns()[cell].id;

        if (columnId != PaymentOrderField.TotalMoney.field) return;

        let total = 0;
        // let i = this.dataset.length;
        let data = this.angularGrid.dataView.getItems();
        let i = data.length;
        while (i--) {
            total += parseFloat(data[i][columnId]) || 0;
        }
        const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
        if (columnElement) {
            columnElement.textContent = `${total}`;

            this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(total, this.validateForm.value.Unit);
        }
    }
}
