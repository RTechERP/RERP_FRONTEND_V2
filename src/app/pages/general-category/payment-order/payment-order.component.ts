import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { FluidModule } from 'primeng/fluid';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PaymentOrderService } from './payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaymentOrderDetailComponent } from './payment-order-detail/payment-order-detail.component';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, OnClickEventArgs, OnEventArgs, OnSelectedRowsChangedEventArgs } from 'angular-slickgrid';
import { PaymentOrder, PaymentOrderDetailField, PaymentOrderField } from './model/payment-order';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Action } from 'rxjs/internal/scheduler/Action';
import Swal from 'sweetalert2';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DepartmentServiceService } from '../../hrm/department/department-service/department-service.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { PaymentOrderTypeService } from './payment-order-type/payment-order-type.service';

import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../shared/pdf/vfs_fonts_custom.js';

(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = {
    Times: {
        normal: 'TIMES.ttf',
        bold: 'TIMESBD.ttf',
        bolditalics: 'TIMESBI.ttf',
        italics: 'TIMESI.ttf',
    },
};

@Component({
    selector: 'app-payment-order',
    imports: [
        CommonModule,
        Menubar,
        NzSplitterModule,
        NzCardModule,
        TabsModule,
        AngularSlickgridModule,
        NzButtonModule, NzFormModule, NzInputModule,
        FormsModule,
        NzSelectModule,
        NzDatePickerModule
    ],
    templateUrl: './payment-order.component.html',
    styleUrl: './payment-order.component.css',
    standalone: true
})
export class PaymentOrderComponent implements OnInit {

    menuBars: MenuItem[] = [];
    param: any = {
        pageNumber: 1,
        pageSize: 50,

        typeOrder: 0,
        paymentOrderTypeID: 0,

        dateStart: new Date(),
        dateEnd: new Date(),

        departmentID: 0,
        employeeID: 0,

        keyword: '',

        isIgnoreHR: -1,
        isApproved: -1,

        isSpecialOrder: 0,
        approvedTBPID: 0,
        step: 0,

        isShowTable: true,

        statuslog: 0,
        isDelete: 0
    };

    departments: any = [];
    employees: any = [];
    isApproveds: any = [];
    typeOrders: any = [];
    paymentOrderTypes: any = [];


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
        private notification: NzNotificationService,
        private permissionService: PermissionService,
        private departmentService: DepartmentServiceService,
        private employeeService: EmployeeService,
        private paymentOrderTypeService: PaymentOrderTypeService,

    ) { }

    ngOnInit(): void {
        this.loadDataCombo();
        this.initMenuBar();
        this.initGrid();
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: PrimeIcons.PLUS,
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onCreate();
                },
            },
            {
                label: 'Sửa',
                icon: PrimeIcons.PENCIL,
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onEdit();
                }
            },

            {
                label: 'Xóa',
                icon: PrimeIcons.TRASH,
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onDelete();
                }
            },

            {
                label: 'Copy',
                icon: PrimeIcons.CLONE,
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    // this.onCopy();
                }
            },

            {
                label: 'In đề nghị',
                icon: PrimeIcons.PRINT,
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onPrint();
                }
            },

            {
                label: 'TBP xác nhận',
                icon: PrimeIcons.CHECK,
                visible: this.permissionService.hasPermission(""),
                items: [
                    {
                        label: 'Duyệt',
                        icon: PrimeIcons.CHECK,
                        command: () => {
                            this.onApprovedTBP(2, {
                                ButtonActionGroup: 'btnTBP', ButtonActionName: 'btnApproveTBP', ButtonActionText: 'Trưởng bộ phận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: PrimeIcons.UNLOCK,
                        command: () => {
                            this.onApprovedTBP(2, {
                                ButtonActionGroup: 'btnTBP', ButtonActionName: 'btnUnApproveTBP', ButtonActionText: 'Trưởng bộ phận',
                            });
                        }
                    }
                ]
            },

            {
                label: 'HR xác nhận',
                icon: PrimeIcons.CHECK,
                visible: this.permissionService.hasPermission(""),
                items: [
                    {
                        label: 'Duyệt hồ sơ',
                        icon: PrimeIcons.CHECK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedHR(1, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnApproveDocumentHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt hồ sơ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedHR(2, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnUnApproveDocumentHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },

                    {
                        label: 'Bổ sung chứng từ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedHR(3, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnHRUpdateDocument', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },
                    {
                        separator: true,
                    },
                    {
                        label: 'TBP duyệt',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedHR(1, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnApproveHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },
                    {
                        label: 'TBP hủy duyệt',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedHR(2, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnUnApproveHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    }
                ]
            },


            {
                label: 'Kế toán xác nhận',
                icon: PrimeIcons.CHECK,
                visible: this.permissionService.hasPermission(""),
                items: [
                    {
                        label: 'Duyệt hồ sơ',
                        icon: PrimeIcons.CHECK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnApproveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Bổ sung chứng từ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(3, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUpdateDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt hồ sơ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(2, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUnApproveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        separator: true,
                    },

                    {
                        label: 'Nhận chứng từ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnReceiveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy nhận chứng từ',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(2, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUnReceiveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        separator: true,
                    },
                    {
                        label: 'TBP duyệt',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTT(1, {
                                ButtonActionGroup: 'btnKTT', ButtonActionName: 'btnApproveKT', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'TBP hủy duyệt',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTT(2, {
                                ButtonActionGroup: 'btnKTT', ButtonActionName: 'btnUnApproveKT', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        separator: true,
                    },
                    {
                        label: 'Đã thanh toán',
                        visible: this.permissionService.hasPermission(""),
                        icon: PrimeIcons.UNLOCK, command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnIsPayment', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy thanh toán',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onApprovedKTTT(2, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUnPayment', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Đính kèm file Bank slip',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                        command: () => {
                            this.onAttachFileBankslip();
                        }

                    },
                    {
                        separator: true,
                    },
                    {
                        label: 'Hợp đồng',
                        icon: PrimeIcons.UNLOCK,
                        visible: this.permissionService.hasPermission(""),
                    }
                ]
            },

            {
                label: 'BGĐ xác nhận',
                icon: PrimeIcons.CHECK,
                items: [
                    {
                        label: 'Duyệt',
                        icon: PrimeIcons.CHECK,
                        command: () => {
                            this.onApprovedBGD(1, {
                                ButtonActionGroup: 'btnBGĐ', ButtonActionName: 'btnApproveBGĐ', ButtonActionText: 'BGĐ xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: PrimeIcons.UNLOCK,
                        command: () => {
                            this.onApprovedBGD(2, {
                                ButtonActionGroup: 'btnBGĐ', ButtonActionName: 'btnUnApproveBGĐ', ButtonActionText: 'BGĐ xác nhận',
                            });
                        }
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
        ]
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
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
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
            // datasetIdPropertyName: 'Id',
            enableRowSelection: true,

            enableFiltering: true,
            enableTreeData: true,
            treeDataOptions: {
                columnId: 'Stt',           // the column where you will have the Tree with collapse/expand icons
                parentPropName: 'parentid',  // the parent/child key relation in your dataset
                // identifierPropName: 'Id',
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
            // datasetIdPropertyName: 'Id',
            enableRowSelection: true,
        }

        this.loadData();

        this.datasetDetails = [];
        this.datasetFiles = [];
        this.datasetFileBankslip = [];
    }

    loadDataCombo() {
        this.departmentService.getDepartments().subscribe({
            next: (response) => {
                this.departments = response.data;
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })

        this.employeeService.getEmployees().subscribe({
            next: (response) => {
                // this.employees = response.data;

                const map = new Map<string, any[]>();
                response.data.forEach((e: any) => {
                    if (!map.has(e.DepartmentName)) {
                        map.set(e.DepartmentName, []);
                    }
                    map.get(e.DepartmentName)!.push(e);
                });

                this.employees = Array.from(map.entries()).map(
                    ([DepartmentName, items]) => ({ DepartmentName, items })
                );

                // console.log(this.employees);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })

        this.paymentOrderTypeService.getAll().subscribe({
            next: (response) => {
                this.paymentOrderTypes = response.data;
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })

        this.isApproveds = [
            { value: 0, text: "Chờ duyệt" },
            { value: 1, text: "Đã duyệt" },
            { value: 2, text: "Hủy duyệt" },
            { value: 3, text: "Bổ sung chứng từ" },
        ]

        this.typeOrders = [
            { value: 1, text: "Đề nghị tạm ứng" },
            { value: 2, text: "Đề nghị thanh toán" },
            { value: 3, text: "Đề nghị thu tiền" },
        ]
    }

    loadData() {
        // let param = {
        //     Keyword: ''
        // };

        // console.log(this.param);
        this.paymentService.get(this.param).subscribe({
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
        // console.log('loadDetail id:', id);
        this.paymentService.getDetail(id).subscribe({
            next: (response) => {
                // console.log('loadDetail response:', response);
                this.datasetDetails = response.data.details;
                this.datasetFiles = response.data.files;
                this.datasetFileBankslip = response.data.fileBankSlips;


                this.datasetDetails = this.datasetDetails.map(item => ({
                    ...item,
                    parentid: item.ParentId == 0 ? null : item.ParentId,
                    id: item.Id,
                    treeLevel: item.ParentId == 0 ? 0 : (item.ParentId == null ? 0 : 1)
                }));

                this.datasetFiles = this.datasetFiles.map(item => ({
                    ...item,
                    id: item.Id
                }));

                this.datasetFileBankslip = this.datasetFileBankslip.map(item => ({
                    ...item,
                    id: item.ID
                }));

                // this.angularGridDetail?.dataView?.setItems(this.datasetDetails, 'Id');
                // this.angularGridFile?.dataView?.setItems(this.datasetFiles, 'Id');
                // this.angularGridFileBankslip?.dataView?.setItems(this.datasetFileBankslip, 'Id');

                console.log('this.datasetDetails:', this.datasetDetails);
                console.log('this.datasetFiles:', this.datasetFiles);
                console.log('this.datasetFileBankslip:', this.datasetFileBankslip);

                // this.datasetDetails = this.datasetDetails.map((x, i) => ({
                //     ...x,
                //     _id: i + 1   // dành riêng cho SlickGrid
                // }));
                // // this.angularGridDetail.slickGrid.setData(this.datasetDetails);

                // this.datasetFiles = this.datasetFiles.map((x, i) => ({
                //     ...x,
                //     _id: i + 1   // dành riêng cho SlickGrid
                // }));
                // // this.angularGridFile.slickGrid.setData(this.datasetFiles);

                // this.datasetFileBankslip = this.datasetFileBankslip.map((x, i) => ({
                //     ...x,
                //     _id: i + 1   // dành riêng cho SlickGrid
                // }));


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

    initModal(paymentOrder: any = new PaymentOrder()) {
        const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            fullscreen: true,
        });

        modalRef.componentInstance.paymentOrder = paymentOrder;
    }

    onCreate() {
        this.initModal();
    }

    onEdit() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = this.angularGrid.dataView.getItem(rowIndex) as PaymentOrder; // data object

            // console.log('Row index:', rowIndex);
            // console.log('Row data:', item);
            this.initModal(item);
        }
    }

    onDelete() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = this.angularGrid.dataView.getItem(rowIndex) as PaymentOrder; // data object

            Swal.fire({
                title: 'Xác nhận duyệt?',
                text: `Bạn có chắc muốn xóa ĐNTT [${item.Code}] đã chọn không?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy',
            }).then((result: any) => {
                if (result.isConfirmed) {
                    const paymentDeleted = {
                        ID: item.ID,
                        IsDelete: true
                    }

                    this.paymentService.save(paymentDeleted).subscribe({
                        next: (response) => {
                            console.log(response);
                            this.loadData();
                        },
                        error: (err) => {
                            this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                        }
                    })
                }
            });
        }
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
        } else if (action == 'btnKTT') {
            this.paymentService.appovedKTT(data).subscribe({
                next: (response) => {
                    this.loadData();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message);
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                }
            })
        } else if (action == 'btnBGĐ') {
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


    async onApprovedTBP(isApproved: number, action: any) {
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
        } else if (isApproved == 3) {
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
                        IsRequestAppendFileHR: isApproved == 3
                    },
                }));

                // console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
        else if (isApproved == 2) {
            const { value: reason }: { value?: string } = await Swal.fire({
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
            if (reason) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    ReasonCancel: reason
                }));

                console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }

    async onApprovedKTTT(isApproved: number, action: any) {
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
            console.log('action.ButtonActionName:', action.ButtonActionName);
            if (action.ButtonActionName == "btnApproveDocument" || action.ButtonActionName == 'btnApproveKT') {
                const result = await Swal.fire({
                    input: 'textarea',
                    inputLabel: 'Kế toán hoạch toán',
                    // inputPlaceholder: 'Nhập lý do bổ sung...',
                    // inputAttributes: {
                    //     'aria-label': 'Vui lòng nhập Lý do bổ sung',
                    // },
                    showCancelButton: true,
                    confirmButtonColor: '#28a745 ',
                    cancelButtonColor: '#dc3545 ',
                    confirmButtonText: 'Duyệt',
                    cancelButtonText: 'Hủy',
                });
                if (result.isConfirmed) {

                    console.log('result:', result);

                    selectedItems = selectedItems.map((x, i) => ({
                        ...x,
                        PaymentOrderLog: {
                            IsApproved: isApproved,
                            // ReasonRequestAppendFileAC: result.value,
                            // IsRequestAppendFileAC: action.ButtonActionName == "btnUpdateDocument"
                        },
                        AccountingNote: result.value
                    }));

                    console.log('D:', selectedItems);
                    this.handleApproved(selectedItems);
                }
            } else {
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
            }
            // if (action.ButtonActionName == "btnUpdateDocument") {
            //     const result = await Swal.fire({
            //         input: 'textarea',
            //         inputLabel: 'Lý do bổ sung',
            //         inputPlaceholder: 'Nhập lý do bổ sung...',
            //         inputAttributes: {
            //             'aria-label': 'Vui lòng nhập Lý do bổ sung',
            //         },
            //         showCancelButton: true,
            //         confirmButtonColor: '#28a745 ',
            //         cancelButtonColor: '#dc3545 ',
            //         confirmButtonText: 'Hủy duyệt',
            //         cancelButtonText: 'Hủy',
            //     });
            //     if (result.isConfirmed) {

            //         selectedItems = selectedItems.map((x, i) => ({
            //             ...x,
            //             PaymentOrderLog: {
            //                 IsApproved: isApproved,
            //                 // ReasonRequestAppendFileAC: result.value,
            //                 // IsRequestAppendFileAC: action.ButtonActionName == "btnUpdateDocument"
            //             },
            //             AccountingNote: result.value
            //         }));

            //         // console.log('hủy duyêt:', selectedItems);
            //         this.handleApproved(selectedItems);
            //     } else 
            // }
        } else if (isApproved == 3) {
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
                        ReasonRequestAppendFileAC: reason,
                        IsRequestAppendFileAC: action.ButtonActionName == "btnUpdateDocument"
                    },
                }));

                // console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
        else if (isApproved == 2) {
            const { value: reason }: { value?: string } = await Swal.fire({
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
            if (reason) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    ReasonCancel: reason
                }));

                console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }


    async onApprovedKTT(isApproved: number, action: any) {
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

            if (action.ButtonActionName == "btnApproveDocument" || action.ButtonActionName == 'btnApproveKT') {
                const result = await Swal.fire({
                    input: 'textarea',
                    inputLabel: 'Kế toán hoạch toán',
                    // inputPlaceholder: 'Nhập lý do bổ sung...',
                    // inputAttributes: {
                    //     'aria-label': 'Vui lòng nhập Lý do bổ sung',
                    // },
                    showCancelButton: true,
                    confirmButtonColor: '#28a745 ',
                    cancelButtonColor: '#dc3545 ',
                    confirmButtonText: 'Duyệt',
                    cancelButtonText: 'Hủy',
                });
                if (result.isConfirmed) {

                    console.log('result:', result);

                    selectedItems = selectedItems.map((x, i) => ({
                        ...x,
                        PaymentOrderLog: {
                            IsApproved: isApproved,
                            // ReasonRequestAppendFileAC: result.value,
                            // IsRequestAppendFileAC: action.ButtonActionName == "btnUpdateDocument"
                        },
                        AccountingNote: result.value
                    }));

                    console.log('D:', selectedItems);
                    this.handleApproved(selectedItems);
                }
            } else {
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
            }

        }
        else if (isApproved == 2) {
            const { value: reason }: { value?: string } = await Swal.fire({
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
            if (reason) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    ReasonCancel: reason
                }));

                console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }

    async onApprovedBGD(isApproved: number, action: any) {
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


        }
        else if (isApproved == 2) {
            const { value: reason }: { value?: string } = await Swal.fire({
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
            if (reason) {

                selectedItems = selectedItems.map((x, i) => ({
                    ...x,
                    ReasonCancel: reason
                }));

                console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }


    async onAttachFileBankslip() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = this.angularGrid.dataView.getItem(rowIndex) as PaymentOrder; // data object

            const { value: files } = await Swal.fire({
                input: 'file',
                inputLabel: 'File Bankslip',
                inputAttributes: {
                    accept: `
                        image/*,
                        application/pdf,
                        text/plain,
                        application/msword,
                        application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                        application/vnd.ms-excel,
                        application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                        application/vnd.ms-powerpoint,
                        application/vnd.openxmlformats-officedocument.presentationml.presentation
                        `,
                    multiple: 'multiple',
                    'aria-label': 'Upload files'
                },
                showCancelButton: true,
                confirmButtonColor: '#28a745 ',
                cancelButtonColor: '#dc3545 ',
                confirmButtonText: 'Lưu',
                cancelButtonText: 'Hủy',
            });

            if (files && files.length > 0) {

                let fileUpdloads: any[] = [];
                // console.log('files:', files);
                // console.log('item.ID.toString():', item.ID.toString());

                this.paymentService.uploadFileBankslip(files, item.ID.toString()).subscribe({
                    next: (response) => {
                        console.log(response);
                        this.loadDetail(item.ID);
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                    }
                })
                // [...files].forEach(file => {
                //     const reader = new FileReader();
                //     reader.onload = (e) => {

                //         let fileUpload = {
                //             title: file.name,
                //             imageUrl: e.target!.result as string,
                //             imageAlt: 'Uploaded image'
                //         }
                //         fileUpdloads.push(fileUpload);
                //     };
                //     reader.readAsDataURL(file);
                //     console.log('reader.readAsDataURL(file):', reader.readAsDataURL(file));
                // });

                // console.log('fileUpdloads:', fileUpdloads);
            }
        }


    }


    onPrint() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (!activeCell) return;

        const rowIndex = activeCell.row;        // index trong grid
        const item = this.angularGrid.dataView.getItem(rowIndex) as PaymentOrder; // data object


    }
}
