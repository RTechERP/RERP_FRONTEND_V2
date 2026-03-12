import { Injectable } from '@angular/core';
import { CommunicationParam } from '../../models/communicationParam';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class CommunicationParamService extends BaseService {
  getAll() {
    return this.http.get<CommunicationParam[]>(
      `${this.baseUrl}/communication-params`
    );
  }
  getByCommunicationId(commId: number) {
    return this.http.get<CommunicationParam[]>(
      `${this.baseUrl}/communication-params?communication-id=${commId}`
    );
  }
  getById(Id: number) {
    return this.http.get<CommunicationParam[]>(
      `${this.baseUrl}/communication-params/${Id}`
    );
  }
  create(newCommunicationParam: CommunicationParam) {
    return this.http.post<CommunicationParam[]>(
      `${this.baseUrl}/communication-params`,
      newCommunicationParam
    );
  }
  update(Id: number, updatedCommunicationParam: CommunicationParam) {
    return this.http.put<CommunicationParam[]>(
      `${this.baseUrl}/communication-params/${Id}`,
      updatedCommunicationParam
    );
  }
  createOrUpdate(comm: CommunicationParam) {
    if (comm.Id === 0) return this.create(comm);
    else return this.update(comm.Id, comm);
  }
  deleteById(Id: number) {
    return this.http.delete<CommunicationParam[]>(
      `${this.baseUrl}/communication-params/${Id}`
    );
  }
}
