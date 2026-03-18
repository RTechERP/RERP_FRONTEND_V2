import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportAccountingService {
  private _url = environment.host + 'api/DailyReportAccounting/';

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-employees');
  }

  getEmployeesByTeamSale(): Observable<any> {
    return this.http.get(this._url + 'get-employees-by-team-sale');
  }

  getDailyReportAccounting(
    page: number,
    size: number,
    employeeId: number | null,
    dateStart: Date,
    dateEnd: Date,
    filterText: string = ''
  ): Observable<any> {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('dateStart', formatLocalDate(dateStart))
      .set('dateEnd', formatLocalDate(dateEnd))
      .set('filterText', filterText || '');

    if (employeeId && employeeId > 0) {
      params = params.set('employeeId', employeeId.toString());
    }

    return this.http.get(this._url + 'get-data', { params });
  }

  save(data: any[]): Observable<any> {
    return this.http.post(this._url + 'save-data', data);
  }

  getById(id: number): Observable<any> {
    return this.http.get(this._url + 'get-by-id', {
      params: {
        id: id.toString(),
      },
    });
  }

  delete(id: number): Observable<any> {
    return this.http.post(this._url + 'delete', null, {
      params: {
        id: id.toString()
      }
    });
  }
}
