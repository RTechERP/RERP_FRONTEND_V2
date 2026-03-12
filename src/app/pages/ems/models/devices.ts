export class Devices {
  Id: number = 0;
  AreaId: number = 0;
  DeviceName: string = '';
  Description: string = '';
  IsActive: boolean | undefined | null;
  AreaName: string = '';

  constructor(init?: Partial<Devices>) {
    Object.assign(this, init);
  }
}
