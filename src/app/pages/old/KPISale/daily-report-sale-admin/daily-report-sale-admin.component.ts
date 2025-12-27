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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
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

import { DailyReportSaleAdminService } from './daily-report-sale-admin-service/daily-report-sale-admin.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { DailyReportSaleAdminDetailComponent } from './daily-report-sale-admin-detail/daily-report-sale-admin-detail.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-daily-report-sale-admin',
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
        NzFormModule,
        NzTreeSelectModule,
        CommonModule,
        HasPermissionDirective,
    ],
    templateUrl: './daily-report-sale-admin.component.html',
    styleUrl: './daily-report-sale-admin.component.css'
})
export class DailyReportSaleAdminComponent implements OnInit, AfterViewInit {
    @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;

    tb_Master!: Tabulator;
    selectedRowId: number = 0;
    selectedRowEmployeeId: number = 0;
    sizeSearch: string = '0';
    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }

    filters: any = {
        startDate: new Date(),
        endDate: new Date(),
        customerId: 0,
        employeeId: 0,
        filterText: '',
    };

    warehouseId: number = 0;
    customers: any[] = [];
    employees: any[] = [];

    constructor(
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private fb: FormBuilder,
        private modal: NzModalService,
        private dailyReportSaleAdminService: DailyReportSaleAdminService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // if (this.tabData && this.tabData.warehouseId) {
        //   this.warehouseId = this.tabData.warehouseId;
        // }
        this.route.queryParams.subscribe(params => {
            this.warehouseId = params['warehouseId'] || 1
        });
        this.loadEmployees();
        this.loadCustomers();
        this.loadData();
    }

    ngAfterViewInit(): void {
        this.initTable();
    }

    openModal() {
        const modalRef = this.modalService.open(DailyReportSaleAdminDetailComponent, {
            centered: true,
            // size: 'xl',
            windowClass: 'full-screen-modal',
            backdrop: 'static',
        });
        modalRef.result.then((result) => {
            if (result.success && result.reloadData) {
                this.loadData();
            }
        }, () => { });
    }

    openEditModal() {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa!');
            return;
        }
        const modalRef = this.modalService.open(DailyReportSaleAdminDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.selectedRowId = this.selectedRowId;
        modalRef.componentInstance.isEditMode = true;
        modalRef.result.then((result) => {
            if (result && result.success && result.reloadData) {
                this.tb_Master?.replaceData();
            }
        }, () => { });
    }

    onDeleteDailyReportSaleAdmin() {
        if (!this.selectedRowId || this.selectedRowId <= 0) {
            this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa!');
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.dailyReportSaleAdminService.delete(this.selectedRowId).subscribe({
                    next: (response) => {
                        if (response.status === 1) {
                            this.notification.success('Thành công', 'Đã xóa báo cáo hàng ngày!');
                            this.selectedRowId = 0; // Reset selectedRowId sau khi xóa
                            this.loadData(); // Reload data sau khi xóa
                        } else {
                            this.notification.error('Lỗi', response.message || 'Không thể xóa báo cáo hàng ngày!');
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting daily report sale admin:', error);
                        this.notification.error('Lỗi', 'Lỗi kết nối khi xóa báo cáo hàng ngày!');
                    }
                });
            }
        });
    }

    loadData() {
        const dateStart = new Date(this.filters.startDate);
        dateStart.setHours(0, 0, 0, 0);

        const dateEnd = new Date(this.filters.endDate);
        dateEnd.setHours(23, 59, 59, 999);

        const customerId = this.filters.customerId || 0;
        const userId = this.filters.employeeId || 0;
        const keyword = this.filters.filterText || '';

        this.dailyReportSaleAdminService.loadData(
            dateStart,
            dateEnd,
            customerId,
            userId,
            keyword
        ).subscribe((res: any) => {
            if (res.status === 1) {
                this.tb_Master.replaceData(res.data || []);
            } else {
                this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lỗi khi tải dữ liệu');
            }
        }, (error: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Có lỗi xảy ra khi tải dữ liệu');
        });
    }

    loadEmployees() {
        this.dailyReportSaleAdminService.getEmployees().subscribe((res: any) => {
            if (res.status === 1) {
                // Filter bỏ các item có FullName rỗng hoặc chỉ có khoảng trắng
                this.employees = (res.data || []).filter((item: any) => {
                    return item.FullName && item.FullName.trim().length > 0;
                });
            } else {
                this.notification.error(NOTIFICATION_TITLE.error, res.message);
            }
        });
    }

    loadCustomers() {
        this.dailyReportSaleAdminService.getCustomers().subscribe((res: any) => {
            if (res.status === 1) {
                this.customers = res.data;
            } else {
                this.notification.error(NOTIFICATION_TITLE.error, res.message);
            }
        });
    }

    search() {
        this.loadData();
    }

    async exportDetailTableToExcel() {
        if (!this.tb_Master) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
            return;
        }

        const data = this.tb_Master.getData();
        if (!data || data.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Báo cáo hàng ngày');

            // Lấy các cột từ bảng (bỏ qua cột ẩn)
            const columns = this.tb_Master
                .getColumnDefinitions()
                .filter((col: any) => col.visible !== false && col.field);

            const headers = columns.map((col: any) => col.title || col.field);

            // Header row
            const headerRow = worksheet.addRow(headers);
            headerRow.font = {
                name: 'Times New Roman',
                size: 10,
                bold: true
            };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0099FF' }
            };
            headerRow.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };
            headerRow.height = 20;

            // Border cho header
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF999999' } },
                    left: { style: 'thin', color: { argb: 'FF999999' } },
                    bottom: { style: 'thin', color: { argb: 'FF999999' } },
                    right: { style: 'thin', color: { argb: 'FF999999' } }
                };
            });

            // Data rows
            data.forEach((row: any) => {
                const rowData = columns.map((col: any) => {
                    const value = row[col.field];

                    // Xử lý ngày tháng
                    if (col.field === 'DateReport' && value) {
                        return new Date(value);
                    }

                    return value !== null && value !== undefined ? value : '';
                });

                const excelRow = worksheet.addRow(rowData);
                excelRow.font = {
                    name: 'Times New Roman',
                    size: 10
                };

                // Format và border cho từng cell
                excelRow.eachCell((cell, colNumber) => {
                    const col = columns[colNumber - 1];

                    // Format ngày
                    if (col?.field === 'DateReport' && cell.value instanceof Date) {
                        cell.numFmt = 'dd/mm/yyyy';
                        cell.alignment = {
                            horizontal: 'center',
                            vertical: 'middle',
                            wrapText: true
                        };
                    } else {
                        cell.alignment = {
                            horizontal: 'left',
                            vertical: 'middle',
                            wrapText: true
                        };
                    }

                    // Border
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
                    };
                });
            });

            // Auto width cho columns
            worksheet.columns.forEach((column: any, index: number) => {
                let maxLength = 10;
                const headerValue = headers[index] ? headers[index].toString() : '';
                maxLength = Math.max(maxLength, headerValue.length);

                column.eachCell({ includeEmpty: true }, (cell: any) => {
                    if (cell.value !== null && cell.value !== undefined) {
                        let cellValue = '';
                        if (cell.value instanceof Date) {
                            cellValue = cell.value.toLocaleDateString('vi-VN');
                        } else {
                            cellValue = cell.value.toString();
                        }
                        maxLength = Math.max(maxLength, cellValue.length);
                    }
                });

                column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            });

            // Download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `bao-cao-hang-ngay-admin-${dateStr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất file Excel!');
        }
    }

    initTable(): void {
        if (!this.tb_MasterElement) {
            console.error('tb_Table element not found');
            return;
        }
        this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataFill',
            selectableRows: 1,
            height: '100%',
            rowHeader: false,
            columns: [
                {
                    title: 'Ngày',
                    field: 'DateReport',
                    sorter: 'string',
                    frozen: true,
                    width: 150,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    },
                },
                {
                    title: 'Nhân viên',
                    field: 'EmployeeFullName',
                    sorter: 'string',
                    frozen: true,
                    width: 150,
                },
                {
                    title: 'Loại báo cáo',
                    field: 'ReportTypeName',
                    sorter: 'string',
                    frozen: true,
                    width: 150,
                },
                {
                    title: 'Nội dung báo cáo',
                    field: 'ReportContent',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 150,
                },
                {
                    title: 'Mã dự án',
                    field: 'ProjectCode',
                    sorter: 'string',
                    minWidth: 150,
                    width: 150,
                },
                {
                    title: 'Khách hàng',
                    field: 'CustomerName',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 200,
                },
                {
                    title: 'Người yêu cầu',
                    field: 'EmployeeRequestFullName',
                    sorter: 'string',
                    width: 150,
                },
                {
                    title: 'Kết quả xử lý',
                    field: 'Result',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 150,
                },
                {
                    title: 'Vấn đề tồn đọng',
                    field: 'Problem',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 150,
                },
                {
                    title: 'Kế hoạch tiếp theo',
                    field: 'PlanNextDay',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 150,
                },

            ],
        });
        this.tb_Master.on('rowClick', (e, row) => {
            this.selectedRowId = row.getData()['ID'];
            this.selectedRowEmployeeId = row.getData()['EmployeeID'];
        });

    }

}
