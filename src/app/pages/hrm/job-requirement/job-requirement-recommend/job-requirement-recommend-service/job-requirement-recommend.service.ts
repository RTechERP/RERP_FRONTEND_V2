import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobRequirementRecommendService {
  private apiUrl = environment.host + 'api/JobRequirementRecommend';

  constructor(private http: HttpClient) { }

  getAll(param: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-all`, param);
  }

  getByID(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-by-id/${id}`);
  }

  initRecommend(jobRequirementID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/init-recommend/${jobRequirementID}`);
  }

  getJobRequirementDetail(id: number): Observable<any> {
    return this.http.get(`${environment.host}api/jobrequirement/details/${id}`);
  }

  getHistoricalSuppliers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-historical-suppliers`);
  }

  saveData(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, data);
  }

  exportExcel(param: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export-excel`, param, { responseType: 'blob' });
  }

  approveDetail(id: number, status: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-detail?id=${id}&status=${status}${reason ? `&reason=${reason}` : ''}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete?id=${id}`, {});
  }
}
