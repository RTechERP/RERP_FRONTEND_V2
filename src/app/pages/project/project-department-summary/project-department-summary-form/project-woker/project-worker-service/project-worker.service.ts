import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProjectWorkerService {
  private _url = environment.host + 'api/';
  private _urlProjectWorker = this._url + 'projectworker/';
  constructor(private http: HttpClient) { }
  //load giải pháp
  getSolution(projectId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-solution/${projectId}`);
  }
  //load phiên bản giải pháp
  getSolutionVersion(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-solution-version/${projectSolutionId}`);
  }
  //load phiên bản PO
  getPOVersion(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-version-po/${projectSolutionId}`);
  }
  //load nội dung công việc
  getProjectWorker(): Observable<any> {
    return this.http.get<any>(this._url + 'ProjectWorker');
  }
  //load loại dự án 
  getProjectType(): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + 'get-project-type');
  }
}
