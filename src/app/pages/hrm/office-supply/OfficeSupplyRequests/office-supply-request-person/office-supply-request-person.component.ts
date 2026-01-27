import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { DateTime } from 'luxon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

// Services & Components
import { DangkyvppServiceService } from '../officesupplyrequests-service/office-supply-requests-service.service';
import { AuthService } from '../../../../../auth/auth.service';
import { OfficeSupplyRequestDetailComponent } from '../office-supply-request-detail/office-supply-request-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-office-supply-request-person',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzSplitterModule,
        NzFormModule,
        NzInputModule,
        NzDatePickerModule,
        NzModalModule
    ],
    templateUrl: './office-supply-request-person.component.html',
    styleUrls: ['./office-supply-request-person.component.css']
})
export class OfficeSupplyRequestPersonComponent implements OnInit, AfterViewInit {
    table: any;
    tableDetail: any;
    dataTable: any[] = [];
    dataTableDetail: any[] = [];
    isLoading = false;
    currentUser: any;
    monthFormat = 'MM/yyyy';
    sizeSearch = '0';

    searchParams = {
        month: new Date(),
        keyword: ''
    };

    constructor(
        private officeSupplyRequestService: DangkyvppServiceService,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private ngbModal: NgbModal,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe(res => {
            this.currentUser = res.data;
            this.getRequests();
        });
    }

    ngAfterViewInit(): void {
        this.initTable();
        this.initTableDetail();
    }

    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
    }

    getRequests(): void {
        if (!this.currentUser) return;
        this.isLoading = true;

        this.officeSupplyRequestService
            .getOfficeSupplyRequests(
                this.searchParams.keyword,
                this.searchParams.month,
                0 // All departments, filtered by user in frontend or backend
            )
            .subscribe({
                next: (res) => {
                    if (res && Array.isArray(res.data)) {
                        // Filter only requests for this user if the API returns all
                        // Adjust this if the API is already filtered by backend
                        this.dataTable = res.data.filter((item: any) => item.EmployeeIDRequest === this.currentUser.EmployeeID);
                        if (this.table) {
                            this.table.replaceData(this.dataTable);
                        }
                    } else {
                        this.dataTable = [];
                        if (this.table) this.table.replaceData([]);
                    }
                },
                error: () => {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }

    private initTable(): void {
        this.table = new Tabulator('#datatable-person', {
            ...DEFAULT_TABLE_CONFIG,
            data: this.dataTable,
            paginationMode: 'local',
            layout: 'fitDataStretch',
            height: '100%',
            selectableRows: 1,
            pagination: true,
            columns: [
                {
                    title: 'Admin duyệt',
                    field: 'IsAdminApproved',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: (cell: any) =>
                        `<input type="checkbox" ${['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : ''
                        } onclick="return false;">`,
                },
                {
                    title: 'TBP duyệt',
                    field: 'IsApproved',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: (cell: any) =>
                        `<input type="checkbox" ${['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : ''
                        } onclick="return false;">`,
                },
                {
                    title: 'Ngày TBP duyệt',
                    field: 'DateApproved',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    },
                },
                {
                    title: 'Họ tên TBP duyệt',
                    field: 'FullNameApproved',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 200,
                },
                {
                    title: 'Người đăng ký',
                    field: 'UserName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                },
                {
                    title: 'Phòng ban',
                    field: 'DepartmentName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 160,
                },
                {
                    title: 'Ngày đăng ký',
                    field: 'DateRequest',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 200,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    },
                },
            ]
        });

        this.table.on('rowClick', (e: any, row: any) => {
            this.loadDetails(row.getData().ID);
        });
    }

    private initTableDetail(): void {
        this.tableDetail = new Tabulator('#datatable-person-detail', {
            data: this.dataTableDetail,
            layout: 'fitDataStretch',
            height: '100%',
            columns: [
                {
                    title: 'Văn phòng phẩm',
                    field: 'OfficeSupplyName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 350,
                    frozen: true,
                    formatter: function (cell: any) {
                        const value = cell.getValue();
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'object') {
                            return value.Name || value.name || '';
                        }
                        return value;
                    },
                },
                {
                    title: 'ĐVT',
                    field: 'Unit',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                },
                {
                    title: 'SL đề xuất',
                    field: 'Quantity',
                    hozAlign: 'right',
                    headerHozAlign: 'center',
                },
                {
                    title: 'SL thực tế',
                    field: 'QuantityReceived',
                    hozAlign: 'right',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Vượt định mức',
                    field: 'ExceedsLimit',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (value === true)
                            return '<span style="color:green;font-size:18px;">&#10004;</span>'; // ✅
                        if (value === false)
                            return '<span style="color:red;font-size:18px;">&#10006;</span>'; // ❌
                        return ''; // không có gì nếu null hoặc undefined
                    },
                },
                {
                    title: 'Lý do vượt định mức',
                    field: 'Reason',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Ghi chú',
                    field: 'Note',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 250,
                    formatter: 'textarea',
                    formatterParams: {
                        maxHeight: 100,
                    },
                },
            ]
        });
    }

    loadDetails(requestId: number): void {
        this.officeSupplyRequestService.getOfficeSupplyRequestsDetail(requestId).subscribe({
            next: (res) => {
                this.dataTableDetail = res.data || [];
                if (this.tableDetail) {
                    this.tableDetail.replaceData(this.dataTableDetail);
                }
            }
        });
    }

    openAddModal(): void {
        const modalRef = this.ngbModal.open(OfficeSupplyRequestDetailComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
            keyboard: false
        });

        modalRef.result.then((result) => {
            if (result?.success) {
                this.getRequests();
            }
        }, () => { });
    }

    editRequest(): void {
        const selectedRows = this.table.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn yêu cầu để sửa');
            return;
        }

        const rowData = selectedRows[0].getData();
        if (rowData.IsApproved || rowData.IsAdminApproved) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể sửa yêu cầu đã được duyệt');
            return;
        }

        this.isLoading = true;
        this.officeSupplyRequestService.getOfficeSupplyRequestsDetail(rowData.ID).subscribe({
            next: (res) => {
                this.isLoading = false;
                const modalRef = this.ngbModal.open(OfficeSupplyRequestDetailComponent, {
                    size: 'lg',
                    centered: true,
                    backdrop: 'static',
                    keyboard: false
                });

                modalRef.componentInstance.editData = {
                    ...rowData,
                    items: res.data || []
                };

                modalRef.result.then((result) => {
                    if (result?.success) {
                        this.getRequests();
                    }
                }, () => { });
            },
            error: () => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải chi tiết yêu cầu');
            }
        });
    }

    deleteRequest(): void {
        const selectedRows = this.table.getSelectedRows();
        if (selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn yêu cầu để xóa');
            return;
        }

        const rowData = selectedRows[0].getData();
        if (rowData.IsApproved || rowData.IsAdminApproved) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể xóa yêu cầu đã được duyệt');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa yêu cầu này không?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                const dto = {
                    officeSupplyRequest: { ID: rowData.ID, IsDeleted: true },
                    officeSupplyRequestsDetails: []
                };
                this.officeSupplyRequestService.saveData(dto).subscribe({
                    next: (res) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                            this.getRequests();
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa thất bại');
                        }
                    }
                });
            }
        });
    }
}
