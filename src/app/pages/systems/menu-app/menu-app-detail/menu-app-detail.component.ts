import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../../services/app-user.service';
import { MenuAppService } from '../menu-app.service';
import { MenuApp } from '../model/menu-app';
import { CommonModule } from '@angular/common';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, GridOption, OnSelectedRowsChangedEventArgs } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
    selector: 'app-menu-app-detail',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzGridModule,
        NzInputNumberModule,
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzRadioModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        NzUploadModule,
        NzTreeSelectModule,
        NzIconModule,
        FormsModule,
        AngularSlickgridModule,
    ],
    templateUrl: './menu-app-detail.component.html',
    styleUrl: './menu-app-detail.component.css'
})
export class MenuAppDetailComponent {
    validateForm !: FormGroup;
    @Input() menu = new MenuApp();

    nodes: any[] = [];
    inputValue: string | null = null;

    //Khai báo biến slickgrid
    angularGrid!: AngularGridInstance;
    grdData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    userGroups: any[] = [];

    @ViewChild('grid-container-detail', { static: true })
    gridContainerDetail!: ElementRef;


    constructor(
        public activeModal: NgbActiveModal,
        public fb: NonNullableFormBuilder,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private menuService: MenuAppService,
    ) { }


    ngOnInit(): void {
        this.initForm();
        this.initGrid();
        this.getMenus();
    }

    initForm() {
        this.validateForm = this.fb.group({
            STT: this.fb.control(this.menu.STT, [Validators.required]),
            Code: this.fb.control(this.menu.Code, [Validators.required]),
            Title: this.fb.control(this.menu.Title, [Validators.required]),
            Router: this.fb.control(this.menu.Router),
            QueryParam: this.fb.control(this.menu.QueryParam),
            Icon: this.fb.control(this.menu.Icon),
            ParentID: this.fb.control(this.menu.ParentID),
        });
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'Code',
                name: 'Mã quyền',
                field: 'Code',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            {
                id: 'Name',
                name: 'Tên quyền',
                field: 'Name',
                type: 'string',
                sortable: true, filterable: true,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },


        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
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
        };
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.grdData = angularGrid?.slickGrid || {};

        this.grdData.setSelectedRows([1, 2, 3]);
    }

    getMenus() {
        let keyword = '';
        this.menuService.getAll(keyword).subscribe({
            next: (repsonse) => {

                const menus = repsonse.data.menus;
                this.userGroups = repsonse.data.userGroups;

                if ((this.menu.ID || 0) <= 0) {
                    let stt = Math.max(...menus.map((x: any) => x.STT ?? 0));
                    this.validateForm.get('STT')?.setValue(stt + 1);
                    this.validateForm.get('Code')?.setValue(`M${stt + 1}`);
                }

                this.userGroups = this.userGroups.map((x: any) => ({
                    ...x,
                    id: x.ID
                }));

                const map = new Map<number, any>();
                this.nodes = [];
                // Tạo map trước
                menus.forEach((item: any) => {
                    map.set(item.ID, {
                        title: item.Title,
                        key: item.ID,
                        isLeaf: true,
                        children: []
                    });
                });

                // Gắn cha – con
                menus.forEach((item: any) => {
                    const node = map.get(item.ID);

                    if (item.ParentID && map.has(item.ParentID)) {
                        const parent = map.get(item.ParentID);
                        parent.children.push(node);
                        parent.isLeaf = false;
                    } else {
                        this.nodes.push(node);
                    }
                });
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
            },
        })
    }

    submitForm() {
        if (!this.validateForm.valid) {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        } else {

            console.log(this.angularGrid);
            const selectedData = this.angularGrid.gridService.getSelectedRows();
            const userGroupSelecteds = selectedData.map((idx: number) => {
                const item = this.grdData.getDataItem(idx);
                return item;
            });

            const menu = {
                ...this.menu,
                ...this.validateForm.getRawValue(),
                MenuAppUserGroupLinks: userGroupSelecteds.map((x: any) => ({
                    UserGroupID: x.ID
                }))
            };

            this.menuService.saveData(menu).subscribe({
                next: (response) => {
                    console.log(response);

                    this.getMenus();

                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
                }
            });


        }
    }


    // handleRowSelection(e: Event, args: OnSelectedRowsChangedEventArgs) {
    //     if (Array.isArray(args.rows) && this.gridData) {

    //         console.log('multiple row checkbox selected', event, args);

    //         const item = args.rows.map((idx: number) => {
    //             const item = this.gridData.getDataItem(idx);
    //             return item;
    //         });

    //         console.log('item selected:', item);
    //     }
    // }
}
