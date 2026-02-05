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
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

@Component({
    selector: 'app-lucky-number',
    imports: [
        CommonModule,
        FormsModule,
        Menubar,
        AngularSlickgridModule,
        NzModalModule,
        NzStepsModule,
        NzButtonModule,
        NzTabsModule,
        NzUploadModule,
        NzIconModule,
        NzInputModule,
    ],
    templateUrl: './lucky-number.component.html',
    styleUrl: './lucky-number.component.css'
})
export class LuckyNumberComponent implements OnInit {

    isPerson = 0;
    menuBars: MenuItem[] = [];

    param = {
        year: 2026,
        departmentID: 0,
        employeeID: 0,
        keyword: ''
    }

    employeeLucky: any = {};

    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    excelExportService = new ExcelExportService();

    spinStop$ = new Subject<void>();
    isVisible = false;
    isVisibleFinal = false;
    year = 2026;
    luckyNumber = 0;

    luckyColor = '';
    luckyClass = '';
    modalBodyStyle: any = {};

    selectedIndex = 0;
    employeeLuckyName = '';


    getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

    fileList: NzUploadFile[] = [];
    previewImage: string | undefined = '';
    previewVisible = false;

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
                params['isPerson']
                ?? this.tabData?.isPerson
                ?? 0;
        });

        // console.log('isPerson:', this.isPerson);

        // this.isVisible = this.isPerson == 1;


        this.initMenuBar();
        this.initGrid();


    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                visible: this.isPerson == 0,
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
                icon: 'fa-solid fa-clover fa-lg text-success',
                // visible: this.permissionService.hasPermission(""),
                command: () => {
                    this.onGetNumber();
                },
            },
            {
                label: 'Xuất excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.excelExportService.exportToExcel({
                        filename: `DanhSanhNhanVienQuaySo_2026`,
                        format: 'xlsx'
                    });

                }
            },
        ];
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'STT',
                name: 'STT',
                field: 'STT',
                type: 'number',
                sortable: true, filterable: true,
                minWidth: 50,
                // formatter: Formatters.tree,
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-center'

            },
            {
                id: 'LuckyNumber',
                name: 'Số may mắn',
                field: 'LuckyNumber',
                type: 'number',
                sortable: true, filterable: true,
                minWidth: 80,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'

            },
            {
                id: 'Code',
                name: 'Mã nhân viên',
                field: 'Code',
                type: 'string',
                sortable: true, filterable: true,
                minWidth: 100,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'FullName',
                name: 'Họ tên',
                field: 'FullName',
                type: 'string',
                sortable: true, filterable: true,
                minWidth: 150,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },

            {
                id: 'PositionName',
                name: 'Chức vụ',
                field: 'PositionName',
                type: 'string',
                sortable: true, filterable: true,
                minWidth: 150,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] }

            },
            // {
            //     id: 'PhoneNumber',
            //     name: 'SĐT',
            //     field: 'PhoneNumber',
            //     type: 'string',
            //     sortable: true, filterable: true,
            //     minWidth: 200,
            //     // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
            //     filter: { model: Filters['compoundInputText'] }

            // },
            {
                id: 'YearValue',
                name: 'Năm',
                field: 'YearValue',
                type: 'number',
                sortable: true, filterable: true,
                minWidth: 50,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputNumber'] },
                cssClass: 'text-end'

            },

            {
                id: 'ImageName',
                name: 'Avartar',
                field: 'ImageName',
                type: 'number',
                sortable: true, filterable: true,
                minWidth: 200,
                // formatter: Formatters.icon, params: { iconCssClass: 'mdi mdi-trash-can pointer' },
                filter: { model: Filters['compoundInputText'] },
                onCellClick(e, args) {
                    // console.log('args:', args.dataContext.ImageName);
                    // console.log('e:', e);
                    const imageUrl = environment.host + `api/share/software/imageemployeeluckynumber/2026/${args.dataContext.ImageName || ''}`;
                    window.open(imageUrl, '_blank');
                },

            },
            {
                id: 'StartWorking',
                name: 'Ngày vào',
                field: 'StartWorking',
                type: 'string',
                sortable: true, filterable: true,
                minWidth: 100,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
            },
            {
                id: 'BirthOfDate',
                name: 'Ngày sinh',
                field: 'BirthOfDate',
                type: 'string',
                sortable: true, filterable: true,
                minWidth: 100,
                formatter: Formatters.date, params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                cssClass: 'text-center'
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
                hideInFilterHeaderRow: true,
                hideInColumnTitleRow: false,
                applySelectOnAllPages: true, // when clicking "Select All", should we apply it to all pages (defaults to true)
            },
            enableCheckboxSelector: true,
            enableGrouping: true,
            showFooterRow: true,
            createFooterRow: true,
            forceFitColumns: true,

            //Config xuất excel
            externalResources: [this.excelExportService],
            enableExcelExport: true,
            excelExportOptions: {
                // filename: `TheoDoiChiPhiVP_${DateTime.fromJSDate(new Date()).toFormat()}`,
                sanitizeDataExport: true,
                exportWithFormatter: true,
            },

            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
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

        angularGrid.dataView.onRowCountChanged.subscribe(() => {
            const items = angularGrid.dataView.getItems(); // chỉ data thật
            const count = items.length;
            // console.log('Row count:', count);
            const columnElement = angularGrid.slickGrid?.getFooterRowColumn('STT');
            if (columnElement) {
                columnElement.textContent = `${this.formatNumber(count, 0)}`;
            }
        });
    }

    formatNumber(num: number, digits: number = 2) {
        num = num || 0;
        return num.toLocaleString('vi-VN', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }

    loadData() {

        this.param.employeeID = this.isPerson == 0 ? 0 : this.appUserService?.currentUser?.EmployeeID || 0;
        this.luckynumberService.getall(this.param).subscribe({
            next: (response) => {

                // console.log('response:', response);
                this.dataset = response.data;
                this.dataset = this.dataset.map((x, i) => ({
                    ...x,
                    id: i + 1
                }));

                if (this.isPerson == 1) {
                    this.gridData.setSelectedRows([1]);

                    this.employeeLucky = this.dataset.find(x => x.EmployeeID == this.appUserService?.currentUser?.EmployeeID);
                    if (this.employeeLucky) this.onGetNumber();
                }
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

    randomColor(): string {
        let color = '#000000';

        while (color === '#000000' || color === '#FFFFFF') {
            color =
                '#' +
                Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')
                    .toUpperCase();
        }

        return color;
    }



    getRandomNumber() {
        this.isVisible = true;
        this.isVisibleFinal = false;
        this.modalBodyStyle = {};

        const interval = setInterval(() => {
            this.luckyNumber = Math.floor(Math.random() * 225) + 1;
            this.luckyColor = this.randomColor();
        }, 70); // số nhảy liên tục

        setTimeout(() => {
            clearInterval(interval); // dừng quay
            this.luckyNumber = Math.floor(Math.random() * 225) + 1; // số cuối
            this.luckyColor = this.randomColor();

            const obj = {
                PhoneNumber: '',
                ImageName: ''
            }

            this.luckynumberService.getRandomNumber(obj).subscribe({
                next: (response) => {
                    this.luckyNumber = response.data.randomNumber;
                    this.luckyClass = 'congratulations';

                    this.modalBodyStyle = {
                        'background-image': "url('assets/images/congratulations.gif')",
                        'background-position': 'center',
                        'background-repeat': 'no-repeat',
                        'background-size': 'cover' // hoặc cover
                    };

                    this.isVisibleFinal = true;
                },
                error: (err) => {
                    // this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    //     {
                    //         nzStyle: { whiteSpace: 'pre-line' }
                    //     });
                    this.luckyNumber = 0;
                    this.luckyClass = '';
                    this.modalBodyStyle = {};
                    this.notification.error(NOTIFICATION_TITLE.error, "Có lỗi xảy ra. Vui lòng quay số lại!",
                        {
                            nzStyle: { whiteSpace: 'pre-line' }
                        });

                },
            })
        }, 5000); // quay 5 giây
    }



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




    // getRandomNumber() {


    //     const interval = setInterval(() => {
    //         this.luckyNumber = Math.floor(Math.random() * 100) + 1;
    //     }, 100);

    //     setTimeout(() => {
    //         clearInterval(interval);

    //         const obj = {
    //             PhoneNumber: '',
    //             ImageName: ''
    //         };

    //         this.luckynumberService.getRandomNumber(obj).pipe(
    //             retryWhen(errors =>
    //                 errors.pipe(
    //                     tap(() => {
    //                         console.warn('Retry getRandomNumber...');
    //                         // có thể cho số quay lại nếu muốn
    //                         this.luckyNumber = Math.floor(Math.random() * 100) + 1;
    //                     }),
    //                     delay(500),       // đợi 0.5s rồi gọi lại
    //                     take(5)           // tối đa 5 lần retry
    //                 )
    //             )
    //         ).subscribe({
    //             next: (response) => {
    //                 this.luckyNumber = response.data.randomNumber;
    //             },
    //             error: (err) => {
    //                 this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
    //                     {
    //                         nzStyle: { whiteSpace: 'pre-line' }
    //                     });
    //             }
    //         });

    //     }, 5000);
    // }

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
        // this.spinStop$.next();
        // this.spinStop$.complete();
        // this.isVisible = false;

        this.selectedIndex = 1;

        this.getRandomNumber();

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

    handleCancel(): void {
        this.isVisible = false;
        this.luckyClass = '';
        this.modalBodyStyle = {};
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

    // onIndexChange(index: number): void {
    //     this.index = index;
    // }

    handlePreview = async (file: NzUploadFile): Promise<void> => {
        if (!file.url && !file['preview']) {
            file['preview'] = await this.getBase64(file.originFileObj!);
        }
        this.previewImage = file.url || file['preview'];
        this.previewVisible = true;
    };


    onChangeTab(event: any) {

        console.log('event:', event.index);
        if (event.index == 0) return;
        const fileUploads = this.fileList.map((x: any) => x.originFileObj);
        // console.log('this.employeeLucky:', this.employeeLucky);
        this.luckynumberService.uploadFile(fileUploads, this.employeeLucky.EmployeeLuckyNumberID, this.employeeLucky.PhoneNumber).subscribe({
            next: (reponse) => {
                // console.log(reponse);

                if (reponse.status == 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, reponse.message);
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    });
            }
        })
    }


    onGetNumber() {
        const activeCell = this.angularGrid.slickGrid.getSelectedRows();

        // console.log('activeCell:', activeCell);
        if (activeCell.length > 0) {


            this.isVisible = true;
            const rowIndex = activeCell[0];

            // console.log('Rowindex:', rowIndex);
            // console.log('getItems:', this.angularGrid.dataView.getItems());
            // this.employeeLucky = this.angularGrid.dataView.getItem(rowIndex); //as EmployeeLuckyNumber;
            const item = this.angularGrid.dataView.getItem(rowIndex); //as EmployeeLuckyNumber;
            if (item) this.employeeLucky = item;
            this.employeeLuckyName = this.employeeLucky.Code + ' - ' + this.employeeLucky.FullName;
        }
    }
}
