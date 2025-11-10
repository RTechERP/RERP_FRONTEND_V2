import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class WorkItemServiceService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) { }
  getWorkItems(projectId: number): Observable<any> {
    return this.http.get<any>(this._url + `WorkItem/get-all/${projectId}`);
  }
  getWorkItemById(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'WorkItem/get-by-id?id=' + id);
  }
  createWorkItem(workItem: any): Observable<any> {
    return this.http.post<any>(this._url + 'WorkItem/create', workItem);
  }
  updateWorkItem(workItem: any): Observable<any> {
    return this.http.put<any>(this._url + 'WorkItem/update', workItem);
  }
}
