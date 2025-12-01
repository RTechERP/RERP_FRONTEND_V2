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
  // người giao việc 
  cbbEmployeeRequest(): Observable<any> {
    return this.http.get<any>(this._url + 'WorkItem/get-employee-request');
  }
  //loai du an
  cbbTypeProject(): Observable<any> {
    return this.http.get<any>(this._url + 'WorkItem/get-type-project-item');
  }
  //người phụ trách
  cbbUser(): Observable<any> {
    return this.http.get<any>(this._url + 'WorkItem/get-user');
  }
  //lưu projectitem
  saveData(payload:any): Observable<any> {
    return this.http.post<any>(this._url + 'ProjectItem/save-tree', payload);
  }
  //lay du lieu file projectitem
  getProjectItemFile(projectItemId: number): Observable<any> {
    return this.http.get<any>(this._url + 'ProjectItem/get-project-item-file?projectItem=' + projectItemId);
  }
  //lưu file projectitem
  saveProjectItemFile(payload:any): Observable<any> {
    return this.http.post<any>(this._url + 'ProjectItem/save-file', payload);
  }
  //upload file
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'Projects');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }
  //lấy danh sách vấn đề của project item
  getProjectItemProblem(projectItemId: number): Observable<any> {
    return this.http.get<any>(this._url + 'ProjectItem/get-project-item-problem?projectItem=' + projectItemId);
  }
  //lưu vấn đề của project item
  saveProjectItemProblem(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'ProjectItem/save-problem', payload);
  }

}
