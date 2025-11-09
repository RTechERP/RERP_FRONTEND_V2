import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirmService {
  private apiUrl = `${environment.host}api/Firm`;

  constructor(private http: HttpClient) { }

  getFirms(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  saveFirm(firmData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, firmData);
  }

deleteFirm(ids: number[]): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/delete-multiple`, ids);
}


  getFirmById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  checkFirmCodeExists(firmCode: string, id?: number): Observable<any> {
    let params = new HttpParams().set('firmCode', firmCode);
    if (id) {
      params = params.set('id', id.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/check-code`, { params });
  }
}