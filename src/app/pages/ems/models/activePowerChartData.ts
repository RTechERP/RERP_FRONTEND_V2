export class ActivePowerChartData {
  public DeviceName: string = '';
  public SumCongSuat: string = '';
  constructor(init?: Partial<ActivePowerChartData>) {
    Object.assign(this, init);
  }
}
