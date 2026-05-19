import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin, lastValueFrom, of, Observable } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';

import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { RatingErrorService } from '../rating-error-service/rating-error.service';
import { FiveSRatingFormComponent } from './five-s-rating-form/five-s-rating-form.component';
import { FiveSRatingDetailService } from '../five-s-rating-detail/five-s-rating-detail.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';

@Component({
    standalone: true,
    selector: 'app-five-s-rating',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModalModule,
        NzNotificationModule,
        NzModalModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzSelectModule,
        NzInputModule,
        NzGridModule,
        NzFormModule,
        MenubarModule,
        TableModule,
        NzTableModule,
        NzToolTipModule,
        NzPopconfirmModule,
        ButtonModule,
        RippleModule,
        NzSplitterModule,
        NzTagModule,
        NzEmptyModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './five-s-rating.component.html',
    styleUrl: './five-s-rating.component.css'
})
export class FiveSRatingComponent implements OnInit {
    private ngbModal = inject(NgbModal);

    menuBars: MenuItem[] = [];
    isLoading = false;

    dataset: any[] = [];
    selectedRow: any = null;

    // Master-Detail for Tickets
    ticketsMap: { [key: number]: any[] } = {};
    activeTickets: any[] = [];
    employees: any[] = [];
    groupedEmployees: any[] = [];
    departments: any[] = [];

    searchKeyword: string = '';
    searchYear: number | null = new Date().getFullYear();
    searchMonth: number | null = new Date().getMonth() + 1;

    years: number[] = [];
    months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // UI layout
    showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

    constructor(
        private ratingErrorService: RatingErrorService,
        private detailService: FiveSRatingDetailService,
        private employeeService: EmployeeService,
        private notification: NzNotificationService,
        private nzModal: NzModalService,
        private router: Router
    ) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            this.years.push(i);
        }
    }

    ngOnInit(): void {
        this.initMenuBar();
        this.loadData();
        this.loadEmployees();
        this.loadDepartments();
    }

    get shouldShowSearchBar(): boolean {
        return this.showSearchBar;
    }

    isMobile(): boolean {
        return typeof window !== 'undefined' && window.innerWidth <= 768;
    }

    ToggleSearchPanelNew(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showSearchBar = !this.showSearchBar;
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return '';
        }
    }

    formatDateTime(dateString: string | undefined): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
        } catch {
            return '';
        }
    }

    formatDateForApi(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => this.onCreate(),
            },
            {
                label: 'Tạo theo tháng',
                icon: 'fa-solid fa-calendar-days fa-lg text-info',
                command: () => this.onCreateMonthly(),
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => this.onEdit(),
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => this.onDelete(),
            },
            {
                label: 'Xuất tổng hợp',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.onExportMonthlySummary(),
            },
            {
                label: 'Refresh',
                icon: 'fa-solid fa-rotate fa-lg text-primary',
                command: () => {
                    this.selectedRow = null;
                    this.loadData();
                },
            }
        ];
    }

    loadData() {
        this.isLoading = true;
        this.selectedRow = null;

        this.ratingErrorService.getFiveSRatings(this.searchYear || undefined, this.searchMonth || undefined, this.searchKeyword || undefined).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.dataset = res.data || [];
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi tải dữ liệu');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    onCreate() {
        const modalRef = this.ngbModal.open(FiveSRatingFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = null;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onCreateMonthly() {
        if (this.isLoading) return;
        if (!this.searchYear || !this.searchMonth) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Năm và Tháng để tạo đợt chấm điểm');
            return;
        }

        this.nzModal.confirm({
            nzTitle: 'Xác nhận tạo đợt chấm điểm theo tháng',
            nzContent: `Bạn có chắc chắn muốn tạo các đợt chấm điểm cho tháng ${this.searchMonth}/${this.searchYear} không? (Hệ thống sẽ tạo vào các ngày thứ 6 của tháng)`,
            nzOkText: 'Tạo',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const fridays = this.getFridays(this.searchYear!, this.searchMonth!);
                if (fridays.length === 0) {
                    this.notification.info(NOTIFICATION_TITLE.success, 'Không tìm thấy ngày thứ 6 nào trong tháng này');
                    return;
                }

                this.isLoading = true;
                this.executeCreateMonthly(fridays);
            }
        });
    }

    private async executeCreateMonthly(fridays: Date[]) {
        // Lọc bớt những ngày đã có trong dataset hiện tại
        const existingDates = this.dataset.filter(x => x.RatingDate).map(x => new Date(x.RatingDate).toDateString());
        const newFridays = fridays.filter(date => !existingDates.includes(date.toDateString()));

        if (newFridays.length === 0) {
            this.isLoading = false;
            this.notification.info(NOTIFICATION_TITLE.success, 'Tất cả các ngày thứ 6 trong tháng này đều đã có đợt chấm điểm');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        let lastError = '';

        for (const date of newFridays) {
            const payload = {
                ID: 0,
                YearValue: this.searchYear,
                MonthValue: this.searchMonth,
                RatingDate: this.formatDateForApi(date),
                IsDeleted: false,
                Note: `Đợt chấm điểm ngày ${date.toLocaleDateString('vi-VN')}`
            };

            try {
                const res = await lastValueFrom(this.ratingErrorService.saveFiveSRating(payload));
                if (res?.status === 1) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err: any) {
                failCount++;
                lastError = err?.error?.message || err?.message;
            }
        }

        this.isLoading = false;
        if (successCount > 0) {
            this.notification.success(NOTIFICATION_TITLE.success, `Đã tạo thành công ${successCount} đợt chấm điểm`);
        }
        if (failCount > 0) {
            this.notification.create(
                'error',
                NOTIFICATION_TITLE.error,
                `${lastError ? lastError : 'Có lỗi xảy ra khi tạo đợt chấm'}`,
                { nzStyle: { whiteSpace: 'pre-line' } }
            );
        }
        this.loadData();
    }

    private getFridays(year: number, month: number): Date[] {
        const fridays: Date[] = [];
        const date = new Date(year, month - 1, 1);
        while (date.getMonth() === month - 1) {
            if (date.getDay() === 5) { // 5 is Friday
                fridays.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return fridays;
    }

    onEdit() {
        if (!this.selectedRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 bản ghi để sửa');
            return;
        }
        const modalRef = this.ngbModal.open(FiveSRatingFormComponent, { size: 'lg', backdrop: 'static', centered: true });
        modalRef.componentInstance.dataInput = this.selectedRow;
        modalRef.result.then((res) => {
            if (res === 'save') this.loadData();
        }, () => { });
    }

    onDelete() {
        if (!this.selectedRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 bản ghi để xóa');
            return;
        }
        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa bản ghi đã chọn không?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.ratingErrorService.deleteFiveSRating(this.selectedRow).subscribe({
                    next: (res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                            this.loadData();
                            this.selectedRow = null;
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
                        }
                    },
                    error: (err: any) => {
                        this.notification.create(
                            NOTIFICATION_TYPE_MAP[err.status] || 'error',
                            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                            err?.error?.message || `${err.error}\n${err.message}`,
                            { nzStyle: { whiteSpace: 'pre-line' } }
                        );
                    }
                });
            }
        });
    }

    // --- Master-Detail Tickets ---

    loadEmployees() {
        this.employeeService.getEmployees().subscribe({
            next: (res: any) => {
                const data = (res?.status === 1 ? res.data : res) || [];
                this.employees = data;
                this.groupDropdownEmployees(data);
            },
            error: (err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    loadDepartments() {
        this.ratingErrorService.getFiveSDepartments().subscribe({
            next: (res: any) => {
                if (res?.status === 1) this.departments = res.data || [];
            },
            error: (err: any) => {
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    private groupDropdownEmployees(employees: any[]): void {
        if (!employees || employees.length === 0) {
            this.groupedEmployees = [];
            return;
        }

        const groups: any[] = [];
        const map = new Map();

        for (const emp of employees) {
            const deptName = emp.DepartmentName || emp.DepartmentText || 'Khác';
            if (!map.has(deptName)) {
                const newGroup = { DepartmentName: deptName, items: [] };
                groups.push(newGroup);
                map.set(deptName, newGroup);
            }
            map.get(deptName).items.push(emp);
        }
        this.groupedEmployees = groups;
    }

    onRowSelect(event: any) {
        if (event.data && event.data.ID) {
            this.loadTickets(event.data.ID);
        }
    }

    onRowUnselect(event: any) {
        this.activeTickets = [];
    }

    loadTickets(sessionId: number) {
        this.isLoading = true;
        this.activeTickets = [];
        this.detailService.getTicketsBySession(sessionId).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.activeTickets = res.data || [];
                    this.ticketsMap[sessionId] = this.activeTickets;

                    // Enrich each ticket with its department list
                    this.activeTickets.forEach(ticket => {
                        if (ticket.ID > 0) {
                            this.detailService.getMatrix(ticket.ID).subscribe({
                                next: (mRes: any) => {
                                    if (mRes?.status === 1) {
                                        const details = mRes.data.Details || [];
                                        const ticketDetails = details.filter((d: any) => d.FiveSRatingTicketID === ticket.ID);
                                        const deptIds = [...new Set(ticketDetails.map((d: any) => d.FiveSDepartmentID))];
                                        ticket.departments = this.departments.filter(d => deptIds.includes(d.ID));
                                    }
                                }
                            });
                        }
                    });
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    addTicket(sessionId: number) {
        const newTicket = {
            ID: 0,
            Rating5SID: sessionId,
            TicketCode: '',
            EmployeeRating1ID: null,
            EmployeeRating2ID: null,
            Note: '',
            isEdit: true,
            selectedDepartments: []
        };
        if (!this.ticketsMap[sessionId]) this.ticketsMap[sessionId] = [];
        this.activeTickets = [newTicket, ...this.activeTickets];
        this.ticketsMap[sessionId] = this.activeTickets;
    }

    saveTicket(item: any) {
        if (!item.EmployeeRating1ID) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 người chấm');
            return;
        }

        if (item.ID === 0) {
            // NEW TICKET → save with details (create detail rows for selected departments)
            if (!item.selectedDepartments || item.selectedDepartments.length === 0) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 phòng ban');
                return;
            }

            const payload = {
                Rating5SID: item.Rating5SID,
                EmployeeRating1ID: item.EmployeeRating1ID,
                EmployeeRating2ID: item.EmployeeRating2ID,
                Note: item.Note,
                DepartmentIDs: item.selectedDepartments.map((d: any) => d.ID)
            };

            this.isLoading = true;
            this.detailService.saveTicketWithDetails(payload).subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (res?.status === 1) {
                        this.notification.success(NOTIFICATION_TITLE.success, 'Tạo phiếu và chi tiết thành công');
                        this.loadTickets(item.Rating5SID);
                    } else {
                        this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
                    }
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.notification.create(
                        NOTIFICATION_TYPE_MAP[err.status] || 'error',
                        NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                        err?.error?.message || `${err.error}\n${err.message}`,
                        { nzStyle: { whiteSpace: 'pre-line' } }
                    );
                }
            });
        } else {
            // EXISTING TICKET → update ticket info only
            this.isLoading = true;
            this.detailService.saveTicket(item).subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (res?.status === 1) {
                        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu phiếu thành công');
                        this.loadTickets(item.Rating5SID);
                    } else {
                        this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
                    }
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.notification.create(
                        NOTIFICATION_TYPE_MAP[err.status] || 'error',
                        NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                        err?.error?.message || `${err.error}\n${err.message}`,
                        { nzStyle: { whiteSpace: 'pre-line' } }
                    );
                }
            });
        }
    }

    deleteTicket(item: any) {
        if (item.ID === 0) {
            this.activeTickets = this.activeTickets.filter(t => t !== item);
            this.ticketsMap[item.Rating5SID] = this.activeTickets;
            return;
        }

        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: 'Bạn có chắc chắn muốn xóa phiếu chấm điểm này và toàn bộ kết quả liên quan?',
            nzOnOk: () => {
                this.isLoading = true;

                // 1. Fetch details to mark as deleted
                this.detailService.getMatrix(item.ID).subscribe({
                    next: (matrixRes: any) => {
                        const details = matrixRes.data.Details || [];
                        const detailsToDelete = details.map((d: any) => ({
                            ...d,
                            IsDeleted: true
                        }));

                        // 2. Delete Details first
                        const deleteDetails$ = detailsToDelete.length > 0
                            ? this.detailService.saveMatrix(detailsToDelete)
                            : of({ status: 1 });

                        deleteDetails$.subscribe({
                            next: (saveRes: any) => {
                                // 3. Delete Ticket Head
                                this.detailService.deleteTicket(item).subscribe({
                                    next: (res: any) => {
                                        this.isLoading = false;
                                        if (res?.status === 1) {
                                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa phiếu và dữ liệu chi tiết thành công');
                                            this.loadTickets(item.Rating5SID);
                                        } else {
                                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa phiếu thất bại');
                                        }
                                    },
                                    error: (err: any) => {
                                        this.isLoading = false;
                                        this.notification.create(
                                            NOTIFICATION_TYPE_MAP[err.status] || 'error',
                                            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                                            err?.error?.message || `${err.error}\n${err.message}`,
                                            { nzStyle: { whiteSpace: 'pre-line' } }
                                        );
                                    }
                                });
                            },
                            error: (err: any) => {
                                this.isLoading = false;
                                this.notification.create(
                                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                                    err?.error?.message || `${err.error}\n${err.message}`,
                                    { nzStyle: { whiteSpace: 'pre-line' } }
                                );
                            }
                        });
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        this.notification.create(
                            NOTIFICATION_TYPE_MAP[err.status] || 'error',
                            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                            err?.error?.message || `${err.error}\n${err.message}`,
                            { nzStyle: { whiteSpace: 'pre-line' } }
                        );
                    }
                });
            }
        });
    }

    onExportAll() {
        if (!this.selectedRow) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 đợt chấm điểm để xuất tổng hợp');
            return;
        }
        this.isLoading = true;
        this.detailService.getMatrixBySession(this.selectedRow.ID).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    const workbook = new ExcelJS.Workbook();
                    this.performSessionExcelExport(res.data, workbook).then(() => {
                        workbook.xlsx.writeBuffer().then(buffer => {
                            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `TongHop5S_${res.data.Session?.[0]?.Code || 'Session'}.xlsx`);
                        });
                    });
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi lấy dữ liệu tổng hợp');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    async performSessionExcelExport(data: any, workbook: ExcelJS.Workbook, sheetName: string = 'TongHop_5S') {
        const { Details, Errors, Session, Tickets } = data;
        const details = Details || [];
        const ticketDepts = this.departments.filter(d => details.some((det: any) => det.FiveSDepartmentID === d.ID));

        if (ticketDepts.length === 0) {
            return;
        }

        const worksheet = workbook.addWorksheet(sheetName);

        // 1. Logo
        const logoUrl = 'assets/images/logo-RTC-2023-1200-banchuan.png';
        try {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const logoImage = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
            });
            worksheet.addImage(logoImage, {
                tl: { col: 0, row: 0 },
                ext: { width: 100, height: 40 }
            });
        } catch (e) { console.error('Logo error', e); }

        // 2. Title
        const titleRow = worksheet.getRow(2);
        titleRow.getCell(3).value = 'BẢNG TỔNG HỢP KẾT QUẢ CHẤM ĐIỂM 5S ';
        titleRow.getCell(3).font = { bold: true, size: 16 };
        titleRow.getCell(3).alignment = { horizontal: 'center' };
        worksheet.mergeCells(2, 3, 2, 8);

        worksheet.addRow([]);
        worksheet.addRow([]);

        // 3. Info Session
        const row5 = worksheet.addRow([`Đợt chấm: ${Session?.[0]?.Code || '...'}`, '', '', `Tháng/Năm: ${Session?.[0]?.MonthValue}/${Session?.[0]?.YearValue}`]);
        const raterText = Tickets?.map((t: any) => `${t.Rater1} & ${t.Rater2}`).join(', ');
        const row6 = worksheet.addRow([``, '', '', `Ngày xuất: ${this.formatDate(new Date().toISOString())}`]);

        [row5, row6].forEach(row => {
            worksheet.mergeCells(row.number, 1, row.number, 3);
            worksheet.mergeCells(row.number, 4, row.number, 6);
        });
        worksheet.addRow([]);

        // 4. Headers
        const headerRow1 = ['Loại lỗi', 'STT', 'Chi tiết nội dung đánh giá', 'Tiêu chí đánh giá', '', '', ...ticketDepts.map(d => d.Name), 'Ghi chú(Ghi rõ tên cá nhân/vị trí phạm lỗi)'];
        const headerRow2 = ['', '', '', 'Kém (-1)', 'Tốt (0)', 'Rất tốt (+2)', ...ticketDepts.map(() => ''), ''];

        const h1 = worksheet.addRow(headerRow1);
        const h2 = worksheet.addRow(headerRow2);

        const startHeaderRow = h1.number;
        const endHeaderRow = h2.number;

        [h1, h2].forEach(row => {
            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.font = { bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        // Merge Headers
        worksheet.mergeCells(startHeaderRow, 1, endHeaderRow, 1); // Loại lỗi
        worksheet.mergeCells(startHeaderRow, 2, endHeaderRow, 2); // STT
        worksheet.mergeCells(startHeaderRow, 3, endHeaderRow, 3); // Chi tiết nội dung đánh giá
        worksheet.mergeCells(startHeaderRow, 4, startHeaderRow, 6); // Tiêu chí đánh giá

        const ghiChuColIdx = 7 + ticketDepts.length;
        let deptColIdx = 7;
        ticketDepts.forEach(() => {
            worksheet.mergeCells(startHeaderRow, deptColIdx, endHeaderRow, deptColIdx);
            deptColIdx++;
        });
        worksheet.mergeCells(startHeaderRow, ghiChuColIdx, endHeaderRow, ghiChuColIdx); // Ghi chú

        // 5. Data Rows
        const errorsMap = new Map();
        (Errors || []).forEach((err: any) => {
            if (!errorsMap.has(err.ErrorID)) {
                errorsMap.set(err.ErrorID, {
                    ...err,
                    rules: {}
                });
            }
            const item = errorsMap.get(err.ErrorID);
            const level = (err.RatingLevels || err.RuleName || '').trim();
            if (level) {
                item.rules[level] = {
                    Description: err.Description || err.DetailDescription || ''
                };
            }
        });
        const pivotErrors = Array.from(errorsMap.values()).sort((a: any, b: any) => a.TypeError - b.TypeError);

        let currentType: number | null = null;
        let typeStartRow = 0;

        pivotErrors.forEach((err: any, idx: number) => {
            const rowData = [
                this.getTypeErrorName(err.TypeError),
                idx + 1,
                err.DetailError,
                err.rules['Kém']?.Description || err.rules['kém']?.Description || '',
                err.rules['Tốt']?.Description || err.rules['tốt']?.Description || '',
                err.rules['Rất tốt']?.Description || err.rules['rất tốt']?.Description || ''
            ];

            ticketDepts.forEach(dept => {
                const det = details.find((d: any) => d.FiveSErrorID === err.ErrorID && d.FiveSDepartmentID === dept.ID);
                rowData.push(det ? det.RatingValue : '');
            });

            const relevantDetails = details.filter((d: any) => d.FiveSErrorID === err.ErrorID && d.Note);
            const noteText = relevantDetails.map((d: any) => {
                const dept = ticketDepts.find(dept => dept.ID === d.FiveSDepartmentID);
                return `[${dept?.Name || 'N/A'}]: ${d.Note}`;
            }).join('; ');
            rowData.push(noteText);

            const r = worksheet.addRow(rowData);
            r.eachCell((cell, colIdx) => {
                cell.font = { size: 12 }; // Default font size 12px
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                if (colIdx === 2 || (colIdx >= 4 && colIdx < ghiChuColIdx)) {
                    cell.alignment.horizontal = 'center';
                }
                if (colIdx === 1 || colIdx === 3) {
                    cell.font = { bold: true, size: 12 };
                }
            });

            // Merge Loại lỗi
            if (currentType !== err.TypeError) {
                if (currentType !== null && (r.number - 1 - typeStartRow) > 0) {
                    worksheet.mergeCells(typeStartRow, 1, r.number - 1, 1);
                }
                currentType = err.TypeError;
                typeStartRow = r.number;
            }
            if (idx === pivotErrors.length - 1 && (r.number - typeStartRow) > 0) {
                worksheet.mergeCells(typeStartRow, 1, r.number, 1);
            }
        });

        // 6. Footer (Total)
        const footerData = ['TỔNG CỘNG (Điểm)', '', '', '', '', ''];
        ticketDepts.forEach(dept => {
            const total = details
                .filter((d: any) => d.FiveSDepartmentID === dept.ID)
                .reduce((sum: number, d: any) => sum + (Number(d.RatingValue) || 0), 0);
            footerData.push(total);
        });
        footerData.push(''); // Ghi chú column empty in footer

        const f = worksheet.addRow(footerData);
        worksheet.mergeCells(f.number, 1, f.number, 6);
        f.eachCell((cell, colIdx) => {
            cell.font = { bold: true, size: 12 };
            cell.alignment = { vertical: 'middle', horizontal: colIdx > 6 && colIdx < ghiChuColIdx ? 'center' : 'left' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colIdx === 1) cell.alignment.horizontal = 'left';
        });

        // 7. Widths
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 6;
        worksheet.getColumn(3).width = 50;
        worksheet.getColumn(4).width = 30;
        worksheet.getColumn(5).width = 30;
        worksheet.getColumn(6).width = 30;
        deptColIdx = 7;
        ticketDepts.forEach(() => {
            worksheet.getColumn(deptColIdx).width = 12;
            deptColIdx++;
        });
        worksheet.getColumn(ghiChuColIdx).width = 50;
    }

    exportTicket(item: any) {
        if (!item || !item.ID) return;
        this.isLoading = true;
        this.detailService.getMatrix(item.ID).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.performExcelExport(res.data, item);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi lấy dữ liệu xuất Excel');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    private async performExcelExport(data: any, masterItem: any = null) {
        const ticket = data.Ticket && data.Ticket[0];
        const rawErrors = data.Errors || [];
        const details = data.Details || [];
        if (!ticket) return;

        // 1. Lọc phòng ban có phát sinh chấm điểm
        const ticketDeptIds = [...new Set(details
            .filter((d: any) => d.RatingValue !== null && d.RatingValue !== undefined && d.RatingValue !== '')
            .map((d: any) => d.FiveSDepartmentID))];
        const ticketDepts = this.departments.filter(d => ticketDeptIds.includes(d.ID));

        if (ticketDepts.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu chấm điểm nào để xuất Excel');
            return;
        }

        // 2. Gom nhóm Lỗi
        const errorsMap = new Map();
        rawErrors.forEach((err: any) => {
            if (!errorsMap.has(err.ErrorID)) {
                errorsMap.set(err.ErrorID, {
                    ...err,
                    rules: {}
                });
            }
            const item = errorsMap.get(err.ErrorID);
            if (err.RatingLevels) {
                item.rules[err.RatingLevels] = {
                    Description: err.Description || err.DetailDescription || '',
                    point: (err.BonusPoint || 0) - (err.MinusPoint || 0)
                };
            }
        });

        const pivotErrors = Array.from(errorsMap.values()).sort((a: any, b: any) => a.TypeError - b.TypeError);

        // 3. Khởi tạo ExcelJS Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PhieuCham5S');

        // 4. Chèn Logo
        try {
            const response = await fetch('assets/images/logo-RTC-2023-1200-banchuan.png');
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const logoId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
            });
            worksheet.addImage(logoId, {
                tl: { col: 0.2, row: 0.2 },
                ext: { width: 120, height: 60 }
            });
        } catch (e) {
            console.error('Không thể tải logo:', e);
        }

        // 5. Tiêu đề & Thông tin (Bắt đầu từ row 5 để chừa chỗ cho logo/title đẹp)
        const titleRow = worksheet.getRow(2);
        titleRow.getCell(3).value = 'PHIẾU CHẤM ĐIỂM 5S - ĐIỂM THỰC HÀNH';
        titleRow.getCell(3).font = { bold: true, size: 16 };
        titleRow.getCell(3).alignment = { horizontal: 'center' };
        // Merge title across the width (approx 10 columns)
        worksheet.mergeCells(2, 3, 2, 8);

        worksheet.addRow([]); // Empty row
        worksheet.addRow([]); // Empty row

        const row5 = worksheet.addRow([`Mã phiếu: ${ticket.TicketCode || '...'}`, '', '', `Thời gian đánh giá: ${this.formatDateTime(ticket.TicketDate)}`]);
        const row6 = worksheet.addRow([`Đợt chấm: ${ticket.RatingCode || this.selectedRow?.Code || '...'}`, '', '', `Tháng/Năm: ${ticket.MonthValue}/${ticket.YearValue}`]);
        const row7 = worksheet.addRow([`Người chấm 1: ${this.employees.find(e => e.ID === ticket.EmployeeRating1ID)?.FullName || '...'}`, '', '', `Người chấm 2: ${this.employees.find(e => e.ID === ticket.EmployeeRating2ID)?.FullName || '...'}`]);

        // Merge cells for info rows to avoid text truncation
        [row5, row6, row7].forEach(row => {
            worksheet.mergeCells(row.number, 1, row.number, 3);
            worksheet.mergeCells(row.number, 4, row.number, 6);
        });
        worksheet.addRow([]);

        // 6. Header đa tầng (Row 9, 10)
        const headerRow1 = ['Loại lỗi', 'STT', 'Chi tiết nội dung đánh giá', 'Tiêu chí đánh giá', '', '', ...ticketDepts.map(d => d.Name), 'Ghi chú(Ghi rõ tên cá nhân/vị trí phạm lỗi)'];
        const headerRow2 = ['', '', '', 'Kém (-1)', 'Tốt (0)', 'Rất tốt (+2)', ...ticketDepts.map(() => ''), ''];

        const h1 = worksheet.addRow(headerRow1);
        const h2 = worksheet.addRow(headerRow2);

        const startHeaderRow = h1.number;
        const endHeaderRow = h2.number;

        // Style Headers
        [h1, h2].forEach(row => {
            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.font = { bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        // Merge Headers
        worksheet.mergeCells(startHeaderRow, 1, endHeaderRow, 1); // Loại lỗi
        worksheet.mergeCells(startHeaderRow, 2, endHeaderRow, 2); // STT
        worksheet.mergeCells(startHeaderRow, 3, endHeaderRow, 3); // Chi tiết
        worksheet.mergeCells(startHeaderRow, 4, startHeaderRow, 6); // Tiêu chí đánh giá bọc 3 mức độ

        const ghiChuColIdx = 7 + ticketDepts.length;
        let deptColIdx = 7;
        ticketDepts.forEach(() => {
            worksheet.mergeCells(startHeaderRow, deptColIdx, endHeaderRow, deptColIdx);
            deptColIdx++;
        });
        worksheet.mergeCells(startHeaderRow, ghiChuColIdx, endHeaderRow, ghiChuColIdx); // Ghi chú

        // 7. Data Rows
        let currentType: number | null = null;
        let typeStartRow = 0;

        pivotErrors.forEach((err, idx) => {
            const rowData = [
                this.getTypeErrorName(err.TypeError),
                idx + 1,
                err.DetailError,
                err.rules['Kém']?.Description || '',
                err.rules['Tốt']?.Description || '',
                err.rules['Rất tốt']?.Description || ''
            ];

            ticketDepts.forEach(dept => {
                const det = details.find((d: any) => d.FiveSErrorID === err.ErrorID && d.FiveSDepartmentID === dept.ID);
                rowData.push(det ? det.RatingValue : '');
            });

            const relevantDetails = details.filter((d: any) => d.FiveSErrorID === err.ErrorID && d.Note);
            const noteText = relevantDetails.map((d: any) => {
                const detDept = ticketDepts.find(dept => dept.ID === d.FiveSDepartmentID);
                return `[${detDept?.Name || 'N/A'}]: ${d.Note}`;
            }).join('; ');
            rowData.push(noteText);

            const r = worksheet.addRow(rowData);
            r.eachCell((cell, colIdx) => {
                cell.font = { size: 12 };
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                // Căn giữa cho cột STT và các cột Điểm
                const colNum = Number(cell.address.replace(/[0-9]/g, '').charCodeAt(0) - 64);
                if (colNum === 2 || (colNum >= 4 && colNum < 7 + ticketDepts.length)) {
                    cell.alignment.horizontal = 'center';
                }

                if (colNum === 3 || colNum === 1) {
                    cell.font = { bold: true, size: 12 };
                }
            });

            // Logic Merge Loại lỗi
            if (currentType !== err.TypeError) {
                if (currentType !== null && (r.number - 1 - typeStartRow) > 0) {
                    worksheet.mergeCells(typeStartRow, 1, r.number - 1, 1);
                }
                currentType = err.TypeError;
                typeStartRow = r.number;
            }
            if (idx === pivotErrors.length - 1 && (r.number - typeStartRow) > 0) {
                worksheet.mergeCells(typeStartRow, 1, r.number, 1);
            }
        });

        // 8. Dòng Tổng cộng
        const footerData = ['TỔNG CỘNG (Điểm)', '', '', '', '', ''];
        ticketDepts.forEach(dept => {
            const total = details
                .filter((d: any) => d.FiveSDepartmentID === dept.ID)
                .reduce((sum: number, d: any) => sum + (Number(d.RatingValue) || 0), 0);
            footerData.push(total);
        });
        footerData.push('');

        const f = worksheet.addRow(footerData);
        worksheet.mergeCells(f.number, 1, f.number, 6);
        f.eachCell((cell, colIdx) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: colIdx > 6 ? 'center' : 'left' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colIdx === 1) cell.alignment.horizontal = 'left';
        });

        // 9. Cấu hình độ rộng cột
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 6;
        worksheet.getColumn(3).width = 50;
        worksheet.getColumn(4).width = 30;
        worksheet.getColumn(5).width = 30;
        worksheet.getColumn(6).width = 30;
        deptColIdx = 7;
        ticketDepts.forEach(() => {
            worksheet.getColumn(deptColIdx).width = 12;
            deptColIdx++;
        });
        worksheet.getColumn(ghiChuColIdx).width = 50;

        // 10. Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `PhieuCham5S_${ticket.TicketCode}_${ticket.MonthValue}_${ticket.YearValue}.xlsx`;
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName);
    }

    onExportMonthlySummary() {
        if (!this.searchMonth || !this.searchYear) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Năm và Tháng để xuất tổng hợp');
            return;
        }

        this.isLoading = true;

        // 1. Lấy dữ liệu tổng hợp ma trận tháng
        this.detailService.getMatrixMonthlySummary(this.searchYear, this.searchMonth).subscribe({
            next: async (res: any) => {
                if (res?.status === 1) {
                    const monthlyData = res.data;
                    const sessions = monthlyData.Sessions || [];

                    if (sessions.length === 0) {
                        this.isLoading = false;
                        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu chấm điểm trong tháng này');
                        return;
                    }

                    // 2. Lấy dữ liệu chi tiết cho từng session
                    const sessionDetailsRequests: Observable<any>[] = sessions.map((s: any) => this.detailService.getMatrixBySession(s.SessionID));

                    forkJoin(sessionDetailsRequests).subscribe({
                        next: async (results: any) => {
                            const detailsList = results as any[];
                            this.isLoading = false;

                            const workbook = new ExcelJS.Workbook();

                            // Tạo sheet tổng hợp tháng đầu tiên
                            await this.performMonthlySummaryExcelExport(monthlyData, workbook);

                            // Tạo các sheet chi tiết cho từng session
                            for (let i = 0; i < detailsList.length; i++) {
                                const detailRes: any = detailsList[i];
                                if (detailRes?.status === 1) {
                                    const sessionDate = new Date(sessions[i].RatingDate);
                                    let sheetName = `${sessionDate.getDate()}.${sessionDate.getMonth() + 1}`;
                                    // Ensure sheet name is unique and not too long
                                    await this.performSessionExcelExport(detailRes.data, workbook, sheetName);
                                }
                            }

                            // Xuất file
                            const buffer = await workbook.xlsx.writeBuffer();
                            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `TongHop5S_Thang${this.searchMonth}_${this.searchYear}.xlsx`);
                        },
                        error: () => {
                            this.isLoading = false;
                            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết các đợt chấm');
                        }
                    });
                } else {
                    this.isLoading = false;
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi tải dữ liệu tổng hợp');
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
            }
        });
    }

    private async performMonthlySummaryExcelExport(data: any, workbook: ExcelJS.Workbook) {
        const { Sessions, Departments, Points, Notes } = data;
        if (!Sessions || Sessions.length === 0) {
            return;
        }

        const worksheet = workbook.addWorksheet(`TongHopThang${this.searchMonth}_5S`);

        // 1. Title
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = `BẢNG TỔNG HỢP BIÊN BẢN ĐÁNH GIÁ 5S T${this.searchMonth}/${this.searchYear}`;
        titleRow.getCell(1).font = { bold: true, size: 14 };
        titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(1, 1, 1, Departments.length + 2);

        // 2. Header
        const headerRow = ['Ngày', ...Departments.map((d: any) => d.Name), 'Ghi chú'];
        const h = worksheet.addRow(headerRow);
        h.height = 30;
        h.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }; // Light blue
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // 3. Data Rows
        Sessions.forEach((session: any) => {
            const rowData = [this.formatDate(session.RatingDate)];

            Departments.forEach((dept: any) => {
                const point = Points.find((p: any) => p.SessionID === session.SessionID && p.DeptID === dept.ID);
                rowData.push(point ? point.TotalPoints : '');
            });

            const noteObj = Notes.find((n: any) => n.SessionID === session.SessionID);
            rowData.push(noteObj ? noteObj.AggregatedNotes : '');

            const r = worksheet.addRow(rowData);
            r.height = 60; // Higher rows for notes
            r.eachCell((cell, colIdx) => {
                cell.font = { size: 12 };
                cell.alignment = { vertical: 'middle', horizontal: colIdx === 1 || colIdx > Departments.length + 1 ? 'left' : 'center', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        // 4. Footer (Total Row)
        const footerData = ['Tổng'];
        Departments.forEach((dept: any) => {
            const total = Points
                .filter((p: any) => p.DeptID === dept.ID)
                .reduce((sum: number, p: any) => sum + (Number(p.TotalPoints) || 0), 0);
            footerData.push(total);
        });
        footerData.push(''); // Ghi chú empty in footer

        const f = worksheet.addRow(footerData);
        f.height = 25;
        f.eachCell((cell, colIdx) => {
            cell.font = { bold: true, size: 12 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow for totals if points exist
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // 5. Column Widths
        worksheet.getColumn(1).width = 15;
        Departments.forEach((d: any, i: number) => {
            worksheet.getColumn(i + 2).width = 12;
        });
        worksheet.getColumn(Departments.length + 2).width = 50;
    }
    private getTypeErrorName(type: number): string {
        const map: any = {
            1: `S1 - Seiri (Sàng lọc)
Loại bỏ những vật dụng không cần thiết`,
            2: `S2 - Seiton (Sắp xếp)
Để mọi thứ đúng chỗ, dễ thấy, dễ lấy`,
            3: `S3 - Seiso (Sạch sẽ)
Vệ sinh nơi làm việc sạch sẽ`,
            4: `S4 - Seiketsu (Săn sóc)
Duy trì tiêu chuẩn 3S ở mọi nơi`,
            5: `S5 - Shitsuke (Sẵn sàng)
Tự giác thực hiện 5S hàng ngày`
        };
        return map[type] || 'Khác';
    }

    goToRating(item: any) {
        if (item.ID === 0) return;
        this.router.navigate(['/five-s-rating-detail'], { queryParams: { ticketId: item.ID, sessionId: item.Rating5SID } });
    }
}
