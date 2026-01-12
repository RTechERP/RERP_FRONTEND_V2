import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Formatter,
    Formatters,
    GridOption,
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import { SettingHrConfigService } from './setting-hr-config.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
    standalone: true,
    selector: 'app-setting-hr-config',
    imports: [
        CommonModule,
        FormsModule,
        NzNotificationModule,
        NzSpinModule,
        NzCardModule,
        Menubar,
        AngularSlickgridModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './setting-hr-config.component.html',
    styleUrl: './setting-hr-config.component.css'
})
export class SettingHrConfigComponent implements OnInit {
    // SlickGrid
    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    isLoading = false;
    hasChanges = false;
    changedItems: Map<number, any> = new Map();

    // Menu bars
    menuBars: MenuItem[] = [];

    // Custom Formatter for date
    dateFormatter: Formatter = (_row, _cell, value) => {
        if (!value) return '';
        try {
            const formatted = DateTime.fromISO(value).isValid
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm')
                : DateTime.fromJSDate(new Date(value)).toFormat('dd/MM/yyyy HH:mm');
            return formatted;
        } catch {
            return '';
        }
    };

    // Custom Formatter for checkbox (status)
    checkboxFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext) => {
        const isChecked = value === '1' || value === 1 || value === true;
        const checkedAttr = isChecked ? 'checked' : '';
        return `<input type="checkbox" class="config-checkbox" data-id="${dataContext.ID}" ${checkedAttr} style="cursor: pointer; width: 18px; height: 18px;" />`;
    };

    // Custom Formatter for description display
    descriptionFormatter: Formatter = (_row, _cell, _value, _columnDef, dataContext) => {
        const keyName = dataContext.KeyName || '';
        const description = dataContext.Description || '';

        // Map KeyName to friendly Vietnamese text
        const keyNameMap: { [key: string]: string } = {
            'EmployeeOvertime': 'Đăng ký bổ sung Làm thêm',
            'EmployeeBussiness': 'Đăng ký bổ sung Công tác'
        };

        return keyNameMap[keyName] || description || keyName;
    };

    constructor(
        private settingHrConfigService: SettingHrConfigService,
        private notification: NzNotificationService,
        private cdRef: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.initMenuBar();
        this.initGrid();
        this.loadData();
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Lưu',
                icon: 'fa-solid fa-floppy-disk fa-lg text-primary',
                disabled: !this.hasChanges,
                command: () => this.saveChanges()
            },
            {
                label: 'Làm mới',
                icon: 'fa-solid fa-arrows-rotate fa-lg text-success',
                command: () => this.loadData()
            }
        ];
    }

    updateMenuBar() {
        this.menuBars = [
            {
                label: 'Lưu',
                icon: 'fa-solid fa-floppy-disk fa-lg text-primary',
                disabled: !this.hasChanges,
                command: () => this.saveChanges()
            },
            {
                label: 'Làm mới',
                icon: 'fa-solid fa-arrows-rotate fa-lg text-success',
                command: () => this.loadData()
            }
        ];
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'KeyValue2',
                name: 'Trạng thái',
                field: 'KeyValue2',
                width: 100,
                maxWidth: 120,
                cssClass: 'text-center',
                formatter: this.checkboxFormatter
            },
            {
                id: 'Description',
                name: 'Tên cấu hình',
                field: 'Description',
                width: 250,
                formatter: this.descriptionFormatter
            },
            {
                id: 'KeyName',
                name: 'Mã cấu hình',
                field: 'KeyName',
                width: 180
            },
            {
                id: 'UpdatedBy',
                name: 'Người cập nhật',
                field: 'UpdatedBy',
                width: 150
            },
            {
                id: 'UpdatedDate',
                name: 'Ngày cập nhật',
                field: 'UpdatedDate',
                width: 170,
                formatter: this.dateFormatter,
                cssClass: 'text-center'
            }
        ];

        this.gridOptions = {
            datasetIdPropertyName: 'id',
            autoResize: {
                container: '#setting-hr-config-grid-container',
                calculateAvailableSizeBy: 'container'
            },
            enableAutoResize: true,
            gridWidth: '100%',
            enableSorting: true,
            enableFiltering: false,
            enableRowSelection: false,
            enableCellNavigation: true,
            rowHeight: 40,
            headerRowHeight: 45,
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid.dataView;

        // Handle checkbox click events
        angularGrid.slickGrid.onClick.subscribe((e: any, _args: any) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('config-checkbox')) {
                const checkbox = target as HTMLInputElement;
                const itemId = parseInt(checkbox.getAttribute('data-id') || '0', 10);
                const isChecked = checkbox.checked;

                // Find the item and update it
                const item = this.dataset.find(d => d.ID === itemId);
                if (item) {
                    const newValue = isChecked ? '1' : '0';
                    item.KeyValue2 = newValue;

                    // Track changes
                    this.changedItems.set(itemId, {
                        Id: itemId,
                        KeyValue: newValue
                    });

                    this.hasChanges = this.changedItems.size > 0;
                    this.updateMenuBar();

                    // Update the grid
                    this.angularGrid.dataView.updateItem(item.id, item);
                    this.cdRef.detectChanges();
                }
            }
        });
    }

    loadData() {
        this.isLoading = true;
        this.changedItems.clear();
        this.hasChanges = false;
        this.updateMenuBar();

        this.settingHrConfigService.getConfigSystemHR().subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data && response.data.data) {
                    this.dataset = response.data.data.map((item: any) => ({
                        ...item,
                        id: item.ID
                    }));
                } else {
                    this.dataset = [];
                }
                this.isLoading = false;
                this.cdRef.detectChanges();
            },
            error: (error) => {
                console.error('Error loading config:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu cấu hình');
                this.isLoading = false;
            }
        });
    }

    saveChanges() {
        if (!this.hasChanges || this.changedItems.size === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có thay đổi để lưu');
            return;
        }

        this.isLoading = true;
        const savePromises: Promise<any>[] = [];

        this.changedItems.forEach((change) => {
            const promise = new Promise((resolve, reject) => {
                this.settingHrConfigService.saveConfigSystemHR(change).subscribe({
                    next: (res) => resolve(res),
                    error: (err) => reject(err)
                });
            });
            savePromises.push(promise);
        });

        Promise.all(savePromises)
            .then(() => {
                this.notification.success(NOTIFICATION_TITLE.success, 'Lưu cấu hình thành công');
                this.changedItems.clear();
                this.hasChanges = false;
                this.updateMenuBar();
                this.loadData();
            })
            .catch((error) => {
                console.error('Error saving config:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu cấu hình');
                this.isLoading = false;
            });
    }
}
