import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { TabsModule } from 'primeng/tabs';
import { PaymentOrderService } from './payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaymentOrderDetailComponent } from './payment-order-detail/payment-order-detail.component';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, OnClickEventArgs, OnEventArgs, OnSelectedRowsChangedEventArgs } from 'angular-slickgrid';
import { PaymentOrderDetailField, PaymentOrderField } from './model/payment-order';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Action } from 'rxjs/internal/scheduler/Action';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-payment-order',
    imports: [
        CommonModule,
        Menubar,
        NzSplitterModule,
        NzCardModule,
        TabsModule,
        AngularSlickgridModule
    ],
    templateUrl: './payment-order.component.html',
    styleUrl: './payment-order.component.css',
    standalone: true
})
export class PaymentOrderComponent implements OnInit {

    menuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: PrimeIcons.PLUS,
            command: () => {
                this.onCreate();
            }
        },
        {
            label: 'Sửa',
            icon: PrimeIcons.PENCIL,
            command: () => {
                this.onEdit();
            }
        },

        {
            label: 'Xóa',
            icon: PrimeIcons.TRASH,
            command: () => {
                this.onDelete();
            }
        },

        {
            label: 'Copy',
            icon: PrimeIcons.CLONE,
            command: () => {
                // this.onCopy();
            }
        },

        {
            label: 'TBP xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt',
                    icon: PrimeIcons.CHECK,
                    command: () => {
                        // this.onApprovedTBP(1);
                    }
                },
                {
                    label: 'Hủy duyệt',
                    icon: PrimeIcons.UNLOCK,
                    command: () => {
                        // this.onApprovedTBP(2);
                    }
                }
            ]
        },

        {
            label: 'HR xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt hồ sơ',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Hủy duyệt hồ sơ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Bổ sung chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },


        {
            label: 'Kế toán xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt hồ sơ',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Bổ sung chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy duyệt hồ sơ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Nhận chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy nhận chứng từ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'TBP duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Đã thanh toán',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy thanh toán',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Đính kèm file Bank slip',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hợp đồng',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },

        {
            label: 'BGĐ xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Duyệt đặc biệt (ko cần check những bước trước)',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },

        {
            label: 'Cây thư mục',
            icon: PrimeIcons.FOLDER
        },
        {
            label: 'Xuất excel',
            icon: PrimeIcons.FOLDER
        }
    ];

    angularGrid!: AngularGridInstance;
    angularGridDetail!: AngularGridInstance;
    angularGridFile!: AngularGridInstance;
    angularGridFileBankslip!: AngularGridInstance;

    gridData: any;
    gridDetail: any;
    gridFile: any;
    gridFileBankslip: any;

    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};

    columnDefinitionDetails: Column[] = [];
    gridOptionDetails: GridOption = {};

    columnDefinitionFiles: Column[] = [];
    gridOptionFiles: GridOption = {};

    dataset: any[] = [];
    datasetDetails: any[] = [];
    datasetFiles: any[] = [];
    datasetFileBankslip: any[] = [];

    constructor(
        private modalService: NgbModal,
        private paymentService: PaymentOrderService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initGrid();
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: PaymentOrderField.RowNum.field,
                name: PaymentOrderField.RowNum.name,
                field: PaymentOrderField.RowNum.field,
                type: PaymentOrderField.RowNum.type,
                width: 80,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: PaymentOrderField.IsUrgent.field,
                name: PaymentOrderField.IsUrgent.name,
                field: PaymentOrderField.IsUrgent.field,
                type: PaymentOrderField.IsUrgent.type,
                sortable: true, filterable: true,
                width: 80,
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: PaymentOrderField.DateOrder.field,
                name: PaymentOrderField.DateOrder.name,
                field: PaymentOrderField.DateOrder.field,
                type: PaymentOrderField.DateOrder.type,
                sortable: true, filterable: true,
                width: 100,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: PaymentOrderField.DatePayment.field,
                name: PaymentOrderField.DatePayment.name,
                field: PaymentOrderField.DatePayment.field,
                type: PaymentOrderField.DatePayment.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY HH:mm' },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: PaymentOrderField.Code.field,
                name: PaymentOrderField.Code.name,
                field: PaymentOrderField.Code.field,
                type: PaymentOrderField.Code.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.FullName.field,
                name: PaymentOrderField.FullName.name,
                field: PaymentOrderField.FullName.field,
                type: PaymentOrderField.FullName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DepartmentName.field,
                name: PaymentOrderField.DepartmentName.name,
                field: PaymentOrderField.DepartmentName.field,
                type: PaymentOrderField.DepartmentName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.TypeOrderText.field,
                name: 'Phân loại chính',
                field: PaymentOrderField.TypeOrderText.field,
                type: PaymentOrderField.TypeOrderText.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.TypeName.field,
                name: 'Nội dung chính của đề nghị',
                field: PaymentOrderField.TypeName.field,
                type: PaymentOrderField.TypeName.type,
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.ReasonOrder.field,
                name: 'Lý do thanh toán',
                field: PaymentOrderField.ReasonOrder.field,
                type: PaymentOrderField.ReasonOrder.type,
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.IsBill.field,
                name: 'Có hóa đơn',
                field: PaymentOrderField.IsBill.field,
                type: PaymentOrderField.IsBill.type,
                sortable: true, filterable: true,
                width: 80,
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.StartLocation.field,
                name: 'Điểm đi',
                field: PaymentOrderField.StartLocation.field,
                type: PaymentOrderField.StartLocation.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.EndLocation.field,
                name: 'Điểm đến',
                field: PaymentOrderField.EndLocation.field,
                type: PaymentOrderField.EndLocation.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderField.TotalMoney.field,
                type: PaymentOrderField.TotalMoney.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.currency,
                filter: { model: Filters['compoundInputNumber'] },
            },

            {
                id: PaymentOrderField.TotalPayment.field,
                name: 'Số tiền thanh toán',
                field: PaymentOrderField.TotalPayment.field,
                type: PaymentOrderField.TotalPayment.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.currency,
                filter: { model: Filters['compoundInputNumber'] },
            },

            {
                id: PaymentOrderField.TotalPaymentActual.field,
                name: 'Số tiền thanh toán thực tế',
                field: PaymentOrderField.TotalPaymentActual.field,
                type: PaymentOrderField.TotalPaymentActual.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.currency,
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: PaymentOrderField.Unit.field,
                name: 'ĐVT',
                field: PaymentOrderField.Unit.field,
                type: PaymentOrderField.Unit.type,
                sortable: true, filterable: true,
                width: 80,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.TypeBankTransferText.field,
                name: 'Hình thức thanh toán',
                field: PaymentOrderField.TypeBankTransferText.field,
                type: PaymentOrderField.TypeBankTransferText.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.ContentBankTransfer.field,
                name: 'Nội dung chuyển khoản',
                field: PaymentOrderField.ContentBankTransfer.field,
                type: PaymentOrderField.ContentBankTransfer.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.ProjectFullName.field,
                name: 'Dự án',
                field: PaymentOrderField.ProjectFullName.field,
                type: PaymentOrderField.ProjectFullName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.StepName.field,
                name: 'Tình trạng phiếu',
                field: PaymentOrderField.StepName.field,
                type: PaymentOrderField.StepName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.StatusBankSlip.field,
                name: 'Trạng thái Bank Slip',
                field: PaymentOrderField.StatusBankSlip.field,
                type: PaymentOrderField.StatusBankSlip.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.ContentLog.field,
                name: 'Lịch sử duyệt / hủy duyệt',
                field: PaymentOrderField.ContentLog.field,
                type: PaymentOrderField.ContentLog.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.ReasonCancel.field,
                name: 'Lý do hủy duyệt',
                field: PaymentOrderField.ReasonCancel.field,
                type: PaymentOrderField.ReasonCancel.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.Note.field,
                name: 'Ghi chú / Chứng từ kèm theo',
                field: PaymentOrderField.Note.field,
                type: PaymentOrderField.Note.type,
                sortable: true, filterable: true,
                width: 300,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.AccountingNote.field,
                name: 'Ghi chú kế toán',
                field: PaymentOrderField.AccountingNote.field,
                type: PaymentOrderField.AccountingNote.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.SuplierName.field,
                name: 'Nhà cung cấp',
                field: PaymentOrderField.SuplierName.field,
                type: PaymentOrderField.SuplierName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.POCode.field,
                name: 'Số PO',
                field: PaymentOrderField.POCode.field,
                type: PaymentOrderField.POCode.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.DocumentName.field,
                name: 'Số hợp đồng',
                field: PaymentOrderField.DocumentName.field,
                type: PaymentOrderField.DocumentName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.StatusContractText.field,
                name: 'Trạng thái hợp đồng',
                field: PaymentOrderField.StatusContractText.field,
                type: PaymentOrderField.StatusContractText.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.IsIgnoreHR.field,
                name: 'Bỏ qua HR',
                field: PaymentOrderField.IsIgnoreHR.field,
                type: PaymentOrderField.IsIgnoreHR.type,
                sortable: true, filterable: true,
                width: 150,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.ReasonRequestAppendFileAC.field,
                name: 'Lý do KT Y/c bổ sung',
                field: PaymentOrderField.ReasonRequestAppendFileAC.field,
                type: PaymentOrderField.ReasonRequestAppendFileAC.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderField.ReasonRequestAppendFileHR.field,
                name: 'Lý do HR Y/c bổ sung',
                field: PaymentOrderField.ReasonRequestAppendFileHR.field,
                type: PaymentOrderField.ReasonRequestAppendFileHR.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },

            //Nhân viên đk
            {
                id: PaymentOrderField.FullNameEmployee.field,
                name: 'Họ tên',
                field: PaymentOrderField.FullNameEmployee.field,
                type: PaymentOrderField.FullNameEmployee.type,
                sortable: true, filterable: true,
                width: 200,
                columnGroup: 'NHÂN VIÊN ĐĂNG KÝ',
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedEmployee.field,
                name: 'Ngày',
                field: PaymentOrderField.DateApprovedEmployee.field,
                type: PaymentOrderField.DateApprovedEmployee.type,
                sortable: true, filterable: true,
                width: 100,
                columnGroup: 'NHÂN VIÊN ĐĂNG KÝ',
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedEmployee.field,
                name: 'Giờ',
                field: PaymentOrderField.DateApprovedEmployee.field,
                type: PaymentOrderField.DateApprovedEmployee.type,
                sortable: true, filterable: true,
                width: 80,
                columnGroup: 'NHÂN VIÊN ĐĂNG KÝ',
                formatter: Formatters.date, params: { dateFormat: 'HH:mm' },
                filter: { model: Filters['compoundInputText'] },
            },

            //TBP
            {
                id: PaymentOrderField.FullNameTBP.field,
                name: 'Họ tên',
                field: PaymentOrderField.FullNameTBP.field,
                type: PaymentOrderField.FullNameTBP.type,
                sortable: true, filterable: true,
                width: 200,
                columnGroup: 'TRƯỞNG BỘ PHẬN',
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedTBP.field,
                name: 'Ngày',
                field: PaymentOrderField.DateApprovedTBP.field,
                type: PaymentOrderField.DateApprovedTBP.type,
                sortable: true, filterable: true,
                width: 100,
                columnGroup: 'TRƯỞNG BỘ PHẬN',
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedTBP.field,
                name: 'Giờ',
                field: PaymentOrderField.DateApprovedTBP.field,
                type: PaymentOrderField.DateApprovedTBP.type,
                sortable: true, filterable: true,
                width: 80,
                columnGroup: 'TRƯỞNG BỘ PHẬN',
                formatter: Formatters.date, params: { dateFormat: 'HH:mm' },
                filter: { model: Filters['compoundInputText'] },
            },
            //Nhân sự
            {
                id: PaymentOrderField.FullNameHR.field,
                name: 'Họ tên',
                field: PaymentOrderField.FullNameHR.field,
                type: PaymentOrderField.FullNameHR.type,
                sortable: true, filterable: true,
                width: 200,
                columnGroup: 'NHÂN SỰ',
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedHR.field,
                name: 'Ngày',
                field: PaymentOrderField.DateApprovedHR.field,
                type: PaymentOrderField.DateApprovedHR.type,
                sortable: true, filterable: true,
                width: 100,
                columnGroup: 'NHÂN SỰ',
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedHR.field,
                name: 'Giờ',
                field: PaymentOrderField.DateApprovedHR.field,
                type: PaymentOrderField.DateApprovedHR.type,
                sortable: true, filterable: true,
                width: 80,
                columnGroup: 'NHÂN SỰ',
                formatter: Formatters.date, params: { dateFormat: 'HH:mm' },
                filter: { model: Filters['compoundInputText'] },
            },

            //Kế toán
            {
                id: PaymentOrderField.FullNameKT.field,
                name: 'Họ tên',
                field: PaymentOrderField.FullNameKT.field,
                type: PaymentOrderField.FullNameKT.type,
                sortable: true, filterable: true,
                width: 200,
                columnGroup: 'KẾ TOÁN',
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedKT.field,
                name: 'Ngày',
                field: PaymentOrderField.DateApprovedKT.field,
                type: PaymentOrderField.DateApprovedKT.type,
                sortable: true, filterable: true,
                width: 100,
                columnGroup: 'KẾ TOÁN',
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedKT.field,
                name: 'Giờ',
                field: PaymentOrderField.DateApprovedKT.field,
                type: PaymentOrderField.DateApprovedKT.type,
                sortable: true, filterable: true,
                width: 80,
                columnGroup: 'KẾ TOÁN',
                formatter: Formatters.date, params: { dateFormat: 'HH:mm' },
                filter: { model: Filters['compoundInputText'] },
            },

            //BGĐ
            {
                id: PaymentOrderField.FullNameBGD.field,
                name: 'Họ tên',
                field: PaymentOrderField.FullNameBGD.field,
                type: PaymentOrderField.FullNameBGD.type,
                sortable: true, filterable: true,
                width: 200,
                columnGroup: 'BAN GIÁM ĐỐC',
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedBGD.field,
                name: 'Ngày',
                field: PaymentOrderField.DateApprovedBGD.field,
                type: PaymentOrderField.DateApprovedBGD.type,
                sortable: true, filterable: true,
                width: 100,
                columnGroup: 'BAN GIÁM ĐỐC',
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderField.DateApprovedBGD.field,
                name: 'Giờ',
                field: PaymentOrderField.DateApprovedBGD.field,
                type: PaymentOrderField.DateApprovedBGD.type,
                sortable: true, filterable: true,
                width: 80,
                columnGroup: 'BAN GIÁM ĐỐC',
                formatter: Formatters.date, params: { dateFormat: 'HH:mm' },
                filter: { model: Filters['compoundInputText'] },
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
            rowSelectionOptions: {
                selectActiveRow: false// True (Single Selection), False (Multiple Selections)
            },
            checkboxSelector: {
                // you can toggle these 2 properties to show the "select all" checkbox in different location
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
                applySelectOnAllPages: true, // when clicking "Select All", should we apply it to all pages (defaults to true)
            },
            enableCheckboxSelector: true,

            enableCellNavigation: true,

            enableFiltering: true,

            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,

            frozenColumn: 5,

            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
        };

        this.columnDefinitionDetails = [
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: 'Stt',
                type: PaymentOrderDetailField.STT.type,
                // width: 100,
                sortable: true, filterable: true,
                formatter: Formatters.tree,
                // filter: { model: Filters['compoundInputNumber'] },
            },

            {
                id: PaymentOrderDetailField.ContentPayment.field,
                name: PaymentOrderDetailField.ContentPayment.name,
                field: PaymentOrderDetailField.ContentPayment.field,
                type: PaymentOrderDetailField.ContentPayment.type,
                // width: 300,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.Unit.field,
                name: PaymentOrderDetailField.Unit.name,
                field: PaymentOrderDetailField.Unit.field,
                type: PaymentOrderDetailField.Unit.type,
                // width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.Quantity.field,
                name: PaymentOrderDetailField.Quantity.name,
                field: PaymentOrderDetailField.Quantity.field,
                type: PaymentOrderDetailField.Quantity.type,
                // width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.UnitPrice.field,
                name: PaymentOrderDetailField.UnitPrice.name,
                field: PaymentOrderDetailField.UnitPrice.field,
                type: PaymentOrderDetailField.UnitPrice.type,
                // width: 200,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: PaymentOrderDetailField.TotalMoney.name,
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                // width: 200,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderDetailField.PaymentPercentage.field,
                name: PaymentOrderDetailField.PaymentPercentage.name,
                field: PaymentOrderDetailField.PaymentPercentage.field,
                type: PaymentOrderDetailField.PaymentPercentage.type,
                // width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderDetailField.TotalPaymentAmount.field,
                name: PaymentOrderDetailField.TotalPaymentAmount.name,
                field: PaymentOrderDetailField.TotalPaymentAmount.field,
                type: PaymentOrderDetailField.TotalPaymentAmount.type,
                // width: 200,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderDetailField.Note.field,
                name: PaymentOrderDetailField.Note.name,
                field: PaymentOrderDetailField.Note.field,
                type: PaymentOrderDetailField.Note.type,
                // width: 300,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputText'] },
            },
        ]

        this.gridOptionDetails = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'Id',
            enableRowSelection: true,

            enableFiltering: true,
            enableTreeData: true,
            treeDataOptions: {
                columnId: 'Stt',           // the column where you will have the Tree with collapse/expand icons
                parentPropName: 'ParentId',  // the parent/child key relation in your dataset
                identifierPropName: 'Id',
                // roo:0,
                levelPropName: 'treeLevel',  // optionally, you can define the tree level property name, it nothing is provided it will use "__treeLevel"
                indentMarginLeft: 15,        // optionally provide the indent spacer width in pixel, for example if you provide 10 and your tree level is 2 then it will have 20px of indentation
                exportIndentMarginLeft: 4,   // similar to `indentMarginLeft` but represent a space instead of pixels for the Export CSV/Excel
            },
            multiColumnSort: false,
        }


        this.columnDefinitionFiles = [
            {
                id: 'FileName',
                name: 'File đính kèm',
                field: 'FileName',
                type: 'string',
                // width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                // filter: { model: Filters['compoundInputNumber'] },
            },
        ]

        this.gridOptionFiles = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
            },
            gridWidth: '100%',
            datasetIdPropertyName: '_id',
            enableRowSelection: true,
        }

        this.loadData();

        this.datasetDetails = [];
        this.datasetFiles = [];
        this.datasetFileBankslip = [];
    }


    loadData() {
        let param = {
            Keyword: 'ÐNTU202512150001'
        };
        this.paymentService.get(param).subscribe({
            next: (response) => {
                // console.log(response);
                this.dataset = response.data;

                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    _id: i + 1   // dành riêng cho SlickGrid
                }));
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })
    }

    loadDetail(id: number) {
        this.paymentService.getDetail(id).subscribe({
            next: (response) => {
                // console.log(response);
                this.datasetDetails = response.data.details;
                this.datasetFiles = response.data.files;
                this.datasetFileBankslip = response.data.fileBankSlips;

                this.datasetDetails = this.datasetDetails.map((x, i) => ({
                    ...x,
                    _id: i + 1   // dành riêng cho SlickGrid
                }));
                // this.angularGridDetail.slickGrid.setData(this.datasetDetails);

                this.datasetFiles = this.datasetFiles.map((x, i) => ({
                    ...x,
                    _id: i + 1   // dành riêng cho SlickGrid
                }));
                // this.angularGridFile.slickGrid.setData(this.datasetFiles);

                this.datasetFileBankslip = this.datasetFileBankslip.map((x, i) => ({
                    ...x,
                    _id: i + 1   // dành riêng cho SlickGrid
                }));


                // console.log(this.datasetDetails);
                // this.angularGridFileBankslip.slickGrid.setData(this.datasetFileBankslip);
            }
        })
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
    }

    angularGridDetailReady(angularGrid: AngularGridInstance) {
        this.angularGridDetail = angularGrid;
        this.gridDetail = angularGrid?.slickGrid || {};
    }

    angularGridFileReady(angularGrid: AngularGridInstance) {
        this.angularGridFile = angularGrid;
        this.gridFile = angularGrid?.slickGrid || {};
    }

    angularGridFileBankslipReady(angularGrid: AngularGridInstance) {
        this.angularGridFileBankslip = angularGrid;
        this.gridFileBankslip = angularGrid?.slickGrid || {};
    }

    handleRowSelection(e: Event, args: OnSelectedRowsChangedEventArgs) {
        if (Array.isArray(args.rows) && this.gridData) {

            console.log('multiple row checkbox selected', event, args);

            // const item = args.rows.map((idx: number) => {
            //     const item = this.gridData.getDataItem(idx);
            //     return item;
            // });
        }
    }

    onCellClicked(e: Event, args: OnClickEventArgs) {
        // when clicking on any cell, we will make it the new selected row
        // however, we don't want to interfere with multiple row selection checkbox which is on 1st column cell
        if (args.cell !== 0) {
            // const item = this.gridData.setSelectedRows([args.row]);
            const item = args.grid.getDataItem(args.row)
            // console.log('selected item:', item);
            this.loadDetail(item.ID);
        }
    }

    initModal() {
        const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
    }

    onCreate() {
        this.initModal();
    }

    onEdit() {
        this.initModal();
    }

    onDelete() {

    }


    handleApproved(data: any) {

        const action = data[0].Action.ButtonActionGroup || '';

        if (action == 'btnTBP') {
            this.paymentService.appovedTBP(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        } else if (action == 'btnHR') {
            this.paymentService.appovedHR(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        } else if (action == 'btnKTTT') {
            this.paymentService.appovedKTTT(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        } else if (action == 'btnKT') {
            this.paymentService.appovedKTT(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        } else if (action == 'btnBGD') {
            this.paymentService.appovedBGD(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        }

    }


    async onApprovedTBP(isApproved: number) {
        const grid = this.angularGrid.slickGrid;
        const dataView = this.angularGrid.dataView;

        const rowIndexes = grid.getSelectedRows();

        const action = {
            ButtonActionGroup: 'btnTBP',
            ButtonActionName: 'btnApproveTBP',
            ButtonActionText: 'Trưởng bộ phận',

        }
        let selectedItems = rowIndexes
            .map(i => dataView.getItem(i));

        selectedItems = selectedItems.map((x, i) => ({
            ...x,
            Action: action,
            PaymentOrderLog: {
                IsApproved: isApproved,
            },
            CurrentApproved: x.IsApproved || 0,
            Step: x.Step || 0
        }));

        if (isApproved == 1) {
            Swal.fire({
                title: 'Xác nhận duyệt?',
                text: `Bạn có chắc muốn duyệt ${selectedItems.length} đã chọn không?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Duyệt',
                cancelButtonText: 'Hủy',
            }).then((result: any) => {
                if (result.isConfirmed) {
                    console.log('duyêt:', selectedItems);

                    this.handleApproved(selectedItems);
                }
            });
        } else {
            const { value: reasonUnApprove }: { value?: string } = await Swal.fire({
                input: 'textarea',
                inputLabel: 'Lý do hủy',
                inputPlaceholder: 'Nhập lý do hủy duyệt...',
                inputAttributes: {
                    'aria-label': 'Vui lòng nhập Lý do hủy',
                },
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Hủy duyệt',
                cancelButtonText: 'Hủy',
            });
            if (reasonUnApprove) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    ReasonCancel: reasonUnApprove
                }));

                console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }

    async onApprovedHR(isApproved: number, action: any) {
        const grid = this.angularGrid.slickGrid;
        const dataView = this.angularGrid.dataView;

        const rowIndexes = grid.getSelectedRows();

        // const action = {
        //     ButtonActionGroup: 'btnTBP',
        //     ButtonActionName: 'btnApproveTBP',
        //     ButtonActionText: 'Trưởng bộ phận',

        // }
        let selectedItems = rowIndexes
            .map(i => dataView.getItem(i));

        selectedItems = selectedItems.map((x, i) => ({
            ...x,
            Action: action,
            PaymentOrderLog: {
                IsApproved: isApproved,
            },
            CurrentApproved: x.IsApproved || 0,
            Step: x.Step || 0
        }));

        if (isApproved == 1) {
            Swal.fire({
                title: 'Xác nhận duyệt?',
                text: `Bạn có chắc muốn duyệt ${selectedItems.length} đã chọn không?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Duyệt',
                cancelButtonText: 'Hủy',
            }).then((result: any) => {
                if (result.isConfirmed) {
                    console.log('duyêt:', selectedItems);

                    this.handleApproved(selectedItems);
                }
            });
        } else if (action.ButtonActionName == "btnHRUpdateDocument") {
            const { value: reason }: { value?: string } = await Swal.fire({
                input: 'textarea',
                inputLabel: 'Lý do bổ sung',
                inputPlaceholder: 'Nhập lý do bổ sung...',
                inputAttributes: {
                    'aria-label': 'Vui lòng nhập Lý do bổ sung',
                },
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Hủy duyệt',
                cancelButtonText: 'Hủy',
            });
            if (reason) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    PaymentOrderLog: {
                        IsApproved: isApproved,
                        ReasonRequestAppendFileHR: reason,
                        IsRequestAppendFileHR: action.ButtonActionName == "btnHRUpdateDocument"
                    },
                }));

                // console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }


        else {

        }
    }

    async onApprovedKTTT(isApproved: number) {

    }

    async onApprovedKTT(isApproved: number) {

    }

    async onApprovedBGD(isApproved: number) {

    }
}
