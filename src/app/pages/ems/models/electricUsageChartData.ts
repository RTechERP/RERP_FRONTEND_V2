export class ElectricUsageChartData {
  public DayDate: number = 0;
  public YearValue: number = 0;
  public MonthValue: number = 0;
  public DayValue: number = 0;
  public LogValue: number = 0;
  constructor(init?: Partial<ElectricUsageChartData>) {
    Object.assign(this, init);
  }
}
