import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class SearchProductSerialNumberServiceService {
  constructor(private http: HttpClient) {}
  getAll(keyword: string): Observable<any> {
    return this.http.get(
      environment.host + `api/searchproductserialnumber?keyword=${keyword}`
    );
  }
}
