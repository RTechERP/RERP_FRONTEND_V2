export class OrgChartData {
  public DeviceId: number = 0;
  public DeviceName: string = '';
  public CongSuatTieuThu: string = '';
  constructor(init?: Partial<OrgChartData>) {
    Object.assign(this, init);
  }
}
