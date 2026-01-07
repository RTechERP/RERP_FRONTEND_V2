import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FluidModule } from 'primeng/fluid';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { SplitterModule } from 'primeng/splitter';
import { PaymentOrderService } from './payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaymentOrderDetailComponent } from './payment-order-detail/payment-order-detail.component';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column, Filters,
    Formatter,
    Formatters,
    GridOption,
    MultipleSelectOption,
    OnClickEventArgs,
    OnDblClickEventArgs,
    OnEventArgs,
    OnSelectedRowsChangedEventArgs,
    // ExcelExportService,
} from 'angular-slickgrid';
import { PaymentOrder, PaymentOrderDetailField, PaymentOrderField } from './model/payment-order';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import Swal from 'sweetalert2';
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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PaymentOrderSpecialComponent } from './payment-order-special/payment-order-special.component';
import { environment } from '../../../../environments/environment';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { DateTime } from 'luxon';
import { AppUserService } from '../../../services/app-user.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { HttpClient } from '@angular/common/http';
// import { SlickGlobalEditorLock } from 'angular-slickgrid';

// (SlickGlobalEditorLock as any).Logger = {
//     warn: () => { },
//     info: () => { },
//     error: console.error
// };

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
        Fluid, DatePickerModule, Select, InputTextModule, ButtonModule,
        SplitterModule,
        AngularSlickgridModule,
        NzButtonModule, NzFormModule, NzInputModule,
        FormsModule,
        NzSelectModule,
        NzDatePickerModule,
        NzIconModule,
        NzSpinModule,
        NzModalModule,
    ],
    templateUrl: './payment-order.component.html',
    styleUrl: './payment-order.component.css',
    standalone: true
})
export class PaymentOrderComponent implements OnInit {

    menuBars: MenuItem[] = [];
    param: any = {
        pageNumber: 1,
        pageSize: 999999999,

        typeOrder: 0,
        paymentOrderTypeID: 0,

        dateStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        dateEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),

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

    isLoading = false;
    isMobile = window.innerWidth <= 768;
    isShowModal = false;

    activeTab = '0';
    defaultSizeSplit = '100%';

    isAdvandShow = true;

    departments: any = [];
    employees: any = [];
    isApproveds: any = [];
    typeOrders: any = [];
    paymentOrderTypes: any = [];
    steps: any = [];

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

    columnDefinitionFileBankSlips: Column[] = [];
    gridOptionFileBankSlips: GridOption = {};

    dataset: any[] = [];
    datasetDetails: any[] = [];
    datasetFiles: any[] = [];
    datasetFileBankslip: any[] = [];

    //Khai báo biến slick-grid cho ĐNTTĐB
    angularGridSpecial!: AngularGridInstance;
    gridDataSpecial: any;
    columnDefinitionsSpecial: Column[] = [];
    gridOptionsSpecial: GridOption = {};
    datasetSpecial: any[] = [];

    angularGridSpecialDetail!: AngularGridInstance;
    gridDataSpecialDetail: any;
    columnDefinitionsSpecialDetail: Column[] = [];
    gridOptionsSpecialDetail: GridOption = {};
    datasetSpecialDetail: any[] = [];

    dataPrint: any = {};
    excelExportService = new ExcelExportService();
    excelExportServiceSpecial = new ExcelExportService();

    processingExport = false;
    excelBooleanFormatter: Formatter = (_row, _cell, value) => {
        if (value === true) return 'x';
        if (value === false) return '';
        return '';
    };

    isPermisstion: boolean = false;
    isPermisstionDB: boolean = false;

    constructor(
        private modalService: NgbModal,
        private paymentService: PaymentOrderService,
        private notification: NzNotificationService,
        private permissionService: PermissionService,
        private departmentService: DepartmentServiceService,
        private employeeService: EmployeeService,
        private paymentOrderTypeService: PaymentOrderTypeService,
        private appUserService: AppUserService,
        private http: HttpClient

    ) { }

    ngOnInit(): void {
        // console.log('this.isMobile:', this.isMobile);
        this.loadDataCombo();
        this.initMenuBar();

        const permissionCodeTBP = "N57";
        const permissionCodeHR = "N59";
        const permissionCodeTbpHR = "N56";
        const permissionCodeKT = "N55";
        const permissionCodeKTT = "N61";
        const permissionCodeBGD = "N58";
        const permissionCodeSale = "N83";

        this.isPermisstion = (this.appUserService.currentUser?.Permissions.includes(permissionCodeTBP) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeHR) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeTbpHR) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeKT) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeKTT) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeBGD) ||
            this.appUserService.currentUser?.IsAdmin) || false;

        this.isPermisstionDB = (this.appUserService.currentUser?.Permissions.includes(permissionCodeSale) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeKT) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeKTT) ||
            this.appUserService.currentUser?.Permissions.includes(permissionCodeBGD) ||
            this.appUserService.currentUser?.IsAdmin) || false;

        // console.log('this.isPermisstion:', this.isPermisstion);
        if (!this.isPermisstion) {
            this.param.departmentID = this.appUserService.currentUser?.DepartmentID;
            this.param.employeeID = this.appUserService.currentUser?.EmployeeID;
            // console.log('this.param:', this.param);
        } else {
            if (this.appUserService.currentUser?.Permissions.includes(permissionCodeTBP)) {
                this.param.departmentID = this.appUserService.currentUser?.DepartmentID;
                this.param.approvedTBPID = this.appUserService.currentUser?.EmployeeID;
                this.param.step = 1;
            }

            if (this.appUserService.currentUser?.Permissions.includes(permissionCodeHR) ||
                this.appUserService.currentUser?.Permissions.includes(permissionCodeTbpHR) ||
                this.appUserService.currentUser?.Permissions.includes(permissionCodeKT) ||
                this.appUserService.currentUser?.Permissions.includes(permissionCodeKTT) ||
                this.appUserService.currentUser?.Permissions.includes(permissionCodeBGD) ||
                this.appUserService.currentUser?.IsAdmin) {
                this.param.departmentID = 0;
                this.param.approvedTBPID = 0;
                this.param.step = 0;
            }
        }

        this.initGrid();
        this.initGridSpecial();
        this.initGridSpecialDetail();
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onCreate();
                },
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onEdit();
                }
            },

            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onDelete();
                }
            },

            {
                label: 'Copy',
                icon: 'fa-solid fa-clone fa-lg text-primary',
                visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onCopy();
                }
            },

            {
                label: 'TBP xác nhận',
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                visible: this.permissionService.hasPermission("N57"),
                items: [
                    {
                        label: 'Duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => {
                            this.onApprovedTBP(1, {
                                ButtonActionGroup: 'btnTBP', ButtonActionName: 'btnApproveTBP', ButtonActionText: 'Trưởng bộ phận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
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
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                visible: this.permissionService.hasPermission("N59,N56"),
                items: [
                    {
                        label: 'Duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N59"),
                        command: () => {
                            this.onApprovedHR(1, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnApproveDocumentHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N59"),
                        command: () => {
                            this.onApprovedHR(2, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnUnApproveDocumentHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },

                    {
                        label: 'Bổ sung chứng từ',
                        icon: 'fa-solid fa-file-circle-plus fa-lg text-warning',
                        visible: this.permissionService.hasPermission("N59"),
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
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N56"),
                        command: () => {
                            this.onApprovedHR(1, {
                                ButtonActionGroup: 'btnHR', ButtonActionName: 'btnApproveHR', ButtonActionText: 'HR xác nhận',
                            });
                        }
                    },
                    {
                        label: 'TBP hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N56"),
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
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                visible: this.permissionService.hasPermission("N55,N61"),
                items: [
                    {
                        label: 'Duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnApproveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Bổ sung chứng từ',
                        icon: 'fa-solid fa-file-circle-plus fa-lg text-warning',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            this.onApprovedKTTT(3, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUpdateDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt hồ sơ',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N55,N61"),
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
                        label: 'TBP duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N61"),
                        command: () => {
                            this.onApprovedKTT(1, {
                                ButtonActionGroup: 'btnKTT', ButtonActionName: 'btnApproveKT', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'TBP hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N61"),
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
                        label: 'Nhận chứng từ',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnReceiveDocument', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy nhận chứng từ',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N55,N61"),
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
                        label: 'Đã thanh toán',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => {
                            this.onApprovedKTTT(1, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnIsPayment', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy thanh toán',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            this.onApprovedKTTT(2, {
                                ButtonActionGroup: 'btnKTTT', ButtonActionName: 'btnUnPayment', ButtonActionText: 'Kế toán xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Đính kèm file Bank slip',
                        icon: 'fa-solid fa-paperclip fa-lg text-primary',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            this.onAttachFileBankslip();
                        }

                    },
                    {
                        separator: true,
                    },
                    {
                        label: 'Hợp đồng',
                        icon: 'fa-solid fa-file-contract fa-lg text-primary',
                        visible: this.permissionService.hasPermission("N55,N61"),
                        command: () => {
                            window.open(
                                `${environment.baseHref}/register-contract`,
                                '_blank',
                                `width=${window.screen.width},height=${window.screen.height}`
                            );
                        }
                    }
                ]
            },

            {
                label: 'BGĐ xác nhận',
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                visible: this.permissionService.hasPermission("N58"),
                items: [
                    {
                        label: 'Duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => {
                            this.onApprovedBGD(1, {
                                ButtonActionGroup: 'btnBGĐ', ButtonActionName: 'btnApproveBGĐ', ButtonActionText: 'BGĐ xác nhận',
                            });
                        }
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        command: () => {
                            this.onApprovedBGD(2, {
                                ButtonActionGroup: 'btnBGĐ', ButtonActionName: 'btnUnApproveBGĐ', ButtonActionText: 'BGĐ xác nhận',
                            });
                        }
                    },
                    // {
                    //     label: 'Duyệt đặc biệt (ko cần check những bước trước)',
                    //     icon: PrimeIcons.UNLOCK
                    // }
                ]
            },

            {
                label: 'Cây thư mục',
                icon: 'fa-solid fa-folder-open fa-lg text-warning',
                command: () => {
                    let grid = this.angularGrid;
                    if (this.activeTab == '1') grid = this.angularGridSpecial;

                    let activeCell = grid.slickGrid.getActiveCell();
                    if (activeCell) {
                        const rowIndex = activeCell.row;        // index trong grid
                        const item = grid.dataView.getItem(rowIndex); // data object

                        const dateOrder = new Date(item.DateOrder);
                        const year = dateOrder.getFullYear();
                        const month = dateOrder.getMonth() + 1;
                        const day = dateOrder.getDate();
                        const pathPattern = `/năm ${year}/đề nghị thanh toán/tháng ${month}.${year}/${day}.${month}.${year}/${item.Code}`;
                        const url = environment.host + 'api/share/Accountant/2.NỘI BỘ' + pathPattern;
                        // const url = environment.host + 'api/share/Software/Test/UPLOADFILE' + pathPattern;

                        const width = 1000;
                        const height = 700;

                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;

                        window.open(
                            url,
                            '_blank',
                            `width=${width},height=${height},left=${left},top=${top}`
                        );

                    }
                }
            },
            {
                label: 'Xuất excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    const dateStart = DateTime.fromJSDate(this.param.dateStart).toFormat('ddMMyyyy');
                    const dateEnd = DateTime.fromJSDate(this.param.dateEnd).toFormat('ddMMyyyy');
                    const now = DateTime.fromJSDate(new Date()).toFormat('HHmmss');
                    if (this.activeTab == '0') {

                        this.excelExportService.exportToExcel({
                            filename: `TheoDoiChiPhiVP_${dateStart}_${dateEnd}_${now}`,
                            format: 'xlsx'
                        });
                    } else {
                        this.excelExportServiceSpecial.exportToExcel({
                            filename: `TheoDoiChiPhiVPDB_${dateStart}_${dateEnd}_${now}`,
                            format: 'xlsx'
                        });
                    }

                }
            },
            // {
            //     label: 'In',
            //     icon: 'fa-solid fa-print fa-lg text-primary',
            //     command: () => {
            //         // this.onPrint();

            //     }
            // }
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
                // exportColumnWidth:80
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.IsUrgent.field,
                name: PaymentOrderField.IsUrgent.name,
                field: PaymentOrderField.IsUrgent.field,
                type: PaymentOrderField.IsUrgent.type,
                sortable: true, filterable: true,
                width: 80,
                formatter: Formatters.checkmarkMaterial,
                exportCustomFormatter: this.excelBooleanFormatter,
                filter: {
                    collection: [
                        { value: '', label: '' },
                        { value: true, label: 'Thanh toán gấp' },
                        // { value: false, label: 'Không gấp' },
                    ],
                    model: Filters['singleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-center'
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
                cssClass: 'text-center'
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
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.Code.field,
                name: PaymentOrderField.Code.name,
                field: PaymentOrderField.Code.field,
                type: PaymentOrderField.Code.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                // filter: { model: Filters['compoundInputText'] },
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.FullName.field,
                name: PaymentOrderField.FullName.name,
                field: PaymentOrderField.FullName.field,
                type: PaymentOrderField.FullName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.DepartmentName.field,
                name: PaymentOrderField.DepartmentName.name,
                field: PaymentOrderField.DepartmentName.field,
                type: PaymentOrderField.DepartmentName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.TypeOrderText.field,
                name: 'Phân loại chính',
                field: PaymentOrderField.TypeOrderText.field,
                type: PaymentOrderField.TypeOrderText.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.TypeName.field,
                name: 'Nội dung chính của đề nghị',
                field: PaymentOrderField.TypeName.field,
                type: PaymentOrderField.TypeName.type,
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.ReasonOrder.field,
                name: 'Lý do thanh toán',
                field: PaymentOrderField.ReasonOrder.field,
                type: PaymentOrderField.ReasonOrder.type,
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters.icon,
                filter: {
                    // collection: [],
                    model: Filters['compoundInputText'],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderField.TotalMoney.field,
                type: PaymentOrderField.TotalMoney.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                // filter: {
                //     collection: [],
                //     model: Filters['multipleSelect'],
                //     filterOptions: {
                //         autoAdjustDropHeight: true,
                //         filter: true,
                //     } as MultipleSelectOption,
                // },
                cssClass: 'text-end'
            },

            {
                id: PaymentOrderField.TotalPayment.field,
                name: 'Số tiền thanh toán',
                field: PaymentOrderField.TotalPayment.field,
                type: PaymentOrderField.TotalPayment.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                // filter: {
                //     collection: [],
                //     model: Filters['multipleSelect'],
                //     filterOptions: {
                //         autoAdjustDropHeight: true,
                //         filter: true,
                //     } as MultipleSelectOption,
                // },
                cssClass: 'text-end'
            },

            {
                id: PaymentOrderField.TotalPaymentActual.field,
                name: 'Số tiền thanh toán thực tế',
                field: PaymentOrderField.TotalPaymentActual.field,
                type: PaymentOrderField.TotalPaymentActual.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                // filter: {
                //     collection: [],
                //     model: Filters['compoundInputNumber'],
                //     filterOptions: {
                //         autoAdjustDropHeight: true,
                //         filter: true,
                //     } as MultipleSelectOption,
                // },
                cssClass: 'text-end'
            },
            {
                id: PaymentOrderField.StepName.field,
                name: 'Tình trạng phiếu',
                field: PaymentOrderField.StepName.field,
                type: PaymentOrderField.StepName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.Unit.field,
                name: 'ĐVT',
                field: PaymentOrderField.Unit.field,
                type: PaymentOrderField.Unit.type,
                sortable: true, filterable: true,
                width: 80,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-uppercase'
            },
            {
                id: PaymentOrderField.IsIgnoreHR.field,
                name: 'Bỏ qua HR',
                field: PaymentOrderField.IsIgnoreHR.field,
                type: PaymentOrderField.IsIgnoreHR.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                // filter: { model: Filters['compoundInputText'] },
                exportCustomFormatter: this.excelBooleanFormatter,
                filter: {
                    collection: [
                        { value: '', label: '' },
                        { value: true, label: 'Bỏ qua HR' },
                        // { value: false, label: 'Không có' },
                    ],
                    model: Filters['singleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.TypeBankTransferText.field,
                name: 'Hình thức thanh toán',
                field: PaymentOrderField.TypeBankTransferText.field,
                type: PaymentOrderField.TypeBankTransferText.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.ContentBankTransfer.field,
                name: 'Nội dung chuyển khoản',
                field: PaymentOrderField.ContentBankTransfer.field,
                type: PaymentOrderField.ContentBankTransfer.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.SuplierName.field,
                name: 'Nhà cung cấp',
                field: PaymentOrderField.SuplierName.field,
                type: PaymentOrderField.SuplierName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.StatusContractText.field,
                name: 'Trạng thái hợp đồng',
                field: PaymentOrderField.StatusContractText.field,
                type: PaymentOrderField.StatusContractText.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.DocumentName.field,
                name: 'Số hợp đồng',
                field: PaymentOrderField.DocumentName.field,
                type: PaymentOrderField.DocumentName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.ProjectFullName.field,
                name: 'Dự án',
                field: PaymentOrderField.ProjectFullName.field,
                type: PaymentOrderField.ProjectFullName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },



            {
                id: PaymentOrderField.IsBill.field,
                name: 'Có hóa đơn',
                field: PaymentOrderField.IsBill.field,
                type: PaymentOrderField.IsBill.type,
                sortable: true, filterable: true,
                width: 80,
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                exportCustomFormatter: this.excelBooleanFormatter,
                filter: {
                    collection: [
                        { value: '', label: '' },
                        { value: true, label: 'Có hóa đơn' },
                        // { value: false, label: 'Không có' },
                    ],
                    model: Filters['singleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.StartLocation.field,
                name: 'Điểm đi',
                field: PaymentOrderField.StartLocation.field,
                type: PaymentOrderField.StartLocation.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.EndLocation.field,
                name: 'Điểm đến',
                field: PaymentOrderField.EndLocation.field,
                type: PaymentOrderField.EndLocation.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },








            {
                id: PaymentOrderField.StatusBankSlip.field,
                name: 'Trạng thái Bank Slip',
                field: PaymentOrderField.StatusBankSlip.field,
                type: PaymentOrderField.StatusBankSlip.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.ContentLog.field,
                name: 'Lịch sử duyệt / hủy duyệt',
                field: PaymentOrderField.ContentLog.field,
                type: PaymentOrderField.ContentLog.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.ReasonCancel.field,
                name: 'Lý do hủy duyệt',
                field: PaymentOrderField.ReasonCancel.field,
                type: PaymentOrderField.ReasonCancel.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.Note.field,
                name: 'Ghi chú / Chứng từ kèm theo',
                field: PaymentOrderField.Note.field,
                type: PaymentOrderField.Note.type,
                sortable: true, filterable: true,
                width: 300,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.AccountingNote.field,
                name: 'Ghi chú kế toán',
                field: PaymentOrderField.AccountingNote.field,
                type: PaymentOrderField.AccountingNote.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },



            {
                id: PaymentOrderField.POCode.field,
                name: 'Số PO',
                field: PaymentOrderField.POCode.field,
                type: PaymentOrderField.POCode.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },






            {
                id: PaymentOrderField.ReasonRequestAppendFileAC.field,
                name: 'Lý do KT Y/c bổ sung',
                field: PaymentOrderField.ReasonRequestAppendFileAC.field,
                type: PaymentOrderField.ReasonRequestAppendFileAC.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.ReasonRequestAppendFileHR.field,
                name: 'Lý do HR Y/c bổ sung',
                field: PaymentOrderField.ReasonRequestAppendFileHR.field,
                type: PaymentOrderField.ReasonRequestAppendFileHR.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: { model: Filters['compoundInputDate'] },
                cssClass: 'text-center'
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
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
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
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
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
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
            },
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            enableAutoResize: true,
            gridWidth: '100%',
            // gridHeight: 300, // ⚠️ QUAN TRỌNG
            // datasetIdPropertyName: '_id',
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

            frozenColumn: this.isMobile ? 0 : 5,

            createPreHeaderPanel: true,
            showPreHeaderPanel: true,

            showFooterRow: true,
            createFooterRow: true,

            //Config xuất excel
            externalResources: [this.excelExportService],
            enableExcelExport: true,
            excelExportOptions: {
                // filename: `TheoDoiChiPhiVP_${DateTime.fromJSDate(new Date()).toFormat()}`,
                sanitizeDataExport: true,
                exportWithFormatter: true,
                // sheetName: 'Grocery List',
                // columnHeaderStyle: {
                //     font: { color: 'FFFFFFFF' },
                //     fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' },
                // },

                // optionally pass a custom header to the Excel Sheet
                // a lot of the info can be found on Web Archive of Excel-Builder
                // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
                // customExcelHeader: (workbook, sheet) => {
                //     const excelFormat = workbook.getStyleSheet().createFormat({
                //         // every color is prefixed with FF, then regular HTML color
                //         font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
                //         alignment: { wrapText: true, horizontal: 'center' },
                //         fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
                //     });
                //     sheet.setRowInstructions(0, { height: 40 }); // change height of row 0

                //     // excel cells start with A1 which is upper left corner
                //     const customTitle = '';
                //     //   const lastCellMerge = this.isDataGrouped ? 'H1' : 'G1';
                //     //   sheet.mergeCells('A1', lastCellMerge);
                //     sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
                // },
            },

            formatterOptions: {
                // dateSeparator: '.',
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ','
            },

            contextMenu: {
                hideCloseButton: false,
                commandTitle: '', // optional, add title
                commandItems: [

                    {
                        command: '', title: 'Bổ sung file', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            this.onAttachFileExtend();
                        }
                    },
                ],
            }
        };

        this.columnDefinitionDetails = [
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: 'Stt',
                type: PaymentOrderDetailField.STT.type,
                width: 70,
                sortable: true, filterable: true,
                formatter: Formatters.tree,
                filter: { model: Filters['compoundInputText'] },
                cssClass: 'text-center'
            },

            {
                id: PaymentOrderDetailField.ContentPayment.field,
                name: PaymentOrderDetailField.ContentPayment.name,
                field: PaymentOrderDetailField.ContentPayment.field,
                type: PaymentOrderDetailField.ContentPayment.type,
                width: 250,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.Unit.field,
                name: PaymentOrderDetailField.Unit.name,
                field: PaymentOrderDetailField.Unit.field,
                type: PaymentOrderDetailField.Unit.type,
                width: 70,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },

            {
                id: PaymentOrderDetailField.Quantity.field,
                name: PaymentOrderDetailField.Quantity.name,
                field: PaymentOrderDetailField.Quantity.field,
                type: PaymentOrderDetailField.Quantity.type,
                width: 80,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },

            {
                id: PaymentOrderDetailField.UnitPrice.field,
                name: PaymentOrderDetailField.UnitPrice.name,
                field: PaymentOrderDetailField.UnitPrice.field,
                type: PaymentOrderDetailField.UnitPrice.type,
                width: 100,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },

            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: PaymentOrderDetailField.TotalMoney.name,
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                width: 150,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },
            {
                id: PaymentOrderDetailField.PaymentPercentage.field,
                name: PaymentOrderDetailField.PaymentPercentage.name,
                field: PaymentOrderDetailField.PaymentPercentage.field,
                type: PaymentOrderDetailField.PaymentPercentage.type,
                width: 100,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },
            {
                id: PaymentOrderDetailField.TotalPaymentAmount.field,
                name: PaymentOrderDetailField.TotalPaymentAmount.name,
                field: PaymentOrderDetailField.TotalPaymentAmount.field,
                type: PaymentOrderDetailField.TotalPaymentAmount.type,
                width: 150,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },
            {
                id: PaymentOrderDetailField.Note.field,
                name: PaymentOrderDetailField.Note.name,
                field: PaymentOrderDetailField.Note.field,
                type: PaymentOrderDetailField.Note.type,
                width: 300,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
        ]

        this.gridOptionDetails = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            // datasetIdPropertyName: 'Id',
            enableRowSelection: true,

            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,

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
            frozenColumn: this.isMobile ? 0 : 2,

            formatterOptions: {
                // dateSeparator: '.',
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ','
            },
        }


        this.columnDefinitionFiles = [
            {
                id: 'FileName',
                name: 'File đính kèm',
                field: 'FileName',
                type: 'string',
                width: 100,
                sortable: true, filterable: false,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
        ]

        this.gridOptionFiles = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',

            },
            gridWidth: '100%',
            // datasetIdPropertyName: 'Id',

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
            contextMenu: {
                hideCloseButton: false,
                commandTitle: '', // optional, add title
                commandItems: [

                    {
                        command: '', title: 'Xem file', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            const filePath = args.dataContext?.ServerPath || '';
                            if (filePath) {
                                const host = environment.host + 'api/share';
                                let urlImg = filePath.replace("\\\\192.168.1.190", host) + `/${args.dataContext?.FileName}`;
                                // window.open(urlImg, '_blank', 'width=1000,height=700,left=200,top=100');

                                const newWindow = window.open(
                                    urlImg,
                                    '_blank',
                                    'width=1000,height=700'
                                );

                                if (newWindow) {
                                    newWindow.onload = () => {
                                        newWindow.document.title = args.dataContext?.FileName;
                                        // newWindow.document.icon = args.dataContext?.FileName;
                                    };
                                }
                            }
                        }
                    },

                    {
                        command: '', title: 'Tải file', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            let selectedItems = args.grid.getSelectedRows()
                                .map(i => this.angularGridFile.dataView?.getItem(i));


                            selectedItems.forEach(item => {
                                const filePath = item?.ServerPath || '';
                                if (filePath) {
                                    const host = environment.host + 'api/share';
                                    let url = filePath.replace("\\\\192.168.1.190", host) + `/${item?.FileName}`;

                                    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
                                        const a = document.createElement('a');
                                        const objectUrl = URL.createObjectURL(blob);

                                        a.href = objectUrl;
                                        a.download = item?.FileName;
                                        a.click();

                                        URL.revokeObjectURL(objectUrl);
                                    });
                                }
                            });
                        }
                    },

                ],
            }
        }

        this.columnDefinitionFileBankSlips = [
            {
                id: 'FileName',
                name: 'File đính kèm',
                field: 'FileName',
                type: 'string',
                width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
        ]

        this.gridOptionFileBankSlips = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-filebankslip',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            // datasetIdPropertyName: 'Id',
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

            contextMenu: {
                hideCloseButton: false,
                commandTitle: '', // optional, add title
                commandItems: [

                    {
                        command: '', title: 'Xem file', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            const filePath = args.dataContext?.ServerPath || '';
                            if (filePath) {
                                const host = environment.host + 'api/share';
                                let urlImg = filePath.replace("\\\\192.168.1.190", host) + `/${args.dataContext?.FileName}`;
                                // window.open(urlImg, '_blank', 'width=1000,height=700,left=200,top=100');

                                const newWindow = window.open(
                                    urlImg,
                                    '_blank',
                                    'width=1000,height=700'
                                );

                                if (newWindow) {
                                    newWindow.onload = () => {
                                        newWindow.document.title = args.dataContext?.FileName;
                                        // newWindow.document.icon = args.dataContext?.FileName;
                                    };
                                }
                            }
                        }
                    },

                    {
                        command: '', title: 'Tải file', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            let selectedItems = args.grid.getSelectedRows()
                                .map(i => this.angularGridFileBankslip.dataView?.getItem(i));

                            selectedItems.forEach(item => {
                                const filePath = item?.ServerPath || '';
                                if (filePath) {
                                    const host = environment.host + 'api/share';
                                    let url = filePath.replace("\\\\192.168.1.190", host) + `/${item?.FileName}`;

                                    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
                                        const a = document.createElement('a');
                                        const objectUrl = URL.createObjectURL(blob);

                                        a.href = objectUrl;
                                        a.download = item?.FileName;
                                        a.click();

                                        URL.revokeObjectURL(objectUrl);
                                    });
                                }
                            });
                        }
                    },

                ],
            }
        }

        this.loadData();

        this.datasetDetails = [];
        this.datasetFiles = [];
        this.datasetFileBankslip = [];
    }

    initGridSpecial() {
        this.columnDefinitionsSpecial = [
            {
                id: PaymentOrderField.RowNum.field,
                name: 'STT',
                field: PaymentOrderField.RowNum.field,
                type: PaymentOrderField.RowNum.type,
                width: 80,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.IsUrgent.field,
                name: 'Thanh toán gấp',
                field: PaymentOrderField.IsUrgent.field,
                type: PaymentOrderField.IsUrgent.type,
                sortable: true, filterable: true,
                width: 80,
                formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                exportCustomFormatter: this.excelBooleanFormatter,
                filter: {
                    collection: [
                        { value: '', label: '' },
                        { value: true, label: 'Gấp' },
                        // { value: false, label: 'Không gấp' },
                    ],
                    model: Filters['singleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.DateOrder.field,
                name: 'Ngày đề nghị',
                field: PaymentOrderField.DateOrder.field,
                type: PaymentOrderField.DateOrder.type,
                sortable: true, filterable: true,
                width: 100,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.DatePayment.field,
                name: 'Deadline thanh toán',
                field: PaymentOrderField.DatePayment.field,
                type: PaymentOrderField.DatePayment.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY HH:mm' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
            },
            {
                id: PaymentOrderField.Code.field,
                name: 'Số đề nghị',
                field: PaymentOrderField.Code.field,
                type: PaymentOrderField.Code.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.FullName.field,
                name: 'Người đề nghị',
                field: PaymentOrderField.FullName.field,
                type: PaymentOrderField.FullName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            // {
            //     id: PaymentOrderField.ReceiverInfo.field,
            //     name: 'Người phụ trách',
            //     field: PaymentOrderField.ReceiverInfo.field,
            //     type: PaymentOrderField.ReceiverInfo.type,
            //     sortable: true, filterable: true,
            //     width: 200,
            //     // formatter: Formatters.icon,
            //     filter: {
            //         collection: [],
            //         model: Filters['multipleSelect'],
            //         filterOptions: {
            //             autoAdjustDropHeight: true,
            //             filter: true,
            //         } as MultipleSelectOption,
            //     },
            // },

            {
                id: PaymentOrderField.UserTeamNameJoin.field,
                name: 'Team kinh doanh',
                field: PaymentOrderField.UserTeamNameJoin.field,
                type: PaymentOrderField.UserTeamNameJoin.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: 'TypeName',
                name: 'Phân loại thanh toán',
                field: 'TypeName',
                type: 'string',
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.CustomerName.field,
                name: 'Khách hàng',
                field: PaymentOrderField.CustomerName.field,
                type: PaymentOrderField.CustomerName.type,
                sortable: true, filterable: true,
                width: 250,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'POCodes',
                name: 'Số PO',
                field: 'POCodes',
                type: 'string',
                sortable: true, filterable: true,
                width: 80,
                // formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" },
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'BillNumbers',
                name: 'Số hóa đơn',
                field: 'BillNumbers',
                type: 'string',
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderField.TotalMoney.field,
                type: PaymentOrderField.TotalMoney.type,
                sortable: true, filterable: true,
                width: 150,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },


            {
                id: PaymentOrderField.Unit.field,
                name: 'ĐVT',
                field: PaymentOrderField.Unit.field,
                type: PaymentOrderField.Unit.type,
                sortable: true, filterable: true,
                width: 80,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                cssClass: 'text-uppercase'
            },
            {
                id: PaymentOrderField.PaymentMethodsJoin.field,
                name: 'Hình thức thanh toán',
                field: PaymentOrderField.PaymentMethodsJoin.field,
                type: PaymentOrderField.PaymentMethodsJoin.type,
                sortable: true, filterable: true,
                width: 170,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.StepName.field,
                name: 'Tình trạng phiếu',
                field: PaymentOrderField.StepName.field,
                type: PaymentOrderField.StepName.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },


            {
                id: PaymentOrderField.ContentLog.field,
                name: 'Lịch sử duyệt / hủy duyệt',
                field: PaymentOrderField.ContentLog.field,
                type: PaymentOrderField.ContentLog.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: PaymentOrderField.ReasonCancel.field,
                name: 'Lý do hủy duyệt',
                field: PaymentOrderField.ReasonCancel.field,
                type: PaymentOrderField.ReasonCancel.type,
                sortable: true, filterable: true,
                width: 200,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            },

            {
                id: PaymentOrderField.Note.field,
                name: 'Ghi chú / Chứng từ kèm theo',
                field: PaymentOrderField.Note.field,
                type: PaymentOrderField.Note.type,
                sortable: true, filterable: true,
                width: 300,
                // formatter: Formatters.icon,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
            }
        ];
        this.gridOptionsSpecial = {
            autoResize: {
                container: '.grid-container-special',// container DOM selector
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            enableAutoResize: true,
            gridWidth: '100%',
            // gridHeight: 300, // ⚠️ QUAN TRỌNG
            // datasetIdPropertyName: '_id',
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

            frozenColumn: this.isMobile ? 0 : 5,

            createPreHeaderPanel: true,
            showPreHeaderPanel: true,

            showFooterRow: true,
            createFooterRow: true,

            //Config xuất excel
            externalResources: [this.excelExportServiceSpecial],
            enableExcelExport: true,
            excelExportOptions: {
                // filename: `TheoDoiChiPhiVP_${DateTime.fromJSDate(new Date()).toFormat()}`,
                sanitizeDataExport: true,
                exportWithFormatter: true,
                // sheetName: 'Grocery List',
                // columnHeaderStyle: {
                //     font: { color: 'FFFFFFFF' },
                //     fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' },
                // },

                // optionally pass a custom header to the Excel Sheet
                // a lot of the info can be found on Web Archive of Excel-Builder
                // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
                // customExcelHeader: (workbook, sheet) => {
                //     const excelFormat = workbook.getStyleSheet().createFormat({
                //         // every color is prefixed with FF, then regular HTML color
                //         font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
                //         alignment: { wrapText: true, horizontal: 'center' },
                //         fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
                //     });
                //     sheet.setRowInstructions(0, { height: 40 }); // change height of row 0

                //     // excel cells start with A1 which is upper left corner
                //     const customTitle = '';
                //     //   const lastCellMerge = this.isDataGrouped ? 'H1' : 'G1';
                //     //   sheet.mergeCells('A1', lastCellMerge);
                //     sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
                // },
            },
            formatterOptions: {
                // dateSeparator: '.',
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ','
            },
        }

        this.loadData();
    }

    initGridSpecialDetail() {
        this.columnDefinitionsSpecialDetail = [
            {
                id: PaymentOrderDetailField.STT.field,
                name: PaymentOrderDetailField.STT.name,
                field: 'Stt',
                type: PaymentOrderDetailField.STT.type,
                width: 70,
                sortable: true, filterable: true,
                // formatter: Formatters.tree,

                filter: { model: Filters['compoundInputText'] },
                cssClass: 'text-center'
            },

            {
                id: PaymentOrderDetailField.ContentPayment.field,
                name: 'Đối tượng nhận COM',
                field: PaymentOrderDetailField.ContentPayment.field,
                type: PaymentOrderDetailField.ContentPayment.type,
                width: 250,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },


            {
                id: PaymentOrderDetailField.TotalMoney.field,
                name: 'Số tiền',
                field: PaymentOrderDetailField.TotalMoney.field,
                type: PaymentOrderDetailField.TotalMoney.type,
                width: 150,
                sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 2 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'
            },
            {
                id: 'PaymentMethodsText',
                name: 'Hình thức thanh toán',
                field: 'PaymentMethodsText',
                type: 'string',
                width: 100,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderDetailField.PaymentInfor.field,
                name: 'Thông tin thanh toán',
                field: PaymentOrderDetailField.PaymentInfor.field,
                type: PaymentOrderDetailField.PaymentInfor.type,
                width: 150,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'UserTeamName',
                name: 'Team kinh doanh',
                field: 'UserTeamName',
                type: 'string',
                width: 150,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: PaymentOrderDetailField.Note.field,
                name: 'Ghi chú / Chứng từ kèm theo',
                field: PaymentOrderDetailField.Note.field,
                type: PaymentOrderDetailField.Note.type,
                width: 300,
                sortable: true, filterable: true,
                // formatter: Formatters.iconBoolean,
                filter: { model: Filters['compoundInputText'] },
            },
        ]

        this.gridOptionsSpecialDetail = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail-special',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            // datasetIdPropertyName: 'Id',
            enableRowSelection: true,

            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,

            enableFiltering: false,
            enableTreeData: false,
            // treeDataOptions: {
            //     columnId: 'Stt',           // the column where you will have the Tree with collapse/expand icons
            //     parentPropName: 'parentid',  // the parent/child key relation in your dataset
            //     // identifierPropName: 'Id',
            //     // roo:0,
            //     levelPropName: 'treeLevel',  // optionally, you can define the tree level property name, it nothing is provided it will use "__treeLevel"
            //     indentMarginLeft: 15,        // optionally provide the indent spacer width in pixel, for example if you provide 10 and your tree level is 2 then it will have 20px of indentation
            //     exportIndentMarginLeft: 4,   // similar to `indentMarginLeft` but represent a space instead of pixels for the Export CSV/Excel
            // },
            // multiColumnSort: false,

            frozenColumn: this.isMobile ? 0 : 2,
            formatterOptions: {
                // dateSeparator: '.',
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ','
            },
        }
    }

    angularGridReadySpecial(angularGrid: AngularGridInstance) {
        this.angularGridSpecial = angularGrid;
        this.gridDataSpecial = angularGrid?.slickGrid || {};
        angularGrid.dataView.onRowCountChanged.subscribe(() => {
            // const count = angularGrid.dataView.getLength();
            // console.log('Row count:', count);
            const columnElement = angularGrid.slickGrid?.getFooterRowColumn('Code');
            if (columnElement) {
                columnElement.textContent = `${this.formatNumber(angularGrid.dataView.getLength(), 0)}`;
            }
        });
    }

    angularGridReadySpecialDetail(angularGrid: AngularGridInstance) {
        this.angularGridSpecialDetail = angularGrid;
        this.gridDataSpecialDetail = angularGrid?.slickGrid || {};
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

        this.steps = [
            { value: 1, text: "NV đề nghị" },
            { value: 2, text: "TBP duyệt" },
            { value: 3, text: "HR check hồ sơ" },
            { value: 4, text: "TBP HR duyệt" },
            { value: 5, text: "Kế toán check hồ sơ" },
            { value: 6, text: "KTT duyệt" },
            { value: 7, text: "BGĐ duyệt" },
            { value: 8, text: "Kế toán nhận chứng từ" },
            { value: 9, text: "Kế toán thanh toán" },
        ]
    }

    loadData() {
        this.loadDataNormal();
        this.loadDataSpecial();

    }

    loadDataNormal() {
        this.isLoading = true;
        const p = {
            ...this.param,
            isSpecialOrder: 0,
        }
        // console.log(this.param);
        this.paymentService.get(p).subscribe({
            next: (response) => {
                // console.log(response);
                this.dataset = response.data;

                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    id: x.ID   // dành riêng cho SlickGrid
                }));

                this.updateFilterCollections(this.angularGrid, this.dataset);
                this.rowStyle(this.angularGrid);


                const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn('Code');
                if (columnElement) {
                    columnElement.textContent = `${this.formatNumber(this.dataset.length, 0)}`;
                }

                this.isLoading = false;
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                this.isLoading = false;
            }
        })
    }

    loadDataSpecial() {
        // this.param.isSpecialOrder = 1;

        if (!this.isPermisstionDB) return;
        const p = {
            ...this.param,
            isSpecialOrder: 1,
            typeOrder: 0
        }
        this.paymentService.get(p).subscribe({
            next: (response) => {
                // console.log(response);
                this.datasetSpecial = response.data;

                this.datasetSpecial = this.datasetSpecial.map((x, i) => ({
                    ...x,
                    id: x.ID   // dành riêng cho SlickGrid
                }));

                this.updateFilterCollections(this.angularGridSpecial, this.datasetSpecial);
                this.rowStyle(this.angularGridSpecial);

                const columnElement = this.angularGridSpecial.slickGrid?.getFooterRowColumn('Code');
                if (columnElement) {
                    columnElement.textContent = `${this.formatNumber(this.datasetSpecial.length, 0)}`;
                }
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
                this.datasetSpecialDetail = response.data.details;
                this.datasetFiles = response.data.files;
                this.datasetFileBankslip = response.data.fileBankSlips;


                this.datasetDetails = this.datasetDetails.map(item => ({
                    ...item,
                    parentid: item.ParentId == 0 ? null : item.ParentId,
                    id: item.Id,
                    treeLevel: item.ParentId == 0 ? 0 : (item.ParentId == null ? 0 : 1)
                }));

                this.datasetSpecialDetail = this.datasetSpecialDetail.map(item => ({
                    ...item,
                    // parentid: item.ParentId == 0 ? null : item.ParentId,
                    id: item.Id,
                    // treeLevel: item.ParentId == 0 ? 0 : (item.ParentId == null ? 0 : 1)
                }));

                // console.log('his.datasetSpecialDetail:', this.datasetSpecialDetail);

                this.datasetFiles = this.datasetFiles.map(item => ({
                    ...item,
                    id: item.Id
                }));

                this.datasetFileBankslip = this.datasetFileBankslip.map(item => ({
                    ...item,
                    id: item.ID
                }));


                // console.log(response.data);
                // this.dataPrint = {
                //     paymentOrder: response.data.paymentOrder,
                //     details: response.data.details,
                //     signs: response.data.signs
                // }
            }
        })
    }


    private updateFilterCollections(angularGrid: AngularGridInstance, data: any[]): void {
        if (!angularGrid || !angularGrid.slickGrid) return;

        // console.log('angularGrid',angularGrid);

        const columns = angularGrid.slickGrid.getColumns();
        // const allData = angularGrid.dataView?.getItems();
        const allData = data;

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            allData.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        // Update collections for each filterable column
        columns.forEach((column: any) => {
            if (column.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (field && field !== 'BorrowCustomer') {
                    const collection = getUniqueValues(field);
                    if (column.filter) {
                        column.filter.collection = collection;
                    }
                }
            }
        });


        // Update grid columns
        angularGrid.slickGrid.setColumns(columns);
        angularGrid.slickGrid.render();
    }


    rowStyle(angularGrid: AngularGridInstance) {
        angularGrid.dataView.getItemMetadata = this.rowStyleIsUrgent(angularGrid.dataView.getItemMetadata, angularGrid);

        // this.gridData.invalidate();
        // this.gridData.render();

        // this.gridDataSpecial.invalidate();
        // this.gridDataSpecial.render();
    }

    rowStyleIsUrgent(previousItemMetadata: any, angularGrid: AngularGridInstance) {
        const newCssClass = 'bg-isurgent';

        return (rowNumber: number) => {
            const item = angularGrid.dataView.getItem(rowNumber);
            let meta = {
                cssClasses: '',
            };
            if (typeof previousItemMetadata === 'object') {
                meta = previousItemMetadata(rowNumber);
            }

            if (meta && item && item.IsUrgent) {
                meta.cssClasses = (meta.cssClasses || '') + '' + newCssClass;
            }

            return meta;
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
        // this.updateTotal(5, this.angularGrid);
        angularGrid.dataView.onRowCountChanged.subscribe(() => {
            const count = angularGrid.dataView.getLength();
            // console.log('Row count:', count);
            const columnElement = angularGrid.slickGrid?.getFooterRowColumn('Code');
            if (columnElement) {
                columnElement.textContent = `${this.formatNumber(angularGrid.dataView.getLength(), 0)}`;
            }
        });


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

            // console.log('multiple row checkbox selected', event, args);

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

            this.defaultSizeSplit = '60%';
        }
    }

    // updateTotal(cell: number, angularGrid: AngularGridInstance) {

    //     if (cell <= 0) return;

    //     console.log('angularGrid.dataView:', angularGrid.dataView);
    //     const columnId = angularGrid.slickGrid?.getColumns()[cell].id;
    //     console.log('columnId:', columnId);
    //     let data = angularGrid.dataView.getFilteredItems();
    //     console.log('data:', angularGrid.dataView.getLength());

    //     const columnElement = angularGrid.slickGrid?.getFooterRowColumn(columnId);
    //     if (columnElement) {
    //         columnElement.textContent = `${this.formatNumber(angularGrid.dataView.getFilteredItems().length, 0)}`;
    //     }
    // }

    initModal(paymentOrder: any = new PaymentOrder(), isCopy: boolean = false) {
        paymentOrder.IsSpecialOrder = this.activeTab == '1';
        if (!paymentOrder.IsSpecialOrder) {
            const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
                centered: true,
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                fullscreen: true,
            });

            modalRef.componentInstance.paymentOrder = paymentOrder;
            modalRef.componentInstance.isCopy = isCopy;
        } else {
            const modalRef = this.modalService.open(PaymentOrderSpecialComponent, {
                centered: true,
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                scrollable: true,
                fullscreen: true,
            });
            modalRef.componentInstance.paymentOrder = paymentOrder;
            modalRef.componentInstance.isCopy = isCopy;
        }

    }

    onCreate() {

        // console.log('activeTab:', this.activeTab);
        this.initModal();
    }

    onEdit() {
        let grid = this.angularGrid;
        if (this.activeTab == '1') grid = this.angularGridSpecial;

        let activeCell = grid.slickGrid.getActiveCell();
        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = grid.dataView.getItem(rowIndex) as PaymentOrder; // data object

            // console.log('Row index:', rowIndex);
            // console.log('Row data:', item);
            this.initModal(item);
        }
    }

    onDelete() {
        let grid = this.angularGrid;
        if (this.activeTab == '1') grid = this.angularGridSpecial;

        const activeCell = grid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = grid.dataView.getItem(rowIndex) as PaymentOrder; // data object

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
                        IsDelete: true,
                        Code: item.Code
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


    onCopy() {
        let grid = this.angularGrid;
        if (this.activeTab == '1') grid = this.angularGridSpecial;

        let activeCell = grid.slickGrid.getActiveCell();
        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            let item = grid.dataView.getItem(rowIndex); // data object

            // item.ID = 0;
            // item.id = 0;
            item.DateOrder = new Date();
            item.FullName = this.appUserService.currentUser?.FullName || '';
            item.DepartmentName = this.appUserService.currentUser?.DepartmentName || '';
            item.Code = '';

            item = item as PaymentOrder;
            // console.log('onCopy item:', item);
            this.initModal(item, true);
        }
    }


    handleApproved(data: any) {

        if (data.length <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn đề nghị!");
        }

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
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;

        const grid = gridInstance.slickGrid;
        const dataView = gridInstance.dataView;

        const rowIndexes = grid.getSelectedRows();



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

                // console.log('hủy duyêt:', selectedItems);
                this.handleApproved(selectedItems);
            }
        }
    }

    async onApprovedHR(isApproved: number, action: any) {
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;

        const grid = gridInstance.slickGrid;
        const dataView = gridInstance.dataView;

        const rowIndexes = grid.getSelectedRows();

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
                confirmButtonText: 'Lưu',
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
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;

        const grid = gridInstance.slickGrid;
        const dataView = gridInstance.dataView;

        const rowIndexes = grid.getSelectedRows();
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
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;

        const grid = gridInstance.slickGrid;
        const dataView = gridInstance.dataView;

        const rowIndexes = grid.getSelectedRows();

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
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;

        const grid = gridInstance.slickGrid;
        const dataView = gridInstance.dataView;

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
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;
        const activeCell = gridInstance.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = gridInstance.dataView.getItem(rowIndex) as PaymentOrder; // data object

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

                this.paymentService.uploadFileBankslip(files, item.ID.toString()).subscribe({
                    next: (response) => {
                        console.log(response);
                        this.loadDetail(item.ID);
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
                    }
                })



            }
        }
    }

    async onAttachFileExtend() {
        let gridInstance = this.angularGrid;
        if (this.activeTab == '1') gridInstance = this.angularGridSpecial;
        const activeCell = gridInstance.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = gridInstance.dataView.getItem(rowIndex) as PaymentOrder; // data object

            const { value: files } = await Swal.fire({
                input: 'file',
                inputLabel: 'File bổ sung',
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

                // let fileUpdloads: any[] = [];
                // console.log('files:', files);
                // console.log('item.ID.toString():', item.ID.toString());

                let fileDeletes: any[] = [];

                this.paymentService.uploadFile(files, item.ID, JSON.stringify(fileDeletes)).subscribe({
                    next: (reponse) => {
                        // console.log(reponse);

                        if (reponse.status == 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Bổ sung file thành công!');
                            this.loadDetail(item.ID);
                        }
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                    }
                })

            }
        }


    }

    formatNumber(num: number, digits: number = 2) {
        num = num || 0;
        return num.toLocaleString('vi-VN', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }


    onPrint(e: Event, args: OnDblClickEventArgs) {

        // console.log('args:', args);

        const item = args.grid.getDataItem(args.row);

        this.paymentService.getDetail(item.ID).subscribe({
            next: (response) => {
                // console.log(response.data);
                const dataPrint = {
                    paymentOrder: response.data.paymentOrder,
                    details: response.data.details,
                    signs: response.data.signs
                }


                if (response.data.paymentOrder[0].IsSpecialOrder == true) {
                    this.drawPDFSpecial(dataPrint);
                } else {
                    this.drawPDF(dataPrint);
                }
            }
        })



        // console.log('this.dataPrint:', this.dataPrint);


        // const paymentOrder = this.dataPrint.paymentOrder[0];
        // const details = this.dataPrint.details;
        // const signs = this.dataPrint.signs;

        // console.log('.paymentOrder:', paymentOrder);
        // console.log('.details:', details);
        // console.log('.signs:', signs);


    }


    drawPDF(dataPrint: any) {
        const paymentOrder = dataPrint.paymentOrder[0];
        const details = dataPrint.details;
        const signs = dataPrint.signs;

        const numberDocument = paymentOrder.TypeOrder == 1 ? "BM01-RTC.AC-QT03" : "BM02-RTC.AC-QT03";
        const dateOrder = new Date(paymentOrder.DateOrder);
        dateOrder.setHours(0, 0, 0, 0);
        const datePayment = new Date(paymentOrder.DatePayment);

        let groupHeader6: any = {};
        const nameNCC = paymentOrder.NameNCC || '';
        const poCode = paymentOrder.POCode || '';
        if ((nameNCC && poCode)) {
            groupHeader6 = {
                style: 'groupHeader6',
                table: {
                    widths: [120, '*', 40, 120],
                    body:
                        [
                            [
                                '3. Nhà cung cấp',
                                { text: `:${paymentOrder.NameNCC}` },
                                'Số PO',
                                `:${paymentOrder.POCode || ''}`,
                            ],
                        ],
                },
                layout: 'noBorders',
            }

        }

        const isVND = (paymentOrder.Unit?.toUpperCase() ?? '') == 'VND';

        let groupHeader3: any = {};
        let sumTotalFooter: any = [];
        if (paymentOrder.TypeOrder == 1) {
            groupHeader3 = {
                style: 'groupHeader3',
                table: {
                    widths: [120, '*', 40, 70],
                    body: [
                        [
                            '3. Thời gian thanh quyết toán',
                            { colSpan: 3, text: `:Ngày ${datePayment.getDate()} tháng ${datePayment.getMonth() + 1} năm ${datePayment.getFullYear()}` }
                        ]
                    ],
                },
                layout: 'noBorders',
            };



            let totalQuantity = details.reduce((sum: number, x: any) => sum + x.Quantity, 0);
            totalQuantity = totalQuantity <= 0 ? '' : totalQuantity;

            let totalUnitPrice = details.reduce((sum: number, x: any) => sum + x.UnitPrice, 0);
            totalUnitPrice = totalUnitPrice <= 0 ? '' : (isVND ? this.formatNumber(totalUnitPrice, 0) : this.formatNumber(totalUnitPrice));

            let totalMoney = details.reduce((sum: number, x: any) => sum + x.TotalMoney, 0);
            totalMoney = totalMoney <= 0 ? '' : (isVND ? this.formatNumber(totalMoney, 0) : this.formatNumber(totalMoney));

            sumTotalFooter = [
                [
                    { colSpan: 2, text: 'Tổng cộng tạm ứng', bold: true, border: [true, false, true, true] }, {},
                    { colSpan: 1, text: '', bold: true, border: [true, false, true, true] },
                    { colSpan: 1, text: totalQuantity, bold: true, alignment: 'right', border: [true, false, true, true] },
                    { colSpan: 1, text: totalUnitPrice, bold: true, alignment: 'right', border: [true, false, true, true] },
                    { colSpan: 1, text: totalMoney, bold: true, alignment: 'right', border: [true, false, true, true] },
                    { colSpan: 3, text: '' }, {}, {},
                ]
            ]
        }

        let groupHeader4: any = {};
        if (paymentOrder.TypePayment == 1) {
            groupHeader4 = {
                style: 'groupHeader4',
                table: {
                    widths: [120, '*', 40, 70],
                    body: [
                        [
                            '- Hình thức chuyển khoản',
                            { colSpan: 3, text: `:${paymentOrder.TypeBankTransferText}` }, {}, {}
                        ],
                        [
                            '- Nội dung chuyển khoản',
                            { colSpan: 3, text: `:${paymentOrder.ContentBankTransfer}` }, {}, {}
                        ]

                    ],
                },
                layout: 'noBorders',
            }
        }



        let items: any = [];
        for (let i = 0; i < details.length; i++) {

            const detail = details[i];
            const quantity = detail.Quantity <= 0 ? '' : this.formatNumber(detail.Quantity);
            const unitPrice = detail.UnitPrice <= 0 ? '' : (isVND ? this.formatNumber(detail.UnitPrice, 0) : this.formatNumber(detail.UnitPrice));
            const totalMoney = detail.TotalMoney <= 0 ? '' : (isVND ? this.formatNumber(detail.TotalMoney, 0) : this.formatNumber(detail.TotalMoney));
            const paymentPercentage = detail.PaymentPercentage <= 0 ? '' : detail.PaymentPercentage;
            const totalPaymentAmount = detail.TotalPaymentAmount <= 0 ? '' : (isVND ? this.formatNumber(detail.TotalPaymentAmount, 0) : this.formatNumber(detail.TotalPaymentAmount));
            let item = [
                { text: detail.Stt, alignment: 'center' },
                { text: detail.ContentPayment, alignment: '' },

                { text: detail.Unit, alignment: '' },
                {
                    text: quantity,
                    alignment: 'right',
                },
                { text: unitPrice, alignment: 'right' },
                { text: totalMoney, alignment: 'right' },
                { text: paymentPercentage, alignment: 'right' },
                { text: totalPaymentAmount, alignment: 'right' },
                { text: detail.Note, alignment: 'right' },
            ];
            items.push(item);
        }

        // console.log('items:', items);
        // console.log('sumTotalFooter:', sumTotalFooter);

        //Chữ ký

        const signEmp = signs.find((x: any) => x.Step == 1 && x.IsApproved == 1);
        const signTBP = signs.find((x: any) => x.Step == 2 && x.IsApproved == 1);
        let signHR = signs.find((x: any) => x.Step == 3 && x.IsApproved == 1);
        let signKT = signs.find((x: any) => x.Step == 4 && x.IsApproved == 1);
        let signBGD = signs.find((x: any) => x.Step == 5 && x.IsApproved == 1);

        const dateFix = new Date('2024-03-03T00:00:00');
        console.log('dateOrder:', dateOrder);
        console.log('dateFix:', dateFix);

        if (dateOrder.getTime() <= dateFix.getTime()) {
            if (!paymentOrder.IsIgnoreHR) {
                // signHR = signs.find((x: any) => x.Step == 3 && x.IsApproved == 1);
                signKT = signs.find((x: any) => x.Step == 5 && x.IsApproved == 1);
                signBGD = signs.find((x: any) => x.Step == 6 && x.IsApproved == 1);
            }
        } else {
            if (!paymentOrder.IsIgnoreHR) {
                signHR = signs.find((x: any) => x.Step == 4 && x.IsApproved == 1);
                signKT = signs.find((x: any) => x.Step == 6 && x.IsApproved == 1);
                signBGD = signs.find((x: any) => x.Step == 7 && x.IsApproved == 1);
            }
        }


        // console.log('signHR:', signHR);
        // console.log('signKT:', signKT);
        // console.log('signBGD:', signBGD);



        const dateApprovedEmp = signEmp?.DateApproved ? DateTime.fromISO(signEmp?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedTBP = (signTBP?.DateApproved || '') != '' ? DateTime.fromISO(signTBP?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedHR = (signHR?.DateApproved || '') != '' ? DateTime.fromISO(signHR?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedKT = (signKT?.DateApproved || '') != '' ? DateTime.fromISO(signKT?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedBGD = (signBGD?.DateApproved || '') != '' ? DateTime.fromISO(signBGD?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';

        // console.log('signTBP?.DateApproved', signTBP?.DateApproved || '');
        let signFooter: any = [
            {
                alignment: 'justify',
                columns: [
                    { text: 'Người đề nghị thanh toán', alignment: 'center', bold: true },
                    { text: 'Trưởng bộ phận', alignment: 'center', bold: true },
                    { text: 'Phòng nhân sự', alignment: 'center', bold: true },
                    { text: 'Phòng kế toán', alignment: 'center', bold: true },
                    { text: 'Ban giám đốc', alignment: 'center', bold: true },
                ],
            },
            {
                alignment: 'justify',
                columns: [
                    {
                        text: `${signEmp?.FullName || ''}\n${dateApprovedEmp}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                    },
                    {
                        text: `${signTBP?.FullName || ''}\n${dateApprovedTBP}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                    },
                    {
                        text: `${signHR?.FullName || ''}\n${dateApprovedHR}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                    },
                    {
                        text: `${signKT?.FullName || ''}\n${dateApprovedKT}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                    },
                    {
                        text: `${signBGD?.FullName || ''}\n${dateApprovedBGD}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                    },
                ],
            }
        ];
        if (paymentOrder.IsIgnoreHR) {
            signFooter = [
                {
                    alignment: 'justify',
                    columns: [
                        { text: 'Người đề nghị thanh toán', alignment: 'center', bold: true },
                        { text: 'Trưởng bộ phận', alignment: 'center', bold: true },
                        { text: 'Phòng kế toán', alignment: 'center', bold: true },
                        { text: 'Ban giám đốc', alignment: 'center', bold: true },
                    ],
                },
                {
                    alignment: 'justify',
                    columns: [
                        {
                            text: `${signEmp?.FullName || ''}\n${dateApprovedEmp}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                        },
                        {
                            text: `${signTBP?.FullName || ''}\n${dateApprovedTBP}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                        },
                        {
                            text: `${signKT?.FullName || ''}\n${dateApprovedKT}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                        },
                        {
                            text: `${signBGD?.FullName || ''}\n${dateApprovedBGD}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                        },
                    ],
                }
            ]
        }

        let docDefinition = {
            info: {
                title: paymentOrder.Code,
            },
            content: [
                {
                    alignment: 'justify',
                    columns: [
                        {
                            image:
                                'data:image/png;base64,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',
                            fit: [100, 100],
                        },
                        {
                            text: 'CÔNG TY CỔ PHẦN RTC TECHNOLOGY VIỆT NAM',
                            fontSize: 12,
                            alignment: 'center',
                            bold: true,
                            margin: [0, 10, 0, 0],
                        },
                        {
                            text: `Mã số: ${numberDocument}`,
                            fontSize: 12,
                            alignment: 'center',
                            bold: true,
                            margin: [0, 20, 0, 0],
                        },
                    ],
                },

                { text: `GIẤY ${paymentOrder.TypeOrderText?.toUpperCase() ?? ''}`, bold: true, alignment: 'center', },
                { text: `Số ${paymentOrder.Code}`, bold: true, alignment: 'center', },
                {
                    text: `Ngày ${dateOrder.getDate()} tháng ${dateOrder.getMonth() + 1} năm ${dateOrder.getFullYear()}`,
                    bold: false, alignment: 'center',
                },

                {
                    style: 'tableExample1',
                    table: {
                        widths: [120, '*', 50, 100],
                        body: [
                            [
                                '1. Họ và tên người đề nghị',
                                { text: `:${paymentOrder.FullName}` },
                                'Bộ phận',
                                `:${paymentOrder.DepartmentName}`,
                            ],
                            [
                                // Iif(?TypeOrder == 3 ,'2. Lý do thu tiền','2. Lý do thanh toán' )
                                { text: paymentOrder.TypeOrder == 3 ? '2. Lý do thu tiền' : '2. Lý do thanh toán' },
                                { colSpan: 3, text: `:${paymentOrder.ReasonOrder}` }
                            ],
                        ],
                    },
                    layout: 'noBorders',
                },

                //Nhà cung cấp
                groupHeader6,

                //Thời gian thanh quyết toán
                groupHeader3,

                //Thông tin nhận tiền
                {
                    style: 'tableExample4',
                    table: {
                        widths: [120, '*', 45, 100],
                        body: [
                            [
                                '4. Thông tin người nhận tiền',
                                { colSpan: 3, text: `:${paymentOrder.ReceiverInfo}` }, {}, {}
                            ],

                            [
                                { text: paymentOrder.TypeOrder == 3 ? '- Hình thức thu tiền' : '- Hình thức thanh toán' },
                                // {},
                                { text: paymentOrder.TypePayment == 1 ? '[x] Chuyển khoản' : '[ ] Chuyển khoản' },
                                { colSpan: 2, text: paymentOrder.TypePayment == 2 ? '[x] Tiền mặt' : '[ ] Tiền mặt' }
                            ],
                            [
                                '- Số tài khoản', { text: `:${paymentOrder.AccountNumber}` },
                                'Ngân hàng', `:${paymentOrder.Bank}`
                            ],

                        ],
                    },
                    layout: 'noBorders',
                },
                groupHeader4,

                {
                    style: 'tableExample5',
                    table: {
                        widths: [120, '*', 45, 30, 30],
                        body: [
                            [
                                { colSpan: 3, text: '5. Số tiền đề nghị được ghi theo bảng kê dưới đây:' }, {}, {},
                                { text: 'ĐVT:' },
                                { text: `${paymentOrder.Unit?.toUpperCase() ?? ''}`, margin: [0, 0, 0, 0] }
                            ]
                        ],
                    },
                    layout: 'noBorders',
                },


                //Bảng chi tiết
                {
                    style: 'tableDetails',
                    table: {
                        widths: [20, 130, 27, 25, 50, 50, 30, 50, '*'],
                        body: [
                            [
                                { text: 'STT', alignment: 'center', bold: true },
                                {
                                    text: paymentOrder.TypeOrder == 3 ? 'Nội dung thu tiền' : 'Nội dung thanh toán',
                                    alignment: 'center', bold: true
                                },
                                { text: 'ĐVT', alignment: 'center', bold: true },
                                { text: 'SL', alignment: 'center', bold: true },
                                { text: 'Đơn giá', alignment: 'center', bold: true },
                                { text: 'Thành tiền', alignment: 'center', bold: true },
                                { text: '% TT', alignment: 'center', bold: true },
                                { text: 'Tổng thanh toán', alignment: 'center', bold: true },
                                { text: 'Ghi chú / Chứng từ', alignment: 'center', bold: true },
                            ],
                            ...items,
                            ...sumTotalFooter,
                            [{ colSpan: 9, text: paymentOrder.TotalMoneyText, bold: true, italics: true }]

                        ],
                    },
                    layout: {
                        paddingTop: () => 5,
                        paddingBottom: () => 5,
                    },
                    height: 60,
                },
                { text: "GHI CHÚ KẾ TOÁN:", bold: true, margin: [0, 10, 0, 0] },
                { text: paymentOrder.AccountingNote, bold: true, margin: [0, 0, 0, 60] },

                signFooter
            ],

            defaultStyle: {
                fontSize: 10,
                alignment: 'justify',
                font: 'Times',
            },
        };

        // pdfMake.createPdf(docDefinition).open();
        pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', `width=${window.screen.width / 2},height=${window.screen.height}`);
        });
    }

    drawPDFSpecial(dataPrint: any) {
        const paymentOrder = dataPrint.paymentOrder[0];
        const details = dataPrint.details;
        const signs = dataPrint.signs;

        const numberDocument = 'Mã số: BM01-RTC.AC-QT03\nLần ban hành: 01\Trang: 1'
        const dateOrder = new Date(paymentOrder.DateOrder);
        const datePayment = (paymentOrder.DatePayment || '') == '' ? '' : DateTime.fromISO(paymentOrder.DatePayment).toFormat('dd/MM/yyyy');

        let groupHeader6: any = {};
        const nameNCC = paymentOrder.NameNCC || '';
        const poCode = paymentOrder.POCode || '';
        if ((nameNCC && poCode)) {
            groupHeader6 = {
                style: 'groupHeader6',
                table: {
                    widths: [120, '*', 40, 120],
                    body:
                        [
                            [
                                '3. Nhà cung cấp',
                                { text: `:${paymentOrder.NameNCC}` },
                                'Số PO',
                                `:${paymentOrder.POCode || ''}`,
                            ],
                        ],
                },
                layout: 'noBorders',
            }

        }

        const isVND = (paymentOrder.Unit?.toUpperCase() ?? '') == 'VND';

        // let groupHeader3: any = {};
        // let sumTotalFooter: any = [];
        // if (paymentOrder.TypeOrder == 1) {
        //     groupHeader3 = {
        //         style: 'groupHeader3',
        //         table: {
        //             widths: [120, '*', 40, 70],
        //             body: [
        //                 [
        //                     '3. Thời gian thanh quyết toán',
        //                     { colSpan: 3, text: `:Ngày ${datePayment.getDate()} tháng ${datePayment.getMonth() + 1} năm ${datePayment.getFullYear()}` }
        //                 ]
        //             ],
        //         },
        //         layout: 'noBorders',
        //     };



        //     let totalQuantity = details.reduce((sum: number, x: any) => sum + x.Quantity, 0);
        //     totalQuantity = totalQuantity <= 0 ? '' : totalQuantity;

        //     let totalUnitPrice = details.reduce((sum: number, x: any) => sum + x.UnitPrice, 0);
        //     totalUnitPrice = totalUnitPrice <= 0 ? '' : (isVND ? this.formatNumber(totalUnitPrice, 0) : this.formatNumber(totalUnitPrice));

        let totalMoneys = details.reduce((sum: number, x: any) => sum + x.TotalMoney, 0);
        totalMoneys = totalMoneys <= 0 ? '' : (isVND ? this.formatNumber(totalMoneys, 0) : this.formatNumber(totalMoneys));

        //     sumTotalFooter = [
        //         [
        //             { colSpan: 2, text: 'Tổng cộng tạm ứng', bold: true, border: [true, false, true, true] }, {},
        //             { colSpan: 1, text: '', bold: true, border: [true, false, true, true] },
        //             { colSpan: 1, text: totalQuantity, bold: true, alignment: 'right', border: [true, false, true, true] },
        //             { colSpan: 1, text: totalUnitPrice, bold: true, alignment: 'right', border: [true, false, true, true] },
        //             { colSpan: 1, text: totalMoney, bold: true, alignment: 'right', border: [true, false, true, true] },
        //             { colSpan: 3, text: '' }, {}, {},
        //         ]
        //     ]
        // }

        // let groupHeader4: any = {};
        // if (paymentOrder.TypePayment == 1) {
        //     groupHeader4 = {
        //         style: 'groupHeader4',
        //         table: {
        //             widths: [120, '*', 40, 70],
        //             body: [
        //                 [
        //                     '- Hình thức chuyển khoản',
        //                     { colSpan: 3, text: `:${paymentOrder.TypeBankTransferText}` }, {}, {}
        //                 ],
        //                 [
        //                     '- Nội dung chuyển khoản',
        //                     { colSpan: 3, text: `:${paymentOrder.ContentBankTransfer}` }, {}, {}
        //                 ]

        //             ],
        //         },
        //         layout: 'noBorders',
        //     }
        // }



        let items: any = [];
        for (let i = 0; i < details.length; i++) {

            const detail = details[i];
            // const quantity = detail.Quantity <= 0 ? '' : this.formatNumber(detail.Quantity);
            // const unitPrice = detail.UnitPrice <= 0 ? '' : (isVND ? this.formatNumber(detail.UnitPrice, 0) : this.formatNumber(detail.UnitPrice));
            const totalMoney = detail.TotalMoney <= 0 ? '' : (isVND ? this.formatNumber(detail.TotalMoney, 0) : this.formatNumber(detail.TotalMoney));
            // const paymentPercentage = detail.PaymentPercentage <= 0 ? '' : detail.PaymentPercentage;
            // const totalPaymentAmount = detail.TotalPaymentAmount <= 0 ? '' : (isVND ? this.formatNumber(detail.TotalPaymentAmount, 0) : this.formatNumber(detail.TotalPaymentAmount));
            let item = [
                { text: detail.Stt, alignment: 'center' },
                { text: detail.ContentPayment, alignment: '' },

                // { text: detail.Unit, alignment: '' },
                // {
                //     text: quantity,
                //     alignment: 'right',
                // },
                // { text: unitPrice, alignment: 'right' },
                { text: totalMoney, alignment: 'right' },
                { text: detail.PaymentMethodsText, alignment: 'right' },
                { text: detail.PaymentInfor, alignment: 'right' },
                { text: detail.UserTeamName, alignment: 'right' },
                { text: detail.Note, alignment: 'right' },
            ];
            items.push(item);
        }

        // console.log('items:', items);
        // console.log('sumTotalFooter:', sumTotalFooter);

        //Chữ ký

        const signEmp = signs.find((x: any) => x.Step == 1 && x.IsApproved == 1);
        const signTBP = signs.find((x: any) => x.Step == 2 && x.IsApproved == 1);
        // const signHR = signs.find((x: any) => x.Step == 3 && x.IsApproved == 1);
        const signKT = signs.find((x: any) => x.Step == 3 && x.IsApproved == 1);
        const signBGD = signs.find((x: any) => x.Step == 4 && x.IsApproved == 1);

        const dateApprovedEmp = signEmp?.DateApproved ? DateTime.fromISO(signEmp?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedTBP = (signTBP?.DateApproved || '') != '' ? DateTime.fromISO(signTBP?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        // const dateApprovedHR = (signHR?.DateApproved || '') != '' ? DateTime.fromISO(signHR?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedKT = (signKT?.DateApproved || '') != '' ? DateTime.fromISO(signKT?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';
        const dateApprovedBGD = (signBGD?.DateApproved || '') != '' ? DateTime.fromISO(signBGD?.DateApproved).toFormat('dd/MM/yyyy HH:mm') : '';

        // console.log('signTBP?.DateApproved', signTBP?.DateApproved || '');
        // let signFooter: any = ;


        let docDefinition = {
            info: {
                title: paymentOrder.Code,
            },
            content: [
                {
                    alignment: 'justify',
                    columns: [
                        {
                            image:
                                'data:image/png;base64,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',
                            fit: [100, 100],
                        },
                        {
                            text: 'CÔNG TY CỔ PHẦN RTC TECHNOLOGY VIỆT NAM',
                            fontSize: 12,
                            alignment: 'center',
                            bold: true,
                            margin: [0, 10, 0, 0],
                        },
                        {
                            text: numberDocument,
                            fontSize: 12,
                            alignment: 'center',
                            bold: true,
                            margin: [0, 20, 0, 0],
                        },
                    ],
                },

                { text: `GIẤY ${paymentOrder.TypeOrderText?.toUpperCase() ?? ''}`, bold: true, alignment: 'center', },
                { text: `Số ${paymentOrder.Code}`, bold: true, alignment: 'center', },
                {
                    text: `Ngày ${dateOrder.getDate()} tháng ${dateOrder.getMonth() + 1} năm ${dateOrder.getFullYear()}`,
                    bold: false, alignment: 'center',
                },

                {
                    style: 'tableExample1',
                    table: {
                        widths: [120, '*', 50, 100],
                        body: [
                            [
                                '1. Họ và tên người đề nghị',
                                { text: `:${paymentOrder.FullName}` },
                                'Bộ phận',
                                `:${paymentOrder.DepartmentName}`,
                            ],
                            [
                                { text: '2. Lý do thanh toán' },
                                { colSpan: 3, text: `:${paymentOrder.ReasonOrder}` }
                            ],
                            [
                                { text: '3. Thời gian thanh quyết toán' },
                                { colSpan: 3, text: `:${datePayment}` }
                            ],
                        ],
                    },
                    layout: 'noBorders',
                },

                {
                    style: 'tableExample5',
                    table: {
                        widths: [120, '*', 45, 30, 30],
                        body: [
                            [
                                { colSpan: 3, text: '4. Số tiền đề nghị được ghi theo bảng kê dưới đây:' }, {}, {},
                                { text: 'ĐVT:' },
                                { text: `${paymentOrder.Unit?.toUpperCase() ?? ''}`, margin: [0, 0, 0, 0] }
                            ]
                        ],
                    },
                    layout: 'noBorders',
                },


                //Bảng chi tiết
                {
                    style: 'tableDetails',
                    table: {
                        widths: [20, '*', 70, '*', '*', '*', '*'],
                        body: [
                            [
                                { text: 'STT', alignment: 'center', bold: true },
                                {
                                    text: 'Nội dung thanh toán',
                                    alignment: 'center', bold: true
                                },
                                // { text: 'ĐVT', alignment: 'center', bold: true },
                                // { text: 'SL', alignment: 'center', bold: true },
                                // { text: 'Đơn giá', alignment: 'center', bold: true },
                                { text: 'Số tiền', alignment: 'center', bold: true },
                                { text: 'Hình thức thanh toán', alignment: 'center', bold: true },
                                { text: 'Thông tin thanh toán', alignment: 'center', bold: true },
                                { text: 'Team kinh doanh	', alignment: 'center', bold: true },
                                { text: 'Ghi chú / Chứng từ', alignment: 'center', bold: true },
                            ],
                            ...items,
                            [
                                { colSpan: 2, text: 'Tổng cộng tạm ứng', bold: true, border: [true, false, true, true] }, {},
                                { colSpan: 1, text: totalMoneys, bold: true, border: [true, false, true, true] },
                                {},
                                {},
                                {},
                                {},
                            ],
                            [{ colSpan: 7, text: paymentOrder.TotalMoneyText, bold: true, italics: true }]
                        ],

                    },
                    layout: {
                        paddingTop: () => 5,
                        paddingBottom: () => 5,
                    },
                    height: 60,
                },
                { text: "GHI CHÚ KẾ TOÁN:", bold: true, margin: [0, 10, 0, 0] },
                { text: paymentOrder.AccountingNote, bold: true, margin: [0, 0, 0, 60] },

                [
                    {
                        alignment: 'justify',
                        columns: [
                            { text: 'Người đề nghị thanh toán', alignment: 'center', bold: true },
                            { text: 'Sale phụ trách', alignment: 'center', bold: true },
                            { text: 'Phòng kế toán', alignment: 'center', bold: true },
                            { text: 'Ban giám đốc', alignment: 'center', bold: true },
                        ],
                    },
                    {
                        alignment: 'justify',
                        columns: [
                            {
                                text: `${signEmp?.FullNameDefault || ''}\n${dateApprovedEmp}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                            },
                            {
                                text: `${signTBP?.FullNameDefault || ''}\n${dateApprovedTBP}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                            },
                            {
                                text: `${signKT?.FullNameDefault || ''}\n${dateApprovedKT}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                            },
                            {
                                text: `${signBGD?.FullNameDefault || ''}\n${dateApprovedBGD}`, alignment: 'center', bold: true, margin: [0, 10, 0, 0]
                            },
                        ],
                    }
                ]
            ],

            defaultStyle: {
                fontSize: 10,
                alignment: 'justify',
                font: 'Times',
            },
        };

        // pdfMake.createPdf(docDefinition).open();
        pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', `width=${window.screen.width / 2},height=${window.screen.height}`);
        });
    }
}
