import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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
import Swal from 'sweetalert2';

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
    @Input() isCopy = false;
    private destroy$ = new Subject<void>();

    validateForm !: FormGroup;
    paymentOrderField = PaymentOrderField;
    originalTypeIDs: number[] = [];

    //Khai báo biến combo
    customers: any[] = [];
    approverBGDs: any[] = [];
    pokhs: any[] = [];
    allPokhs: any[] = [];
    pokhDetails: any[] = [];
    billNumbers: any[] = [];
    units: any[] = [];
    approverSales: any[] = [];
    // userTeamNames$!: Observable<{ value: any; label: string }[]>;
    userTeamNames: any = [
        {
            "value": 1,
            "label": "Bob"
        },
        {
            "value": 5,
            "label": "Shark"
        },
        {
            "value": 9,
            "label": "VP BẮC NINH"
        },
        {
            "value": 13,
            "label": "Bless"
        },
        {
            "value": 16,
            "label": "HCM"
        },
        {
            "value": 20,
            "label": "MRO Samsung"
        }
    ];


    selectedPOKHs: any[] = [];
    selectedBillNumbers: any[] = [];

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
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('[special] ngOnInit — isCopy:', this.isCopy, '| paymentOrder.ID:', this.paymentOrder.ID);

        this.initDataCombo();
        this.initForm();
        this.initGrid();
        this.initGridFile();

    }

    initGrid() {
        // console.log('this.userTeamNames:', this.userTeamNames);
        this.columnDefinitions = [
            {
                id: 'deletete',
                name: '',
                field: 'id',
                type: PaymentOrderDetailField.ID.type,
                sortable: false, filterable: false,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer text-danger' },
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
                        },

                    ]
                },
                cssClass: 'text-center'
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
                },
                cssClass: 'text-center'
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
                    model: Editors['longText']
                }
            },


            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                width: 150,
                sortable: true, filterable: false,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                editor: {
                    model: Editors['float'],
                    decimal: 2
                },

                cssClass: 'text-end'
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
                        { value: 1, label: 'Tiền mặt' },
                        { value: 2, label: 'Chuyển khoản' }
                    ],
                },
                editor: {
                    model: Editors['singleSelect'],
                    collection: [
                        {
                            value: 1,
                            label: 'Tiền mặt',
                            // symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
                        },
                        {
                            value: 2,
                            label: 'Chuyển khoản',
                            // symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
                        }
                    ],

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
                type: 'number',
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
            enableSorting: false,

            autoEdit: true,
            autoCommitEdit: true,
            editable: true,

            showFooterRow: true,
            createFooterRow: true,

            frozenColumn: 0,
            autoFitColumnsOnFirstLoad: false,

            enableHeaderButton: true,
            headerButton: {
                // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
                onCommand: (_e, args) => {
                    this.onAddItem(_e, args);
                },

            },

            formatterOptions: {
                // dateSeparator: '.',
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ','
            },
            enableHeaderMenu: false,
        };


        const idToLoad = (this.isCopy && (this.paymentOrder as any).CopyFromID > 0)
            ? (this.paymentOrder as any).CopyFromID
            : this.paymentOrder.ID;

        if (idToLoad > 0) {
            this.paymentService.getDetail(idToLoad).subscribe({
                next: (response) => {
                    // console.log(response);

                    this.dataset = (response.data.details ?? []);
                    this.dataset = this.dataset.map((x: any, i: number) => ({
                        ...x,
                        STT: x.Stt ?? x.STT,
                        id: this.isCopy ? i + 1 : x.Id,
                        Id: this.isCopy ? 0 : x.Id,
                        ID: this.isCopy ? 0 : x.ID,
                        PaymentOrderID: this.isCopy ? 0 : x.PaymentOrderID,
                        PaymentMethods: x.PaymentMethods + 1
                    }));

                    if (!this.isCopy) {
                        this.datasetFile = (response.data.files ?? []).map((x: any, i: number) => ({
                            ...x,
                            id: i + 1
                        }));
                    }

                    const po = Array.isArray(response.data.paymentOrder)
                        ? response.data.paymentOrder[0]
                        : response.data.paymentOrder;

                    console.log('[special] getDetail paymentOrder raw:', po);

                    if (po) {
                        const toLD = (v: any) => v ? new Date(String(v).replace('Z', '').replace(/\+\d{2}:\d{2}$/, '')) : null;
                        if (po.DeadlinePayment) this.validateForm.get('DeadlinePayment')?.setValue(toLD(po.DeadlinePayment));
                        if (po.DatePayment) this.validateForm.get('DatePayment')?.setValue(toLD(po.DatePayment));

                        const orderTypeIDsStr = po.OrderTypeIDs;
                        if (orderTypeIDsStr) {
                            const typeIDs = String(orderTypeIDsStr)
                                .split(',')
                                .map((s: string) => parseInt(s.trim(), 10))
                                .filter((id: number) => !isNaN(id) && id > 0);
                            this.originalTypeIDs = this.isCopy ? [] : [...typeIDs];
                            this.validateForm.get('PaymentOrderTypeID')?.setValue(typeIDs);
                        }
                    }

                    this.updateTotalByData(3, this.dataset);
                }
            })
        }
    }

    initGridFile() {
        this.columnDefinitionFiles = [
            {
                id: 'deletete',
                name: 'ID',
                field: 'ID',
                type: 'number',
                width: 50, maxWidth: 50,
                sortable: false, filterable: false,
                formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer text-danger' },
                // filter: { model: Filters['compoundDate'] }
                onCellClick: (e: Event, args: OnEventArgs) => {
                    this.deleteFile(e, args)
                },
                cssClass: 'text-center'
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
            frozenColumn: 0,
            autoFitColumnsOnFirstLoad: false,
            enableHeaderMenu: false,
        }
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};

        // this.updateTotal(3);
    }
    angularGridFileReady(angularGrid: AngularGridInstance) {
        this.angularGridFile = angularGrid;
        this.gridDataFile = angularGrid?.slickGrid || {};
    }


    initDataCombo() {
        this.paymentService.getDataCombo().subscribe({
            next: (response) => {
                // console.log('initDataCombo:', response);
                this.customers = response.data.customers;
                this.approverSales = response.data.approverSales;
                this.pokhs = response.data.pokhs;
                this.allPokhs = response.data.pokhs;
                this.pokhDetails = response.data.pokhDetails;
                this.approverBGDs = response.data.approverBGDs;
                // this.userTeamNames = response.data.userTeamNames.map((x: any) => ({
                //     value: x.ID.toString(),
                //     label: x.Name
                // }))

                // // this.initGrid();
                // this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
                // this.angularGrid.dataView.refresh();
                // console.log('this.userTeamNames:', this.userTeamNames);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        });

        this.units = CURRENCY_CONFIGS;
    }


    initForm() {

        const toLocalDate = (v: any): Date | null => {
            if (!v) return null;
            if (v instanceof Date) return v;
            return new Date(String(v).replace('Z', '').replace(/\+\d{2}:\d{2}$/, ''));
        };
        const dateOrder = toLocalDate(this.paymentOrder.DateOrder) ?? new Date();
        const paymentOrderPOs: number[] = (this.paymentOrder.PaymentOrderPOss || '')
            .split(',')
            .map(x => Number(x.trim()));
        const paymentOrderBillNumbers: string[] = (this.paymentOrder.PaymentOrderBillNumberss || '')
            .split(',')
            .map((x: string) => x.trim())
            .filter(x => x !== '');

        paymentOrderBillNumbers.forEach((item) => {
            this.billNumbers.push({
                POKHID: 0,
                BillNumber: item
            })
        })

        // console.log('paymentOrderBillNumbers:', paymentOrderBillNumbers);

        const typeIDsFromString = (this.paymentOrder.OrderTypeIDs || '')
            .split(',')
            .map((s: string) => parseInt(s.trim(), 10))
            .filter((id: number) => !isNaN(id) && id > 0);

        const resolvedTypeIDs = this.paymentOrder.PaymentOrderTypeIDs?.length
            ? this.paymentOrder.PaymentOrderTypeIDs.filter(x => !x.IsDeleted).map(x => x.PaymentOrderTypeID)
            : typeIDsFromString.length
                ? typeIDsFromString
                : (this.paymentOrder.PaymentOrderTypeID ? [this.paymentOrder.PaymentOrderTypeID] : []);

        this.originalTypeIDs = [...resolvedTypeIDs];
        console.log('originalTypeIDs (loaded):', this.originalTypeIDs);

        this.validateForm = this.fb.group({
            FullName: this.fb.control({ value: this.appUserService.currentUser?.FullName, disabled: true }),
            DepartmentName: this.fb.control({ value: this.appUserService.currentUser?.DepartmentName, disabled: true }),
            IsUrgent: this.fb.control(this.paymentOrder.IsUrgent),
            DeadlinePayment: this.fb.control(toLocalDate(this.paymentOrder.DeadlinePayment)),
            CustomerID: this.fb.control(this.paymentOrder.CustomerID, [Validators.required]),
            ApprovedTBPID: this.fb.control(this.paymentOrder.ApprovedTBPID, [Validators.required]),
            ApprovedBGDID: this.fb.control(this.paymentOrder.ApprovedBGDID, [Validators.required]),
            DateOrder: this.fb.control(dateOrder, [Validators.required]),
            DatePayment: this.fb.control(toLocalDate(this.paymentOrder.DatePayment)),
            PaymentOrderTypeID: this.fb.control(resolvedTypeIDs, [Validators.required]),
            PaymentOrderPOs: this.fb.control(paymentOrderPOs),
            PaymentOrderBillNumbers: this.fb.control(paymentOrderBillNumbers),
            ReasonOrder: this.fb.control(this.paymentOrder.ReasonOrder, [Validators.required]),
            Unit: this.fb.control(this.paymentOrder.Unit?.toLowerCase(), [Validators.required]),
        });

        //Sự kiện tích gấp
        this.validateForm
            .get(this.paymentOrderField.IsUrgent.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: boolean) => {
                this.paymentOrder.IsUrgent = value;
                if (value) this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.setValidators([Validators.required]);
                else this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.clearValidators();

                this.validateForm.get(this.paymentOrderField.DeadlinePayment.field)?.updateValueAndValidity();
            });

        //Sự kiện chọn Khách hàng
        this.validateForm
            .get(this.paymentOrderField.CustomerID.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: number) => {
                console.log('value:', value);

                this.pokhs = value ? this.allPokhs.filter(x => x.CustomerID == value) : this.allPokhs;
                console.log('valueChanges:', value, this.pokhs);
            });

        //Sự kiện chọn pokh
        this.validateForm
            .get("PaymentOrderPOs")
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: any) => {

                // console.log('PaymentOrderPOs value:', value);
                this.selectedPOKHs = value;
                this.selectedBillNumbers = this.validateForm.get('PaymentOrderBillNumbers')?.value;

                // console.log('this.selectedPOKHs:', this.selectedPOKHs);
                // console.log('this.selectedBillNumbers:', this.selectedBillNumbers);

                //Check add thêm vào billNumber
                for (let i = 0; i < this.selectedPOKHs.length; i++) {
                    const pokhID = this.selectedPOKHs[i];
                    const pokh = this.allPokhs.find(x => x.ID == pokhID);
                    if (pokh) {
                        const pokhDetail = this.pokhDetails.filter(x => x.POKHID == pokh.ID);
                        const billBumber = this.billNumbers.find(x => x.POKHID == pokhID);
                        // if (pokhDetail && !billBumber) {
                        //     this.billBumbers.push({
                        //         POKHID: pokhID,
                        //         BillNumber: pokh.PONumber + ' - ' + pokhDetail.BillNumber
                        //     })

                        //     console.log('this.billBumbers:', this.billBumbers);
                        // }

                    }
                }
            });


        //Sự kiện chọn loại tiền (đvt)
        this.validateForm
            .get(this.paymentOrderField.Unit.field)
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value: string) => {
                const columnId = this.angularGrid.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
                const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);

                // this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(parseFloat(columnElement.textContent || ''), value);
                this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(parseFloat((columnElement.textContent ?? '').replace(/,/g, '')), value),
                    this.cdr.detectChanges();
            });

        // this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(this.paymentOrder.TotalMoney?.toString() || '', this.paymentOrder.Unit || '');
        // this.cdr.detectChanges();
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

            console.log('[special] submitForm — isCopy:', this.isCopy, '| paymentOrder.ID:', this.paymentOrder.ID);
            console.log('[special] detailDatas (raw):', detailDatas.map(x => ({ id: x.id, Id: x.Id, ID: x.ID, PaymentOrderID: x.PaymentOrderID })));

            let paymentOrderDetails = detailDatas.map((x) => ({
                ...x,
                Id: this.isCopy ? 0 : (x.Id || 0),
                ID: this.isCopy ? 0 : (x.ID || 0),
                PaymentOrderId: this.isCopy ? 0 : (x.PaymentOrderId || 0),
                PaymentOrderID: this.isCopy ? 0 : (x.PaymentOrderID || 0),
                PaymentMethods: x.PaymentMethods - 1,
                PaymentOrderDetailUserTeamSales: [
                    {
                        UserTeamSaleID: x.EmployeeID
                    }
                ]
            }));

            console.log('[special] paymentOrderDetails (after map):', paymentOrderDetails.map(x => ({ id: x.id, Id: x.Id, ID: x.ID, PaymentOrderID: x.PaymentOrderID })));

            let paymentOrderPOs: any[] = [];


            // console.log('formData.PaymentOrderPOs:', formData.PaymentOrderPOs);
            // console.log('formData.PaymentOrderBillNumbers:', formData.PaymentOrderBillNumbers);

            if ((formData.PaymentOrderPOs && formData.PaymentOrderPOs.length > 0) ||
                (formData.PaymentOrderBillNumbers && formData.PaymentOrderBillNumbers.length > 0)) {

                const pos = formData.PaymentOrderPOs ?? [];
                const bills = formData.PaymentOrderBillNumbers ?? [];

                const maxLen = Math.max(pos.length, bills.length);
                // console.log('maxLen:', maxLen);
                paymentOrderPOs = Array.from({ length: maxLen }, (_, i) => ({
                    POKHID: pos[i] ?? 0,
                    BillNumber: bills[i] ?? ''
                }));
                paymentOrderPOs = Object.values(paymentOrderPOs);
            }


            const columnId = this.angularGrid.slickGrid?.getColumns().findIndex(x => x.id == PaymentOrderDetailField.TotalMoney.field);
            const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
            this.paymentOrder = {
                ...this.paymentOrder,
                ...this.validateForm.getRawValue(),
                ID: this.isCopy ? 0 : this.paymentOrder.ID,
                id: this.isCopy ? 0 : (this.paymentOrder as any).id,
                PaymentOrderTypeID: 0,
                PaymentOrderTypeIDs: this.buildTypeIDsPayload(formData.PaymentOrderTypeID ?? []),
                PaymentOrderDetails: paymentOrderDetails,
                TotalMoney: parseFloat((columnElement.textContent ?? '').replace(/,/g, '')),
                TotalMoneyText: this.paymentService.readMoney(parseFloat((columnElement.textContent ?? '').replace(/,/g, '')), this.validateForm.value.Unit),
                PaymentOrderPOs: paymentOrderPOs,
            };
            console.log('[special] submit — final ID:', this.paymentOrder.ID, '| isCopy:', this.isCopy);
            console.log('[special] submit data full:', this.paymentOrder);

            this.paymentService.save(this.paymentOrder).subscribe({
                next: (response) => {
                    // console.log(response);
                    this.uploadFile(response.data.ID);
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);

                    this.activeModal.close();

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                },
            });
        }
    }

    buildTypeIDsPayload(selectedIDs: number[]): { PaymentOrderTypeID: number; IsDeleted: boolean }[] {
        const selected = selectedIDs.map(id => ({ PaymentOrderTypeID: id, IsDeleted: false }));
        if (this.isCopy) return selected;
        const deleted = this.originalTypeIDs
            .filter(id => !selectedIDs.includes(id))
            .map(id => ({ PaymentOrderTypeID: id, IsDeleted: true }));
        return [...selected, ...deleted];
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

    onAddItem(_e: any, args: any) {
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
            PaymentMethods: null,
            PaymentInfor: '',
            EmployeeID: null,
            TotalPaymentAmount: 0,
            PaymentPercentage: 100,
        };

        this.angularGrid.gridService.addItem(newItem, { position: 'bottom' });
        this.recalcTotal();
    }

    deleteItem(e: Event, args: OnEventArgs) {
        const metadata = this.angularGrid.gridService.getColumnFromEventArguments(args);
        this.angularGrid.gridService.deleteItemById(metadata.dataContext.id);
        this.recalcTotal();
    }


    onCellChanged(e: Event, args: any) {
        this.updateTotal(args.cell);
    }

    private recalcTotal(): void {
        if (!this.angularGrid?.dataView || !this.angularGrid?.slickGrid) return;
        const fieldName = PaymentOrderField.TotalMoney.field;
        const data = this.angularGrid.dataView.getItems();
        const total = data.reduce((sum: number, row: any) => sum + (parseFloat(row[fieldName]) || 0), 0);
        const columnElement = this.angularGrid.slickGrid.getFooterRowColumn(fieldName);
        if (columnElement) {
            columnElement.textContent = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(total);
        }
        this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(total, this.validateForm?.value?.Unit ?? '');
        this.cdr.detectChanges();
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
            // columnElement.textContent = `${total}`;
            columnElement.textContent = `${new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(total)}`;


            this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(total, this.validateForm.value.Unit);
            this.cdr.detectChanges();
        }
    }


    updateTotalByData(cell: number, data: any) {

        if (cell <= 0) return;
        const columnId = this.angularGrid.slickGrid?.getColumns()[cell].id;

        if (columnId != PaymentOrderField.TotalMoney.field) return;

        let total = 0;
        // let i = this.dataset.length;
        // let data = this.angularGrid.dataView.getItems();
        let i = data.length;
        while (i--) {
            total += parseFloat(data[i][columnId]) || 0;
        }
        const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
        if (columnElement) {
            // columnElement.textContent = `${total}`;
            columnElement.textContent = `${new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(total)}`;


            this.paymentOrder.TotalMoneyText = this.paymentService.readMoney(total, this.validateForm.value.Unit);
            this.cdr.detectChanges();
        }
    }

    async onAddBillNumber() {
        const { value: billNumber }: { value?: string } = await Swal.fire({
            input: 'text',
            inputLabel: 'Số hóa đơn',
            // inputPlaceholder: 'Nhập lý do hủy duyệt...',
            // inputAttributes: {
            //     'aria-label': 'Vui lòng nhập Lý do hủy',
            // },
            showCancelButton: true,
            confirmButtonColor: '#28a745 ',
            cancelButtonColor: '#dc3545 ',
            confirmButtonText: 'Thêm',
            cancelButtonText: 'Hủy',
        });
        if (billNumber) {

            this.billNumbers.push({
                POKHID: 0,
                BillNumber: billNumber
            })
        }
    }

}
