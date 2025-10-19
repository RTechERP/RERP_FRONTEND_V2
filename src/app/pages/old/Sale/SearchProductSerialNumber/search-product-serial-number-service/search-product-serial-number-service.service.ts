import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class SearchProductSerialNumberServiceService {
  constructor(private http: HttpClient) {}
  getAll(keyword: string): Observable<any> {
    return this.http.get(
      HOST + `api/searchproductserialnumber?keyword=${keyword}`
    );
  }
}
