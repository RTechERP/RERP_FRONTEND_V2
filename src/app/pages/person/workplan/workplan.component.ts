import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { GridOption } from '@slickgrid-universal/common';
import { AngularGridInstance, AngularSlickgridModule, Column, ContextMenu, ExtensionName, Filters, Formatters, GridOption } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { WorkPlan, WorkPlanFields } from './WorkPlan';
import { WorkplanService } from './workplan.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
    selector: 'app-workplan',
    imports: [
        Menubar,
        NzGridModule,
        // FormsModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        NzLayoutModule,
        AngularSlickgridModule,
        ReactiveFormsModule,
        NzFormModule
    ],
    templateUrl: './workplan.component.html',
    styleUrl: './workplan.component.css',
    standalone: true
})
export class WorkplanComponent implements OnInit {


    items: MenuItem[] | undefined;

    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    workplan!: WorkPlan;

    constructor(
        private service: WorkplanService,
        private notification: NzNotificationService,

    ) {

    }

    ngOnInit() {
        this.items = [
            {
                label: 'Home',
                icon: 'pi pi-home'
            },
            {
                label: 'Features',
                icon: 'pi pi-star'
            },
            {
                label: 'Projects',
                icon: 'pi pi-search',
                items: [
                    {
                        label: 'Components',
                        icon: 'pi pi-bolt'
                    },
                    {
                        label: 'Blocks',
                        icon: 'pi pi-server'
                    },
                    {
                        label: 'UI Kit',
                        icon: 'pi pi-pencil'
                    },
                    {
                        label: 'Templates',
                        icon: 'pi pi-palette',
                        items: [
                            {
                                label: 'Apollo',
                                icon: 'pi pi-palette'
                            },
                            {
                                label: 'Ultima',
                                icon: 'pi pi-palette'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Contact',
                icon: 'pi pi-envelope'
            }
        ]

        this.initializeGrid();
    }



    //Sự kiện tìm kiếm
    onSearch() {
        this.dataset = [];
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
        this.updateCount(WorkPlanFields.FullName.field);
    }

    get contextMenuInstance() {
        return this.angularGrid?.extensionService?.getExtensionInstanceByName(ExtensionName.contextMenu);
    }


    initializeGrid() {
        this.columnDefinitions = [
            {
                id: WorkPlanFields.StartDate.field,
                name: WorkPlanFields.StartDate.name,
                field: WorkPlanFields.StartDate.field,
                type: WorkPlanFields.StartDate.type,
                sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] }

            },
            {
                id: WorkPlanFields.EndDate.field,
                name: WorkPlanFields.EndDate.name,
                field: WorkPlanFields.EndDate.field,
                type: WorkPlanFields.EndDate.type,
                sortable: true, filterable: true,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] }

            },
            {
                id: WorkPlanFields.TotalDay.field,
                name: WorkPlanFields.TotalDay.name,
                field: WorkPlanFields.TotalDay.field,
                type: WorkPlanFields.TotalDay.type,
                sortable: true, filterable: true,
                filter: { model: Filters['compoundInputNumber'] }
            },
            {
                id: WorkPlanFields.FullName.field,
                name: WorkPlanFields.FullName.name,
                field: WorkPlanFields.FullName.field,
                type: WorkPlanFields.FullName.type,
                sortable: true, filterable: true,
                customTooltip: {
                    useRegularTooltip: true,
                    useRegularTooltipFromCellTextOnly: true,
                },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: WorkPlanFields.Project.field,
                name: WorkPlanFields.Project.name,
                field: WorkPlanFields.Project.field,
                type: WorkPlanFields.Project.type,
                sortable: true, filterable: true,
                customTooltip: {
                    useRegularTooltip: true,
                    useRegularTooltipFromCellTextOnly: true,
                },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: WorkPlanFields.Location.field,
                name: WorkPlanFields.Location.name,
                field: WorkPlanFields.Location.field,
                type: WorkPlanFields.Location.type,
                sortable: true, filterable: true,
                customTooltip: {
                    useRegularTooltip: true,
                    useRegularTooltipFromCellTextOnly: true,
                },
                filter: { model: Filters['compoundInputText'] }
            },
            {
                id: WorkPlanFields.WorkContent.field,
                name: WorkPlanFields.WorkContent.name,
                field: WorkPlanFields.WorkContent.field,
                type: WorkPlanFields.WorkContent.type,
                sortable: true, filterable: true,
                customTooltip: {
                    useRegularTooltip: true,
                    useRegularTooltipFromCellTextOnly: true,
                },
                filter: { model: Filters['compoundInputText'] }
            },

        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
            },
            enableFiltering: true,
            gridWidth: '100%',
            rowHeight: 50,
            datasetIdPropertyName: '_id',
            enableRowSelection: true,
            enableCellNavigation: true,
            customTooltip: {
                // formatter: this.tooltipFormatter.bind(this) as Formatter,
                // headerFormatter: this.headerFormatter,
                headerRowFormatter: (row: number, cell: number, value: any, column: Column) => {
                    const tooltipTitle = 'Custom Tooltip - Header Row (filter)';
                    return `<div class="headerrow-tooltip-title">${tooltipTitle}</div>
                            <div class="tooltip-2cols-row"><div>Column:</div> <div>${column.field}</div></div>`;
                },
                usabilityOverride: (args) => args.cell !== 0 && args?.column?.id !== 'action', // don't show on first/last columns
                // hideArrow: true, // defaults to False
            },
            createFooterRow: true,
            showFooterRow: true,

            // enablePagination: true,
            // pagination: {
            //     pageSizes: [5, 10, 20, 25, 50],
            //     pageSize: 50,
            // },

            // cellMenu: {
            //     // all the Cell Menu callback methods (except the action callback)
            //     // are available under the grid options as shown below
            //     onCommand: (e, args) => this.executeCommand(e, args),
            //     onOptionSelected: (e, args) => {
            //         // change "Completed" property with new option selected from the Cell Menu
            //         const dataContext = args && args.dataContext;
            //         if (dataContext && 'completed' in dataContext) {
            //             dataContext.completed = args.item.option;
            //             this.angularGrid.gridService.updateItem(dataContext);
            //         }
            //     },
            //     onBeforeMenuShow: (e, args) => {
            //         // for example, you could select the row that the click originated
            //         // this.angularGrid.gridService.setSelectedRows([args.row]);
            //         console.log('Before the Cell Menu is shown', args);
            //     },
            //     onBeforeMenuClose: (e, args) => console.log('Cell Menu is closing', args),
            // },

            // load Context Menu structure
            contextMenu: {
                hideCloseButton: false,
                commandTitle: 'Commands', // optional, add title
                commandItems: [
                    // 'divider',
                    { divider: true, command: '', positionOrder: 60 },
                    // {
                    //     command: 'command1', title: 'Command 1', positionOrder: 61,
                    //     // you can use the "action" callback and/or use "onCommand" callback from the grid options, they both have the same arguments
                    //     action: (e, args) => {
                    //         console.log(args.dataContext, args.column); // action callback.. do something
                    //     }
                    // },
                    {
                        command: 'edit', title: 'Sửa', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            console.log(args.dataContext, args.column);
                            // this.handleRowSelection(e, args);
                        }
                    },

                    {
                        command: 'delete', title: 'Xóa', iconCssClass: 'mdi mdi-help-circle', positionOrder: 62,
                        action: (e, args) => {
                            console.log(args.dataContext, args.column);
                        }
                    },

                ],
            }

        };

        // fill the dataset with your data (or read it from the DB)
        let params = {};
        this.service.getWorkPlans(params).subscribe({
            next: (response) => {
                console.log(response);
                this.dataset = response.data;

                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    _id: i + 1   // dành riêng cho SlickGrid
                }));

            },
            error: (err) => {
                console.log(err);
                // this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
            }
        })
    }

    showContextCommandsAndOptions(showBothList: boolean) {
        // when showing both Commands/Options, we can just pass an empty array to show over all columns
        // else show on all columns except Priority
        const showOverColumnIds = showBothList ? [] : ['id', 'title', 'complete', 'start', 'finish', 'completed', 'action'];
        this.contextMenuInstance?.setOptions({
            commandShownOverColumnIds: showOverColumnIds,
            // hideCommandSection: !showBothList
        });
    }

    handleRowSelection(e: Event, args: any) {
        if (Array.isArray(args.rows) && this.gridData) {
            const item = args.rows.map((idx: number) => {
                const item = this.gridData.getDataItem(idx);
                return item;
            });

            // console.log('selected item:', item);
        }
    }

    updateCount(cell: string) {
        let column: any = this.angularGrid.slickGrid?.getColumns().find(x => x.id == cell);
        let columnId = column.id as number;
        console.log(columnId);


        // let total = 0;
        // let i = this.dataset.length;
        // while (i--) {
        //     total += parseInt(this.dataset[i][columnId], 10) || 0;
        // }
        const columnElement = this.angularGrid.slickGrid?.getFooterRowColumn(columnId);
        if (columnElement) {
            columnElement.textContent = `${this.dataset.length}`;
        }
    }


    getContextMenuOptions(): ContextMenu {
        return {
            hideCloseButton: false,
            // optionally and conditionally define when the the menu is usable,
            // this should be used with a custom formatter to show/hide/disable the menu
            menuUsabilityOverride: (args) => {
                const dataContext = args && args.dataContext;
                return dataContext.id < 21; // say we want to display the menu only from Task 0 to 20
            },
            // which column to show the command list? when not defined it will be shown over all columns
            commandShownOverColumnIds: ['id', 'title', 'percentComplete', 'start', 'finish', 'completed' /*, 'priority', 'action' */],
            commandTitleKey: 'COMMANDS', // this title is optional, you could also use "commandTitle" when not using Translate
            commandItems: [
                { divider: true, command: '', positionOrder: 61 },
                {
                    command: 'delete-row',
                    titleKey: 'DELETE_ROW',
                    iconCssClass: 'mdi mdi-close',
                    cssClass: 'red',
                    textCssClass: 'bold',
                    positionOrder: 62,
                },
                // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
                // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
                // 'divider',
                { divider: true, command: '', positionOrder: 63 },
                {
                    command: 'help',
                    titleKey: 'HELP',
                    iconCssClass: 'mdi mdi-help-circle',
                    positionOrder: 64,
                    // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
                    action: (_e, _args) => {
                        // action callback.. do something
                    },
                    // only show command to 'Help' when the task is Not Completed
                    itemVisibilityOverride: (args) => {
                        const dataContext = args && args.dataContext;
                        return !dataContext.completed;
                    },
                },
                { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true, positionOrder: 65 },
                { command: '', divider: true, positionOrder: 98 },
                {
                    // we can also have multiple nested sub-menus
                    command: 'export',
                    title: 'Exports',
                    positionOrder: 99,
                    commandItems: [
                        { command: 'exports-txt', title: 'Text (tab delimited)' },
                        {
                            command: 'sub-menu',
                            title: 'Excel',
                            cssClass: 'green',
                            subMenuTitle: 'available formats',
                            subMenuTitleCssClass: 'text-italic orange',
                            commandItems: [
                                { command: 'exports-csv', title: 'Excel (csv)' },
                                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
                            ],
                        },
                    ],
                },
                {
                    command: 'feedback',
                    title: 'Feedback',
                    positionOrder: 100,
                    commandItems: [
                        {
                            command: 'request-update',
                            title: 'Request update from supplier',
                            iconCssClass: 'mdi mdi-star',
                            tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
                        },
                        'divider',
                        {
                            command: 'sub-menu',
                            title: 'Contact Us',
                            iconCssClass: 'mdi mdi-account',
                            subMenuTitle: 'contact us...',
                            subMenuTitleCssClass: 'italic',
                            commandItems: [
                                { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                                { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                                { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
                            ],
                        },
                    ],
                },
            ],

            // Options allows you to edit a column from an option chose a list
            // for example, changing the Priority value
            // you can also optionally define an array of column ids that you wish to display this option list (when not defined it will show over all columns)
            optionTitleKey: 'CHANGE_PRIORITY',
            optionShownOverColumnIds: ['priority'], // optional, when defined it will only show over the columns (column id) defined in the array
            optionItems: [
                {
                    option: 0,
                    title: 'n/a',
                    textCssClass: 'italic',
                    // only enable this option when the task is Not Completed
                    itemUsabilityOverride: (args: any) => {
                        const dataContext = args && args.dataContext;
                        return !dataContext.completed;
                    },
                    // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
                    action: (_e: Event, _args: any) => {
                        // action callback.. do something
                    },
                },
                { option: 1, iconCssClass: 'mdi mdi-star-outline yellow', titleKey: 'LOW' },
                { option: 2, iconCssClass: 'mdi mdi-star orange', titleKey: 'MEDIUM' },
                { option: 3, iconCssClass: 'mdi mdi-star red', titleKey: 'HIGH' },
                // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
                // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
                'divider',
                // { divider: true, option: '', positionOrder: 3 },
                {
                    option: 4,
                    title: 'Extreme',
                    iconCssClass: 'mdi mdi-fire',
                    disabled: true,
                    // only shown when the task is Not Completed
                    itemVisibilityOverride: (args: any) => {
                        const dataContext = args && args.dataContext;
                        return !dataContext.completed;
                    },
                },
                {
                    // we can also have multiple nested sub-menus
                    option: null,
                    title: 'Sub-Options (demo)',
                    subMenuTitleKey: 'CHANGE_PRIORITY',
                    optionItems: [
                        { option: 1, iconCssClass: 'mdi mdi-star-outline yellow', titleKey: 'LOW' },
                        { option: 2, iconCssClass: 'mdi mdi-star orange', titleKey: 'MEDIUM' },
                        { option: 3, iconCssClass: 'mdi mdi-star red', titleKey: 'HIGH' },
                    ],
                },
            ],
            // subscribe to Context Menu
            // onBeforeMenuShow: (e, args) => {
            //     // for example, you could select the row it was clicked with
            //     // grid.setSelectedRows([args.row]); // select the entire row
            //     this.angularGrid.slickGrid.setActiveCell(args.row, args.cell, false); // select the cell that the click originated
            //     console.log('Before the global Context Menu is shown', args);
            // },
            // onBeforeMenuClose: (e, args) => console.log('Global Context Menu is closing', args),

            // // subscribe to Context Menu onCommand event (or use the action callback on each command)
            // onCommand: (e, args) => this.executeCommand(e, args),

            // // subscribe to Context Menu onOptionSelected event (or use the action callback on each option)
            // onOptionSelected: (e, args) => {
            //     // change Priority
            //     const dataContext = args && args.dataContext;
            //     if (dataContext && 'priority' in dataContext) {
            //         dataContext.priority = args.item.option;
            //         this.angularGrid.gridService.updateItem(dataContext);
            //     }
            // },
        };
    }
}
