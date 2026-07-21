import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TravelRegistrationServiceService {

  private _url = environment.host + 'api/travelregistration/';
  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<any>(this._url + 'get-all');
  }
  getById(id: number) {
    return this.http.get<any>(this._url + 'get-by-id', {
      params: { id: id.toString() }
    });
  }
  saveData(model: any) {
    return this.http.post<any>(this._url + 'save-data', model);
  }
  delete(id: number) {
    return this.http.get<any>(this._url + 'delete-by-id', {
      params: { id: id.toString() }
    });
  }
  confirm(employeeId: number, confirmStatus: number) {
    return this.http.get<any>(this._url + 'confirm-travel-registration', {
      params: { employeeId: employeeId.toString(), confirmStatus: confirmStatus.toString() }
    });
  }
  getByEmployeeId(employeeId: number) {
    return this.http.get<any>(this._url + 'get-by-employee', {
      params: { employeeId: employeeId.toString() }
    });
  }

  importExcel(formData: FormData) {
    return this.http.post<any>(this._url + 'import-excel', formData);
  }
}
