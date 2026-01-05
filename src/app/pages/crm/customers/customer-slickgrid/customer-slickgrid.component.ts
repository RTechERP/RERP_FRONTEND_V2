import {
    Component,
    ViewChild,
    ElementRef,
    Input,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    GridOption,
    Filters,
} from 'angular-slickgrid';

import { CustomerServiceService } from '../customer/customer-service/customer-service.service';
import { ViewPokhService } from '../../../old/view-pokh/view-pokh/view-pokh.service';
import { CustomerDetailComponent } from '../customer-detail/customer-detail.component';
import { CustomerMajorComponent } from '../customer-specialization/customer-major/customer-major.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { Menubar } from 'primeng/menubar';

@Component({
    selector: 'app-customer-slickgrid',
    standalone: true,
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzIconModule,
        NzSplitterModule,
        NzDatePickerModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule,
        NzTabsModule,
        NzModalModule,
        NzCheckboxModule,
        NzFormModule,
        CommonModule,
        NzTreeSelectModule,
        HasPermissionDirective,
        Menubar,
        AngularSlickgridModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './customer-slickgrid.component.html',
    styleUrl: './customer-slickgrid.component.css',
})
export class CustomerSlickgridComponent implements OnInit, AfterViewInit {
    // Main Grid properties
    angularGridMain!: AngularGridInstance;
    columnDefinitionsMain: Column[] = [];
    gridOptionsMain: GridOption = {};
    datasetMain: any[] = [];

    // Contact Grid properties
    angularGridContact!: AngularGridInstance;
    columnDefinitionsContact: Column[] = [];
    gridOptionsContact: GridOption = {};
    datasetContact: any[] = [];

    // Address Grid properties
    angularGridAddress!: AngularGridInstance;
    columnDefinitionsAddress: Column[] = [];
    gridOptionsAddress: GridOption = {};
    datasetAddress: any[] = [];

    // Sale Grid properties
    angularGridSale!: AngularGridInstance;
    columnDefinitionsSale: Column[] = [];
    gridOptionsSale: GridOption = {};
    datasetSale: any[] = [];

    sizeTbDetail: any = '0';

    menuBars: any[] = [];

    selectedRow: any = null;
    selectedId: number = 0;
    isEditMode: boolean = false;
    filterTeamData: any[] = [];
    filterSaleUserData: any[] = [];
    selectedIds: number[] = [];
    selectedRows: any[] = [];

    filters: any = {
        teamId: 0,
        userId: 0,
        keyword: '',
    };

    // Formatters
    private dateFormatter = (row: number, cell: number, value: any) => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    constructor(
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private customerService: CustomerServiceService,
        private viewPokhService: ViewPokhService
    ) { }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => {
                    this.openModal();
                }
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => {
                    this.onEdit();
                }
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => {
                    this.onDelete();
                }
            },
            {
                label: 'Ngành nghề',
                icon: 'fa-solid fa-industry fa-lg text-info',
                command: () => {
                    this.openMajorModal();
                }
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.exportExcel();
                }
            }
        ];
    }

    ngOnInit(): void {
        this.initMenuBar();
        this.initMainGrid();
        this.initContactGrid();
        this.initAddressGrid();
        this.initSaleGrid();
        this.getEmployeeData();
        this.getTeamData();
    }

    ngAfterViewInit(): void { }

    //#region Grid Initialization
    initMainGrid(): void {
        this.columnDefinitionsMain = [
            // { id: 'ID', name: 'ID', field: 'ID', width: 80, minWidth: 80, sortable: true, excludeFromExport: true },
            { id: 'CustomerCode', name: 'Mã khách', field: 'CustomerCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CustomerShortName', name: 'Tên kí hiệu', field: 'CustomerShortName', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CustomerName', name: 'Tên khách', field: 'CustomerName', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'Address', name: 'Địa chỉ', field: 'Address', width: 350, minWidth: 350, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'TaxCode', name: 'Mã số thuế', field: 'TaxCode', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'TypeName', name: 'Loại hình', field: 'TypeName', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'NoteDelivery', name: 'Lưu ý giao hàng', field: 'NoteDelivery', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'NoteVoucher', name: 'Lưu ý chứng từ', field: 'NoteVoucher', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'CheckVoucher', name: 'Đầu mối gửi check chứng từ', field: 'CheckVoucher', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'HardCopyVoucher', name: 'Đầu mối gửi chứng từ bản cứng', field: 'HardCopyVoucher', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
            { id: 'ClosingDateDebt', name: 'Ngày chốt công nợ', field: 'ClosingDateDebt', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundDate'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'Debt', name: 'Công nợ', field: 'Debt', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] } },
            { id: 'AdressStock', name: 'Địa chỉ giao hàng', field: 'AdressStock', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
        ];

        this.gridOptionsMain = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-main',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideSelectAllCheckbox: false,
            },
            rowSelectionOptions: {
                selectActiveRow: false,
            },
            multiSelect: true,
            multiColumnSort: true,
            rowHeight: 35,
            headerRowHeight: 40,
        };
    }

    initContactGrid(): void {
        this.columnDefinitionsContact = [
            // { id: 'ID', name: 'ID', field: 'ID', width: 80, minWidth: 80, excludeFromExport: true },
            { id: 'ContactName', name: 'Tên liên hệ', field: 'ContactName', width: 150, minWidth: 150, sortable: true },
            { id: 'CustomerPart', name: 'Bộ phận', field: 'CustomerPart', width: 120, minWidth: 120, sortable: true },
            { id: 'CustomerPosition', name: 'Chức vụ', field: 'CustomerPosition', width: 120, minWidth: 120, sortable: true },
            { id: 'CustomerTeam', name: 'Team', field: 'CustomerTeam', width: 100, minWidth: 100, sortable: true },
        ];

        this.gridOptionsContact = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-contact',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            rowHeight: 30,
            headerRowHeight: 35,
            enablePagination: false,
        };
    }

    initAddressGrid(): void {
        this.columnDefinitionsAddress = [
            // { id: 'ID', name: 'ID', field: 'ID', width: 80, minWidth: 80, excludeFromExport: true },
            { id: 'Address', name: 'Địa chỉ giao hàng', field: 'Address', width: 350, minWidth: 350, sortable: true },
        ];

        this.gridOptionsAddress = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-address',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            rowHeight: 30,
            headerRowHeight: 35,
            enablePagination: false,
        };
    }

    initSaleGrid(): void {
        this.columnDefinitionsSale = [
            // { id: 'ID', name: 'ID', field: 'ID', width: 80, minWidth: 80, excludeFromExport: true },
            { id: 'FullName', name: 'Nhân viên Sale', field: 'FullName', width: 200, minWidth: 200, sortable: true },
        ];

        this.gridOptionsSale = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-sale',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            rowHeight: 30,
            headerRowHeight: 35,
            enablePagination: false,
            forceFitColumns: true,
        };
    }
    //#endregion

    //#region Grid Ready Handlers
    angularGridReadyMain(angularGrid: AngularGridInstance): void {
        this.angularGridMain = angularGrid;
        this.loadMainData();

        // Handle row selection change
        this.angularGridMain.slickGrid?.onSelectedRowsChanged.subscribe((e: any, args: any) => {
            const selectedRowIndices = args.rows || [];
            const grid = args.grid;
            this.selectedRows = selectedRowIndices.map((rowIdx: number) => grid.getDataItem(rowIdx)).filter((item: any) => item);
            this.selectedIds = this.selectedRows.map((row: any) => row.ID);
        });

        // Handle row click
        this.angularGridMain.slickGrid?.onClick.subscribe((e: any, args: any) => {
            const rowData = args.grid.getDataItem(args.row);
            if (rowData) {
                this.sizeTbDetail = '30%';
                this.selectedRow = rowData;
                this.selectedId = rowData.ID;
                this.getContactAndAddress(this.selectedId);
            }
        });

        // Handle row double click
        this.angularGridMain.slickGrid?.onDblClick.subscribe((e: any, args: any) => {
            const rowData = args.grid.getDataItem(args.row);
            if (rowData) {
                this.selectedId = rowData.ID;
                this.isEditMode = true;
                this.openModal();
            }
        });
    }

    angularGridReadyContact(angularGrid: AngularGridInstance): void {
        this.angularGridContact = angularGrid;
    }

    angularGridReadyAddress(angularGrid: AngularGridInstance): void {
        this.angularGridAddress = angularGrid;
    }

    angularGridReadySale(angularGrid: AngularGridInstance): void {
        this.angularGridSale = angularGrid;
    }
    //#endregion

    //#region Data Loading
    loadMainData(): void {
        const request = {
            filterText: this.filters.keyword.trim() || '',
            groupId: this.filters.teamId || 0,
            employeeId: this.filters.userId || 0,
            page: 1,
            size: 1000, // Load all data, pagination handled client-side
        };

        this.customerService.getMainData2(request).subscribe({
            next: (response: any) => {
                if (response?.data?.data) {
                    this.datasetMain = response.data.data.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index
                    }));
                }
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu khách hàng');
            }
        });
    }

    searchData(): void {
        this.loadMainData();
    }

    getTeamData(): void {
        this.viewPokhService.loadGroupSale().subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.filterTeamData = response.data;
                }
            },
            error: (error: any) => { }
        });
    }

    getEmployeeData(): void {
        this.customerService.getEmployees().subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.filterSaleUserData = response.data;
                }
            },
            error: (error) => { }
        });
    }

    getContactAndAddress(customerId: number): void {
        this.customerService.getContactAndAddress(customerId).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.datasetContact = (response.data.contact || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index
                    }));
                    this.datasetAddress = (response.data.address || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index
                    }));
                    this.datasetSale = (response.data.employee || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index
                    }));
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi tải dữ liệu: ' + error);
            }
        });
    }
    //#endregion

    //#region Modal Handlers
    openModal() {
        const modalRef = this.modalService.open(CustomerDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.EditID = this.selectedId;
        modalRef.componentInstance.isEditMode = this.isEditMode;
        modalRef.result.then(
            (result) => {
                if (result.success && result.reloadData) {
                    this.selectedRow = [];
                    this.selectedId = 0;
                    this.isEditMode = false;
                    this.loadMainData();
                } else {
                    this.isEditMode = false;
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    openMajorModal() {
        const modalRef = this.modalService.open(CustomerMajorComponent, {
            centered: true,
            backdrop: 'static',
            size: 'xl',
        });
        modalRef.result.then(
            (result) => { },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    closePanel() {
        this.sizeTbDetail = '0';
    }

    setDefautSearch() {
        this.filters.keyword = "";
        this.filters.userId = 0;
        this.filters.teamId = 0;
    }
    //#endregion

    //#region CRUD Operations
    onEdit(): void {
        if (!this.selectedRows || this.selectedRows.length === 0 || this.selectedRows.length > 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một khách hàng để sửa!');
            return;
        }
        this.selectedId = this.selectedRows[0].ID;
        this.isEditMode = true;
        this.openModal();
    }

    onDelete() {
        if (!this.selectedRows || this.selectedRows.length === 0) {
            this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một khách hàng để xóa!');
            return;
        }
        const isDeleted = this.selectedRows.map((item: any) => item.ID);

        let nameDisplay = '';
        this.selectedRows.forEach((item: any) => {
            nameDisplay += item.CustomerName + ',';
        });

        if (this.selectedRows.length > 10) {
            if (nameDisplay.length > 10) {
                nameDisplay = nameDisplay.slice(0, 10) + '...';
            }
            nameDisplay += ` và ${this.selectedRows.length - 1} khách hàng khác`;
        } else {
            if (nameDisplay.length > 20) {
                nameDisplay = nameDisplay.slice(0, 20) + '...';
            }
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa khách hàng <b>[${nameDisplay}]</b> không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                this.customerService.deleteMultiple(isDeleted).subscribe({
                    next: (res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                            this.loadMainData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không thể xóa dữ liệu');
                        }
                    },
                    error: (err: any) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err?.message || 'Không thể xóa dữ liệu');
                    },
                });
            },
        });
    }

    async exportExcel() {
        this.customerService.exportExcel().subscribe({
            next: (response: Blob) => {
                const blob = new Blob([response], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `DanhSachKhachHang_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();

                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                this.notification.error('Thông báo', 'Lỗi khi tải dữ liệu: ' + error.message);
            },
        });
    }
    //#endregion
}
