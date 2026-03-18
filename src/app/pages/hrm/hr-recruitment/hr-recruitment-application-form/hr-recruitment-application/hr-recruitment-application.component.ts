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

import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { PermissionService } from '../../../../../services/permission.service';
import { HRRecruitmentApplicationService } from './hr-recruitment-application.service';
import { HRRecruitmentApplicationFormService } from '../home-layout-candidate/hr-recruitment-application-form.service';
import { HomeLayoutCandidateComponent } from '../home-layout-candidate/home-layout-candidate.component';

import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../../../shared/pdf/vfs_fonts_custom.js';
import { DateTime } from 'luxon';

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
    chucVu = '';
    filterText = '';
    //#endregion

    constructor(
        private notification: NzNotificationService,
        private permissionService: PermissionService,
        private applicationService: HRRecruitmentApplicationService,
        private hrFormService: HRRecruitmentApplicationFormService,
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
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => {
                    this.loadData();
                },
            },
            {
                label: 'Xem phiếu',
                icon: 'fa-solid fa-file-lines fa-lg text-success',
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => {
                    this.viewApplicationForm();
                },
            },
            {
                label: 'In phiếu',
                icon: 'fa-solid fa-print fa-lg text-info',
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => {
                    this.printApplicationForm();
                },
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                visible: this.permissionService.hasPermission('N1,N2'),
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
                id: 'PositionName', field: 'PositionName', name: 'Vị trí ứng tuyển',
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

        // Xử lý khi thay đổi dòng được chọn (hỗ trợ cả click và phím mũi tên)
        angularGrid.slickGrid.onSelectedRowsChanged.subscribe((e, args) => {
            const selectedRows = args.rows;
            if (selectedRows.length === 1) {
                const rowItem = angularGrid.slickGrid.getDataItem(selectedRows[0]);
                if (rowItem) {
                    this.selectedRowItem = rowItem;
                    const candidateID = rowItem.HRRecruitmentCandidateID || 0;

                    if (candidateID > 0) {
                        this.selectedCandidateID = candidateID;
                        this.selectedCandidateName = rowItem.FullName || '';
                        this.selectedChucVu = rowItem.PositionName || '';

                        // Nếu đang mở detail thì panel bên phải sẽ tự cập nhật nhờ ngOnChanges trong child component
                    }
                }
            } else if (selectedRows.length === 0) {
                this.selectedRowItem = null;
                // Không đóng detail panel ở đây để tránh giật lag khi chuyển dòng, 
                // nhưng có thể reset thông tin nếu muốn
            }
        });

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
        this.applicationService.getAllApplicationForm(this.chucVu, this.filterText).subscribe({
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
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    }
                );
                console.error('Lỗi lấy dữ liệu:', err);
            },
        });
    }
    //#endregion

    //#region Sự kiện grid
    onCellClicked(e: Event, args: any) {
        // Chỉ xử lý click vào ô dữ liệu (không phải ô checkbox STT ở args.cell === 0)
        if (args.cell !== 0) {
            // Force select dòng này (onSelectedRowsChanged sẽ được trigger)
            this.angularGrid?.slickGrid?.setSelectedRows([args.row]);

            // Đảm bảo mở detail panel
            if (this.selectedCandidateID > 0) {
                if (!this.isShowDetail) {
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

        if (this.selectedRowItem) {
            this.selectedCandidateID = this.selectedRowItem.HRRecruitmentCandidateID || 0;
            this.selectedCandidateName = this.selectedRowItem.FullName || '';
            this.selectedChucVu = this.selectedRowItem.PositionName || '';
        }

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
                        this.notification.create(
                            NOTIFICATION_TYPE_MAP[err.status] || 'error',
                            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                            err?.error?.message || `${err.error}\n${err.message}`,
                            {
                                nzStyle: { whiteSpace: 'pre-line' }
                            }
                        );
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

    //#region In phiếu
    printApplicationForm() {
        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length !== 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để in phiếu!');
            return;
        }
        const rowItem = this.selectedRowItem || this.angularGrid.slickGrid.getDataItem(selectedRows[0]);
        if (!rowItem) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên!');
            return;
        }
        const candidateID = rowItem.HRRecruitmentCandidateID || rowItem.ID || 0;
        if (candidateID <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy ID ứng viên!');
            return;
        }
        this.isLoading = true;
        this.hrFormService.getCandidateInformation(candidateID).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.data) {
                    const data = res.data;
                    const mainForm = data.applicationForm?.[0] || data.HRRecruitmentApplicationForm || {};
                    if (mainForm.FileName) {
                        this.hrFormService.downloadFile(mainForm.FileName).subscribe({
                            next: async (blob: any) => {
                                try {
                                    const base64 = await this.convertBlobToDataUrl(blob);
                                    this.drawPDF(data, base64);
                                } catch (error) {
                                    console.error('Lỗi chuyển đổi ảnh:', error);
                                    this.drawPDF(data, null);
                                }
                            },
                            error: () => this.drawPDF(data, null)
                        });
                    } else {
                        this.drawPDF(data, null);
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được dữ liệu ứng viên!');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    }
                );
            }
        });
    }

    private convertBlobToDataUrl(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        resolve(reader.result as string); // Fallback to original if canvas fails
                    }
                };
                img.onerror = () => resolve(reader.result as string); // Fallback to original if image load fails
                img.src = reader.result as string;
            };
            reader.onerror = () => reject('Could not read blob');
            reader.readAsDataURL(blob);
        });
    }

    private drawPDF(data: any, imageBase64: string | null) {
        const mf = (Array.isArray(data?.applicationForm) ? data.applicationForm[0] : data?.applicationForm) || data?.HRRecruitmentApplicationForm || {};
        const emergencyContacts = data?.emergencyContacts || data?.EmergencyContacts || [];
        const educations = data?.educations || data?.Educations || [];
        const foreignLanguages = data?.foreignLanguageSkills || data?.ForeignLanguageSkills || [];
        const otherCertificates = data?.otherCertificates || data?.OtherCertificates || [];
        const workExps = data?.workingExperiences || data?.WorkExperiences || [];
        const recInfo = (Array.isArray(data?.recruitmentInfo) ? data.recruitmentInfo[0] : data?.recruitmentInfo) || {};
        const dot = (val: any, len: number = 30) => val ? val : '.'.repeat(len);
        const markCheck = (val: any) => (val === true ? '[x]' : '[ ]');
        const fmtDate = (d: any) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt.getTime()) ? '' : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };
        const fmtCur = (v: any) => (!v || v === 0) ? '' : Number(v).toLocaleString('vi-VN');
        const qualText = (l: any) => ({ 1: 'Yếu', 2: 'Trung bình', 3: 'Khá', 4: 'Giỏi', 5: 'Xuất sắc' } as any)[l] || '';
        const markLevel = (val: any, expected: number) => (Number(val) === expected ? 'X' : '');
        const makeTableLayout = (opts?: { hideVLineIndex?: number; paddingLR?: number }) => {
            const hideIdx = opts?.hideVLineIndex;
            const pad = opts?.paddingLR ?? 2;
            return {
                // outer border slightly thicker, inner borders thin & light
                hLineWidth: (i: number, node: any) => {
                    const isOuter = i === 0 || i === node.table.body.length;
                    return isOuter ? 0.75 : 0.5;
                },
                vLineWidth: (i: number, node: any) => {
                    if (hideIdx !== undefined && i === hideIdx) return 0;
                    const isOuter = i === 0 || i === node.table.widths.length;
                    return isOuter ? 0.75 : 0.5;
                },
                hLineColor: (i: number, node: any) => {
                    return '#000000';
                },
                vLineColor: (i: number, node: any) => {
                    if (hideIdx !== undefined && i === hideIdx) return '#FFFFFF';
                    return '#000000';
                },
                paddingLeft: () => pad,
                paddingRight: () => pad,
                paddingTop: () => 2,
                paddingBottom: () => 2,
            };
        };
        const d = mf.DateOfStart ? new Date(mf.DateOfStart) : null;
        console.log(mf.Gender, typeof mf.Gender);
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [35, 30, 35, 30],
            defaultStyle: { font: 'Times', fontSize: 11, lineHeight: 1.5 },
            content: [
                // === HEADER ===
                {
                    columns: [
                        {
                            image:
                                'data:image/png;base64,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',
                            width: 130,
                        },
                        {
                            stack: [
                                { text: 'CÔNG TY CỔ PHẦN RTC TECHNOLOGY VIỆT NAM', bold: true, alignment: 'center', fontSize: 13, margin: [0, 5, 0, 5] },
                                { text: 'PHIẾU THÔNG TIN ỨNG VIÊN', bold: true, alignment: 'center', fontSize: 18, margin: [0, 0, 0, 2] },
                                { text: 'Application Form', italic: true, alignment: 'center', fontSize: 12 },
                                { text: '(BM03-RTC.HR-QT01)', alignment: 'center', fontSize: 9 }
                            ], width: '*'
                        },
                        {
                            stack: [
                                imageBase64
                                    ? { image: imageBase64, width: 75, height: 100, margin: [0, 0, 0, 4] }
                                    : {
                                        canvas: [{ type: 'rect', x: 0, y: 0, w: 75, h: 95, lineWidth: 1 }],
                                        margin: [0, 0, 0, 4]
                                    },
                                { text: 'Ảnh 3 x 4', margin: [0, 4, 0, 0], fontSize: 10, alignment: 'center' }
                            ],
                            width: 80,
                            alignment: 'right'
                        }
                    ], margin: [0, 0, 0, 15]
                },
                // === INTRO ===
                { text: 'Cảm ơn bạn đã quan tâm đến thông tin tuyển dụng của RTC. Để giúp chúng tôi nắm rõ hơn các thông tin về bạn, xin bạn vui lòng điền đầy đủ các thông tin vào chỗ trống dưới đây bằng tiếng Việt hoặc tiếng Anh.', fontSize: 11 },
                { text: 'Thank you for your choosing our company. Application form is an important part in our recruitment process of RTC. Please fill in it clearly in Vietnamese or English.', fontSize: 10, italic: true, margin: [0, 2, 0, 10] },
                // === POSITION ===
                { text: 'Vị trí dự tuyển tại RTC/ Your desired position in RTC', bold: true, italics: true, fontSize: 11, margin: [0, 5, 0, 2] },
                {
                    columns: [
                        { text: 'Vị trí /Position: ', width: 'auto', bold: true },
                        { text: dot(mf.PositionName || mf.Position || mf.ChucVuName, 60), margin: [5, 0, 0, 0], bold: true }
                    ], margin: [0, 0, 0, 10]
                },
                // === I. PERSONAL DETAILS ===
                { text: 'I. Thông tin cá nhân/Personal details', bold: true, margin: [0, 5, 0, 5] },
                {
                    table: {
                        // Rộng hơn cho cột tiêu đề (Họ tên, Giới tính, Ngày sinh, ...)
                        widths: ['30%', '31%', '19%', '20%'], body: [
                            [{ text: 'Họ và tên/Full Name', bold: true }, { text: ': ' + dot(mf.FullName, 50), colSpan: 3 }, {}, {}],
                            [
                                { text: 'Giới tính/Gender' },
                                {
                                    text:
                                        ': ' +
                                        (Number(mf.Gender) === 1 ? '[x]' : '[ ]') +
                                        ' Nam/Male   ' +
                                        (Number(mf.Gender) === 2 ? '[x]' : '[ ]') +
                                        ' Nữ/Female',
                                    colSpan: 3
                                },
                                {},
                                {}
                            ],
                            [
                                { text: 'Ngày sinh/Date of birth', fontSize: 10 },
                                { text: ': ' + dot(fmtDate(mf.DateOfBirth), 15), colSpan: 3 },
                                {},
                                {}
                            ],
                            [{ text: 'Nơi sinh/Place of birth' }, { text: ': ' + dot(mf.PlaceOfBirth, 40), colSpan: 3 }, {}, {}],
                            [{ text: 'Dân tộc/Ethnic' }, { text: ': ' + dot(mf.Ethnic, 20) }, { text: 'Tôn giáo/Religion', fontSize: 10 }, { text: ': ' + dot(mf.Religion, 20) }],
                            [{ text: 'Thường trú/Permanent residence' }, { text: ': ' + dot(mf.PermanentResidence, 40), colSpan: 3 }, {}, {}],
                            [{ text: 'Nơi ở hiện nay/Current address' }, { text: ': ' + dot(mf.CurrentAddress, 40), colSpan: 3 }, {}, {}],
                            [{ text: 'Số CMND/CCCD/ID', italics: true }, { text: ': ' + dot(mf.NumberCCCD, 20) }, { text: 'ĐTCĐ/Tel #' }, { text: ': ' + dot(mf.Tel, 20) }],
                            [{ text: 'Ngày cấp/Issued on', italics: true }, { text: ': ' + dot(fmtDate(mf.IssuedOn), 15) }, { text: 'Di động/Mobile' }, { text: ': ' + dot(mf.Mobile, 20) }],
                            [{ text: 'Nơi cấp/Issued by', italics: true }, { text: ': ' + dot(mf.IssuedBy, 20) }, { text: 'Email' }, { text: ': ' + dot(mf.Email, 25) }],
                            [{ text: 'Sở thích cá nhân/Hobbies', italics: true }, { text: ': ' + dot(mf.Hobbies, 40), colSpan: 3 }, {}, {}],
                            [{ text: 'Chiều cao/Height', italics: true }, { text: ': ' + (mf.Height ? mf.Height + ' cm' : '..........') }, { text: 'Cân nặng/Weight', italics: true }, { text: ': ' + (mf.Weight ? mf.Weight + ' kg' : '..........') }],
                            [{ text: 'Tình trạng hôn nhân/Marital status', fontSize: 10 }, { text: ': ' + (mf.MaritalStatus === 1 ? '[x]' : '[ ]') + ' Độc thân/Single   ' + (mf.MaritalStatus === 2 ? '[x]' : '[ ]') + ' Đã lập gia đình/Married   ' + (mf.MaritalStatus === 3 ? '[x]' : '[ ]') + ' Ly hôn/Divorced', colSpan: 3, fontSize: 10 }, {}, {}],
                            [{ text: 'Có bị thương tật và ốm nặng\n/Injuries or serious ills:', fontSize: 10 }, { text: ': ' + (mf.InjuriesOrSeriousIll ? '[x]' : '[ ]') + ' Có/Yes   ' + (!mf.InjuriesOrSeriousIll ? '[x]' : '[ ]') + ' Không/No', fontSize: 10 }, { text: 'Khi nào/If yes-specify:', fontSize: 10 }, { text: dot(mf.IfYesSpecify, 15), fontSize: 10 }],
                            [{ text: 'Hiện tại có mang thai không (nữ)/Currently pregnant:', fontSize: 10 }, { text: ': ' + (mf.CurrentlyPregnant ? '[x]' : '[ ]') + ' Có/Yes   ' + (!mf.CurrentlyPregnant ? '[x]' : '[ ]') + ' Không/No', fontSize: 10, colSpan: 3 }, {}, {}],
                            [{ text: 'Bạn có dự kiến mang thai trong 06 tháng tới? (nữ):', fontSize: 10 }, { text: ': ' + (mf.IsPlanPregnant ? '[x]' : '[ ]') + ' Có/Yes   ' + (!mf.IsPlanPregnant ? '[x]' : '[ ]') + ' Không/No', fontSize: 10, colSpan: 3 }, {}, {}]
                        ]
                    },
                    // Hide the divider between label & value column
                    layout: makeTableLayout({ hideVLineIndex: 1, paddingLR: 3 }),
                    margin: [0, 0, 0, 10]
                },
                // === EMERGENCY CONTACTS ===
                { text: 'Người liên hệ khẩn khi cần/Emergency contact (Tối thiểu hai (2) người thân. Trong đó có một người thân là bố hoặc mẹ. Nếu đã lập gia đình thì cung cấp thông tin vợ hoặc chồng) / (At least two (2) relatives. One of whom must be a father or mother. If married, provide information about your spouse.)', fontSize: 10, italic: true, margin: [0, 5, 0, 5] },
                ...(emergencyContacts.length > 0 ? emergencyContacts : [{}, {}]).map((c: any, i: number) => ({
                    stack: [
                        { text: 'Họ và tên người liên hệ khẩn cấp ' + (i + 1) + (i === 0 ? ' (Là bố hoặc mẹ)' : '') + ' / Full name of emergency contact person ' + (i + 1) + (i === 0 ? ' (Father or Mother)' : '') + ':', fontSize: 10, bold: true, italics: true, margin: [0, 5, 0, 2] },
                        {
                            table: {
                                widths: ['60%', '40%'], body: [
                                    [{ text: 'Họ và tên/Full name : ' + dot(c.FullName, 30) }, { text: 'Quan hệ (Relation) : ' + dot(c.Relation, 15) }],
                                    [{ text: 'Điện thoại/Tel # : ' + dot(c.Tel, 30), colSpan: 2 }, {}],
                                    [{ text: 'Địa chỉ/Address : ' + dot(c.Address, 50), colSpan: 2 }, {}]
                                ]
                            },
                            layout: makeTableLayout(),
                            margin: [0, 0, 0, 5]
                        }
                    ]
                })),
                // === II. EDUCATION ===
                { text: 'II. Trình độ học vấn/Education', bold: true, italics: true, margin: [0, 10, 0, 5] },
                {
                    table: {
                        widths: ['35%', '25%', '20%', '20%'], body: [
                            [
                                { stack: [{ text: 'Tên trường đào tạo', bold: true, alignment: 'center' }, { text: '/Name of School or University', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Ngành học', bold: true, alignment: 'center' }, { text: '/ Major', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Thời gian', bold: true, alignment: 'center' }, { text: '/Graduated time', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Xếp loại', bold: true, alignment: 'center' }, { text: 'Qualification level', italic: true, alignment: 'center', fontSize: 10 }] }
                            ],
                            ...(educations.length > 0 ? educations : [{}, {}, {}]).map((e: any) => [
                                { text: e.NameOfSchool || ' ', minHeight: 15 },
                                { text: e.Major || ' ' },
                                { text: e.GraduatedTime || ' ', alignment: 'center' },
                                { text: qualText(e.QualificationLevel), alignment: 'center' }
                            ])
                        ]
                    },
                    layout: makeTableLayout()
                },
                // === FOREIGN LANGUAGES ===
                { text: 'Trình độ ngoại ngữ/Foreign language skills', bold: true, italics: true, margin: [0, 10, 0, 5] },
                {
                    table: {
                        // Fit A4 width reliably (1 col + 16 rating cols)
                        widths: ['22%', ...Array(16).fill('4.875%')],
                        body: [
                            [
                                { stack: [{ text: 'Ngoại ngữ', bold: true, alignment: 'center' }, { text: '/Foreign language', italic: true, alignment: 'center', fontSize: 10 }], rowSpan: 2 },
                                { text: 'Nghe/Listening', bold: true, alignment: 'center', colSpan: 4 }, {}, {}, {},
                                { text: 'Nói/Speaking', bold: true, alignment: 'center', colSpan: 4 }, {}, {}, {},
                                { text: 'Đọc/Reading', bold: true, alignment: 'center', colSpan: 4 }, {}, {}, {},
                                { text: 'Viết/Writing', bold: true, alignment: 'center', colSpan: 4 }, {}, {}, {}
                            ],
                            [
                                '',
                                { text: 'Tốt', fontSize: 8, alignment: 'center' },
                                { text: 'Khá', fontSize: 8, alignment: 'center' },
                                { text: 'TB', fontSize: 8, alignment: 'center' },
                                { text: 'Yếu', fontSize: 8, alignment: 'center' },
                                { text: 'Tốt', fontSize: 8, alignment: 'center' },
                                { text: 'Khá', fontSize: 8, alignment: 'center' },
                                { text: 'TB', fontSize: 8, alignment: 'center' },
                                { text: 'Yếu', fontSize: 8, alignment: 'center' },
                                { text: 'Tốt', fontSize: 8, alignment: 'center' },
                                { text: 'Khá', fontSize: 8, alignment: 'center' },
                                { text: 'TB', fontSize: 8, alignment: 'center' },
                                { text: 'Yếu', fontSize: 8, alignment: 'center' },
                                { text: 'Tốt', fontSize: 8, alignment: 'center' },
                                { text: 'Khá', fontSize: 8, alignment: 'center' },
                                { text: 'TB', fontSize: 8, alignment: 'center' },
                                { text: 'Yếu', fontSize: 8, alignment: 'center' }
                            ],
                            ...(foreignLanguages.length > 0 ? foreignLanguages : [{}, {}]).map((fl: any) => [
                                { text: fl.ForeignLanguage || fl.LanguageName || ' ', minHeight: 16 },
                                { text: markLevel(fl.Listening, 1), alignment: 'center' },
                                { text: markLevel(fl.Listening, 2), alignment: 'center' },
                                { text: markLevel(fl.Listening, 3), alignment: 'center' },
                                { text: markLevel(fl.Listening, 4), alignment: 'center' },
                                { text: markLevel(fl.Speaking, 1), alignment: 'center' },
                                { text: markLevel(fl.Speaking, 2), alignment: 'center' },
                                { text: markLevel(fl.Speaking, 3), alignment: 'center' },
                                { text: markLevel(fl.Speaking, 4), alignment: 'center' },
                                { text: markLevel(fl.Reading, 1), alignment: 'center' },
                                { text: markLevel(fl.Reading, 2), alignment: 'center' },
                                { text: markLevel(fl.Reading, 3), alignment: 'center' },
                                { text: markLevel(fl.Reading, 4), alignment: 'center' },
                                { text: markLevel(fl.Writing, 1), alignment: 'center' },
                                { text: markLevel(fl.Writing, 2), alignment: 'center' },
                                { text: markLevel(fl.Writing, 3), alignment: 'center' },
                                { text: markLevel(fl.Writing, 4), alignment: 'center' }
                            ])
                        ]
                    },
                    layout: makeTableLayout()
                },
                // === OTHER CERTIFICATES ===
                { text: 'Chứng chỉ khác/Other certificates', bold: true, italics: true, margin: [0, 10, 0, 5] },
                {
                    table: {
                        widths: ['20%', '30%', '30%', '20%'], body: [
                            [
                                { stack: [{ text: 'Ngày cấp', bold: true, alignment: 'center' }, { text: '/Date of issue', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Tên chứng chỉ', bold: true, alignment: 'center' }, { text: '/Certificates', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Đơn vị cấp chứng chỉ', bold: true, alignment: 'center' }, { text: '/Issued by', italic: true, alignment: 'center', fontSize: 10 }] },
                                { stack: [{ text: 'Xếp loại', bold: true, alignment: 'center' }, { text: '/Qualification level', italic: true, alignment: 'center', fontSize: 10 }] }
                            ],
                            ...(otherCertificates.length > 0 ? otherCertificates : [{}, {}]).map((oc: any) => [
                                { text: oc.DateOfIssue ? DateTime.fromISO(String(oc.DateOfIssue)).toFormat('dd/MM/yyyy') : ' ', alignment: 'center' },
                                { text: oc.Certificates || ' ' },
                                { text: oc.IssuedBy || ' ' },
                                { text: oc.QualificationLevel || ' ', alignment: 'center' }
                            ])
                        ]
                    },
                    layout: makeTableLayout()
                },
                // === OTHER ACTIVITIES ===
                { text: 'Các hoạt động, thành tích xã hội khác/ Other activities, achievements:', bold: true, italics: true, margin: [0, 10, 0, 2] },
                { text: mf.OtherActivities || '...................................................................................................................' },
                // === III. WORK EXPERIENCE ===
                {
                    stack: [
                        { text: 'III. Quá trình công tác (Kể cả bán thời gian) Working experiences (part-time and full-time)', bold: true, italics: true }
                    ], margin: [0, 0, 0, 5]
                },
                ...(workExps.length > 0 ? workExps : [{}, {}, {}]).map((w: any, i: number) => ({
                    table: {
                        widths: ['28%', '20%', '25%', '27%'], body: [
                            [
                                { text: 'Tên Công ty (' + (i + 1) + ')', bold: true, alignment: 'center' },
                                { text: 'Chức danh/Vị trí', bold: true, alignment: 'center' },
                                { text: 'Thời gian công tác', bold: true, alignment: 'center' },
                                { stack: [{ text: 'Cấp trên trực tiếp', bold: true, alignment: 'center' }, { text: '(Họ tên, chức danh, điện thoại)', italic: true, alignment: 'center', fontSize: 8 }] }
                            ],
                            [
                                { text: w.CompanyName || ' ', minHeight: 25 },
                                { text: w.PositionName || ' ' },
                                { text: 'Từ: ' + dot(fmtDate(w.DateStart), 10) + '\nĐến: ' + dot(fmtDate(w.DateEnd), 10), fontSize: 10, alignment: 'center' },
                                { text: (w.Leader || ' ') + (w.LeaderTel ? ' - ' + w.LeaderTel : ''), fontSize: 10 }
                            ],
                            [
                                {
                                    colSpan: 3, stack: [
                                        { text: 'Nhiệm vụ, trách nhiệm:', margin: [0, 2, 0, 2] },
                                        { text: w.Mission || ' ', minHeight: 30 },
                                        { text: 'Thành tích đạt được:', margin: [0, 2, 0, 2] },
                                        { text: w.Achievement || ' ', minHeight: 30 }
                                    ]
                                }, {}, {},
                                {
                                    stack: [
                                        { text: 'Mức lương:' },
                                        { text: dot(fmtCur(w.Salary), 15), margin: [0, 0, 0, 5] },
                                        { text: (w.WorkingStatus === 1 ? '[x]' : '[ ]') + ' Hiện còn làm' },
                                        { text: (w.WorkingStatus === 2 ? '[x]' : '[ ]') + ' Đã nghỉ. Lý do nghỉ việc:' },
                                        { text: dot(w.ReasonQuit, 15), italic: true }
                                    ]
                                }
                            ]
                        ]
                    },
                    layout: makeTableLayout(),
                    margin: [0, 5, 0, 10]
                })),
                // === IV ===
                { text: 'IV. Đặc điểm cá nhân và kinh nghiệm phù hợp với vị trí dự tuyển/ How your experiences or characters can be suitable with applied position?', bold: true, margin: [0, 10, 0, 2] },
                { text: mf.Experiences || '...................................................................................................................' },
                // === V ===
                { text: 'V. Thông tin tuyển dụng mà bạn biết được qua/Select channel you get our recruitment info', bold: true, italics: true, margin: [0, 10, 0, 5] },
                {
                    table: {
                        widths: ['50%', '50%'], body: [
                            [markCheck(recInfo.JobWebsites) + ' Website việc làm/Jobs websites', markCheck(recInfo.Headhunters) + ' Công ty giới thiệu việc làm/Headhunters'],
                            [markCheck(recInfo.Newspapers) + ' Báo giấy/Newspapers', markCheck(recInfo.Relatives) + ' Người thân, quen/Relatives'],
                            [markCheck(recInfo.SocialNetwork) + ' Mạng xã hội/Social networks (Facebook, Zalo, ...)', markCheck(recInfo.Others) + ' Khác/Others']
                        ]
                    },
                    layout: makeTableLayout()
                },
                // === VI ===
                { text: 'VI. Lý do nộp đơn dự tuyển vào Công ty chúng tôi/The main reasons for your application', bold: true, italics: true, margin: [0, 10, 0, 2], pageBreak: 'before' },
                { text: mf.ReasonApplication || '...................................................................................................................' },
                // === IX, X ===
                { text: 'IX. Mức lương tối thiểu mong muốn/Your accepted salary ', bold: true, margin: [0, 10, 0, 2] },
                { text: dot(mf.AcceptedSalary ? fmtCur(mf.AcceptedSalary) + 'đ' : null, 50) || '...................................................................................................................' },
                { text: 'X. Ngày có thể bắt đầu làm việc/Date for start ', bold: true, margin: [0, 5, 0, 10] },
                { text: dot(mf.DateOfStart ? fmtDate(mf.DateOfStart) : null, 50) || '...................................................................................................................' },
                // === XI ===
                { text: 'XI. Anh/chị vui lòng trả lời các câu hỏi sau:', bold: true, margin: [0, 5, 0, 5] },
                {
                    table: {
                        widths: ['50%', '50%'],
                        body: [
                            [
                                { text: '1. Anh/chi có người thân hay bạn bè đang làm việc tại RTC không? Nếu có xin vui lòng cho biết họ tên, chức vụ, phòng ban.' },
                                {
                                    stack: [
                                        {
                                            text:
                                                (mf.HasRelativeOrFriendInCompany ? '[ ] Không   [x] Có' : '[x] Không   [ ] Có')
                                        },
                                        {
                                            text: mf.RelativeInfo || '...............................................................................',
                                            margin: [0, 5]
                                        }
                                    ]
                                }
                            ],
                            [
                                { text: '2. Anh/Chị đã từng đóng Bảo hiểm Xã hội trước đây chưa?' },
                                {
                                    stack: [
                                        {
                                            text:
                                                (mf.HasSocialInsurance ? '[ ] Không   [x] Có' : '[x] Không   [ ] Có')
                                        },
                                        { text: 'Nếu đã có sổ BHXH vui lòng ghi rõ số sổ', italic: true, fontSize: 10 },
                                        {
                                            text: mf.BHXH || '...............................................................................',
                                            margin: [0, 5]
                                        }
                                    ]
                                }
                            ],
                            [
                                { text: '3. Anh/Chị đã có mã số thuế cá nhân chưa?' },
                                {
                                    stack: [
                                        {
                                            text:
                                                (mf.HasTaxCode ? '[ ] Không   [x] Có' : '[x] Không   [ ] Có')
                                        },
                                        { text: 'Nếu có vui lòng ghi rõ số mã số thuế', italic: true, fontSize: 10 },
                                        {
                                            text: mf.TaxCode || '...............................................................................',
                                            margin: [0, 5]
                                        }
                                    ]
                                }
                            ]
                        ]
                    },
                    layout: makeTableLayout()
                },
                // === FOOTER ===
                { text: 'Tôi cam đoan tất cả các thông tin trên đây là đúng. Tôi không che giấu thông tin nào. Tôi đồng ý nếu tôi cung cấp bất kỳ thông tin sai lệch nào Công ty có quyền chấm dứt Hợp đồng lao động với tôi ngay lập tức mà không cần thông báo hoặc bồi thường.', alignment: 'center', margin: [0, 20, 0, 10] },
                {
                    stack: [
                        {
                            text:
                                'Hà Nội, ngày/date ' + dot(d ? d.getDate() : null, 2) +
                                ' tháng/month ' + dot(d ? d.getMonth() + 1 : null, 2) +
                                ' năm/year ' + dot(d ? d.getFullYear() : null, 4),
                            alignment: 'right',
                            italics: true
                        },
                        { text: 'Người khai ký tên/Signature', alignment: 'right', bold: true, italics: true, margin: [0, 5, 45, 0] }
                    ]
                },
                {},
                {},
                { text: mf.FullName, alignment: 'right', bold: true, italics: true, margin: [0, 45, 75, 50] }
            ]
        };

        pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        });
    }
    //#endregion
}
