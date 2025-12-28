import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { BorrowService } from '../../borrow-service/borrow.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { ID_ADMIN_DEMO_LIST } from '../../../../../../app.config';

// Angular SlickGrid imports
import { AngularSlickgridModule } from 'angular-slickgrid';
import {
    AngularGridInstance,
    Column,
    Editors,
    Filters,
    Formatters,
    GridOption,
    OnSelectedRowsChangedEventArgs,
    FieldType,
} from 'angular-slickgrid';

@Component({
    selector: 'app-history-product-rtc-detail',
    templateUrl: './history-product-rtc-detail.component.html',
    styleUrls: ['./history-product-rtc-detail.component.css'],
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
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
        NzSpinModule,
        NzTreeSelectModule,
        NzModalModule,
        NzCheckboxModule,
        CommonModule,
        AngularSlickgridModule,
    ]
})
export class HistoryProductRtcDetailComponent implements OnInit, AfterViewInit {
    // Input properties
    @Input() isExportMode: boolean = false; // Chế độ xuất sang phiếu xuất
    @Input() warehouseType: number = 1;

    // Angular SlickGrid instances
    angularGridMain!: AngularGridInstance;
    angularGridBorrow!: AngularGridInstance;

    // Grid columns and options for main table
    columnDefinitionsMain: Column[] = [];
    gridOptionsMain!: GridOption;
    datasetMain: any[] = [];

    // Grid columns and options for borrow table
    columnDefinitionsBorrow: Column[] = [];
    gridOptionsBorrow!: GridOption;
    datasetBorrow: any[] = [];

    // API parameters
    userId: any = 0;
    productGroupID: any = 0;
    keyword: any = '';
    checkAll: any = 1;
    filter: any = '';
    warehouseID: any = 1;

    users: any[] = []; // get user select option

    selectedProduct: any[] = [];
    selectedProductBorrow: any[] = [];
    arrProductBorrow: any[] = [];

    // param create product history
    PeopleID: any = 0;
    Project: string = "Test văn phòng";
    Note: string = "";
    Status: number = 7;
    DateReturnExpected: Date = new Date(Date.UTC(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        23, 59, 59
    ));
    DateBorrow: Date = new Date();
    ProductRTCID: number = 0;

    constructor(
        public activeModal: NgbActiveModal,
        private borrowService: BorrowService,
        private modal: NzModalService,
        private notification: NzNotificationService,
        private appUserService: AppUserService
    ) {
        this.PeopleID = this.appUserService.id;
    }

    ngOnInit() {
        this.loadUser();
        this.initGridColumnsMain();
        this.initGridOptionsMain();
        this.initGridColumnsBorrow();
        this.initGridOptionsBorrow();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.getProductRTCDetail();
        }, 100);
    }

    // Initialize main grid columns
    initGridColumnsMain() {
        this.columnDefinitionsMain = [
            {
                id: 'ID',
                field: 'ID',
                name: 'ID',
                sortable: true,
                filterable: false,
                excludeFromColumnPicker: true,
                excludeFromGridMenu: true,
                excludeFromHeaderMenu: true,
                width: 0,
                minWidth: 0,
                maxWidth: 0,
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên',
                sortable: true,
                filterable: true,
                width: 200,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                sortable: true,
                filterable: true,
                width: 150,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'SerialNumber',
                field: 'SerialNumber',
                name: 'Serial',
                sortable: true,
                filterable: true,
                width: 150,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'PartNumber',
                field: 'PartNumber',
                name: 'Part Number',
                sortable: true,
                filterable: true,
                width: 150,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Serial',
                field: 'Serial',
                name: 'Code',
                sortable: true,
                filterable: true,
                width: 150,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'InventoryReal',
                field: 'InventoryReal',
                name: 'Số lượng hiện có',
                sortable: true,
                filterable: true,
                type: FieldType.number,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'AddressBox',
                field: 'AddressBox',
                name: 'Vị trí (Hộp)',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
        ];
    }

    // Initialize main grid options
    initGridOptionsMain() {
        this.gridOptionsMain = {
            enableAutoResize: true,
            autoResize: {
                container: '#grid-container-main',
            },
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
            },
            multiSelect: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            enableFiltering: true,
            enableSorting: true,
            enablePagination: true,
            pagination: {
                pageSizes: [20, 50, 100],
                pageSize: 20,
            },
            enableContextMenu: false,
            enableHeaderMenu: false,
            gridHeight: 400,
        };
    }

    // Initialize borrow grid columns
    initGridColumnsBorrow() {
        this.columnDefinitionsBorrow = [
            {
                id: 'ID',
                field: 'ID',
                name: 'ID',
                sortable: false,
                filterable: false,
                excludeFromColumnPicker: true,
                excludeFromGridMenu: true,
                excludeFromHeaderMenu: true,
                width: 0,
                minWidth: 0,
                maxWidth: 0,
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                sortable: true,
                filterable: false,
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên',
                sortable: true,
                filterable: false,
            },
            {
                id: 'NumberBorrow',
                field: 'NumberBorrow',
                name: 'Số lượng mượn',
                sortable: true,
                filterable: false,
                type: FieldType.number,
                editor: {
                    model: Editors['numeric'],
                },
            },
        ];
    }

    // Initialize borrow grid options
    initGridOptionsBorrow() {
        this.gridOptionsBorrow = {
            enableAutoResize: true,
            autoResize: {
                container: '#grid-container-borrow',
            },
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: {
                hideInFilterHeaderRow: false,
                hideInColumnTitleRow: true,
            },
            multiSelect: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            enableFiltering: false,
            enableSorting: true,
            enablePagination: false,
            enableContextMenu: false,
            enableHeaderMenu: false,
            gridHeight: 300,
            editable: true,
            autoEdit: true,
            enableCellNavigation: true,
        };
    }

    // Load users
    loadUser() {
        this.userId = this.appUserService.id;
        if (ID_ADMIN_DEMO_LIST.includes(this.userId) || this.appUserService.isAdmin) {
            this.userId = 0;
        }
        this.borrowService.getUserHistoryProduct(this.userId).subscribe({
            next: (response: any) => {
                let data = response.data;
                this.users = this.createdNestedGroup(data, 'DepartmentName', 'TeamName');
            },
            error: (error) => {
                console.error('Lỗi:', error);
            },
        });
    }

    // Get product RTC detail
    getProductRTCDetail() {
        this.borrowService.getProductRTCDetail(
            this.productGroupID,
            this.keyword,
            this.checkAll,
            this.filter,
            this.warehouseID,
            this.warehouseType
        ).subscribe({
            next: (response: any) => {
                this.datasetMain = response.data.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || index,
                }));
            },
            error: (error) => {
                console.error('Lỗi:', error);
            },
        });
    }

    // Search handler
    onSearch(event: any) {
        const keyword = (event.target.value || "").toLowerCase();
        
        if (!this.angularGridMain || !this.angularGridMain.filterService) {
            return;
        }

        // Clear existing filters
        this.angularGridMain.filterService.clearFilters();

        if (keyword) {
            // Apply multiple OR filters
            const searchFields = [
                'ProductName',
                'ProductCode',
                'SerialNumber',
                'PartNumber',
                'Serial',
                'Maker',
                'AddressBox'
            ];

            // Filter in memory
            const filteredData = this.datasetMain.filter((item: any) => {
                return searchFields.some(field => {
                    const value = item[field];
                    return value && value.toString().toLowerCase().includes(keyword);
                });
            });

            this.angularGridMain.dataView.setItems(filteredData);
        } else {
            // Reset to full dataset
            this.angularGridMain.dataView.setItems(this.datasetMain);
        }
    }

    // Main grid ready
    angularGridMainReady(angularGrid: AngularGridInstance) {
        this.angularGridMain = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    // Borrow grid ready
    angularGridBorrowReady(angularGrid: AngularGridInstance) {
        this.angularGridBorrow = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    // Main grid row selection changed
    onRowSelectionChangedMain(event: Event, args: OnSelectedRowsChangedEventArgs) {
        if (args && args.rows) {
            this.selectedProduct = args.rows.map((idx: number) => {
                return this.angularGridMain.dataView.getItem(idx);
            });
        }
    }

    // Borrow grid row selection changed
    onRowSelectionChangedBorrow(event: Event, args: OnSelectedRowsChangedEventArgs) {
        if (args && args.rows) {
            this.selectedProductBorrow = args.rows.map((idx: number) => {
                return this.angularGridBorrow.dataView.getItem(idx);
            });
        }
    }

    // Move data from main to borrow
    moveData() {
        if (this.selectedProduct.length === 0) {
            this.notification.create(
                'warning',
                'Thông báo',
                'Vui lòng chọn sản phẩm cần mượn!.'
            );
            return;
        }

        const itemsToRemove: any[] = [];
        const borrowArray = [...this.arrProductBorrow];

        for (const item of [...this.selectedProduct]) {
            item.InventoryReal--;

            borrowArray.push({
                id: item.ID,
                ID: item.ID,
                ProductCode: item.ProductCode,
                ProductName: item.ProductName,
                ProductCodeRTC: item.ProductCodeRTC,
                SerialNumber: item.SerialNumber,
                PartNumber: item.PartNumber,
                Maker: item.Maker,
                Note: item.Note,
                NumberBorrow: 1,
                UnitCountName: item.UnitCountName || '',
                UnitCountID: item.UnitCountID || 0,
            });

            if (item.InventoryReal === 0) {
                itemsToRemove.push(item);
            }
        }

        // Update datasets
        this.datasetMain = this.datasetMain.filter(item => 
            !itemsToRemove.some(removed => removed.ID === item.ID)
        );

        this.arrProductBorrow = borrowArray;
        this.datasetBorrow = [...borrowArray];

        // Refresh grids
        if (this.angularGridMain) {
            this.angularGridMain.dataView.setItems(this.datasetMain);
        }
        if (this.angularGridBorrow) {
            this.angularGridBorrow.dataView.setItems(this.datasetBorrow);
        }

        // Clear selections
        this.selectedProduct = [];
        if (this.angularGridMain) {
            this.angularGridMain.slickGrid.setSelectedRows([]);
        }
    }

    // Remove data from borrow to main
    removeData() {
        if (!this.selectedProductBorrow || this.selectedProductBorrow.length === 0) {
            this.notification.create('warning', 'Thông báo', 'Vui lòng chọn sản phẩm để trả lại!');
            return;
        }

        let borrowArray = [...this.arrProductBorrow];

        for (const selected of [...this.selectedProductBorrow]) {
            const idx = borrowArray.findIndex((x: any) => x.ID === selected.ID);
            if (idx !== -1) {
                const borrowItem = borrowArray[idx];
                borrowItem.NumberBorrow--;

                if (borrowItem.NumberBorrow <= 0) {
                    // Remove from borrow
                    borrowArray.splice(idx, 1);
                }

                // Return to main table
                const mainItem = this.datasetMain.find((x: any) => x.ID === borrowItem.ID);
                if (mainItem) {
                    mainItem.InventoryReal++;
                } else {
                    this.datasetMain.push({
                        id: borrowItem.ID,
                        ID: borrowItem.ID,
                        ProductCode: borrowItem.ProductCode,
                        ProductName: borrowItem.ProductName,
                        SerialNumber: borrowItem.SerialNumber,
                        PartNumber: borrowItem.PartNumber,
                        Maker: borrowItem.Maker,
                        Note: borrowItem.Note,
                        InventoryReal: 1,
                    });
                }
            }
        }

        this.arrProductBorrow = borrowArray;
        this.datasetBorrow = [...borrowArray];

        // Refresh grids
        if (this.angularGridMain) {
            this.angularGridMain.dataView.setItems(this.datasetMain);
        }
        if (this.angularGridBorrow) {
            this.angularGridBorrow.dataView.setItems(this.datasetBorrow);
        }

        // Clear selections
        this.selectedProductBorrow = [];
        if (this.angularGridBorrow) {
            this.angularGridBorrow.slickGrid.setSelectedRows([]);
        }
    }

    // Submit form
    onSubmit() {
        if (this.arrProductBorrow.length == 0) {
            this.notification.create(
                'warning',
                'Thông báo',
                'Vui lòng chọn thiết bị mượn!.'
            );
            return;
        }
        if (this.PeopleID == 0) {
            this.notification.create(
                'warning',
                'Thông báo',
                'Vui lòng chọn người mượn!.'
            );
            return;
        }
        if (this.Project == "") {
            this.notification.create(
                'warning',
                'Thông báo',
                'Vui lòng nhập dự án!.'
            );
            return;
        }
        if (this.DateReturnExpected <= new Date()) {
            this.notification.create(
                'warning',
                'Thông báo',
                'Ngày dự kiến trả không phù hợp! Ngày dự kiến trả phải lớn hơn ngày mượn hoặc thời gian hiện tại!.'
            );
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận đăng ký mượn.',
            nzContent: `Bạn có chắc chắn muốn mượn không?`,
            nzOkText: 'Xác nhận',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const deleteRequests = this.arrProductBorrow.map(item => {
                    const data = {
                        ProductRTCID: item.ID,
                        HistoryProductRTCID: 0,
                        PeopleID: this.PeopleID,
                        Project: this.Project,
                        Note: this.Note || '',
                        Status: 7, // trạng thái đăng kí mượn
                        DateReturnExpected: this.DateReturnExpected.toISOString(),
                        DateBorrow: this.DateBorrow.toISOString(),
                        Quantity: item.NumberBorrow,
                        SerialNumber: item.SerialNumber || '',
                        IsDelete: false
                    };
                    const IDAdminDemo = ID_ADMIN_DEMO_LIST || [];
                    const userId = this.appUserService?.id || 0;
                    const isAdmin = IDAdminDemo.includes(userId);
                    const isGlobalAdmin = this.appUserService?.isAdmin || false;
                    // trạng thái đang mượn nếu là admin
                    if (isAdmin || isGlobalAdmin) {
                        data.Status = 1;
                    }
                    console.log('data', data);

                    return this.borrowService.postSaveHistoryProductRTC(data).toPromise()
                        .then(() => {
                            return { item, success: true, message: null }
                        })
                        .catch(error => {
                            const message = error?.error?.message || 'Lỗi không xác định!';
                            console.error(`Lỗi khi thêm thiết bị ${item.ID}:`, message);
                            return { item, success: false, message };
                        });
                });

                Promise.all(deleteRequests).then(results => {
                    const successCount = results.filter(r => r.success).length;
                    const failed = results.filter(r => !r.success);

                    if (successCount > 0) {
                        this.notification.success('Thành công', `Đã thêm ${successCount} thiết bị thành công!`);
                    }

                    if (failed.length > 0) {
                        failed.forEach(f => {
                            this.notification.error('Lỗi', f.message);
                        });
                    }
                });
                this.activeModal.close();
            }
        });
    }

    // Export to bill export
    exportToBillExport() {
        if (this.arrProductBorrow.length === 0) {
            this.notification.create(
                'warning',
                'Thông báo',
                'Vui lòng chọn sản phẩm cần xuất sang phiếu xuất!'
            );
            return;
        }

        const productsToExport = this.arrProductBorrow.map((item: any) => ({
            ProductRTCID: item.ID,
            ProductCode: item.ProductCode,
            ProductName: item.ProductName,
            ProductCodeRTC: item.ProductCodeRTC,
            UnitCountName: item.UnitCountName || '',
            UnitCountID: item.UnitCountID || 0,
            Maker: item.Maker || '',
            NumberBorrow: item.NumberBorrow || 1,
            SerialNumber: item.SerialNumber || '',
            PartNumber: item.PartNumber || '',
            Note: item.Note || '',
        }));

        this.activeModal.close(productsToExport);
    }

    // Service grouping theo DepartmentName -> TeamName
    createdNestedGroup(items: any[], groupByDept: string, groupByTeam: string) {
        const deptGrouped: Record<string, any[]> = items.reduce((acc, item) => {
            const deptKey = item[groupByDept] || 'Khác';
            if (!acc[deptKey]) acc[deptKey] = [];
            acc[deptKey].push(item);
            return acc;
        }, {});

        return Object.entries(deptGrouped).map(([deptLabel, deptItems]) => {
            const teamGrouped: Record<string, any[]> = deptItems.reduce((acc, item) => {
                const teamKey = item[groupByTeam] || 'Khác';
                if (!acc[teamKey]) acc[teamKey] = [];
                acc[teamKey].push(item);
                return acc;
            }, {});

            return {
                label: deptLabel,
                teams: Object.entries(teamGrouped).map(([teamLabel, teamItems]) => ({
                    label: teamLabel,
                    options: teamItems.map(item => ({ item }))
                }))
            };
        });
    }
}
