import { Injectable } from '@angular/core';
import { Devices } from '../../models/devices';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class DevicesService extends BaseService{
  getAll() {
    return this.http.get<Devices[]>(`${this.baseUrl}/devices`);
  }
  getByAreaId(areaId: number) {
    return this.http.get<Devices[]>(`${this.baseUrl}/devices?area-id=${areaId}`);
  }
  getById(Id: number) {
    return this.http.get<Devices[]>(`${this.baseUrl}/devices/${Id}`);
  }
  create(newDevice: Devices) {
    return this.http.post<Devices[]>(`${this.baseUrl}/devices`, newDevice);
  }
  update(Id: number, updatedDevice: Devices) {
    return this.http.put<Devices[]>(
      `${this.baseUrl}/devices/${Id}`,
      updatedDevice
    );
  }
  createOrUpdate(device: Devices) {
    if (device.Id === 0) return this.create(device);
    else return this.update(device.Id, device);
  }
  deleteById(Id: number) {
    return this.http.delete<Devices[]>(`${this.baseUrl}/devices/${Id}`);
  }
}
