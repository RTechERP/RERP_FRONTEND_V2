import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ProjectHistoryProblemNewService } from '../project-history-problem-service/project-history-problem-new.service';

@Component({
  selector: 'app-project-history-problem-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, NzSelectModule, NzDatePickerModule, NzButtonModule],
  templateUrl: './project-history-problem-dashboard.component.html',
  styleUrl: './project-history-problem-dashboard.component.css'
})
export class ProjectHistoryProblemDashboardComponent implements OnInit, OnChanges {
  @Input() projectId?: number;

  chartData: any;
  chartOptions: any;

  lineChartData: any;
  lineChartOptions: any;

  doughnutChartData: any;
  doughnutChartOptions: any;

  projects: any[] = [];
  selectedProjectId: number | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;

  constructor(private projectHistoryProblemService: ProjectHistoryProblemNewService) { }

  ngOnInit(): void {
    this.initChartOptions();
    this.initLineChartOptions();
    this.initDoughnutChartOptions();
    this.loadProjects();

    if (this.projectId) {
      this.selectedProjectId = this.projectId;
      this.loadDashboardData();
    } else {
      // Tự động load tất cả khi không truyền projectId vào
      this.loadDashboardData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.selectedProjectId = this.projectId || null;
      this.loadDashboardData();
    }
  }

  loadProjects() {
    this.projectHistoryProblemService.getProjects().subscribe((res: any) => {
      if (res && (res.isSuccess || res.status === 1)) {
        this.projects = res.data;
      }
    });
  }

  loadDashboardData() {
    let fromDateStr = this.fromDate ? this.formatDate(this.fromDate) : undefined;
    let toDateStr = this.toDate ? this.formatDate(this.toDate) : undefined;
    let pId = this.selectedProjectId ? this.selectedProjectId : undefined;

    // Load Department Data
    this.projectHistoryProblemService.getDashboardDepartmentData(pId, fromDateStr, toDateStr)
      .subscribe((res: any) => {
        if (res && (res.isSuccess || res.status === 1)) {
          let rawData = res.data;
          let departmentLabels = rawData.map((x: any) => x.departmentName || x.DepartmentName);
          let problemCounts = rawData.map((x: any) => x.totalProblems || x.TotalProblems);

          this.setupChartData(departmentLabels, problemCounts);
        }
      });

    // Load Month Data
    this.projectHistoryProblemService.getDashboardMonthData(pId, fromDateStr, toDateStr)
      .subscribe((res: any) => {
        if (res && (res.isSuccess || res.status === 1)) {
          let rawData = res.data;
          let monthLabels = rawData.map((x: any) => `Tháng ${x.month || x.Month}/${x.year || x.Year}`);
          let problemCounts = rawData.map((x: any) => x.totalProblems || x.TotalProblems);

          this.setupLineChartData(monthLabels, problemCounts);
        }
      });

    // Load Status Data
    this.projectHistoryProblemService.getDashboardStatusData(pId, fromDateStr, toDateStr)
      .subscribe((res: any) => {
        if (res && (res.isSuccess || res.status === 1)) {
          let rawData = res.data;
          let statusLabels = rawData.map((x: any) => x.statusName || x.StatusName);
          let problemCounts = rawData.map((x: any) => x.totalProblems || x.TotalProblems);

          this.setupDoughnutChartData(statusLabels, problemCounts);
        }
      });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  setupChartData(labels: string[], dataList: number[]) {
    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Số lượng phát sinh',
          backgroundColor: '#42A5F5',
          hoverBackgroundColor: '#1E88E5',
          data: dataList
        }
      ]
    };
  }

  setupLineChartData(labels: string[], dataList: number[]) {
    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Số lượng phát sinh',
          data: dataList,
          fill: true,
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102, 187, 106, 0.2)',
          tension: 0.4
        }
      ]
    };
  }

  setupDoughnutChartData(labels: string[], dataList: number[]) {
    const documentStyle = getComputedStyle(document.documentElement);
    const backgroundColors = labels.map(label => {
      if (label === 'Chờ xử lý') return documentStyle.getPropertyValue('--orange-500') || '#f97316';
      if (label === 'Đang xử lý') return documentStyle.getPropertyValue('--blue-500') || '#3b82f6';
      if (label === 'Đã xử lý') return documentStyle.getPropertyValue('--green-500') || '#22c55e';
      return documentStyle.getPropertyValue('--cyan-500') || '#06b6d4';
    });
    
    const hoverBackgroundColors = labels.map(label => {
      if (label === 'Chờ xử lý') return documentStyle.getPropertyValue('--orange-400') || '#fb923c';
      if (label === 'Đang xử lý') return documentStyle.getPropertyValue('--blue-400') || '#60a5fa';
      if (label === 'Đã xử lý') return documentStyle.getPropertyValue('--green-400') || '#4ade80';
      return documentStyle.getPropertyValue('--cyan-400') || '#22d3ee';
    });

    this.doughnutChartData = {
      labels: labels,
      datasets: [
        {
          data: dataList,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverBackgroundColors
        }
      ]
    };
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#ebedef';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          min: 0,
          ticks: {
            color: textColorSecondary,
            stepSize: 1
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };
  }

  initLineChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#ebedef';

    this.lineChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          min: 0,
          ticks: {
            color: textColorSecondary,
            stepSize: 1
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };
  }

  initDoughnutChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';

    this.doughnutChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor
          }
        }
      }
    };
  }
}
