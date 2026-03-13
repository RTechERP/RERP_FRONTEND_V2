import { Injectable } from '@angular/core';
import { Communication } from '../../models/communication';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService extends BaseService{
  getAll() {
    return this.http.get<Communication[]>(`${this.baseUrl}/communication`);
  }
  getById(Id: number) {
    return this.http.get<Communication[]>(`${this.baseUrl}/communication/${Id}`);
  }
  create(newCommunication: Communication) {
    return this.http.post<Communication>(`${this.baseUrl}/communication`, newCommunication);
  }
  update(Id: number, updatedCommunication: Communication) {
    return this.http.put<Communication>(`${this.baseUrl}/communication/${Id}`, updatedCommunication);
  }
  createOrUpdate(comm: Communication) {
    if (comm.Id === 0) return this.create(comm);
    else return this.update(comm.Id, comm);
  }
  deleteById(Id: number) {
    return this.http.delete<Communication[]>(`${this.baseUrl}/communication/${Id}`);
  }
}
