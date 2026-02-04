import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, SortComparers, SortDirectionNumber } from 'angular-slickgrid';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { LuckyNumberService } from './lucky-number.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../services/app-user.service';
import { LuckyNumberDetailComponent } from './lucky-number-detail/lucky-number-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { defer, delay, interval, retryWhen, Subject, take, takeUntil, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { EmployeeLuckyNumber } from './employee-lucky-number';

@Component({
    selector: 'app-lucky-number',
    imports: [
        CommonModule,
        Menubar,
        AngularSlickgridModule,
        NzModalModule
    ],
    templateUrl: './lucky-number.component.html',
    styleUrl: './lucky-number.component.css'
})
export class LuckyNumberComponent implements OnInit {

    isPerson = 0;
    menuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: 'fa-solid fa-circle-plus fa-lg text-success',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.onCreate();
            },
        },

        // {
        //     label: 'Sửa',
        //     icon: 'fa-solid fa-file-pen fa-lg text-primary',
        //     // visible: this.permissionService.hasPermission(""),
        //     command: () => {
        //         // this.onEdit();
        //     },
        // },
        // {
        //     label: 'Xóa',
        //     icon: 'fa-solid fa-trash fa-lg text-danger',
        //     // visible: this.permissionService.hasPermission(""),
        //     command: () => {
        //         // this.onDelete();
        //     },
        // },

        {
            label: 'Refresh',
            icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.loadData();
            },
        },
        {
            label: 'Nhận số may mắn',
            icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
            // visible: this.permissionService.hasPermission(""),
            command: () => {
                this.getRandomNumber();
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

    spinStop$ = new Subject<void>();
    isVisible = false;
    luckyNumber = 0;
    year = 2026;

    constructor(
        private luckynumberService: LuckyNumberService,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }


    ngOnInit(): void {

        this.route.queryParams.subscribe(params => {
            this.isPerson =
                params['activeTab']
                ?? this.tabData?.isPerson
                ?? 0;
        });

        // this.loadData();
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
                // formatter: Formatters.tree,
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
                container: '.grid-container-luckynumber' + this.isPerson,
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


    loadData() {

        this.luckynumberService.getall(this.param).subscribe({
            next: (response) => {

                // console.log('response:', response);
                this.dataset = response.data;
                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    id: i + 1
                }));


                // console.log('this.dataset:', this.dataset);
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    });
            },
        })
    }


    // getRandomNumber() {
    //     this.isVisible = true;

    //     const interval = setInterval(() => {
    //         this.luckyNumber = Math.floor(Math.random() * 100) + 1;
    //     }, 100); // số nhảy liên tục

    //     setTimeout(() => {
    //         clearInterval(interval); // dừng quay
    //         this.luckyNumber = Math.floor(Math.random() * 100) + 1; // số cuối


    //         const obj = {
    //             PhoneNumber: '',
    //             ImageName: ''
    //         }

    //         this.luckynumberService.getRandomNumber(obj).subscribe({
    //             next: (response) => {
    //                 this.luckyNumber = response.data.randomNumber;
    //             },
    //             error: (err) => {
    //                 this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
    //                     {
    //                         nzStyle: { whiteSpace: 'pre-line' }
    //                     });
    //             },
    //         })
    //     }, 5000); // quay 5 giây
    // }



    startSpin() {
        this.spinStop$.next(); // 🔥 kill mọi spin cũ

        interval(100).pipe(
            takeUntil(this.spinStop$)
        ).subscribe(() => {
            this.luckyNumber = Math.floor(Math.random() * 100) + 1;
        });
    }

    stopSpin() {
        this.spinStop$.next(); // 🔥 DỪNG NGAY LẬP TỨC
    }




    getRandomNumber() {
        this.isVisible = true;

        const interval = setInterval(() => {
            this.luckyNumber = Math.floor(Math.random() * 100) + 1;
        }, 100);

        setTimeout(() => {
            clearInterval(interval);

            const obj = {
                PhoneNumber: '',
                ImageName: ''
            };

            this.luckynumberService.getRandomNumber(obj).pipe(
                retryWhen(errors =>
                    errors.pipe(
                        tap(() => {
                            console.warn('Retry getRandomNumber...');
                            // có thể cho số quay lại nếu muốn
                            this.luckyNumber = Math.floor(Math.random() * 100) + 1;
                        }),
                        delay(500),       // đợi 0.5s rồi gọi lại
                        take(5)           // tối đa 5 lần retry
                    )
                )
            ).subscribe({
                next: (response) => {
                    this.luckyNumber = response.data.randomNumber;
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                        {
                            nzStyle: { whiteSpace: 'pre-line' }
                        });
                }
            });

        }, 5000);
    }

    // getRandomNumber() {
    //     this.isVisible = true;

    //     const obj = {
    //         PhoneNumber: '',
    //         ImageName: ''
    //     };

    //     this.startSpin(); // quay lần đầu

    //     this.luckynumberService.getRandomNumber(obj).pipe(
    //         retryWhen(errors =>
    //             errors.pipe(
    //                 tap(() => {
    //                     console.warn('Retry...');
    //                     this.startSpin(); // 🔁 retry → quay lại
    //                 }),
    //                 delay(500),
    //                 take(5)
    //             )
    //         )
    //     ).subscribe({
    //         next: (res) => {
    //             this.stopSpin(); // ✅ CHẮC CHẮN DỪNG
    //             this.luckyNumber = res.data.randomNumber;
    //         },
    //         error: () => {
    //             this.stopSpin(); // ✅ FAIL CŨNG DỪNG
    //             this.notification.error(
    //                 NOTIFICATION_TITLE.error,
    //                 'Không thể lấy số may mắn'
    //             );
    //         }
    //     });
    // }

    handleOk(): void {
        this.spinStop$.next();
        this.spinStop$.complete();
        this.isVisible = false;


        // const obj = {
        //     EmployeeID: this.appUserService?.currentUser?.EmployeeID || 0,
        //     EmployeeCode: this.appUserService?.currentUser?.Code || '',
        //     EmployeeName: this.appUserService?.currentUser?.FullName || '',
        //     PhoneNumber: '',
        //     YearValue: this.year,
        //     LuckyNumber: this.luckyNumber,
        //     ImageName: ''
        // }
        // this.luckynumberService.savedata(obj).subscribe({
        //     next: (response) => {
        //         console.log('response:', response);
        //     },
        //     error: (err) => {
        //         this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
        //             {
        //                 nzStyle: { whiteSpace: 'pre-line' }
        //             });
        //     },
        // })
    }


    initModal(employeeLucky: any = new EmployeeLuckyNumber()) {
        const modalRef = this.modalService.open(LuckyNumberDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            // fullscreen: true,
        });

        modalRef.componentInstance.employeeLucky = employeeLucky;
        modalRef.result.then(
            (result) => {
                this.loadData();
            },
            () => {
                // Modal dismissed
            }
        );
    }

    onCreate() {
        this.initModal();
    }
}
