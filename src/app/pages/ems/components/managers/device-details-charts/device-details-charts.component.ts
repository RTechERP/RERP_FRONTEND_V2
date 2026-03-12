import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzTableModule } from 'ng-zorro-antd/table';
import { DashboardService } from '../../../services/managers/dashboard.service';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { Devices } from '../../../models/devices';
import { DevicesService } from '../../../services/managers/devices.service';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
]);
@Component({
  selector: 'app-device-details-charts',
  templateUrl: './device-details-charts.component.html',
  styleUrls: ['./device-details-charts.component.css'],
  imports: [
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    NgxEchartsDirective,
    CommonModule,
    NzTableModule,
  ],
  providers: [provideEchartsCore({ echarts })],
})
export class DeviceDetailsChartsComponent implements OnInit {
  @Input() deviceId: number = 5;
  devices: Devices[] = [];
  isLoading = false;
  viewType: 'grid' | 'list' = 'grid';

  // Raw data for list view
  monthlyEnergyData: any[] = [];
  dailyEnergyData: any[] = [];

  // Date filters for each chart
  monthlyChartDate: Date = new Date();
  dailyChartDate: Date = new Date();

  @ViewChild('monthlyPowerChart', { static: false })
  monthlyPowerChart!: ElementRef;
  monthlyPowerChartInstance: echarts.ECharts | undefined | null = undefined;
  monthlyPowerChartOption = {};

  @ViewChild('dailyPowerChart', { static: false })
  dailyPowerChart!: ElementRef;
  dailyPowerChartInstance: echarts.ECharts | undefined | null = undefined;
  dailyPowerChartOption = {};

  @Input() dynamicTabs!: any;

  constructor(
    private dashboardService: DashboardService,
    private devicesService: DevicesService,
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.devicesService.getAll().subscribe({
      next: (data) => {
        this.devices = data;
        if (!this.deviceId && data.length > 0) {
          this.deviceId = data[0].Id;
        }
        this.loadData();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onMonthlyChartInputChange(date: Date) {
    this.monthlyChartDate = date;
    this.loadMonthlyChart();
  }

  onDailyChartInputChange(date: Date) {
    this.dailyChartDate = date;
    this.loadDailyChart();
  }

  loadData() {
    if (!this.deviceId) return;
    this.isLoading = true;

    forkJoin({
      monthlyData: this.loadMonthlyChartData(),
      dailyData: this.loadDailyChartData(),
    }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  loadMonthlyChart() {
    if (!this.deviceId) return;
    this.isLoading = true;

    this.loadMonthlyChartData().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  loadDailyChart() {
    if (!this.deviceId) return;
    this.isLoading = true;

    this.loadDailyChartData().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  private loadMonthlyChartData() {
    const year = this.monthlyChartDate.getFullYear();

    return this.dashboardService
      .getDetailsEnergyData(year, 0, 0, this.deviceId)
      .pipe(
        map((data: any) => {
          this.monthlyEnergyData = data;
          this.monthlyPowerChartOption = {
            title: {
              text: 'Công suất tiêu thụ theo tháng',
              left: 'center',
              top: 10,
              textStyle: {
                fontSize: 26,
                fontWeight: 'bold',
                color: '#333',
              },
            },
            tooltip: {
              trigger: 'axis',
              formatter: (p: any) => {
                const value = Number(p[0].data);
                return `${p[0].axisValue}<br/>Công suất: ${value.toFixed(2)} kWh`;
              },
            },
            grid: {
              left: '10%',
              right: '10%',
              bottom: '10%',
              top: 60,
              containLabel: true,
            },
            xAxis: {
              type: 'category',
              data: data.map((d: any) => d.XAxisValue),
              axisLabel: {
                color: '#333',
              },
            },
            yAxis: {
              type: 'value',
              name: 'kWh',
              axisLabel: {
                color: '#333',
              },
              nameTextStyle: {
                color: '#333',
                fontSize: 13,
              },
            },
            series: [
              {
                name: 'Công suất tiêu thụ',
                type: 'bar',
                data: data.map((d: any) => d.YAxisValue),
                itemStyle: { color: '#32cb37ff' },
              },
            ],
            textStyle: {
              fontFamily: 'Open Sans',
            },
          };
          return data;
        }),
      );
  }

  private loadDailyChartData() {
    const year = this.dailyChartDate.getFullYear();
    const month = this.dailyChartDate.getMonth() + 1;

    return this.dashboardService
      .getDetailsEnergyData(year, month, 0, this.deviceId)
      .pipe(
        map((data: any) => {
          this.dailyEnergyData = data;
          this.dailyPowerChartOption = {
            title: {
              text: 'Công suất tiêu thụ theo ngày',
              left: 'center',
              top: 10,
              textStyle: {
                fontSize: 26,
                fontWeight: 'bold',
                color: '#333',
              },
            },
            tooltip: {
              trigger: 'axis',
              formatter: (p: any) => {
                const value = Number(p[0].data);
                return `${p[0].axisValue}<br/>Công suất: ${value.toFixed(2)} kWh`;
              },
            },
            grid: {
              left: '10%',
              right: '10%',
              bottom: '10%',
              top: 60,
              containLabel: true,
            },
            xAxis: {
              type: 'category',
              data: data.map((d: any) => d.XAxisValue),
              axisLabel: {
                color: '#333',
              },
            },
            yAxis: {
              type: 'value',
              name: 'kWh',
              axisLabel: {
                color: '#333',
              },
              nameTextStyle: {
                color: '#333',
                fontSize: 13,
              },
            },
            series: [
              {
                name: 'Công suất tiêu thụ',
                type: 'bar',
                data: data.map((d: any) => d.YAxisValue),
                itemStyle: { color: '#1890ff' },
              },
            ],
            textStyle: {
              fontFamily: 'Open Sans',
            },
          };
          return data;
        }),
      );
  }

  exportMonthlyToExcel() {
    if (!this.monthlyEnergyData || this.monthlyEnergyData.length === 0) return;

    const dataToExport = this.monthlyEnergyData.map((d) => ({
      Tháng: d.XAxisValue,
      'Công suất (kWh)': d.YAxisValue,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Energy');

    const fileName = `Monthly_Energy_Data_${this.deviceId}_${this.monthlyChartDate.getFullYear()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportDailyToExcel() {
    if (!this.dailyEnergyData || this.dailyEnergyData.length === 0) return;

    const dataToExport = this.dailyEnergyData.map((d) => ({
      Ngày: d.XAxisValue,
      'Công suất (kWh)': d.YAxisValue,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Energy');

    const fileName = `Daily_Energy_Data_${this.deviceId}_${this.dailyChartDate.getFullYear()}_${this.dailyChartDate.getMonth() + 1}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
