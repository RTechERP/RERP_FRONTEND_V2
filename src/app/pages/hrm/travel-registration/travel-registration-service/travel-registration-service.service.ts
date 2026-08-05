import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  updatePublish(isPublish: boolean) {
    return this.http.get<any>(this._url + 'update-publish', {
      params: { isPublish: isPublish.toString() }
    });
  }

  getByEmployeeId(employeeId?: number) {
    const params: any = {};
    if (employeeId) {
      params.employeeId = employeeId.toString();
    }
    return this.http.get<any>(this._url + 'get-by-employee', { params });
  }

  importExcel(formData: FormData) {
    return this.http.post<any>(this._url + 'import-excel', formData);
  }

  downloadTemplate(fileName: string): Observable<Blob> {
    const url = `${environment.host}api/share/software/Template/ImportExcel/${fileName}`;
    return this.http.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        return response.body as Blob;
      })
    );
  }
}
