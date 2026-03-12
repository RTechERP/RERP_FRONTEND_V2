export class WasteOutputChartData {
  public Month: string = '';
  public AvgValue: string = '';
  constructor(init?: Partial<WasteOutputChartData>) {
    Object.assign(this, init);
  }
}
