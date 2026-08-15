import { ElementRef, inject, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
    AfterViewInit,
    Component,
    OnInit
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule as PButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MenubarModule } from 'primeng/menubar';
import { AssetsManagementService } from './ts-asset-management-service/ts-asset-management.service';
import { AssetStatusService } from '../ts-asset-status/ts-asset-status-service/ts-asset-status.service';
import { NzModalService } from 'ng-zorro-antd/modal';

// Missing modal component imports
import { TsAssetManagementFormComponent } from './ts-asset-management-form/ts-asset-management-form.component';
import { TsAssetManagementReportLossFormComponent } from './ts-asset-management-report-loss-form/ts-asset-management-report-loss-form.component';
import { TsAssetRepairFormComponent } from './ts-asset-repair-form/ts-asset-repair-form.component';
import { TsAssetReuseFormComponent } from './ts-asset-reuse-form/ts-asset-reuse-form.component';
import { TsAssetManagementReportBorkenFormComponent } from './ts-asset-management-report-borken-form/ts-asset-management-report-borken-form.component';
import { TsAssetProposeLiquidationFormComponent } from './ts-asset-propose-liquidation-form/ts-asset-propose-liquidation-form.component';
import { TsAssetLiquidationComponent } from './ts-asset-liquidation/ts-asset-liquidation.component';
import { TsAssetManagementImportExcelComponent } from './ts-asset-management-import-excel/ts-asset-management-import-excel.component';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
@Component({
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzRadioModule,
        NzSpaceModule,
        NzLayoutModule,
        NzFlexModule,
        NzDrawerModule,
        NzSplitterModule,
        NzGridModule,
        NzDatePickerModule,
        NzAutocompleteModule,
        NzInputModule,
        NzSelectModule,
        NzTableModule,
        NzTabsModule,
        NgbModalModule,
        HasPermissionDirective,
        NzModalModule,
        NzDropdownModule,
        NzSpinModule,
        NzFormModule,
        MenubarModule,
        TableModule,
        PButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        MultiSelectModule,
        CheckboxModule,
        ConfirmDialogModule,
        SelectModule,
        ContextMenuModule
    ],
    providers: [ConfirmationService],
    selector: 'app-ts-asset-management',
    templateUrl: './ts-asset-management.component.html',
    styleUrls: ['./ts-asset-management.component.css'],
})
export class TsAssetManagementComponent implements OnInit, AfterViewInit {
    @ViewChild('dt') dtMaster: Table | undefined;
    @ViewChild('dtDetail') dtDetail: Table | undefined;

    // Datasets
    dataset: any[] = [];
    datasetDetail: any[] = [];

    public detailTabTitle: string = 'Thông tin cấp phát biên bản:';
    selectedRows: any[] = [];
    selectedContextRow: any;
    contextMenuItems: MenuItem[] = [];

    // Status Color Map for PrimeNG Badges
    statusColorMap: { [key: number]: string } = {
        1: '#d1d5db', // Chưa sử dụng (Gray)
        2: '#3b82f6', // Đang sử dụng (Blue) - Cấp phát
        3: '#ef4444', // Báo hỏng (Red)
        4: '#f59e0b', // Đang sửa chữa (Orange)
        5: '#10b981', // Đã sửa xong (Green)
        6: '#8b5cf6', // Đã thanh lý (Purple)
        7: '#6b7280'  // Thu hồi (Dark Gray)
    };
    modalData: any = [];
    private ngbModal = inject(NgbModal);
    assetManagementDetail: any[] = [];
    assetData: any[] = [];
    isSearchVisible: boolean = false;
    emPloyeeLists: any[] = [];
    dateStart: string = '';
    dateEnd: string = '';
    employeeID: number | null = null;
    status: number[] = [];
    isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

    department: number[] = [];
    sizeSearch: string = '0';
    filterText: string = '';
    selectedEmployee: any = null;
    assetDate: string = '';
    departmentData: any[] = [];
    statusData: any[] = [];
    repairData: any[] = [];
    isLoading: boolean = false;
    private resizeHandler = () => this.onResize();

    // Menu bars
    menuBars: any[] = [];
    showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

    get shouldShowSearchBar(): boolean {
        return this.showSearchBar;
    }

    constructor(
        private ngZone: NgZone,
        private modal: NzModalService,
        private notification: NzNotificationService,
        private assetManagementService: AssetsManagementService,
        private assetManagementPersonalService: TsAssetManagementPersonalService,
        private assetStatusService: AssetStatusService
    ) { }
    ngOnInit() {
        this.initializeDates();
        this.initMenuBar();
        this.initContextMenu();
        this.getAssetmanagement();
    }

    initContextMenu() {
        this.contextMenuItems = [
            {
                label: 'Xem lịch sử thay đổi',
                icon: 'fa-solid fa-clock-rotate-left text-primary',
                command: () => this.openAssetLogModal(this.selectedContextRow)
            }
        ];
    }

    openAssetLogModal(row: any) {
        if (!row || !row.ID) {
            this.notification.warning('Thông báo', 'Dữ liệu tài sản không hợp lệ!');
            return;
        }
        import('./asset-log/asset-log.component').then((m) => {
            const modalRef = this.modal.create({
                nzTitle: 'Lịch sử thay đổi mã tài sản ' + (row.TSCodeNCC || ''),
                nzContent: m.AssetLogComponent,
                nzWidth: '1000px',
                nzFooter: null,
                nzStyle: { top: '20px' },
                nzBodyStyle: {
                    height: 'calc(100vh - 100px)',
                    overflowY: 'auto',
                    padding: '0 !important',
                },
            });
            if (modalRef.componentInstance) {
                modalRef.componentInstance.assetID = row.ID;
            }
        });
    }

    /** Helper function to format date to yyyy-MM-dd for HTML date input */
    private formatDateToString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /** Initialize default dates */
    private initializeDates(): void {
        const today = new Date();
        const dateStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const dateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.dateStart = this.formatDateToString(dateStart);
        this.dateEnd = this.formatDateToString(dateEnd);
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-plus fa-lg text-success',
                visible: true,
                command: () => {
                    this.onAddAsset();
                }
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
                visible: true,
                command: () => {
                    this.onEitAsset();
                }
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                visible: true,
                command: () => {
                    this.onDeleteAsset();
                }
            },
            {
                label: 'Báo mất',
                icon: 'fa-solid fa-magnifying-glass-minus fa-lg text-warning',
                visible: true,
                command: () => {
                    this.onReportLoss();
                }
            },
            {
                label: 'Báo hỏng',
                icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                visible: true,
                command: () => {
                    this.onReportBroken();
                }
            },
            {
                label: 'Sửa chữa, bảo dưỡng',
                icon: 'fa-solid fa-screwdriver-wrench fa-lg text-info',
                visible: true,
                command: () => {
                    this.onRepaireAsset();
                }
            },
            {
                label: 'Đưa vào sử dụng lại',
                icon: 'fa-solid fa-rotate-right fa-lg text-success',
                visible: true,
                command: () => {
                    this.onReuseAsset();
                }
            },
            {
                label: 'Đề nghị thanh lí',
                icon: 'fa-solid fa-file-invoice fa-lg text-warning',
                visible: true,
                command: () => {
                    this.onReportLiquidation();
                }
            },
            {
                label: 'Thanh lí',
                icon: 'fa-solid fa-file-circle-check fa-lg text-primary',
                visible: true,
                command: () => {
                    this.onLiquidation();
                }
            },
            {
                label: 'Nhập Excel',
                icon: 'fa-solid fa-file-import fa-lg text-info',
                visible: true,
                command: () => {
                    this.openModalImportExcel();
                }
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                visible: true,
                command: () => {
                    this.onExportExcel();
                }
            }
        ];
    }

    ngAfterViewInit(): void {
        this.updateIsMobile();
        window.addEventListener('resize', this.resizeHandler);


        this.getListEmployee();
        this.getStatus();
        this.getDepartment();
    }

    /** Hàm xác định đang là mobile hay desktop */
    private updateIsMobile() {
        this.isMobile = window.innerWidth <= 768;
    }
    private onResize() {
        this.updateIsMobile();
    }

    getAssetmanagement() {
        this.isLoading = true;
        const statusString =
            this.status.length > 0 ? this.status.join(',') : '0,1,2,3,4,5,6,7,8';
        const departmentString =
            this.department.length > 0
                ? this.department.join(',')
                : '';

        const request = {
            filterText: this.filterText || '',
            pageNumber: 1,
            pageSize: 10000,
            dateStart: this.dateStart || '2024-05-22',
            dateEnd: this.dateEnd || '2027-05-22',
            status: statusString,
            department: departmentString,
        };
        this.assetManagementService.getAsset(request).subscribe({
            next: (response) => {
                this.assetData = response.data?.assets || [];
                this.dataset = this.assetData.map((item, index) => ({
                    ...item,
                    id: item.ID,
                    STT: index + 1,
                    statusColor: this.getStatusColor(item.StatusID || item.Status)
                }));
                console.log('this.dataset:', this.dataset);

                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Lỗi khi lấy dữ liệu tài sản:', err);
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
            },
        });
    }
    clearAllFilters(): void {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.dateStart = this.formatDateToString(firstDay);
        this.dateEnd = this.formatDateToString(lastDay);
        this.employeeID = null;
        this.filterText = '';
        this.status = [];
        this.department = [];
        this.getAssetmanagement();
    }

    getDepartment() {
        this.assetManagementService.getDepartment().subscribe({
            next: (response: any) => {
                this.departmentData = response.data || [];
                console.log(this.departmentData);
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu tài sản:', err);
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
            },
        });
    }
    getStatus() {
        this.assetStatusService.getStatus().subscribe({
            next: (response: any) => {
                this.statusData = response.data || [];
                console.log(this.statusData);
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu tài sản:', err);
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
            },
        });
    }
    getListEmployee() {
        const request = {
            status: 0,
            departmentid: 0,
            keyword: '',
        };
        this.assetManagementPersonalService
            .getEmployee(request)
            .subscribe({
                next: (respon: any) => {
                    this.emPloyeeLists = respon.employees;
                    console.log(this.emPloyeeLists);
                    this.employeeID = null;
                    this.selectedEmployee = null;
                },
                error: (err) => {
                    console.error('Lỗi khi lấy danh sách nhân viên:', err);
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
                }
            });
    }
    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }

    ToggleSearchPanelNew(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showSearchBar = !this.showSearchBar;
    }

    onFilterChange(): void {
        this.getAssetmanagement();
    }
    /** Lấy màu sắc dựa trên ID hoặc tên trạng thái */
    getStatusColor(statusIdOrName: any): string {
        const colorMap: Record<any, string> = {
            1: '#9ca3af', // Chưa sử dụng (gray)
            2: '#22c55e', // Đang sử dụng (green)
            3: '#f97316', // Sửa chữa (orange)
            4: '#ef4444', // Mất (red)
            5: '#ef4444', // Hỏng (red)
            6: '#3b82f6', // Thanh lý (blue)
            7: '#a855f7', // Đề nghị thanh lý (purple)
            'Chưa sử dụng': '#9ca3af',
            'Đang sử dụng': '#22c55e',
            'Sửa chữa': '#f97316',
            'Mất': '#ef4444',
            'Hỏng': '#ef4444',
            'Thanh lý': '#3b82f6',
            'Đề nghị thanh lý': '#a855f7'
        };
        return colorMap[statusIdOrName] || '#6b7280';
    }

    onRowSelect(event: any) {
        const item = event.data;
        if (item) {
            this.detailTabTitle = `Thông tin sử dụng tài sản: ${item['TSCodeNCC']}`;
            const ID = item['ID'];
            this.assetManagementService
                .getAssetAllocationDetail(ID)
                .subscribe({
                    next: (respon) => {
                        this.assetManagementDetail = respon.data.assetsAllocation;
                        this.datasetDetail = this.assetManagementDetail.map((item, index) => ({
                            ...item,
                            id: item.ID || index,
                            statusColor: this.getStatusColor(item.StatusID || item.Status)
                        }));
                    },
                    error: (err) => {
                        console.error('Lỗi khi lấy chi tiết cấp phát:', err);
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
                    }
                });
        }
    }

    onRowUnselect() {
        if (this.selectedRows.length === 0) {
            this.datasetDetail = [];
            this.detailTabTitle = 'Thông tin cấp phát biên bản:';
        }
    }

    private getSingleSelectedAsset(actionText: string): any | null {
        if (!this.selectedRows || this.selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Vui lòng chọn một tài sản để ${actionText}!`
            );
            return null;
        }

        if (this.selectedRows.length > 1) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Vui lòng chỉ chọn một tài sản để ${actionText}!`
            );
            return null;
        }

        return { ...this.selectedRows[0] };
    }

    getSelectedIds(): number[] {
        return this.selectedRows ? this.selectedRows.map((x: any) => x.ID) : [];
    }

    onDeleteAsset() {
        if (!this.selectedRows || this.selectedRows.length === 0) {
            this.notification.warning('Cảnh báo', 'Chưa chọn tài sản để xóa');
            return;
        }

        // Kiểm tra tài sản đang sử dụng
        const assetsInUse = this.selectedRows.filter((x: any) =>
            x.Status === 'Đang sử dụng' || x.StatusID === 2
        );

        if (assetsInUse.length > 0) {
            const inUseCodes = assetsInUse.map((x: any) => x.TSCodeNCC).join(', ');
            this.notification.warning(
                'Cảnh báo',
                `Không thể xóa tài sản đang sử dụng. Các tài sản sau đang được sử dụng: ${inUseCodes}`
            );
            return;
        }

        const selectedIds = this.selectedRows.map((x: any) => x.ID);
        const selectedCodes = this.selectedRows.map((x: any) => x.TSCodeNCC);
        const codesText = selectedCodes.join(', ');

        this.modal.confirm({
            nzTitle: `Bạn có chắc muốn xóa các tài sản sau: <b>${codesText}</b>?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const assetManagements = selectedIds.map((id: number) => ({
                    ID: id,
                    IsDeleted: true,
                }));

                const asset = {
                    tSAssetManagements: assetManagements,
                };

                console.log('payload', asset);

                this.assetManagementService.saveDataAsset(asset).subscribe({
                    next: () => {
                        this.notification.success('Thành công', 'Xóa tài sản thành công');
                        this.getAssetmanagement();
                    },
                    error: (err) => {
                        console.error('Lỗi khi xóa:', err);
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
                    },
                });
            },
        });
    }
    onAddAsset() {
        const initialData = {
            ID: 0,
            TSAssetCode: '',
            TSAssetName: '',
            DepartmentID: null,
            EmployeeID: null,
            SourceID: null,
            UnitID: null,
            StatusID: null,
            DateBuy: '',
            DateEffect: '',
            Note: '',
            Insurance: '',
            Seri: '',
            SpecificationsAsset: '',
            TSCodeNCC: '',
            WindowActiveStatus: null,
            OfficeActiveStatus: null,
            STT: null,
            // cái gì cần default nữa thì add vào
        };

        const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });

        modalRef.componentInstance.dataInput = initialData;

        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onEitAsset() {
        const selectedAssets = this.getSingleSelectedAsset('sửa');
        if (!selectedAssets) return;

        const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
            size: 'xl ',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = selectedAssets;
        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onReportLoss() {
        const selectedAssets = this.getSingleSelectedAsset('báo mất');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo mất!`
            );
            return;
        }
        if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo mất!`
            );
            return;
        }

        const modalRef = this.ngbModal.open(
            TsAssetManagementReportLossFormComponent,
            {
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                centered: true,
            }
        );
        modalRef.componentInstance.dataInput = selectedAssets;
        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onRepaireAsset() {
        const selectedAssets = this.getSingleSelectedAsset('sửa chữa/bảo dưỡng');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể sửa chữa bảo dưỡng!`
            );
            return;
        }
        if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể sửa chữa bảo dưỡng!`
            );
            return;
        }

        const modalRef = this.ngbModal.open(TsAssetRepairFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = selectedAssets;
        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onReuseAsset() {
        const selectedAssets = this.getSingleSelectedAsset('đưa vào sử dụng lại');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID != 5) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đang ở trạng thái ${selectedAssets.Status}, không thể đưa vào sử dụng lại!`
            );
            return;
        }

        this.assetManagementService
            .getAssetRepair(selectedAssets.ID)
            .subscribe({
                next: (respon) => {
                    this.repairData = respon.data;
                    const modalRef = this.ngbModal.open(TsAssetReuseFormComponent, {
                        size: 'xl',
                        backdrop: 'static',
                        keyboard: false,
                        centered: true,
                    });
                    modalRef.componentInstance.dataInput1 = this.repairData;
                    modalRef.componentInstance.dataInput = selectedAssets;

                    modalRef.result.then(
                        () => this.getAssetmanagement(),
                        () => { }
                    );
                },
                error: (err) => {
                    console.error('Lỗi khi lấy thông tin sửa chữa:', err);
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message);
                }
            });
    }
    onReportBroken() {
        const selectedAssets = this.getSingleSelectedAsset('báo hỏng');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID == 4) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo hỏng!`
            );
            return;
        }
        if (selectedAssets.StatusID == 3 || selectedAssets.Status == 'Hỏng') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã báo hỏng, không thể báo hỏng!`
            );
            return;
        }
        if (selectedAssets.StatusID == 7 || selectedAssets.Status == 'Thanh lý') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo hỏng!`
            );
            return;
        }

        const modalRef = this.ngbModal.open(
            TsAssetManagementReportBorkenFormComponent,
            {
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                centered: true,
            }
        );
        modalRef.componentInstance.dataInput = selectedAssets;
        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onLiquidation() {
        const selectedAssets = this.getSingleSelectedAsset('thanh lý');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID == 6 || selectedAssets.Status == 'Thanh lý') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí!`
            );
            return;
        }
        if (
            selectedAssets.StatusID != 7 ||
            selectedAssets.Status != 'Đề nghị thanh lý'
        ) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Tài sản này chưa đề nghị thanh lý, không thể thanh lí!'
            );
            return;
        }

        const modalRef = this.ngbModal.open(TsAssetLiquidationComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = selectedAssets;

        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onReportLiquidation() {
        const selectedAssets = this.getSingleSelectedAsset('đề nghị thanh lý');
        if (!selectedAssets) return;

        if (selectedAssets.StatusID === 6) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lý, không thể đề nghị thanh lý!`
            );
            return;
        }
        if (selectedAssets.StatusID === 7) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}" đã đề nghị thanh lý, không thể đề nghị thanh lý!`
            );
            return;
        }
        if (selectedAssets.StatusID === 4 || selectedAssets.Status === 'Mất') {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Tài sản có mã "${selectedAssets.TSAssetCode}"đã mất, không thể đề nghị thanh lí!`
            );
            return;
        }

        const modalRef = this.ngbModal.open(
            TsAssetProposeLiquidationFormComponent,
            {
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                centered: true,
            }
        );
        modalRef.componentInstance.dataInput = selectedAssets;

        modalRef.result.then(
            () => this.getAssetmanagement(),
            () => { }
        );
    }
    onExportExcel() {
        this.exportToExcelAdvanced();
    }
    onDisposeAsset() { }
    async exportToExcelAdvanced() {
        this.isLoading = true;
        const request = {
            filterText: this.filterText || '',
            pageNumber: 1,
            pageSize: 9999999,
            dateStart: this.dateStart || '2024-05-22',
            dateEnd: this.dateEnd || '2027-05-22',

        };

        this.assetManagementService.exportExcelAssetManagement(request).subscribe({
            next: async (res: any) => {
                this.isLoading = false;
                const exportData = res?.data || [];

                if (!exportData || exportData.length === 0) {
                    this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
                    return;
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Danh sách tài sản');

                // Header Row 1
                const row1Values = [
                    'STT', 'Mã tài sản', 'Office Active', 'Windows Active', 'Tên tài sản',
                    'Mã loại', 'Tên loại', 'Mã nguồn gốc', 'Tên nguồn gốc', 'Mã NCC',
                    'Tên NCC', 'Số Seri', 'Model', 'Số lượng', 'Tình trạng',
                    'Mô tả chi tiết', 'Đơn vị', 'Mã phòng ban', 'Phòng ban', 'Mã nhân viên',
                    'Người quản lý', 'Thời gian mua', 'Bảo hành (tháng)', 'Ngày hiệu lực',
                    'Lịch sử cấp phát', '', '', '', '',
                    'Ghi chú'
                ];

                // Header Row 2 (5 sub-columns for Lịch sử cấp phát)
                const row2Values = [
                    'STT', 'Mã tài sản', 'Office Active', 'Windows Active', 'Tên tài sản',
                    'Mã loại', 'Tên loại', 'Mã nguồn gốc', 'Tên nguồn gốc', 'Mã NCC',
                    'Tên NCC', 'Số Seri', 'Model', 'Số lượng', 'Tình trạng',
                    'Mô tả chi tiết', 'Đơn vị', 'Mã phòng ban', 'Phòng ban', 'Mã nhân viên',
                    'Người quản lý', 'Thời gian mua', 'Bảo hành (tháng)', 'Ngày hiệu lực',
                    'Hành động', 'Người giao', 'Người nhận', 'Ngày', 'Tình trạng',
                    'Ghi chú'
                ];

                worksheet.addRow(row1Values);
                worksheet.addRow(row2Values);

                // Merge single columns vertically (Row 1 & Row 2)
                const singleCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30];
                singleCols.forEach(colIndex => {
                    worksheet.mergeCells(1, colIndex, 2, colIndex);
                });

                // Merge "Lịch sử cấp phát" horizontally across columns 25..29 in Row 1
                worksheet.mergeCells(1, 25, 1, 29);

                // Column widths
                const colWidths = [
                    8, 20, 15, 15, 30, 15, 20, 15, 20, 15,
                    20, 15, 20, 10, 18, 30, 10, 15, 20, 15,
                    20, 15, 15, 15, 18, 25, 25, 15, 20, 30
                ];
                colWidths.forEach((w, idx) => {
                    worksheet.getColumn(idx + 1).width = w;
                });

                // Style header rows
                [1, 2].forEach(rNum => {
                    const row = worksheet.getRow(rNum);
                    row.font = { name: 'Times New Roman', size: 11, bold: true };
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE0E0E0' },
                        };
                        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' },
                        };
                    });
                });

                // Add data rows starting at Row 3
                let currentRowIndex = 3;

                exportData.forEach((row: any, index: number) => {
                    const parseLines = (val: string) => {
                        if (!val) return [];
                        return val.split('\n').map(x => x.trim());
                    };

                    const actions = parseLines(row.AllocationAction);
                    const delivers = parseLines(row.AllocationDeliver);
                    const receivers = parseLines(row.AllocationReceiver);
                    const dates = parseLines(row.AllocationDate);
                    const statuses = parseLines(row.AllocationStatus);

                    const maxLines = Math.max(
                        actions.length,
                        delivers.length,
                        receivers.length,
                        dates.length,
                        statuses.length
                    );

                    // Filter out invalid SQL dummy rows
                    const validEvents: Array<{ action: string; deliver: string; receiver: string; date: string; status: string }> = [];

                    for (let i = 0; i < maxLines; i++) {
                        const act = actions[i] || '';
                        const del = delivers[i] || '';
                        const rec = receivers[i] || '';
                        const dat = dates[i] || '';
                        const sta = statuses[i] || '';

                        if (act || del || rec || dat) {
                            validEvents.push({ action: act, deliver: del, receiver: rec, date: dat, status: sta });
                        }
                    }

                    const numRows = Math.max(validEvents.length, 1);
                    const startRow = currentRowIndex;
                    const endRow = startRow + numRows - 1;

                    for (let i = 0; i < numRows; i++) {
                        const isFirst = i === 0;
                        const ev = validEvents[i] || { action: '', deliver: '', receiver: '', date: '', status: '' };

                        const rowValues = [
                            isFirst ? index + 1 : '',
                            isFirst ? (row.TSCodeNCC || '') : '',
                            isFirst ? (row.OfficeActiveStatus === 1 ? 'Đã kích hoạt' : (row.OfficeActiveStatus === 0 ? 'Chưa kích hoạt' : '')) : '',
                            isFirst ? (row.WindowActiveStatus === 1 ? 'Đã kích hoạt' : (row.WindowActiveStatus === 0 ? 'Chưa kích hoạt' : '')) : '',
                            isFirst ? (row.TSAssetName || '') : '',
                            isFirst ? (row.AssetCode || '') : '',
                            isFirst ? (row.AssetType || '') : '',
                            isFirst ? (row.SourceCode || '') : '',
                            isFirst ? (row.SourceName || '') : '',
                            isFirst ? (row.SupplierCode || '') : '',
                            isFirst ? (row.SupplierName || '') : '',
                            isFirst ? (row.Seri || '') : '',
                            isFirst ? (row.Model || '') : '',
                            isFirst ? (row.Quantity ?? '') : '',
                            isFirst ? (row.Status || '') : '',
                            isFirst ? (row.SpecificationsAsset || '') : '',
                            isFirst ? (row.UnitName || '') : '',
                            isFirst ? (row.DepartmentCode || '') : '',
                            isFirst ? (row.Name || '') : '',
                            isFirst ? (row.EmployeeCode || '') : '',
                            isFirst ? (row.FullName || '') : '',
                            isFirst ? (row.DateBuy ? DateTime.fromISO(row.DateBuy).toFormat('dd/MM/yyyy') : '') : '',
                            isFirst ? (row.Insurance || '') : '',
                            isFirst ? (row.DateEffect ? DateTime.fromISO(row.DateEffect).toFormat('dd/MM/yyyy') : '') : '',
                            ev.action,
                            ev.deliver,
                            ev.receiver,
                            ev.date,
                            ev.status,
                            isFirst ? (row.Note || '') : ''
                        ];

                        const addedRow = worksheet.addRow(rowValues);
                        addedRow.eachCell({ includeEmpty: true }, (cell) => {
                            cell.font = { name: 'Times New Roman', size: 11 };
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' },
                            };
                            cell.alignment = { wrapText: true, vertical: 'top' };
                        });

                        currentRowIndex++;
                    }

                    // Merge main asset columns only if numRows > 1
                    if (numRows > 1) {
                        const mainCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30];
                        mainCols.forEach(colIndex => {
                            worksheet.mergeCells(startRow, colIndex, endRow, colIndex);
                            const masterCell = worksheet.getCell(startRow, colIndex);
                            masterCell.alignment = { wrapText: true, vertical: 'middle' };
                        });
                    }
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `danh-sach-tai-san-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi khi xuất dữ liệu Excel');
            }
        });
    }
    openModalImportExcel() {
        const modalRef = this.ngbModal.open(TsAssetManagementImportExcelComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            windowClass: 'modal-fullscreen',
        });
        modalRef.result.catch((result) => {
            if (result == true) {
            }
        });
    }


}