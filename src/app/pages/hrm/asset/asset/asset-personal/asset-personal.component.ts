import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { AssetPersonalService } from './asset-personal.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-asset-personal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzDatePickerModule,
        NzInputModule,
        NzSelectModule,
        NzFormModule,
        NzSpinModule,
        NzTabsModule,
        NzTableModule,
        NzSplitterModule,
    ],
    templateUrl: './asset-personal.component.html',
    styleUrl: './asset-personal.component.css'
})
export class AssetPersonalComponent implements OnInit, AfterViewInit {
    @ViewChild('recordsTable', { static: false }) recordsTableElement!: ElementRef;
    @ViewChild('assetsTable', { static: false }) assetsTableElement!: ElementRef;
    @ViewChild('recordDetailTable', { static: false }) recordDetailTableElement!: ElementRef;

    recordsTable: Tabulator | null = null;
    assetsTable: Tabulator | null = null;
    personalAssetsTable: Tabulator | null = null; // Table riêng cho tab cá nhân
    recordDetailTable: Tabulator | null = null;
    isLoading: boolean = false;
    selectedTabIndex: number = 0;

    // Filter params
    dateStart: Date | null = null;
    dateEnd: Date | null = null;
    keyword: string = '';
    assetCategory: number = -1;

    // Data
    recordsData: any[] = [];
    assetsData: any[] = [];
    selectedRecord: any = null;
    recordDetails: any[] = [];
    detailTabTitle: string = 'Chi tiết cấp phát';

    // Asset category options
    assetCategoryList = [
        { value: -1, label: 'Tất cả' },
        { value: 0, label: 'Điều chuyển' },
        { value: 1, label: 'Cấp phát' },
        { value: 2, label: 'Thu hồi' }
    ];

    constructor(
        private notification: NzNotificationService,
        private assetPersonalService: AssetPersonalService
    ) {
        // Set default dates
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.dateStart = firstDayOfMonth;
        this.dateEnd = lastDayOfMonth;
    }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        this.loadRecordsData();
    }

    onTabChange(index: number): void {
        this.selectedTabIndex = index;
        if (index === 0) {
            this.loadRecordsData();
        } else {
            this.loadAssetsData();
        }
    }

    loadRecordsData(): void {
        if (!this.dateStart || !this.dateEnd) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
            return;
        }

        this.isLoading = true;
        const params = {
            dateStart: this.dateStart.toISOString(),
            dateEnd: this.dateEnd.toISOString(),
            receiverID: 0,
            assetCategory: this.assetCategory
        };

        this.assetPersonalService.getPersonalProperties(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    // Response data is nested in array: [ [ {data} ] ]
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.recordsData = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : [];
                } else {
                    this.recordsData = [];
                }
                this.drawRecordsTable();
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    loadAssetsData(): void {
        if (!this.dateStart || !this.dateEnd) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
            return;
        }
   var minDate = new Date(1900, 0, 1); // 01/01/1900
   var maxDate = new Date(2100, 11, 31); // 31/12/2100
        this.isLoading = true;
        const params = {
            FilterText: this.keyword || '',
            PageNumber: 1,
            PageSize: 1000,
            DateStart: minDate.toISOString(),
            DateEnd: maxDate.toISOString()
        };

        this.assetPersonalService.getAssetPerson(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    // Response data is nested in array: [ [ {data} ] ]
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.assetsData = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : [];
                } else {
                    this.assetsData = [];
                }
                this.drawPersonalAssetsTable(); // Gọi method riêng cho tab cá nhân
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    loadRecordDetails(assetID: number, assetCategory: number): void {
        console.log('Loading record details with params:', { assetID, assetCategory });
        this.assetPersonalService.getPersonalPropertyDetails(assetID, assetCategory).subscribe({
            next: (response: any) => {
                console.log('Record details response:', response);
                if (response && response.status === 1 && response.data) {
                    // Response data is nested in array: [ [ {data} ] ]
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.assetsData = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : dataArray;
                    this.drawAssetsTable(); // Cần gọi lại để render Tabulator table
                } else {
                    this.assetsData = [];
                    if (this.recordDetailTable) {
                        this.recordDetailTable.setData([]);
                    }
                }
            },
            error: (error: any) => {
                console.error('Error loading record details:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết tài sản');
                this.assetsData = [];
                if (this.recordDetailTable) {
                    this.recordDetailTable.setData([]);
                }
            }
        });
    }

    onSearch(): void {
        if (this.selectedTabIndex === 0) {
            this.loadRecordsData();
        } else {
            this.loadAssetsData();
        }
    }

    resetSearch(): void {
        const now = new Date();
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.keyword = '';
        this.assetCategory = -1;
        this.onSearch();
    }

    approveAsset(asset: any): void {
        const assetDTO = {
            AssetID: asset.AssetID,
            AssetCategory: asset.AssetCategory,
            IsApprove: true
        };
        this.assetPersonalService.changeStatusAsset(assetDTO).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Duyệt tài sản thành công');
                    this.loadRecordsData(); // Reload data
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi duyệt tài sản');
                }
            },
            error: (error: any) => {
                const errorMessage = error?.error?.message || error?.message || 'Lỗi khi duyệt tài sản';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    rejectAsset(asset: any): void {
        const assetDTO = {
            AssetID: asset.AssetID,
            AssetCategory: asset.AssetCategory,
            IsApprove: false
        };
        this.assetPersonalService.changeStatusAsset(assetDTO).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Hủy duyệt tài sản thành công');
                    this.loadRecordsData(); // Reload data
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi hủy duyệt tài sản');
                }
            },
            error: (error: any) => {
                const errorMessage = error?.error?.message || error?.message || 'Lỗi khi hủy duyệt tài sản';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }
    private drawRecordsTable(): void {
        const dateFormatter = (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        };

        const checkboxFormatter = (cell: any) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<div style='text-align:center'><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
        };

        const actionFormatter = (cell: any) => {
            const data = cell.getData();
            const assetId = data.AssetID || data.ID || 0;
            const category = data.AssetCategory ?? 0;
            return `
                <div style='display: flex; gap: 5px; justify-content: center;'>
                    <button class="approve-btn" data-asset-id="${assetId}" data-category="${category}" 
                            style='background: #52c41a; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;'
                            title="Duyệt">✓</button>
                    <button class="reject-btn" data-asset-id="${assetId}" data-category="${category}" 
                            style='background: #ff4d4f; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;'
                            title="Hủy duyệt">✕</button>
                </div>
            `;
        };

     const columns: any[] = [
            { title: 'STT', formatter: 'rownum', hozAlign: 'center', headerHozAlign: 'center', width: 60, frozen: true },
            { title: 'Thao tác', formatter: actionFormatter, hozAlign: 'center', headerHozAlign: 'center', width: 100, frozen: true },
            { title: 'Cá nhân', field: 'IsApprovedPersonalProperty', hozAlign: 'center', headerHozAlign: 'center', width: 80, formatter: checkboxFormatter },
            { title: 'HR duyệt', field: 'IsApproved', hozAlign: 'center', headerHozAlign: 'center', width: 90, formatter: checkboxFormatter },
            { title: 'Kế toán duyệt', field: 'IsApproveAccountant', hozAlign: 'center', headerHozAlign: 'center', width: 110, formatter: checkboxFormatter },
            { title: 'Mã biên bản', field: 'AssetCode', headerHozAlign: 'center', width: 150 },
            { title: 'Loại biên bản', field: 'AssetCategorytext', headerHozAlign: 'center', width: 160},
            { title: 'Ngày bàn giao', field: 'ImplementationDate', hozAlign: 'center', headerHozAlign: 'center', width: 120, formatter: dateFormatter },
            { title: 'Người nhận', field: 'DeliverName', headerHozAlign: 'center', width: 150, formatter: 'textarea' },
            { title: 'Phòng ban', field: 'DepartmentDeliver', headerHozAlign: 'center', width: 120 },
            { title: 'Chức vụ', field: 'PossitionDeliver', headerHozAlign: 'center', width: 100 },
            { title: 'Ghi chú', field: 'AssetNote', headerHozAlign: 'center', widthGrow: 1, formatter: 'textarea' },
            { title: 'ID biên bản', field: 'AssetID', headerHozAlign: 'center', widthGrow: 1, formatter: 'textarea', visible: false },
        ];
        if (this.recordsTable) {
            this.recordsTable.setData(this.recordsData);
        } else if (this.recordsTableElement) {
            this.recordsTable = new Tabulator(this.recordsTableElement.nativeElement, {
                data: this.recordsData || [],
                ...DEFAULT_TABLE_CONFIG,
                paginationMode: 'local',
                height: '100%',
                layout: 'fitDataStretch',
                selectableRows: 1,
                columns: columns,
                rowHeader:false
            });
            this.recordsTable.on('rowClick', (e: any, row: any) => {
                this.selectedRecord = row.getData();
                if (this.selectedRecord && this.selectedRecord.ID) {
                    this.detailTabTitle = `Chi tiết cấp phát: ${this.selectedRecord.AssetCode || ''}`;
                    this.loadRecordDetails(this.selectedRecord.AssetID, this.selectedRecord.AssetCategory || 0);
                }
            });

            // Add click handlers for action buttons
            this.recordsTable.on('tableBuilt', () => {
                const tableElement = this.recordsTableElement.nativeElement;
                
                tableElement.addEventListener('click', (e: any) => {
                    const target = e.target as HTMLElement;
                    const approveBtn = target.closest('.approve-btn');
                    const rejectBtn = target.closest('.reject-btn');
                    
                    if (approveBtn) {
                        const assetIdStr = approveBtn.getAttribute('data-asset-id');
                        const categoryStr = approveBtn.getAttribute('data-category');
                        
                        if (assetIdStr && categoryStr) {
                            const assetData = {
                                AssetID: parseInt(assetIdStr),
                                AssetCategory: parseInt(categoryStr)
                            };
                            this.approveAsset(assetData);
                        }
                    } else if (rejectBtn) {
                        const assetIdStr = rejectBtn.getAttribute('data-asset-id');
                        const categoryStr = rejectBtn.getAttribute('data-category');
                        
                        if (assetIdStr && categoryStr) {
                            const assetData = {
                                AssetID: parseInt(assetIdStr),
                                AssetCategory: parseInt(categoryStr)
                            };
                            this.rejectAsset(assetData);
                        }
                    }
                });
            });
        }
    }
    private drawPersonalAssetsTable(): void {
        const formatDateCell = (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        };
        
        const columns: any[] = [
            {
                title: "STT",
                formatter: "rownum",
                hozAlign: "center",
                headerHozAlign: "center",
                width: 60,
                frozen: true
            },
            {
                title: "Mã tài sản", 
                field: "TSAssetCode", 
                hozAlign: "left", 
                bottomCalc: "count",
                bottomCalcFormatter: (cell: any) => {
                    return `<div style="text-align:center; width: 100%;">${cell.getValue()}</div>`;
                }, 
                frozen: true
            },
            { title: "Tên tài sản", field: "TSAssetName", hozAlign: "left" },
            { title: "Tên loại tài sản", field: "AssetType", hozAlign: "left" },
            { title: "Mã loại tài sản", field: "AssetCode", hozAlign: "left" },
            { title: "Mã nguồn gốc", field: "SourceCode", hozAlign: "left" },
            { title: "Tên nguồn gốc", field: "SourceName", hozAlign: "left" },
            { title: "Nhà cung cấp", field: "SupplierName", hozAlign: "left" },
            { title: "Seri", field: "Seri", hozAlign: "left" },
            { title: "Đơn vị", field: "UnitName", hozAlign: "left" },
            { title: "Tình trạng", field: "Status", hozAlign: "left" },
            { title: "Số lượng", field: "Quantity", hozAlign: "left" },
            { title: "Phòng ban", field: "Name", hozAlign: "left" },
            { title: "Mã phòng ban", field: "DepartmentCode", hozAlign: "left" },
            { title: "Mô tả chi tiết", field: "SpecificationsAsset", hozAlign: "left" },
            { title: "Mã RTC", field: "TSCodeNCC", hozAlign: "left" },
            { title: "Người sử dụng", field: "FullName", hozAlign: "left" },
            { title: "Thông số", field: "SpecificationsAsset", hozAlign: "left" },
            { title: "Thời gian ghi tăng", field: "DateBuy", hozAlign: "center", formatter: formatDateCell },
            {
                title: "Thời gian bảo hành",
                field: "Insurance",
                hozAlign: "center",
                formatter: function (cell: any) {
                    const value = cell.getValue();
                    return value != null ? value : 0;
                }
            },
            { title: "Ngày hiệu lực", field: "DateEffect", hozAlign: "center", formatter: formatDateCell },
            { title: "Trạng thái", field: "Status", hozAlign: "left" },
            { title: "Ghi chú", field: "Note", visible: false }
        ];

        // Sử dụng personalAssetsTable cho tab cá nhân
        if (this.personalAssetsTable) {
            this.personalAssetsTable.setData(this.assetsData);
        } else if (this.assetsTableElement) {
            this.personalAssetsTable = new Tabulator(this.assetsTableElement.nativeElement, {
                data: this.assetsData || [],
                ...DEFAULT_TABLE_CONFIG,
                paginationMode: 'local',
                height: '83vh',
                layout: 'fitDataStretch',
                columns: columns,
            });
        }
    }

    private drawAssetsTable(): void {
        const dateFormatter = (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        };
        const columns: any[] = [
            { title: 'STT', formatter: 'rownum', hozAlign: 'center', headerHozAlign: 'center', width: 60, frozen: true },
            { title: 'Mã tài sản', field: 'TSAssetCode', headerHozAlign: 'center', width: 140, frozen: true },
            { title: 'Tên tài sản', field: 'TSAssetName', headerHozAlign: 'center', width: 200, formatter: 'textarea' }, 
            { title: 'Đơn vị', field: 'UnitName', headerHozAlign: 'center', width: 80 },
            { title: 'Tình trạng', field: 'Status', headerHozAlign: 'center', width: 100 },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
            { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center', widthGrow: 1, formatter: 'textarea' },
        ];

        // Sử dụng recordDetailTable cho detail table
        if (this.recordDetailTable) {
            this.recordDetailTable.setData(this.assetsData);
        } else if (this.recordDetailTableElement) {
            this.recordDetailTable = new Tabulator(this.recordDetailTableElement.nativeElement, {
                data: this.assetsData || [],
                ...DEFAULT_TABLE_CONFIG,
                paginationMode: 'local',
                height: '100%',
                layout: 'fitDataStretch',
                columns: columns,
            });
        }
    }

    private drawRecordDetailTable(): void {
        const columns: any[] = [
            { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 60 },
            { title: 'Mã RTC', field: 'TSCodeNCC', headerHozAlign: 'center', width: 120 },
            { title: 'Tên tài sản', field: 'TSAssetName', headerHozAlign: 'center', width: 250, formatter: 'textarea' },
            { title: 'Đơn vị tính', field: 'UnitName', headerHozAlign: 'center', width: 100 },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
            { title: 'Tình trạng', field: 'Status', headerHozAlign: 'center', width: 120 },
            { title: 'Nhân viên', field: 'FullName', headerHozAlign: 'center', width: 150 },
            { title: 'Phòng ban', field: 'DepartmentName', headerHozAlign: 'center', width: 150 },
            { title: 'Chức vụ', field: 'PositionName', headerHozAlign: 'center', width: 150 },
            { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center', widthGrow: 1, formatter: 'textarea' },
        ];

        if (this.recordDetailTable) {
            this.recordDetailTable.setData(this.recordDetails);
        } else if (this.recordDetailTableElement) {
            this.recordDetailTable = new Tabulator(this.recordDetailTableElement.nativeElement, {
                data: this.recordDetails || [],
                ...DEFAULT_TABLE_CONFIG,
                paginationMode: 'local',
                height: '100%',
                layout: 'fitDataStretch',
                columns: columns,
            });
        }
    }
}
