import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, SortComparers, SortDirectionNumber } from 'angular-slickgrid';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { LuckyNumberService } from './lucky-number.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../services/app-user.service';
import { LuckyNumberDetailComponent } from './lucky-number-detail/lucky-number-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
    selector: 'app-lucky-number',
    imports: [
        CommonModule,
        Menubar,
        AngularSlickgridModule
    ],
    templateUrl: './lucky-number.component.html',
    styleUrl: './lucky-number.component.css'
})
export class LuckyNumberComponent implements OnInit {

    menuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: 'fa-solid fa-circle-plus fa-lg text-success',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                // this.onCreate();
            },
        },

        {
            label: 'Sửa',
            icon: 'fa-solid fa-file-pen fa-lg text-primary',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                // this.onEdit();
            },
        },
        {
            label: 'Xóa',
            icon: 'fa-solid fa-trash fa-lg text-danger',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                // this.onDelete();
            },
        },
        { separator: true },

        {
            label: 'Refresh',
            icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                // this.loadData();
            },
        },
    ];

    param = {
        year: 2026,
        departmentID: 0,
        employeeID: 0,
        keyword: ''
    }

    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    constructor(
        private luckynumberService: LuckyNumberService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
    ) { }


    ngOnInit(): void {
        this.initGrid();
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'STT',
                name: 'STT',
                field: 'STT',
                type: 'number',
                sortable: true, filterable: true,
                formatter: Formatters.tree,
                filter: { model: Filters['compoundInputNumber'] }

            },
            {
                id: 'Code',
                name: 'Mã nhân viên',
                field: 'Code',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'FullName',
                name: 'Họ tên',
                field: 'FullName',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'PositionName',
                name: 'Chức vụ',
                field: 'PositionName',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            {
                id: 'YearValue',
                name: 'Năm',
                field: 'YearValue',
                type: 'number',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputNumber'] }

            },
            {
                id: 'LuckyNumber',
                name: 'Số bốc thăm',
                field: 'LuckyNumber',
                type: 'number',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputNumber'] }

            },
            {
                id: 'StartWorking',
                name: 'Ngày vào',
                field: 'StartWorking',
                type: 'string',
                sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] }
            },
            {
                id: 'BirthOfDate',
                name: 'Ngày sinh',
                field: 'BirthOfDate',
                type: 'string',
                sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] }
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
            enableGrouping: true,
        };

        this.loadData();
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};

        if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.setGrouping({
                getter: 'DepartmentName',  // the column `field` to group by
                formatter: (g) => {
                    // (required) what will be displayed on top of each group
                    return `${g.value} <span style="">(${g.count} items)</span>`;
                },
                comparer: (a, b) => {
                    // (optional) comparer is helpful to sort the grouped data
                    // code below will sort the grouped value in ascending order
                    return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
                },
                // aggregators: [
                //     // (optional), what aggregators (accumulator) to use and on which field to do so
                //     new Aggregators.Avg('percentComplete'),
                //     new Aggregators.Sum('cost')
                // ],
                aggregateCollapsed: false,  // (optional), do we want our aggregator to be collapsed?
                lazyTotalsCalculation: true // (optional), do we want to lazily calculate the totals? True is commonly used
            });
        }

    }

    initModal(menu: any) {
        const modalRef = this.modalService.open(LuckyNumberDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            fullscreen: false,
        });

        modalRef.componentInstance.menu = menu;

        modalRef.result.finally(() => {
            this.loadData();
        })

    }

    loadData() {

        this.luckynumberService.getall(this.param).subscribe({
            next: (response) => {

                this.dataset = response.data;
                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    id: i + 1
                }));
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        })
    }
}
