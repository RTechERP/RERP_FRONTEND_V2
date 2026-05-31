import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';

// Ng-Zorro
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule as PButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TooltipModule } from 'primeng/tooltip';
import { SplitterModule } from 'primeng/splitter';

// Services
import { ProjectJoinSummaryService } from './project-join-summary-service/project-join-summary.service';
import { ProjectService } from '../project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';

@Component({
    selector: 'app-project-join-summary',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        // Ng-Zorro
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzSpinModule,
        NzNotificationModule,
        // PrimeNG
        MenubarModule,
        TooltipModule,
        TableModule,
        PButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        SelectModule,
        MultiSelectModule,
        SplitterModule,
    ],
    templateUrl: './project-join-summary.component.html',
    styleUrl: './project-join-summary.component.css'
})
export class ProjectJoinSummaryComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    @ViewChild('dtSummary') dtSummary: Table | undefined;
    @ViewChild('dtJoined') dtJoined: Table | undefined;

    //#region Variables
    menuItems: MenuItem[] = [];
    isLoading = false;
    isJoinedLoading = false;

    // Datasets
    datasetSummary: any[] = [];
    datasetJoined: any[] = [];

    selectedSummaryRow: any = null;
    selectedJoinedRow: any = null;

    // Search params
    dateStart: string = DateTime.local().minus({ years: 1 }).set({ hour: 0, minute: 0, second: 0 }).toFormat('yyyy-MM-dd');
    dateEnd: string = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toFormat('yyyy-MM-dd');
    employeeId: any = null;

    // Lookup
    users: any[] = [];
    //#endregion

    constructor(
        private joinSummaryService: ProjectJoinSummaryService,
        private projectService: ProjectService,
        private notification: NzNotificationService,
        private appUserService: AppUserService,
    ) { }

    //#region Lifecycle
    ngOnInit(): void {
        this.initMenuItems();
        // Tự động gán employeeId là CBNV đang đăng nhập
        this.employeeId = this.appUserService.employeeID || null;
        this.getUsers();
        this.search();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
    //#endregion

    //#region Menu
    initMenuItems(): void {
        this.menuItems = [
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportToExcel(),
            },
            {
                label: 'Nội bộ',
                icon: 'fa-solid fa-sitemap fa-lg text-primary',
                command: () => this.openFolder('noi_bo'),
            },
            {
                label: 'Online',
                icon: 'fa-solid fa-sitemap fa-lg text-success',
                command: () => this.openFolder('online'),
            },
        ];
    }
    //#endregion

    //#region Search
    getSearchParams() {
        return {
            dateStart: DateTime.fromISO(this.dateStart).set({ hour: 0, minute: 0, second: 0 }).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
            dateEnd: DateTime.fromISO(this.dateEnd).set({ hour: 23, minute: 59, second: 59 }).toFormat("yyyy-MM-dd'T'HH:mm:ss"),
            employeeId: this.employeeId || 0,
            userId: 0,
        };
    }

    search(): void {
        const params = this.getSearchParams();

        this.isLoading = true;
        this.datasetSummary = [];
        this.selectedSummaryRow = null;
        this.joinSummaryService.getProjectJoinSummary(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    this.datasetSummary = res?.status === 1
                        ? (res.data || []).map((item: any, i: number) => ({ ...item, STT: i + 1 }))
                        : [];
                },
                error: (err: any) => {
                    this.isLoading = false;
                    console.error(err);
                    this.notification.error('Lỗi', 'Không thể tải dữ liệu tổng hợp dự án tham gia');
                }
            });

        this.isJoinedLoading = true;
        this.datasetJoined = [];
        this.selectedJoinedRow = null;
        this.joinSummaryService.getProjectJoined(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    this.isJoinedLoading = false;
                    this.datasetJoined = res?.status === 1
                        ? (res.data || []).map((item: any, i: number) => ({ ...item, STT: i + 1 }))
                        : [];
                },
                error: (err: any) => {
                    this.isJoinedLoading = false;
                    console.error(err);
                    this.notification.error('Lỗi', 'Không thể tải dữ liệu dự án tham gia');
                }
            });
    }

    resetSearch(): void {
        this.dateStart = DateTime.local().minus({ years: 1 }).set({ hour: 0, minute: 0, second: 0 }).toFormat('yyyy-MM-dd');
        this.dateEnd = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toFormat('yyyy-MM-dd');
        this.employeeId = this.appUserService.employeeID || null;
        this.search();
    }
    createdDataGroup(data: any, column: any) {
        const groupMap = data.reduce((acc: any, item: any) => {
            const key = item[column] || 'Không có thông tin';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {});

        return Object.entries(groupMap).map(([key, value]: [string, any]) => ({
            label: key,
            options: (value as any[]).map((item: any) => ({ item }))
        }));
    }
    getUsers(): void {
        this.joinSummaryService.getEmployees(null).subscribe({
            next: (response: any) => {
                this.users = this.createdDataGroup(response.data, 'DepartmentName');
                console.log("this.users", this.users)
            },
            error: (error: any) => console.error(error),
        });
    }
    //#endregion

    //#region Row select
    onSummaryRowSelect(rowData: any): void {
        this.selectedSummaryRow = rowData;
    }

    onJoinedRowSelect(rowData: any): void {
        this.selectedJoinedRow = rowData;
    }
    //#endregion

    //#region Export Excel
    formatDate(val: any): string {
        if (!val) return '';
        const dt = DateTime.fromISO(val);
        if (dt.isValid) return dt.toFormat('dd/MM/yyyy');
        return val;
    }

    exportToExcel(): void {
        if (!this.datasetSummary.length && !this.datasetJoined.length) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();

            if (this.datasetSummary.length > 0) {
                const ws1 = workbook.addWorksheet('Dự án đã tham gia');
                ws1.columns = [
                    { header: 'STT', key: 'STT', width: 8 },
                    { header: 'Trạng thái', key: 'ProjectStatusName', width: 18 },
                    { header: 'Mức độ ưu tiên cá nhân', key: 'PersonalPriotity', width: 22 },
                    { header: 'Mã dự án', key: 'ProjectCode', width: 18 },
                    { header: 'Tên dự án', key: 'ProjectName', width: 45 },
                    { header: 'Người phụ trách (sale)', key: 'FullNameSale', width: 25 },
                    { header: 'Người phụ trách (kỹ thuật)', key: 'FullNameTech', width: 25 },
                    { header: 'PM', key: 'FullNamePM', width: 25 },
                    { header: 'Khách hàng', key: 'CustomerName', width: 25 },
                    { header: 'Ngày bắt đầu dự kiến', key: 'PlanDateStart', width: 18 },
                    { header: 'Ngày kết thúc dự kiến', key: 'PlanDateEnd', width: 18 },
                    { header: 'Ngày bắt đầu thực tế', key: 'ActualDateStart', width: 18 },
                    { header: 'Ngày kết thúc thực tế', key: 'ActualDateEnd', width: 18 },
                    { header: 'End User', key: 'EndUserName', width: 25 },
                    { header: 'Ngày PO', key: 'PODate', width: 18 },
                    { header: 'Ngày tạo', key: 'CreatedDate', width: 18 },
                    { header: 'Người tạo', key: 'CreatedBy', width: 18 },
                    { header: 'Người sửa', key: 'UpdatedBy', width: 18 },
                    { header: 'Ngày cập nhật', key: 'UpdatedDate', width: 18 },
                ];
                this.applyHeaderStyle(ws1);
                this.datasetSummary.forEach((item, i) => {
                    ws1.addRow({
                        STT: i + 1,
                        ProjectStatusName: item.ProjectStatusName || '',
                        PersonalPriotity: item.PersonalPriotity || '',
                        ProjectCode: item.ProjectCode || '',
                        ProjectName: item.ProjectName || '',
                        FullNameSale: item.FullNameSale || '',
                        FullNameTech: item.FullNameTech || '',
                        FullNamePM: item.FullNamePM || '',
                        CustomerName: item.CustomerName || '',
                        PlanDateStart: this.formatDate(item.PlanDateStart),
                        PlanDateEnd: this.formatDate(item.PlanDateEnd),
                        ActualDateStart: this.formatDate(item.ActualDateStart),
                        ActualDateEnd: this.formatDate(item.ActualDateEnd),
                        EndUserName: item.EndUserName || '',
                        PODate: this.formatDate(item.PODate),
                        CreatedDate: this.formatDate(item.CreatedDate),
                        CreatedBy: item.CreatedBy || '',
                        UpdatedBy: item.UpdatedBy || '',
                        UpdatedDate: this.formatDate(item.UpdatedDate),
                    });
                });
                this.applyDataStyle(ws1);
            }

            if (this.datasetJoined.length > 0) {
                const ws2 = workbook.addWorksheet('Dự án thực tế');
                ws2.columns = [
                    { header: 'STT', key: 'STT', width: 8 },
                    { header: 'Trạng thái', key: 'StatusName', width: 18 },
                    { header: 'Mã dự án', key: 'ProjectCode', width: 18 },
                    { header: 'Tên dự án', key: 'ProjectName', width: 45 },
                    { header: 'Ngày cập nhật', key: 'UpdatedDate', width: 18 },
                    { header: 'Ngày tạo', key: 'CreatedDate', width: 18 },
                ];
                this.applyHeaderStyle(ws2);
                this.datasetJoined.forEach((item, i) => {
                    ws2.addRow({
                        STT: i + 1,
                        StatusName: item.StatusName || '',
                        ProjectCode: item.ProjectCode || '',
                        ProjectName: item.ProjectName || '',
                        UpdatedDate: this.formatDate(item.UpdatedDate),
                        CreatedDate: this.formatDate(item.CreatedDate),
                    });
                });
                this.applyDataStyle(ws2);
            }

            workbook.xlsx.writeBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Tong_hop_du_an_tham_gia_${Date.now()}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            });

            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error(error);
            this.notification.error('Lỗi', 'Không thể xuất file Excel');
        }
    }

    private applyHeaderStyle(ws: ExcelJS.Worksheet): void {
        const row = ws.getRow(1);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
    }

    private applyDataStyle(ws: ExcelJS.Worksheet): void {
        ws.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            }
        });
    }
    //#endregion

    //#region Folder tree
    openFolder(type: 'online' | 'noi_bo'): void {
        const row = this.selectedSummaryRow || this.selectedJoinedRow;
        if (!row) {
            this.notification.warning('Thông báo', 'Vui lòng chọn 1 dự án!');
            return;
        }
        const projectId = row.ID || 0;
        if (!projectId) {
            this.notification.warning('Thông báo', 'Không xác định được dự án!');
            return;
        }

        // Fetch project type links for the selected project
        this.projectService.getProjectTypeLinks(projectId).subscribe({
            next: (response: any) => {
                const typeLinks = response?.data || [];
                const selectedProjectTypeIds: number[] = [];

                typeLinks.forEach((x: any) => {
                    if (x.Selected === true && x.ID) {
                        selectedProjectTypeIds.push(x.ID);
                    }
                });

                if (selectedProjectTypeIds.length === 0) {
                    const projectCode = row.ProjectCode || '';
                    const msg = projectCode
                        ? `Dự án ${projectCode} chưa có kiểu dự án nên chưa có thư mục trên server!`
                        : 'Dự án chưa có kiểu dự án nên chưa có thư mục trên server!';
                    this.notification.error('Thông báo', msg);
                    return;
                }

                this.projectService.createProjectTree(projectId, selectedProjectTypeIds).subscribe({
                    next: (res: any) => {
                        if (res.status == 1 && res.data) {
                            const textToCopy = type === 'online' ? res.data.urlOnl : res.data.url;
                            if (textToCopy) {
                                navigator.clipboard.writeText(textToCopy).then(() => {
                                    this.notification.success('Thông báo', `Đã copy đường dẫn ${type === 'online' ? 'Online' : 'Nội bộ'} vào clipboard!`);
                                }).catch(err => {
                                    this.notification.error('Lỗi', 'Không thể copy vào clipboard: ' + err);
                                });
                            } else {
                                this.notification.error('Thông báo', 'Đường dẫn trống!');
                            }
                        } else {
                            this.notification.error('Thông báo', res.message || 'Không thể tạo cây thư mục dự án!');
                        }
                    },
                    error: (error) => {
                        this.notification.error('Thông báo', error.error?.message || 'Lỗi khi tạo cây thư mục dự án!');
                        console.error('Lỗi:', error);
                    }
                });
            },
            error: (err: any) => {
                this.notification.error('Lỗi', 'Không thể tải kiểu dự án của dự án đã chọn!');
                console.error('Lỗi:', err);
            }
        });
    }
    //#endregion
}
