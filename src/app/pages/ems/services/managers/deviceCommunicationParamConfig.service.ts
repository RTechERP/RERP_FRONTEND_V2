import { Injectable } from '@angular/core';
import { DeviceCommunicationParamConfig } from '../../models/deviceCommunicationParamConfig';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceCommunicationParamConfigService extends BaseService {
  getAll() {
    return this.http.get<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config`
    );
  }
  getByDeviceParamId(deviceParamId: number) {
    return this.http.get<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config?device-param-id=${deviceParamId}`
    );
  }
  getById(Id: number) {
    return this.http.get<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config/${Id}`
    );
  }
  create(newDeviceCommunicationParamConfig: DeviceCommunicationParamConfig) {
    return this.http.post<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config`,
      newDeviceCommunicationParamConfig
    );
  }
  update(Id: number, updatedParam: DeviceCommunicationParamConfig) {
    return this.http.put<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config/${Id}`,
      updatedParam
    );
  }
  createOrUpdate(device: DeviceCommunicationParamConfig) {
    if (device.Id === 0) return this.create(device);
    else return this.update(device.Id, device);
  }
  deleteById(Id: number) {
    return this.http.delete<DeviceCommunicationParamConfig[]>(
      `${this.baseUrl}/device-communication-param-config/${Id}`
    );
  }
}
