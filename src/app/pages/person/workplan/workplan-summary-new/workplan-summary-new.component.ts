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
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';

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
        private workplanService: WorkplanService
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
        this.loadDepartments();
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

    onDepartmentChange(): void {
        this.teamId = 0;
        this.userId = 0;
        this.teamList = [];
        this.userList = [];

        if (this.departmentId > 0) {
            this.workplanService.getTeamsByDepartment(this.departmentId).subscribe({
                next: (response: any) => {
                    if (response && response.status === 1 && response.data) {
                        this.teamList = Array.isArray(response.data) ? response.data : [];
                    }
                },
                error: (error: any) => {
                    console.error('Error loading teams:', error);
                }
            });
        }
        this.loadData();
    }

    onTeamChange(): void {
        this.userId = 0;
        this.userList = [];

        if (this.teamId > 0) {
            this.workplanService.getUsersByTeam(this.teamId).subscribe({
                next: (response: any) => {
                    if (response && response.status === 1 && response.data) {
                        this.userList = Array.isArray(response.data) ? response.data : [];
                    }
                },
                error: (error: any) => {
                    console.error('Error loading users:', error);
                }
            });
        }
        this.loadData();
    }

    loadData(): void {
        if (!this.dateStart || !this.dateEnd) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khoảng thời gian!');
            return;
        }

        this.isLoading = true;
        const params = {
            dateStart: this.dateStart,
            dateEnd: this.dateEnd,
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
        this.departmentId = 0;
        this.teamId = 0;
        this.userId = 0;
        this.teamList = [];
        this.userList = [];
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

    private labelToDate(label: string): Date | null {
        const normalized = this.normalize(label);
        const match = normalized.match(/\((\d{2})\/(\d{2})\)$/);
        if (!match) return null;
        const year = DateTime.fromFormat(this.dateStart, 'yyyy-MM-dd').year || new Date().getFullYear();
        return new Date(year, +match[2] - 1, +match[1]);
    }

    private buildDateCols(rows: any[]): any[] {
        if (!rows.length) return [];
        return Object.keys(rows[0])
            .filter(k => this.isDayCol(k))
            .map(k => {
                const norm = this.normalize(k);
                const dt = this.labelToDate(norm);
                return { 
                    field: k, 
                    norm, 
                    dt, 
                    title: this.head2lines(norm), 
                    isSun: dt && dt.getDay() === 0 
                };
            })
            .filter(c => c.dt && !isNaN(c.dt.getTime()))
            .sort((a, b) => (a.dt?.getTime() || 0) - (b.dt?.getTime() || 0));
    }

    private renderTable(): void {
        if (!this.summaryTableContainer) return;

        const rows = this.summaryData;
        const dayCols = this.buildDateCols(rows);
        
        // Build table HTML
        const container = this.summaryTableContainer.nativeElement;
        
        // Column widths
        const W = {
            stt: 60, name: 156, project: 220, code: 140, mission: 360, status: 100, type: 90, day: 64
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
                const tdMis = `<td rowspan="2" style="${tdSticky(4)} white-space:pre-wrap; word-break:break-word; text-align:left; vertical-align:middle;">${r.Mission || ''}</td>`;
                const tdStat = `<td rowspan="2" class="align-middle" style="${tdSticky(5)}">${r.StatusText || ''}</td>`;
                const tdTypePlan = `<td class="text-center" style="${tdSticky(6)} vertical-align:middle;">Dự kiến</td>`;

                const ps = r.PlanStartDate ? new Date(r.PlanStartDate) : null;
                const pe = r.PlanEndDate ? new Date(r.PlanEndDate) : null;
                const planCells = dayCols.map(c => {
                    let bg = '';
                    if (ps && pe && c.dt) {
                        const d0 = new Date(c.dt.getFullYear(), c.dt.getMonth(), c.dt.getDate());
                        const ps0 = new Date(ps.getFullYear(), ps.getMonth(), ps.getDate());
                        const pe0 = new Date(pe.getFullYear(), pe.getMonth(), pe.getDate());
                        if (d0 >= ps0 && d0 <= pe0) bg = 'background:#33CCFF;';
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
                    return `<td style="${isOne ? 'background:#FFCC33;color:#fff;' : ''}"></td>`;
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
