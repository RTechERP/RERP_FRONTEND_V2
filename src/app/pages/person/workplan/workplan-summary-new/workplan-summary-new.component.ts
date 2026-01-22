import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { WorkplanService } from '../workplan.service';
import { EmployeeService } from '../../../hrm/employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TeamServiceService } from '../../../hrm/team/team-service/team-service.service';
import { AppUserService } from '../../../../services/app-user.service';
@Component({
    selector: 'app-workplan-summary-new',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzButtonModule,
        NzIconModule,
        NzDatePickerModule,
        NzInputModule,
        NzSelectModule,
        NzFormModule,
        NzSpinModule,
        NzSplitterModule
    ],
    templateUrl: './workplan-summary-new.component.html',
    styleUrl: './workplan-summary-new.component.css'
})
export class WorkplanSummaryNewComponent implements OnInit, AfterViewInit {
    @ViewChild('summaryTableContainer', { static: false }) summaryTableContainer!: ElementRef;

    isLoading: boolean = false;

    // Filter params
    dateStart: string = '';
    dateEnd: string = '';
    keyword: string = '';
    departmentId: number = 0;
    teamId: number = 0;
    userId: number = 0;

    // Data
    summaryData: any[] = [];
    departmentList: any[] = [];
    teamList: any[] = [];
    userList: any[] = [];

    constructor(
        private notification: NzNotificationService,
        private workplanService: WorkplanService,
        private employeeService: EmployeeService,
        private TeamService: TeamServiceService,
        private appUserService: AppUserService
    ) {
        // Set default dates: đầu tuần đến cuối tuần hiện tại
        const now = DateTime.now();
        const dayOfWeek = now.weekday;
        const startOfWeek = now.minus({ days: dayOfWeek - 1 });
        const endOfWeek = startOfWeek.plus({ days: 6 });

        this.dateStart = startOfWeek.toFormat('yyyy-MM-dd');
        this.dateEnd = endOfWeek.toFormat('yyyy-MM-dd');
    }

    ngOnInit(): void {
        // Set default departmentId theo phòng ban của user hiện tại
        this.departmentId = this.appUserService.departmentID || 0;
        this.teamId = this.appUserService.currentUser?.TeamOfUser || 0;

        this.loadDepartments();
        this.loadEmployees();
        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        }
    }

    ngAfterViewInit(): void {
        this.loadData();
    }

    loadDepartments(): void {
        this.workplanService.getDepartments().subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    this.departmentList = Array.isArray(response.data) ? response.data : [];
                }
            },
            error: (error: any) => {
                console.error('Error loading departments:', error);
            }
        });
    }



    onDateChange(): void {
        // Không tự động load khi đổi ngày, user phải click nút Tìm kiếm
        // Chỉ clear table để tránh hiển thị data cũ với date range mới
    }

    onDepartmentChange(): void {
        this.userId = 0;
        this.teamId = 0;
        this.loadEmployees();
        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        } else {
            this.teamList = [];
        }
        this.loadData();
    }

    onTeamChange(): void {
        this.userId = 0;
        this.loadData();
    }
    loadTeamsByDepartment(deptId: number): void {
        this.workplanService.getTeamByDepartmentId(deptId).subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    const data = Array.isArray(response.data) ? response.data : [];
                    this.teamList = data.filter((x: any) => x.IsDeleted !== true);
                } else {
                    this.teamList = [];
                }
            },
            error: (error: any) => {
                console.error('Error loading teams by department:', error);
                this.teamList = [];
            }
        });
    }

    loadEmployees(): void {
        // Lấy nhân viên theo phòng ban được chọn (status = 0: đang làm việc)
        this.employeeService.filterEmployee(0, this.departmentId, '').subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    this.userList = Array.isArray(response.data) ? response.data : [];
                } else {
                    this.userList = [];
                }
            },
            error: (error: any) => {
                console.error('Error loading employees:', error);
                this.userList = [];
            }
        });
    }

    loadData(): void {
        if (!this.dateStart || !this.dateEnd) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
            return;
        }

        // Format dates to yyyy-MM-dd string
        const formatDate = (date: any): string => {
            if (date instanceof Date) {
                return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
            }
            if (typeof date === 'string') {
                return date;
            }
            return DateTime.fromFormat(date, 'yyyy-MM-dd').toFormat('yyyy-MM-dd');
        };

        this.isLoading = true;
        const params = {
            dateStart: formatDate(this.dateStart),
            dateEnd: formatDate(this.dateEnd),
            departmentID: this.departmentId || 0,
            teamID: this.teamId || 0,
            userID: this.userId || 0,
            keyWord: this.keyword || ''
        };

        this.workplanService.getSummarizeWork(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    this.summaryData = Array.isArray(response.data) ? response.data : [];
                } else if (Array.isArray(response)) {
                    this.summaryData = response;
                } else {
                    this.summaryData = [];
                }
                this.renderTable();
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    resetSearch(): void {
        const now = DateTime.now();
        const dayOfWeek = now.weekday;
        const startOfWeek = now.minus({ days: dayOfWeek - 1 });
        const endOfWeek = startOfWeek.plus({ days: 6 });

        this.dateStart = startOfWeek.toFormat('yyyy-MM-dd');
        this.dateEnd = endOfWeek.toFormat('yyyy-MM-dd');
        this.keyword = '';
        this.departmentId = this.appUserService.departmentID || 0;
        this.teamId = 0;
        this.userId = 0;

        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        } else {
            this.teamList = [];
        }
        this.loadEmployees();
        this.loadData();
    }

    private isDayCol(key: string): boolean {
        return /^(?:CN|T[2-7])\(\d{2}\/\d{2}\)?$/.test(key);
    }

    private normalize(key: string): string {
        return key.endsWith(')') ? key : (key + ')');
    }

    private head2lines(label: string): string {
        const normalized = this.normalize(label);
        const match = normalized.match(/^([^\(]+)\((\d{2})\/(\d{2})\)$/);
        return match ? `${match[1]}<br>(${match[2]}/${match[3]})` : label;
    }

    private toDateTime(date: any): DateTime {
        if (date instanceof Date) {
            return DateTime.fromJSDate(date);
        }
        if (typeof date === 'string') {
            return DateTime.fromFormat(date, 'yyyy-MM-dd');
        }
        return DateTime.now();
    }

    private labelToDate(label: string): Date | null {
        const normalized = this.normalize(label);
        const match = normalized.match(/\((\d{2})\/(\d{2})\)$/);
        if (!match) return null;

        const day = +match[1];
        const month = +match[2];

        // Lấy thông tin từ dateStart - dùng toDateTime để handle cả Date object và string
        const startDT = this.toDateTime(this.dateStart);
        const endDT = this.toDateTime(this.dateEnd);

        const startYear = startDT.year;
        const endYear = endDT.year;

        // Thử với năm bắt đầu trước
        let result = new Date(startYear, month - 1, day);
        const resultTime = result.getTime();
        const startTime = startDT.toJSDate().getTime();
        const endTime = endDT.toJSDate().getTime();

        // Nếu nằm trong khoảng thì trả về
        if (resultTime >= startTime && resultTime <= endTime) {
            return result;
        }

        // Nếu không và có cross-year, thử năm kết thúc
        if (startYear !== endYear) {
            result = new Date(endYear, month - 1, day);
            const newResultTime = result.getTime();
            if (newResultTime >= startTime && newResultTime <= endTime) {
                return result;
            }
        }

        // Fallback: trả về với năm bắt đầu
        return new Date(startYear, month - 1, day);
    }

    private buildDateCols(rows: any[]): any[] {
        const start = this.toDateTime(this.dateStart);
        const end = this.toDateTime(this.dateEnd);

        const cols: any[] = [];
        let cursor = start;

        // Lấy tất cả keys từ API để map chính xác
        const apiKeys = rows.length > 0 ? Object.keys(rows[0]).filter(k => this.isDayCol(k)) : [];
        console.log('API keys:', apiKeys);

        while (cursor <= end) {
            const dow = cursor.weekday === 7 ? 'CN' : `T${cursor.weekday + 1}`;
            const dateStr = cursor.toFormat('dd/MM');

            // Tìm key từ API khớp với ngày này (có thể thiếu dấu ) ở cuối)
            const matchingKey = apiKeys.find(k => {
                const normalized = this.normalize(k);
                return normalized.includes(`(${dateStr})`);
            });

            // Tạo cột ngay cả khi API không trả về (để hiển thị đủ ngày)
            const label = `${dow}(${dateStr})`;
            cols.push({
                field: matchingKey || label,  // Dùng key từ API nếu có, không thì dùng label
                norm: label,
                dt: cursor.toJSDate(),
                title: this.head2lines(label),
                isSun: cursor.weekday === 7
            });

            cursor = cursor.plus({ days: 1 });
        }

        console.log('Built columns:', cols.map(c => ({ field: c.field, dt: c.dt })));
        return cols;
    }


    private renderTable(): void {
        if (!this.summaryTableContainer) return;

        const rows = this.summaryData;
        const dayCols = this.buildDateCols(rows);
        console.log('dateStart:', this.dateStart);
        console.log('dateEnd:', this.dateEnd);
        console.log('dayCols length:', dayCols.length);
        // Build table HTML
        const container = this.summaryTableContainer.nativeElement;

        // Column widths
        const W = {
            stt: 60, name: 156, project: 200, code: 140, mission: 320, status: 100, type: 90, day: 64
        };

        // Calculate left positions for sticky columns
        const lefts = [
            0,
            W.stt,
            W.stt + W.name,
            W.stt + W.name + W.project,
            W.stt + W.name + W.project + W.code,
            W.stt + W.name + W.project + W.code + W.mission,
            W.stt + W.name + W.project + W.code + W.mission + W.status
        ];

        const thSticky = (i: number) => `
                position:sticky;top:0;left:${lefts[i]}px;z-index:3;background:#f2f4f7;
                border-right:1px solid #949494;border-bottom:1px solid #949494; ${i === 6 ? 'box-shadow: inset -1px 0 0 #949494, 0 1px 0 #949494;' : ''}
            `;

        const tdSticky = (i: number) => `
                position:sticky;left:${lefts[i]}px;z-index:2;background:#ffffff !important;
                border-right:1px solid #949494;border-bottom:1px solid #949494; ${i === 6 ? 'box-shadow: inset -1px 0 0 #949494;' : ''}
            `;

        // Build header
        let headerHtml = `
                <tr class="text-center align-middle">
                    <th class="text-center align-middle" style="min-width:60px;${thSticky(0)}">STT</th>
                    <th class="text-center align-middle" style="min-width:156px;${thSticky(1)}">Họ tên</th>
                    <th class="text-center align-middle" style="min-width:220px;${thSticky(2)}">Dự án</th>
                    <th class="text-center align-middle" style="min-width:140px;${thSticky(3)}">Mã hạng mục</th>
                    <th class="text-center align-middle" style="min-width:360px;${thSticky(4)}">Nội dung hạng mục</th>
                    <th class="text-center align-middle" style="min-width:100px;${thSticky(5)}">Trạng thái</th>
                    <th class="text-center align-middle" style="min-width:90px;${thSticky(6)}">Loại</th>
                
                    ${dayCols.map(c => `
                        <th class="text-center"
                            style="position:sticky;top:0;z-index:2;background:#f2f4f7;${c.isSun ? 'background:#DD0000; color:#FFFFFF' : ''}">
                            ${c.title}
                        </th>`).join('')}
                </tr>
            `;

        // Group by employee
        const groups = rows.reduce((acc: any, r: any) => {
            const key = r.FullName || 'Unknown';
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
        }, {});

        // Build body
        let bodyHtml = '';
        Object.entries(groups).forEach(([fullName, items]: [string, any], gIdx) => {
            items.forEach((r: any, idx: number) => {
                const groupSpan = items.length * 2;
                const sttIdx = gIdx + 1;
                let project = `${r.ProjectCode || ''}: ${r.ProjectName || ''}`.trim();
                if (!r.ProjectCode && !r.ProjectName) project = '';

                // Row 1: KẾ HOẠCH (Plan)
                const tdSTT = idx === 0 ? `<td rowspan="${groupSpan}" class="text-center align-middle" style="${tdSticky(0)}">${sttIdx}</td>` : '';
                const tdName = idx === 0 ? `<td rowspan="${groupSpan}" class="align-middle" style="${tdSticky(1)}white-space:normal;word-break:break-word;text-align:left;vertical-align:middle;">${fullName}</td>` : '';
                const tdProj = `<td rowspan="2" style="${tdSticky(2)} white-space:pre-wrap; word-break:break-word; text-align:left; vertical-align:middle;">${project}</td>`;
                const tdCode = `<td rowspan="2" class="align-middle" style="${tdSticky(3)} text-align:left; vertical-align:middle;">${r.Code || ''}</td>`;
                // Bôi màu vàng nếu Location khác "VP RTC" và "RTC"
                const loc = r.Location || '';
                const isNotRTC = loc !== 'VP RTC' && loc !== 'RTC' && loc !== '';
                const tdMis = `<td rowspan="2" style="${tdSticky(4)} white-space:pre-wrap; word-break:break-word; text-align:left; vertical-align:middle;${isNotRTC ? 'background:#FFCC00 !important;' : ''}">${r.Mission || ''}</td>`;
                const tdStat = `<td rowspan="2" class="align-middle" style="${tdSticky(5)}">${r.StatusText || ''}</td>`;
                const tdTypePlan = `<td class="text-center" style="${tdSticky(6)} vertical-align:middle;">Dự kiến</td>`;

                // Check if Location is "VP RTC" or "RTC" for yellow background
                const isRTC = r.Location === 'VP RTC' || r.Location === 'RTC';

                const ps = r.PlanStartDate ? new Date(r.PlanStartDate) : null;
                const pe = r.PlanEndDate ? new Date(r.PlanEndDate) : null;
                const planCells = dayCols.map(c => {
                    let bg = '';
                    // Check for day off first (value 2)
                    const v = r[c.field];
                    const n = v == null ? null : parseInt(String(v).trim(), 10);
                    if (Number.isFinite(n) && n === 2) {
                        bg = 'background:#DD0000;color:#fff;'; // Ngày nghỉ
                    } else if (ps && pe && c.dt) {
                        const d0 = new Date(c.dt.getFullYear(), c.dt.getMonth(), c.dt.getDate());
                        const ps0 = new Date(ps.getFullYear(), ps.getMonth(), ps.getDate());
                        const pe0 = new Date(pe.getFullYear(), pe.getMonth(), pe.getDate());
                        if (d0 >= ps0 && d0 <= pe0) {
                            bg = isRTC ? 'background:#FFCC00;' : 'background:#33CCFF;';
                        }
                    }
                    return `<td style="${bg}"></td>`;
                }).join('');

                bodyHtml += `<tr>${tdSTT}${tdName}${tdProj}${tdCode}${tdMis}${tdStat}${tdTypePlan}${planCells}</tr>`;

                // Row 2: THỰC TẾ (Actual)
                const tdTypeAct = `<td class="text-center" style="${tdSticky(6)} vertical-align:middle;">Thực tế</td>`;
                const actCells = dayCols.map(c => {
                    const v = r[c.field];
                    const n = v == null ? null : parseInt(String(v).trim(), 10);
                    const isOne = Number.isFinite(n) && n === 1;
                    return `<td style="${isOne ? 'background:#d85898;color:#fff;' : ''}"></td>`;
                }).join('');

                bodyHtml += `<tr>${tdTypeAct}${actCells}</tr>`;
            });
        });

        // Build colgroup
        let colgroupHtml = `
                <colgroup>
                    <col style="width:${W.stt}px">
                    <col style="width:${W.name}px">
                    <col style="width:${W.project}px">
                    <col style="width:${W.code}px">
                    <col style="width:${W.mission}px">
                    <col style="width:${W.status}px">
                    <col style="width:${W.type}px">
                    ${dayCols.map(() => `<col style="width:${W.day}px">`).join('')}
                </colgroup>
            `;
        // Render table
        container.innerHTML = `
                <table class="table table-sm table-bordered table-striped mb-0" style="border-collapse: separate; border-spacing: 0;">
                    ${colgroupHtml}
                    <thead>${headerHtml}</thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            `;
    }
}
