import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuApp } from './model/menu-app';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, GridOption } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../services/app-user.service';
import { MenuAppService } from './menu-app.service';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MenuAppDetailComponent } from './menu-app-detail/menu-app-detail.component';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import Swal from 'sweetalert2';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
    selector: 'app-menu-app',
    imports: [
        Menubar,
        AngularSlickgridModule
    ],
    templateUrl: './menu-app.component.html',
    styleUrl: './menu-app.component.css'
})
export class MenuAppComponent {

    menuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: PrimeIcons.PLUS,
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.onCreate();
            },
        },

        {
            label: 'Sửa',
            icon: PrimeIcons.PENCIL,
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.onEdit();
            },
        },
        {
            label: 'Xóa',
            icon: PrimeIcons.TRASH,
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.onDelete();
            },
        },
    ];

    //Khai báo biến slickgrid
    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    constructor(
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private menuService: MenuAppService,
    ) { }


    initGrid() {
        this.columnDefinitions = [
            {
                id: 'STT',
                name: 'STT',
                field: 'STT',
                type: 'number',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputNumber'] }

            },
            {
                id: 'Code',
                name: 'Mã',
                field: 'Code',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'Title',
                name: 'Tiêu đề',
                field: 'Title',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'Router',
                name: 'Router',
                field: 'Router',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            {
                id: 'Icon',
                name: 'Icon',
                field: 'Icon',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            {
                id: 'Permission',
                name: 'Mã quyền',
                field: 'Permission',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }
            },


        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,

            enableFiltering: true,

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

            enableTreeData: true,
            treeDataOptions: {
                columnId: 'STT',           // the column where you will have the Tree with collapse/expand icons
                // parentPropName: ,  // the parent/child key relation in your dataset
                // identifierPropName: '_id',
                // roo:0,
                levelPropName: 'treeLevel',  // optionally, you can define the tree level property name, it nothing is provided it will use "__treeLevel"
                indentMarginLeft: 15,        // optionally provide the indent spacer width in pixel, for example if you provide 10 and your tree level is 2 then it will have 20px of indentation
                exportIndentMarginLeft: 4,   // similar to `indentMarginLeft` but represent a space instead of pixels for the Export CSV/Excel
            },
            multiColumnSort: false,
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
    }

    initModal(menu: any = new MenuApp()) {

        const modalRef = this.modalService.open(MenuAppDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            fullscreen: false,
        });

        modalRef.componentInstance.menu = menu;

    }

    onCreate() {
        this.initModal();
    }

    onEdit() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = this.angularGrid.dataView.getItem(rowIndex) as MenuApp; // data object

            // console.log('Row index:', rowIndex);
            // console.log('Row data:', item);
            this.initModal(item);
        }
    }

    onDelete() {
        const activeCell = this.angularGrid.slickGrid.getActiveCell();

        if (activeCell) {
            const rowIndex = activeCell.row;        // index trong grid
            const item = this.angularGrid.dataView.getItem(rowIndex) as MenuApp; // data object

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
                    const menu = {
                        ID: item.ID,
                        IsDelete: true
                    }

                    this.menuService.saveData(menu).subscribe({
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

}
