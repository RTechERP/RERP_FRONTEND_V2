import { DeviceCommunicationParamConfig } from './deviceCommunicationParamConfig';

export class DeviceParam {
  Id: number = 0;
  DeviceId: number = 0;
  CommunicationId: number | undefined;
  ParamName: string = '';
  Unit: string = '';
  PollingInterval: number | undefined | null = 5000;
  IsActive: boolean | undefined | null = true;
  CommunicationName: string = '';
  ConfigValues: DeviceCommunicationParamConfig[] = [];

  constructor(init?: Partial<DeviceParam>) {
    Object.assign(this, init);
  }
}
