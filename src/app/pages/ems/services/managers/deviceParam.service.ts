import { Injectable } from '@angular/core';
import { DeviceParam } from '../../models/deviceParam';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceParamService extends BaseService{
  getAll() {
    return this.http.get<DeviceParam[]>(`${this.baseUrl}/device-parameters`);
  }
  getByDeviceId(deviceId: number) {
    return this.http.get<DeviceParam[]>(`${this.baseUrl}/device-parameters?device-id=${deviceId}`);
  }
  getById(Id: number) {
    return this.http.get<DeviceParam[]>(`${this.baseUrl}/device-parameters/${Id}`);
  }
  create(newDeviceParam: DeviceParam) {
    return this.http.post<DeviceParam>(`${this.baseUrl}/device-parameters`, newDeviceParam);
  }
  update(Id: number, updatedParam: DeviceParam) {
    return this.http.put<DeviceParam>(
      `${this.baseUrl}/device-parameters/${Id}`,
      updatedParam
    );
  }
  createOrUpdate(device: DeviceParam) {
    if (device.Id === 0) return this.create(device);
    else return this.update(device.Id, device);
  }
  deleteById(Id: number) {
    return this.http.delete<DeviceParam[]>(`${this.baseUrl}/device-parameters/${Id}`);
  }
}
