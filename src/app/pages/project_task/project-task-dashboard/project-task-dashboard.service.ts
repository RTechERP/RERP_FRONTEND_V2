import { Injectable, inject } from '@angular/core';
import { ProjectTaskService, ProjectTaskItem } from '../project-task/project-task.service';
import { map, Observable } from 'rxjs';

export interface DashboardStats {
  totalTasks: number;
  notStarted: number;       // 1
  inProgress: number;       // 2
  inProgressOverdue: number; // 21
  completed: number;        // 3
  completedOverdue: number; // 31
  approved: number;         // 32
  rejected: number;         // 33
  pending: number;          // 4
  pendingApproval: number;  // (Status 3 + ReviewStatus 1)
}

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
        projectChartData: ChartData
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

                return {
                    tasks,
                    stats,
                    statusChartData,
                    projectChartData
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

    private calculateStats(tasks: ProjectTaskItem[], currentUserId: number): DashboardStats {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const statusCounts = {
            1: 0, 2: 0, 21: 0, 3: 0, 31: 0, 32: 0, 33: 0, 4: 0
        };

        tasks.forEach(t => {
            const ds = this.computeDisplayStatus(t, now);
            if (statusCounts.hasOwnProperty(ds)) {
                (statusCounts as any)[ds]++;
            }
        });

        return {
            totalTasks: tasks.length,
            notStarted: statusCounts[1],
            inProgress: statusCounts[2],
            inProgressOverdue: statusCounts[21],
            completed: statusCounts[3],
            completedOverdue: statusCounts[31],
            approved: statusCounts[32],
            rejected: statusCounts[33],
            pending: statusCounts[4],
            pendingApproval: tasks.filter(t => t.ReviewStatus === 1 && t.Status === 3 && t.EmployeeID === currentUserId).length
        };
    }

    private computeDisplayStatus(task: ProjectTaskItem, now: Date): number {
        const status = task.Status || 1;
        const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
        const dueDate = task.DueDate ? new Date(task.DueDate) : null;

        // Quá hạn?
        const isOverdue = (planEnd && planEnd < now && status !== 3 && status !== 32 && status !== 4) ||
            (dueDate && planEnd && new Date(dueDate) > planEnd);

        if (status === 2 && isOverdue) return 21;
        if (status === 3) {
            if (task.ReviewStatus === 2) return 32;
            if (task.ReviewStatus === 3) return 33;
            if (isOverdue) return 31;
            return 3;
        }

        return status;
    }

    private prepareStatusChartData(tasks: ProjectTaskItem[]): ChartData {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const counts: { [key: number]: number } = {
            1: 0, 2: 0, 21: 0, 3: 0, 31: 0, 32: 0, 33: 0, 4: 0
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
            counts[1],
            counts[2],
            counts[21],
            counts[3],
            counts[31],
            counts[32],
            counts[33],
            counts[4]
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
                const date = t.DueDate ? new Date(t.DueDate) : null;
                return t.Status === 3 && date && date <= checkDate;
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
