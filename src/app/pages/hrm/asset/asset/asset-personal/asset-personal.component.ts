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
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AssetPersonalService } from './asset-personal.service';

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
        NzNotificationModule,
        TableModule,
        ButtonModule,
        CheckboxModule
    ],
    templateUrl: './asset-personal.component.html',
    styleUrl: './asset-personal.component.css'
})
export class AssetPersonalComponent implements OnInit {
    isLoading: boolean = false;
    selectedTabIndex: number = 0;

    // Filter params
    keyword: string = '';
    assetCategory: number = -1;

    // Fixed date range
    minDate = '1900-01-01T00:00:00.000Z';
    maxDate = '2100-12-31T23:59:59.000Z';

    // Data
    recordsData: any[] = [];
    assetsData: any[] = []; // Used for Tab 2
    recordDetails: any[] = []; // Used for Tab 1 Detail
    selectedRecord: any = null;
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
    ) { }

    ngOnInit(): void {
        this.loadRecordsData();
        this.loadAssetsData();
    }

    onTabChange(index: number): void {
        this.selectedTabIndex = index;
        // No auto-reload to keep state
    }

    loadRecordsData(): void {
        this.isLoading = true;
        const params = {
            dateStart: this.minDate,
            dateEnd: this.maxDate,
            receiverID: 0,
            assetCategory: this.assetCategory
        };

        this.assetPersonalService.getPersonalProperties(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.recordsData = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : [];
                } else {
                    this.recordsData = [];
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    loadAssetsData(): void {
        this.isLoading = true;
        const params = {
            FilterText: this.keyword || '',
            PageNumber: 1,
            PageSize: 1000,
            DateStart: this.minDate,
            DateEnd: this.maxDate
        };

        this.assetPersonalService.getAssetPerson(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.assetsData = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : [];
                } else {
                    this.assetsData = [];
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    loadRecordDetails(assetID: number, assetCategory: number): void {
        this.assetPersonalService.getPersonalPropertyDetails(assetID, assetCategory).subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    const dataArray = Array.isArray(response.data) ? response.data : [];
                    this.recordDetails = dataArray.length > 0 && Array.isArray(dataArray[0]) ? dataArray[0] : dataArray;
                } else {
                    this.recordDetails = [];
                }
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết tài sản');
                this.recordDetails = [];
            }
        });
    }

    onSearch(): void {
        if (this.keyword) {
            this.keyword = this.keyword.trim();
        }
        if (this.selectedTabIndex === 0) {
            this.loadRecordsData();
        } else {
            this.loadAssetsData();
        }
    }

    resetSearch(): void {
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

    onRowSelect(event: any) {
        this.selectedRecord = event.data;
        if (this.selectedRecord) {
            this.detailTabTitle = `Chi tiết cấp phát: ${this.selectedRecord.AssetCode || ''}`;
            this.loadRecordDetails(this.selectedRecord.AssetID, this.selectedRecord.AssetCategory || 0);
        }
    }

    onRowUnselect(event: any) {
        this.selectedRecord = null;
        this.recordDetails = [];
        this.detailTabTitle = 'Chi tiết cấp phát';
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return '';
        }
    }
}
