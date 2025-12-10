import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class DailyReportSaleAdminService {
  private _url = environment.host + 'api/DailyReportSaleAdmin/';
  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-user');
  }

  getCustomers(): Observable<any> {
    return this.http.get(this._url + 'get-customers');
  }

  loadData(
    dateStart: Date,
    dateEnd: Date,
    customerId: number,
    userId: number,
    keyword: string
  ): Observable<any> {
    // Format date theo local time để tránh lệch timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    return this.http.get(this._url + 'load-data', {
      params: {
        dateStart: formatLocalDate(dateStart),
        dateEnd: formatLocalDate(dateEnd),
        customerId: customerId.toString(),
        userId: userId.toString(),
        keyword: keyword.toString(),
      },
    });
  }

  getDetail(id: number): Observable<any> {
    return this.http.get(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }

  getReportTypes(): Observable<any> {
    return this.http.get(this._url + 'get-reporttypes');
  }

  getProjects(): Observable<any> {
    return this.http.get(this._url + 'get-projects');
  }

  saveData(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', payload);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(this._url + 'delete', null, {
      params: {
        id: id.toString(),
      },
    });
  }
}
