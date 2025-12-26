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
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { WorkplanService } from '../workplan.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { EmployeeService } from '../../../hrm/employee/employee-service/employee.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-workplan-summary',
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
        NzRadioModule,
        NzSplitterModule,
    ],
    templateUrl: './workplan-summary.component.html',
    styleUrl: './workplan-summary.component.css'
})
export class WorkplanSummaryComponent implements OnInit, AfterViewInit {
    @ViewChild('summaryTable', { static: false }) summaryTableElement!: ElementRef;

    summaryTable: Tabulator | null = null;
    isLoading: boolean = false;

    // Filter params
    dateStart: Date | null = null;
    dateEnd: Date | null = null;
    keyword: string = '';
    departmentId: number = 0;
    teamId: number = 0;
    userId: number = 0;
    viewType: number = 0; // 0: Tổng hợp, 1: Chi tiết

    // Data
    summaryData: any[] = [];
    columnNames: string[] = [];
    departmentList: any[] = [];
    teamList: any[] = [];
    userList: any[] = [];

    constructor(
        private notification: NzNotificationService,
        private workplanService: WorkplanService,
        private projectService: ProjectService,
        private employeeService: EmployeeService
    ) {
        // Set default dates: đầu tuần đến cuối tuần hiện tại
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        this.dateEnd = new Date(this.dateStart.getFullYear(), this.dateStart.getMonth(), this.dateStart.getDate() + 6);
    }

    ngOnInit(): void {
        this.loadDepartments();
        this.loadUserTeams();
        this.loadEmployees();
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
        this.loadData();
    }

    loadUserTeams(): void {
        this.projectService.getUserTeams().subscribe({
            next: (response: any) => {
                if (response && response.status === 1 && response.data) {
                    this.teamList = Array.isArray(response.data) ? response.data : [];
                }
            },
            error: (error: any) => {
                console.error('Error loading user teams:', error);
            }
        });
    }

    loadEmployees(): void {
        this.employeeService.getEmployees().subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    this.userList = Array.isArray(response.data) ? response.data : [];
                }
            },
            error: (error: any) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    onViewTypeChange(): void {
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
            keyword: this.keyword || '',
            departmentId:2,
            teamId: this.teamId || 0,
            type: this.viewType,
            userId: this.userId || 0
        };

        this.workplanService.getWorkPlanSummary(params).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response && response.status === 1 && response.data) {
                    // API trả về {columns: [...], data: [...]}
                    this.columnNames = response.data.columns || [];
                    this.summaryData = response.data.data || [];
                    
                    // Table will be rendered automatically with HTML template
                } else {
                    this.summaryData = [];
                    this.columnNames = [];
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    resetSearch(): void {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        this.dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        this.dateEnd = new Date(this.dateStart.getFullYear(), this.dateStart.getMonth(), this.dateStart.getDate() + 6);
        this.keyword = '';
        this.departmentId = 0;
        this.teamId = 0;
        this.userId = 0;
        this.viewType = 0;
        this.teamList = [];
        this.userList = [];
        this.loadData();
    }

    formatDateHeader(date: string): string {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        try {
            const dateObj = DateTime.fromFormat(date, 'yyyy-MM-dd');
            if (dateObj.isValid) {
                const dayOfWeek = dayNames[dateObj.weekday % 7];
                return `${dayOfWeek}<br>${dateObj.toFormat('dd/MM')}`;
            }
        } catch (e) {
            // Keep original
        }
        return date;
    }

    getWorkContent(dayData: any): any {
        if (!dayData) return { Id: 0, Content: '', Location: 1 };
        
        if (typeof dayData === 'string') {
            const lines = dayData.split('\r\n');
            const id = lines[0] ? parseInt(lines[0]) : 0;
            
            // Extract content from "Nơi làm việc:" onwards
            let content = dayData;
            const locationIndex = dayData.indexOf('Nơi làm việc:');
            if (locationIndex !== -1) {
                content = dayData.substring(locationIndex);
            }
            
            const location = dayData.includes('Nơi làm việc:') && dayData.includes('VP RTC') ? 1 : 0;
            
            return { Id: id, Content: content, Location: location };
        }
        
        return dayData;
    }

    onEditWorkContentDetail(id: number): void {
        if (id && id > 0) {
            // TODO: Open modal to edit work content detail
            console.log('Edit work content detail:', id);
        }
    }
}
