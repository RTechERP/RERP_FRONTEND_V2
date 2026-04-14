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
  pendingApproval: number;  // (Status 2 + IsApproved 1)
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
    { id: 3, label: 'Pending', color: '#ea580c' }
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

    getDashboardData(startDate: string, endDate: string, currentUserId: number): Observable<{
        tasks: ProjectTaskItem[],
        stats: DashboardStats,
        statusChartData: ChartData,
        projectChartData: ChartData,
        typeStackedChartData: ChartData
    }> {
        return this.projectTaskService.getProjectTasks(startDate, endDate, -1).pipe(
            map(res => {
                const rawTasks = res.ProjectTask || [];
                let tasks = this.uniqueById(rawTasks);

                // Chỉ tính và hiển thị công việc lá (không có con trong bộ dữ liệu hiện tại)
                tasks = this.filterLeafTasks(tasks);

                const stats = this.calculateStats(tasks, currentUserId);
                const statusChartData = this.prepareStatusChartData(tasks);
                const projectChartData = this.prepareTimelineChartData(tasks, startDate, endDate);
                const typeStackedChartData = this.prepareTypeStackedChartData(tasks);

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
            0: 0, 1: 0, 11: 0, 2: 0, 21: 0, 22: 0, 23: 0, 3: 0
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
            pendingApproval: tasks.filter(t => t.IsApproved === 1 && t.Status === 2 && t.EmployeeIDRequest === currentUserId).length,
            typeStats
        };
    }

    public prepareTypeStackedChartData(tasks: ProjectTaskItem[], filterTypeNames?: string[], filterStatusIds?: number[]): ChartData {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
 
        // 1. Identify all types (X-axis labels)
        let typeNames = Array.from(new Set(tasks.map(t => t.ProjectTaskTypeName || 'Khác')));
        
        if (filterTypeNames && filterTypeNames.length > 0) {
            typeNames = typeNames.filter(name => filterTypeNames.includes(name));
        }

        // 2. Define Statuses and their Colors (Datasets)
        let statusConfigs = STATUS_CONFIGS;

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
            if (task.IsApproved === 2) return 22;
            if (task.IsApproved === 3) return 23;
            if (isOverdue) return 21;
            return 2;
        }

        return status;
    }

    private prepareStatusChartData(tasks: ProjectTaskItem[]): ChartData {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const counts: { [key: number]: number } = {
            0: 0, 1: 0, 11: 0, 2: 0, 21: 0, 22: 0, 23: 0, 3: 0
        };

        tasks.forEach(t => {
            const ds = this.computeDisplayStatus(t, now);
            if (counts.hasOwnProperty(ds)) {
                counts[ds]++;
            }
        });

        const labels = [
            'Chưa làm',
            'Đang làm',
            'Đang làm quá hạn',
            'Hoàn thành',
            'Hoàn thành quá hạn',
            'Đã duyệt',
            'Đã hủy duyệt',
            'Pending'
        ];

        const data = [
            counts[0],
            counts[1],
            counts[11],
            counts[2],
            counts[21],
            counts[22],
            counts[23],
            counts[3]
        ];

        const colors = [
            '#94a3b8', // 1: Secondary soft
            '#3b82f6', // 2: Info
            '#f43f5e', // 21: Danger (Rose)
            '#10b981', // 3: Success
            '#f59e0b', // 31: Warning (Amber)
            '#8b5cf6', // 32: Violet
            '#64748b', // 33: Gray
            '#ea580c'  // 4: Orange
        ];

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: colors
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
