import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectJoinSummaryService {

  private url = `${environment.host}api/projectjoinsummary/`;
  constructor(private http: HttpClient) { }
  getProjectJoinSummary(request: any) {
    return this.http.get<any>(`${this.url}get-project-join-summary`, {
      params: request,
    });
  }

  getProjectJoined(request: any) {
    return this.http.get<any>(`${this.url}get-project-joined`, {
      params: request,
    });
  }
  getEmployees(request: any) {
    return this.http.get<any>(`${this.url}get-employees`, {
      params: request,
    });
  }
}
