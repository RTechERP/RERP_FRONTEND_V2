import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { PermissionService } from '../../../../../services/permission.service';
import { HRRecruitmentApplicationService } from './hr-recruitment-application.service';
import { HomeLayoutCandidateComponent } from '../home-layout-candidate/home-layout-candidate.component';

@Component({
    selector: 'app-hr-recruitment-application',
    imports: [
        CommonModule,
        FormsModule,
        AngularSlickgridModule,
        NzSpinModule,
        NzSplitterModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzModalModule,
        NzInputModule,
        Menubar,
        HomeLayoutCandidateComponent,
    ],
    templateUrl: './hr-recruitment-application.component.html',
    styleUrl: './hr-recruitment-application.component.css',
    standalone: true,
})
export class HRRecruitmentApplicationComponent implements OnInit {

    //#region Khai báo biến
    menuBars: MenuItem[] = [];
    isLoading = false;
    isMobile = window.innerWidth <= 768;
    isShowModal = false;
    isShowDetail = false;

    // Candidate được chọn để xem phiếu
    selectedCandidateID = 0;
    selectedCandidateName = '';
    selectedChucVu = '';
    selectedRowItem: any = null;

    // Grid chính
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions!: GridOption;
    dataset: any[] = [];

    // ID động cho grid
    // ID cho grid
    gridIdMain = 'grvApplicationForm';

    filterTimeout: any;
    chucVuID = 0;
    filterText = '';
    //#endregion

    constructor(
        private notification: NzNotificationService,
        private permissionService: PermissionService,
        private applicationService: HRRecruitmentApplicationService,
        private modal: NzModalService,
    ) { }

    @HostListener('window:resize')
    onWindowResize() {
        this.isMobile = window.innerWidth <= 768;
    }

    ngOnInit(): void {
        this.initMenuBar();
        this.initGrid();
        this.loadData();
    }

    //#region Menu bar
    initMenuBar() {
        this.menuBars = [
            {
                label: 'Tải lại',
                icon: 'fa-solid fa-rotate fa-lg text-primary',
                command: () => {
                    this.loadData();
                },
            },
            {
                label: 'Xem phiếu',
                icon: 'fa-solid fa-file-lines fa-lg text-success',
                command: () => {
                    this.viewApplicationForm();
                },
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => {
                    this.onDelete();
                },
            },
        ];
    }
    //#endregion

    //#region Grid chính - Danh sách tờ khai
    initGrid() {
        this.columnDefinitions = [
            {
                id: 'STT', field: 'STT', name: 'STT',
                width: 80, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-center',
            },
            {
                id: 'FullName', field: 'FullName', name: 'Họ và tên',
                width: 250, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'DateOfBirth', field: 'DateOfBirth', name: 'Ngày sinh',
                width: 120, sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center',
            },
            {
                id: 'GenderText', field: 'GenderText', name: 'Giới tính',
                width: 100, sortable: true, filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
                cssClass: 'text-center',
            },
            {
                id: 'PhoneNumber', field: 'Mobile', name: 'Số điện thoại',
                width: 150, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Email', field: 'Email', name: 'Email',
                width: 250, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'PositionName', field: 'ChucVu', name: 'Vị trí ứng tuyển',
                width: 200, sortable: true, filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
            },
            {
                id: 'PermanentAddress', field: 'PermanentResidence', name: 'Hộ khẩu thường trú',
                width: 300, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CurrentAddress', field: 'CurrentAddress', name: 'Địa chỉ hiện tại',
                width: 300, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'IdentityCardNumber', field: 'NumberCCCD', name: 'Số CCCD/CMND',
                width: 150, sortable: true, filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'MaritalStatusText', field: 'MaritalStatusText', name: 'Tình trạng hôn nhân',
                width: 150, sortable: true, filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
            },
            {
                id: 'ExpectedSalary', field: 'AcceptedSalary', name: 'Mức lương mong muốn',
                width: 180, sortable: true, filterable: true,
                formatter: Formatters.decimal, params: { minDecimal: 0, maxDecimal: 0 },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end',
            },
            {
                id: 'AvailableStartDate', field: 'DateOfStart', name: 'Ngày có thể bắt đầu',
                width: 160, sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center',
            },
            {
                id: 'CreatedDate', field: 'CreatedDate', name: 'Ngày tạo',
                width: 130, sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center',
            },
        ];

        this.gridOptions = {
            enableAutoResize: false,
            autoResize: {
                container: '.grid-container-application',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false,
            },
            checkboxSelector: {
                hideInFilterHeaderRow: true,
                hideInColumnTitleRow: false,
                applySelectOnAllPages: true,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            frozenColumn: this.isMobile ? 0 : 3,
            showFooterRow: true,
            createFooterRow: true,
            formatterOptions: {
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: false,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ',',
            },
        };
    }
    //#endregion

    //#region Grid ready handlers
    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;

        angularGrid.dataView.onRowCountChanged.subscribe(() => {
            clearTimeout(this.filterTimeout);
            this.filterTimeout = setTimeout(() => {
                this.applyDistinctFilters(this.angularGrid);
                this.updateFooterRow();
            }, 2000);
        });

        setTimeout(() => {
            this.applyDistinctFilters(this.angularGrid);
            this.updateFooterRow();
        }, 100);
    }
    //#endregion

    //#region Load data
    loadData() {
        this.isLoading = true;
        this.selectedRowItem = null;
        this.applicationService.getAllApplicationForm(this.chucVuID, this.filterText).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    const dataList = res.data || [];
                    this.dataset = dataList.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID ?? item.id ?? `row_${index}`,
                        STT: index + 1,
                        GenderText: item.Gender === 1 ? 'Nam' : (item.Gender === 2 ? 'Nữ' : ''),
                        MaritalStatusText: item.MaritalStatus === 1 ? 'Độc thân' : (item.MaritalStatus === 2 ? 'Đã kết hôn' : ''),
                    }));

                    setTimeout(() => {
                        this.applyDistinctFilters(this.angularGrid);
                        this.updateFooterRow();
                    }, 100);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy dữ liệu thất bại');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                const msg = err?.error?.message || err?.message || 'Lỗi khi lấy dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, msg);
                console.error('Lỗi lấy dữ liệu:', err);
            },
        });
    }
    //#endregion

    //#region Sự kiện grid
    onCellClicked(e: Event, args: any) {
        if (args.cell !== 0) {
            this.angularGrid?.slickGrid?.setSelectedRows([args.row]);
            this.selectedRowItem = args.grid.getDataItem(args.row);

            // Mở detail panel bên phải
            if (this.selectedRowItem) {
                const candidateID = this.selectedRowItem.HRRecruitmentCandidateID || this.selectedRowItem.ID || 0;
                if (candidateID > 0) {
                    this.selectedCandidateID = candidateID;
                    this.selectedCandidateName = this.selectedRowItem.FullName || '';
                    this.selectedChucVu = this.selectedRowItem.ChucVu || '';
                    this.isShowDetail = true;
                    // Resize grid sau khi splitter thay đổi
                    setTimeout(() => {
                        this.angularGrid?.resizerService?.resizeGrid();
                    }, 100);
                }
            }
        }
    }

    closeDetail() {
        this.isShowDetail = false;
        this.selectedCandidateID = 0;
        this.selectedCandidateName = '';
        this.selectedChucVu = '';
        // Resize grid khi đóng panel
        setTimeout(() => {
            this.angularGrid?.resizerService?.resizeGrid();
        }, 100);
    }

    viewApplicationForm() {
        // Mở fullscreen modal - kiểm tra chỉ cho phép chọn đúng 1 dòng
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length !== 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để xem phiếu!');
            return;
        }

        if (!this.selectedRowItem) {
            this.selectedRowItem = this.angularGrid.slickGrid.getDataItem(selectedRows[0]);
        }

        if (!this.selectedRowItem) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên!');
            return;
        }

        this.selectedCandidateID = this.selectedRowItem.HRRecruitmentCandidateID || this.selectedRowItem.ID || 0;
        this.selectedCandidateName = this.selectedRowItem.FullName || '';
        this.selectedChucVu = this.selectedRowItem.ChucVu || '';
        if (this.selectedCandidateID > 0) {
            this.isShowModal = true;
        } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên');
        }
    }

    onDelete() {
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng để xóa!');
            return;
        }

        const ids = selectedRows.map((index: number) => {
            const item = this.angularGrid.slickGrid.getDataItem(index);
            return item?.ID || item?.id;
        }).filter((id: any) => id && typeof id === 'number');

        if (ids.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID hợp lệ để xóa!');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} bản ghi đã chọn không?`,
            nzOkText: 'Xóa',
            nzOkDanger: true,
            nzOnOk: () => {
                this.isLoading = true;
                this.applicationService.deleteApplicationForm(ids).subscribe({
                    next: (res: any) => {
                        this.isLoading = false;
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Xóa thành công');
                            this.loadData();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
                        }
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi khi xóa dữ liệu');
                    }
                });
            },
            nzCancelText: 'Hủy'
        });
    }
    //#endregion

    //#region Footer & Filters
    updateFooterRow() {
        if (this.angularGrid && this.angularGrid.slickGrid) {
            const items = (this.angularGrid.dataView?.getFilteredItems?.() as any[]) || this.dataset;
            const count = (items || []).filter((item) => item.STT).length;

            const columns = this.angularGrid.slickGrid.getColumns();
            columns.forEach((col: any) => {
                const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
                if (!footerCell) return;
                if (col.id === 'FullName') {
                    footerCell.innerHTML = `<b>Tổng số: ${count}</b>`;
                }
            });
        }
    }

    applyDistinctFilters(angularGrid: AngularGridInstance): void {
        if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;
        const data = angularGrid.dataView.getItems() as any[];
        if (!data || data.length === 0) return;

        const getUniqueValues = (
            items: any[],
            field: string
        ): Array<{ value: any; label: string }> => {
            const map = new Map<string, { value: any; label: string }>();
            items.forEach((row: any) => {
                const value = row?.[field];
                if (value === null || value === undefined || value === '') return;
                const key = `${typeof value}:${String(value)}`;
                if (!map.has(key)) {
                    map.set(key, { value, label: String(value) });
                }
            });
            return Array.from(map.values()).sort((a, b) =>
                a.label.localeCompare(b.label)
            );
        };

        const columns = angularGrid.slickGrid.getColumns();
        if (columns) {
            columns.forEach((column: any) => {
                if (column.filter && column.filter.model === Filters['multipleSelect']) {
                    const field = column.field;
                    if (!field) return;
                    column.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        if (this.columnDefinitions) {
            this.columnDefinitions.forEach((colDef: any) => {
                if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
                    const field = colDef.field;
                    if (!field) return;
                    colDef.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        const updatedColumns = angularGrid.slickGrid.getColumns();
        angularGrid.slickGrid.setColumns(updatedColumns);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
        this.updateFooterRow();
    }
    //#endregion
}
