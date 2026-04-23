import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ProjectTaskDashboardService, DashboardStats, ChartData } from './project-task-dashboard.service';
import { KanbanService } from '../kanban/kanban.service';
import { ProjectTaskItem } from '../project-task/project-task.service';
import { ChartModule } from 'primeng/chart';
import { Router } from '@angular/router';
import { AppUserService } from '../../../services/app-user.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { ProjectTaskStatusDetailComponent } from '../project-task-status-detail/project-task-status-detail.component';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { TooltipModule } from 'primeng/tooltip';

// ECharts
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
]);

@Component({
  selector: 'app-project-task-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    NzIconModule,
    NzModalModule,
    NzMessageModule,
    NzButtonModule,
    ChartModule,
    TooltipModule,
    NzRateModule,
    NgxEchartsDirective,
    NzInputModule
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './project-task-dashboard.component.html',
  styleUrl: './project-task-dashboard.component.css'
})
export class ProjectTaskDashboardComponent implements OnInit {
  private dashboardService = inject(ProjectTaskDashboardService);
  private kanbanService = inject(KanbanService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private appUserService = inject(AppUserService);
  private tabService = inject(TabServiceService);

  @ViewChild('approveModalTpl') approveModalTpl!: TemplateRef<any>;
  @ViewChild('rejectModalTpl') rejectModalTpl!: TemplateRef<any>;

  approveReviewText: string = '';
  approveCompletionRating: number = 5;
  rejectReviewText: string = '';
  rejectReviewError: boolean = false;
  isApproving: boolean = false;

  // Filters
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();

  // Data State
  loading = signal(false);
  allTasks = signal<ProjectTaskItem[]>([]);
  stats = signal<DashboardStats | null>(null);
  statusChartData = signal<any>(null);
  projectChartData = signal<any>(null);

  // My Tasks Analytics
  typeStackedChartOptions = signal<any>({});
  typeSelections = signal<{ name: string, color: string, selected: boolean, count: number }[]>([]);
  searchTypeText = signal<string>('');

  totalTasksInSidebar = computed(() => {
    return this.typeSelections().reduce((acc, curr) => acc + curr.count, 0);
  });

  showTypeSidebar = signal<boolean>(true);

  toggleTypeSidebar() {
    this.showTypeSidebar.set(!this.showTypeSidebar());
    // Rezize chart after sidebar transition
    setTimeout(() => {
        // Trigger resize event for ECharts
        window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  // Navigation
  goToProjectTask() {
    this.router.navigate(['/project-task']);
  }

  viewStatusDetail(statusId: number, label: string) {
    this.tabService.openTabComp({
      comp: ProjectTaskStatusDetailComponent,
      title: `Chi tiết: ${label}`,
      key: `status-detail-${statusId}`,
      data: {
        statusId: statusId,
        dateStart: this.dateStart,
        dateEnd: this.dateEnd
      }
    });
  }

  private statusChartMapping = [1, 2, 21, 3, 31, 32, 33, 4];

  onStatusChartClick(event: any) {
    if (!event.element) return;
    const index = event.element.index;
    const statusId = this.statusChartMapping[index];
    const label = this.statusChartData().labels[index];
    if (statusId !== undefined) {
      this.viewStatusDetail(statusId, label);
    }
  }

  // Chart Options
  // Chart Options
  get pieOptions() {
    const isMobile = window.innerWidth <= 768;
    return {
      plugins: {
        legend: {
          position: isMobile ? 'bottom' : 'right',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  lineOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        offset: 20,
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          color: '#94a3b8'
        }
      },
      y: {
        beginAtZero: true,
        border: {
          dash: [4, 4],
          display: false
        },
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          stepSize: 1,
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          color: '#94a3b8'
        }
      }
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  piePlugins = [{
    id: 'pieLabels',
    afterDraw: (chart: any) => {
      const { ctx, data } = chart;
      ctx.save();
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((element: any, index: number) => {
          // Skip hidden slices (toggled off via legend)
          if (element.hidden || meta.data[index].hidden || !chart.getDataVisibility(index)) return;

          const { x, y, startAngle, endAngle, outerRadius, innerRadius } = element;
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
          const angle = startAngle + (endAngle - startAngle) / 2;
          const labelX = x + Math.cos(angle) * radius;
          const labelY = y + Math.sin(angle) * radius;

          const value = data.datasets[i].data[index];
          if (value > 0) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), labelX, labelY);
          }
        });
      });
      ctx.restore();
    }
  }];

  // Computed Lists
  upcomingTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.allTasks()
      .filter(t => {
        if (t.Status === 3 || t.Status === 4) return false; // Skip completed/pending
        if (!t.PlanEndDate) return false;
        const d = new Date(t.PlanEndDate);
        d.setHours(0, 0, 0, 0);
        // Only today and tomorrow
        return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime();
      })
      .sort((a, b) => {
        const da = new Date(a.PlanEndDate!).getTime();
        const db = new Date(b.PlanEndDate!).getTime();
        return da - db;
      });
  });

  getUpcomingLabel(task: ProjectTaskItem): string {
    if (!task.PlanEndDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(task.PlanEndDate);
    d.setHours(0, 0, 0, 0);

    return d.getTime() === today.getTime() ? 'Hôm nay' : 'Ngày mai';
  }

  pendingApprovalTasks = computed(() => {
    const currentUserId = this.appUserService.employeeID;
    return this.allTasks()
      .filter(t => t.Status === 2 && t.ApprovalStatus === null && t.EmployeeIDRequest === currentUserId);
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    if (!this.dateStart || !this.dateEnd) {
      this.message.warning('Vui lòng chọn đầy đủ khoảng ngày tìm kiếm (Từ ngày - Đến ngày)');
      return;
    }

    this.loading.set(true);
    const [start, end] = this.getFormattedDateRange();
    const currentUserId = this.appUserService.employeeID || 0;

    this.dashboardService.getDashboardData(start, end, currentUserId).subscribe({
      next: (data) => {
        this.allTasks.set(data.tasks);
        this.stats.set(data.stats);
        this.statusChartData.set(data.statusChartData);
        this.projectChartData.set(data.projectChartData);
        
        // My Tasks Analytics
        this.initTypeSelections(data.tasks);
        this.updateTypeStackedChart();

        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.loading.set(false);
      }
    });
  }

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getDefaultDateStart(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  private getDefaultDateEnd(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  private getFormattedDateRange(): [string, string] {
    if (!this.dateStart || !this.dateEnd) return ['', ''];
    return [this.dateStart, this.dateEnd];
  }

  private isOverdue(task: ProjectTaskItem, now: Date): boolean {
    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (planEnd) planEnd.setHours(0, 0, 0, 0);

    const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    if (dueDate && planEnd && dueDate > planEnd) return true;
    if (!dueDate && planEnd && planEnd < now && task.Status !== 4) return true;
    return false;
  }

  approveTask(task: ProjectTaskItem): void {
    this.approveReviewText = '';
    this.approveCompletionRating = 5;
    this.modal.create({
      nzTitle: 'Xác nhận duyệt công việc',
      nzContent: this.approveModalTpl,
      nzOkText: 'Duyệt',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (!this.approveCompletionRating || this.approveCompletionRating < 1) {
          this.message.error('Vui lòng đánh giá tối thiểu 1 sao');
          return;
        }
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask([task.ID], true, this.approveReviewText, this.approveCompletionRating).subscribe({
            next: () => {
              this.message.success(`Đã duyệt công việc "${task.Mission}"`);
              this.isApproving = false;
              this.refreshData();
              resolve();
            },
            error: () => {
              this.message.error('Không thể duyệt công việc');
              this.isApproving = false;
              reject();
            }
          });
        });
      }
    });
  }

  rejectTask(task: ProjectTaskItem): void {
    this.rejectReviewText = '';
    this.rejectReviewError = false;
    this.modal.create({
      nzTitle: 'Xác nhận từ chối công việc',
      nzContent: this.rejectModalTpl,
      nzOkText: 'Từ chối',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!this.rejectReviewText.trim()) {
          this.rejectReviewError = true;
          this.cdr.detectChanges();
          return false;
        }
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask([task.ID], false, this.rejectReviewText).subscribe({
            next: () => {
              this.message.warning(`Đã từ chối công việc "${task.Mission}"`);
              this.isApproving = false;
              this.refreshData();
              resolve();
            },
            error: () => {
              this.message.error('Không thể từ chối công việc');
              this.isApproving = false;
              reject();
            }
          });
        });
      }
    });
  }

  openTaskDetail(task: ProjectTaskItem) {
    const taskId = task.ID;
    const taskCode = task.Code || `Task-${taskId}`;
    this.tabService.openTabComp({
      comp: TaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId }
    });
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '-';
    return new Date(dateVal).toLocaleDateString('vi-VN');
  }

  // ===== My Tasks Analytics Logic =====

  private initTypeSelections(tasks: ProjectTaskItem[]) {
    // Only count tasks for current user
    const currentUserId = this.appUserService.employeeID || 0;
    const myTasks = tasks.filter(t => t.AsigneeEmployeeID === currentUserId);

    const typeCounts = new Map<string, { count: number, color: string }>();
    myTasks.forEach(t => {
      const typeName = t.ProjectTaskTypeName || 'Khác';
      const existing = typeCounts.get(typeName);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(typeName, { count: 1, color: t.ProjectTaskColor || '#1890ff' });
      }
    });

    const selections = Array.from(typeCounts.entries()).map(([name, data]) => ({
      name,
      color: data.color,
      selected: true,
      count: data.count
    })).sort((a, b) => b.count - a.count);

    this.typeSelections.set(selections);
  }

  get filteredTypeSelections() {
    const search = this.searchTypeText().toLowerCase().trim();
    if (!search) return this.typeSelections();
    return this.typeSelections().filter(s => s.name.toLowerCase().includes(search));
  }

  toggleTypeSelection(typeName: string) {
    const current = this.typeSelections();
    const target = current.find(s => s.name === typeName);
    if (target) {
      target.selected = !target.selected;
      this.typeSelections.set([...current]);
      this.updateTypeStackedChart();
    }
  }

  toggleAllTypes(selected: boolean) {
    const current = this.typeSelections();
    current.forEach(s => s.selected = selected);
    this.typeSelections.set([...current]);
    this.updateTypeStackedChart();
  }

  updateTypeStackedChart() {
    const currentUserId = this.appUserService.employeeID || 0;
    const selectedTypes = this.typeSelections().filter(s => s.selected).map(s => s.name);
    
    // Filter tasks for current user and selected types
    const filteredTasks = this.allTasks().filter(t => 
      t.AsigneeEmployeeID === currentUserId && 
      selectedTypes.includes(t.ProjectTaskTypeName || 'Khác')
    );

    const data = this.dashboardService.prepareTypeStackedChartData(filteredTasks, selectedTypes);
    
    // Convert ChartData to ECharts Options
    this.typeStackedChartOptions.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            if (p.value > 0 || p.seriesType === 'line') {
              html += `${p.marker} ${p.seriesName}: <b>${p.value}</b><br/>`;
            }
          });
          return html;
        }
      },
      legend: {
        bottom: 0,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.labels,
        axisLabel: { rotate: 30, interval: 0, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: 'Số lượng CV'
      },
      series: data.datasets.map((ds: any) => ({
        name: ds.label,
        type: ds.type || 'bar',
        stack: ds.stack || undefined,
        data: ds.data,
        itemStyle: { color: ds.backgroundColor },
        lineStyle: ds.type === 'line' ? { width: 3 } : undefined,
        symbol: ds.type === 'line' ? 'circle' : undefined,
        symbolSize: ds.type === 'line' ? 8 : undefined
      }))
    });
  }
}
