import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project/project-service/project.service';
import { HttpErrorResponse } from '@angular/common/http';

// Ng-Zorro modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpClient, HttpParams } from '@angular/common/http';

// Chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-project-po-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzGridModule,
    NzDatePickerModule,
    NzButtonModule,
    NzSpinModule,
    NzAlertModule,
    NzIconModule,
    NzTabsModule
  ],
  templateUrl: './project-po-report.component.html',
  styleUrls: ['./project-po-report.component.css']
})
export class ProjectPoReportComponent implements OnInit, AfterViewInit, OnDestroy {
  filters: any = {
    startDate: null,
    endDate: null
  };

  activeTabIndex: number = 0;
  loading: boolean = false;
  errorMessage: string = '';

  monthlyData: any[] = [];
  yearlyData: any[] = [];

  // Chart instances
  monthlyChart: Chart | null = null;
  yearlyChart: Chart | null = null;

  // Canvas references
  @ViewChild('monthlyChartCanvas', { static: false }) monthlyChartCanvasRef!: ElementRef;
  @ViewChild('yearlyChartCanvas', { static: false }) yearlyChartCanvasRef!: ElementRef;

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filters.startDate = firstDayOfMonth;
    this.filters.endDate = today;

    this.loadReportData();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    if (this.yearlyChart) {
      this.yearlyChart.destroy();
    }
  }

  onTabIndexChange(index: number): void {
    this.activeTabIndex = index;
    setTimeout(() => {
      if (index === 0 && this.monthlyData.length > 0) {
        this.renderMonthlyChart();
      } else if (index === 1 && this.yearlyData.length > 0) {
        this.renderYearlyChart();
      }
    }, 100);
  }

  applyFilters(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    if (!this.filters.startDate || !this.filters.endDate) return;

    this.loading = true;
    this.errorMessage = '';
    const startDateStr = this.filters.startDate.toISOString().split('T')[0];
    const endDateStr = this.filters.endDate.toISOString().split('T')[0];
    const projectType = '1,2,3';

    const params = new HttpParams()
      .set('startDate', startDateStr)
      .set('endDate', endDateStr)
      .set('projectType', projectType);

    this.projectService.getProjectPO({ params }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.status === 1 && response.data) {
          // Xử lý dữ liệu tháng và năm
          this.processData(response.data.MonthlyWithPO || []);
          setTimeout(() => {
            if (this.activeTabIndex === 0) {
              this.renderMonthlyChart();
            } else {
              this.renderYearlyChart();
            }
          }, 100);
        } else {
          this.errorMessage = response.message || 'Không thể tải dữ liệu báo cáo';
          this.notification.error('Lỗi', this.errorMessage);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 400 && error.error?.errors) {
          this.errorMessage = 'Dữ liệu gửi lên chưa hợp lệ.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          this.errorMessage = 'Đã xảy ra lỗi khi kết nối đến server';
        }

        this.notification.error('Lỗi kết nối', this.errorMessage);
        console.error('API Error:', error);
      }
    });
  }

  processData(apiData: any[]): void {
    this.monthlyData = this.transformMonthlyData(apiData);
  
    this.yearlyData = this.transformYearlyData(this.monthlyData);
  }

  transformMonthlyData(apiData: any[]): any[] {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => {
      try {
        const monthYear = item.MonthYear || '';
        const [year, month] = monthYear.split('-').map(Number);
        
        return {
          month: month || 0,
          year: year || 0,
          count: item.Count || item.count || 0,
          value: item.Value || item.value || 0
        };
      } catch (error) {
        console.error('Error transforming monthly data:', item, error);
        return { month: 0, year: 0, count: 0, value: 0 };
      }
    }).filter(item => item.year > 0 && item.month > 0)
      .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  }

  transformYearlyData(monthlyData: any[]): any[] {
    const yearlyMap = new Map<number, any>();
    
    monthlyData.forEach(item => {
      if (!yearlyMap.has(item.year)) {
        yearlyMap.set(item.year, {
          year: item.year,
          count: 0,
          value: 0
        });
      }
      
      const yearData = yearlyMap.get(item.year)!;
      yearData.count += item.count;
      yearData.value += item.value;
    });
    
    return Array.from(yearlyMap.values())
      .sort((a, b) => a.year - b.year);
  }

  // Tính tổng giá trị
  // getMonthlyTotalValue(): number {
  //   return this.monthlyData.reduce((sum, item) => sum + (item.value || 0), 0);
  // }

  getYearlyTotalValue(): number {
    return this.yearlyData.reduce((sum, item) => sum + (item.value || 0), 0);
  }

  // Render monthly chart
  renderMonthlyChart(): void {
    if (!this.monthlyChartCanvasRef || this.monthlyData.length === 0) return;
    
    // Destroy existing chart if it exists
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    
    const ctx = this.monthlyChartCanvasRef.nativeElement.getContext('2d');
    
    // Prepare labels (Month/Year)
    const labels = this.monthlyData.map(item => `${item.month}/${item.year}`);
    
    // Prepare data
    const chartData = this.monthlyData.map(item => item.value);
    
    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Dự án đã PO',
            data: chartData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Giá trị (triệu đồng)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tháng/Năm'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `Giá trị: ${context.raw} triệu đồng`;
              }
            }
          }
        }
      }
    });
  }

  renderYearlyChart(): void {
    if (!this.yearlyChartCanvasRef || this.yearlyData.length === 0) return;
    
    if (this.yearlyChart) {
      this.yearlyChart.destroy();
    }
    
    const ctx = this.yearlyChartCanvasRef.nativeElement.getContext('2d');
    
    // Prepare labels (Year)
    const labels = this.yearlyData.map(item => `Năm ${item.year}`);
    
    // Prepare data
    const chartData = this.yearlyData.map(item => item.value);
    
    this.yearlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Dự án đã PO',
            data: chartData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Giá trị (triệu đồng)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Năm'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `Giá trị: ${context.raw} triệu đồng`;
              }
            }
          }
        }
      }
    });
  }
}