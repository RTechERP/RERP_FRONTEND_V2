import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class ProjectPartlistPurchaseRequestService {
  private apiUrl = `${HOST}/api/ProjectPartlistPurchaseRequest`;

  constructor(private http: HttpClient) {}

  getAllData(filters: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/getall`, filters);
  }

  getProjects(): Observable<any> {
    // Implement API call to get projects
    return this.http.get(`api/Project/get-all`);
  }

  getPOKH(): Observable<any> {
    // Implement API call to get POKH
    return this.http.get(`api/POKH/get-all`);
  }
}
