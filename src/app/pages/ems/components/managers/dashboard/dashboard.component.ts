import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSelectModule } from 'ngx-select-ex';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { DashboardService } from '../../../services/managers/dashboard.service';
import {
  EFConnectionBehavior,
  FFlowComponent,
  FFlowModule,
} from '@foblex/flow';

import { DeviceDetailsChartsComponent } from '../device-details-charts/device-details-charts.component';
import { DevicesService } from '../../../services/managers/devices.service';
import { Devices } from '../../../models/devices';

echarts.use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
]);

interface Info {
  label: string;
  value: string;
}

interface OrgNode {
  id: string;
  name: string;
  inputs?: any;
  nodeClass?: string;
  style?: any;
  data?: { info: Info[] };
  children?: OrgNode[];
}

@Component({
  selector: 'manager-dashboard',
  imports: [CommonModule, NgxEchartsDirective, FFlowModule, FormsModule, NgxSelectModule, NzDatePickerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts })],
})
export class DashboardComponent implements OnInit, OnDestroy {
  //#region Properties
  orgData: OrgNode | null = null;
  nodes: Array<any> = [];
  topCenterChartOption = {};
  yearlyElectricUsageChartOption = {};
  monthlyElectricUsageChartOption = {};
  dailyElectricUsageChartOption = {};
  topRightChartOption = {};
  bottomRightChartOption = {};
  topLeftChartOptions = {};
  topRightChartOptions = {};
  eConnectionBehaviour = EFConnectionBehavior;
  isReady = false;
  devices: Devices[] = [];
  deviceDetailsChart = DeviceDetailsChartsComponent;
  @Input() deviceId!: number;
  isLoading = false;

  areaList: { name: string; color: string }[] = [];
  readonly colorPalette = ['#FF7043', '#42A5F5', '#66BB6A', '#AB47BC', '#FFA726', '#5C5C8A', '#26C6DA', '#EF5350', '#8D6E63', '#78909C'];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  currentDay = new Date().getDate();

  yearlyChartDate = new Date();
  monthlyChartDate = new Date();
  dailyChartDate = new Date();

  yearlyChartYear = this.currentYear;

  monthlyChartYear = this.currentYear;
  monthlyChartMonth = this.currentMonth;

  dailyChartYear = this.currentYear;
  dailyChartMonth = this.currentMonth;
  dailyChartDay = this.currentDay;

  // Options
  monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${i + 1}`, value: i + 1 }));

  @ViewChild('orgChart') orgChart!: FFlowComponent;
  @ViewChild('activePowerChart', { static: false })
  activePowerChart!: ElementRef;
  activePowerChartInstance: echarts.ECharts | null = null;

  @ViewChild('electricUsageChart', { static: false })
  electricUsageChart!: ElementRef;
  electricUsageChartInstance: echarts.ECharts | null = null;

  @ViewChild('energyConsumption', { static: false })
  energyConsumption!: ElementRef;
  energyConsumptionInstance: echarts.ECharts | null = null;

  @ViewChild('wasteOutputChart', { static: false })
  wasteOutputChart!: ElementRef;
  wasteOutputChartInstance: echarts.ECharts | null = null;

  @ViewChild('dailyElectricUsageByAreaChart', { static: false })
  dailyElectricUsageByAreaChart!: ElementRef;
  dailyElectricUsageByAreaChartInstance: echarts.ECharts | null = null;

  @ViewChild('monthlyElectricUsageByAreaChart', { static: false })
  monthlyElectricUsageByAreaChart!: ElementRef;
  monthlyElectricUsageByAreaChartInstance: echarts.ECharts | null = null;

  @ViewChild('yearlyElectricUsageByAreaChart', { static: false })
  yearlyElectricUsageByAreaChart!: ElementRef;
  yearlyElectricUsageByAreaChartInstance: echarts.ECharts | null = null;

  @Input() dynamicTabs!: any;

  private refreshInterval = 10000; // 10 seconds
  private refreshIntervals: any[] = [];
  //endregion

  //#region Constructor
  constructor(
    private dashboardService: DashboardService,
    private devicesService: DevicesService,
    private cdr: ChangeDetectorRef
  ) { }

  //#region Life cycle
  ngOnInit() {
    this.isLoading = true;

    // Initialize date objects
    this.yearlyChartDate = new Date();
    this.monthlyChartDate = new Date();
    this.dailyChartDate = new Date();

    this.initializeOrgChart();
    this.setupAutoRefresh();
    this.devicesService.getAll().subscribe({
      next: (data) => {
        this.devices = data;
        if (!this.deviceId && data.length > 0) {
          this.deviceId = data[0].Id;
        }
        this.loadAllChartData();
      }
    });
  }

  onYearlyChartInputChange(date: Date) {
    this.yearlyChartDate = date;
    if (date) {
      this.yearlyChartYear = date.getFullYear();
      this.loadYearlyElectricUsageByArea();
    }
  }

  onMonthlyChartInputChange(date: Date) {
    this.monthlyChartDate = date;
    if (date) {
      this.monthlyChartYear = date.getFullYear();
      this.monthlyChartMonth = date.getMonth() + 1;
      this.loadMonthlyElectricUsageByArea();
    }
  }

  onDailyChartInputChange(date: Date) {
    this.dailyChartDate = date;
    if (date) {
      this.dailyChartYear = date.getFullYear();
      this.dailyChartMonth = date.getMonth() + 1;
      this.dailyChartDay = date.getDate();
      this.loadDailyElectricUsageByArea();
    }
  }

  loadAllChartData() {
    if (!this.deviceId) return;
    this.isLoading = true;
    this.areaList = [];
    this.loadElectricUsageChart();
    this.loadYearlyElectricUsageByArea();
    this.loadMonthlyElectricUsageByArea();
    this.loadDailyElectricUsageByArea();

    setTimeout(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  ngOnDestroy() {
    this.cleanup();
  }
  //endregion

  //#region Chart Initialization Methods
  private initializeOrgChart() {
    const cols = 3;
    const spacingX = 260;
    const spacingY = 150;
    const startX = 120;
    const centerX = startX + Math.floor(cols / 2) * spacingX - 12;
    const centerY = 180;

    this.nodes.push({
      id: 'root',
      name: 'Toàn xưởng',
      nodeClass: 'root',
      style: { color: '#fff' },
      pos: { x: centerX, y: centerY + 35 },
      isRoot: true,
    });

    this.dashboardService.getOrgChartData().subscribe({
      next: (result) => {
        this.orgData = {
          id: 'root',
          name: 'Toàn xưởng',
          nodeClass: 'root',
          style: { color: '#fff' },
          children: [],
        };

        result.forEach((r, idx) => {
          this.orgData?.children?.push({
            id: `d${idx + 1}`,
            inputs: r.DeviceId,
            name: r.DeviceName,
            nodeClass: `org-node-${idx + 1} small`,
            data: {
              info: [
                // {
                //   label: 'Tổng công suất (kW)',
                //   value: (+r.SumCongSuat || 0).toFixed(4),
                // },
                {
                  label: 'Công suất tiêu thụ (kWh)',
                  value: (+r.CongSuatTieuThu || 0).toFixed(2),
                },
              ],
            },
          });
        });

        const children = this.orgData?.children ?? [];
        const half = Math.ceil(children.length / 2);
        const topChildren = children.slice(0, half);
        const bottomChildren = children.slice(half);

        topChildren.forEach((c, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = startX + col * spacingX;
          const y = centerY - spacingY - row * spacingY;
          this.nodes.push({
            ...c,
            pos: { x, y },
            isRoot: false,
            connector: 'bottom',
          });
        });

        bottomChildren.forEach((c, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = startX + col * spacingX;
          const y = centerY + spacingY + row * spacingY;
          this.nodes.push({
            ...c,
            pos: { x, y },
            isRoot: false,
            connector: 'top',
          });
        });

        this.isReady = true;
        this.cdr.detectChanges();
      },
    });
  }
  //#endregion

  //#region Auto Refresh
  private setupAutoRefresh() {
    this.clearRefreshIntervals();

    // this.refreshIntervals.push(
    //   setInterval(() => this.loadActivePowerAndEnergyChart(), this.refreshInterval)
    // );
    // this.refreshIntervals.push(
    //   setInterval(() => this.loadWasteOutputChart(), this.refreshInterval)
    // );
    this.refreshIntervals.push(
      setInterval(() => this.loadElectricUsageChart(), this.refreshInterval)
    );
    this.refreshIntervals.push(
      setInterval(() => this.loadDailyElectricUsageByArea(), this.refreshInterval)
    );
    this.refreshIntervals.push(
      setInterval(() => this.loadMonthlyElectricUsageByArea(), this.refreshInterval)
    );
    this.refreshIntervals.push(
      setInterval(() => this.loadYearlyElectricUsageByArea(), this.refreshInterval)
    );
  }

  private clearRefreshIntervals() {
    this.refreshIntervals.forEach((interval) => clearInterval(interval));
    this.refreshIntervals = [];
  }
  //#endregion

  //#region Active Power and Energy Methods
  private loadActivePowerAndEnergyChart() {
    this.dashboardService.getEnergyConsumptionChartData().subscribe({
      next: (result) => {
        const deviceNames = result.map((r) => r.DeviceName);
        const values = result.map((r) => +r.CongSuatTieuThu);
        const total = values.reduce((sum, val) => sum + val, 0);
        let cumulative = 0;
        const cumulativePercent = values.map((val) => {
          cumulative += val;
          return ((cumulative / total) * 100).toFixed(2);
        });

        const newActivePowerOptions = {
          title: {
            text: 'ACTIVE POWER',
            textStyle: {
              color: '#333',
              fontSize: 26,
            },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
            },
          },
          xAxis: {
            data: deviceNames,
            axisLabel: {
              show: true,
              color: '#333',
              fontSize: 10,
              rotate: 45,
              interval: 0,
            },
          },
          yAxis: [
            {
              type: 'value',
              name: 'Công suất (kW)',
              axisLabel: {
                color: '#333',
              },
            },
            {
              type: 'value',
              name: 'Tổng %',
              min: 0,
              max: 100,
              position: 'right',
              axisLabel: {
                formatter: '{value} %',
                color: '#333',
              },
            },
          ],
          series: [
            {
              name: 'Công suất (kW)',
              type: 'bar',
              data: values,
              itemStyle: {
                color: '#14B8A6',
              },
            },
            {
              name: 'Tổng %',
              type: 'line',
              yAxisIndex: 1,
              data: cumulativePercent,
              smooth: true,
              lineStyle: {
                color: '#FF9800',
                width: 3,
              },
              symbol: 'circle',
              symbolSize: 8,
              itemStyle: {
                color: '#FF9800',
              },
            },
          ],
        };

        this.updateChartInstance(
          this.activePowerChartInstance,
          this.activePowerChart,
          newActivePowerOptions
        );
        this.topLeftChartOptions = newActivePowerOptions;

        const colors = [
          '#FF7043',
          '#42A5F5',
          '#66BB6A',
          '#AB47BC',
          '#FFA726',
          '#5C5C8A',
          '#9CCC65',
          '#8E24AA',
          '#FFCA28',
          '#26A69A',
          '#5C6BC0',
          '#FF8A65',
        ];

        const energyColorMap: Record<string, string> = {};
        let nextEnergyColorIndex = 0;

        const getColorForName = (name: string): string => {
          if (!name) name = 'unknown';
          if (energyColorMap[name]) return energyColorMap[name];
          const color = colors[nextEnergyColorIndex % colors.length];
          energyColorMap[name] = color;
          nextEnergyColorIndex++;
          return color;
        };

        const newEnergyOptions = {
          title: {
            text: 'ENERGY CONSUMPTION',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 26,
              fontWeight: 'bold',
              color: '#333',
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}<br/>{c} kWh ({d}%)',
          },
          legend: {
            orient: 'horizontal',
            right: 10,
            top: 'bottom',
            textStyle: { color: '#333' },
          },
          series: [
            {
              name: 'Tỉ lệ',
              type: 'pie',
              radius: ['35%', '65%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 6,
                borderColor: '#ffffff',
                borderWidth: 2,
              },
              label: {
                show: true,
                position: 'inner',
                formatter: '{d}%',
                color: '#333',
                fontSize: 12,
                fontWeight: 'bold',
              },
              labelLine: {
                show: true,
                length: 15,
                length2: 10,
                lineStyle: { color: '#aaa' },
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 18,
                  fontWeight: 'bold',
                  formatter: '{d}%',
                },
              },
              data: result.map((r) => ({
                value: +r.CongSuatTieuThu,
                name: r.DeviceName,
                itemStyle: { color: getColorForName(r.DeviceName) },
              })),
            },
          ],
        };

        this.updateChartInstance(
          this.energyConsumptionInstance,
          this.energyConsumption,
          newEnergyOptions
        );
        this.topRightChartOptions = newEnergyOptions;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading active power chart:', error);
      },
    });
  }
  //#endregion

  //#region Electric Usage Chart Methods
  public loadElectricUsageChart() {
    this.dashboardService.getElectricUsageChartData().subscribe({
      next: (result) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const item1 = result.Item1 ?? []; // expected: current month data
        const item2 = result.Item2 ?? []; // expected: previous month data

        const isCurrentMonth =
          item1.length > 0 &&
          item1[0].MonthValue === currentMonth &&
          item1[0].YearValue === currentYear;

        const maxDayItem1 = item1.length
          ? Math.max(...item1.map((x) => x.DayValue))
          : 0;
        const maxDayItem2 = item2.length
          ? Math.max(...item2.map((x) => x.DayValue))
          : 0;

        const maxDays = isCurrentMonth
          ? currentDay
          : Math.max(maxDayItem1, maxDayItem2, 0);

        const days = Array.from({ length: maxDays }, (_, i) => i + 1);

        const data1Map = new Map<number, number>(
          item1.map((x: any) => [x.DayValue, x.LogValue]),
        );
        const data2Map = new Map<number, number>(
          item2.map((x: any) => [x.DayValue, x.LogValue]),
        );

        const newOptions = {
          title: {
            text: 'ELECTRIC USAGE',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#333',
            },
          },
          tooltip: {
            trigger: 'axis',
          },
          legend: {
            data: ['Trong tháng', 'Tháng trước'],
            bottom: 0,
            textStyle: { color: '#333' },
          },
          grid: {
            left: '5%',
            right: '5%',
            bottom: '10%',
            top: '20%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            data: days,
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
              fontSize: 13,
              color: '#333',
            },
          },
          series: [
            {
              name: 'Trong tháng',
              type: 'line',
              smooth: true,
              data: days.map((day) => data1Map.get(day) ?? 0),
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: { color: '#4CAF50' },
              lineStyle: { color: '#4CAF50', width: 2 },
            },
            {
              name: 'Tháng trước',
              type: 'line',
              smooth: true,
              data: days.map((day) => data2Map.get(day) ?? 0),
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: { color: '#42A5F5' },
              lineStyle: { color: '#42A5F5', width: 2 },
            },
          ],
        };

        this.updateChartInstance(
          this.electricUsageChartInstance,
          this.electricUsageChart,
          newOptions,
        );
        this.topCenterChartOption = newOptions;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading electric usage chart:', error);
      },
    });
  }
  //#endregion

  //#region Waste Output Methods
  private loadWasteOutputChart() {
    this.dashboardService.getWasteOutputChartData().subscribe({
      next: (result) => {
        const newOptions = {
          title: {
            text: 'WASTE OUTPUT',
            textStyle: {
              color: '#333',
              fontSize: 26,
            },
          },
          tooltip: {
            trigger: 'axis',
          },
          xAxis: {
            data: result.map((r) => r.Month),
            axisLabel: {
              color: '#333',
              formatter: 'Tháng {value}',
            },
          },
          yAxis: {
            type: 'value',
            name: 'Nồng độ metal (ppm)',
            nameLocation: 'end',
            nameTextStyle: {
              fontSize: 12,
              padding: [0, 0, 0, 0],
            },
            axisLabel: {
              color: '#333',
            },
          },
          series: [
            {
              name: 'Nồng độ metal (ppm)',
              type: 'bar',
              data: result.map((r) => +r.AvgValue),
              itemStyle: {
                color: '#1976D2',
              },
            },
          ],
        };

        this.updateChartInstance(
          this.wasteOutputChartInstance,
          this.wasteOutputChart,
          newOptions
        );
        this.bottomRightChartOption = newOptions;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading waste output chart:', error);
      },
    });
  }
  //#endregion

  //#region Daily Electric Usage By Area Methods
  public loadDailyElectricUsageByArea() {
    if (!this.deviceId) return;
    this.dashboardService.getDailyElectricUsageByArea(this.dailyChartYear, this.dailyChartMonth, this.dailyChartDay).subscribe({
      next: (result) => {
        const areaMap = new Map<string, { name: string; data: Map<string, number> }>();
        const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

        result.forEach((item: any) => {
          const areaName = item.AreaName || item.DeviceName || `Khu vực ${item.AreaId || 'Unknown'}`;
          let hourLabel = item.XAxisValue;
          if (hourLabel.includes(' ')) {
            hourLabel = hourLabel.split(' ')[1].split(':')[0] + 'h';
          } else if (!hourLabel.endsWith('h')) {
            hourLabel = parseInt(hourLabel) + 'h';
          }

          if (!areaMap.has(areaName)) {
            areaMap.set(areaName, { name: areaName, data: new Map() });
            this.addToAreaList(areaName);
          }
          areaMap.get(areaName)!.data.set(hourLabel, item.YAxisValue);
        });

        const areas = Array.from(areaMap.keys());
        const newOptions = {
          title: {
            text: 'DAILY ELECTRICITY USAGE BY AREA',
            left: 'center',
            top: 10,
            textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
              let res = `<strong>Giờ: ${params[0].axisValue}</strong><br/>`;
              let total = 0;
              params.forEach((item: any) => {
                const val = Number(item.value) || 0;
                res += `${item.marker} ${item.seriesName}: ${val.toLocaleString()} kWh<br/>`;
                total += val;
              });
              res += `<strong>Tổng: ${total.toLocaleString()} kWh</strong>`;
              return res;
            },
          },
          legend: {
            show: true,
            bottom: 0,
            type: 'scroll',
            textStyle: { color: '#333' }
          },
          grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
          xAxis: {
            type: 'category',
            data: hours,
            axisLabel: {
              color: '#333',
              interval: 0
            },
          },
          yAxis: {
            type: 'value',
            name: 'kWh',
            axisLabel: { color: '#333' },
            nameTextStyle: {
              fontSize: 13,
              color: '#333'
            },
          },
          series: areas.map((area) => {
            const areaData = areaMap.get(area)!;
            return {
              name: area,
              type: 'bar',
              stack: 'total',
              data: hours.map(h => areaData.data.get(h) || 0),
              itemStyle: { color: this.getAreaColor(area) },
              emphasis: { focus: 'series' },
            };
          }),
        };

        this.updateChartInstance(this.dailyElectricUsageByAreaChartInstance, this.dailyElectricUsageByAreaChart, newOptions);
        this.dailyElectricUsageChartOption = newOptions;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error loading daily electric usage by area:', error),
    });
  }

  private addToAreaList(areaName: string) {
    if (!this.areaList.find(a => a.name === areaName)) {
      const color = this.colorPalette[this.areaList.length % this.colorPalette.length];
      this.areaList.push({ name: areaName, color: color });
      this.cdr.markForCheck();
    }
  }

  private getAreaColor(areaName: string): string {
    const area = this.areaList.find(a => a.name === areaName);
    return area ? area.color : '#ccc';
  }
  //#endregion

  //#region Monthly Electric Usage By Area Methods
  public loadMonthlyElectricUsageByArea() {
    if (!this.deviceId) return;
    this.dashboardService.getMonthlyElectricUsageByArea(this.monthlyChartYear, this.monthlyChartMonth, 1).subscribe({
      next: (result) => {
        const areaMap = new Map<string, { name: string; data: Map<string, number> }>();
        const daysInMonth = new Date(this.monthlyChartYear, this.monthlyChartMonth, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        result.forEach((item) => {
          const areaName = item.AreaName || item.DeviceName || `Khu vực ${item.AreaId || 'Unknown'}`;
          const dayLabel = item.XAxisValue.replace(/\D/g, '');

          if (!areaMap.has(areaName)) {
            areaMap.set(areaName, { name: areaName, data: new Map() });
            this.addToAreaList(areaName);
          }
          areaMap.get(areaName)!.data.set(dayLabel, item.YAxisValue);
        });

        const areas = Array.from(areaMap.keys());
        const newOptions = {
          title: {
            text: 'MONTHLY ELECTRICITY USAGE BY AREA',
            left: 'center',
            top: 10,
            textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
              let res = `<strong>Ngày: ${params[0].axisValue}</strong><br/>`;
              let total = 0;
              params.forEach((item: any) => {
                const val = Number(item.value) || 0;
                res += `${item.marker} ${item.seriesName}: ${val.toLocaleString()} kWh<br/>`;
                total += val;
              });
              res += `<strong>Tổng: ${total.toLocaleString()} kWh</strong>`;
              return res;
            },
          },
          legend: {
            show: true,
            bottom: 0,
            type: 'scroll',
            textStyle: { color: '#333' }
          },
          grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
          xAxis: {
            type: 'category',
            data: days,
            axisLabel: { color: '#333' },
          },
          yAxis: {
            type: 'value',
            name: 'kWh',
            axisLabel: {
              color: '#333',
              formatter: (value: number) => value.toLocaleString(),
            },
            nameTextStyle: {
              fontSize: 13,
              color: '#333'
            },
          },
          series: areas.map((area) => {
            const areaData = areaMap.get(area)!;
            return {
              name: area,
              type: 'bar',
              stack: 'total',
              data: days.map(d => areaData.data.get(d) || 0),
              itemStyle: { color: this.getAreaColor(area) },
              emphasis: { focus: 'series' },
            };
          }),
        };

        this.updateChartInstance(this.monthlyElectricUsageByAreaChartInstance, this.monthlyElectricUsageByAreaChart, newOptions);
        this.monthlyElectricUsageChartOption = newOptions;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error loading monthly electric usage by area:', error),
    });
  }
  //#endregion

  //#region Yearly Electric Usage By Area Methods
  public loadYearlyElectricUsageByArea() {
    if (!this.deviceId) return;
    this.dashboardService.getYearlyElectricUsageByArea(this.yearlyChartYear, 1, 1).subscribe({
      next: (result) => {
        const areaMap = new Map<string, { name: string; data: Map<string, number> }>();
        const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

        result.forEach((item) => {
          const areaName = item.AreaName || item.DeviceName || `Khu vực ${item.AreaId || 'Unknown'}`;
          const monthLabel = `T${item.XAxisValue.replace(/\D/g, '')}`;

          if (!areaMap.has(areaName)) {
            areaMap.set(areaName, { name: areaName, data: new Map() });
            this.addToAreaList(areaName);
          }
          areaMap.get(areaName)!.data.set(monthLabel, item.YAxisValue);
        });

        const areas = Array.from(areaMap.keys());
        const newOptions = {
          title: {
            text: 'YEARLY ELECTRICITY USAGE BY AREA',
            left: 'center',
            top: 10,
            textStyle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
              let res = `<strong>Tháng: ${params[0].axisValue}</strong><br/>`;
              let total = 0;
              params.forEach((item: any) => {
                const val = Number(item.value) || 0;
                res += `${item.marker} ${item.seriesName}: ${val.toLocaleString()} kWh<br/>`;
                total += val;
              });
              res += `<strong>Tổng: ${total.toLocaleString()} kWh</strong>`;
              return res;
            },
          },
          legend: {
            show: true,
            bottom: 0,
            type: 'scroll',
            textStyle: { color: '#333' }
          },
          grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
          xAxis: {
            type: 'category',
            data: months,
            axisLabel: { color: '#333' },
          },
          yAxis: {
            type: 'value',
            name: 'kWh',
            axisLabel: {
              color: '#333',
              formatter: (value: number) => value.toLocaleString(),
            },
            nameTextStyle: {
              fontSize: 13,
              color: '#333'
            },
          },
          series: areas.map((area) => {
            const areaData = areaMap.get(area)!;
            return {
              name: area,
              type: 'bar',
              stack: 'total',
              data: months.map(m => areaData.data.get(m) || 0),
              itemStyle: { color: this.getAreaColor(area) },
              emphasis: { focus: 'series' },
            };
          }),
        };

        this.updateChartInstance(this.yearlyElectricUsageByAreaChartInstance, this.yearlyElectricUsageByAreaChart, newOptions);
        this.yearlyElectricUsageChartOption = newOptions;
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error loading yearly electric usage by area:', error),
    });
  }
  //#endregion

  //#region Chart Instance Management
  private updateChartInstance(
    instance: echarts.ECharts | null,
    elementRef: ElementRef,
    options: any
  ) {
    if (instance && !instance.isDisposed()) {
      instance.setOption(options, {
        notMerge: true,
        lazyUpdate: true,
      });
    } else if (elementRef?.nativeElement) {
      instance = echarts.getInstanceByDom(elementRef.nativeElement) || null;
      if (!instance) {
        instance = echarts.init(elementRef.nativeElement);
      }
      instance.setOption(options);

      if (elementRef === this.activePowerChart) {
        this.activePowerChartInstance = instance;
      } else if (elementRef === this.energyConsumption) {
        this.energyConsumptionInstance = instance;
      } else if (elementRef === this.electricUsageChart) {
        this.electricUsageChartInstance = instance;
      } else if (elementRef === this.wasteOutputChart) {
        this.wasteOutputChartInstance = instance;
      } else if (elementRef === this.dailyElectricUsageByAreaChart) {
        this.dailyElectricUsageByAreaChartInstance = instance;
      } else if (elementRef === this.monthlyElectricUsageByAreaChart) {
        this.monthlyElectricUsageByAreaChartInstance = instance;
      } else if (elementRef === this.yearlyElectricUsageByAreaChart) {
        this.yearlyElectricUsageByAreaChartInstance = instance;
      }
    }
  }

  private cleanup() {
    this.clearRefreshIntervals();
    [
      this.activePowerChartInstance,
      this.energyConsumptionInstance,
      this.electricUsageChartInstance,
      this.wasteOutputChartInstance,
      this.dailyElectricUsageByAreaChartInstance,
      this.monthlyElectricUsageByAreaChartInstance,
      this.yearlyElectricUsageByAreaChartInstance,
    ].forEach((instance) => {
      if (instance && !instance.isDisposed()) {
        instance.dispose();
      }
    });

    this.activePowerChartInstance = null;
    this.energyConsumptionInstance = null;
    this.electricUsageChartInstance = null;
    this.wasteOutputChartInstance = null;
    this.dailyElectricUsageByAreaChartInstance = null;
    this.monthlyElectricUsageByAreaChartInstance = null;
    this.yearlyElectricUsageByAreaChartInstance = null;
  }
  //#endregion
}
