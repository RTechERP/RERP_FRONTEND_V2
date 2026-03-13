import { Injectable } from '@angular/core';
import { Areas } from '../../models/areas';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class AreasService extends BaseService {
  getAll() {
    return this.http.get<Areas[]>(`${this.baseUrl}/areas`);
  }
  getById(Id: number) {
    return this.http.get<Areas[]>(`${this.baseUrl}/areas/${Id}`);
  }
  create(newArea: Areas) {
    return this.http.post<Areas[]>(`${this.baseUrl}/areas`, newArea);
  }
  update(Id: number, updatedArea: Areas) {
    return this.http.put<Areas[]>(`${this.baseUrl}/areas/${Id}`, updatedArea);
  }
  createOrUpdate(area: Areas) {
    if (area.Id === 0) return this.create(area);
    else return this.update(area.Id, area);
  }
  deleteById(Id: number) {
    return this.http.delete<Areas[]>(`${this.baseUrl}/areas/${Id}`);
  }
}
