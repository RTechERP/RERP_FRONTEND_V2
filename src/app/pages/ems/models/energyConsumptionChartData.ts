export class EnergyConsumptionChartData {
  public DeviceName: string = '';
  public CongSuatTieuThu: string = '';
  constructor(init?: Partial<EnergyConsumptionChartData>) {
    Object.assign(this, init);
  }
}
