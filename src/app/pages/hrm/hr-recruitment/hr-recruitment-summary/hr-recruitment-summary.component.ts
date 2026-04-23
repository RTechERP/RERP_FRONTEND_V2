import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

// ECharts
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components';

import { HrRecruitmentSummaryService } from './hr-recruitment-summary.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE, NOTIFICATION_TYPE_MAP, NOTIFICATION_TITLE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight';

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
]);

@Component({
  selector: 'app-hr-recruitment-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzTabsModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzToolTipModule,
    NzInputModule,
    NzCheckboxModule,
    NzSpinModule,
    NgxEchartsDirective
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './hr-recruitment-summary.component.html',
  styleUrls: ['./hr-recruitment-summary.component.css']
})
export class HrRecruitmentSummaryComponent implements OnInit {
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  departmentID: number = 0;
  departments: any[] = [];

  positionOptions: { label: string, value: string, selected: boolean }[] = [];
  rawData: any = null;

  chartOptions: any = {};
  chartInstance: any;

  chartSourceOptions: any = {};
  chartSourceInstance: any;

  chartEducationOptions: any = {};
  chartEducationInstance: any;

  showSidebar: boolean = true;
  searchPositionText: string = '';

  constructor(
    private summaryService: HrRecruitmentSummaryService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    this.initializeDates();
    this.loadDepartments();
    this.search(); // Initial load
    this.loadSourceSummary();
    this.loadEducationSummary();
  }

  resetSearch() {
    this.initializeDates();
    this.departmentID = 0;
    this.isComplete = -1;
    this.searchPositionText = '';
    this.search();
  }

  initializeDates() {
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  loadDepartments() {
    this.summaryService.getDepartment().subscribe({
      next: (res) => {
        this.departments = res.data || [];
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  formatDate(d: Date | null): string | null {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(field: string, event: string) {
    if (!event) {
      if (field === 'dateStart') this.dateStart = null;
      if (field === 'dateEnd') this.dateEnd = null;
      this.search();
      return;
    }
    const d = new Date(event);
    if (field === 'dateStart') this.dateStart = d;
    else if (field === 'dateEnd') this.dateEnd = d;

    this.search();
  }

  isExporting: boolean = false;

  exportExcel() {
    const req = {
      DateStart: this.formatDate(this.dateStart),
      DateEnd: this.formatDate(this.dateEnd),
      DepartmentID: this.departmentID || 0,
      IsComplete: this.isComplete
    };

    this.isExporting = true;
    this.summaryService.exportExcel(req).subscribe({
      next: (blob: Blob) => {
        this.isExporting = false;
        // Format date to ddMMyyyy helper
        const formatFileNameDate = (d: Date | null) => {
          if (!d) return null;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}${month}${year}`;
        };

        const ds = formatFileNameDate(this.dateStart) || 'dau';
        const de = formatFileNameDate(this.dateEnd) || 'cuoi';
        const fileName = `Theodoiungvien_tu${ds}_den${de}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        this.isExporting = false;
        this.notification.error('Lỗi xuất Excel', 'Đã xảy ra lỗi khi tải file excel xuống!');
      }
    });
  }

  isComplete: number = -1;
  isLoading: boolean = false;

  search() {
    const req = {
      DateStart: this.formatDate(this.dateStart),
      DateEnd: this.formatDate(this.dateEnd),
      DepartmentID: this.departmentID || 0,
      IsComplete: this.isComplete
    };

    this.loadSourceSummary();
    this.loadEducationSummary();
    this.isLoading = true;
    this.summaryService.getSummary(req).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 1 || response.status === true || response.data) {
          const resData = response.data || response;
          this.rawData = resData;
          this.extractPositionOptions(resData);
          this.processChartData();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi lấy dữ liệu');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  extractPositionOptions(data: any) {
    const requests = data.HiringRequests || data.hiringRequests || [];
    const posSet = new Set<string>();
    requests.forEach((req: any) => {
      const posName = req.PositionName || req.positionName || 'Khác';
      posSet.add(posName);
    });

    // Ghi nhớ trạng thái chọn của các tuỳ chọn cũ
    const previousOptions = new Map(
      this.positionOptions.map(p => [p.value, p.selected])
    );

    this.positionOptions = Array.from(posSet).map(p => ({
      label: p,
      value: p,
      // Nếu vị trí đã tồn tại thì giữ nguyên trạng thái cũ, nếu là vị trí mới thì mặc định tick (true)
      selected: previousOptions.has(p) ? previousOptions.get(p)! : true
    }));
  }

  getFilteredSelections() {
    let list = this.positionOptions;
    if (this.searchPositionText) {
      const txt = this.searchPositionText.toLowerCase();
      list = list.filter(s => s.label.toLowerCase().includes(txt));
    }
    return list;
  }

  toggleAll(selected: boolean) {
    this.positionOptions.forEach(s => s.selected = selected);
    this.onFilterChange();
  }

  onFilterChange() {
    this.processChartData();
  }

  onChartInit(ec: any) {
    this.chartInstance = ec;
  }

  processChartData() {
    if (!this.rawData || !this.rawData.ChartData || !Array.isArray(this.rawData.ChartData)) return;

    const data = this.rawData.ChartData;

    const statusesDef = [
      { id: 1, label: '1. Gửi thư mời PV' },
      { id: 2, label: '2. Xác nhận phỏng vấn' },
      { id: 3, label: '3. Đã phỏng vấn' },
      { id: 4, label: '4. Kết quả không đạt' },
      { id: 5, label: '5. Kết quả đạt' },
      { id: 6, label: '6. Trình phê duyệt' },
      { id: 7, label: '7. Gửi thư mời nhận việc' },
      { id: 8, label: '8. Xác nhận thư mời' },
      { id: 9, label: '9. Nhận việc' }
    ];

    // Active filters
    const selectedOptions = new Set(this.positionOptions.filter(p => p.selected).map(p => p.value));

    const labels: string[] = [];
    const seriesData: number[][] = Array.from({ length: 9 }, () => []);

    data.forEach((row: any) => {
      const positionName = row.PositionName || row.positionName || 'Khác';

      if (!selectedOptions.has(positionName)) {
        return;
      }

      labels.push(positionName);

      for (let i = 1; i <= 9; i++) {
        const val = row[`Status${i}`] ?? row[`status${i}`] ?? 0;
        seriesData[i - 1].push(val);
      }
    });

    const seriesConfig: any[] = statusesDef.map((def, i) => ({
      name: def.label,
      type: 'bar',
      stack: 'Thống kê',
      data: seriesData[i],
      itemStyle: {
        borderRadius: 2,
        borderColor: '#fff',
        borderWidth: 1
      },
      barMaxWidth: 60
    }));

    this.chartOptions = {
      title: {
        text: 'THỐNG KÊ TRẠNG THÁI ỨNG VIÊN THEO VỊ TRÍ',
        left: 'center',
        top: 0,
        textStyle: { fontSize: 18, fontWeight: 'bold', color: '#334155', fontFamily: "'Inter', sans-serif" }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            if (p.value > 0) {
              html += `${p.marker} ${p.seriesName}: <b>${p.value}</b> ứng viên<br/>`;
            }
          });
          return html;
        }
      },
      legend: {
        data: statusesDef.map(d => d.label),
        bottom: 0,
        type: 'scroll',
        textStyle: { color: '#64748b', fontSize: 12, fontFamily: 'Inter' }
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '15%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontFamily: 'Inter',
          color: '#64748b',
          fontSize: 12
        },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '',
        minInterval: 1,
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#e2e8f0',
            fontWeight: 'bold'
          }
        },
        axisLabel: { fontFamily: 'Inter', color: '#3a3a3aff' }
      },
      series: seriesConfig
    };

    if (this.chartInstance) {
      this.chartInstance.setOption(this.chartOptions, true);
    }
  }

  isSourceLoading: boolean = false;
  onSourceChartInit(ec: any) {
    this.chartSourceInstance = ec;
  }

  loadSourceSummary() {
    const req = {
      DateStart: this.formatDate(this.dateStart),
      DateEnd: this.formatDate(this.dateEnd),
      DepartmentID: this.departmentID || 0
    };

    this.isSourceLoading = true;
    this.summaryService.getSourceSummary(req).subscribe({
      next: (response) => {
        this.isSourceLoading = false;
        if (response.status === 1 || response.status === true || response.data) {
          const resData = response.data || response;
          this.processSourceChartData(resData.SourceData || resData.sourceData || []);
        }
      },
      error: (err: any) => {
        this.isSourceLoading = false;
        console.error('Error fetching source summary:', err);
      }
    });
  }

  processSourceChartData(data: any[]) {
    if (!data || !Array.isArray(data)) return;

    const chartData = data.map(item => ({
      name: item.SourceType || item.sourceType || 'Khác',
      value: item.TotalCount || item.totalCount || 0
    }));

    this.chartSourceOptions = {
      title: {
        text: 'CƠ CẤU NGUỒN TUYỂN DỤNG',
        left: 'center',
        top: 20,
        textStyle: { fontSize: 18, fontWeight: 'bold', color: '#334155', fontFamily: "'Inter', sans-serif" }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)',
        textStyle: { fontFamily: 'Inter', fontSize: 12 }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        type: 'scroll',
        textStyle: { color: '#64748b', fontSize: 12, fontFamily: 'Inter' }
      },
      series: [
        {
          name: 'Nguồn tuyển dụng',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%',
            fontSize: 12,
            fontFamily: 'Inter',
            color: '#64748b'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          data: chartData
        }
      ]
    };

    if (this.chartSourceInstance) {
      this.chartSourceInstance.setOption(this.chartSourceOptions, true);
    }
  }

  isEducationLoading: boolean = false;
  onEducationChartInit(ec: any) {
    this.chartEducationInstance = ec;
  }

  loadEducationSummary() {
    const req = {
      DateStart: this.formatDate(this.dateStart),
      DateEnd: this.formatDate(this.dateEnd),
      DepartmentID: this.departmentID || 0
    };

    this.isEducationLoading = true;
    this.summaryService.getEducationSummary(req).subscribe({
      next: (response) => {
        this.isEducationLoading = false;
        if (response.status === 1 || response.status === true || response.data) {
          const resData = response.data || response;
          this.processEducationChartData(resData.EducationData || resData.educationData || []);
        }
      },
      error: (err: any) => {
        this.isEducationLoading = false;
        console.error('Error fetching education summary:', err);
      }
    });
  }

  processEducationChartData(data: any[]) {
    if (!data || !Array.isArray(data)) return;

    // Sắp xếp dữ liệu để trường có số lượng nhiều nhất ở trên cùng (dùng cho bar chart ngang)
    const sortedData = [...data].sort((a, b) => (a.TotalCount || a.totalCount) - (b.TotalCount || b.totalCount));

    const labels = sortedData.map(item => item.SchoolName || item.schoolName);
    const values = sortedData.map(item => item.TotalCount || item.totalCount);

    this.chartEducationOptions = {
      title: {
        text: 'THỐNG KÊ NGUỒN GỐC HỌC VẤN (TRƯỜNG HỌC)',
        left: 'center',
        top: 20,
        textStyle: { fontSize: 18, fontWeight: 'bold', color: '#334155', fontFamily: "'Inter', sans-serif" }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: <b>{c}</b> ứng viên',
        textStyle: { fontFamily: 'Inter', fontSize: 12 }
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '5%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { fontFamily: 'Inter', fontSize: 12 }
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontFamily: 'Inter',
          fontSize: 12,
          width: 200,
          overflow: 'break'
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [
        {
          name: 'Số lượng ứng viên',
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          barMaxWidth: 40,
          label: {
            show: true,
            position: 'right',
            fontFamily: 'Inter',
            fontSize: 12,
            color: '#64748b'
          }
        }
      ]
    };

    if (this.chartEducationInstance) {
      this.chartEducationInstance.setOption(this.chartEducationOptions, true);
    }
  }
}
