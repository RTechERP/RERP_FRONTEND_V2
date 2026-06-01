import { Injectable, inject } from '@angular/core';
import { ProjectTaskService, ProjectTaskItem } from '../project-task/project-task.service';
import { map, Observable } from 'rxjs';

export interface DashboardStats {
  totalTasks: number;
  notStarted: number;       // 0
  inProgress: number;       // 1
  inProgressOverdue: number; // 11
  completed: number;        // 2
  completedOverdue: number; // 21
  approved: number;         // 22
  rejected: number;         // 23
  pending: number;          // 3
  cancel: number;           // 4
  pendingApproval: number;  // (Status 2 + ApprovalStatus null)
  typeStats: { name: string, count: number, color: string }[];
}

export const STATUS_CONFIGS = [
    { id: 0, label: 'Chưa làm', color: '#94a3b8' },
    { id: 1, label: 'Đang làm', color: '#3b82f6' },
    { id: 11, label: 'Đang làm quá hạn', color: '#f43f5e' },
    { id: 2, label: 'Hoàn thành', color: '#10b981' },
    { id: 21, label: 'Hoàn thành quá hạn', color: '#f59e0b' },
    { id: 22, label: 'Đã duyệt', color: '#8b5cf6' },
    { id: 23, label: 'Đã hủy duyệt', color: '#64748b' },
    { id: 3, label: 'Pending', color: '#ea580c' },
    { id: 4, label: 'Hủy', color: '#ef4444' }
];

export interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        label?: string;
        fill?: boolean;
        tension?: number;
        pointRadius?: number;
        pointBackgroundColor?: string;
        pointBorderColor?: string;
        pointHoverRadius?: number;
        [key: string]: any; // Dành cho các thuộc tính bổ sung của ECharts/ChartJS
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskDashboardService {
    private projectTaskService = inject(ProjectTaskService);

    getDashboardData(startDate: string, endDate: string, currentUserId: number, allStatuses: any[] = []): Observable<{
        tasks: ProjectTaskItem[],
        stats: DashboardStats,
        statusChartData: ChartData,
        projectChartData: ChartData,
        typeStackedChartData: ChartData
    }> {
        return this.projectTaskService.getProjectTasks(startDate, endDate, '-1', -1).pipe(
            map(res => {
                const rawTasks = res.ProjectTask || [];
                let tasks = this.uniqueById(rawTasks);

                // Chỉ tính và hiển thị công việc lá (không có con trong bộ dữ liệu hiện tại)
                tasks = this.filterLeafTasks(tasks);

                const stats = this.calculateStats(tasks, currentUserId);
                const statusChartData = this.prepareStatusChartData(tasks, allStatuses);
                const projectChartData = this.prepareTimelineChartData(tasks, startDate, endDate);
                const typeStackedChartData = this.prepareTypeStackedChartData(tasks, allStatuses);

                return {
                    tasks,
                    stats,
                    statusChartData,
                    projectChartData,
                    typeStackedChartData
                };
            })
        );
    }

    private filterLeafTasks(tasks: ProjectTaskItem[]): ProjectTaskItem[] {
        // Thu thập tất cả ParentID đang có trong danh sách
        const parentIdSet = new Set(tasks.map(t => t.ParentID).filter(pid => pid != null));
        // Một công việc là "lá" nếu ID của nó không làm cha của bất kỳ công việc nào khác
        return tasks.filter(t => !parentIdSet.has(t.ID));
    }

    private uniqueById(tasks: ProjectTaskItem[]): ProjectTaskItem[] {
        const seen = new Set<number>();
        return tasks.filter(t => {
            if (seen.has(t.ID)) return false;
            seen.add(t.ID);
            return true;
        });
    }

    public calculateStats(tasks: ProjectTaskItem[], currentUserId: number): DashboardStats {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const statusCounts = {
            0: 0, 1: 0, 11: 0, 2: 0, 21: 0, 22: 0, 23: 0, 3: 0, 4: 0
        };

        const typeMap = new Map<string, { count: number, color: string }>();

        tasks.forEach(t => {
            const ds = this.computeDisplayStatus(t, now);
            if (statusCounts.hasOwnProperty(ds)) {
                (statusCounts as any)[ds]++;
            }

            // Count by type
            const typeName = t.ProjectTaskTypeName || 'Khác';
            const existing = typeMap.get(typeName);
            if (existing) {
                existing.count++;
            } else {
                typeMap.set(typeName, { count: 1, color: t.ProjectTaskColor || '#1890ff' });
            }
        });

        const typeStats = Array.from(typeMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            color: data.color
        })).sort((a, b) => b.count - a.count);

        return {
            totalTasks: tasks.length,
            notStarted: statusCounts[0],
            inProgress: statusCounts[1],
            inProgressOverdue: statusCounts[11],
            completed: statusCounts[2],
            completedOverdue: statusCounts[21],
            approved: statusCounts[22],
            rejected: statusCounts[23],
            pending: statusCounts[3],
            cancel: statusCounts[4],
            pendingApproval: tasks.filter(t => t.ApprovalStatus === null && t.Status === 2 && t.EmployeeIDRequest === currentUserId).length,
            typeStats
        };
    }

    public prepareTypeStackedChartData(tasks: ProjectTaskItem[], allStatuses: any[] = [], filterTypeNames?: string[], filterStatusIds?: number[]): ChartData {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const statusMap = new Map<number, any>();
        const approvalMap = new Map<number, any>();
        allStatuses.forEach(s => {
            if (s.Type === 1) statusMap.set(s.No, s);
            else if (s.Type === 2) approvalMap.set(s.No, s);
        });

        const getStatusName = (no: number, fb: string) => statusMap.has(no) ? statusMap.get(no).Title : fb;
        const getStatusColor = (no: number, fb: string) => statusMap.has(no) && statusMap.get(no).ColorFont ? statusMap.get(no).ColorFont : fb;
        const getApproveName = (no: number, fb: string) => approvalMap.has(no) ? approvalMap.get(no).Title : fb;
        const getApproveColor = (no: number, fb: string) => approvalMap.has(no) && approvalMap.get(no).ColorFont ? approvalMap.get(no).ColorFont : fb;
 
        // 1. Identify all types (X-axis labels)
        let typeNames = Array.from(new Set(tasks.map(t => t.ProjectTaskTypeName || 'Khác')));
        
        if (filterTypeNames && filterTypeNames.length > 0) {
            typeNames = typeNames.filter(name => filterTypeNames.includes(name));
        }

        // 2. Define Statuses and their Colors (Datasets)
        let statusConfigs = [
            { id: 0, label: getStatusName(0, 'Chưa làm'), color: getStatusColor(0, '#94a3b8') },
            { id: 1, label: getStatusName(1, 'Đang làm'), color: getStatusColor(1, '#3b82f6') },
            { id: 11, label: getStatusName(1, 'Đang làm') + ' Overdue', color: '#f43f5e' },
            { id: 2, label: getStatusName(2, 'Hoàn thành'), color: getStatusColor(2, '#10b981') },
            { id: 21, label: getStatusName(2, 'Hoàn thành') + ' Overdue', color: '#f59e0b' },
            { id: 22, label: getApproveName(1, 'Đã duyệt'), color: getApproveColor(1, '#8b5cf6') },
            { id: 23, label: getApproveName(0, 'Đã hủy duyệt'), color: getApproveColor(0, '#64748b') },
            { id: 3, label: getStatusName(3, 'Pending'), color: getStatusColor(3, '#ea580c') },
            { id: 4, label: getStatusName(4, 'Hủy'), color: getStatusColor(4, '#ef4444') }
        ];

        if (filterStatusIds && filterStatusIds.length > 0) {
            statusConfigs = statusConfigs.filter(config => filterStatusIds.includes(config.id));
        }
 
        const datasets: any[] = statusConfigs.map(config => {
            const data = typeNames.map(typeName => {
                return tasks.filter(t => 
                    (t.ProjectTaskTypeName || 'Khác') === typeName && 
                    this.computeDisplayStatus(t, now) === config.id
                ).length;
            });
 
            return {
                label: config.label,
                data: data,
                backgroundColor: config.color,
                type: 'bar',
                stack: 'status'
            };
        });

        // 3. Add Total Line dataset
        const totalData = typeNames.map(typeName => {
            return tasks.filter(t => (t.ProjectTaskTypeName || 'Khác') === typeName).length;
        });

        datasets.push({
            label: 'Tổng công việc',
            data: totalData,
            backgroundColor: '#005bb7',
            borderColor: '#005bb7',
            type: 'line',
            tension: 0.4,
            pointRadius: 4,
            fill: false
        });
 
        return {
            labels: typeNames,
            datasets: datasets
        };
    }

    public computeDisplayStatus(task: ProjectTaskItem, now: Date): number {
        const status = (task.Status === null || task.Status === undefined) ? 0 : task.Status;
        const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
        if (planEnd) planEnd.setHours(0, 0, 0, 0);

        const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;
        if (dueDate) dueDate.setHours(0, 0, 0, 0);

        // Quá hạn?
        const isOverdue = (planEnd && planEnd < now && status !== 2 && status !== 22 && status !== 3) ||
            (dueDate && planEnd && dueDate > planEnd);

        if (status === 1 && isOverdue) return 11;
        if (status === 2) {
            if (task.ApprovalStatus === true) return 22;
            if (task.ApprovalStatus === false) return 23;
            if (isOverdue) return 21;
            return 2;
        }

        return status;
    }

    private prepareStatusChartData(tasks: ProjectTaskItem[], allStatuses: any[] = []): ChartData {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const statusMap = new Map<number, any>();
        const approvalMap = new Map<number, any>();
        allStatuses.forEach(s => {
            if (s.Type === 1) statusMap.set(s.No, s);
            else if (s.Type === 2) approvalMap.set(s.No, s);
        });

        const getStatusName = (no: number, fb: string) => statusMap.has(no) ? statusMap.get(no).Title : fb;
        const getStatusColor = (no: number, fb: string) => statusMap.has(no) && statusMap.get(no).ColorFont ? statusMap.get(no).ColorFont : fb;
        const getApproveName = (no: number, fb: string) => approvalMap.has(no) ? approvalMap.get(no).Title : fb;
        const getApproveColor = (no: number, fb: string) => approvalMap.has(no) && approvalMap.get(no).ColorFont ? approvalMap.get(no).ColorFont : fb;

        const counts: { [key: number]: number } = {
            0: 0, 1: 0, 11: 0, 2: 0, 21: 0, 22: 0, 23: 0, 3: 0, 4: 0
        };

        tasks.forEach(t => {
            const ds = this.computeDisplayStatus(t, now);
            if (counts.hasOwnProperty(ds)) {
                counts[ds]++;
            }
        });

        const labels = [
            getStatusName(0, 'Chưa làm'),
            getStatusName(1, 'Đang làm'),
            getStatusName(1, 'Đang làm') + ' Overdue',
            getStatusName(2, 'Hoàn thành'),
            getStatusName(2, 'Hoàn thành') + ' Overdue',
            getApproveName(1, 'Đã duyệt'),
            getApproveName(0, 'Đã hủy duyệt'),
            getStatusName(3, 'Pending'),
            getStatusName(4, 'Hủy')
        ];

        const data = [
            counts[0],
            counts[1],
            counts[11],
            counts[2],
            counts[21],
            counts[22],
            counts[23],
            counts[3],
            counts[4]
        ];

        const colors = [
            getStatusColor(0, '#94a3b8'),
            getStatusColor(1, '#3b82f6'),
            '#f43f5e', // Overdue
            getStatusColor(2, '#10b981'),
            '#f59e0b', // Overdue
            getApproveColor(1, '#8b5cf6'),
            getApproveColor(0, '#64748b'),
            getStatusColor(3, '#ea580c'),
            getStatusColor(4, '#ef4444')
        ];

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                hoverBackgroundColor: colors,
                hoverOffset: 0
            }]
        };
    }

    private prepareTimelineChartData(tasks: ProjectTaskItem[], startDateStr: string, endDateStr: string): ChartData {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const dateList: Date[] = [];
        let curr = new Date(start);
        while (curr <= end) {
            dateList.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        const labels = dateList.map(d => {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
        });

        const totalData: number[] = [];
        const completedData: number[] = [];

        dateList.forEach(d => {
            const checkDate = new Date(d);
            checkDate.setHours(23, 59, 59, 999);

            // Tổng số công việc: Tính lũy kế hoặc filter theo ngày tạo (nếu có)
            // Ở đây giả sử allTasks là tập hợp công việc trong khoảng thời gian này
            // Chúng ta đếm các công việc có PlanStartDate hoặc CreatedDate <= ngày hiện tại
            const total = tasks.filter(t => {
                const date = t.CreatedDate ? new Date(t.CreatedDate) : (t.PlanStartDate ? new Date(t.PlanStartDate) : null);
                return date && date <= checkDate;
            }).length;

            // Số công việc hoàn thành: Status = 3 và DueDate <= ngày hiện tại
            const completed = tasks.filter(t => {
                const date = t.ActualEndDate ? new Date(t.ActualEndDate) : null;
                return t.Status === 2 && date && date <= checkDate;
            }).length;

            totalData.push(total);
            completedData.push(completed);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Hoàn thành',
                    data: completedData,
                    backgroundColor: 'rgba(139, 195, 74, 0.2)', // Light green fill
                    borderColor: '#8BC34A', // Green line
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#8BC34A',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                },
                {
                    label: 'Tổng số công việc',
                    data: totalData,
                    backgroundColor: 'rgba(103, 58, 183, 0.2)', // Light purple fill
                    borderColor: '#673AB7', // Purple line
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#673AB7',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                }
            ]
        };
    }
}
