import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { OrgChartData } from '../../models/orgChartData';
import { ActivePowerChartData } from '../../models/activePowerChartData';
import { EnergyConsumptionChartData } from '../../models/energyConsumptionChartData';
import { WasteOutputChartData } from '../../models/wasteOutputChartData';
import { ElectricUsageChartData } from '../../models/electricUsageChartData';
import { DetailCharts } from '../../models/detailCharts';
import { AreaElectricityUsage } from '../../models/areaElectricityUsage';

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends BaseService {
  getOrgChartData() {
    return this.http.get<OrgChartData[]>(`${this.baseUrl}/dashboard/org-chart`);
  }
  getActivePowerChartData() {
    return this.http.get<ActivePowerChartData[]>(
      `${this.baseUrl}/dashboard/active-power-chart`
    );
  }
  getEnergyConsumptionChartData() {
    return this.http.get<EnergyConsumptionChartData[]>(
      `${this.baseUrl}/dashboard/energy-consumption-chart`
    );
  }
  getElectricUsageChartData() {
    // return this.http.get<{
    //   Item1: ElectricUsageChartData[];
    //   Item2: ElectricUsageChartData[];
    // }>(`${this.baseUrl}/dashboard/electric-usage-chart`);

    return this.http.get<{
      Item1: ElectricUsageChartData[];
      Item2: ElectricUsageChartData[];
    }>(`${this.baseUrl}/dashboard/electric-usage-chart`);
  }
  getWasteOutputChartData() {
    return this.http.get<WasteOutputChartData[]>(
      `${this.baseUrl}/dashboard/waste-output-chart`
    );
  }
  getDetailsEnergyData(year: number, month: number, day: number, deviceId: number) {
    return this.http.get<DetailCharts[]>(
      `${this.baseUrl}/dashboard/details-energy?year=${year}&month=${month}&day=${day}&device-id=${deviceId}`
    );
  }
  getDetailsWasteOutputData(year: number, month: number, deviceId: number) {
    return this.http.get<DetailCharts[]>(
      `${this.baseUrl}/dashboard/details-waste-output?year=${year}&month=${month}&device-id=${deviceId}`
    );
  }

  getDailyElectricUsageByArea(year: number, month: number, day: number) {
    return this.http.get<AreaElectricityUsage[]>(
      // `${this.baseUrl}/dashboard/daily-electric-usage-by-area`
      `${this.baseUrl}/dashboard/energy-usage-by-area?year=${year}&month=${month}&day=${day}`
    );
  }

  getMonthlyElectricUsageByArea(year: number, month: number, day: number) {
    return this.http.get<AreaElectricityUsage[]>(
      // `${this.baseUrl}/dashboard/monthly-electric-usage-by-area`
      `${this.baseUrl}/dashboard/energy-usage-by-area?year=${year}&month=${month}&day=0`
    );
  }

  getYearlyElectricUsageByArea(year: number, month: number, day: number) {
    return this.http.get<AreaElectricityUsage[]>(
      // `${this.baseUrl}/dashboard/yearly-electric-usage-by-area`
      `${this.baseUrl}/dashboard/energy-usage-by-area?year=${year}&month=0&day=${day}`
    );
  }
}
