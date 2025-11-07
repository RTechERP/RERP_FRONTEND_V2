import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
 private apiUrl = environment.host + 'api/Currency/';
constructor(private http: HttpClient,) { }
  getAll(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-all', params);
  }
    // Currency: lưu (thêm/sửa)
  save(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data', payload);
  }
}
