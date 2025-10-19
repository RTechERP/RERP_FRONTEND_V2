import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HandoverMinutesService {
  private _url = HOST + 'api/HandoverMinutes/';
  constructor(private http: HttpClient) {}

  getHandoverMinutes(
    dateStart: Date,
    dateEnd: Date,
    filterText: string
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        filterText: filterText,
      },
    });
  }
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }
  export(id: number): Observable<Blob> {
    return this.http.get(`${this._url}export-excel/${id}`, {
      responseType: 'blob',
    });
  }
}
