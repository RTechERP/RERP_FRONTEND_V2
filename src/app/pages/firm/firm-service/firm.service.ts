import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirmService {
  private apiUrl = `${environment.apiUrl}/Firm`;

  constructor(private http: HttpClient) { }

  getFirms(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  saveFirm(firmData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, firmData);
  }

  deleteFirm(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getFirmById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  checkFirmCodeExists(firmCode: string, id?: number): Observable<any> {
    const params: any = { firmCode };
    if (id) {
      params.id = id.toString();
    }
    return this.http.get<any>(`${this.apiUrl}/check-code`, { params });
  }
}