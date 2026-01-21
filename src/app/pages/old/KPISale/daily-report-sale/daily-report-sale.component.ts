import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    IterableDiffers,
    Optional,
    Inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
    NzUploadModule,
    NzUploadFile,
    NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
    TabulatorFull as Tabulator,
    RowComponent,
    CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';

import { DailyReportSaleService } from './daily-report-sale-service/daily-report-sale.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { QuotationKhDetailComponent } from '../../quotation-kh-detail/quotation-kh-detail.component';
import { DailyReportSaleDetailComponent } from './daily-report-sale-detail/daily-report-sale-detail.component';
import { ImportExcelDailyReportComponent } from './import-excel/import-excel.component';
import { ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-daily-report-sale',
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
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
        NzInputNumberModule,
        NzSelectModule,
        NzTableModule,
        NzTabsModule,
        NzModalModule,
        NzUploadModule,
        NzSwitchModule,
        NzCheckboxModule,
        CommonModule,
        HasPermissionDirective,
    ],
    templateUrl: './daily-report-sale.component.html',
    styleUrl: './daily-report-sale.component.css'
})
export class DailyReportSaleComponent implements OnInit, AfterViewInit {
    @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;

    tb_Master!: Tabulator;

    warehouseId: number = 0;

    projects: any[] = [];
    customers: any[] = [];
    employees: any[] = [];
    // groupTypes: any[] = [];
    groupTypes: any[] = [
        { value: 0, label: 'Telesales' },
        { value: 1, label: 'Visit' },
        { value: 2, label: 'Demo/Test SP' },
    ];
    teamSales: any[] = [];
    filterTextSearch: string = '';
    mainData: any[] = [];
    isAdmin: boolean = false;
    isEmployeeIdDisabled: boolean = false; // Disable dropdown employeeId nếu không phải admin
    selectedRowId: number = 0;

    filters: any = {
        dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        dateEnd: new Date(),
        projectId: 0,
        customerId: 0,
        groupTypeId: -1,
        teamId: 0,
        employeeId: 0,
    };
    sizeSearch: string = '0';
    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }
    constructor(
        private dailyReportSaleService: DailyReportSaleService,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
        private modalService: NgbModal,
        private nzModalService: NzModalService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        // if (this.tabData && this.tabData.warehouseId) {
        //     this.warehouseId = this.tabData.warehouseId;
        // }
        this.route.queryParams.subscribe(params => {
            // this.warehouseId = params['warehouseId'] || 1
            this.warehouseId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 1;
        });
        // Kiểm tra quyền admin và set employeeId
        const currentUser = this.appUserService.currentUser;
        this.isAdmin = this.appUserService.isAdmin || (currentUser?.IsAdminSale === 1);
        this.isEmployeeIdDisabled = !this.isAdmin;

        // Nếu không phải admin, set employeeId của user hiện tại
        if (!this.isAdmin) {
            const currentEmployeeId = this.appUserService.employeeID;
            if (currentEmployeeId) {
                this.filters.employeeId = currentEmployeeId;
            }
        }

        // Nếu là AdminSale, tự động load team của nhân viên đang đăng nhập
        if (currentUser?.IsAdminSale === 1) {
            const currentEmployeeId = this.appUserService.employeeID;
            if (currentEmployeeId) {
                this.loadTeamSaleByEmployee(currentEmployeeId);
            }
        }

        this.loadProjects();
        this.loadCustomers();
        this.loadEmployees();
        this.loadEmployeeTeamSale();
        // this.loadGroupSale();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.initMainTable();
        }, 100);
    }

    searchPOKH(): void {
        if (this.tb_Master) {
            this.tb_Master.setData([]);
            this.tb_Master.replaceData();
        }
    }

    loadProjects(): void {
        this.dailyReportSaleService.getProjects().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.projects = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách dự án');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách dự án');
                console.error('Error loading projects:', error);
            }
        );
    }

    loadCustomers(): void {
        this.dailyReportSaleService.getCustomers().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.customers = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách khách hàng');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách khách hàng');
                console.error('Error loading customers:', error);
            }
        );
    }

    loadEmployees(): void {
        this.dailyReportSaleService.getEmployees().subscribe(
            (response) => {
                if (response.status === 1) {
                    // Filter bỏ các item có FullName rỗng hoặc chỉ có khoảng trắng
                    this.employees = (response.data || []).filter((item: any) => {
                        return item.FullName && item.FullName.trim().length > 0;
                    });
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
                console.error('Error loading employees:', error);
            }
        );
    }

    loadEmployeeTeamSale(): void {
        this.dailyReportSaleService.getEmployeeTeamSale().subscribe(
            (response) => {
                if (response.status === 1) {
                    this.teamSales = response.data || [];
                } else {
                    this.notification.error('Lỗi', response.message || 'Không thể tải danh sách team sale');
                }
            },
            (error) => {
                this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách team sale');
                console.error('Error loading employee team sale:', error);
            }
        );
    }

    loadTeamSaleByEmployee(employeeId: number): void {
        this.dailyReportSaleService.getTeamSaleByEmployee(employeeId).subscribe(
            (response) => {
                if (response.status === 1 && response.data) {
                    this.filters.teamId = response.data.TeamSaleID || 0;
                }
            },
            (error) => {
                console.error('Error loading team sale by employee:', error);
            }
        );
    }

    // loadGroupSale(): void {
    //   const userId = this.appUserService.id || 0;
    //   this.dailyReportSaleService.getGroupSale(userId).subscribe(
    //     (response) => {
    //       if (response.status === 1) {
    //         this.groupTypes = response.data || [];
    //       } else {
    //         this.notification.error('Lỗi', response.message || 'Không thể tải danh sách group sale');
    //       }
    //     },
    //     (error) => {
    //       this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách group sale');
    //       console.error('Error loading group sale:', error);
    //     }
    //   );
    // }

    openModal(editId: number = 0): void {
        const modalRef = this.modalService.open(DailyReportSaleDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });

        modalRef.componentInstance.editId = editId;
        modalRef.componentInstance.warehouseId = this.warehouseId;
        modalRef.result.then(
            (result) => {
                if (result && result.success && result.reloadData) {
                    this.tb_Master?.replaceData();
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    openEditModal(): void {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa!');
            return;
        }
        this.openModal(this.selectedRowId);
    }

    onDeleteDailyReportSale(): void {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa!');
            return;
        }

        // Hiển thị confirm dialog của ng-zorro trước khi xóa
        this.nzModalService.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.dailyReportSaleService.delete(this.selectedRowId).subscribe({
                    next: (response) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', 'Đã xóa báo cáo hàng ngày!');
                            this.selectedRowId = 0; // Reset selectedRowId sau khi xóa
                            this.tb_Master?.replaceData();
                        } else {
                            this.notification.error('Lỗi', response.message || 'Không thể xóa báo cáo hàng ngày!');
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting daily report sale:', error);
                        this.notification.error('Lỗi', 'Lỗi kết nối khi xóa báo cáo hàng ngày!');
                    }
                });
            }
        });
    }

    exportExcel(): void {
        const data = this.tb_Master?.getData() || [];
        if (data.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo hàng ngày');

        // Header
        worksheet.columns = [
            { header: 'Ngày thực hiện', key: 'DateStart', width: 15 },
            { header: 'Ngày dự kiến', key: 'DateEnd', width: 15 },
            { header: 'Người phụ trách', key: 'FullName', width: 20 },
            { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
            { header: 'Tên dự án', key: 'ProjectName', width: 30 },
            { header: 'Hãng', key: 'FirmName', width: 15 },
            { header: 'Loại dự án', key: 'ProjectTypeName', width: 15 },
            { header: 'Khách hàng', key: 'CustomerName', width: 30 },
            { header: 'Mã KH', key: 'CustomerCode', width: 15 },
            { header: 'Sản phẩm KH', key: 'ProductOfCustomer', width: 25 },
            { header: 'Người liên hệ', key: 'ContactName', width: 20 },
            { header: 'Loại nhóm', key: 'MainIndex', width: 15 },
            { header: 'Việc đã làm', key: 'Content', width: 30 },
            { header: 'Kết quả', key: 'Result', width: 30 },
            { header: 'Vấn đề tồn đọng', key: 'ProblemBacklog', width: 30 },
            { header: 'Kế hoạch tiếp theo', key: 'PlanNext', width: 30 },
            { header: 'End User', key: 'PartCode', width: 20 },
            { header: 'Big Account', key: 'BigAccount', width: 12 },
            { header: 'Cơ hội bán hàng', key: 'SaleOpportunity', width: 15 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };

        // Add data
        data.forEach((row: any) => {
            worksheet.addRow({
                ...row,
                DateStart: row.DateStart ? new Date(row.DateStart).toLocaleDateString('vi-VN') : '',
                DateEnd: row.DateEnd ? new Date(row.DateEnd).toLocaleDateString('vi-VN') : '',
                BigAccount: row.BigAccount ? 'Có' : 'Không',
                SaleOpportunity: row.SaleOpportunity ? 'Có' : 'Không',
            });
        });

        // Download
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BaoCaoHangNgay_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    openImportExcel(): void {
        const modalRef = this.modalService.open(ImportExcelDailyReportComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });

        modalRef.result.then(
            (result) => {
                if (result && result.success && result.reloadData) {
                    this.tb_Master?.replaceData();
                }
            },
            () => { }
        );
    }

    initMainTable(): void {
        if (!this.tb_MasterElement) {
            console.error('tb_Master element not found');
            return;
        }
        this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitColumns',
            height: '100%',
            rowHeader: false,
            pagination: true,
            paginationMode: 'remote',
            selectableRows: 1,
            paginationSize: 50,
            paginationSizeSelector: [10, 30, 50, 100, 200, 300, 500],
            ajaxURL: 'dummy',
            ajaxRequestFunc: (url, config, params) => {
                // Nếu là admin hoặc admin sale thì dùng filters.employeeId (nếu có chọn), nếu không thì lấy userId của user đăng nhập
                const currentUser = this.appUserService.currentUser;
                const isAdminOrAdminSale = this.appUserService.isAdmin || (currentUser?.IsAdminSale === 1);
                const userId = isAdminOrAdminSale ? (this.filters.employeeId || 0) : (this.appUserService.id || 0);
                const page = params.page || 1;
                const size = params.size || 50;

                // Set dateStart về đầu ngày (00:00:00) và dateEnd về cuối ngày (23:59:59)
                const dateStart = new Date(this.filters.dateStart || new Date());
                dateStart.setHours(0, 0, 0, 0);

                const dateEnd = new Date(this.filters.dateEnd || new Date());
                dateEnd.setHours(23, 59, 59, 999);

                return this.dailyReportSaleService.getDailyReportSale(
                    page,
                    size,
                    dateStart,
                    dateEnd,
                    (this.filterTextSearch && this.filterTextSearch.trim()) ? this.filterTextSearch.trim() : '',
                    this.filters.customerId || 0,
                    userId,
                    this.filters.groupTypeId || -1,
                    this.filters.projectId || 0,
                    this.filters.teamId || 0,
                ).toPromise().then((response) => {
                    return response;
                }).catch((error) => {
                    console.error('Error loading daily report sale data:', error);
                    this.notification.error('Lỗi', 'Không thể tải dữ liệu báo cáo hàng ngày!');
                    throw error;
                });
            },
            ajaxResponse: (url, params, res) => {
                if (res && res.status === 1) {
                    return {
                        data: res.data.data || [],
                        last_page: res.data.totalPage?.[0]?.TotalPage || 1,
                    };
                }
                return {
                    data: [],
                    last_page: 1,
                };
            },
            columns: [
                {
                    title: 'Ngày thực hiện gần nhất',
                    field: 'DateStart',
                    sorter: 'string',
                    width: 150,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    },
                },
                {
                    title: 'Ngày dự kiến thực hiện',
                    field: 'DateEnd',
                    sorter: 'string',
                    width: 150,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    },
                },
                {
                    title: 'Người phụ trách',
                    field: 'FullName',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Mã dự án',
                    field: 'ProjectCode',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Tên dự án',
                    field: 'ProjectName',
                    sorter: 'string',
                    width: 250,
                    formatter: 'textarea',
                },
                {
                    title: 'Hãng',
                    field: 'FirmName',
                    sorter: 'string',
                    width: 100,
                },
                {
                    title: 'Loại dự án',
                    field: 'ProjectTypeName',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Khách hàng',
                    field: 'CustomerName',
                    sorter: 'string',
                    width: 250,
                    formatter: 'textarea',
                },
                {
                    title: 'Mã khách hàng',
                    field: 'CustomerCode',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Sản phẩm của KH',
                    field: 'ProductOfCustomer',
                    sorter: 'string',
                    width: 250,
                },
                {
                    title: 'Người liên hệ (Tên/Chức vụ)',
                    field: 'ContactName',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Loại nhóm',
                    field: 'MainIndex',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Việc đã làm',
                    field: 'Content',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 250,
                },
                {
                    title: 'Kết quả mong đợi',
                    field: 'Result',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 250,
                },
                {
                    title: 'Vấn đề tồn đọng',
                    field: 'ProblemBacklog',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 250,
                },
                {
                    title: 'Kế hoạch tiếp theo',
                    field: 'PlanNext',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 250,
                },
                {
                    title: 'End User',
                    field: 'PartCode',
                    sorter: 'string',
                    width: 250,
                },
                {
                    title: 'Big Account',
                    field: 'BigAccount',
                    sorter: 'boolean',
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const checked = cell.getValue() ? 'checked' : '';
                        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
                    },
                    width: 100,
                },
                {
                    title: 'Cơ hội bán hàng',
                    field: 'SaleOpportunity',
                    sorter: 'boolean',
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const checked = cell.getValue() ? 'checked' : '';
                        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
                    },
                    width: 100,
                },
            ],
        });

        // Sự kiện chọn row
        this.tb_Master.on('rowClick', (e: any, row: RowComponent) => {
            const data = row.getData();
            this.selectedRowId = data?.['ID'] || 0;
            console.log('Selected row ID:', this.selectedRowId);
        });

        // Sự kiện double click để mở edit
        this.tb_Master.on('rowDblClick', (e: any, row: RowComponent) => {
            const data = row.getData();
            const id = data?.['ID'] || 0;
            if (id > 0) {
                this.openModal(id);
            }
        });
    }
}
