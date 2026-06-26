import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ConfigNotificationService {

  constructor(private http: HttpClient) { }
  private readonly apiUrl = `${environment.host}api/ConfigNotifycationKey`;

  getConfigNotification() {
    return this.http.get<any>(this.apiUrl);
  }

  saveConfigNotification(data: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data`, data);
  }

  deleteConfigNotification(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deleted`, ids);
  }

  getByEmployee(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-by-employee/${employeeId}`);
  }

  updateLinkStatus(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update-link-status`, payload);
  }

  checkNotification(code: string, employeeId: number): Observable<any> {
    const params = new HttpParams()
      .set('code', code)
      .set('employeeId', employeeId.toString());
    return this.http.get<any>(`${this.apiUrl}/check-notification`, { params });
  }
}
