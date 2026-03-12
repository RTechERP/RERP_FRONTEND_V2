export class DeviceCommunicationParamConfig {
  Id: number = 0;
  DeviceParameterId: number = 0;
  CommunicationParamId: number = 0;
  ConfigValue: string = '';
  ParamKey: string = '';
  SortOrder: number = 0;

  constructor(init?: Partial<DeviceCommunicationParamConfig>) {
    Object.assign(this, init);
  }
}
