import { Host, Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPurchaseRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${HOST}/api/ProjectPartlistPurchaseRequest`;
  constructor() {}
  getAPIUrl() {
    return this.baseUrl + '/getall';
  }

  getAllData(filters: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/getall`, filters);
  }

  getProjects(): Observable<any> {
    // Implement API call to get projects
    return this.http.get(`${HOST}api/Project/get-all`);
  }

  getPOKH(): Observable<any> {
    // Implement API call to get POKH
    return this.http.get(`{HOST}api/POKH/get-all`);
  }
}
